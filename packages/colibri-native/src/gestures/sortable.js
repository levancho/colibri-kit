// Sortable for the gestures entry: a list reordered by dragging, with every row positioned on the UI thread.
//
// How the rows are laid out. The first render is an ordinary column, so the list has its natural height at once.
// When every row has been measured the rows become absolutely positioned at the place they already had ("base", a
// number that never changes for a row) and from then on a row is moved only by a transform: translateY = its
// current slot - base. The slots live in a shared value, so a drag, a drop and the reorder of the React children
// that follows can never disagree for a frame: React changing the order of the children moves nothing.
import { createElement as h, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, View } from "react-native";
import Animated, { cancelAnimation, measure, scrollTo, useAnimatedReaction, useAnimatedStyle, useFrameCallback, useScrollOffset, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import { useTheme } from "../provider.js";
import { web, depth, flat } from "../internal.js";
import { Text } from "../components.js";
import { SPRING, clamp, keyOf, useLatest, useStable } from "./shared.js";

const announce = (message) => { try { AccessibilityInfo.announceForAccessibility?.(message); } catch { /* not available on this platform */ } };
const reorder = (list, from, to) => { const next = list.slice(), [moved] = next.splice(from, 1); next.splice(to, 0, moved); return next; };
/** Where each key sits when the rows are stacked in this order: { tops: { key: y }, total }. */
const stack = (keys, sizes, gap) => {
  "worklet";
  const tops = {};
  let y = 0;
  for (let i = 0; i < keys.length; i++) { tops[keys[i]] = y; y += (sizes[keys[i]] ?? 0) + gap; }
  return { tops, total: Math.max(0, y - gap) };
};
const Grip = ({ color }) => h(View, { style: { flexDirection: "row", gap: 3 } }, [0, 1].map((column) => h(View, { key: column, style: { gap: 3 } }, [0, 1, 2].map((dot) => h(View, { key: dot, style: { width: 4, height: 4, borderRadius: 2, backgroundColor: color } })))));
const EDGE = 72, SCROLL_SPEED = 14; // auto-scroll: how close to the edge it starts, and the most it moves per frame

const SortableRow = memo(function SortableRow({ itemKey, label, index, count, base, ready, dragging, disabled, handle, dragOn, drag, control, onLayout, children }) {
  const theme = useTheme(), c = theme.colors, grip = useRef(null);
  const { active, dragTop, lifted, tops, animate } = drag;
  // shift is how far the row is from its base. It follows the row's slot, except while the row is in the hand.
  const shift = useSharedValue(0);
  useAnimatedReaction(() => {
    if (base == null || active.value === itemKey) return null;
    const top = tops.value[itemKey];
    return top === undefined ? null : top - base;
  }, (now, before) => {
    "worklet";
    if (now === null || now === before) return;
    shift.value = animate.value && typeof before === "number" ? withTiming(now, { duration: 200 }) : now;
  }, [tops, active, animate, shift, itemKey, base]);
  const moved = useAnimatedStyle(() => {
    const mine = active.value === itemKey;
    return { zIndex: mine ? 2 : 0, transform: [{ translateY: base == null ? 0 : mine ? dragTop.value - base : shift.value }, { scale: mine ? 1 + 0.02 * lifted.value : 1 }] };
  }, [active, dragTop, lifted, shift, itemKey, base]);

  const byGrip = usePanGesture(useMemo(() => ({
    minDistance: 1, enabled: !disabled && dragOn !== "longPress",
    onActivate: (event) => { "worklet"; drag.lift(itemKey, event); },
    onUpdate: (event) => { "worklet"; drag.move(itemKey, event); },
    onDeactivate: (event) => { "worklet"; drag.drop(itemKey, event); },
  }), [drag, itemKey, disabled, dragOn]));
  const byHold = usePanGesture(useMemo(() => ({
    activateAfterLongPress: 350, enabled: !disabled && dragOn !== "handle",
    onActivate: (event) => { "worklet"; drag.lift(itemKey, event); },
    onUpdate: (event) => { "worklet"; drag.move(itemKey, event); },
    onDeactivate: (event) => { "worklet"; drag.drop(itemKey, event); },
  }), [drag, itemKey, disabled, dragOn]));

  useEffect(() => { control.grips.set(itemKey, grip); return () => { control.grips.delete(itemKey); }; }, [control, itemKey]);
  const actions = useMemo(() => [index > 0 ? { name: "moveUp", label: "Move up" } : null, index < count - 1 ? { name: "moveDown", label: "Move down" } : null].filter(Boolean), [index, count]);
  const onKey = (event) => {
    const by = { ArrowUp: -1, ArrowDown: 1, Home: -count, End: count }[keyOf(event)];
    if (!by) return;
    event.preventDefault?.(); control.step(itemKey, by);
  };
  const start = handle === "start";
  const gripView = h(GestureDetector, { key: "grip", gesture: byGrip, touchAction: "none", userSelect: "none" },
    h(View, { ref: grip, accessible: true, accessibilityRole: "button", accessibilityLabel: `Reorder ${label}, ${index + 1} of ${count}`,
      accessibilityHint: "Drag, or use the move up and move down actions", accessibilityState: { disabled, selected: dragging }, "aria-disabled": disabled, "aria-roledescription": "sortable item",
      accessibilityActions: actions, onAccessibilityAction: (event) => control.step(itemKey, event.nativeEvent.actionName === "moveUp" ? -1 : 1),
      ...(web ? { tabIndex: disabled ? -1 : 0, onKeyDown: onKey } : null),
      style: flat({ width: theme.touch, minHeight: theme.touch, alignSelf: "stretch", alignItems: "center", justifyContent: "center", opacity: disabled ? 0.35 : 1 }, web && { cursor: disabled ? "auto" : dragging ? "grabbing" : "grab" }) },
      h(Grip, { color: dragging ? c.accent : c.muted })));
  // Before the list is measured the row is part of the column. A row added later waits, invisible, until it has been measured.
  const place = base != null ? { position: "absolute", top: base, left: 0, right: 0 } : ready ? { position: "absolute", top: 0, left: 0, right: 0, opacity: 0 } : null;
  return h(GestureDetector, { gesture: byHold, touchAction: "pan-y", userSelect: "none" },
    h(Animated.View, { onLayout, style: [{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: dragging ? c.accent : c.line, borderRadius: theme.radius.m, backgroundColor: c.surface }, dragging ? depth(theme.shadow.m) : null, place, moved] },
      start ? gripView : null,
      h(View, { key: "body", style: { flex: 1, paddingVertical: theme.space.xs, paddingLeft: start ? 0 : theme.space.s, paddingRight: start ? theme.space.s : 0 } }, children),
      start ? null : gripView));
});

/**
 * A list the user reorders by dragging; the dragged row follows the finger and its neighbours slide out of the way
 * on the UI thread. Same props as the core Sortable: value is the ordered array and onChange receives the new one;
 * items are strings or objects; keyExtractor defaults to item.id ?? item.value ?? the item itself, getLabel names an
 * item for assistive technology, renderItem({ item, index, dragging }) draws the row, handle is "end" or "start".
 * With a screen reader the grip offers "Move up" and "Move down"; on the web it also takes the arrow keys, Home
 * and End. A change of value from outside (or one of those steps) glides the rows to their new places.
 * Extras:
 *  - dragOn: "both" (default: drag the grip, or press and hold anywhere on the row), "handle" or "longPress".
 *  - scrollRef: the animated ref (useAnimatedRef) of the Animated.ScrollView the list is inside. With it the list
 *    scrolls by itself while a row is held near the top or bottom edge of that scroll view.
 *  - onDragStart(item), onDragEnd(item, { from, to }): once each per drag, for haptics or pausing other work.
 * React state changes when a row is picked up and when it is dropped, never while it moves. The list is not
 * virtualized: it suits tens of rows, not feeds.
 */
export function Sortable({ value, defaultValue, onChange, renderItem, keyExtractor, getLabel, handle = "end", disabled = false, gap = "xs", label, dragOn = "both", scrollRef = null, onDragStart, onDragEnd, style, testID }) {
  const theme = useTheme(), space = theme.space[gap] ?? gap;
  const [inner, setInner] = useState(defaultValue ?? []), controlled = value !== undefined, current = controlled ? value : inner, items = Array.isArray(current) ? current : [];
  const keyFor = keyExtractor ?? ((item) => String(item?.id ?? item?.value ?? item)), nameOf = getLabel ?? ((item) => String(item?.label ?? item?.title ?? item?.name ?? item?.id ?? item));
  const keys = items.map(keyFor), joined = keys.join("\u0001");
  const [version, setVersion] = useState(0), [tick, setTick] = useState(0), [dragging, setDragging] = useState(null);
  const measured = useRef({}).current, bases = useRef({}).current, wasReady = useRef(false), refocus = useRef(null), from = useRef(-1);
  const live = useLatest({ items, keys, controlled, onChange, onDragStart, onDragEnd, disabled, nameOf });

  // Layout in JavaScript: needed for the container height and for each row's base.
  const known = keys.filter((key) => measured[key] != null);
  if (keys.length > 0 && known.length === keys.length) wasReady.current = true;
  const ready = wasReady.current;
  const layout = useMemo(() => stack(known, measured, space), [joined, version, space]); // eslint-disable-line react-hooks/exhaustive-deps
  if (ready) for (const key of known) if (bases[key] == null) bases[key] = layout.tops[key];

  // The same layout on the UI thread, where a drag rearranges it.
  const tops = useSharedValue({}), order = useSharedValue([]), sizes = useSharedValue({}), total = useSharedValue(0), spacing = useSharedValue(space), animate = useSharedValue(false);
  const active = useSharedValue(""), held = useSharedValue(false), dragTop = useSharedValue(0), lifted = useSharedValue(0);
  const startTop = useSharedValue(0), startOrder = useSharedValue([]), startTops = useSharedValue({}), target = useSharedValue(-1), travel = useSharedValue(0), fingerY = useSharedValue(0), startScroll = useSharedValue(0);
  const scrollOffset = useScrollOffset(scrollRef);
  useEffect(() => {
    for (const key of Object.keys(measured)) if (!keys.includes(key)) { delete measured[key]; delete bases[key]; }
    animate.value = ready; spacing.value = space; sizes.value = { ...measured }; total.value = layout.total; order.value = known; tops.value = layout.tops;
  }, [layout, tick, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (next) => { if (!live.current.controlled) setInner(next); live.current.onChange?.(next); };
  const moved = (item, to, count) => announce(`${live.current.nameOf(item)}, moved to position ${to + 1} of ${count}`);
  const picked = useStable((key) => {
    const now = live.current;
    from.current = now.keys.indexOf(key); setDragging(key); auto.setActive(!!scrollRef);
    if (from.current >= 0) now.onDragStart?.(now.items[from.current]);
  });
  const dropped = useStable((key, nextKeys) => {
    const now = live.current, byKey = new Map(now.keys.map((each, index) => [each, now.items[index]]));
    auto.setActive(false); setDragging(null);
    // The order the rows ended in, as items. Keys that came or went during the drag keep their place at the end.
    const next = nextKeys.filter((each) => byKey.has(each)).map((each) => byKey.get(each));
    for (const each of now.keys) if (!nextKeys.includes(each)) next.push(byKey.get(each));
    const to = nextKeys.indexOf(key), item = byKey.get(key);
    if (next.some((each, index) => each !== now.items[index])) { set(next); if (item !== undefined) moved(item, to, next.length); }
    if (item !== undefined) now.onDragEnd?.(item, { from: from.current, to });
    setTick((n) => n + 1); // lays the rows out again from the value: a parent that refused the change gets its order back
  });

  const drag = useMemo(() => {
    // Puts the held row under the finger and works out which slot it is over.
    const place = () => {
      "worklet";
      const key = active.value;
      if (key === "" || !held.value) return;
      const own = sizes.value[key] ?? 0, scrolled = scrollRef ? scrollOffset.value - startScroll.value : 0;
      const at = clamp(startTop.value + travel.value + scrolled, 0, Math.max(0, total.value - own));
      dragTop.value = at;
      const list = startOrder.value, boxes = startTops.value, was = list.indexOf(key);
      let to = was;
      // A neighbour gives way when the leading edge of the held row passes its middle.
      if (at > boxes[key]) { for (let i = was + 1; i < list.length; i++) { if (at + own > boxes[list[i]] + (sizes.value[list[i]] ?? 0) / 2) to = i; else break; } }
      else { for (let i = was - 1; i >= 0; i--) { if (at < boxes[list[i]] + (sizes.value[list[i]] ?? 0) / 2) to = i; else break; } }
      if (to === target.value) return;
      target.value = to;
      const next = list.slice();
      next.splice(was, 1); next.splice(to, 0, key);
      animate.value = true; order.value = next; tops.value = stack(next, sizes.value, spacing.value).tops;
    };
    return {
      active, dragTop, lifted, tops, animate, place,
      lift: (key, event) => {
        "worklet";
        if (active.value !== "" || tops.value[key] === undefined) return; // another row is in the hand, or still settling
        active.value = key; held.value = true;
        startOrder.value = order.value; startTops.value = tops.value; target.value = order.value.indexOf(key);
        startTop.value = tops.value[key]; dragTop.value = tops.value[key]; travel.value = 0; fingerY.value = event.absoluteY;
        startScroll.value = scrollRef ? scrollOffset.value : 0;
        lifted.value = withTiming(1, { duration: 120 });
        scheduleOnRN(picked, key);
      },
      move: (key, event) => {
        "worklet";
        if (active.value !== key || !held.value) return;
        travel.value = event.translationY; fingerY.value = event.absoluteY;
        place();
      },
      drop: (key, event) => {
        "worklet";
        if (active.value !== key || !held.value) return;
        held.value = false;
        lifted.value = withTiming(0, { duration: 160 });
        dragTop.value = withSpring(tops.value[key], { stiffness: SPRING.stiffness, damping: SPRING.damping, mass: SPRING.mass, velocity: event.velocityY, overshootClamping: true }, () => {
          "worklet";
          active.value = "";
          scheduleOnRN(dropped, key, order.value);
        });
      },
    };
  }, [active, held, dragTop, lifted, tops, order, sizes, total, spacing, animate, startTop, startOrder, startTops, target, travel, fingerY, startScroll, scrollOffset, scrollRef, picked, dropped]);

  // While a row is held near the top or bottom edge of the scroll view around the list, scroll it.
  const auto = useFrameCallback(useCallback(() => {
    "worklet";
    if (!held.value || !scrollRef) return;
    const box = measure(scrollRef);
    if (!box) return;
    const y = fingerY.value, low = box.pageY + EDGE, high = box.pageY + box.height - EDGE;
    const speed = y < low ? (y - low) / EDGE : y > high ? (y - high) / EDGE : 0;
    if (speed === 0) return;
    scrollTo(scrollRef, 0, Math.max(0, scrollOffset.value + clamp(speed, -1, 1) * SCROLL_SPEED), false);
    drag.place();
  }, [held, fingerY, scrollOffset, scrollRef, drag]), false);
  // A list that goes away, or is disabled, with a row in the hand lets go of it.
  useEffect(() => { if (disabled && dragging != null) { cancelAnimation(dragTop); held.value = false; active.value = ""; lifted.value = 0; setDragging(null); auto.setActive(false); setTick((n) => n + 1); } }, [disabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const control = useRef({ grips: new Map() }).current;
  control.step = (key, by) => {
    const now = live.current, was = now.keys.indexOf(key), to = clamp(was + by, 0, now.keys.length - 1);
    if (now.disabled || was < 0 || to === was) return;
    refocus.current = key; set(reorder(now.items, was, to)); moved(now.items[was], to, now.items.length);
  };
  // Moving a row with the keyboard reorders the DOM; keep the focus on the grip that was used.
  useEffect(() => { if (!refocus.current) return; control.grips.get(refocus.current)?.current?.focus?.(); refocus.current = null; });
  const layouts = useRef(new Map()).current;
  const onLayoutOf = (key) => {
    if (!layouts.has(key)) layouts.set(key, (event) => { const size = event.nativeEvent.layout.height; if (measured[key] !== size) { measured[key] = size; setVersion((n) => n + 1); } });
    return layouts.get(key);
  };

  return h(View, { testID, accessibilityRole: "list", accessibilityLabel: label, style: flat(ready ? { height: layout.total } : { gap: space }, style) }, items.map((item, index) => {
    const key = keys[index], isDragging = dragging === key;
    return h(SortableRow, { key, itemKey: key, label: nameOf(item), index, count: items.length, base: ready ? bases[key] : undefined, ready, dragging: isDragging, disabled, handle, dragOn, drag, control, onLayout: onLayoutOf(key) },
      renderItem ? renderItem({ item, index, dragging: isDragging }) : h(Text, { weight: "medium", numberOfLines: 1 }, nameOf(item)));
  }));
}

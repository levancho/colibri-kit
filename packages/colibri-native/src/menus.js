// Things that open above the screen next to (or instead of) what was pressed: AlertDialog, Drawer, Popover,
// DropdownMenu, ContextMenu and Tooltip. Built on React Native's own Modal, Animated and PanResponder.
//
// Anchored overlays measure their trigger with measureInWindow and are drawn in a transparent Modal, so they are
// never clipped by a ScrollView or a Card. The Android back button (and Esc on the web) closes every one of them;
// react-native-web's Modal returns keyboard focus to the trigger, and on phones the trigger gets screen-reader focus back.
import { cloneElement, createElement as h, Fragment, isValidElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Modal, PanResponder, Platform, Pressable, ScrollView, StatusBar, View, useWindowDimensions } from "react-native";
import { useTheme } from "./provider.js";
import { web, depth, flat, InRow, selfAlign, GLYPH } from "./internal.js";
import { Text, Heading, Button } from "./components.js";
import { Dialog, Sheet } from "./overlays.js";

// ---------------------------------------------------------------- shared
const FILL = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 };
const OPPOSITE = { top: "bottom", bottom: "top", left: "right", right: "left" };
const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));
const within = (rect, x, y, pad = 0) => !!rect && x >= rect.x - pad && x <= rect.x + rect.width + pad && y >= rect.y - pad && y <= rect.y + rect.height + pad;
const both = (first, second) => (first && second ? (...args) => { first(...args); second(...args); } : first ?? second);
// iOS cannot present one Modal while another is still going away, so what follows a close (an item's handler that
// opens a dialog, say) waits for the dismissal there. Everywhere else it runs at once.
const afterClose = (run, wait) => (Platform.OS === "ios" ? setTimeout(run, wait) : run());

/** open + onOpenChange when controlled, defaultOpen when not. */
function useOpen(open, defaultOpen, onOpenChange) {
  const [own, setOwn] = useState(!!defaultOpen), controlled = open !== undefined, latest = useRef(onOpenChange);
  latest.current = onOpenChange;
  const set = useCallback((next) => { if (!controlled) setOwn(next); latest.current?.(next); }, [controlled]);
  return [controlled ? !!open : own, set];
}

/** Where the trigger is on screen, measured whenever the overlay opens or the window changes. */
function useAnchor(active) {
  const ref = useRef(null), [rect, setRect] = useState(null), win = useWindowDimensions(), wasActive = useRef(false);
  useEffect(() => {
    if (active) ref.current?.measureInWindow?.((x, y, width, height) => setRect({ x, y, width, height }));
    else {
      setRect(null);
      // Hand screen-reader focus back to the trigger on phones (the web Modal restores keyboard focus itself).
      if (wasActive.current && !web && ref.current) { try { AccessibilityInfo.sendAccessibilityEvent?.(ref.current, "focus"); } catch {} }
    }
    wasActive.current = active;
  }, [active, win.width, win.height]);
  return { ref, rect };
}

/** Opening by pointer hover (web, or a mouse on a tablet): waits `delay`, and remembers that hover was the cause. */
function useHover(isOpen, setOpen, delay) {
  const timer = useRef(null), [hovering, setHovering] = useState(false);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { if (!isOpen) setHovering(false); }, [isOpen]);
  return {
    hovering,
    cancel: () => clearTimeout(timer.current),
    enter: () => { clearTimeout(timer.current); if (!isOpen) timer.current = setTimeout(() => { setHovering(true); setOpen(true); }, delay); },
    leave: () => clearTimeout(timer.current),
  };
}

/** Wraps the trigger element in a measurable box and adds the press handlers and the expanded state to it. */
function Trigger({ anchor, element, open, popup, onPress, onLongPress, hover, hint, style }) {
  const inRow = useContext(InRow);
  let child = element;
  if (isValidElement(element)) {
    const own = element.props, extra = {};
    if (onPress) extra.onPress = onPress;
    if (onLongPress) extra.onLongPress = both(own.onLongPress, onLongPress);
    if (popup) Object.assign(extra, { accessibilityState: { ...own.accessibilityState, disabled: !!own.disabled, expanded: open }, "aria-expanded": open, "aria-haspopup": popup });
    if (hint && !web && !own.accessibilityHint) extra.accessibilityHint = hint;
    child = cloneElement(element, extra);
  }
  return h(View, { ref: anchor.ref, collapsable: false, style: flat(selfAlign(inRow), style), ...(web && hover ? { onMouseEnter: hover.enter, onMouseLeave: hover.leave } : null) }, child);
}

/** Left and top for a panel of `size` beside `anchor`, flipped to the other side when it does not fit and kept inside `area`. */
function place(anchor, size, area, wanted, align, gap, margin) {
  const room = { top: anchor.y, bottom: area.height - anchor.y - anchor.height, left: anchor.x, right: area.width - anchor.x - anchor.width };
  const vertical = wanted === "top" || wanted === "bottom", need = (vertical ? size.height : size.width) + gap + margin;
  const side = room[wanted] < need && room[OPPOSITE[wanted]] > room[wanted] ? OPPOSITE[wanted] : wanted;
  const along = (start, length, extent) => (align === "end" ? start + length - extent : align === "center" ? start + (length - extent) / 2 : start);
  const left = vertical ? along(anchor.x, anchor.width, size.width) : side === "right" ? anchor.x + anchor.width + gap : anchor.x - size.width - gap;
  const top = vertical ? (side === "bottom" ? anchor.y + anchor.height + gap : anchor.y - size.height - gap) : along(anchor.y, anchor.height, size.height);
  return { side, left: Math.round(clamp(left, margin, area.width - size.width - margin)), top: Math.round(clamp(top, margin, area.height - size.height - margin)) };
}

/**
 * The floating panel itself: a transparent Modal with the panel placed beside `anchor` ({ x, y, width, height } in
 * window coordinates). A press outside closes it. The Modal deliberately does not draw under the status bar, so
 * its coordinates match measureInWindow on Android.
 */
function Anchored({ visible, anchor, onClose, side = "bottom", align = "start", offset, role, modal = true, label, hover, look = "panel", style, children }) {
  const theme = useTheme(), c = theme.colors, win = useWindowDimensions();
  const [bounds, setBounds] = useState(null), [size, setSize] = useState(null);
  const shown = useRef(new Animated.Value(0)).current, leaving = useRef(null);
  const gap = offset ?? theme.space["2xs"], margin = theme.space.xs, area = bounds ?? win;
  const spot = visible && anchor && size ? place(anchor, size, area, side, align, gap, margin) : null, ready = !!spot;
  useEffect(() => { if (!visible) { setSize(null); shown.setValue(0); clearTimeout(leaving.current); leaving.current = null; } }, [visible, shown]);
  useEffect(() => { if (ready) Animated.timing(shown, { toValue: 1, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: !web }).start(); }, [ready, shown]);
  useEffect(() => () => clearTimeout(leaving.current), []);
  // Opened by hover: close once the pointer has left the trigger.
  const track = web && hover ? (event) => {
    const { clientX: x, clientY: y } = event.nativeEvent;
    if (within(anchor, x, y, 2)) { clearTimeout(leaving.current); leaving.current = null; }
    else if (!leaving.current) leaving.current = setTimeout(onClose, hover.closeDelay ?? 150);
  } : undefined;
  const looks = look === "tip"
    ? { paddingVertical: theme.space["2xs"], paddingHorizontal: theme.space.xs, borderRadius: theme.radius.s, backgroundColor: c.fg, maxWidth: Math.min(260, area.width - margin * 2), ...depth(theme.shadow.m) }
    : { padding: look === "menu" ? theme.space["2xs"] : theme.space.m, gap: look === "menu" ? 0 : theme.space.s, borderRadius: theme.radius.m, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface,
      minWidth: look === "menu" ? Math.min(200, area.width - margin * 2) : undefined, maxWidth: Math.min(look === "menu" ? 300 : 340, area.width - margin * 2), maxHeight: area.height - margin * 2, ...depth(theme.shadow.m) };
  return h(Modal, { visible: !!visible, transparent: true, animationType: "none", onRequestClose: onClose },
    h(View, { style: { flex: 1 }, onLayout: (event) => { const { width, height } = event.nativeEvent.layout; setBounds((old) => (old && old.width === width && old.height === height ? old : { width, height })); }, ...(track ? { onMouseMove: track } : null) },
      h(Animated.View, { accessibilityViewIsModal: true, accessibilityRole: role === "dialog" && !web ? undefined : role, "aria-modal": modal || undefined, accessibilityLabel: label, accessibilityLiveRegion: role === "tooltip" ? "polite" : undefined,
        onLayout: (event) => { const { width, height } = event.nativeEvent.layout; setSize((old) => (old && old.width === width && old.height === height ? old : { width, height })); },
        style: flat(looks, style, { position: "absolute", zIndex: 1, left: spot ? spot.left : margin, top: spot ? spot.top : margin, opacity: ready ? shown : 0,
          transform: [{ scale: shown.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] }) },
        h(InRow.Provider, { value: false }, children)),
      // After the panel in the tree so that focus and screen readers land on the panel first; drawn underneath it.
      h(Pressable, { onPress: onClose, accessibilityLabel: "Close", accessibilityRole: "button", focusable: false, style: flat(FILL, web && { cursor: "default" }) })));
}

// ---------------------------------------------------------------- alert-dialog
/**
 * A confirmation that must be answered: the backdrop and the back button do not close it. Built on Dialog.
 * variant="danger" makes the confirm button destructive; loading shows a spinner in it while the work runs.
 */
export function AlertDialog({ visible, title, description, children, confirmLabel = "Confirm", cancelLabel = "Cancel", variant = "solid", loading = false, onConfirm, onCancel }) {
  const danger = variant === "danger" || variant === "destructive";
  return h(Dialog, { visible, dismissible: false, title,
    actions: h(Fragment, null,
      cancelLabel ? h(Button, { title: cancelLabel, variant: "ghost", disabled: loading, onPress: onCancel }) : null,
      h(Button, { title: confirmLabel, variant: danger ? "danger" : "solid", loading, onPress: onConfirm })) },
    description ? h(Text, { tone: "muted", accessibilityRole: "alert" }, description) : null,
    children);
}

// ---------------------------------------------------------------- drawer
/**
 * A panel that slides in from an edge: side="left" | "right" | "top" | "bottom". The backdrop, the close button,
 * the back button and a drag towards the edge close it (dismissible={false} leaves only your own buttons; drag={false}
 * turns the gesture off). size is the width (left, right) or height (top, bottom). The body scrolls; footer stays put.
 * inset is the safe area to keep clear, for example from react-native-safe-area-context.
 */
export function Drawer({ visible, onClose, side = "right", title, children, footer, size, dismissible = true, drag = true, closeLabel = "Close", inset, style }) {
  const theme = useTheme(), c = theme.colors, win = useWindowDimensions();
  const horizontal = side === "left" || side === "right", sign = side === "left" || side === "top" ? -1 : 1;
  const [mounted, setMounted] = useState(!!visible), [extent, setExtent] = useState(0);
  const away = useRef(new Animated.Value(1)).current; // 1 = off screen, 0 = open
  const live = useRef({}); live.current = { horizontal, sign, extent, onClose, can: drag && dismissible };
  useEffect(() => {
    if (visible) { setMounted(true); return; }
    Animated.timing(away, { toValue: 1, duration: 180, easing: Easing.in(Easing.quad), useNativeDriver: !web }).start(({ finished }) => finished && setMounted(false));
  }, [visible, away]);
  useEffect(() => { if (visible && mounted && extent) Animated.timing(away, { toValue: 0, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: !web }).start(); }, [visible, mounted, extent, away]);
  const pan = useMemo(() => {
    const travel = (gesture) => (live.current.horizontal ? gesture.dx : gesture.dy) * live.current.sign;
    const settle = () => Animated.timing(away, { toValue: 0, duration: 160, useNativeDriver: !web }).start();
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => live.current.can && travel(gesture) > 8 && travel(gesture) > Math.abs(live.current.horizontal ? gesture.dy : gesture.dx),
      onPanResponderMove: (_, gesture) => away.setValue(clamp(travel(gesture) / (live.current.extent || 1), 0, 1)),
      onPanResponderRelease: (_, gesture) => {
        const speed = (live.current.horizontal ? gesture.vx : gesture.vy) * live.current.sign;
        if (travel(gesture) > live.current.extent / 3 || speed > 0.6) live.current.onClose?.(); else settle();
      },
      onPanResponderTerminate: settle,
    });
  }, [away]);
  const safe = { top: Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0, bottom: 0, left: 0, right: 0, ...inset };
  const close = dismissible ? onClose : undefined, l = theme.radius.l, pad = theme.space.l;
  const edge = horizontal
    ? { top: 0, bottom: 0, [side]: 0, width: size ?? Math.min(340, Math.round(win.width * 0.86)), [side === "left" ? "borderTopRightRadius" : "borderTopLeftRadius"]: l, [side === "left" ? "borderBottomRightRadius" : "borderBottomLeftRadius"]: l }
    : { left: 0, right: 0, [side]: 0, height: size, maxHeight: Math.round(win.height * 0.86), [side === "top" ? "borderBottomLeftRadius" : "borderTopLeftRadius"]: l, [side === "top" ? "borderBottomRightRadius" : "borderTopRightRadius"]: l };
  const grip = !horizontal && drag && dismissible ? h(View, { key: "grip", style: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: c.line, marginTop: side === "bottom" ? theme.space.s : 0, marginBottom: side === "top" ? theme.space.s : 0 } }) : null;
  const move = { transform: [{ [horizontal ? "translateX" : "translateY"]: away.interpolate({ inputRange: [0, 1], outputRange: [0, sign * (extent || (horizontal ? win.width : win.height))] }) }] };
  const head = h(View, { key: "head", style: { flexDirection: "row", alignItems: "center", gap: theme.space.xs, paddingLeft: pad + safe.left, paddingRight: theme.space.s + safe.right, paddingTop: (side === "bottom" ? theme.space.xs : theme.space.s) + (side === "bottom" ? 0 : safe.top), paddingBottom: theme.space.xs } },
    h(View, { style: { flex: 1 } }, typeof title === "string" ? h(Heading, { level: 3, numberOfLines: 1 }, title) : title),
    dismissible ? h(Pressable, { onPress: onClose, accessibilityRole: "button", accessibilityLabel: closeLabel, hitSlop: theme.space["2xs"],
      style: ({ pressed }) => ({ width: 36, height: 36, borderRadius: theme.radius.full, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? c.sunken : "transparent" }) },
      h(Text, { size: "xl", tone: "muted", style: { lineHeight: theme.text.xl + 2 } }, GLYPH.close)) : null);
  return h(Modal, { visible: mounted, transparent: true, animationType: "none", onRequestClose: close, statusBarTranslucent: true },
    h(View, { style: { flex: 1 } },
      h(Animated.View, { accessibilityViewIsModal: true, accessibilityRole: web ? "dialog" : undefined, "aria-modal": true, accessibilityLabel: typeof title === "string" ? title : undefined,
        onLayout: (event) => setExtent(Math.round(horizontal ? event.nativeEvent.layout.width : event.nativeEvent.layout.height)),
        ...(horizontal ? pan.panHandlers : null),
        style: flat({ position: "absolute", zIndex: 1, backgroundColor: c.surface, opacity: extent ? 1 : 0, ...depth(theme.shadow.l) }, edge, move, style) },
        // Top and bottom drawers are dragged by their header, so the body can still scroll.
        h(View, { ...(horizontal ? null : pan.panHandlers), style: web ? { userSelect: "none" } : null }, side === "bottom" ? [grip, head] : head),
        h(ScrollView, { style: { flexShrink: 1 }, keyboardShouldPersistTaps: "handled", contentContainerStyle: { paddingHorizontal: pad, paddingLeft: pad + safe.left, paddingRight: pad + safe.right, paddingTop: theme.space["2xs"], paddingBottom: footer ? theme.space.s : pad + (side === "top" ? 0 : safe.bottom), gap: theme.space.s } },
          h(InRow.Provider, { value: false }, typeof children === "string" ? h(Text, { tone: "muted" }, children) : children)),
        footer ? h(View, { style: { flexDirection: "row", justifyContent: "flex-end", gap: theme.space.xs, paddingHorizontal: pad, paddingTop: theme.space.s, paddingBottom: theme.space.m + (side === "top" ? 0 : safe.bottom), borderTopWidth: 1, borderTopColor: c.line } },
          h(InRow.Provider, { value: true }, footer)) : null,
        side === "top" && grip ? h(View, { ...pan.panHandlers, style: { paddingTop: theme.space.xs } }, grip) : null),
      h(Animated.View, { style: flat(FILL, { backgroundColor: c.overlay, opacity: away.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }) },
        h(Pressable, { onPress: close, accessible: dismissible, accessibilityLabel: closeLabel, accessibilityRole: "button", focusable: false, style: flat(FILL, web && { cursor: "default" }) }))));
}

// ---------------------------------------------------------------- popover
/**
 * Any content in a floating panel beside its trigger. trigger is one pressable element (a Button, usually); the
 * popover adds the press handler and the expanded state to it. side: bottom | top | left | right (it flips when
 * there is no room), align: start | center | end. children may be a function ({ close }) => content.
 */
export function Popover({ trigger, children, open, defaultOpen, onOpenChange, side = "bottom", align = "start", offset, label, style, contentStyle }) {
  const [isOpen, setOpen] = useOpen(open, defaultOpen, onOpenChange), anchor = useAnchor(isOpen);
  const close = useCallback(() => setOpen(false), [setOpen]);
  return h(Fragment, null,
    h(Trigger, { anchor, element: trigger, open: isOpen, popup: "dialog", onPress: () => setOpen(!isOpen), style }),
    h(Anchored, { visible: isOpen, anchor: anchor.rect, onClose: close, side, align, offset, role: "dialog", label, style: contentStyle },
      typeof children === "function" ? children({ close }) : typeof children === "string" ? h(Text, { size: "sm" }, children) : children));
}

// ---------------------------------------------------------------- menus
const isDestructive = (item) => !!item.destructive || item.variant === "destructive" || item.variant === "danger";

function MenuRow({ theme, role, label, shortcut, icon, mark, marks, more, destructive, disabled, checked, onPress, back }) {
  const c = theme.colors, color = destructive ? c.bad : c.fg, state = { disabled: !!disabled, ...(checked === undefined ? null : { checked }) };
  return h(Pressable, { onPress, disabled, accessibilityRole: web ? role : role === "menuitemcheckbox" ? "checkbox" : role === "menuitemradio" ? "radio" : role,
    accessibilityLabel: typeof label === "string" ? (back ? `Back, ${label}` : label) : undefined, accessibilityState: state, "aria-checked": checked, "aria-disabled": !!disabled, "aria-haspopup": more ? "menu" : undefined,
    style: ({ pressed, hovered, focused }) => flat({ minHeight: theme.touch, paddingHorizontal: theme.space.s, paddingVertical: theme.space["2xs"], flexDirection: "row", alignItems: "center", gap: theme.space.xs, borderRadius: theme.radius.s,
      backgroundColor: pressed || hovered || (web && focused) ? c.sunken : "transparent", opacity: disabled ? 0.45 : 1 }, web && { outlineStyle: "none" }) },
    back ? h(Text, { size: "lg", tone: "muted", style: { width: 18, textAlign: "center" } }, GLYPH.chevronLeft) : null,
    marks ? h(View, { style: { width: 18, alignItems: "center", justifyContent: "center" } },
      mark === "check" ? h(Text, { size: "sm", weight: "bold", style: { color } }, GLYPH.check) : mark === "dot" ? h(View, { style: { width: 8, height: 8, borderRadius: 4, backgroundColor: color } }) : null) : null,
    icon ? h(View, { style: { width: 20, alignItems: "center" } }, typeof icon === "string" ? h(Text, { size: "md", style: { color: destructive ? c.bad : c.muted } }, icon) : icon) : null,
    typeof label === "string" ? h(Text, { size: "md", weight: back ? "semibold" : "regular", numberOfLines: 1, style: { flex: 1, color } }, label) : h(View, { style: { flex: 1 } }, label),
    shortcut ? h(Text, { size: "xs", tone: "muted" }, shortcut) : null,
    more ? h(Text, { size: "lg", tone: "muted" }, GLYPH.chevronRight) : null);
}

/** The rows of a menu. A sub-menu replaces the list (with a back row) instead of flying out, which suits a thumb. */
function MenuList({ items, onSelect, onClose, label, wait }) {
  const theme = useTheme(), [trail, setTrail] = useState([]);
  const sub = trail[trail.length - 1], list = (sub ? sub.items : items) ?? [];
  const marks = list.some((item) => item && (item.type === "checkbox" || item.type === "radio"));
  const finish = (item, run, keepOpen) => {
    if (item.closeOnSelect ?? !keepOpen) { onClose?.(); afterClose(run, wait); } else run();
  };
  const rows = [];
  if (sub) rows.push(h(MenuRow, { key: "back", theme, role: "menuitem", back: true, label: sub.label, onPress: () => setTrail(trail.slice(0, -1)) }),
    h(View, { key: "back-line", style: { height: 1, marginVertical: theme.space["2xs"], backgroundColor: theme.colors.line } }));
  list.forEach((item, index) => {
    if (!item) return;
    const key = item.key ?? `${item.type ?? "item"}-${index}`;
    if (item.type === "separator") rows.push(h(View, { key, accessibilityRole: web ? "separator" : undefined, style: { height: 1, marginVertical: theme.space["2xs"], marginHorizontal: -theme.space["2xs"], backgroundColor: theme.colors.line } }));
    else if (item.type === "label") rows.push(h(Text, { key, size: "xs", weight: "semibold", tone: "muted", style: { paddingHorizontal: theme.space.s, paddingTop: theme.space.xs, paddingBottom: theme.space["2xs"] } }, item.label));
    else if (item.type === "radio") rows.push(h(View, { key, accessibilityRole: "radiogroup", accessibilityLabel: item.label },
      (item.options ?? []).map((option) => h(MenuRow, { key: String(option.value), theme, role: "menuitemradio", marks: true, mark: option.value === item.value ? "dot" : null, checked: option.value === item.value,
        label: option.label, disabled: item.disabled || option.disabled,
        onPress: () => finish(item, () => { item.onChange?.(option.value); onSelect?.(option.value, item); }, true) }))));
    else if (item.type === "checkbox") rows.push(h(MenuRow, { key, theme, role: "menuitemcheckbox", marks: true, mark: item.checked ? "check" : null, checked: !!item.checked, label: item.label, icon: item.icon, disabled: item.disabled,
      onPress: () => finish(item, () => { item.onChange?.(!item.checked); onSelect?.(item.value ?? item.label, item); }, true) }));
    else if (item.items) rows.push(h(MenuRow, { key, theme, role: "menuitem", marks, more: true, label: item.label, icon: item.icon, disabled: item.disabled, onPress: () => setTrail([...trail, item]) }));
    else rows.push(h(MenuRow, { key, theme, role: "menuitem", marks, label: item.label, icon: item.icon, shortcut: item.shortcut, disabled: item.disabled, destructive: isDestructive(item),
      onPress: () => finish(item, () => { item.onSelect?.(); onSelect?.(item.value ?? item.label, item); }, false) }));
  });
  return h(View, { accessibilityRole: "menu", accessibilityLabel: label }, rows);
}

/** One menu, shown either beside its anchor or as a bottom Sheet. */
function MenuSurface({ visible, anchor, onClose, items, onSelect, presentation = "auto", side, align, label }) {
  const win = useWindowDimensions(), theme = useTheme();
  // "auto": a floating menu wherever one fits; a sheet on very small windows (small phones, split screen).
  const asSheet = presentation === "sheet" || (presentation !== "popover" && Math.min(win.width, win.height) < 360);
  if (asSheet) return h(Sheet, { visible, onClose, title: label },
    h(ScrollView, { style: { maxHeight: Math.round(win.height * 0.6), marginHorizontal: -theme.space.s }, keyboardShouldPersistTaps: "handled" },
      h(MenuList, { items, onSelect, onClose, label, wait: 350 })));
  return h(Anchored, { visible, anchor, onClose, side, align, look: "menu", label },
    h(ScrollView, { style: { flexShrink: 1 }, keyboardShouldPersistTaps: "handled" }, h(MenuList, { items, onSelect, onClose, label, wait: 80 })));
}

/**
 * A button that opens a list of actions. items is an array of
 *   { label, onSelect, value, icon, shortcut, disabled, destructive }      an action (closes the menu)
 *   { type: "checkbox", label, checked, onChange }                          a tick item (the menu stays open)
 *   { type: "radio", value, onChange, options: [{ value, label }] }         one choice from a group
 *   { type: "label", label }   { type: "separator" }                        headings and rules
 *   { label, items: [...] }                                                 a sub-menu (drills in, with a back row)
 * onSelect(value, item) is also called for every choice. closeOnSelect on an item overrides whether it closes.
 * presentation: "auto" (floating, or a sheet on very small windows) | "popover" | "sheet".
 */
export function DropdownMenu({ trigger, items = [], onSelect, open, defaultOpen, onOpenChange, presentation = "auto", side = "bottom", align = "start", label, style }) {
  const [isOpen, setOpen] = useOpen(open, defaultOpen, onOpenChange), anchor = useAnchor(isOpen);
  const close = useCallback(() => setOpen(false), [setOpen]);
  return h(Fragment, null,
    h(Trigger, { anchor, element: trigger, open: isOpen, popup: "menu", onPress: () => setOpen(!isOpen), style }),
    h(MenuSurface, { visible: isOpen, anchor: anchor.rect, onClose: close, items, onSelect, presentation, side, align, label }));
}

/**
 * The same menu, opened by a long press on its children (and by right-click on the web); it appears where the
 * finger is. Phones have no right-click, so long press is the equivalent; screen readers get it as an action.
 * A pressable child with its own onLongPress keeps that gesture for itself.
 */
export function ContextMenu({ children, items = [], onSelect, open, onOpenChange, presentation = "auto", label, disabled = false, delayLongPress, style }) {
  const [isOpen, setOpen] = useOpen(open, false, onOpenChange), anchor = useAnchor(isOpen), [point, setPoint] = useState(null);
  const close = useCallback(() => setOpen(false), [setOpen]);
  const openAt = (event) => {
    const at = event?.nativeEvent, x = at?.pageX ?? at?.clientX, y = at?.pageY ?? at?.clientY;
    setPoint(Number.isFinite(x) && Number.isFinite(y) ? { x: web ? at.clientX ?? x : x, y: web ? at.clientY ?? y : y, width: 0, height: 0 } : null);
    setOpen(true);
  };
  return h(Fragment, null,
    h(Pressable, { ref: anchor.ref, disabled, onLongPress: openAt, delayLongPress, accessibilityHint: web ? undefined : "Long press for more options",
      accessibilityActions: [{ name: "longpress", label: label ?? "Open menu" }], onAccessibilityAction: (event) => { if (event.nativeEvent.actionName === "longpress") openAt(); },
      "aria-haspopup": "menu", "aria-expanded": isOpen,
      ...(web ? { onContextMenu: (event) => { event.preventDefault(); openAt(event); } } : null), style: flat(web && { cursor: "auto" }, style) }, children),
    h(MenuSurface, { visible: isOpen, anchor: point ?? anchor.rect, onClose: close, items, onSelect, presentation, side: "bottom", align: "start", label }));
}

// ---------------------------------------------------------------- tooltip
/**
 * A short hint for the element it wraps. Phones have no hover: a long press on the child shows it for `duration`
 * milliseconds (0 keeps it until the next touch); with a mouse it shows after `delay` of hovering and hides when
 * the pointer leaves. The child must be pressable (a Button, a Pressable); its own onPress keeps working.
 * Screen readers get the label as the child's accessibility hint.
 */
export function Tooltip({ label, children, side = "top", align = "center", offset, delay = 500, duration = 2000, open, onOpenChange, disabled = false, style }) {
  const [isOpen, setOpen] = useOpen(open, false, onOpenChange), anchor = useAnchor(isOpen), hover = useHover(isOpen, setOpen, delay), theme = useTheme();
  const close = useCallback(() => setOpen(false), [setOpen]), byHover = hover.hovering;
  useEffect(() => {
    if (!isOpen || byHover || !duration) return undefined;
    const timer = setTimeout(close, duration);
    return () => clearTimeout(timer);
  }, [isOpen, byHover, duration, close]);
  const off = disabled || !label;
  return h(Fragment, null,
    h(Trigger, { anchor, element: children, hover: off ? null : hover, hint: typeof label === "string" ? label : undefined, onLongPress: off ? undefined : () => { hover.cancel(); setOpen(true); }, style }),
    h(Anchored, { visible: isOpen && !off, anchor: anchor.rect, onClose: close, side, align, offset, role: "tooltip", modal: false, look: "tip", hover: byHover ? { closeDelay: 80 } : null },
      typeof label === "string" ? h(Text, { size: "sm", weight: "medium", style: { color: theme.colors.bg } }, label) : label));
}

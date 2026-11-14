// BottomSheet, Sheet and Drawer for the gestures entry: the core components' API, moved by the finger on the UI thread.
// Each one is drawn in a React Native Modal. Gesture Handler does not see touches inside a Modal on Android unless
// the Modal's content has its own GestureHandlerRootView, so each Modal here wraps its content in one. The app must
// still have a GestureHandlerRootView at its root (see index.js).
import { createElement as h, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, Modal, Pressable, Text as NativeText, View, useWindowDimensions } from "react-native";
import Animated, { Easing, Extrapolation, cancelAnimation, interpolate, scrollTo, useAnimatedReaction, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { GestureDetector, GestureHandlerRootView, useNativeGesture, usePanGesture } from "react-native-gesture-handler";
import { useTheme } from "@colibri-kit/native-core";
import { web, depth, flat, GLYPH, InRow } from "@colibri-kit/native-core/internal";
import { Text, Heading } from "@colibri-kit/native-core";
import { FILL, SPRING, clamp, homeIndicator, ios, statusBarTop, themed, useLatest, useStable } from "./shared.js";

const ROOT = { flex: 1 };
const OFFSCREEN = 100000; // where a panel waits before its size is known
const inModal = (tree, props) => h(Modal, { visible: true, transparent: true, animationType: "none", statusBarTranslucent: true, ...props }, h(GestureHandlerRootView, { style: ROOT }, tree));

// ---------------------------------------------------------------- BottomSheet
const bottomSheetStyles = themed((theme) => ({
  root: { ...FILL, overflow: "hidden", justifyContent: "flex-end" },
  scrim: { ...FILL, backgroundColor: theme.colors.overlay },
  sheet: { width: "100%", maxWidth: 640, alignSelf: "center", borderTopLeftRadius: theme.radius.l, borderTopRightRadius: theme.radius.l, backgroundColor: theme.colors.surface, ...depth(theme.shadow.l) },
  // Colour below the sheet, seen only while a spring or an over-drag lifts it past its top position.
  tail: { position: "absolute", top: "100%", left: 0, right: 0, height: 400, marginTop: -1, backgroundColor: theme.colors.surface },
  grip: { paddingTop: theme.space.xs, paddingBottom: theme.space.xs, alignItems: "center", ...(web ? { cursor: "grab" } : null) },
  bar: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.line },
  title: { marginTop: theme.space.xs, paddingHorizontal: theme.space.m, alignSelf: "stretch", color: theme.colors.fg, fontSize: theme.text.lg, lineHeight: 24, fontWeight: "700" },
  body: { flex: 1 },
  content: { paddingHorizontal: theme.space.m, gap: theme.space.s },
}));
const toPoints = (point, full) => (typeof point === "string" && point.endsWith("%") ? (full * parseFloat(point)) / 100 : +point || 0);
const DEFAULT_SNAPS = ["50%", "90%"];
const SHEET_ACTIONS = [{ name: "increment", label: "Expand" }, { name: "decrement", label: "Collapse" }];
/** Above the top point, and below the lowest one when the sheet cannot be dismissed, the sheet follows at a quarter of the finger's speed. */
const resist = (value, lowest, free) => {
  "worklet";
  if (value < 0) return value * 0.25;
  if (!free && value > lowest) return lowest + (value - lowest) * 0.25;
  return value;
};

/**
 * A sheet that rests at snap points and follows the finger between them, on the UI thread.
 * Same props as the core BottomSheet. snapPoints: heights, low to high, as "25%" of the container or points.
 * snap + onSnapChange (or defaultSnap) is the index it rests at. A release carries its velocity into the spring; a
 * flick goes to the next point and a pull below the lowest point closes the sheet (dismissible). The backdrop
 * follows the position.
 * Scrolling content (scroll, default true): the list scrolls only at the highest point. There the drag and the
 * scroll view run together (Gesture Handler's simultaneousWith): while the list is scrolled away from its top the
 * finger scrolls it; a pull down with the list at its top moves the sheet and the list is held at offset 0.
 * The handle always drags the sheet.
 * Extras: keyboardAware (default true) pads the content by the part of the sheet the keyboard covers and opens the
 * sheet to its highest point while the keyboard is up. animatedHeight is a shared value that receives the visible
 * height on every frame, for content outside the sheet that follows it.
 * modal={false} draws it inside its parent instead of a Modal, for a sheet that lives over a map or a list.
 */
export function BottomSheet({ visible, onClose, snapPoints = DEFAULT_SNAPS, snap, defaultSnap = 0, onSnapChange, modal = true, backdrop = modal, dismissible = true, handle = true, title, scroll = true, bottomInset = modal ? homeIndicator() : 0, keyboardAware = true, animatedHeight, children, style, contentStyle, testID }) {
  const styles = bottomSheetStyles();
  const [mounted, setMounted] = useState(!!visible), [full, setFull] = useState(0), [inner, setInner] = useState(defaultSnap), [tick, setTick] = useState(0), [covered, setCovered] = useState(0);
  const heights = useMemo(() => snapPoints.map((point) => clamp(toPoints(point, full), 0, full)).sort((a, b) => a - b), [snapPoints, full]);
  const top = heights.length - 1, index = clamp(snap !== undefined ? snap : inner, 0, Math.max(0, top)), tall = heights[top] ?? 0;
  const live = useLatest({ heights, tall, index, top, visible, dismissible, snap, onSnapChange, onClose });
  const state = useRef({ shown: false, closing: false, target: null, beforeKeyboard: null }).current, root = useRef(null);

  // y is the sheet's translateY: 0 at the highest point, tall when it is fully below the edge.
  const y = useSharedValue(OFFSCREEN), startY = useSharedValue(0), consumed = useSharedValue(0), owner = useSharedValue(0), scrollY = useSharedValue(0);
  // What the worklets need to know about the props, kept in shared values so the gestures are built once.
  const stops = useSharedValue([]), height = useSharedValue(0), free = useSharedValue(dismissible), scrolls = useSharedValue(false), leaving = useSharedValue(false);
  const list = useAnimatedRef();
  useEffect(() => { stops.value = heights.map((each) => tall - each); height.value = tall; }, [heights, tall, stops, height]);
  useEffect(() => { free.value = dismissible; }, [dismissible, free]);
  useEffect(() => { scrolls.value = scroll && index === top; }, [scroll, index, top, scrolls]);

  const rest = useCallback((to) => {
    if (state.target === to) return;
    state.target = to; y.value = withSpring(to, SPRING);
  }, [y, state]);
  const left = useStable(() => {
    state.closing = false; leaving.value = false;
    if (live.current.visible) { state.target = null; setTick((n) => n + 1); return; } // the parent kept it open: go back to the snap point
    state.shown = false; setMounted(false);
  });
  const leave = useCallback(() => {
    if (state.closing) return;
    state.closing = true; state.target = null; leaving.value = true;
    y.value = withTiming(live.current.tall, { duration: 220, easing: Easing.out(Easing.quad) }, (finished) => { "worklet"; if (finished) scheduleOnRN(left); });
  }, [y, state, live, leaving, left]);
  useEffect(() => { if (visible) setMounted(true); }, [visible]);
  useEffect(() => {
    if (!full || !tall) return;
    if (!visible) { if (state.shown) leave(); return; }
    if (!state.shown) { state.shown = true; state.target = null; y.value = tall; }
    if (!state.closing) rest(tall - heights[index]);
  }, [visible, full, tall, heights, index, tick, y, state, rest, leave]);

  const change = useStable((next) => { const now = live.current; if (next !== now.index) { if (now.snap === undefined) setInner(next); now.onSnapChange?.(next); } });
  // Called once when a drag ends. The sheet is already on its way (the spring started on the UI thread).
  const settled = useStable((next, to) => { state.target = to; change(next); setTick((n) => n + 1); });
  const dragClosed = useStable(() => { state.closing = true; state.target = null; live.current.onClose?.(); });

  const native = useNativeGesture(useMemo(() => ({}), []));
  const gestures = useMemo(() => {
    const begin = () => {
      "worklet";
      cancelAnimation(y);
      startY.value = y.value; consumed.value = 0;
      owner.value = !scrolls.value || y.value > 0.5 ? 1 : 0;
    };
    const release = (velocity) => {
      "worklet";
      const points = stops.value, lowest = points.length ? points[0] : 0, at = y.value, aim = at + velocity * 0.18, low = height.value - lowest;
      if (free.value && (aim > lowest + low * 0.5 || (velocity > 1400 && at > lowest))) {
        leaving.value = true;
        const duration = clamp(((height.value - at) / Math.max(500, velocity)) * 1000, 120, 240);
        y.value = withTiming(height.value, { duration, easing: Easing.out(Easing.quad) }, (finished) => { "worklet"; if (finished) scheduleOnRN(left); });
        scheduleOnRN(dragClosed);
        return;
      }
      let next = 0;
      for (let i = 1; i < points.length; i++) if (Math.abs(points[i] - aim) < Math.abs(points[next] - aim)) next = i;
      const to = points.length ? points[next] : 0;
      y.value = withSpring(to, { stiffness: SPRING.stiffness, damping: SPRING.damping, mass: SPRING.mass, velocity });
      scheduleOnRN(settled, next, to);
    };
    const lowest = () => { "worklet"; return stops.value.length ? stops.value[0] : 0; };
    return {
      // The handle and title: always moves the sheet.
      grip: {
        minDistance: 4,
        onActivate: () => { "worklet"; if (!leaving.value) begin(); },
        onUpdate: (event) => { "worklet"; if (!leaving.value) y.value = resist(startY.value + event.translationY, lowest(), free.value); },
        onDeactivate: (event) => { "worklet"; if (!leaving.value) release(event.velocityY); },
      },
      // The content. owner is 1 while this drag moves the sheet and 0 while the list underneath scrolls.
      body: {
        simultaneousWith: native, activeOffsetY: [-8, 8], failOffsetX: [-24, 24],
        onActivate: () => { "worklet"; if (!leaving.value) begin(); },
        onUpdate: (event) => {
          "worklet";
          if (leaving.value) return;
          const travel = event.translationY - consumed.value;
          if (owner.value === 0) {
            // The list is scrolled, or the finger goes up: the list takes the movement. Remember how much of the
            // finger's travel it used, so the sheet starts from zero when the list reaches its top.
            if (scrollY.value > 0.5 || travel <= 0) { consumed.value = event.translationY; return; }
            owner.value = 1;
          }
          const next = startY.value + travel;
          if (scrolls.value && startY.value <= 0.5 && next <= 0) { owner.value = 0; consumed.value = event.translationY; y.value = 0; return; } // back at the top: hand over to the list
          y.value = resist(next, lowest(), free.value);
          if (scrolls.value) scrollTo(list, 0, 0, false);
        },
        onDeactivate: (event) => { "worklet"; if (!leaving.value) release(owner.value === 1 ? event.velocityY : 0); },
      },
    };
  }, [y, startY, consumed, owner, scrollY, stops, height, free, scrolls, leaving, list, native, left, dragClosed, settled]);
  const gripPan = usePanGesture(gestures.grip), bodyPan = usePanGesture(gestures.body);
  const onScroll = useAnimatedScrollHandler({ onScroll: (event) => { "worklet"; scrollY.value = event.contentOffset.y; } }, [scrollY]);

  const dim = useAnimatedStyle(() => {
    const tallNow = height.value, low = stops.value.length ? stops.value[0] : 0;
    if (!tallNow) return { opacity: 0 };
    return { opacity: low > 0 && low < tallNow ? interpolate(y.value, [0, low, tallNow], [1, 0.6, 0], Extrapolation.CLAMP) : interpolate(y.value, [0, tallNow], [1, 0], Extrapolation.CLAMP) };
  }, [y, height, stops]);
  const move = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }), [y]);
  useAnimatedReaction(() => height.value - y.value, (now) => { "worklet"; if (animatedHeight) animatedHeight.value = Math.max(0, now); }, [y, height, animatedHeight]);

  // The keyboard: pad the content by the part of the sheet it covers, and open the sheet fully meanwhile.
  useEffect(() => {
    if (!keyboardAware || web) return undefined;
    const shown = Keyboard.addListener(ios ? "keyboardWillShow" : "keyboardDidShow", (event) => {
      root.current?.measureInWindow?.((_x, pageY, _width, measured) => {
        const over = Math.max(0, pageY + measured - event.endCoordinates.screenY);
        setCovered(over);
        if (over > 0 && state.beforeKeyboard == null && live.current.visible) { state.beforeKeyboard = live.current.index; change(live.current.top); }
      });
    });
    const hidden = Keyboard.addListener(ios ? "keyboardWillHide" : "keyboardDidHide", () => {
      setCovered(0);
      if (state.beforeKeyboard != null) { const back = state.beforeKeyboard; state.beforeKeyboard = null; if (live.current.visible && live.current.index === live.current.top) change(back); }
    });
    return () => { shown.remove(); hidden.remove(); };
  }, [keyboardAware, state, live, change]);

  const onLayout = useCallback((event) => setFull(Math.round(event.nativeEvent.layout.height)), []);
  const step = useCallback((event) => {
    const now = live.current, name = event.nativeEvent.actionName, next = clamp(now.index + (name === "increment" ? 1 : -1), 0, now.top);
    if (name === "decrement" && now.index === 0 && now.dismissible) { now.onClose?.(); return; }
    change(next);
  }, [live, change]);
  if (!mounted && !visible) return null;

  const open = index === top, padding = { paddingBottom: bottomInset + covered + styles.content.paddingHorizontal };
  const tree = h(View, { ref: root, onLayout, testID, style: [styles.root, { pointerEvents: backdrop ? "auto" : "box-none" }] },
    backdrop ? h(Animated.View, { style: [styles.scrim, dim] }, h(Pressable, { style: FILL, onPress: dismissible ? onClose : undefined, accessibilityLabel: "Close", testID: "bottom-sheet-backdrop" })) : null,
    h(Animated.View, { accessibilityViewIsModal: modal, style: flat(styles.sheet, { height: tall, opacity: tall ? 1 : 0 }, move, style) },
      h(View, { style: styles.tail }),
      h(GestureDetector, { gesture: gripPan, touchAction: "none", userSelect: "none" },
        h(View, { style: styles.grip, testID: "bottom-sheet-handle", ...(web ? null : { accessible: true }), accessibilityRole: "adjustable", accessibilityLabel: typeof title === "string" ? `${title}, sheet height` : "Sheet height",
          accessibilityValue: { min: 0, max: top, now: index }, accessibilityActions: SHEET_ACTIONS, onAccessibilityAction: step, onAccessibilityEscape: dismissible ? onClose : undefined },
          handle ? h(View, { style: styles.bar }) : null,
          typeof title === "string" ? h(NativeText, { numberOfLines: 1, accessibilityRole: "header", style: styles.title }, title) : title)),
      h(GestureDetector, { gesture: bodyPan, touchAction: open && scroll ? "pan-y" : "none", userSelect: "none" },
        h(View, { style: styles.body, collapsable: false },
          scroll ? h(GestureDetector, { gesture: native },
            h(Animated.ScrollView, { ref: list, scrollEnabled: open, bounces: false, overScrollMode: "never", onScroll, scrollEventThrottle: 16, keyboardShouldPersistTaps: "handled", contentContainerStyle: flat(styles.content, padding, contentStyle) }, children))
            : h(View, { style: flat({ flex: 1 }, styles.content, padding, contentStyle) }, children)))));
  return modal ? inModal(tree, { onRequestClose: dismissible ? onClose : undefined }) : tree;
}

// ---------------------------------------------------------------- panels that leave through the edge they came from
/**
 * The motion of Sheet and Drawer. off is how far the panel is from its open position, in points towards its edge:
 * 0 when open, extent when hidden. A drag towards the edge moves it; past a third of the panel, or with a flick, it
 * leaves and onClose is called once. The panel stays mounted until it has left.
 */
function useEdgePanel({ visible, side, onClose, can }) {
  const horizontal = side === "left" || side === "right", sign = side === "left" || side === "top" ? -1 : 1;
  const [mounted, setMounted] = useState(!!visible), [extent, setExtent] = useState(0), [tick, setTick] = useState(0);
  const off = useSharedValue(OFFSCREEN), start = useSharedValue(0), size = useSharedValue(0), leaving = useSharedValue(false);
  const live = useLatest({ visible, onClose }), state = useRef({ shown: false, closing: false }).current;
  const left = useStable(() => {
    state.closing = false; leaving.value = false;
    if (live.current.visible) { setTick((n) => n + 1); return; }
    state.shown = false; setMounted(false);
  });
  const dragClosed = useStable(() => { state.closing = true; live.current.onClose?.(); });
  useEffect(() => { if (visible) setMounted(true); }, [visible]);
  useEffect(() => { size.value = extent; }, [extent, size]);
  useEffect(() => {
    if (!extent) return;
    if (!visible) {
      if (!state.shown || state.closing) return;
      state.closing = true; leaving.value = true;
      off.value = withTiming(extent, { duration: 180, easing: Easing.in(Easing.quad) }, (finished) => { "worklet"; if (finished) scheduleOnRN(left); });
      return;
    }
    if (state.closing) return;
    if (!state.shown) { state.shown = true; off.value = extent; }
    off.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) });
  }, [visible, extent, tick, off, state, leaving, left]);

  const pan = usePanGesture(useMemo(() => {
    const along = (event) => { "worklet"; return (horizontal ? event.translationX : event.translationY) * sign; };
    // Only a drag towards the edge starts it, so a list inside keeps its scroll in the other direction.
    const towards = horizontal ? { activeOffsetX: sign * 10, failOffsetX: -sign * 10, failOffsetY: [-14, 14] } : { activeOffsetY: sign * 10, failOffsetY: -sign * 10, failOffsetX: [-14, 14] };
    return {
      ...towards, enabled: can,
      onActivate: () => { "worklet"; if (leaving.value) return; cancelAnimation(off); start.value = off.value; },
      onUpdate: (event) => { "worklet"; if (!leaving.value) off.value = Math.max(0, start.value + along(event)); },
      onDeactivate: (event) => {
        "worklet";
        if (leaving.value) return;
        const speed = (horizontal ? event.velocityX : event.velocityY) * sign, total = size.value;
        if (off.value > total / 3 || (speed > 600 && off.value > 8)) {
          leaving.value = true;
          const duration = clamp(((total - off.value) / Math.max(600, speed)) * 1000, 100, 220);
          off.value = withTiming(total, { duration, easing: Easing.out(Easing.quad) }, (finished) => { "worklet"; if (finished) scheduleOnRN(left); });
          scheduleOnRN(dragClosed);
        } else off.value = withSpring(0, { stiffness: SPRING.stiffness, damping: SPRING.damping, mass: SPRING.mass, velocity: speed, overshootClamping: true });
      },
    };
  }, [horizontal, sign, can, off, start, size, leaving, left, dragClosed]));

  const move = useAnimatedStyle(() => ({ transform: [horizontal ? { translateX: sign * off.value } : { translateY: sign * off.value }] }), [off, horizontal, sign]);
  const dim = useAnimatedStyle(() => ({ opacity: size.value ? interpolate(off.value, [0, size.value], [1, 0], Extrapolation.CLAMP) : 0 }), [off, size]);
  const onLayout = useCallback((event) => setExtent(Math.round(horizontal ? event.nativeEvent.layout.width : event.nativeEvent.layout.height)), [horizontal]);
  return { mounted: mounted || !!visible, extent, horizontal, pan, move, dim, onLayout };
}

// ---------------------------------------------------------------- Sheet
/**
 * A panel that slides up from the bottom edge, as tall as its content. Tap outside, press back, or drag it down to
 * close: the panel follows the finger and the backdrop fades with it.
 * Same props as the core Sheet (visible, onClose, title, children). Extras: dismissible (default true; false leaves
 * only your own buttons), bottomInset (the home-indicator area to keep clear) and testID.
 */
export function Sheet({ visible, onClose, title, children, dismissible = true, bottomInset = homeIndicator(), testID }) {
  const theme = useTheme();
  const panel = useEdgePanel({ visible, side: "bottom", onClose, can: dismissible });
  if (!panel.mounted) return null;
  return inModal(h(View, { testID, style: { flex: 1, justifyContent: "flex-end" } },
    h(Animated.View, { style: [FILL, { backgroundColor: theme.colors.overlay }, panel.dim] },
      h(Pressable, { onPress: dismissible ? onClose : undefined, accessible: dismissible, accessibilityLabel: "Close", testID: "sheet-backdrop", style: FILL })),
    h(GestureDetector, { gesture: panel.pan, touchAction: "none", userSelect: "none" },
      h(Animated.View, { onLayout: panel.onLayout, accessibilityViewIsModal: true, accessibilityRole: web ? "dialog" : undefined, "aria-modal": true, accessibilityLabel: typeof title === "string" ? title : undefined, onAccessibilityEscape: dismissible ? onClose : undefined, testID: "sheet-panel",
        style: [{ padding: theme.space.l, paddingBottom: theme.space.xl + bottomInset, gap: theme.space.s, borderTopLeftRadius: theme.radius.l, borderTopRightRadius: theme.radius.l, backgroundColor: theme.colors.surface, opacity: panel.extent ? 1 : 0, ...depth(theme.shadow.l) }, panel.move] },
        // Colour below the panel, for the moment a spring carries it past its resting place.
        h(View, { style: { position: "absolute", top: "100%", left: 0, right: 0, height: 200, marginTop: -1, backgroundColor: theme.colors.surface } }),
        h(View, { style: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.line, marginBottom: theme.space["2xs"] } }),
        title ? h(Heading, { level: 3 }, title) : null,
        typeof children === "string" ? h(Text, { tone: "muted" }, children) : children))), { onRequestClose: dismissible ? onClose : undefined });
}

// ---------------------------------------------------------------- Drawer
/**
 * A panel that slides in from an edge: side="left" | "right" | "top" | "bottom". The backdrop, the close button,
 * the back button and a drag towards the edge close it; the panel follows the finger on the UI thread and the
 * backdrop fades with it. Same props as the core Drawer: dismissible={false} leaves only your own buttons,
 * drag={false} turns the gesture off, size is the width (left, right) or height (top, bottom), the body scrolls and
 * footer stays put, inset is the safe area to keep clear.
 * Left and right drawers are dragged anywhere (a sideways drag; the body keeps its vertical scroll). Top and bottom
 * drawers are dragged by their header, so the body can still scroll.
 */
export function Drawer({ visible, onClose, side = "right", title, children, footer, size, dismissible = true, drag = true, closeLabel = "Close", inset, style }) {
  const theme = useTheme(), c = theme.colors, win = useWindowDimensions();
  const panel = useEdgePanel({ visible, side, onClose, can: drag && dismissible }), horizontal = panel.horizontal;
  if (!panel.mounted) return null;
  const safe = { top: statusBarTop(), bottom: 0, left: 0, right: 0, ...inset };
  const close = dismissible ? onClose : undefined, l = theme.radius.l, pad = theme.space.l;
  const edge = horizontal
    ? { top: 0, bottom: 0, [side]: 0, width: size ?? Math.min(340, Math.round(win.width * 0.86)), [side === "left" ? "borderTopRightRadius" : "borderTopLeftRadius"]: l, [side === "left" ? "borderBottomRightRadius" : "borderBottomLeftRadius"]: l }
    : { left: 0, right: 0, [side]: 0, height: size, maxHeight: Math.round(win.height * 0.86), [side === "top" ? "borderBottomLeftRadius" : "borderTopLeftRadius"]: l, [side === "top" ? "borderBottomRightRadius" : "borderTopRightRadius"]: l };
  const grip = !horizontal && drag && dismissible ? h(View, { key: "grip", style: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: c.line, marginTop: side === "bottom" ? theme.space.s : 0, marginBottom: side === "top" ? theme.space.s : 0 } }) : null;
  const head = h(View, { key: "head", style: { flexDirection: "row", alignItems: "center", gap: theme.space.xs, paddingLeft: pad + safe.left, paddingRight: theme.space.s + safe.right, paddingTop: (side === "bottom" ? theme.space.xs : theme.space.s) + (side === "bottom" ? 0 : safe.top), paddingBottom: theme.space.xs } },
    h(View, { style: { flex: 1 } }, typeof title === "string" ? h(Heading, { level: 3, numberOfLines: 1 }, title) : title),
    dismissible ? h(Pressable, { onPress: onClose, accessibilityRole: "button", accessibilityLabel: closeLabel, hitSlop: theme.space["2xs"],
      style: ({ pressed }) => ({ width: 36, height: 36, borderRadius: theme.radius.full, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? c.sunken : "transparent" }) },
      h(Text, { size: "xl", tone: "muted", style: { lineHeight: theme.text.xl + 2 } }, GLYPH.close)) : null);
  // Top and bottom drawers are dragged by this strip only. With the top drawer the handle is under the footer.
  const strip = (content, extra) => h(GestureDetector, { gesture: panel.pan, touchAction: "none", userSelect: "none" }, h(View, { collapsable: false, style: extra }, content));
  const body = [
    horizontal ? head : side === "bottom" ? strip([grip, head]) : head,
    h(Animated.ScrollView, { key: "body", style: { flexShrink: 1 }, keyboardShouldPersistTaps: "handled", contentContainerStyle: { paddingLeft: pad + safe.left, paddingRight: pad + safe.right, paddingTop: theme.space["2xs"], paddingBottom: footer ? theme.space.s : pad + (side === "top" ? 0 : safe.bottom), gap: theme.space.s } },
      h(InRow.Provider, { value: false }, typeof children === "string" ? h(Text, { tone: "muted" }, children) : children)),
    footer ? h(View, { key: "footer", style: { flexDirection: "row", justifyContent: "flex-end", gap: theme.space.xs, paddingHorizontal: pad, paddingTop: theme.space.s, paddingBottom: theme.space.m + (side === "top" ? 0 : safe.bottom), borderTopWidth: 1, borderTopColor: c.line } },
      h(InRow.Provider, { value: true }, footer)) : null,
    side === "top" && grip ? strip(grip, { paddingTop: theme.space.xs }) : null,
  ];
  const sheet = h(Animated.View, { accessibilityViewIsModal: true, accessibilityRole: web ? "dialog" : undefined, "aria-modal": true, accessibilityLabel: typeof title === "string" ? title : undefined, onAccessibilityEscape: close, onLayout: panel.onLayout, testID: "drawer-panel",
    style: flat({ position: "absolute", zIndex: 1, backgroundColor: c.surface, opacity: panel.extent ? 1 : 0, ...depth(theme.shadow.l) }, edge, panel.move, style) }, ...body);
  return inModal(h(View, { style: ROOT },
    horizontal ? h(GestureDetector, { gesture: panel.pan, touchAction: "pan-y", userSelect: "none" }, sheet) : sheet,
    h(Animated.View, { style: [FILL, { backgroundColor: c.overlay }, panel.dim] },
      h(Pressable, { onPress: close, accessible: dismissible, accessibilityLabel: closeLabel, accessibilityRole: "button", focusable: false, testID: "drawer-backdrop", style: flat(FILL, web && { cursor: "default" }) }))), { onRequestClose: close });
}

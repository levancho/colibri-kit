// SwipeRow and SwipeGroup for the gestures entry: the row follows the finger on the UI thread.
import { createContext, createElement as h, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text as NativeText, View } from "react-native";
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import { toneName } from "@colibri-kit/native-core/internal";
import { web, flat, GLYPH } from "@colibri-kit/native-core/internal";
import { FILL, NONE, SPRING, themed, useLatest, useStable } from "./shared.js";

const SwipeContext = createContext(null);
/** Wrap a list in it and at most one SwipeRow stays open: opening or dragging a row closes the previous one. */
export function SwipeGroup({ children }) {
  const open = useRef(null);
  const api = useMemo(() => ({
    claim(close) { if (open.current && open.current !== close) open.current(); open.current = close; },
    release(close) { if (open.current === close) open.current = null; },
  }), []);
  return h(SwipeContext.Provider, { value: api }, children);
}

const swipeStyles = themed((theme) => ({
  root: { overflow: "hidden" },
  content: { backgroundColor: theme.colors.surface },
  under: { ...FILL, flexDirection: "row" },
  underRight: { ...FILL, flexDirection: "row-reverse" },
  action: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2, paddingHorizontal: theme.space["2xs"] },
  label: { color: theme.colors.brandFg, fontSize: theme.text.xs, lineHeight: 16, fontWeight: "600" },
  pressed: { opacity: 0.7 },
  fg: theme.colors.brandFg, colors: theme.colors,
}));
const swipeColor = (action, colors) => (action.destructive ? colors.bad : action.tone === "neutral" || action.tone === "muted" ? colors.muted : colors[toneName(action.tone)] ?? colors.accent);
const Glyph = ({ icon, color, size }) => {
  if (icon == null || icon === false) return null;
  if (typeof icon === "function") return icon({ color, size });
  if (typeof icon !== "string") return icon;
  return h(NativeText, { allowFontScaling: false, "aria-hidden": true, style: { color, fontSize: size, lineHeight: Math.round(size * 1.25), fontWeight: "600", textAlign: "center" } }, GLYPH[icon] ?? icon);
};

// One action under the row. While the row is pulled past the full-swipe point (armed goes to 1) the outer action
// slides along with the row's edge and the others fade, so it is clear what letting go will do.
const SwipeAction = memo(function SwipeAction({ action, index, sign, width, x, armed, onPick, styles }) {
  const press = useCallback(() => onPick(action), [onPick, action]);
  const follow = useAnimatedStyle(() => {
    if (index > 0) return { opacity: 1 - armed.value };
    return { transform: [{ translateX: sign * armed.value * Math.max(0, Math.abs(x.value) - width) }] };
  }, [x, armed, index, sign, width]);
  return h(Animated.View, { style: [{ width }, follow] },
    h(Pressable, { onPress: press, testID: action.testID, accessibilityRole: "button", accessibilityLabel: action.label,
      style: ({ pressed }) => [styles.action, { backgroundColor: swipeColor(action, styles.colors) }, pressed && styles.pressed] },
      h(Glyph, { icon: action.icon, color: styles.fg, size: 20 }),
      action.label ? h(NativeText, { numberOfLines: 1, style: styles.label }, action.label) : null));
});

/**
 * A list row that slides sideways to reveal actions; it follows the finger on the UI thread.
 * Same props as the core SwipeRow. leftActions and rightActions: [{ label, icon, onPress, tone (accent | ok | warn |
 * bad | neutral), destructive, closeOnPress }]; the first of each list sits at the outer edge and is the one a full
 * swipe runs (fullSwipe, default true). Inside a SwipeGroup only one row is open.
 * The drag starts only after 10 points sideways and gives up after 12 points up or down, so a list keeps its
 * vertical scroll. Past the last action the row moves at a fifth of the finger's speed; past 60% of its width the
 * outer action snaps to the row's edge and letting go runs it.
 * Extra: onFullSwipeChange(armed) is called when the finger crosses that point, in either direction (a place for
 * haptics). Screen-reader users get the same actions through accessibilityActions, without swiping.
 */
export const SwipeRow = memo(function SwipeRow({ children, leftActions = NONE, rightActions = NONE, actionWidth = 76, fullSwipe = true, disabled = false, onOpenChange, onFullSwipeChange, accessibilityLabel, style, testID }) {
  const styles = swipeStyles(), group = useContext(SwipeContext);
  const [armedOnce, setArmedOnce] = useState(false), [side, setSide] = useState(null);
  const x = useSharedValue(0), start = useSharedValue(0), width = useSharedValue(0), armed = useSharedValue(0), past = useSharedValue(false);
  const live = useLatest({ leftActions, rightActions, onOpenChange, onFullSwipeChange, group, side }), alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  const leftOpen = leftActions.length * actionWidth, rightOpen = rightActions.length * actionWidth;

  // JavaScript side: called once per gesture, when it starts and when it ends.
  const rested = useStable((to) => {
    if (!alive.current) return;
    const now = live.current, next = to > 0 ? "left" : to < 0 ? "right" : null;
    if (next) now.group?.claim(close); else now.group?.release(close);
    if (next !== now.side) { setSide(next); now.onOpenChange?.(next); }
  });
  const close = useStable(() => { x.value = withSpring(0, { ...SPRING, overshootClamping: true }); rested(0); });
  const run = useStable((action) => { action.onPress?.(); if (action.closeOnPress !== false) close(); });
  const grabbed = useStable(() => { setArmedOnce(true); live.current.group?.claim(close); });
  const fullSwiped = useStable((sign) => { if (!alive.current) return; const now = live.current, action = (sign > 0 ? now.leftActions : now.rightActions)[0]; if (action) run(action); });
  const crossed = useStable((on) => live.current.onFullSwipeChange?.(on));

  const pan = usePanGesture(useMemo(() => {
    const limit = (value) => {
      "worklet";
      const open = value > 0 ? leftOpen : rightOpen;
      if (!open) return 0;
      const far = fullSwipe ? Math.max(open, width.value) : open, size = Math.abs(value);
      return Math.sign(value) * (size <= far ? size : far + (size - far) * 0.2);
    };
    return {
      // Only a clearly sideways drag is taken, so the list behind keeps its vertical scroll.
      activeOffsetX: [-10, 10], failOffsetY: [-12, 12], enabled: !disabled && (leftOpen > 0 || rightOpen > 0),
      onBegin: () => { "worklet"; scheduleOnRN(grabbed); }, // mounts the actions before the row has moved
      onActivate: () => { "worklet"; cancelAnimation(x); start.value = x.value; past.value = false; },
      onUpdate: (event) => {
        "worklet";
        const at = limit(start.value + event.translationX), open = at > 0 ? leftOpen : rightOpen;
        x.value = at;
        const beyond = fullSwipe && open > 0 && width.value > 0 && Math.abs(at) > width.value * 0.6;
        if (beyond !== past.value) { past.value = beyond; armed.value = withTiming(beyond ? 1 : 0, { duration: 160 }); scheduleOnRN(crossed, beyond); }
      },
      onDeactivate: (event) => {
        "worklet";
        const at = x.value, sign = Math.sign(at), size = Math.abs(at), open = sign > 0 ? leftOpen : rightOpen, speed = event.velocityX * sign;
        if (!sign || !open) { x.value = withSpring(0, { ...SPRING, overshootClamping: true }); scheduleOnRN(rested, 0); return; }
        if (fullSwipe && width.value > 0 && (size > width.value * 0.6 || (size > open && speed > 1500))) {
          armed.value = withTiming(1, { duration: 120 });
          x.value = withTiming(sign * width.value, { duration: 160, easing: Easing.out(Easing.quad) }, (finished) => { "worklet"; if (finished) scheduleOnRN(fullSwiped, sign); });
          scheduleOnRN(rested, sign * width.value);
          return;
        }
        past.value = false; armed.value = withTiming(0, { duration: 120 });
        const to = size + speed * 0.15 > open / 2 ? sign * open : 0;
        x.value = withSpring(to, { ...SPRING, velocity: event.velocityX, overshootClamping: to === 0 });
        scheduleOnRN(rested, to);
      },
    };
  }, [x, start, width, armed, past, leftOpen, rightOpen, fullSwipe, disabled, grabbed, rested, fullSwiped, crossed]));
  // A row that is closed again (by its group, a press or an action) is no longer armed.
  useEffect(() => { if (!side) { past.value = false; armed.value = withTiming(0, { duration: 120 }); } }, [side, past, armed]);

  const slide = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }), [x]);
  const showLeft = useAnimatedStyle(() => ({ opacity: x.value > 0 ? 1 : 0 }), [x]);
  const showRight = useAnimatedStyle(() => ({ opacity: x.value < 0 ? 1 : 0 }), [x]);
  const onLayout = useCallback((event) => { width.value = event.nativeEvent.layout.width; }, [width]);
  const names = useMemo(() => [...leftActions, ...rightActions].map((action) => ({ name: String(action.key ?? action.label), label: action.label })), [leftActions, rightActions]);
  const onAction = useCallback((event) => {
    const now = live.current, found = [...now.leftActions, ...now.rightActions].find((action) => String(action.key ?? action.label) === event.nativeEvent.actionName);
    if (found) run(found);
  }, [live, run]);
  const under = (actions, which) => (armedOnce && actions.length ? h(Animated.View, { key: which, style: [which === "left" ? styles.under : styles.underRight, { backgroundColor: swipeColor(actions[0], styles.colors), pointerEvents: side === which ? "auto" : "none" }, which === "left" ? showLeft : showRight] },
    actions.map((action, index) => h(SwipeAction, { key: action.key ?? action.label ?? index, action, index, sign: which === "left" ? 1 : -1, width: actionWidth, x, armed, onPick: run, styles }))) : null);
  return h(View, { onLayout, testID, style: flat(styles.root, style) },
    under(leftActions, "left"), under(rightActions, "right"),
    h(GestureDetector, { gesture: pan, touchAction: "pan-y", userSelect: "none" },
      h(Animated.View, { ...(web ? null : { accessible: true }), accessibilityLabel, accessibilityActions: names, onAccessibilityAction: onAction, style: [styles.content, slide] },
        children,
        side ? h(Pressable, { style: FILL, onPress: close, accessibilityLabel: "Close actions" }) : null)));
});

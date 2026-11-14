// Motion and scoped themes. Everything is built on React Native's own Animated: no gesture or animation library.
//
//   <Enter motion="slide-up" index={i}>…</Enter>            plays once when it mounts (index staggers a list)
//   <Presence visible={open} motion="scale">…</Presence>    animates in and out, unmounting after the exit
//   <MotionPressable effect="shrink" onPress={…}>…</MotionPressable>
//   <MotionLoop motion="pulse">…</MotionLoop>               a continuous loop: spin, pulse, bounce, ping, float
//   const shake = useMotion();  shake.play("shake")          one-shot attention animations, returns a Promise
//   <Collapse open={open}>…</Collapse>                       animates height
//   <ThemeScope hue={170} radius="sharp">…</ThemeScope>      re-themes one part of a screen
//
// Reduced motion: when the device asks for it (AccessibilityInfo), every helper skips straight to its end state.
// Not ported from the web kit: blur (React Native has no blur filter) and shimmer (it needs a gradient).
import { createElement as h, forwardRef, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AccessibilityInfo, Animated, Easing, Pressable, View } from "react-native";
import { ColibriProvider, useTheme } from "./provider.js";
import { web, flat } from "./internal.js";

// Opacity and transforms can run on the native thread; react-native-web has no native driver.
const driver = !web;

// ---------------------------------------------------------------- reduced motion
let reduced = false, watching = false;
const watchers = new Set();
const setReduced = (value) => { if (!!value !== reduced) { reduced = !!value; watchers.forEach((notify) => notify()); } };
function subscribe(notify) {
  if (!watching) {
    watching = true;
    try {
      AccessibilityInfo.isReduceMotionEnabled?.()?.then(setReduced, () => {});
      AccessibilityInfo.addEventListener?.("reduceMotionChanged", setReduced);
    } catch { /* a platform without the setting: keep animating */ }
  }
  watchers.add(notify);
  return () => watchers.delete(notify);
}
const snapshot = () => reduced;
/** true while the device asks for reduced motion. Updates when the setting changes. */
export const useReducedMotion = () => useSyncExternalStore(subscribe, snapshot, snapshot);

// ---------------------------------------------------------------- enter and exit presets
const range = (progress, from, to) => progress.interpolate({ inputRange: [0, 1], outputRange: [from, to] });
const PRESET = {
  fade: () => [],
  "slide-up": (p, d) => [{ translateY: range(p, d, 0) }],
  "slide-down": (p, d) => [{ translateY: range(p, -d, 0) }],
  "slide-left": (p, d) => [{ translateX: range(p, d, 0) }],
  "slide-right": (p, d) => [{ translateX: range(p, -d, 0) }],
  scale: (p) => [{ scale: range(p, 0.92, 1) }],
  zoom: (p) => [{ scale: range(p, 0.5, 1) }],
  pop: (p) => [{ scale: range(p, 0.8, 1) }],
  flip: (p) => [{ perspective: 600 }, { rotateX: range(p, "80deg", "0deg") }],
};
/** The names Enter and Presence accept as motion. */
export const ENTER_MOTIONS = Object.keys(PRESET);
const easeIn = (motion) => (motion === "pop" ? Easing.out(Easing.back(1.8)) : Easing.out(Easing.cubic));
const presetStyle = (progress, motion, distance) => ({
  opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: "clamp" }),
  transform: (PRESET[motion] ?? PRESET.fade)(progress, distance),
});

/**
 * Plays an entrance once, when it mounts. motion: fade | slide-up | slide-down | slide-left | slide-right | scale |
 * zoom | pop | flip. delay is in ms; index × stagger is added to it, so a list can cascade. Remount (change key) to replay.
 */
export function Enter({ motion = "fade", delay = 0, index = 0, stagger = 40, duration = 240, distance = 12, onEnd, style, children, ...rest }) {
  const isReduced = useReducedMotion(), progress = useRef(new Animated.Value(0)).current, end = useRef(onEnd);
  end.current = onEnd;
  useEffect(() => {
    if (isReduced) { progress.setValue(1); end.current?.(); return undefined; }
    const animation = Animated.timing(progress, { toValue: 1, duration, delay: delay + index * stagger, easing: easeIn(motion), useNativeDriver: driver });
    animation.start(({ finished }) => { if (finished) end.current?.(); });
    return () => animation.stop();
    // The entrance belongs to the mount: later prop changes do not replay it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReduced, progress]);
  const animated = useMemo(() => presetStyle(progress, motion, distance), [progress, motion, distance]);
  return h(Animated.View, { style: flat(style, animated), ...rest }, children);
}

/**
 * Shows and hides its children with an animation. While visible turns false the children stay mounted (and cannot be
 * pressed or read by a screen reader) until the exit has finished; then they unmount, unless keepMounted is set.
 * appear also animates the first render.
 */
export function Presence({ visible = true, motion = "fade", duration = 220, exitDuration, distance = 12, appear = false, keepMounted = false, onExited, style, children, ...rest }) {
  const isReduced = useReducedMotion(), [mounted, setMounted] = useState(visible), first = useRef(true), exited = useRef(onExited);
  const progress = useRef(new Animated.Value(visible && !appear ? 1 : 0)).current;
  exited.current = onExited;
  useEffect(() => {
    const initial = first.current;
    first.current = false;
    if (initial && !(appear && visible)) return undefined;
    if (visible) setMounted(true);
    const leave = () => { setMounted(false); exited.current?.(); };
    if (isReduced) { progress.setValue(visible ? 1 : 0); if (!visible) leave(); return undefined; }
    const animation = Animated.timing(progress, { toValue: visible ? 1 : 0, duration: visible ? duration : exitDuration ?? Math.round(duration * 0.7),
      easing: visible ? easeIn(motion) : Easing.in(Easing.cubic), useNativeDriver: driver });
    animation.start(({ finished }) => { if (finished && !visible) leave(); });
    return () => animation.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, isReduced, progress]);
  const animated = useMemo(() => presetStyle(progress, motion, distance), [progress, motion, distance]);
  const shown = visible || mounted;
  if (!shown && !keepMounted) return null;
  return h(Animated.View, { accessibilityElementsHidden: !visible, importantForAccessibility: visible ? "auto" : "no-hide-descendants", "aria-hidden": !visible,
    style: flat(style, animated, !visible && { pointerEvents: "none" }, !shown && { display: "none" }), ...rest }, children);
}

// ---------------------------------------------------------------- press feedback
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const EFFECT = {
  shrink: (a, amount = 0.96) => ({ transform: [{ scale: range(a, 1, amount) }] }),
  grow: (a, amount = 1.04) => ({ transform: [{ scale: range(a, 1, amount) }] }),
  lift: (a, amount = 4) => ({ transform: [{ translateY: range(a, 0, -amount) }] }),
  tilt: (a, amount = 2) => ({ transform: [{ rotate: range(a, "0deg", `${amount}deg`) }] }),
  dim: (a, amount = 0.6) => ({ opacity: range(a, 1, amount) }),
};
/** The names MotionPressable accepts as effect. */
export const PRESS_EFFECTS = Object.keys(EFFECT);

/**
 * A Pressable that answers a touch with a spring. effect: shrink | grow | lift | tilt | dim; amount tunes it (the
 * scale, the distance in points, the angle in degrees or the opacity). A mouse pointer triggers it on hover too.
 * style is a plain style, not a function of the pressed state. It is a button unless accessibilityRole says otherwise.
 */
export const MotionPressable = forwardRef(function MotionPressable({ effect = "shrink", amount, disabled = false, onPressIn, onPressOut, onHoverIn, onHoverOut, style, children, ...rest }, ref) {
  const isReduced = useReducedMotion(), active = useRef(new Animated.Value(0)).current, held = useRef({ pressed: false, hovered: false });
  const settle = useCallback((change) => {
    Object.assign(held.current, change);
    const toValue = held.current.pressed || held.current.hovered ? 1 : 0;
    if (isReduced) { active.setValue(0); return; }
    Animated.spring(active, { toValue, speed: 40, bounciness: toValue ? 0 : 8, useNativeDriver: driver }).start();
  }, [active, isReduced]);
  const animated = useMemo(() => (EFFECT[effect] ?? EFFECT.shrink)(active, amount), [active, effect, amount]);
  return h(AnimatedPressable, { ref, disabled, accessibilityRole: "button", accessibilityState: { disabled }, "aria-disabled": disabled,
    onPressIn: (event) => { settle({ pressed: true }); onPressIn?.(event); }, onPressOut: (event) => { settle({ pressed: false }); onPressOut?.(event); },
    onHoverIn: (event) => { settle({ hovered: true }); onHoverIn?.(event); }, onHoverOut: (event) => { settle({ hovered: false }); onHoverOut?.(event); },
    style: flat(style, disabled && { opacity: 0.5 }, animated), ...rest }, children);
});

// ---------------------------------------------------------------- loops
const LOOP = {
  spin: { duration: 1000, easing: Easing.linear, style: (p) => ({ transform: [{ rotate: range(p, "0deg", "360deg") }] }) },
  pulse: { duration: 1600, style: (p) => ({ opacity: p.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.35, 1] }) }) },
  bounce: { duration: 900, style: (p) => ({ transform: [{ translateY: p.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -8, 0] }) }] }) },
  ping: { duration: 1400, easing: Easing.out(Easing.cubic), style: (p) => ({ opacity: p.interpolate({ inputRange: [0, 0.8, 1], outputRange: [0.9, 0, 0] }), transform: [{ scale: range(p, 1, 2.2) }] }) },
  float: { duration: 2800, style: (p) => ({ transform: [{ translateY: p.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -5, 0] }) }] }) },
};
/** The names MotionLoop accepts as motion. */
export const LOOP_MOTIONS = Object.keys(LOOP);

/** Repeats an animation for as long as it is mounted: spin | pulse | bounce | ping | float. paused (or reduced motion) holds it still. */
export function MotionLoop({ motion = "pulse", duration, paused = false, style, children, ...rest }) {
  const isReduced = useReducedMotion(), progress = useRef(new Animated.Value(0)).current, spec = LOOP[motion] ?? LOOP.pulse, still = paused || isReduced;
  useEffect(() => {
    progress.setValue(0);
    if (still) return undefined;
    const animation = Animated.loop(Animated.timing(progress, { toValue: 1, duration: duration ?? spec.duration, easing: spec.easing ?? Easing.inOut(Easing.quad), useNativeDriver: driver }));
    animation.start();
    return () => animation.stop();
  }, [progress, still, duration, spec]);
  const animated = useMemo(() => spec.style(progress), [spec, progress]);
  return h(Animated.View, { style: flat(style, animated), ...rest }, children);
}

// ---------------------------------------------------------------- one-shot attention animations
// Each one is a list of keyframes per animated value; every value returns to rest (x 0, y 0, scale 1, rotate 0, opacity 1).
const PLAY = {
  shake: { duration: 420, x: [-8, 8, -6, 6, -3, 0] },
  bounce: { duration: 520, y: [-14, 0, -6, 0] },
  pulse: { duration: 360, scale: [1.06, 1] },
  pop: { duration: 300, scale: [1.16, 1] },
  flash: { duration: 520, opacity: [0.25, 1, 0.25, 1] },
  heartbeat: { duration: 640, scale: [1.12, 1, 1.12, 1] },
  tada: { duration: 640, scale: [0.94, 1.08, 1.08, 1], rotate: [-3, 3, -3, 0] },
  wiggle: { duration: 480, rotate: [-5, 5, -3, 3, 0] },
};
/** The names useMotion().play accepts. */
export const PLAY_MOTIONS = Object.keys(PLAY);
const REST = { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 };

/**
 * One-shot attention animations, played from code:
 *
 *   const motion = useMotion();
 *   <Animated.View style={motion.style}>…</Animated.View>
 *   motion.play("shake").then(() => …)      // shake | bounce | pulse | pop | flash | heartbeat | tada | wiggle
 *
 * play(name, { duration }) restarts the animation and resolves with true when it ran to the end (false when another
 * play interrupted it). With reduced motion it resolves at once without moving anything.
 */
export function useMotion() {
  const isReduced = useReducedMotion(), running = useRef(null);
  const values = useRef(null);
  values.current ??= Object.fromEntries(Object.entries(REST).map(([name, rest]) => [name, new Animated.Value(rest)]));
  const v = values.current;
  const style = useMemo(() => ({ opacity: v.opacity, transform: [{ translateX: v.x }, { translateY: v.y }, { scale: v.scale },
    { rotate: v.rotate.interpolate({ inputRange: [-360, 360], outputRange: ["-360deg", "360deg"] }) }] }), [v]);
  const stop = useCallback(() => {
    running.current?.stop();
    running.current = null;
    for (const [name, rest] of Object.entries(REST)) v[name].setValue(rest);
  }, [v]);
  const play = useCallback((name, options = {}) => new Promise((resolve) => {
    const spec = PLAY[name];
    stop();
    if (!spec || isReduced) { resolve(!!spec); return; }
    const duration = options.duration ?? spec.duration;
    const tracks = Object.keys(REST).filter((key) => spec[key]).map((key) => Animated.sequence(spec[key].map((toValue) =>
      Animated.timing(v[key], { toValue, duration: duration / spec[key].length, easing: Easing.inOut(Easing.quad), useNativeDriver: driver }))));
    const animation = Animated.parallel(tracks);
    running.current = animation;
    animation.start(({ finished }) => { if (running.current === animation) running.current = null; resolve(finished); });
  }), [isReduced, stop, v]);
  useEffect(() => () => running.current?.stop(), []);
  return useMemo(() => ({ style, play, stop }), [style, play, stop]);
}

// ---------------------------------------------------------------- height
/**
 * Opens and closes its children by animating height (and fading them). The children stay mounted while closed but are
 * hidden from touch and from screen readers. Give the control that toggles it aria-expanded / accessibilityState.expanded.
 */
export function Collapse({ open = false, duration = 220, onEnd, style, children, ...rest }) {
  const isReduced = useReducedMotion(), progress = useRef(new Animated.Value(open ? 1 : 0)).current, first = useRef(true), end = useRef(onEnd);
  // settled: the animation is over, so an open panel can size itself (height auto) and a closed one can leave the layout.
  const [height, setHeight] = useState(0), [settled, setSettled] = useState(true);
  end.current = onEnd;
  useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    const finish = () => { setSettled(true); end.current?.(open); };
    if (isReduced) { progress.setValue(open ? 1 : 0); finish(); return undefined; }
    setSettled(false);
    // Height is a layout property, so this one cannot use the native driver.
    const animation = Animated.timing(progress, { toValue: open ? 1 : 0, duration, easing: Easing.inOut(Easing.cubic), useNativeDriver: false });
    animation.start(({ finished }) => { if (finished) finish(); });
    return () => animation.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isReduced, progress]);
  const gone = settled && !open;
  const box = settled ? (open ? null : { display: "none" }) : { height: range(progress, 0, height), opacity: progress };
  return h(Animated.View, { accessibilityElementsHidden: !open, importantForAccessibility: open ? "auto" : "no-hide-descendants", "aria-hidden": !open,
    style: flat({ overflow: "hidden" }, style, !open && { pointerEvents: "none" }, box), ...rest },
    // The inner view keeps its natural height while the outer one is clipped, so it can be measured mid-animation.
    h(View, { style: { flexShrink: 0 }, onLayout: gone ? undefined : (event) => { const next = event.nativeEvent.layout.height; if (next > 0 && Math.abs(next - height) > 0.5) setHeight(next); } }, children));
}

// ---------------------------------------------------------------- scoped theme
const radiusName = (theme) => (theme.radius.s <= 3 ? "sharp" : theme.radius.s >= 12 ? "round" : "soft");
function ScopeSurface({ padded, style, children, rest }) {
  const theme = useTheme();
  return h(View, { style: flat({ padding: padded ? theme.space.m : 0, gap: theme.space.s, borderRadius: theme.radius.l, borderWidth: 1, borderColor: theme.colors.line, backgroundColor: theme.colors.bg }, style), ...rest }, children);
}
/**
 * Re-themes the part of the screen inside it. Unlike a second ColibriProvider it starts from the theme around it, so
 * you only name what changes: hue, chroma, radius ("sharp" | "soft" | "round") or scheme ("light" | "dark").
 * surface paints the scope's own background in a bordered box (needed when the scheme differs from the page);
 * padded and style apply to that box.
 */
export function ThemeScope({ hue, chroma, radius, scheme, surface = false, padded = true, style, children, ...rest }) {
  const parent = useTheme();
  return h(ColibriProvider, { hue: hue ?? parent.hue, chroma: chroma ?? parent.chroma, radius: radius ?? radiusName(parent), scheme: scheme ?? parent.scheme },
    surface ? h(ScopeSurface, { padded, style, rest }, children) : children);
}

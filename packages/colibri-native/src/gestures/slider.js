// Slider for the gestures entry: the thumbs and the filled part of the track follow the finger on the UI thread.
import { createElement as h, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { GestureDetector, useCompetingGestures, usePanGesture, useTapGesture } from "react-native-gesture-handler";
import { useTheme } from "../provider.js";
import { toneName } from "../theme.js";
import { web, depth, flat } from "../internal.js";
import { clamp, decimals, keyOf, snapTo, useLatest, useStable } from "./shared.js";

const THUMB = 24;

// One thumb. Its place comes from a shared value (a fraction of the rail), so it moves without a render; the
// accessibility values come from props, which change only when the stepped value does.
function Thumb({ index, at, width, active, name, value, from, upTo, text, disabled, color, soft, surface, shadow, testID, onStep, onKey }) {
  const [focused, setFocused] = useState(false);
  const place = useAnimatedStyle(() => ({ transform: [{ translateX: at.value * width.value }], zIndex: active.value === index ? 2 : 1 }), [at, width, active, index]);
  const halo = useAnimatedStyle(() => ({ opacity: withTiming(active.value === index ? 1 : 0, { duration: 120 }), transform: [{ scale: withTiming(active.value === index ? 1 : 0.6, { duration: 120 }) }] }), [active, index]);
  return h(Animated.View, { testID, accessible: true, accessibilityRole: "adjustable", accessibilityLabel: name,
    accessibilityValue: { min: from, max: upTo, now: value, text }, "aria-valuemin": from, "aria-valuemax": upTo, "aria-valuenow": value, "aria-valuetext": text,
    accessibilityState: { disabled }, "aria-disabled": disabled, "aria-orientation": "horizontal",
    accessibilityActions: [{ name: "increment" }, { name: "decrement" }], onAccessibilityAction: (event) => onStep(index, event.nativeEvent.actionName === "increment" ? 1 : -1),
    ...(web ? { tabIndex: disabled ? -1 : 0, onKeyDown: (event) => onKey(index, event), onFocus: () => setFocused(true), onBlur: () => setFocused(false) } : null),
    style: [{ position: "absolute", left: 0, top: "50%", width: THUMB, height: THUMB, marginTop: -THUMB / 2, marginLeft: -THUMB / 2, alignItems: "center", justifyContent: "center" }, web && { outlineStyle: "none" }, place] },
    h(Animated.View, { style: [{ position: "absolute", top: -7, right: -7, bottom: -7, left: -7, borderRadius: 999, backgroundColor: soft }, focused ? null : halo] }),
    h(View, { style: { width: THUMB, height: THUMB, borderRadius: THUMB / 2, borderWidth: 2, borderColor: color, backgroundColor: surface, ...shadow } }));
}

/**
 * A slider whose thumb follows the finger on the UI thread. Same props as the core Slider: value is a number, or
 * [low, high] for a range (range is inferred from an array); onChange fires while dragging, each time the stepped
 * value changes (not on every frame), and onChangeEnd once when the finger lifts or after a key or screen-reader
 * step. min, max, step, disabled, tone, label, thumbLabels, formatValue.
 * A tap on the track moves the nearest thumb there. A drag starts after 4 points sideways and gives up after 12
 * points up or down, so a slider inside a scrolling screen never steals the scroll. In a range the thumbs stop at
 * each other.
 * Each thumb is "adjustable": it answers the increment and decrement accessibility actions and, on the web, the
 * arrow keys, Page Up/Down, Home and End.
 */
export function Slider({ value, defaultValue, onChange, onChangeEnd, min = 0, max = 100, step = 1, range, disabled = false, tone = "accent", label, thumbLabels, formatValue, style, testID }) {
  const theme = useTheme(), c = theme.colors, color = c[toneName(tone)] ?? c.accent, soft = (theme.tones[toneName(tone)] ?? theme.tones.accent).soft;
  const isRange = range ?? Array.isArray(value ?? defaultValue), controlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue ?? (isRange ? [min, max] : min)), current = controlled ? value : inner;
  const values = (isRange ? (Array.isArray(current) ? current : [min, max]) : [Array.isArray(current) ? current[0] : current]).map((v) => clamp(Number.isFinite(+v) ? +v : min, min, max));
  const span = max - min || 1, places = Math.min(12, Math.max(decimals(step > 0 ? step : 1), decimals(min)));
  const text = (v) => (formatValue ? String(formatValue(v)) : String(v));

  // Fractions of the rail, 0 to 1. In a single slider lo stays at 0 and hi is the thumb.
  const lo = useSharedValue(isRange ? (values[0] - min) / span : 0), hi = useSharedValue((values[isRange ? 1 : 0] - min) / span);
  const width = useSharedValue(0), active = useSharedValue(-1), grab = useSharedValue(0), sent = useSharedValue(0);
  const dragging = useRef(false), latest = useRef(values), [tick, setTick] = useState(0);
  if (!dragging.current) latest.current = values;
  const live = useLatest({ isRange, controlled, onChange, onChangeEnd, min, max, step, places, disabled });
  // Props move the thumbs, except the one in the hand (its own echo would only repeat what the finger did).
  const first = values[0], second = values[1];
  useEffect(() => {
    if (dragging.current) return;
    lo.value = isRange ? (first - min) / span : 0; hi.value = ((isRange ? second : first) - min) / span;
  }, [first, second, isRange, min, span, lo, hi, tick]);

  const out = (list) => (live.current.isRange ? list : list[0]);
  const emit = (list) => { latest.current = list; if (!live.current.controlled) setInner(out(list)); live.current.onChange?.(out(list)); };
  // From the UI thread: once when a drag starts, each time the stepped value changes, and once at the end.
  const began = useStable(() => { dragging.current = true; });
  const changed = useStable((index, next) => { const list = latest.current.slice(); if (list[index] === next) return; list[index] = next; emit(list); });
  const ended = useStable(() => { dragging.current = false; live.current.onChangeEnd?.(out(latest.current)); setTick((n) => n + 1); }); // the tick puts the thumb back on the value if the parent did not take the change
  const nudge = useCallback((index, amount) => {
    const now = live.current, list = latest.current.slice();
    if (now.disabled) return;
    let next = snapTo(list[index] + amount, now.min, now.max, now.step, now.places);
    if (now.isRange) next = index === 0 ? Math.min(next, list[1]) : Math.max(next, list[0]);
    if (next === list[index]) return;
    list[index] = next; emit(list); now.onChangeEnd?.(out(list));
  }, [live]); // eslint-disable-line react-hooks/exhaustive-deps
  const onStep = useCallback((index, direction) => nudge(index, direction * live.current.step), [nudge, live]);
  const onKey = useCallback((index, event) => {
    const now = live.current, total = now.max - now.min, big = Math.max(now.step, total / 10);
    const moves = { ArrowRight: now.step, ArrowUp: now.step, ArrowLeft: -now.step, ArrowDown: -now.step, PageUp: big, PageDown: -big, Home: -total, End: total };
    const key = keyOf(event);
    if (!(key in moves)) return;
    event.preventDefault?.(); nudge(index, moves[key]);
  }, [nudge, live]);

  const gesture = useMemo(() => {
    // x is measured from the left edge of the rail. Moves the active thumb to the nearest step.
    const moveTo = (x) => {
      "worklet";
      const index = active.value, rail = width.value || 1;
      if (index < 0) return;
      let next = snapTo(min + clamp((x + grab.value) / rail, 0, 1) * span, min, max, step, places);
      if (isRange) next = index === 0 ? Math.min(next, min + hi.value * span) : Math.max(next, min + lo.value * span);
      const at = (next - min) / span;
      if (isRange && index === 0) lo.value = at; else hi.value = at;
      if (next !== sent.value) { sent.value = next; scheduleOnRN(changed, index, next); }
    };
    // Picks the thumb nearest to x. A touch on a thumb keeps its offset from the thumb's centre, so the thumb does not jump.
    const pick = (x) => {
      "worklet";
      const rail = width.value || 1, low = lo.value * rail, high = hi.value * rail;
      const index = !isRange ? 0 : Math.abs(x - low) === Math.abs(x - high) ? (x < low ? 0 : 1) : Math.abs(x - low) < Math.abs(x - high) ? 0 : 1;
      const centre = index === 0 && isRange ? low : high;
      active.value = index; grab.value = Math.abs(centre - x) <= THUMB / 2 + 6 ? centre - x : 0;
      sent.value = min + (index === 0 && isRange ? lo.value : hi.value) * span;
      scheduleOnRN(began);
    };
    const done = () => { "worklet"; if (active.value < 0) return; active.value = -1; scheduleOnRN(ended); };
    // event.x is measured from the detector's view, whose rail starts half a thumb in.
    return {
      pan: {
        activeOffsetX: [-4, 4], failOffsetY: [-12, 12], enabled: !disabled,
        onActivate: (event) => { "worklet"; pick(event.x - THUMB / 2 - event.translationX); moveTo(event.x - THUMB / 2); },
        onUpdate: (event) => { "worklet"; moveTo(event.x - THUMB / 2); },
        onDeactivate: () => { "worklet"; done(); },
      },
      tap: {
        maxDuration: 100000, enabled: !disabled,
        onDeactivate: (event) => { "worklet"; if (event.canceled) return; pick(event.x - THUMB / 2); grab.value = 0; moveTo(event.x - THUMB / 2); done(); },
      },
    };
  }, [lo, hi, width, active, grab, sent, min, max, span, step, places, isRange, disabled, began, changed, ended]);
  const pan = usePanGesture(gesture.pan), tap = useTapGesture(gesture.tap), either = useCompetingGestures(pan, tap);

  // The filled part: a bar as wide as the rail, moved and scaled into place (no width animation).
  const fill = useAnimatedStyle(() => {
    const rail = width.value, part = Math.max(0, hi.value - lo.value);
    return { opacity: rail ? 1 : 0, transform: [{ translateX: lo.value * rail - (rail * (1 - part)) / 2 }, { scaleX: part }] };
  }, [lo, hi, width]);
  const onLayout = useCallback((event) => { width.value = event.nativeEvent.layout.width; }, [width]);
  const names = thumbLabels ?? ["Minimum", "Maximum"], shadow = depth(theme.shadow.m);
  return h(GestureDetector, { gesture: either, touchAction: "pan-y", userSelect: "none" },
    h(View, { testID, style: flat({ height: theme.touch, justifyContent: "center", opacity: disabled ? 0.5 : 1 }, web && { cursor: disabled ? "auto" : "pointer" }, style) },
      h(View, { onLayout, collapsable: false, style: { height: theme.touch, marginHorizontal: THUMB / 2, justifyContent: "center" } },
        h(View, { style: { height: 6, borderRadius: 3, backgroundColor: c.line, overflow: "hidden" } },
          h(Animated.View, { style: [{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: color }, fill] })),
        values.map((v, index) => h(Thumb, { key: index, index, at: isRange && index === 0 ? lo : hi, width, active,
          name: isRange ? (label ? `${label}, ${names[index]}` : names[index]) : label, value: v, text: text(v),
          from: isRange && index === 1 ? values[0] : min, upTo: isRange && index === 0 ? values[1] : max,
          disabled, color, soft, surface: c.surface, shadow, testID: testID ? `${testID}-thumb-${index}` : undefined, onStep, onKey })))));
}

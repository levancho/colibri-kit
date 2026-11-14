// Pieces every chart of the svg entry uses: series colours, the measured frame, the empty state, the tooltip,
// reduce-motion. Not part of the public API.
import { createElement as h, useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Text as NativeText, View } from "react-native";
import { oklch } from "../color.js";
import { toneName } from "../theme.js";
import { useTheme } from "../provider.js";
import { Text } from "../components.js";
import { depth, flat, web } from "../internal.js";

// The same series colours as the bar charts of the main entry (Chart in conversation.js, the web kit's
// --ui-chart-1..5): the accent, then four companions turned from the theme hue. Past five, the hues repeat
// lighter or darker so that a pie with many slices still has distinct neighbours.
const STEPS = [[0, 0.5, 0.72], [150, 0.64, 0.62], [60, 0.56, 0.8], [215, 0.42, 0.52], [300, 0.7, 0.86]];
export function seriesColors(theme, count = STEPS.length) {
  const dark = theme.scheme === "dark";
  return Array.from({ length: Math.max(count, STEPS.length) }, (_, index) => {
    const [turn, light, darkL] = STEPS[index % STEPS.length], round = Math.floor(index / STEPS.length);
    if (index === 0) return theme.colors.accent;
    const shift = round ? (round % 2 ? 1 : -1) * 0.12 * Math.ceil(round / 2) * (dark ? -1 : 1) : 0;
    return oklch(Math.min(0.92, Math.max(0.3, (dark ? darkL : light) + shift)), (index % STEPS.length === 0 ? theme.chroma : Math.min(theme.chroma, 0.17) * 0.85) * (round ? 0.8 : 1), (theme.hue + turn) % 360);
  });
}
/** accent | ok | warn | bad (or success, warning, danger) | muted → a theme colour, else undefined. */
export const toneColor = (theme, tone) => (tone === "muted" ? theme.colors.muted : theme.colors[toneName(tone)]);

/** The text style of axis labels and other small numbers. */
export const smallText = (theme) => ({ fontSize: theme.text.xs, lineHeight: 16, color: theme.colors.muted, fontVariant: ["tabular-nums"] });
/** A fair guess at the width of a label in the xs size, for laying out axes before anything is measured. */
export const textWidth = (text, size = 12) => Math.ceil(String(text).length * size * 0.58) + 2;

/** undefined until the device has answered, then true or false; follows changes. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(undefined);
  useEffect(() => {
    let alive = true;
    const answer = AccessibilityInfo.isReduceMotionEnabled?.();
    if (answer?.then) answer.then((on) => { if (alive) setReduced(!!on); }).catch(() => { if (alive) setReduced(false); });
    else setReduced(false);
    const subscription = AccessibilityInfo.addEventListener?.("reduceMotionChanged", (on) => setReduced(!!on));
    return () => { alive = false; subscription?.remove?.(); };
  }, []);
  return reduced;
}

/** The width of a view, from onLayout: [width, onLayout]. 0 until the first layout. */
export function useWidth() {
  const [width, setWidth] = useState(0);
  const onLayout = useCallback((event) => { const next = Math.round(event.nativeEvent.layout.width); setWidth((now) => (now === next ? now : next)); }, []);
  return [width, onLayout];
}

/**
 * A 0 → 1 Animated.Value that runs once, when `ready` first becomes true: the draw-in of a chart.
 * It jumps straight to 1 when animation is off or the device asks for reduced motion.
 */
export function useDrawIn(animate, ready, duration = 300) {
  const reduced = useReducedMotion(), progress = useRef(new Animated.Value(animate ? 0 : 1)).current, started = useRef(!animate);
  useEffect(() => {
    if (started.current || !ready || reduced === undefined) return undefined;
    started.current = true;
    if (reduced) { progress.setValue(1); return undefined; }
    const run = Animated.timing(progress, { toValue: 1, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    run.start();
    return () => { run.stop(); progress.setValue(1); };
  }, [ready, reduced, progress, duration]);
  return progress;
}

/** The dashed box shown in place of a plot that has nothing to draw. */
export function EmptyPlot({ height, text }) {
  const theme = useTheme();
  return h(View, { style: { height, alignItems: "center", justifyContent: "center", paddingHorizontal: theme.space.s, borderRadius: theme.radius.m, borderWidth: 1, borderStyle: "dashed", borderColor: theme.colors.line, backgroundColor: theme.colors.sunken } },
    h(Text, { size: "sm", tone: "muted", align: "center" }, text));
}

/**
 * The value card that follows the crosshair. rows: [{ color, label, value }]. It sits beside x (on the side with
 * more room) so it never covers the point it describes, and it ignores touches.
 */
export function Tooltip({ title, rows, x, top = 0, room, testID }) {
  const theme = useTheme(), c = theme.colors, [size, setSize] = useState(0);
  const onLayout = useCallback((event) => { const next = Math.ceil(event.nativeEvent.layout.width); setSize((now) => (now === next ? now : next)); }, []);
  const width = size || 120, right = x + 12 + width <= room, left = right || x - 12 - width < 0 ? Math.min(Math.max(0, room - width), x + 12) : x - 12 - width;
  return h(View, { testID, onLayout, pointerEvents: "none", accessibilityLiveRegion: "polite",
    style: flat({ position: "absolute", top, left, opacity: size ? 1 : 0, maxWidth: Math.max(120, room * 0.7), paddingHorizontal: theme.space.xs + 2, paddingVertical: theme.space["2xs"] + 2, gap: 2, borderRadius: theme.radius.s, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface }, depth(theme.shadow.m), web && { userSelect: "none" }) },
    title != null && title !== "" ? h(NativeText, { numberOfLines: 1, style: { fontSize: theme.text.xs, lineHeight: 16, fontWeight: "600", color: c.fg } }, title) : null,
    rows.map((row, index) => h(View, { key: index, style: { flexDirection: "row", alignItems: "center", gap: theme.space["2xs"] + 2 } },
      row.color ? h(View, { style: { width: 8, height: 8, borderRadius: 4, backgroundColor: row.color } }) : null,
      row.label != null ? h(NativeText, { numberOfLines: 1, style: { flexShrink: 1, fontSize: theme.text.xs, lineHeight: 16, color: c.muted } }, row.label) : null,
      h(NativeText, { style: { marginLeft: "auto", paddingLeft: theme.space["2xs"], fontSize: theme.text.xs, lineHeight: 16, fontWeight: "600", color: c.fg, fontVariant: ["tabular-nums"] } }, row.value))));
}

/**
 * Touch tracking for a plot: press or drag to pick a point, by index. Returns [active, handlers, set].
 * - pick(x, y) turns a position inside the overlay into an index (or null).
 * - A tap on the point that was already picked clears it; lifting the finger keeps the pick.
 * - Once the finger moves sideways the chart keeps the touch, so a ScrollView around it does not start to scroll;
 *   a vertical drag is given up to the ScrollView.
 * Controlled with value + onChange, else it keeps its own state.
 */
export function useScrub({ pick, value, onChange, enabled = true }) {
  const [own, setOwn] = useState(null), active = value !== undefined ? value : own;
  const touch = useRef(null), latest = useRef({}); latest.current = { pick, onChange, active, controlled: value !== undefined };
  const set = useCallback((next) => {
    const now = latest.current;
    if (next === now.active) return;
    if (!now.controlled) setOwn(next);
    now.onChange?.(next);
  }, []);
  const [handlers] = useState(() => {
    // locationX is relative to the view that was hit; later moves are placed from the page position instead,
    // which stays right when the finger leaves the overlay.
    const at = (event) => { const e = event.nativeEvent, t = touch.current; return { x: t.x + (e.pageX - t.pageX), y: t.y + (e.pageY - t.pageY) }; };
    return {
      onStartShouldSetResponder: () => true,
      onResponderTerminationRequest: () => !touch.current?.locked,
      onResponderGrant: (event) => {
        const e = event.nativeEvent;
        touch.current = { x: e.locationX, y: e.locationY, pageX: e.pageX, pageY: e.pageY, before: latest.current.active, moved: false, locked: false };
        set(latest.current.pick(e.locationX, e.locationY));
      },
      onResponderMove: (event) => {
        const t = touch.current; if (!t) return;
        const e = event.nativeEvent, dx = Math.abs(e.pageX - t.pageX), dy = Math.abs(e.pageY - t.pageY);
        if (dx > 6 || dy > 6) t.moved = true;
        if (dx > 8 && dx > dy) t.locked = true;
        const point = at(event); set(latest.current.pick(point.x, point.y));
      },
      onResponderRelease: (event) => {
        const t = touch.current; if (!t) return;
        const point = at(event), index = latest.current.pick(point.x, point.y);
        touch.current = null;
        if (!t.moved && index === t.before) set(null);
      },
      onResponderTerminate: () => { touch.current = null; },
    };
  });
  return [active, enabled ? handlers : null, set];
}

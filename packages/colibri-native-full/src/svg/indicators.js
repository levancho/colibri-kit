// Sparkline, ProgressRing and Gauge: one number (or one short trend) at a glance.
import { createElement as h, useEffect, useId, useMemo, useRef } from "react";
import { Animated, Easing, Text as NativeText, View } from "react-native";
import { Circle, Defs, LinearGradient, Path, Stop, Svg } from "react-native-svg";
import { useTheme } from "@colibri-kit/native-core";
import { flat, web } from "@colibri-kit/native-core/internal";
import { arcPath, areaPath, clamp, finite, formatNumber, linePath, linear, pointX, polar, runs, slicePath } from "./math.js";
import { smallText, toneColor, useReducedMotion, useWidth } from "./shared.js";

const NONE = [];

// ---------------------------------------------------------------- sparkline
/**
 * A small line without axes, for a stat card or a table cell. data: number[] (null leaves a gap).
 * width is a number, or "fill" to take the width of the parent. area fills under the line; dot marks the last value.
 */
export function Sparkline({ data = NONE, width = 80, height = 32, tone = "accent", color, area = false, dot = true, smooth = true, strokeWidth = 1.75, title, formatValue = formatNumber, accessibilityLabel, style, testID, ...rest }) {
  const theme = useTheme(), id = useId().replace(/[^a-zA-Z0-9_-]/g, ""), [measured, onLayout] = useWidth(), fill = width === "fill", wide = fill ? measured : width;
  const values = useMemo(() => data.map((entry) => finite(typeof entry === "object" && entry ? entry.value : entry)), [data]), real = values.filter((value) => value != null);
  const stroke = color ?? toneColor(theme, tone) ?? theme.colors.accent, pad = Math.max(strokeWidth / 2 + 0.5, dot ? 3.5 : 0);
  const g = useMemo(() => {
    if (!real.length || !(wide > 0)) return null;
    const low = Math.min(...real), high = Math.max(...real), y = linear(low, high, height - pad, pad), parts = runs(values, (index) => pointX(index, values.length, pad, wide - pad), y);
    return { line: parts.map((part) => linePath(part, smooth)).join(""), fill: area ? parts.map((part) => areaPath(part, height, smooth)).join("") : "", lone: parts.filter((part) => part.length === 1).map((part) => part[0]), last: parts[parts.length - 1]?.slice(-1)[0] };
  }, [values, wide, height, pad, smooth, area]); // `real` follows `values`
  const summary = accessibilityLabel ?? `${title ? `${title}. ` : ""}Sparkline${real.length ? `, ${real.length} ${real.length === 1 ? "value" : "values"} from ${formatValue(real[0])} to ${formatValue(real[real.length - 1])}, lowest ${formatValue(Math.min(...real))}, highest ${formatValue(Math.max(...real))}` : ", no data"}.`;
  return h(View, { accessible: true, accessibilityRole: "image", accessibilityLabel: summary, testID, onLayout: fill ? onLayout : undefined, style: flat({ height }, fill ? { alignSelf: "stretch" } : { width }, style), ...rest },
    !(wide > 0) ? null : !g ? h(View, { style: { position: "absolute", left: 0, right: 0, bottom: 0, height: 2, borderRadius: 1, backgroundColor: theme.colors.line } })
      : h(Svg, { width: wide, height },
        g.fill ? h(Defs, null, h(LinearGradient, { id, x1: "0", y1: "0", x2: "0", y2: "1" }, h(Stop, { offset: "0", stopColor: stroke, stopOpacity: 0.3 }), h(Stop, { offset: "1", stopColor: stroke, stopOpacity: 0 }))) : null,
        g.fill ? h(Path, { d: g.fill, fill: `url(#${id})` }) : null,
        g.line ? h(Path, { d: g.line, fill: "none", stroke, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round" }) : null,
        g.lone.map((point) => (dot && point === g.last ? null : h(Circle, { key: point.index, cx: point.x, cy: point.y, r: Math.max(1.5, strokeWidth), fill: stroke }))),
        dot && g.last ? h(Circle, { cx: g.last.x, cy: g.last.y, r: 3, fill: stroke }) : null));
}

// ---------------------------------------------------------------- progress ring
const RING = { s: 32, m: 56, l: 88 };
const percent = (value) => `${Math.round(value * 100)}%`;
/**
 * Circular progress. value runs from 0 to 1 (like Progress); indeterminate spins instead.
 * size: s | m | l or a number. The middle shows the percentage from 48 points up, or children when given.
 */
export function ProgressRing({ value = 0, size = "m", thickness, tone = "accent", indeterminate = false, showValue, formatValue = percent, label, children, accessibilityLabel, style, testID, ...rest }) {
  const theme = useTheme(), c = theme.colors, reduced = useReducedMotion();
  const side = typeof size === "number" ? size : RING[size] ?? RING.m, thick = thickness ?? clamp(Math.round(side * 0.1), 3, 10), radius = (side - thick) / 2, centre = side / 2;
  const amount = clamp(finite(value) ?? 0, 0, 1), color = toneColor(theme, tone) ?? c.accent;
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!indeterminate || reduced === undefined) return undefined;
    spin.setValue(0);
    // Reduced motion: no rotation; the arc breathes instead, so it still reads as busy.
    const loop = Animated.loop(reduced ? Animated.sequence([Animated.timing(spin, { toValue: 1, duration: 900, useNativeDriver: !web }), Animated.timing(spin, { toValue: 0, duration: 900, useNativeDriver: !web })])
      : Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: !web }));
    loop.start();
    return () => loop.stop();
  }, [indeterminate, reduced, spin]);
  const text = children ?? ((showValue ?? side >= 48) && !indeterminate ? h(NativeText, { numberOfLines: 1, style: { color: c.fg, fontSize: side >= 80 ? theme.text.lg : side >= 64 ? theme.text.sm : theme.text.xs, fontWeight: "700", fontVariant: ["tabular-nums"] } }, formatValue(amount)) : null);
  const arc = indeterminate ? arcPath(centre, centre, radius, 0, Math.PI * 0.6) : amount >= 1 ? "" : amount > 0 ? arcPath(centre, centre, radius, 0, amount * Math.PI * 2) : "";
  const ring = h(Svg, { width: side, height: side },
    h(Circle, { cx: centre, cy: centre, r: radius, fill: "none", stroke: amount >= 1 && !indeterminate ? color : c.sunken, strokeWidth: thick }),
    arc ? h(Path, { d: arc, fill: "none", stroke: color, strokeWidth: thick, strokeLinecap: "round" }) : null);
  const moving = !indeterminate ? null : reduced ? { opacity: spin.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] }) } : { transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] };
  const now = Math.round(amount * 100), name = accessibilityLabel ?? (typeof label === "string" ? label : undefined);
  return h(View, { accessible: true, accessibilityRole: "progressbar", accessibilityLabel: name, accessibilityState: { busy: indeterminate }, "aria-busy": indeterminate,
    accessibilityValue: indeterminate ? undefined : { min: 0, max: 100, now, text: formatValue(amount) }, "aria-valuemin": indeterminate ? undefined : 0, "aria-valuemax": indeterminate ? undefined : 100, "aria-valuenow": indeterminate ? undefined : now,
    testID, style: flat({ alignItems: "center", gap: theme.space["2xs"] }, style), ...rest },
    h(View, { style: { width: side, height: side, alignItems: "center", justifyContent: "center" } },
      h(Animated.View, { style: [{ position: "absolute", left: 0, top: 0, width: side, height: side }, moving] }, ring),
      text),
    label == null ? null : typeof label === "string" ? h(NativeText, { numberOfLines: 1, style: { ...smallText(theme), textAlign: "center" } }, label) : label);
}

// ---------------------------------------------------------------- gauge
/**
 * A half-circle gauge. value sits between min and max. ranges: [{ to, tone, label }] (ascending upper bounds, the
 * last one normally equal to max) colours the arc in bands; the band that holds the value names it ("Good").
 * Without ranges the arc fills in one tone.
 */
export function Gauge({ value = 0, min = 0, max = 100, ranges, size = 220, thickness = 14, tone = "accent", label, formatValue = formatNumber, showRange = true, accessibilityLabel, style, testID, ...rest }) {
  const theme = useTheme(), c = theme.colors, [measured, onLayout] = useWidth();
  const low = finite(min) ?? 0, high = (finite(max) ?? 100) > low ? finite(max) ?? 100 : low + 1, amount = clamp(finite(value) ?? low, low, high);
  const side = Math.max(0, Math.min(size, measured || size)), thick = Math.min(thickness, side / 6), knob = thick / 2 + 3, outer = side / 2 - 4, inner = outer - thick, middle = (outer + inner) / 2;
  const cx = side / 2, cy = outer + 4, tall = cy + knob + 1, angle = linear(low, high, -Math.PI / 2, Math.PI / 2), at = angle(amount);
  const bandsOf = useMemo(() => {
    let from = low;
    const list = (ranges ?? NONE).map((range) => { const to = clamp(finite(range.to) ?? high, from, high), band = { from, to, tone: range.tone, label: range.label }; from = to; return band; }).filter((band) => band.to > band.from);
    if (list.length && from < high) list.push({ from, to: high, tone: "muted" });
    return list;
  }, [ranges, low, high]);
  const current = bandsOf.find((band, index) => amount <= band.to && (amount > band.from || index === 0)) ?? bandsOf[bandsOf.length - 1];
  const colorOf = (band) => toneColor(theme, band?.tone) ?? c.accent, active = bandsOf.length ? colorOf(current) : toneColor(theme, tone) ?? c.accent;
  const gap = 3, corner = Math.min(4, thick / 2), nudge = gap / 2 / middle;
  const shapes = [];
  if (bandsOf.length) {
    bandsOf.forEach((band, index) => {
      const a0 = angle(band.from), a1 = angle(band.to);
      shapes.push(h(Path, { key: `t${index}`, d: slicePath(cx, cy, outer, inner, a0, a1, gap, corner), fill: colorOf(band), fillOpacity: theme.scheme === "dark" ? 0.3 : 0.22 }));
      if (amount > band.from) shapes.push(h(Path, { key: `v${index}`, d: slicePath(cx, cy, outer, inner, a0, amount >= band.to ? a1 : Math.min(a1, at + nudge), gap, corner), fill: colorOf(band) }));
    });
  } else {
    shapes.push(h(Path, { key: "t", d: slicePath(cx, cy, outer, inner, -Math.PI / 2, Math.PI / 2, 0, thick / 2), fill: c.sunken }));
    if (amount > low) shapes.push(h(Path, { key: "v", d: slicePath(cx, cy, outer, inner, -Math.PI / 2, Math.max(at, -Math.PI / 2 + thick / middle), 0, thick / 2), fill: active }));
  }
  const spot = polar(cx, cy, middle, at), words = current?.label;
  const summary = accessibilityLabel ?? `${typeof label === "string" ? `${label}: ` : "Gauge: "}${formatValue(amount)}, from ${formatValue(low)} to ${formatValue(high)}${words ? `, ${words}` : ""}.`;
  const small = smallText(theme), room = inner * 2 - 24;
  return h(View, { accessible: true, accessibilityRole: "image", accessibilityLabel: summary, testID, onLayout, style: flat({ alignSelf: "stretch", alignItems: "center" }, style), ...rest },
    side > 0 ? h(View, { style: { width: side, height: tall + (showRange ? 18 : 0) } },
      h(Svg, { width: side, height: tall }, shapes, h(Circle, { cx: spot.x, cy: spot.y, r: knob - 1.5, fill: c.surface, stroke: active, strokeWidth: 3 })),
      h(View, { pointerEvents: "none", style: { position: "absolute", left: (side - room) / 2, width: room, bottom: (showRange ? 18 : 0) + knob - 2, alignItems: "center" } },
        h(NativeText, { numberOfLines: 1, adjustsFontSizeToFit: true, minimumFontScale: 0.6, style: { color: c.fg, fontSize: side >= 200 ? theme.text["2xl"] : side >= 170 ? theme.text.xl : theme.text.lg, lineHeight: side >= 200 ? 34 : side >= 170 ? 28 : 24, fontWeight: "700", letterSpacing: -0.5, fontVariant: ["tabular-nums"] } }, formatValue(amount)),
        words || typeof label === "string" ? h(NativeText, { numberOfLines: 1, style: { fontSize: theme.text.sm, lineHeight: 20, fontWeight: words ? "600" : "400", color: words ? active : c.muted, textAlign: "center" } }, words ?? label) : null),
      showRange ? h(NativeText, { style: { ...small, position: "absolute", left: 4 + thick / 2 - 30, width: 60, bottom: 0, textAlign: "center" } }, formatValue(low)) : null,
      showRange ? h(NativeText, { style: { ...small, position: "absolute", right: 4 + thick / 2 - 30, width: 60, bottom: 0, textAlign: "center" } }, formatValue(high)) : null) : null,
    words && typeof label === "string" ? h(NativeText, { style: { ...small, textAlign: "center", marginTop: 2 } }, label) : null,
    typeof label !== "string" && label != null ? label : null);
}

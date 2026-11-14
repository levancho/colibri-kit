// LineChart, AreaChart and BarChart: one frame (axes, grid, legend, tooltip, touch) around three kinds of marks.
import { createElement as h, memo, useCallback, useId, useMemo } from "react";
import { Animated, Text as NativeText, View } from "react-native";
import { Circle, Defs, Line, LinearGradient, Path, Rect, Stop, Svg } from "react-native-svg";
import { useTheme } from "../provider.js";
import { Text } from "../components.js";
import { ChartLegend } from "../conversation.js";
import { flat, web } from "../internal.js";
import { areaPath, bands, barPath, clamp, describeSeries, finite, formatNumber, linePath, linear, nearestIndex, niceTicks, pointX, runs } from "./math.js";
import { EmptyPlot, Tooltip, seriesColors, smallText, textWidth, toneColor, useDrawIn, useScrub, useWidth } from "./shared.js";

const NONE = [];
const WORD = { line: "Line chart", area: "Area chart", "stacked-area": "Stacked area chart", bar: "Bar chart", "stacked-bar": "Stacked bar chart" };
const DOT = 3.5, BELOW = 6; // the radius of a point, and the room under the plot for a point that sits on the floor

/** data: [{ label, value, tone }] or labels + series: [{ name, values, tone }] → { labels, series, tones }. */
function readModel(data, labels, series, tone) {
  if (series?.length) {
    const count = Math.max(0, labels?.length ?? 0, ...series.map((entry) => entry.values?.length ?? 0));
    return { labels: Array.from({ length: count }, (_, i) => String(labels?.[i] ?? i + 1)), tones: NONE,
      series: series.map((entry) => ({ name: entry.name, tone: entry.tone, values: Array.from({ length: count }, (_, i) => finite(entry.values?.[i])) })) };
  }
  const rows = data ?? NONE;
  return { labels: rows.map((row, i) => String(row?.label ?? i + 1)), tones: rows.map((row) => row?.tone),
    series: rows.length ? [{ name: undefined, tone, values: rows.map((row) => finite(typeof row === "number" ? row : row?.value)) }] : NONE };
}

/**
 * Everything that depends on the data and the size, as plain numbers and path strings.
 * A pure function of its arguments: no theme, no React.
 */
function plan({ model, kind, width, height, stacked, zero, yMin, yMax, tickCount, format, formatLabel, showAxis, smooth, area, showValues }) {
  const count = model.labels.length, many = model.series.length, bar = kind === "bar";
  // Stacking: the running totals per point. Areas stack what is above zero; bars stack up and down from zero.
  const tops = [], bases = [];
  if (stacked) {
    const up = new Array(count).fill(0), down = new Array(count).fill(0);
    model.series.forEach((entry) => {
      const top = [], base = [];
      entry.values.forEach((raw, i) => {
        const value = bar ? raw ?? 0 : Math.max(0, raw ?? 0), side = value < 0 ? down : up;
        base.push(side[i]); side[i] += value; top.push(side[i]);
      });
      tops.push(top); bases.push(base);
    });
  }
  const all = stacked ? [...tops.flat(), 0] : model.series.flatMap((entry) => entry.values.filter((value) => value != null));
  const low = all.length ? Math.min(...all) : 0, high = all.length ? Math.max(...all) : 0;
  const nice = niceTicks(yMin ?? low, yMax ?? high, tickCount, zero && yMin == null && yMax == null);
  const d0 = yMin ?? nice.min, d1 = (yMax ?? nice.max) > d0 ? yMax ?? nice.max : d0 + 1;
  const tickValues = nice.ticks.filter((tick) => tick >= d0 - 1e-9 && tick <= d1 + 1e-9), tickTexts = tickValues.map(format);
  const texts = model.labels.map((label, index) => String(formatLabel ? formatLabel(label, index) : label)), widest = Math.max(0, ...texts.map((entry) => textWidth(entry)));
  const axis = showAxis ? Math.max(...tickTexts.map((entry) => textWidth(entry)), 0) + 10 : 0;
  const x0 = showAxis ? axis : bar ? 0 : BELOW, x1 = width - (bar ? 0 : showAxis ? clamp(Math.ceil(textWidth(texts[count - 1] ?? "") / 2), 8, 36) : BELOW);
  const top = showValues ? 24 : 10, y = linear(d0, d1, height, top), floor = y(clamp(0, d0, d1));
  const ticks = tickValues.map((value, index) => ({ value, y: y(value), text: tickTexts[index] }));
  const band = bands(count, x0, x1), xOf = bar ? (index) => band.at(index) + band.step / 2 : (index) => pointX(index, count, x0, x1);
  const spacing = bar ? band.step : count > 1 ? (x1 - x0) / (count - 1) : x1 - x0, every = Math.max(1, Math.ceil((widest + 10) / Math.max(1, spacing)));
  const boxWidth = Math.min(width, widest + 6);
  const xLabels = texts.map((text, index) => (index % every === 0 ? { text, index, left: clamp(xOf(index) - boxWidth / 2, 0, Math.max(0, width - boxWidth)), width: boxWidth } : null)).filter(Boolean);
  const base = { count, many, x0, x1, top, floor, ticks, xLabels, axis, xOf, band, width, height };
  if (bar) {
    // One slot per label; a fifth of it is air. Grouped bars share the rest, a stack takes it whole.
    const inner = Math.max(1, band.step * (count > 12 ? 0.86 : 0.78)), slots = stacked ? 1 : Math.max(1, many), between = stacked || many < 2 ? 0 : Math.min(3, inner * 0.08);
    const thick = Math.min(stacked || many < 2 ? 40 : 28, (inner - between * (slots - 1)) / slots), groupWidth = thick * slots + between * (slots - 1);
    const bars = [], values = [];
    for (let i = 0; i < count; i++) {
      const left = band.at(i) + (band.step - groupWidth) / 2;
      if (stacked) {
        const last = { up: -1, down: -1 };
        model.series.forEach((entry, s) => { const value = entry.values[i] ?? 0; if (value > 0) last.up = s; else if (value < 0) last.down = s; });
        model.series.forEach((entry, s) => {
          const value = entry.values[i] ?? 0; if (!value) return;
          const from = y(clamp(bases[s][i], d0, d1)), to = y(clamp(tops[s][i], d0, d1)), tip = s === (value > 0 ? last.up : last.down), gap = bases[s][i] !== 0 && Math.abs(to - from) > 2 ? (value > 0 ? -1 : 1) : 0;
          bars.push({ series: s, index: i, x: left, width: thick, from: from + gap, to, round: tip });
        });
        const total = model.series.reduce((sum, entry) => sum + (entry.values[i] ?? 0), 0), peak = Math.max(0, ...tops.map((entry) => entry[i]));
        if (model.series.some((entry) => entry.values[i] != null)) values.push({ x: left + thick / 2, y: y(clamp(peak, d0, d1)), value: total });
      } else {
        model.series.forEach((entry, s) => {
          const value = entry.values[i]; if (value == null) return;
          const x = left + s * (thick + between), to = y(clamp(value, d0, d1));
          bars.push({ series: s, index: i, x, width: thick, from: floor, to: value === 0 ? floor : Math.abs(to - floor) < 2 ? floor + (value > 0 ? -2 : 2) : to, round: true });
          if (many === 1 || thick >= 26) values.push({ x: x + thick / 2, y: value < 0 ? Math.max(to, floor) + 20 : Math.min(to, floor), value });
        });
      }
    }
    return { ...base, bars, values, radius: Math.min(4, thick / 2) };
  }
  let below = null;
  const lines = model.series.map((entry, s) => {
    const source = stacked ? tops[s] : entry.values, parts = runs(source, xOf, y);
    const fill = !area ? "" : stacked ? areaPath(parts[0] ?? NONE, below ?? floor, smooth) : parts.map((part) => areaPath(part, floor, smooth)).join("");
    if (stacked) below = parts[0] ?? below;
    return { d: parts.map((part) => linePath(part, smooth)).join(""), fill, points: parts.flat(), lone: parts.filter((part) => part.length === 1).map((part) => part[0]),
      ys: source.map((value) => (value == null ? null : y(value))) };
  });
  return { ...base, lines };
}

// ---------------------------------------------------------------- layers
const Grid = memo(function Grid({ g, line, strong, show }) {
  const zero = g.ticks.some((tick) => tick.value === 0);
  return h(Svg, { width: g.width, height: g.height + BELOW, style: { position: "absolute", left: 0, top: 0 } },
    g.ticks.map((tick, index) => {
      const main = zero ? tick.value === 0 : index === 0;
      return show || main ? h(Line, { key: tick.value, x1: g.x0, x2: g.x1, y1: tick.y, y2: tick.y, stroke: main ? strong : line, strokeWidth: 1, strokeOpacity: main ? 0.55 : 0.8 }) : null;
    }));
});

const Marks = memo(function Marks({ g, colors, id, strokeWidth, showDots, surface, stacked }) {
  const children = [];
  if (g.bars) {
    g.bars.forEach((bar, index) => children.push(h(Path, { key: index, d: barPath(bar.x, bar.width, bar.from, bar.to, bar.round ? g.radius : 0), fill: colors[bar.series](bar.index) })));
  } else {
    const filled = g.lines.some((line) => line.fill);
    if (filled) children.push(h(Defs, { key: "defs" }, g.lines.map((line, s) => (line.fill ? h(LinearGradient, { key: s, id: `${id}-${s}`, x1: "0", y1: "0", x2: "0", y2: "1" },
      h(Stop, { offset: "0", stopColor: colors[s](), stopOpacity: stacked ? 0.55 : 0.32 }), h(Stop, { offset: "1", stopColor: colors[s](), stopOpacity: stacked ? 0.3 : 0.02 })) : null))));
    g.lines.forEach((line, s) => { if (line.fill) children.push(h(Path, { key: `a${s}`, d: line.fill, fill: `url(#${id}-${s})` })); });
    g.lines.forEach((line, s) => { if (line.d) children.push(h(Path, { key: `l${s}`, d: line.d, fill: "none", stroke: colors[s](), strokeWidth, strokeLinecap: "round", strokeLinejoin: "round" })); });
    g.lines.forEach((line, s) => (showDots ? line.points : line.lone).forEach((point) =>
      children.push(h(Circle, { key: `d${s}-${point.index}`, cx: point.x, cy: point.y, r: DOT, fill: colors[s](), stroke: surface, strokeWidth: 1.5 }))));
  }
  return h(Svg, { width: g.width, height: g.height + BELOW }, children);
});

/** The crosshair of a line chart with a ring on every series, or the highlighted slot of a bar chart. */
function Cursor({ g, index, colors, theme }) {
  const c = theme.colors;
  if (g.bars) {
    return h(Svg, { width: g.width, height: g.height + BELOW, style: { position: "absolute", left: 0, top: 0 } },
      h(Rect, { x: g.band.at(index) + 1, y: g.top - 6, width: Math.max(0, g.band.step - 2), height: g.height - g.top + 6, rx: Math.min(6, theme.radius.s), fill: c.fg, fillOpacity: 0.07 }));
  }
  const x = g.xOf(index);
  return h(Svg, { width: g.width, height: g.height + BELOW, style: { position: "absolute", left: 0, top: 0 } },
    h(Line, { x1: x, x2: x, y1: g.top - 6, y2: g.height, stroke: c.muted, strokeWidth: 1, strokeDasharray: "3 3" }),
    g.lines.map((line, s) => (line.ys[index] == null ? null : h(Circle, { key: s, cx: x, cy: line.ys[index], r: 5, fill: colors[s](), stroke: c.surface, strokeWidth: 2 }))));
}

// ---------------------------------------------------------------- the chart
function CartesianChart({ kind, data, labels, series, title, height = 200, smooth = true, area = false, stacked = false, showDots = false, showGrid = true, showAxis = true, showLegend, showValues = false,
  yMin, yMax, zero, ticks = 4, formatValue = formatNumber, formatLabel, tone, strokeWidth = 2, interactive = true, activeIndex, onActiveChange, animate = true, emptyText = "No data yet",
  accessibilityLabel, style, testID, ...rest }) {
  const theme = useTheme(), c = theme.colors, id = useId().replace(/[^a-zA-Z0-9_-]/g, ""), [width, onLayout] = useWidth(), bar = kind === "bar";
  const model = useMemo(() => readModel(data, labels, series, tone), [data, labels, series, tone]);
  const many = model.series.length > 1, pile = stacked && many, empty = !model.labels.length || !model.series.some((entry) => entry.values.some((value) => value != null));
  const fromZero = zero ?? (bar || area);
  const g = useMemo(() => (width > 0 && !empty ? plan({ model, kind, width, height, stacked: pile, zero: fromZero, yMin, yMax, tickCount: ticks, format: formatValue, formatLabel, showAxis, smooth, area, showValues: bar && showValues }) : null),
    [model, kind, width, height, pile, fromZero, yMin, yMax, ticks, formatValue, formatLabel, showAxis, smooth, area, bar, showValues, empty]);
  // A colour per series; in a chart with one series a point (a bar) may carry its own tone.
  const colors = useMemo(() => {
    const palette = seriesColors(theme, model.series.length);
    return model.series.map((entry, s) => { const own = toneColor(theme, entry.tone) ?? palette[s]; return (index) => (many || index == null ? own : toneColor(theme, model.tones[index]) ?? own); });
  }, [theme, model, many]);
  const pick = useCallback((x) => (g ? (g.bars ? g.band.index(x) : nearestIndex(x, g.count, g.x0, g.x1)) : null), [g]);
  const report = useCallback((index) => onActiveChange?.(index, index == null ? null : { label: model.labels[index], values: model.series.map((entry) => entry.values[index]) }), [onActiveChange, model]);
  const [active, handlers] = useScrub({ pick, value: activeIndex, onChange: report, enabled: interactive });
  const at = active != null && g && active >= 0 && active < g.count ? active : null;
  const progress = useDrawIn(animate, !!g);
  const word = WORD[pile ? `stacked-${bar ? "bar" : "area"}` : bar ? "bar" : area ? "area" : "line"];
  const summary = accessibilityLabel ?? describeSeries(word, title, model.labels, model.series, formatValue, emptyText);
  const small = smallText(theme), plotHeight = height + (showAxis ? 24 : BELOW);
  const legendItems = many || showLegend ? model.series.map((entry, s) => ({ label: entry.name ?? (many ? `Series ${s + 1}` : title ?? "Value"), color: colors[s]() })) : NONE;
  const rows = at == null ? NONE : [
    ...model.series.map((entry, s) => (entry.values[at] == null ? null : { color: colors[s](at), label: entry.name ?? (many ? `Series ${s + 1}` : null), value: formatValue(entry.values[at]) })).filter(Boolean),
    ...(pile ? [{ label: "Total", value: formatValue(model.series.reduce((sum, entry) => sum + (bar ? entry.values[at] ?? 0 : Math.max(0, entry.values[at] ?? 0)), 0)) }] : NONE)];
  return h(View, { accessible: true, accessibilityRole: "image", accessibilityLabel: summary, testID, style: flat({ alignSelf: "stretch", gap: theme.space.xs }, style), ...rest },
    title ? h(Text, { size: "sm", weight: "semibold" }, title) : null,
    empty ? h(EmptyPlot, { height, text: emptyText }) : h(View, { onLayout, style: { height: plotHeight } }, g ? [
      h(Grid, { key: "grid", g, line: c.line, strong: c.muted, show: showGrid }),
      bar && at != null ? h(Cursor, { key: "cursor", g, index: at, colors, theme }) : null,
      h(Animated.View, { key: "marks", style: { position: "absolute", left: 0, top: 0, height: height + BELOW, overflow: "hidden", width: progress.interpolate({ inputRange: [0, 1], outputRange: [0, width] }) } },
        h(Marks, { g, colors, id, strokeWidth, showDots, surface: c.surface, stacked: pile })),
      !bar && at != null ? h(Cursor, { key: "cursor", g, index: at, colors, theme }) : null,
      showAxis ? g.ticks.map((tick) => h(NativeText, { key: `y${tick.value}`, numberOfLines: 1, style: { ...small, position: "absolute", left: 0, width: g.axis - 8, top: tick.y - 8, textAlign: "right" } }, tick.text)) : null,
      showAxis ? g.xLabels.map((label) => h(NativeText, { key: `x${label.index}`, numberOfLines: 1, style: { ...small, position: "absolute", left: label.left, width: label.width, top: height + 6, textAlign: "center", color: label.index === at ? c.fg : c.muted } }, label.text)) : null,
      g.values && showValues ? g.values.map((entry, index) => h(NativeText, { key: `v${index}`, numberOfLines: 1, style: { ...small, color: c.fg, position: "absolute", left: entry.x - 30, width: 60, top: entry.y - 18, textAlign: "center" } }, formatValue(entry.value))) : null,
      at != null ? h(Tooltip, { key: "tip", title: model.labels[at], rows, x: g.xOf(at), room: width, testID: testID ? `${testID}-tooltip` : undefined }) : null,
      interactive ? h(View, { key: "touch", testID: testID ? `${testID}-plot` : undefined, ...handlers, style: flat({ position: "absolute", left: 0, top: 0, right: 0, height: height + BELOW }, web && { cursor: "crosshair", userSelect: "none", touchAction: "pan-y" }) }) : null,
    ] : null),
    (showLegend ?? many) && legendItems.length && !empty ? h(ChartLegend, { items: legendItems }) : null);
}

/**
 * A line per series over a shared x axis. Data is data: [{ label, value }] or labels: string[] with
 * series: [{ name, values, tone }]; a null value leaves a gap in the line.
 * smooth (default true) draws a monotone curve that never overshoots the data; area fills under the line.
 * Press or drag across the plot to read the values at a point. See types/svg.d.ts for every prop.
 */
export function LineChart(props) { return h(CartesianChart, { ...props, kind: "line" }); }
/** LineChart with the area under each line filled. stacked piles the series on top of each other (values below zero count as zero). */
export function AreaChart(props) { return h(CartesianChart, { area: true, ...props, kind: "line" }); }
/** Vertical bars with rounded tips: one per label, a group per label for several series, or stacked. Bars below zero hang from the zero line. */
export function BarChart(props) { return h(CartesianChart, { ...props, kind: "bar" }); }

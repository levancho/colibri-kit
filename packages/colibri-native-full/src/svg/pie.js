// PieChart and DonutChart: parts of a whole, with a legend that doubles as the list of slices for screen readers.
import { createElement as h, memo, useCallback, useMemo, useRef, useState } from "react";
import { Pressable, Text as NativeText, View } from "react-native";
import { Path, Svg } from "react-native-svg";
import { useTheme } from "@colibri-kit/native-core";
import { Text } from "@colibri-kit/native-core";
import { flat, web } from "@colibri-kit/native-core/internal";
import { describeParts, finite, formatNumber, percentages, pieLayout, sliceAt, slicePath } from "./math.js";
import { EmptyPlot, seriesColors, toneColor, useWidth } from "./shared.js";

const NONE = [], POP = 5, TURN = Math.PI / 180;

const Slices = memo(function Slices({ size, slices, colors, outer, inner, gap, corner, selected }) {
  const centre = size / 2;
  return h(Svg, { width: size, height: size }, slices.map((slice) => {
    const on = slice.index === selected;
    return h(Path, { key: slice.index, d: slicePath(centre, centre, outer + (on ? POP : 0), inner, slice.start, slice.end, gap, corner), fill: colors[slice.index], fillOpacity: selected == null || on ? 1 : 0.4 });
  }));
});

const LegendRow = memo(function LegendRow({ index, label, color, value, share, selected, dim, onPress }) {
  const theme = useTheme();
  return h(Pressable, { onPress: onPress ? () => onPress(index) : undefined, disabled: !onPress, accessibilityRole: onPress ? "button" : "text", accessibilityLabel: `${label}: ${value}, ${share}%`, accessibilityState: { selected }, "aria-pressed": onPress ? selected : undefined,
    hitSlop: { top: 4, bottom: 4 }, style: ({ pressed }) => ({ minHeight: 36, flexDirection: "row", alignItems: "center", gap: theme.space.xs, paddingHorizontal: theme.space.xs, marginHorizontal: -theme.space.xs, borderRadius: theme.radius.s,
      backgroundColor: selected || pressed ? theme.colors.sunken : "transparent", opacity: dim ? 0.6 : 1 }) },
    h(View, { style: { width: 10, height: 10, borderRadius: 3, backgroundColor: color } }),
    h(Text, { size: "sm", weight: selected ? "semibold" : "regular", numberOfLines: 1, style: { flex: 1 } }, label),
    h(Text, { size: "sm", tone: "muted", style: { fontVariant: ["tabular-nums"] } }, value),
    h(Text, { size: "sm", weight: "semibold", align: "right", style: { width: 44, fontVariant: ["tabular-nums"] } }, `${share}%`));
});

function Pie({ donut, data = NONE, title, size = 200, innerRadius = donut ? 0.64 : 0, gap = 2, cornerRadius = donut ? 4 : 3, startAngle = 0, selected, defaultSelected = null, onSelect, selectable = true,
  showLegend = true, formatValue = formatNumber, centerValue, centerLabel = "Total", emptyText = "No data yet", accessibilityLabel, style, testID, ...rest }) {
  const theme = useTheme(), c = theme.colors, [width, onLayout] = useWidth(), [own, setOwn] = useState(defaultSelected);
  const rows = useMemo(() => data.map((row, index) => ({ label: String(row?.label ?? index + 1), value: Math.max(0, finite(row?.value) ?? 0), tone: row?.tone, color: row?.color })), [data]);
  const values = useMemo(() => rows.map((row) => row.value), [rows]), total = values.reduce((sum, value) => sum + value, 0), empty = !(total > 0);
  const colors = useMemo(() => { const palette = seriesColors(theme, rows.length); return rows.map((row, index) => row.color ?? toneColor(theme, row.tone) ?? palette[index]); }, [theme, rows]);
  const shares = useMemo(() => percentages(values), [values]), slices = useMemo(() => pieLayout(values, startAngle * TURN), [values, startAngle]);
  const side = Math.max(0, Math.min(size, width || size)), outer = Math.max(0, side / 2 - POP - 1), inner = outer * Math.min(0.92, Math.max(0, innerRadius));
  const current = selected !== undefined ? selected : own, picked = current != null && rows[current]?.value > 0 ? current : null;
  const latest = useRef({}); latest.current = { picked, onSelect, rows, controlled: selected !== undefined };
  const choose = useCallback((index) => {
    const now = latest.current, next = index == null || index < 0 || index === now.picked ? null : index;
    if (next === now.picked) return;
    if (!now.controlled) setOwn(next);
    now.onSelect?.(next, next == null ? null : data[next]);
  }, [data]);
  // A press on the plot: the slice under the finger, found from the angle and the distance to the centre.
  const press = useRef(null);
  const handlers = useMemo(() => ({
    onStartShouldSetResponder: () => true,
    onResponderGrant: (event) => { const e = event.nativeEvent; press.current = { x: e.locationX, y: e.locationY, pageX: e.pageX, pageY: e.pageY }; },
    onResponderRelease: (event) => {
      const start = press.current, e = event.nativeEvent; press.current = null;
      if (!start || Math.hypot(e.pageX - start.pageX, e.pageY - start.pageY) > 10) return;
      choose(sliceAt(slices, side / 2, side / 2, inner, outer + POP, start.x, start.y));
    },
    onResponderTerminate: () => { press.current = null; },
  }), [choose, slices, side, inner, outer]);
  const summary = accessibilityLabel ?? describeParts(donut ? "Donut chart" : "Pie chart", title, rows.map((row) => row.label), values, formatValue, emptyText);
  const heading = title ? h(Text, { size: "sm", weight: "semibold" }, title) : null;
  if (empty) return h(View, { accessible: true, accessibilityRole: "image", accessibilityLabel: summary, testID, style: flat({ alignSelf: "stretch", gap: theme.space.xs }, style), ...rest }, heading, h(EmptyPlot, { height: Math.min(size, 160), text: emptyText }));
  const hole = inner * 2 - 16, centre = donut && hole >= 56 ? h(View, { pointerEvents: "none", style: { position: "absolute", left: (side - hole) / 2, top: 0, width: hole, height: side, alignItems: "center", justifyContent: "center" } },
    h(NativeText, { numberOfLines: 1, adjustsFontSizeToFit: true, minimumFontScale: 0.6, style: { color: c.fg, fontSize: hole >= 96 ? theme.text.xl : theme.text.lg, lineHeight: hole >= 96 ? 30 : 24, fontWeight: "700", letterSpacing: -0.3, fontVariant: ["tabular-nums"] } },
      picked != null ? formatValue(rows[picked].value) : centerValue ?? formatValue(total)),
    h(NativeText, { numberOfLines: 1, style: { color: c.muted, fontSize: theme.text.xs, lineHeight: 16, textAlign: "center" } }, picked != null ? `${rows[picked].label} · ${shares[picked]}%` : centerLabel)) : null;
  return h(View, { testID, style: flat({ alignSelf: "stretch", gap: theme.space.xs }, style), ...rest },
    heading,
    h(View, { onLayout, style: { alignItems: "center" } },
      h(View, { accessible: true, accessibilityRole: "image", accessibilityLabel: summary, style: { width: side, height: side } },
        h(Slices, { size: side, slices, colors, outer, inner, gap, corner: cornerRadius, selected: picked }),
        centre,
        selectable ? h(View, { testID: testID ? `${testID}-plot` : undefined, ...handlers, style: flat({ position: "absolute", left: 0, top: 0, width: side, height: side }, web && { cursor: "pointer", userSelect: "none" }) }) : null)),
    showLegend ? h(View, { style: { gap: 2 } }, rows.map((row, index) => (row.value > 0 ? h(LegendRow, { key: index, index, label: row.label, color: colors[index], value: formatValue(row.value), share: shares[index],
      selected: picked === index, dim: picked != null && picked !== index, onPress: selectable ? choose : undefined }) : null))) : null);
}

/**
 * Parts of a whole as slices. data: [{ label, value, tone?, color? }]; values of zero or less are left out.
 * Press a slice, or its row in the legend, to select it (selected + onSelect, or uncontrolled).
 */
export function PieChart(props) { return h(Pie, { ...props, donut: false }); }
/** PieChart with a hole: the total (or the selected slice) is written in the middle. */
export function DonutChart(props) { return h(Pie, { ...props, donut: true }); }

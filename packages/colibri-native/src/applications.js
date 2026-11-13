// Application components: the dashboard pieces of the web kit ("Application components" group), phone first.
// Every component takes { model, onAction, onSubmit } like its web counterpart. onAction receives { action, id }
// (plus value where a choice was made); onSubmit receives { form, values, id }. The DOM-only fields of the web
// contract (element, originalEvent, formData, submitter) do not exist here.
// Model field names are the web ones, so one model object can feed both platforms. Fields a phone needs in
// addition (a sparkline series, a status column, a gallery) are optional extras.
// Pictures: the web models carry image URLs. This package never loads remote images, so every picture is a tinted
// placeholder block with initials, unless the item carries a local `source` (an ImageSourcePropType).
// Lists: every repeated row is a memoised component that receives stable callbacks (see useStable), so typing in
// a search box or changing one quantity re-renders only the rows whose own props changed. The pieces sit inside
// the screen's scroll view, so they do not virtualise; the table pages long lists instead (pageSize).
import { createElement as h, memo, useCallback, useMemo, useRef, useState } from "react";
import { Image, Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { useTheme } from "./provider.js";
import { toneName } from "./theme.js";
import { depth, flat, GLYPH } from "./internal.js";
import { Stack, Cluster, Divider, Text, Heading, Button, Card, Badge, Avatar, TextField, Switch, Checkbox, RadioGroup, Tabs, Progress } from "./components.js";
import { Sheet } from "./overlays.js";

// ---------------------------------------------------------------- local helpers
const WIDE = 768; // from this window width the shell shows a side rail and the table shows columns
const EMPTY = []; // one shared empty list, so "no rows" does not look like new data on every render
const send = (onAction, action, id, extra) => onAction?.({ action, id, ...extra });
/** A callback that keeps one identity for the life of the component and always runs the latest function. */
function useStable(fn) {
  const latest = useRef(fn);
  latest.current = fn;
  return useCallback((...args) => latest.current?.(...args), []);
}
const TONES = ["accent", "ok", "warn", "bad"];
const hash = (text) => { let n = 0; for (const ch of String(text ?? "")) n = (n * 31 + ch.charCodeAt(0)) >>> 0; return n; };
/** A stable tone for a placeholder: the given tone, or one picked from the label. */
const toneFor = (key, tone) => toneName(tone) ?? TONES[hash(key) % TONES.length];
const initials = (name) => String(name ?? "").trim().split(/\s+/).slice(0, 2).map((word) => word[0] ?? "").join("").toUpperCase();
/** "$1,100" → 1100, "−0.3" → -0.3, "Pro" → null. */
const num = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const text = String(value ?? "").trim();
  if (!/^[^A-Za-z]*\d/.test(text)) return null;
  const parsed = parseFloat(text.replace(/[−–]/g, "-").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};
const group = (value) => { const [whole, part] = String(value).split("."); return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (part ? "." + part : ""); };
const count = (value) => group(Math.round(value * 100) / 100);
/** Formats a number like a sample price: money(640, "$320") → "$640". */
const money = (amount, sample = "") => { const prefix = String(sample).match(/^[^\d-]*/)?.[0] ?? ""; return prefix + group(Number.isInteger(amount) ? amount : amount.toFixed(2)); };
const STATUS_TONES = [
  ["ok", /^(active|paid|won|done|resolved|complete|completed|on track|approved|delivered|shipped|online|in stock)$/i],
  ["warn", /^(pending|in review|review|planned|trial|due soon|at risk|paused|draft|low stock)$/i],
  ["bad", /^(overdue|failed|blocked|churned|cancelled|canceled|past due|refunded|urgent|sold out|closed)$/i],
  ["accent", /^(open|new|in progress)$/i],
];
/** The tone of a status word. model.tones ({ Paid: "ok" }) overrides the built-in guesses. */
const statusTone = (status, tones) => tones?.[status] ?? STATUS_TONES.find(([, pattern]) => pattern.test(String(status ?? "").trim()))?.[0];
/** A Badge that follows the alignment of the row or column it is in (a bare Badge pins itself to the start). */
const Tag = ({ style, ...rest }) => h(Badge, { style: flat({ alignSelf: "auto" }, style), ...rest });
const row = (gap = 8, align = "center") => ({ flexDirection: "row", alignItems: align, gap });
const caps = { letterSpacing: 1, textTransform: "uppercase" };
const tabular = { fontVariant: ["tabular-nums"] };

function Head({ title, description, level = 3, trailing }) {
  if (!title && !description && !trailing) return null;
  return h(View, { style: row(12, "flex-start") },
    h(View, { style: { flex: 1, gap: 2 } }, title ? h(Heading, { level }, title) : null, description ? h(Text, { size: "sm", tone: "muted" }, description) : null),
    trailing);
}

/** A tinted block standing in for a picture: initials on a soft tone, or the item's local image source. */
function Tile({ label, tone, source, height = 120, width, radius, style, children }) {
  const theme = useTheme(), t = theme.tones[toneFor(label, tone)], borderRadius = radius ?? theme.radius.m;
  if (source) return h(Image, { source, accessibilityLabel: label, style: flat({ height, width: width ?? "100%", borderRadius }, style) });
  return h(View, { accessibilityRole: "image", accessibilityLabel: label, style: flat({ height, width, borderRadius, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: t.soft }, style) },
    h(View, { style: { position: "absolute", width: height * 1.2, height: height * 1.2, borderRadius: height, right: -height * 0.35, top: -height * 0.5, backgroundColor: t.fg, opacity: 0.1 } }),
    h(View, { style: { position: "absolute", width: height * 0.9, height: height * 0.9, borderRadius: height, left: -height * 0.25, bottom: -height * 0.45, backgroundColor: t.fg, opacity: 0.08 } }),
    children ?? h(Text, { weight: "bold", style: { color: t.fg, fontSize: Math.max(12, Math.min(34, Math.round(height * 0.3))), lineHeight: Math.max(16, Math.min(40, Math.round(height * 0.36))), letterSpacing: 1 } }, initials(label)));
}

/** A pill that calls onSelect(value). The 32pt pill plus its hitSlop is a 44pt target. */
const Chip = memo(function Chip({ label, value, selected = false, onSelect, detail }) {
  const theme = useTheme(), c = theme.colors;
  return h(Pressable, { onPress: () => onSelect?.(value), hitSlop: 6, accessibilityRole: "button", accessibilityState: { selected }, "aria-pressed": selected,
    style: ({ pressed }) => ({ minHeight: 32, paddingHorizontal: 12, ...row(6), borderRadius: theme.radius.full, borderWidth: 1, borderColor: selected ? c.accent : c.line, backgroundColor: selected ? c.accentSoft : pressed ? c.sunken : c.surface }) },
    h(Text, { size: "sm", weight: "medium", style: { color: selected ? c.accent : c.fg } }, label),
    detail == null ? null : h(Text, { size: "xs", weight: "semibold", style: { color: selected ? c.accent : c.muted } }, detail));
});
const ChipRow = ({ label, innerRef, children }) => h(ScrollView, { ref: innerRef, horizontal: true, showsHorizontalScrollIndicator: false, accessibilityLabel: label, keyboardShouldPersistTaps: "handled", style: { flexGrow: 0 }, contentContainerStyle: { gap: 8, alignItems: "center", paddingVertical: 6 } },
  label ? h(Text, { size: "xs", weight: "semibold", tone: "muted", style: { marginRight: 2 } }, label) : null, children);

/** One choice in a sheet. Calls onSelect(value). */
const OptionRow = memo(function OptionRow({ label, value, selected, onSelect }) {
  const theme = useTheme(), c = theme.colors;
  return h(Pressable, { onPress: () => onSelect?.(value), accessibilityRole: "button", accessibilityState: { selected }, "aria-pressed": selected,
    style: ({ pressed }) => ({ minHeight: theme.touch, paddingHorizontal: theme.space.s, ...row(theme.space.s), borderRadius: theme.radius.s, backgroundColor: selected ? c.accentSoft : pressed ? c.sunken : "transparent" }) },
    h(Text, { weight: selected ? "semibold" : "regular", style: { flex: 1, color: selected ? c.accent : c.fg } }, label),
    selected ? h(Text, { weight: "bold", tone: "accent" }, GLYPH.check) : null);
});

/** The phone's stand-in for a <select>: a field that opens a sheet of options. */
function Choice({ label, value, options = EMPTY, onChange }) {
  const theme = useTheme(), c = theme.colors, [open, setOpen] = useState(false);
  const pick = useStable((option) => { setOpen(false); if (option !== value) onChange?.(option); });
  return h(View, { style: { flex: 1, minWidth: 132, gap: theme.space["2xs"] } },
    h(Text, { size: "xs", weight: "semibold", tone: "muted" }, label),
    h(Pressable, { onPress: () => setOpen(true), accessibilityRole: "button", accessibilityLabel: `${label}: ${value}`, "aria-expanded": open,
      style: ({ pressed }) => ({ minHeight: theme.touch, paddingHorizontal: 12, ...row(8), borderWidth: 1, borderColor: c.line, borderRadius: theme.radius.s, backgroundColor: pressed ? c.sunken : c.surface }) },
      h(Text, { size: "sm", weight: "medium", numberOfLines: 1, style: { flex: 1 } }, value), h(Text, { tone: "muted" }, GLYPH.chevronDown)),
    h(Sheet, { visible: open, onClose: () => setOpen(false), title: label },
      h(Stack, { gap: "3xs" }, options.map((option) => h(OptionRow, { key: option, label: option, value: option, selected: option === value, onSelect: pick })))));
}

/** A tiny bar sparkline drawn with Views. The last bar is the current value and is drawn solid. */
const Spark = memo(function Spark({ values = EMPTY, tone, height = 28 }) {
  const theme = useTheme(), color = theme.colors[toneName(tone)] ?? theme.colors.accent, top = Math.max(...values), low = Math.min(...values); // scaled between the lowest and highest value so small changes show
  return h(View, { accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants", "aria-hidden": true, style: { height, ...row(3, "flex-end") } },
    values.map((value, index) => h(View, { key: index, style: { flex: 1, maxWidth: 14, height: Math.max(2, Math.round((top > low ? 0.3 + (0.7 * (value - low)) / (top - low) : 1) * height)), borderRadius: 2, backgroundColor: color, opacity: index === values.length - 1 ? 1 : 0.4 } })));
});

// ---------------------------------------------------------------- application-shell
const NavItem = memo(function NavItem({ id, title, icon, badge, selected, rail, expanded, onGo }) {
  const theme = useTheme(), c = theme.colors;
  return h(Pressable, { onPress: () => onGo(id), accessibilityRole: "button", accessibilityLabel: badge == null ? title : `${title}, ${badge}`, accessibilityState: { selected }, "aria-current": selected ? "page" : undefined, "aria-expanded": expanded,
    style: ({ pressed }) => (rail
      ? { minHeight: theme.touch, paddingHorizontal: theme.space.xs, ...row(theme.space.xs), borderRadius: theme.radius.s, backgroundColor: selected ? c.accentSoft : pressed ? c.sunken : "transparent" }
      : { flex: 1, minHeight: 56, paddingVertical: 6, alignItems: "center", justifyContent: "center", gap: 2, opacity: pressed ? 0.6 : 1 }) },
    h(View, { style: { minWidth: rail ? 28 : 40, height: 28, paddingHorizontal: 6, borderRadius: theme.radius.full, alignItems: "center", justifyContent: "center", backgroundColor: selected && !rail ? c.accentSoft : "transparent" } },
      h(Text, { size: "sm", weight: "bold", style: { color: selected ? c.accent : c.muted } }, icon ?? initials(title).slice(0, 1))),
    h(Text, { size: rail ? "sm" : "xs", weight: selected ? "semibold" : "medium", numberOfLines: 1, style: flat({ color: selected ? c.accent : c.muted }, rail && { flex: 1 }) }, title),
    badge == null ? null : h(Tag, { tone: "accent", style: rail ? null : { position: "absolute", top: 2, left: "50%", marginLeft: 8 } }, badge));
});
/**
 * The application frame: a top bar, the page heading and content, and navigation between model.pages.
 * On a phone the pages are a bottom tab bar (with more than five pages the fifth tab is "More" and opens a sheet
 * with the rest); from 768pt (or layout="rail") they are a side rail. The web kit's sliding sidebar with a menu
 * button and backdrop becomes the tab bar, which is what a phone app uses.
 * model: { brand, title, description, pages: [{ id, title, description?, icon?, badge? }], user? }.
 * Pressing a page calls onAction({ action: "navigate", id }) and onPageChange(id). page controls the current
 * page; without it the shell keeps its own. children may be a function of the current page id.
 */
export function ApplicationShell({ model = {}, onAction, page, defaultPage, onPageChange, layout = "auto", actions, children, style }) {
  const theme = useTheme(), c = theme.colors, { width } = useWindowDimensions();
  const pages = model.pages ?? EMPTY;
  const [own, setOwn] = useState(defaultPage ?? pages.find((entry) => entry.title === model.title)?.id ?? pages[0]?.id), [more, setMore] = useState(false);
  const current = page ?? own, active = pages.find((entry) => entry.id === current);
  const rail = layout === "rail" || (layout === "auto" && width >= WIDE);
  const go = useStable((id) => { setMore(false); if (page === undefined) setOwn(id); onPageChange?.(id); send(onAction, "navigate", id); });
  const openMore = useCallback(() => setMore(true), []);
  const split = !rail && pages.length > 5, shown = split ? pages.slice(0, 4) : pages, rest = split ? pages.slice(4) : EMPTY;
  const title = active?.title ?? model.title, description = active?.description ?? model.description;
  const mark = h(View, { style: { width: 28, height: 28, borderRadius: theme.radius.s, alignItems: "center", justifyContent: "center", backgroundColor: c.accent } },
    h(Text, { size: "sm", weight: "bold", style: { color: c.brandFg } }, initials(model.brand).slice(0, 1)));
  const top = h(View, { style: { minHeight: 52, paddingHorizontal: theme.space.m, ...row(theme.space.xs), borderBottomWidth: 1, borderBottomColor: c.line, backgroundColor: c.surface } },
    rail ? null : mark,
    rail ? h(Text, { size: "sm", tone: "muted", numberOfLines: 1, style: { flex: 1 } }, [model.brand, title].filter(Boolean).join(`  ${GLYPH.chevronRight}  `))
      : h(Text, { weight: "bold", numberOfLines: 1, style: { flex: 1 } }, model.brand),
    actions ?? (model.user ? h(Avatar, { name: model.user, size: 32 }) : null));
  const main = h(ScrollView, { nestedScrollEnabled: true, keyboardShouldPersistTaps: "handled", style: { flex: 1 }, contentContainerStyle: { padding: theme.space.m, gap: theme.space.m } },
    title || description ? h(View, { style: { gap: theme.space["2xs"] } },
      title ? h(Heading, { level: 1 }, title) : null,
      description ? h(Text, { tone: "muted" }, description) : null) : null,
    typeof children === "function" ? children(current) : children);
  const nav = pages.length ? h(View, { accessibilityRole: "navigation", accessibilityLabel: "Application navigation",
    style: rail ? { width: 220, padding: theme.space.s, gap: theme.space["2xs"], borderRightWidth: 1, borderRightColor: c.line, backgroundColor: c.surface }
      : { flexDirection: "row", paddingHorizontal: theme.space["2xs"], borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.surface } },
    rail ? h(View, { style: { ...row(theme.space.xs), minHeight: 40, paddingHorizontal: theme.space.xs, marginBottom: theme.space.xs } }, mark, h(Text, { weight: "bold", numberOfLines: 1, style: { flex: 1 } }, model.brand)) : null,
    shown.map((entry) => h(NavItem, { key: entry.id, id: entry.id, title: entry.title, icon: entry.icon, badge: entry.badge, selected: entry.id === current, rail, onGo: go })),
    split ? h(NavItem, { id: "more", title: "More", icon: GLYPH.more, selected: rest.some((entry) => entry.id === current), rail: false, expanded: more, onGo: openMore }) : null) : null;
  return h(View, { style: flat({ flex: 1, minHeight: 320, flexDirection: rail ? "row" : "column", backgroundColor: c.bg }, style) },
    rail ? nav : null,
    h(View, { style: { flex: 1 } }, top, main),
    rail ? null : nav,
    split ? h(Sheet, { visible: more, onClose: () => setMore(false), title: "More" },
      h(Stack, { gap: "3xs" }, rest.map((entry) => h(OptionRow, { key: entry.id, label: entry.title, value: entry.id, selected: entry.id === current, onSelect: go })))) : null);
}

// ---------------------------------------------------------------- application-metrics
const trendOf = (item) => item.trend ?? (/^\s*[+↑]/.test(item.change ?? "") ? "up" : /^\s*[-−–↓]/.test(item.change ?? "") ? "down" : null);
const MetricCard = memo(function MetricCard({ item, basis, onOpen }) {
  const theme = useTheme();
  const trend = trendOf(item), tone = toneName(item.tone) ?? (trend === "up" ? "ok" : trend === "down" ? "bad" : null), t = theme.tones[tone];
  const change = String(item.change ?? "").replace(/^\s*[+↑↓]\s*/, "").replace(/^\s*[-−–]\s*/, trend === "down" ? "" : "−");
  return h(Card, { gap: "2xs", onPress: onOpen ? () => onOpen(item.id ?? item.label) : undefined,
    accessibilityLabel: `${item.label}: ${item.value}${item.change ? ", " + item.change : ""}`,
    style: { flexGrow: 1, flexShrink: 1, flexBasis: basis, minWidth: 140, padding: theme.space.s } },
    h(Text, { size: "sm", tone: "muted", weight: "medium", numberOfLines: 1 }, item.label),
    h(Text, { size: "xl", weight: "bold", numberOfLines: 1, adjustsFontSizeToFit: true, style: { letterSpacing: -0.4 } }, item.value),
    item.series?.length ? h(Spark, { values: item.series, tone: tone ?? "accent", height: 24 }) : null,
    item.change ? h(View, { style: row(6, "flex-start") },
      trend ? h(View, { style: { width: 18, height: 18, marginTop: 1, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: t ? t.soft : theme.colors.sunken } },
        h(Text, { size: "xs", weight: "bold", style: { lineHeight: 14, color: t ? t.fg : theme.colors.muted } }, trend === "up" ? GLYPH.arrowUp : GLYPH.arrowDown)) : null,
      h(Text, { size: "xs", weight: "medium", numberOfLines: 2, style: { flex: 1, color: t ? t.fg : theme.colors.muted } }, change)) : null);
});
/**
 * A grid of KPI cards: label, value, change and a tiny bar sparkline.
 * model: { title, items: [{ id?, label, value, change, trend?: "up" | "down", tone?, series?: number[] }] }.
 * The trend is read from the sign of change ("+12%" is up) and shown in the ok tone when up and bad when down;
 * set tone on an item where down is good news (churn). With onAction a card is a button: "view-metric".
 */
export function ApplicationMetrics({ model = {}, onAction, columns, style }) {
  const theme = useTheme(), { width } = useWindowDimensions(), items = model.items ?? EMPTY;
  const perRow = columns ?? (width >= WIDE ? Math.min(4, items.length || 1) : 2), basis = `${Math.floor(100 / perRow) - 6}%`;
  const open = useStable((id) => send(onAction, "view-metric", id));
  return h(View, { style: flat({ gap: theme.space.s }, style) },
    h(Head, { title: model.title, description: model.description }),
    h(View, { style: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.s } },
      items.map((item, index) => h(MetricCard, { key: item.id ?? item.label ?? index, item, basis, onOpen: onAction ? open : undefined }))));
}

// ---------------------------------------------------------------- application-chart
const CHART_LABELS = ["Visitors", "Signups"], CHART_RANGES = [7, 14, 30];
const axis = (peak) => {
  if (!(peak > 0)) return { step: 1, ticks: 1 };
  const rough = peak / 4, power = 10 ** Math.floor(Math.log10(rough)), unit = rough / power;
  const step = (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 2.5 ? 2.5 : unit <= 5 ? 5 : 10) * power;
  return { step, ticks: Math.max(1, Math.ceil(peak / step)) };
};
const short = (value) => (value >= 1e6 ? `${+(value / 1e6).toFixed(1)}M` : value >= 1e4 ? `${+(value / 1e3).toFixed(1)}k` : count(value));
const reading = (names, values) => names.map((name, column) => `${count(values[column])} ${String(name).toLowerCase()}`).join(", ");
/** One point of the chart: a bar per series. state: "on" (picked), "dim" (another one is picked) or undefined. */
const BarGroup = memo(function BarGroup({ index, label, values, names, top, colors, state, tight, onPick }) {
  const theme = useTheme();
  return h(Pressable, { onPress: () => onPick(index), accessibilityRole: "button", accessibilityState: { selected: state === "on" }, "aria-pressed": state === "on", accessibilityLabel: `${label}: ${reading(names, values)}`,
    style: { flex: 1, flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: tight ? 1 : 2, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: state === "on" ? theme.colors.sunken : "transparent" } },
    names.map((name, column) => h(View, { key: column, style: { flex: 1, maxWidth: 16, height: `${(values[column] / top) * 100}%`, minHeight: 1, borderTopLeftRadius: 3, borderTopRightRadius: 3, backgroundColor: colors[column % colors.length], opacity: state === "dim" ? 0.45 : 1 } })));
});
const DataRow = memo(function DataRow({ label, values }) {
  const theme = useTheme();
  return h(View, { style: { ...row(8), paddingHorizontal: theme.space.s, paddingVertical: 6, borderTopWidth: 1, borderTopColor: theme.colors.line } },
    h(Text, { size: "sm", style: { flex: 1.2 } }, label), values.map((value, column) => h(Text, { key: column, size: "sm", align: "right", style: flat({ flex: 1 }, tabular) }, count(value))));
});
/**
 * A chart panel: grouped vertical bars, a range switcher, axis labels, a legend with totals, a summary in words
 * and the data as a table. React Native core has no SVG, so the web kit's area chart is drawn here as bars made
 * of Views; line, area and pie charts are not attempted. Press a group of bars to read its values (the touch
 * stand-in for a hover tooltip).
 * Like the web ChartPanel it takes its fields directly, or in model: { title, description, rows: [{ label,
 * values: number[] }], labels: string[], ranges: number[], defaultRange, unit?, href?, linkLabel? }. It owns the
 * selected range unless range and onRangeChange are given. The link calls onAction({ action: "open-link", id: href }).
 */
export function ApplicationChart({ model, onAction, range, onRangeChange, height = 168, style, ...fields }) {
  const theme = useTheme(), c = theme.colors;
  const { title = "Audience growth", description = "", rows = EMPTY, labels = CHART_LABELS, ranges = CHART_RANGES, defaultRange = 30, unit = "d", href, linkLabel } = { ...model, ...fields };
  const [own, setOwn] = useState(defaultRange), [picked, setPicked] = useState(null), [open, setOpen] = useState(false);
  const span = range ?? own, colors = useMemo(() => [c.accent, c.warn, c.ok, c.bad], [c]);
  // The visible points with clean numbers; the arrays keep their identity until the data or the range changes.
  const visible = useMemo(() => rows.slice(-span).map((entry, index) => ({ label: entry.label ?? String(index + 1), values: labels.map((_, column) => Math.max(0, Number(entry.values?.[column]) || 0)) })), [rows, span, labels]);
  const n = visible.length, noun = unit === "d" ? "days" : "points";
  const { stats, step, ticks, summary } = useMemo(() => {
    const stats = labels.map((label, column) => {
      const values = visible.map((entry) => entry.values[column]), total = values.reduce((sum, item) => sum + item, 0), best = values.indexOf(Math.max(...values));
      return { label, total, average: n ? total / n : 0, peak: values[best] ?? 0, at: visible[best]?.label };
    });
    const summary = n ? `Last ${n} ${noun}: ` + stats.map((entry) => `${String(entry.label).toLowerCase()} averaged ${count(Math.round(entry.average))} and peaked at ${count(entry.peak)} on ${entry.at}`).join("; ") + "." : "No data available.";
    return { stats, summary, ...axis(Math.max(0, ...visible.flatMap((entry) => entry.values))) };
  }, [visible, labels, n, noun]);
  const top = step * ticks, gap = n > 20 ? 2 : n > 10 ? 4 : 10;
  const selected = picked != null && picked < n ? visible[picked] : null;
  const marks = n <= 7 ? visible.map((_, index) => index) : [0, Math.round((n - 1) / 3), Math.round(((n - 1) * 2) / 3), n - 1];
  const change = (next) => { setPicked(null); if (range === undefined) setOwn(next); onRangeChange?.(next); };
  const pick = useCallback((index) => setPicked((now) => (now === index ? null : index)), []);
  return h(Card, { style },
    h(Head, { title, description }),
    ranges.length > 1 ? h(Tabs, { value: span, onChange: change, options: ranges.map((entry) => ({ value: entry, label: `${entry}${unit}` })) }) : null,
    n ? h(View, { style: { gap: theme.space["2xs"] } },
      h(View, { style: { flexDirection: "row" } },
        h(View, { style: { width: 38, height } }, Array.from({ length: ticks + 1 }, (_, index) =>
          h(Text, { key: index, size: "xs", tone: "muted", numberOfLines: 1, style: { position: "absolute", right: 6, bottom: (index / ticks) * height - 8, lineHeight: 16 } }, short(step * index)))),
        h(View, { style: { flex: 1, height } },
          Array.from({ length: ticks + 1 }, (_, index) => h(View, { key: index, style: { position: "absolute", left: 0, right: 0, bottom: (index / ticks) * height, height: 1, backgroundColor: c.line, opacity: index ? 0.7 : 1 } })),
          h(View, { style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, flexDirection: "row", alignItems: "stretch", gap } }, visible.map((entry, index) =>
            h(BarGroup, { key: index, index, label: entry.label, values: entry.values, names: labels, top, colors, tight: n > 20, state: picked == null || picked >= n ? undefined : picked === index ? "on" : "dim", onPick: pick }))))),
      h(View, { style: { marginLeft: 38, flexDirection: "row", justifyContent: "space-between" } }, marks.map((index) =>
        h(Text, { key: index, size: "xs", tone: "muted", numberOfLines: 1, style: n <= 7 ? { flex: 1, textAlign: "center" } : null }, visible[index]?.label)))) : null,
    h(View, { accessibilityLiveRegion: "polite", style: { minHeight: 36, paddingHorizontal: theme.space.s, paddingVertical: theme.space.xs, gap: 2, justifyContent: "center", borderRadius: theme.radius.s, backgroundColor: c.sunken } },
      selected ? h(Text, { size: "sm" }, h(Text, { size: "sm", weight: "semibold" }, selected.label), "  " + labels.map((label, column) => `${count(selected.values[column])} ${String(label).toLowerCase()}`).join(" · ")) : h(Text, { size: "sm" }, summary),
      n ? h(Text, { size: "xs", tone: "muted" }, selected ? "Press the bar again to return to the summary." : "Press a bar to read its values.") : null),
    h(View, { style: { flexDirection: "row", flexWrap: "wrap", columnGap: theme.space.m, rowGap: theme.space["2xs"] } }, stats.map((entry, column) =>
      h(View, { key: column, style: row(6) },
        h(View, { style: { width: 10, height: 10, borderRadius: 3, backgroundColor: colors[column % colors.length] } }),
        h(Text, { size: "sm", weight: "medium" }, entry.label), h(Text, { size: "sm", tone: "muted" }, `${count(entry.total)} total`)))),
    h(Divider),
    h(View, { style: { ...row(theme.space.xs), flexWrap: "wrap", justifyContent: "space-between" } },
      h(Button, { title: `${open ? "Hide" : "View"} chart data ${open ? GLYPH.chevronUp : GLYPH.chevronDown}`, variant: "ghost", size: "s", onPress: () => setOpen(!open), "aria-expanded": open, style: { marginLeft: -8 } }),
      linkLabel ? h(Button, { title: `${linkLabel} ${GLYPH.arrowRight}`, variant: "soft", size: "s", accessibilityRole: "link", accessibilityLabel: linkLabel, onPress: () => send(onAction, "open-link", href) }) : null),
    open ? h(View, { style: { borderWidth: 1, borderColor: c.line, borderRadius: theme.radius.s, overflow: "hidden" } },
      h(View, { style: { ...row(8), paddingHorizontal: theme.space.s, paddingVertical: 6, backgroundColor: c.sunken } },
        h(Text, { size: "xs", weight: "semibold", tone: "muted", style: { flex: 1.2 } }, unit === "d" ? "Day" : "Label"), labels.map((label, column) => h(Text, { key: column, size: "xs", weight: "semibold", tone: "muted", align: "right", style: { flex: 1 } }, label))),
      visible.map((entry, index) => h(DataRow, { key: index, label: entry.label, values: entry.values }))) : null);
}

// ---------------------------------------------------------------- application-table
const compare = (a, b) => { const x = num(a), y = num(b); return x != null && y != null ? x - y : String(a ?? "").localeCompare(String(b ?? ""), undefined, { sensitivity: "base" }); };
const RecordRow = memo(function RecordRow({ entry, first, table, columns, statusAt, others, last, tones, onOpen }) {
  const theme = useTheme(), c = theme.colors, cells = entry.cells ?? EMPTY;
  const badge = statusAt >= 0 && cells[statusAt] ? h(Tag, { tone: statusTone(cells[statusAt], tones) }, cells[statusAt]) : null;
  return h(Pressable, { onPress: () => onOpen(entry.id), accessibilityRole: "button", accessibilityLabel: columns.map((column, index) => `${column}: ${cells[index] ?? ""}`).join(", "),
    style: ({ pressed }) => ({ minHeight: 60, paddingVertical: theme.space.xs, paddingHorizontal: theme.space.m, ...row(theme.space.s), borderTopWidth: first && !table ? 0 : 1, borderTopColor: c.line, backgroundColor: pressed ? c.sunken : "transparent" }) },
    table ? columns.map((column, at) => h(View, { key: at, style: { flex: at ? 1 : 1.4, alignItems: "flex-start" } },
      at === statusAt ? badge : h(Text, { size: "sm", weight: at ? "regular" : "semibold", numberOfLines: 1 }, cells[at])))
      : [h(View, { key: "main", style: { flex: 1, gap: 1 } },
        h(Text, { weight: "semibold", numberOfLines: 1 }, cells[0]),
        h(Text, { size: "sm", tone: "muted", numberOfLines: 1 }, others.filter((at) => at !== last).map((at) => cells[at]).filter(Boolean).join(" · "))),
      h(View, { key: "side", style: { alignItems: "flex-end", gap: 3 } },
        last >= 0 ? h(Text, { size: "sm", weight: "semibold", style: tabular }, cells[last]) : null, badge)],
    h(Text, { key: "go", tone: "muted", size: "lg" }, GLYPH.chevronRight));
});
/**
 * A record list with search, sort and a status filter. On a phone each record is a row: the first cell is the
 * title, the cells between are the detail line, the last cell and the status badge sit on the right. From 768pt
 * (or layout="columns") it is a table with pressable column headers. The web kit's scrolling <table> is not used
 * because a wide table does not fit a phone.
 * model: { title, description, columns: string[], rows: [{ id, cells: string[] }], statusColumn?, tones? }.
 * statusColumn is a column name or index (default: the column called "Status"); its cells become badges and
 * filter chips. Pressing a record calls onAction({ action: "view-record", id }). Long lists show pageSize
 * records at a time with a "Show more" button, because the list sits inside the screen's scroll view.
 */
export function ApplicationTable({ model = {}, onAction, searchable = true, sortable = true, layout = "auto", pageSize = 25, style }) {
  const theme = useTheme(), c = theme.colors, { width } = useWindowDimensions();
  const columns = model.columns ?? EMPTY, rows = model.rows ?? EMPTY, size = Math.max(1, pageSize);
  const [query, setQuery] = useState(""), [sort, setSort] = useState({ column: -1, dir: 1 }), [status, setStatus] = useState(null), [limit, setLimit] = useState(size);
  const statusAt = typeof model.statusColumn === "number" ? model.statusColumn : columns.findIndex((column) => String(column).toLowerCase() === String(model.statusColumn ?? "status").toLowerCase());
  const statuses = useMemo(() => { // [status, how many records have it], in order of first appearance
    const counts = new Map();
    if (statusAt >= 0) for (const entry of rows) { const value = entry.cells?.[statusAt]; if (value) counts.set(value, (counts.get(value) ?? 0) + 1); }
    return [...counts];
  }, [rows, statusAt]);
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const kept = rows.filter((entry) => (!status || entry.cells?.[statusAt] === status) && (!term || (entry.cells ?? []).join(" ").toLowerCase().includes(term)));
    return sort.column < 0 ? kept : [...kept].sort((a, b) => compare(a.cells?.[sort.column], b.cells?.[sort.column]) * sort.dir);
  }, [rows, query, status, statusAt, sort]);
  const others = useMemo(() => columns.map((_, index) => index).filter((index) => index !== 0 && index !== statusAt), [columns, statusAt]), last = others.length > 1 ? others[others.length - 1] : -1;
  const table = layout === "columns" || (layout === "auto" && width >= WIDE);
  const open = useStable((id) => send(onAction, "view-record", id));
  const search = useCallback((text) => { setQuery(text); setLimit(size); }, [size]);
  const filter = useCallback((value) => { setStatus((now) => (now === value ? null : value)); setLimit(size); }, [size]);
  const sortBy = useCallback((column) => { setSort((now) => (now.column !== column ? { column, dir: 1 } : now.dir === 1 ? { column, dir: -1 } : { column: -1, dir: 1 })); setLimit(size); }, [size]);
  const arrow = (column) => (sort.column === column ? (sort.dir === 1 ? GLYPH.arrowUp : GLYPH.arrowDown) : null);
  const page = visible.length > limit ? visible.slice(0, limit) : visible, hidden = visible.length - page.length;
  return h(Card, { style },
    h(Head, { title: model.title, description: model.description, trailing: h(Tag, { accessibilityLabel: `${visible.length} of ${rows.length} records` }, visible.length === rows.length ? `${rows.length}` : `${visible.length} of ${rows.length}`) }),
    searchable ? h(TextField, { value: query, onChangeText: search, placeholder: "Search records", accessibilityLabel: "Search records", autoCapitalize: "none", autoCorrect: false, returnKeyType: "search" }) : null,
    statuses.length > 1 ? h(ChipRow, { label: "Filter by status" },
      h(Chip, { label: "All", value: null, selected: !status, onSelect: filter, detail: rows.length }),
      statuses.map(([value, total]) => h(Chip, { key: value, label: value, value, selected: status === value, onSelect: filter, detail: total }))) : null,
    sortable && !table && columns.length ? h(ChipRow, { label: "Sort" }, columns.map((column, index) => h(Chip, { key: index, label: column, value: index, selected: sort.column === index, detail: arrow(index), onSelect: sortBy }))) : null,
    h(View, { style: { marginHorizontal: -theme.space.m, marginBottom: -theme.space.m, borderTopWidth: 1, borderTopColor: c.line } },
      table ? h(View, { style: { ...row(theme.space.s), paddingHorizontal: theme.space.m, minHeight: 40, backgroundColor: c.sunken } },
        columns.map((column, index) => h(Pressable, { key: index, disabled: !sortable, onPress: () => sortBy(index), accessibilityRole: "button", accessibilityLabel: `Sort by ${column}`, hitSlop: 6, style: { flex: index ? 1 : 1.4, ...row(4) } },
          h(Text, { size: "xs", weight: "bold", tone: sort.column === index ? "accent" : "muted", numberOfLines: 1 }, column), arrow(index) ? h(Text, { size: "xs", weight: "bold", tone: "accent" }, arrow(index)) : null)),
        h(Text, { size: "lg", style: { opacity: 0 } }, GLYPH.chevronRight)) : null,
      page.length ? page.map((entry, index) => h(RecordRow, { key: entry.id ?? index, entry, first: index === 0, table, columns, statusAt, others, last, tones: model.tones, onOpen: open }))
        : h(View, { style: { padding: theme.space.l, alignItems: "center", gap: theme.space.xs } },
          h(Text, { weight: "semibold" }, rows.length ? "No records match" : "No records yet"),
          rows.length ? h(Text, { size: "sm", tone: "muted", align: "center" }, "Try another search or clear the filter.") : null,
          rows.length ? h(Button, { title: "Clear filters", variant: "soft", size: "s", style: { alignSelf: "center" }, onPress: () => { setQuery(""); setStatus(null); } }) : null),
      hidden > 0 ? h(View, { style: { ...row(theme.space.s), justifyContent: "space-between", paddingHorizontal: theme.space.m, paddingVertical: theme.space.xs, borderTopWidth: 1, borderTopColor: c.line } },
        h(Text, { size: "sm", tone: "muted" }, `Showing ${page.length} of ${visible.length}`),
        h(Button, { title: `Show ${Math.min(size, hidden)} more`, variant: "soft", size: "s", onPress: () => setLimit(limit + size) })) : null));
}

// ---------------------------------------------------------------- application-board
const DealCard = memo(function DealCard({ deal, onOpen }) {
  const theme = useTheme(), c = theme.colors;
  return h(Pressable, { onPress: () => onOpen(deal.id), accessibilityRole: "button", accessibilityLabel: `${deal.company}, ${deal.value}, ${deal.owner}. Change stage`,
    style: ({ pressed }) => ({ padding: theme.space.s, gap: theme.space.xs, borderRadius: theme.radius.m, borderWidth: 1, borderColor: c.line, backgroundColor: pressed ? c.bg : c.surface, ...depth(theme.shadow.s) }) },
    h(View, { style: row(theme.space.xs, "flex-start") },
      h(Text, { weight: "semibold", numberOfLines: 2, style: { flex: 1 } }, deal.company), h(Text, { tone: "muted", weight: "bold" }, GLYPH.more)),
    h(Text, { size: "lg", weight: "bold", style: { letterSpacing: -0.3 } }, deal.value),
    deal.next ? h(Text, { size: "sm", tone: "muted", numberOfLines: 2 }, deal.next) : null,
    h(View, { style: row(theme.space.xs) }, h(Avatar, { name: deal.owner, size: 24 }), h(Text, { size: "sm", tone: "muted", numberOfLines: 1, style: { flex: 1 } }, deal.owner)));
});
const Lane = memo(function Lane({ lane, width, onOpen }) {
  const theme = useTheme(), c = theme.colors, deals = lane.deals ?? EMPTY;
  const values = deals.map((deal) => num(deal.value)), total = values.length && values.every((value) => value != null) ? money(values.reduce((sum, value) => sum + value, 0), deals[0].value) : null;
  return h(View, { accessibilityLabel: `${lane.title}, ${deals.length} ${deals.length === 1 ? "opportunity" : "opportunities"}`, style: { width, padding: theme.space.xs, gap: theme.space.xs, borderRadius: theme.radius.l, borderWidth: 1, borderColor: c.line, backgroundColor: c.sunken } },
    h(View, { style: { ...row(theme.space.xs), paddingHorizontal: theme.space["2xs"], minHeight: 32 } },
      h(Text, { weight: "bold", numberOfLines: 1, style: { flexShrink: 1 } }, lane.title), h(Tag, { style: { backgroundColor: c.surface } }, deals.length),
      h(View, { style: { flex: 1 } }), total ? h(Text, { size: "sm", tone: "muted", weight: "medium" }, total) : null),
    deals.length ? deals.map((deal) => h(DealCard, { key: deal.id, deal, onOpen }))
      : h(View, { style: { minHeight: 72, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.m, borderWidth: 1, borderStyle: "dashed", borderColor: c.line } }, h(Text, { size: "sm", tone: "muted" }, "No opportunities")));
});
/**
 * A kanban board: lanes in a horizontal pager that snaps lane by lane, with chips to jump to a lane.
 * Pressing a card calls onAction({ action: "edit-deal", id }) and opens a sheet to move it to another lane, which
 * calls onAction({ action: "move-deal", id, value: laneId }). Dragging between lanes needs a gesture library, so
 * the sheet is the way to move a card. The board keeps its own copy of the lanes, so a move shows at once, and
 * takes a new copy when the content of model.lanes changes (an equal model on a re-render keeps the moves).
 * model: { title, description, lanes: [{ id, title, deals: [{ id, company, value, owner, next? }] }] }.
 */
export function ApplicationBoard({ model = {}, onAction, style }) {
  const theme = useTheme(), window = useWindowDimensions(), pager = useRef(null), chips = useRef(null);
  const given = useMemo(() => JSON.stringify(model.lanes ?? EMPTY), [model.lanes]);
  const [state, setState] = useState({ given, lanes: model.lanes ?? EMPTY });
  if (state.given !== given) setState({ given, lanes: model.lanes ?? EMPTY });
  const lanes = state.lanes, [at, setAt] = useState(0), [open, setOpen] = useState(null), [measured, setMeasured] = useState(0);
  const gap = theme.space.s, laneWidth = Math.max(220, Math.min(300, (measured || window.width - theme.space.m * 2) - 56));
  const openLane = lanes.find((lane) => lane.deals?.some((deal) => deal.id === open)), openDeal = openLane?.deals.find((deal) => deal.id === open);
  // Keeps the chip of the lane in view (chip widths are not measured, so the offset is an estimate).
  const show = (index) => { setAt(index); if (index >= lanes.length - 1) chips.current?.scrollToEnd({ animated: true }); else chips.current?.scrollTo({ x: Math.max(0, index * 96 - 48), animated: true }); };
  const jump = useStable((index) => { show(index); pager.current?.scrollTo({ x: index * (laneWidth + gap), animated: true }); });
  const edit = useStable((id) => { setOpen(id); send(onAction, "edit-deal", id); });
  const move = useStable((laneId) => {
    setOpen(null);
    if (!openDeal || laneId === openLane.id) return;
    // Only the two lanes involved become new objects, so the other lanes do not render again.
    const next = lanes.map((lane) => (lane.id === laneId ? { ...lane, deals: [...(lane.deals ?? EMPTY), openDeal] } : lane.id === openLane.id ? { ...lane, deals: lane.deals.filter((deal) => deal.id !== open) } : lane));
    setState({ given, lanes: next }); send(onAction, "move-deal", open, { value: laneId });
  });
  return h(View, { style: flat({ gap: theme.space.xs }, style), onLayout: (event) => setMeasured(event.nativeEvent.layout.width) },
    h(Head, { title: model.title, description: model.description }),
    h(ChipRow, { label: "Stages", innerRef: chips }, lanes.map((lane, index) => h(Chip, { key: lane.id, label: lane.title, value: index, detail: lane.deals?.length ?? 0, selected: index === at, onSelect: jump }))),
    h(ScrollView, { ref: pager, horizontal: true, showsHorizontalScrollIndicator: false, snapToInterval: laneWidth + gap, decelerationRate: "fast", scrollEventThrottle: 32,
      onScroll: (event) => { const index = Math.round(event.nativeEvent.contentOffset.x / (laneWidth + gap)); if (index !== at && index >= 0 && index < lanes.length) show(index); },
      contentContainerStyle: { gap, alignItems: "flex-start", paddingBottom: theme.space["2xs"] } },
      lanes.map((lane) => h(Lane, { key: lane.id, lane, width: laneWidth, onOpen: edit }))),
    h(Sheet, { visible: !!openDeal, onClose: () => setOpen(null), title: openDeal?.company },
      openDeal ? h(Stack, { gap: "xs" },
        h(Text, { tone: "muted" }, [openDeal.value, openDeal.owner].filter(Boolean).join(" · ")),
        h(Text, { size: "xs", weight: "bold", tone: "muted", style: flat(caps, { marginTop: theme.space.xs }) }, "Move to stage"),
        h(Stack, { gap: "3xs" }, lanes.map((lane) => h(OptionRow, { key: lane.id, label: lane.title, value: lane.id, selected: lane.id === openLane.id, onSelect: move }))),
        h(Button, { title: "Close", variant: "ghost", block: true, onPress: () => setOpen(null) })) : null));
}

// ---------------------------------------------------------------- application-projects
const ProjectCard = memo(function ProjectCard({ project, basis, tones, onOpen }) {
  const theme = useTheme(), progress = Math.min(100, Math.max(0, Number(project.progress) || 0));
  return h(Card, { padded: false, gap: 0, style: { flexGrow: 1, flexBasis: basis, overflow: "hidden" } },
    h(Tile, { label: project.name, tone: project.tone, source: project.source, height: 104, radius: 0 }),
    h(View, { style: { padding: theme.space.m, gap: theme.space.s } },
      h(View, { style: row(theme.space.xs, "flex-start") },
        h(View, { style: { flex: 1, gap: 2 } }, h(Heading, { level: 4 }, project.name), project.description ? h(Text, { size: "sm", tone: "muted" }, project.description) : null),
        project.status ? h(Tag, { tone: statusTone(project.status, tones) }, project.status) : null),
      h(View, { style: { gap: theme.space["2xs"] } },
        h(View, { style: { ...row(8), justifyContent: "space-between" } }, h(Text, { size: "xs", weight: "semibold", tone: "muted" }, "Progress"), h(Text, { size: "xs", weight: "bold" }, `${progress}%`)),
        h(Progress, { value: progress / 100, tone: progress >= 100 ? "ok" : "accent" })),
      h(View, { style: { ...row(theme.space.xs), justifyContent: "space-between" } },
        h(View, { accessibilityLabel: project.members?.length ? `Members: ${project.members.join(", ")}` : undefined, style: { flexDirection: "row", alignItems: "center", paddingLeft: 6 } },
          (project.members ?? EMPTY).slice(0, 4).map((name) => h(Avatar, { key: name, name, size: 28, style: { marginLeft: -6, borderWidth: 2, borderColor: theme.colors.surface } })),
          project.members?.length > 4 ? h(Text, { size: "xs", tone: "muted", weight: "semibold", style: { marginLeft: 6 } }, `+${project.members.length - 4}`) : null),
        h(Button, { title: "View project", variant: "soft", size: "s", accessibilityLabel: `View project ${project.name}`, onPress: () => onOpen(project.id) }))));
});
/**
 * Project cards: a cover, name, description, progress and a details button.
 * model: { title, description, projects: [{ id, name, description, progress (0–100), image?, source?, status?,
 * members?: string[], tone? }] }. The button calls onAction({ action: "view-project", id }).
 */
export function ApplicationProjects({ model = {}, onAction, style }) {
  const theme = useTheme(), { width } = useWindowDimensions(), projects = model.projects ?? EMPTY;
  const open = useStable((id) => send(onAction, "view-project", id));
  return h(View, { style: flat({ gap: theme.space.s }, style) },
    h(Head, { title: model.title, description: model.description }),
    h(View, { style: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.s } },
      projects.map((project) => h(ProjectCard, { key: project.id, project, basis: width >= WIDE ? "40%" : "100%", tones: model.tones, onOpen: open }))));
}

// ---------------------------------------------------------------- application-planner
const DayTab = memo(function DayTab({ entry, selected, onSelect }) {
  const theme = useTheme(), c = theme.colors;
  return h(Pressable, { onPress: () => onSelect(entry.id), accessibilityRole: "tab", accessibilityLabel: `${entry.label} ${entry.day}`, accessibilityState: { selected }, "aria-selected": selected,
    style: ({ pressed }) => ({ flex: 1, minHeight: 56, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.m, borderWidth: 1, borderColor: selected ? c.accent : c.line, backgroundColor: selected ? c.accent : pressed ? c.sunken : c.surface }) },
    h(Text, { size: "xs", weight: "medium", style: { color: selected ? c.brandFg : c.muted } }, entry.label),
    h(Text, { weight: "bold", style: { color: selected ? c.brandFg : c.fg } }, entry.day));
});
const AgendaItem = memo(function AgendaItem({ event, first, last, onOpen }) {
  const theme = useTheme(), c = theme.colors, tone = theme.tones[toneName(event.tone) ?? "accent"];
  return h(View, { style: { flexDirection: "row", gap: theme.space.xs } },
    h(Text, { size: "sm", weight: "semibold", align: "right", style: flat({ width: 66, paddingTop: 13 }, tabular) }, event.time),
    h(View, { style: { width: 14, alignItems: "center" } },
      h(View, { style: { width: 2, height: 17, backgroundColor: first ? "transparent" : c.line } }),
      h(View, { style: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: tone.fg, backgroundColor: c.surface } }),
      h(View, { style: { width: 2, flex: 1, backgroundColor: last ? "transparent" : c.line } })),
    h(Pressable, { onPress: () => onOpen(event.id), accessibilityRole: "button", accessibilityLabel: [event.time, event.title, event.location, event.tag].filter(Boolean).join(", "),
      style: ({ pressed }) => ({ flex: 1, marginVertical: theme.space["2xs"], minHeight: theme.touch, paddingVertical: theme.space.xs, paddingHorizontal: theme.space.s, ...row(theme.space.xs), borderRadius: theme.radius.m, borderLeftWidth: 3, borderLeftColor: tone.fg, backgroundColor: pressed ? tone.soft : tone.tint }) },
      h(View, { style: { flex: 1, gap: 1 } },
        h(Text, { weight: "semibold", numberOfLines: 2 }, event.title),
        event.location ? h(Text, { size: "sm", tone: "muted", numberOfLines: 2 }, event.location) : null,
        event.tag ? h(Tag, { tone: event.tone ?? "accent", style: { alignSelf: "flex-start", marginTop: 4 } }, event.tag) : null),
      h(Text, { tone: "muted", size: "lg" }, GLYPH.chevronRight)));
});
/**
 * A day's agenda: an optional strip of days, then events on a time rail.
 * model: { title, description, events: [{ id, datetime?, time, title, location, day?, tag?, tone? }],
 * days?: [{ id, label, day }], day? }. Events are ordered by datetime. With days, an event that has a day shows
 * only on that day, and pressing a day calls onAction({ action: "select-day", id }). Pressing an event calls
 * onAction({ action: "view-event", id }).
 */
export function ApplicationPlanner({ model = {}, onAction, style }) {
  const theme = useTheme(), days = model.days ?? EMPTY;
  const [day, setDay] = useState(model.day ?? days[0]?.id);
  const events = useMemo(() => (model.events ?? EMPTY).filter((event) => !days.length || event.day == null || event.day === day)
    .sort((a, b) => String(a.datetime ?? "").localeCompare(String(b.datetime ?? ""))), [model.events, days, day]);
  const select = useStable((id) => { setDay(id); send(onAction, "select-day", id); });
  const open = useStable((id) => send(onAction, "view-event", id));
  return h(Card, { style },
    h(Head, { title: model.title, description: model.description, trailing: h(Tag, { tone: events.length ? "accent" : undefined }, `${events.length} ${events.length === 1 ? "event" : "events"}`) }),
    days.length ? h(View, { accessibilityRole: "tablist", style: { flexDirection: "row", gap: theme.space["2xs"] } }, days.map((entry) => h(DayTab, { key: entry.id, entry, selected: entry.id === day, onSelect: select }))) : null,
    events.length ? h(View, null, events.map((event, index) => h(AgendaItem, { key: event.id, event, first: index === 0, last: index === events.length - 1, onOpen: open })))
      : h(View, { style: { padding: theme.space.l, alignItems: "center", gap: theme.space["2xs"] } }, h(Text, { weight: "semibold" }, "Nothing scheduled"), h(Text, { size: "sm", tone: "muted" }, "Enjoy the free time.")));
}

// ---------------------------------------------------------------- application-identity
/**
 * A profile card: cover, portrait, name, role, optional figures, account details and an edit button.
 * model: { id?, name, role, image?, source?, status?, stats?: [{ label, value }], details: [{ label, value }],
 * editLabel? }. The button calls onAction({ action: "edit-profile", id }); pair it with ApplicationForm.
 */
export const ApplicationIdentity = memo(function ApplicationIdentity({ model = {}, onAction, style }) {
  const theme = useTheme(), c = theme.colors;
  return h(Card, { padded: false, gap: 0, style: flat({ overflow: "hidden" }, style) },
    h(Tile, { label: model.name, tone: "accent", height: 76, radius: 0 }, h(View)),
    h(View, { style: { padding: theme.space.m, paddingTop: 0, gap: theme.space.s } },
      h(View, { style: { ...row(theme.space.s, "flex-end"), marginTop: -32 } },
        h(Avatar, { name: model.name, source: model.source, size: 72, style: { borderWidth: 3, borderColor: c.surface } }),
        h(View, { style: { flex: 1 } }), model.status ? h(Tag, { tone: statusTone(model.status, model.tones), style: { alignSelf: "flex-end", marginBottom: 6 } }, model.status) : null),
      h(View, { style: { gap: 2 } }, h(Heading, { level: 3 }, model.name), model.role ? h(Text, { tone: "muted" }, model.role) : null),
      model.stats?.length ? h(View, { style: { flexDirection: "row", borderRadius: theme.radius.m, backgroundColor: c.sunken } }, model.stats.map((stat, index) =>
        h(View, { key: stat.label, accessibilityLabel: `${stat.label}: ${stat.value}`, style: { flex: 1, paddingVertical: theme.space.xs, alignItems: "center", borderLeftWidth: index ? 1 : 0, borderLeftColor: c.line } },
          h(Text, { weight: "bold" }, stat.value), h(Text, { size: "xs", tone: "muted" }, stat.label)))) : null,
      h(View, null, (model.details ?? EMPTY).map((detail, index) => h(View, { key: detail.label, style: { ...row(theme.space.s), minHeight: 40, paddingVertical: theme.space["2xs"], borderTopWidth: index ? 1 : 0, borderTopColor: c.line } },
        h(Text, { size: "sm", tone: "muted", style: { width: 92 } }, detail.label),
        h(Text, { size: "sm", weight: "medium", align: "right", style: { flex: 1 } }, detail.value)))),
      h(Button, { title: model.editLabel ?? "Edit profile", variant: "outline", block: true, onPress: () => send(onAction, "edit-profile", model.id) })));
});

// ---------------------------------------------------------------- application-products
const amountOf = (product) => Number(product.amount) || num(product.price) || 0;
const Stepper = ({ glyph, label, onPress, disabled }) => {
  const theme = useTheme(), c = theme.colors;
  return h(Pressable, { onPress, disabled, hitSlop: 6, accessibilityRole: "button", accessibilityLabel: label, accessibilityState: { disabled: !!disabled }, "aria-disabled": !!disabled,
    style: ({ pressed }) => ({ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: c.line, backgroundColor: pressed ? c.sunken : c.surface, opacity: disabled ? 0.4 : 1 }) },
    h(Text, { weight: "bold", style: { lineHeight: 20 } }, glyph));
};
const ProductCard = memo(function ProductCard({ product, quantity, onSet }) {
  const theme = useTheme(), limit = num(product.stock) ?? Infinity, soldOut = limit <= 0;
  return h(Card, { style: { padding: theme.space.s } },
    h(View, { style: row(theme.space.s) },
      h(Tile, { label: product.name, tone: product.tone, source: product.source, height: 72, width: 72 }),
      h(View, { style: { flex: 1, gap: 1 } },
        h(Text, { weight: "semibold", numberOfLines: 2 }, product.name),
        h(Text, { size: "lg", weight: "bold", style: { letterSpacing: -0.3 } }, product.price),
        product.stock ? h(Text, { size: "xs", tone: soldOut ? "bad" : limit <= 3 ? "warn" : "muted", weight: "medium" }, product.stock) : null),
      quantity > 0 ? h(View, { style: row(theme.space.xs) },
        h(Stepper, { glyph: GLYPH.minus, label: `Remove one ${product.name}`, onPress: () => onSet(product, quantity - 1) }),
        h(Text, { weight: "bold", align: "center", accessibilityLabel: `${quantity} in order`, style: flat({ minWidth: 20 }, tabular) }, quantity),
        h(Stepper, { glyph: GLYPH.plus, label: `Add one ${product.name}`, onPress: () => onSet(product, quantity + 1), disabled: quantity >= limit }))
        : h(Button, { title: soldOut ? "Sold out" : "Add", variant: "soft", size: "s", style: { alignSelf: "center" }, disabled: soldOut, accessibilityLabel: soldOut ? `${product.name} is sold out` : `Add ${product.name} to order`, onPress: () => onSet(product, 1) })));
});
/**
 * A product catalog with quantities and a running order total.
 * model: { title, description, products: [{ id, name, price, amount, stock, image?, source?, tone? }],
 * checkoutLabel? }. price is the text shown, amount the number used for the total; the leading number of stock
 * ("12 available") caps the quantity. Adding or changing a quantity calls onAction({ action: "add-product", id,
 * value: quantity }); reaching zero calls "remove-product"; the button calls onAction({ action: "checkout",
 * value: { [id]: quantity }, total }). It keeps its own quantities unless quantities and onQuantitiesChange are given.
 */
export function ApplicationProducts({ model = {}, onAction, quantities, onQuantitiesChange, style }) {
  const theme = useTheme(), c = theme.colors, products = model.products ?? EMPTY;
  const [own, setOwn] = useState({}), cart = quantities ?? own;
  const set = useStable((product, quantity) => {
    const next = { ...cart }; if (quantity > 0) next[product.id] = quantity; else delete next[product.id];
    if (quantities === undefined) setOwn(next); onQuantitiesChange?.(next);
    send(onAction, quantity > 0 ? "add-product" : "remove-product", product.id, { value: quantity });
  });
  const chosen = products.filter((product) => cart[product.id] > 0), sample = products[0]?.price;
  const total = chosen.reduce((sum, product) => sum + amountOf(product) * cart[product.id], 0), units = chosen.reduce((sum, product) => sum + cart[product.id], 0);
  return h(View, { style: flat({ gap: theme.space.s }, style) },
    h(Head, { title: model.title, description: model.description }),
    products.map((product) => h(ProductCard, { key: product.id, product, quantity: cart[product.id] ?? 0, onSet: set })),
    h(View, { accessibilityLiveRegion: "polite", style: { padding: theme.space.m, gap: theme.space.xs, borderRadius: theme.radius.l, borderWidth: 1, borderColor: c.line, backgroundColor: c.sunken } },
      h(Text, { size: "xs", weight: "bold", tone: "muted", style: caps }, "Order summary"),
      chosen.length ? chosen.map((product) => h(View, { key: product.id, style: { ...row(theme.space.xs), justifyContent: "space-between" } },
        h(Text, { size: "sm", numberOfLines: 1, style: { flex: 1 } }, `${product.name} × ${cart[product.id]}`),
        h(Text, { size: "sm", weight: "medium", style: tabular }, money(amountOf(product) * cart[product.id], sample))))
        : h(Text, { size: "sm", tone: "muted" }, "Your order is empty. Add a product to start."),
      h(Divider),
      h(View, { style: { ...row(theme.space.xs), justifyContent: "space-between" } },
        h(Text, { weight: "semibold" }, `Total${units ? ` · ${units} ${units === 1 ? "item" : "items"}` : ""}`),
        h(Text, { size: "lg", weight: "bold", style: tabular }, money(total, sample))),
      h(Button, { title: model.checkoutLabel ?? "Create order", block: true, disabled: !chosen.length, onPress: () => send(onAction, "checkout", undefined, { value: { ...cart }, total }) })));
}

// ---------------------------------------------------------------- application-receipt
function ReceiptLine({ entry, strong }) {
  const look = strong ? { size: "md", weight: "medium" } : { size: "sm", tone: "muted" };
  return h(View, { style: { ...row(12, "flex-start"), justifyContent: "space-between" } },
    h(View, { style: { flex: 1 } }, h(Text, look, entry.label), entry.detail ? h(Text, { size: "xs", tone: "muted" }, entry.detail) : null),
    h(Text, { ...look, style: tabular }, entry.amount));
}
/**
 * An order receipt: line items, optional sub-totals, the total and a download button.
 * model: { id?, title, description, status?, items: [{ label, amount, detail? }], totals?: [{ label, amount }],
 * total, note?, downloadLabel? }. A phone has no download link, so the button calls
 * onAction({ action: "download-receipt", id }) and the app shares or saves the file.
 */
export const ApplicationReceipt = memo(function ApplicationReceipt({ model = {}, onAction, style }) {
  const theme = useTheme(), c = theme.colors;
  const dashed = (key) => h(View, { key, style: { height: 1, borderTopWidth: 1, borderStyle: "dashed", borderColor: c.line } });
  return h(Card, { style },
    h(Head, { title: model.title, description: model.description, trailing: model.status ? h(Tag, { tone: statusTone(model.status, model.tones) }, model.status) : null }),
    dashed("top"),
    h(View, { style: { gap: theme.space.xs } }, (model.items ?? EMPTY).map((entry, index) => h(ReceiptLine, { key: index, entry, strong: true }))),
    model.totals?.length ? [dashed("rule"), h(View, { key: "totals", style: { gap: theme.space["2xs"] } }, model.totals.map((entry, index) => h(ReceiptLine, { key: index, entry })))] : null,
    h(View, { accessibilityLabel: `Total: ${model.total}`, style: { ...row(theme.space.s), justifyContent: "space-between", padding: theme.space.s, borderRadius: theme.radius.m, backgroundColor: c.sunken } },
      h(Text, { weight: "bold" }, "Total"), h(Text, { size: "xl", weight: "bold", style: flat({ letterSpacing: -0.4 }, tabular) }, model.total)),
    model.note ? h(Text, { size: "xs", tone: "muted" }, model.note) : null,
    h(Button, { title: `${GLYPH.arrowDown}  ${model.downloadLabel ?? "Download receipt"}`, variant: "outline", block: true, accessibilityLabel: model.downloadLabel ?? "Download receipt", onPress: () => send(onAction, "download-receipt", model.id ?? model.title) }));
});

// ---------------------------------------------------------------- application-conversation
const TicketRow = memo(function TicketRow({ ticket, status, selected, tones, onSelect }) {
  const theme = useTheme(), c = theme.colors;
  return h(Pressable, { onPress: () => onSelect(ticket.id), accessibilityRole: "button", accessibilityLabel: `${ticket.customer}: ${ticket.title}, ${status}`, accessibilityState: { selected }, "aria-current": selected ? "true" : undefined,
    style: ({ pressed }) => ({ minHeight: 64, paddingVertical: theme.space.xs, paddingRight: theme.space.m, paddingLeft: theme.space.m - 3, ...row(theme.space.s), borderTopWidth: 1, borderTopColor: c.line, borderLeftWidth: 3, borderLeftColor: selected ? c.accent : "transparent", backgroundColor: selected ? c.accentSoft : pressed ? c.sunken : "transparent" }) },
    h(Avatar, { name: ticket.customer, source: ticket.source, size: 36 }),
    h(View, { style: { flex: 1, gap: 1 } },
      h(Text, { size: "sm", weight: "semibold", numberOfLines: 1 }, ticket.customer),
      h(Text, { size: "sm", tone: "muted", numberOfLines: 1 }, ticket.title)),
    h(Tag, { tone: statusTone(status, tones) }, status));
});
const Bubble = memo(function Bubble({ message }) {
  const theme = useTheme(), c = theme.colors, own = !!message.own;
  return h(View, { style: { ...row(theme.space.xs, "flex-end"), flexDirection: own ? "row-reverse" : "row" } },
    own ? null : h(Avatar, { name: message.author, size: 28 }),
    h(View, { style: { maxWidth: "82%", gap: 2, alignItems: own ? "flex-end" : "flex-start" } },
      h(Text, { size: "xs", tone: "muted" }, [message.author, message.time].filter(Boolean).join(" · ")),
      h(View, { style: { paddingVertical: theme.space.xs, paddingHorizontal: theme.space.s, borderRadius: theme.radius.m, backgroundColor: own ? c.accent : c.sunken, [own ? "borderBottomRightRadius" : "borderBottomLeftRadius"]: 4 } },
        h(Text, { size: "sm", style: { color: own ? c.brandFg : c.fg } }, message.text))));
});
/**
 * A support desk: the ticket queue, then the selected ticket with assignment, status, the thread and a reply box.
 * model: { tickets: [{ id, customer, title, status, message, messages? }], selected: { id, customer, title,
 * status, message, assigned, messages? }, agents: string[], statuses: string[] }; messages is
 * [{ author, text, time?, own? }] and defaults to the customer's message.
 * Actions, as on the web: "select-ticket" { id }, "assign-ticket" { id, value }, "ticket-status" { id, value }.
 * Sending calls onSubmit({ form: "reply", id, values: { reply } }); an empty reply is refused with a message.
 * The two <select> elements of the web kit are fields that open a sheet. The desk shows choices and replies at
 * once and keeps them until the content of model.tickets changes; storing them is the application's job.
 */
export function ApplicationConversation({ model = {}, onAction, onSubmit, style }) {
  const theme = useTheme(), c = theme.colors, { width } = useWindowDimensions();
  const tickets = model.tickets ?? EMPTY, wanted = model.selected?.id;
  const given = useMemo(() => JSON.stringify(tickets), [tickets]);
  const [state, setState] = useState({ given, wanted, id: wanted ?? tickets[0]?.id, edits: {}, replies: {} });
  if (state.given !== given) setState({ given, wanted, id: wanted ?? (tickets.some((ticket) => ticket.id === state.id) ? state.id : tickets[0]?.id), edits: {}, replies: {} });
  else if (state.wanted !== wanted) setState({ ...state, wanted, id: wanted ?? state.id });
  const [draft, setDraft] = useState(""), [error, setError] = useState(null), wide = width >= WIDE;
  const found = tickets.find((entry) => entry.id === state.id), base = wanted === state.id ? { ...found, ...model.selected } : found;
  const ticket = base ? { assigned: "Unassigned", ...base, ...state.edits[base.id] } : null;
  const patch = (key, value) => setState((now) => ({ ...now, edits: { ...now.edits, [ticket.id]: { ...now.edits[ticket.id], [key]: value } } }));
  const own = ticket ? state.replies[ticket.id] : null;
  const messages = useMemo(() => (ticket ? [...(ticket.messages ?? (ticket.message ? [{ author: ticket.customer, text: ticket.message }] : EMPTY)), ...(own ?? EMPTY)] : EMPTY), [ticket?.messages, ticket?.message, ticket?.customer, own]);
  const select = useStable((id) => { if (id !== state.id) { setState((now) => ({ ...now, id })); setDraft(""); setError(null); } send(onAction, "select-ticket", id); });
  const assign = useStable((value) => { patch("assigned", value); send(onAction, "assign-ticket", ticket.id, { value }); });
  const mark = useStable((value) => { patch("status", value); send(onAction, "ticket-status", ticket.id, { value }); });
  const type = useCallback((text) => { setDraft(text); setError(null); }, []);
  const reply = () => {
    const text = draft.trim(), id = ticket.id;
    if (!text) return setError("Write a reply before sending.");
    setState((now) => ({ ...now, replies: { ...now.replies, [id]: [...(now.replies[id] ?? EMPTY), { author: "You", text, own: true, time: "Just now" }] } }));
    setDraft(""); setError(null); onSubmit?.({ form: "reply", id, values: { reply: text } });
  };
  const agents = useMemo(() => ["Unassigned", ...(model.agents ?? EMPTY).filter((agent) => agent !== "Unassigned")], [model.agents]);
  const queue = h(Card, { padded: false, gap: 0, accessibilityLabel: "Tickets", style: flat({ overflow: "hidden" }, wide && { width: 300 }) },
    h(View, { style: { ...row(theme.space.xs), justifyContent: "space-between", paddingHorizontal: theme.space.m, paddingVertical: theme.space.xs, backgroundColor: c.sunken } },
      h(Text, { size: "xs", weight: "bold", tone: "muted", style: caps }, "Tickets"), h(Tag, null, tickets.length)),
    tickets.map((entry) => h(TicketRow, { key: entry.id, ticket: entry, selected: entry.id === state.id, tones: model.tones, onSelect: select,
      status: state.edits[entry.id]?.status ?? (entry.id === wanted ? model.selected.status : null) ?? entry.status })));
  const thread = ticket ? h(Card, { style: wide ? { flex: 1 } : null },
    h(Head, { title: ticket.title, description: `${ticket.customer} · #${ticket.id}`, trailing: h(Tag, { tone: statusTone(ticket.status, model.tones) }, ticket.status) }),
    h(View, { style: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.s } },
      h(Choice, { label: "Assigned to", value: ticket.assigned, options: agents, onChange: assign }),
      h(Choice, { label: "Status", value: ticket.status, options: model.statuses, onChange: mark })),
    h(Divider),
    h(View, { style: { gap: theme.space.s } }, messages.map((message, index) => h(Bubble, { key: index, message }))),
    h(TextField, { label: "Reply", value: draft, onChangeText: type, placeholder: `Write to ${String(ticket.customer).split(" ")[0]}…`, multiline: true, maxLength: 2000, error: error ?? undefined,
      inputStyle: { minHeight: 84, textAlignVertical: "top" } }),
    h(View, { style: { ...row(theme.space.xs), justifyContent: "space-between" } },
      h(Text, { size: "xs", tone: "muted" }, `${draft.length} / 2000`),
      h(Button, { title: "Send reply", onPress: reply }))) : h(Card, null, h(Text, { tone: "muted" }, tickets.length ? "Select a ticket to read it." : "No tickets in the queue."));
  return h(View, { style: flat({ flexDirection: wide ? "row" : "column", alignItems: wide ? "flex-start" : "stretch", gap: theme.space.s }, style) }, queue, thread);
}

// ---------------------------------------------------------------- application-form
const KEYBOARD = { email: "email-address", tel: "phone-pad", number: "numeric", url: "url" };
const AREA_STYLE = { minHeight: 96, textAlignVertical: "top" };
const blank = (value) => value == null || value === false || String(value).trim() === "";
const starting = (fields) => Object.fromEntries(fields.map((field) => [field.name, field.value ?? (field.type === "checkbox" || field.type === "switch" ? false : "")]));
function check(field, value) {
  const boolean = field.type === "checkbox" || field.type === "switch", required = field.required ?? !boolean; // the web form marks every input required
  if (blank(value)) return required ? field.message ?? (boolean ? `Confirm “${field.label}” to continue.` : `${field.label} is required.`) : null;
  if (boolean) return null;
  if (field.type === "email" && !/^\S+@\S+\.\S+$/.test(value)) return "Enter a valid email address.";
  if (field.type === "number" && num(value) == null) return "Enter a number.";
  if (field.type === "url" && !/^https?:\/\/\S+\.\S+/.test(value)) return "Enter a web address that starts with https://.";
  if (field.minLength && String(value).length < field.minLength) return `Use at least ${field.minLength} characters.`;
  if (field.pattern && !new RegExp(`^(?:${field.pattern})$`).test(value)) return field.message ?? `${field.label} is not in the expected format.`;
  return null;
}
/** One field of the form. onChange(name, value) keeps one identity, so typing renders only the field typed in. */
const FormField = memo(function FormField({ field, value, error, onChange }) {
  const theme = useTheme(), type = field.type ?? "text", set = (next) => onChange(field.name, next);
  const options = useMemo(() => (field.options ?? EMPTY).map((option) => (typeof option === "object" ? option : { value: option, label: String(option) })), [field.options]);
  const note = error || field.hint ? h(Text, { size: "xs", tone: error ? "bad" : "muted" }, error || field.hint) : null;
  if (type === "checkbox" || type === "switch") return h(View, { style: { gap: 2 } },
    type === "switch" ? h(Switch, { label: field.label, value: !!value, onValueChange: set }) : h(Checkbox, { label: field.label, checked: !!value, onChange: set }), note);
  if (type === "select" || type === "radio") return h(View, { style: { gap: theme.space["2xs"] } },
    h(Text, { size: "sm", weight: "semibold", tone: error ? "bad" : undefined }, field.label),
    h(RadioGroup, { value, onChange: set, options }), note);
  const area = type === "textarea", prose = type === "text" || area;
  return h(TextField, { label: field.label, value: String(value ?? ""), onChangeText: set, placeholder: field.placeholder, hint: field.hint, error: error ?? undefined,
    maxLength: Number(field.maxLength ?? field.maxlength) || (area ? 2000 : 100), keyboardType: KEYBOARD[type], secureTextEntry: type === "password", multiline: area,
    autoCapitalize: prose ? undefined : "none", autoCorrect: prose ? undefined : false, inputStyle: area ? AREA_STYLE : undefined });
});
/**
 * A form built from model.fields, validated on submit.
 * model: { id?, form?, title, description?, submitLabel, resetLabel?, successMessage?, fields: [{ name, label,
 * type, value?, required?, placeholder?, hint?, maxLength?, minLength?, pattern?, message?, options? }] }.
 * type: text | email | tel | url | number | password | textarea | checkbox | switch | select | radio (the last
 * two take options and show a radio list). As on the web, text inputs are required and limited to 100 characters
 * unless the field says otherwise.
 * onSubmit({ form, id, values }) runs only when every field is valid; otherwise the fields show their errors,
 * which then update as the person types. Uncontrolled by default: the draft survives re-renders and resets when
 * recordKey (or model.id) or resetKey changes. Pass values and onValuesChange to control it. bare drops the card,
 * for a form inside a Sheet or Dialog. The web model's action URL is not used: there is no page to post to.
 */
export function ApplicationForm({ model = {}, onSubmit, onAction, values, onValuesChange, recordKey, resetKey, bare = false, style }) {
  const theme = useTheme(), fields = model.fields ?? EMPTY, key = JSON.stringify([recordKey ?? model.id ?? null, resetKey ?? null]);
  const [state, setState] = useState(() => ({ key, draft: starting(fields), tried: false, done: false }));
  if (state.key !== key) setState({ key, draft: starting(fields), tried: false, done: false });
  const current = values ?? state.draft;
  const errors = useMemo(() => Object.fromEntries(fields.map((field) => [field.name, check(field, current[field.name])])), [fields, current]);
  const invalid = fields.filter((field) => errors[field.name]);
  const change = useStable((name, value) => {
    setState((now) => ({ ...now, draft: values ? now.draft : { ...now.draft, [name]: value }, done: false }));
    onValuesChange?.({ ...current, [name]: value });
  });
  const submit = () => {
    if (invalid.length) return setState({ ...state, tried: true, done: false });
    setState({ ...state, tried: false, done: true }); onSubmit?.({ form: model.form ?? "profile", id: model.id, values: { ...current } });
  };
  const reset = () => { const next = starting(fields); setState({ ...state, draft: next, tried: false, done: false }); onValuesChange?.(next); send(onAction, "reset-form", model.id); };
  return h(bare ? Stack : Card, { gap: "m", style },
    h(Head, { title: model.title, description: model.description }),
    fields.map((field) => h(FormField, { key: field.name, field, value: current[field.name], error: state.tried ? errors[field.name] : null, onChange: change })),
    h(View, { accessibilityLiveRegion: "polite", style: { gap: theme.space.xs } },
      state.tried && invalid.length ? h(Text, { size: "sm", tone: "bad", weight: "medium", accessibilityRole: "alert" }, invalid.length === 1 ? "Fix the highlighted field to continue." : `Fix the ${invalid.length} highlighted fields to continue.`) : null,
      state.done ? h(Text, { size: "sm", tone: "ok", weight: "medium" }, `${GLYPH.check} ${model.successMessage ?? "Saved."}`) : null,
      h(Cluster, { gap: "xs" },
        h(Button, { title: model.submitLabel ?? "Save", onPress: submit }),
        model.resetLabel ? h(Button, { title: model.resetLabel, variant: "ghost", onPress: reset }) : null)));
}

// ---------------------------------------------------------------- application-photo
const PhotoTile = memo(function PhotoTile({ photo, size, selected, onPick }) {
  const theme = useTheme();
  return h(Pressable, { onPress: () => onPick(photo.id), accessibilityRole: "button", accessibilityLabel: photo.title, accessibilityState: { selected }, "aria-pressed": selected,
    style: ({ pressed }) => ({ borderRadius: theme.radius.m + 3, borderWidth: 2, padding: 1, borderColor: selected ? theme.colors.accent : "transparent", opacity: pressed ? 0.7 : 1 }) },
    h(Tile, { label: photo.title, tone: photo.tone, source: photo.source, height: size - 6, width: size - 6 }));
});
/**
 * A photographic feature: a large picture, eyebrow, title, copy and a link, with an optional gallery grid below.
 * model: { eyebrow, title, description, href, linkLabel, image?, imageAlt, source?, tone?, photos?: [{ id,
 * title, tone?, source? }] }. No remote image is loaded: the picture is a tinted block that carries imageAlt as its
 * label (give source, a local image, to show a real one). The link calls onAction({ action: "open-link", id: href });
 * pressing a gallery tile shows it large and calls onAction({ action: "view-photo", id }); pressing it again
 * returns to the lead picture.
 */
export function ApplicationPhoto({ model = {}, onAction, columns = 3, style }) {
  const theme = useTheme(), c = theme.colors, window = useWindowDimensions(), photos = model.photos ?? EMPTY;
  const [picked, setPicked] = useState(null), [measured, setMeasured] = useState(0);
  const shown = photos.find((photo) => photo.id === picked), gap = theme.space.xs;
  const size = Math.floor(((measured || window.width - theme.space.m * 4) - gap * (columns - 1)) / columns);
  const caption = shown?.title ?? model.imageAlt ?? model.title, tone = shown ? shown.tone : model.tone ?? "accent";
  const pick = useStable((id) => { const next = id === picked ? null : id; setPicked(next); if (next) send(onAction, "view-photo", id); });
  const pill = { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.full, backgroundColor: c.surface };
  return h(Card, { padded: false, gap: 0, style: flat({ overflow: "hidden" }, style) },
    h(Tile, { label: caption, tone, source: shown ? shown.source : model.source, height: 200, radius: 0 },
      h(Text, { weight: "bold", style: { fontSize: theme.text["3xl"] + 8, lineHeight: theme.text["3xl"] + 16, letterSpacing: 2, color: theme.tones[toneFor(caption, tone)].fg } }, initials(caption)),
      h(View, { style: { position: "absolute", left: theme.space.s, right: theme.space.s, bottom: theme.space.s, ...row(theme.space.xs), justifyContent: "space-between" } },
        h(View, { style: flat({ flexShrink: 1 }, pill) }, h(Text, { size: "xs", weight: "medium", numberOfLines: 1 }, caption)),
        photos.length ? h(View, { style: pill },
          h(Text, { size: "xs", weight: "semibold", tone: "muted" }, shown ? `${photos.indexOf(shown) + 1} / ${photos.length}` : `${photos.length} photos`)) : null)),
    h(View, { style: { padding: theme.space.m, gap: theme.space.s } },
      h(View, { style: { gap: theme.space["2xs"] } },
        model.eyebrow ? h(Text, { size: "xs", weight: "bold", tone: "accent", style: caps }, model.eyebrow) : null,
        h(Heading, { level: 2 }, model.title),
        model.description ? h(Text, { tone: "muted" }, model.description) : null),
      photos.length ? h(View, { onLayout: (event) => setMeasured(event.nativeEvent.layout.width), style: { flexDirection: "row", flexWrap: "wrap", gap } },
        photos.map((photo) => h(PhotoTile, { key: photo.id, photo, size, selected: photo.id === picked, onPick: pick }))) : null,
      model.linkLabel ? h(Button, { title: `${model.linkLabel} ${GLYPH.arrowRight}`, accessibilityRole: "link", accessibilityLabel: model.linkLabel, onPress: () => send(onAction, "open-link", model.href) }) : null));
}

// ---------------------------------------------------------------- application-article
/**
 * A reading layout: title, byline, summary, optional paragraphs, numbered steps and a related link.
 * model: { eyebrow?, title, author, summary, body?: string[], steps: [{ title, text }], href, linkLabel }.
 * author is "Name · detail" as on the web; the name gets an initials portrait. The link calls
 * onAction({ action: "open-link", id: href }); the application opens it (for example with Linking).
 */
export const ApplicationArticle = memo(function ApplicationArticle({ model = {}, onAction, style }) {
  const theme = useTheme(), c = theme.colors, steps = model.steps ?? EMPTY;
  const [name, ...rest] = String(model.author ?? "").split(" · ");
  return h(Card, { gap: "m", style: flat({ maxWidth: 680, alignSelf: "center", width: "100%", padding: theme.space.l }, style) },
    h(View, { style: { gap: theme.space.xs } },
      model.eyebrow ? h(Text, { size: "xs", weight: "bold", tone: "accent", style: caps }, model.eyebrow) : null,
      h(Heading, { level: 1 }, model.title),
      model.summary ? h(Text, { size: "lg", tone: "muted", style: { lineHeight: 28 } }, model.summary) : null),
    model.author ? h(View, { style: row(theme.space.s) }, h(Avatar, { name, size: 36 }),
      h(View, { style: { flex: 1 } }, h(Text, { size: "sm", weight: "semibold" }, name), rest.length ? h(Text, { size: "xs", tone: "muted" }, rest.join(" · ")) : null)) : null,
    h(Divider),
    (model.body ?? EMPTY).map((paragraph, index) => h(Text, { key: index, style: { lineHeight: 26 } }, paragraph)),
    steps.length ? h(View, { accessibilityRole: "list" }, steps.map((step, index) => h(View, { key: index, style: { flexDirection: "row", gap: theme.space.s } },
      h(View, { style: { alignItems: "center" } },
        h(View, { style: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: c.accentSoft } }, h(Text, { size: "sm", weight: "bold", tone: "accent" }, index + 1)),
        index < steps.length - 1 ? h(View, { style: { width: 2, flex: 1, marginVertical: 4, backgroundColor: c.line } }) : null),
      h(View, { accessibilityLabel: `Step ${index + 1}: ${step.title}. ${step.text}`, style: { flex: 1, gap: 2, paddingTop: 3, paddingBottom: index < steps.length - 1 ? theme.space.m : 0 } },
        h(Text, { weight: "semibold" }, step.title), h(Text, { tone: "muted", style: { lineHeight: 24 } }, step.text))))) : null,
    model.linkLabel ? h(Button, { title: `${model.linkLabel} ${GLYPH.arrowRight}`, variant: "soft", accessibilityRole: "link", accessibilityLabel: model.linkLabel, onPress: () => send(onAction, "open-link", model.href) }) : null);
});

// Application components: the dashboard pieces of the web kit ("Application components" group), phone first.
// Every component takes { model, onAction, onSubmit } like its web counterpart. onAction receives { action, id }
// (plus value where a choice was made); onSubmit receives { form, values, id }. The DOM-only fields of the web
// contract (element, originalEvent, formData, submitter) do not exist here.
// Model field names are the web ones, so one model object can feed both platforms. Fields a phone needs in
// addition (a sparkline series, a status column, a gallery) are optional extras.
// Pictures: the web models carry image URLs. This package never loads remote images, so every picture is a tinted
// placeholder block with initials, unless the item carries a local `source` (an ImageSourcePropType).
import { createElement as h, useMemo, useRef, useState } from "react";
import { Image, Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { useTheme } from "./provider.js";
import { toneName } from "./theme.js";
import { depth, flat, GLYPH } from "./internal.js";
import { Stack, Cluster, Divider, Text, Heading, Button, Card, Badge, Avatar, TextField, Switch, Checkbox, RadioGroup, Tabs, Progress } from "./components.js";
import { Sheet } from "./overlays.js";

// ---------------------------------------------------------------- local helpers
const WIDE = 768; // from this window width the shell shows a side rail and the table shows columns
const send = (onAction, action, id, extra) => onAction?.({ action, id, ...extra });
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

function Chip({ label, selected = false, onPress, detail }) {
  const theme = useTheme(), c = theme.colors;
  return h(Pressable, { onPress, hitSlop: 6, accessibilityRole: "button", accessibilityState: { selected }, "aria-pressed": selected,
    style: ({ pressed }) => ({ minHeight: 32, paddingHorizontal: 12, ...row(6), borderRadius: theme.radius.full, borderWidth: 1, borderColor: selected ? c.accent : c.line, backgroundColor: selected ? c.accentSoft : pressed ? c.sunken : c.surface }) },
    h(Text, { size: "sm", weight: "medium", style: { color: selected ? c.accent : c.fg } }, label),
    detail == null ? null : h(Text, { size: "xs", weight: "semibold", style: { color: selected ? c.accent : c.muted } }, detail));
}
const ChipRow = ({ label, innerRef, children }) => h(ScrollView, { ref: innerRef, horizontal: true, showsHorizontalScrollIndicator: false, accessibilityLabel: label, keyboardShouldPersistTaps: "handled", style: { flexGrow: 0 }, contentContainerStyle: { gap: 8, alignItems: "center", paddingVertical: 6 } },
  label ? h(Text, { size: "xs", weight: "semibold", tone: "muted", style: { marginRight: 2 } }, label) : null, children);

function OptionRow({ label, selected, onPress }) {
  const theme = useTheme(), c = theme.colors;
  return h(Pressable, { onPress, accessibilityRole: "button", accessibilityState: { selected }, "aria-pressed": selected,
    style: ({ pressed }) => ({ minHeight: theme.touch, paddingHorizontal: theme.space.s, ...row(theme.space.s), borderRadius: theme.radius.s, backgroundColor: selected ? c.accentSoft : pressed ? c.sunken : "transparent" }) },
    h(Text, { weight: selected ? "semibold" : "regular", style: { flex: 1, color: selected ? c.accent : c.fg } }, label),
    selected ? h(Text, { weight: "bold", tone: "accent" }, GLYPH.check) : null);
}

/** The phone's stand-in for a <select>: a field that opens a sheet of options. */
function Choice({ label, value, options = [], onChange }) {
  const theme = useTheme(), c = theme.colors, [open, setOpen] = useState(false);
  return h(View, { style: { flex: 1, minWidth: 132, gap: theme.space["2xs"] } },
    h(Text, { size: "xs", weight: "semibold", tone: "muted" }, label),
    h(Pressable, { onPress: () => setOpen(true), accessibilityRole: "button", accessibilityLabel: `${label}: ${value}`, "aria-expanded": open,
      style: ({ pressed }) => ({ minHeight: theme.touch, paddingHorizontal: 12, ...row(8), borderWidth: 1, borderColor: c.line, borderRadius: theme.radius.s, backgroundColor: pressed ? c.sunken : c.surface }) },
      h(Text, { size: "sm", weight: "medium", numberOfLines: 1, style: { flex: 1 } }, value), h(Text, { tone: "muted" }, GLYPH.chevronDown)),
    h(Sheet, { visible: open, onClose: () => setOpen(false), title: label },
      h(Stack, { gap: "3xs" }, options.map((option) => h(OptionRow, { key: option, label: option, selected: option === value, onPress: () => { setOpen(false); if (option !== value) onChange?.(option); } })))));
}

/** A tiny bar sparkline drawn with Views. The last bar is the current value and is drawn solid. */
function Spark({ values = [], tone, height = 28 }) {
  const theme = useTheme(), color = theme.colors[toneName(tone)] ?? theme.colors.accent, top = Math.max(...values, 1);
  return h(View, { accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants", "aria-hidden": true, style: { height, ...row(3, "flex-end") } },
    values.map((value, index) => h(View, { key: index, style: { flex: 1, height: Math.max(2, Math.round((Math.max(0, value) / top) * height)), borderRadius: 2, backgroundColor: color, opacity: index === values.length - 1 ? 1 : 0.4 } })));
}

// ---------------------------------------------------------------- application-shell
/**
 * The application frame: a top bar, the page heading and content, and navigation between model.pages.
 * On a phone the pages are a bottom tab bar; from 768pt (or layout="rail") they are a side rail. The web kit's
 * sliding sidebar with a menu button and backdrop becomes the tab bar, which is what a phone app uses.
 * model: { brand, title, description, pages: [{ id, title, description?, icon?, badge? }], user? }.
 * Pressing a page calls onAction({ action: "navigate", id }) and onPageChange(id). page controls the current
 * page; without it the shell keeps its own. children may be a function of the current page id.
 */
export function ApplicationShell({ model = {}, onAction, page, defaultPage, onPageChange, layout = "auto", actions, children, style }) {
  const theme = useTheme(), c = theme.colors, { width } = useWindowDimensions();
  const pages = model.pages ?? [];
  const [own, setOwn] = useState(defaultPage ?? pages.find((entry) => entry.title === model.title)?.id ?? pages[0]?.id);
  const current = page ?? own, active = pages.find((entry) => entry.id === current);
  const rail = layout === "rail" || (layout === "auto" && width >= WIDE);
  const go = (id) => { if (page === undefined) setOwn(id); onPageChange?.(id); send(onAction, "navigate", id); };
  const mark = h(View, { style: { width: 28, height: 28, borderRadius: theme.radius.s, alignItems: "center", justifyContent: "center", backgroundColor: c.accent } },
    h(Text, { size: "sm", weight: "bold", style: { color: c.brandFg } }, initials(model.brand).slice(0, 1)));
  const item = (entry) => {
    const selected = entry.id === current;
    const icon = h(View, { style: { minWidth: rail ? 28 : 40, height: 28, paddingHorizontal: 6, borderRadius: theme.radius.full, alignItems: "center", justifyContent: "center", backgroundColor: selected ? c.accentSoft : "transparent" } },
      h(Text, { size: "sm", weight: "bold", style: { color: selected ? c.accent : c.muted } }, entry.icon ?? initials(entry.title).slice(0, 1)));
    const badge = entry.badge == null ? null : h(Tag, { tone: "accent", style: rail ? null : { position: "absolute", top: 2, right: "18%" } }, entry.badge);
    return h(Pressable, { key: entry.id, onPress: () => go(entry.id), accessibilityRole: "button", accessibilityLabel: entry.title, accessibilityState: { selected }, "aria-current": selected ? "page" : undefined,
      style: ({ pressed }) => (rail
        ? { minHeight: theme.touch, paddingHorizontal: theme.space.xs, ...row(theme.space.xs), borderRadius: theme.radius.s, backgroundColor: selected ? c.accentSoft : pressed ? c.sunken : "transparent" }
        : { flex: 1, minHeight: 56, paddingVertical: 6, alignItems: "center", justifyContent: "center", gap: 2, opacity: pressed ? 0.6 : 1 }) },
      rail && selected ? h(View, { style: { minWidth: 28, height: 28, alignItems: "center", justifyContent: "center" } }, h(Text, { size: "sm", weight: "bold", tone: "accent" }, entry.icon ?? initials(entry.title).slice(0, 1))) : icon,
      h(Text, { size: rail ? "sm" : "xs", weight: selected ? "semibold" : "medium", numberOfLines: 1, style: flat({ color: selected ? c.accent : c.muted }, rail && { flex: 1 }) }, entry.title),
      badge);
  };
  const top = h(View, { style: { minHeight: 52, paddingHorizontal: theme.space.m, ...row(theme.space.xs), borderBottomWidth: 1, borderBottomColor: c.line, backgroundColor: c.surface } },
    rail ? null : mark,
    h(Text, { weight: "bold", numberOfLines: 1, style: { flex: 1 } }, rail ? active?.title ?? model.title : model.brand),
    actions ?? (model.user ? h(Avatar, { name: model.user, size: 32 }) : null));
  const main = h(ScrollView, { nestedScrollEnabled: true, keyboardShouldPersistTaps: "handled", style: { flex: 1 }, contentContainerStyle: { padding: theme.space.m, gap: theme.space.m } },
    h(View, { style: { gap: theme.space["2xs"] } },
      h(Heading, { level: 1 }, active?.title ?? model.title),
      active?.description ?? model.description ? h(Text, { tone: "muted" }, active?.description ?? model.description) : null),
    typeof children === "function" ? children(current) : children);
  const nav = pages.length ? h(View, { accessibilityRole: "navigation", accessibilityLabel: "Application navigation",
    style: rail ? { width: 220, padding: theme.space.s, gap: theme.space["2xs"], borderRightWidth: 1, borderRightColor: c.line, backgroundColor: c.surface }
      : { flexDirection: "row", paddingHorizontal: theme.space["2xs"], borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.surface } },
    rail ? h(View, { style: { ...row(theme.space.xs), minHeight: 40, paddingHorizontal: theme.space.xs, marginBottom: theme.space.xs } }, mark, h(Text, { weight: "bold", numberOfLines: 1, style: { flex: 1 } }, model.brand)) : null,
    (rail ? pages : pages.slice(0, 5)).map(item)) : null;
  return h(View, { style: flat({ flex: 1, minHeight: 320, flexDirection: rail ? "row" : "column", backgroundColor: c.bg }, style) },
    rail ? nav : null,
    h(View, { style: { flex: 1 } }, top, main),
    rail ? null : nav);
}

// ---------------------------------------------------------------- application-metrics
const trendOf = (item) => item.trend ?? (/^\s*[+↑]/.test(item.change ?? "") ? "up" : /^\s*[-−–↓]/.test(item.change ?? "") ? "down" : null);
/**
 * A grid of KPI cards: label, value, change and a tiny bar sparkline.
 * model: { title, items: [{ id?, label, value, change, trend?: "up" | "down", tone?, series?: number[] }] }.
 * The trend is read from the sign of change ("+12%" is up) and shown in the ok tone when up and bad when down;
 * set tone on an item where down is good news (churn). With onAction a card is a button: "view-metric".
 */
export function ApplicationMetrics({ model = {}, onAction, columns, style }) {
  const theme = useTheme(), { width } = useWindowDimensions(), items = model.items ?? [];
  const perRow = columns ?? (width >= WIDE ? Math.min(4, items.length || 1) : 2);
  return h(View, { style: flat({ gap: theme.space.s }, style) },
    h(Head, { title: model.title, description: model.description }),
    h(View, { style: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.s } }, items.map((item, index) => {
      const trend = trendOf(item), tone = toneName(item.tone) ?? (trend === "up" ? "ok" : trend === "down" ? "bad" : null), t = theme.tones[tone];
      const change = String(item.change ?? "").replace(/^\s*[+↑↓]\s*/, "").replace(/^\s*[-−–]\s*/, trend === "down" ? "" : "−");
      return h(Card, { key: item.id ?? item.label ?? index, gap: "2xs", onPress: onAction ? () => send(onAction, "view-metric", item.id ?? item.label) : undefined,
        accessibilityLabel: `${item.label}: ${item.value}${item.change ? ", " + item.change : ""}`,
        style: { flexGrow: 1, flexShrink: 1, flexBasis: `${Math.floor(100 / perRow) - 6}%`, minWidth: 140, padding: theme.space.s } },
        h(Text, { size: "sm", tone: "muted", weight: "medium", numberOfLines: 1 }, item.label),
        h(Text, { size: "xl", weight: "bold", numberOfLines: 1, adjustsFontSizeToFit: true, style: { letterSpacing: -0.4 } }, item.value),
        item.series?.length ? h(Spark, { values: item.series, tone: tone ?? "accent", height: 24 }) : null,
        item.change ? h(View, { style: row(6, "flex-start") },
          trend ? h(View, { style: { width: 18, height: 18, marginTop: 1, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: t ? t.soft : theme.colors.sunken } },
            h(Text, { weight: "bold", style: { fontSize: 11, lineHeight: 14, color: t ? t.fg : theme.colors.muted } }, trend === "up" ? GLYPH.arrowUp : GLYPH.arrowDown)) : null,
          h(Text, { size: "xs", weight: "medium", numberOfLines: 2, style: { flex: 1, color: t ? t.fg : theme.colors.muted } }, change)) : null);
    })));
}

// ---------------------------------------------------------------- application-chart
const axis = (peak) => {
  if (!(peak > 0)) return { step: 1, ticks: 1 };
  const rough = peak / 4, power = 10 ** Math.floor(Math.log10(rough)), unit = rough / power;
  const step = (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 2.5 ? 2.5 : unit <= 5 ? 5 : 10) * power;
  return { step, ticks: Math.max(1, Math.ceil(peak / step)) };
};
const short = (value) => (value >= 1e6 ? `${+(value / 1e6).toFixed(1)}M` : value >= 1e4 ? `${+(value / 1e3).toFixed(1)}k` : count(value));
/**
 * A chart panel: grouped vertical bars, a range switcher, axis labels, a legend with totals and the data as text.
 * React Native core has no SVG, so the web kit's area chart is drawn here as bars made of Views; line, area and
 * pie charts are not attempted. Press a group of bars to read its values (the touch stand-in for a hover tooltip).
 * Like the web ChartPanel it takes its fields directly, or in model: { title, description, rows: [{ label,
 * values: number[] }], labels: string[], ranges: number[], defaultRange, unit?, href?, linkLabel? }. It owns the
 * selected range unless range and onRangeChange are given. The link calls onAction({ action: "open-link", id: href }).
 */
export function ApplicationChart({ model, onAction, range, onRangeChange, height = 168, style, ...fields }) {
  const theme = useTheme(), c = theme.colors;
  const { title = "Audience growth", description = "", rows = [], labels = ["Visitors", "Signups"], ranges = [7, 14, 30], defaultRange = 30, unit = "d", href, linkLabel } = { ...model, ...fields };
  const [own, setOwn] = useState(defaultRange), [picked, setPicked] = useState(null), [open, setOpen] = useState(false);
  const span = range ?? own, visible = rows.slice(-span), colors = [c.accent, c.warn, c.ok, c.bad];
  const value = (entry, column) => Math.max(0, Number(entry.values?.[column]) || 0);
  const peak = Math.max(0, ...visible.flatMap((entry) => labels.map((_, column) => value(entry, column))));
  const { step, ticks } = axis(peak), top = step * ticks, n = visible.length, gap = n > 20 ? 2 : n > 10 ? 4 : 10;
  const stats = labels.map((label, column) => {
    const values = visible.map((entry) => value(entry, column)), total = values.reduce((sum, item) => sum + item, 0), best = values.indexOf(Math.max(...values));
    return { label, total, average: n ? total / n : 0, peak: values[best] ?? 0, at: visible[best]?.label };
  });
  const noun = unit === "d" ? "days" : "points";
  const summary = `Showing ${n} ${noun}. ` + stats.map((entry) => `${entry.label}: ${count(entry.total)} in total, about ${count(Math.round(entry.average))} on average, highest ${count(entry.peak)} on ${entry.at}.`).join(" ");
  const selected = picked != null && picked < n ? visible[picked] : null;
  const marks = n <= 7 ? visible.map((_, index) => index) : [0, Math.round((n - 1) / 3), Math.round(((n - 1) * 2) / 3), n - 1];
  const change = (next) => { setPicked(null); if (range === undefined) setOwn(next); onRangeChange?.(next); };
  return h(Card, { style },
    h(Head, { title, description }),
    ranges.length > 1 ? h(Tabs, { value: span, onChange: change, options: ranges.map((entry) => ({ value: entry, label: `${entry}${unit}` })) }) : null,
    n ? h(View, { style: { gap: theme.space["2xs"] } },
      h(View, { style: { flexDirection: "row" } },
        h(View, { style: { width: 38, height } }, Array.from({ length: ticks + 1 }, (_, index) =>
          h(Text, { key: index, size: "xs", tone: "muted", numberOfLines: 1, style: { position: "absolute", right: 6, bottom: (index / ticks) * height - 8, fontSize: 11, lineHeight: 16 } }, short(step * index)))),
        h(View, { style: { flex: 1, height } },
          Array.from({ length: ticks + 1 }, (_, index) => h(View, { key: index, style: { position: "absolute", left: 0, right: 0, bottom: (index / ticks) * height, height: 1, backgroundColor: c.line, opacity: index ? 0.7 : 1 } })),
          h(View, { style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, flexDirection: "row", alignItems: "stretch", gap } }, visible.map((entry, index) =>
            h(Pressable, { key: entry.label ?? index, onPress: () => setPicked(picked === index ? null : index), accessibilityRole: "button", accessibilityState: { selected: picked === index }, "aria-pressed": picked === index,
              accessibilityLabel: `${entry.label}: ${labels.map((label, column) => `${count(value(entry, column))} ${label.toLowerCase()}`).join(", ")}`,
              style: { flex: 1, flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: n > 20 ? 1 : 2, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: picked === index ? c.sunken : "transparent" } },
              labels.map((label, column) => h(View, { key: label, style: { flex: 1, maxWidth: 16, height: `${(value(entry, column) / top) * 100}%`, minHeight: 1, borderTopLeftRadius: 3, borderTopRightRadius: 3, backgroundColor: colors[column % colors.length], opacity: picked == null || picked === index ? 1 : 0.45 } })))))),
      ),
      h(View, { style: { marginLeft: 38, flexDirection: "row", justifyContent: "space-between" } }, marks.map((index) =>
        h(Text, { key: index, size: "xs", tone: "muted", numberOfLines: 1, style: flat({ fontSize: 11 }, n <= 7 && { flex: 1, textAlign: "center" }) }, visible[index]?.label)))) : h(Text, { tone: "muted" }, "No data available."),
    h(View, { style: { minHeight: 36, paddingHorizontal: theme.space.s, paddingVertical: theme.space.xs, justifyContent: "center", borderRadius: theme.radius.s, backgroundColor: c.sunken } },
      h(Text, { size: "sm", accessibilityRole: "text", accessibilityLiveRegion: "polite", accessibilityLabel: selected ? undefined : summary },
        selected ? [h(Text, { key: "l", size: "sm", weight: "semibold" }, selected.label), "  " + labels.map((label, column) => `${count(value(selected, column))} ${label.toLowerCase()}`).join(" · ")]
          : `Showing ${n} ${noun}. Press a bar to read its values.`)),
    h(View, { style: { flexDirection: "row", flexWrap: "wrap", columnGap: theme.space.m, rowGap: theme.space["2xs"] } }, stats.map((entry, column) =>
      h(View, { key: entry.label, style: row(6) },
        h(View, { style: { width: 10, height: 10, borderRadius: 3, backgroundColor: colors[column % colors.length] } }),
        h(Text, { size: "sm", weight: "medium" }, entry.label), h(Text, { size: "sm", tone: "muted" }, `${count(entry.total)} total`)))),
    h(Divider),
    h(View, { style: { ...row(theme.space.xs), flexWrap: "wrap", justifyContent: "space-between" } },
      h(Button, { title: `${open ? "Hide" : "View"} chart data ${open ? GLYPH.chevronUp : GLYPH.chevronDown}`, variant: "ghost", size: "s", onPress: () => setOpen(!open), "aria-expanded": open, style: { marginLeft: -8 } }),
      linkLabel ? h(Button, { title: `${linkLabel} ${GLYPH.arrowRight}`, variant: "soft", size: "s", onPress: () => send(onAction, "open-link", href) }) : null),
    open ? h(View, { style: { borderWidth: 1, borderColor: c.line, borderRadius: theme.radius.s, overflow: "hidden" } },
      h(View, { style: { ...row(8), paddingHorizontal: theme.space.s, paddingVertical: 6, backgroundColor: c.sunken } },
        h(Text, { size: "xs", weight: "semibold", tone: "muted", style: { flex: 1.2 } }, unit === "d" ? "Day" : "Label"), labels.map((label) => h(Text, { key: label, size: "xs", weight: "semibold", tone: "muted", align: "right", style: { flex: 1 } }, label))),
      visible.map((entry, index) => h(View, { key: entry.label ?? index, style: { ...row(8), paddingHorizontal: theme.space.s, paddingVertical: 6, borderTopWidth: 1, borderTopColor: c.line } },
        h(Text, { size: "sm", style: { flex: 1.2 } }, entry.label), labels.map((label, column) => h(Text, { key: label, size: "sm", align: "right", style: { flex: 1, fontVariant: ["tabular-nums"] } }, count(value(entry, column))))))) : null);
}

// ---------------------------------------------------------------- application-table
const compare = (a, b) => { const x = num(a), y = num(b); return x != null && y != null ? x - y : String(a ?? "").localeCompare(String(b ?? ""), undefined, { sensitivity: "base" }); };
/**
 * A record list with search, sort and a status filter. On a phone each record is a row: the first cell is the
 * title, the cells between are the detail line, the last cell and the status badge sit on the right. From 768pt
 * (or layout="columns") it is a table with pressable column headers. The web kit's scrolling <table> is not used
 * because a wide table does not fit a phone.
 * model: { title, description, columns: string[], rows: [{ id, cells: string[] }], statusColumn?, tones? }.
 * statusColumn is a column name or index (default: the column called "Status"); its cells become badges and
 * filter chips. Pressing a record calls onAction({ action: "view-record", id }).
 */
export function ApplicationTable({ model = {}, onAction, searchable = true, sortable = true, layout = "auto", style }) {
  const theme = useTheme(), c = theme.colors, { width } = useWindowDimensions();
  const columns = model.columns ?? [], rows = model.rows ?? [];
  const [query, setQuery] = useState(""), [sort, setSort] = useState({ column: -1, dir: 1 }), [status, setStatus] = useState(null);
  const statusAt = typeof model.statusColumn === "number" ? model.statusColumn : columns.findIndex((column) => String(column).toLowerCase() === String(model.statusColumn ?? "status").toLowerCase());
  const statuses = useMemo(() => (statusAt < 0 ? [] : [...new Set(rows.map((entry) => entry.cells?.[statusAt]).filter(Boolean))]), [rows, statusAt]);
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const kept = rows.filter((entry) => (!status || entry.cells?.[statusAt] === status) && (!term || (entry.cells ?? []).join(" ").toLowerCase().includes(term)));
    return sort.column < 0 ? kept : [...kept].sort((a, b) => compare(a.cells?.[sort.column], b.cells?.[sort.column]) * sort.dir);
  }, [rows, query, status, statusAt, sort]);
  const table = layout === "columns" || (layout === "auto" && width >= WIDE);
  const sortBy = (column) => setSort(sort.column !== column ? { column, dir: 1 } : sort.dir === 1 ? { column, dir: -1 } : { column: -1, dir: 1 });
  const arrow = (column) => (sort.column === column ? (sort.dir === 1 ? GLYPH.arrowUp : GLYPH.arrowDown) : null);
  const badge = (entry) => (statusAt >= 0 && entry.cells?.[statusAt] ? h(Tag, { tone: statusTone(entry.cells[statusAt], model.tones) }, entry.cells[statusAt]) : null);
  const label = (entry) => columns.map((column, index) => `${column}: ${entry.cells?.[index] ?? ""}`).join(", ");
  const others = columns.map((_, index) => index).filter((index) => index !== 0 && index !== statusAt), last = others.length > 1 ? others[others.length - 1] : -1;
  const record = (entry, index) => h(Pressable, { key: entry.id ?? index, onPress: () => send(onAction, "view-record", entry.id), accessibilityRole: "button", accessibilityLabel: label(entry),
    style: ({ pressed }) => ({ minHeight: 60, paddingVertical: theme.space.xs, paddingHorizontal: theme.space.m, ...row(theme.space.s), borderTopWidth: index || table ? 1 : 0, borderTopColor: c.line, backgroundColor: pressed ? c.sunken : "transparent" }) },
    table ? columns.map((column, at) => h(View, { key: at, style: { flex: at ? 1 : 1.4, alignItems: "flex-start" } },
      at === statusAt ? badge(entry) : h(Text, { size: "sm", weight: at ? "regular" : "semibold", numberOfLines: 1 }, entry.cells?.[at])))
      : [h(View, { key: "main", style: { flex: 1, gap: 1 } },
        h(Text, { weight: "semibold", numberOfLines: 1 }, entry.cells?.[0]),
        h(Text, { size: "sm", tone: "muted", numberOfLines: 1 }, others.filter((at) => at !== last).map((at) => entry.cells?.[at]).filter(Boolean).join(" · "))),
      h(View, { key: "side", style: { alignItems: "flex-end", gap: 3 } },
        last >= 0 ? h(Text, { size: "sm", weight: "semibold", style: { fontVariant: ["tabular-nums"] } }, entry.cells?.[last]) : null, badge(entry))],
    h(Text, { key: "go", tone: "muted", size: "lg" }, GLYPH.chevronRight));
  return h(Card, { style },
    h(Head, { title: model.title, description: model.description, trailing: h(Tag, null, visible.length === rows.length ? `${rows.length}` : `${visible.length} of ${rows.length}`) }),
    searchable ? h(TextField, { value: query, onChangeText: setQuery, placeholder: "Search records", accessibilityLabel: "Search records", autoCapitalize: "none", autoCorrect: false, returnKeyType: "search" }) : null,
    statuses.length > 1 ? h(ChipRow, { label: "Filter by status" },
      h(Chip, { label: "All", selected: !status, onPress: () => setStatus(null), detail: rows.length }),
      statuses.map((entry) => h(Chip, { key: entry, label: entry, selected: status === entry, onPress: () => setStatus(status === entry ? null : entry), detail: rows.filter((item) => item.cells?.[statusAt] === entry).length }))) : null,
    sortable && !table && columns.length ? h(ChipRow, { label: "Sort" }, columns.map((column, index) => h(Chip, { key: index, label: column, selected: sort.column === index, detail: arrow(index), onPress: () => sortBy(index) }))) : null,
    h(View, { style: { marginHorizontal: -theme.space.m, marginBottom: -theme.space.m, borderTopWidth: 1, borderTopColor: c.line } },
      table ? h(View, { style: { ...row(theme.space.s), paddingHorizontal: theme.space.m, minHeight: 40, backgroundColor: c.sunken } },
        columns.map((column, index) => h(Pressable, { key: index, disabled: !sortable, onPress: () => sortBy(index), accessibilityRole: "button", accessibilityLabel: `Sort by ${column}`, hitSlop: 6, style: { flex: index ? 1 : 1.4, ...row(4) } },
          h(Text, { size: "xs", weight: "bold", tone: sort.column === index ? "accent" : "muted", numberOfLines: 1 }, column), arrow(index) ? h(Text, { size: "xs", weight: "bold", tone: "accent" }, arrow(index)) : null)),
        h(Text, { size: "lg", style: { opacity: 0 } }, GLYPH.chevronRight)) : null,
      visible.length ? visible.map(record) : h(View, { style: { padding: theme.space.l, alignItems: "center", gap: theme.space.xs } },
        h(Text, { weight: "semibold" }, "No records match"),
        h(Text, { size: "sm", tone: "muted", align: "center" }, "Try another search or clear the filter."),
        h(Button, { title: "Clear filters", variant: "soft", size: "s", style: { alignSelf: "center" }, onPress: () => { setQuery(""); setStatus(null); } }))));
}

// ---------------------------------------------------------------- application-board
/**
 * A kanban board: lanes in a horizontal pager that snaps lane by lane, with chips to jump to a lane.
 * Pressing a card calls onAction({ action: "edit-deal", id }) and opens a sheet to move it to another lane, which
 * calls onAction({ action: "move-deal", id, value: laneId }). Dragging between lanes needs a gesture library, so
 * the sheet is the way to move a card. The board keeps its own copy of the lanes and takes a new one when
 * model.lanes changes.
 * model: { title, description, lanes: [{ id, title, deals: [{ id, company, value, owner, next? }] }] }.
 */
export function ApplicationBoard({ model = {}, onAction, style }) {
  const theme = useTheme(), c = theme.colors, window = useWindowDimensions(), pager = useRef(null), chips = useRef(null);
  const [state, setState] = useState({ from: model.lanes, lanes: model.lanes ?? [] });
  if (state.from !== model.lanes) setState({ from: model.lanes, lanes: model.lanes ?? [] });
  const lanes = state.lanes, [at, setAt] = useState(0), [open, setOpen] = useState(null), [measured, setMeasured] = useState(0);
  const gap = theme.space.s, laneWidth = Math.max(220, Math.min(300, (measured || window.width - theme.space.m * 2) - 56));
  const openLane = lanes.find((lane) => lane.deals?.some((deal) => deal.id === open)), openDeal = openLane?.deals.find((deal) => deal.id === open);
  // Keeps the chip of the lane in view (chip widths are not measured, so the offset is an estimate).
  const show = (index) => { setAt(index); if (index >= lanes.length - 1) chips.current?.scrollToEnd({ animated: true }); else chips.current?.scrollTo({ x: Math.max(0, index * 96 - 48), animated: true }); };
  const jump = (index) => { show(index); pager.current?.scrollTo({ x: index * (laneWidth + gap), animated: true }); };
  const move = (laneId) => {
    const next = lanes.map((lane) => ({ ...lane, deals: lane.id === laneId ? [...(lane.deals ?? []).filter((deal) => deal.id !== open), openDeal] : (lane.deals ?? []).filter((deal) => deal.id !== open) }));
    setState({ from: model.lanes, lanes: next }); setOpen(null); send(onAction, "move-deal", open, { value: laneId });
  };
  const total = (lane) => { const values = (lane.deals ?? []).map((deal) => num(deal.value)); return values.length && values.every((value) => value != null) ? money(values.reduce((sum, value) => sum + value, 0), lane.deals[0].value) : null; };
  return h(View, { style: flat({ gap: theme.space.xs }, style), onLayout: (event) => setMeasured(event.nativeEvent.layout.width) },
    h(Head, { title: model.title, description: model.description }),
    h(ChipRow, { label: "Stages", innerRef: chips }, lanes.map((lane, index) => h(Chip, { key: lane.id, label: lane.title, detail: lane.deals?.length ?? 0, selected: index === at, onPress: () => jump(index) }))),
    h(ScrollView, { ref: pager, horizontal: true, showsHorizontalScrollIndicator: false, snapToInterval: laneWidth + gap, decelerationRate: "fast", scrollEventThrottle: 32,
      onScroll: (event) => { const index = Math.round(event.nativeEvent.contentOffset.x / (laneWidth + gap)); if (index !== at && index >= 0 && index < lanes.length) show(index); },
      contentContainerStyle: { gap, alignItems: "flex-start", paddingBottom: theme.space["2xs"] } },
      lanes.map((lane) => h(View, { key: lane.id, accessibilityLabel: `${lane.title}, ${lane.deals?.length ?? 0} opportunities`, style: { width: laneWidth, padding: theme.space.xs, gap: theme.space.xs, borderRadius: theme.radius.l, borderWidth: 1, borderColor: c.line, backgroundColor: c.sunken } },
        h(View, { style: { ...row(theme.space.xs), paddingHorizontal: theme.space["2xs"], minHeight: 32 } },
          h(Text, { weight: "bold", numberOfLines: 1, style: { flexShrink: 1 } }, lane.title), h(Tag, { style: { backgroundColor: c.surface } }, lane.deals?.length ?? 0),
          h(View, { style: { flex: 1 } }), total(lane) ? h(Text, { size: "sm", tone: "muted", weight: "medium" }, total(lane)) : null),
        lane.deals?.length ? lane.deals.map((deal) => h(Pressable, { key: deal.id, onPress: () => { setOpen(deal.id); send(onAction, "edit-deal", deal.id); }, accessibilityRole: "button", accessibilityLabel: `${deal.company}, ${deal.value}, ${deal.owner}. Change stage`,
          style: ({ pressed }) => ({ padding: theme.space.s, gap: theme.space.xs, borderRadius: theme.radius.m, borderWidth: 1, borderColor: c.line, backgroundColor: pressed ? c.bg : c.surface, ...depth(theme.shadow.s) }) },
          h(View, { style: row(theme.space.xs, "flex-start") },
            h(Text, { weight: "semibold", numberOfLines: 2, style: { flex: 1 } }, deal.company), h(Text, { tone: "muted", weight: "bold" }, GLYPH.more)),
          h(Text, { size: "lg", weight: "bold", style: { letterSpacing: -0.3 } }, deal.value),
          deal.next ? h(Text, { size: "sm", tone: "muted", numberOfLines: 2 }, deal.next) : null,
          h(View, { style: row(theme.space.xs) }, h(Avatar, { name: deal.owner, size: 24 }), h(Text, { size: "sm", tone: "muted", numberOfLines: 1, style: { flex: 1 } }, deal.owner))))
          : h(View, { style: { minHeight: 72, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.m, borderWidth: 1, borderStyle: "dashed", borderColor: c.line } }, h(Text, { size: "sm", tone: "muted" }, "No opportunities"))))),
    h(Sheet, { visible: !!openDeal, onClose: () => setOpen(null), title: openDeal?.company },
      openDeal ? h(Stack, { gap: "xs" },
        h(Text, { tone: "muted" }, `${openDeal.value} · ${openDeal.owner}`),
        h(Text, { size: "xs", weight: "bold", tone: "muted", style: { letterSpacing: 1, textTransform: "uppercase", marginTop: theme.space.xs } }, "Stage"),
        h(Stack, { gap: "3xs" }, lanes.map((lane) => h(OptionRow, { key: lane.id, label: lane.title, selected: lane.id === openLane.id, onPress: () => (lane.id === openLane.id ? setOpen(null) : move(lane.id)) }))),
        h(Button, { title: "Close", variant: "ghost", block: true, onPress: () => setOpen(null) })) : null));
}

// ---------------------------------------------------------------- application-projects
/**
 * Project cards: a cover, name, description, progress and a details button.
 * model: { title, description, projects: [{ id, name, description, progress (0–100), image?, source?, status?,
 * members?: string[], tone? }] }. The button calls onAction({ action: "view-project", id }).
 */
export function ApplicationProjects({ model = {}, onAction, style }) {
  const theme = useTheme(), { width } = useWindowDimensions(), projects = model.projects ?? [];
  return h(View, { style: flat({ gap: theme.space.s }, style) },
    h(Head, { title: model.title, description: model.description }),
    h(View, { style: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.s } }, projects.map((project) => {
      const progress = Math.min(100, Math.max(0, Number(project.progress) || 0));
      return h(Card, { key: project.id, padded: false, gap: 0, style: { flexGrow: 1, flexBasis: width >= WIDE ? "40%" : "100%", overflow: "hidden" } },
        h(Tile, { label: project.name, tone: project.tone, source: project.source, height: 104, radius: 0 }),
        h(View, { style: { padding: theme.space.m, gap: theme.space.s } },
          h(View, { style: row(theme.space.xs, "flex-start") },
            h(View, { style: { flex: 1, gap: 2 } }, h(Heading, { level: 4 }, project.name), h(Text, { size: "sm", tone: "muted" }, project.description)),
            project.status ? h(Tag, { tone: statusTone(project.status, model.tones) }, project.status) : null),
          h(View, { style: { gap: theme.space["2xs"] } },
            h(View, { style: { ...row(8), justifyContent: "space-between" } }, h(Text, { size: "xs", weight: "semibold", tone: "muted" }, "Progress"), h(Text, { size: "xs", weight: "bold" }, `${progress}%`)),
            h(Progress, { value: progress / 100, tone: progress >= 100 ? "ok" : "accent" })),
          h(View, { style: { ...row(theme.space.xs), justifyContent: "space-between" } },
            h(View, { style: { flexDirection: "row", paddingLeft: 6 } }, (project.members ?? []).slice(0, 4).map((name) =>
              h(Avatar, { key: name, name, size: 28, style: { marginLeft: -6, borderWidth: 2, borderColor: theme.colors.surface } }))),
            h(Button, { title: "View details", variant: "soft", size: "s", accessibilityLabel: `View details of ${project.name}`, onPress: () => send(onAction, "view-project", project.id) }))));
    })));
}

// ---------------------------------------------------------------- application-planner
/**
 * A day's agenda: an optional strip of days, then events on a time rail.
 * model: { title, description, events: [{ id, datetime?, time, title, location, day?, tag?, tone? }],
 * days?: [{ id, label, day }], day? }. Events are ordered by datetime. With days, an event that has a day shows
 * only on that day, and pressing a day calls onAction({ action: "select-day", id }). Pressing an event calls
 * onAction({ action: "view-event", id }).
 */
export function ApplicationPlanner({ model = {}, onAction, style }) {
  const theme = useTheme(), c = theme.colors, days = model.days ?? [];
  const [day, setDay] = useState(model.day ?? days[0]?.id);
  const events = [...(model.events ?? [])].filter((event) => !days.length || event.day == null || event.day === day)
    .sort((a, b) => String(a.datetime ?? "").localeCompare(String(b.datetime ?? "")));
  return h(Card, { style },
    h(Head, { title: model.title, description: model.description, trailing: h(Tag, { tone: events.length ? "accent" : undefined }, `${events.length} ${events.length === 1 ? "event" : "events"}`) }),
    days.length ? h(View, { accessibilityRole: "tablist", style: { flexDirection: "row", gap: theme.space["2xs"] } }, days.map((entry) => {
      const selected = entry.id === day;
      return h(Pressable, { key: entry.id, onPress: () => { setDay(entry.id); send(onAction, "select-day", entry.id); }, accessibilityRole: "tab", accessibilityLabel: `${entry.label} ${entry.day}`, accessibilityState: { selected }, "aria-selected": selected,
        style: ({ pressed }) => ({ flex: 1, minHeight: 56, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.m, borderWidth: 1, borderColor: selected ? c.accent : c.line, backgroundColor: selected ? c.accent : pressed ? c.sunken : c.surface }) },
        h(Text, { size: "xs", weight: "medium", style: { color: selected ? c.brandFg : c.muted } }, entry.label),
        h(Text, { weight: "bold", style: { color: selected ? c.brandFg : c.fg } }, entry.day));
    })) : null,
    events.length ? h(View, null, events.map((event, index) => {
      const tone = theme.tones[toneName(event.tone) ?? "accent"];
      return h(View, { key: event.id, style: { flexDirection: "row", gap: theme.space.xs } },
        h(Text, { size: "sm", weight: "semibold", align: "right", style: { width: 66, paddingTop: 13, fontVariant: ["tabular-nums"] } }, event.time),
        h(View, { style: { width: 14, alignItems: "center" } },
          h(View, { style: { width: 2, height: 17, backgroundColor: index ? c.line : "transparent" } }),
          h(View, { style: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: tone.fg, backgroundColor: c.surface } }),
          h(View, { style: { width: 2, flex: 1, backgroundColor: index < events.length - 1 ? c.line : "transparent" } })),
        h(Pressable, { onPress: () => send(onAction, "view-event", event.id), accessibilityRole: "button", accessibilityLabel: `${event.time}, ${event.title}, ${event.location ?? ""}`,
          style: ({ pressed }) => ({ flex: 1, marginVertical: theme.space["2xs"], minHeight: theme.touch, paddingVertical: theme.space.xs, paddingHorizontal: theme.space.s, ...row(theme.space.xs), borderRadius: theme.radius.m, borderLeftWidth: 3, borderLeftColor: tone.fg, backgroundColor: pressed ? tone.soft : tone.tint }) },
          h(View, { style: { flex: 1, gap: 1 } },
            h(Text, { weight: "semibold", numberOfLines: 2 }, event.title),
            event.location ? h(Text, { size: "sm", tone: "muted", numberOfLines: 2 }, event.location) : null,
            event.tag ? h(Tag, { tone: event.tone ?? "accent", style: { alignSelf: "flex-start", marginTop: 4 } }, event.tag) : null),
          h(Text, { tone: "muted", size: "lg" }, GLYPH.chevronRight)));
    })) : h(View, { style: { padding: theme.space.l, alignItems: "center" } }, h(Text, { tone: "muted" }, "Nothing scheduled.")));
}

// ---------------------------------------------------------------- application-identity
/**
 * A profile card: cover, portrait, name, role, optional figures, account details and an edit button.
 * model: { id?, name, role, image?, source?, status?, stats?: [{ label, value }], details: [{ label, value }],
 * editLabel? }. The button calls onAction({ action: "edit-profile", id }); pair it with ApplicationForm.
 */
export function ApplicationIdentity({ model = {}, onAction, style }) {
  const theme = useTheme(), c = theme.colors;
  return h(Card, { padded: false, gap: 0, style: flat({ overflow: "hidden" }, style) },
    h(Tile, { label: model.name, tone: "accent", height: 76, radius: 0 }, h(View)),
    h(View, { style: { padding: theme.space.m, paddingTop: 0, gap: theme.space.s } },
      h(View, { style: { ...row(theme.space.s, "flex-end"), marginTop: -32 } },
        h(Avatar, { name: model.name, source: model.source, size: 72, style: { borderWidth: 3, borderColor: c.surface } }),
        h(View, { style: { flex: 1 } }), model.status ? h(Tag, { tone: statusTone(model.status, model.tones), style: { alignSelf: "flex-end", marginBottom: 6 } }, model.status) : null),
      h(View, { style: { gap: 2 } }, h(Heading, { level: 3 }, model.name), model.role ? h(Text, { tone: "muted" }, model.role) : null),
      model.stats?.length ? h(View, { style: { flexDirection: "row", borderRadius: theme.radius.m, backgroundColor: c.sunken } }, model.stats.map((stat, index) =>
        h(View, { key: stat.label, style: { flex: 1, paddingVertical: theme.space.xs, alignItems: "center", borderLeftWidth: index ? 1 : 0, borderLeftColor: c.line } },
          h(Text, { weight: "bold" }, stat.value), h(Text, { size: "xs", tone: "muted" }, stat.label)))) : null,
      h(View, null, (model.details ?? []).map((detail, index) => h(View, { key: detail.label, style: { ...row(theme.space.s), minHeight: 40, paddingVertical: theme.space["2xs"], borderTopWidth: index ? 1 : 0, borderTopColor: c.line } },
        h(Text, { size: "sm", tone: "muted", style: { width: 92 } }, detail.label),
        h(Text, { size: "sm", weight: "medium", align: "right", style: { flex: 1 } }, detail.value)))),
      h(Button, { title: model.editLabel ?? "Edit profile", variant: "outline", block: true, onPress: () => send(onAction, "edit-profile", model.id) })));
}

// ---------------------------------------------------------------- application-products
/**
 * A product catalog with quantities and a running order total.
 * model: { title, description, products: [{ id, name, price, amount, stock, image?, source?, tone? }],
 * checkoutLabel? }. price is the text shown, amount the number used for the total; the leading number of stock
 * ("12 available") caps the quantity. Adding or changing a quantity calls onAction({ action: "add-product", id,
 * value: quantity }); reaching zero calls "remove-product"; the button calls onAction({ action: "checkout",
 * value: { [id]: quantity }, total }). It keeps its own quantities unless quantities and onQuantitiesChange are given.
 */
export function ApplicationProducts({ model = {}, onAction, quantities, onQuantitiesChange, style }) {
  const theme = useTheme(), c = theme.colors, products = model.products ?? [];
  const [own, setOwn] = useState({}), cart = quantities ?? own;
  const set = (product, quantity) => {
    const next = { ...cart }; if (quantity > 0) next[product.id] = quantity; else delete next[product.id];
    if (quantities === undefined) setOwn(next); onQuantitiesChange?.(next);
    send(onAction, quantity > 0 ? "add-product" : "remove-product", product.id, { value: quantity });
  };
  const amount = (product) => Number(product.amount) || num(product.price) || 0;
  const chosen = products.filter((product) => cart[product.id] > 0), sample = products[0]?.price;
  const total = chosen.reduce((sum, product) => sum + amount(product) * cart[product.id], 0), units = chosen.reduce((sum, product) => sum + cart[product.id], 0);
  const round = (glyph, label, onPress, disabled) => h(Pressable, { onPress, disabled, hitSlop: 6, accessibilityRole: "button", accessibilityLabel: label, accessibilityState: { disabled }, "aria-disabled": disabled,
    style: ({ pressed }) => ({ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: c.line, backgroundColor: pressed ? c.sunken : c.surface, opacity: disabled ? 0.4 : 1 }) },
    h(Text, { weight: "bold", style: { lineHeight: 20 } }, glyph));
  return h(View, { style: flat({ gap: theme.space.s }, style) },
    h(Head, { title: model.title, description: model.description }),
    products.map((product) => {
      const quantity = cart[product.id] ?? 0, limit = num(product.stock) ?? Infinity, soldOut = limit <= 0;
      return h(Card, { key: product.id, style: { padding: theme.space.s } },
        h(View, { style: row(theme.space.s) },
          h(Tile, { label: product.name, tone: product.tone, source: product.source, height: 72, width: 72 }),
          h(View, { style: { flex: 1, gap: 1 } },
            h(Text, { weight: "semibold", numberOfLines: 2 }, product.name),
            h(Text, { size: "lg", weight: "bold", style: { letterSpacing: -0.3 } }, product.price),
            h(Text, { size: "xs", tone: soldOut ? "bad" : limit <= 3 ? "warn" : "muted", weight: "medium" }, product.stock)),
          quantity > 0 ? h(View, { style: row(theme.space.xs) },
            round(GLYPH.minus, `Remove one ${product.name}`, () => set(product, quantity - 1)),
            h(Text, { weight: "bold", align: "center", accessibilityLabel: `${quantity} in order`, style: { minWidth: 20, fontVariant: ["tabular-nums"] } }, quantity),
            round(GLYPH.plus, `Add one ${product.name}`, () => set(product, quantity + 1), quantity >= limit))
            : h(Button, { title: soldOut ? "Sold out" : "Add", variant: "soft", size: "s", style: { alignSelf: "center" }, disabled: soldOut, accessibilityLabel: `Add ${product.name} to order`, onPress: () => set(product, 1) })));
    }),
    h(View, { accessibilityLiveRegion: "polite", style: { padding: theme.space.m, gap: theme.space.xs, borderRadius: theme.radius.l, borderWidth: 1, borderColor: c.line, backgroundColor: c.sunken } },
      h(Text, { size: "xs", weight: "bold", tone: "muted", style: { letterSpacing: 1, textTransform: "uppercase" } }, "Order summary"),
      chosen.length ? chosen.map((product) => h(View, { key: product.id, style: { ...row(theme.space.xs), justifyContent: "space-between" } },
        h(Text, { size: "sm", numberOfLines: 1, style: { flex: 1 } }, `${product.name} × ${cart[product.id]}`),
        h(Text, { size: "sm", weight: "medium", style: { fontVariant: ["tabular-nums"] } }, money(amount(product) * cart[product.id], sample))))
        : h(Text, { size: "sm", tone: "muted" }, "Your order is empty. Add a product to start."),
      h(Divider),
      h(View, { style: { ...row(theme.space.xs), justifyContent: "space-between" } },
        h(Text, { weight: "semibold" }, `Total${units ? ` · ${units} ${units === 1 ? "item" : "items"}` : ""}`),
        h(Text, { size: "lg", weight: "bold", style: { fontVariant: ["tabular-nums"] } }, money(total, sample))),
      h(Button, { title: model.checkoutLabel ?? "Create order", block: true, disabled: !chosen.length, onPress: () => send(onAction, "checkout", undefined, { value: cart, total }) })));
}

// ---------------------------------------------------------------- application-receipt
/**
 * An order receipt: line items, optional sub-totals, the total and a download button.
 * model: { id?, title, description, status?, items: [{ label, amount, detail? }], totals?: [{ label, amount }],
 * total, note?, downloadLabel? }. A phone has no download link, so the button calls
 * onAction({ action: "download-receipt", id }) and the app shares or saves the file.
 */
export function ApplicationReceipt({ model = {}, onAction, style }) {
  const theme = useTheme(), c = theme.colors;
  const line = (entry, index, strong) => h(View, { key: `${entry.label}-${index}`, style: { ...row(theme.space.s, "flex-start"), justifyContent: "space-between" } },
    h(View, { style: { flex: 1 } }, h(Text, { size: strong ? "md" : "sm", tone: strong === false ? "muted" : undefined, weight: strong ? "medium" : "regular" }, entry.label), entry.detail ? h(Text, { size: "xs", tone: "muted" }, entry.detail) : null),
    h(Text, { size: strong ? "md" : "sm", tone: strong === false ? "muted" : undefined, weight: strong ? "medium" : "regular", style: { fontVariant: ["tabular-nums"] } }, entry.amount));
  const dashed = h(View, { style: { height: 1, borderTopWidth: 1, borderStyle: "dashed", borderColor: c.line } });
  return h(Card, { style },
    h(Head, { title: model.title, description: model.description, trailing: model.status ? h(Tag, { tone: statusTone(model.status, model.tones) }, model.status) : null }),
    dashed,
    h(View, { style: { gap: theme.space.xs } }, (model.items ?? []).map((entry, index) => line(entry, index, true))),
    model.totals?.length ? [h(View, { key: "rule" }, dashed), h(View, { key: "totals", style: { gap: theme.space["2xs"] } }, model.totals.map((entry, index) => line(entry, index, false)))] : null,
    h(View, { style: { ...row(theme.space.s), justifyContent: "space-between", padding: theme.space.s, borderRadius: theme.radius.m, backgroundColor: c.sunken } },
      h(Text, { weight: "bold" }, "Total"), h(Text, { size: "xl", weight: "bold", style: { letterSpacing: -0.4, fontVariant: ["tabular-nums"] } }, model.total)),
    model.note ? h(Text, { size: "xs", tone: "muted" }, model.note) : null,
    h(Button, { title: `${GLYPH.arrowDown}  ${model.downloadLabel ?? "Download receipt"}`, variant: "outline", block: true, accessibilityLabel: model.downloadLabel ?? "Download receipt", onPress: () => send(onAction, "download-receipt", model.id ?? model.title) }));
}

// ---------------------------------------------------------------- application-conversation
/**
 * A support desk: the ticket queue, then the selected ticket with assignment, status, the thread and a reply box.
 * model: { tickets: [{ id, customer, title, status, message, messages? }], selected: { id, customer, title,
 * status, message, assigned, messages? }, agents: string[], statuses: string[] }; messages is
 * [{ author, text, time?, own? }] and defaults to the customer's message.
 * Actions, as on the web: "select-ticket" { id }, "assign-ticket" { id, value }, "ticket-status" { id, value }.
 * Sending calls onSubmit({ form: "reply", id, values: { reply } }). The two <select> elements of the web kit are
 * fields that open a sheet. The desk shows choices and replies at once and keeps them until the model changes;
 * storing them is the application's job.
 */
export function ApplicationConversation({ model = {}, onAction, onSubmit, style }) {
  const theme = useTheme(), c = theme.colors, { width } = useWindowDimensions();
  const tickets = model.tickets ?? [];
  const [state, setState] = useState({ from: model, id: model.selected?.id ?? tickets[0]?.id, edits: {}, replies: {} });
  if (state.from !== model) setState({ from: model, id: model.selected?.id ?? state.id, edits: {}, replies: {} });
  const [draft, setDraft] = useState(""), [error, setError] = useState(null), wide = width >= WIDE;
  const base = model.selected?.id === state.id ? { ...tickets.find((ticket) => ticket.id === state.id), ...model.selected } : tickets.find((ticket) => ticket.id === state.id);
  const edit = (id) => state.edits[id] ?? {};
  const ticket = base ? { assigned: "Unassigned", ...base, ...edit(base.id) } : null;
  const patch = (key, value) => setState({ ...state, edits: { ...state.edits, [ticket.id]: { ...edit(ticket.id), [key]: value } } });
  const messages = ticket ? [...(ticket.messages ?? (ticket.message ? [{ author: ticket.customer, text: ticket.message }] : [])), ...(state.replies[ticket.id] ?? [])] : [];
  const reply = () => {
    const text = draft.trim();
    if (!text) return setError("Write a reply before sending.");
    setState({ ...state, replies: { ...state.replies, [ticket.id]: [...(state.replies[ticket.id] ?? []), { author: "You", text, own: true, time: "Just now" }] } });
    setDraft(""); setError(null); onSubmit?.({ form: "reply", id: ticket.id, values: { reply: text } });
  };
  const queue = h(Card, { padded: false, gap: 0, accessibilityLabel: "Tickets", style: flat({ overflow: "hidden" }, wide && { width: 300 }) },
    h(View, { style: { ...row(theme.space.xs), justifyContent: "space-between", paddingHorizontal: theme.space.m, paddingVertical: theme.space.xs, backgroundColor: c.sunken } },
      h(Text, { size: "xs", weight: "bold", tone: "muted", style: { letterSpacing: 1, textTransform: "uppercase" } }, "Tickets"), h(Tag, null, tickets.length)),
    tickets.map((entry) => {
      const selected = entry.id === state.id, status = edit(entry.id).status ?? (entry.id === model.selected?.id ? model.selected.status : null) ?? entry.status;
      return h(Pressable, { key: entry.id, onPress: () => { setState({ ...state, id: entry.id }); setDraft(""); setError(null); send(onAction, "select-ticket", entry.id); },
        accessibilityRole: "button", accessibilityLabel: `${entry.customer}: ${entry.title}, ${status}`, accessibilityState: { selected }, "aria-current": selected ? "true" : undefined,
        style: ({ pressed }) => ({ minHeight: 64, paddingVertical: theme.space.xs, paddingRight: theme.space.m, paddingLeft: theme.space.m - 3, ...row(theme.space.s), borderTopWidth: 1, borderTopColor: c.line, borderLeftWidth: 3, borderLeftColor: selected ? c.accent : "transparent", backgroundColor: selected ? c.accentSoft : pressed ? c.sunken : "transparent" }) },
        h(Avatar, { name: entry.customer, source: entry.source, size: 36 }),
        h(View, { style: { flex: 1, gap: 1 } },
          h(Text, { size: "sm", weight: "semibold", numberOfLines: 1 }, entry.customer),
          h(Text, { size: "sm", tone: "muted", numberOfLines: 1 }, entry.title)),
        h(Tag, { tone: statusTone(status, model.tones) }, status));
    }));
  const thread = ticket ? h(Card, { style: wide ? { flex: 1 } : null },
    h(Head, { title: ticket.title, description: `${ticket.customer} · #${ticket.id}`, trailing: h(Tag, { tone: statusTone(ticket.status, model.tones) }, ticket.status) }),
    h(View, { style: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.s } },
      h(Choice, { label: "Assigned to", value: ticket.assigned, options: ["Unassigned", ...(model.agents ?? [])], onChange: (value) => { patch("assigned", value); send(onAction, "assign-ticket", ticket.id, { value }); } }),
      h(Choice, { label: "Status", value: ticket.status, options: model.statuses ?? [], onChange: (value) => { patch("status", value); send(onAction, "ticket-status", ticket.id, { value }); } })),
    h(Divider),
    h(View, { style: { gap: theme.space.s } }, messages.map((message, index) => h(View, { key: index, style: { ...row(theme.space.xs, "flex-end"), flexDirection: message.own ? "row-reverse" : "row" } },
      message.own ? null : h(Avatar, { name: message.author, size: 28 }),
      h(View, { style: { maxWidth: "82%", gap: 2, alignItems: message.own ? "flex-end" : "flex-start" } },
        h(Text, { size: "xs", tone: "muted" }, [message.author, message.time].filter(Boolean).join(" · ")),
        h(View, { style: { paddingVertical: theme.space.xs, paddingHorizontal: theme.space.s, borderRadius: theme.radius.m, backgroundColor: message.own ? c.accent : c.sunken, [message.own ? "borderBottomRightRadius" : "borderBottomLeftRadius"]: 4 } },
          h(Text, { size: "sm", style: { color: message.own ? c.brandFg : c.fg } }, message.text)))))),
    h(TextField, { label: "Reply", value: draft, onChangeText: (text) => { setDraft(text); if (error) setError(null); }, placeholder: `Write to ${String(ticket.customer).split(" ")[0]}…`, multiline: true, maxLength: 2000, error: error ?? undefined,
      inputStyle: { minHeight: 84, textAlignVertical: "top" } }),
    h(View, { style: { ...row(theme.space.xs), justifyContent: "space-between" } },
      h(Text, { size: "xs", tone: "muted" }, `${draft.length} / 2000`),
      h(Button, { title: "Send reply", onPress: reply }))) : h(Card, null, h(Text, { tone: "muted" }, "Select a ticket to read it."));
  return h(View, { style: flat({ flexDirection: wide ? "row" : "column", alignItems: wide ? "flex-start" : "stretch", gap: theme.space.s }, style) }, queue, thread);
}

// ---------------------------------------------------------------- application-form
const KEYBOARD = { email: "email-address", tel: "phone-pad", number: "numeric", url: "url" };
const blank = (value) => value == null || value === false || String(value).trim() === "";
const starting = (fields) => Object.fromEntries(fields.map((field) => [field.name, field.value ?? (field.type === "checkbox" || field.type === "switch" ? false : "")]));
function check(field, value) {
  const boolean = field.type === "checkbox" || field.type === "switch", required = field.required ?? !boolean; // the web form marks every input required
  if (blank(value)) return required ? field.message ?? (boolean ? `Confirm “${field.label}” to continue.` : `${field.label} is required.`) : null;
  if (field.type === "email" && !/^\S+@\S+\.\S+$/.test(value)) return "Enter a valid email address.";
  if (field.type === "number" && num(value) == null) return "Enter a number.";
  if (field.type === "url" && !/^https?:\/\/\S+\.\S+/.test(value)) return "Enter a web address that starts with https://.";
  if (field.minLength && String(value).length < field.minLength) return `Use at least ${field.minLength} characters.`;
  if (field.pattern && !new RegExp(`^(?:${field.pattern})$`).test(value)) return field.message ?? `${field.label} is not in the expected format.`;
  return null;
}
/**
 * A form built from model.fields, validated on submit.
 * model: { id?, form?, title, description?, submitLabel, resetLabel?, successMessage?, fields: [{ name, label,
 * type, value?, required?, placeholder?, hint?, maxLength?, minLength?, pattern?, message?, options? }] }.
 * type: text | email | tel | url | number | password | textarea | checkbox | switch | select | radio (the last
 * two take options and show a radio list). As on the web, text inputs are required and limited to 100 characters
 * unless the field says otherwise.
 * onSubmit({ form, id, values }) runs only when every field is valid. Uncontrolled by default: the draft
 * survives re-renders and resets when recordKey (or model.id) or resetKey changes. Pass values and
 * onValuesChange to control it. bare drops the card, for a form inside a Sheet or Dialog. The web model's action URL is not used: there is no page to post to.
 */
export function ApplicationForm({ model = {}, onSubmit, onAction, values, onValuesChange, recordKey, resetKey, bare = false, style }) {
  const theme = useTheme(), fields = model.fields ?? [], key = JSON.stringify([recordKey ?? model.id ?? null, resetKey ?? null]);
  const [state, setState] = useState({ key, draft: starting(fields), tried: false, done: false });
  if (state.key !== key) setState({ key, draft: starting(fields), tried: false, done: false });
  const current = values ?? state.draft;
  const errors = Object.fromEntries(fields.map((field) => [field.name, check(field, current[field.name])])), invalid = fields.filter((field) => errors[field.name]);
  const change = (name, value) => { const next = { ...current, [name]: value }; setState({ ...state, draft: values ? state.draft : next, done: false }); onValuesChange?.(next); };
  const submit = () => {
    if (invalid.length) return setState({ ...state, tried: true, done: false });
    setState({ ...state, tried: false, done: true }); onSubmit?.({ form: model.form ?? "profile", id: model.id, values: { ...current } });
  };
  const reset = () => { const next = starting(fields); setState({ ...state, draft: next, tried: false, done: false }); onValuesChange?.(next); send(onAction, "reset-form", model.id); };
  return h(bare ? Stack : Card, { gap: "m", style },
    h(Head, { title: model.title, description: model.description }),
    fields.map((field) => {
      const value = current[field.name], error = state.tried ? errors[field.name] : null, type = field.type ?? "text";
      if (type === "checkbox" || type === "switch") return h(View, { key: field.name, style: { gap: 2 } },
        type === "switch" ? h(Switch, { label: field.label, value: !!value, onValueChange: (next) => change(field.name, next) }) : h(Checkbox, { label: field.label, checked: !!value, onChange: (next) => change(field.name, next) }),
        error || field.hint ? h(Text, { size: "xs", tone: error ? "bad" : "muted" }, error || field.hint) : null);
      if (type === "select" || type === "radio") return h(View, { key: field.name, style: { gap: theme.space["2xs"] } },
        h(Text, { size: "sm", weight: "semibold", tone: error ? "bad" : undefined }, field.label),
        h(RadioGroup, { value, onChange: (next) => change(field.name, next), options: (field.options ?? []).map((option) => (typeof option === "object" ? option : { value: option, label: String(option) })) }),
        error || field.hint ? h(Text, { size: "xs", tone: error ? "bad" : "muted" }, error || field.hint) : null);
      const area = type === "textarea";
      return h(TextField, { key: field.name, label: field.label, value: String(value ?? ""), onChangeText: (next) => change(field.name, next), placeholder: field.placeholder, hint: field.hint, error: error ?? undefined,
        maxLength: Number(field.maxLength ?? field.maxlength) || (area ? 2000 : 100), keyboardType: KEYBOARD[type], secureTextEntry: type === "password", multiline: area,
        autoCapitalize: type === "text" || area ? undefined : "none", autoCorrect: type === "text" || area ? undefined : false, inputStyle: area ? { minHeight: 96, textAlignVertical: "top" } : undefined });
    }),
    h(View, { accessibilityLiveRegion: "polite", style: { gap: theme.space.xs } },
      state.tried && invalid.length ? h(Text, { size: "sm", tone: "bad", weight: "medium", accessibilityRole: "alert" }, invalid.length === 1 ? "Fix the highlighted field to continue." : `Fix the ${invalid.length} highlighted fields to continue.`) : null,
      state.done ? h(Text, { size: "sm", tone: "ok", weight: "medium" }, `${GLYPH.check} ${model.successMessage ?? "Saved."}`) : null,
      h(Cluster, { gap: "xs" },
        h(Button, { title: model.submitLabel ?? "Save", onPress: submit }),
        model.resetLabel ? h(Button, { title: model.resetLabel, variant: "ghost", onPress: reset }) : null)));
}

// ---------------------------------------------------------------- application-photo
/**
 * A photographic feature: a large picture, eyebrow, title, copy and a link, with an optional gallery grid below.
 * model: { eyebrow, title, description, href, linkLabel, image?, imageAlt, source?, tone?, photos?: [{ id,
 * title, tone?, source? }] }. No remote image is loaded: the picture is a tinted block that carries imageAlt as its
 * label (give source, a local image, to show a real one). The link calls onAction({ action: "open-link", id: href });
 * pressing a gallery tile shows it large and calls onAction({ action: "view-photo", id }).
 */
export function ApplicationPhoto({ model = {}, onAction, columns = 3, style }) {
  const theme = useTheme(), c = theme.colors, window = useWindowDimensions(), photos = model.photos ?? [];
  const [picked, setPicked] = useState(null), [measured, setMeasured] = useState(0);
  const shown = photos.find((photo) => photo.id === picked), gap = theme.space.xs;
  const size = Math.floor(((measured || window.width - theme.space.m * 4) - gap * (columns - 1)) / columns);
  const caption = shown?.title ?? model.imageAlt ?? model.title;
  return h(Card, { padded: false, gap: 0, style: flat({ overflow: "hidden" }, style) },
    h(Tile, { label: caption, tone: shown ? shown.tone : model.tone ?? "accent", source: shown ? shown.source : model.source, height: 200, radius: 0 },
      h(Text, { weight: "bold", style: { fontSize: 44, lineHeight: 52, letterSpacing: 2, color: theme.tones[toneFor(caption, shown ? shown.tone : model.tone ?? "accent")].fg } }, initials(caption)),
      h(View, { style: { position: "absolute", left: theme.space.s, right: theme.space.s, bottom: theme.space.s, ...row(theme.space.xs), justifyContent: "space-between" } },
        h(View, { style: { flexShrink: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.full, backgroundColor: c.surface } }, h(Text, { size: "xs", weight: "medium", numberOfLines: 1 }, caption)),
        photos.length ? h(View, { style: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.full, backgroundColor: c.surface } },
          h(Text, { size: "xs", weight: "semibold", tone: "muted" }, shown ? `${photos.indexOf(shown) + 1} / ${photos.length}` : `${photos.length} photos`)) : null)),
    h(View, { style: { padding: theme.space.m, gap: theme.space.s } },
      h(View, { style: { gap: theme.space["2xs"] } },
        model.eyebrow ? h(Text, { size: "xs", weight: "bold", tone: "accent", style: { letterSpacing: 1, textTransform: "uppercase" } }, model.eyebrow) : null,
        h(Heading, { level: 2 }, model.title),
        model.description ? h(Text, { tone: "muted" }, model.description) : null),
      photos.length ? h(View, { onLayout: (event) => setMeasured(event.nativeEvent.layout.width), style: { flexDirection: "row", flexWrap: "wrap", gap } }, photos.map((photo) => {
        const selected = photo.id === picked;
        return h(Pressable, { key: photo.id, onPress: () => { setPicked(selected ? null : photo.id); send(onAction, "view-photo", photo.id); }, accessibilityRole: "button", accessibilityLabel: photo.title, accessibilityState: { selected }, "aria-pressed": selected,
          style: ({ pressed }) => ({ borderRadius: theme.radius.m + 3, borderWidth: 2, padding: 1, borderColor: selected ? c.accent : "transparent", opacity: pressed ? 0.7 : 1 }) },
          h(Tile, { label: photo.title, tone: photo.tone, source: photo.source, height: size - 6, width: size - 6 }));
      })) : null,
      model.linkLabel ? h(Button, { title: `${model.linkLabel} ${GLYPH.arrowRight}`, accessibilityRole: "link", accessibilityLabel: model.linkLabel, onPress: () => send(onAction, "open-link", model.href) }) : null));
}

// ---------------------------------------------------------------- application-article
/**
 * A reading layout: title, byline, summary, optional paragraphs, numbered steps and a related link.
 * model: { eyebrow?, title, author, summary, body?: string[], steps: [{ title, text }], href, linkLabel }.
 * author is "Name · detail" as on the web; the name gets an initials portrait. The link calls
 * onAction({ action: "open-link", id: href }); the application opens it (for example with Linking).
 */
export function ApplicationArticle({ model = {}, onAction, style }) {
  const theme = useTheme(), c = theme.colors, steps = model.steps ?? [];
  const [name, ...rest] = String(model.author ?? "").split(" · ");
  return h(Card, { gap: "m", style: flat({ maxWidth: 680, alignSelf: "center", width: "100%", padding: theme.space.l }, style) },
    h(View, { style: { gap: theme.space.xs } },
      model.eyebrow ? h(Text, { size: "xs", weight: "bold", tone: "accent", style: { letterSpacing: 1, textTransform: "uppercase" } }, model.eyebrow) : null,
      h(Heading, { level: 1 }, model.title),
      model.summary ? h(Text, { size: "lg", tone: "muted", style: { lineHeight: 28 } }, model.summary) : null),
    model.author ? h(View, { style: row(theme.space.s) }, h(Avatar, { name, size: 36 }),
      h(View, { style: { flex: 1 } }, h(Text, { size: "sm", weight: "semibold" }, name), rest.length ? h(Text, { size: "xs", tone: "muted" }, rest.join(" · ")) : null)) : null,
    h(Divider),
    (model.body ?? []).map((paragraph, index) => h(Text, { key: index, style: { lineHeight: 26 } }, paragraph)),
    steps.length ? h(View, { accessibilityRole: "list" }, steps.map((step, index) => h(View, { key: index, style: { flexDirection: "row", gap: theme.space.s } },
      h(View, { style: { alignItems: "center" } },
        h(View, { style: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: c.accentSoft } }, h(Text, { size: "sm", weight: "bold", tone: "accent" }, index + 1)),
        index < steps.length - 1 ? h(View, { style: { width: 2, flex: 1, marginVertical: 4, backgroundColor: c.line } }) : null),
      h(View, { accessibilityLabel: `Step ${index + 1}: ${step.title}. ${step.text}`, style: { flex: 1, gap: 2, paddingTop: 3, paddingBottom: index < steps.length - 1 ? theme.space.m : 0 } },
        h(Text, { weight: "semibold" }, step.title), h(Text, { tone: "muted", style: { lineHeight: 24 } }, step.text))))) : null,
    model.linkLabel ? h(Button, { title: `${model.linkLabel} ${GLYPH.arrowRight}`, variant: "soft", accessibilityRole: "link", accessibilityLabel: model.linkLabel, onPress: () => send(onAction, "open-link", model.href) }) : null);
}

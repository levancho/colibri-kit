// Data display: tables, label/value lists, carousel, message log, code, rating and placeholders.
// Built on the basics (Stack, Text, Button, TextField …) with react-native core only.
import { Children, createElement as h, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Platform, Pressable, ScrollView, Text as NativeText, View } from "react-native";
import { useTheme } from "./provider.js";
import { toneName } from "./theme.js";
import { web, depth, gapOf, flat, GLYPH } from "./internal.js";
import { Text, Heading, Button, TextField } from "./components.js";

// ---------------------------------------------------------------- local helpers
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
/** Table, log and separator roles exist on the web only; native screen readers read the content in order. */
const webRole = (role) => (web ? { accessibilityRole: role } : null);
const isText = (value) => typeof value === "string" || typeof value === "number";
const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" });

/** value + onChange when controlled, defaultValue otherwise. */
function useControlled(value, defaultValue, onChange) {
  const [inner, setInner] = useState(defaultValue), controlled = value !== undefined, current = controlled ? value : inner;
  const latest = useRef(onChange); latest.current = onChange;
  const set = useCallback((next) => { if (!controlled) setInner(next); latest.current?.(next); }, [controlled]);
  return [current, set];
}

/** True when the device asks for less motion. */
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((on) => { if (alive) setReduced(!!on); }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener?.("reduceMotionChanged", (on) => setReduced(!!on));
    return () => { alive = false; subscription?.remove?.(); };
  }, []);
  return reduced;
}

/** A tick box drawn with View, with a mixed state for "some rows selected". checked: true | false | "mixed". */
function CheckMark({ checked }) {
  const theme = useTheme(), c = theme.colors, on = checked === true || checked === "mixed";
  return h(View, { style: { width: 20, height: 20, borderRadius: Math.min(5, theme.radius.s), borderWidth: 2, borderColor: on ? c.accent : c.muted, backgroundColor: on ? c.accent : "transparent", alignItems: "center", justifyContent: "center" } },
    checked === "mixed" ? h(View, { style: { width: 10, height: 2, borderRadius: 1, backgroundColor: c.brandFg } })
      : checked ? h(NativeText, { style: { color: c.brandFg, fontSize: 13, lineHeight: 15, fontWeight: "800" } }, GLYPH.check) : null);
}

// ---------------------------------------------------------------- table
const SELECT_WIDTH = 44, COLUMN_MIN = 96;
const keyOf = (rowKey, row, index) => (typeof rowKey === "function" ? rowKey(row, index) : row?.[rowKey] ?? index);
const columnBox = (column) => (column.width != null ? { width: column.width } : { flex: column.flex ?? 1, minWidth: column.minWidth ?? COLUMN_MIN });
const columnAlign = (column) => column.align ?? (column.numeric ? "right" : "left");
const JUSTIFY = { left: "flex-start", center: "center", right: "flex-end" };
const SORT_WORD = { asc: "ascending", desc: "descending" };

/**
 * A plain table. columns: [{ key, title, width?, minWidth?, flex?, align?, numeric?, render?(row, index), sortable? }],
 * rows: objects. Scrolls sideways when the columns need more room than the screen has.
 * Optional extras (used by DataTable): sort = { key, direction } with onSort(key), and
 * selectable + selected (array of row keys) + onSelectedChange. onRowPress makes rows pressable.
 */
export function Table({ columns = [], rows = [], rowKey = "id", caption, striped = false, dense = false, bordered = true, sort, onSort,
  selectable = false, selected = [], onSelectedChange, onRowPress, rowLabel, empty, style }) {
  const theme = useTheme(), c = theme.colors;
  const padV = dense ? theme.space["2xs"] + 2 : theme.space.xs + 2, padH = theme.space.s;
  const minWidth = columns.reduce((sum, column) => sum + (column.width ?? column.minWidth ?? COLUMN_MIN), selectable ? SELECT_WIDTH : 0);
  const keys = rows.map((row, index) => keyOf(rowKey, row, index)), chosen = new Set(selected);
  const count = keys.filter((key) => chosen.has(key)).length, all = count > 0 && count === keys.length;
  const toggleAll = () => onSelectedChange?.(all ? selected.filter((key) => !keys.includes(key)) : [...new Set([...selected, ...keys])]);
  const toggle = (key) => onSelectedChange?.(chosen.has(key) ? selected.filter((item) => item !== key) : [...selected, key]);
  const labelOf = (row, index) => (rowLabel ? rowLabel(row, index) : isText(row?.[columns[0]?.key]) ? String(row[columns[0].key]) : `row ${index + 1}`);
  const cellStyle = (column) => flat(columnBox(column), { paddingVertical: padV, paddingHorizontal: padH, flexDirection: "row", alignItems: "center", justifyContent: JUSTIFY[columnAlign(column)] ?? "flex-start" });
  const tick = (checked, label, onPress, key) => h(Pressable, { key, onPress, accessibilityRole: "checkbox", accessibilityLabel: label, accessibilityState: { checked }, "aria-checked": checked,
    style: { width: SELECT_WIDTH, minHeight: theme.touch, alignItems: "center", justifyContent: "center" } }, h(CheckMark, { checked }));

  const head = h(View, { ...webRole("row"), style: { flexDirection: "row", alignItems: "stretch", backgroundColor: c.sunken, borderBottomWidth: 1, borderBottomColor: c.line } },
    selectable ? tick(all ? true : count ? "mixed" : false, "Select all rows", toggleAll, "select") : null,
    columns.map((column) => {
      const active = sort?.key === column.key ? sort.direction : null, sortable = !!(column.sortable && onSort);
      const label = h(Text, { key: "t", size: "xs", weight: "semibold", tone: active ? undefined : "muted", numberOfLines: 1, style: { letterSpacing: 0.3, textTransform: "uppercase", flexShrink: 1 } }, column.title ?? column.key);
      if (!sortable) return h(View, { key: column.key, ...webRole("columnheader"), style: cellStyle(column) }, label);
      return h(View, { key: column.key, ...webRole("columnheader"), "aria-sort": active ? SORT_WORD[active] : "none", style: columnBox(column) },
        h(Pressable, { onPress: () => onSort(column.key), accessibilityRole: "button",
          accessibilityLabel: `Sort by ${column.title ?? column.key}${active ? `, sorted ${SORT_WORD[active]}` : ""}`,
          style: ({ pressed }) => ({ flex: 1, minHeight: theme.touch, paddingHorizontal: padH, flexDirection: "row", alignItems: "center", gap: theme.space["2xs"], justifyContent: JUSTIFY[columnAlign(column)] ?? "flex-start", backgroundColor: pressed ? c.line : "transparent" }) },
          label, h(NativeText, { key: "a", style: { width: 12, textAlign: "center", fontSize: theme.text.xs, fontWeight: "700", color: active ? c.accent : c.muted, opacity: active ? 1 : 0.45 } }, active === "desc" ? GLYPH.arrowDown : GLYPH.arrowUp)));
    }));

  const body = rows.length ? rows.map((row, index) => {
    const key = keys[index], isSelected = selectable && chosen.has(key), last = index === rows.length - 1;
    const base = { flexDirection: "row", alignItems: "stretch", borderBottomWidth: last ? 0 : 1, borderBottomColor: c.line, backgroundColor: isSelected ? c.accentSoft : striped && index % 2 ? c.sunken : "transparent" };
    const cells = [selectable ? tick(isSelected, `Select ${labelOf(row, index)}`, () => toggle(key), "select") : null,
      ...columns.map((column) => {
        const value = column.render ? column.render(row, index) : row?.[column.key];
        return h(View, { key: column.key, ...webRole("cell"), style: cellStyle(column) },
          isText(value) ? h(Text, { size: "sm", align: columnAlign(column), style: flat({ flexShrink: 1 }, column.numeric && { fontVariant: ["tabular-nums"] }) }, value) : value ?? null);
      })];
    if (!onRowPress) return h(View, { key: String(key), ...webRole("row"), "aria-selected": selectable ? isSelected : undefined, style: base }, cells);
    return h(Pressable, { key: String(key), onPress: () => onRowPress(row, index), accessibilityRole: "button", accessibilityLabel: `Open ${labelOf(row, index)}`,
      style: ({ pressed }) => flat(base, pressed && { backgroundColor: c.sunken }) }, cells);
  }) : null;
  // The empty state sits outside the sideways scroller, so it stays centred on the screen however wide the columns are.
  const none = rows.length ? null : h(View, { style: { padding: theme.space.l, alignItems: "center" } }, isText(empty ?? "No rows") ? h(Text, { size: "sm", tone: "muted" }, empty ?? "No rows") : empty);

  return h(View, { style: flat({ gap: theme.space.xs }, style) },
    caption ? h(Text, { size: "sm", tone: "muted" }, caption) : null,
    h(View, { style: bordered ? { borderWidth: 1, borderColor: c.line, borderRadius: theme.radius.m, backgroundColor: c.surface, overflow: "hidden" } : null },
      h(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: true, contentContainerStyle: { flexGrow: 1 } },
        h(View, { ...webRole("table"), accessibilityLabel: caption, style: { flexGrow: 1, minWidth } }, head, body)), none));
}

const sortValue = (column, row) => (column.sortValue ? column.sortValue(row) : row?.[column.key]);
const compare = (a, b) => {
  if (a == null || b == null) return a == null ? (b == null ? 0 : 1) : -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (a instanceof Date && b instanceof Date) return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
};

/**
 * A Table with search, sortable columns (press a header: ascending, descending, off), row selection and pages.
 * Every piece of state works uncontrolled, or controlled with its pair:
 * search + onSearchChange, sort ({ key, direction }) + onSortChange, page (from 0) + onPageChange, selected (row keys) + onSelectedChange.
 * Columns sort unless sortable: false; sortValue(row) and searchValue(row) override what is compared and searched.
 */
export function DataTable({ columns = [], rows = [], rowKey = "id", caption, searchable = true, searchPlaceholder = "Search…", search, defaultSearch = "", onSearchChange,
  sort, defaultSort = null, onSortChange, pageSize = 10, page, defaultPage = 0, onPageChange, selectable = false, selected, defaultSelected = [], onSelectedChange,
  emptyText = "No results found", toolbar, striped, dense, onRowPress, rowLabel, style }) {
  const theme = useTheme();
  const [query, setQuery] = useControlled(search, defaultSearch, onSearchChange);
  const [order, setOrder] = useControlled(sort, defaultSort, onSortChange);
  const [at, setAt] = useControlled(page, defaultPage, onPageChange);
  const [picked, setPicked] = useControlled(selected, defaultSelected, onSelectedChange);
  const tableColumns = useMemo(() => columns.map((column) => ({ ...column, sortable: column.sortable !== false })), [columns]);

  const filtered = useMemo(() => {
    const needle = String(query ?? "").trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => columns.some((column) => {
      const value = column.searchValue ? column.searchValue(row) : row?.[column.key];
      return isText(value) && String(value).toLowerCase().includes(needle);
    }));
  }, [rows, columns, query]);
  const sorted = useMemo(() => {
    const column = order && columns.find((item) => item.key === order.key);
    if (!column) return filtered;
    const sign = order.direction === "desc" ? -1 : 1;
    return filtered.map((row, index) => [row, index]).sort((a, b) => sign * compare(sortValue(column, a[0]), sortValue(column, b[0])) || a[1] - b[1]).map(([row]) => row);
  }, [filtered, columns, order]);

  const size = Math.max(1, pageSize), pages = Math.max(1, Math.ceil(sorted.length / size)), current = clamp(at ?? 0, 0, pages - 1);
  const visible = sorted.slice(current * size, current * size + size);
  const first = sorted.length ? current * size + 1 : 0, last = current * size + visible.length;
  const onSort = (key) => { setOrder(order?.key !== key ? { key, direction: "asc" } : order.direction === "asc" ? { key, direction: "desc" } : null); setAt(0); };
  const info = `${sorted.length ? `${first}–${last} of ${sorted.length}` : "0 results"}${selectable && picked.length ? ` · ${picked.length} selected` : ""}`;

  return h(View, { style: flat({ gap: theme.space.s }, style) },
    searchable || toolbar ? h(View, { style: { flexDirection: "row", alignItems: "center", gap: theme.space.xs } },
      searchable ? h(TextField, { value: query, onChangeText: (next) => { setQuery(next); setAt(0); }, placeholder: searchPlaceholder, accessibilityLabel: "Search", accessibilityRole: "search",
        autoCapitalize: "none", autoCorrect: false, returnKeyType: "search", clearButtonMode: "while-editing", style: { flex: 1 } }) : null,
      toolbar) : null,
    h(Table, { columns: tableColumns, rows: visible, rowKey, caption, striped, dense, sort: order, onSort, selectable, selected: picked, onSelectedChange: setPicked, onRowPress, rowLabel,
      empty: h(Empty, { title: emptyText, description: query ? `Nothing matches “${query}”.` : undefined, size: "s" }) }),
    h(View, { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.space.xs } },
      h(Text, { size: "sm", tone: "muted", accessibilityLiveRegion: "polite", "aria-live": "polite", style: { flexShrink: 1 } }, info),
      pages > 1 ? h(Pager, { page: current, pages, onChange: setAt }) : null));
}

/** Previous / next with "2 / 4" between them. Private to DataTable. */
function Pager({ page, pages, onChange }) {
  const theme = useTheme();
  const step = (label, glyph, to, disabled) => h(Button, { variant: "outline", size: "s", disabled, accessibilityLabel: label, onPress: () => onChange(to), style: { paddingHorizontal: 0, width: 36 } }, glyph);
  return h(View, { style: { flexDirection: "row", alignItems: "center", gap: theme.space.xs } },
    step("Previous page", GLYPH.chevronLeft, page - 1, page <= 0),
    h(Text, { size: "sm", weight: "medium", accessibilityLabel: `Page ${page + 1} of ${pages}`, style: { fontVariant: ["tabular-nums"] } }, `${page + 1} / ${pages}`),
    step("Next page", GLYPH.chevronRight, page + 1, page >= pages - 1));
}

// ---------------------------------------------------------------- data list
/**
 * Label and value pairs. items: [{ label, value }] where value is text or any element.
 * orientation "horizontal" puts the label beside the value; "vertical" stacks them.
 */
export function DataList({ items = [], orientation = "horizontal", divided = true, labelWidth = "38%", gap, style }) {
  const theme = useTheme(), side = orientation !== "vertical";
  return h(View, { style: flat({ gap: divided ? 0 : gapOf(theme, gap ?? "xs") }, style) }, items.map((item, index) => h(View, { key: item.key ?? String(item.label ?? index),
    accessible: isText(item.value), accessibilityLabel: isText(item.value) ? `${item.label}: ${item.value}` : undefined,
    style: flat({ gap: side ? theme.space.s : theme.space["3xs"], flexDirection: side ? "row" : "column", alignItems: side ? "center" : "stretch" },
      divided && { paddingVertical: theme.space.xs + 2, borderTopWidth: index ? 1 : 0, borderTopColor: theme.colors.line }) },
    h(Text, { size: "sm", tone: "muted", style: side ? { width: labelWidth } : null }, item.label),
    h(View, { style: side ? { flex: 1, alignItems: "flex-start" } : { alignItems: "flex-start" } }, isText(item.value) ? h(Text, { size: "sm", weight: "medium", selectable: true }, item.value) : item.value ?? null))));
}

// ---------------------------------------------------------------- carousel
/**
 * Slides you swipe through, one per page, with previous / next buttons and dots. Each child is a slide.
 * index + onChange (or defaultIndex). loop wraps around at the ends; autoplay is a delay in milliseconds
 * (off when the device asks for reduced motion, and paused while a finger is on the slides).
 */
export function Carousel({ children, index, defaultIndex = 0, onChange, loop = false, autoplay = 0, showArrows = true, showDots = true, gap = "s", accessibilityLabel = "Carousel", style }) {
  const theme = useTheme(), c = theme.colors, slides = Children.toArray(children), count = slides.length, reduced = useReducedMotion();
  const [raw, setCurrent] = useControlled(index, defaultIndex, onChange), current = clamp(raw ?? 0, 0, Math.max(0, count - 1));
  const [width, setWidth] = useState(0), [held, setHeld] = useState(false);
  const scroller = useRef(null), shown = useRef(0), target = useRef(null), timer = useRef(null), laidOut = useRef(false);

  useEffect(() => {
    if (!width || shown.current === current) { if (width) laidOut.current = true; return; }
    const animated = laidOut.current && !reduced; laidOut.current = true;
    target.current = current; clearTimeout(timer.current);
    timer.current = setTimeout(() => { target.current = null; shown.current = current; }, 700); // in case no scroll events arrive
    scroller.current?.scrollTo({ x: current * width, y: 0, animated });
  }, [current, width, reduced]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const go = useCallback((to) => { if (count) setCurrent(loop ? (to + count) % count : clamp(to, 0, count - 1)); }, [count, loop, setCurrent]);
  useEffect(() => {
    if (!autoplay || reduced || held || count < 2) return undefined;
    const id = setInterval(() => go(current + 1 >= count ? 0 : current + 1), Math.max(1500, autoplay));
    return () => clearInterval(id);
  }, [autoplay, reduced, held, count, current, go]);

  const onScroll = (event) => {
    if (!width) return;
    const at = clamp(Math.round(event.nativeEvent.contentOffset.x / width), 0, count - 1);
    if (target.current != null) { if (at !== target.current) return; target.current = null; clearTimeout(timer.current); }
    shown.current = at;
    if (at !== current) setCurrent(at);
  };
  const arrow = (label, glyph, to, disabled) => h(Pressable, { onPress: () => go(to), disabled, accessibilityRole: "button", accessibilityLabel: label, accessibilityState: { disabled }, "aria-disabled": disabled, hitSlop: 4,
    style: ({ pressed }) => ({ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: c.line, backgroundColor: pressed ? c.sunken : c.surface, alignItems: "center", justifyContent: "center", opacity: disabled ? 0.4 : 1 }) },
    h(NativeText, { style: { color: c.fg, fontSize: 20, lineHeight: 22, fontWeight: "600", marginTop: -2 } }, glyph));

  return h(View, { accessibilityLabel, "aria-roledescription": "carousel", style: flat({ gap: gapOf(theme, gap) }, style) },
    h(View, { onLayout: (event) => setWidth(Math.round(event.nativeEvent.layout.width)), style: { borderRadius: theme.radius.l, overflow: "hidden" } },
      h(ScrollView, { ref: scroller, horizontal: true, pagingEnabled: true, showsHorizontalScrollIndicator: false, scrollEventThrottle: 16, onScroll, decelerationRate: "fast",
        onScrollBeginDrag: () => { target.current = null; setHeld(true); }, onScrollEndDrag: () => setHeld(false), onTouchStart: () => setHeld(true), onTouchEnd: () => setHeld(false), onTouchCancel: () => setHeld(false) },
        width ? slides.map((slide, at) => h(View, { key: slide.key ?? at, accessibilityLabel: `Slide ${at + 1} of ${count}`, "aria-roledescription": "slide", "aria-hidden": at !== current,
          accessibilityElementsHidden: at !== current, importantForAccessibility: at === current ? "auto" : "no-hide-descendants", style: { width } }, slide)) : null)),
    (showArrows || showDots) && count > 1 ? h(View, { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.space.xs } },
      showArrows ? arrow("Previous slide", GLYPH.chevronLeft, current - 1, !loop && current <= 0) : h(View, null),
      showDots ? h(View, { accessibilityRole: "tablist", style: { flexDirection: "row", alignItems: "center", gap: theme.space["2xs"], flexShrink: 1 } }, slides.map((slide, at) => {
        const active = at === current;
        return h(Pressable, { key: at, onPress: () => go(at), accessibilityRole: "tab", accessibilityLabel: `Go to slide ${at + 1}`, accessibilityState: { selected: active }, "aria-selected": active,
          hitSlop: { top: 16, bottom: 16, left: 4, right: 4 }, style: { paddingVertical: 6, paddingHorizontal: 2 } },
          h(View, { style: { width: active ? 20 : 8, height: 8, borderRadius: 4, backgroundColor: active ? c.accent : c.muted, opacity: active ? 1 : 0.4 } }));
      })) : null,
      showArrows ? arrow("Next slide", GLYPH.chevronRight, current + 1, !loop && current >= count - 1) : h(View, null)) : null);
}

// ---------------------------------------------------------------- message scroller
/**
 * A chat log that stays on the newest item while you are at the bottom. Scroll up and it leaves you alone,
 * showing a button that jumps back down (and says so when something new arrived meanwhile).
 * Children are the messages. ref.scrollToBottom({ animated }) jumps from outside.
 */
export const MessageScroller = forwardRef(function MessageScroller({ children, height = 320, gap = "xs", padded = true, bordered = true, threshold = 32, jumpLabel = "Jump to latest", newLabel = "New messages",
  onAtBottomChange, accessibilityLabel = "Messages", style, contentStyle, ...rest }, ref) {
  const theme = useTheme(), c = theme.colors, reduced = useReducedMotion();
  const scroller = useRef(null), stick = useRef(true), auto = useRef(0), tall = useRef(0), ready = useRef(false), lastY = useRef(0);
  const [atBottom, setAtBottom] = useState(true), [fresh, setFresh] = useState(false);
  const report = useRef(onAtBottomChange); report.current = onAtBottomChange;
  const settle = (bottom) => { stick.current = bottom; setAtBottom((now) => { if (now !== bottom) report.current?.(bottom); return bottom; }); if (bottom) setFresh(false); };
  const scrollToBottom = useCallback(({ animated = true } = {}) => {
    auto.current = Date.now(); stick.current = true;
    scroller.current?.scrollToEnd({ animated: animated && !reduced });
    setAtBottom((now) => { if (!now) report.current?.(true); return true; }); setFresh(false);
  }, [reduced]);
  useImperativeHandle(ref, () => ({ scrollToBottom, scrollTo: (...args) => scroller.current?.scrollTo(...args) }), [scrollToBottom]);
  return h(View, { style: flat({ height }, bordered && { borderWidth: 1, borderColor: c.line, borderRadius: theme.radius.m, backgroundColor: c.surface, overflow: "hidden" }, style) },
    h(ScrollView, { ref: scroller, scrollEventThrottle: 16, nestedScrollEnabled: true, ...webRole("log"), accessibilityLabel, accessibilityLiveRegion: "polite", ...rest,
      contentContainerStyle: flat({ gap: gapOf(theme, gap), padding: padded ? theme.space.s : 0 }, contentStyle),
      onContentSizeChange: (w, hgt) => {
        const grew = hgt > tall.current + 1; tall.current = hgt;
        if (stick.current) { auto.current = Date.now(); scroller.current?.scrollToEnd({ animated: ready.current && !reduced }); } else if (grew && ready.current) setFresh(true);
        ready.current = true;
      },
      onScroll: (event) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const bottom = contentSize.height - contentOffset.y - layoutMeasurement.height <= threshold;
        const down = contentOffset.y >= lastY.current; lastY.current = contentOffset.y;
        if (!bottom && down && Date.now() - auto.current < 500) return; // our own animated scroll is still on its way down
        settle(bottom);
      } }, children),
    atBottom ? null : h(View, { style: { position: "absolute", left: 0, right: 0, bottom: theme.space.s, alignItems: "center", pointerEvents: "box-none" } },
      h(Pressable, { onPress: () => scrollToBottom(), accessibilityRole: "button", accessibilityLabel: fresh ? `${newLabel}. ${jumpLabel}` : jumpLabel, hitSlop: 6,
        style: ({ pressed }) => flat({ minHeight: 32, paddingHorizontal: theme.space.s, flexDirection: "row", alignItems: "center", gap: theme.space["2xs"], borderRadius: theme.radius.full, borderWidth: 1,
          borderColor: fresh ? c.fg : c.line, backgroundColor: fresh ? c.fg : c.surface, opacity: pressed ? 0.85 : 1 }, depth(theme.shadow.m)) },
        h(Text, { size: "sm", weight: "medium", style: { color: fresh ? c.bg : c.fg } }, `${GLYPH.arrowDown} ${fresh ? newLabel : jumpLabel}`))));
});

// ---------------------------------------------------------------- code block
/**
 * Monospace text that scrolls sideways instead of wrapping (wrap turns that off). Pass the text as code or as a string child.
 * React Native core has no clipboard, so the Copy button appears when you pass onCopy(code) and you do the copying
 * (expo-clipboard, @react-native-clipboard/clipboard); the button then shows "Copied" for a moment.
 */
export function CodeBlock({ code, children, title, language, onCopy, copyLabel = "Copy", copiedLabel = "Copied", wrap = false, lineNumbers = false, maxHeight, style }) {
  const theme = useTheme(), c = theme.colors, source = String(code ?? (Array.isArray(children) ? children.join("") : children ?? "")).replace(/\n$/, "");
  const [copied, setCopied] = useState(false), timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    try { await onCopy(source); } catch { return; }
    setCopied(true); clearTimeout(timer.current); timer.current = setTimeout(() => setCopied(false), 1600);
  };
  const mono = { fontFamily: MONO, fontSize: theme.text.sm - 1, lineHeight: Math.round((theme.text.sm - 1) * 1.6) };
  const lines = source.split("\n");
  const text = h(View, { style: { flexDirection: "row", gap: theme.space.s, padding: theme.space.s, flexShrink: wrap ? 1 : 0 } },
    lineNumbers ? h(NativeText, { accessibilityElementsHidden: true, importantForAccessibility: "no", "aria-hidden": true, style: flat(mono, { color: c.muted, textAlign: "right", opacity: 0.7 }) }, lines.map((_, at) => at + 1).join("\n")) : null,
    h(NativeText, { selectable: true, accessibilityLabel: language ? `${language} code: ${source}` : undefined, style: flat(mono, { color: c.fg, flexShrink: wrap ? 1 : 0 }) }, source));
  const body = wrap ? text : h(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: true, contentContainerStyle: { flexGrow: 1 } }, text);
  const header = title || language || onCopy;
  return h(View, { style: flat({ borderWidth: 1, borderColor: c.line, borderRadius: theme.radius.m, backgroundColor: c.sunken, overflow: "hidden" }, style) },
    header ? h(View, { style: { minHeight: 40, paddingLeft: theme.space.s, paddingRight: theme.space["2xs"], flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.space.xs, borderBottomWidth: 1, borderBottomColor: c.line } },
      h(Text, { size: "xs", weight: "semibold", tone: "muted", numberOfLines: 1, style: { flexShrink: 1 } }, title ?? language ?? ""),
      onCopy ? h(Button, { size: "s", variant: "ghost", onPress: copy, accessibilityLabel: copied ? copiedLabel : `${copyLabel} code`, accessibilityLiveRegion: "polite",
        textStyle: copied ? { color: c.ok } : null }, copied ? `${GLYPH.check} ${copiedLabel}` : copyLabel) : null) : null,
    maxHeight ? h(ScrollView, { style: { maxHeight }, nestedScrollEnabled: true }, body) : body);
}

// ---------------------------------------------------------------- rating
const STAR = { s: 18, m: 26, l: 34 };
/**
 * Stars. value + onChange (or defaultValue); max stars (5). allowHalf picks half steps from where on the star you press.
 * Pressing the current value again clears it (clearable={false} stops that). readOnly shows a score, fractions included.
 */
export function Rating({ value, defaultValue = 0, onChange, max = 5, allowHalf = false, readOnly = false, disabled = false, clearable = true, size = "m", tone = "warn", accessibilityLabel = "Rating", style }) {
  const theme = useTheme(), c = theme.colors, px = typeof size === "number" ? size : STAR[size] ?? STAR.m;
  const [raw, setValue] = useControlled(value, defaultValue, onChange), score = clamp(+raw || 0, 0, max);
  const color = c[toneName(tone)] ?? c.warn, glyph = { fontSize: px, lineHeight: Math.round(px * 1.2), width: Math.round(px * 1.1), textAlign: "center" };
  const cell = Math.round(px * 1.1), slop = Math.max(0, (theme.touch - Math.round(px * 1.2)) / 2);
  const stars = Array.from({ length: max }, (_, at) => {
    const fill = clamp(score - at, 0, 1), shown = readOnly ? fill : allowHalf ? Math.round(fill * 2) / 2 : Math.round(fill);
    const star = h(View, { key: at, style: { width: cell } },
      h(NativeText, { style: flat(glyph, { color: c.muted, opacity: 0.35 }) }, GLYPH.star),
      shown > 0 ? h(View, { style: { position: "absolute", left: 0, top: 0, bottom: 0, width: cell * shown, overflow: "hidden" } }, h(NativeText, { style: flat(glyph, { color }) }, GLYPH.star)) : null);
    if (readOnly) return star;
    const whole = at + 1, checked = score > at && score <= whole;
    return h(Pressable, { key: at, disabled, accessibilityRole: "radio", accessibilityLabel: `${whole} ${whole === 1 ? "star" : "stars"}`, accessibilityState: { checked, selected: checked, disabled }, "aria-checked": checked, "aria-disabled": disabled,
      hitSlop: { top: slop, bottom: slop },
      onPress: (event) => {
        const x = event?.nativeEvent?.locationX, next = allowHalf && typeof x === "number" && x < cell / 2 ? whole - 0.5 : whole;
        setValue(clearable && next === score ? 0 : next);
      },
      style: ({ pressed }) => ({ transform: [{ scale: pressed ? 0.88 : 1 }] }) }, star);
  });
  const spoken = `${score} of ${max} stars`;
  return h(View, readOnly
    ? { accessible: true, accessibilityRole: "image", accessibilityLabel: `${accessibilityLabel}: ${spoken}`, style: flat({ flexDirection: "row", alignSelf: "flex-start" }, style) }
    : { accessibilityRole: "radiogroup", accessibilityLabel, accessibilityValue: { text: spoken }, style: flat({ flexDirection: "row", alignSelf: "flex-start", opacity: disabled ? 0.5 : 1 }, style) }, stars);
}

// ---------------------------------------------------------------- skeleton
/**
 * A pulsing placeholder in the shape of what is loading. width and height are numbers or percentages;
 * radius is s | m | l | full or a number; circle makes a round one of the given size.
 * It is hidden from screen readers: label the loading region itself. The pulse stops when the device asks for reduced motion.
 */
export function Skeleton({ width = "100%", height = 14, radius = "s", circle, animated = true, style }) {
  const theme = useTheme(), reduced = useReducedMotion(), pulse = useRef(new Animated.Value(1)).current, moving = animated && !reduced;
  useEffect(() => {
    if (!moving) { pulse.setValue(1); return undefined; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.45, duration: 750, useNativeDriver: !web }),
      Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: !web })]));
    loop.start();
    return () => loop.stop();
  }, [moving, pulse]);
  const round = typeof circle === "number" ? circle : circle ? (typeof height === "number" ? height : 40) : null;
  const shape = round != null ? { width: round, height: round, borderRadius: round / 2 } : { width, height, borderRadius: typeof radius === "number" ? radius : theme.radius[radius] ?? theme.radius.s };
  return h(Animated.View, { accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants", "aria-hidden": true, style: flat(shape, { backgroundColor: theme.colors.line, opacity: pulse }, style) });
}

/** Lines of placeholder text; the last one is shorter. */
export function SkeletonText({ lines = 3, lineHeight = 12, gap = "xs", lastWidth = "60%", animated, style }) {
  const theme = useTheme();
  return h(View, { accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants", "aria-hidden": true, style: flat({ gap: gapOf(theme, gap), alignSelf: "stretch" }, style) },
    Array.from({ length: Math.max(1, lines) }, (_, at) => h(Skeleton, { key: at, height: lineHeight, animated, width: at === lines - 1 && lines > 1 ? lastWidth : "100%" })));
}

// ---------------------------------------------------------------- empty
const EMPTY = { s: { pad: "m", icon: 40, title: 4 }, m: { pad: "l", icon: 56, title: 3 }, l: { pad: "xl", icon: 72, title: 2 } };
/**
 * What a list shows when it has nothing: icon, title, description and an action.
 * icon is a text glyph (drawn in a soft circle) or any element; action (or children) is usually a Button.
 */
export function Empty({ icon, title, description, action, children, size = "m", bordered = false, style }) {
  const theme = useTheme(), c = theme.colors, dims = EMPTY[size] ?? EMPTY.m, extra = action ?? children;
  return h(View, { style: flat({ alignItems: "center", gap: theme.space.xs, padding: theme.space[dims.pad] }, bordered && { borderWidth: 1, borderStyle: "dashed", borderColor: c.line, borderRadius: theme.radius.l }, style) },
    icon == null ? null : isText(icon)
      ? h(View, { accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants", "aria-hidden": true, style: { width: dims.icon, height: dims.icon, borderRadius: dims.icon / 2, marginBottom: theme.space["2xs"], alignItems: "center", justifyContent: "center", backgroundColor: c.accentSoft } },
        h(NativeText, { style: { color: c.accent, fontSize: Math.round(dims.icon * 0.46), lineHeight: Math.round(dims.icon * 0.58), fontWeight: "600" } }, icon))
      : h(View, { style: { marginBottom: theme.space["2xs"] } }, icon),
    title ? h(Heading, { level: dims.title, align: "center" }, title) : null,
    description ? (isText(description) ? h(Text, { size: "sm", tone: "muted", align: "center", style: { maxWidth: 320 } }, description) : description) : null,
    extra ? h(View, { style: { marginTop: theme.space.xs, flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: theme.space.xs } }, extra) : null);
}

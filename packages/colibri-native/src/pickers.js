// Pickers: Slider, Calendar, DatePicker, ColorPicker, FileInput, ImageInput, Repeater and Sortable.
// Everything is drawn with View, Text and PanResponder from React Native core: no native slider, no gesture
// library, no gradients, no file-system module.
//
// Honest scope (ARCHITECTURE.md rule 8):
// - React Native core has no file or image picker. FileInput and ImageInput therefore take an async `onPick`
//   callback that the app wires to expo-document-picker / expo-image-picker (or an <input type="file"> on the web).
//   They own everything around the pick: the trigger, the list or preview, remove buttons, limits and errors.
// - Core has no gradients, so ColorPicker draws its hue, saturation and lightness tracks from small colour steps.
// - A phone has no popover or typed ISO date: DatePicker is a field that opens the Calendar in a Sheet.
import { createElement as h, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Image, PanResponder, Pressable, View } from "react-native";
import { useTheme } from "./provider.js";
import { toneName } from "./theme.js";
import { oklch } from "./color.js";
import { web, depth, flat, GLYPH } from "./internal.js";
import { Stack, Cluster, Text, Button, TextField, Spinner } from "./components.js";
import { Sheet } from "./overlays.js";

// ---------------------------------------------------------------- shared helpers
/** value + onChange when value is given, otherwise local state seeded from defaultValue. */
function useControlled(value, defaultValue, onChange) {
  const [inner, setInner] = useState(defaultValue), controlled = value !== undefined;
  const set = (next, ...extra) => { if (!controlled) setInner(next); onChange?.(next, ...extra); };
  return [controlled ? value : inner, set];
}
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const keyOf = (event) => event?.nativeEvent?.key ?? event?.key;
const announce = (message) => { try { AccessibilityInfo.announceForAccessibility?.(message); } catch { /* not available on this platform */ } };

/** A square, glyph-only button with an accessible name. Smaller sizes keep a 44pt target through hitSlop. */
function IconButton({ glyph, label, onPress, disabled = false, size, bordered = false, color, testID }) {
  const theme = useTheme(), c = theme.colors, box = size ?? theme.touch;
  return h(Pressable, { onPress, disabled, testID, accessibilityRole: "button", accessibilityLabel: label, accessibilityState: { disabled }, "aria-disabled": disabled,
    hitSlop: box < theme.touch ? (theme.touch - box) / 2 : undefined,
    style: ({ pressed }) => ({ width: box, height: box, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.s, borderWidth: bordered ? 1 : 0, borderColor: c.line,
      backgroundColor: pressed ? c.sunken : "transparent", opacity: disabled ? 0.35 : 1 }) },
    h(Text, { size: "lg", style: { color: color ?? c.fg } }, glyph));
}

// ---------------------------------------------------------------- slider
const decimals = (n) => { const s = String(n), e = s.indexOf("e-"); if (e >= 0) return +s.slice(e + 2); const dot = s.indexOf("."); return dot < 0 ? 0 : s.length - dot - 1; };
/** Nearest step from min, clamped, without floating-point noise (0.1 + 0.2 stays 0.3). */
function snap(raw, min, max, step) {
  const size = step > 0 ? step : 1, stepped = Math.round((raw - min) / size) * size + min;
  return clamp(+stepped.toFixed(Math.min(12, Math.max(decimals(size), decimals(min)))), min, max);
}
const touchX = (event) => event.nativeEvent.pageX - (web && typeof window !== "undefined" ? window.scrollX || 0 : 0);
const THUMB = 24;

// The slider itself. `track` and `thumbColor` are internal: ColorPicker uses them to draw colour tracks.
function SliderCore({ value, defaultValue, onChange, onChangeEnd, min = 0, max = 100, step = 1, range, disabled = false, tone = "accent", label, thumbLabels, formatValue, track, thumbColor, style, testID }) {
  const theme = useTheme(), c = theme.colors, color = c[toneName(tone)] ?? c.accent, soft = (theme.tones[toneName(tone)] ?? theme.tones.accent).soft;
  const isRange = range ?? Array.isArray(value ?? defaultValue);
  const [current, set] = useControlled(value, defaultValue ?? (isRange ? [min, max] : min), onChange);
  const values = (isRange ? (Array.isArray(current) ? current : [min, max]) : [Array.isArray(current) ? current[0] : current]).map((v) => clamp(Number.isFinite(+v) ? +v : min, min, max));
  const [active, setActive] = useState(-1), [focused, setFocused] = useState(-1);
  const rail = useRef(null), box = useRef(null), drag = useRef(null), latest = useRef(values), live = useRef({});
  if (!drag.current) latest.current = values;
  const out = (list) => (isRange ? list : list[0]);
  const span = max - min || 1, percent = (v) => ((v - min) / span) * 100;
  const text = (v) => (formatValue ? String(formatValue(v)) : String(v));

  // Moves one thumb. In a range the thumbs stop at each other instead of crossing.
  const move = (index, raw) => {
    const now = latest.current; let next = snap(raw, min, max, step);
    if (isRange) next = index === 0 ? Math.min(next, now[1]) : Math.max(next, now[0]);
    if (next === now[index]) return false;
    const list = now.slice(); list[index] = next; latest.current = list; set(out(list));
    return true;
  };
  const nudge = (index, amount) => { if (!disabled && move(index, latest.current[index] + amount)) onChangeEnd?.(out(latest.current)); };
  live.current = {
    disabled,
    begin(x) {
      const now = latest.current, raw = min + clamp((x - box.current.x) / (box.current.w || 1), 0, 1) * span;
      const index = !isRange ? 0 : Math.abs(raw - now[0]) === Math.abs(raw - now[1]) ? (raw < now[0] ? 0 : 1) : Math.abs(raw - now[0]) < Math.abs(raw - now[1]) ? 0 : 1;
      drag.current = { index }; setActive(index); move(index, raw);
    },
    to(x) { if (drag.current) move(drag.current.index, min + clamp((x - box.current.x) / (box.current.w || 1), 0, 1) * span); },
    end() { if (!drag.current) return; drag.current = null; setActive(-1); onChangeEnd?.(out(latest.current)); },
  };
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !live.current.disabled,
    onMoveShouldSetPanResponder: () => !live.current.disabled,
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
    // The rail is measured when the finger lands, so the maths is right after scrolling or rotation.
    onPanResponderGrant: (event) => { const x = touchX(event); rail.current?.measure((_x, _y, width, _h, pageX) => { box.current = { x: pageX, w: width }; live.current.begin(x); }); },
    onPanResponderMove: (event) => live.current.to(touchX(event)),
    onPanResponderRelease: () => live.current.end(),
    onPanResponderTerminate: () => live.current.end(),
  })).current;

  const big = Math.max(step, span / 10);
  const onKey = (index) => (event) => {
    const key = keyOf(event), moves = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: big, PageDown: -big, Home: -span, End: span };
    if (!(key in moves)) return;
    event.preventDefault?.(); nudge(index, moves[key]);
  };
  const names = thumbLabels ?? ["Minimum", "Maximum"];
  const lo = isRange ? percent(values[0]) : 0, hi = percent(values[isRange ? 1 : 0]);
  return h(View, { testID, ...pan.panHandlers, style: flat({ height: theme.touch, justifyContent: "center", opacity: disabled ? 0.5 : 1 }, web && { userSelect: "none", touchAction: "pan-y", cursor: disabled ? "auto" : "pointer" }, style) },
    h(View, { ref: rail, collapsable: false, style: { height: theme.touch, marginHorizontal: THUMB / 2, justifyContent: "center" } },
      track ?? h(View, { style: { height: 6, borderRadius: 3, backgroundColor: c.line, overflow: "hidden" } },
        h(View, { style: { position: "absolute", top: 0, bottom: 0, left: `${lo}%`, width: `${hi - lo}%`, backgroundColor: color } })),
      values.map((v, index) => {
        const name = isRange ? (label ? `${label}, ${names[index]}` : names[index]) : label;
        const from = isRange && index === 1 ? values[0] : min, upTo = isRange && index === 0 ? values[1] : max, lit = active === index || focused === index;
        return h(View, { key: index, testID: testID ? `${testID}-thumb-${index}` : undefined, accessible: true, accessibilityRole: "adjustable", accessibilityLabel: name,
          accessibilityValue: { min: from, max: upTo, now: v, text: text(v) }, "aria-valuemin": from, "aria-valuemax": upTo, "aria-valuenow": v, "aria-valuetext": text(v),
          accessibilityState: { disabled }, "aria-disabled": disabled, "aria-orientation": "horizontal",
          accessibilityActions: [{ name: "increment" }, { name: "decrement" }],
          onAccessibilityAction: (event) => nudge(index, event.nativeEvent.actionName === "increment" ? step : -step),
          ...(web ? { tabIndex: disabled ? -1 : 0, onKeyDown: onKey(index), onFocus: () => setFocused(index), onBlur: () => setFocused(-1) } : null),
          style: flat({ position: "absolute", left: `${percent(v)}%`, top: (theme.touch - THUMB) / 2, width: THUMB, height: THUMB, marginLeft: -THUMB / 2, zIndex: lit ? 2 : 1, alignItems: "center", justifyContent: "center" }, web && { outlineStyle: "none" }) },
          lit ? h(View, { style: { position: "absolute", top: -7, right: -7, bottom: -7, left: -7, borderRadius: theme.radius.full, backgroundColor: soft } }) : null,
          h(View, { style: { width: THUMB, height: THUMB, borderRadius: THUMB / 2, borderWidth: thumbColor ? 3 : 2, borderColor: thumbColor ? c.surface : color, backgroundColor: thumbColor ?? c.surface, ...depth(theme.shadow.m) } }));
      })));
}

/**
 * A slider built on PanResponder. value is a number, or [low, high] for a range (range is inferred from an array).
 * onChange fires while dragging, onChangeEnd once when the finger lifts (or after a key or screen-reader step).
 * Each thumb is "adjustable": it answers the increment and decrement accessibility actions and, on the web,
 * the arrow keys, Page Up/Down, Home and End.
 */
export function Slider({ track: _track, thumbColor: _thumbColor, ...props }) { return h(SliderCore, props); }

// ---------------------------------------------------------------- calendar
// Dates are ISO strings ("2026-11-12") everywhere in the API and are compared as strings; the arithmetic runs in
// UTC, so a calendar day never shifts with the device time zone.
const pad2 = (n) => String(n).padStart(2, "0");
const toIso = (y, m, d) => `${String(y).padStart(4, "0")}-${pad2(m + 1)}-${pad2(d)}`;
const parseIso = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof iso === "string" ? iso : ""); return m ? [+m[1], +m[2] - 1, +m[3]] : null; };
const fromUtc = (date) => toIso(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
const addDays = (iso, n) => { const [y, m, d] = parseIso(iso); return fromUtc(new Date(Date.UTC(y, m, d + n))); };
const localToday = () => { const now = new Date(); return toIso(now.getFullYear(), now.getMonth(), now.getDate()); };
const EN_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const EN_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
/** An Intl formatter pinned to UTC, or null where Intl (or the locale) is missing; callers fall back to English. */
function formatter(locale, options) {
  try { const made = new Intl.DateTimeFormat(locale || undefined, { ...options, timeZone: "UTC" }); made.format(0); return made; } catch { return null; }
}
function dateNames(locale) {
  const month = formatter(locale, { month: "long", year: "numeric" }), short = formatter(locale, { weekday: "short" }), full = formatter(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const sunday = Date.UTC(2023, 0, 1); // a Sunday
  return {
    month: (y, m) => (month ? month.format(Date.UTC(y, m, 1)) : `${EN_MONTHS[m]} ${y}`),
    weekdays: EN_DAYS.map((name, index) => (short ? short.format(sunday + index * 864e5) : name.slice(0, 3))),
    full: (iso) => { const [y, m, d] = parseIso(iso), at = new Date(Date.UTC(y, m, d)); return full ? full.format(at) : `${EN_DAYS[at.getUTCDay()]}, ${EN_MONTHS[m]} ${d}, ${y}`; },
  };
}
/** "12 Nov 2026" in the locale's own order. */
function formatIso(iso, locale, options) {
  const parts = parseIso(iso); if (!parts) return "";
  const [y, m, d] = parts, made = formatter(locale, options ?? { day: "numeric", month: "short", year: "numeric" });
  return made ? made.format(Date.UTC(y, m, d)) : `${EN_MONTHS[m].slice(0, 3)} ${d}, ${y}`;
}
const CALENDAR_LABELS = { previousMonth: "Previous month", nextMonth: "Next month", previousYear: "Previous year", nextYear: "Next year", today: "today" };

/**
 * A month grid. mode: "single" (value is an ISO date or null), "range" (value is [start, end], either may be null
 * while choosing) or "multiple" (value is a sorted array). onChange(value, { complete }) — complete is false while
 * a range still needs its end. min, max and disabledDates (an array of ISO dates or a function) block days;
 * firstDay is 0 (Sunday) to 6, Monday by default. Month and weekday names come from Intl for `locale`,
 * with English as the fallback. month / onMonthChange ("YYYY-MM") control the visible month when needed.
 */
export function Calendar({ mode = "single", value, defaultValue, onChange, min, max, disabledDates, firstDay = 1, locale, month, defaultMonth, onMonthChange, today, showYearNav = false, labels, style, testID }) {
  const theme = useTheme(), c = theme.colors, words = { ...CALENDAR_LABELS, ...labels };
  const [current, set] = useControlled(value, defaultValue ?? (mode === "single" ? null : mode === "range" ? [null, null] : []), onChange);
  const now = parseIso(today) ? today : localToday();
  const picked = mode === "single" ? current : mode === "range" ? (current?.[1] ?? current?.[0]) : current?.[current.length - 1];
  const [shown, setShown] = useControlled(month, defaultMonth ?? (parseIso(picked) ? picked : now).slice(0, 7), onMonthChange);
  const [year, monthIndex] = (parseIso(`${shown}-01`) ?? parseIso(now)).slice(0, 2);
  const names = useMemo(() => dateNames(locale), [locale]);
  const start = Array.isArray(current) && mode === "range" ? current[0] : null, end = Array.isArray(current) && mode === "range" ? current[1] : null;

  const blocked = (iso) => (min && iso < min) || (max && iso > max) || (typeof disabledDates === "function" ? !!disabledDates(iso) : !!disabledDates?.includes(iso));
  const go = (months) => { const at = new Date(Date.UTC(year, monthIndex + months, 1)); setShown(fromUtc(at).slice(0, 7)); };
  const reachable = (months) => {
    const first = fromUtc(new Date(Date.UTC(year, monthIndex + months, 1))), last = fromUtc(new Date(Date.UTC(year, monthIndex + months + 1, 0)));
    return !(max && first > max) && !(min && last < min);
  };
  const choose = (iso) => {
    if (iso.slice(0, 7) !== shown) setShown(iso.slice(0, 7));
    if (mode === "single") return set(iso, { complete: true });
    if (mode === "multiple") { const list = Array.isArray(current) ? current : []; return set(list.includes(iso) ? list.filter((day) => day !== iso) : [...list, iso].sort(), { complete: true }); }
    if (!start || end) return set([iso, null], { complete: false });
    return set(iso < start ? [iso, start] : [start, iso], { complete: true });
  };

  const first = toIso(year, monthIndex, 1), lead = (new Date(Date.UTC(year, monthIndex, 1)).getUTCDay() - firstDay + 7) % 7;
  const cell = theme.touch, disc = cell - 6;
  const day = (iso) => {
    const outside = iso.slice(0, 7) !== first.slice(0, 7), off = !!blocked(iso), isToday = iso === now;
    const isStart = mode === "range" && iso === start, isEnd = mode === "range" && iso === end, between = !!(start && end && iso > start && iso < end);
    const selected = mode === "single" ? iso === current : mode === "multiple" ? !!current?.includes(iso) : isStart || isEnd;
    const band = between || ((isStart || isEnd) && start && end && start !== end);
    return h(Pressable, { key: iso, testID: testID ? `${testID}-${iso}` : undefined, onPress: () => choose(iso), disabled: off, accessibilityRole: "button",
      accessibilityLabel: `${names.full(iso)}${isToday ? `, ${words.today}` : ""}`, accessibilityState: { selected: selected || between, disabled: off }, "aria-selected": selected || between, "aria-disabled": off,
      "aria-current": isToday ? "date" : undefined, style: { flex: 1, height: cell, alignItems: "center", justifyContent: "center" } },
      ({ pressed }) => [
        band ? h(View, { key: "band", style: { position: "absolute", top: 3, bottom: 3, left: isStart ? "50%" : 0, right: isEnd ? "50%" : 0, backgroundColor: c.accentSoft } }) : null,
        h(View, { key: "disc", style: { width: disc, height: disc, borderRadius: disc / 2, alignItems: "center", justifyContent: "center", borderWidth: isToday && !selected ? 1.5 : 0, borderColor: c.accent,
          backgroundColor: selected ? c.accent : pressed ? c.sunken : "transparent", opacity: off ? 0.35 : 1 } },
          h(Text, { size: "sm", weight: selected || isToday ? "bold" : "regular", style: { color: selected ? c.brandFg : outside || off ? c.muted : isToday ? c.accent : c.fg, opacity: outside && !selected ? 0.6 : 1, textDecorationLine: off && !outside ? "line-through" : "none" } }, String(+iso.slice(8)))),
      ]);
  };
  const weeks = Array.from({ length: 6 }, (_, week) => h(View, { key: week, style: { flexDirection: "row" } }, Array.from({ length: 7 }, (__, column) => day(addDays(first, week * 7 + column - lead)))));
  return h(View, { testID, style: flat({ gap: theme.space["2xs"] }, style) },
    h(View, { style: { flexDirection: "row", alignItems: "center" } },
      showYearNav ? h(IconButton, { glyph: "«", label: words.previousYear, onPress: () => go(-12), disabled: !reachable(-12), size: 36 }) : null,
      h(IconButton, { glyph: GLYPH.chevronLeft, label: words.previousMonth, onPress: () => go(-1), disabled: !reachable(-1), testID: testID ? `${testID}-prev` : undefined }),
      h(Text, { weight: "semibold", align: "center", numberOfLines: 1, accessibilityRole: "header", accessibilityLiveRegion: "polite", "aria-live": "polite", style: { flex: 1 } }, names.month(year, monthIndex)),
      h(IconButton, { glyph: GLYPH.chevronRight, label: words.nextMonth, onPress: () => go(1), disabled: !reachable(1), testID: testID ? `${testID}-next` : undefined }),
      showYearNav ? h(IconButton, { glyph: "»", label: words.nextYear, onPress: () => go(12), disabled: !reachable(12), size: 36 }) : null),
    h(View, { style: { flexDirection: "row" }, importantForAccessibility: "no-hide-descendants", "aria-hidden": true },
      Array.from({ length: 7 }, (_, column) => h(Text, { key: column, size: "xs", weight: "semibold", tone: "muted", align: "center", numberOfLines: 1, style: { flex: 1, paddingVertical: theme.space["2xs"] } }, names.weekdays[(firstDay + column) % 7]))),
    h(View, null, weeks));
}

// ---------------------------------------------------------------- date picker
const CalendarGlyph = ({ color }) => h(View, { style: { width: 18, height: 17, borderWidth: 1.5, borderColor: color, borderRadius: 4, overflow: "hidden" } }, h(View, { style: { height: 4, backgroundColor: color } }));
const DATE_LABELS = { clear: "Clear date", done: "Done", reset: "Clear", choose: "Choose a date", chooseRange: "Choose dates", start: "Start", end: "End" };

/**
 * A field that opens the Calendar in a Sheet (the phone's answer to the web kit's input with a popover).
 * mode "single": value is an ISO date or null and a tap on a day commits and closes.
 * mode "range": value is [start, end]; the sheet keeps a draft until Done.
 * format(iso) overrides the displayed text; otherwise it is formatted for `locale`. Calendar options
 * (min, max, disabledDates, firstDay, locale, showYearNav) pass through. open / onOpenChange control the sheet.
 */
export function DatePicker({ mode = "single", value, defaultValue, onChange, label, placeholder, hint, error, disabled = false, clearable = true, format, locale, min, max, disabledDates, firstDay, showYearNav, today, title, open, onOpenChange, labels, style, testID }) {
  const theme = useTheme(), c = theme.colors, isRange = mode === "range", words = { ...DATE_LABELS, ...labels };
  const [current, set] = useControlled(value, defaultValue ?? (isRange ? [null, null] : null), onChange);
  const [visible, setVisible] = useControlled(open, false, onOpenChange);
  const [draft, setDraft] = useState([null, null]);
  const show = (iso) => (format ? format(iso) : formatIso(iso, locale));
  const pair = isRange ? [current?.[0] ?? null, current?.[1] ?? null] : null;
  const shown = isRange ? (pair[0] ? `${show(pair[0])} – ${pair[1] ? show(pair[1]) : "…"}` : "") : current ? show(current) : "";
  const hasValue = isRange ? !!pair[0] : !!current;
  const openSheet = () => { if (isRange) setDraft(pair); setVisible(true); };
  const prompt = placeholder ?? (isRange ? words.chooseRange : words.choose);
  const shared = { min, max, disabledDates, firstDay, locale, showYearNav, today, testID: testID ? `${testID}-calendar` : undefined };
  return h(View, { style: flat({ gap: theme.space["2xs"] }, style) },
    label ? h(Text, { size: "sm", weight: "semibold", style: error ? { color: c.bad } : null }, label) : null,
    h(View, { style: { minHeight: theme.touch, flexDirection: "row", alignItems: "center", borderWidth: error ? 2 : 1, borderColor: error ? c.bad : c.line, borderRadius: theme.radius.s, backgroundColor: c.surface, opacity: disabled ? 0.5 : 1 } },
      h(Pressable, { testID, onPress: openSheet, disabled, accessibilityRole: "button", accessibilityLabel: [label, shown || prompt].filter(Boolean).join(", "), accessibilityState: { disabled, expanded: !!visible }, "aria-disabled": disabled, "aria-expanded": !!visible, "aria-haspopup": "dialog",
        style: ({ pressed }) => ({ flex: 1, minHeight: theme.touch - 2, flexDirection: "row", alignItems: "center", gap: theme.space.xs, paddingHorizontal: 12, borderRadius: theme.radius.s, backgroundColor: pressed ? c.sunken : "transparent" }) },
        h(CalendarGlyph, { color: c.muted }),
        h(Text, { numberOfLines: 1, tone: shown ? undefined : "muted", style: { flex: 1 } }, shown || prompt)),
      clearable && hasValue && !disabled ? h(IconButton, { glyph: GLYPH.close, label: words.clear, size: theme.touch - 4, color: c.muted, onPress: () => set(isRange ? [null, null] : null), testID: testID ? `${testID}-clear` : undefined }) : null),
    error || hint ? h(Text, { size: "xs", tone: error ? "bad" : "muted" }, error || hint) : null,
    h(Sheet, { visible: !!visible, onClose: () => setVisible(false), title: title ?? label ?? prompt },
      isRange
        ? h(Stack, { gap: "s" },
          h(Calendar, { ...shared, mode: "range", value: draft, onChange: setDraft }),
          h(Cluster, { justify: "space-between", wrap: false },
            h(Text, { size: "sm", tone: "muted", numberOfLines: 1, style: { flex: 1 } }, draft[0] ? `${show(draft[0])} – ${draft[1] ? show(draft[1]) : "…"}` : prompt),
            h(Button, { title: words.reset, variant: "ghost", disabled: !draft[0], onPress: () => setDraft([null, null]) }),
            h(Button, { title: words.done, disabled: !draft[0] || !draft[1], onPress: () => { set(draft); setVisible(false); }, testID: testID ? `${testID}-done` : undefined })))
        : h(Calendar, { ...shared, mode: "single", value: current, onChange: (iso) => { set(iso); setVisible(false); } })));
}

// ---------------------------------------------------------------- color picker
const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
const normalHex = (input) => { const m = HEX.exec(String(input ?? "").trim()); if (!m) return null; const body = m[1].length === 3 ? m[1].replace(/./g, "$&$&") : m[1]; return `#${body.toLowerCase()}`; };
function hexToHsl(hex) {
  const [r, g, b] = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16) / 255), hi = Math.max(r, g, b), lo = Math.min(r, g, b), l = (hi + lo) / 2, d = hi - lo;
  if (!d) return [0, 0, Math.round(l * 100)];
  const s = d / (1 - Math.abs(2 * l - 1)), hue = hi === r ? ((g - b) / d + 6) % 6 : hi === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [Math.round(hue * 60) % 360, Math.round(s * 100), Math.round(l * 100)];
}
function hslToHex(hue, s, l) {
  const sat = s / 100, light = l / 100, a = sat * Math.min(light, 1 - light);
  const channel = (n) => { const k = (n + hue / 30) % 12; return Math.round((light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255).toString(16).padStart(2, "0"); };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}
// The preset swatches are the kit's own hues at one lightness and chroma, computed with src/color.js.
const SWATCHES = [["Red", 25], ["Orange", 55], ["Amber", 85], ["Green", 150], ["Teal", 190], ["Blue", 255], ["Violet", 295], ["Pink", 345]].map(([label, hue]) => ({ label, value: oklch(0.62, 0.19, hue) }));
const STEPS = 36;
const ColorTrack = ({ colors, line }) => h(View, { style: { height: 14, borderRadius: 7, overflow: "hidden", flexDirection: "row", borderWidth: 1, borderColor: line } }, colors.map((color, index) => h(View, { key: index, style: { flex: 1, backgroundColor: color } })));

/**
 * Hue, saturation and lightness sliders, a hex field and preset swatches. value and onChange speak "#rrggbb".
 * The web kit leans on <input type="color">; React Native has no system colour picker, and no gradients in core,
 * so the tracks are drawn from colour steps. swatches: hex strings or { value, label } (pass [] for none);
 * sliders={false} leaves only the swatches and the hex field. onChangeEnd fires when a drag or an edit settles.
 */
export function ColorPicker({ value, defaultValue, onChange, onChangeEnd, swatches = SWATCHES, sliders = true, showInput = true, label, disabled = false, labels, style, testID }) {
  const theme = useTheme(), c = theme.colors, words = { hue: "Hue", saturation: "Saturation", lightness: "Lightness", hex: "Hex", swatches: "Presets", ...labels };
  const [raw, set] = useControlled(value, defaultValue ?? "#3b6fd9", onChange);
  const hex = normalHex(raw) ?? "#000000";
  // Hue and saturation are kept beside the hex, so they survive a trip through black, white or grey.
  const [kept, setKept] = useState(() => hexToHsl(hex)), hsl = hslToHex(...kept) === hex ? kept : hexToHsl(hex);
  const [draft, setDraft] = useState(null); // hex text while it is being typed
  const apply = (next) => { setKept(next); set(hslToHex(...next)); };
  const pick = (next) => { setKept(hexToHsl(next)); set(next); onChangeEnd?.(next); };
  const [hue, sat, light] = hsl;
  const scale = (make) => Array.from({ length: STEPS }, (_, index) => make(index / (STEPS - 1)));
  const rows = [
    { name: words.hue, max: 359, now: hue, unit: "°", colors: scale((t) => hslToHex(t * 359, 100, 50)), to: (v) => [v, sat, light] },
    { name: words.saturation, max: 100, now: sat, unit: "%", colors: scale((t) => hslToHex(hue, t * 100, Math.min(Math.max(light, 25), 75))), to: (v) => [hue, v, light] },
    { name: words.lightness, max: 100, now: light, unit: "%", colors: scale((t) => hslToHex(hue, sat, t * 100)), to: (v) => [hue, sat, v] },
  ];
  const list = (swatches || []).map((entry) => (typeof entry === "string" ? { value: entry, label: entry } : entry)).map((entry) => ({ ...entry, value: normalHex(entry.value) ?? entry.value }));
  return h(View, { testID, accessibilityLabel: label, style: flat({ gap: theme.space.s, opacity: disabled ? 0.5 : 1 }, style) },
    label ? h(Text, { size: "sm", weight: "semibold" }, label) : null,
    h(View, { style: { flexDirection: "row", alignItems: "center", gap: theme.space.xs } },
      h(View, { accessibilityRole: "image", accessibilityLabel: hex, style: { width: theme.touch, height: theme.touch, borderRadius: theme.radius.s, borderWidth: 1, borderColor: c.line, backgroundColor: hex } }),
      showInput ? h(TextField, { testID: testID ? `${testID}-hex` : undefined, accessibilityLabel: words.hex, value: draft ?? hex, editable: !disabled, autoCapitalize: "none", autoCorrect: false, maxLength: 7, placeholder: "#rrggbb", style: { flex: 1 },
        error: draft != null && !normalHex(draft) ? " " : undefined, inputStyle: { fontVariant: ["tabular-nums"] },
        onChangeText: (typed) => { setDraft(typed); const next = normalHex(typed); if (next && typed.replace("#", "").length === 6) { setKept(hexToHsl(next)); set(next); } },
        onBlur: () => { const next = normalHex(draft); setDraft(null); if (next) pick(next); } }) : h(Text, { weight: "medium", style: { flex: 1 } }, hex)),
    sliders ? rows.map((row) => h(View, { key: row.name },
      h(View, { style: { flexDirection: "row", justifyContent: "space-between" } }, h(Text, { size: "xs", weight: "semibold", tone: "muted" }, row.name), h(Text, { size: "xs", tone: "muted" }, `${row.now}${row.unit}`)),
      h(SliderCore, { label: row.name, min: 0, max: row.max, step: 1, value: row.now, disabled, formatValue: (v) => `${v}${row.unit}`, thumbColor: hex, track: h(ColorTrack, { colors: row.colors, line: c.line }),
        onChange: (v) => apply(row.to(v)), onChangeEnd: (v) => onChangeEnd?.(hslToHex(...row.to(v))), testID: testID ? `${testID}-${row.name.toLowerCase()}` : undefined }))) : null,
    list.length ? h(View, { accessibilityRole: "radiogroup", accessibilityLabel: words.swatches, style: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.xs } }, list.map((entry) => {
      const selected = entry.value === hex;
      return h(Pressable, { key: entry.value, onPress: () => pick(entry.value), disabled, hitSlop: 4, accessibilityRole: "radio", accessibilityLabel: entry.label, accessibilityState: { selected, checked: selected, disabled }, "aria-checked": selected, "aria-disabled": disabled,
        style: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: selected ? c.fg : "transparent" } },
        h(View, { style: { width: 26, height: 26, borderRadius: 13, backgroundColor: entry.value, borderWidth: 1, borderColor: c.line } }));
    })) : null);
}

// ---------------------------------------------------------------- file input
const UNITS = { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3 };
/** 2097152, "2MB" and "500 kb" are all sizes in bytes. */
const toBytes = (size) => { if (typeof size === "number") return size; const m = /^([\d.]+)\s*(b|kb|mb|gb)?$/i.exec(String(size ?? "").trim()); return m ? Math.round(+m[1] * UNITS[(m[2] ?? "b").toLowerCase()]) : undefined; };
const showBytes = (bytes) => { if (!(bytes >= 0)) return ""; if (bytes < 1024) return `${bytes} B`; const units = ["KB", "MB", "GB"]; let n = bytes / 1024, at = 0; while (n >= 1024 && at < 2) { n /= 1024; at++; } return `${n >= 100 || Number.isInteger(+n.toFixed(1)) ? Math.round(n) : n.toFixed(1)} ${units[at]}`; };
// Picker results differ by library: expo-document-picker says mimeType, expo-image-picker says fileName and fileSize.
const fileName = (file) => file?.name ?? file?.fileName ?? String(file?.uri ?? "").split("/").pop() ?? "";
const fileSize = (file) => file?.size ?? file?.fileSize;
const fileType = (file) => file?.type ?? file?.mimeType ?? "";
const extension = (name) => { const dot = String(name).lastIndexOf("."); return dot > 0 ? String(name).slice(dot + 1).toLowerCase() : ""; };
function accepts(file, accept) {
  const rules = (Array.isArray(accept) ? accept : String(accept ?? "").split(",")).map((rule) => rule.trim().toLowerCase()).filter(Boolean);
  if (!rules.length) return true;
  const type = fileType(file).toLowerCase(), ext = extension(fileName(file));
  return rules.some((rule) => (rule.startsWith(".") ? rule.slice(1) === ext : rule.endsWith("/*") ? type.startsWith(rule.slice(0, -1)) : rule === type));
}
const FILE_MESSAGES = {
  tooLarge: (name, limit) => `${name} is larger than ${limit}.`,
  tooMany: (limit) => `You can add up to ${limit} ${limit === 1 ? "file" : "files"}.`,
  wrongType: (name) => `${name} is not an accepted file type.`,
  failed: "The file could not be opened. Try again.",
};
const Problems = ({ list }) => (list.length ? h(View, { accessibilityRole: "alert", accessibilityLiveRegion: "polite", style: { gap: 2 } }, list.map((line, index) => h(Text, { key: index, size: "sm", tone: "bad" }, line))) : null);

/**
 * Choose files, see them listed, remove them. React Native core has no file picker, so the app supplies one:
 *
 *   onPick={async ({ multiple }) => {
 *     const result = await DocumentPicker.getDocumentAsync({ multiple });   // expo-document-picker
 *     return result.canceled ? null : result.assets;
 *   }}
 *
 * onPick resolves to a file, an array of files, or null when cancelled. A file is a plain object
 * { name, size?, uri?, type? } (mimeType, fileName and fileSize are read too). The component checks accept
 * (".pdf", "image/*", "application/pdf"), maxSize (bytes or "2MB") and maxFiles, keeps the accepted files in
 * value / onChange and reports the rest through onReject([{ file, reason, message }]) and an error line.
 */
export function FileInput({ value, defaultValue, onChange, onPick, onReject, multiple = false, maxFiles, maxSize, accept, label, hint, buttonLabel, error, disabled = false, messages, removeLabel = (name) => `Remove ${name}`, style, testID }) {
  const theme = useTheme(), c = theme.colors, say = { ...FILE_MESSAGES, ...messages };
  const [current, set] = useControlled(value, defaultValue ?? [], onChange), files = Array.isArray(current) ? current : current ? [current] : [];
  const [busy, setBusy] = useState(false), [problems, setProblems] = useState([]), alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const bytes = toBytes(maxSize), limit = multiple ? maxFiles ?? Infinity : 1, full = multiple && files.length >= limit;
  const off = disabled || busy || full || !onPick;

  const pick = async () => {
    if (off) return;
    setBusy(true); setProblems([]);
    try {
      const result = await onPick({ multiple, accept, maxFiles: multiple ? limit - files.length : 1 });
      if (!alive.current) return;
      const picked = result == null ? [] : Array.isArray(result) ? result : [result], accepted = [], rejected = [];
      let room = multiple ? limit - files.length : 1, overflow = false;
      for (const file of picked) {
        const name = fileName(file);
        if (!accepts(file, accept)) rejected.push({ file, reason: "type", message: say.wrongType(name) });
        else if (bytes != null && fileSize(file) > bytes) rejected.push({ file, reason: "size", message: say.tooLarge(name, showBytes(bytes)) });
        else if (room <= 0) { rejected.push({ file, reason: "count", message: say.tooMany(limit) }); overflow = true; }
        else { accepted.push(file); room--; }
      }
      if (accepted.length) set(multiple ? [...files, ...accepted] : accepted);
      if (rejected.length) { setProblems([...new Set(rejected.map((entry) => entry.message))]); onReject?.(rejected); }
      void overflow;
    } catch { if (alive.current) setProblems([say.failed]); } finally { if (alive.current) setBusy(false); }
  };
  const remove = (index) => { setProblems([]); set(files.filter((_, at) => at !== index)); };
  const auto = [multiple && Number.isFinite(limit) ? `Up to ${limit} files` : null, bytes != null ? `${showBytes(bytes)}${multiple ? " each" : " at most"}` : null].filter(Boolean).join(" · ");
  const prompt = buttonLabel ?? (multiple ? "Choose files" : files.length ? "Replace file" : "Choose a file"), note = hint ?? auto;
  return h(View, { testID, style: flat({ gap: theme.space.xs }, style) },
    label ? h(Text, { size: "sm", weight: "semibold" }, label) : null,
    h(Pressable, { testID: testID ? `${testID}-trigger` : undefined, onPress: pick, disabled: off, accessibilityRole: "button", accessibilityLabel: [label, prompt, note].filter(Boolean).join(", "), accessibilityState: { disabled: off, busy }, "aria-disabled": off, "aria-busy": busy,
      style: ({ pressed }) => ({ minHeight: 96, padding: theme.space.m, gap: theme.space["2xs"], alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderStyle: "dashed", borderColor: error || problems.length ? c.bad : c.line, borderRadius: theme.radius.m,
        backgroundColor: pressed ? c.accentSoft : c.sunken, opacity: disabled || full || !onPick ? 0.5 : 1 }) },
      busy ? h(Spinner, null) : h(View, { style: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: c.accentSoft } }, h(Text, { weight: "bold", tone: "accent" }, GLYPH.arrowUp)),
      h(Text, { weight: "semibold", align: "center" }, prompt),
      note ? h(Text, { size: "xs", tone: "muted", align: "center" }, note) : null),
    error ? h(Text, { size: "sm", tone: "bad", accessibilityRole: "alert" }, error) : null,
    h(Problems, { list: problems }),
    files.length ? h(View, { accessibilityRole: "list", style: { gap: theme.space["2xs"] } }, files.map((file, index) => {
      const name = fileName(file), size = fileSize(file);
      return h(View, { key: `${file.uri ?? name}:${index}`, style: { flexDirection: "row", alignItems: "center", gap: theme.space.xs, paddingLeft: theme.space.xs, borderWidth: 1, borderColor: c.line, borderRadius: theme.radius.s, backgroundColor: c.surface } },
        h(View, { style: { width: 36, height: 28, borderRadius: Math.min(6, theme.radius.s), alignItems: "center", justifyContent: "center", backgroundColor: c.accentSoft } }, h(Text, { size: "xs", weight: "bold", tone: "accent", numberOfLines: 1 }, (extension(name) || "file").slice(0, 4).toUpperCase())),
        h(View, { style: { flex: 1, paddingVertical: theme.space["2xs"] } }, h(Text, { size: "sm", weight: "medium", numberOfLines: 1, ellipsizeMode: "middle" }, name), size != null ? h(Text, { size: "xs", tone: "muted" }, showBytes(size)) : null),
        h(IconButton, { glyph: GLYPH.close, label: removeLabel(name), color: c.muted, disabled, onPress: () => remove(index), testID: testID ? `${testID}-remove-${index}` : undefined }));
    })) : null);
}

// ---------------------------------------------------------------- image input
// A person drawn with two shapes: the empty state of a round (avatar) preview.
const Silhouette = ({ size, color }) => h(View, { style: { width: size, height: size, alignItems: "center", overflow: "hidden" } },
  h(View, { style: { marginTop: size * 0.22, width: size * 0.34, height: size * 0.34, borderRadius: size, backgroundColor: color } }),
  h(View, { style: { marginTop: size * 0.07, width: size * 0.64, height: size * 0.64, borderRadius: size, backgroundColor: color } }));

/**
 * One image with a preview, a change button and a delete button. Like FileInput it leaves the system picker to
 * the app, because React Native core has none:
 *
 *   onPick={async () => {
 *     const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });   // expo-image-picker
 *     return result.canceled ? null : result.assets[0];
 *   }}
 *
 * value is { uri, name?, size?, width?, height? } (or just a uri string) or null. shape: "circle" for avatars,
 * "rounded" for covers; size is a number or { width, height }. maxSize (bytes or "2MB") rejects with an error.
 */
export function ImageInput({ value, defaultValue, onChange, onPick, onRemove, maxSize, shape = "circle", size = 80, label, hint, error, chooseLabel = "Choose image", changeLabel = "Change", removeLabel = "Delete", disabled = false, messages, style, testID }) {
  const theme = useTheme(), c = theme.colors, say = { ...FILE_MESSAGES, ...messages };
  const [current, set] = useControlled(value, defaultValue ?? null, onChange), image = typeof current === "string" ? { uri: current } : current;
  const [busy, setBusy] = useState(false), [problem, setProblem] = useState(null), alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const width = typeof size === "number" ? size : size.width, height = typeof size === "number" ? size : size.height, wide = width > 140;
  const radius = shape === "circle" ? Math.min(width, height) / 2 : theme.radius.m, bytes = toBytes(maxSize), off = disabled || busy || !onPick;
  const pick = async () => {
    if (off) return;
    setBusy(true); setProblem(null);
    try {
      const result = await onPick();
      if (!alive.current) return;
      const next = Array.isArray(result) ? result[0] : result;
      if (!next) return;
      const picked = typeof next === "string" ? { uri: next } : next;
      if (bytes != null && fileSize(picked) > bytes) setProblem(say.tooLarge(fileName(picked) || "The image", showBytes(bytes)));
      else set(picked);
    } catch { if (alive.current) setProblem(say.failed); } finally { if (alive.current) setBusy(false); }
  };
  const remove = () => { setProblem(null); set(null); onRemove?.(); };
  const detail = image ? [fileName(image), fileSize(image) != null ? showBytes(fileSize(image)) : null].filter(Boolean).join(" · ") : hint;
  const preview = h(Pressable, { onPress: pick, disabled: off, accessibilityRole: "button", accessibilityLabel: [label, image ? changeLabel : chooseLabel].filter(Boolean).join(", "), accessibilityState: { disabled: off, busy }, "aria-disabled": off, "aria-busy": busy,
    style: ({ pressed }) => ({ width: wide ? "100%" : width, maxWidth: width, height, borderRadius: radius, overflow: "hidden", alignItems: "center", justifyContent: "center", borderWidth: image ? 1 : 1.5, borderStyle: image ? "solid" : "dashed", borderColor: error || problem ? c.bad : c.line, backgroundColor: c.sunken, opacity: pressed ? 0.8 : 1 }) },
    image ? h(Image, { source: { uri: image.uri }, resizeMode: "cover", accessibilityLabel: `${label ?? "Image"} preview`, style: { width: "100%", height: "100%" } })
      : shape === "circle" ? h(Silhouette, { size: Math.min(width, height), color: c.line }) : h(Text, { size: "xl", tone: "muted" }, GLYPH.plus),
    busy ? h(View, { style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center", backgroundColor: c.overlay } }, h(Spinner, null)) : null);
  const controls = h(View, { style: { flexShrink: 1, gap: theme.space["2xs"] } },
    h(Cluster, null,
      h(Button, { title: image ? changeLabel : chooseLabel, variant: "soft", size: "s", disabled: off, onPress: pick, testID: testID ? `${testID}-change` : undefined }),
      image ? h(Button, { title: removeLabel, variant: "outline", size: "s", disabled: disabled || busy, onPress: remove, testID: testID ? `${testID}-remove` : undefined }) : null),
    detail ? h(Text, { size: "xs", tone: "muted", numberOfLines: 2 }, detail) : null,
    error || problem ? h(Text, { size: "sm", tone: "bad", accessibilityRole: "alert" }, error || problem) : null);
  return h(View, { testID, style: flat({ gap: theme.space.xs, opacity: disabled ? 0.5 : 1 }, style) },
    label ? h(Text, { size: "sm", weight: "semibold" }, label) : null,
    h(View, { style: wide ? { gap: theme.space.xs } : { flexDirection: "row", alignItems: "center", gap: theme.space.s } }, preview, controls));
}

// ---------------------------------------------------------------- repeater
let rowId = 0;
/**
 * Rows of repeated fields with add and remove. value is the array of row data; renderRow draws one row:
 *
 *   <Repeater value={phones} onChange={setPhones} createItem={() => ({ number: "" })} min={1} max={5}
 *     renderRow={({ item, update }) => <TextField value={item.number} onChangeText={(number) => update({ number })} />} />
 *
 * update(patch) merges into an object row (or replaces a primitive one). The remove button is disabled at min,
 * the add button at max. The web kit renumbers input names for the server; here the array is the form state.
 */
export function Repeater({ value, defaultValue, onChange, renderRow, createItem = () => ({}), min = 0, max = Infinity, addLabel = "Add row", removeLabel = (index) => `Remove row ${index + 1}`, onAdd, onRemove, disabled = false, gap = "xs", style, testID }) {
  const theme = useTheme();
  const [current, set] = useControlled(value, defaultValue ?? Array.from({ length: min }, (_, index) => createItem(index)), onChange), rows = Array.isArray(current) ? current : [];
  // Stable keys beside the data, so a field keeps its focus and state when a row above it is removed.
  const keys = useRef([]);
  while (keys.current.length < rows.length) keys.current.push(`row-${++rowId}`);
  keys.current.length = rows.length;
  const add = () => { if (rows.length >= max) return; const item = createItem(rows.length); set([...rows, item]); onAdd?.(item, rows.length); };
  const remove = (index) => { if (rows.length <= min) return; keys.current.splice(index, 1); set(rows.filter((_, at) => at !== index)); onRemove?.(rows[index], index); };
  const update = (index, patch) => set(rows.map((row, at) => (at !== index ? row : patch && typeof patch === "object" && !Array.isArray(patch) && row && typeof row === "object" ? { ...row, ...patch } : patch)));
  return h(View, { testID, style: flat({ gap: theme.space[gap] ?? gap }, style) },
    rows.map((item, index) => h(View, { key: keys.current[index], style: { flexDirection: "row", alignItems: "flex-end", gap: theme.space.xs } },
      h(View, { style: { flex: 1 } }, renderRow?.({ item, index, count: rows.length, update: (patch) => update(index, patch), remove: () => remove(index), canRemove: rows.length > min })),
      h(IconButton, { glyph: GLYPH.minus, label: removeLabel(index), bordered: true, disabled: disabled || rows.length <= min, onPress: () => remove(index), testID: testID ? `${testID}-remove-${index}` : undefined }))),
    h(Button, { title: addLabel, variant: "outline", icon: h(Text, { weight: "bold" }, GLYPH.plus), disabled: disabled || rows.length >= max, onPress: add, testID: testID ? `${testID}-add` : undefined }));
}

// ---------------------------------------------------------------- sortable
const Grip = ({ color }) => h(View, { style: { flexDirection: "row", gap: 3 } }, [0, 1].map((column) => h(View, { key: column, style: { gap: 3 } }, [0, 1, 2].map((dot) => h(View, { key: dot, style: { width: 4, height: 4, borderRadius: 2, backgroundColor: color } })))));
const reorder = (list, from, to) => { const next = list.slice(), [moved] = next.splice(from, 1); next.splice(to, 0, moved); return next; };

function SortableRow({ itemKey, label, index, count, active, shift, animate, dragY, settle, control, disabled, handle, children, onLayout }) {
  const theme = useTheme(), c = theme.colors, offset = useRef(new Animated.Value(0)).current, grip = useRef(null);
  // Neighbours slide out of the way while a row is dragged, and snap (unanimated) into the new order on drop.
  useLayoutEffect(() => {
    if (animate) Animated.timing(offset, { toValue: shift, duration: 140, useNativeDriver: false }).start();
    else { offset.stopAnimation(); offset.setValue(shift); }
  }, [shift, animate, offset]);
  // The dropped row glides from where the finger left it to its slot.
  useLayoutEffect(() => {
    if (!settle || settle.key !== itemKey) return;
    offset.setValue(settle.offset);
    Animated.timing(offset, { toValue: 0, duration: 160, useNativeDriver: false }).start();
  }, [settle, itemKey, offset]);
  useEffect(() => control.current.grips.set(itemKey, grip), [control, itemKey]);
  useEffect(() => () => { control.current.grips.delete(itemKey); }, [control, itemKey]);
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !control.current.disabled,
    onMoveShouldSetPanResponder: () => !control.current.disabled,
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
    onPanResponderGrant: () => control.current.start(itemKey),
    onPanResponderMove: (_event, gesture) => control.current.move(gesture.dy),
    onPanResponderRelease: () => control.current.end(),
    onPanResponderTerminate: () => control.current.end(),
  })).current;
  const actions = [index > 0 ? { name: "moveUp", label: "Move up" } : null, index < count - 1 ? { name: "moveDown", label: "Move down" } : null].filter(Boolean);
  const onKey = (event) => {
    const key = keyOf(event), by = { ArrowUp: -1, ArrowDown: 1, Home: -count, End: count }[key];
    if (!by) return;
    event.preventDefault?.(); control.current.step(itemKey, by);
  };
  const gripView = h(View, { ref: grip, key: "grip", ...pan.panHandlers, accessible: true, accessibilityRole: "button", accessibilityLabel: `Reorder ${label}, ${index + 1} of ${count}`,
    accessibilityHint: "Drag, or use the move up and move down actions", accessibilityState: { disabled, selected: active }, "aria-disabled": disabled, "aria-roledescription": "sortable item",
    accessibilityActions: actions, onAccessibilityAction: (event) => control.current.step(itemKey, event.nativeEvent.actionName === "moveUp" ? -1 : 1),
    ...(web ? { tabIndex: disabled ? -1 : 0, onKeyDown: onKey } : null),
    style: flat({ width: theme.touch, minHeight: theme.touch, alignSelf: "stretch", alignItems: "center", justifyContent: "center", opacity: disabled ? 0.35 : 1 }, web && { cursor: disabled ? "auto" : active ? "grabbing" : "grab", touchAction: "none", userSelect: "none" }) },
    h(Grip, { color: active ? c.accent : c.muted }));
  return h(Animated.View, { onLayout, style: flat({ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: active ? c.accent : c.line, borderRadius: theme.radius.m, backgroundColor: c.surface, zIndex: active ? 2 : 0,
    transform: [{ translateY: active ? dragY : offset }, { scale: active ? 1.02 : 1 }] }, active ? depth(theme.shadow.m) : null, web && active && { userSelect: "none" }) },
    handle === "start" ? gripView : null,
    h(View, { key: "body", style: { flex: 1, paddingVertical: theme.space.xs, paddingLeft: handle === "start" ? 0 : theme.space.s, paddingRight: handle === "start" ? theme.space.s : 0 } }, children),
    handle === "start" ? null : gripView);
}

/**
 * A list the user reorders. Drag a row by its grip (PanResponder), or — with a screen reader — use the grip's
 * "Move up" and "Move down" actions; on the web the grip also takes the arrow keys, Home and End.
 * value is the ordered array and onChange receives the new one. Items are strings or objects;
 * keyExtractor defaults to item.id ?? item.value ?? the item itself, getLabel names an item for assistive tech.
 * renderItem({ item, index, dragging }) draws the row's content; handle is "end" (default) or "start".
 */
export function Sortable({ value, defaultValue, onChange, renderItem, keyExtractor, getLabel, handle = "end", disabled = false, gap = "xs", label, style, testID }) {
  const theme = useTheme(), space = theme.space[gap] ?? gap;
  const [current, set] = useControlled(value, defaultValue ?? [], onChange), items = Array.isArray(current) ? current : [];
  const keyFor = keyExtractor ?? ((item) => String(item?.id ?? item?.value ?? item)), nameOf = getLabel ?? ((item) => String(item?.label ?? item?.title ?? item?.name ?? item?.id ?? item));
  const keys = items.map(keyFor);
  const [drag, setDrag] = useState(null), [settle, setSettle] = useState(null);
  const dragY = useRef(new Animated.Value(0)).current, layouts = useRef({}), state = useRef(null), refocus = useRef(null);
  const control = useRef({ grips: new Map() });
  const moved = (item, to) => announce(`${nameOf(item)}, moved to position ${to + 1} of ${items.length}`);
  Object.assign(control.current, {
    disabled,
    start(key) {
      const from = keys.indexOf(key);
      if (from < 0 || keys.some((each) => !layouts.current[each])) return;
      dragY.setValue(0); state.current = { key, from, to: from, dy: 0 }; setSettle(null); setDrag({ key, from, to: from });
    },
    move(dy) {
      const at = state.current; if (!at) return;
      const box = layouts.current, own = box[at.key], top = box[keys[0]], bottom = box[keys[keys.length - 1]];
      const y = clamp(dy, top.y - own.y, bottom.y + bottom.height - own.y - own.height);
      dragY.setValue(y); at.dy = y;
      let to = at.from;
      if (y > 0) for (let i = at.from + 1; i < keys.length; i++) { const other = box[keys[i]]; if (own.y + own.height + y > other.y + other.height / 2) to = i; else break; }
      else for (let i = at.from - 1; i >= 0; i--) { const other = box[keys[i]]; if (own.y + y < other.y + other.height / 2) to = i; else break; }
      if (to !== at.to) { at.to = to; setDrag({ key: at.key, from: at.from, to }); }
    },
    end() {
      const at = state.current; if (!at) return;
      state.current = null; setDrag(null);
      // How far the row's slot moved: the heights (and gaps) of the rows it jumped over.
      const box = layouts.current, lo = Math.min(at.from, at.to), hi = Math.max(at.from, at.to);
      let travel = 0; for (let i = lo; i <= hi; i++) if (i !== at.from) travel += box[keys[i]].height + space;
      setSettle({ key: at.key, offset: at.dy - (at.to > at.from ? travel : -travel) });
      dragY.setValue(0);
      if (at.to !== at.from) { set(reorder(items, at.from, at.to)); moved(items[at.from], at.to); }
    },
    step(key, by) {
      const from = keys.indexOf(key), to = clamp(from + by, 0, keys.length - 1);
      if (disabled || from < 0 || to === from) return;
      refocus.current = key; setSettle(null); set(reorder(items, from, to)); moved(items[from], to);
    },
  });
  // Moving a row with the keyboard reorders the DOM; keep the focus on the grip that was used.
  useEffect(() => { if (!refocus.current) return; control.current.grips.get(refocus.current)?.current?.focus?.(); refocus.current = null; });
  const own = drag ? layouts.current[drag.key] : null;
  return h(View, { testID, accessibilityRole: "list", accessibilityLabel: label, style: flat({ gap: space }, style) }, items.map((item, index) => {
    const key = keys[index], active = drag?.key === key;
    const shift = !drag || active || !own ? 0 : index > drag.from && index <= drag.to ? -(own.height + space) : index < drag.from && index >= drag.to ? own.height + space : 0;
    return h(SortableRow, { key, itemKey: key, label: nameOf(item), index, count: items.length, active, shift, animate: !!drag, dragY, settle, control, disabled, handle,
      onLayout: (event) => { const { y, height } = event.nativeEvent.layout; layouts.current[key] = { y, height }; } },
      renderItem ? renderItem({ item, index, dragging: active }) : h(Text, { weight: "medium", numberOfLines: 1 }, nameOf(item)));
  }));
}

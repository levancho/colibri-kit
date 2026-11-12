// Conversation pieces: chat bubbles and message rows, inline markers, activity traces, file attachments,
// a step-by-step questionnaire and charts drawn from plain Views.
//
// Honest scope (see ARCHITECTURE.md, rule 8):
//  - Message's copy action only reports onAction("copy"): React Native core has no clipboard, so the app copies.
//  - Attachment takes the file as props; picking one is the app's job (a system picker is a native module).
//  - Chart draws bars only (vertical, horizontal, stacked, sparkline, share). Line and pie charts need an SVG library.
import { createContext, createElement as h, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Image, Platform, Pressable, Text as NativeText, View } from "react-native";
import { useTheme } from "./provider.js";
import { toneName } from "./theme.js";
import { oklch } from "./color.js";
import { web, gapOf, flat, InRow, selfAlign, GLYPH } from "./internal.js";
import { Text, Button, Avatar, TextField, Spinner, Progress } from "./components.js";

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" });
// ARIA roles that React Native's accessibilityRole does not know (article, list, separator …) are only set on the web.
const webRole = (role) => (web ? { accessibilityRole: role } : null);
const toneColor = (theme, tone) => (tone === "muted" ? theme.colors.muted : theme.colors[toneName(tone)]);
const clamp01 = (value) => Math.min(1, Math.max(0, +value || 0));

// ---------------------------------------------------------------- bubble
const GroupAlign = createContext(null);
/** Consecutive bubbles from one sender, set close together. align: start (received) | end (sent). */
export function BubbleGroup({ align = "start", gap = "2xs", style, children, ...rest }) {
  const theme = useTheme();
  return h(GroupAlign.Provider, { value: align }, h(View, { style: flat({ gap: gapOf(theme, gap), alignItems: align === "end" ? "flex-end" : "flex-start" }, style), ...rest }, children));
}

/**
 * One message balloon. sent puts it on the trailing side in the accent colour; or choose variant
 * (primary | muted | outline | ghost) and align (start | end) yourself. status is a small line under it ("Delivered").
 * reactions: [{ value, label, count, active, accessibilityLabel }] are toggle buttons; onReact(value, on) reports a press.
 * collapsible clamps long text to `lines` lines with a Show more / Show less button.
 */
export function Bubble({ variant, sent = false, align, status, reactions, onReact, collapsible = false, lines = 4, style, textStyle, children, ...rest }) {
  const theme = useTheme(), c = theme.colors, group = useContext(GroupAlign);
  const kind = variant ?? (sent ? "primary" : "muted"), end = (align ?? group ?? (sent ? "end" : "start")) === "end";
  const [expanded, setExpanded] = useState(false), [toggled, setToggled] = useState({});
  const look = { primary: { bg: c.accent, fg: c.brandFg, border: "transparent" }, muted: { bg: c.sunken, fg: c.fg, border: "transparent" },
    outline: { bg: c.surface, fg: c.fg, border: c.line }, ghost: { bg: "transparent", fg: c.fg, border: "transparent" } }[kind] ?? { bg: c.sunken, fg: c.fg, border: "transparent" };
  const round = Math.min(18, Math.max(4, theme.radius.l)), ghost = kind === "ghost", isText = typeof children === "string" || typeof children === "number";
  const corner = end ? { borderBottomRightRadius: Math.min(round, theme.radius.s) } : { borderBottomLeftRadius: Math.min(round, theme.radius.s) };
  return h(View, { style: flat({ maxWidth: ghost ? "100%" : "86%", gap: theme.space["2xs"], alignSelf: end ? "flex-end" : "flex-start", alignItems: end ? "flex-end" : "flex-start" }, style), ...rest },
    h(View, { style: flat({ paddingVertical: ghost ? 0 : theme.space.xs, paddingHorizontal: ghost ? 0 : theme.space.s, gap: theme.space["2xs"], borderRadius: round, borderWidth: 1, borderColor: look.border, backgroundColor: look.bg }, !ghost && corner) },
      isText ? h(Text, { numberOfLines: collapsible && !expanded ? lines : undefined, style: flat({ color: look.fg }, textStyle) }, children) : children,
      collapsible ? h(Pressable, { onPress: () => setExpanded(!expanded), accessibilityRole: "button", accessibilityState: { expanded }, "aria-expanded": expanded, hitSlop: 12, style: { alignSelf: "flex-start" } },
        h(Text, { size: "sm", weight: "semibold", style: { color: kind === "primary" ? look.fg : c.accent, textDecorationLine: kind === "primary" ? "underline" : "none" } }, expanded ? "Show less" : "Show more")) : null),
    reactions?.length ? h(View, { style: { flexDirection: "row", flexWrap: "wrap", gap: theme.space["2xs"] } }, reactions.map((reaction) => {
      const on = toggled[reaction.value] ?? !!reaction.active, count = (+reaction.count || 0) + (on ? 1 : 0) - (reaction.active ? 1 : 0);
      return h(Pressable, { key: reaction.value, accessibilityRole: "button", accessibilityLabel: `${reaction.accessibilityLabel ?? reaction.value}, ${count}`, accessibilityState: { selected: on }, "aria-pressed": on, hitSlop: 8,
        onPress: () => { setToggled({ ...toggled, [reaction.value]: !on }); onReact?.(reaction.value, !on); },
        style: ({ pressed }) => ({ minHeight: 28, paddingHorizontal: theme.space.xs, flexDirection: "row", alignItems: "center", gap: theme.space["2xs"], borderRadius: theme.radius.full, borderWidth: 1,
          borderColor: on ? c.accent : c.line, backgroundColor: on ? c.accentSoft : pressed ? c.sunken : c.surface }) },
        h(Text, { size: "sm" }, reaction.label ?? reaction.value),
        h(Text, { size: "xs", weight: "semibold", tone: on ? "accent" : "muted", style: { fontVariant: ["tabular-nums"] } }, count));
    })) : null,
    status ? h(Text, { size: "xs", tone: "muted" }, status) : null);
}

// ---------------------------------------------------------------- message
function CopyIcon({ color }) {
  const sheet = { position: "absolute", width: 10, height: 12, borderRadius: 2.5, borderWidth: 1.5, borderColor: color };
  return h(View, { style: { width: 16, height: 16 } }, h(View, { style: { ...sheet, left: 1, top: 0 } }), h(View, { style: { ...sheet, left: 5, top: 4, backgroundColor: "transparent" } }));
}
const ACTION = { copy: { label: "Copy" }, like: { label: "Like", glyph: "👍", toggle: true }, dislike: { label: "Dislike", glyph: "👎", toggle: true }, retry: { label: "Try again", glyph: "↻" } };

/**
 * A whole turn in a conversation: avatar, author and time, the body and a row of actions.
 * from: "assistant" (leading side, with avatar) | "user" (trailing side, accent bubble). A string body becomes a Bubble
 * (variant overrides its look); anything else is rendered as given. grouped continues the previous message from the
 * same author: no avatar or header, just the body in line.
 * actions: "copy" | "like" | "dislike" | "retry" or { action, label, glyph }; onAction(action, { pressed }) reports a
 * press. Like and dislike are exclusive toggles. Copy only reports: the app writes to the clipboard.
 */
export function Message({ from = "assistant", author, time, avatar, grouped = false, variant, status, actions, onAction, style, children, ...rest }) {
  const theme = useTheme(), c = theme.colors, user = from === "user", [vote, setVote] = useState(null), [copied, setCopied] = useState(false), timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const face = avatar === undefined ? author : avatar, slot = 32;
  const body = typeof children === "string" || typeof children === "number" ? h(Bubble, { variant: variant ?? (user ? "primary" : "ghost"), align: user ? "end" : "start", status }, children) : children;
  const press = (item) => {
    if (item.action === "copy") { setCopied(true); clearTimeout(timer.current); timer.current = setTimeout(() => setCopied(false), 1600); }
    const pressed = item.toggle ? vote !== item.action : undefined;
    if (item.toggle) setVote(pressed ? item.action : null);
    onAction?.(item.action, { pressed });
  };
  const row = actions?.length ? h(View, { style: { flexDirection: "row", gap: theme.space["2xs"], marginLeft: user ? 0 : -6, marginRight: user ? -6 : 0 } }, actions.map((entry) => {
    const item = typeof entry === "string" ? { action: entry, ...ACTION[entry] } : { ...ACTION[entry.action], ...entry };
    const on = item.toggle ? vote === item.action : false, done = item.action === "copy" && copied, color = on ? c.accent : c.muted;
    return h(Pressable, { key: item.action, onPress: () => press(item), accessibilityRole: "button", accessibilityLabel: done ? "Copied" : item.label ?? item.action,
      ...(item.toggle ? { accessibilityState: { selected: on }, "aria-pressed": on } : null), hitSlop: 6,
      style: ({ pressed }) => ({ width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.s, backgroundColor: on ? c.accentSoft : pressed ? c.sunken : "transparent" }) },
      done ? h(NativeText, { style: { color: c.ok, fontSize: 15, fontWeight: "700" } }, GLYPH.check)
        : item.action === "copy" && !item.glyph ? h(CopyIcon, { color })
        : typeof item.glyph === "string" || !item.glyph ? h(NativeText, { style: { color, fontSize: 15, lineHeight: 20, opacity: item.toggle && !on ? 0.75 : 1 } }, item.glyph ?? GLYPH.dot) : item.glyph);
  })) : null;
  const header = !grouped && (author || time) ? h(View, { style: { flexDirection: "row", alignItems: "baseline", gap: theme.space.xs, justifyContent: user ? "flex-end" : "flex-start" } },
    author && !user ? h(Text, { size: "sm", weight: "semibold", numberOfLines: 1, style: { flexShrink: 1 } }, author) : null,
    time ? h(Text, { size: "xs", tone: "muted" }, time) : null) : null;
  const label = [author ?? (user ? "You" : null), time].filter(Boolean).join(", ") || undefined;
  if (user) return h(View, { ...webRole("article"), accessibilityLabel: label, style: flat({ alignItems: "flex-end", gap: theme.space["2xs"] }, style), ...rest }, header, body, row);
  return h(View, { ...webRole("article"), accessibilityLabel: label, style: flat({ flexDirection: "row", alignItems: "flex-start", gap: theme.space.xs }, style), ...rest },
    face === null || face === false ? null : h(View, { style: { width: slot, alignItems: "center" } }, grouped ? null : typeof face === "string" ? h(Avatar, { name: face, size: slot }) : face ?? null),
    h(View, { style: { flex: 1, gap: theme.space["2xs"], alignItems: "flex-start" } }, header, body, row));
}

// ---------------------------------------------------------------- marker
/**
 * A small inline line in a conversation. variant: plain (a muted note: "Explored 4 files") | row (the same in a
 * bordered row) | separator (a labelled divider: "Yesterday", "New messages"). icon is a glyph or an element;
 * loading shows a spinner; live announces the text when it changes ("Thinking…"); tone colours it.
 */
export function Marker({ variant = "plain", icon, loading = false, live = false, tone, style, children, ...rest }) {
  const theme = useTheme(), c = theme.colors, color = toneColor(theme, tone) ?? c.muted;
  const text = typeof children === "string" || typeof children === "number" ? h(Text, { size: variant === "separator" ? "xs" : "sm", weight: variant === "separator" ? "semibold" : "regular", style: { color, flexShrink: 1 } }, children) : children;
  if (variant === "separator") {
    const line = (key) => h(View, { key, style: { flex: 1, height: 1, backgroundColor: tone ? color : c.line, opacity: tone ? 0.5 : 1 } });
    return h(View, { ...webRole("separator"), accessibilityLabel: typeof children === "string" ? children : undefined, style: flat({ flexDirection: "row", alignItems: "center", gap: theme.space.s, alignSelf: "stretch", paddingVertical: theme.space["2xs"] }, style), ...rest }, line("a"), text, line("b"));
  }
  const lead = loading ? h(Spinner, { tone: tone ?? "accent", style: { transform: [{ scale: 0.75 }] } }) : typeof icon === "string" ? h(NativeText, { style: { color, fontSize: theme.text.sm, lineHeight: 20, width: 16, textAlign: "center", fontWeight: "700" } }, icon) : icon;
  const box = variant === "row" ? { alignSelf: "stretch", minHeight: 40, paddingVertical: theme.space.xs, paddingHorizontal: theme.space.s, borderWidth: 1, borderColor: c.line, borderRadius: theme.radius.m, backgroundColor: c.surface } : { alignSelf: "flex-start" };
  return h(View, { ...(live ? { ...webRole("status"), accessibilityLiveRegion: "polite", "aria-live": "polite" } : null), style: flat({ flexDirection: "row", alignItems: "center", gap: theme.space.xs }, box, style), ...rest }, lead, text);
}

// ---------------------------------------------------------------- trace
const formatDuration = (ms) => (typeof ms !== "number" ? ms : ms < 1000 ? `${Math.round(ms)} ms` : ms < 60000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.floor(ms / 60000)}m ${String(Math.round((ms % 60000) / 1000)).padStart(2, "0")}s`);
const STATUS_WORD = { done: "done", running: "in progress", error: "failed", pending: "not started" };

/**
 * One line of a Trace. status: done | running | error | pending sets the glyph (glyph replaces the tick of a done step).
 * duration is a string or a number of milliseconds. detail (a string, shown in a code box, or any element; children
 * work too) makes the line a button that opens and closes it: open + onOpenChange, or defaultOpen.
 */
export function TraceStep({ title, status = "done", duration, glyph, detail, open, defaultOpen = false, onOpenChange, style, children }) {
  const theme = useTheme(), c = theme.colors, [own, setOwn] = useState(defaultOpen), shown = open ?? own, more = detail ?? children, has = more != null && more !== false;
  const mark = status === "running" ? h(Spinner, { style: { transform: [{ scale: 0.7 }] } })
    : status === "pending" ? h(View, { style: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: c.muted } })
    : h(NativeText, { style: { color: status === "error" ? c.bad : glyph ? c.muted : c.ok, fontSize: theme.text.sm, lineHeight: 20, fontWeight: "700" } }, status === "error" ? GLYPH.close : glyph ?? GLYPH.check);
  const line = [h(View, { key: "m", style: { width: 20, height: 20, alignItems: "center", justifyContent: "center" } }, mark),
    typeof title === "string" ? h(Text, { key: "t", size: "sm", tone: status === "running" || status === "pending" ? "muted" : status === "error" ? "bad" : undefined, style: { flex: 1 } }, title) : h(View, { key: "t", style: { flex: 1 } }, title),
    duration != null ? h(Text, { key: "d", size: "xs", tone: "muted", style: { fontVariant: ["tabular-nums"] } }, formatDuration(duration)) : null,
    // The chevron slot is always there, so durations line up whether or not a line opens.
    h(NativeText, { key: "c", style: { color: c.muted, fontSize: theme.text.md, lineHeight: 20, width: 12, textAlign: "center", transform: [{ rotate: shown ? "90deg" : "0deg" }] } }, has ? GLYPH.chevronRight : "")];
  const row = { minHeight: 36, paddingVertical: theme.space["2xs"], flexDirection: "row", alignItems: "center", gap: theme.space.xs };
  const label = `${typeof title === "string" ? title : "Step"}, ${STATUS_WORD[status] ?? status}${duration != null ? `, ${formatDuration(duration)}` : ""}`;
  return h(View, { ...webRole("listitem"), style }, has
    ? h(Pressable, { onPress: () => { setOwn(!shown); onOpenChange?.(!shown); }, accessibilityRole: "button", accessibilityLabel: label, accessibilityState: { expanded: shown }, "aria-expanded": shown, hitSlop: { top: 4, bottom: 4 },
      style: ({ pressed }) => flat(row, { marginHorizontal: -theme.space["2xs"], paddingHorizontal: theme.space["2xs"], borderRadius: theme.radius.s }, pressed && { backgroundColor: c.sunken }) }, line)
    : h(View, { accessible: true, accessibilityLabel: label, style: row }, line),
  has && shown ? h(View, { style: { marginLeft: 20 + theme.space.xs, marginBottom: theme.space.xs } }, typeof more === "string"
    ? h(View, { style: { padding: theme.space.xs, borderRadius: theme.radius.s, backgroundColor: c.sunken } }, h(NativeText, { selectable: true, style: { color: c.fg, fontFamily: MONO, fontSize: theme.text.xs, lineHeight: 18 } }, more))
    : more) : null);
}

/**
 * A compact list of the steps something took. steps: [{ id, title, status, duration, detail, glyph, defaultOpen }],
 * or compose TraceStep children yourself.
 */
export function Trace({ steps, style, children, ...rest }) {
  return h(View, { ...webRole("list"), style, ...rest }, steps?.map((step, index) => h(TraceStep, { key: step.id ?? index, ...step, id: undefined })), children);
}

// ---------------------------------------------------------------- attachment
const formatBytes = (bytes) => {
  if (typeof bytes !== "number") return bytes;
  const units = ["B", "KB", "MB", "GB", "TB"], power = bytes > 0 ? Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024))) : 0, amount = bytes / 1024 ** power;
  return `${amount >= 10 || power === 0 ? Math.round(amount) : amount.toFixed(1)} ${units[power]}`;
};
const extension = (name) => (/\.([a-z0-9]{1,5})$/i.exec(String(name ?? ""))?.[1] ?? "").toUpperCase();

/**
 * A file attached to a message or a form. size is bytes (formatted for you) or a string; type defaults to the
 * extension of name and is drawn as the type glyph. progress (0 to 1) shows an upload bar; error (a string) shows the
 * failed state. source (an Image source) shows a thumbnail instead of the glyph, and variant="image" makes the whole
 * attachment a square picture tile. onRemove adds a remove button; onPress makes the attachment itself a button.
 */
export function Attachment({ name, size, type, source, variant = "chip", progress, error, onRemove, onPress, block = false, style, ...rest }) {
  const theme = useTheme(), c = theme.colors, inRow = useContext(InRow), kind = (type ?? extension(name)).toString().toUpperCase().slice(0, 4);
  const uploading = progress != null && progress < 1 && !error, percent = Math.round(clamp01(progress) * 100);
  const detail = error || (uploading ? `Uploading… ${percent}%` : [kind, formatBytes(size)].filter((part) => part != null && part !== "").join(" · "));
  const label = [name, detail].filter(Boolean).join(", ");
  const remove = (extra) => onRemove ? h(Pressable, { onPress: () => onRemove(name), accessibilityRole: "button", accessibilityLabel: `Remove ${name ?? "attachment"}`, hitSlop: 10,
    style: ({ pressed }) => flat({ width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? c.line : c.sunken }, extra) },
    h(NativeText, { style: { color: c.fg, fontSize: 16, lineHeight: 18, fontWeight: "600" } }, GLYPH.close)) : null;
  const Root = onPress ? Pressable : View, rootProps = onPress ? { onPress, accessibilityRole: "button", accessibilityLabel: label } : { ...webRole("group"), accessibilityLabel: label };
  if (variant === "image") {
    const side = 96;
    return h(View, { style: flat({ width: side, height: side }, selfAlign(inRow), style), ...rest },
      h(Root, { ...rootProps, style: { width: side, height: side, borderRadius: theme.radius.m, overflow: "hidden", borderWidth: 1, borderColor: error ? c.bad : c.line, backgroundColor: c.sunken, alignItems: "center", justifyContent: "center" } },
        source ? h(Image, { source, accessibilityLabel: name, resizeMode: "cover", style: { width: "100%", height: "100%", opacity: uploading ? 0.5 : 1 } }) : h(Text, { size: "xs", weight: "bold", tone: "muted" }, kind || "FILE"),
        error ? h(View, { style: { position: "absolute", left: 0, right: 0, bottom: 0, padding: theme.space["2xs"], backgroundColor: c.surface } }, h(Text, { size: "xs", tone: "bad", numberOfLines: 2 }, error)) : null,
        uploading ? h(Progress, { value: progress, style: { position: "absolute", left: theme.space.xs, right: theme.space.xs, bottom: theme.space.xs, height: 4, backgroundColor: c.surface } }) : null),
      remove({ position: "absolute", top: -6, right: -6, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface }));
  }
  // The remove button sits beside the pressable part, not inside it: a button must not contain another button.
  return h(View, { ...(onPress ? null : rootProps), style: flat({ minWidth: 200, maxWidth: "100%", flexShrink: 1, minHeight: 56, paddingRight: onRemove ? theme.space.s : 0, flexDirection: "row", alignItems: "center", gap: theme.space.xs,
    borderWidth: 1, borderColor: error ? c.bad : c.line, borderRadius: theme.radius.m, backgroundColor: c.surface }, block ? { alignSelf: "stretch" } : selfAlign(inRow), style), ...rest },
    h(Root, { ...(onPress ? rootProps : null), style: { flex: 1, padding: theme.space.xs, paddingRight: onRemove ? 0 : theme.space.s, flexDirection: "row", alignItems: "center", gap: theme.space.s } },
      source ? h(Image, { source, resizeMode: "cover", style: { width: 40, height: 40, borderRadius: theme.radius.s, backgroundColor: c.sunken } })
        : h(View, { style: { width: 40, height: 40, borderRadius: theme.radius.s, alignItems: "center", justifyContent: "center", backgroundColor: error ? theme.tones.bad.soft : c.accentSoft } },
          h(NativeText, { numberOfLines: 1, style: { color: error ? c.bad : c.accent, fontSize: error ? 16 : 10, fontWeight: "800", letterSpacing: error ? 0 : 0.3 } }, error ? GLYPH.warn : kind || "FILE")),
      h(View, { style: { flex: 1, gap: 2 } },
        h(Text, { size: "sm", weight: "medium", numberOfLines: 1, ellipsizeMode: "middle" }, name),
        detail ? h(Text, { size: "xs", tone: error ? "bad" : "muted", numberOfLines: 1 }, detail) : null,
        uploading ? h(Progress, { value: progress, style: { height: 4, marginTop: 2 } }) : null)),
    remove());
}

// ---------------------------------------------------------------- questionnaire
const emptyAnswer = (value) => value == null || (Array.isArray(value) ? value.length === 0 : String(value).trim() === "");
const REQUIRED = { single: "Choose an option to continue.", multiple: "Choose at least one option.", text: "Write an answer to continue." };

/**
 * Asks one question at a time, with Back, Skip, Next and a progress bar.
 * questions: [{ name, type: "single" | "multiple" | "text", title, description, options: [{ value, label, description }],
 * required, skippable, placeholder, error }]. A required question shows an inline error until it is answered; a
 * skippable one gets a Skip button that clears its answer. onStep(index, total) follows the steps, onChange(answers)
 * every edit, and onSubmit(answers) receives { [name]: value | value[] } at the end. summary(answers) replaces the
 * closing screen.
 */
export function Questionnaire({ questions = [], defaultAnswers, onChange, onStep, onSubmit, submitLabel = "Submit", summary, style, ...rest }) {
  const theme = useTheme(), c = theme.colors, total = questions.length;
  const [index, setIndex] = useState(0), [answers, setAnswers] = useState(defaultAnswers ?? {}), [error, setError] = useState(null), [done, setDone] = useState(false);
  const question = questions[Math.min(index, total - 1)];
  if (!question) return null;
  const value = answers[question.name], last = index >= total - 1;
  const set = (next) => { const all = { ...answers, [question.name]: next }; setAnswers(all); setError(null); onChange?.(all); return all; };
  const go = (to) => { setError(null); setIndex(to); onStep?.(to, total); };
  const finish = (all) => { setDone(true); onSubmit?.(all); };
  const next = () => {
    if (question.required && emptyAnswer(value)) { setError(question.error ?? REQUIRED[question.type] ?? REQUIRED.single); return; }
    if (last) finish(answers); else go(index + 1);
  };
  const skip = () => { const all = set(undefined); if (last) finish(all); else go(index + 1); };
  const wording = (name, answer) => {
    const asked = questions.find((entry) => entry.name === name), one = (item) => asked?.options?.find((option) => option.value === item)?.label ?? String(item);
    return emptyAnswer(answer) ? "Skipped" : Array.isArray(answer) ? answer.map(one).join(", ") : one(answer);
  };
  if (done) {
    return h(View, { accessibilityLiveRegion: "polite", style: flat({ gap: theme.space.s }, style), ...rest },
      summary ? summary(answers) : [
        h(View, { key: "h", style: { flexDirection: "row", alignItems: "center", gap: theme.space.xs } },
          h(View, { style: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: theme.tones.ok.soft } }, h(NativeText, { style: { color: c.ok, fontSize: 13, fontWeight: "800" } }, GLYPH.check)),
          h(Text, { weight: "semibold" }, "Thanks, that is everything.")),
        h(View, { key: "a", style: { gap: theme.space.xs, padding: theme.space.s, borderRadius: theme.radius.m, backgroundColor: c.sunken } }, questions.map((entry) =>
          h(View, { key: entry.name, style: { gap: 1 } }, h(Text, { size: "xs", tone: "muted" }, entry.title), h(Text, { size: "sm", weight: "medium", tone: emptyAnswer(answers[entry.name]) ? "muted" : undefined }, wording(entry.name, answers[entry.name]))))),
      ],
      h(Button, { title: "Change answers", variant: "ghost", size: "s", onPress: () => { setDone(false); go(0); } }));
  }
  const multiple = question.type === "multiple", picked = multiple ? (Array.isArray(value) ? value : []) : value;
  const choose = (option) => set(multiple ? (picked.includes(option) ? picked.filter((item) => item !== option) : [...picked, option]) : option);
  const choices = question.type === "text"
    ? h(TextField, { accessibilityLabel: question.title, placeholder: question.placeholder, value: value ?? "", onChangeText: (text) => set(text), multiline: true, error: error ?? undefined, "aria-invalid": !!error,
      inputStyle: { minHeight: 96, textAlignVertical: "top", paddingTop: theme.space.xs } })
    : h(View, { accessibilityRole: multiple ? undefined : "radiogroup", accessibilityLabel: question.title, style: { gap: theme.space.xs } }, (question.options ?? []).map((option) => {
      const on = multiple ? picked.includes(option.value) : picked === option.value;
      return h(Pressable, { key: String(option.value), onPress: () => choose(option.value), accessibilityRole: multiple ? "checkbox" : "radio", accessibilityLabel: option.description ? `${option.label}, ${option.description}` : option.label,
        accessibilityState: { checked: on, selected: on }, "aria-checked": on,
        style: ({ pressed }) => ({ minHeight: theme.touch + 4, paddingVertical: theme.space.xs, paddingHorizontal: theme.space.s, flexDirection: "row", alignItems: "center", gap: theme.space.s, borderRadius: theme.radius.m, borderWidth: 1.5,
          borderColor: on ? c.accent : c.line, backgroundColor: on ? c.accentSoft : pressed ? c.sunken : c.surface }) },
        h(View, { style: { width: 20, height: 20, borderRadius: multiple ? Math.min(5, theme.radius.s) : 10, borderWidth: 2, borderColor: on ? c.accent : c.muted, backgroundColor: on && multiple ? c.accent : "transparent", alignItems: "center", justifyContent: "center" } },
          on ? (multiple ? h(NativeText, { style: { color: c.brandFg, fontSize: 12, lineHeight: 14, fontWeight: "800" } }, GLYPH.check) : h(View, { style: { width: 9, height: 9, borderRadius: 5, backgroundColor: c.accent } })) : null),
        h(View, { style: { flex: 1 } }, h(Text, { weight: "medium" }, option.label), option.description ? h(Text, { size: "sm", tone: "muted" }, option.description) : null));
    }));
  return h(View, { style: flat({ gap: theme.space.m }, style), ...rest },
    h(View, { style: { gap: theme.space["2xs"] } },
      h(Text, { size: "xs", tone: "muted", weight: "medium" }, `Question ${index + 1} of ${total}`),
      h(Progress, { value: (index + 1) / total, style: { height: 4 } })),
    h(View, { style: { gap: theme.space["2xs"] } },
      h(Text, { size: "lg", weight: "semibold", accessibilityRole: "header" }, question.title, question.required ? h(Text, { size: "lg", tone: "bad", accessibilityLabel: "required" }, " *") : null),
      question.description ? h(Text, { size: "sm", tone: "muted" }, question.description) : null),
    choices,
    error && question.type !== "text" ? h(Text, { size: "sm", tone: "bad", accessibilityRole: "alert", accessibilityLiveRegion: "assertive" }, error) : null,
    h(View, { style: { flexDirection: "row", alignItems: "center", gap: theme.space.xs } },
      index > 0 ? h(Button, { title: "Back", variant: "ghost", onPress: () => go(index - 1) }) : null,
      h(View, { style: { flex: 1 } }),
      question.skippable ? h(Button, { title: "Skip", variant: "outline", onPress: skip }) : null,
      h(Button, { title: last ? submitLabel : "Next", onPress: next })));
}

// ---------------------------------------------------------------- chart
// Series colours: the accent, then four companions derived from the theme hue and scheme (the web kit's --ui-chart-1..5).
const CHART_STEPS = [[0, 0, 0], [150, 0.64, 0.62], [60, 0.56, 0.8], [215, 0.42, 0.52], [300, 0.7, 0.86]];
const chartColors = (theme) => CHART_STEPS.map(([turn, light, dark], index) => (index === 0 ? theme.colors.accent : oklch(theme.scheme === "dark" ? dark : light, Math.min(theme.chroma, 0.17) * 0.85, (theme.hue + turn) % 360)));
const niceMax = (value) => {
  if (!(value > 0)) return 1;
  const power = 10 ** Math.floor(Math.log10(value)), lead = value / power;
  return (lead <= 1 ? 1 : lead <= 2 ? 2 : lead <= 2.5 ? 2.5 : lead <= 5 ? 5 : 10) * power;
};
const plain = (value) => (Math.abs(value) >= 1e6 ? `${+(value / 1e6).toFixed(1)}M` : Math.abs(value) >= 1e4 ? `${+(value / 1e3).toFixed(1)}k` : Number.isInteger(value) ? String(value) : value.toFixed(1));
const amount = (value) => Math.max(0, Number.isFinite(+value) ? +value : 0);
const CHART_WORD = { bar: "Bar chart", horizontal: "Horizontal bar chart", stacked: "Stacked bar chart", sparkline: "Sparkline", share: "Share bar" };

/** The key of a chart: a wrapping row of colour swatches and names. items: [{ label, color, value }]. */
export function ChartLegend({ items = [], style }) {
  const theme = useTheme();
  return h(View, { style: flat({ flexDirection: "row", flexWrap: "wrap", columnGap: theme.space.m, rowGap: theme.space["2xs"] }, style) }, items.map((item, index) =>
    h(View, { key: index, style: { flexDirection: "row", alignItems: "center", gap: theme.space["2xs"] + 2 } },
      h(View, { style: { width: 10, height: 10, borderRadius: 3, backgroundColor: item.color } }),
      h(Text, { size: "xs", tone: "muted" }, item.label),
      item.value != null ? h(Text, { size: "xs", weight: "semibold", style: { fontVariant: ["tabular-nums"] } }, item.value) : null)));
}

/**
 * Charts drawn from plain Views (no SVG): type "bar" (vertical, grouped when there are several series) | "horizontal" |
 * "stacked" | "sparkline" (thin bars, no axes) | "share" (one segmented bar of parts of a whole).
 * Line and pie charts are not offered: they need an SVG library.
 *
 * Data is either data: [{ label, value, tone }] or labels: string[] with series: [{ name, values, tone }].
 * tone (accent | ok | warn | bad | muted) overrides the automatic series colour. title, height (of the plot),
 * showValues, showLegend, formatValue(value) and emptyText tune it. Negative values are drawn as zero.
 * The chart is one image for screen readers: its accessibilityLabel is a summary of the numbers, unless you pass one.
 */
export function Chart({ type = "bar", data, labels, series, title, height, showValues, showLegend, formatValue = plain, tone, labelWidth = 84, emptyText = "No data yet", accessibilityLabel, style, ...rest }) {
  const theme = useTheme(), c = theme.colors, palette = useMemo(() => chartColors(theme), [theme]);
  const model = useMemo(() => {
    if (series?.length) {
      const count = Math.max(0, ...series.map((entry) => entry.values?.length ?? 0));
      return { labels: Array.from({ length: count }, (_, i) => String(labels?.[i] ?? i + 1)), tones: [], series: series.map((entry) => ({ name: entry.name, tone: entry.tone, values: Array.from({ length: count }, (_, i) => amount(entry.values?.[i])) })) };
    }
    const rows = data ?? [];
    return { labels: rows.map((row, i) => String(row.label ?? i + 1)), tones: rows.map((row) => row.tone), series: rows.length ? [{ name: undefined, tone, values: rows.map((row) => amount(row.value)) }] : [] };
  }, [data, labels, series, tone]);
  const many = model.series.length > 1, single = model.series[0]?.values ?? [], count = model.labels.length;
  const seriesColor = (index) => toneColor(theme, model.series[index]?.tone) ?? palette[index % palette.length];
  const pointColor = (index) => toneColor(theme, model.tones[index]) ?? seriesColor(0); // one series: a bar may carry its own tone
  const partColor = (index) => toneColor(theme, model.tones[index]) ?? palette[index % palette.length]; // share: every part differs
  const totals = model.labels.map((_, i) => model.series.reduce((sum, entry) => sum + entry.values[i], 0));
  const peak = Math.max(0, ...(type === "stacked" ? totals : model.series.flatMap((entry) => entry.values)));
  const empty = !count || peak <= 0;
  const summary = accessibilityLabel ?? (() => {
    const head = `${title ? `${title}. ` : ""}${CHART_WORD[type] ?? CHART_WORD.bar}`;
    if (empty) return `${head}. ${emptyText}.`;
    if (type === "sparkline") return `${head}, ${count} values from ${formatValue(single[0])} to ${formatValue(single[count - 1])}, lowest ${formatValue(Math.min(...single))}, highest ${formatValue(Math.max(...single))}.`;
    const whole = totals.reduce((sum, value) => sum + value, 0);
    const rows = model.labels.slice(0, 12).map((label, i) => `${label}: ${many ? model.series.map((entry) => `${entry.name ?? "value"} ${formatValue(entry.values[i])}`).join(", ")
      : `${formatValue(single[i])}${type === "share" ? ` (${Math.round((single[i] / whole) * 100)}%)` : ""}`}`);
    return `${head}. ${rows.join("; ")}${count > 12 ? `; and ${count - 12} more` : ""}.`;
  })();
  const legendItems = many ? model.series.map((entry, index) => ({ label: entry.name ?? `Series ${index + 1}`, color: seriesColor(index) })) : [];
  const heading = title ? h(Text, { key: "title", size: "sm", weight: "semibold" }, title) : null;
  const legend = (showLegend ?? many) && legendItems.length ? h(ChartLegend, { key: "legend", items: legendItems }) : null;
  const root = (...children) => h(View, { accessible: true, accessibilityRole: "image", accessibilityLabel: summary, style: flat({ gap: theme.space.xs }, type === "sparkline" ? null : { alignSelf: "stretch" }, style), ...rest }, ...children);
  const small = { fontSize: theme.text.xs, lineHeight: 16, color: c.muted, fontVariant: ["tabular-nums"] };

  if (type === "sparkline") {
    const tall = height ?? 32, color = toneColor(theme, tone) ?? c.accent;
    if (empty) return root(h(View, { style: { height: tall, minWidth: 64, justifyContent: "flex-end" } }, h(View, { style: { height: 2, borderRadius: 1, backgroundColor: c.line } })));
    return root(h(View, { style: { height: tall, minWidth: count * 5, flexDirection: "row", alignItems: "flex-end", gap: 2 } }, single.map((value, i) =>
      h(View, { key: i, style: { flex: 1, minWidth: 3, height: Math.max(2, Math.round((value / peak) * tall)), borderRadius: 1.5, backgroundColor: color, opacity: i === count - 1 ? 1 : 0.4 } }))));
  }
  if (empty) {
    return root(heading, h(View, { key: "empty", style: { height: type === "share" ? 64 : height ?? 160, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.m, borderWidth: 1, borderStyle: "dashed", borderColor: c.line, backgroundColor: c.sunken } },
      h(Text, { size: "sm", tone: "muted" }, emptyText)));
  }
  if (type === "share") {
    const whole = totals.reduce((sum, value) => sum + value, 0);
    return root(heading,
      h(View, { key: "bar", style: { height: height ?? 14, flexDirection: "row", gap: 2, borderRadius: theme.radius.full, overflow: "hidden" } }, single.map((value, i) => (value > 0 ? h(View, { key: i, style: { flex: value, backgroundColor: partColor(i) } }) : null))),
      showLegend === false ? null : h(View, { key: "legend", style: { gap: theme.space["2xs"], marginTop: theme.space["2xs"] } }, model.labels.map((label, i) =>
        h(View, { key: i, style: { flexDirection: "row", alignItems: "center", gap: theme.space.xs } },
          h(View, { style: { width: 10, height: 10, borderRadius: 3, backgroundColor: partColor(i) } }),
          h(Text, { size: "sm", numberOfLines: 1, style: { flex: 1 } }, label),
          showValues === false ? null : h(Text, { size: "sm", tone: "muted", style: { fontVariant: ["tabular-nums"] } }, formatValue(single[i])),
          h(Text, { size: "sm", weight: "semibold", align: "right", style: { width: 44, fontVariant: ["tabular-nums"] } }, `${Math.round((single[i] / whole) * 100)}%`)))));
  }
  if (type === "horizontal") {
    const thick = many ? 10 : 18, texts = model.series.flatMap((entry) => entry.values.map(formatValue)), valueWidth = Math.max(...texts.map((text) => text.length)) * 7.5 + 4;
    return root(heading,
      h(View, { key: "rows", style: { gap: many ? theme.space.s : theme.space.xs } }, model.labels.map((label, i) =>
        h(View, { key: i, style: { flexDirection: "row", alignItems: "center", gap: theme.space.xs } },
          h(Text, { size: "sm", numberOfLines: 1, style: { width: labelWidth } }, label),
          h(View, { style: { flex: 1, gap: 3 } }, model.series.map((entry, s) =>
            h(View, { key: s, style: { flexDirection: "row", alignItems: "center", gap: theme.space["2xs"] + 2 } },
              h(View, { style: { flex: 1, height: thick, borderRadius: Math.min(4, theme.radius.s), backgroundColor: c.sunken } },
                h(View, { style: { width: `${(entry.values[i] / peak) * 100}%`, minWidth: entry.values[i] > 0 ? 2 : 0, height: "100%", borderRadius: Math.min(4, theme.radius.s), backgroundColor: many ? seriesColor(s) : pointColor(i) } })),
              showValues === false ? null : h(NativeText, { style: { ...small, width: valueWidth, textAlign: "right", color: c.fg } }, formatValue(entry.values[i])))))))),
      legend);
  }
  // Vertical: bar (grouped) and stacked share the axis, the grid and the label row.
  const tall = height ?? 160, stacked = type === "stacked", labelled = showValues ?? (stacked || !many), top = labelled ? 20 : 8, room = tall - top;
  const max = niceMax(peak), ticks = [max, max / 2, 0], axisWidth = Math.max(...ticks.map((tick) => formatValue(tick).length)) * 7.5 + 6;
  const at = (value) => top + room * (1 - value / max), cap = Math.min(4, theme.radius.s), slim = count > 8;
  const valueText = (text, key) => h(NativeText, { key, numberOfLines: 1, style: { ...small, color: c.fg, width: 48, textAlign: "center", marginBottom: 2 } }, text);
  const column = (i) => {
    if (stacked) {
      const parts = model.series.map((entry, s) => ({ s, value: entry.values[i] })).filter((part) => part.value > 0), topMost = parts[parts.length - 1]?.s;
      return h(View, { style: { flex: 1, maxWidth: 36, alignItems: "center" } }, labelled && !slim ? valueText(formatValue(totals[i]), "v") : null,
        h(View, { key: "s", style: { alignSelf: "stretch", flexDirection: "column-reverse", gap: 1 } }, parts.map((part) =>
          h(View, { key: part.s, style: { height: Math.max(1, (part.value / max) * room - 1), backgroundColor: seriesColor(part.s), borderTopLeftRadius: part.s === topMost ? cap : 0, borderTopRightRadius: part.s === topMost ? cap : 0 } }))));
    }
    return model.series.map((entry, s) => h(View, { key: s, style: { flex: 1, maxWidth: 32, alignItems: "center" } }, labelled && !slim ? valueText(formatValue(entry.values[i]), "v") : null,
      h(View, { key: "b", style: { alignSelf: "stretch", height: entry.values[i] > 0 ? Math.max(2, (entry.values[i] / max) * room) : 0, backgroundColor: many ? seriesColor(s) : pointColor(i), borderTopLeftRadius: cap, borderTopRightRadius: cap } })));
  };
  const lane = { flex: 1, flexDirection: "row", gap: slim ? 2 : theme.space.xs, paddingHorizontal: theme.space["2xs"] };
  return root(heading,
    h(View, { key: "plot", style: { flexDirection: "row", height: tall } },
      h(View, { style: { width: axisWidth } }, ticks.map((tick) => h(NativeText, { key: tick, style: { ...small, position: "absolute", right: 6, top: at(tick) - 8 } }, formatValue(tick)))),
      h(View, { style: { flex: 1 } },
        ticks.map((tick) => h(View, { key: tick, style: { position: "absolute", left: 0, right: 0, top: at(tick), height: 1, backgroundColor: c.line, opacity: tick === 0 ? 1 : 0.6 } })),
        h(View, { style: flat(lane, { alignItems: "flex-end" }) }, model.labels.map((_, i) =>
          h(View, { key: i, style: { flex: 1, height: tall, flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 2 } }, column(i)))))),
    h(View, { key: "x", style: flat(lane, { flex: 0, marginLeft: axisWidth }) }, model.labels.map((label, i) => {
      const every = Math.ceil(count / 8);
      return h(NativeText, { key: i, numberOfLines: 1, style: { ...small, flex: 1, textAlign: "center" } }, i % every === 0 ? label : "");
    })),
    legend);
}

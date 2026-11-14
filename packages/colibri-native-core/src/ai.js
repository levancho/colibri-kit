// AI elements: the building blocks of chat and agent screens. Everything is presentational and driven by plain
// props and callbacks; nothing here talks to a network, the clipboard or a file picker.
//
// What a phone does differently from the web kit:
// - Copying needs a native module, so copy buttons appear only when you pass onCopy(text) and you do the copying.
// - Attaching files needs a system picker: PromptInput calls onAttach and shows the attachments you pass back.
// - Hover previews (Context, InlineCitation) open on tap instead.
// - Icons are text glyphs or shapes drawn with View; every block takes an icon prop to replace its glyph.
import { createElement as h, forwardRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text as NativeText, TextInput, View } from "react-native";
import { useTheme } from "./provider.js";
import { toneName } from "./theme.js";
import { web, depth, flat, GLYPH } from "./internal.js";
import { Stack, Cluster, Text, Button, Badge, Avatar, Tabs, Progress } from "./components.js";
import { Sheet } from "./overlays.js";

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

// ---------------------------------------------------------------- shared pieces (not exported)
// One status vocabulary for every block: pending | running | done | error | skipped. The web kit's words map onto it.
const STATUS = { completed: "done", complete: "done", passed: "done", success: "done", ok: "done", failed: "error", fail: "error", streaming: "running", active: "running" };
const statusOf = (status) => STATUS[status] ?? status ?? "pending";
const STATUS_WORD = { pending: "Pending", running: "Running", done: "Completed", error: "Failed", skipped: "Skipped" };
const STATUS_TONE = { running: "accent", done: "ok", error: "bad" };

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
/** Seconds as "850ms", "3s", "4.2s" or "1m 12s". */
function formatDuration(seconds) {
  if (!Number.isFinite(+seconds)) return "";
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  if (seconds < 60) return `${Number.isInteger(+seconds) || seconds >= 10 ? Math.round(seconds) : (+seconds).toFixed(1)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}
/** 124000 → "124k", 1250000 → "1.3M". */
function formatTokens(count) {
  const n = +count || 0;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}
const asText = (value) => (value == null ? "" : typeof value === "string" ? value : JSON.stringify(value, null, 2));

function useOpen(open, defaultOpen, onOpenChange) {
  const [inner, setInner] = useState(!!defaultOpen), value = open ?? inner;
  return [value, (next) => { if (open === undefined) setInner(next); onOpenChange?.(next); }];
}

/** Text with `inline code` spans. Nothing else is parsed. */
function inline(text, codeStyle) {
  if (typeof text !== "string") return text;
  return text.split(/(`[^`\n]+`)/).map((part, index) => (part.length > 2 && part[0] === "`" && part[part.length - 1] === "`" ? h(NativeText, { key: index, style: codeStyle }, part.slice(1, -1)) : part));
}
function Rich({ text, size = "sm", children, ...rest }) {
  const theme = useTheme();
  return h(Text, { size, ...rest }, inline(text ?? children, { fontFamily: MONO, fontSize: Math.round(theme.text[size] * 0.92), backgroundColor: theme.colors.sunken }));
}

/** The chevron of a section: › turned down when open. */
function Chevron({ open, color }) {
  const theme = useTheme();
  return h(NativeText, { "aria-hidden": true, importantForAccessibility: "no", style: { width: 16, textAlign: "center", color: color ?? theme.colors.muted, fontSize: 18, lineHeight: 20, fontWeight: "600", transform: [{ rotate: open ? "90deg" : "0deg" }] } }, GLYPH.chevronRight);
}

/** A glyph in a fixed box so headers line up whatever the glyph is. */
function Glyph({ children, color, size = 15, mono = false }) {
  const theme = useTheme();
  if (children != null && typeof children !== "string") return children;
  return h(NativeText, { "aria-hidden": true, importantForAccessibility: "no", numberOfLines: 1, style: { minWidth: 18, textAlign: "center", color: color ?? theme.colors.muted, fontSize: size, lineHeight: 20, fontWeight: "700", fontFamily: mono ? MONO : undefined } }, children);
}

/** The state of one step or block: hollow ring, spinner, tick, cross or dash. */
function Mark({ status, size = 18 }) {
  const theme = useTheme(), c = theme.colors, state = statusOf(status);
  const box = { width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center" };
  const glyph = (text, color) => h(NativeText, { style: { color, fontSize: Math.round(size * 0.62), lineHeight: size, fontWeight: "800" } }, text);
  if (state === "running") return h(View, { style: box }, h(ActivityIndicator, { size: "small", color: c.accent, style: { transform: [{ scale: 0.7 }] } }));
  if (state === "done") return h(View, { style: flat(box, { backgroundColor: theme.tones.ok.soft }) }, glyph(GLYPH.check, c.ok));
  if (state === "error") return h(View, { style: flat(box, { backgroundColor: theme.tones.bad.soft }) }, glyph(GLYPH.close, c.bad));
  if (state === "skipped") return h(View, { style: flat(box, { backgroundColor: c.sunken }) }, glyph(GLYPH.minus, c.muted));
  return h(View, { style: flat(box, { borderWidth: 1.5, borderColor: c.muted, opacity: 0.45 }) });
}

/** Monospace text that scrolls sideways instead of wrapping. Long output also scrolls down inside maxHeight. */
function MonoBlock({ children, tone, maxHeight, label, style }) {
  const theme = useTheme(), c = theme.colors;
  const body = h(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, contentContainerStyle: { padding: theme.space.s } },
    typeof children === "string" ? h(NativeText, { selectable: true, style: { fontFamily: MONO, fontSize: theme.text.xs, lineHeight: 18, color: tone === "bad" ? c.bad : c.fg } }, children) : children);
  return h(View, { accessibilityLabel: label, style: flat({ borderRadius: theme.radius.s, backgroundColor: c.sunken, overflow: "hidden" }, style) },
    maxHeight ? h(ScrollView, { nestedScrollEnabled: true, style: { maxHeight } }, body) : body);
}

/** A small text button for rows of secondary actions (Copy, Retry). */
function Action({ label, title, selected, onPress, tone }) {
  const theme = useTheme(), c = theme.colors;
  return h(Pressable, { onPress, accessibilityRole: "button", accessibilityLabel: label ?? title, accessibilityState: selected === undefined ? undefined : { selected }, "aria-pressed": selected,
    hitSlop: { top: 8, bottom: 8, left: 2, right: 2 },
    style: ({ pressed }) => ({ minHeight: 28, paddingHorizontal: theme.space.xs, justifyContent: "center", borderRadius: theme.radius.s, backgroundColor: selected ? (tone === "bad" ? theme.tones.bad.soft : c.accentSoft) : pressed ? c.sunken : "transparent" }) },
    h(Text, { size: "xs", weight: "semibold", style: { color: selected ? (tone === "bad" ? c.bad : c.accent) : c.muted } }, title));
}

/**
 * The collapsible section every block is built on: a header row (icon, label, meta, status, chevron) and a body.
 * bare drops the box, for sections that sit inside a reply (Reasoning, Sources).
 */
function Fold({ icon, label, labelNode, meta, status, trailing, open, onToggle, bare = false, tone, hint, children, style, testID }) {
  const theme = useTheme(), c = theme.colors, state = status ? statusOf(status) : null;
  const spoken = [typeof label === "string" ? label : null, meta, state ? STATUS_WORD[state] : null].filter(Boolean).join(", ");
  const header = h(Pressable, { onPress: () => onToggle(!open), accessibilityRole: "button", accessibilityLabel: spoken || undefined, accessibilityHint: hint, accessibilityState: { expanded: open }, "aria-expanded": open, testID,
    style: ({ pressed }) => ({ minHeight: theme.touch, flexDirection: "row", alignItems: "center", gap: theme.space.xs, paddingHorizontal: bare ? 0 : theme.space.s, paddingVertical: theme.space["2xs"],
      backgroundColor: pressed && !bare ? c.sunken : "transparent", opacity: pressed && bare ? 0.6 : 1 }) },
    icon != null ? h(Glyph, { color: tone === "bad" ? c.bad : undefined }, icon) : null,
    labelNode ?? h(Rich, { text: label, weight: "medium", tone: bare ? "muted" : tone, numberOfLines: 2, style: { flexShrink: 1, flexGrow: bare ? 0 : 1 } }),
    meta ? h(Text, { size: "xs", tone: "muted", numberOfLines: 1 }, meta) : null,
    trailing ?? (state ? h(Mark, { status: state }) : null),
    h(Chevron, { open }));
  if (bare) return h(View, { style: flat({ alignSelf: "stretch" }, style) }, h(View, { style: { alignSelf: "flex-start", maxWidth: "100%" } }, header),
    open ? h(View, { style: { marginLeft: theme.space.xs, paddingLeft: theme.space.s, paddingVertical: theme.space["2xs"], borderLeftWidth: 2, borderLeftColor: c.line, gap: theme.space.xs } }, children) : null);
  return h(View, { style: flat({ alignSelf: "stretch", borderWidth: 1, borderColor: tone === "bad" ? theme.tones.bad.soft : c.line, borderRadius: theme.radius.m, backgroundColor: c.surface, overflow: "hidden" }, style) }, header,
    open ? h(View, { style: { padding: theme.space.s, gap: theme.space.s, borderTopWidth: 1, borderTopColor: c.line } }, children) : null);
}

/** steps: strings or { label, status, detail }. */
function Steps({ steps = [], numbered = false }) {
  const theme = useTheme();
  return h(View, { accessibilityRole: "list", style: { gap: theme.space.xs } }, steps.map((step, index) => {
    const item = typeof step === "string" ? { label: step } : step, state = statusOf(item.status);
    return h(View, { key: item.id ?? index, accessibilityLabel: `${typeof item.label === "string" ? item.label.replace(/`/g, "") : `Step ${index + 1}`}, ${STATUS_WORD[state]}`, style: { flexDirection: "row", alignItems: "flex-start", gap: theme.space.xs } },
      h(View, { style: { height: 21, justifyContent: "center" } }, h(Mark, { status: state })),
      h(View, { style: { flex: 1, gap: 1 } },
        h(Rich, { text: numbered ? `${index + 1}. ${item.label}` : item.label, tone: state === "pending" || state === "skipped" ? "muted" : state === "error" ? "bad" : undefined, weight: state === "running" ? "medium" : "regular" }),
        item.detail ? h(Rich, { text: item.detail, size: "xs", tone: "muted" }) : null));
  }));
}
const doneCount = (steps) => steps.filter((step) => statusOf(step?.status) === "done").length;
const overall = (status, steps) => status ?? (steps.some((step) => statusOf(step?.status) === "error") ? "error" : steps.some((step) => statusOf(step?.status) === "running") ? "running" : steps.length && doneCount(steps) === steps.length ? "done" : "pending");

// ---------------------------------------------------------------- reasoning and steps
/**
 * The model's thinking. While status is "streaming" it stays open and says "Thinking…"; when it turns "done" it
 * folds away as "Thought for 3s". Pass open + onOpenChange to control it yourself.
 */
export function Reasoning({ status = "done", duration, text, label, icon = "✦", open, defaultOpen, onOpenChange, children, style }) {
  const theme = useTheme(), running = statusOf(status) === "running", [inner, setInner] = useState(defaultOpen ?? running), was = useRef(running);
  useEffect(() => {
    if (running !== was.current) { was.current = running; setInner(running); }
  }, [running]);
  const shown = open ?? inner;
  const title = label ?? (running ? "Thinking…" : duration != null ? `Thought for ${formatDuration(duration)}` : "Thought process");
  return h(Fold, { bare: true, icon, label: title, open: shown, onToggle: (next) => { if (open === undefined) setInner(next); onOpenChange?.(next); }, style,
    trailing: running ? h(ActivityIndicator, { size: "small", color: theme.colors.muted, style: { transform: [{ scale: 0.7 }] } }) : undefined },
    text ? String(text).split(/\n{2,}/).map((paragraph, index) => h(Rich, { key: index, text: paragraph, tone: "muted" })) : null, children);
}

/** A summary line that opens into the steps the agent took. steps: [{ label, status, detail }]. */
export function ChainOfThought({ label = "Thinking steps", steps = [], status, duration, icon = "✦", open, defaultOpen = false, onOpenChange, children, style }) {
  const [shown, setShown] = useOpen(open, defaultOpen, onOpenChange);
  return h(Fold, { icon, label, meta: duration != null ? formatDuration(duration) : undefined, status: overall(status, steps), open: shown, onToggle: setShown, style }, h(Steps, { steps }), children);
}

/** Background work as it happens: a label, how many steps are finished, and the steps. */
export function Task({ label, steps = [], status, icon = GLYPH.search, open, defaultOpen = false, onOpenChange, children, style }) {
  const [shown, setShown] = useOpen(open, defaultOpen, onOpenChange);
  return h(Fold, { icon, label, meta: steps.length ? `${doneCount(steps)}/${steps.length}` : undefined, status: overall(status, steps), open: shown, onToggle: setShown, style }, h(Steps, { steps }), children);
}

/** The steps an agent intends to take, with a progress bar and "2 of 4". */
export function Plan({ title = "Plan", description, steps = [], status, open, defaultOpen = true, onOpenChange, children, style }) {
  const [shown, setShown] = useOpen(open, defaultOpen, onOpenChange), done = doneCount(steps), state = overall(status, steps);
  return h(Fold, { label: title, meta: `${done} of ${steps.length}`, status: state, open: shown, onToggle: setShown, style },
    description ? h(Rich, { text: description, tone: "muted" }) : null,
    h(Progress, { value: steps.length ? done / steps.length : 0, tone: state === "error" ? "bad" : state === "done" ? "ok" : "accent", style: { height: 6 } }),
    h(Steps, { steps, numbered: true }), children);
}

/** Work handed to a helper agent: who, what, the steps it took and what it reported back. */
export function Subagent({ name, task, status = "done", steps = [], result, duration, icon = "◆", open, defaultOpen = false, onOpenChange, children, style }) {
  const theme = useTheme(), [shown, setShown] = useOpen(open, defaultOpen, onOpenChange);
  return h(Fold, { icon, label: [name, task].filter(Boolean).join(" · "), meta: duration != null ? formatDuration(duration) : undefined, status, open: shown, onToggle: setShown, style },
    steps.length ? h(Steps, { steps: steps.map((step) => (typeof step === "string" ? { label: step, status: "done" } : step)) }) : null,
    result ? h(View, { style: { padding: theme.space.s, gap: theme.space["3xs"], borderRadius: theme.radius.s, backgroundColor: theme.colors.sunken } },
      h(Text, { size: "xs", weight: "bold", tone: "muted", style: { letterSpacing: 0.6, textTransform: "uppercase" } }, "Result"), h(Rich, { text: result })) : null,
    children);
}

// ---------------------------------------------------------------- tool calls and output
/**
 * One tool call. status: pending | running | done (or completed) | error. input and output are strings or
 * values (shown as JSON) in monospace; error replaces the output in the danger tone.
 */
export function Tool({ name, status, input, output, error, duration, icon = "ƒ", onCopy, open, defaultOpen = false, onOpenChange, children, style }) {
  const theme = useTheme(), state = statusOf(status ?? (error != null ? "error" : output != null ? "done" : "pending")), [shown, setShown] = useOpen(open, defaultOpen, onOpenChange);
  const section = (title, value, tone) => h(View, { key: title, style: { gap: theme.space["2xs"] } },
    h(Cluster, { justify: "space-between", wrap: false },
      h(Text, { size: "xs", weight: "bold", tone: "muted", style: { letterSpacing: 0.6, textTransform: "uppercase" } }, title),
      onCopy ? h(Action, { title: "Copy", label: `Copy ${title.toLowerCase()}`, onPress: () => onCopy(asText(value)) }) : null),
    h(MonoBlock, { tone, maxHeight: 220, label: `${title}: ${asText(value)}` }, asText(value)));
  return h(Fold, { icon, open: shown, onToggle: setShown, style, label: name, meta: duration != null ? formatDuration(duration) : undefined,
    labelNode: h(NativeText, { numberOfLines: 1, style: { flex: 1, fontFamily: MONO, fontSize: theme.text.sm, fontWeight: "600", color: theme.colors.fg } }, name),
    trailing: h(Cluster, { gap: "2xs", wrap: false }, state === "running" ? h(ActivityIndicator, { size: "small", color: theme.colors.accent, style: { transform: [{ scale: 0.7 }] } }) : null, h(Badge, { tone: STATUS_TONE[state] }, STATUS_WORD[state])) },
    input != null ? section("Input", input) : null,
    error != null ? section("Error", error, "bad") : output != null ? section("Output", output) : null,
    state === "running" && output == null && error == null ? h(Text, { size: "sm", tone: "muted" }, "Waiting for the result…") : null,
    children);
}

/**
 * A command and its output. output is a string or lines ([{ text, tone }]); it scrolls sideways, and down once
 * it is taller than maxHeight. status: running | done | error; exitCode is shown in the header when given.
 */
export function Terminal({ command, output = "", status = "done", exitCode, duration, icon = ">_", maxHeight = 240, onCopy, open, defaultOpen = true, onOpenChange, style }) {
  const theme = useTheme(), c = theme.colors, state = statusOf(status), [shown, setShown] = useOpen(open, defaultOpen, onOpenChange);
  const lines = Array.isArray(output) ? output.map((line) => (typeof line === "string" ? { text: line } : line)) : String(output).split("\n").map((text) => ({ text }));
  const plain = lines.map((line) => line.text).join("\n"), line = { fontFamily: MONO, fontSize: theme.text.xs, lineHeight: 18 };
  const meta = [exitCode != null ? `exit ${exitCode}` : null, duration != null ? formatDuration(duration) : null].filter(Boolean).join(" · ");
  return h(Fold, { icon: typeof icon === "string" ? h(Glyph, { mono: true, size: 12 }, icon) : icon, label: command, meta: meta || undefined, status: state, open: shown, onToggle: setShown, style,
    labelNode: h(NativeText, { numberOfLines: 1, style: { flex: 1, fontFamily: MONO, fontSize: theme.text.sm, fontWeight: "600", color: c.fg } }, command) },
    h(MonoBlock, { maxHeight, label: `Output of ${command}` }, h(View, null,
      h(NativeText, { selectable: true, style: flat(line, { color: c.muted }) }, `$ ${command}`),
      lines.map((entry, index) => (entry.text === "" && index === lines.length - 1 ? null : h(NativeText, { key: index, selectable: true, style: flat(line, { color: c[toneName(entry.tone)] ?? (entry.tone === "muted" ? c.muted : c.fg) }) }, entry.text || " "))),
      state === "running" ? h(Caret, { color: c.fg }) : null)),
    onCopy ? h(Button, { title: "Copy output", variant: "ghost", size: "s", onPress: () => onCopy(plain) }) : null);
}

const frameText = (frame) => (typeof frame === "string" ? frame.trim() : `at ${frame.fn ?? "<anonymous>"} (${[frame.file, frame.line, frame.column].filter((part) => part != null).join(":")})`);
/**
 * An error and the frames behind it. frames: strings or { fn, file, line, column, internal }; or pass the raw
 * trace text. Library frames (internal) are dimmed, and frames beyond maxFrames wait behind "Show all".
 */
export function StackTrace({ message, frames, trace, maxFrames = 5, onCopy, open, defaultOpen = false, onOpenChange, style }) {
  const theme = useTheme(), c = theme.colors, [shown, setShown] = useOpen(open, defaultOpen, onOpenChange), [all, setAll] = useState(false);
  const list = frames ?? String(trace ?? "").split("\n").filter((entry) => entry.trim());
  const visible = all ? list : list.slice(0, maxFrames), hidden = list.length - visible.length;
  const icon = h(View, { style: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: theme.tones.bad.soft } }, h(NativeText, { style: { color: c.bad, fontSize: 12, lineHeight: 18, fontWeight: "800" } }, GLYPH.warn));
  return h(Fold, { icon, tone: "bad", label: message, meta: shown ? undefined : `${list.length} ${list.length === 1 ? "frame" : "frames"}`, open: shown, onToggle: setShown, style,
    labelNode: h(NativeText, { numberOfLines: shown ? undefined : 2, style: { flex: 1, fontFamily: MONO, fontSize: theme.text.xs, lineHeight: 18, fontWeight: "600", color: c.bad } }, message) },
    h(MonoBlock, { label: "Stack frames" }, h(View, null, visible.map((frame, index) => h(NativeText, { key: index, selectable: true, style: { fontFamily: MONO, fontSize: theme.text.xs, lineHeight: 20, color: frame?.internal ? c.muted : c.fg } }, frameText(frame))))),
    hidden > 0 || onCopy || all ? h(Cluster, { justify: "space-between" },
      list.length > maxFrames ? h(Button, { title: all ? "Show fewer frames" : `Show all ${list.length} frames`, variant: "ghost", size: "s", onPress: () => setAll(!all), accessibilityState: { expanded: all }, "aria-expanded": all }) : h(View),
      onCopy ? h(Button, { title: "Copy", variant: "ghost", size: "s", accessibilityLabel: "Copy stack trace", onPress: () => onCopy([message, ...list.map((frame) => `    ${frameText(frame)}`)].join("\n")) }) : null) : null);
}

/**
 * A test run. suites: [{ name, tests: [{ name, status: "passed" | "failed" | "skipped", duration, error }] }].
 * The header counts passes and failures; suites with a failure start open.
 */
export function TestResults({ title = "Test run", suites = [], status, duration, open, defaultOpen = true, onOpenChange, style }) {
  const theme = useTheme(), c = theme.colors, [shown, setShown] = useOpen(open, defaultOpen, onOpenChange);
  const count = (tests, state) => tests.filter((test) => statusOf(test.status) === state).length;
  const tests = suites.flatMap((suite) => suite.tests ?? []), passed = count(tests, "done"), failed = count(tests, "error"), skipped = count(tests, "skipped");
  const [openSuites, setOpenSuites] = useState(() => Object.fromEntries(suites.map((suite) => [suite.name, suite.defaultOpen ?? count(suite.tests ?? [], "error") > 0])));
  const state = statusOf(status ?? (failed ? "error" : tests.length && passed + skipped === tests.length ? "done" : "running"));
  return h(Fold, { label: title, meta: failed ? `${failed} failed` : `${passed} passed`, status: state, open: shown, onToggle: setShown, style },
    h(View, { style: { gap: theme.space.xs } },
      h(Cluster, { gap: "2xs" }, h(Badge, { tone: "ok" }, `${passed} passed`), failed ? h(Badge, { tone: "bad" }, `${failed} failed`) : null, skipped ? h(Badge, null, `${skipped} skipped`) : null,
        duration != null ? h(Text, { size: "xs", tone: "muted", style: { marginLeft: "auto" } }, formatDuration(duration)) : null),
      tests.length ? h(View, { accessibilityLabel: `${passed} of ${tests.length} tests passed`, style: { flexDirection: "row", height: 6, gap: 2, borderRadius: 3, overflow: "hidden" } },
        passed ? h(View, { style: { flex: passed, backgroundColor: c.ok } }) : null, failed ? h(View, { style: { flex: failed, backgroundColor: c.bad } }) : null, skipped ? h(View, { style: { flex: skipped, backgroundColor: c.line } }) : null) : null),
    suites.map((suite) => {
      const list = suite.tests ?? [], bad = count(list, "error"), isOpen = !!openSuites[suite.name];
      return h(View, { key: suite.name, style: { borderWidth: 1, borderColor: c.line, borderRadius: theme.radius.s, overflow: "hidden" } },
        h(Pressable, { onPress: () => setOpenSuites((current) => ({ ...current, [suite.name]: !isOpen })), accessibilityRole: "button", accessibilityLabel: `${suite.name}, ${count(list, "done")} of ${list.length} passed`, accessibilityState: { expanded: isOpen }, "aria-expanded": isOpen,
          style: ({ pressed }) => ({ minHeight: theme.touch, flexDirection: "row", alignItems: "center", gap: theme.space.xs, paddingHorizontal: theme.space.xs, backgroundColor: pressed ? c.sunken : "transparent" }) },
          h(Mark, { status: bad ? "error" : "done" }),
          h(NativeText, { numberOfLines: 1, style: { flex: 1, fontFamily: MONO, fontSize: theme.text.xs, fontWeight: "600", color: c.fg } }, suite.name),
          h(Text, { size: "xs", tone: bad ? "bad" : "muted" }, `${count(list, "done")}/${list.length}`), h(Chevron, { open: isOpen })),
        isOpen ? h(View, { accessibilityRole: "list", style: { padding: theme.space.xs, paddingTop: theme.space["2xs"], gap: theme.space.xs, borderTopWidth: 1, borderTopColor: c.line } }, list.map((test, index) => {
          const result = statusOf(test.status);
          return h(View, { key: index, accessibilityLabel: `${test.name}, ${result === "done" ? "passed" : result === "error" ? "failed" : "skipped"}`, style: { gap: theme.space["2xs"] } },
            h(View, { style: { flexDirection: "row", alignItems: "flex-start", gap: theme.space.xs } },
              h(View, { style: { height: 21, justifyContent: "center" } }, h(Mark, { status: result, size: 16 })),
              h(Text, { size: "sm", tone: result === "error" ? "bad" : result === "skipped" ? "muted" : undefined, style: { flex: 1 } }, test.name),
              test.duration != null ? h(Text, { size: "xs", tone: "muted" }, formatDuration(test.duration)) : null),
            test.error ? h(MonoBlock, { tone: "bad", style: { marginLeft: 16 + theme.space.xs } }, String(test.error)) : null);
        })) : null);
    }));
}

// ---------------------------------------------------------------- status cards
/** A to-do list in two parts: what is left and what is done. items: [{ id, label, done }]; onChange(id, done). */
export function Queue({ items = [], onChange, pendingLabel = "To do", completedLabel = "Done", disabled = false, style }) {
  const theme = useTheme(), c = theme.colors, readOnly = disabled || !onChange;
  const section = (title, list) => h(View, { key: title, style: { gap: theme.space["3xs"] } },
    h(Text, { size: "xs", weight: "bold", tone: "muted", accessibilityRole: "header", style: { letterSpacing: 0.6, textTransform: "uppercase" } }, `${title} (${list.length})`),
    list.length ? list.map((item) => h(Pressable, { key: String(item.id), onPress: () => onChange?.(item.id, !item.done), disabled: readOnly, accessibilityRole: "checkbox", accessibilityLabel: item.label, accessibilityState: { checked: !!item.done, disabled: readOnly }, "aria-checked": !!item.done, "aria-disabled": readOnly,
      style: { minHeight: theme.touch, flexDirection: "row", alignItems: "center", gap: theme.space.xs, opacity: disabled ? 0.5 : 1 } },
      h(View, { style: { width: 22, height: 22, borderRadius: Math.min(6, theme.radius.s), borderWidth: 2, borderColor: item.done ? c.accent : c.muted, backgroundColor: item.done ? c.accent : "transparent", alignItems: "center", justifyContent: "center" } },
        item.done ? h(NativeText, { style: { color: c.brandFg, fontSize: 14, lineHeight: 16, fontWeight: "800" } }, GLYPH.check) : null),
      h(View, { style: { flex: 1 } }, h(Rich, { text: item.label, size: "md", tone: item.done ? "muted" : undefined, style: item.done ? { textDecorationLine: "line-through" } : null }),
        item.detail ? h(Text, { size: "xs", tone: "muted" }, item.detail) : null))) : h(Text, { size: "sm", tone: "muted", style: { paddingVertical: theme.space.xs } }, "Nothing here."));
  return h(View, { style: flat({ gap: theme.space.s }, style) }, section(pendingLabel, items.filter((item) => !item.done)), section(completedLabel, items.filter((item) => item.done)));
}

/** A point in the conversation to go back to. onRestore(id) is called by the Restore button. */
export function Checkpoint({ id, label = "Checkpoint", detail, restoreLabel = "Restore", onRestore, disabled = false, style }) {
  const theme = useTheme(), c = theme.colors, rule = { height: 1, backgroundColor: c.line };
  return h(View, { style: flat({ flexDirection: "row", alignItems: "center", gap: theme.space.xs, minHeight: theme.touch }, style) },
    h(View, { style: flat(rule, { width: theme.space.s }) }),
    h(View, { style: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: c.accent, alignItems: "center", justifyContent: "center" } }, h(View, { style: { width: 4, height: 4, borderRadius: 2, backgroundColor: c.accent } })),
    h(Text, { size: "sm", tone: "muted", numberOfLines: 1, style: { flexShrink: 1 } }, detail ? `${label} · ${detail}` : label),
    h(View, { style: flat(rule, { flex: 1, minWidth: theme.space.s }) }),
    onRestore ? h(Button, { title: restoreLabel, variant: "ghost", size: "s", disabled, style: { alignSelf: "center" }, accessibilityLabel: `${restoreLabel} ${label}`, onPress: () => onRestore(id) }) : null);
}

/**
 * Asks before an action runs. status: "pending" | "approved" | "rejected", controlled, or left out to let the card
 * keep the answer itself. detail is shown in monospace (the command or query); tone="bad" makes Approve a danger button.
 */
export function Confirmation({ title, description, detail, status, tone, approveLabel = "Approve", rejectLabel = "Reject", approvedText = "Approved", rejectedText = "Rejected", onApprove, onReject, disabled = false, children, style }) {
  const theme = useTheme(), c = theme.colors, [inner, setInner] = useState("pending"), state = status ?? inner;
  const answer = (next, callback) => () => { if (status === undefined) setInner(next); callback?.(); };
  return h(View, { style: flat({ alignSelf: "stretch", padding: theme.space.m, gap: theme.space.s, borderWidth: 1, borderColor: c.line, borderRadius: theme.radius.l, backgroundColor: c.surface, ...depth(theme.shadow.s) }, style) },
    h(View, { style: { gap: theme.space["2xs"] } }, h(Rich, { text: title, size: "md", weight: "semibold" }), description ? h(Rich, { text: description, tone: "muted" }) : null),
    detail != null ? h(MonoBlock, { maxHeight: 160 }, asText(detail)) : null, children,
    state === "pending"
      ? h(Cluster, { justify: "flex-end" }, h(Button, { title: rejectLabel, variant: "outline", disabled, onPress: answer("rejected", onReject) }), h(Button, { title: approveLabel, variant: toneName(tone) === "bad" ? "danger" : "solid", disabled, onPress: answer("approved", onApprove) }))
      : h(View, { accessibilityRole: "alert", accessibilityLiveRegion: "polite", style: { flexDirection: "row", alignItems: "center", gap: theme.space.xs, minHeight: 40 } },
        h(Mark, { status: state === "approved" ? "done" : "error" }), h(Text, { size: "sm", weight: "medium", tone: state === "approved" ? "ok" : "bad" }, state === "approved" ? approvedText : rejectedText)));
}

/**
 * How full the context window is. A small meter and a percentage; tap it for the numbers (the web kit shows them
 * on hover). breakdown: [{ label, value }]. The bar turns warn at 75% and bad at 90%.
 */
export function Context({ used = 0, max = 0, breakdown, label = "Context window", open, defaultOpen = false, onOpenChange, style }) {
  const theme = useTheme(), c = theme.colors, [shown, setShown] = useOpen(open, defaultOpen, onOpenChange);
  const share = max > 0 ? clamp(used / max, 0, 1) : 0, percent = Math.round(share * 100), tone = share >= 0.9 ? "bad" : share >= 0.75 ? "warn" : "accent";
  return h(View, { style: flat({ alignSelf: "flex-start", gap: theme.space.xs, maxWidth: "100%" }, style) },
    h(Pressable, { onPress: () => setShown(!shown), accessibilityRole: "button", accessibilityLabel: `${label}: ${percent}% used`, accessibilityHint: "Shows token counts", accessibilityState: { expanded: shown }, "aria-expanded": shown, hitSlop: 6,
      style: ({ pressed }) => ({ alignSelf: "flex-start", minHeight: 32, flexDirection: "row", alignItems: "center", gap: theme.space.xs, paddingHorizontal: theme.space.s, borderRadius: theme.radius.full, borderWidth: 1, borderColor: c.line, backgroundColor: pressed ? c.sunken : c.surface }) },
      h(View, { style: { width: 56, height: 6, borderRadius: 3, overflow: "hidden", backgroundColor: c.sunken } }, h(View, { style: { width: `${percent}%`, height: "100%", borderRadius: 3, backgroundColor: c[tone] } })),
      h(Text, { size: "xs", weight: "semibold", tone: tone === "accent" ? undefined : tone }, `${percent}%`)),
    shown ? h(View, { style: { minWidth: 240, padding: theme.space.s, gap: theme.space.xs, borderWidth: 1, borderColor: c.line, borderRadius: theme.radius.m, backgroundColor: c.surface, ...depth(theme.shadow.m) } },
      h(Text, { size: "sm", weight: "semibold" }, label),
      h(Text, { size: "sm" }, h(Text, { size: "sm", weight: "bold" }, formatTokens(used)), ` of ${formatTokens(max)} tokens used`),
      h(Progress, { value: share, tone, style: { height: 6 } }),
      breakdown?.length ? h(View, { style: { gap: theme.space["3xs"] } }, breakdown.map((part) => h(View, { key: part.label, style: { flexDirection: "row", justifyContent: "space-between", gap: theme.space.m } },
        h(Text, { size: "xs", tone: "muted" }, part.label), h(Text, { size: "xs", weight: "medium" }, formatTokens(part.value))))) : null,
      share >= 0.9 ? h(Text, { size: "xs", tone: "bad" }, "Almost full. Start a new conversation soon.") : null) : null);
}

// ---------------------------------------------------------------- files
const FILE_STATUS = { added: ["A", "ok", "added"], modified: ["M", "warn", "modified"], deleted: ["D", "bad", "deleted"], renamed: ["R", "accent", "renamed"] };
const pathOf = (node, parent) => node.path ?? (parent ? `${parent}/${node.name}` : node.name);
/**
 * A folder tree. items: [{ name, path?, children?, status?: "added" | "modified" | "deleted" | "renamed" }]; a node
 * with children is a folder. selected + onSelect(path, node) for the highlighted file; expanded + onExpandedChange
 * (arrays of folder paths) to control which folders are open, or defaultExpanded to start with.
 */
export function FileTree({ items = [], selected, defaultSelected, onSelect, expanded, defaultExpanded, onExpandedChange, onToggle, label = "Files", style }) {
  const theme = useTheme(), c = theme.colors;
  const [innerOpen, setInnerOpen] = useState(() => defaultExpanded ?? items.filter((node) => node.children).map((node) => pathOf(node))), openPaths = expanded ?? innerOpen;
  const [innerSelected, setInnerSelected] = useState(defaultSelected), current = selected ?? innerSelected;
  const toggle = (path) => {
    const isOpen = openPaths.includes(path), next = isOpen ? openPaths.filter((entry) => entry !== path) : [...openPaths, path];
    if (expanded === undefined) setInnerOpen(next);
    onExpandedChange?.(next); onToggle?.(path, !isOpen);
  };
  const row = (node, level, parent) => {
    const path = pathOf(node, parent), folder = Array.isArray(node.children), isOpen = folder && openPaths.includes(path), isSelected = !folder && current === path, mark = FILE_STATUS[node.status];
    return h(View, { key: path },
      h(Pressable, { onPress: () => { if (folder) toggle(path); else { if (selected === undefined) setInnerSelected(path); onSelect?.(path, node); } },
        accessibilityRole: "button", accessibilityLabel: `${node.name}, ${folder ? "folder" : "file"}${mark ? `, ${mark[2]}` : ""}`, accessibilityState: folder ? { expanded: isOpen } : { selected: isSelected }, "aria-expanded": folder ? isOpen : undefined, "aria-selected": folder ? undefined : isSelected,
        hitSlop: { top: 2, bottom: 2 },
        style: ({ pressed }) => ({ minHeight: 40, flexDirection: "row", alignItems: "center", gap: theme.space.xs, paddingLeft: theme.space.xs + level * theme.space.m, paddingRight: theme.space.xs, borderRadius: theme.radius.s, backgroundColor: isSelected ? c.accentSoft : pressed ? c.sunken : "transparent" }) },
        folder ? h(Chevron, { open: isOpen }) : h(View, { style: { width: 16 } }),
        folder
          ? h(View, { style: { width: 18, height: 14 } }, h(View, { style: { width: 8, height: 4, borderTopLeftRadius: 2, borderTopRightRadius: 2, backgroundColor: c.accent } }), h(View, { style: { width: 18, height: 11, marginTop: -1, borderRadius: 2, borderTopLeftRadius: 0, backgroundColor: c.accent, opacity: isOpen ? 0.7 : 1 } }))
          : h(View, { style: { width: 18, alignItems: "center" } }, h(View, { style: { width: 12, height: 15, borderRadius: 2, borderWidth: 1.5, borderColor: isSelected ? c.accent : c.muted, paddingTop: 3, paddingHorizontal: 2, gap: 2 } }, h(View, { style: { height: 1.5, backgroundColor: isSelected ? c.accent : c.muted } }), h(View, { style: { height: 1.5, width: 4, backgroundColor: isSelected ? c.accent : c.muted } }))),
        h(NativeText, { numberOfLines: 1, style: { flex: 1, fontFamily: folder ? undefined : MONO, fontSize: theme.text.sm, fontWeight: folder || isSelected ? "600" : "400", color: isSelected ? c.accent : node.status === "deleted" ? c.muted : c.fg, textDecorationLine: node.status === "deleted" ? "line-through" : "none" } }, node.name),
        mark ? h(NativeText, { style: { width: 16, textAlign: "center", fontFamily: MONO, fontSize: theme.text.xs, fontWeight: "700", color: c[mark[1]] } }, mark[0]) : null),
      isOpen ? node.children.map((child) => row(child, level + 1, path)) : null);
  };
  return h(View, { accessibilityLabel: label, style: flat({ alignSelf: "stretch" }, style) }, items.map((node) => row(node, 0, "")));
}

// ---------------------------------------------------------------- citations and sources
const siteOf = (source) => source.site ?? String(source.url ?? "").replace(/^[a-z]+:\/\//i, "").replace(/^www\./, "").split(/[/?#]/)[0];
const openSource = (source, onOpen) => (onOpen ? onOpen(source) : source?.url ? Linking.openURL(source.url).catch(() => {}) : undefined);

/**
 * A numbered citation that sits inside a sentence: put it between the words of a Text. It is text itself, so it
 * flows with the line. onPress(source) is where you show a CitationPreview (the web kit previews on hover);
 * without onPress it goes straight to onOpen(source), and without either it opens source.url.
 */
export function InlineCitation({ number, source, onPress, onOpen, style }) {
  const theme = useTheme(), name = source?.title ?? (source ? siteOf(source) : "");
  return h(NativeText, { onPress: () => (onPress ? onPress(source) : openSource(source, onOpen)), suppressHighlighting: true, accessibilityRole: "link", accessibilityLabel: `Source ${number}${name ? `: ${name}` : ""}`,
    style: flat({ fontSize: theme.text.xs, fontWeight: "700", color: theme.colors.accent, backgroundColor: theme.colors.accentSoft }, style) }, ` ${number} `);
}

/** The preview behind an InlineCitation: a Sheet with the source's title, site and snippet, and a button to open it. */
export function CitationPreview({ source, number, visible = !!source, onClose, onOpen, openLabel = "Open source" }) {
  return h(Sheet, { visible: visible && !!source, onClose, title: source?.title ?? "Source" }, source ? h(Stack, { gap: "s" },
    h(Text, { size: "sm", tone: "muted" }, [number != null ? `Source ${number}` : null, siteOf(source)].filter(Boolean).join(" · ")),
    source.snippet ? h(Text, { size: "sm" }, source.snippet) : null,
    h(Cluster, { justify: "flex-end" }, h(Button, { title: "Close", variant: "ghost", onPress: onClose }), source.url || onOpen ? h(Button, { title: openLabel, onPress: () => { onClose?.(); openSource(source, onOpen); } }) : null)) : null);
}

/**
 * "Used 3 sources", opening into a numbered list. sources: [{ title, url, site?, snippet? }]. onOpen(source) is
 * called when a row is pressed; without it the row opens source.url with Linking.
 */
export function Sources({ sources = [], label, status = "done", icon = "↗", onOpen, open, defaultOpen = false, onOpenChange, style }) {
  const theme = useTheme(), c = theme.colors, [shown, setShown] = useOpen(open, defaultOpen, onOpenChange), running = statusOf(status) === "running";
  return h(Fold, { bare: true, icon, label: label ?? (running ? "Searching sources…" : `Used ${sources.length} ${sources.length === 1 ? "source" : "sources"}`), open: shown, onToggle: setShown, style,
    trailing: running ? h(ActivityIndicator, { size: "small", color: c.muted, style: { transform: [{ scale: 0.7 }] } }) : undefined },
    sources.map((source, index) => h(Pressable, { key: source.id ?? source.url ?? index, onPress: () => openSource(source, onOpen), accessibilityRole: "link", accessibilityLabel: `Source ${index + 1}: ${source.title ?? siteOf(source)}, ${siteOf(source)}`,
      style: ({ pressed }) => ({ minHeight: theme.touch, flexDirection: "row", alignItems: "center", gap: theme.space.xs, paddingVertical: theme.space["2xs"], paddingHorizontal: theme.space["2xs"], borderRadius: theme.radius.s, backgroundColor: pressed ? c.sunken : "transparent" }) },
      h(View, { style: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: c.accentSoft } }, h(NativeText, { style: { fontSize: theme.text.xs, fontWeight: "700", color: c.accent } }, index + 1)),
      h(View, { style: { flex: 1 } }, h(Text, { size: "sm", weight: "medium", numberOfLines: 1 }, source.title ?? siteOf(source)), h(Text, { size: "xs", tone: "muted", numberOfLines: 1 }, siteOf(source))),
      h(Glyph, { color: c.muted }, "↗"))));
}

// ---------------------------------------------------------------- prompts
/**
 * Ready-made prompts as chips. items: strings or { label, value }. onSuggest(text) gets the prompt.
 * scroll puts them on one line that scrolls sideways (above a prompt input); otherwise they wrap.
 */
export function Suggestion({ items = [], onSuggest, scroll = false, disabled = false, label = "Suggested prompts", style }) {
  const theme = useTheme(), c = theme.colors;
  const chips = items.map((item, index) => {
    const text = typeof item === "string" ? item : item.label, value = typeof item === "string" ? item : item.value ?? item.label;
    return h(Pressable, { key: index, onPress: () => onSuggest?.(value), disabled, accessibilityRole: "button", accessibilityLabel: text, accessibilityState: { disabled }, "aria-disabled": disabled, hitSlop: { top: 4, bottom: 4 },
      style: ({ pressed }) => ({ minHeight: 36, justifyContent: "center", paddingHorizontal: theme.space.s, borderRadius: theme.radius.full, borderWidth: 1, borderColor: c.line, backgroundColor: pressed ? c.sunken : c.surface, opacity: disabled ? 0.5 : 1 }) },
      h(Text, { size: "sm", weight: "medium", numberOfLines: 1 }, text));
  });
  if (scroll) return h(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, keyboardShouldPersistTaps: "handled", accessibilityLabel: label, style: flat({ flexGrow: 0 }, style), contentContainerStyle: { gap: theme.space.xs, paddingHorizontal: theme.space.s } }, chips);
  return h(View, { accessibilityLabel: label, style: flat({ flexDirection: "row", flexWrap: "wrap", gap: theme.space.xs }, style) }, chips);
}

/**
 * A chip that opens a Sheet to choose the model and, when efforts is given, how hard it should think.
 * options: [{ value, label, description?, badge?, disabled? }]; value + onChange. efforts: [{ value, label }];
 * effort + onEffortChange. Both also work uncontrolled with defaultValue / defaultEffort.
 */
export function ModelSelector({ value, defaultValue, onChange, options = [], effort, defaultEffort, onEffortChange, efforts, title = "Model", effortTitle = "Reasoning effort", disabled = false, style }) {
  const theme = useTheme(), c = theme.colors, [visible, setVisible] = useState(false);
  const [innerValue, setInnerValue] = useState(defaultValue ?? options[0]?.value), model = value ?? innerValue;
  const [innerEffort, setInnerEffort] = useState(defaultEffort ?? efforts?.[0]?.value), level = effort ?? innerEffort;
  const chosen = options.find((option) => option.value === model), chosenEffort = efforts?.find((option) => option.value === level);
  const text = [chosen?.label ?? "Choose a model", chosenEffort?.label].filter(Boolean).join(" · ");
  return h(View, { style: flat({ alignSelf: "flex-start" }, style) },
    h(Pressable, { onPress: () => setVisible(true), disabled, accessibilityRole: "button", accessibilityLabel: `${title}: ${text}`, accessibilityHint: "Opens the model picker", accessibilityState: { disabled, expanded: visible }, "aria-disabled": disabled, "aria-expanded": visible, hitSlop: { top: 4, bottom: 4 },
      style: ({ pressed }) => ({ minHeight: 36, flexDirection: "row", alignItems: "center", gap: theme.space["2xs"], paddingLeft: theme.space.s, paddingRight: theme.space.xs, borderRadius: theme.radius.full, borderWidth: 1, borderColor: c.line, backgroundColor: pressed ? c.sunken : c.surface, opacity: disabled ? 0.5 : 1 }) },
      h(Text, { size: "sm", weight: "medium", numberOfLines: 1 }, text), h(Chevron, { open: true })),
    h(Sheet, { visible, onClose: () => setVisible(false), title },
      h(View, { accessibilityRole: "radiogroup", style: { gap: theme.space["2xs"] } }, options.map((option) => {
        const selected = option.value === model;
        return h(Pressable, { key: String(option.value), disabled: option.disabled, onPress: () => { if (value === undefined) setInnerValue(option.value); onChange?.(option.value); if (!efforts) setVisible(false); },
          accessibilityRole: "radio", accessibilityLabel: [option.label, option.badge, option.description].filter(Boolean).join(", "), accessibilityState: { selected, checked: selected, disabled: !!option.disabled }, "aria-checked": selected, "aria-disabled": !!option.disabled,
          style: ({ pressed }) => ({ minHeight: 52, flexDirection: "row", alignItems: "center", gap: theme.space.s, paddingVertical: theme.space.xs, paddingHorizontal: theme.space.s, borderRadius: theme.radius.m, borderWidth: 1, borderColor: selected ? c.accent : "transparent", backgroundColor: selected ? c.accentSoft : pressed ? c.sunken : "transparent", opacity: option.disabled ? 0.5 : 1 }) },
          h(View, { style: { flex: 1, gap: 1 } },
            h(Cluster, { gap: "xs" }, h(Text, { weight: "semibold" }, option.label), option.badge ? h(Badge, { tone: "accent" }, option.badge) : null),
            option.description ? h(Text, { size: "sm", tone: "muted" }, option.description) : null),
          h(View, { style: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: selected ? c.accent : c.muted, alignItems: "center", justifyContent: "center" } }, selected ? h(View, { style: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent } }) : null));
      })),
      efforts?.length ? h(View, { style: { gap: theme.space.xs, marginTop: theme.space.xs } },
        h(Text, { size: "sm", weight: "semibold" }, effortTitle),
        h(Tabs, { value: level, options: efforts, onChange: (next) => { if (effort === undefined) setInnerEffort(next); onEffortChange?.(next); } }),
        h(Button, { title: "Done", block: true, onPress: () => setVisible(false), style: { marginTop: theme.space.xs } })) : null));
}

/** The blinking block at the end of text that is still streaming. */
function Caret({ color }) {
  const theme = useTheme(), opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.timing(opacity, { toValue: 0.15, duration: 500, useNativeDriver: !web }), Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: !web })]));
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return h(Animated.View, { "aria-hidden": true, importantForAccessibility: "no", style: { width: 7, height: 14, marginLeft: 2, borderRadius: 1, backgroundColor: color ?? theme.colors.accent, opacity } });
}

/**
 * The message box. The text grows from one line up to maxHeight. Send calls onSubmit(text, attachments) and
 * clears the box; while streaming (or status="streaming") the button turns into Stop and calls onStop.
 * attachments: [{ id, name, detail? }] with onRemoveAttachment(id); onAttach is where you open your file or photo
 * picker (the attach button is hidden without it). model + onModelPress adds a model chip to the toolbar.
 * On the web Enter sends and Shift+Enter makes a new line; on a phone the Send button sends.
 */
export const PromptInput = forwardRef(function PromptInput({ value, defaultValue = "", onChange, onSubmit, onStop, status, streaming = false, disabled = false, placeholder = "Ask anything…", attachments = [], onAttach, onRemoveAttachment,
  model, onModelPress, toolbar, minHeight = 40, maxHeight = 140, sendLabel = "Send message", stopLabel = "Stop generating", style, inputStyle, onFocus, onBlur, ...rest }, ref) {
  const theme = useTheme(), c = theme.colors, [inner, setInner] = useState(defaultValue), text = value ?? inner, [focused, setFocused] = useState(false), [height, setHeight] = useState(minHeight), input = useRef(null);
  const busy = streaming || statusOf(status) === "running", canSend = !disabled && !busy && (text.trim().length > 0 || attachments.length > 0);
  const change = (next) => { if (value === undefined) setInner(next); onChange?.(next); };
  const submit = () => { if (!canSend) return; onSubmit?.(text.trim(), attachments); change(""); };
  // Native multiline inputs grow by themselves between minHeight and maxHeight. A browser textarea does not, so measure it.
  useLayoutEffect(() => {
    const node = input.current;
    if (!web || !node?.style) return;
    node.style.height = "0px";
    const next = clamp(node.scrollHeight, minHeight, maxHeight);
    node.style.height = `${next}px`;
    setHeight(next);
  }, [text, minHeight, maxHeight]);
  const round = (pressed, filled, off) => ({ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: filled ? 0 : 1, borderColor: c.line, backgroundColor: filled ? (pressed ? c.accentPressed : c.accent) : pressed ? c.sunken : "transparent", opacity: off ? 0.4 : 1 });
  return h(View, { style: flat({ alignSelf: "stretch", padding: theme.space.xs, gap: theme.space["2xs"], borderWidth: 1, borderColor: focused ? c.accent : c.line, borderRadius: theme.radius.l, backgroundColor: c.surface, opacity: disabled ? 0.6 : 1 }, style) },
    attachments.length ? h(View, { accessibilityLabel: "Attachments", style: { flexDirection: "row", flexWrap: "wrap", gap: theme.space["2xs"], padding: theme.space["2xs"] } }, attachments.map((file) => h(View, { key: String(file.id ?? file.name), style: { maxWidth: "100%", flexDirection: "row", alignItems: "center", gap: theme.space["2xs"], paddingLeft: theme.space.xs, borderRadius: theme.radius.s, backgroundColor: c.sunken } },
      h(View, { style: { flexShrink: 1, paddingVertical: theme.space["2xs"] } }, h(Text, { size: "xs", weight: "semibold", numberOfLines: 1 }, file.name), file.detail ? h(Text, { size: "xs", tone: "muted", numberOfLines: 1 }, file.detail) : null),
      onRemoveAttachment ? h(Pressable, { onPress: () => onRemoveAttachment(file.id ?? file.name), accessibilityRole: "button", accessibilityLabel: `Remove ${file.name}`, hitSlop: 8, style: { width: 28, height: 28, alignItems: "center", justifyContent: "center" } },
        h(NativeText, { style: { color: c.muted, fontSize: 18, lineHeight: 20 } }, GLYPH.close)) : h(View, { style: { width: theme.space.xs } })))) : null,
    h(TextInput, { ref: (node) => { input.current = node; if (typeof ref === "function") ref(node); else if (ref) ref.current = node; },
      value: text, onChangeText: change, multiline: true, editable: !disabled, placeholder, placeholderTextColor: c.muted, selectionColor: c.accent, accessibilityLabel: placeholder, textAlignVertical: "top",
      onFocus: (event) => { setFocused(true); onFocus?.(event); }, onBlur: (event) => { setFocused(false); onBlur?.(event); },
      onKeyPress: web ? (event) => { if (event.nativeEvent.key === "Enter" && !event.nativeEvent.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault?.(); submit(); } } : undefined,
      style: flat({ minHeight, maxHeight, paddingHorizontal: theme.space.xs, paddingTop: 9, paddingBottom: 9, color: c.fg, fontSize: theme.text.md, lineHeight: 22 }, web && { height, outlineStyle: "none", resize: "none" }, inputStyle), ...rest }),
    h(View, { style: { flexDirection: "row", alignItems: "center", gap: theme.space.xs } },
      onAttach ? h(Pressable, { onPress: onAttach, disabled, accessibilityRole: "button", accessibilityLabel: "Attach a file", hitSlop: 4, style: ({ pressed }) => round(pressed, false, disabled) }, h(NativeText, { style: { color: c.fg, fontSize: 20, lineHeight: 22 } }, GLYPH.plus)) : null,
      model ? h(Pressable, { onPress: onModelPress, disabled: disabled || !onModelPress, accessibilityRole: "button", accessibilityLabel: `Model: ${model}`, hitSlop: { top: 6, bottom: 6 },
        style: ({ pressed }) => ({ flexShrink: 1, minHeight: 32, flexDirection: "row", alignItems: "center", gap: theme.space["3xs"], paddingLeft: theme.space.s, paddingRight: onModelPress ? theme.space["2xs"] : theme.space.s, borderRadius: theme.radius.full, backgroundColor: pressed ? c.line : c.sunken }) },
        h(Text, { size: "xs", weight: "semibold", numberOfLines: 1, style: { flexShrink: 1 } }, model), onModelPress ? h(Chevron, { open: true }) : null) : null,
      toolbar, h(View, { style: { flex: 1 } }),
      busy
        ? h(Pressable, { onPress: onStop, accessibilityRole: "button", accessibilityLabel: stopLabel, hitSlop: 4, style: ({ pressed }) => round(pressed, true, false) }, h(View, { style: { width: 12, height: 12, borderRadius: 2, backgroundColor: c.brandFg } }))
        : h(Pressable, { onPress: submit, disabled: !canSend, accessibilityRole: "button", accessibilityLabel: sendLabel, accessibilityState: { disabled: !canSend }, "aria-disabled": !canSend, hitSlop: 4, style: ({ pressed }) => round(pressed, true, !canSend) },
          h(NativeText, { style: { color: c.brandFg, fontSize: 18, lineHeight: 20, fontWeight: "700" } }, GLYPH.arrowUp))));
});

// ---------------------------------------------------------------- messages and chat
/**
 * One turn of the conversation. role "user" is an accent bubble on the right; "assistant" is plain text across
 * the width. text is split into paragraphs at blank lines and `inline code` is set in monospace; nothing else is
 * parsed. children go above the text (Reasoning, Tool …) and footer below it (Sources). streaming shows a caret.
 * Actions appear under a finished assistant reply for each callback you pass: onCopy(text), onRetry(),
 * onFeedback("up" | "down" | null) with feedback as the current value.
 */
export function AiMessage({ role = "assistant", text, streaming = false, author, avatar, time, onCopy, onRetry, onFeedback, feedback, actions, footer, children, style }) {
  const theme = useTheme(), c = theme.colors, user = role === "user";
  const paragraphs = typeof text === "string" ? text.split(/\n{2,}/).filter((part, index, all) => part.trim() || all.length === 1) : text != null ? [text] : [];
  if (streaming && !paragraphs.length) paragraphs.push("");
  const body = (color, codeStyle, extra) => paragraphs.map((paragraph, index) => h(NativeText, { key: index, selectable: true, style: flat({ color, fontSize: theme.text.md, lineHeight: 24 }, extra) },
    inline(paragraph, flat({ fontFamily: MONO, fontSize: theme.text.sm }, codeStyle)), streaming && index === paragraphs.length - 1 ? h(Caret, { color }) : null));
  const spoken = `${author ?? (user ? "You" : "Assistant")}: ${typeof text === "string" ? text.replace(/`/g, "") : ""}${streaming ? " (still writing)" : ""}`;
  if (user) return h(View, { accessible: true, accessibilityLabel: spoken, style: flat({ alignSelf: "flex-end", maxWidth: "85%", gap: theme.space["2xs"] }, style) },
    h(View, { style: { paddingVertical: theme.space.xs, paddingHorizontal: theme.space.s + 2, gap: theme.space.xs, borderRadius: theme.radius.l, borderBottomRightRadius: Math.min(theme.radius.s, 6), backgroundColor: c.accent } },
      children, body(c.brandFg, { backgroundColor: c.accentPressed })),
    time ? h(Text, { size: "xs", tone: "muted", align: "right" }, time) : null);
  const showActions = !streaming && (onCopy || onRetry || onFeedback || actions);
  return h(View, { style: flat({ alignSelf: "stretch", gap: theme.space.xs }, style) },
    author || avatar ? h(View, { style: { flexDirection: "row", alignItems: "center", gap: theme.space.xs } }, avatar ?? h(Avatar, { name: author, size: 24 }), author ? h(Text, { size: "sm", weight: "semibold" }, author) : null, time ? h(Text, { size: "xs", tone: "muted" }, time) : null) : null,
    children,
    paragraphs.length ? h(View, { accessible: true, accessibilityLabel: spoken, accessibilityLiveRegion: streaming ? "polite" : undefined, "aria-busy": streaming, style: { gap: theme.space.xs } }, body(c.fg, { backgroundColor: c.sunken })) : null,
    footer,
    showActions ? h(View, { style: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: theme.space["2xs"], marginLeft: -theme.space.xs } },
      onCopy ? h(Action, { title: "Copy", label: "Copy reply", onPress: () => onCopy(typeof text === "string" ? text : "") }) : null,
      onRetry ? h(Action, { title: "Retry", label: "Try again", onPress: () => onRetry() }) : null,
      onFeedback ? h(Action, { title: "Good", label: "Good reply", selected: feedback === "up", onPress: () => onFeedback(feedback === "up" ? null : "up") }) : null,
      onFeedback ? h(Action, { title: "Bad", label: "Bad reply", tone: "bad", selected: feedback === "down", onPress: () => onFeedback(feedback === "down" ? null : "down") }) : null,
      actions) : null);
}

/**
 * A whole conversation: a message list that follows new text while you are at the bottom (scroll up and a
 * "Jump to latest" button appears), suggestion chips, and a PromptInput docked above the keyboard.
 * messages: [{ id, role, text, streaming?, … }] — every field is passed to AiMessage, or draw a message
 * yourself with renderMessage(message, index). onSend(text, attachments) and onStop come from the input; a
 * pressed suggestion calls onSuggest(text), or onSend when onSuggest is not given. The action callbacks get the message:
 * onCopy(message), onRetry(message), onFeedback(message, value). Give the Chat a height or flex: 1.
 */
export function Chat({ messages = [], renderMessage, onSend, onStop, streaming = false, disabled = false, suggestions, onSuggest, onCopy, onRetry, onFeedback, placeholder = "Message…", empty, header,
  attachments, onAttach, onRemoveAttachment, model, onModelPress, inputProps, keyboardVerticalOffset = 0, jumpLabel = "Jump to latest", style, contentStyle }) {
  const theme = useTheme(), c = theme.colors, list = useRef(null), pinned = useRef(true), [away, setAway] = useState(false);
  const toEnd = (animated) => list.current?.scrollToEnd({ animated });
  const last = messages[messages.length - 1];
  // A message you send always brings the list back to the bottom.
  useEffect(() => { if (last?.role === "user") { pinned.current = true; setAway(false); toEnd(true); } }, [messages.length]); // eslint-disable-line react-hooks/exhaustive-deps
  return h(KeyboardAvoidingView, { behavior: Platform.OS === "ios" ? "padding" : undefined, keyboardVerticalOffset, style: flat({ flex: 1, backgroundColor: c.bg }, style) },
    header,
    h(View, { style: { flex: 1 } },
      h(ScrollView, { ref: list, nestedScrollEnabled: true, keyboardShouldPersistTaps: "handled", keyboardDismissMode: "interactive", scrollEventThrottle: 32, style: { flex: 1 },
        contentContainerStyle: flat({ flexGrow: 1, padding: theme.space.m, gap: theme.space.m }, contentStyle),
        onContentSizeChange: () => { if (pinned.current) toEnd(false); },
        onLayout: () => { if (pinned.current) toEnd(false); },
        onScroll: ({ nativeEvent: { contentOffset, layoutMeasurement, contentSize } }) => {
          const atEnd = contentOffset.y + layoutMeasurement.height >= contentSize.height - 32;
          pinned.current = atEnd;
          if (atEnd === away) setAway(!atEnd);
        } },
        messages.length ? messages.map((message, index) => h(View, { key: message.id ?? index }, renderMessage ? renderMessage(message, index) : h(AiMessage, { ...message,
          onCopy: onCopy ? () => onCopy(message) : undefined, onRetry: onRetry ? () => onRetry(message) : undefined, onFeedback: onFeedback ? (next) => onFeedback(message, next) : undefined })))
          : h(View, { style: { flex: 1, alignItems: "center", justifyContent: "center" } }, typeof empty === "string" ? h(Text, { tone: "muted", align: "center" }, empty) : empty)),
      away ? h(Pressable, { onPress: () => { pinned.current = true; setAway(false); toEnd(true); }, accessibilityRole: "button", accessibilityLabel: jumpLabel,
        style: { position: "absolute", bottom: theme.space.xs, alignSelf: "center", minHeight: 36, flexDirection: "row", alignItems: "center", gap: theme.space["2xs"], paddingHorizontal: theme.space.s, borderRadius: theme.radius.full, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, ...depth(theme.shadow.m) } },
        h(NativeText, { style: { color: c.fg, fontSize: 14, fontWeight: "700" } }, GLYPH.arrowDown), h(Text, { size: "sm", weight: "medium" }, jumpLabel)) : null),
    suggestions?.length ? h(Suggestion, { items: suggestions, scroll: true, disabled: disabled || streaming, onSuggest: (text) => (onSuggest ? onSuggest(text) : onSend?.(text, [])), style: { paddingBottom: theme.space.xs } }) : null,
    h(View, { style: { paddingHorizontal: theme.space.s, paddingBottom: theme.space.s } },
      h(PromptInput, { placeholder, streaming, disabled, onSubmit: onSend, onStop, attachments, onAttach, onRemoveAttachment, model, onModelPress, ...inputProps })));
}

// Colibri for React Native: layout primitives and the everyday controls, styled from one theme.
// Same vocabulary as Colibri CSS: gap="s", variant="soft", tone="ok", size="l". No JSX, no build step,
// no dependencies beyond react and react-native.
// Accessibility state is passed both ways (accessibilityState and aria-*), so it reaches iOS, Android and the web.
import { createContext, createElement as h, forwardRef, useContext, useState } from "react";
import { ActivityIndicator, FlatList, Image, Platform, Pressable, ScrollView, Switch as NativeSwitch, Text as NativeText, TextInput, View } from "react-native";
import { useTheme } from "./provider.js";
import { toneName } from "./theme.js";

const web = Platform.OS === "web";
/** Depth: boxShadow on the web, shadow props and elevation on iOS and Android. */
const depth = (shadow) => (web ? { boxShadow: shadow.boxShadow } : { shadowColor: shadow.shadowColor, shadowOffset: shadow.shadowOffset, shadowOpacity: shadow.shadowOpacity, shadowRadius: shadow.shadowRadius, elevation: shadow.elevation });
const gapOf = (theme, gap) => (typeof gap === "number" ? gap : theme.space[gap] ?? theme.space.s);
const flat = (...styles) => styles.flat(Infinity).filter(Boolean);
// Buttons and badges keep their own width in a column, and line up with their neighbours in a Cluster row.
const InRow = createContext(false);
const selfAlign = (inRow) => (inRow ? null : { alignSelf: "flex-start" });

// ---------------------------------------------------------------- layout
/** Full-screen background. scroll wraps the content in a ScrollView; padded adds the standard page gutter. */
export function Screen({ scroll = false, padded = true, gap = "m", style, contentStyle, children, ...rest }) {
  const theme = useTheme(), inner = { padding: padded ? theme.space.m : 0, gap: gapOf(theme, gap) };
  if (scroll) return h(ScrollView, { style: flat({ flex: 1, backgroundColor: theme.colors.bg }, style), contentContainerStyle: flat(inner, contentStyle), keyboardShouldPersistTaps: "handled", ...rest }, children);
  return h(View, { style: flat({ flex: 1, backgroundColor: theme.colors.bg }, inner, style), ...rest }, children);
}

/** Vertical rhythm. gap is a token ("3xs" … "2xl") or a number. */
export const Stack = forwardRef(function Stack({ gap = "s", align, justify, style, ...rest }, ref) {
  const theme = useTheme();
  return h(InRow.Provider, { value: false }, h(View, { ref, style: flat({ flexDirection: "column", gap: gapOf(theme, gap), alignItems: align, justifyContent: justify }, style), ...rest }));
});

/** A wrapping row of things: buttons, badges, tags. */
export const Cluster = forwardRef(function Cluster({ gap = "xs", align = "center", justify = "flex-start", wrap = true, style, ...rest }, ref) {
  const theme = useTheme();
  return h(InRow.Provider, { value: true }, h(View, { ref, style: flat({ flexDirection: "row", flexWrap: wrap ? "wrap" : "nowrap", gap: gapOf(theme, gap), alignItems: align, justifyContent: justify }, style), ...rest }));
});

export function Divider({ style }) {
  const theme = useTheme();
  return h(View, { style: flat({ height: 1, alignSelf: "stretch", backgroundColor: theme.colors.line }, style) });
}

// ---------------------------------------------------------------- text
const WEIGHT = { regular: "400", medium: "500", semibold: "600", bold: "700" };
/** size: xs | sm | md | lg | xl | 2xl | 3xl. tone: muted, accent, ok, warn, bad (or success, warning, danger). */
export const Text = forwardRef(function Text({ size = "md", tone, weight = "regular", align, style, ...rest }, ref) {
  const theme = useTheme(), fontSize = theme.text[size] ?? theme.text.md;
  const color = tone === "muted" ? theme.colors.muted : theme.colors[toneName(tone)] ?? theme.colors.fg;
  return h(NativeText, { ref, style: flat({ color, fontSize, lineHeight: Math.round(fontSize * (fontSize >= theme.text.lg ? 1.25 : 1.5)), fontWeight: WEIGHT[weight] ?? weight, textAlign: align }, style), ...rest });
});

const HEADING = { 1: "2xl", 2: "xl", 3: "lg", 4: "md" };
export function Heading({ level = 2, style, ...rest }) {
  return h(Text, { size: HEADING[level] ?? "lg", weight: "bold", accessibilityRole: "header", "aria-level": level, style: flat({ letterSpacing: -0.3 }, style), ...rest });
}

// ---------------------------------------------------------------- button
const BUTTON_SIZE = { s: { height: 32, pad: 12, text: "sm" }, m: { height: 40, pad: 16, text: "sm" }, l: { height: 48, pad: 22, text: "md" } };
/**
 * variant: solid | soft | outline | ghost | danger.  size: s | m | l.  loading shows a spinner and blocks presses.
 * Pass the label as title or as children; icon is any element shown before it. Touch targets are at least 44pt.
 */
export const Button = forwardRef(function Button({ title, children, variant = "solid", size = "m", icon, loading = false, disabled = false, block = false, style, textStyle, onPress, ...rest }, ref) {
  const theme = useTheme(), inRow = useContext(InRow), c = theme.colors, dims = BUTTON_SIZE[size] ?? BUTTON_SIZE.m, off = disabled || loading;
  const kind = variant === "destructive" ? "danger" : variant;
  const look = {
    solid: { bg: c.accent, pressed: c.accentPressed, fg: c.brandFg, border: "transparent" },
    danger: { bg: c.bad, pressed: c.badPressed, fg: c.brandFg, border: "transparent" },
    soft: { bg: c.accentSoft, pressed: theme.tones.accent.soft, fg: c.accent, border: "transparent" },
    outline: { bg: "transparent", pressed: c.sunken, fg: c.fg, border: c.line },
    ghost: { bg: "transparent", pressed: c.sunken, fg: c.fg, border: "transparent" },
  }[kind] ?? {};
  const label = children ?? title;
  return h(Pressable, { ref, onPress, disabled: off, accessibilityRole: "button", accessibilityState: { disabled: off, busy: loading }, "aria-disabled": off, "aria-busy": loading,
    hitSlop: dims.height < theme.touch ? (theme.touch - dims.height) / 2 : undefined,
    style: ({ pressed }) => flat({ minHeight: dims.height, paddingHorizontal: dims.pad, borderRadius: theme.radius.s, borderWidth: 1, borderColor: look.border,
      backgroundColor: pressed ? look.pressed : look.bg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
      opacity: off ? 0.5 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }, block ? { alignSelf: "stretch" } : selfAlign(inRow), style), ...rest },
    loading ? h(ActivityIndicator, { size: "small", color: look.fg }) : icon,
    typeof label === "string" || typeof label === "number" ? h(Text, { size: dims.text, weight: "medium", style: flat({ color: look.fg }, textStyle), numberOfLines: 1 }, label) : label);
});

// ---------------------------------------------------------------- surfaces
/** A bordered surface. Give it onPress to make the whole card a button. */
export const Card = forwardRef(function Card({ gap = "s", padded = true, onPress, style, children, ...rest }, ref) {
  const theme = useTheme();
  const base = { padding: padded ? theme.space.m : 0, gap: gapOf(theme, gap), borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.l, backgroundColor: theme.colors.surface, ...depth(theme.shadow.s) };
  const content = h(InRow.Provider, { value: false }, children);
  if (!onPress) return h(View, { ref, style: flat(base, style), ...rest }, content);
  return h(Pressable, { ref, onPress, accessibilityRole: "button", style: ({ pressed }) => flat(base, pressed && { backgroundColor: theme.colors.sunken }, style), ...rest }, content);
});

export function Badge({ tone, style, children, ...rest }) {
  const theme = useTheme(), inRow = useContext(InRow), t = theme.tones[toneName(tone)];
  return h(View, { style: flat(selfAlign(inRow), { paddingHorizontal: 9, paddingVertical: 2, borderRadius: theme.radius.full, backgroundColor: t ? t.soft : theme.colors.sunken }, style), ...rest },
    h(Text, { size: "xs", weight: "semibold", style: { color: t ? t.fg : theme.colors.fg } }, children));
}

/** A tinted note with a coloured edge. tone: accent (default) | ok | warn | bad. */
export function Callout({ tone = "accent", title, style, children, ...rest }) {
  const theme = useTheme(), t = theme.tones[toneName(tone)] ?? theme.tones.accent;
  return h(View, { accessibilityRole: tone === "bad" || tone === "danger" ? "alert" : undefined,
    style: flat({ paddingVertical: theme.space.s, paddingHorizontal: theme.space.m, gap: theme.space["2xs"], borderLeftWidth: 4, borderLeftColor: t.fg, borderRadius: theme.radius.s, backgroundColor: t.tint }, style), ...rest },
    title ? h(Text, { weight: "semibold" }, title) : null,
    typeof children === "string" ? h(Text, { size: "sm" }, children) : children);
}

const initials = (name) => String(name ?? "").trim().split(/\s+/).slice(0, 2).map((word) => word[0] ?? "").join("").toUpperCase();
/** A round picture, or the initials of name when there is no source. */
export function Avatar({ name, source, size = 40, style }) {
  const theme = useTheme(), box = { width: size, height: size, borderRadius: size / 2 };
  if (source) return h(Image, { source, accessibilityLabel: name, style: flat(box, style) });
  return h(View, { accessibilityLabel: name, style: flat(box, { alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.accent }, style) },
    h(NativeText, { style: { color: theme.colors.brandFg, fontSize: Math.round(size * 0.38), fontWeight: "700" } }, initials(name)));
}

// ---------------------------------------------------------------- form controls
/** Label, input, and a hint or error line. Every TextInput prop passes through. */
export const TextField = forwardRef(function TextField({ label, hint, error, style, inputStyle, onFocus, onBlur, editable = true, ...rest }, ref) {
  const theme = useTheme(), c = theme.colors, [focused, setFocused] = useState(false);
  return h(View, { style: flat({ gap: theme.space["2xs"] }, style) },
    label ? h(Text, { size: "sm", weight: "semibold", style: error ? { color: c.bad } : null }, label) : null,
    h(TextInput, { ref, editable, accessibilityLabel: label, placeholderTextColor: c.muted, selectionColor: c.accent,
      onFocus: (event) => { setFocused(true); onFocus?.(event); }, onBlur: (event) => { setFocused(false); onBlur?.(event); },
      style: flat({ minHeight: theme.touch, paddingHorizontal: 12, paddingVertical: 8, borderWidth: focused || error ? 2 : 1, borderColor: error ? c.bad : focused ? c.accent : c.line, borderRadius: theme.radius.s,
        backgroundColor: c.surface, color: c.fg, fontSize: theme.text.md, opacity: editable ? 1 : 0.5 }, web && { outlineStyle: "none" }, inputStyle), ...rest }),
    error || hint ? h(Text, { size: "xs", tone: error ? "bad" : "muted" }, error || hint) : null);
});

const Row = ({ label, disabled, children, onPress, role, state, theme }) => h(Pressable, { onPress, disabled, accessibilityRole: role, accessibilityState: state, "aria-checked": state.checked, "aria-disabled": !!disabled, accessibilityLabel: typeof label === "string" ? label : undefined,
  style: { minHeight: theme.touch, flexDirection: "row", alignItems: "center", gap: theme.space.xs, opacity: disabled ? 0.5 : 1 } }, children,
  typeof label === "string" ? h(Text, { style: { flexShrink: 1 } }, label) : label);

/** The platform switch in theme colours. With label it becomes one row that toggles when pressed anywhere. */
export function Switch({ value = false, onValueChange, label, disabled = false, ...rest }) {
  const theme = useTheme(), c = theme.colors;
  const control = h(NativeSwitch, { value, onValueChange, disabled, trackColor: { false: c.line, true: c.accent }, thumbColor: "#ffffff", ios_backgroundColor: c.line,
    ...(web ? { activeThumbColor: "#ffffff" } : null), accessibilityLabel: typeof label === "string" ? label : undefined, ...rest });
  if (!label) return control;
  return h(Pressable, { onPress: () => onValueChange?.(!value), disabled, style: { minHeight: theme.touch, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.space.s, opacity: disabled ? 0.5 : 1 } },
    typeof label === "string" ? h(Text, { style: { flexShrink: 1 } }, label) : label, control);
}

export function Checkbox({ checked = false, onChange, label, disabled = false }) {
  const theme = useTheme(), c = theme.colors;
  return h(Row, { label, disabled, theme, role: "checkbox", state: { checked, disabled }, onPress: () => onChange?.(!checked) },
    h(View, { style: { width: 22, height: 22, borderRadius: Math.min(6, theme.radius.s), borderWidth: 2, borderColor: checked ? c.accent : c.muted, backgroundColor: checked ? c.accent : "transparent", alignItems: "center", justifyContent: "center" } },
      checked ? h(NativeText, { style: { color: c.brandFg, fontSize: 14, lineHeight: 16, fontWeight: "800" } }, "✓") : null));
}

/** options: [{ value, label }]. One choice at a time. */
export function RadioGroup({ value, onChange, options = [], disabled = false, style }) {
  const theme = useTheme(), c = theme.colors;
  return h(View, { accessibilityRole: "radiogroup", style: flat({ gap: theme.space["3xs"] }, style) }, options.map((option) => {
    const selected = option.value === value;
    return h(Row, { key: String(option.value), label: option.label, disabled: disabled || option.disabled, theme, role: "radio", state: { selected, checked: selected, disabled }, onPress: () => onChange?.(option.value) },
      h(View, { style: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: selected ? c.accent : c.muted, alignItems: "center", justifyContent: "center" } },
        selected ? h(View, { style: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent } }) : null));
  }));
}

/** A segmented control. options: [{ value, label }]. */
export function Tabs({ value, onChange, options = [], style }) {
  const theme = useTheme(), c = theme.colors;
  return h(View, { accessibilityRole: "tablist", style: flat({ flexDirection: "row", padding: 3, gap: 2, borderRadius: theme.radius.m, borderWidth: 1, borderColor: c.line, backgroundColor: c.sunken }, style) }, options.map((option) => {
    const selected = option.value === value;
    return h(Pressable, { key: String(option.value), onPress: () => onChange?.(option.value), accessibilityRole: "tab", accessibilityState: { selected }, "aria-selected": selected,
      style: flat({ flex: 1, minHeight: 36, paddingHorizontal: 10, alignItems: "center", justifyContent: "center", borderRadius: Math.max(2, theme.radius.m - 3), backgroundColor: selected ? c.surface : "transparent" }, selected && depth(theme.shadow.s)) },
      h(Text, { size: "sm", weight: "semibold", tone: selected ? undefined : "muted", numberOfLines: 1 }, option.label));
  }));
}

// ---------------------------------------------------------------- lists and status
/** One row: title, optional subtitle, anything before (leading) and after (trailing). Pressable when onPress is given. */
export function ListItem({ title, subtitle, leading, trailing, onPress, style }) {
  const theme = useTheme();
  const content = [leading ? h(View, { key: "l" }, leading) : null,
    h(View, { key: "c", style: { flex: 1, gap: 1 } }, h(Text, { weight: "medium", numberOfLines: 1 }, title), subtitle ? h(Text, { size: "sm", tone: "muted", numberOfLines: 2 }, subtitle) : null),
    trailing ? h(View, { key: "t" }, typeof trailing === "string" ? h(Text, { size: "sm", tone: "muted" }, trailing) : trailing) : null];
  const base = { minHeight: 52, paddingVertical: theme.space.xs, paddingHorizontal: theme.space.m, flexDirection: "row", alignItems: "center", gap: theme.space.s };
  if (!onPress) return h(View, { style: flat(base, style) }, content);
  return h(Pressable, { onPress, accessibilityRole: "button", style: ({ pressed }) => flat(base, pressed && { backgroundColor: theme.colors.sunken }, style) }, content);
}

/** FlatList with Colibri dividers between rows. Every FlatList prop passes through. */
export const List = forwardRef(function List({ divided = true, ...rest }, ref) {
  return h(FlatList, { ref, ItemSeparatorComponent: divided ? Divider : undefined, ...rest });
});

export function Spinner({ size = "small", tone = "accent", ...rest }) {
  const theme = useTheme();
  return h(ActivityIndicator, { size, color: theme.colors[toneName(tone)] ?? theme.colors.accent, ...rest });
}

/** value from 0 to 1. */
export function Progress({ value = 0, tone = "accent", style }) {
  const theme = useTheme(), amount = Math.min(1, Math.max(0, +value || 0));
  return h(View, { accessibilityRole: "progressbar", accessibilityValue: { min: 0, max: 100, now: Math.round(amount * 100) }, "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": Math.round(amount * 100), style: flat({ height: 8, borderRadius: 4, overflow: "hidden", backgroundColor: theme.colors.sunken }, style) },
    h(View, { style: { width: `${amount * 100}%`, height: "100%", borderRadius: 4, backgroundColor: theme.colors[toneName(tone)] ?? theme.colors.accent } }));
}

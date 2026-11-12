// Display: surfaces, typography and the small building blocks (web catalog group "Base").
// Built on the basics in components.js. No JSX, no dependencies beyond react and react-native.
// The web kit's Spinner entry is the Spinner in components.js; it is not repeated here.
import { Children, createContext, createElement as h, useContext, useState } from "react";
import { I18nManager, Linking, Platform, Pressable, Text as NativeText, View } from "react-native";
import { useTheme } from "./provider.js";
import { toneName } from "./theme.js";
import { web, gapOf, flat, InRow, selfAlign, GLYPH } from "./internal.js";
import { Text, Button } from "./components.js";

// ---------------------------------------------------------------- local helpers
/** value + onChange when value is given, otherwise internal state seeded from the default. */
function useControlled(value, fallback, onChange) {
  const [inner, setInner] = useState(fallback), controlled = value !== undefined;
  return [controlled ? value : inner, (next) => { if (!controlled) setInner(next); onChange?.(next); }];
}
const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" });
const CONTROL = { s: { height: 32, pad: 10, text: "sm", glyph: 16 }, m: { height: 40, pad: 14, text: "sm", glyph: 18 }, l: { height: 48, pad: 18, text: "md", glyph: 21 } };
const isText = (node) => typeof node === "string" || typeof node === "number";
/** An icon is a text glyph (see GLYPH) or any element. Hidden from screen readers: the control carries the label. */
const glyph = (icon, color, size) => (isText(icon)
  ? h(NativeText, { "aria-hidden": true, importantForAccessibility: "no", style: { color, fontSize: size, lineHeight: Math.round(size * 1.25), fontWeight: "600", textAlign: "center" } }, icon)
  : typeof icon === "function" ? icon({ color, size }) : icon);
/** A chevron drawn with two borders, so it sits on the optical centre in every font. direction: down | up | start | end. */
function Chevron({ direction = "down", color, size = 8 }) {
  const { rtl } = useDirection();
  const turn = { down: "45deg", up: "-135deg", end: rtl ? "135deg" : "-45deg", start: rtl ? "-45deg" : "135deg" }[direction];
  const nudge = { down: { marginTop: -size / 2 }, up: { marginTop: size / 2 }, end: null, start: null }[direction];
  return h(View, { "aria-hidden": true, importantForAccessibility: "no", style: { width: size + 6, height: size + 6, alignItems: "center", justifyContent: "center" } },
    h(View, { style: flat({ width: size, height: size, borderRightWidth: 2, borderBottomWidth: 2, borderColor: color, transform: [{ rotate: turn }] }, nudge) }));
}

// ---------------------------------------------------------------- direction
// The web kit relies on the dir attribute and CSS logical properties. On a phone the layout direction is app-wide
// (I18nManager.isRTL, changed with I18nManager.forceRTL and a restart). DirectionProvider scopes a direction to
// one subtree with the Yoga `direction` style, which mirrors rows and start/end spacing below it. What Yoga does not
// mirror (text alignment, directional glyphs) is exposed through useDirection().
const systemRTL = () => !!I18nManager.isRTL || (web && typeof document !== "undefined" && document.documentElement?.dir === "rtl");
const directionOf = (dir) => {
  const system = systemRTL(), rtl = dir === "rtl" ? true : dir === "ltr" ? false : system;
  return { dir: rtl ? "rtl" : "ltr", rtl,
    // Only set when the scope differs from the device, so natural alignment is left alone otherwise.
    textStyle: rtl === system && !web ? null : { writingDirection: rtl ? "rtl" : "ltr", textAlign: rtl ? "right" : "left" },
    /** Picks the glyph or value for the reading direction: mirror("→", "←"). */
    mirror: (ltr, whenRtl) => (rtl ? whenRtl : ltr) };
};
const DirectionContext = createContext(null);
/** { dir, rtl, textStyle, mirror(ltrValue, rtlValue) } for the nearest DirectionProvider, or the device direction. */
export function useDirection() {
  return useContext(DirectionContext) ?? directionOf("auto");
}
/** dir: "ltr" | "rtl" | "auto" (follow I18nManager). Mirrors row layouts and start/end spacing for everything inside. */
export function DirectionProvider({ dir = "auto", style, children, ...rest }) {
  const value = directionOf(dir);
  return h(DirectionContext.Provider, { value }, h(View, { style: flat({ direction: value.dir }, style), ...(web ? { dir: value.dir } : null), ...rest }, children));
}

// ---------------------------------------------------------------- separator
/** A line between content. orientation: horizontal | vertical (vertical needs a row parent). decorative hides it from screen readers. */
export function Separator({ orientation = "horizontal", decorative = false, style, ...rest }) {
  const theme = useTheme(), vertical = orientation === "vertical";
  // Same line as Divider; drawn here because a separator also carries a role and an orientation.
  return h(View, { role: decorative ? "none" : "separator", "aria-orientation": decorative ? undefined : orientation, importantForAccessibility: decorative ? "no" : undefined,
    style: flat({ alignSelf: "stretch", backgroundColor: theme.colors.line }, vertical ? { width: 1 } : { height: 1 }, style), ...rest });
}

// ---------------------------------------------------------------- aspect ratio and inset
const ratioOf = (ratio) => {
  if (typeof ratio === "string") { const [a, b] = ratio.split(/[/:]/).map(Number); return a > 0 && b > 0 ? a / b : a > 0 ? a : 1; }
  return ratio > 0 ? ratio : 1;
};
/** A box that keeps its shape. ratio is width / height: 16 / 9, 1, or a string such as "4/3". */
export function AspectRatio({ ratio = 16 / 9, style, children, ...rest }) {
  return h(View, { style: flat({ width: "100%", aspectRatio: ratioOf(ratio), overflow: "hidden" }, style), ...rest }, children);
}

/**
 * Lets media inside a padded Card run to the card's edges. side: top | bottom | x | all.
 * pad is the padding of the surface it sits in (a space token or number; a Card uses "m").
 */
export function Inset({ side = "x", pad = "m", clip = true, style, children, ...rest }) {
  const theme = useTheme(), by = -gapOf(theme, pad), corner = Math.max(0, theme.radius.l - 1);
  const top = side === "top" || side === "all", bottom = side === "bottom" || side === "all";
  return h(View, { style: flat({ marginHorizontal: by, overflow: clip ? "hidden" : "visible" },
    top && { marginTop: by, borderTopLeftRadius: corner, borderTopRightRadius: corner },
    bottom && { marginBottom: by, borderBottomLeftRadius: corner, borderBottomRightRadius: corner }, style), ...rest }, children);
}

// ---------------------------------------------------------------- typography
/** A quotation with a coloured edge. cite adds the source underneath. */
export function Blockquote({ cite, style, children, ...rest }) {
  const theme = useTheme();
  return h(View, { role: web ? "blockquote" : undefined, style: flat({ paddingStart: theme.space.m, paddingVertical: theme.space["2xs"], gap: theme.space["2xs"], borderStartWidth: 3, borderStartColor: theme.colors.accent }, style), ...rest },
    isText(children) ? h(Text, { size: "lg", style: { fontStyle: "italic", lineHeight: 28 } }, children) : children,
    cite ? h(Text, { size: "sm", tone: "muted" }, "— ", cite) : null);
}
/** Inline code. Nest it inside Text: <Text>Run <Code>npm test</Code></Text>. */
export function Code({ size = "sm", style, ...rest }) {
  const theme = useTheme();
  return h(Text, { size, style: flat({ fontFamily: MONO, backgroundColor: theme.colors.sunken, borderRadius: 4 }, web && { paddingHorizontal: 4, paddingVertical: 1 }, style), ...rest });
}
/** The opening paragraph of an article: larger and quieter than body text. */
export function Lead({ style, ...rest }) {
  return h(Text, { size: "lg", tone: "muted", style: flat({ lineHeight: 28 }, style), ...rest });
}
/** Fine print in the normal text colour. */
export function Small(props) {
  return h(Text, { size: "sm", ...props });
}
/** Secondary text: small and muted. */
export function Muted(props) {
  return h(Text, { size: "sm", tone: "muted", ...props });
}

/** One key cap, or a shortcut with keys={["Ctrl", "K"]}. */
export function Kbd({ keys, separator = "+", style, children, ...rest }) {
  const theme = useTheme(), inRow = useContext(InRow), c = theme.colors;
  const cap = (label, key) => h(View, { key, style: flat({ minWidth: 26, height: 26, paddingHorizontal: 7, alignItems: "center", justifyContent: "center", borderRadius: Math.min(6, theme.radius.s), borderWidth: 1, borderBottomWidth: 2, borderColor: c.line, backgroundColor: c.sunken }, keys ? null : [selfAlign(inRow), style]), ...(keys ? null : rest) },
    h(NativeText, { style: { color: c.fg, fontFamily: MONO, fontSize: theme.text.xs, lineHeight: 16, fontWeight: "600" } }, label));
  if (!keys) return cap(children);
  return h(View, { accessible: true, accessibilityLabel: keys.join(` ${separator} `), style: flat({ flexDirection: "row", alignItems: "center", gap: theme.space["2xs"] }, selfAlign(inRow), style), ...rest },
    keys.flatMap((label, index) => [index ? h(Text, { key: `s${index}`, size: "xs", tone: "muted", "aria-hidden": true }, separator) : null, cap(label, `k${index}`)]));
}

// ---------------------------------------------------------------- label and link
/**
 * The text label of a form control. Pass target (the ref of the input) and pressing the label focuses it,
 * as a click on a web label does. required adds a mark; disabled dims it.
 */
export function Label({ target, required = false, disabled = false, onPress, style, children, ...rest }) {
  const theme = useTheme();
  const press = target || onPress ? (event) => { onPress?.(event); target?.current?.focus?.(); } : undefined;
  return h(Text, { size: "sm", weight: "semibold", onPress: disabled ? undefined : press, suppressHighlighting: true, style: flat(disabled && { color: theme.colors.muted }, style), ...rest }, children,
    required ? h(Text, { size: "sm", weight: "semibold", tone: "bad", "aria-hidden": true }, " *") : null);
}

/**
 * A text link. href opens with Linking (a real anchor on the web); onPress replaces that.
 * current marks the page you are on (aria-current="page"). Nest it inside Text for links in a sentence.
 */
export function Link({ href, onPress, current = false, disabled = false, tone = "accent", style, children, ...rest }) {
  const theme = useTheme(), [pressed, setPressed] = useState(false);
  const color = current ? theme.colors.fg : theme.colors[toneName(tone)] ?? theme.colors.accent;
  const press = (event) => { if (onPress) return onPress(event); if (href && !web) Linking.openURL(href).catch(() => {}); };
  return h(Text, { accessibilityRole: "link", accessibilityState: { disabled, selected: current }, "aria-disabled": disabled, "aria-current": current ? "page" : undefined,
    href: web && href && !onPress && !disabled ? href : undefined, onPress: disabled ? undefined : press, onPressIn: () => setPressed(true), onPressOut: () => setPressed(false),
    hitSlop: 10, suppressHighlighting: true, weight: current ? "semibold" : "medium",
    style: flat({ color, textDecorationLine: current ? "none" : "underline", opacity: disabled ? 0.5 : pressed ? 0.6 : 1 }, style), ...rest }, children);
}

// ---------------------------------------------------------------- icons
/**
 * A square button that shows only an icon. label is required: it is what screen readers announce.
 * icon is a text glyph or an element. shape: square | round. variant and size as Button (default ghost, m).
 */
export function IconButton({ icon, label, variant = "ghost", size = "m", shape = "square", style, children, ...rest }) {
  const theme = useTheme(), dims = CONTROL[size] ?? CONTROL.m, content = icon ?? children;
  return h(Button, { variant, size, accessibilityLabel: label, "aria-label": label,
    style: flat({ width: dims.height, minHeight: dims.height, paddingHorizontal: 0, borderRadius: shape === "round" ? theme.radius.full : theme.radius.s }, style),
    textStyle: { fontSize: dims.glyph, lineHeight: Math.round(dims.glyph * 1.25), fontWeight: "600" }, ...rest }, content);
}

/**
 * Gives an icon a spoken name: the icon itself is hidden from screen readers and label is announced instead.
 * Without a label the icon is decorative and skipped. For a pressable icon use IconButton, which takes the label itself.
 */
export function AccessibleIcon({ label, size = 18, tone, style, children, ...rest }) {
  const theme = useTheme(), color = tone === "muted" ? theme.colors.muted : theme.colors[toneName(tone)] ?? theme.colors.fg;
  const hidden = { "aria-hidden": true, importantForAccessibility: "no-hide-descendants", accessibilityElementsHidden: true };
  return h(View, { ...(label ? { accessible: true, accessibilityRole: "image", accessibilityLabel: label, "aria-label": label } : hidden), style: flat({ alignItems: "center", justifyContent: "center" }, style), ...rest },
    h(View, label ? hidden : null, glyph(children, color, size)));
}

// ---------------------------------------------------------------- alert
/**
 * A message box inside the page. tone: accent | ok | warn | bad (none = neutral). dismissible adds a close button;
 * the alert hides itself, or pass visible and onDismiss to control it. Announced politely, or at once when tone is bad.
 */
export function Alert({ tone, title, icon, dismissible = false, visible, onDismiss, closeLabel = "Close", action, style, children, ...rest }) {
  const theme = useTheme(), c = theme.colors, name = toneName(tone), t = theme.tones[name], [shown, setShown] = useState(true);
  if (!(visible ?? shown)) return null;
  const mark = icon ?? { ok: GLYPH.check, warn: GLYPH.warn, bad: GLYPH.warn }[name] ?? GLYPH.info;
  const urgent = name === "bad";
  return h(View, { accessibilityRole: urgent ? "alert" : undefined, role: urgent ? undefined : "status", accessibilityLiveRegion: urgent ? "assertive" : "polite",
    style: flat({ flexDirection: "row", alignItems: "flex-start", gap: theme.space.s, paddingVertical: theme.space.s, paddingStart: theme.space.m, paddingEnd: dismissible ? theme.space.xs : theme.space.m,
      borderWidth: 1, borderColor: t ? t.soft : c.line, borderRadius: theme.radius.m, backgroundColor: t ? t.tint : c.surface }, style), ...rest },
    icon === null ? null : h(View, { "aria-hidden": true, importantForAccessibility: "no-hide-descendants", style: { width: 22, height: 22, marginTop: 1, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: t ? t.fg : c.muted } },
      isText(mark) ? h(NativeText, { style: { color: t ? t.tint : c.surface, fontSize: 13, lineHeight: 16, fontWeight: "800" } }, mark) : mark),
    h(View, { style: { flex: 1, gap: theme.space["3xs"] } },
      title ? h(Text, { weight: "semibold" }, title) : null,
      isText(children) ? h(Text, { size: "sm", tone: title ? "muted" : undefined, style: title ? null : { paddingTop: 1 } }, children) : children,
      action ? h(View, { style: { marginTop: theme.space.xs, alignItems: "flex-start" } }, action) : null),
    dismissible ? h(Pressable, { onPress: () => { setShown(false); onDismiss?.(); }, accessibilityRole: "button", accessibilityLabel: closeLabel, "aria-label": closeLabel, hitSlop: 8,
      style: ({ pressed }) => ({ width: 28, height: 28, marginTop: -2, borderRadius: theme.radius.s, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? (t ? t.soft : c.sunken) : "transparent" }) },
      glyph(GLYPH.close, c.muted, 20)) : null);
}

// ---------------------------------------------------------------- disclosure
/**
 * Headings that each expand to show a section. items: [{ value, title, content, disabled }].
 * type "single" keeps one open (value is a string or null; collapsible lets the open one close);
 * type "multiple" lets any number open (value is an array). Controlled with value + onChange, or defaultValue.
 */
export function Accordion({ items = [], type = "single", collapsible = false, value, defaultValue, onChange, style, ...rest }) {
  const theme = useTheme(), c = theme.colors, multiple = type === "multiple";
  const [current, setCurrent] = useControlled(value, defaultValue ?? (multiple ? [] : null), onChange);
  const open = Array.isArray(current) ? current : current == null ? [] : [current];
  const toggle = (key) => {
    if (multiple) setCurrent(open.includes(key) ? open.filter((other) => other !== key) : [...open, key]);
    else if (open[0] !== key) setCurrent(key);
    else if (collapsible) setCurrent(null);
  };
  return h(View, { style: flat({ borderWidth: 1, borderColor: c.line, borderRadius: theme.radius.m, backgroundColor: c.surface, overflow: "hidden" }, style), ...rest }, items.map((item, index) => {
    const expanded = open.includes(item.value), off = !!item.disabled;
    return h(View, { key: String(item.value), style: index ? { borderTopWidth: 1, borderTopColor: c.line } : null },
      h(Pressable, { onPress: () => toggle(item.value), disabled: off, accessibilityRole: "button", accessibilityState: { expanded, disabled: off }, "aria-expanded": expanded, "aria-disabled": off,
        style: ({ pressed }) => ({ minHeight: theme.touch + 4, paddingHorizontal: theme.space.m, paddingVertical: theme.space.xs, flexDirection: "row", alignItems: "center", gap: theme.space.s, backgroundColor: pressed ? c.sunken : "transparent", opacity: off ? 0.5 : 1 }) },
        isText(item.title) ? h(Text, { weight: "medium", style: { flex: 1 } }, item.title) : h(View, { style: { flex: 1 } }, item.title),
        h(Chevron, { direction: expanded ? "up" : "down", color: c.muted })),
      expanded ? h(View, { role: "region", accessibilityLabel: isText(item.title) ? String(item.title) : undefined, style: { paddingHorizontal: theme.space.m, paddingBottom: theme.space.m, gap: theme.space.xs } },
        isText(item.content) ? h(Text, { size: "sm", tone: "muted" }, item.content) : item.content) : null);
  }));
}

/**
 * One button that shows or hides a block of content. trigger is the button text, or a function of open
 * ((open) => open ? "Show less" : "Show 3 more"). Controlled with open + onOpenChange, or defaultOpen.
 */
export function Collapsible({ trigger, open, defaultOpen = false, onOpenChange, disabled = false, gap = "xs", style, children, ...rest }) {
  const theme = useTheme(), c = theme.colors, [isOpen, setOpen] = useControlled(open, defaultOpen, onOpenChange);
  const label = typeof trigger === "function" ? trigger(isOpen) : trigger;
  return h(View, { style: flat({ gap: gapOf(theme, gap) }, style), ...rest },
    h(Pressable, { onPress: () => setOpen(!isOpen), disabled, accessibilityRole: "button", accessibilityState: { expanded: isOpen, disabled }, "aria-expanded": isOpen, "aria-disabled": disabled,
      style: ({ pressed }) => ({ minHeight: theme.touch, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: theme.space.xs, opacity: disabled ? 0.5 : pressed ? 0.6 : 1 }) },
      isText(label) ? h(Text, { size: "sm", weight: "semibold", tone: "accent" }, label) : label,
      h(Chevron, { direction: isOpen ? "up" : "down", color: c.accent, size: 7 })),
    isOpen ? h(InRow.Provider, { value: false }, children) : null);
}

// ---------------------------------------------------------------- toggle, button group, toolbar
/**
 * A button that stays pressed. pressed + onChange, or defaultPressed. Give it text children, or an icon with a label.
 * variant: ghost | outline. size: s | m | l.
 */
export function Toggle({ pressed, defaultPressed = false, onChange, icon, label, variant = "ghost", size = "m", disabled = false, style, textStyle, children, ...rest }) {
  const theme = useTheme(), inRow = useContext(InRow), c = theme.colors, dims = CONTROL[size] ?? CONTROL.m;
  const [on, setOn] = useControlled(pressed, defaultPressed, onChange), content = children ?? icon, color = on ? c.accent : c.fg;
  return h(Pressable, { onPress: () => setOn(!on), disabled, accessibilityRole: "button", accessibilityLabel: label, "aria-label": label, accessibilityState: { selected: on, disabled }, "aria-pressed": on, "aria-disabled": disabled,
    hitSlop: dims.height < theme.touch ? (theme.touch - dims.height) / 2 : undefined,
    style: ({ pressed: down }) => flat({ minWidth: dims.height, minHeight: dims.height, paddingHorizontal: Math.round(dims.pad * 0.6), flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
      borderRadius: theme.radius.s, borderWidth: 1, borderColor: variant === "outline" ? (on ? c.accent : c.line) : "transparent", backgroundColor: on ? c.accentSoft : down ? c.sunken : "transparent", opacity: disabled ? 0.5 : 1 }, selfAlign(inRow), style), ...rest },
    isText(content) ? h(Text, { size: children == null ? undefined : dims.text, weight: "semibold", numberOfLines: 1, style: flat({ color }, children == null && { fontSize: dims.glyph, lineHeight: Math.round(dims.glyph * 1.25) }, textStyle) }, content) : content);
}

/**
 * Related buttons joined into one control. options: [{ value, label, icon, accessibilityLabel, disabled }].
 * Without type the buttons are actions (onAction(value)). type "single" picks one (value is a string or null;
 * required keeps one pressed) and "multiple" picks several (value is an array); both call onChange(value).
 * orientation: horizontal | vertical. block stretches it across the row. label names the group.
 */
export function ButtonGroup({ options = [], type, value, defaultValue, onChange, onAction, required = false, orientation = "horizontal", size = "m", block = false, disabled = false, label, style, ...rest }) {
  const theme = useTheme(), inRow = useContext(InRow), c = theme.colors, dims = CONTROL[size] ?? CONTROL.m, multiple = type === "multiple", picks = type === "single" || multiple, vertical = orientation === "vertical";
  const [current, setCurrent] = useControlled(value, defaultValue ?? (multiple ? [] : null), onChange);
  const chosen = Array.isArray(current) ? current : current == null ? [] : [current];
  const press = (key) => {
    onAction?.(key);
    if (!picks) return;
    if (multiple) { const next = chosen.includes(key) ? chosen.filter((other) => other !== key) : [...chosen, key]; if (!(required && !next.length)) setCurrent(next); }
    else if (chosen[0] !== key) setCurrent(key);
    else if (!required) setCurrent(null);
  };
  return h(View, { role: "group", accessibilityLabel: label, "aria-label": label, "aria-orientation": vertical ? "vertical" : undefined,
    style: flat({ flexDirection: vertical ? "column" : "row", borderWidth: 1, borderColor: c.line, borderRadius: theme.radius.s, backgroundColor: c.surface, overflow: "hidden", opacity: disabled ? 0.5 : 1 }, block ? { alignSelf: "stretch" } : selfAlign(inRow), style), ...rest },
    options.map((option, index) => {
      const on = picks && chosen.includes(option.value), off = disabled || !!option.disabled, color = on ? c.accent : c.fg;
      const name = option.accessibilityLabel ?? (isText(option.label) ? String(option.label) : undefined);
      return h(Pressable, { key: String(option.value), onPress: () => press(option.value), disabled: off, accessibilityRole: "button", accessibilityLabel: name, "aria-label": name,
        accessibilityState: picks ? { selected: on, disabled: off } : { disabled: off }, "aria-pressed": picks ? on : undefined, "aria-disabled": off,
        style: ({ pressed }) => flat({ minHeight: Math.max(dims.height, vertical ? theme.touch : 0) - 2, minWidth: dims.height, paddingHorizontal: dims.pad, flexDirection: "row", alignItems: "center", justifyContent: vertical ? "flex-start" : "center", gap: 6,
          backgroundColor: on ? c.accentSoft : pressed ? c.sunken : "transparent", opacity: option.disabled && !disabled ? 0.45 : 1 },
          index > 0 && (vertical ? { borderTopWidth: 1, borderTopColor: c.line } : { borderStartWidth: 1, borderStartColor: c.line }), block && !vertical && { flex: 1 }) },
        option.icon != null ? glyph(option.icon, color, dims.glyph) : null,
        isText(option.label) ? h(Text, { size: dims.text, weight: "medium", numberOfLines: 1, style: flat({ color }, option.textStyle) }, option.label) : option.label);
    }));
}

/** A bar of related controls: IconButton, Toggle, ButtonGroup, text. label names it. Use ToolbarSeparator and ToolbarSpacer between groups. */
export function Toolbar({ label, gap = "2xs", wrap = false, style, children, ...rest }) {
  const theme = useTheme(), c = theme.colors;
  return h(InRow.Provider, { value: true }, h(View, { role: "toolbar", accessibilityLabel: label, "aria-label": label,
    style: flat({ flexDirection: "row", flexWrap: wrap ? "wrap" : "nowrap", alignItems: "center", gap: gapOf(theme, gap), padding: theme.space["2xs"], borderWidth: 1, borderColor: c.line, borderRadius: theme.radius.m, backgroundColor: c.surface }, style), ...rest }, children));
}
/** A short vertical line between groups of a Toolbar. */
export function ToolbarSeparator({ style }) {
  const theme = useTheme();
  return h(Separator, { orientation: "vertical", style: flat({ marginVertical: theme.space.xs, marginHorizontal: theme.space["2xs"] }, style) });
}
/** Pushes what follows it to the far end of a Toolbar. */
export function ToolbarSpacer() {
  return h(View, { style: { flex: 1 } });
}

// ---------------------------------------------------------------- item
/**
 * One row of a list: media, title, description, and actions at the end. With onPress the media and text form one
 * button and the actions stay separate press targets, so a screen reader reaches each of them.
 * media is a text glyph or any element. chevron defaults to true for pressable rows without actions.
 */
export function Item({ media, title, description, actions, onPress, disabled = false, chevron, style, children, ...rest }) {
  const theme = useTheme(), c = theme.colors, pad = theme.space.m, vertical = theme.space.s, arrow = chevron ?? (!!onPress && actions == null);
  const body = [
    media != null ? h(View, { key: "m" }, isText(media)
      ? h(View, { style: { width: 36, height: 36, borderRadius: theme.radius.s, alignItems: "center", justifyContent: "center", backgroundColor: c.sunken } }, glyph(media, c.fg, 17)) : media) : null,
    h(View, { key: "c", style: { flex: 1, gap: 1 } },
      isText(title) ? h(Text, { weight: "medium", numberOfLines: 1 }, title) : title,
      isText(description) ? h(Text, { size: "sm", tone: "muted", numberOfLines: 2 }, description) : description, children),
    arrow ? h(Chevron, { key: "a", direction: "end", color: c.muted, size: 7 }) : null];
  const row = { flex: 1, flexDirection: "row", alignItems: "center", gap: theme.space.s };
  const name = [title, description].filter(isText).join(", ") || undefined;
  return h(InRow.Provider, { value: true }, h(View, { role: "listitem", style: flat({ minHeight: 60, paddingHorizontal: pad, paddingVertical: vertical, flexDirection: "row", alignItems: "center", gap: theme.space.s, opacity: disabled ? 0.5 : 1 }, style), ...rest },
    onPress
      ? h(Pressable, { onPress, disabled, accessibilityRole: "button", accessibilityLabel: name, accessibilityState: { disabled }, "aria-disabled": disabled,
        // The press highlight runs to the row's edges on the sides the button owns.
        style: ({ pressed }) => flat(row, { alignSelf: "stretch", marginVertical: -vertical, paddingVertical: vertical, marginStart: -pad, paddingStart: pad }, actions == null && { marginEnd: -pad, paddingEnd: pad }, pressed && { backgroundColor: c.sunken }) }, body)
      : h(View, { style: row }, body),
    actions != null ? h(View, { style: { flexDirection: "row", alignItems: "center", gap: theme.space.xs } }, actions) : null));
}

/** A bordered list of Item rows with lines between them. label names the list for screen readers. */
export function ItemGroup({ label, divided = true, style, children, ...rest }) {
  const theme = useTheme(), c = theme.colors, rows = Children.toArray(children);
  return h(View, { role: "list", accessibilityLabel: label, "aria-label": label, style: flat({ borderWidth: 1, borderColor: c.line, borderRadius: theme.radius.l, backgroundColor: c.surface, overflow: "hidden" }, style), ...rest },
    rows.flatMap((row, index) => (divided && index ? [h(Separator, { key: `line-${index}`, decorative: true }), row] : [row])));
}

// ---------------------------------------------------------------- theme switch
const SCHEMES = ["light", "dark", "auto"];
// Drawn with View so they look the same in every font: a ring (light), a disc (dark), a half-filled ring (auto).
const schemeIcon = (name) => ({ color, size }) => {
  const box = Math.round(size * 0.8);
  return h(View, { "aria-hidden": true, importantForAccessibility: "no", style: { width: box, height: box, borderRadius: box / 2, borderWidth: 2, borderColor: color, backgroundColor: name === "dark" ? color : "transparent", overflow: "hidden" } },
    name === "auto" ? h(View, { style: { position: "absolute", top: 0, bottom: 0, left: 0, width: "50%", backgroundColor: color } }) : null);
};
const SCHEME_GLYPH = { light: schemeIcon("light"), dark: schemeIcon("dark"), auto: schemeIcon("auto") };
const SCHEME_LABEL = { light: "Light", dark: "Dark", auto: "System" };
/**
 * Chooses "light", "dark" or "auto" (follow the device). It only reports the choice: keep it in state and pass it to
 * <ColibriProvider scheme={value}>; persisting it is up to the app. variant "segmented" shows the three options,
 * "button" is one button that cycles through them as the web kit does. labels renames the options.
 */
export function ThemeSwitch({ value, defaultValue = "auto", onChange, variant = "segmented", size = "m", labels, label = "Theme", block = false, disabled = false, style, ...rest }) {
  const [scheme, setScheme] = useControlled(value, defaultValue, onChange), names = { ...SCHEME_LABEL, ...labels }, theme = useTheme();
  const current = SCHEMES.includes(scheme) ? scheme : "auto";
  if (variant === "button") {
    return h(Button, { variant: "outline", size, block, disabled, accessibilityLabel: `${label}: ${names[current]}`, onPress: () => setScheme(SCHEMES[(SCHEMES.indexOf(current) + 1) % SCHEMES.length]),
      icon: glyph(SCHEME_GLYPH[current], theme.colors.fg, (CONTROL[size] ?? CONTROL.m).glyph), style, ...rest }, `${label}: ${names[current]}`);
  }
  return h(ButtonGroup, { type: "single", required: true, size, block, disabled, label, value: current, onChange: setScheme, style,
    options: SCHEMES.map((name) => ({ value: name, label: names[name], icon: SCHEME_GLYPH[name] })), ...rest });
}

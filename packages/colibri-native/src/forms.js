// Inputs and selection controls: Input and Field (the composable pair), InputGroup, Textarea, PasswordInput,
// PinInput, Select, NativeSelect, Combobox, CheckboxGroup, CheckboxCards, RadioCards, ToggleGroup, SegmentedControl.
// Same vocabulary as the web kit (size="s|m|l", value + onChange, options: [{ value, label }]).
//
// Touch equivalents of web behaviour (ARCHITECTURE.md rule 8):
// - Select and NativeSelect open a bottom Sheet instead of a popup anchored to the trigger.
// - Combobox shows its suggestions in the layout, right under the input, instead of floating above the page:
//   a floating list cannot escape a ScrollView on a phone.
// - There is no hover, typeahead or roving focus; every option is a 44pt row.
import { createContext, createElement as h, forwardRef, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Animated, Keyboard, Platform, Pressable, ScrollView, Text as NativeText, TextInput, View, useWindowDimensions } from "react-native";
import { useTheme } from "./provider.js";
import { web, depth, gapOf, flat, GLYPH } from "./internal.js";
import { Text, Button, Checkbox } from "./components.js";
import { Sheet } from "./overlays.js";

// ---------------------------------------------------------------- shared helpers (local to this file)
const SIZE = { s: { height: 36, pad: 10, text: "sm" }, m: { height: 44, pad: 12, text: "md" }, l: { height: 52, pad: 14, text: "lg" } };
const sizeOf = (size) => SIZE[size] ?? SIZE.m;
const slop = (theme, height) => (height < theme.touch ? (theme.touch - height) / 2 : undefined);
const isText = (node) => typeof node === "string" || typeof node === "number";

/** value + onChange when value is given, otherwise internal state seeded from defaultValue. */
function useControlled(value, defaultValue, onChange) {
  const [inner, setInner] = useState(defaultValue), controlled = value !== undefined;
  const set = useCallback((next) => { if (!controlled) setInner(next); onChange?.(next); }, [controlled, onChange]);
  return [controlled ? value : inner, set];
}

const setRef = (ref, node) => { if (typeof ref === "function") ref(node); else if (ref) ref.current = node; };

/** options may be strings, { value, label, description?, disabled? } or groups { label, options: [...] }. Returns groups. */
function groupsOf(options) {
  const groups = [];
  let loose = null;
  for (const option of options ?? []) {
    if (option && typeof option === "object" && Array.isArray(option.options)) { groups.push({ label: option.label, options: option.options.map(optionOf) }); loose = null; }
    else { if (!loose) groups.push(loose = { label: null, options: [] }); loose.options.push(optionOf(option)); }
  }
  return groups;
}
const optionOf = (option) => (option && typeof option === "object" ? option : { value: option, label: String(option) });
const matches = (option, query) => !query || String(option.label).toLowerCase().includes(query) || String(option.description ?? "").toLowerCase().includes(query);

// Icons drawn with Views, so they look the same on every platform and font.
function Chevron({ color, up = false }) {
  return h(View, { style: { width: 16, height: 16, alignItems: "center", justifyContent: "center" } },
    h(View, { style: { width: 8, height: 8, borderRightWidth: 2, borderBottomWidth: 2, borderColor: color, transform: [{ translateY: up ? 2 : -2 }, { rotate: up ? "225deg" : "45deg" }] } }));
}
function SearchIcon({ color }) {
  return h(View, { style: { width: 16, height: 16 } },
    h(View, { style: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: color } }),
    h(View, { style: { position: "absolute", left: 9, top: 11, width: 6, height: 2, borderRadius: 1, backgroundColor: color, transform: [{ rotate: "45deg" }] } }));
}
/** The tick box and radio dot used by option rows and cards. */
function Mark({ kind, on, theme }) {
  const c = theme.colors, radio = kind === "radio";
  return h(View, { style: { width: 22, height: 22, borderRadius: radio ? 11 : Math.min(6, theme.radius.s), borderWidth: 2, borderColor: on ? c.accent : c.muted, backgroundColor: on && !radio ? c.accent : "transparent", alignItems: "center", justifyContent: "center" } },
    on ? (radio ? h(View, { style: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent } })
      : h(NativeText, { style: { color: c.brandFg, fontSize: 14, lineHeight: 16, fontWeight: "800" } }, GLYPH.check)) : null);
}
/** Extra bottom space for the on-screen keyboard inside a Modal (iOS does not resize modals). */
function useKeyboardInset(active) {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    if (!active || Platform.OS !== "ios") return undefined;
    const show = Keyboard.addListener("keyboardWillShow", (event) => setInset(event.endCoordinates?.height ?? 0));
    const hide = Keyboard.addListener("keyboardWillHide", () => setInset(0));
    return () => { show.remove(); hide.remove(); setInset(0); };
  }, [active]);
  return inset;
}

// ---------------------------------------------------------------- field
const FieldContext = createContext(null);
/** Inside a Field: { label, invalid, required, disabled, labelId, describedBy }. null outside. Use it to wire a custom control. */
export const useField = () => useContext(FieldContext);

/** What a control inside a Field adds to its accessibility props. */
function fieldA11y(field, label) {
  const name = label ?? field?.label;
  if (!field) return { accessibilityLabel: name };
  return { accessibilityLabel: name && field.required && !web ? `${name}, required` : name,
    ...(web ? { "aria-labelledby": label ? undefined : field.labelId, "aria-describedby": field.describedBy, "aria-required": field.required || undefined } : null) };
}

/**
 * Label, description and error around any control. The control inside (Input, Textarea, PasswordInput, PinInput,
 * Select, NativeSelect, Combobox) picks up the label as its accessible name, the invalid and disabled state, and on the
 * web aria-labelledby / aria-describedby. Pressing the label focuses the control. error (a message, or true for no
 * message) marks it invalid.
 */
export function Field({ label, description, error, required = false, disabled = false, gap = "2xs", style, children, ...rest }) {
  const theme = useTheme(), id = useId(), controlRef = useRef(null), invalid = !!error;
  const labelId = `${id}-label`, descriptionId = `${id}-description`, errorId = `${id}-error`;
  const describedBy = [description ? descriptionId : null, error && error !== true ? errorId : null].filter(Boolean).join(" ") || undefined;
  const context = useMemo(() => ({ label: isText(label) ? String(label) : undefined, invalid, required, disabled, labelId, describedBy, controlRef }), [label, invalid, required, disabled, labelId, describedBy]);
  return h(FieldContext.Provider, { value: context },
    h(View, { style: flat({ gap: gapOf(theme, gap) }, style), ...rest },
      label ? h(Text, { nativeID: labelId, size: "sm", weight: "semibold", tone: disabled ? "muted" : undefined, onPress: disabled ? undefined : () => controlRef.current?.focus?.(), suppressHighlighting: true },
        label, required ? h(Text, { size: "sm", weight: "semibold", tone: "bad", accessibilityElementsHidden: true, importantForAccessibility: "no", "aria-hidden": true }, " *") : null) : null,
      children,
      description ? h(Text, { nativeID: descriptionId, size: "xs", tone: "muted" }, description) : null,
      error && error !== true ? h(Text, { nativeID: errorId, size: "xs", tone: "bad", accessibilityRole: "alert", accessibilityLiveRegion: "polite" }, error) : null));
}

// ---------------------------------------------------------------- input
/** A fixed piece attached to the edge of an InputGroup: text, an icon, or a button when onPress is given. */
export function InputAddon({ children, onPress, accessibilityLabel, side, style }) {
  const theme = useTheme(), c = theme.colors;
  const edge = side === "end" ? { borderLeftWidth: 1 } : side === "start" ? { borderRightWidth: 1 } : null;
  const base = { alignSelf: "stretch", paddingHorizontal: theme.space.s, alignItems: "center", justifyContent: "center", backgroundColor: c.sunken, borderColor: c.line };
  const content = isText(children) ? h(Text, { size: "sm", weight: onPress ? "semibold" : "regular", tone: onPress ? "accent" : "muted", numberOfLines: 1 }, children) : children;
  if (!onPress) return h(View, { style: flat(base, edge, style) }, content);
  return h(Pressable, { onPress, accessibilityRole: "button", accessibilityLabel: accessibilityLabel ?? (isText(children) ? String(children) : undefined),
    style: ({ pressed }) => flat(base, edge, pressed && { backgroundColor: c.line }, style) }, content);
}
const addon = (node, side) => (node == null || node === false ? null : isText(node) ? h(InputAddon, { side }, node) : h(View, { style: { alignSelf: "stretch", flexDirection: "row", alignItems: "stretch" } }, node));

/**
 * The bare themed text input. size: s | m | l. invalid paints the error border. leading and trailing are elements shown
 * inside the box (an icon, a unit, a small button). Every TextInput prop passes through; style goes to the box and
 * inputStyle to the text. readOnly blocks editing without the disabled look. Inside a Field it takes the field's label, invalid and disabled state.
 */
export const Input = forwardRef(function Input({ size = "m", invalid, disabled, editable, readOnly = false, leading, trailing, before, after, multiline = false, style, inputStyle, onFocus, onBlur, accessibilityLabel, ...rest }, ref) {
  const theme = useTheme(), c = theme.colors, field = useField(), dims = sizeOf(size), [focused, setFocused] = useState(false), inner = useRef(null);
  const bad = invalid ?? field?.invalid ?? false, off = disabled ?? (editable === false ? true : field?.disabled ?? false);
  const strong = bad || focused, fontSize = theme.text[dims.text];
  return h(Pressable, { onPress: () => inner.current?.focus(), disabled: off, accessible: false, focusable: false, tabIndex: -1,
    style: flat({ minHeight: dims.height, flexDirection: "row", alignItems: multiline ? "flex-start" : "center", overflow: "hidden", borderWidth: strong ? 2 : 1, borderColor: bad ? c.bad : focused ? c.accent : c.line,
      borderRadius: theme.radius.s, backgroundColor: c.surface, opacity: off ? 0.5 : 1 }, web && { cursor: off ? "not-allowed" : "text" }, style) },
    before,
    leading ? h(View, { style: { minHeight: dims.height - 2, paddingLeft: dims.pad - (strong ? 1 : 0), justifyContent: "center" } }, isText(leading) ? h(Text, { size: dims.text, tone: "muted" }, leading) : leading) : null,
    h(TextInput, { ref: (node) => { inner.current = node; if (field) field.controlRef.current = node; setRef(ref, node); }, editable: !off && !readOnly, multiline, placeholderTextColor: c.muted, selectionColor: c.accent,
      ...fieldA11y(field, accessibilityLabel), accessibilityState: { disabled: off }, "aria-invalid": bad || undefined, "aria-disabled": off || undefined, hitSlop: slop(theme, dims.height),
      onFocus: (event) => { setFocused(true); onFocus?.(event); }, onBlur: (event) => { setFocused(false); onBlur?.(event); },
      style: flat({ flex: 1, minWidth: 0, alignSelf: "stretch", minHeight: dims.height - (strong ? 4 : 2), paddingVertical: 0, paddingLeft: leading ? theme.space.xs : before ? dims.pad : dims.pad - (strong ? 1 : 0),
        paddingRight: trailing ? theme.space.xs : after ? dims.pad : dims.pad - (strong ? 1 : 0), color: c.fg, fontSize }, web && { outlineStyle: "none" }, inputStyle), ...rest }),
    trailing ? h(View, { style: { minHeight: dims.height - 2, paddingRight: dims.pad - (strong ? 1 : 0), justifyContent: "center" } }, isText(trailing) ? h(Text, { size: dims.text, tone: "muted" }, trailing) : trailing) : null,
    after);
});

/**
 * An input with add-ons attached to its edges. prefix and suffix are text ("https://", "USD"), or an element such as
 * <InputAddon onPress={copy}>Copy</InputAddon> for an attached button. Everything else is an Input prop.
 */
export const InputGroup = forwardRef(function InputGroup({ prefix, suffix, ...rest }, ref) {
  return h(Input, { ref, before: addon(prefix, "start"), after: addon(suffix, "end"), ...rest });
});

/**
 * Multi-line text. It grows with its content from minRows up to maxRows, then scrolls. With maxLength (or showCount)
 * a character counter sits under the box. Controlled (value) or uncontrolled (defaultValue).
 */
export const Textarea = forwardRef(function Textarea({ value, defaultValue, onChangeText, minRows = 3, maxRows = 8, autoGrow = true, maxLength, showCount = maxLength != null, size = "m", style, inputStyle, ...rest }, ref) {
  const theme = useTheme(), dims = sizeOf(size), fontSize = theme.text[dims.text], lineHeight = Math.round(fontSize * 1.5), padV = theme.space.xs;
  const min = minRows * lineHeight + padV * 2, max = Math.max(min, maxRows * lineHeight + padV * 2), clamp = (height) => Math.min(max, Math.max(min, Math.ceil(height)));
  const [height, setHeight] = useState(min), [typed, setTyped] = useState(String(defaultValue ?? "")), node = useRef(null);
  const current = value !== undefined ? String(value ?? "") : typed;
  // The web has no content-size event that shrinks, so measure the element itself.
  useLayoutEffect(() => {
    const element = node.current;
    if (!web || !autoGrow || !element?.style) return;
    element.style.height = "auto";
    const next = clamp(element.scrollHeight);
    element.style.height = `${next}px`;
    setHeight(next);
  }, [current, autoGrow, min, max]);
  return h(View, { style: flat({ gap: theme.space["2xs"] }, style) },
    h(Input, { ref: (element) => { node.current = element; setRef(ref, element); }, multiline: true, size, value, defaultValue, maxLength, textAlignVertical: "top", scrollEnabled: height >= max,
      onChangeText: (next) => { setTyped(next); onChangeText?.(next); },
      onContentSizeChange: autoGrow && !web ? (event) => setHeight(clamp(event.nativeEvent.contentSize.height + padV * 2)) : undefined,
      inputStyle: flat({ height: autoGrow ? height : min, minHeight: min, paddingTop: padV, paddingBottom: padV, lineHeight }, web && { resize: "none" }, inputStyle), ...rest }),
    showCount ? h(Text, { size: "xs", tone: maxLength != null && current.length >= maxLength ? "bad" : "muted", align: "right", accessibilityLiveRegion: "polite",
      accessibilityLabel: maxLength != null ? `${current.length} of ${maxLength} characters` : `${current.length} characters` }, maxLength != null ? `${current.length} / ${maxLength}` : String(current.length)) : null);
});

/**
 * A password field with a show / hide button (the web kit's toggle-password). The button's label switches between
 * showLabel and hideLabel; visible + onVisibleChange control it from outside.
 */
export const PasswordInput = forwardRef(function PasswordInput({ visible, defaultVisible = false, onVisibleChange, showLabel = "Show", hideLabel = "Hide", size = "m", disabled, ...rest }, ref) {
  const theme = useTheme(), [shown, setShown] = useControlled(visible, defaultVisible, onVisibleChange), dims = sizeOf(size);
  return h(Input, { ref, size, disabled, secureTextEntry: !shown, autoCapitalize: "none", autoCorrect: false, autoComplete: "password", textContentType: "password", ...rest,
    trailing: h(Pressable, { onPress: () => setShown(!shown), disabled, accessibilityRole: "button", accessibilityLabel: shown ? `${hideLabel} password` : `${showLabel} password`, accessibilityState: { disabled: !!disabled }, "aria-pressed": !!shown,
      hitSlop: 10, style: ({ pressed }) => ({ minWidth: 44, minHeight: dims.height - 12, paddingHorizontal: theme.space.xs, marginRight: -theme.space["2xs"], alignItems: "center", justifyContent: "center", borderRadius: theme.radius.s, backgroundColor: pressed ? theme.colors.sunken : "transparent" }) },
      h(Text, { size: "sm", weight: "semibold", tone: "accent" }, shown ? hideLabel : showLabel)) });
});

// ---------------------------------------------------------------- pin input
const PIN = { s: { w: 36, h: 44, text: "md" }, m: { w: 44, h: 52, text: "lg" }, l: { w: 52, h: 60, text: "xl" } };
/**
 * A one-time code or PIN: length boxes fed by one invisible TextInput laid over them, so typing advances, Backspace
 * goes back, and pasting or SMS autofill fills every box on iOS, Android and the web. type: numeric | alphanumeric.
 * mask shows dots. onComplete fires once every box is filled. The ref is the TextInput (focus(), clear()).
 */
export const PinInput = forwardRef(function PinInput({ length = 6, value, defaultValue = "", onChange, onComplete, type = "numeric", mask = false, size = "m", disabled, invalid, autoFocus = false, accessibilityLabel, style, onFocus, onBlur, ...rest }, ref) {
  const theme = useTheme(), c = theme.colors, field = useField(), dims = PIN[size] ?? PIN.m, [focused, setFocused] = useState(false);
  const clean = (raw) => String(raw ?? "").replace(type === "numeric" ? /\D/g : /[^0-9a-z]/gi, "").slice(0, length);
  const [stored, setStored] = useControlled(value, clean(defaultValue), onChange), code = clean(stored);
  const bad = invalid ?? field?.invalid ?? false, off = disabled ?? field?.disabled ?? false, active = Math.min(code.length, length - 1);
  const change = (raw) => { const next = clean(raw); if (next === code) return; setStored(next); if (next.length === length) onComplete?.(next); };
  return h(View, { style: flat({ flexDirection: "row", gap: theme.space.xs, width: "100%", maxWidth: length * dims.w + (length - 1) * theme.space.xs, opacity: off ? 0.5 : 1 }, style) },
    Array.from({ length }, (_, index) => {
      const char = code[index], current = focused && index === active;
      return h(View, { key: index, accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants", "aria-hidden": true,
        style: { flex: 1, height: dims.h, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.s, borderWidth: current || bad ? 2 : 1, borderColor: bad ? c.bad : current ? c.accent : c.line, backgroundColor: c.surface } },
        char ? (mask ? h(View, { style: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.fg } }) : h(Text, { size: dims.text, weight: "semibold" }, char))
          : current ? h(View, { style: { width: 2, height: Math.round(dims.h * 0.42), borderRadius: 1, backgroundColor: c.accent } }) : null);
    }),
    h(TextInput, { ref: (node) => { if (field) field.controlRef.current = node; setRef(ref, node); }, value: code, onChangeText: change, editable: !off, autoFocus, caretHidden: true, contextMenuHidden: false,
      keyboardType: type === "numeric" ? "number-pad" : "default", inputMode: type === "numeric" ? "numeric" : "text", autoComplete: "one-time-code", textContentType: "oneTimeCode", autoCapitalize: "characters", autoCorrect: false, secureTextEntry: mask,
      ...fieldA11y(field, accessibilityLabel ?? (field?.label ? undefined : mask ? "PIN" : "Verification code")), accessibilityState: { disabled: off }, "aria-invalid": bad || undefined, selectionColor: "transparent",
      onFocus: (event) => { setFocused(true); onFocus?.(event); }, onBlur: (event) => { setFocused(false); onBlur?.(event); },
      style: flat({ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, color: "transparent", backgroundColor: "transparent", fontSize: 1, padding: 0 }, web && { outlineStyle: "none", caretColor: "transparent", cursor: off ? "not-allowed" : "pointer" }), ...rest }));
});

// ---------------------------------------------------------------- select
function OptionRow({ option, selected, kind, onPress, theme }) {
  const c = theme.colors, off = !!option.disabled;
  return h(Pressable, { onPress, disabled: off, ...(web ? { role: "option" } : { accessibilityRole: kind === "checkbox" ? "checkbox" : "radio" }), accessibilityLabel: String(option.label),
    accessibilityState: { selected, checked: selected, disabled: off }, "aria-selected": selected, "aria-disabled": off,
    style: ({ pressed }) => ({ minHeight: theme.touch, paddingVertical: theme.space["2xs"], paddingHorizontal: theme.space.xs, flexDirection: "row", alignItems: "center", gap: theme.space.s, borderRadius: theme.radius.s,
      backgroundColor: pressed ? c.sunken : selected && kind !== "checkbox" ? c.accentSoft : "transparent", opacity: off ? 0.45 : 1 }) },
    kind === "checkbox" ? h(Mark, { kind, on: selected, theme }) : null,
    h(View, { style: { flex: 1 } }, h(Text, { weight: selected ? "semibold" : "regular", numberOfLines: 2 }, option.label),
      option.description ? h(Text, { size: "sm", tone: "muted", numberOfLines: 2 }, option.description) : null),
    kind !== "checkbox" && selected ? h(NativeText, { style: { color: c.accent, fontSize: 16, fontWeight: "800" } }, GLYPH.check) : null);
}
const GroupLabel = ({ children, theme }) => h(Text, { size: "xs", weight: "semibold", tone: "muted", accessibilityRole: "header", style: { paddingHorizontal: theme.space.xs, paddingTop: theme.space.xs, paddingBottom: theme.space["2xs"], textTransform: "uppercase", letterSpacing: 0.6 } }, children);

/**
 * A pressable field that opens a sheet with the options. options: strings, { value, label, description?, disabled? }
 * or groups { label, options }. multiple makes value an array and keeps the sheet open until Done. A search box appears
 * when there are more than eight options (force it with searchable). clearable adds a clear button to the field.
 * Controlled (value + onChange) or uncontrolled (defaultValue). Inside a Field it takes the field's label and state.
 */
export const Select = forwardRef(function Select({ options = [], value, defaultValue, onChange, multiple = false, placeholder = "Select…", clearable = false, searchable, searchPlaceholder = "Search", emptyText = "No results found",
  title, doneLabel = "Done", clearLabel = "Clear", size = "m", disabled, invalid, open, onOpenChange, accessibilityLabel, style, testID }, ref) {
  const theme = useTheme(), c = theme.colors, field = useField(), dims = sizeOf(size), window = useWindowDimensions();
  const [selected, setSelected] = useControlled(value, defaultValue ?? (multiple ? [] : null), onChange);
  const [shown, setShown] = useControlled(open, false, onOpenChange), [query, setQuery] = useState(""), inset = useKeyboardInset(shown);
  const groups = useMemo(() => groupsOf(options), [options]), all = useMemo(() => groups.flatMap((group) => group.options), [groups]);
  const picked = multiple ? (Array.isArray(selected) ? selected : []) : selected, has = (optionValue) => (multiple ? picked.includes(optionValue) : picked === optionValue);
  const chosen = all.filter((option) => has(option.value)), empty = chosen.length === 0;
  const bad = invalid ?? field?.invalid ?? false, off = disabled ?? field?.disabled ?? false, search = searchable ?? all.length > 8;
  const needle = query.trim().toLowerCase(), visible = groups.map((group) => ({ ...group, options: group.options.filter((option) => matches(option, needle)) })).filter((group) => group.options.length);
  const show = (next) => { if (!next) setQuery(""); setShown(next); };
  const pick = (option) => { if (multiple) setSelected(has(option.value) ? picked.filter((item) => item !== option.value) : [...picked, option.value]); else { setSelected(option.value); show(false); } };
  const a11y = fieldA11y(field, accessibilityLabel), name = a11y.accessibilityLabel, text = chosen.map((option) => option.label).join(", ");
  const canClear = clearable && !empty && !off;
  return h(View, { style: flat({ opacity: off ? 0.5 : 1 }, style) },
    h(Pressable, { ref: (node) => { if (field) field.controlRef.current = node; setRef(ref, node); }, testID, onPress: () => show(true), disabled: off, accessibilityRole: "combobox", ...a11y,
      accessibilityLabel: web ? a11y.accessibilityLabel : [name, empty ? placeholder : text].filter(Boolean).join(", "), accessibilityValue: web ? undefined : { text: empty ? placeholder : text },
      accessibilityState: { expanded: shown, disabled: off }, "aria-expanded": shown, "aria-haspopup": "listbox", "aria-disabled": off, "aria-invalid": bad || undefined, hitSlop: slop(theme, dims.height),
      style: ({ pressed }) => ({ minHeight: dims.height, paddingLeft: dims.pad - (bad ? 1 : 0), paddingRight: dims.pad - (bad ? 1 : 0), flexDirection: "row", alignItems: "center", gap: theme.space.xs, borderWidth: bad ? 2 : 1,
        borderColor: bad ? c.bad : shown ? c.accent : c.line, borderRadius: theme.radius.s, backgroundColor: pressed ? c.sunken : c.surface }) },
      h(Text, { size: dims.text, tone: empty ? "muted" : undefined, numberOfLines: 1, style: { flex: 1 } }, empty ? placeholder : text),
      multiple && chosen.length > 1 ? h(View, { style: { minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: c.accentSoft } }, h(Text, { size: "xs", weight: "semibold", tone: "accent" }, chosen.length)) : null,
      canClear ? h(View, { style: { width: 24 } }) : null,
      h(Chevron, { color: c.muted })),
    canClear ? h(Pressable, { onPress: () => setSelected(multiple ? [] : null), accessibilityRole: "button", accessibilityLabel: name ? `${clearLabel} ${name}` : clearLabel, hitSlop: 8,
      style: ({ pressed }) => ({ position: "absolute", right: dims.pad + 16 + theme.space.xs - 2, top: (dims.height - 28) / 2, width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? c.sunken : "transparent" }) },
      h(NativeText, { style: { color: c.muted, fontSize: 20, lineHeight: 22, fontWeight: "500" } }, GLYPH.close)) : null,
    h(Sheet, { visible: !!shown, onClose: () => show(false), title: title ?? name ?? (placeholder !== "Select…" ? placeholder : undefined) },
      search ? h(Input, { value: query, onChangeText: setQuery, placeholder: searchPlaceholder, accessibilityLabel: searchPlaceholder, autoCorrect: false, autoCapitalize: "none", returnKeyType: "search", clearButtonMode: "while-editing", leading: h(SearchIcon, { color: c.muted }) }) : null,
      h(ScrollView, { keyboardShouldPersistTaps: "handled", style: { maxHeight: Math.max(160, Math.round(window.height * 0.5) - inset), marginHorizontal: -theme.space.xs }, ...(web ? { role: "listbox", "aria-multiselectable": multiple || undefined, "aria-label": name } : { accessibilityRole: multiple ? undefined : "radiogroup" }) },
        visible.length ? visible.map((group, index) => h(View, { key: group.label ?? `group-${index}` },
          group.label ? h(GroupLabel, { theme }, group.label) : null,
          group.options.map((option) => h(OptionRow, { key: String(option.value), option, selected: has(option.value), kind: multiple ? "checkbox" : "radio", onPress: () => pick(option), theme }))))
          : h(Text, { tone: "muted", align: "center", style: { paddingVertical: theme.space.l } }, emptyText)),
      multiple ? h(View, { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.space.xs, marginTop: theme.space["2xs"] } },
        h(Button, { title: clearLabel, variant: "ghost", disabled: empty, onPress: () => setSelected([]) }),
        h(Button, { title: chosen.length ? `${doneLabel} (${chosen.length})` : doneLabel, onPress: () => show(false) })) : null,
      inset ? h(View, { style: { height: inset } }) : null));
});

/**
 * The simplest picker (the web kit's native-select): one value from a short plain list in a sheet. Same props as Select,
 * without search or multiple selection. Use Select when you need those.
 */
export const NativeSelect = forwardRef(function NativeSelect(props, ref) {
  return h(Select, { ...props, ref, multiple: false, searchable: false });
});

// ---------------------------------------------------------------- combobox
/**
 * A text input with suggestions listed right beneath it. Typing filters options; pressing one selects it.
 * multiple collects the choices as removable chips (value is an array). allowCustom accepts text that is not in the list
 * (press the "Add" row or the keyboard's submit key). onSearch(query) makes it remote: return (a promise of) options, or
 * return nothing and pass new options yourself; loading shows a busy row. onChange receives the value(s).
 */
export const Combobox = forwardRef(function Combobox({ options = [], value, defaultValue, onChange, multiple = false, allowCustom = false, onSearch, searchDelay = 250, loading = false, placeholder, emptyText = "No results found",
  loadingText = "Searching…", addLabel = "Add", size = "m", disabled, invalid, maxHeight = 232, accessibilityLabel, style, onFocus, onBlur, ...rest }, ref) {
  const theme = useTheme(), c = theme.colors, field = useField(), listId = useId();
  const [selected, setSelected] = useControlled(value, defaultValue ?? (multiple ? [] : null), onChange);
  const [remote, setRemote] = useState(null), [busy, setBusy] = useState(false), [open, setOpen] = useState(false), [dirty, setDirty] = useState(false);
  const list = useMemo(() => groupsOf(remote ?? options).flatMap((group) => group.options), [remote, options]);
  const labels = useRef(new Map()); for (const option of list) labels.current.set(option.value, option.label);
  const labelOf = (item) => (item == null ? "" : String(labels.current.get(item) ?? item));
  const picked = multiple ? (Array.isArray(selected) ? selected : []) : selected, has = (item) => (multiple ? picked.includes(item) : picked === item);
  const [text, setText] = useState(multiple ? "" : labelOf(selected)), input = useRef(null), closing = useRef(null), searching = useRef(null), request = useRef(0), alive = useRef(true);
  useEffect(() => () => { alive.current = false; clearTimeout(closing.current); clearTimeout(searching.current); }, []);
  // Follow a value that changes from outside while the list is closed.
  useEffect(() => { if (!multiple && !open) setText(labelOf(selected)); }, [selected, multiple, open]);
  const off = disabled ?? field?.disabled ?? false, needle = text.trim().toLowerCase();
  const visible = onSearch || !dirty ? list : list.filter((option) => matches(option, needle));
  const exact = list.some((option) => String(option.label).toLowerCase() === needle), custom = allowCustom && dirty && needle && !exact && !(multiple && picked.includes(text.trim()));
  const working = loading || busy;
  const search = (query) => {
    if (!onSearch) return;
    clearTimeout(searching.current);
    searching.current = setTimeout(() => {
      const ticket = ++request.current, result = onSearch(query);
      if (!result || typeof result.then !== "function") { if (Array.isArray(result)) setRemote(result); return; }
      setBusy(true);
      result.then((found) => { if (alive.current && ticket === request.current) { if (Array.isArray(found)) setRemote(found); setBusy(false); } },
        () => { if (alive.current && ticket === request.current) setBusy(false); });
    }, searchDelay);
  };
  const type = (next) => { setText(next); setDirty(true); setOpen(true); search(next); if (!multiple && !allowCustom && next === "" && selected != null) setSelected(null); };
  const commit = (item) => {
    clearTimeout(closing.current);
    if (multiple) { setSelected(has(item) ? picked.filter((entry) => entry !== item) : [...picked, item]); setText(""); setDirty(false); input.current?.focus(); search(""); }
    else { setSelected(item); setText(labelOf(item)); setDirty(false); setOpen(false); input.current?.blur(); }
  };
  const submit = () => { const entry = text.trim(); if (custom) commit(entry); else if (dirty && visible.length === 1 && !visible[0].disabled) commit(visible[0].value); };
  const close = () => { setOpen(false); setDirty(false); if (onSearch) { clearTimeout(searching.current); request.current++; setRemote(null); setBusy(false); } if (multiple) setText(""); else if (allowCustom && dirty && text.trim()) setSelected(text.trim()); else setText(labelOf(selected)); };
  const a11y = fieldA11y(field, accessibilityLabel);
  return h(View, { style: flat({ gap: theme.space["2xs"] }, style) },
    multiple && picked.length ? h(View, { style: { flexDirection: "row", flexWrap: "wrap", gap: theme.space["2xs"], marginBottom: theme.space["3xs"] } }, picked.map((item) =>
      h(View, { key: String(item), style: { flexDirection: "row", alignItems: "center", paddingLeft: 10, borderRadius: theme.radius.full, backgroundColor: c.accentSoft } },
        h(Text, { size: "sm", weight: "medium", tone: "accent", numberOfLines: 1 }, labelOf(item)),
        h(Pressable, { onPress: () => setSelected(picked.filter((entry) => entry !== item)), disabled: off, accessibilityRole: "button", accessibilityLabel: `Remove ${labelOf(item)}`, hitSlop: 8,
          style: ({ pressed }) => ({ width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.6 : 1 }) },
          h(NativeText, { style: { color: c.accent, fontSize: 18, lineHeight: 20, fontWeight: "600" } }, GLYPH.close))))) : null,
    h(Input, { ref: (node) => { input.current = node; setRef(ref, node); }, size, disabled, invalid, value: text, onChangeText: type, placeholder, autoCorrect: false, autoCapitalize: "none", accessibilityRole: "combobox", ...a11y,
      "aria-expanded": open, "aria-autocomplete": "list", "aria-controls": web && open ? listId : undefined, accessibilityState: { expanded: open, disabled: off }, returnKeyType: custom ? "done" : "search", onSubmitEditing: submit, blurOnSubmit: !multiple,
      onFocus: (event) => { clearTimeout(closing.current); setOpen(true); onFocus?.(event); },
      // Wait a moment before closing, so a press on a suggestion lands before the list goes away.
      onBlur: (event) => { clearTimeout(closing.current); closing.current = setTimeout(() => { if (alive.current) close(); }, 160); onBlur?.(event); },
      trailing: h(Pressable, { onPress: () => { if (open) input.current?.blur(); else input.current?.focus(); }, disabled: off, accessibilityRole: "button", accessibilityLabel: open ? "Hide options" : "Show options", hitSlop: 12,
        style: { width: 28, height: 28, alignItems: "center", justifyContent: "center" } }, h(Chevron, { color: c.muted, up: open })), ...rest }),
    open ? h(View, { style: { borderWidth: 1, borderColor: c.line, borderRadius: theme.radius.m, backgroundColor: c.surface, overflow: "hidden", ...depth(theme.shadow.m) } },
      h(ScrollView, { nativeID: listId, keyboardShouldPersistTaps: "always", nestedScrollEnabled: true, style: { maxHeight }, contentContainerStyle: { padding: theme.space["2xs"] }, ...(web ? { role: "listbox", "aria-label": a11y.accessibilityLabel, "aria-multiselectable": multiple || undefined } : null) },
        visible.map((option) => h(OptionRow, { key: String(option.value), option, selected: has(option.value), kind: multiple ? "checkbox" : "radio", onPress: () => commit(option.value), theme })),
        custom ? h(Pressable, { onPress: () => commit(text.trim()), accessibilityRole: "button", accessibilityLabel: `${addLabel} ${text.trim()}`,
          style: ({ pressed }) => ({ minHeight: theme.touch, paddingHorizontal: theme.space.xs, flexDirection: "row", alignItems: "center", gap: theme.space.xs, borderRadius: theme.radius.s, backgroundColor: pressed ? c.sunken : "transparent" }) },
          h(Text, { tone: "accent", weight: "semibold" }, GLYPH.plus), h(Text, { style: { flex: 1 }, numberOfLines: 1 }, `${addLabel} “${text.trim()}”`)) : null,
        working ? h(Text, { size: "sm", tone: "muted", accessibilityLiveRegion: "polite", style: { padding: theme.space.s } }, loadingText)
          : !visible.length && !custom ? h(Text, { size: "sm", tone: "muted", accessibilityLiveRegion: "polite", style: { padding: theme.space.s } }, emptyText) : null)) : null);
});

// ---------------------------------------------------------------- groups of choices
/** The label, description and error that sit around a group of choices. */
function Legend({ label, description, error, theme, style, children, role, disabled, rest }) {
  return h(View, { accessibilityRole: role, accessibilityLabel: isText(label) ? String(label) : rest?.accessibilityLabel, ...(web && !role ? { role: "group" } : null), "aria-disabled": disabled || undefined, "aria-invalid": error ? true : undefined,
    style: flat({ gap: theme.space["2xs"] }, style), ...rest },
    label ? h(Text, { size: "sm", weight: "semibold" }, label) : null,
    description ? h(Text, { size: "xs", tone: "muted" }, description) : null,
    children,
    error ? h(Text, { size: "xs", tone: "bad", accessibilityRole: "alert", accessibilityLiveRegion: "polite" }, error) : null);
}
const toggled = (list, item) => (list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item]);

/**
 * A labelled list of checkboxes that reports one combined value: an array of the checked option values.
 * direction: column | row. options: strings or { value, label, disabled? }.
 */
export function CheckboxGroup({ options = [], value, defaultValue = [], onChange, label, description, error, disabled = false, direction = "column", style, ...rest }) {
  const theme = useTheme(), [stored, setStored] = useControlled(value, defaultValue, onChange), checked = Array.isArray(stored) ? stored : [];
  return h(Legend, { label, description, error, theme, style, disabled, rest },
    h(View, { style: direction === "row" ? { flexDirection: "row", flexWrap: "wrap", columnGap: theme.space.l } : { gap: theme.space["3xs"] } }, options.map(optionOf).map((option) =>
      h(Checkbox, { key: String(option.value), label: option.label, checked: checked.includes(option.value), disabled: disabled || option.disabled, onChange: () => setStored(toggled(checked, option.value)) }))));
}

function ChoiceCards({ kind, options, selected, onPick, columns, disabled, theme }) {
  const c = theme.colors, gap = theme.space.xs;
  return h(View, { style: { flexDirection: "row", flexWrap: "wrap", gap } }, options.map((option) => {
    const on = selected(option.value), off = disabled || !!option.disabled;
    return h(Pressable, { key: String(option.value), onPress: () => onPick(option.value), disabled: off, accessibilityRole: kind, accessibilityLabel: [option.title ?? option.label, option.description].filter(isText).join(", ") || undefined,
      accessibilityState: { checked: on, selected: on, disabled: off }, "aria-checked": on, "aria-disabled": off,
      style: ({ pressed }) => ({ flexGrow: 1, flexBasis: columns > 1 ? `${Math.floor(100 / columns) - 4}%` : "100%", minHeight: theme.touch + theme.space.s, padding: theme.space.s - (on ? 1 : 0), flexDirection: "row", alignItems: "flex-start", gap: theme.space.s,
        borderWidth: on ? 2 : 1, borderColor: on ? c.accent : c.line, borderRadius: theme.radius.m, backgroundColor: on ? c.accentSoft : pressed ? c.sunken : c.surface, opacity: off ? 0.5 : 1 }) },
      h(Mark, { kind, on, theme }),
      h(View, { style: { flex: 1, gap: 1 } },
        isText(option.title ?? option.label) ? h(Text, { weight: "semibold" }, option.title ?? option.label) : option.title,
        isText(option.description) ? h(Text, { size: "sm", tone: "muted" }, option.description) : option.description ?? null),
      option.trailing != null ? h(View, { style: { alignSelf: "center" } }, isText(option.trailing) ? h(Text, { size: "sm", weight: "semibold", tone: on ? "accent" : "muted" }, option.trailing) : option.trailing) : null);
  }));
}

/**
 * Large selectable cards where several can be chosen. options: [{ value, title, description?, trailing?, disabled? }].
 * value is an array. columns lays the cards out side by side (1 by default).
 */
export function CheckboxCards({ options = [], value, defaultValue = [], onChange, label, description, error, columns = 1, disabled = false, style, ...rest }) {
  const theme = useTheme(), [stored, setStored] = useControlled(value, defaultValue, onChange), checked = Array.isArray(stored) ? stored : [];
  return h(Legend, { label, description, error, theme, style, disabled, rest },
    h(ChoiceCards, { kind: "checkbox", options, columns, disabled, theme, selected: (item) => checked.includes(item), onPick: (item) => setStored(toggled(checked, item)) }));
}

/** Large selectable cards where exactly one is chosen. Same options as CheckboxCards; value is one option value. */
export function RadioCards({ options = [], value, defaultValue = null, onChange, label, description, error, columns = 1, disabled = false, style, ...rest }) {
  const theme = useTheme(), [stored, setStored] = useControlled(value, defaultValue, onChange);
  return h(Legend, { label, description, error, theme, style, disabled, role: "radiogroup", rest },
    h(ChoiceCards, { kind: "radio", options, columns, disabled, theme, selected: (item) => stored === item, onPick: setStored }));
}

/**
 * A joined row of toggle buttons. type="single": value is one option value, or null when the pressed button is pressed
 * again (set required to keep one always on). type="multiple": value is an array. options: [{ value, label?, icon?,
 * accessibilityLabel?, disabled? }]; give icon-only buttons an accessibilityLabel.
 */
export function ToggleGroup({ options = [], type = "single", value, defaultValue, onChange, required = false, size = "m", disabled = false, block = false, accessibilityLabel, style, ...rest }) {
  const theme = useTheme(), c = theme.colors, many = type === "multiple", dims = sizeOf(size);
  const [stored, setStored] = useControlled(value, defaultValue ?? (many ? [] : null), onChange), list = many ? (Array.isArray(stored) ? stored : []) : null;
  const press = (item) => { if (many) { const next = toggled(list, item); if (!(required && !next.length)) setStored(next); } else if (stored !== item) setStored(item); else if (!required) setStored(null); };
  return h(View, { accessibilityLabel, ...(web ? { role: "group" } : null), style: flat({ flexDirection: "row", alignSelf: block ? "stretch" : "flex-start", borderWidth: 1, borderColor: c.line, borderRadius: theme.radius.s, backgroundColor: c.surface, overflow: "hidden", opacity: disabled ? 0.5 : 1 }, style), ...rest },
    options.map(optionOf).map((option, index) => {
      const on = many ? list.includes(option.value) : stored === option.value, off = disabled || !!option.disabled;
      return h(Pressable, { key: String(option.value), onPress: () => press(option.value), disabled: off, accessibilityRole: "button", accessibilityLabel: option.accessibilityLabel ?? (isText(option.label) ? String(option.label) : undefined),
        accessibilityState: { selected: on, disabled: off }, "aria-pressed": on, "aria-disabled": off, hitSlop: slop(theme, dims.height),
        style: ({ pressed }) => ({ flexGrow: block ? 1 : 0, minWidth: dims.height, minHeight: dims.height - 2, paddingHorizontal: dims.pad, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: theme.space["2xs"],
          borderLeftWidth: index ? 1 : 0, borderLeftColor: c.line, backgroundColor: on ? c.accentSoft : pressed ? c.sunken : "transparent", opacity: option.disabled && !disabled ? 0.45 : 1 }) },
        isText(option.icon) ? h(Text, { size: dims.text, weight: "semibold", tone: on ? "accent" : undefined }, option.icon) : option.icon ?? null,
        isText(option.label) ? h(Text, { size: "sm", weight: on ? "semibold" : "medium", tone: on ? "accent" : undefined, numberOfLines: 1 }, option.label) : option.label ?? null);
    }));
}

const SEGMENT = { s: { height: 28, text: "xs" }, m: { height: 36, text: "sm" }, l: { height: 44, text: "md" } };
/**
 * A compact pill of two to five options where exactly one is selected. It is the same control as Tabs (same value,
 * onChange and options props, so one can replace the other) for choosing a value rather than a view: it is announced as
 * a radio group, comes in size s | m | l, takes an optional icon per option ({ value, label, icon }) and slides its
 * highlight to the selected segment.
 */
export function SegmentedControl({ options = [], value, defaultValue, onChange, size = "m", disabled = false, accessibilityLabel, style, ...rest }) {
  const theme = useTheme(), c = theme.colors, dims = SEGMENT[size] ?? SEGMENT.m, items = options.map(optionOf), pad = 3, gap = 2;
  const [stored, setStored] = useControlled(value, defaultValue ?? items[0]?.value, onChange), index = items.findIndex((option) => option.value === stored);
  const [width, setWidth] = useState(0), segment = width && items.length ? (width - 2 - pad * 2 - gap * (items.length - 1)) / items.length : 0;
  const slide = useRef(new Animated.Value(0)).current, placed = useRef(false), target = Math.max(0, index) * (segment + gap);
  useEffect(() => {
    if (!segment) return;
    if (!placed.current) { slide.setValue(target); placed.current = true; return; }
    Animated.spring(slide, { toValue: target, useNativeDriver: !web, speed: 22, bounciness: 4 }).start();
  }, [target, segment, slide]);
  const radius = Math.max(2, theme.radius.m - pad);
  return h(View, { accessibilityRole: "radiogroup", accessibilityLabel, onLayout: (event) => setWidth(event.nativeEvent.layout.width),
    style: flat({ flexDirection: "row", padding: pad, gap, borderRadius: theme.radius.m, borderWidth: 1, borderColor: c.line, backgroundColor: c.sunken, opacity: disabled ? 0.5 : 1 }, style), ...rest },
    segment && index >= 0 ? h(Animated.View, { pointerEvents: "none", style: { position: "absolute", top: pad, left: pad, width: segment, height: dims.height, borderRadius: radius, backgroundColor: c.surface, transform: [{ translateX: slide }], ...depth(theme.shadow.s) } }) : null,
    items.map((option) => {
      const on = option.value === stored, off = disabled || !!option.disabled;
      return h(Pressable, { key: String(option.value), onPress: () => { if (!on) setStored(option.value); }, disabled: off, accessibilityRole: "radio", accessibilityLabel: option.accessibilityLabel ?? (isText(option.label) ? String(option.label) : undefined),
        accessibilityState: { checked: on, selected: on, disabled: off }, "aria-checked": on, "aria-disabled": off, hitSlop: slop(theme, dims.height),
        style: { flex: 1, minHeight: dims.height, paddingHorizontal: theme.space.xs, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: theme.space["2xs"], borderRadius: radius,
          backgroundColor: on && !segment ? c.surface : "transparent", opacity: option.disabled && !disabled ? 0.45 : 1 } },
        isText(option.icon) ? h(Text, { size: dims.text, weight: "semibold", tone: on ? undefined : "muted" }, option.icon) : option.icon ?? null,
        isText(option.label) ? h(Text, { size: dims.text, weight: "semibold", tone: on ? undefined : "muted", numberOfLines: 1 }, option.label) : option.label ?? null);
    }));
}

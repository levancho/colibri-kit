// Navigation layouts for phone apps: a navigation drawer and the screens built around one.
//
// Everything is built on NavShell: an app bar (menu button, the title of the current section, actions), a
// navigation drawer that slides in from the left edge over a backdrop (Modal + Animated), and the content.
// The drawer is full height and about 84% of the screen wide; it closes on the backdrop, the back button and
// when an item is chosen. From 768pt of window width the same panel is docked beside the content instead.
//
// The layouts are compositions of NavShell with NavSection, NavItem, NavList, NavSearch, NavSwitcher, NavUser and
// NavCalendar: SectionedDrawer, NestedDrawer, WorkspaceDrawer, MailLayout, CalendarDrawer, FileTreeDrawer, and
// SettingsSheet (a bottom sheet with its own navigation).
//
// Honest scope: these come from the web kit's desktop sidebars. What only exists on a wide screen (an icon rail,
// a floating or inset panel, a sidebar on the right, two sidebars, a site header, submenus that fly out on hover)
// has no phone form and is not here. Icons are text glyphs, initials or shapes drawn with View.
// Written against the basics only.
import { Children, createContext, createElement as h, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, BackHandler, Modal, Pressable, ScrollView, Text as NativeText, TextInput, View, useWindowDimensions } from "react-native";
import { useTheme } from "./provider.js";
import { toneName } from "./theme.js";
import { web, depth, flat, GLYPH } from "./internal.js";
import { Text, Heading, Avatar, Badge, Button, Divider } from "./components.js";

// ---------------------------------------------------------------- helpers
const NavContext = createContext({ level: 0, tree: false, close: null });
const MenuContext = createContext({ close: null });
/** Inside a NavShell drawer: { level, tree, close() }. close is null where the panel is docked and stays open. */
export const useNav = () => useContext(NavContext);

const FILL = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 };

function useControlled(value, fallback, onChange) {
  const [inner, setInner] = useState(fallback), controlled = value !== undefined;
  const set = useCallback((next) => { if (!controlled) setInner(next); onChange?.(next); }, [controlled, onChange]);
  return [controlled ? value : inner, set];
}
function useSelection(selected, defaultSelected, onSelect) {
  const [inner, setInner] = useState(defaultSelected);
  return [selected !== undefined ? selected : inner, (id, item) => { if (selected === undefined) setInner(id); onSelect?.(id, item); }];
}
/** Runs 0 → 1 while visible and back, and keeps the element mounted until it has left. Transform and opacity only. */
function usePresence(visible, enter = 260, leave = 200) {
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current, [mounted, setMounted] = useState(!!visible);
  useEffect(() => {
    if (visible) setMounted(true);
    const run = Animated.timing(progress, { toValue: visible ? 1 : 0, duration: visible ? enter : leave, useNativeDriver: !web });
    run.start(({ finished }) => { if (finished && !visible) setMounted(false); });
    return () => run.stop();
  }, [visible, progress, enter, leave]);
  return [progress, mounted];
}

/** Role, label and state both ways (accessibilityState and aria-*), so they reach iOS, Android and the web. */
function a11y(role, label, state = {}) {
  const props = { accessibilityRole: role, accessibilityLabel: label, accessibilityState: state };
  for (const key of ["selected", "expanded", "checked", "disabled"]) if (key in state) props[`aria-${key}`] = state[key];
  return props;
}

const firstLetters = (label) => String(label ?? "").trim().split(/\s+/).slice(0, 2).map((word) => word[0] ?? "").join("").toUpperCase();

/** A text glyph or initials centred in a square, or any element as it is. */
function Glyph({ icon, color, box = 24, size }) {
  if (icon == null || icon === false) return null;
  if (typeof icon !== "string" && typeof icon !== "number") return h(View, { style: { width: box, height: box, alignItems: "center", justifyContent: "center" } }, icon);
  const text = String(icon), fontSize = size ?? (text.length > 1 ? 11 : 18);
  return h(View, { style: { width: box, height: box, alignItems: "center", justifyContent: "center" } },
    h(NativeText, { allowFontScaling: false, style: { color, fontSize, lineHeight: box, fontWeight: text.length > 1 ? "700" : "500", textAlign: "center" } }, text));
}

/** An arrow head drawn with two borders, so it looks the same on every platform. direction: right | down | left | up. */
function Chevron({ direction = "right", color, size = 8, weight = 2 }) {
  const turn = { right: "-45deg", down: "45deg", left: "135deg", up: "-135deg" }[direction], shift = size / 4;
  const nudge = { right: { translateX: -shift }, left: { translateX: shift }, down: { translateY: -shift }, up: { translateY: shift } }[direction];
  return h(View, { style: { width: 16, height: 16, alignItems: "center", justifyContent: "center" } },
    h(View, { style: { width: size, height: size, borderRightWidth: weight, borderBottomWidth: weight, borderColor: color, transform: [nudge, { rotate: turn }] } }));
}
const MenuIcon = ({ color }) => h(View, { style: { width: 20, gap: 4 } }, [0, 1, 2].map((line) => h(View, { key: line, style: { height: 2, borderRadius: 1, backgroundColor: color } })));

function FolderIcon({ color, fill }) {
  return h(View, { style: { width: 18, height: 15, justifyContent: "flex-end" } },
    h(View, { style: { position: "absolute", top: 0, left: 0, width: 9, height: 5, borderTopLeftRadius: 2, borderTopRightRadius: 2, backgroundColor: color } }),
    h(View, { style: { height: 12, borderRadius: 2, borderWidth: 1.5, borderColor: color, backgroundColor: fill } }));
}
function FileIcon({ color }) {
  return h(View, { style: { width: 13, height: 16, borderRadius: 2, borderWidth: 1.5, borderColor: color, justifyContent: "center", gap: 2, paddingHorizontal: 2 } },
    h(View, { style: { height: 1.5, backgroundColor: color } }), h(View, { style: { height: 1.5, width: 4, backgroundColor: color } }));
}

// ---------------------------------------------------------------- app bar
/** A round 44pt button for the app bar. icon is a text glyph or an element; label is what a screen reader says. */
export function NavBarButton({ label, icon, onPress, expanded, disabled = false, style, testID }) {
  const theme = useTheme(), c = theme.colors;
  return h(Pressable, { onPress, disabled, testID, ...a11y("button", label, expanded === undefined ? { disabled } : { expanded, disabled }),
    style: ({ pressed, hovered }) => flat({ width: theme.touch, height: theme.touch, borderRadius: theme.radius.full, alignItems: "center", justifyContent: "center", opacity: disabled ? 0.5 : 1, backgroundColor: pressed || hovered ? c.line : "transparent" }, style) },
  h(Glyph, { icon, color: c.fg, size: 22 }));
}

function Bar({ leading, title, subtitle, header, actions, top = 0 }) {
  const theme = useTheme(), c = theme.colors;
  return h(View, { style: { paddingTop: top, backgroundColor: c.bg, borderBottomWidth: 1, borderBottomColor: c.line } },
    h(View, { style: { minHeight: 56, flexDirection: "row", alignItems: "center", paddingHorizontal: theme.space["2xs"] } },
      leading,
      h(View, { style: { flex: 1, minWidth: 0, paddingLeft: leading ? theme.space["2xs"] : theme.space.s, paddingRight: theme.space.xs } }, header ?? [
        h(Text, { key: "title", size: "lg", weight: "semibold", numberOfLines: 1, accessibilityRole: "header", style: { letterSpacing: -0.2 } }, title ?? ""),
        subtitle ? h(Text, { key: "subtitle", size: "xs", tone: "muted", numberOfLines: 1, style: { lineHeight: 16 } }, subtitle) : null]),
      actions != null ? h(View, { style: { flexDirection: "row", alignItems: "center", paddingRight: theme.space["2xs"] } }, actions) : null));
}

// ---------------------------------------------------------------- NavPopover and NavMenuItem
/**
 * A small menu card anchored to its trigger, for the choices behind a switcher or an account row.
 * trigger is a function ({ onPress, expanded }) => element; children is the content, or a function (close) => content.
 * placement: bottom | top, flipped when it does not fit. matchWidth makes the card as wide as the trigger.
 */
export function NavPopover({ trigger, children, placement = "bottom", align = "start", width = 240, matchWidth = false, open, defaultOpen = false, onOpenChange, label, style }) {
  const theme = useTheme(), win = useWindowDimensions(), anchorRef = useRef(null), outer = useContext(NavContext);
  const [shown, setShown] = useControlled(open, defaultOpen, onOpenChange);
  const [anchor, setAnchor] = useState(null), [size, setSize] = useState(null);
  useEffect(() => {
    if (!shown) { setAnchor(null); setSize(null); return; }
    anchorRef.current?.measureInWindow((x, y, w, ht) => setAnchor({ x, y, width: w, height: ht }));
  }, [shown]);
  const close = useCallback(() => setShown(false), [setShown]);
  const menu = useMemo(() => ({ close }), [close]);
  const nav = useMemo(() => ({ level: 0, tree: false, close: () => { close(); outer.close?.(); } }), [close, outer]);
  const margin = theme.space.xs, gap = 6, cardWidth = Math.min(matchWidth && anchor ? Math.max(anchor.width, 200) : width, win.width - margin * 2);
  let spot = { left: 0, top: 0, opacity: 0 };
  if (anchor && size) {
    let where = placement;
    if (where === "bottom" && anchor.y + anchor.height + gap + size.height > win.height - margin && anchor.y - gap - size.height >= margin) where = "top";
    if (where === "top" && anchor.y - gap - size.height < margin) where = "bottom";
    const left = align === "end" ? anchor.x + anchor.width - size.width : align === "center" ? anchor.x + (anchor.width - size.width) / 2 : anchor.x;
    const top = where === "top" ? anchor.y - gap - size.height : anchor.y + anchor.height + gap;
    spot = { left: Math.max(margin, Math.min(left, win.width - size.width - margin)), top: Math.max(margin, Math.min(top, win.height - size.height - margin)), opacity: 1 };
  }
  return h(View, { ref: anchorRef, collapsable: false, style },
    trigger?.({ onPress: () => setShown(!shown), expanded: !!shown }),
    shown && anchor ? h(Modal, { visible: true, transparent: true, animationType: "fade", onRequestClose: close, statusBarTranslucent: true },
      h(View, { style: { flex: 1 } },
        h(Pressable, { onPress: close, accessibilityLabel: "Close", style: FILL }),
        h(View, { onLayout: (event) => { const { width: w, height: ht } = event.nativeEvent.layout; if (!size || size.width !== w || size.height !== ht) setSize({ width: w, height: ht }); },
          accessibilityViewIsModal: true, accessibilityRole: "menu", accessibilityLabel: label,
          style: { position: "absolute", ...spot, width: cardWidth, maxHeight: win.height - margin * 2, borderRadius: theme.radius.m, borderWidth: 1, borderColor: theme.colors.line, backgroundColor: theme.colors.surface, overflow: "hidden", ...depth(theme.shadow.l) } },
        h(ScrollView, { contentContainerStyle: { padding: theme.space["2xs"], gap: 2 }, keyboardShouldPersistTaps: "handled" },
          h(MenuContext.Provider, { value: menu }, h(NavContext.Provider, { value: nav }, typeof children === "function" ? children(close) : children)))))) : null);
}

/** One row of a NavPopover menu. Closes the menu after onPress unless keepOpen. tone colours the label (bad for "Log out"). */
export function NavMenuItem({ label, icon, description, trailing, selected, tone, disabled = false, keepOpen = false, onPress, style }) {
  const theme = useTheme(), c = theme.colors, menu = useContext(MenuContext), color = c[toneName(tone)] ?? c.fg;
  return h(Pressable, { disabled, onPress: () => { onPress?.(); if (!keepOpen) menu.close?.(); },
    ...a11y("menuitem", label, selected === undefined ? { disabled } : { selected, disabled }),
    style: ({ pressed, hovered }) => flat({ minHeight: theme.touch, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.s, flexDirection: "row", alignItems: "center", gap: 10, opacity: disabled ? 0.5 : 1, backgroundColor: pressed || hovered ? c.sunken : "transparent" }, style) },
  icon != null ? h(Glyph, { icon, color: tone ? color : c.muted }) : null,
  h(View, { style: { flex: 1, minWidth: 0 } },
    h(Text, { size: "sm", weight: "medium", numberOfLines: 1, style: { color } }, label),
    description ? h(Text, { size: "xs", tone: "muted", numberOfLines: 1 }, description) : null),
  trailing != null ? (typeof trailing === "string" ? h(Text, { size: "xs", tone: "muted" }, trailing) : trailing) : null,
  selected ? h(Glyph, { icon: GLYPH.check, color: c.accent, box: 20, size: 15 }) : null);
}

const MenuLabel = ({ children }) => h(Text, { size: "xs", weight: "semibold", tone: "muted", style: { paddingHorizontal: 10, paddingTop: 6, paddingBottom: 2 } }, children);

// ---------------------------------------------------------------- NavItem
/**
 * One navigation row, 44pt high: icon, label, badge, selected state. Choosing it closes the drawer.
 * Nested NavItem children make a group that folds open and closed (expanded / defaultExpanded / onExpandedChange).
 */
export function NavItem({ label, icon, badge, trailing, selected = false, active = false, disabled = false, onPress, children, expanded, defaultExpanded = false, onExpandedChange, role = "button", accessibilityLabel, style, testID }) {
  const theme = useTheme(), c = theme.colors, ctx = useContext(NavContext);
  const kids = Children.toArray(children), nested = kids.length > 0, sub = ctx.level > 0;
  const [isOpen, setOpen] = useControlled(expanded, defaultExpanded, onExpandedChange);
  const below = useMemo(() => ({ ...ctx, level: ctx.level + 1 }), [ctx]);
  const name = accessibilityLabel ?? (typeof label === "string" ? label : undefined);
  const tint = selected ? c.accent : c.fg, pad = ctx.tree ? 8 : 12, gap = ctx.tree ? 8 : 12;
  const content = [
    ctx.tree ? (nested ? h(Chevron, { key: "c0", direction: isOpen ? "down" : "right", color: c.muted, size: 7 }) : h(View, { key: "c0", style: { width: 16 } })) : null,
    icon != null ? h(Glyph, { key: "i", icon, color: selected || active ? c.accent : c.muted }) : null,
    typeof label === "string" ? h(Text, { key: "l", size: sub || ctx.tree ? "sm" : "md", weight: selected || active ? "semibold" : sub || ctx.tree ? "regular" : "medium", numberOfLines: 1, style: { flex: 1, color: tint } }, label) : h(View, { key: "l", style: { flex: 1, minWidth: 0 } }, label),
    badge != null && badge !== false ? (typeof badge === "string" || typeof badge === "number" ? h(Badge, { key: "b", tone: selected ? "accent" : undefined, style: flat({ alignSelf: "center" }, !selected && { backgroundColor: c.line }) }, badge) : h(View, { key: "b" }, badge)) : null,
    trailing != null ? h(View, { key: "t" }, typeof trailing === "string" ? h(Text, { size: "xs", tone: "muted" }, trailing) : trailing) : null,
    nested && !ctx.tree ? h(Chevron, { key: "c1", direction: isOpen ? "down" : "right", color: c.muted }) : null,
  ];
  const rowStyle = ({ pressed, hovered }) => flat({ minHeight: theme.touch, paddingHorizontal: pad, paddingVertical: 4, borderRadius: theme.radius.m, flexDirection: "row", alignItems: "center", gap, opacity: disabled ? 0.5 : 1,
    backgroundColor: selected ? c.accentSoft : pressed || hovered ? c.line : "transparent" }, style);

  if (!nested) return h(Pressable, { disabled, testID, onPress: () => { onPress?.(); ctx.close?.(); }, ...a11y(role, name, { selected, disabled }), ...(selected ? { "aria-current": "page" } : null), style: rowStyle }, content);
  // The guide line of the group sits under the middle of the parent's icon (or chevron, in a tree).
  const guide = ctx.tree ? pad + 7 : icon != null ? pad + 11 : pad;
  return h(View, null,
    h(Pressable, { disabled, testID, onPress: () => { onPress?.(); setOpen(!isOpen); }, ...a11y("button", name, { expanded: !!isOpen, selected, disabled }), style: rowStyle }, content),
    isOpen ? h(NavContext.Provider, { value: below },
      h(View, { style: { marginLeft: guide, paddingLeft: ctx.tree ? 4 : 10, marginVertical: 2, gap: 2, borderLeftWidth: 1, borderLeftColor: c.line } }, kids)) : null);
}

/** A row with a tick box, for lists you switch on and off (calendars, filters). It does not close the drawer. tone colours the box. */
export function NavCheckItem({ label, checked = false, onChange, tone = "accent", disabled = false, style }) {
  const theme = useTheme(), c = theme.colors, color = c[toneName(tone)] ?? c.accent;
  return h(Pressable, { disabled, onPress: () => onChange?.(!checked), ...a11y("checkbox", label, { checked, disabled }),
    style: ({ pressed, hovered }) => flat({ minHeight: theme.touch, paddingHorizontal: 12, borderRadius: theme.radius.m, flexDirection: "row", alignItems: "center", gap: 12, opacity: disabled ? 0.5 : 1, backgroundColor: pressed || hovered ? c.line : "transparent" }, style) },
  h(View, { style: { width: 24, alignItems: "center" } },
    h(View, { style: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: color, backgroundColor: checked ? color : "transparent", alignItems: "center", justifyContent: "center" } },
      checked ? h(NativeText, { allowFontScaling: false, style: { color: c.brandFg, fontSize: 13, lineHeight: 16, fontWeight: "800" } }, GLYPH.check) : null)),
  h(Text, { numberOfLines: 1, style: { flex: 1 } }, label));
}

// ---------------------------------------------------------------- NavSection
/** A labelled group of NavItems. collapsible folds it (open / defaultOpen / onOpenChange); action sits beside the title. */
export function NavSection({ title, collapsible = false, open, defaultOpen = true, onOpenChange, action, children, style }) {
  const theme = useTheme(), c = theme.colors, [isOpen, setOpen] = useControlled(open, defaultOpen, onOpenChange);
  const text = title ? h(Text, { size: "xs", weight: "semibold", tone: "muted", numberOfLines: 1, style: { flex: 1, letterSpacing: 0.6, textTransform: "uppercase" } }, title) : null;
  const head = !title ? null : collapsible
    ? h(Pressable, { onPress: () => setOpen(!isOpen), ...a11y("button", title, { expanded: !!isOpen }),
      style: ({ pressed, hovered }) => ({ minHeight: theme.touch, paddingHorizontal: 12, borderRadius: theme.radius.m, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: pressed || hovered ? c.line : "transparent" }) },
    text, action, h(Chevron, { direction: isOpen ? "down" : "right", color: c.muted, size: 7 }))
    : h(View, { style: { minHeight: 36, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8 } }, text, action);
  return h(View, { style: flat({ gap: 2 }, style) }, head, !collapsible || isOpen ? children : null);
}

// ---------------------------------------------------------------- NavList
const holds = (item, id) => (item.children ?? []).some((child) => child.id === id || holds(child, id));

/**
 * Renders navigation data. items: [{ id, label, icon, badge, disabled, children, defaultOpen }] or
 * sections: [{ id, title, items, collapsible, defaultOpen }]. selected is the id of the current item and
 * onSelect(id, item) is called for a press. Items with children fold open. variant "tree" draws a file tree.
 */
export function NavList({ items, sections, selected, onSelect, collapsibleSections = false, expandAll = false, variant = "list", style }) {
  const theme = useTheme(), ctx = useContext(NavContext), tree = variant === "tree";
  const value = useMemo(() => (tree ? { ...ctx, tree: true } : ctx), [ctx, tree]);
  const row = (item) => {
    const kids = item.children?.length ? item.children : null, active = !!kids && holds(item, selected);
    const icon = tree && item.icon === undefined ? (kids || item.folder ? h(FolderIcon, { color: theme.colors.muted, fill: theme.colors.accentSoft }) : h(FileIcon, { color: item.id === selected ? theme.colors.accent : theme.colors.muted })) : item.icon;
    return h(NavItem, { key: String(item.id), label: item.label, icon, badge: item.badge, trailing: item.trailing, disabled: item.disabled, selected: item.id === selected, active, testID: item.testID,
      defaultExpanded: item.defaultOpen ?? active, expanded: expandAll && kids ? true : undefined,
      onPress: !kids || item.selectable ? () => onSelect?.(item.id, item) : undefined }, kids ? kids.map(row) : null);
  };
  const groups = sections ?? [{ id: "items", items: items ?? [] }];
  return h(NavContext.Provider, { value }, h(View, { style: flat({ gap: theme.space.xs }, style) }, groups.map((section, index) =>
    h(NavSection, { key: String(section.id ?? section.title ?? index), title: section.title, collapsible: section.collapsible ?? collapsibleSections, defaultOpen: section.defaultOpen ?? true, open: expandAll ? true : undefined },
      (section.items ?? []).map(row)))));
}

// ---------------------------------------------------------------- NavSearch
/** A search field, 44pt high. value / defaultValue / onChangeText hold the text; onSubmit(text) is the keyboard's search key. */
export function NavSearch({ value, defaultValue = "", onChangeText, onSubmit, placeholder = "Search", label, style, ...rest }) {
  const theme = useTheme(), c = theme.colors, [text, setText] = useControlled(value, defaultValue, onChangeText), [focused, setFocused] = useState(false);
  return h(View, { accessibilityRole: web ? "search" : undefined, style: flat({ minHeight: theme.touch, paddingLeft: 10, paddingRight: 4, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: theme.radius.m, borderWidth: 1, borderColor: focused ? c.accent : c.line, backgroundColor: c.sunken }, style) },
    h(Glyph, { icon: GLYPH.search, color: c.muted, size: 20 }),
    h(TextInput, { value: text, onChangeText: setText, placeholder, placeholderTextColor: c.muted, selectionColor: c.accent, accessibilityLabel: label ?? placeholder, returnKeyType: "search", autoCorrect: false, autoCapitalize: "none",
      onSubmitEditing: () => onSubmit?.(text), onFocus: () => setFocused(true), onBlur: () => setFocused(false),
      style: flat({ flex: 1, minWidth: 0, height: theme.touch - 2, paddingVertical: 0, color: c.fg, fontSize: theme.text.md }, web && { outlineStyle: "none" }), ...rest }),
    text ? h(Pressable, { onPress: () => setText(""), hitSlop: 6, ...a11y("button", "Clear search"), style: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" } }, h(Glyph, { icon: GLYPH.close, color: c.muted, size: 20 })) : null);
}

// ---------------------------------------------------------------- NavSwitcher
const Mark = ({ icon, name, size = 36 }) => {
  const theme = useTheme();
  return h(View, { style: { width: size, height: size, borderRadius: theme.radius.s, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.accent } },
    h(Glyph, { icon: icon ?? firstLetters(name).slice(0, 1), color: theme.colors.brandFg, box: size, size: typeof icon === "string" && icon.length > 1 ? 12 : Math.round(size * 0.46) }));
};

/**
 * Workspace, team or version switcher for the top of a drawer. items: [{ id, name, description, icon }].
 * With title the heading stays fixed and the chosen item's name is the second line (Documentation / v1.0.1).
 * The choices open in a menu under the row; choosing one leaves the drawer open.
 */
export function NavSwitcher({ items = [], value, defaultValue, onChange, title, icon, label = "Teams", onAdd, addLabel = "Add team", style }) {
  const theme = useTheme(), c = theme.colors;
  const [current, setCurrent] = useControlled(value, defaultValue ?? items[0]?.id, onChange);
  const chosen = items.find((item) => item.id === current) ?? items[0] ?? {}, heading = title ?? chosen.name, second = title ? chosen.name : chosen.description;
  return h(NavPopover, { matchWidth: true, label, style, trigger: ({ onPress, expanded }) =>
    h(Pressable, { onPress, ...a11y("button", [heading, second].filter(Boolean).join(", "), { expanded }),
      style: ({ pressed, hovered }) => ({ minHeight: 56, paddingVertical: 8, paddingHorizontal: 8, borderRadius: theme.radius.m, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: pressed || hovered || expanded ? c.line : "transparent" }) },
    h(Mark, { icon: title ? icon : chosen.icon ?? icon, name: heading }),
    h(View, { style: { flex: 1, minWidth: 0 } }, h(Text, { weight: "semibold", numberOfLines: 1 }, heading), second ? h(Text, { size: "xs", tone: "muted", numberOfLines: 1, style: { lineHeight: 16 } }, second) : null),
    h(View, { style: { marginRight: 4 } }, h(Chevron, { direction: "down", color: c.muted, size: 7 }))) },
  h(MenuContext.Consumer, null, (menu) => [
    label ? h(MenuLabel, { key: "label" }, label) : null,
    ...items.map((item) => h(NavMenuItem, { key: String(item.id), label: item.name, description: item.description, icon: title ? undefined : h(Mark, { icon: item.icon, name: item.name, size: 24 }), selected: item.id === current, keepOpen: true, onPress: () => { setCurrent(item.id); menu.close?.(); } })),
    onAdd ? h(Divider, { key: "line", style: { marginVertical: 4 } }) : null,
    onAdd ? h(NavMenuItem, { key: "add", label: addLabel, icon: GLYPH.plus, keepOpen: true, onPress: () => { menu.close?.(); onAdd(); } }) : null,
  ]));
}

// ---------------------------------------------------------------- NavUser
/**
 * The signed-in person: avatar, name and email. actions: [{ id, label, icon, tone, separated }] open in a menu and
 * report through onAction(id); without actions the row calls onPress. placement is where the menu opens (top for a footer).
 */
export function NavUser({ name, email, source, actions, onAction, onPress, placement = "top", style }) {
  const theme = useTheme(), c = theme.colors, list = actions ?? [];
  const who = (size) => [h(Avatar, { key: "a", name, source, size }),
    h(View, { key: "n", style: { flex: 1, minWidth: 0 } }, h(Text, { size: "sm", weight: "semibold", numberOfLines: 1 }, name), email ? h(Text, { size: "xs", tone: "muted", numberOfLines: 1, style: { lineHeight: 16 } }, email) : null)];
  const row = (press, expanded) => h(Pressable, { onPress: press, disabled: !press, ...a11y("button", [name, email].filter(Boolean).join(", "), expanded === undefined ? {} : { expanded }),
    style: ({ pressed, hovered }) => ({ minHeight: 56, paddingVertical: 8, paddingHorizontal: 8, borderRadius: theme.radius.m, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: pressed || hovered || expanded ? c.line : "transparent" }) },
  who(36), !press ? null : list.length ? h(Glyph, { icon: GLYPH.more, color: c.muted, size: 20 }) : h(Chevron, { color: c.muted, size: 7 }));
  if (!list.length) return h(View, { style }, row(onPress));
  return h(NavPopover, { placement, matchWidth: true, label: name, style, trigger: ({ onPress: toggle, expanded }) => row(toggle, expanded) },
    h(MenuContext.Consumer, null, (menu) => list.map((action) => [action.separated ? h(Divider, { key: `${action.id}-line`, style: { marginVertical: 4 } }) : null,
      h(NavMenuItem, { key: String(action.id), label: action.label, icon: action.icon, tone: action.tone, keepOpen: true, onPress: () => { menu.close?.(); action.onPress?.(); onAction?.(action.id, action); } })])));
}

// ---------------------------------------------------------------- NavCalendar
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const sameDay = (a, b) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * A compact month grid for a drawer. value / defaultValue / onChange hold the chosen Date; month / onMonthChange
 * the visible month. marked is a list of Dates that get a dot. monthNames and weekdayNames (Sunday first) translate it.
 */
export function NavCalendar({ value, defaultValue, onChange, month, defaultMonth, onMonthChange, today = new Date(), marked = [], weekStartsOn = 0, monthNames = MONTHS, weekdayNames = WEEKDAYS, style }) {
  const theme = useTheme(), c = theme.colors;
  const [picked, setPicked] = useControlled(value, defaultValue, onChange);
  const [shown, setShown] = useControlled(month, defaultMonth ?? picked ?? today, onMonthChange);
  const year = shown.getFullYear(), index = shown.getMonth(), lead = (new Date(year, index, 1).getDay() - weekStartsOn + 7) % 7;
  const days = new Date(year, index + 1, 0).getDate(), rows = Math.ceil((lead + days) / 7);
  const arrow = (by, direction, text) => h(Pressable, { onPress: () => setShown(new Date(year, index + by, 1)), ...a11y("button", text),
    style: ({ pressed, hovered }) => ({ width: theme.touch, height: theme.touch, borderRadius: theme.radius.full, alignItems: "center", justifyContent: "center", backgroundColor: pressed || hovered ? c.line : "transparent" }) }, h(Chevron, { direction, color: c.fg }));
  return h(View, { style: flat({ gap: 2 }, style) },
    h(View, { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" } },
      h(Text, { weight: "semibold", accessibilityRole: "header", accessibilityLiveRegion: "polite", style: { paddingLeft: 12 } }, `${monthNames[index]} ${year}`),
      h(View, { style: { flexDirection: "row" } }, arrow(-1, "left", "Previous month"), arrow(1, "right", "Next month"))),
    h(View, { style: { flexDirection: "row" } }, Array.from({ length: 7 }, (_, at) => h(View, { key: at, style: { flex: 1, height: 28, alignItems: "center", justifyContent: "center" } },
      h(Text, { size: "xs", tone: "muted", weight: "medium" }, weekdayNames[(at + weekStartsOn) % 7])))),
    Array.from({ length: rows }, (_, week) => h(View, { key: week, style: { flexDirection: "row" } }, Array.from({ length: 7 }, (__, at) => {
      const date = new Date(year, index, week * 7 + at - lead + 1), outside = date.getMonth() !== index, on = sameDay(date, picked), now = sameDay(date, today), dot = marked.some((entry) => sameDay(entry, date));
      return h(Pressable, { key: at, onPress: () => { setPicked(date); if (outside) setShown(new Date(date.getFullYear(), date.getMonth(), 1)); }, hitSlop: { top: 2, bottom: 2 },
        ...a11y("button", `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}${now ? ", today" : ""}`, { selected: on }), style: { flex: 1, height: 42, alignItems: "center", justifyContent: "center" } },
      ({ pressed, hovered }) => h(View, { style: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: on ? c.accent : pressed || hovered ? c.line : "transparent", borderWidth: now && !on ? 1.5 : 0, borderColor: c.accent } },
        h(NativeText, { style: { color: on ? c.brandFg : now ? c.accent : outside ? c.muted : c.fg, opacity: outside && !on ? 0.55 : 1, fontSize: theme.text.sm, fontWeight: on || now ? "700" : "400" } }, date.getDate()),
        dot ? h(View, { style: { position: "absolute", bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: on ? c.brandFg : c.accent } }) : null));
    }))));
}

// ---------------------------------------------------------------- NavStackScreen
/**
 * A screen pushed over the one below it, as a phone shows the next level of a list: it slides in from the right
 * with its own app bar and back button. Put it in NavShell's `overlay`, or in any box that clips (overflow hidden).
 * visible + onBack; the Android back button calls onBack too. scroll={false} leaves the body to you.
 */
export function NavStackScreen({ visible, onBack, title, subtitle, actions, backLabel = "Back", scroll = true, insets, footer, children, contentStyle, testID }) {
  const theme = useTheme(), c = theme.colors, win = useWindowDimensions(), [progress, mounted] = usePresence(!!visible), kept = useRef(null);
  if (visible) kept.current = { title, subtitle, actions, footer, children };
  useEffect(() => {
    if (!visible || web) return undefined;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => { onBack?.(); return true; });
    return () => sub.remove();
  }, [visible, onBack]);
  if (!mounted && !visible) return null;
  const now = (visible ? null : kept.current) ?? { title, subtitle, actions, footer, children };
  return h(Animated.View, { testID, accessibilityViewIsModal: true, pointerEvents: visible ? "auto" : "none",
    style: flat(FILL, { backgroundColor: c.bg, transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [win.width, 0] }) }] }) },
  h(Bar, { top: insets?.top, title: now.title, subtitle: now.subtitle, actions: now.actions, leading: h(NavBarButton, { label: backLabel, onPress: onBack, icon: h(Chevron, { direction: "left", color: c.fg, size: 10 }), testID: testID ? `${testID}-back` : undefined }) }),
  scroll ? h(ScrollView, { style: { flex: 1 }, contentContainerStyle: flat({ padding: theme.space.m, gap: theme.space.s }, contentStyle), keyboardShouldPersistTaps: "handled" }, now.children)
    : h(View, { style: flat({ flex: 1 }, contentStyle) }, now.children),
  now.footer != null ? h(View, { style: { padding: theme.space.s, paddingBottom: theme.space.s + (insets?.bottom ?? 0), borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.bg } }, now.footer) : null);
}

// ---------------------------------------------------------------- NavShell
/** The drawer of NavShell: a backdrop that fades in and a full-height panel that slides in from the left edge. */
function DrawerPanel({ visible, onClose, width, insets, closeLabel, children }) {
  const theme = useTheme(), c = theme.colors, win = useWindowDimensions(), [progress, mounted] = usePresence(visible);
  if (!mounted && !visible) return null;
  const size = Math.min(width, Math.round(win.width * 0.84));
  return h(Modal, { visible: true, transparent: true, animationType: "none", onRequestClose: onClose, statusBarTranslucent: true },
    h(View, { style: { flex: 1, flexDirection: "row", overflow: "hidden" } },
      h(Animated.View, { style: flat(FILL, { backgroundColor: c.overlay, opacity: progress }) },
        h(Pressable, { onPress: onClose, accessibilityLabel: closeLabel, accessibilityRole: "button", style: FILL })),
      h(Animated.View, { accessibilityViewIsModal: true, style: flat({ width: size, paddingTop: insets?.top ?? 0, paddingBottom: insets?.bottom ?? 0, backgroundColor: c.surface, overflow: "hidden",
        borderTopRightRadius: theme.radius.l, borderBottomRightRadius: theme.radius.l, transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-size - 24, 0] }) }] }, depth(theme.shadow.l)) }, children)));
}

/**
 * The app frame of a phone app with a navigation drawer.
 *
 * The app bar shows a menu button, `title` (and `subtitle`) and `actions`. The menu button opens the drawer: a
 * full-height panel, about 84% of the screen wide (at most `width`), that slides in from the left over a backdrop
 * and closes on the backdrop, the back button, or when a NavItem is chosen. sidebar is its scrolling content;
 * sidebarHeader and sidebarFooter stay pinned above and below it.
 *
 * From `breakpoint` (768) of window width the panel is docked beside the content and the menu button shows and
 * hides it; layout forces "drawer" or "docked". open / defaultOpen / onOpenChange control it.
 * leading replaces the menu button; header replaces the title. overlay is drawn over the app bar and the content
 * (a NavStackScreen). insets ({ top, bottom }) pads the app bar and the drawer for notches. scroll={false} gives
 * the content a plain flex box instead of a padded ScrollView.
 */
export function NavShell({ title, subtitle, header, leading, actions, sidebar, sidebarHeader, sidebarFooter, overlay, open, defaultOpen, onOpenChange, layout = "auto", breakpoint = 768, width = 320, scroll = true, insets,
  menuLabel = "Open navigation", navigationLabel = "Navigation", children, style, contentStyle, testID }) {
  const theme = useTheme(), c = theme.colors, win = useWindowDimensions();
  const wide = layout === "docked" || (layout === "auto" && win.width >= breakpoint);
  const [drawer, setDrawer] = useState(defaultOpen ?? false), [docked, setDocked] = useState(defaultOpen ?? true);
  const isOpen = open ?? (wide ? docked : drawer);
  const setOpen = useCallback((next) => { if (open === undefined) (wide ? setDocked : setDrawer)(next); onOpenChange?.(next); }, [open, wide, onOpenChange]);
  const nav = useMemo(() => ({ level: 0, tree: false, close: wide ? null : () => setOpen(false) }), [wide, setOpen]);

  const panel = sidebar == null ? null : h(NavContext.Provider, { value: nav },
    h(View, { accessibilityRole: web ? "navigation" : undefined, accessibilityLabel: navigationLabel, style: { flex: 1 } },
      sidebarHeader ? h(View, { style: { padding: theme.space.xs, paddingTop: theme.space.s, paddingBottom: 0, gap: theme.space.xs } }, sidebarHeader) : null,
      h(ScrollView, { style: { flex: 1 }, contentContainerStyle: { padding: theme.space.xs, paddingTop: theme.space.s, gap: theme.space.xs }, keyboardShouldPersistTaps: "handled", showsVerticalScrollIndicator: false }, sidebar),
      sidebarFooter ? h(View, { style: { padding: theme.space.xs, gap: 2, borderTopWidth: 1, borderTopColor: c.line } }, sidebarFooter) : null));
  const menuButton = panel ? h(NavBarButton, { label: menuLabel, expanded: !!isOpen, onPress: () => setOpen(!isOpen), icon: h(MenuIcon, { color: c.fg }), testID: testID ? `${testID}-menu` : undefined }) : null;

  return h(View, { testID, style: flat({ flex: 1, flexDirection: "row", backgroundColor: c.bg, overflow: "hidden" }, style) },
    wide && panel && isOpen ? h(View, { style: { width: Math.min(width, 300), backgroundColor: c.surface, borderRightWidth: 1, borderRightColor: c.line } }, panel) : null,
    h(View, { style: { flex: 1, minWidth: 0, overflow: "hidden" } },
      h(Bar, { top: insets?.top, leading: leading ?? menuButton, title, subtitle, header, actions }),
      scroll ? h(ScrollView, { style: { flex: 1 }, contentContainerStyle: flat({ padding: theme.space.m, gap: theme.space.m }, contentStyle), keyboardShouldPersistTaps: "handled" }, children)
        : h(View, { style: flat({ flex: 1 }, contentStyle) }, children),
      overlay),
    !wide && panel ? h(DrawerPanel, { visible: !!isOpen, onClose: () => setOpen(false), width, insets, closeLabel: "Close navigation" }, panel) : null);
}

// ---------------------------------------------------------------- the layouts
const SHELL_KEYS = ["open", "defaultOpen", "onOpenChange", "layout", "breakpoint", "width", "scroll", "insets", "style", "contentStyle", "testID", "menuLabel", "navigationLabel", "actions", "subtitle"];
const shellProps = (props) => Object.fromEntries(SHELL_KEYS.filter((key) => props[key] !== undefined).map((key) => [key, props[key]]));

/** The items from the top of the navigation down to the one with this id, or []. */
function pathTo(groups, id) {
  const walk = (items, path) => { for (const item of items ?? []) { if (item.id === id) return [...path, item]; const found = walk(item.children, [...path, item]); if (found) return found; } return null; };
  for (const group of groups) { const found = walk(group.items, []); if (found) return found; }
  return [];
}
function filterGroups(groups, query) {
  const text = query.trim().toLowerCase(), hit = (item) => String(item.label).toLowerCase().includes(text);
  const keep = (items) => (items ?? []).flatMap((item) => { if (hit(item)) return [item]; const kids = keep(item.children); return kids.length ? [{ ...item, children: kids }] : []; });
  return groups.map((group) => ({ ...group, items: keep(group.items) })).filter((group) => group.items.length);
}

/** What the three drawer layouts share. preset is what makes each one different. */
function DrawerLayout(preset, props) {
  const { sections, items, selected, defaultSelected, onSelect, switcher, user, secondary, searchPlaceholder, onSearch, emptyText = "No matches", title, children } = props;
  const theme = useTheme(), groups = sections ?? (items ? [{ id: "items", items }] : []);
  const [value, pick] = useSelection(selected, defaultSelected, onSelect), [query, setQuery] = useState("");
  const search = props.search ?? preset.search, filtering = !!search && query.trim() !== "", shown = filtering ? filterGroups(groups, query) : groups;
  const current = pathTo([...groups, { items: secondary ?? [] }], value).pop();
  const head = [switcher ? h(NavSwitcher, { key: "switch", ...switcher }) : null,
    search ? h(NavSearch, { key: "search", value: query, onChangeText: setQuery, onSubmit: onSearch, placeholder: searchPlaceholder, style: { marginHorizontal: theme.space["2xs"] } }) : null].filter(Boolean);
  const foot = [secondary?.length ? h(NavList, { key: "secondary", items: secondary, selected: value, onSelect: pick }) : null, user ? h(NavUser, { key: "user", ...user }) : null].filter(Boolean);
  return h(NavShell, { ...shellProps(props), title: title ?? current?.label ?? "", sidebarHeader: head.length ? head : undefined, sidebarFooter: foot.length ? foot : undefined,
    sidebar: [h(NavList, { key: "nav", sections: shown, selected: value, onSelect: (id, item) => { setQuery(""); pick(id, item); }, collapsibleSections: props.collapsibleSections ?? preset.fold, expandAll: filtering }),
      filtering && !shown.length ? h(Text, { key: "none", size: "sm", tone: "muted", align: "center", style: { padding: theme.space.m } }, emptyText) : null] }, children);
}

/**
 * A drawer of links grouped under section labels that fold, with a search field that filters them: documentation,
 * a help centre, a catalogue. sections: [{ id, title, items: [{ id, label, badge }] }]; switcher is the row at the top.
 */
export const SectionedDrawer = (props) => DrawerLayout({ search: true, fold: true }, props);
/**
 * A drawer whose items open to show the items inside them: categories and subcategories, two or three levels deep.
 * items: [{ id, label, icon, children: [{ id, label }] }]. The group that holds the current item starts open.
 */
export const NestedDrawer = (props) => DrawerLayout({}, props);
/**
 * The drawer of a team app: a workspace switcher at the top, navigation with icons and badges, and help links
 * and the signed-in account pinned at the bottom. switcher, sections, secondary and user are the four parts.
 */
export const WorkspaceDrawer = (props) => DrawerLayout({}, props);

function MailRow({ mail, onPress }) {
  const theme = useTheme(), c = theme.colors;
  return h(Pressable, { onPress, ...a11y("button", `${mail.from}, ${mail.subject}, ${mail.time}${mail.unread ? ", unread" : ""}`),
    style: ({ pressed, hovered }) => ({ flexDirection: "row", gap: theme.space.s, paddingVertical: theme.space.s, paddingLeft: theme.space.m, backgroundColor: pressed || hovered ? c.sunken : "transparent" }) },
  h(Avatar, { name: mail.from.replace(/^To:\s*/, ""), size: 40, style: mail.unread ? null : { backgroundColor: c.line } }),
  h(View, { style: { flex: 1, minWidth: 0, paddingRight: theme.space.m } },
    h(View, { style: { flexDirection: "row", alignItems: "center", gap: theme.space.xs } },
      h(Text, { weight: mail.unread ? "bold" : "medium", numberOfLines: 1, style: { flex: 1 } }, mail.from),
      h(Text, { size: "xs", tone: mail.unread ? "accent" : "muted", weight: mail.unread ? "semibold" : "regular" }, mail.time)),
    h(View, { style: { flexDirection: "row", alignItems: "center", gap: theme.space.xs } },
      h(Text, { size: "sm", weight: mail.unread ? "semibold" : "regular", numberOfLines: 1, style: { flex: 1 } }, mail.subject),
      mail.unread ? h(View, { style: { width: 9, height: 9, borderRadius: 5, backgroundColor: c.accent } }) : null),
    mail.preview ? h(Text, { size: "sm", tone: "muted", numberOfLines: 2 }, mail.preview) : null));
}

/**
 * A mail app on a phone, as three stacked levels: folders in the drawer, the message list as the screen, and the
 * open message pushed over it with a back button.
 * folders: [{ id, label, icon, badge }]; messages: [{ id, folder, from, time, subject, preview, body, unread }].
 * selected is the id of the open message (null for the list); onSelect(id, message) is called with null on the way back.
 * renderMessage(message) replaces the message body; messageFooter(message) is pinned under it (reply buttons).
 */
export function MailLayout({ folders = [], folder, defaultFolder, onFolderChange, messages = [], selected, defaultSelected = null, onSelect, unreadOnly, defaultUnreadOnly = false, onUnreadOnlyChange,
  allLabel = "All", unreadLabel = "Unread", search = true, searchPlaceholder = "Search mail", emptyText = "No messages", backLabel, user, switcher, renderMessage, messageFooter, messageActions, title, ...props }) {
  const theme = useTheme(), c = theme.colors;
  const [current, setFolder] = useControlled(folder, defaultFolder ?? folders[0]?.id, onFolderChange), [value, pick] = useSelection(selected, defaultSelected, onSelect);
  const [only, setOnly] = useControlled(unreadOnly, defaultUnreadOnly, onUnreadOnlyChange), [query, setQuery] = useState("");
  const place = folders.find((entry) => entry.id === current) ?? {}, text = query.trim().toLowerCase();
  const list = messages.filter((mail) => (mail.folder ?? folders[0]?.id) === current && (!only || mail.unread) && (!text || `${mail.from} ${mail.subject} ${mail.preview}`.toLowerCase().includes(text)));
  const open = value == null ? null : messages.find((mail) => mail.id === value) ?? null;
  const chip = (label, on, press) => h(Pressable, { key: label, onPress: press, hitSlop: { top: 6, bottom: 6 }, ...a11y("button", label, { selected: on }),
    style: { minHeight: 32, paddingHorizontal: 14, borderRadius: theme.radius.full, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: on ? "transparent" : c.line, backgroundColor: on ? c.accentSoft : "transparent" } },
  h(Text, { size: "sm", weight: "medium", style: { color: on ? c.accent : c.fg } }, label));
  const body = open ? (renderMessage ? renderMessage(open) : [
    h(Heading, { key: "subject", level: 2 }, open.subject),
    h(View, { key: "from", style: { flexDirection: "row", alignItems: "center", gap: theme.space.s } }, h(Avatar, { name: open.from.replace(/^To:\s*/, ""), size: 40 }),
      h(View, { style: { flex: 1, minWidth: 0 } }, h(Text, { weight: "semibold", numberOfLines: 1 }, open.from), h(Text, { size: "sm", tone: "muted", numberOfLines: 1 }, open.time))),
    h(Divider, { key: "line" }),
    ...String(open.body ?? open.preview ?? "").split(/\n\s*\n/).map((paragraph, index) => h(Text, { key: index }, paragraph))]) : null;
  return h(NavShell, { ...shellProps(props), scroll: false, title: title ?? place.label ?? "", navigationLabel: props.navigationLabel ?? "Folders",
    sidebarHeader: switcher ? h(NavSwitcher, switcher) : undefined, sidebarFooter: user ? h(NavUser, user) : undefined,
    sidebar: h(NavList, { items: folders, selected: current, onSelect: (id) => setFolder(id) }),
    overlay: h(NavStackScreen, { visible: !!open, onBack: () => pick(null, null), title: place.label ?? "", backLabel: backLabel ?? `Back to ${place.label ?? "list"}`, insets: props.insets,
      actions: open && messageActions ? messageActions(open) : undefined, footer: open && messageFooter ? messageFooter(open) : undefined, testID: props.testID ? `${props.testID}-message` : undefined }, body) },
  h(View, { style: { padding: theme.space.s, paddingBottom: theme.space.xs, gap: theme.space.xs } },
    search ? h(NavSearch, { value: query, onChangeText: setQuery, placeholder: searchPlaceholder }) : null,
    h(View, { style: { flexDirection: "row", gap: theme.space.xs } }, chip(allLabel, !only, () => setOnly(false)), chip(unreadLabel, !!only, () => setOnly(true)))),
  h(ScrollView, { style: { flex: 1 }, keyboardShouldPersistTaps: "handled" }, list.length
    ? list.map((mail, index) => h(View, { key: String(mail.id) }, index ? h(Divider, { style: { marginLeft: theme.space.m + 40 + theme.space.s } }) : null, h(MailRow, { mail, onPress: () => pick(mail.id, mail) })))
    : h(Text, { tone: "muted", align: "center", style: { padding: theme.space.xl } }, emptyText)));
}

/** The month grid of CalendarDrawer: picking a day closes the drawer it is in. */
function DrawerMonth({ onChange, ...rest }) {
  const nav = useContext(NavContext);
  return h(NavCalendar, { ...rest, onChange: (next) => { onChange(next); nav.close?.(); } });
}

/**
 * A calendar app's drawer: a month to pick the day from and lists of calendars to switch on and off, with the
 * account at the top. Picking a day closes the drawer and the app bar shows that day; ticking a calendar does not.
 * calendars: [{ id, title, items: [{ id, label, tone }] }]; checked is the list of ids that are on.
 * With today, the app bar gets a button (todayLabel) that jumps back to it.
 */
export function CalendarDrawer({ user, date, defaultDate, onDateChange, today, marked, calendars = [], checked, defaultChecked = [], onCheckedChange, todayLabel = "Today", monthNames = MONTHS, dayNames = DAYS, title, subtitle, actions, children, ...props }) {
  const theme = useTheme(), [day, setDay] = useControlled(date, defaultDate ?? today, onDateChange), [month, setMonth] = useState(day ?? today ?? new Date()), [on, setOn] = useControlled(checked, defaultChecked, onCheckedChange);
  const go = (next) => { setDay(next); setMonth(new Date(next.getFullYear(), next.getMonth(), 1)); };
  const jump = today && !sameDay(day, today) ? h(Button, { key: "today", title: todayLabel, variant: "soft", size: "s", onPress: () => go(today), style: { marginRight: theme.space["2xs"] } }) : null;
  return h(NavShell, { ...shellProps(props), title: title ?? (day ? `${day.getDate()} ${monthNames[day.getMonth()]}` : ""), subtitle: subtitle ?? (day ? `${dayNames[day.getDay()]}${sameDay(day, today) ? ` · ${todayLabel}` : ""}` : undefined),
    actions: jump || actions ? [jump, actions ? h(View, { key: "given", style: { flexDirection: "row", alignItems: "center" } }, actions) : null] : undefined, navigationLabel: props.navigationLabel ?? "Calendars",
    sidebarHeader: user ? h(NavUser, { placement: "bottom", ...user }) : undefined, sidebar: [
      h(DrawerMonth, { key: "calendar", value: day, onChange: setDay, month, onMonthChange: setMonth, today, marked, monthNames, style: { paddingHorizontal: theme.space["2xs"] } }), h(Divider, { key: "line", style: { marginVertical: theme.space["2xs"] } }),
      ...calendars.map((group, index) => h(NavSection, { key: String(group.id ?? index), title: group.title, collapsible: true, defaultOpen: group.defaultOpen ?? index === 0 },
        (group.items ?? []).map((entry) => h(NavCheckItem, { key: String(entry.id), label: entry.label, tone: entry.tone, checked: on.includes(entry.id), onChange: (next) => setOn(next ? [...on, entry.id] : on.filter((id) => id !== entry.id)) }))))] }, children);
}

const STATUS_TONE = { M: "warn", U: "ok", A: "ok", D: "bad", R: "accent" };
/**
 * A code or document browser: the drawer lists changed files with their status above a tree of folders that fold.
 * changes: [{ id, label, status }] (status M, U, A, D or R); tree: [{ id, label, children }].
 * The app bar shows the open file and the folder it is in.
 */
export function FileTreeDrawer({ changes = [], tree = [], selected, defaultSelected, onSelect, changesTitle = "Changes", treeTitle = "Files", title, subtitle, children, ...props }) {
  const theme = useTheme(), [value, pick] = useSelection(selected, defaultSelected, onSelect);
  const changed = changes.map((entry) => ({ ...entry, icon: entry.icon ?? h(FileIcon, { color: entry.id === value ? theme.colors.accent : theme.colors.muted }),
    trailing: entry.status ? h(Text, { size: "xs", weight: "bold", tone: STATUS_TONE[entry.status] ?? "muted", accessibilityLabel: `status ${entry.status}`, style: { width: 16, textAlign: "center" } }, entry.status) : undefined }));
  const inTree = pathTo([{ items: tree }], value), change = changes.find((entry) => entry.id === value);
  const name = inTree.length ? inTree[inTree.length - 1].label : change?.label ?? "", folder = inTree.length ? inTree.slice(0, -1).map((item) => item.label).join(" / ") : change ? changesTitle : "";
  return h(NavShell, { ...shellProps(props), title: title ?? name, subtitle: subtitle ?? (folder || undefined), navigationLabel: props.navigationLabel ?? "Files", sidebar: [
    changes.length ? h(NavSection, { key: "changes", title: changesTitle }, h(NavList, { items: changed, selected: value, onSelect: pick, variant: "tree", style: { gap: 0 } })) : null,
    h(NavSection, { key: "tree", title: treeTitle }, h(NavList, { items: tree, selected: value, onSelect: pick, variant: "tree", style: { gap: 0 } }))] }, children);
}

// ---------------------------------------------------------------- SettingsSheet
function SettingsRow({ item, onPress }) {
  const theme = useTheme(), c = theme.colors;
  return h(Pressable, { onPress, disabled: item.disabled, testID: item.testID, ...a11y("button", item.label, { disabled: !!item.disabled }),
    style: ({ pressed, hovered }) => ({ minHeight: 52, paddingHorizontal: theme.space.s, flexDirection: "row", alignItems: "center", gap: theme.space.s, opacity: item.disabled ? 0.5 : 1, backgroundColor: pressed || hovered ? c.sunken : "transparent" }) },
  item.icon != null ? h(View, { style: { width: 32, height: 32, borderRadius: theme.radius.s, alignItems: "center", justifyContent: "center", backgroundColor: c.accentSoft } }, h(Glyph, { icon: item.icon, color: c.accent })) : null,
  h(Text, { weight: "medium", numberOfLines: 1, style: { flex: 1 } }, item.label),
  item.trailing != null ? (typeof item.trailing === "string" ? h(Text, { size: "sm", tone: "muted", numberOfLines: 1, style: { maxWidth: "45%" } }, item.trailing) : item.trailing) : null,
  h(Chevron, { color: c.muted, size: 7 }));
}

/**
 * Settings as a bottom sheet with its own navigation: the sheet lists the sections, and choosing one pushes that
 * section's page inside the sheet, with a back button. visible + onClose as for Sheet.
 * items or sections: [{ id, label, icon, trailing }] (trailing is the current value, shown beside the label).
 * selected is the id of the open section, null for the list; onSelect(id, item) is called with null on the way back.
 * children is the page of the open section, or a function (item) => page.
 */
export function SettingsSheet({ visible, onClose, title = "Settings", items, sections, selected, defaultSelected = null, onSelect, doneLabel = "Done", backLabel, closeLabel = "Close", insets, children, testID }) {
  const theme = useTheme(), c = theme.colors, win = useWindowDimensions(), groups = sections ?? [{ id: "items", items: items ?? [] }];
  const [value, pick] = useSelection(selected, defaultSelected, onSelect), [progress, mounted] = usePresence(!!visible, 300, 220);
  if (!mounted && !visible) return null;
  const current = value == null ? null : pathTo(groups, value).pop() ?? null, back = () => (current ? pick(null, null) : onClose?.());
  const done = h(Button, { title: doneLabel, variant: "ghost", size: "s", onPress: onClose, style: { alignSelf: "center" }, textStyle: { color: c.accent, fontWeight: "600" }, testID: testID ? `${testID}-done` : undefined });
  return h(Modal, { visible: true, transparent: true, animationType: "none", onRequestClose: back, statusBarTranslucent: true },
    h(View, { style: { flex: 1, justifyContent: "flex-end", alignItems: "center" } },
      h(Animated.View, { style: flat(FILL, { backgroundColor: c.overlay, opacity: progress }) }, h(Pressable, { onPress: onClose, accessibilityLabel: closeLabel, accessibilityRole: "button", style: FILL })),
      h(Animated.View, { testID, accessibilityViewIsModal: true, accessibilityRole: web ? "dialog" : undefined, "aria-modal": true, accessibilityLabel: title,
        style: flat({ width: "100%", maxWidth: 560, height: "90%", paddingBottom: insets?.bottom ?? 0, borderTopLeftRadius: theme.radius.l, borderTopRightRadius: theme.radius.l, backgroundColor: c.bg, overflow: "hidden",
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [win.height, 0] }) }] }, depth(theme.shadow.l)) },
      h(View, { style: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: c.line, marginTop: theme.space.xs } }),
      h(View, { style: { flex: 1, overflow: "hidden" } },
        h(View, { style: { minHeight: 56, flexDirection: "row", alignItems: "center", paddingLeft: theme.space.m, paddingRight: theme.space.xs } },
          h(Heading, { level: 2, numberOfLines: 1, style: { flex: 1 } }, title), done),
        h(ScrollView, { style: { flex: 1 }, contentContainerStyle: { padding: theme.space.m, paddingTop: theme.space["2xs"], gap: theme.space.m }, keyboardShouldPersistTaps: "handled" }, groups.map((group, index) =>
          h(View, { key: String(group.id ?? group.title ?? index), style: { gap: theme.space.xs } },
            group.title ? h(Text, { size: "xs", weight: "semibold", tone: "muted", style: { paddingHorizontal: theme.space.s, letterSpacing: 0.6, textTransform: "uppercase" } }, group.title) : null,
            h(View, { style: { borderRadius: theme.radius.l, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, overflow: "hidden" } }, (group.items ?? []).map((item, at) =>
              h(View, { key: String(item.id) }, at ? h(Divider, { style: { marginLeft: item.icon != null ? theme.space.s * 2 + 32 : theme.space.s } }) : null, h(SettingsRow, { item, onPress: () => pick(item.id, item) }))))))),
        h(NavStackScreen, { visible: !!current, onBack: () => pick(null, null), title: current?.label, backLabel: backLabel ?? `Back to ${title}`, actions: done, testID: testID ? `${testID}-page` : undefined },
          current ? (typeof children === "function" ? children(current) : children) : null)))));
}

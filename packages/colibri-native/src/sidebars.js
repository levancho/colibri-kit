// Sidebar and navigation layouts (the web catalog's sidebar-01 … sidebar-16).
//
// A phone has no room for a permanent sidebar, so the pieces are built around NavShell: a top bar with a menu
// button, a navigation panel that slides in over the content (Modal + Animated, with a backdrop), and a content
// area. From 768pt of window width the panel sits beside the content instead, and can fold to an icon rail.
// The sixteen blocks are compositions of NavShell, NavSection, NavItem, NavSearch, NavUser and NavSwitcher.
//
// Honest scope: there is no hover on a phone, so the web kit's tooltips on the icon rail become accessibility
// labels, "dropdown to the side" opens an anchored menu wherever it fits, and Ctrl/Cmd+B is left to the app.
// Icons are text glyphs, initials or shapes drawn with View. Written against the basics only.
import { Children, createContext, createElement as h, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Modal, Pressable, ScrollView, Text as NativeText, TextInput, View, useWindowDimensions } from "react-native";
import { useTheme } from "./provider.js";
import { toneName } from "./theme.js";
import { web, depth, flat, GLYPH } from "./internal.js";
import { Text, Avatar, Badge, Button, Divider, Switch } from "./components.js";

// ---------------------------------------------------------------- helpers
const NavContext = createContext({ collapsed: false, level: 0, tree: false, close: null, expand: null });
const MenuContext = createContext({ close: null });
/** Inside a NavShell panel: { collapsed, level, close(), expand() }. close and expand are null where they do not apply. */
export const useNav = () => useContext(NavContext);

const FILL = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 };
const RAIL = 60;

function useControlled(value, fallback, onChange) {
  const [inner, setInner] = useState(fallback), controlled = value !== undefined;
  const set = useCallback((next) => { if (!controlled) setInner(next); onChange?.(next); }, [controlled, onChange]);
  return [controlled ? value : inner, set];
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
  const text = String(icon), fontSize = size ?? (text.length > 1 ? 11 : 17);
  return h(View, { style: { width: box, height: box, alignItems: "center", justifyContent: "center" } },
    h(NativeText, { allowFontScaling: false, style: { color, fontSize, lineHeight: box, fontWeight: text.length > 1 ? "700" : "500", textAlign: "center" } }, text));
}

function Chevron({ open, color, down = false }) {
  return h(NativeText, { allowFontScaling: false, style: { width: 16, textAlign: "center", color, fontSize: 17, lineHeight: 20, transform: [{ rotate: open || down ? "90deg" : "0deg" }] } }, GLYPH.chevronRight);
}

/** The "panel" mark of the menu button: a frame with the sidebar edge drawn in. */
function PanelIcon({ side = "left", color }) {
  return h(View, { style: { width: 18, height: 14, borderWidth: 1.5, borderColor: color, borderRadius: 3 } },
    h(View, { style: { position: "absolute", top: 0, bottom: 0, [side]: 4, width: 1.5, backgroundColor: color } }));
}
function FolderIcon({ color, fill }) {
  return h(View, { style: { width: 16, height: 14, justifyContent: "flex-end" } },
    h(View, { style: { position: "absolute", top: 0, left: 0, width: 8, height: 5, borderTopLeftRadius: 2, borderTopRightRadius: 2, backgroundColor: color } }),
    h(View, { style: { height: 11, borderRadius: 2, borderWidth: 1.5, borderColor: color, backgroundColor: fill } }));
}
function FileIcon({ color }) {
  return h(View, { style: { width: 12, height: 15, borderRadius: 2, borderWidth: 1.5, borderColor: color, justifyContent: "center", gap: 2, paddingHorizontal: 1.5 } },
    h(View, { style: { height: 1.5, backgroundColor: color } }), h(View, { style: { height: 1.5, width: 4, backgroundColor: color } }));
}

function IconButton({ label, onPress, expanded, children, size = 40, style, testID }) {
  const theme = useTheme();
  return h(Pressable, { onPress, testID, hitSlop: (theme.touch - size) / 2, ...a11y("button", label, expanded === undefined ? {} : { expanded }),
    style: ({ pressed, hovered }) => flat({ width: size, height: size, borderRadius: theme.radius.s, alignItems: "center", justifyContent: "center", backgroundColor: pressed || hovered ? theme.colors.line : "transparent" }, style) }, children);
}

function Crumbs({ items }) {
  const theme = useTheme(), list = (items ?? []).filter(Boolean), last = list[list.length - 1], before = list.slice(0, -1).join("  ›  ");
  return h(View, { style: { flexDirection: "row", alignItems: "center", gap: theme.space["2xs"], minWidth: 0 } },
    before ? h(Text, { size: "sm", tone: "muted", numberOfLines: 1, style: { flexShrink: 1 } }, before) : null,
    before ? h(Text, { size: "sm", tone: "muted" }, "›") : null,
    h(Text, { size: "sm", weight: "semibold", numberOfLines: 1, accessibilityRole: "header", style: { flexShrink: before ? 0 : 1, maxWidth: before ? "70%" : undefined } }, last ?? ""));
}

// ---------------------------------------------------------------- NavPopover and NavMenuItem
/**
 * A small floating card anchored to its trigger: the touch stand-in for the web kit's dropdown menu and popover
 * inside sidebars. trigger is a function ({ onPress, expanded }) => element; children is the content, or a
 * function (close) => content. placement: bottom | top | right | left, flipped or moved when it does not fit.
 */
export function NavPopover({ trigger, children, placement = "bottom", align = "start", width = 232, matchWidth = false, open, defaultOpen = false, onOpenChange, label, style }) {
  const theme = useTheme(), win = useWindowDimensions(), anchorRef = useRef(null), outer = useContext(NavContext);
  const [shown, setShown] = useControlled(open, defaultOpen, onOpenChange);
  const [anchor, setAnchor] = useState(null), [size, setSize] = useState(null);
  useEffect(() => {
    if (!shown) { setAnchor(null); setSize(null); return; }
    anchorRef.current?.measureInWindow((x, y, w, ht) => setAnchor({ x, y, width: w, height: ht }));
  }, [shown]);
  const close = useCallback(() => setShown(false), [setShown]);
  const menu = useMemo(() => ({ close }), [close]);
  const nav = useMemo(() => ({ collapsed: false, level: 0, tree: false, expand: null, close: () => { close(); outer.close?.(); } }), [close, outer]);
  const margin = theme.space.xs, gap = 6, cardWidth = Math.min(matchWidth && anchor ? Math.max(anchor.width, 200) : width, win.width - margin * 2);
  let spot = { left: 0, top: 0, opacity: 0 };
  if (anchor && size) {
    let where = placement, along = align;
    if (where === "right" && anchor.x + anchor.width + gap + size.width > win.width - margin) { where = "bottom"; along = "end"; }
    if (where === "left" && anchor.x - gap - size.width < margin) where = "bottom";
    if (where === "bottom" && anchor.y + anchor.height + gap + size.height > win.height - margin && anchor.y - gap - size.height >= margin) where = "top";
    if (where === "top" && anchor.y - gap - size.height < margin) where = "bottom";
    const sideways = where === "right" || where === "left";
    let left = where === "right" ? anchor.x + anchor.width + gap : where === "left" ? anchor.x - gap - size.width
      : along === "end" ? anchor.x + anchor.width - size.width : along === "center" ? anchor.x + (anchor.width - size.width) / 2 : anchor.x;
    let top = sideways ? anchor.y : where === "top" ? anchor.y - gap - size.height : anchor.y + anchor.height + gap;
    left = Math.max(margin, Math.min(left, win.width - size.width - margin));
    top = Math.max(margin, Math.min(top, win.height - size.height - margin));
    spot = { left, top, opacity: 1 };
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
  return h(Pressable, { disabled, onPress: () => { onPress?.(); if (!keepOpen) menu.close?.(); }, hitSlop: { top: 2, bottom: 2 },
    ...a11y("menuitem", label, selected === undefined ? { disabled } : { selected, disabled }),
    style: ({ pressed, hovered }) => flat({ minHeight: 40, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.s, flexDirection: "row", alignItems: "center", gap: 10, opacity: disabled ? 0.5 : 1, backgroundColor: pressed || hovered ? c.sunken : "transparent" }, style) },
    icon != null ? h(Glyph, { icon, color: tone ? color : c.muted }) : null,
    h(View, { style: { flex: 1, minWidth: 0 } },
      h(Text, { size: "sm", weight: "medium", numberOfLines: 1, style: { color } }, label),
      description ? h(Text, { size: "xs", tone: "muted", numberOfLines: 1 }, description) : null),
    trailing != null ? (typeof trailing === "string" ? h(Text, { size: "xs", tone: "muted" }, trailing) : trailing) : null,
    selected ? h(Glyph, { icon: GLYPH.check, color: c.accent, box: 20, size: 14 }) : null);
}

const MenuLabel = ({ children }) => h(Text, { size: "xs", weight: "semibold", tone: "muted", style: { paddingHorizontal: 10, paddingTop: 6, paddingBottom: 2 } }, children);

// ---------------------------------------------------------------- NavItem
/**
 * One navigation row: glyph icon, label, badge, selected state. Nested NavItem children make a submenu:
 * submenu="collapsible" folds open and closed (expanded / defaultExpanded / onExpandedChange), "static" is always
 * visible, "dropdown" opens in an anchored menu. In an icon rail only the icon shows and the label is read out.
 */
export function NavItem({ label, icon, badge, trailing, selected = false, active = false, disabled = false, onPress, children, submenu = "collapsible", expanded, defaultExpanded = false, onExpandedChange, role = "button", accessibilityLabel, style, testID }) {
  const theme = useTheme(), c = theme.colors, ctx = useContext(NavContext);
  const kids = Children.toArray(children), nested = kids.length > 0, sub = ctx.level > 0;
  const [isOpen, setOpen] = useControlled(expanded, defaultExpanded, onExpandedChange);
  const below = useMemo(() => ({ ...ctx, level: ctx.level + 1 }), [ctx]);
  const name = accessibilityLabel ?? (typeof label === "string" ? label : undefined);
  const leaf = () => { onPress?.(); ctx.close?.(); };

  if (ctx.collapsed) {
    const lit = selected || active;
    return h(Pressable, { disabled, testID, onPress: nested ? () => { onPress?.(); ctx.expand?.(); } : leaf, ...a11y(role, name, nested ? { selected: lit, disabled, expanded: false } : { selected: lit, disabled }),
      style: ({ pressed, hovered }) => flat({ width: theme.touch, height: theme.touch, borderRadius: theme.radius.s, alignItems: "center", justifyContent: "center", opacity: disabled ? 0.5 : 1,
        backgroundColor: lit ? c.accentSoft : pressed || hovered ? c.line : "transparent" }, style) },
      h(Glyph, { icon: icon ?? firstLetters(label).slice(0, 1), color: lit ? c.accent : c.fg }),
      badge != null && badge !== false ? h(View, { style: { position: "absolute", top: 7, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: c.accent, borderWidth: 1.5, borderColor: c.sunken } }) : null);
  }

  const height = ctx.tree ? 36 : sub ? 40 : theme.touch, tint = selected ? c.accent : c.fg;
  const body = (chevronOpen, down) => [
    ctx.tree ? (nested ? h(Chevron, { key: "c0", open: chevronOpen, color: c.muted }) : h(View, { key: "c0", style: { width: 16 } })) : null,
    icon != null ? h(Glyph, { key: "i", icon, color: selected ? c.accent : sub ? c.muted : c.fg }) : null,
    typeof label === "string" ? h(Text, { key: "l", size: "sm", weight: selected || active ? "semibold" : sub ? "regular" : "medium", numberOfLines: 1, style: { flex: 1, color: tint } }, label) : h(View, { key: "l", style: { flex: 1, minWidth: 0 } }, label),
    badge != null && badge !== false ? (typeof badge === "string" || typeof badge === "number" ? h(Badge, { key: "b", tone: selected ? "accent" : undefined, style: flat({ alignSelf: "center" }, !selected && { backgroundColor: c.line }) }, badge) : h(View, { key: "b" }, badge)) : null,
    trailing != null ? h(View, { key: "t" }, typeof trailing === "string" ? h(Text, { size: "xs", tone: "muted" }, trailing) : trailing) : null,
    nested && !ctx.tree && chevronOpen !== undefined ? h(Chevron, { key: "c1", open: chevronOpen, down, color: c.muted }) : null,
  ];
  const rowStyle = ({ pressed, hovered } = {}) => flat({ minHeight: height, paddingHorizontal: ctx.tree ? 6 : 10, paddingVertical: 4, borderRadius: theme.radius.s, flexDirection: "row", alignItems: "center", gap: ctx.tree ? 6 : 10, opacity: disabled ? 0.5 : 1,
    backgroundColor: selected ? c.accentSoft : pressed || hovered ? c.line : "transparent" }, style);
  const slop = height < theme.touch ? { top: (theme.touch - height) / 2, bottom: (theme.touch - height) / 2 } : undefined;
  const group = () => h(NavContext.Provider, { value: below },
    h(View, { style: { marginLeft: ctx.tree ? 13 : 21, paddingLeft: ctx.tree ? 4 : 8, marginVertical: 2, gap: 2, borderLeftWidth: 1, borderLeftColor: c.line } }, kids));

  if (!nested) return h(Pressable, { disabled, testID, onPress: leaf, hitSlop: slop, ...a11y(role, name, { selected, disabled }), ...(selected ? { "aria-current": "page" } : null), style: rowStyle }, body());
  if (submenu === "static") {
    const head = onPress ? h(Pressable, { disabled, testID, onPress: leaf, ...a11y(role, name, { selected, disabled }), style: rowStyle }, body())
      : h(View, { testID, accessibilityRole: "header", style: rowStyle() }, body());
    return h(View, null, head, group());
  }
  if (submenu === "dropdown") {
    return h(NavPopover, { placement: "right", label: name, trigger: ({ onPress: toggle, expanded: on }) =>
      h(Pressable, { disabled, testID, onPress: toggle, ...a11y("button", name, { expanded: on, disabled }), style: rowStyle }, body(false)) }, kids);
  }
  return h(View, null,
    h(Pressable, { disabled, testID, onPress: () => { onPress?.(); setOpen(!isOpen); }, hitSlop: slop, ...a11y("button", name, { expanded: !!isOpen, selected, disabled }), style: rowStyle }, body(!!isOpen)),
    isOpen ? group() : null);
}

/** A row with a tick box, for lists you switch on and off (calendars, filters). tone colours the box. */
export function NavCheckItem({ label, checked = false, onChange, tone = "accent", disabled = false, style }) {
  const theme = useTheme(), c = theme.colors, ctx = useContext(NavContext), color = c[toneName(tone)] ?? c.accent;
  const box = h(View, { style: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: color, backgroundColor: checked ? color : "transparent", alignItems: "center", justifyContent: "center" } },
    checked ? h(NativeText, { allowFontScaling: false, style: { color: c.brandFg, fontSize: 12, lineHeight: 14, fontWeight: "800" } }, GLYPH.check) : null);
  return h(Pressable, { disabled, onPress: () => onChange?.(!checked), hitSlop: { top: 2, bottom: 2 }, ...a11y("checkbox", label, { checked, disabled }),
    style: ({ pressed, hovered }) => flat({ minHeight: 40, paddingHorizontal: ctx.collapsed ? 0 : 10, borderRadius: theme.radius.s, flexDirection: "row", alignItems: "center", justifyContent: ctx.collapsed ? "center" : "flex-start", gap: 10, opacity: disabled ? 0.5 : 1, backgroundColor: pressed || hovered ? c.line : "transparent" }, ctx.collapsed && { width: theme.touch }, style) },
    h(View, { style: { width: 24, alignItems: "center" } }, box),
    ctx.collapsed ? null : h(Text, { size: "sm", numberOfLines: 1, style: { flex: 1 } }, label));
}

// ---------------------------------------------------------------- NavSection
/** A labelled group of NavItems. collapsible folds it (open / defaultOpen / onOpenChange); action sits beside the title. */
export function NavSection({ title, collapsible = false, open, defaultOpen = true, onOpenChange, action, children, style }) {
  const theme = useTheme(), c = theme.colors, ctx = useContext(NavContext), [isOpen, setOpen] = useControlled(open, defaultOpen, onOpenChange);
  if (ctx.collapsed) return h(View, { style: flat({ gap: 2, alignItems: "center" }, style) }, children);
  const text = title ? h(Text, { size: "xs", weight: "semibold", tone: "muted", numberOfLines: 1, style: { flex: 1, letterSpacing: 0.2 } }, title) : null;
  const head = !title ? null : collapsible
    ? h(Pressable, { onPress: () => setOpen(!isOpen), hitSlop: { top: 4, bottom: 4 }, ...a11y("button", title, { expanded: !!isOpen }),
      style: ({ pressed, hovered }) => ({ minHeight: 36, paddingHorizontal: 10, borderRadius: theme.radius.s, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: pressed || hovered ? c.line : "transparent" }) },
      text, action, h(Chevron, { open: !!isOpen, color: c.muted }))
    : h(View, { style: { minHeight: 32, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 8 } }, text, action);
  return h(View, { style: flat({ gap: 2 }, style) }, head, !collapsible || isOpen ? children : null);
}

// ---------------------------------------------------------------- NavList
const holds = (item, id) => (item.children ?? []).some((child) => child.id === id || holds(child, id));

/**
 * Renders navigation data. items: [{ id, label, icon, badge, disabled, children, defaultOpen, submenu }] or
 * sections: [{ id, title, items, collapsible, defaultOpen }]. selected is the id of the current item and
 * onSelect(id, item) is called for a press. submenu: collapsible | static | dropdown. variant "tree" draws a file tree.
 */
export function NavList({ items, sections, selected, onSelect, submenu = "collapsible", collapsibleSections = false, expandAll = false, variant = "list", style }) {
  const theme = useTheme(), ctx = useContext(NavContext), tree = variant === "tree";
  const value = useMemo(() => (tree ? { ...ctx, tree: true } : ctx), [ctx, tree]);
  const row = (item) => {
    const kids = item.children?.length ? item.children : null, active = !!kids && holds(item, selected), kind = item.submenu ?? submenu;
    const icon = tree && item.icon === undefined ? (kids || item.folder ? h(FolderIcon, { color: theme.colors.muted, fill: theme.colors.accentSoft }) : h(FileIcon, { color: theme.colors.muted })) : item.icon;
    return h(NavItem, { key: String(item.id), label: item.label, icon, badge: item.badge, trailing: item.trailing, disabled: item.disabled, selected: item.id === selected, active, submenu: kind, testID: item.testID,
      defaultExpanded: item.defaultOpen ?? active, expanded: expandAll && kids ? true : undefined,
      onPress: !kids || item.selectable ? () => onSelect?.(item.id, item) : undefined }, kids ? kids.map(row) : null);
  };
  const groups = sections ?? [{ id: "items", items: items ?? [] }];
  return h(NavContext.Provider, { value }, h(View, { style: flat({ gap: ctx.collapsed ? theme.space.xs : theme.space.s }, style) }, groups.map((section, index) =>
    h(NavSection, { key: String(section.id ?? section.title ?? index), title: section.title, collapsible: section.collapsible ?? collapsibleSections, defaultOpen: section.defaultOpen ?? true, open: expandAll ? true : undefined },
      (section.items ?? []).map(row)))));
}

// ---------------------------------------------------------------- NavSearch
/** The search field of a sidebar. In an icon rail it is a button that opens the panel. */
export function NavSearch({ value, defaultValue = "", onChangeText, onSubmit, placeholder = "Search", label, style, ...rest }) {
  const theme = useTheme(), c = theme.colors, ctx = useContext(NavContext), [text, setText] = useControlled(value, defaultValue, onChangeText), [focused, setFocused] = useState(false);
  if (ctx.collapsed) return h(IconButton, { label: label ?? placeholder, size: theme.touch, onPress: () => ctx.expand?.() }, h(Glyph, { icon: GLYPH.search, color: c.fg, size: 20 }));
  return h(View, { accessibilityRole: web ? "search" : undefined, style: flat({ minHeight: 40, paddingLeft: 8, paddingRight: 4, flexDirection: "row", alignItems: "center", gap: 4, borderRadius: theme.radius.s, borderWidth: 1, borderColor: focused ? c.accent : c.line, backgroundColor: c.surface }, style) },
    h(Glyph, { icon: GLYPH.search, color: c.muted, size: 19 }),
    h(TextInput, { value: text, onChangeText: setText, placeholder, placeholderTextColor: c.muted, selectionColor: c.accent, accessibilityLabel: label ?? placeholder, returnKeyType: "search", autoCorrect: false, autoCapitalize: "none",
      onSubmitEditing: () => onSubmit?.(text), onFocus: () => setFocused(true), onBlur: () => setFocused(false), hitSlop: { top: 2, bottom: 2 },
      style: flat({ flex: 1, minWidth: 0, height: 38, paddingVertical: 0, color: c.fg, fontSize: theme.text.sm }, web && { outlineStyle: "none" }), ...rest }),
    text ? h(IconButton, { label: "Clear search", size: 30, onPress: () => setText("") }, h(Glyph, { icon: GLYPH.close, color: c.muted, size: 18 })) : null);
}

// ---------------------------------------------------------------- NavSwitcher
const Mark = ({ icon, name, size = 32 }) => {
  const theme = useTheme();
  return h(View, { style: { width: size, height: size, borderRadius: theme.radius.s, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.accent } },
    h(Glyph, { icon: icon ?? firstLetters(name).slice(0, 1), color: theme.colors.brandFg, box: size, size: typeof icon === "string" && icon.length > 1 ? 12 : 16 }));
};

/**
 * Workspace, team or version switcher for the top of a sidebar. items: [{ id, name, description, icon }].
 * With title the heading stays fixed and the chosen item's name is the second line (Documentation / v1.0.1).
 * doneLabel keeps the menu open after a choice and adds a button to close it (the popover flavour).
 */
export function NavSwitcher({ items = [], value, defaultValue, onChange, title, icon, label = "Teams", onAdd, addLabel = "Add team", doneLabel, placement = "bottom", style }) {
  const theme = useTheme(), c = theme.colors, ctx = useContext(NavContext);
  const [current, setCurrent] = useControlled(value, defaultValue ?? items[0]?.id, onChange);
  const chosen = items.find((item) => item.id === current) ?? items[0] ?? {}, heading = title ?? chosen.name, second = title ? chosen.name : chosen.description;
  const mark = h(Mark, { icon: title ? icon : chosen.icon ?? icon, name: heading });
  return h(NavPopover, { placement, matchWidth: !ctx.collapsed, label, style: flat(ctx.collapsed && { alignItems: "center" }, style), trigger: ({ onPress, expanded }) =>
    h(Pressable, { onPress, ...a11y("button", [heading, second].filter(Boolean).join(", "), { expanded }),
      style: ({ pressed, hovered }) => ({ minHeight: 52, padding: ctx.collapsed ? 6 : 8, borderRadius: theme.radius.s, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: pressed || hovered || expanded ? c.line : "transparent" }) },
      mark,
      ctx.collapsed ? null : h(View, { style: { flex: 1, minWidth: 0 } }, h(Text, { size: "sm", weight: "semibold", numberOfLines: 1 }, heading), second ? h(Text, { size: "xs", tone: "muted", numberOfLines: 1 }, second) : null),
      ctx.collapsed ? null : h(Chevron, { down: true, color: c.muted })) },
  (close) => [
    label ? h(MenuLabel, { key: "label" }, label) : null,
    ...items.map((item) => h(NavMenuItem, { key: String(item.id), label: item.name, description: title ? item.description : item.description, icon: title ? undefined : h(Mark, { icon: item.icon, name: item.name, size: 24 }), selected: item.id === current, keepOpen: !!doneLabel, onPress: () => setCurrent(item.id) })),
    onAdd ? h(Divider, { key: "line", style: { marginVertical: 4 } }) : null,
    onAdd ? h(NavMenuItem, { key: "add", label: addLabel, icon: GLYPH.plus, onPress: onAdd }) : null,
    doneLabel ? h(View, { key: "done", style: { padding: 6, paddingTop: 8 } }, h(Button, { title: doneLabel, size: "s", variant: "soft", block: true, onPress: close })) : null,
  ]);
}

// ---------------------------------------------------------------- NavUser
/**
 * The signed-in person: avatar, name and email. actions: [{ id, label, icon, tone, separated }] open in a menu and
 * report through onAction(id); without actions the row calls onPress. placement is where the menu opens (top for a footer).
 */
export function NavUser({ name, email, source, actions, onAction, onPress, placement = "top", style }) {
  const theme = useTheme(), c = theme.colors, ctx = useContext(NavContext), list = actions ?? [];
  const row = (press, expanded) => h(Pressable, { onPress: press, disabled: !press, ...a11y("button", [name, email].filter(Boolean).join(", "), expanded === undefined ? {} : { expanded }),
    style: ({ pressed, hovered }) => ({ minHeight: 52, padding: ctx.collapsed ? 6 : 8, borderRadius: theme.radius.s, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: pressed || hovered || expanded ? c.line : "transparent" }) },
    h(Avatar, { name, source, size: 32 }),
    ctx.collapsed ? null : h(View, { style: { flex: 1, minWidth: 0 } }, h(Text, { size: "sm", weight: "semibold", numberOfLines: 1 }, name), email ? h(Text, { size: "xs", tone: "muted", numberOfLines: 1 }, email) : null),
    ctx.collapsed || !press ? null : h(Glyph, { icon: list.length ? GLYPH.more : GLYPH.chevronRight, color: c.muted, box: 20 }));
  if (!list.length) return h(View, { style: flat(ctx.collapsed && { alignItems: "center" }, style) }, row(onPress));
  return h(NavPopover, { placement, matchWidth: !ctx.collapsed, label: name, style: flat(ctx.collapsed && { alignItems: "center" }, style), trigger: ({ onPress: toggle, expanded }) => row(toggle, expanded) },
    h(View, { style: { flexDirection: "row", alignItems: "center", gap: 10, padding: 8 } }, h(Avatar, { name, source, size: 32 }),
      h(View, { style: { flex: 1, minWidth: 0 } }, h(Text, { size: "sm", weight: "semibold", numberOfLines: 1 }, name), email ? h(Text, { size: "xs", tone: "muted", numberOfLines: 1 }, email) : null)),
    h(Divider, { style: { marginVertical: 4 } }),
    list.map((action) => [action.separated ? h(Divider, { key: `${action.id}-line`, style: { marginVertical: 4 } }) : null,
      h(NavMenuItem, { key: String(action.id), label: action.label, icon: action.icon, tone: action.tone, onPress: () => { action.onPress?.(); onAction?.(action.id, action); } })]));
}

// ---------------------------------------------------------------- NavCalendar
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const sameDay = (a, b) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * A compact month grid for a sidebar. value / defaultValue / onChange hold the chosen Date; month / onMonthChange
 * the visible month. marked is a list of Dates that get a dot. monthNames and weekdayNames (Sunday first) translate it.
 */
export function NavCalendar({ value, defaultValue, onChange, month, defaultMonth, onMonthChange, today = new Date(), marked = [], weekStartsOn = 0, monthNames = MONTHS, weekdayNames = WEEKDAYS, style }) {
  const theme = useTheme(), c = theme.colors;
  const [picked, setPicked] = useControlled(value, defaultValue, onChange);
  const [shown, setShown] = useControlled(month, defaultMonth ?? picked ?? today, onMonthChange);
  const year = shown.getFullYear(), index = shown.getMonth(), lead = (new Date(year, index, 1).getDay() - weekStartsOn + 7) % 7;
  const days = new Date(year, index + 1, 0).getDate(), rows = Math.ceil((lead + days) / 7);
  const step = (by) => setShown(new Date(year, index + by, 1));
  const arrow = (by, glyph, text) => h(IconButton, { label: text, size: 36, onPress: () => step(by) }, h(Glyph, { icon: glyph, color: c.fg, size: 20 }));
  return h(View, { style: flat({ gap: 2 }, style) },
    h(View, { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" } },
      arrow(-1, GLYPH.chevronLeft, "Previous month"),
      h(Text, { size: "sm", weight: "semibold", accessibilityRole: "header", accessibilityLiveRegion: "polite" }, `${monthNames[index]} ${year}`),
      arrow(1, GLYPH.chevronRight, "Next month")),
    h(View, { style: { flexDirection: "row" } }, Array.from({ length: 7 }, (_, at) => h(View, { key: at, style: { flex: 1, height: 24, alignItems: "center", justifyContent: "center" } },
      h(Text, { size: "xs", tone: "muted" }, weekdayNames[(at + weekStartsOn) % 7])))),
    Array.from({ length: rows }, (_, week) => h(View, { key: week, style: { flexDirection: "row" } }, Array.from({ length: 7 }, (__, at) => {
      const date = new Date(year, index, week * 7 + at - lead + 1), outside = date.getMonth() !== index, on = sameDay(date, picked), now = sameDay(date, today), dot = marked.some((entry) => sameDay(entry, date));
      return h(Pressable, { key: at, onPress: () => { setPicked(date); if (outside) setShown(new Date(date.getFullYear(), date.getMonth(), 1)); }, hitSlop: { top: 4, bottom: 4 },
        ...a11y("button", `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}${now ? ", today" : ""}`, { selected: on }), style: { flex: 1, height: 36, alignItems: "center", justifyContent: "center" } },
      ({ pressed, hovered }) => h(View, { style: { width: 32, height: 32, borderRadius: theme.radius.s, alignItems: "center", justifyContent: "center", backgroundColor: on ? c.accent : pressed || hovered ? c.line : "transparent", borderWidth: now && !on ? 1.5 : 0, borderColor: c.accent } },
        h(NativeText, { style: { color: on ? c.brandFg : outside ? c.muted : c.fg, opacity: outside && !on ? 0.6 : 1, fontSize: theme.text.sm, fontWeight: on || now ? "700" : "400" } }, date.getDate()),
        dot ? h(View, { style: { position: "absolute", bottom: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: on ? c.brandFg : c.accent } }) : null));
    }))));
}

// ---------------------------------------------------------------- NavShell
/** The sliding panel of NavShell: a backdrop that fades and a panel that slides in from its side. */
function SlidePanel({ visible, onClose, side, width, contained, floating, insets, background, closeLabel, children }) {
  const theme = useTheme(), win = useWindowDimensions(), progress = useRef(new Animated.Value(0)).current, [mounted, setMounted] = useState(visible);
  useEffect(() => {
    if (visible) setMounted(true);
    const run = Animated.timing(progress, { toValue: visible ? 1 : 0, duration: visible ? 240 : 180, useNativeDriver: !web });
    run.start(({ finished }) => { if (finished && !visible) setMounted(false); });
    return () => run.stop();
  }, [visible, progress]);
  if (!mounted) return null;
  const size = Math.min(width, win.width - 56), from = side === "right" ? size + 24 : -size - 24, inset = floating ? theme.space.xs : 0;
  const layer = h(View, { style: flat(contained ? FILL : { flex: 1 }, { flexDirection: "row", justifyContent: side === "right" ? "flex-end" : "flex-start", overflow: "hidden" }) },
    h(Animated.View, { style: flat(FILL, { backgroundColor: theme.colors.overlay, opacity: progress }) },
      h(Pressable, { onPress: onClose, accessibilityLabel: closeLabel, accessibilityRole: "button", style: FILL })),
    h(Animated.View, { accessibilityViewIsModal: true, style: flat({ width: size, maxWidth: "88%", margin: inset, paddingTop: insets?.top ?? 0, paddingBottom: insets?.bottom ?? 0, backgroundColor: background, overflow: "hidden",
      transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }] },
    floating ? { borderRadius: theme.radius.l, borderWidth: 1, borderColor: theme.colors.line } : { [side === "right" ? "borderLeftWidth" : "borderRightWidth"]: 1, borderColor: theme.colors.line }, depth(theme.shadow.l)) }, children));
  return contained ? layer : h(Modal, { visible: true, transparent: true, animationType: "none", onRequestClose: onClose, statusBarTranslucent: true }, layer);
}

/**
 * The app frame. A top bar with a menu button, a navigation panel and the content.
 *
 * On a phone the panel slides in over the content (Modal + Animated) and closes on the backdrop, the back button
 * or a choice. From `breakpoint` (768) of window width it is docked beside the content and the menu button hides
 * it (collapsible="offcanvas") or folds it to an icon rail (collapsible="icon"; the rail also stays visible on phones).
 *
 * sidebar is the panel's scrolling content, sidebarHeader and sidebarFooter stay pinned. rail is a custom strip
 * that is always visible. aside is a second panel on the other side with its own button. variant: sidebar |
 * floating | inset. headerPosition "site" puts the bar above sidebar and content. layout forces "drawer" or
 * "docked"; contained keeps the sliding panel inside the shell's own box instead of a Modal (for dialogs and previews).
 * open / defaultOpen / onOpenChange control the panel; insets ({ top, bottom }) pads the sliding panel for notches.
 */
export function NavShell({ title, breadcrumb, header, actions, subheader, sidebar, sidebarHeader, sidebarFooter, rail, aside, asideLabel = "Details", side = "left", variant = "sidebar", collapsible = "offcanvas",
  headerPosition = "content", open, defaultOpen, onOpenChange, asideOpen, defaultAsideOpen, onAsideOpenChange, layout = "auto", breakpoint = 768, width = 280, asideWidth = 280, contained = false, scroll = true, insets,
  menuLabel = "Navigation menu", navigationLabel = "Navigation", children, style, contentStyle, testID }) {
  const theme = useTheme(), c = theme.colors, win = useWindowDimensions();
  const wide = layout === "docked" || (layout === "auto" && win.width >= breakpoint);
  const [drawer, setDrawer] = useState(defaultOpen ?? false), [expanded, setExpanded] = useState(defaultOpen ?? true);
  const [asideDrawer, setAsideDrawer] = useState(defaultAsideOpen ?? false), [asideShown, setAsideShown] = useState(defaultAsideOpen ?? true);
  const isOpen = open ?? (wide ? expanded : drawer), isAside = asideOpen ?? (wide ? asideShown : asideDrawer);
  const setOpen = useCallback((next) => { if (open === undefined) (wide ? setExpanded : setDrawer)(next); onOpenChange?.(next); }, [open, wide, onOpenChange]);
  const setAside = useCallback((next) => { if (asideOpen === undefined) (wide ? setAsideShown : setAsideDrawer)(next); onAsideOpenChange?.(next); }, [asideOpen, wide, onAsideOpenChange]);
  const fixed = collapsible === "none" && wide, other = side === "right" ? "left" : "right";
  const floating = variant === "floating", inset = variant === "inset", panelColor = floating ? c.surface : c.sunken;

  const full = useMemo(() => ({ collapsed: false, level: 0, tree: false, close: wide ? null : () => setOpen(false), expand: () => setOpen(true) }), [wide, setOpen]);
  const mini = useMemo(() => ({ collapsed: true, level: 0, tree: false, close: null, expand: () => setOpen(true) }), [setOpen]);
  const plain = useMemo(() => ({ collapsed: false, level: 0, tree: false, close: wide ? null : () => setAside(false), expand: null }), [wide, setAside]);

  const panel = (value, body, head, foot, label) => h(NavContext.Provider, { value },
    h(View, { accessibilityRole: web ? "navigation" : undefined, accessibilityLabel: label, style: { flex: 1 } },
      head ? h(View, { style: { padding: theme.space.xs, paddingBottom: 0, gap: theme.space.xs, alignItems: value.collapsed ? "center" : "stretch" } }, head) : null,
      h(ScrollView, { style: { flex: 1 }, contentContainerStyle: { padding: theme.space.xs, gap: theme.space.s, alignItems: value.collapsed ? "center" : "stretch" }, keyboardShouldPersistTaps: "handled", showsVerticalScrollIndicator: false }, body),
      foot ? h(View, { style: { padding: theme.space.xs, gap: theme.space["2xs"], borderTopWidth: 1, borderTopColor: c.line, alignItems: value.collapsed ? "center" : "stretch" } }, foot) : null));
  const edge = (at) => (inset ? null : { [at === "right" ? "borderLeftWidth" : "borderRightWidth"]: 1, borderColor: c.line });
  const docked = (at, size, content) => h(View, { style: flat({ width: size, backgroundColor: inset ? "transparent" : panelColor },
    floating ? { margin: theme.space.xs, borderRadius: theme.radius.l, borderWidth: 1, borderColor: c.line, overflow: "hidden", ...depth(theme.shadow.m) } : edge(at)) }, content);
  const strip = (content) => h(View, { style: flat({ width: RAIL, backgroundColor: inset ? "transparent" : c.sunken }, edge(side)) }, content);

  const autoRail = collapsible === "icon" && sidebar != null && (!wide || !isOpen);
  const showMenu = sidebar != null && !fixed;
  const menuButton = showMenu ? h(IconButton, { key: "menu", label: menuLabel, expanded: !!isOpen, onPress: () => setOpen(!isOpen), testID: testID ? `${testID}-menu` : undefined }, h(PanelIcon, { side, color: c.fg })) : null;
  const rule = h(View, { key: "rule", style: { width: 1, height: 18, backgroundColor: c.line } });
  const site = headerPosition === "site";
  const bar = h(View, { style: { borderBottomWidth: 1, borderBottomColor: c.line, backgroundColor: site ? c.surface : "transparent" } },
    h(View, { style: { minHeight: site ? 56 : 52, flexDirection: "row", alignItems: "center", gap: theme.space.xs, paddingHorizontal: theme.space.xs } },
      side === "left" && menuButton ? [menuButton, rule] : null,
      h(View, { style: { flex: 1, minWidth: 0, paddingLeft: side === "left" && menuButton ? theme.space["2xs"] : theme.space.xs } }, header ?? h(Crumbs, { items: breadcrumb ?? [title] })),
      actions,
      aside != null ? h(IconButton, { label: asideLabel, expanded: !!isAside, onPress: () => setAside(!isAside), testID: testID ? `${testID}-aside` : undefined }, h(PanelIcon, { side: other, color: c.fg })) : null,
      side === "right" && menuButton ? [rule, menuButton] : null),
    subheader ? h(View, { style: { paddingHorizontal: theme.space.s, paddingBottom: theme.space.xs } }, subheader) : null);

  const content = scroll
    ? h(ScrollView, { style: { flex: 1 }, contentContainerStyle: flat({ padding: theme.space.m, gap: theme.space.s }, contentStyle), keyboardShouldPersistTaps: "handled" }, children)
    : h(View, { style: flat({ flex: 1 }, contentStyle) }, children);
  const main = h(View, { key: "main", style: flat({ flex: 1, minWidth: 0 }, inset && { margin: theme.space.xs, borderRadius: theme.radius.l, borderWidth: 1, borderColor: c.line, backgroundColor: c.bg, overflow: "hidden", ...depth(theme.shadow.s) }) },
    site ? null : bar, content);
  const primary = [
    rail != null ? strip(h(NavContext.Provider, { key: "rail", value: mini }, h(ScrollView, { style: { flex: 1 }, contentContainerStyle: { padding: theme.space.xs, gap: theme.space["2xs"], alignItems: "center", flexGrow: 1 }, showsVerticalScrollIndicator: false }, rail))) : null,
    autoRail ? strip(panel(mini, sidebar, sidebarHeader, sidebarFooter, navigationLabel)) : null,
    wide && sidebar != null && (isOpen || fixed) ? docked(side, width, panel(full, sidebar, sidebarHeader, sidebarFooter, navigationLabel)) : null,
  ].map((node, index) => (node ? h(View, { key: `p${index}`, style: { flexDirection: "row" } }, node) : null));
  const secondary = wide && aside != null && isAside ? h(View, { key: "aside", style: { flexDirection: "row" } }, docked(other, asideWidth, panel(plain, aside, null, null, asideLabel))) : null;

  return h(View, { testID, style: flat({ flex: 1, backgroundColor: inset ? c.sunken : c.bg, overflow: "hidden" }, style) },
    site ? bar : null,
    h(View, { style: { flex: 1, flexDirection: side === "right" ? "row-reverse" : "row" } }, primary, main, secondary),
    !wide && sidebar != null ? h(SlidePanel, { visible: !!isOpen, onClose: () => setOpen(false), side, width, contained, floating, insets, background: panelColor, closeLabel: "Close navigation" },
      panel(full, sidebar, sidebarHeader, sidebarFooter, navigationLabel)) : null,
    !wide && aside != null ? h(SlidePanel, { visible: !!isAside, onClose: () => setAside(false), side: other, width: asideWidth, contained, floating, insets, background: panelColor, closeLabel: `Close ${String(asideLabel).toLowerCase()}` },
      panel(plain, aside, null, null, asideLabel)) : null);
}

// ---------------------------------------------------------------- the blocks
const SHELL_KEYS = ["open", "defaultOpen", "onOpenChange", "layout", "breakpoint", "width", "contained", "scroll", "insets", "style", "contentStyle", "testID", "menuLabel", "navigationLabel", "actions"];
const shellProps = (props) => Object.fromEntries(SHELL_KEYS.filter((key) => props[key] !== undefined).map((key) => [key, props[key]]));

function useSelection(selected, defaultSelected, onSelect) {
  const [inner, setInner] = useState(defaultSelected);
  return [selected !== undefined ? selected : inner, (id, item) => { if (selected === undefined) setInner(id); onSelect?.(id, item); }];
}
function trailOf(groups, id) {
  const walk = (items, path) => { for (const item of items ?? []) { if (item.id === id) return [...path, item.label]; const found = walk(item.children, [...path, item.label]); if (found) return found; } return null; };
  for (const group of groups) { const found = walk(group.items, group.title ? [group.title] : []); if (found) return found.slice(-2); }
  return [];
}
function filterGroups(groups, query) {
  const text = query.trim().toLowerCase(), hit = (item) => String(item.label).toLowerCase().includes(text);
  const keep = (items) => (items ?? []).flatMap((item) => { if (hit(item)) return [item]; const kids = keep(item.children); return kids.length ? [{ ...item, children: kids }] : []; });
  return groups.map((group) => ({ ...group, items: keep(group.items) })).filter((group) => group.items.length);
}
const Expanded = ({ children }) => (useContext(NavContext).collapsed ? null : children);

function Promo({ title, description, actionLabel = "Upgrade", onAction }) {
  const theme = useTheme();
  return h(Expanded, null, h(View, { style: { padding: theme.space.s, gap: theme.space["2xs"], borderRadius: theme.radius.m, borderWidth: 1, borderColor: theme.colors.line, backgroundColor: theme.colors.surface, ...depth(theme.shadow.s) } },
    h(Text, { size: "sm", weight: "semibold" }, title), description ? h(Text, { size: "xs", tone: "muted" }, description) : null,
    h(Button, { title: actionLabel, size: "s", block: true, onPress: onAction, style: { marginTop: theme.space["2xs"] } })));
}

/** The frame the app-style blocks share. flags is what makes each numbered block different. */
function Frame(flags, props) {
  const { sections, items, selected, defaultSelected, onSelect, switcher, user, secondary, promo, searchPlaceholder, onSearch, emptyText = "No matches", breadcrumb, title, pageActions, onPageAction, aside, children } = props;
  const theme = useTheme(), win = useWindowDimensions(), groups = sections ?? (items ? [{ id: "items", items }] : []);
  const [value, pick] = useSelection(selected, defaultSelected, onSelect), [query, setQuery] = useState("");
  const search = props.search ?? flags.search, filtering = search === true && query.trim() !== "", shown = filtering ? filterGroups(groups, query) : groups;
  const crumbs = breadcrumb ?? (title ? [title] : trailOf([...groups, { items: secondary ?? [] }], value));
  const field = (style) => h(NavSearch, { value: query, onChangeText: setQuery, onSubmit: onSearch, placeholder: searchPlaceholder, style });
  const head = [switcher ? h(NavSwitcher, { key: "switch", ...flags.switcher, ...switcher }) : null, search === true ? h(View, { key: "search" }, field()) : null].filter(Boolean);
  const foot = [
    secondary?.length ? h(NavList, { key: "secondary", items: secondary, selected: value, onSelect: pick }) : null,
    promo ? h(Promo, { key: "promo", ...promo }) : null,
    user ? h(NavUser, { key: "user", ...user }) : null,
  ].filter(Boolean);
  const actions = [props.actions ? h(View, { key: "given" }, props.actions) : null,
    flags.headerSearch && win.width >= 560 ? h(View, { key: "search", style: { width: 220 } }, field()) : null,
    pageActions?.length ? h(NavPopover, { key: "page", placement: "bottom", align: "end", width: 208, label: "Page actions", trigger: ({ onPress, expanded }) =>
      h(IconButton, { label: "Page actions", expanded, onPress }, h(Glyph, { icon: GLYPH.more, color: theme.colors.fg, size: 20 })) },
    pageActions.map((action) => [action.separated ? h(Divider, { key: `${action.id}-line`, style: { marginVertical: 4 } }) : null,
      h(NavMenuItem, { key: String(action.id), label: action.label, icon: action.icon, tone: action.tone, onPress: () => { action.onPress?.(); onPageAction?.(action.id, action); } })])) : null].filter(Boolean);
  return h(NavShell, { ...shellProps(props), variant: flags.variant, side: flags.side, collapsible: flags.collapsible, headerPosition: flags.headerPosition, breadcrumb: crumbs, aside, asideLabel: props.asideLabel,
    actions: actions.length ? actions : undefined, subheader: flags.headerSearch && win.width < 560 ? field() : undefined,
    sidebarHeader: head.length ? head : undefined, sidebarFooter: foot.length ? foot : undefined,
    sidebar: [h(NavList, { key: "nav", sections: shown, selected: value, onSelect: pick, submenu: flags.submenu, collapsibleSections: flags.fold, expandAll: filtering }),
      filtering && !shown.length ? h(Text, { key: "none", size: "sm", tone: "muted", style: { padding: theme.space.xs } }, emptyText) : null] }, children);
}
const VERSIONS = { label: "Versions", icon: "D" };

/** sidebar-01. Simple, grouped: a version switcher, search, and navigation grouped under section labels. */
export const Sidebar01 = (props) => Frame({ search: true, switcher: VERSIONS }, props);
/** sidebar-02. Collapsible sections: every section label folds its group open and closed. */
export const Sidebar02 = (props) => Frame({ search: true, fold: true, switcher: VERSIONS }, props);
/** sidebar-03. With submenus: top-level items with their submenus always visible beneath them. */
export const Sidebar03 = (props) => Frame({ submenu: "static", switcher: VERSIONS }, props);
/** sidebar-04. Floating with submenus: the panel is a detached, rounded card. */
export const Sidebar04 = (props) => Frame({ variant: "floating", submenu: "static", switcher: VERSIONS }, props);
/** sidebar-05. Collapsible submenus: each top-level item folds open to show its submenu. */
export const Sidebar05 = (props) => Frame({ search: true, switcher: VERSIONS }, props);
/** sidebar-06. Submenus as dropdowns: top-level items open their submenu in an anchored menu; promo is the card in the footer. */
export const Sidebar06 = (props) => Frame({ submenu: "dropdown", switcher: VERSIONS }, props);
/** sidebar-07. Collapses to icons: a team switcher, icon navigation and a user menu; the icon rail stays beside the content. */
export const Sidebar07 = (props) => Frame({ collapsible: "icon" }, props);
/** sidebar-08. Inset with secondary nav: the content sits in an inset card; secondary links are pinned at the bottom. */
export const Sidebar08 = (props) => Frame({ variant: "inset" }, props);
/** sidebar-10. Sidebar with popover: the workspace switcher and the page actions open in popovers. */
export const Sidebar10 = (props) => Frame({ switcher: { label: "Workspaces", doneLabel: "Done" } }, props);
/** sidebar-14. Sidebar on the right: the same grouped navigation, opening from the right edge. */
export const Sidebar14 = (props) => Frame({ side: "right" }, props);
/** sidebar-16. Sticky site header: a full-width header with search above the sidebar and the content. */
export const Sidebar16 = (props) => Frame({ variant: "inset", headerPosition: "site", headerSearch: true }, props);

/** sidebar-15. Left and right sidebars: navigation on the left, a calendar and details panel on the right. */
export function Sidebar15({ date, defaultDate, onDateChange, today, marked, aside, asideLabel = "Calendar", ...props }) {
  const theme = useTheme();
  return Frame({}, { ...props, asideLabel, aside: [h(NavCalendar, { key: "calendar", value: date, defaultValue: defaultDate, onChange: onDateChange, today, marked }),
    aside ? h(Divider, { key: "line" }) : null, aside ? h(View, { key: "more", style: { gap: theme.space.xs } }, aside) : null] });
}

/**
 * sidebar-09. Nested sidebars: an icon rail of folders next to a second sidebar that lists messages (mail-style).
 * folders: [{ id, label, icon, badge }]; messages: [{ id, folder, from, time, subject, preview, unread }].
 */
export function Sidebar09({ folders = [], folder, defaultFolder, onFolderChange, messages = [], selected, defaultSelected, onSelect, unreadOnly, defaultUnreadOnly = false, onUnreadOnlyChange, unreadLabel = "Unreads",
  searchPlaceholder = "Type to search…", emptyText = "Nothing here", brand, breadcrumb, title, children, ...props }) {
  const theme = useTheme(), c = theme.colors;
  const [current, setFolder] = useControlled(folder, defaultFolder ?? folders[0]?.id, onFolderChange), [value, pick] = useSelection(selected, defaultSelected, onSelect);
  const [only, setOnly] = useControlled(unreadOnly, defaultUnreadOnly, onUnreadOnlyChange), [shown, setShown] = useControlled(props.open, props.defaultOpen, props.onOpenChange), [query, setQuery] = useState("");
  const place = folders.find((entry) => entry.id === current) ?? {}, text = query.trim().toLowerCase();
  const list = messages.filter((mail) => (mail.folder ?? folders[0]?.id) === current && (!only || mail.unread) && (!text || `${mail.from} ${mail.subject} ${mail.preview}`.toLowerCase().includes(text)));
  const rail = [brand != null ? h(View, { key: "brand", style: { marginBottom: theme.space["2xs"] } }, h(Mark, { icon: brand, size: 36 })) : null,
    ...folders.map((entry) => h(NavItem, { key: String(entry.id), label: entry.label, icon: entry.icon, badge: entry.badge, selected: entry.id === current, onPress: () => { setFolder(entry.id); setShown(true); } }))];
  const head = h(View, { style: { gap: theme.space.xs, paddingHorizontal: theme.space["2xs"], paddingTop: theme.space["2xs"] } },
    h(View, { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: theme.touch } },
      h(Text, { weight: "semibold", accessibilityRole: "header" }, place.label ?? ""),
      h(View, { style: { flexDirection: "row", alignItems: "center", gap: theme.space.xs } }, h(Text, { size: "sm", tone: "muted" }, unreadLabel), h(Switch, { value: !!only, onValueChange: setOnly, accessibilityLabel: unreadLabel }))),
    h(NavSearch, { value: query, onChangeText: setQuery, placeholder: searchPlaceholder }));
  const rows = list.length ? list.map((mail) => {
    const on = mail.id === value;
    return h(Pressable, { key: String(mail.id), onPress: () => { pick(mail.id, mail); setShown(false); }, ...a11y("button", `${mail.from}, ${mail.subject}, ${mail.time}${mail.unread ? ", unread" : ""}`, { selected: on }),
      style: ({ pressed, hovered }) => ({ padding: theme.space.s, gap: 2, borderBottomWidth: 1, borderBottomColor: c.line, backgroundColor: on ? c.accentSoft : pressed || hovered ? c.line : "transparent" }) },
    h(View, { style: { flexDirection: "row", alignItems: "center", gap: theme.space.xs } },
      mail.unread ? h(View, { style: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.accent } }) : null,
      h(Text, { size: "sm", weight: "semibold", numberOfLines: 1, style: { flex: 1 } }, mail.from), h(Text, { size: "xs", tone: "muted" }, mail.time)),
    h(Text, { size: "sm", weight: "medium", numberOfLines: 1 }, mail.subject),
    mail.preview ? h(Text, { size: "xs", tone: "muted", numberOfLines: 2 }, mail.preview) : null);
  }) : h(Text, { size: "sm", tone: "muted", align: "center", style: { padding: theme.space.l } }, emptyText);
  const open = messages.find((mail) => mail.id === value);
  return h(NavShell, { ...shellProps(props), width: props.width ?? 300, open: shown, onOpenChange: setShown, rail, breadcrumb: breadcrumb ?? (title ? [title] : [place.label, open?.subject].filter(Boolean)),
    menuLabel: props.menuLabel ?? "Message list", navigationLabel: props.navigationLabel ?? "Messages", sidebarHeader: head, sidebar: h(View, { style: { marginHorizontal: -theme.space.xs, marginTop: -theme.space.xs, borderTopWidth: 1, borderTopColor: c.line } }, rows) }, children);
}

const STATUS_TONE = { M: "warn", U: "ok", A: "ok", D: "bad", R: "accent" };
/**
 * sidebar-11. Collapsible file tree: a list of changed files with their status and a tree of folders that fold.
 * changes: [{ id, label, status }] (status M, U, A, D or R); tree: [{ id, label, children }].
 */
export function Sidebar11({ changes = [], tree = [], selected, defaultSelected, onSelect, changesTitle = "Changes", treeTitle = "Files", breadcrumb, title, children, ...props }) {
  const theme = useTheme(), [value, pick] = useSelection(selected, defaultSelected, onSelect);
  const changed = changes.map((entry) => ({ ...entry, icon: entry.icon ?? h(FileIcon, { color: theme.colors.muted }),
    trailing: entry.status ? h(Text, { size: "xs", weight: "bold", tone: STATUS_TONE[entry.status] ?? "muted", accessibilityLabel: `status ${entry.status}` }, entry.status) : undefined }));
  const crumbs = breadcrumb ?? (title ? [title] : trailOf([{ items: tree }, { items: changes }], value).slice(-1));
  return h(NavShell, { ...shellProps(props), breadcrumb: crumbs, navigationLabel: props.navigationLabel ?? "Files", sidebar: [
    changes.length ? h(NavList, { key: "changes", sections: [{ id: "changes", title: changesTitle, items: changed }], selected: value, onSelect: pick }) : null,
    h(NavSection, { key: "tree", title: treeTitle }, h(NavList, { items: tree, selected: value, onSelect: pick, variant: "tree", style: { gap: 0 } }))] }, children);
}

/**
 * sidebar-12. With a calendar: the account at the top, a month calendar, and lists of calendars to switch on and off.
 * calendars: [{ id, title, items: [{ id, label, tone }] }]; checked is the list of ids that are on.
 */
export function Sidebar12({ user, date, defaultDate, onDateChange, today, marked, calendars = [], checked, defaultChecked = [], onCheckedChange, breadcrumb, title, children, ...props }) {
  const [day, setDay] = useControlled(date, defaultDate, onDateChange), [month, setMonth] = useState(day ?? today ?? new Date()), [on, setOn] = useControlled(checked, defaultChecked, onCheckedChange);
  return h(NavShell, { ...shellProps(props), breadcrumb: breadcrumb ?? (title ? [title] : [`${MONTHS[month.getMonth()]} ${month.getFullYear()}`]), navigationLabel: props.navigationLabel ?? "Calendars",
    sidebarHeader: user ? h(NavUser, { placement: "bottom", ...user }) : undefined, sidebar: [
      h(NavCalendar, { key: "calendar", value: day, onChange: setDay, month, onMonthChange: setMonth, today, marked }), h(Divider, { key: "line" }),
      ...calendars.map((group, index) => h(NavSection, { key: String(group.id ?? index), title: group.title, collapsible: true, defaultOpen: group.defaultOpen ?? index === 0 },
        (group.items ?? []).map((entry) => h(NavCheckItem, { key: String(entry.id), label: entry.label, tone: entry.tone, checked: on.includes(entry.id), onChange: (next) => setOn(next ? [...on, entry.id] : on.filter((id) => id !== entry.id)) }))))] }, children);
}

/**
 * sidebar-13. Sidebar in a dialog: a settings dialog with its own navigation. visible + onClose as for Dialog.
 * On a phone the navigation slides in inside the dialog; on wide screens it sits beside the settings page.
 */
export function Sidebar13({ visible, onClose, title = "Settings", items, sections, selected, defaultSelected, onSelect, closeLabel = "Close", height = 560, children, ...props }) {
  const theme = useTheme(), c = theme.colors, groups = sections ?? [{ id: "items", items: items ?? [] }], [value, pick] = useSelection(selected, defaultSelected, onSelect);
  return h(Modal, { visible: !!visible, transparent: true, animationType: "fade", onRequestClose: onClose, statusBarTranslucent: true },
    h(View, { style: { flex: 1, alignItems: "center", justifyContent: "center", padding: theme.space.m } },
      h(Pressable, { onPress: onClose, accessibilityLabel: closeLabel, style: flat(FILL, { backgroundColor: c.overlay }) }),
      h(View, { accessibilityViewIsModal: true, accessibilityRole: web ? "dialog" : undefined, "aria-modal": true, accessibilityLabel: title,
        style: { width: "100%", maxWidth: 760, height, maxHeight: "92%", borderRadius: theme.radius.l, borderWidth: 1, borderColor: c.line, backgroundColor: c.bg, overflow: "hidden", ...depth(theme.shadow.l) } },
      h(NavShell, { width: 240, ...shellProps(props), contained: true, breadcrumb: [title, ...trailOf(groups, value).slice(-1)], menuLabel: props.menuLabel ?? `${title} sections`, navigationLabel: title,
        actions: h(IconButton, { label: closeLabel, onPress: onClose }, h(Glyph, { icon: GLYPH.close, color: c.fg, size: 22 })),
        sidebarHeader: h(Text, { weight: "semibold", accessibilityRole: "header", style: { paddingHorizontal: 10, paddingTop: theme.space.xs } }, title),
        sidebar: h(NavList, { sections: groups, selected: value, onSelect: pick }) }, children))));
}

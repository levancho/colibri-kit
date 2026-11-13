// Navigation: moving between and within screens. Menu, Pagination, ScrollSpy and ScrollTo, Sidebar, Stepper,
// TabView and TabNav.
// Built on the basics only. Roles that exist only on the web (navigation, tabpanel, option, aria-current) are
// passed there and left out on iOS and Android, where they are not valid accessibility roles.
import { Children, cloneElement, createContext, createElement as h, forwardRef, isValidElement, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Modal, Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { useTheme } from "./provider.js";
import { toneName } from "./theme.js";
import { web, depth, flat, GLYPH } from "./internal.js";
import { Text, Badge, Button, Divider } from "./components.js";

// ---------------------------------------------------------------- shared
const onWeb = (props) => (web ? props : null);
/** Decorative glyphs are skipped by screen readers. */
const HIDDEN = { accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants", ...onWeb({ "aria-hidden": true }) };
const keyOf = (item, index) => String(item.value ?? item.key ?? item.label ?? index);

/** value + onChange when value is given, otherwise internal state seeded from the default. */
function useControlled(value, fallback, onChange) {
  const [inner, setInner] = useState(fallback), controlled = value !== undefined;
  const latest = useRef(onChange); latest.current = onChange;
  const set = useCallback((next, ...extra) => { if (!controlled) setInner(next); latest.current?.(next, ...extra); }, [controlled]);
  return [controlled ? value : inner, set];
}

/** An icon is a text glyph (a string) or any element. */
function Glyph({ color, size = 17, width = 22, children }) {
  if (children == null || children === false) return null;
  if (typeof children !== "string") return h(View, { style: { width, alignItems: "center" } }, children);
  return h(Text, { ...HIDDEN, style: { width, textAlign: "center", color, fontSize: size, lineHeight: size + 5 } }, children);
}

const Keys = ({ children }) => {
  const theme = useTheme();
  return h(View, { ...HIDDEN, style: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: Math.min(6, theme.radius.s), borderWidth: 1, borderColor: theme.colors.line, backgroundColor: theme.colors.sunken } },
    h(Text, { size: "xs", tone: "muted", weight: "medium" }, children));
};

const GroupLabel = ({ children, style }) => {
  const theme = useTheme();
  return h(Text, { size: "xs", weight: "bold", tone: "muted", accessibilityRole: "header", numberOfLines: 1,
    style: flat({ letterSpacing: 0.8, textTransform: "uppercase", paddingHorizontal: theme.space.s, paddingTop: theme.space.s, paddingBottom: theme.space["2xs"] }, style) }, children);
};

/** One pressable line: glyph, label (and description), then whatever trails. Used by Menu and Sidebar. */
function Row({ icon, label, description, trailing, selected = false, disabled = false, danger = false, indent = 0, rail = false, onPress, style, ...rest }) {
  const theme = useTheme(), c = theme.colors, color = danger ? c.bad : selected ? c.accent : c.fg;
  return h(Pressable, { onPress, disabled, ...rest,
    style: ({ pressed }) => flat({ minHeight: theme.touch, paddingVertical: theme.space["2xs"], paddingLeft: rail ? 0 : theme.space.s + indent, paddingRight: rail ? 0 : theme.space.s, flexDirection: "row", alignItems: "center",
      justifyContent: rail ? "center" : "flex-start", gap: theme.space.s, borderRadius: theme.radius.s, backgroundColor: selected ? c.accentSoft : pressed ? c.sunken : "transparent", opacity: disabled ? 0.45 : 1 }, style) },
    h(Glyph, { color: danger || selected ? color : c.muted }, rail ? icon ?? String(label ?? "").slice(0, 1).toUpperCase() : icon),
    rail ? null : h(View, { style: { flex: 1 } },
      h(Text, { weight: selected ? "semibold" : "medium", numberOfLines: 1, style: { color } }, label),
      description ? h(Text, { size: "xs", tone: "muted", numberOfLines: 2 }, description) : null),
    rail ? null : trailing);
}

/**
 * The entry list behind Menu and Sidebar. An entry is an item { value, label, icon, shortcut, badge, checked,
 * disabled, tone, items, onPress }, a group { type: "group", label, items } or a separator { type: "separator" }.
 * An item with items is a submenu that expands in place.
 */
function Entries({ items, value, onSelect, expanded, toggle, kind, rail = false, depthLevel = 0 }) {
  const theme = useTheme(), c = theme.colors;
  return items.map((item, index) => {
    const key = keyOf(item, index);
    if (item.type === "separator") return h(Divider, { key: `separator-${index}`, style: { marginVertical: theme.space["2xs"] } });
    if (item.type === "group") {
      return h(View, { key: `group-${key}`, ...onWeb({ accessibilityRole: "group", accessibilityLabel: item.label }) },
        rail ? (index ? h(Divider, { style: { marginVertical: theme.space.xs } }) : null) : item.label ? h(GroupLabel, null, item.label) : null,
        h(Entries, { items: item.items ?? [], value, onSelect, expanded, toggle, kind, rail, depthLevel }));
    }
    const submenu = Array.isArray(item.items) && item.items.length > 0, open = submenu && !rail && expanded.has(key);
    const checkable = typeof item.checked === "boolean", selected = !submenu && item.value !== undefined && item.value === value;
    const tone = theme.tones[toneName(item.badgeTone)] ? item.badgeTone : undefined;
    const trailing = [
      item.badge != null && item.badge !== false ? h(Badge, { key: "badge", tone: tone ?? (selected ? "accent" : undefined), style: { alignSelf: "center" } }, item.badge) : null,
      item.shortcut ? h(Keys, { key: "keys" }, item.shortcut) : null,
      checkable ? h(Glyph, { key: "check", color: c.accent }, item.checked ? GLYPH.check : " ") : null,
      submenu ? h(Glyph, { key: "chevron", color: c.muted }, open ? GLYPH.chevronDown : GLYPH.chevronRight) : null,
    ];
    const state = { disabled: !!item.disabled, ...(submenu ? { expanded: open } : null), ...(checkable ? { checked: item.checked } : selected || kind === "menu" ? { selected } : null) };
    const role = kind === "menu" ? (checkable && web ? "menuitemcheckbox" : "menuitem") : submenu ? "button" : "link";
    return h(View, { key },
      h(Row, { icon: item.icon, label: item.label, description: item.description, trailing, selected, disabled: item.disabled, danger: toneName(item.tone) === "bad", indent: depthLevel * theme.space.l, rail,
        accessibilityRole: role, accessibilityLabel: item.accessibilityLabel ?? (rail || item.badge != null ? [item.label, item.badge].filter((part) => part != null && part !== false).join(", ") : undefined), accessibilityState: state,
        "aria-disabled": !!item.disabled, ...(submenu ? { "aria-expanded": open } : null), ...(checkable ? { "aria-checked": item.checked } : null),
        ...(kind === "menu" && !checkable && !submenu ? { "aria-selected": selected } : null), ...(kind === "nav" && selected ? onWeb({ "aria-current": "page" }) : null), testID: item.testID,
        onPress: () => { if (submenu && !rail) toggle(key); else { item.onPress?.(item); onSelect?.(item.value, item); } } }),
      open ? h(View, { style: { marginLeft: theme.space.s + 11 + depthLevel * theme.space.l, paddingLeft: theme.space["2xs"], borderLeftWidth: 1, borderLeftColor: c.line } },
        h(Entries, { items: item.items, value, onSelect, expanded, toggle, kind, depthLevel: 0 })) : null);
  });
}

function useExpanded(initial) {
  const [expanded, setExpanded] = useState(() => new Set(initial ?? []));
  const toggle = useCallback((key) => setExpanded((current) => { const next = new Set(current); if (!next.delete(key)) next.add(key); return next; }), []);
  return [expanded, toggle];
}

// ---------------------------------------------------------------- menu
/**
 * A vertical list of actions. On the web kit `menu` is a desktop menu bar (File, Edit, View) opened by hover and
 * arrow keys; a phone has neither, so this is the list those menus contain: groups, separators, glyph icons,
 * shortcuts as text, checkable items, a selected item, and submenus that expand in place.
 * items: item | { type: "group", label, items } | { type: "separator" }.
 */
export function Menu({ items = [], value, onSelect, defaultExpanded, label, style, ...rest }) {
  const theme = useTheme(), [expanded, toggle] = useExpanded(defaultExpanded);
  return h(View, { accessibilityRole: "menu", accessibilityLabel: label, style: flat({ gap: theme.space["3xs"] }, style), ...rest },
    h(Entries, { items, value, onSelect, expanded, toggle, kind: "menu" }));
}

// ---------------------------------------------------------------- pagination
const span = (from, to) => Array.from({ length: Math.max(0, to - from + 1) }, (_, index) => from + index);
/** 1 … 6 7 8 … 20: always the same number of slots, so the buttons do not jump about. */
function pageSlots(page, total, siblings) {
  const block = siblings * 2 + 3;
  if (total <= block + 2) return span(1, total);
  if (page <= siblings + 3) return [...span(1, block), "gap-end", total];
  if (page >= total - siblings - 2) return [1, "gap-start", ...span(total - block + 1, total)];
  return [1, "gap-start", ...span(page - siblings, page + siblings), "gap-end", total];
}

/**
 * Page numbers with previous and next. page is 1-based, total is the number of pages.
 * It drops to fewer neighbours, then to the compact "Page 3 of 20" form, when the row is too narrow; compact forces that form.
 */
export function Pagination({ page, defaultPage = 1, total = 1, onChange, siblings = 1, compact = false, disabled = false, label = "Pages", style, ...rest }) {
  const theme = useTheme(), c = theme.colors, [value, setValue] = useControlled(page, defaultPage, onChange), [width, setWidth] = useState(0);
  const pages = Math.max(1, Math.floor(total) || 1), current = Math.min(pages, Math.max(1, Math.floor(value) || 1)), size = 36, gap = theme.space["2xs"];
  const fits = (count) => !width || count * size + (count - 1) * gap <= width;
  let around = Math.max(0, siblings);
  while (around > 0 && !fits(pageSlots(current, pages, around).length + 2)) around--;
  const small = compact || !fits(pageSlots(current, pages, around).length + 2);
  const go = (next) => { if (next !== current && next >= 1 && next <= pages) setValue(next); };
  const cell = (key, content, props, look = {}) => h(Pressable, { key, hitSlop: (theme.touch - size) / 2, accessibilityRole: "button", ...props, disabled: disabled || props.disabled, "aria-disabled": !!(disabled || props.disabled),
    accessibilityState: { disabled: !!(disabled || props.disabled), ...props.accessibilityState },
    style: ({ pressed }) => ({ minWidth: size, height: size, paddingHorizontal: 6, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.s, borderWidth: 1, borderColor: look.selected ? c.accent : look.edge ? c.line : "transparent",
      backgroundColor: look.selected ? c.accent : pressed ? c.sunken : "transparent", opacity: disabled || props.disabled ? 0.4 : 1 }) },
    h(Text, { size: look.edge ? "lg" : "sm", weight: look.selected ? "bold" : "medium", style: flat({ color: look.selected ? c.brandFg : c.fg }, look.edge && { lineHeight: 22 }) }, content));
  const previous = cell("previous", GLYPH.chevronLeft, { onPress: () => go(current - 1), disabled: current <= 1, accessibilityLabel: "Previous page" }, { edge: true });
  const next = cell("next", GLYPH.chevronRight, { onPress: () => go(current + 1), disabled: current >= pages, accessibilityLabel: "Next page" }, { edge: true });
  return h(View, { accessibilityLabel: label, ...onWeb({ accessibilityRole: "navigation" }), onLayout: (event) => setWidth(event.nativeEvent.layout.width),
    style: flat({ alignSelf: "stretch", flexDirection: "row", alignItems: "center", justifyContent: small ? "space-between" : "center", gap }, style), ...rest },
    previous,
    small ? h(Text, { key: "status", size: "sm", tone: "muted", accessibilityLiveRegion: "polite" }, "Page ", h(Text, { size: "sm", weight: "semibold" }, current), ` of ${pages}`)
      : pageSlots(current, pages, around).map((slot) => typeof slot === "string"
        ? h(View, { key: slot, ...HIDDEN, style: { minWidth: size, height: size, alignItems: "center", justifyContent: "center" } }, h(Text, { size: "sm", tone: "muted" }, GLYPH.more))
        : cell(slot, slot, { onPress: () => go(slot), accessibilityLabel: `Page ${slot}`, accessibilityState: { selected: slot === current }, ...(slot === current ? onWeb({ "aria-current": "page" }) : null) }, { selected: slot === current })),
    next);
}

// ---------------------------------------------------------------- scrollspy and scrollto
const SpyContext = createContext(null);

/**
 * Tracks which section of a ScrollView is in view and scrolls to one by id.
 *   const spy = useScrollSpy();   spy.active   spy.scrollTo("pricing")
 * Use it with <ScrollSpy spy={spy}> and <ScrollSpySection id>, or wire your own ScrollView with
 * {...spy.scrollViewProps} and give each section {...spy.sectionProps(id)} (sections must be direct children of the content).
 * offset is the height covered at the top (a pinned header); when it is not given, ScrollSpy measures the children
 * named by its stickyHeaderIndices prop.
 */
export function useScrollSpy({ offset, defaultActive = null, onChange, animated = true } = {}) {
  const ref = useRef(null), [active, setActive] = useState(defaultActive);
  const state = useRef({ sections: new Map(), y: 0, viewport: 0, content: 0, header: 0, lock: 0, active: defaultActive, reduce: false, offset, onChange, animated }).current;
  Object.assign(state, { offset, onChange, animated });
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.()?.then?.((reduce) => { if (alive) state.reduce = !!reduce; }, () => {});
    return () => { alive = false; };
  }, [state]);
  const api = useMemo(() => {
    const inset = () => state.offset ?? state.header;
    const choose = (id) => { if (id !== state.active) { state.active = id; setActive(id); state.onChange?.(id); } };
    const measure = () => {
      if (Date.now() < state.lock) return;
      const sections = [...state.sections.entries()].sort((a, b) => a[1].y - b[1].y);
      if (!sections.length) return;
      let current = sections[0][0];
      for (const [id, section] of sections) if (section.y <= state.y + inset() + 1) current = id;
      if (state.content > state.viewport + 1 && state.y + state.viewport >= state.content - 1) current = sections[sections.length - 1][0];
      choose(current);
    };
    const scrollTo = (id, options = {}) => {
      const section = state.sections.get(id), top = id === "top" && !section;
      if (!section && !top) return false;
      const y = top ? 0 : Math.max(0, section.y - (options.offset ?? inset()));
      state.lock = Date.now() + 700; // the sections passed on the way are not announced as active
      ref.current?.scrollTo?.({ y, animated: (options.animated ?? state.animated) && !state.reduce });
      if (section) choose(id); else { state.lock = 0; }
      // Move the screen reader (and on the web the keyboard) to the section that was asked for.
      try { if (web) section?.node?.focus?.({ preventScroll: true }); else if (section?.node) AccessibilityInfo.sendAccessibilityEvent?.(section.node, "focus"); } catch { /* focus is a courtesy */ }
      return true;
    };
    return {
      ref, scrollTo, refresh: () => { state.lock = 0; measure(); },
      register: (id, y, node) => { state.sections.set(id, { y, node }); measure(); },
      unregister: (id) => { state.sections.delete(id); },
      setHeaderHeight: (height) => { state.header = height; },
      scrollViewProps: {
        ref, scrollEventThrottle: 16,
        onScroll: (event) => { const e = event.nativeEvent; state.y = e.contentOffset.y; if (e.layoutMeasurement) state.viewport = e.layoutMeasurement.height; if (e.contentSize) state.content = e.contentSize.height; measure(); },
        onLayout: (event) => { state.viewport = event.nativeEvent.layout.height; },
        onContentSizeChange: (_, height) => { state.content = height; },
      },
      sectionProps: (id) => ({ onLayout: (event) => api.register(id, event.nativeEvent.layout.y, state.sections.get(id)?.node) }),
    };
  }, [state]);
  return useMemo(() => ({ ...api, active }), [api, active]);
}

/**
 * The ScrollView for a scroll spy. Put <ScrollSpySection id="…"> directly inside; every ScrollView prop passes through.
 * A header pinned with the ScrollView's own stickyHeaderIndices prop is measured, so sections stop just below it.
 * Pass spy (from useScrollSpy) to read spy.active outside it; otherwise it keeps its own and reports through onChange(id).
 */
export const ScrollSpy = forwardRef(function ScrollSpy({ spy: given, offset, defaultActive, onChange, onScroll, onLayout, onContentSizeChange, stickyHeaderIndices: pins, children, ...rest }, ref) {
  const own = useScrollSpy({ offset, defaultActive, onChange }), spy = given ?? own, wired = spy.scrollViewProps, heights = useRef({}).current;
  useImperativeHandle(ref, () => spy.ref.current, [spy.ref]);
  const pinned = Array.isArray(pins) && pins.length > 0;
  // Children.toArray drops empty children, so an index means the same child on every platform.
  const content = pinned ? Children.toArray(children).map((child, index) => (pins.includes(index) && isValidElement(child)
    ? cloneElement(child, { onLayout: (event) => { heights[index] = event.nativeEvent.layout.height; spy.setHeaderHeight(Math.max(0, ...Object.values(heights))); child.props.onLayout?.(event); } }) : child)) : children;
  return h(SpyContext.Provider, { value: spy }, h(ScrollView, { ...rest, ref: spy.ref, scrollEventThrottle: 16, stickyHeaderIndices: pinned ? pins : undefined,
    onScroll: (event) => { wired.onScroll(event); onScroll?.(event); }, onLayout: (event) => { wired.onLayout(event); onLayout?.(event); },
    onContentSizeChange: (width, height) => { wired.onContentSizeChange(width, height); onContentSizeChange?.(width, height); } }, content));
});

/** One tracked section. Must be a direct child of ScrollSpy so its offset is measured against the content. */
export function ScrollSpySection({ id, spy: given, style, children, onLayout, ...rest }) {
  const spy = useContext(SpyContext) ?? given, node = useRef(null), register = spy?.register, unregister = spy?.unregister;
  useEffect(() => () => unregister?.(id), [id, unregister]);
  return h(View, { ref: node, ...onWeb({ tabIndex: -1 }), ...rest, style: flat(web && { outlineStyle: "none" }, style),
    onLayout: (event) => { register?.(id, event.nativeEvent.layout.y, node.current); onLayout?.(event); } }, children);
}

/**
 * A link that scrolls to a section: <ScrollTo to="pricing">Pricing</ScrollTo>, or to="top".
 * variant: link | chip | button. It marks itself current while its section is the one in view.
 * Inside ScrollSpy it finds the spy itself; outside (a floating button, a header) pass spy.
 */
export function ScrollTo({ to = "top", spy: given, offset, variant = "link", title, children, onScroll, style, ...rest }) {
  const theme = useTheme(), c = theme.colors, found = useContext(SpyContext), spy = given ?? found, current = !!spy && to !== "top" && spy.active === to, content = children ?? title;
  const press = () => { if (spy?.scrollTo(to, offset === undefined ? undefined : { offset })) onScroll?.(to); };
  if (variant === "button") return h(Button, { variant: "outline", size: "s", onPress: press, style, ...rest }, content);
  const chip = variant === "chip";
  return h(Pressable, { onPress: press, accessibilityRole: "link", accessibilityState: { selected: current }, ...(current ? onWeb({ "aria-current": "location" }) : null), hitSlop: chip ? 6 : 10,
    style: ({ pressed }) => flat(chip ? { minHeight: 32, paddingHorizontal: theme.space.s, justifyContent: "center", borderRadius: theme.radius.full, borderWidth: 1, borderColor: current ? c.accent : c.line,
      backgroundColor: current ? c.accentSoft : pressed ? c.sunken : c.surface } : { alignSelf: "flex-start", opacity: pressed ? 0.6 : 1 }, style), ...rest },
    typeof content === "string" ? h(Text, { size: "sm", weight: current || !chip ? "semibold" : "medium", numberOfLines: 1, style: { color: current || !chip ? c.accent : c.fg } }, content) : content);
}

// ---------------------------------------------------------------- sidebar
/**
 * App navigation. On a phone it is a drawer that slides in from the edge (open + onOpenChange); from `breakpoint`
 * up it renders in place as a column, where collapsed shrinks it to a rail of icons. mode forces either form.
 * items takes the same entries as Menu (groups, badges, nested items); header and footer are any elements.
 * The web kit's Ctrl/Cmd+B shortcut and remembered state are left to the app.
 */
export function Sidebar({ open = false, onOpenChange, mode = "auto", breakpoint = 768, side = "left", width = 288, collapsed = false, items = [], value, onSelect, closeOnSelect = true, defaultExpanded,
  header, footer, label = "Sidebar", children, style }) {
  const theme = useTheme(), c = theme.colors, screen = useWindowDimensions(), [expanded, toggle] = useExpanded(defaultExpanded);
  const drawer = mode === "drawer" || (mode === "auto" && screen.width < breakpoint), right = side === "right";
  const size = drawer ? Math.min(width, screen.width - theme.touch) : collapsed ? theme.touch + theme.space.xs * 2 : width;
  const slide = useRef(new Animated.Value(0)).current, [mounted, setMounted] = useState(drawer && open);
  useEffect(() => {
    if (!drawer) { setMounted(false); return undefined; }
    if (open) setMounted(true);
    const motion = Animated.timing(slide, { toValue: open ? 1 : 0, duration: open ? 220 : 180, useNativeDriver: !web });
    motion.start(({ finished }) => { if (finished && !open) setMounted(false); });
    return () => motion.stop();
  }, [drawer, open, slide]);
  const close = () => onOpenChange?.(false), rail = !drawer && collapsed;
  const body = [
    header ? h(View, { key: "header", style: { padding: theme.space.s, borderBottomWidth: 1, borderBottomColor: c.line } }, header) : null,
    h(ScrollView, { key: "body", style: { flex: 1 }, contentContainerStyle: { padding: theme.space.xs, gap: theme.space["3xs"] }, keyboardShouldPersistTaps: "handled" },
      h(Entries, { items, value, expanded, toggle, kind: "nav", rail, onSelect: (next, item) => { onSelect?.(next, item); if (drawer && closeOnSelect) close(); } }), children),
    footer ? h(View, { key: "footer", style: { padding: theme.space.s, borderTopWidth: 1, borderTopColor: c.line } }, footer) : null,
  ];
  const edge = right ? { borderLeftWidth: 1, borderLeftColor: c.line } : { borderRightWidth: 1, borderRightColor: c.line };
  if (!drawer) return h(View, { accessibilityLabel: label, ...onWeb({ accessibilityRole: "navigation" }), style: flat({ width: size, alignSelf: "stretch", backgroundColor: c.surface }, edge, style) }, body);
  return h(Modal, { visible: mounted, transparent: true, animationType: "none", onRequestClose: close, statusBarTranslucent: true },
    h(View, { style: { flex: 1, flexDirection: "row", justifyContent: right ? "flex-end" : "flex-start" } },
      h(Animated.View, { style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: c.overlay, opacity: slide } },
        h(Pressable, { onPress: close, accessibilityRole: "button", accessibilityLabel: "Close navigation", style: { flex: 1 } })),
      h(Animated.View, { accessibilityViewIsModal: true, accessibilityLabel: label, ...onWeb({ accessibilityRole: "navigation" }),
        style: flat({ width: size, backgroundColor: c.surface, transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [right ? size : -size, 0] }) }] }, edge, depth(theme.shadow.l), style) }, body)));
}

// ---------------------------------------------------------------- stepper
/**
 * A wizard: numbered steps, the current step's panel, and Back / Next / Finish.
 * steps: [{ label, description, content, optional }]; value is the current index (steps.length means finished).
 * orientation: horizontal | vertical. clickable lets people press a step to go to it (in linear mode only
 * back to completed ones). onBeforeChange(from, to) may return false to stay, for example when a field is invalid.
 */
export function Stepper({ steps = [], value, defaultValue = 0, onChange, onBeforeChange, onFinish, orientation = "horizontal", clickable = false, linear = false, actions = true,
  backLabel = "Back", nextLabel = "Next", finishLabel = "Finish", label = "Progress", style, ...rest }) {
  const theme = useTheme(), c = theme.colors, [raw, setRaw] = useControlled(value, defaultValue, onChange);
  const count = steps.length, current = Math.min(count, Math.max(0, Math.floor(raw) || 0)), vertical = orientation === "vertical", dot = 28;
  const go = (to) => { if (to === current || to < 0 || to > count) return; if (onBeforeChange?.(current, to) === false) return; setRaw(to, current); if (to === count) onFinish?.(current); };
  const reachable = (index) => clickable && index !== current && (!linear || index < current);
  const bar = (on, key, extra) => h(View, { key, style: flat(vertical ? { width: 2, flex: 1, minHeight: theme.space.s } : { height: 2, flex: 1 }, { borderRadius: 1, backgroundColor: on ? c.accent : c.line }, extra) });
  const marker = (index) => {
    const done = index < current, now = index === current;
    return h(View, { style: { width: dot, height: dot, borderRadius: dot / 2, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: done || now ? c.accent : c.line, backgroundColor: done ? c.accent : c.surface } },
      h(Text, { ...HIDDEN, size: "xs", weight: "bold", style: { color: done ? c.brandFg : now ? c.accent : c.muted } }, done ? GLYPH.check : index + 1));
  };
  const words = (step, index, centered) => [
    h(Text, { key: "label", size: "sm", weight: index === current ? "semibold" : "medium", tone: index > current ? "muted" : undefined, align: centered ? "center" : undefined, numberOfLines: 2 }, step.label),
    step.description || step.optional ? h(Text, { key: "note", size: "xs", tone: "muted", align: centered ? "center" : undefined, numberOfLines: 2 }, step.description ?? "Optional") : null,
  ];
  const a11y = (step, index) => {
    const status = index < current ? "completed" : index === current ? "current" : "upcoming", press = reachable(index);
    return { accessibilityRole: press ? "button" : undefined, accessible: true, accessibilityLabel: `Step ${index + 1} of ${count}: ${step.label}, ${status}`, accessibilityState: { selected: index === current, disabled: clickable && !press && index !== current },
      ...(index === current ? onWeb({ "aria-current": "step" }) : null), ...onWeb({ accessibilityRole: press ? "button" : "listitem" }), onPress: press ? () => go(index) : undefined, disabled: !press, testID: step.testID };
  };
  const panel = (step) => (step?.content == null ? null : typeof step.content === "function" ? step.content({ index: current, next: () => go(current + 1), back: () => go(current - 1), goTo: go }) : step.content);
  const buttons = actions && current < count ? h(View, { key: "actions", style: { flexDirection: "row", justifyContent: "space-between", gap: theme.space.xs } },
    h(Button, { title: backLabel, variant: "outline", disabled: current === 0, onPress: () => go(current - 1), testID: "stepper-back" }),
    h(Button, { title: current === count - 1 ? finishLabel : nextLabel, onPress: () => go(current + 1), testID: "stepper-next" })) : null;
  const list = onWeb({ accessibilityRole: "list" });
  if (vertical) {
    return h(View, { accessibilityLabel: label, style: flat({ gap: theme.space.s }, style), ...rest },
      h(View, { ...list }, steps.map((step, index) => h(View, { key: index, style: { flexDirection: "row", gap: theme.space.s } },
        h(View, { style: { alignItems: "center", gap: theme.space["2xs"], paddingBottom: index < count - 1 ? theme.space["2xs"] : 0 } }, marker(index), index < count - 1 ? bar(index < current, "bar") : null),
        h(View, { style: { flex: 1, paddingBottom: index < count - 1 ? theme.space.m : 0, gap: theme.space.xs } },
          h(Pressable, { ...a11y(step, index), style: { minHeight: dot, justifyContent: "center" } }, words(step, index, false)),
          index === current ? panel(step) : null)))),
      buttons);
  }
  return h(View, { accessibilityLabel: label, style: flat({ gap: theme.space.m }, style), ...rest },
    h(View, { ...list, style: { flexDirection: "row", alignItems: "flex-start" } }, steps.map((step, index) => h(Pressable, { key: index, ...a11y(step, index), style: { flex: 1, alignItems: "center", gap: theme.space["2xs"] } },
      h(View, { style: { alignSelf: "stretch", flexDirection: "row", alignItems: "center", gap: theme.space["2xs"] } },
        bar(index <= current, "before", index === 0 && { opacity: 0 }), marker(index), bar(index < current, "after", index === count - 1 && { opacity: 0 })),
      h(View, { style: { paddingHorizontal: theme.space["2xs"] } }, words(step, index, true))))),
    current < count && steps[current]?.content != null ? h(View, { key: "panel", ...onWeb({ accessibilityRole: "region", accessibilityLabel: steps[current].label }) }, panel(steps[current])) : null,
    buttons);
}

// ---------------------------------------------------------------- tabs
/** The underlined bar behind TabView (tabs) and TabNav (links). Scrolls sideways when the tabs do not fit. */
function TabBar({ items, value, onSelect, scrollable, link, label, style }) {
  const theme = useTheme(), c = theme.colors, boxes = useRef({}).current, nodes = useRef({}).current, scroller = useRef(null), view = useRef(0);
  const left = useRef(new Animated.Value(0)).current, width = useRef(new Animated.Value(0)).current, placed = useRef(false);
  const scrolls = scrollable ?? items.length > 4, selectedKey = String(value);
  const place = useCallback((animate) => {
    const box = boxes[selectedKey];
    if (!box) { width.setValue(0); placed.current = false; return; }
    if (animate && placed.current) Animated.parallel([Animated.timing(left, { toValue: box.x, duration: 180, useNativeDriver: false }), Animated.timing(width, { toValue: box.width, duration: 180, useNativeDriver: false })]).start();
    else { left.setValue(box.x); width.setValue(box.width); placed.current = true; }
    if (view.current) scroller.current?.scrollTo?.({ x: Math.max(0, box.x - (view.current - box.width) / 2), animated: animate });
  }, [boxes, left, width, selectedKey]);
  useEffect(() => { place(true); }, [place]);
  const enabled = items.filter((item) => !item.disabled);
  const onKeyDown = (event, item) => {
    const at = enabled.indexOf(item), move = { ArrowRight: at + 1, ArrowLeft: at - 1, Home: 0, End: enabled.length - 1 }[event.key];
    if (move === undefined || !enabled.length) return;
    event.preventDefault?.();
    const next = enabled[(move + enabled.length) % enabled.length];
    onSelect(next); nodes[String(next.value)]?.focus?.();
  };
  const focusable = enabled.some((item) => String(item.value) === selectedKey) ? selectedKey : String(enabled[0]?.value);
  const tabs = items.map((item) => {
    const key = String(item.value), selected = key === selectedKey, off = !!item.disabled;
    return h(Pressable, { key, ref: (node) => { nodes[key] = node; }, onPress: () => onSelect(item), disabled: off, testID: item.testID,
      accessibilityRole: link ? "link" : "tab", accessibilityState: { selected, disabled: off }, "aria-disabled": off, ...(link ? (selected ? onWeb({ "aria-current": "page" }) : null) : { "aria-selected": selected }),
      ...onWeb({ onKeyDown: (event) => onKeyDown(event, item), ...(link ? null : { tabIndex: key === focusable ? 0 : -1 }) }),
      onLayout: (event) => { const { x, width: w } = event.nativeEvent.layout; boxes[key] = { x, width: w }; if (selected) place(false); },
      style: ({ pressed }) => ({ minHeight: theme.touch, paddingHorizontal: scrolls ? theme.space.m : theme.space.xs, flexGrow: scrolls ? 0 : 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: theme.space["2xs"],
        backgroundColor: pressed ? c.sunken : "transparent", opacity: off ? 0.4 : 1 }) },
      typeof item.icon === "string" ? h(Glyph, { color: selected ? c.accent : c.muted, width: 18, size: 15 }, item.icon) : item.icon ?? null,
      h(Text, { size: "sm", weight: selected ? "semibold" : "medium", numberOfLines: 1, style: { color: selected ? c.accent : c.muted, flexShrink: 1 } }, item.label),
      item.badge != null && item.badge !== false ? h(Badge, { tone: selected ? "accent" : undefined, style: { alignSelf: "center" } }, item.badge) : null);
  });
  const row = h(View, { style: { flexDirection: "row", flexGrow: 1 }, ...(scrolls ? null : { accessibilityRole: link ? undefined : "tablist", accessibilityLabel: label, ...(link ? onWeb({ accessibilityRole: "navigation" }) : null) }) }, tabs,
    h(Animated.View, { ...HIDDEN, pointerEvents: "none", style: { position: "absolute", bottom: 0, height: 2, borderRadius: 1, backgroundColor: c.accent, left, width } }));
  const frame = { borderBottomWidth: 1, borderBottomColor: c.line };
  if (!scrolls) return h(View, { style: flat(frame, style) }, row);
  return h(View, { style: flat(frame, style) }, h(ScrollView, { ref: scroller, horizontal: true, showsHorizontalScrollIndicator: false, keyboardShouldPersistTaps: "handled", contentContainerStyle: { flexGrow: 1 },
    accessibilityRole: link ? undefined : "tablist", accessibilityLabel: label, ...(link ? onWeb({ accessibilityRole: "navigation" }) : null),
    onLayout: (event) => { view.current = event.nativeEvent.layout.width; } }, row));
}

/**
 * Content tabs: a bar with an underline that slides to the selected tab, and that tab's panel underneath.
 * tabs: [{ value, label, content, icon, badge, disabled }]. The bar scrolls sideways when there are more than four
 * tabs (or scrollable). keepMounted keeps hidden panels alive so their state survives.
 * (`Tabs` is the segmented control; this is the catalog's `tabs`.)
 */
export function TabView({ tabs = [], value, defaultValue, onChange, scrollable, keepMounted = false, label, style, barStyle, panelStyle, ...rest }) {
  const theme = useTheme(), first = tabs.find((tab) => !tab.disabled)?.value, [current, setCurrent] = useControlled(value, defaultValue ?? first, onChange);
  const body = (tab) => (typeof tab.content === "function" ? tab.content({ selected: tab.value === current }) : typeof tab.content === "string" ? h(Text, null, tab.content) : tab.content);
  return h(View, { style: flat({ gap: theme.space.m }, style), ...rest },
    h(TabBar, { items: tabs, value: current, scrollable, label, style: barStyle, onSelect: (tab) => { if (tab.value !== current) setCurrent(tab.value, current); } }),
    tabs.filter((tab) => keepMounted || tab.value === current).map((tab) => h(View, { key: String(tab.value), accessibilityLabel: typeof tab.label === "string" ? tab.label : undefined, ...onWeb({ accessibilityRole: "tabpanel" }),
      style: flat(tab.value === current ? null : { display: "none" }, panelStyle) }, body(tab))));
}

/**
 * Tab-styled navigation: each tab is a link to a screen, with no panels of its own. items: [{ value, label, icon, badge, disabled }];
 * value is the current route and onChange(value, item) is where you navigate.
 */
export function TabNav({ items = [], value, defaultValue, onChange, scrollable, label = "Sections", style }) {
  const [current, setCurrent] = useControlled(value, defaultValue ?? items[0]?.value, onChange);
  return h(TabBar, { items, value: current, scrollable, link: true, label, style, onSelect: (item) => { item.onPress?.(item); if (item.value !== current) setCurrent(item.value, item); } });
}

// Phone-only patterns: bottom tab bar, app bar, floating action button, action sheet, bottom sheet with snap
// points, swipe rows, pull to refresh, search bar, chips, page dots and banners.
//
// PERFORMANCE RULES FOR THIS FILE (read before changing anything)
//  1. Motion is Animated with `useNativeDriver: ND` (true on iOS and Android) and touches only `transform` and
//     `opacity`, so it runs off the JavaScript thread. Never animate height, width, top, left, margins or colours.
//     Things that look like a width change (the collapsing Fab, the SearchBar field) are three fixed pieces moved
//     with translateX and scaleX: see Stretch.
//  2. Gestures write PanResponder deltas straight into an Animated.Value. No setState while a finger is down;
//     React state is committed once, on release.
//  3. No avoidable re-renders: leaves are React.memo, callbacks are stable (useCallback, or read through
//     useLatest), styles are built once per theme (themed()), list items get no fresh inline objects or closures.
//     A tab switch re-renders two BottomBar items and no screen at all.
//  4. Layout is measured in onLayout, once, never per frame. One Pressable per target, with android_ripple;
//     touchables are siblings, never nested.
//  5. No dependencies: no Reanimated, Gesture Handler, SVG or safe-area library. Insets are props with a
//     per-platform guess as the default (see homeIndicator and statusBar below).
import { createContext, createElement as h, forwardRef, isValidElement, memo, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Animated, BackHandler, Dimensions, Easing, FlatList, Keyboard, Modal, PanResponder, Platform, Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, Text as NativeText, TextInput, View } from "react-native";
import { useTheme } from "./provider.js";
import { toneName } from "./theme.js";
import { web, depth, flat, GLYPH } from "./internal.js";
import { Text } from "./components.js";

// ---------------------------------------------------------------- shared helpers
const ND = !web; // the native driver does not exist under react-native-web
const ios = Platform.OS === "ios", android = Platform.OS === "android";
const FILL = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 };
const NONE = [];
const HAIR = StyleSheet.hairlineWidth;
const EASE = Easing.bezier(0.2, 0, 0, 1);
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const timing = (value, toValue, duration = 220, easing = EASE) => Animated.timing(value, { toValue, duration, easing, useNativeDriver: ND });
const spring = (value, toValue, extra) => Animated.spring(value, { toValue, stiffness: 420, damping: 38, mass: 1, useNativeDriver: ND, ...extra });
const useValue = (initial) => useState(() => new Animated.Value(initial))[0];
const useLatest = (value) => { const ref = useRef(value); ref.current = value; return ref; };
/** Styles built once per theme object and shared by every instance (cheaper than a useMemo in each one). */
const themed = (factory) => {
  const cache = new WeakMap();
  return () => { const theme = useTheme(); let styles = cache.get(theme); if (!styles) cache.set(theme, (styles = factory(theme))); return styles; };
};
const hiddenFromReaders = { "aria-hidden": true, importantForAccessibility: "no-hide-descendants", accessibilityElementsHidden: true };

// Without a safe-area library the insets can only be estimated. Pass the real values (bottomInset, topInset) when
// the app has them, for example from react-native-safe-area-context.
const longSide = () => { const { width, height } = Dimensions.get("window"); return Math.max(width, height); };
const landscape = () => { const { width, height } = Dimensions.get("window"); return width > height; };
/** Height of the home indicator area: iPhones without a home button, and recent iPads. 0 elsewhere. */
const homeIndicator = () => (!ios ? 0 : Platform.isPad ? (longSide() >= 1100 ? 20 : 0) : longSide() >= 780 ? (landscape() ? 21 : 34) : 0);
/** Height of the status bar area. Android reports it; it only counts when the app draws edge to edge (Android 15+). */
const statusBar = () => {
  if (android) return Platform.Version >= 35 ? StatusBar.currentHeight ?? 0 : 0;
  if (!ios) return 0;
  if (Platform.isPad) return 24;
  const long = longSide();
  return landscape() ? 0 : [852, 874, 932, 956].includes(long) ? 59 : long >= 780 ? 47 : 20;
};

/** icon: a GLYPH name or any string (drawn as text), an element, or a function ({ color, size }) => element. */
const Glyph = memo(function Glyph({ icon, color, size = 22, weight = "600" }) {
  if (icon == null || icon === false) return null;
  if (typeof icon === "function") return icon({ color, size });
  if (typeof icon !== "string") return icon;
  return h(NativeText, { allowFontScaling: false, "aria-hidden": true, style: { color, fontSize: size, lineHeight: Math.round(size * 1.25), fontWeight: weight, textAlign: "center" } }, GLYPH[icon] ?? icon);
});

/** Mounted while visible and until the exit has played. progress runs 0 → 1 on the native driver. */
function usePresence(visible, enter = 240, exit = 180) {
  const progress = useValue(visible ? 1 : 0), [mounted, setMounted] = useState(!!visible);
  useEffect(() => {
    if (visible) { setMounted(true); timing(progress, 1, enter).start(); return; }
    timing(progress, 0, exit, Easing.in(Easing.quad)).start(({ finished }) => finished && setMounted(false));
  }, [visible, progress, enter, exit]);
  return [mounted || !!visible, progress];
}

/**
 * A rounded bar whose width appears to shrink by `shrink` points as progress goes 0 → 1, using transforms only:
 * two end caps slide (translateX) and the middle scales (scaleX). anchor is the end that stays put: 0 left,
 * 0.5 centre, 1 right. width is the measured full width; until it is known the bar is simply drawn at full size.
 */
const Stretch = memo(function Stretch({ progress, width, shrink, anchor = 0, radius, color }) {
  const middle = Math.max(1, width - 2 * radius + 2), ready = width > 0 && shrink > 0;
  const move = (to) => progress.interpolate({ inputRange: [0, 1], outputRange: [0, to] });
  const piece = { position: "absolute", top: 0, bottom: 0, backgroundColor: color };
  return h(View, { style: FILL, collapsable: false },
    h(Animated.View, { style: [piece, { left: radius - 1, right: radius - 1 }, ready && { transform: [{ translateX: move((anchor - 0.5) * shrink) }, { scaleX: progress.interpolate({ inputRange: [0, 1], outputRange: [1, Math.max(0.001, (middle - shrink) / middle)] }) }] }] }),
    h(Animated.View, { style: [piece, { left: 0, width: radius, borderTopLeftRadius: radius, borderBottomLeftRadius: radius }, ready && { transform: [{ translateX: move(anchor * shrink) }] }] }),
    h(Animated.View, { style: [piece, { right: 0, width: radius, borderTopRightRadius: radius, borderBottomRightRadius: radius }, ready && { transform: [{ translateX: move(-(1 - anchor) * shrink) }] }] }));
});

const Count = memo(function Count({ value, styles }) {
  if (value == null || value === false || value === 0) return null;
  if (value === true) return h(View, { style: styles.dot });
  return h(View, { style: styles.count }, h(NativeText, { allowFontScaling: false, numberOfLines: 1, style: styles.countText }, typeof value === "number" && value > 99 ? "99+" : String(value)));
});
const countStyles = (theme) => ({
  dot: { position: "absolute", top: 1, right: -3, width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: theme.colors.surface, backgroundColor: theme.colors.bad },
  count: { position: "absolute", top: -3, left: "50%", marginLeft: 3, minWidth: 17, height: 17, paddingHorizontal: 4, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.bad },
  countText: { color: theme.colors.brandFg, fontSize: 10, lineHeight: 13, fontWeight: "700" },
});

// ---------------------------------------------------------------- BottomBar and TabScreens
const BAR = 56, PILL_W = 60, PILL_H = 30;
const barStyles = themed((theme) => ({
  ...countStyles(theme),
  root: { backgroundColor: theme.colors.surface, borderTopWidth: HAIR, borderTopColor: theme.colors.line },
  hidden: { display: "none" },
  row: { height: BAR, flexDirection: "row" },
  item: { flex: 1, height: BAR, alignItems: "center", paddingTop: 5 },
  itemCentred: { flex: 1, height: BAR, alignItems: "center", justifyContent: "center" },
  off: { opacity: 0.4 },
  icon: { width: PILL_W, height: PILL_H, alignItems: "center", justifyContent: "center" },
  iconInner: { minWidth: 26, alignItems: "center", justifyContent: "center" },
  label: { marginTop: 2, fontSize: 11, lineHeight: 15, fontWeight: "500", color: theme.colors.muted },
  labelOn: { marginTop: 2, fontSize: 11, lineHeight: 15, fontWeight: "700", color: theme.colors.accent },
  pill: { position: "absolute", top: 5, width: PILL_W, height: PILL_H, borderRadius: PILL_H / 2, backgroundColor: theme.colors.accentSoft },
  line: { position: "absolute", top: 0, width: 32, height: 3, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, backgroundColor: theme.colors.accent },
  slot: { flex: 1, height: BAR, alignItems: "center", justifyContent: "center" },
  action: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.accent, ...depth(theme.shadow.m) },
  actionPressed: { backgroundColor: theme.colors.accentPressed },
  ripple: { color: theme.colors.accentSoft, borderless: true, radius: 40 },
  rippleOn: { color: theme.colors.brandFg, borderless: false },
  on: theme.colors.accent, idle: theme.colors.muted, actionFg: theme.colors.brandFg,
}));

const BarItem = memo(function BarItem({ item, selected, labels, onSelect, styles }) {
  const active = useValue(selected ? 1 : 0), first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    timing(active, selected ? 1 : 0, 180).start();
  }, [selected, active]);
  const press = useCallback(() => onSelect(item.value), [onSelect, item.value]);
  const onlySelected = labels === "selected", color = selected ? styles.on : styles.idle;
  // "selected": the label fades in under the icon while the icon rises from the centre of the bar.
  const lift = useMemo(() => (onlySelected ? { transform: [{ translateY: active.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] } : null), [onlySelected, active]);
  const fade = useMemo(() => (onlySelected ? { opacity: active } : null), [onlySelected, active]);
  const said = item.accessibilityLabel ?? (typeof item.badge === "number" && item.badge > 0 ? `${item.label}, ${item.badge} new` : item.badge === true ? `${item.label}, new` : item.label);
  return h(Pressable, { onPress: press, disabled: item.disabled, testID: item.testID, android_ripple: styles.ripple,
    accessibilityRole: "tab", accessibilityLabel: said, accessibilityState: { selected, disabled: !!item.disabled }, "aria-selected": selected, "aria-disabled": !!item.disabled,
    style: [labels === "never" ? styles.itemCentred : styles.item, item.disabled && styles.off] },
    h(Animated.View, { style: [styles.icon, lift] },
      h(View, { style: styles.iconInner },
        h(Glyph, { icon: selected ? item.activeIcon ?? item.icon : item.icon, color, size: 22 }),
        h(Count, { value: item.badge, styles }))),
    labels === "never" ? null : h(Animated.Text, { numberOfLines: 1, allowFontScaling: false, style: [selected ? styles.labelOn : styles.label, fade] }, item.label));
});

/**
 * The bottom tab bar. items: [{ value, label, icon, activeIcon, badge (number, or true for a dot), disabled }].
 * value + onChange (or defaultValue); pressing the selected tab again calls onReselect (scroll to top).
 * labels: always | selected | never.  indicator: pill | line | none (it slides between tabs on the native driver).
 * action: { icon, label, onPress } adds a round button in the middle.
 * bottomInset pads the home-indicator area (default: a per-device guess; pass the real inset when known).
 */
export const BottomBar = memo(function BottomBar({ items = NONE, value, defaultValue, onChange, onReselect, labels = "always", indicator = "pill", action, bottomInset = homeIndicator(), hideOnKeyboard = true, style, testID }) {
  const styles = barStyles();
  const [inner, setInner] = useState(defaultValue ?? items[0]?.value), current = value !== undefined ? value : inner;
  const [width, setWidth] = useState(0), [keyboard, setKeyboard] = useState(false);
  const latest = useLatest({ value, current, onChange, onReselect });
  const onSelect = useCallback((next) => {
    const now = latest.current;
    if (next === now.current) { now.onReselect?.(next); return; }
    if (now.value === undefined) setInner(next);
    now.onChange?.(next);
  }, [latest]);
  const onLayout = useCallback((event) => setWidth(Math.round(event.nativeEvent.layout.width)), []);

  // The centre action takes the middle slot, so tabs after it sit one slot further right.
  const half = action ? Math.ceil(items.length / 2) : -1, slots = items.length + (action ? 1 : 0);
  const index = items.findIndex((item) => item.value === current), slot = index < 0 ? -1 : action && index >= half ? index + 1 : index;
  const place = useValue(Math.max(0, slot));
  useEffect(() => { if (slot >= 0) spring(place, slot).start(); }, [slot, place]);
  const slide = useMemo(() => {
    const last = Math.max(1, slots - 1), each = width / Math.max(1, slots);
    return { transform: [{ translateX: place.interpolate({ inputRange: [0, last], outputRange: [0, last * each] }) }] };
  }, [place, slots, width]);

  useEffect(() => {
    if (!hideOnKeyboard || web) return undefined;
    const show = Keyboard.addListener(ios ? "keyboardWillShow" : "keyboardDidShow", () => setKeyboard(true));
    const hide = Keyboard.addListener(ios ? "keyboardWillHide" : "keyboardDidHide", () => setKeyboard(false));
    return () => { show.remove(); hide.remove(); };
  }, [hideOnKeyboard]);

  const each = width / Math.max(1, slots), marker = indicator === "line" ? styles.line : styles.pill;
  const markerLeft = (each - (indicator === "line" ? 32 : PILL_W)) / 2;
  const children = items.map((item) => h(BarItem, { key: String(item.value), item, selected: item.value === current, labels, onSelect, styles }));
  if (action) children.splice(half, 0, h(View, { key: "__action", style: styles.slot },
    h(Pressable, { onPress: action.onPress, accessibilityRole: "button", accessibilityLabel: action.label, testID: action.testID, android_ripple: styles.rippleOn,
      style: ({ pressed }) => (pressed ? [styles.action, styles.actionPressed] : styles.action) }, h(Glyph, { icon: action.icon ?? "plus", color: styles.actionFg, size: 24 }))));
  return h(View, { testID, style: flat(styles.root, { paddingBottom: bottomInset }, keyboard && styles.hidden, style) },
    h(View, { accessibilityRole: "tablist", onLayout, style: styles.row },
      indicator !== "none" && width > 0 && slot >= 0
        ? h(Animated.View, { style: [marker, { left: markerLeft, pointerEvents: "none" }, indicator === "pill" && labels === "never" && { top: (BAR - PILL_H) / 2 }, slide] }) : null,
      children));
});

const TabActive = createContext(true);
/** Inside a TabScreens screen: true while that screen is the visible one. Use it to pause timers or video. */
export const useTabActive = () => useContext(TabActive);

const SCENE = { ...FILL }, SCENE_HIDDEN = { ...FILL, opacity: 0, pointerEvents: "none", ...(web ? { visibility: "hidden" } : null) };
// The element is created once per screen and reused, so React skips the whole screen when only `active` changes.
const TabScene = memo(function TabScene({ screen, active }) {
  const content = useMemo(() => (isValidElement(screen) ? screen : h(screen)), [screen]);
  return h(View, { collapsable: false, style: active ? SCENE : SCENE_HIDDEN, "aria-hidden": !active, accessibilityElementsHidden: !active, importantForAccessibility: active ? "auto" : "no-hide-descendants" },
    h(TabActive.Provider, { value: active }, content));
});

/**
 * The screens behind a BottomBar. screens: { [value]: Component | element }. A screen mounts on its first visit
 * (lazy) and then stays mounted, laid out and hidden, so switching is instant and scroll positions survive.
 * Hidden screens are not re-rendered by a tab switch. Keep `screens` stable (a constant, or useMemo).
 */
export function TabScreens({ value, screens, lazy = true, style }) {
  const seen = useRef(null), keys = Object.keys(screens), now = String(value);
  if (!seen.current) seen.current = new Set(lazy ? NONE : keys);
  seen.current.add(now);
  return h(View, { style: flat({ flex: 1 }, style) }, keys.map((key) => (seen.current.has(key) ? h(TabScene, { key, screen: screens[key], active: key === now }) : null)));
}

// ---------------------------------------------------------------- AppBar
const APP_BAR = ios ? 44 : 56, LARGE_TITLE = 52;
const appBarStyles = themed((theme) => ({
  root: { zIndex: 10, backgroundColor: theme.colors.surface },
  row: { height: APP_BAR, zIndex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: theme.space["2xs"], backgroundColor: theme.colors.surface },
  side: { flexDirection: "row", alignItems: "center" },
  start: { flex: 1, paddingHorizontal: theme.space.xs, justifyContent: "center" },
  spacer: { flex: 1 },
  centre: { ...FILL, paddingHorizontal: 76, alignItems: "center", justifyContent: "center", pointerEvents: "none" },
  title: { color: theme.colors.fg, fontSize: 17, lineHeight: 22, fontWeight: "600" },
  subtitle: { color: theme.colors.muted, fontSize: theme.text.xs, lineHeight: 16 },
  overhang: { position: "absolute", top: "100%", left: 0, right: 0, height: LARGE_TITLE, paddingHorizontal: theme.space.m, justifyContent: "center", backgroundColor: theme.colors.surface, pointerEvents: "none" },
  inFlow: { height: LARGE_TITLE, paddingHorizontal: theme.space.m, justifyContent: "center" },
  large: { color: theme.colors.fg, fontSize: theme.text["2xl"], lineHeight: 36, fontWeight: "700", letterSpacing: -0.4 },
  edge: { position: "absolute", top: "100%", left: 0, right: 0, pointerEvents: "none" },
  edgeLine: { height: 1, backgroundColor: theme.colors.line },
  edgeShade: { height: 1, backgroundColor: theme.colors.shadow },
  action: { minWidth: theme.touch, height: theme.touch, paddingHorizontal: theme.space["2xs"], borderRadius: theme.touch / 2, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.45 },
  off: { opacity: 0.35 },
  ripple: { color: theme.colors.accentSoft, borderless: true, radius: 22 },
  fg: theme.colors.fg, accent: theme.colors.accent, colors: theme.colors,
}));
const SHADE = [0.14, 0.08, 0.04, 0.015];
// A hairline and a four-step soft shadow drawn with Views, so its opacity can follow the scroll natively
// (shadow props and elevation cannot be animated on the native driver).
const BarEdge = memo(function BarEdge({ opacity, styles }) {
  return h(Animated.View, { style: [styles.edge, { opacity }] }, h(View, { style: styles.edgeLine }), SHADE.map((alpha) => h(View, { key: alpha, style: [styles.edgeShade, { opacity: alpha }] })));
});

/** An icon button for the bar. icon: a GLYPH name, any string, or an element. label is what a screen reader says. */
export const AppBarAction = memo(function AppBarAction({ icon, label, onPress, disabled = false, tone, size = 22, testID }) {
  const styles = appBarStyles(), color = tone === "muted" ? styles.colors.muted : styles.colors[toneName(tone)] ?? styles.fg;
  return h(Pressable, { onPress, disabled, testID, accessibilityRole: "button", accessibilityLabel: label, accessibilityState: { disabled }, "aria-disabled": disabled, android_ripple: styles.ripple,
    style: ({ pressed }) => (disabled ? [styles.action, styles.off] : pressed && !android ? [styles.action, styles.pressed] : styles.action) }, h(Glyph, { icon, color, size }));
});

/**
 * Scroll state for an AppBar. Spread scrollProps on an Animated.ScrollView or Animated.FlatList and pass scrollY to
 * the bar: the offset then travels from the list to the bar on the UI thread, with no JavaScript in between.
 */
export function useAppBarScroll() {
  return useMemo(() => {
    const scrollY = new Animated.Value(0);
    return { scrollY, scrollProps: { scrollEventThrottle: 16, onScroll: Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: ND }) } };
  }, []);
}

/**
 * The top bar. title, subtitle, leading and trailing (elements, usually AppBarAction); onBack adds a back button.
 * scrollY (from useAppBarScroll) raises a soft edge under the bar once the content has scrolled.
 * large shows a big title under the bar that slides away and cross-fades into the small one as scrollY grows; the
 * big title overlaps the top of the list, so give the list paddingTop AppBar.largeTitleHeight (52).
 * topInset pads the status bar area (default: a per-device guess; pass the real inset when known).
 */
export const AppBar = memo(function AppBar({ title, subtitle, leading, trailing, onBack, backLabel = "Back", large = false, scrollY, elevated, align = ios ? "center" : "start", topInset = statusBar(), style, testID }) {
  const styles = appBarStyles(), collapsing = large && !!scrollY;
  const motion = useMemo(() => {
    const range = (input, output) => scrollY.interpolate({ inputRange: input, outputRange: output, extrapolate: "clamp" });
    if (!scrollY) return { edge: elevated ? 1 : 0, small: large ? 0 : 1 };
    if (!large) return { edge: elevated === false ? 0 : range([0, 12], [0, 1]), small: 1 };
    return { edge: elevated === false ? 0 : range([LARGE_TITLE - 8, LARGE_TITLE], [0, 1]), small: range([LARGE_TITLE - 20, LARGE_TITLE - 4], [0, 1]),
      slide: range([0, LARGE_TITLE], [0, -LARGE_TITLE]), big: range([0, LARGE_TITLE * 0.6], [1, 0]) };
  }, [scrollY, large, elevated]);
  const heading = h(Animated.View, { style: { opacity: motion.small, alignItems: align === "center" ? "center" : "flex-start" } },
    h(NativeText, { numberOfLines: 1, accessibilityRole: "header", "aria-level": 1, style: styles.title }, title),
    subtitle ? h(NativeText, { numberOfLines: 1, style: styles.subtitle }, subtitle) : null);
  const bigTitle = h(NativeText, { numberOfLines: 1, style: styles.large, ...(collapsing ? hiddenFromReaders : { accessibilityRole: "header" }) }, title);
  return h(View, { testID, style: flat(styles.root, { paddingTop: topInset }, style) },
    collapsing ? h(Animated.View, { style: [styles.overhang, { transform: [{ translateY: motion.slide }] }] },
      h(Animated.View, { style: { opacity: motion.big } }, bigTitle), h(BarEdge, { opacity: motion.edge, styles })) : null,
    h(View, { style: styles.row },
      h(View, { style: styles.side }, onBack ? h(AppBarAction, { icon: ios ? "chevronLeft" : "arrowLeft", size: ios ? 32 : 22, label: backLabel, onPress: onBack, tone: ios ? "accent" : undefined, testID: "app-bar-back" }) : null, leading),
      align === "center" ? h(View, { style: styles.spacer }) : h(View, { style: styles.start }, heading),
      h(View, { style: styles.side }, trailing),
      align === "center" ? h(View, { style: styles.centre }, heading) : null),
    large && !collapsing ? h(View, { style: styles.inFlow }, bigTitle) : null,
    collapsing ? null : h(BarEdge, { opacity: motion.edge, styles }));
});
AppBar.height = APP_BAR;
AppBar.largeTitleHeight = LARGE_TITLE;

// ---------------------------------------------------------------- Fab
const FAB = { s: { box: 40, icon: 20, text: 14 }, m: { box: 56, icon: 24, text: 15 }, l: { box: 72, icon: 30, text: 17 } };
const MINI = 40;
const fabStyles = themed((theme) => {
  const lift = android ? { elevation: theme.shadow.m.elevation } : null;
  return {
    looks: {
      solid: { bg: theme.colors.accent, fg: theme.colors.brandFg, ripple: { color: theme.colors.accentPressed } },
      soft: { bg: theme.tones.accent.tint, fg: theme.colors.accent, ripple: { color: theme.colors.accentSoft } },
      surface: { bg: theme.colors.surface, fg: theme.colors.accent, ripple: { color: theme.colors.accentSoft } },
    },
    space: theme.space, lift, shadow: depth(theme.shadow.m),
    layer: { ...FILL, pointerEvents: "box-none" },
    scrim: { ...FILL, backgroundColor: theme.colors.overlay },
    content: { flexDirection: "row", alignItems: "center", ...lift },
    hit: { position: "absolute", top: 0, bottom: 0, overflow: "hidden", ...lift },
    dial: { position: "absolute", gap: theme.space.s },
    dialRow: { flexDirection: "row", alignItems: "center", gap: theme.space.s, minHeight: theme.touch },
    dialLabel: { paddingHorizontal: theme.space.s, paddingVertical: theme.space["2xs"], borderRadius: theme.radius.s, backgroundColor: theme.colors.surface, ...depth(theme.shadow.s) },
    dialText: { color: theme.colors.fg, fontSize: theme.text.sm, lineHeight: 20, fontWeight: "500" },
    mini: { width: MINI, height: MINI, borderRadius: MINI / 2, alignItems: "center", justifyContent: "center", backgroundColor: theme.tones.accent.tint, ...depth(theme.shadow.s) },
    miniFg: theme.colors.accent,
    pressed: { opacity: 0.7 },
  };
});

const DialAction = memo(function DialAction({ action, index, progress, reverse, down, onPick, styles }) {
  // One shared progress value; each row reads its own slice of it, which staggers the fan.
  const from = Math.min(0.5, index * 0.12), slice = (output) => progress.interpolate({ inputRange: [from, Math.min(1, from + 0.5)], outputRange: output, extrapolate: "clamp" });
  const motion = useMemo(() => ({ opacity: slice([0, 1]), transform: [{ translateY: slice([down ? -14 : 14, 0]) }, { scale: slice([0.7, 1]) }] }), [progress, from, down]); // eslint-disable-line react-hooks/exhaustive-deps
  const press = useCallback(() => onPick(action), [onPick, action]);
  return h(Animated.View, { style: motion },
    h(Pressable, { onPress: press, disabled: action.disabled, testID: action.testID, accessibilityRole: "button", accessibilityLabel: action.label,
      style: ({ pressed }) => [styles.dialRow, reverse && { flexDirection: "row-reverse" }, pressed && styles.pressed, action.disabled && { opacity: 0.4 }] },
      action.label ? h(View, { style: styles.dialLabel }, h(NativeText, { numberOfLines: 1, style: styles.dialText }, action.label)) : null,
      h(View, { style: styles.mini }, h(Glyph, { icon: action.icon, color: styles.miniFg, size: 20 }))));
});

/**
 * Floating action button. size: s | m | l.  variant: solid | soft | surface.
 * label makes it extended (icon + label); extended={false} collapses it to the round button, which is how it
 * reacts to scrolling: flip the prop from onScroll (see the demo). The collapse runs on transforms only.
 * position: bottom-right | bottom-left | bottom-center | top-right | top-left | static. Positioned buttons fill
 * their parent without blocking touches; offset is the distance from the edges, bottomInset the home-indicator pad.
 * actions: [{ icon, label, onPress }] turns it into a speed dial (open + onOpenChange, or left to manage itself).
 */
export const Fab = memo(function Fab({ icon = "plus", label, size = "m", variant = "solid", extended = true, position = "bottom-right", offset, bottomInset = 0, actions, open, defaultOpen = false, onOpenChange, backdrop = true, onPress, disabled = false, accessibilityLabel, style, testID }) {
  const styles = fabStyles(), dims = FAB[size] ?? FAB.m, look = styles.looks[variant] ?? styles.looks.solid, box = dims.box, radius = box / 2;
  const [vertical, horizontal] = position === "static" ? ["bottom", "left"] : position.split("-");
  const anchor = horizontal === "right" ? 1 : horizontal === "center" ? 0.5 : 0, down = vertical === "top";
  const dial = Array.isArray(actions) && actions.length > 0, hasLabel = label != null && label !== "", collapsed = hasLabel && !extended;
  const [width, setWidth] = useState(0), shrink = Math.max(0, width - box);
  const [inner, setInner] = useState(defaultOpen), isOpen = dial && (open !== undefined ? open : inner);
  const latest = useLatest({ open, isOpen, onOpenChange, onPress, dial });
  const setOpen = useCallback((next) => { if (latest.current.open === undefined) setInner(next); latest.current.onOpenChange?.(next); }, [latest]);
  const close = useCallback(() => setOpen(false), [setOpen]);
  const press = useCallback(() => (latest.current.dial ? setOpen(!latest.current.isOpen) : latest.current.onPress?.()), [latest, setOpen]);
  const onPick = useCallback((action) => { setOpen(false); action.onPress?.(); }, [setOpen]);
  const onLayout = useCallback((event) => setWidth(Math.round(event.nativeEvent.layout.width)), []);

  const fold = useValue(collapsed ? 1 : 0), squeeze = useValue(1), [dialMounted, fan] = usePresence(isOpen, 260, 160);
  useEffect(() => { timing(fold, collapsed ? 1 : 0, 240).start(); }, [collapsed, fold]);
  useEffect(() => {
    if (!isOpen || web) return undefined;
    const back = BackHandler.addEventListener("hardwareBackPress", () => { close(); return true; });
    return () => back.remove();
  }, [isOpen, close]);
  const pressIn = useCallback(() => spring(squeeze, 0.94).start(), [squeeze]), pressOut = useCallback(() => spring(squeeze, 1).start(), [squeeze]);

  const motion = useMemo(() => {
    const shift = fold.interpolate({ inputRange: [0, 1], outputRange: [0, anchor * shrink] });
    return {
      icon: { transform: [{ translateX: shift }, ...(dial && icon === "plus" ? [{ rotate: fan.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "45deg"] }) }] : NONE)] },
      label: { opacity: fold.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0], extrapolate: "clamp" }), transform: [{ translateX: shift }] },
      long: { opacity: fold.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
    };
  }, [fold, fan, anchor, shrink, dial, icon]);

  const pad = (box - dims.icon) / 2, round = { top: 0, left: anchor * shrink, width: box, height: box, borderRadius: radius, backgroundColor: look.bg };
  const button = h(Animated.View, { onLayout, style: [{ height: box, minWidth: box, opacity: hasLabel && !width ? 0 : disabled ? 0.5 : 1, transform: [{ scale: squeeze }] }] },
    // Two shadow casters: the long one fades out as the button folds, the round one stays under the icon.
    hasLabel ? h(Animated.View, { style: [FILL, { borderRadius: radius, backgroundColor: look.bg }, styles.shadow, motion.long] }) : null,
    h(View, { style: [{ position: "absolute" }, round, styles.shadow] }),
    hasLabel ? h(View, { style: [FILL, styles.lift], collapsable: false }, h(Stretch, { progress: fold, width, shrink, anchor, radius, color: look.bg })) : null,
    h(View, { style: [styles.content, { height: box, paddingLeft: pad, paddingRight: hasLabel ? Math.round(box * 0.36) : pad }], collapsable: false },
      h(Animated.View, { style: [{ width: dims.icon, alignItems: "center", justifyContent: "center" }, motion.icon] }, h(Glyph, { icon, color: look.fg, size: dims.icon })),
      hasLabel ? h(Animated.Text, { numberOfLines: 1, allowFontScaling: false, style: [{ marginLeft: 8, color: look.fg, fontSize: dims.text, lineHeight: dims.text + 6, fontWeight: "600" }, motion.label] }, label) : null),
    h(Pressable, { onPress: press, onPressIn: pressIn, onPressOut: pressOut, disabled, testID, android_ripple: look.ripple,
      accessibilityRole: "button", accessibilityLabel: accessibilityLabel ?? (typeof label === "string" ? label : undefined), accessibilityState: dial ? { expanded: isOpen, disabled } : { disabled }, "aria-expanded": dial ? isOpen : undefined, "aria-disabled": disabled,
      style: [styles.hit, { borderRadius: radius }, collapsed ? { left: anchor * shrink, width: box } : { left: 0, right: 0 }] }));

  const side = (box - MINI) / 2;
  const fanOut = dialMounted ? h(View, { style: [styles.dial, down ? { top: box + styles.space.s, flexDirection: "column" } : { bottom: box + styles.space.s, flexDirection: "column-reverse" },
    anchor === 1 ? { right: side, alignItems: "flex-end" } : anchor === 0 ? { left: side, alignItems: "flex-start" } : { left: -160, right: -160, alignItems: "center" }, { pointerEvents: isOpen ? "box-none" : "none" }] },
    actions.map((action, index) => h(DialAction, { key: action.key ?? action.label ?? index, action, index, progress: fan, reverse: anchor === 0, down, onPick, styles }))) : null;
  if (position === "static") return h(View, { style: flat({ alignSelf: "flex-start" }, style) }, fanOut, button);
  const edge = offset ?? styles.space.m;
  return h(View, { style: flat(styles.layer, { padding: edge, paddingBottom: edge + (down ? 0 : bottomInset), justifyContent: down ? "flex-start" : "flex-end", alignItems: anchor === 1 ? "flex-end" : anchor === 0 ? "flex-start" : "center" }, style) },
    dialMounted && backdrop ? h(Animated.View, { style: [styles.scrim, { opacity: fan, pointerEvents: isOpen ? "auto" : "none" }] }, h(Pressable, { style: FILL, onPress: close, accessibilityLabel: "Close" })) : null,
    h(View, null, fanOut, button));
});

// ---------------------------------------------------------------- ActionSheet
const sheetStyles = themed((theme) => ({
  root: { flex: 1, justifyContent: "flex-end" },
  scrim: { ...FILL, backgroundColor: theme.colors.overlay },
  panel: { width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: theme.space.xs, gap: theme.space.xs },
  group: { borderRadius: theme.radius.l, overflow: "hidden", backgroundColor: theme.colors.surface, ...depth(theme.shadow.l) },
  head: { paddingVertical: theme.space.s, paddingHorizontal: theme.space.m, alignItems: "center", gap: 2 },
  title: { color: theme.colors.muted, fontSize: theme.text.sm, lineHeight: 20, fontWeight: "600", textAlign: "center" },
  message: { color: theme.colors.muted, fontSize: theme.text.xs, lineHeight: 17, textAlign: "center" },
  rule: { height: HAIR, backgroundColor: theme.colors.line },
  action: { minHeight: 56, paddingHorizontal: theme.space.m, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: theme.space.xs },
  pressed: { backgroundColor: theme.colors.sunken },
  off: { opacity: 0.4 },
  label: { color: theme.colors.accent, fontSize: 18, lineHeight: 24, fontWeight: "400" },
  bad: { color: theme.colors.bad },
  bold: { fontWeight: "600" },
  ripple: { color: theme.colors.sunken },
  accent: theme.colors.accent, danger: theme.colors.bad, space: theme.space,
}));

const SheetAction = memo(function SheetAction({ action, bold, onPick, styles }) {
  const press = useCallback(() => onPick(action), [onPick, action]), bad = action.destructive || action.variant === "danger";
  return h(Pressable, { onPress: press, disabled: action.disabled, testID: action.testID, android_ripple: styles.ripple, accessibilityRole: "button", accessibilityState: { disabled: !!action.disabled }, "aria-disabled": !!action.disabled,
    style: ({ pressed }) => [styles.action, pressed && styles.pressed, action.disabled && styles.off] },
    h(Glyph, { icon: action.icon, color: bad ? styles.danger : styles.accent, size: 20 }),
    h(NativeText, { numberOfLines: 1, style: [styles.label, bad && styles.bad, bold && styles.bold] }, action.label));
});

/**
 * An iOS-style list of choices that rises from the bottom edge. actions: [{ label, onPress, destructive, icon,
 * disabled }]. Choosing one closes the sheet (onClose) and then runs its onPress. cancelLabel={null} drops the
 * cancel button; the backdrop and the Android back button also close it.
 */
export function ActionSheet({ visible, onClose, title, message, actions = NONE, cancelLabel = "Cancel", bottomInset = homeIndicator(), testID }) {
  const styles = sheetStyles(), [mounted, progress] = usePresence(visible, 280, 200);
  const [height, setHeight] = useState(() => Dimensions.get("window").height);
  const onLayout = useCallback((event) => setHeight(Math.ceil(event.nativeEvent.layout.height)), []);
  const latest = useLatest(onClose);
  const onPick = useCallback((action) => { latest.current?.(); action.onPress?.(); }, [latest]);
  const cancel = useMemo(() => ({ label: cancelLabel, testID: "action-sheet-cancel" }), [cancelLabel]);
  const rise = useMemo(() => ({ transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }) }] }), [progress, height]);
  if (!mounted) return null;
  const rows = [];
  actions.forEach((action, index) => { if (index || title || message) rows.push(h(View, { key: `r${index}`, style: styles.rule })); rows.push(h(SheetAction, { key: action.key ?? action.label ?? index, action, onPick, styles })); });
  return h(Modal, { visible: true, transparent: true, animationType: "none", onRequestClose: onClose, statusBarTranslucent: true },
    h(View, { style: styles.root, testID },
      h(Animated.View, { style: [styles.scrim, { opacity: progress }] }, h(Pressable, { style: FILL, onPress: onClose, accessibilityLabel: "Close" })),
      h(Animated.View, { onLayout, accessibilityViewIsModal: true, style: [styles.panel, { paddingBottom: Math.max(bottomInset, styles.space.xs) }, rise] },
        h(View, { style: [styles.group, { flexShrink: 1 }] },
          title || message ? h(View, { style: styles.head }, title ? h(NativeText, { accessibilityRole: "header", style: styles.title }, title) : null, message ? h(NativeText, { style: styles.message }, message) : null) : null,
          h(ScrollView, { bounces: false, style: { maxHeight: Dimensions.get("window").height * 0.6 } }, rows)),
        cancelLabel == null ? null : h(View, { style: styles.group }, h(SheetAction, { action: cancel, bold: true, onPick, styles })))));
}

// ---------------------------------------------------------------- BottomSheet
const bottomSheetStyles = themed((theme) => ({
  root: { ...FILL, overflow: "hidden", justifyContent: "flex-end" },
  scrim: { ...FILL, backgroundColor: theme.colors.overlay },
  sheet: { width: "100%", maxWidth: 640, alignSelf: "center", borderTopLeftRadius: theme.radius.l, borderTopRightRadius: theme.radius.l, backgroundColor: theme.colors.surface, ...depth(theme.shadow.l) },
  // Colour below the sheet, seen only while a spring or an over-drag lifts it past its top position.
  tail: { position: "absolute", top: "100%", left: 0, right: 0, height: 400, marginTop: -1, backgroundColor: theme.colors.surface },
  grip: { paddingTop: theme.space.xs, paddingBottom: theme.space.xs, alignItems: "center", ...(web ? { userSelect: "none", cursor: "grab" } : null) },
  bar: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.line },
  title: { marginTop: theme.space.xs, paddingHorizontal: theme.space.m, alignSelf: "stretch", color: theme.colors.fg, fontSize: theme.text.lg, lineHeight: 24, fontWeight: "700" },
  body: { flex: 1 },
  content: { paddingHorizontal: theme.space.m, gap: theme.space.s },
}));
const toPoints = (point, full) => (typeof point === "string" && point.endsWith("%") ? (full * parseFloat(point)) / 100 : +point || 0);

/**
 * A sheet that rests at snap points and follows the finger between them.
 * snapPoints: heights, low to high, as "25%" of the container or points. snap + onSnapChange (or defaultSnap) is the
 * index it rests at. Drag the handle anywhere, or the content while it is not fully open; a flick carries it to the
 * next point and a pull below the lowest point closes it (dismissible). The backdrop darkens as the sheet rises.
 * The content scrolls (scroll, default true) only at the highest point, and pulling down at its top drags the sheet.
 * modal={false} draws it inside its parent instead of a Modal, for a sheet that lives over a map or a list.
 * The sheet is as tall as its highest point and is moved with translateY only, so the bottom of the content is
 * below the edge at lower points.
 */
export function BottomSheet({ visible, onClose, snapPoints = DEFAULT_SNAPS, snap, defaultSnap = 0, onSnapChange, modal = true, backdrop = modal, dismissible = true, handle = true, title, scroll = true, bottomInset = modal ? homeIndicator() : 0, children, style, contentStyle, testID }) {
  const styles = bottomSheetStyles();
  const [mounted, setMounted] = useState(!!visible), [full, setFull] = useState(0), [inner, setInner] = useState(defaultSnap);
  const heights = useMemo(() => snapPoints.map((point) => clamp(toPoints(point, full), 0, full)).sort((a, b) => a - b), [snapPoints, full]);
  const top = heights.length - 1, index = clamp(snap !== undefined ? snap : inner, 0, Math.max(0, top)), tall = heights[top] ?? 0;
  const y = useValue(Dimensions.get("window").height);
  // What the gesture needs, read through refs so the responders are created once.
  const live = useLatest({ heights, tall, index, top, visible, dismissible, snap, onSnapChange, onClose });
  const state = useRef({ shown: false, closing: false, target: null, start: 0, at: 0, scrollTop: 0 }).current;

  const rest = useCallback((to, velocity) => {
    if (state.target === to) return;
    state.target = to; state.at = to;
    spring(y, to, velocity ? { velocity } : undefined).start();
  }, [y, state]);
  const leave = useCallback((duration = 220) => {
    if (state.closing) return;
    state.closing = true; state.target = null;
    timing(y, live.current.tall, duration, Easing.out(Easing.quad)).start(() => {
      state.closing = false;
      if (live.current.visible) { rest(live.current.tall - live.current.heights[live.current.index]); return; } // the parent kept it open
      state.shown = false; setMounted(false);
    });
  }, [y, state, live, rest]);
  useEffect(() => { if (visible) setMounted(true); }, [visible]);
  useEffect(() => {
    if (!full || !tall) return;
    if (!visible) { if (state.shown) leave(); return; }
    if (!state.shown) { state.shown = true; state.target = null; y.setValue(tall); }
    if (!state.closing) rest(tall - heights[index]);
  }, [visible, full, tall, heights, index, y, state, rest, leave]);

  const pan = useMemo(() => {
    const limit = (value) => {
      const now = live.current, lowest = now.tall - now.heights[0];
      if (value < 0) return value * 0.25; // rubber band above the top
      if (!now.dismissible && value > lowest) return lowest + (value - lowest) * 0.25;
      return value;
    };
    const grant = () => { state.target = null; state.start = state.at; y.stopAnimation((value) => { state.start = value; }); };
    const move = (_, gesture) => y.setValue(limit(state.start + gesture.dy));
    const release = (_, gesture) => {
      const now = live.current, at = limit(state.start + gesture.dy), aim = at + gesture.vy * 180, lowest = now.tall - now.heights[0];
      state.at = at;
      if (now.dismissible && (aim > lowest + now.heights[0] * 0.5 || (gesture.vy > 1.4 && at > lowest))) {
        leave(clamp((now.tall - at) / Math.max(0.5, gesture.vy), 120, 240)); now.onClose?.(); return;
      }
      let next = 0;
      now.heights.forEach((height, i) => { if (Math.abs(now.tall - height - aim) < Math.abs(now.tall - now.heights[next] - aim)) next = i; });
      rest(now.tall - now.heights[next], gesture.vy * 1000);
      if (next !== now.index) { if (now.snap === undefined) setInner(next); now.onSnapChange?.(next); }
    };
    const shared = { onPanResponderGrant: grant, onPanResponderMove: move, onPanResponderRelease: release, onPanResponderTerminate: release, onPanResponderTerminationRequest: () => false };
    const vertical = (gesture) => Math.abs(gesture.dy) > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx);
    return {
      grip: PanResponder.create({ ...shared, onStartShouldSetPanResponder: () => true, onMoveShouldSetPanResponder: (_, gesture) => vertical(gesture) }),
      // Below the top point the content is not scrollable and any vertical drag moves the sheet. At the top point
      // only a pull down from scroll offset 0 is taken from the scroll view.
      body: PanResponder.create({ ...shared, onMoveShouldSetPanResponderCapture: (_, gesture) => vertical(gesture) && (live.current.index < live.current.top || (gesture.dy > 0 && state.scrollTop <= 0)) }),
    };
  }, [y, state, live, rest, leave]);

  const dim = useMemo(() => {
    if (!tall) return 0;
    const low = tall - heights[0];
    return low > 0 ? y.interpolate({ inputRange: [0, low, tall], outputRange: [1, 0.6, 0], extrapolate: "clamp" }) : y.interpolate({ inputRange: [0, tall], outputRange: [1, 0], extrapolate: "clamp" });
  }, [y, tall, heights]);
  const onLayout = useCallback((event) => setFull(Math.round(event.nativeEvent.layout.height)), []);
  const onScroll = useCallback((event) => { state.scrollTop = event.nativeEvent.contentOffset.y; }, [state]);
  const step = useCallback((event) => {
    const now = live.current, name = event.nativeEvent.actionName, next = clamp(now.index + (name === "increment" ? 1 : -1), 0, now.top);
    if (name === "decrement" && now.index === 0 && now.dismissible) { now.onClose?.(); return; }
    if (next !== now.index) { if (now.snap === undefined) setInner(next); now.onSnapChange?.(next); }
  }, [live]);
  if (!mounted && !visible) return null;

  const open = index === top, padding = { paddingBottom: bottomInset + styles.content.paddingHorizontal };
  const tree = h(View, { onLayout, testID, style: [styles.root, { pointerEvents: backdrop ? "auto" : "box-none" }] },
    backdrop ? h(Animated.View, { style: [styles.scrim, { opacity: dim }] }, h(Pressable, { style: FILL, onPress: dismissible ? onClose : undefined, accessibilityLabel: "Close", testID: "bottom-sheet-backdrop" })) : null,
    h(Animated.View, { accessibilityViewIsModal: modal, style: flat(styles.sheet, { height: tall, opacity: tall ? 1 : 0, transform: [{ translateY: y }] }, style) },
      h(View, { style: styles.tail }),
      h(View, { ...pan.grip.panHandlers, style: styles.grip, testID: "bottom-sheet-handle", ...(web ? null : { accessible: true }), accessibilityRole: "adjustable", accessibilityLabel: typeof title === "string" ? `${title}, sheet height` : "Sheet height",
        accessibilityValue: { min: 0, max: top, now: index }, accessibilityActions: SHEET_ACTIONS, onAccessibilityAction: step, onAccessibilityEscape: dismissible ? onClose : undefined },
        handle ? h(View, { style: styles.bar }) : null,
        typeof title === "string" ? h(NativeText, { numberOfLines: 1, accessibilityRole: "header", style: styles.title }, title) : title),
      h(View, { ...pan.body.panHandlers, style: styles.body },
        scroll ? h(ScrollView, { scrollEnabled: open, bounces: false, overScrollMode: "never", onScroll, scrollEventThrottle: 16, keyboardShouldPersistTaps: "handled", contentContainerStyle: flat(styles.content, padding, contentStyle) }, children)
          : h(View, { style: flat({ flex: 1 }, styles.content, padding, contentStyle) }, children))));
  return modal ? h(Modal, { visible: true, transparent: true, animationType: "none", statusBarTranslucent: true, onRequestClose: dismissible ? onClose : undefined }, tree) : tree;
}
const DEFAULT_SNAPS = ["50%", "90%"];
const SHEET_ACTIONS = [{ name: "increment", label: "Expand" }, { name: "decrement", label: "Collapse" }];

// ---------------------------------------------------------------- SwipeRow
const SwipeContext = createContext(null);
/** Wrap a list in it and at most one SwipeRow stays open: opening or dragging a row closes the previous one. */
export function SwipeGroup({ children }) {
  const open = useRef(null);
  const api = useMemo(() => ({
    claim(close) { if (open.current && open.current !== close) open.current(); open.current = close; },
    release(close) { if (open.current === close) open.current = null; },
  }), []);
  return h(SwipeContext.Provider, { value: api }, children);
}

const swipeStyles = themed((theme) => ({
  root: { overflow: "hidden", ...(web ? { userSelect: "none" } : null) },
  content: { backgroundColor: theme.colors.surface },
  under: { ...FILL, flexDirection: "row" },
  underRight: { ...FILL, flexDirection: "row-reverse" },
  action: { alignItems: "center", justifyContent: "center", gap: 2, paddingHorizontal: theme.space["2xs"] },
  label: { color: theme.colors.brandFg, fontSize: theme.text.xs, lineHeight: 16, fontWeight: "600" },
  pressed: { opacity: 0.7 },
  fg: theme.colors.brandFg, colors: theme.colors,
}));
const swipeColor = (action, colors) => (action.destructive ? colors.bad : action.tone === "neutral" || action.tone === "muted" ? colors.muted : colors[toneName(action.tone)] ?? colors.accent);

const SwipeAction = memo(function SwipeAction({ action, width, onPick, styles }) {
  const press = useCallback(() => onPick(action), [onPick, action]);
  return h(Pressable, { onPress: press, testID: action.testID, accessibilityRole: "button", accessibilityLabel: action.label,
    style: ({ pressed }) => [styles.action, { width, backgroundColor: swipeColor(action, styles.colors) }, pressed && styles.pressed] },
    h(Glyph, { icon: action.icon, color: styles.fg, size: 20 }),
    action.label ? h(NativeText, { numberOfLines: 1, style: styles.label }, action.label) : null);
});

/**
 * A list row that slides sideways to reveal actions. leftActions and rightActions: [{ label, icon, onPress,
 * tone (accent | ok | warn | bad | neutral), destructive, closeOnPress }]; the first of each list sits at the outer
 * edge and is the one a full swipe triggers (fullSwipe, default true). Inside a SwipeGroup only one row is open.
 * Screen-reader users get the same actions through accessibilityActions, without swiping.
 * The action buttons are mounted on the first drag, so an untouched row costs two views.
 */
export const SwipeRow = memo(function SwipeRow({ children, leftActions = NONE, rightActions = NONE, actionWidth = 76, fullSwipe = true, disabled = false, onOpenChange, accessibilityLabel, style, testID }) {
  const styles = swipeStyles(), group = useContext(SwipeContext);
  const x = useValue(0), [armed, setArmed] = useState(false), [side, setSide] = useState(null);
  const live = useLatest({ leftActions, rightActions, actionWidth, fullSwipe, disabled, onOpenChange, group, side });
  const state = useRef({ width: 0, start: 0, at: 0, alive: true }).current;
  useEffect(() => () => { state.alive = false; }, [state]);

  const settle = useCallback((to, velocity) => {
    if (!state.alive) return;
    const now = live.current, next = to > 0 ? "left" : to < 0 ? "right" : null;
    state.at = to;
    spring(x, to, { velocity: velocity || 0, overshootClamping: to === 0 }).start();
    if (next) now.group?.claim(close); else now.group?.release(close);
    if (next !== now.side) { setSide(next); now.onOpenChange?.(next); }
  }, [x, state, live]); // eslint-disable-line react-hooks/exhaustive-deps
  const close = useCallback(() => settle(0), [settle]);
  const run = useCallback((action) => { action.onPress?.(); if (action.closeOnPress !== false) close(); }, [close]);

  const pan = useMemo(() => {
    const limit = (value) => {
      const now = live.current, actions = value > 0 ? now.leftActions : now.rightActions;
      if (!actions.length) return 0;
      const open = actions.length * now.actionWidth, far = now.fullSwipe ? Math.max(open, state.width) : open, size = Math.abs(value);
      return Math.sign(value) * (size <= far ? size : far + (size - far) * 0.2);
    };
    const end = (_, gesture) => {
      const now = live.current, at = limit(state.start + gesture.dx), sign = Math.sign(at), size = Math.abs(at);
      const actions = sign > 0 ? now.leftActions : now.rightActions, open = actions.length * now.actionWidth, speed = gesture.vx * sign;
      if (!sign || !actions.length) { settle(0); return; }
      if (now.fullSwipe && state.width && (size > state.width * 0.6 || (size > open && speed > 1.5))) {
        state.at = sign * state.width;
        timing(x, sign * state.width, 160, Easing.out(Easing.quad)).start(() => state.alive && run(actions[0]));
        return;
      }
      settle(size + speed * 150 > open / 2 ? sign * open : 0, gesture.vx * 1000);
    };
    return PanResponder.create({
      // Only a clearly horizontal drag is taken, so the list behind keeps its vertical scroll.
      onMoveShouldSetPanResponder: (_, gesture) => !live.current.disabled && Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5 && (live.current.leftActions.length > 0 || live.current.rightActions.length > 0),
      onPanResponderGrant: () => { setArmed(true); live.current.group?.claim(close); state.start = state.at; x.stopAnimation((value) => { state.start = value; }); },
      onPanResponderMove: (_, gesture) => x.setValue(limit(state.start + gesture.dx)),
      onPanResponderRelease: end, onPanResponderTerminate: end, onPanResponderTerminationRequest: () => false,
    });
  }, [x, state, live, settle, run, close]);

  const show = useMemo(() => ({ left: x.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: "clamp" }), right: x.interpolate({ inputRange: [-1, 0], outputRange: [1, 0], extrapolate: "clamp" }) }), [x]);
  const onLayout = useCallback((event) => { state.width = event.nativeEvent.layout.width; }, [state]);
  const names = useMemo(() => [...leftActions, ...rightActions].map((action) => ({ name: String(action.key ?? action.label), label: action.label })), [leftActions, rightActions]);
  const onAction = useCallback((event) => {
    const now = live.current, found = [...now.leftActions, ...now.rightActions].find((action) => String(action.key ?? action.label) === event.nativeEvent.actionName);
    if (found) run(found);
  }, [live, run]);
  const under = (actions, which) => (armed && actions.length ? h(Animated.View, { key: which, style: [which === "left" ? styles.under : styles.underRight, { backgroundColor: swipeColor(actions[0], styles.colors), opacity: show[which], pointerEvents: side === which ? "auto" : "none" }] },
    actions.map((action, index) => h(SwipeAction, { key: action.key ?? action.label ?? index, action, width: actionWidth, onPick: run, styles }))) : null);
  return h(View, { onLayout, testID, style: flat(styles.root, style) },
    under(leftActions, "left"), under(rightActions, "right"),
    h(Animated.View, { ...pan.panHandlers, ...(web ? null : { accessible: true }), accessibilityLabel, accessibilityActions: names, onAccessibilityAction: onAction, style: [styles.content, { transform: [{ translateX: x }] }] },
      children,
      side ? h(Pressable, { style: FILL, onPress: close, accessibilityLabel: "Close actions" }) : null));
});

// ---------------------------------------------------------------- PullToRefresh
/**
 * A ScrollView (or, given data and renderItem, a FlatList) with the platform pull-to-refresh spinner in theme
 * colours. onRefresh may return a promise: the spinner stays until it settles, and at least minDuration ms so it
 * does not flash. Pass refreshing to control it yourself. ref.current.refresh() starts a refresh from code (and is
 * the only way on the web, where there is no pull gesture). Other props go to the list.
 */
export const PullToRefresh = forwardRef(function PullToRefresh({ onRefresh, refreshing, minDuration = 400, tone = "accent", title, enabled = true, children, ...rest }, ref) {
  const theme = useTheme(), [busy, setBusy] = useState(false), latest = useLatest(onRefresh), state = useRef({ alive: true, busy: false }).current;
  useEffect(() => () => { state.alive = false; }, [state]);
  const refresh = useCallback(() => {
    if (state.busy) return Promise.resolve();
    state.busy = true; setBusy(true);
    const wait = new Promise((resolve) => setTimeout(resolve, minDuration));
    return Promise.resolve().then(() => latest.current?.()).catch(() => {}).then(() => wait).then(() => { state.busy = false; if (state.alive) setBusy(false); });
  }, [latest, state, minDuration]);
  const list = useRef(null);
  useImperativeHandle(ref, () => ({ refresh, get list() { return list.current; } }), [refresh]);
  const color = theme.colors[toneName(tone)] ?? theme.colors.accent, shown = refreshing !== undefined ? refreshing : busy;
  const control = useMemo(() => h(RefreshControl, { refreshing: shown, onRefresh: refresh, enabled, tintColor: color, colors: [color], progressBackgroundColor: theme.colors.surface, title, titleColor: theme.colors.muted }),
    [shown, refresh, enabled, color, theme, title]);
  return h(rest.data && rest.renderItem ? FlatList : ScrollView, { ref: list, refreshControl: control, ...rest }, children);
});

// ---------------------------------------------------------------- SearchBar
const SEARCH = 40;
const searchStyles = themed((theme) => ({
  root: { height: SEARCH, justifyContent: "center" },
  row: { height: SEARCH, flexDirection: "row", alignItems: "center", paddingLeft: theme.space.s },
  input: { flex: 1, height: SEARCH, paddingVertical: 0, paddingHorizontal: theme.space.xs, color: theme.colors.fg, fontSize: theme.text.md, ...(web ? { outlineStyle: "none" } : null) },
  lens: { width: 16, height: 16 },
  ring: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: theme.colors.muted },
  stick: { position: "absolute", right: 1, bottom: 0, width: 2, height: 6, borderRadius: 1, backgroundColor: theme.colors.muted, transform: [{ rotate: "-45deg" }] },
  clear: { position: "absolute", right: 0, top: 0, width: SEARCH, height: SEARCH },
  clearHit: { flex: 1, alignItems: "center", justifyContent: "center" },
  clearDot: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.muted },
  clearText: { color: theme.colors.sunken, fontSize: 14, lineHeight: 17, fontWeight: "700" },
  cancel: { position: "absolute", right: 0, top: 0, bottom: 0, justifyContent: "center" },
  cancelHit: { height: SEARCH, paddingLeft: theme.space["2xs"], justifyContent: "center" },
  cancelText: { color: theme.colors.accent, fontSize: theme.text.md, lineHeight: 22 },
  pressed: { opacity: 0.5 },
  field: theme.colors.sunken, muted: theme.colors.muted, accent: theme.colors.accent, radius: Math.min(SEARCH / 2, theme.radius.full), gap: theme.space.xs,
}));
const VSLOP = { top: 2, bottom: 2 };

/**
 * A rounded search field. value + onChange(text) (or defaultValue). debounce (ms) delays onChange while typing; the
 * field itself always updates at once. onSubmit(text) fires on the keyboard's search key. A clear button appears
 * when there is text; a Cancel button slides in while the field is focused or filled (showCancel), and clears and
 * blurs it. The field narrows with transforms only. Other props go to the TextInput; ref is the TextInput.
 */
export const SearchBar = memo(forwardRef(function SearchBar({ value, defaultValue = "", onChange, onSubmit, onCancel, onFocus, onBlur, placeholder = "Search", debounce = 0, cancelLabel = "Cancel", showCancel = true, disabled = false, style, testID, ...rest }, ref) {
  const styles = searchStyles(), input = useRef(null), timer = useRef(null);
  const [text, setText] = useState(value ?? defaultValue), [focused, setFocused] = useState(false), [width, setWidth] = useState(0), [cancelWidth, setCancelWidth] = useState(0);
  const live = useLatest({ onChange, onSubmit, onCancel, onFocus, onBlur, debounce, text });
  useImperativeHandle(ref, () => input.current, []);
  useEffect(() => { if (value !== undefined) setText(value); }, [value]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const emit = useCallback((next, now) => {
    clearTimeout(timer.current);
    if (now || !live.current.debounce) live.current.onChange?.(next);
    else timer.current = setTimeout(() => live.current.onChange?.(next), live.current.debounce);
  }, [live]);
  const change = useCallback((next) => { setText(next); emit(next); }, [emit]);
  const clear = useCallback(() => { setText(""); emit("", true); input.current?.focus(); }, [emit]);
  const cancel = useCallback(() => { setText(""); emit("", true); input.current?.blur(); live.current.onCancel?.(); }, [emit, live]);
  const submit = useCallback(() => { emit(live.current.text, true); live.current.onSubmit?.(live.current.text); }, [emit, live]);
  const focus = useCallback((event) => { setFocused(true); live.current.onFocus?.(event); }, [live]);
  const blur = useCallback((event) => { setFocused(false); live.current.onBlur?.(event); }, [live]);
  const onLayout = useCallback((event) => setWidth(Math.round(event.nativeEvent.layout.width)), []);
  const onCancelLayout = useCallback((event) => setCancelWidth(Math.ceil(event.nativeEvent.layout.width)), []);

  const active = showCancel && (focused || text.length > 0), shrink = showCancel && cancelWidth ? cancelWidth + styles.gap : 0;
  const progress = useValue(0);
  useEffect(() => { timing(progress, active ? 1 : 0, 220).start(); }, [active, progress]);
  const motion = useMemo(() => ({
    clear: { transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -shrink] }) }] },
    cancel: { opacity: progress, transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [shrink || 80, 0] }) }] },
  }), [progress, shrink]);
  return h(View, { onLayout, testID, accessibilityRole: "search", style: flat(styles.root, disabled && { opacity: 0.5 }, style) },
    h(Stretch, { progress, width, shrink, anchor: 0, radius: styles.radius, color: styles.field }),
    h(View, { style: [styles.row, { paddingRight: (active ? shrink : 0) + (text ? SEARCH - 8 : 4) }] },
      h(View, { style: styles.lens, "aria-hidden": true }, h(View, { style: styles.ring }), h(View, { style: styles.stick })),
      h(TextInput, { ref: input, value: text, onChangeText: change, onSubmitEditing: submit, onFocus: focus, onBlur: blur, editable: !disabled, placeholder, placeholderTextColor: styles.muted, selectionColor: styles.accent,
        accessibilityLabel: placeholder, returnKeyType: "search", autoCorrect: false, autoCapitalize: "none", hitSlop: VSLOP, testID: testID ? `${testID}-input` : undefined, ...rest, style: styles.input })),
    text ? h(Animated.View, { style: [styles.clear, motion.clear] },
      h(Pressable, { onPress: clear, accessibilityRole: "button", accessibilityLabel: "Clear search", testID: testID ? `${testID}-clear` : undefined, hitSlop: VSLOP, style: ({ pressed }) => (pressed ? [styles.clearHit, styles.pressed] : styles.clearHit) },
        h(View, { style: styles.clearDot }, h(NativeText, { allowFontScaling: false, style: styles.clearText }, GLYPH.close)))) : null,
    showCancel ? h(Animated.View, { onLayout: onCancelLayout, style: [styles.cancel, motion.cancel, { pointerEvents: active ? "auto" : "none" }], ...(active ? null : hiddenFromReaders) },
      h(Pressable, { onPress: cancel, accessibilityRole: "button", testID: testID ? `${testID}-cancel` : undefined, hitSlop: VSLOP, style: ({ pressed }) => (pressed ? [styles.cancelHit, styles.pressed] : styles.cancelHit) },
        h(NativeText, { numberOfLines: 1, style: styles.cancelText }, cancelLabel))) : null);
}));

// ---------------------------------------------------------------- Chip and ChipGroup
const CHIP = { s: { height: 28, text: 13, pad: 10 }, m: { height: 32, text: 14, pad: 12 } };
const chipStyles = themed((theme) => ({
  root: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", overflow: "hidden", borderWidth: 1, borderRadius: theme.radius.full, borderColor: theme.colors.line, backgroundColor: theme.colors.surface },
  main: { flexDirection: "row", alignItems: "center", gap: 6 },
  text: { color: theme.colors.fg, fontWeight: "500" },
  remove: { alignSelf: "stretch", paddingLeft: 4, paddingRight: 10, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.6 },
  off: { opacity: 0.45 },
  ripple: { color: theme.colors.sunken },
  group: { flexDirection: "row", alignItems: "center" },
  fg: theme.colors.fg, muted: theme.colors.muted, tones: theme.tones, space: theme.space, touch: theme.touch,
}));

/**
 * A compact pill. With selected (true or false) and onPress it is a filter or choice chip, ticked while selected;
 * with onRemove it is an input chip with its own remove button beside the label (two targets, not nested);
 * with neither it is a static tag. size: s | m.  tone colours the selected state.
 */
export const Chip = memo(function Chip({ label, children, selected, onPress, onRemove, icon, check = true, size = "m", tone = "accent", disabled = false, role, removeLabel, style, testID }) {
  const styles = chipStyles(), dims = CHIP[size] ?? CHIP.m, colours = styles.tones[toneName(tone)] ?? styles.tones.accent, on = selected === true;
  const color = on ? colours.fg : styles.fg, slop = useMemo(() => ({ top: (styles.touch - dims.height) / 2, bottom: (styles.touch - dims.height) / 2 }), [styles, dims]);
  const said = typeof label === "string" ? label : undefined;
  const content = [
    on && check ? h(Glyph, { key: "c", icon: "check", color, size: dims.text }) : icon ? h(Glyph, { key: "i", icon, color, size: dims.text + 2 }) : null,
    h(NativeText, { key: "t", numberOfLines: 1, style: [styles.text, { color, fontSize: dims.text, lineHeight: dims.text + 6 }] }, children ?? label)];
  const box = { height: dims.height, paddingLeft: dims.pad, paddingRight: onRemove ? 2 : dims.pad };
  const kind = role ?? (selected !== undefined ? "checkbox" : onPress ? "button" : undefined);
  return h(View, { testID, style: flat(styles.root, on && { borderColor: colours.fg, backgroundColor: colours.soft }, disabled && styles.off, style) },
    onPress ? h(Pressable, { onPress, disabled, hitSlop: slop, android_ripple: styles.ripple, accessibilityRole: kind, accessibilityLabel: said,
      accessibilityState: selected !== undefined ? { checked: on, selected: on, disabled } : { disabled }, "aria-checked": selected !== undefined ? on : undefined, "aria-disabled": disabled,
      style: ({ pressed }) => (pressed && !android ? [styles.main, box, styles.pressed] : [styles.main, box]) }, content)
      : h(View, { style: [styles.main, box] }, content),
    onRemove ? h(Pressable, { onPress: onRemove, disabled, hitSlop: slop, accessibilityRole: "button", accessibilityLabel: removeLabel ?? `Remove ${said ?? ""}`.trim(), testID: testID ? `${testID}-remove` : undefined,
      style: ({ pressed }) => (pressed ? [styles.remove, styles.pressed] : styles.remove) }, h(Glyph, { icon: "close", color: on ? colours.fg : styles.muted, size: dims.text + 3 })) : null);
});

const GroupChip = memo(function GroupChip({ option, selected, onToggle, onRemove, size, tone, role }) {
  const press = useCallback(() => onToggle(option.value), [onToggle, option.value]), remove = useCallback(() => onRemove(option.value), [onRemove, option.value]);
  return h(Chip, { label: option.label, icon: option.icon, disabled: option.disabled, testID: option.testID, selected, size, tone, role, onPress: onToggle ? press : undefined, onRemove: onRemove ? remove : undefined });
});

/**
 * A row of chips. options: [{ value, label, icon, disabled }] (keep the array stable).
 * Choice: value + onChange picks one (required={false} lets the user clear it). Filter: multiple, value is an array.
 * Input: give onRemove(value) and each chip gets a remove button. scroll (default) puts them on one line that
 * scrolls sideways; scroll={false} wraps.
 */
export function ChipGroup({ options = NONE, value, defaultValue, onChange, multiple = false, required = true, onRemove, scroll = true, size = "m", tone = "accent", gap = "xs", style, contentStyle, testID }) {
  const styles = chipStyles(), selectable = value !== undefined || defaultValue !== undefined || !!onChange;
  const [inner, setInner] = useState(defaultValue ?? (multiple ? NONE : null)), current = value !== undefined ? value : inner;
  const live = useLatest({ value, current, onChange, onRemove, multiple, required });
  const toggle = useCallback((picked) => {
    const now = live.current;
    const next = now.multiple ? (now.current.includes(picked) ? now.current.filter((entry) => entry !== picked) : [...now.current, picked]) : now.current === picked ? (now.required ? picked : null) : picked;
    if (next === now.current) return;
    if (now.value === undefined) setInner(next);
    now.onChange?.(next);
  }, [live]);
  const remove = useCallback((picked) => live.current.onRemove?.(picked), [live]);
  const space = typeof gap === "number" ? gap : styles.space[gap] ?? styles.space.xs;
  const chips = options.map((option) => h(GroupChip, { key: String(option.value), option, size, tone, role: selectable ? (multiple ? "checkbox" : "radio") : undefined,
    selected: selectable ? (multiple ? current.includes(option.value) : current === option.value) : undefined, onToggle: selectable ? toggle : undefined, onRemove: onRemove ? remove : undefined }));
  const role = selectable && !multiple ? "radiogroup" : undefined;
  if (!scroll) return h(View, { testID, accessibilityRole: role, style: flat(styles.group, { flexWrap: "wrap", gap: space }, style, contentStyle) }, chips);
  return h(ScrollView, { testID, horizontal: true, showsHorizontalScrollIndicator: false, keyboardShouldPersistTaps: "handled", accessibilityRole: role, style: flat({ flexGrow: 0 }, style), contentContainerStyle: flat(styles.group, { gap: space }, contentStyle) }, chips);
}

// ---------------------------------------------------------------- PageDots
const dotStyles = themed((theme) => ({
  root: { alignSelf: "center", alignItems: "center", justifyContent: "center" },
  track: { flexDirection: "row", alignItems: "center" },
  dot: { backgroundColor: theme.colors.muted, opacity: 0.35 },
  half: { position: "absolute", top: 0, bottom: 0, width: "50%" },
  colors: theme.colors, touch: theme.touch,
}));

/**
 * A page indicator. index is the current page; the active dot slides to it. For a dot that tracks a swipe exactly,
 * pass position: an Animated node in page units (Animated.divide(scrollX, pageWidth)), which stays on the UI thread.
 * With onChange the left and right halves are buttons for the previous and next page, like the iOS page control.
 */
export const PageDots = memo(function PageDots({ count = 0, index = 0, position, onChange, size = 8, gap, tone = "accent", style, testID }) {
  const styles = dotStyles(), own = useValue(index), space = gap ?? size, wide = Math.round(size * 2.5), last = Math.max(1, count - 1);
  useEffect(() => { if (!position) spring(own, index).start(); }, [index, position, own]);
  const slide = useMemo(() => ({ transform: [{ translateX: (position ?? own).interpolate({ inputRange: [0, last], outputRange: [0, last * (size + space)], extrapolate: "clamp" }) }] }), [position, own, last, size, space]);
  const live = useLatest({ index, count, onChange });
  const back = useCallback(() => live.current.index > 0 && live.current.onChange?.(live.current.index - 1), [live]);
  const next = useCallback(() => live.current.index < live.current.count - 1 && live.current.onChange?.(live.current.index + 1), [live]);
  const dots = [];
  for (let i = 0; i < count; i++) dots.push(h(View, { key: i, style: [styles.dot, { width: size, height: size, borderRadius: size / 2, marginLeft: i ? space : 0 }] }));
  return h(View, { testID, ...(web || onChange ? null : { accessible: true }), accessibilityLabel: `Page ${index + 1} of ${count}`, style: flat(styles.root, { paddingHorizontal: wide, minHeight: onChange ? styles.touch : size }, style) },
    h(View, { style: styles.track }, dots,
      h(Animated.View, { style: [{ position: "absolute", top: 0, left: -(wide - size) / 2, width: wide, height: size, borderRadius: size / 2, backgroundColor: styles.colors[toneName(tone)] ?? styles.colors.accent }, slide] })),
    onChange ? h(Pressable, { onPress: back, disabled: index <= 0, accessibilityRole: "button", accessibilityLabel: "Previous page", style: [styles.half, { left: 0 }] }) : null,
    onChange ? h(Pressable, { onPress: next, disabled: index >= count - 1, accessibilityRole: "button", accessibilityLabel: "Next page", style: [styles.half, { right: 0 }] }) : null);
});

// ---------------------------------------------------------------- Banner
const bannerStyles = themed((theme) => ({
  clip: { overflow: "hidden" },
  floating: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, overflow: "hidden" },
  box: { flexDirection: "row", alignItems: "flex-start", gap: theme.space.s, paddingLeft: theme.space.m, paddingRight: theme.space["2xs"], paddingVertical: theme.space.s, borderBottomWidth: 1 },
  mark: { width: 22, height: 22, marginTop: 1, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, gap: 2, paddingRight: theme.space.xs },
  title: { color: theme.colors.fg, fontSize: theme.text.sm, lineHeight: 21, fontWeight: "600" },
  text: { color: theme.colors.fg, fontSize: theme.text.sm, lineHeight: 21 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.m, marginTop: theme.space["2xs"] },
  action: { fontSize: theme.text.sm, lineHeight: 21, fontWeight: "700" },
  close: { width: 36, height: 36, marginTop: -6, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.5 },
  slop: { top: 12, bottom: 12, left: 6, right: 6 },
  tones: theme.tones, fg: theme.colors.fg, onMark: theme.colors.surface,
}));
const BANNER_ICON = { accent: "info", ok: "check", warn: "warn", bad: "warn" };

const BannerAction = memo(function BannerAction({ action, color, styles }) {
  return h(Pressable, { onPress: action.onPress, hitSlop: styles.slop, testID: action.testID, accessibilityRole: "button", style: ({ pressed }) => (pressed ? styles.pressed : null) },
    h(NativeText, { style: [styles.action, { color }] }, action.label));
});

/**
 * A notice across the top of a screen. tone: accent | ok | warn | bad.  actions: [{ label, onPress }] or an element.
 * onClose adds a dismiss button. visible animates it in and out (slide and fade, on the native driver); it is
 * unmounted after the exit. Inline it takes room in the layout, so the content below moves at once when it mounts
 * and unmounts; floating lays it over the content instead and nothing moves. topInset pads the status bar area.
 */
export const Banner = memo(function Banner({ visible = true, tone = "accent", icon, title, children, actions, onClose, floating = false, topInset = 0, style, testID }) {
  const styles = bannerStyles(), name = toneName(tone) ?? "accent", colours = styles.tones[name];
  const [mounted, progress] = usePresence(visible), [height, setHeight] = useState(120);
  const onLayout = useCallback((event) => setHeight(Math.ceil(event.nativeEvent.layout.height)), []);
  const motion = useMemo(() => ({ opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-height, 0] }) }] }), [progress, height]);
  if (!mounted) return null;
  return h(View, { testID, style: flat(floating ? styles.floating : styles.clip, { pointerEvents: "box-none" }, style) },
    h(Animated.View, { onLayout, accessibilityRole: "alert", accessibilityLiveRegion: "polite", style: [styles.box, { paddingTop: topInset + styles.box.paddingVertical, backgroundColor: colours.tint, borderBottomColor: colours.soft }, motion] },
      icon === null ? null : h(View, { style: [styles.mark, typeof (icon ?? "") === "string" && { backgroundColor: colours.fg }] }, h(Glyph, { icon: icon ?? BANNER_ICON[name], color: styles.onMark, size: 13, weight: "800" })),
      h(View, { style: styles.body },
        title ? h(NativeText, { style: styles.title }, title) : null,
        typeof children === "string" ? h(NativeText, { style: styles.text }, children) : children,
        Array.isArray(actions) ? h(View, { style: styles.actions }, actions.map((action, index) => h(BannerAction, { key: action.key ?? action.label ?? index, action, color: colours.fg, styles }))) : actions ?? null),
      onClose ? h(Pressable, { onPress: onClose, accessibilityRole: "button", accessibilityLabel: "Dismiss", testID: "banner-close", style: ({ pressed }) => (pressed ? [styles.close, styles.pressed] : styles.close) }, h(Glyph, { icon: "close", color: styles.fg, size: 20 })) : null));
});

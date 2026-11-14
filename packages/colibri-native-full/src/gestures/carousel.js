// Carousel for the gestures entry: a pager whose dots and parallax follow the scroll position on the UI thread.
import { Children, createElement as h, useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text as NativeText, View } from "react-native";
import Animated, { Extrapolation, interpolate, useAnimatedReaction, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useReducedMotion, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useTheme } from "@colibri-kit/native-core";
import { gapOf, flat, GLYPH } from "@colibri-kit/native-core/internal";
import { clamp, useLatest, useStable } from "./shared.js";

const DOT = 8, SLOT = 18; // a dot, and the width each one is given in the row

// One slide. With parallax the content moves slower than the page around it, so it seems to sit further back.
function Slide({ at, count, current, width, scrollX, parallax, children }) {
  const drift = useAnimatedStyle(() => ({ transform: [{ translateX: parallax && width ? (scrollX.value - at * width) * parallax : 0 }] }), [scrollX, at, width, parallax]);
  return h(View, { accessibilityLabel: `Slide ${at + 1} of ${count}`, "aria-roledescription": "slide", "aria-hidden": at !== current,
    accessibilityElementsHidden: at !== current, importantForAccessibility: at === current ? "auto" : "no-hide-descendants", style: { width, overflow: "hidden" } },
    parallax ? h(Animated.View, { style: drift }, children) : children);
}

/**
 * Slides you swipe through, one per page, with previous / next buttons and dots. Same props as the core Carousel:
 * each child is a slide; index + onChange (or defaultIndex); loop wraps around at the ends; autoplay is a delay in
 * milliseconds (off when the device asks for reduced motion, and paused while a finger is on the slides).
 * The marker under the slides follows the scroll position on the UI thread: it travels between the dots as the
 * page is dragged, stretching on the way. onChange is called once, when the page settles on another slide.
 * Extra: parallax (0 to 1, default 0) moves each slide's content at that fraction of the page's speed, a depth
 * effect for pictures. It is off under reduced motion.
 */
export function Carousel({ children, index, defaultIndex = 0, onChange, loop = false, autoplay = 0, showArrows = true, showDots = true, gap = "s", parallax = 0, accessibilityLabel = "Carousel", style, testID }) {
  const theme = useTheme(), c = theme.colors, slides = Children.toArray(children), count = slides.length, reduced = useReducedMotion();
  const [inner, setInner] = useState(defaultIndex), controlled = index !== undefined, current = clamp((controlled ? index : inner) ?? 0, 0, Math.max(0, count - 1));
  const [width, setWidth] = useState(0), [held, setHeld] = useState(false);
  const scroller = useAnimatedRef(), scrollX = useSharedValue(0), page = useSharedValue(0);
  const shown = useRef(0), target = useRef(null), timer = useRef(null), laidOut = useRef(false);
  const live = useLatest({ controlled, onChange, current, count });
  const setCurrent = useCallback((next) => { if (!live.current.controlled) setInner(next); live.current.onChange?.(next); }, [live]);
  useEffect(() => { page.value = width; }, [width, page]);

  useEffect(() => {
    if (!width || shown.current === current) { if (width) laidOut.current = true; return; }
    const animated = laidOut.current && !reduced; laidOut.current = true;
    target.current = current; clearTimeout(timer.current);
    timer.current = setTimeout(() => { target.current = null; shown.current = current; }, 700); // in case no scroll events arrive
    scroller.current?.scrollTo({ x: current * width, y: 0, animated });
  }, [current, width, reduced, scroller]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const go = useCallback((to) => { const total = live.current.count; if (total) setCurrent(loop ? (to + total) % total : clamp(to, 0, total - 1)); }, [loop, setCurrent, live]);
  useEffect(() => {
    if (!autoplay || reduced || held || count < 2) return undefined;
    const id = setInterval(() => go(current + 1 >= count ? 0 : current + 1), Math.max(1500, autoplay));
    return () => clearInterval(id);
  }, [autoplay, reduced, held, count, current, go]);

  // The scroll position lives on the UI thread. React hears about it only when the nearest slide changes.
  const onScroll = useAnimatedScrollHandler({ onScroll: (event) => { "worklet"; scrollX.value = event.contentOffset.x; } }, [scrollX]);
  const settled = useStable((at) => {
    const now = live.current, to = clamp(at, 0, now.count - 1);
    if (target.current != null) { if (to !== target.current) return; target.current = null; clearTimeout(timer.current); } // a scroll we started: wait until it arrives
    shown.current = to;
    if (to !== now.current) setCurrent(to);
  });
  useAnimatedReaction(() => (page.value ? Math.round(scrollX.value / page.value) : -1), (now, before) => { "worklet"; if (now >= 0 && now !== before) scheduleOnRN(settled, now); }, [scrollX, page, settled]);

  const marker = useAnimatedStyle(() => {
    const at = page.value ? clamp(scrollX.value / page.value, 0, Math.max(0, count - 1)) : current, between = at - Math.floor(at);
    return { transform: [{ translateX: at * SLOT }, { scaleX: interpolate(between, [0, 0.5, 1], [1, 1.5, 1], Extrapolation.CLAMP) }] };
  }, [scrollX, page, count, current]);

  const arrow = (label, glyph, to, disabled) => h(Pressable, { onPress: () => go(to), disabled, accessibilityRole: "button", accessibilityLabel: label, accessibilityState: { disabled }, "aria-disabled": disabled, hitSlop: 4,
    style: ({ pressed }) => ({ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: c.line, backgroundColor: pressed ? c.sunken : c.surface, alignItems: "center", justifyContent: "center", opacity: disabled ? 0.4 : 1 }) },
    h(NativeText, { style: { color: c.fg, fontSize: 20, lineHeight: 22, fontWeight: "600", marginTop: -2 } }, glyph));
  const depthOf = reduced ? 0 : clamp(+parallax || 0, 0, 1);

  return h(View, { testID, accessibilityLabel, "aria-roledescription": "carousel", style: flat({ gap: gapOf(theme, gap) }, style) },
    h(View, { onLayout: (event) => setWidth(Math.round(event.nativeEvent.layout.width)), style: { borderRadius: theme.radius.l, overflow: "hidden" } },
      h(Animated.ScrollView, { ref: scroller, horizontal: true, pagingEnabled: true, showsHorizontalScrollIndicator: false, scrollEventThrottle: 16, onScroll, decelerationRate: "fast",
        onScrollBeginDrag: () => { target.current = null; setHeld(true); }, onScrollEndDrag: () => setHeld(false), onTouchStart: () => setHeld(true), onTouchEnd: () => setHeld(false), onTouchCancel: () => setHeld(false) },
        width ? slides.map((slide, at) => h(Slide, { key: slide.key ?? at, at, count, current, width, scrollX, parallax: depthOf }, slide)) : null)),
    (showArrows || showDots) && count > 1 ? h(View, { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.space.xs } },
      showArrows ? arrow("Previous slide", GLYPH.chevronLeft, current - 1, !loop && current <= 0) : h(View, null),
      showDots ? h(View, { accessibilityRole: "tablist", style: { flexDirection: "row", alignItems: "center", flexShrink: 1 } },
        slides.map((slide, at) => h(Pressable, { key: at, onPress: () => go(at), accessibilityRole: "tab", accessibilityLabel: `Go to slide ${at + 1}`, accessibilityState: { selected: at === current }, "aria-selected": at === current,
          hitSlop: { top: 16, bottom: 16 }, style: { width: SLOT, height: DOT + 12, alignItems: "center", justifyContent: "center" } },
          h(View, { style: { width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: c.muted, opacity: 0.4 } }))),
        h(Animated.View, { style: [{ pointerEvents: "none", position: "absolute", left: (SLOT - DOT) / 2 - 3, top: 6, width: DOT + 6, height: DOT, borderRadius: DOT / 2, backgroundColor: c.accent }, marker] })) : null,
      showArrows ? arrow("Next slide", GLYPH.chevronRight, current + 1, !loop && current >= count - 1) : h(View, null)) : null);
}

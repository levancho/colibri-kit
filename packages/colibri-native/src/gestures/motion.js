// AnimatedList and PressableScale: layout animation and press feedback for the gestures entry.
import { createElement as h, useMemo } from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeIn, FadeOut, LayoutAnimationConfig, LinearTransition, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { GestureDetector, useLongPressGesture } from "react-native-gesture-handler";
import { useTheme } from "../provider.js";
import { gapOf, flat } from "../internal.js";
import { NONE, SPRING } from "./shared.js";

// ---------------------------------------------------------------- AnimatedList
const ENTER = FadeIn.duration(220), EXIT = FadeOut.duration(160), MOVE = LinearTransition.duration(240);
// Animation builders are changed in place by their methods, so a delayed one is made from a copy.
const later = (animation, delay) => (typeof animation.delay === "function" ? Object.assign(Object.create(Object.getPrototypeOf(animation)), animation).delay(delay) : animation);
/**
 * A list whose rows animate when the data changes: a new row fades in, a removed row fades out, and the rows
 * around them glide to their new places (Reanimated layout animations, which run on the UI thread).
 * data and renderItem({ item, index }) as in a FlatList; keyExtractor defaults to item.id ?? item.key ?? the item
 * itself, and the keys must be stable or nothing can be matched between renders.
 * entering, exiting and layout take any Reanimated layout animation (FadeInDown, ZoomOut, LinearTransition.springify()
 * and so on, imported from react-native-reanimated); null turns one off. initial (default false) also animates the
 * rows that are there on the first render, each delayed by stagger milliseconds after the one before it.
 * Under reduced motion Reanimated skips these animations. The list is not virtualized: every row is mounted, which
 * suits tens of rows. For a long feed use Animated.FlatList from react-native-reanimated with itemLayoutAnimation.
 */
export function AnimatedList({ data = NONE, renderItem, keyExtractor, entering = ENTER, exiting = EXIT, layout = MOVE, initial = false, stagger = 0, gap = "xs", horizontal = false, accessibilityLabel, style, itemStyle, testID }) {
  const theme = useTheme(), keyFor = keyExtractor ?? ((item) => String(item?.id ?? item?.key ?? item));
  const rows = data.map((item, index) => h(Animated.View, { key: keyFor(item, index), entering: entering && initial && stagger ? later(entering, index * stagger) : entering ?? undefined, exiting: exiting ?? undefined, layout: layout ?? undefined, style: itemStyle },
    renderItem?.({ item, index })));
  return h(View, { testID, accessibilityRole: "list", accessibilityLabel, style: flat({ gap: gapOf(theme, gap), flexDirection: horizontal ? "row" : "column" }, style) },
    h(LayoutAnimationConfig, { skipEntering: !initial }, rows));
}

// ---------------------------------------------------------------- PressableScale
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
/**
 * A Pressable that shrinks a little under the finger. The feedback is started by a gesture on the UI thread, so it
 * shows at once even when the JavaScript thread is busy; the press itself (onPress, onLongPress, accessibility,
 * keyboard) is React Native's own Pressable, and every Pressable prop passes through.
 * scale (default 0.96) is the size while pressed; pressedOpacity (default 1) dims it as well. delay (ms, default 0)
 * holds the feedback back, which stops rows flashing when a scroll starts on them (try 80 inside a list). A tap
 * shorter than the animation still shows a full pulse. Moving the finger more than 12 points lets go.
 * style is a plain style (not a function of the pressed state: the animation is the pressed state).
 * Under reduced motion nothing scales; the pressed state is a dim instead.
 */
export function PressableScale({ scale = 0.96, pressedOpacity = 1, delay = 0, disabled = false, style, children, ...rest }) {
  const reduced = useReducedMotion(), pressed = useSharedValue(0), startX = useSharedValue(0), startY = useSharedValue(0);
  const feedback = useLongPressGesture(useMemo(() => ({
    // It never becomes active (an hour is longer than any press), so it never takes the touch from the Pressable.
    minDuration: 3600000, maxDistance: 12, enabled: !disabled,
    onBegin: (event) => { "worklet"; startX.value = event.absoluteX; startY.value = event.absoluteY; pressed.value = withDelay(delay, withTiming(1, { duration: 90 })); },
    onFinalize: (event) => {
      "worklet";
      const still = Math.abs(event.absoluteX - startX.value) < 6 && Math.abs(event.absoluteY - startY.value) < 6;
      // A quick tap lifts before the press-in has played: finish it, then let go.
      pressed.value = still && pressed.value < 0.6 ? withSequence(withTiming(1, { duration: 70 }), withSpring(0, SPRING)) : withSpring(0, SPRING);
    },
  }), [pressed, startX, startY, delay, disabled]));
  const look = useAnimatedStyle(() => {
    const depth = pressed.value;
    return reduced ? { opacity: 1 - 0.3 * depth } : { opacity: 1 - (1 - pressedOpacity) * depth, transform: [{ scale: 1 - (1 - scale) * depth }] };
  }, [pressed, scale, pressedOpacity, reduced]);
  return h(GestureDetector, { gesture: feedback },
    h(AnimatedPressable, { disabled, accessibilityRole: "button", accessibilityState: { disabled }, "aria-disabled": disabled, ...rest, style: [style, disabled && { opacity: 0.5 }, look] }, children));
}

// Helpers shared by the files of the gestures entry. Not part of the public API.
//
// HOW THIS ENTRY IS WRITTEN (read before changing anything)
//  1. A finger moves a shared value, on the UI thread. Gesture callbacks, animated-style functions and every helper
//     they call start with "worklet";. React state changes once, when a gesture ends (scheduleOnRN), never per frame.
//  2. Every Reanimated hook gets a dependency array that lists the shared values it reads (and any prop it closes
//     over). Without the Babel plugin (the web test build) that array is the only way Reanimated learns what to
//     listen to: a style whose array misses a shared value never updates there.
//  3. A worklet may only close over shared values, numbers, strings, plain data and other worklets. Refs and
//     functions of the JavaScript thread are reached with scheduleOnRN(fn, ...args). Props a worklet needs are
//     either dependencies of the useMemo that builds the gesture config or mirrored into a shared value.
//  4. Gesture configs are built in useMemo: Gesture Handler 3 re-sends a config to the native side whenever the
//     object changes.
//  5. Reduced motion: springs and timings use Reanimated's default (ReduceMotion.System), so they jump to their end
//     when the system setting is on. Decorative motion (parallax, scaling) is also switched off with
//     useReducedMotion().
import { useCallback, useRef } from "react";
import { Dimensions, Platform, StatusBar, StyleSheet } from "react-native";
import { useTheme } from "@colibri-kit/native-core";

export const ios = Platform.OS === "ios", android = Platform.OS === "android";
export const FILL = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 };
export const NONE = [];
export const HAIR = StyleSheet.hairlineWidth;
/** The spring every release settles with (the same feel as the core components). */
export const SPRING = { stiffness: 420, damping: 38, mass: 1 };
export const hiddenFromReaders = { "aria-hidden": true, importantForAccessibility: "no-hide-descendants", accessibilityElementsHidden: true };

export const clamp = (value, low, high) => {
  "worklet";
  return Math.min(high, Math.max(low, value));
};
/** Nearest step from min, clamped, without floating-point noise. places is the number of decimals to keep. */
export const snapTo = (raw, min, max, step, places) => {
  "worklet";
  const size = step > 0 ? step : 1, scale = Math.pow(10, places);
  const stepped = Math.round((Math.round((raw - min) / size) * size + min) * scale) / scale;
  return Math.min(max, Math.max(min, stepped));
};
export const decimals = (n) => { const s = String(n), e = s.indexOf("e-"); if (e >= 0) return +s.slice(e + 2); const dot = s.indexOf("."); return dot < 0 ? 0 : s.length - dot - 1; };

/** Styles built once per theme object and shared by every instance. */
export const themed = (factory) => {
  const cache = new WeakMap();
  return () => { const theme = useTheme(); let styles = cache.get(theme); if (!styles) cache.set(theme, (styles = factory(theme))); return styles; };
};
export const useLatest = (value) => { const ref = useRef(value); ref.current = value; return ref; };
/** A callback with one identity for the life of the component that always runs the latest function. Safe to hand to scheduleOnRN. */
export function useStable(fn) {
  const latest = useLatest(fn);
  return useCallback((...args) => latest.current?.(...args), [latest]);
}
export const keyOf = (event) => event?.nativeEvent?.key ?? event?.key;

// Without a safe-area library the insets can only be estimated (same guesses as the core entry). Pass the real
// values (bottomInset, inset) when the app has them, for example from react-native-safe-area-context.
const longSide = () => { const { width, height } = Dimensions.get("window"); return Math.max(width, height); };
const landscape = () => { const { width, height } = Dimensions.get("window"); return width > height; };
/** Height of the home indicator area: iPhones without a home button, and recent iPads. 0 elsewhere. */
export const homeIndicator = () => (!ios ? 0 : Platform.isPad ? (longSide() >= 1100 ? 20 : 0) : longSide() >= 780 ? (landscape() ? 21 : 34) : 0);
export const statusBarTop = () => (android ? StatusBar.currentHeight ?? 0 : 0);

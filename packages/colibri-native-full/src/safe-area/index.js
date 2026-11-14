// Optional entry: @colibri-kit/native-full/safe-area. Needs react-native-safe-area-context. See ARCHITECTURE.md ("Optional entries").
//
// The bars and sheets of the main entry take the notch and the home indicator as numbers (topInset, bottomInset)
// and can only guess them. The components here read the real insets and pass them on, nothing more: every other
// prop goes through unchanged, and a topInset or bottomInset you pass yourself still wins.
//
//   import { SafeAreaRoot, SafeScreen, SafeAppBar, SafeBottomBar } from "@colibri-kit/native-full/safe-area";
//
//   <SafeAreaRoot>                      once, at the top of the app
//     <SafeAppBar title="Inbox" />      pads the status bar area
//     <SafeScreen edges={["left", "right"]} scroll>…</SafeScreen>
//     <SafeBottomBar items={tabs} />    pads the home indicator area
//   </SafeAreaRoot>
import { createElement as h, useContext } from "react";
import { SafeAreaInsetsContext, SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import { Screen } from "@colibri-kit/native-core";
import { ActionSheet, AppBar, Banner, BottomBar, BottomSheet, Fab } from "@colibri-kit/native-core";
import { useTheme } from "@colibri-kit/native-core";

const ZERO = Object.freeze({ top: 0, bottom: 0, left: 0, right: 0 });
const ALL = ["top", "bottom", "left", "right"];
let warned = false;

/**
 * The provider every component of this entry reads from: SafeAreaProvider and nothing else, with the insets the
 * system reported at launch as the starting value, so the first frame is already laid out correctly. Put it once
 * around the app (it fills its parent; pass style to change that). An app that already renders SafeAreaProvider,
 * as Expo Router and React Navigation apps do, does not need it.
 */
export function SafeAreaRoot({ initialMetrics = initialWindowMetrics, children, ...rest }) {
  return h(SafeAreaProvider, { initialMetrics, ...rest }, children);
}

/**
 * The safe-area insets in points: { top, bottom, left, right }. It follows rotation and system bars.
 * Outside a provider it returns zeros (and says so once in development) instead of throwing, so a screen still
 * renders in a test or a storybook that has no provider.
 */
export function useInsets() {
  const insets = useContext(SafeAreaInsetsContext);
  if (insets == null && !warned && typeof __DEV__ !== "undefined" && __DEV__) {
    warned = true;
    console.warn("@colibri-kit/native-full/safe-area: no safe-area provider found, so every inset is 0. Wrap the app in <SafeAreaRoot>.");
  }
  return insets ?? ZERO;
}

/**
 * Screen (same props) with the safe area added to its padding. edges picks the sides: by default all four; use
 * ["left", "right"] between a SafeAppBar and a SafeBottomBar, which cover the top and the bottom themselves.
 * With scroll the insets pad the content, so it scrolls under the status bar and the home indicator and still
 * comes to rest clear of them.
 */
export function SafeScreen({ edges = ALL, padded = true, scroll = false, style, contentStyle, ...rest }) {
  const theme = useTheme(), insets = useInsets(), base = padded ? theme.space.m : 0;
  const side = (edge) => base + (edges.includes(edge) ? insets[edge] : 0);
  const padding = { paddingTop: side("top"), paddingBottom: side("bottom"), paddingLeft: side("left"), paddingRight: side("right") };
  return scroll ? h(Screen, { padded, scroll, style, contentStyle: [padding, contentStyle], ...rest }) : h(Screen, { padded, scroll, style: [padding, style], ...rest });
}

/** BottomBar with bottomInset from the device: the bar grows by the height of the home indicator area. */
export function SafeBottomBar({ bottomInset, ...rest }) {
  const insets = useInsets();
  return h(BottomBar, { ...rest, bottomInset: bottomInset ?? insets.bottom });
}

/** AppBar with topInset from the device: the bar grows by the height of the status bar, notch or island. */
export function SafeAppBar({ topInset, ...rest }) {
  const insets = useInsets();
  return h(AppBar, { ...rest, topInset: topInset ?? insets.top });
}

/** Fab with bottomInset from the device, so a button at the bottom stays above the home indicator. */
export function SafeFab({ bottomInset, ...rest }) {
  const insets = useInsets();
  return h(Fab, { ...rest, bottomInset: bottomInset ?? insets.bottom });
}

/** ActionSheet with bottomInset from the device. */
export function SafeActionSheet({ bottomInset, ...rest }) {
  const insets = useInsets();
  return h(ActionSheet, { ...rest, bottomInset: bottomInset ?? insets.bottom });
}

/**
 * BottomSheet with bottomInset from the device. Like BottomSheet, a sheet with modal={false} gets no inset unless
 * you pass one: an inline sheet usually sits above a bar that already covers the home indicator.
 */
export function SafeBottomSheet({ bottomInset, ...rest }) {
  const insets = useInsets();
  return h(BottomSheet, { ...rest, bottomInset: bottomInset ?? (rest.modal === false ? 0 : insets.bottom) });
}

/**
 * Banner with topInset from the device when it is floating (laid over the top of the screen). A banner in the
 * layout normally sits under an app bar that already covers the status bar, so it gets no inset; pass
 * topInset={useInsets().top} for one that is the first thing on a screen without a bar.
 */
export function SafeBanner({ topInset, ...rest }) {
  const insets = useInsets();
  return h(Banner, { ...rest, topInset: topInset ?? (rest.floating ? insets.top : 0) });
}

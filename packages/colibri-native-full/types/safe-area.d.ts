// Types for src/safe-area/: the optional entry @colibri-kit/native-full/safe-area (needs react-native-safe-area-context).
// The screen, bars and sheets of the main entry, fed with the real insets. Same props as the originals; a
// topInset or bottomInset you pass yourself still wins.
import type { ComponentType, ReactNode } from "react";
import type { SafeAreaProviderProps } from "react-native-safe-area-context";
import type { ScreenProps } from "@colibri-kit/native-core";
import type { ActionSheetProps, AppBarProps, BannerProps, BottomBarProps, BottomSheetProps, FabProps } from "@colibri-kit/native-core";

export interface Insets { top: number; bottom: number; left: number; right: number }
export type SafeEdge = "top" | "bottom" | "left" | "right";

/**
 * SafeAreaProvider and nothing else, with the insets reported at launch as its starting value (so the first
 * frame is already right). Put it once around the app; it fills its parent. Not needed where a SafeAreaProvider
 * is already rendered, as in Expo Router and React Navigation apps.
 */
export const SafeAreaRoot: ComponentType<SafeAreaProviderProps>;

/**
 * The safe-area insets in points; follows rotation and system bars. Outside a provider it returns zeros and
 * warns once in development, instead of throwing like the library's useSafeAreaInsets.
 */
export function useInsets(): Insets;

export type SafeScreenProps = ScreenProps & {
  /** The sides that get the inset added to their padding. Default: all four. */
  edges?: readonly SafeEdge[];
  children?: ReactNode;
};
/** Screen with the safe area added to its padding (to the content padding when scroll is set). */
export const SafeScreen: ComponentType<SafeScreenProps>;

/** BottomBar; bottomInset defaults to the device's bottom inset. */
export const SafeBottomBar: ComponentType<BottomBarProps>;
/** AppBar; topInset defaults to the device's top inset. */
export const SafeAppBar: ComponentType<AppBarProps>;
/** Fab; bottomInset defaults to the device's bottom inset. */
export const SafeFab: ComponentType<FabProps>;
/** ActionSheet; bottomInset defaults to the device's bottom inset. */
export const SafeActionSheet: ComponentType<ActionSheetProps>;
/** BottomSheet; bottomInset defaults to the device's bottom inset, or 0 with modal={false} (as in BottomSheet). */
export const SafeBottomSheet: ComponentType<BottomSheetProps>;
/** Banner; topInset defaults to the device's top inset when floating, else 0 (a banner in the layout sits under a bar). */
export const SafeBanner: ComponentType<BannerProps>;

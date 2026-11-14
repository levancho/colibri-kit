// Types for the optional entry @colibri-kit/native/gestures (src/gestures/): finger-driven versions of the core
// components, built on react-native-reanimated 4, react-native-worklets and react-native-gesture-handler 3.
// A component here has the same name and props as the core one; the props marked "gestures entry only" are extra.
// The app must be wrapped in GestureHandlerRootView once, at its root.
import type { ComponentType, ReactNode } from "react";
import type { PressableProps, StyleProp, ViewStyle } from "react-native";
import type { AnimatedRef, BaseAnimationBuilder, LayoutAnimationFunction, SharedValue } from "react-native-reanimated";
import type Animated from "react-native-reanimated";
import type { Gap, SheetProps as CoreSheetProps } from "../index";
import type { BottomSheetProps as CoreBottomSheetProps, SwipeAction, SwipeRowProps as CoreSwipeRowProps } from "./mobile";
import type { DrawerProps } from "./menus";
import type { SliderProps } from "./pickers";
import type { SortableProps as CoreSortableProps } from "./pickers";
import type { CarouselProps as CoreCarouselProps } from "./data";

export type { SwipeAction, DrawerProps, SliderProps, SingleSliderProps, RangeSliderProps } from "../index";

// ---------------------------------------------------------------- BottomSheet
export interface BottomSheetProps extends CoreBottomSheetProps {
  /**
   * Gestures entry only. Default true: while the keyboard is up the content is padded by the part of the sheet the
   * keyboard covers, and the sheet opens to its highest point (reported through onSnapChange) and goes back after.
   */
  keyboardAware?: boolean;
  /**
   * Gestures entry only. A shared value (useSharedValue(0)) that receives the visible height of the sheet, in
   * points, on every frame: 0 when closed. Read it in an animated style to move something with the sheet.
   */
  animatedHeight?: SharedValue<number>;
}
/**
 * A sheet that rests at snap points and follows the finger between them on the UI thread. A release keeps its
 * velocity. With scrolling content the list scrolls at the highest point and a pull down from its top moves the sheet.
 */
export const BottomSheet: ComponentType<BottomSheetProps>;

// ---------------------------------------------------------------- Sheet
export interface SheetProps extends CoreSheetProps {
  /** Gestures entry only. Default true. false: no drag, backdrop or back button closes it, only your own buttons. */
  dismissible?: boolean;
  /** Gestures entry only. The home-indicator area to keep clear. Default: a per-device guess. */
  bottomInset?: number;
  /** Gestures entry only. */
  testID?: string;
}
/** A panel from the bottom edge, as tall as its content. Tap outside, press back or drag it down to close. */
export const Sheet: ComponentType<SheetProps>;

// ---------------------------------------------------------------- Drawer
/**
 * A panel that slides in from an edge and is swiped back the way it came, following the finger. Same props as the
 * core Drawer. Left and right drawers are dragged anywhere; top and bottom ones by their header.
 */
export const Drawer: ComponentType<DrawerProps>;

// ---------------------------------------------------------------- SwipeRow
export interface SwipeRowProps extends CoreSwipeRowProps {
  /**
   * Gestures entry only. Called when the finger crosses the full-swipe point (60% of the row): true going past it,
   * false coming back. Letting go while it is true runs the outer action. A place for haptics.
   */
  onFullSwipeChange?: (armed: boolean) => void;
}
/** A list row that follows the finger sideways to reveal actions. A vertical drag is left to the list around it. */
export const SwipeRow: ComponentType<SwipeRowProps>;
/** Wrap a list in it and at most one SwipeRow stays open. */
export const SwipeGroup: ComponentType<{ children?: ReactNode }>;

// ---------------------------------------------------------------- Sortable
export interface SortableProps<T = string> extends CoreSortableProps<T> {
  /**
   * Gestures entry only. What starts a drag. "both" (default): the grip, or a press and hold anywhere on the row.
   * "handle": the grip only. "longPress": press and hold only (the grip is still shown, for the accessibility actions).
   */
  dragOn?: "both" | "handle" | "longPress";
  /**
   * Gestures entry only. The animated ref (useAnimatedRef) of the Animated.ScrollView the list is inside. With it
   * the list scrolls by itself while a row is held near the top or bottom edge of that scroll view.
   */
  scrollRef?: AnimatedRef<Animated.ScrollView> | null;
  /** Gestures entry only. A row was picked up. */
  onDragStart?: (item: T) => void;
  /** Gestures entry only. A row was put down; from and to are its positions before and after. */
  onDragEnd?: (item: T, move: { from: number; to: number }) => void;
}
/**
 * A list reordered by dragging: the row follows the finger and its neighbours slide out of the way on the UI
 * thread. Screen readers get "Move up" and "Move down" on the grip; on the web the grip takes the arrow keys.
 */
export function Sortable<T = string>(props: SortableProps<T>): ReactNode;

// ---------------------------------------------------------------- Slider
/**
 * A single or range slider whose thumbs follow the finger on the UI thread. Same props as the core Slider.
 * onChange is called each time the stepped value changes during a drag, onChangeEnd once at the end.
 */
export function Slider(props: SliderProps): ReactNode;

// ---------------------------------------------------------------- Carousel
export interface CarouselProps extends CoreCarouselProps {
  /**
   * Gestures entry only. 0 to 1, default 0. The content of each slide moves at this fraction of the page's speed
   * while the pager is dragged, so it seems to sit behind the page. Off under reduced motion.
   */
  parallax?: number;
  /** Gestures entry only. */
  testID?: string;
}
/** A pager whose marker (and parallax) follow the scroll position on the UI thread. */
export const Carousel: ComponentType<CarouselProps>;

// ---------------------------------------------------------------- AnimatedList
/** Any Reanimated layout animation: FadeIn, SlideInLeft.duration(300), LinearTransition.springify() … */
export type ListAnimation = BaseAnimationBuilder | typeof BaseAnimationBuilder | LayoutAnimationFunction;
export interface AnimatedListProps<T = unknown> {
  data?: readonly T[];
  renderItem?: (row: { item: T; index: number }) => ReactNode;
  /** Must be stable for an item. Default: item.id ?? item.key ?? the item itself. */
  keyExtractor?: (item: T, index: number) => string;
  /** How a new row arrives. Default FadeIn.duration(220). null: no animation. */
  entering?: ListAnimation | null;
  /** How a removed row leaves. Default FadeOut.duration(160). null: no animation. */
  exiting?: ListAnimation | null;
  /** How the remaining rows move to their new places. Default LinearTransition.duration(240). null: no animation. */
  layout?: ListAnimation | null;
  /** Also animate the rows present on the first render. Default false. */
  initial?: boolean;
  /** With initial: each row starts this many milliseconds after the one before it. Default 0. */
  stagger?: number;
  gap?: Gap;
  /** Lay the rows out in a row instead of a column. */
  horizontal?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Style of the view around each row. */
  itemStyle?: StyleProp<ViewStyle>;
  testID?: string;
}
/**
 * A list whose rows fade in, fade out and glide to new places when data changes (Reanimated layout animations).
 * Not virtualized: for tens of rows.
 */
export function AnimatedList<T = unknown>(props: AnimatedListProps<T>): ReactNode;

// ---------------------------------------------------------------- PressableScale
export interface PressableScaleProps extends Omit<PressableProps, "style" | "children"> {
  /** Size while pressed, as a fraction. Default 0.96. */
  scale?: number;
  /** Opacity while pressed. Default 1 (no dimming). */
  pressedOpacity?: number;
  /** Milliseconds before the feedback starts. Default 0; about 80 stops rows flashing when a scroll starts on them. */
  delay?: number;
  /** A plain style: not a function of the pressed state. */
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}
/** A Pressable that shrinks under the finger. The feedback starts on the UI thread; the press is React Native's own. */
export const PressableScale: ComponentType<PressableScaleProps>;

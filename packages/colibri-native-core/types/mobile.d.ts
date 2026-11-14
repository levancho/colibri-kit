// Types for src/mobile.js: phone-only patterns. Bottom tab bar and its screens, app bar, floating action button,
// action sheet, bottom sheet with snap points, swipe rows, pull to refresh, search bar, chips, page dots, banner.
import type { ComponentType, ForwardRefExoticComponent, ReactElement, ReactNode, RefAttributes } from "react";
import type { Animated, FlatList, FlatListProps, NativeScrollEvent, NativeSyntheticEvent, ScrollView, ScrollViewProps, StyleProp, TextInput, TextInputProps, ViewStyle } from "react-native";
import type { Gap, Tone } from "../index";

/** A GLYPH name ("plus", "search", "close" …) or any string drawn as text, an element, or a function that returns one. */
export type MobileIcon = string | ReactElement | ((info: { color: string; size: number }) => ReactNode);

// ---------------------------------------------------------------- BottomBar and TabScreens
export interface BottomBarItem {
  value: string; label: string; icon?: MobileIcon;
  /** Shown instead of icon while the tab is selected. */
  activeIcon?: MobileIcon;
  /** A count (capped at 99+), or true for a dot. */
  badge?: number | string | boolean;
  disabled?: boolean; accessibilityLabel?: string; testID?: string;
}
export interface BottomBarAction { icon?: MobileIcon; label: string; onPress?: () => void; testID?: string }
export interface BottomBarProps {
  /** Keep the array stable (a constant or useMemo): only the two tabs involved in a switch re-render. */
  items: BottomBarItem[];
  value?: string; defaultValue?: string; onChange?: (value: string) => void;
  /** The selected tab was pressed again: scroll its screen to the top. */
  onReselect?: (value: string) => void;
  /** Default "always". "selected" shows the label of the selected tab only. */
  labels?: "always" | "selected" | "never";
  /** The marker that slides to the selected tab. Default "pill". */
  indicator?: "pill" | "line" | "none";
  /** A round button in the middle of the bar. */
  action?: BottomBarAction;
  /** Padding for the home-indicator area. Default: 34 on iPhones without a home button, 0 elsewhere (an estimate; pass the real inset when you have it). */
  bottomInset?: number;
  /** Default true. */
  hideOnKeyboard?: boolean;
  style?: StyleProp<ViewStyle>; testID?: string;
}
/** The bottom tab bar (roles tablist and tab). */
export const BottomBar: ComponentType<BottomBarProps>;

export interface TabScreensProps {
  /** The selected tab. */
  value: string;
  /** One screen per tab value: a component (rendered without props) or an element. Keep the object stable. */
  screens: Record<string, ComponentType | ReactElement>;
  /** Default true: a screen is created on its first visit. false creates all of them at once. */
  lazy?: boolean;
  style?: StyleProp<ViewStyle>;
}
/** Shows the screen of the selected tab and keeps visited screens mounted and laid out, hidden, without re-rendering them. */
export const TabScreens: ComponentType<TabScreensProps>;
/** Inside a TabScreens screen: true while that screen is the visible one. Only components that call it update. */
export function useTabActive(): boolean;

// ---------------------------------------------------------------- AppBar
export interface AppBarActionProps {
  icon: MobileIcon;
  /** What a screen reader says. */
  label: string;
  onPress?: () => void; disabled?: boolean; tone?: Tone | "muted"; size?: number; testID?: string;
}
/** A 44pt icon button for the leading or trailing side of an AppBar. */
export const AppBarAction: ComponentType<AppBarActionProps>;

export interface AppBarScroll {
  scrollY: Animated.Value;
  /** Spread on an Animated.ScrollView, Animated.FlatList or Animated.SectionList. */
  scrollProps: { scrollEventThrottle: number; onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void };
}
/** Scroll state for an AppBar: the offset reaches the bar through Animated.event on the native driver. */
export function useAppBarScroll(): AppBarScroll;

export interface AppBarProps {
  title?: string; subtitle?: string;
  leading?: ReactNode; trailing?: ReactNode;
  /** Adds a back button before leading. */
  onBack?: () => void;
  /** Default "Back". */
  backLabel?: string;
  /** A large title under the bar that collapses into the small one as scrollY grows. Give the list paddingTop AppBar.largeTitleHeight. */
  large?: boolean;
  /** From useAppBarScroll. Drives the collapse and the edge under the bar. */
  scrollY?: Animated.Value;
  /** Without scrollY: show the edge. With scrollY: false turns the edge off. */
  elevated?: boolean;
  /** Default: "center" on iOS, "start" elsewhere. */
  align?: "start" | "center";
  /** Padding for the status bar area. Default: an estimate per device; pass the real inset when you have it. */
  topInset?: number;
  style?: StyleProp<ViewStyle>; testID?: string;
}
/** The top bar. */
export const AppBar: ComponentType<AppBarProps> & {
  /** Height of the bar row without the inset: 44 on iOS, 56 elsewhere. */
  height: number;
  /** Height of the large title (52). */
  largeTitleHeight: number;
};

// ---------------------------------------------------------------- Fab
export interface FabAction { icon?: MobileIcon; label?: string; onPress?: () => void; disabled?: boolean; key?: string; testID?: string }
export interface FabProps {
  /** Default "plus". */
  icon?: MobileIcon;
  /** Makes it an extended button: icon and label. */
  label?: string;
  size?: "s" | "m" | "l";
  variant?: "solid" | "soft" | "surface";
  /** With a label: false collapses it to the round button (default true). Flip it from a scroll handler. */
  extended?: boolean;
  /** Default "bottom-right". Positioned buttons fill their parent without blocking touches; "static" sits in the layout. */
  position?: "bottom-right" | "bottom-left" | "bottom-center" | "top-right" | "top-left" | "static";
  /** Distance from the edges. Default theme.space.m. */
  offset?: number;
  bottomInset?: number;
  /** Secondary actions: the button becomes a speed dial that fans them out. */
  actions?: FabAction[];
  open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
  /** Dim the screen behind an open speed dial. Default true. */
  backdrop?: boolean;
  onPress?: () => void; disabled?: boolean; accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>; testID?: string;
}
/** Floating action button, extended button and speed dial. */
export const Fab: ComponentType<FabProps>;

// ---------------------------------------------------------------- ActionSheet
export interface ActionSheetAction {
  label: string; onPress?: () => void;
  /** Drawn in the danger colour. */
  destructive?: boolean;
  icon?: MobileIcon; disabled?: boolean; key?: string; testID?: string;
}
export interface ActionSheetProps {
  visible: boolean; onClose?: () => void;
  title?: string; message?: string;
  actions?: ActionSheetAction[];
  /** Default "Cancel"; null removes the cancel button. */
  cancelLabel?: string | null;
  bottomInset?: number; testID?: string;
}
/** An iOS-style list of choices that rises from the bottom edge. Choosing one closes the sheet, then runs it. */
export const ActionSheet: ComponentType<ActionSheetProps>;

// ---------------------------------------------------------------- BottomSheet
export interface BottomSheetProps {
  visible: boolean; onClose?: () => void;
  /** Resting heights, as "50%" of the container or points. Default ["50%", "90%"]. Keep the array stable. */
  snapPoints?: Array<number | string>;
  /** Index of the point it rests at (sorted low to high). */
  snap?: number; defaultSnap?: number; onSnapChange?: (index: number) => void;
  /** Default true: shown in a Modal over the whole screen. false draws it inside its parent. */
  modal?: boolean;
  /** A dimmer behind the sheet that fades with its position; pressing it closes the sheet. Default: same as modal. */
  backdrop?: boolean;
  /** Pulling below the lowest point, the backdrop and the back button close it. Default true. */
  dismissible?: boolean;
  /** Show the drag handle. Default true. */
  handle?: boolean;
  title?: ReactNode;
  /** Default true: the content is a ScrollView that scrolls at the highest point. false renders the children in a plain View. */
  scroll?: boolean;
  bottomInset?: number;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>; contentStyle?: StyleProp<ViewStyle>; testID?: string;
}
/** A sheet that rests at snap points, follows the finger between them and is released with its velocity. */
export const BottomSheet: ComponentType<BottomSheetProps>;

// ---------------------------------------------------------------- SwipeRow
export interface SwipeAction {
  label: string; icon?: MobileIcon; onPress?: () => void;
  /** Background colour. Default accent. */
  tone?: Tone | "neutral";
  /** Same as tone="bad". */
  destructive?: boolean;
  /** Default true. false leaves the row where it is, for an action that removes the row. */
  closeOnPress?: boolean;
  key?: string; testID?: string;
}
export interface SwipeRowProps {
  children?: ReactNode;
  /** Revealed by swiping right. The first one sits at the outer edge and runs on a full swipe. Keep the arrays stable. */
  leftActions?: SwipeAction[];
  /** Revealed by swiping left. */
  rightActions?: SwipeAction[];
  /** Width of one action. Default 76. */
  actionWidth?: number;
  /** A swipe past 60% of the row runs the first action. Default true. */
  fullSwipe?: boolean;
  disabled?: boolean;
  onOpenChange?: (side: "left" | "right" | null) => void;
  /** Read for the whole row; the actions are offered to screen readers as accessibilityActions. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>; testID?: string;
}
/** A list row that slides sideways to reveal actions. */
export const SwipeRow: ComponentType<SwipeRowProps>;
/** Wrap a list in it and at most one SwipeRow stays open. */
export const SwipeGroup: ComponentType<{ children?: ReactNode }>;

// ---------------------------------------------------------------- PullToRefresh
export interface PullToRefreshHandle {
  /** Starts a refresh from code. Resolves when it has finished. */
  refresh(): Promise<void>;
  /** The ScrollView or FlatList underneath. */
  readonly list: ScrollView | FlatList | null;
}
interface PullToRefreshOwnProps {
  /** May return a promise; the spinner stays until it settles. */
  onRefresh?: () => void | Promise<unknown>;
  /** Control the spinner yourself instead. */
  refreshing?: boolean;
  /** Shortest time the spinner shows, in ms. Default 400. */
  minDuration?: number;
  tone?: Tone;
  /** iOS: text under the spinner. */
  title?: string;
  enabled?: boolean;
  children?: ReactNode;
}
/** With data and renderItem it is a FlatList, otherwise a ScrollView; the remaining props go to that list. */
export type PullToRefreshProps<Item = unknown> = PullToRefreshOwnProps & (Omit<ScrollViewProps, "refreshControl"> | Omit<FlatListProps<Item>, "refreshControl" | "refreshing" | "onRefresh">);
export const PullToRefresh: ForwardRefExoticComponent<PullToRefreshProps<any> & RefAttributes<PullToRefreshHandle>>;

// ---------------------------------------------------------------- SearchBar
export interface SearchBarProps extends Omit<TextInputProps, "value" | "defaultValue" | "onChange" | "onChangeText" | "onSubmitEditing" | "style"> {
  value?: string; defaultValue?: string;
  /** The text changed. With debounce it fires that many ms after typing stops (at once on clear, cancel and submit). */
  onChange?: (text: string) => void;
  onSubmit?: (text: string) => void;
  onCancel?: () => void;
  /** Milliseconds. Default 0. */
  debounce?: number;
  /** Default "Search". */
  placeholder?: string;
  /** Default "Cancel". */
  cancelLabel?: string;
  /** Slide a Cancel button in while the field is focused or filled. Default true. */
  showCancel?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>; testID?: string;
}
/** A rounded search field with a clear button and a Cancel button. ref is the TextInput. */
export const SearchBar: ForwardRefExoticComponent<SearchBarProps & RefAttributes<TextInput>>;

// ---------------------------------------------------------------- Chip and ChipGroup
export interface ChipProps {
  label?: string; children?: ReactNode;
  /** true or false makes it a filter or choice chip; leave undefined for a plain tag or button. */
  selected?: boolean;
  onPress?: () => void;
  /** Adds a remove button beside the label. */
  onRemove?: () => void;
  icon?: MobileIcon;
  /** Show a tick while selected. Default true. */
  check?: boolean;
  size?: "s" | "m";
  /** Colour of the selected state. */
  tone?: Tone;
  disabled?: boolean;
  /** Overrides the accessibility role (checkbox when selectable, button when pressable). */
  role?: "checkbox" | "radio" | "button";
  removeLabel?: string;
  style?: StyleProp<ViewStyle>; testID?: string;
}
export const Chip: ComponentType<ChipProps>;

export interface ChipOption { value: string; label: string; icon?: MobileIcon; disabled?: boolean; testID?: string }
export interface ChipGroupProps {
  /** Keep the array stable. */
  options: ChipOption[];
  /** One value (choice) or, with multiple, an array (filter). */
  value?: string | null | string[]; defaultValue?: string | null | string[];
  onChange?: (value: any) => void;
  multiple?: boolean;
  /** Choice chips: false lets the user clear the selection. Default true. */
  required?: boolean;
  /** Input chips: each gets a remove button. */
  onRemove?: (value: string) => void;
  /** Default true: one line that scrolls sideways. false wraps. */
  scroll?: boolean;
  size?: "s" | "m"; tone?: Tone; gap?: Gap;
  style?: StyleProp<ViewStyle>; contentStyle?: StyleProp<ViewStyle>; testID?: string;
}
export const ChipGroup: ComponentType<ChipGroupProps>;

// ---------------------------------------------------------------- PageDots
export interface PageDotsProps {
  count: number;
  /** The current page. */
  index?: number;
  /** An Animated node in page units, for example Animated.divide(scrollX, pageWidth): the dot then tracks the swipe exactly. */
  position?: Animated.Value | Animated.AnimatedNode;
  /** Makes the two halves buttons for the previous and next page. */
  onChange?: (index: number) => void;
  /** Dot diameter. Default 8. */
  size?: number;
  /** Space between dots. Default: size. */
  gap?: number;
  tone?: Tone;
  style?: StyleProp<ViewStyle>; testID?: string;
}
export const PageDots: ComponentType<PageDotsProps>;

// ---------------------------------------------------------------- Banner
export interface BannerAction { label: string; onPress?: () => void; key?: string; testID?: string }
export interface BannerProps {
  /** Animates in and out; unmounted after the exit. Default true. */
  visible?: boolean;
  tone?: Tone;
  /** Default: a mark for the tone. null shows none. */
  icon?: MobileIcon | null;
  title?: string; children?: ReactNode;
  actions?: BannerAction[] | ReactElement;
  /** Adds a dismiss button. */
  onClose?: () => void;
  /** Lay it over the content instead of taking room in the layout. */
  floating?: boolean;
  topInset?: number;
  style?: StyleProp<ViewStyle>; testID?: string;
}
/** A notice across the top of a screen. */
export const Banner: ComponentType<BannerProps>;

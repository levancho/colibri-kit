import type { ComponentType, ReactNode, Ref, RefObject } from "react";
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, PressableProps, ScrollView, ScrollViewProps, StyleProp, ViewProps, ViewStyle } from "react-native";

type NavigationTone = "accent" | "ok" | "warn" | "bad" | "success" | "warning" | "danger" | "destructive";
/** A text glyph (see GLYPH) or any element. */
type NavigationIcon = ReactNode;

// ---------------------------------------------------------------- menu
export interface MenuActionEntry<T = string> {
  type?: undefined; value?: T; label: string; description?: string; icon?: NavigationIcon; shortcut?: string;
  badge?: string | number; badgeTone?: NavigationTone;
  /** A boolean makes it a checkable item. */
  checked?: boolean; disabled?: boolean;
  /** tone="bad" marks a destructive action. */
  tone?: NavigationTone;
  /** A submenu that expands in place. */
  items?: MenuEntry<T>[];
  onPress?: (item: MenuActionEntry<T>) => void; accessibilityLabel?: string; testID?: string; key?: string;
}
export interface MenuGroup<T = string> { type: "group"; label?: string; items: MenuEntry<T>[] }
export interface MenuSeparator { type: "separator" }
export type MenuEntry<T = string> = MenuActionEntry<T> | MenuGroup<T> | MenuSeparator;
export interface MenuProps<T = string> extends ViewProps {
  items: MenuEntry<T>[];
  /** The selected item's value. */
  value?: T; onSelect?: (value: T | undefined, item: MenuActionEntry<T>) => void;
  /** Keys (value or label) of submenus that start open. */
  defaultExpanded?: string[]; label?: string;
}
export function Menu<T = string>(props: MenuProps<T>): ReactNode;

// ---------------------------------------------------------------- pagination
export interface PaginationProps extends Omit<ViewProps, "children"> {
  /** 1-based current page. */
  page?: number; defaultPage?: number;
  /** Number of pages. */
  total: number; onChange?: (page: number) => void;
  /** Page buttons on each side of the current one. Default 1; reduced automatically when the row is narrow. */
  siblings?: number;
  /** Previous, "Page 3 of 20", next. */
  compact?: boolean; disabled?: boolean; label?: string;
}
export const Pagination: ComponentType<PaginationProps>;

// ---------------------------------------------------------------- scrollspy and scrollto
export interface ScrollSpyOptions {
  /** Height covered at the top (a pinned header). When omitted, ScrollSpy measures the children named by its stickyHeaderIndices prop. */
  offset?: number; defaultActive?: string | null; onChange?: (id: string | null) => void; animated?: boolean;
}
export interface ScrollSpyHandle {
  /** The id of the section in view. */
  active: string | null;
  /** Scrolls to a section ("top" scrolls to the start). Returns false when the id is unknown. */
  scrollTo(id: string, options?: { offset?: number; animated?: boolean }): boolean;
  refresh(): void;
  ref: RefObject<ScrollView | null>;
  /** Spread on your own ScrollView. */
  scrollViewProps: { ref: RefObject<ScrollView | null>; scrollEventThrottle: number; onScroll(event: NativeSyntheticEvent<NativeScrollEvent>): void; onLayout(event: LayoutChangeEvent): void; onContentSizeChange(width: number, height: number): void };
  /** Spread on each section (a direct child of the scroll content). */
  sectionProps(id: string): { onLayout(event: LayoutChangeEvent): void };
  register(id: string, y: number, node?: unknown): void; unregister(id: string): void; setHeaderHeight(height: number): void;
}
export function useScrollSpy(options?: ScrollSpyOptions): ScrollSpyHandle;
export interface ScrollSpyProps extends ScrollViewProps, Omit<ScrollSpyOptions, "animated"> { spy?: ScrollSpyHandle; ref?: Ref<ScrollView> }
export const ScrollSpy: ComponentType<ScrollSpyProps>;
export interface ScrollSpySectionProps extends ViewProps { id: string; spy?: ScrollSpyHandle }
export const ScrollSpySection: ComponentType<ScrollSpySectionProps>;
export interface ScrollToProps extends Omit<PressableProps, "children" | "style"> {
  /** A section id, or "top". */
  to?: string;
  /** Needed only outside a ScrollSpy. */
  spy?: ScrollSpyHandle; offset?: number; variant?: "link" | "chip" | "button"; title?: string; children?: ReactNode;
  onScroll?: (id: string) => void; style?: StyleProp<ViewStyle>;
}
export const ScrollTo: ComponentType<ScrollToProps>;

// ---------------------------------------------------------------- sidebar
export interface SidebarProps<T = string> {
  /** Drawer form only. */
  open?: boolean; onOpenChange?: (open: boolean) => void;
  /** auto: a drawer below breakpoint (768), in place from there up. */
  mode?: "auto" | "drawer" | "inline"; breakpoint?: number; side?: "left" | "right"; width?: number;
  /** In place only: shrink to a rail of icons. */
  collapsed?: boolean;
  items?: MenuEntry<T>[]; value?: T; onSelect?: (value: T | undefined, item: MenuActionEntry<T>) => void;
  /** Close the drawer after a choice. Default true. */
  closeOnSelect?: boolean; defaultExpanded?: string[];
  header?: ReactNode; footer?: ReactNode; label?: string; children?: ReactNode; style?: StyleProp<ViewStyle>;
}
export function Sidebar<T = string>(props: SidebarProps<T>): ReactNode;

// ---------------------------------------------------------------- stepper
export interface StepperControls { index: number; next(): void; back(): void; goTo(index: number): void }
export interface StepperStep { label: string; description?: string; optional?: boolean; content?: ReactNode | ((controls: StepperControls) => ReactNode); testID?: string }
export interface StepperProps extends Omit<ViewProps, "children"> {
  steps: StepperStep[];
  /** Current step index; steps.length means every step is complete. */
  value?: number; defaultValue?: number; onChange?: (to: number, from: number) => void;
  /** Return false to stay on the current step. */
  onBeforeChange?: (from: number, to: number) => boolean | void;
  onFinish?: (lastStep: number) => void;
  orientation?: "horizontal" | "vertical";
  /** Steps can be pressed; with linear only completed ones. */
  clickable?: boolean; linear?: boolean;
  /** Show Back / Next / Finish. Default true. */
  actions?: boolean; backLabel?: string; nextLabel?: string; finishLabel?: string; label?: string;
}
export const Stepper: ComponentType<StepperProps>;

// ---------------------------------------------------------------- tabs
export interface TabItem<T = string> { value: T; label: string; icon?: NavigationIcon; badge?: string | number; disabled?: boolean; testID?: string }
export interface TabViewTab<T = string> extends TabItem<T> { content?: ReactNode | ((state: { selected: boolean }) => ReactNode) }
export interface TabViewProps<T = string> extends Omit<ViewProps, "children"> {
  tabs: TabViewTab<T>[]; value?: T; defaultValue?: T; onChange?: (value: T, previous: T) => void;
  /** Defaults to true when there are more than four tabs. */
  scrollable?: boolean;
  /** Keep hidden panels mounted. */
  keepMounted?: boolean; label?: string; barStyle?: StyleProp<ViewStyle>; panelStyle?: StyleProp<ViewStyle>;
}
export function TabView<T = string>(props: TabViewProps<T>): ReactNode;
export interface TabNavItem<T = string> extends TabItem<T> { onPress?: (item: TabNavItem<T>) => void }
export interface TabNavProps<T = string> {
  items: TabNavItem<T>[];
  /** The current route. */
  value?: T; defaultValue?: T; onChange?: (value: T, item: TabNavItem<T>) => void;
  scrollable?: boolean; label?: string; style?: StyleProp<ViewStyle>;
}
export function TabNav<T = string>(props: TabNavProps<T>): ReactNode;

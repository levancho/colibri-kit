import type { ComponentType, ReactElement, ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

export type OverlaySide = "top" | "bottom" | "left" | "right";
export type OverlayAlign = "start" | "center" | "end";
/** Shared by the overlays that open from a trigger: controlled with open + onOpenChange, or left to manage themselves. */
export interface OpenProps { open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void }
export interface OverlayRenderProps { close: () => void }

export interface AlertDialogProps {
  visible: boolean; title?: string; description?: ReactNode; children?: ReactNode;
  /** Default "Confirm". */
  confirmLabel?: string;
  /** Default "Cancel"; pass null for a single acknowledge button. */
  cancelLabel?: string | null;
  /** "danger" (or "destructive") makes the confirm button red. */
  variant?: "solid" | "danger" | "destructive";
  /** Shows a spinner in the confirm button and blocks both buttons. */
  loading?: boolean;
  onConfirm?: () => void; onCancel?: () => void;
}
/** A confirmation that must be answered: the backdrop and the back button do not close it. */
export const AlertDialog: ComponentType<AlertDialogProps>;

export interface DrawerProps {
  visible: boolean; onClose?: () => void;
  /** The edge it slides in from. Default "right". */
  side?: OverlaySide;
  title?: ReactNode; children?: ReactNode;
  /** Buttons pinned under the scrolling body. */
  footer?: ReactNode;
  /** Width for left and right, height for top and bottom. */
  size?: number | `${number}%`;
  /** false: only your own buttons close it (no backdrop, back button, close button or drag). */
  dismissible?: boolean;
  /** Drag towards the edge to dismiss. Default true. */
  drag?: boolean;
  closeLabel?: string;
  /** Safe-area insets to keep clear. */
  inset?: { top?: number; bottom?: number; left?: number; right?: number };
  style?: StyleProp<ViewStyle>;
}
/** A panel that slides in from an edge of the screen, over a backdrop. */
export const Drawer: ComponentType<DrawerProps>;

export interface PopoverProps extends OpenProps {
  /** One pressable element; the popover adds onPress and the expanded state to it. */
  trigger: ReactElement;
  children?: ReactNode | ((props: OverlayRenderProps) => ReactNode);
  /** Preferred side; flips when there is no room. Default "bottom". */
  side?: OverlaySide;
  /** Default "start". */
  align?: OverlayAlign;
  /** Distance from the trigger. */
  offset?: number;
  /** Accessible name of the panel. */
  label?: string;
  /** Style of the box around the trigger. */
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}
/** Any content in a floating panel beside its trigger. */
export const Popover: ComponentType<PopoverProps>;

export interface MenuActionItem {
  type?: "item"; key?: string; label: ReactNode; value?: unknown; icon?: ReactNode; shortcut?: string;
  disabled?: boolean; destructive?: boolean; variant?: "destructive" | "danger";
  /** Default true. */
  closeOnSelect?: boolean;
  onSelect?: () => void;
}
export interface MenuCheckboxItem {
  type: "checkbox"; key?: string; label: ReactNode; value?: unknown; icon?: ReactNode; checked?: boolean; disabled?: boolean;
  /** Default false: the menu stays open so the change is seen. */
  closeOnSelect?: boolean;
  onChange?: (checked: boolean) => void;
}
export interface MenuRadioItem<Value = any> {
  type: "radio"; key?: string;
  /** Accessible name of the group. */
  label?: string;
  value?: Value; options: Array<{ value: Value; label: ReactNode; disabled?: boolean }>; disabled?: boolean;
  /** Default false. */
  closeOnSelect?: boolean;
  onChange?: (value: Value) => void;
}
export interface MenuLabelItem { type: "label"; key?: string; label: ReactNode }
export interface MenuSeparatorItem { type: "separator"; key?: string }
/** A sub-menu: pressing it replaces the list with its items and a back row. */
export interface MenuSubItem { type?: "sub"; key?: string; label: string; icon?: ReactNode; disabled?: boolean; items: MenuItem[] }
export type MenuItem = MenuActionItem | MenuCheckboxItem | MenuRadioItem | MenuLabelItem | MenuSeparatorItem | MenuSubItem | null | false | undefined;
/** "auto": floating beside the trigger, or a bottom sheet on very small windows. */
export type MenuPresentation = "auto" | "popover" | "sheet";

export interface DropdownMenuProps extends OpenProps {
  trigger: ReactElement;
  items: MenuItem[];
  /** Called for every choice, after the item's own handler. */
  onSelect?: (value: unknown, item: MenuItem) => void;
  presentation?: MenuPresentation;
  side?: OverlaySide; align?: OverlayAlign;
  /** Accessible name of the menu, and the title of the sheet. */
  label?: string;
  style?: StyleProp<ViewStyle>;
}
/** A button that opens a list of actions, with labels, separators, tick and radio items and sub-menus. */
export const DropdownMenu: ComponentType<DropdownMenuProps>;

export interface ContextMenuProps {
  /** The area that opens the menu on long press (right-click on the web). */
  children?: ReactNode;
  items: MenuItem[];
  onSelect?: (value: unknown, item: MenuItem) => void;
  open?: boolean; onOpenChange?: (open: boolean) => void;
  presentation?: MenuPresentation;
  label?: string; disabled?: boolean; delayLongPress?: number;
  style?: StyleProp<ViewStyle>;
}
/** The same menu as DropdownMenu, opened where the finger is by a long press on its children. */
export const ContextMenu: ComponentType<ContextMenuProps>;

export interface HoverCardProps extends OpenProps {
  /** One pressable element. A press opens the card (there is no hover on a touch screen). */
  trigger: ReactElement;
  children?: ReactNode | ((props: OverlayRenderProps) => ReactNode);
  side?: OverlaySide; align?: OverlayAlign; offset?: number;
  /** Milliseconds of mouse hover before it opens. Default 300. */
  openDelay?: number;
  /** Milliseconds after the pointer leaves before it closes. Default 150. */
  closeDelay?: number;
  label?: string;
  style?: StyleProp<ViewStyle>; contentStyle?: StyleProp<ViewStyle>;
}
/** A preview card for a link or a name: opens on press, and on hover with a mouse. */
export const HoverCard: ComponentType<HoverCardProps>;

export interface TooltipProps {
  /** The hint. */
  label: ReactNode;
  /** One pressable element; a long press on it shows the hint. */
  children: ReactElement;
  /** Default "top". */
  side?: OverlaySide;
  /** Default "center". */
  align?: OverlayAlign;
  offset?: number;
  /** Milliseconds of mouse hover before it shows. Default 500. */
  delay?: number;
  /** Milliseconds it stays after a long press; 0 keeps it until the next touch. Default 2000. */
  duration?: number;
  open?: boolean; onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}
/** A short hint shown on long press (and on hover with a mouse) that hides by itself. */
export const Tooltip: ComponentType<TooltipProps>;

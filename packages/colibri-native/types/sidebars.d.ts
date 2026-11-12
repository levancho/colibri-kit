import type { ComponentType, ReactElement, ReactNode } from "react";
import type { ImageSourcePropType, StyleProp, TextInputProps, ViewStyle } from "react-native";

type NavTone = "accent" | "ok" | "warn" | "bad" | "success" | "warning" | "danger" | "destructive";
/** A text glyph ("◆"), initials ("LD") or any element. */
export type NavIcon = string | number | ReactElement;

/** One entry of navigation data, as NavList and the Sidebar blocks take it. */
export interface NavItemData {
  id: string; label: string; icon?: NavIcon; badge?: string | number | ReactElement; trailing?: ReactNode; disabled?: boolean;
  /** Nested entries make a submenu. */
  children?: NavItemData[];
  /** Whether a collapsible submenu starts open. Defaults to open when it holds the selected item. */
  defaultOpen?: boolean;
  /** Overrides the list's submenu kind for this item. */
  submenu?: "collapsible" | "static" | "dropdown";
  /** A parent is not selectable unless this is set; pressing it only opens its submenu. */
  selectable?: boolean;
  /** In a tree: draw a folder icon although there are no children yet. */
  folder?: boolean;
  testID?: string;
}
export interface NavSectionData { id?: string; title?: string; items: NavItemData[]; collapsible?: boolean; defaultOpen?: boolean }

export interface NavState { collapsed: boolean; level: number; tree: boolean; close: (() => void) | null; expand: (() => void) | null }
/** Inside a NavShell panel: whether it is an icon rail, the nesting level, and close() / expand() where they apply. */
export function useNav(): NavState;

export interface NavPopoverProps {
  trigger: (state: { onPress: () => void; expanded: boolean }) => ReactNode;
  children?: ReactNode | ((close: () => void) => ReactNode);
  placement?: "bottom" | "top" | "right" | "left"; align?: "start" | "center" | "end";
  width?: number; matchWidth?: boolean; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
  label?: string; style?: StyleProp<ViewStyle>;
}
/** A small floating card anchored to its trigger: the touch stand-in for dropdown menus and popovers inside sidebars. */
export const NavPopover: ComponentType<NavPopoverProps>;

export interface NavMenuItemProps {
  label: string; icon?: NavIcon; description?: string; trailing?: ReactNode; selected?: boolean; tone?: NavTone; disabled?: boolean;
  /** Leave the menu open after the press. */
  keepOpen?: boolean; onPress?: () => void; style?: StyleProp<ViewStyle>;
}
export const NavMenuItem: ComponentType<NavMenuItemProps>;

export interface NavItemProps {
  label: ReactNode; icon?: NavIcon; badge?: string | number | ReactElement | false | null; trailing?: ReactNode;
  selected?: boolean;
  /** A descendant is selected: the row is emphasised, and highlighted in an icon rail. */
  active?: boolean; disabled?: boolean; onPress?: () => void;
  /** Nested NavItems. */
  children?: ReactNode; submenu?: "collapsible" | "static" | "dropdown";
  expanded?: boolean; defaultExpanded?: boolean; onExpandedChange?: (expanded: boolean) => void;
  role?: "button" | "link"; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; testID?: string;
}
export const NavItem: ComponentType<NavItemProps>;

export interface NavCheckItemProps { label: string; checked?: boolean; onChange?: (checked: boolean) => void; tone?: NavTone; disabled?: boolean; style?: StyleProp<ViewStyle> }
export const NavCheckItem: ComponentType<NavCheckItemProps>;

export interface NavSectionProps {
  title?: string; collapsible?: boolean; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
  /** Shown beside the title, for example an add button. */
  action?: ReactNode; children?: ReactNode; style?: StyleProp<ViewStyle>;
}
export const NavSection: ComponentType<NavSectionProps>;

export interface NavListProps {
  items?: NavItemData[]; sections?: NavSectionData[]; selected?: string; onSelect?: (id: string, item: NavItemData) => void;
  submenu?: "collapsible" | "static" | "dropdown"; collapsibleSections?: boolean;
  /** Force every section and submenu open (search results). */
  expandAll?: boolean;
  /** "tree" draws folders and files with the chevron in front. */
  variant?: "list" | "tree"; style?: StyleProp<ViewStyle>;
}
export const NavList: ComponentType<NavListProps>;

export interface NavSearchProps extends Omit<TextInputProps, "style" | "value" | "defaultValue" | "onChangeText"> {
  value?: string; defaultValue?: string; onChangeText?: (text: string) => void; onSubmit?: (text: string) => void;
  placeholder?: string; label?: string; style?: StyleProp<ViewStyle>;
}
export const NavSearch: ComponentType<NavSearchProps>;

export interface NavSwitcherItem { id: string; name: string; description?: string; icon?: NavIcon }
export interface NavSwitcherProps {
  items?: NavSwitcherItem[]; value?: string; defaultValue?: string; onChange?: (id: string) => void;
  /** A fixed heading; the chosen item's name becomes the second line (Documentation / v1.0.1). */
  title?: string; icon?: NavIcon;
  /** The heading of the menu ("Teams", "Workspaces", "Versions"). */
  label?: string; onAdd?: () => void; addLabel?: string;
  /** Keeps the menu open after a choice and adds a button with this label to close it. */
  doneLabel?: string; placement?: NavPopoverProps["placement"]; style?: StyleProp<ViewStyle>;
}
export const NavSwitcher: ComponentType<NavSwitcherProps>;

export interface NavAction { id: string; label: string; icon?: NavIcon; tone?: NavTone; separated?: boolean; onPress?: () => void }
export interface NavUserProps {
  name: string; email?: string; source?: ImageSourcePropType;
  /** Shown in a menu that opens from the row. */
  actions?: NavAction[]; onAction?: (id: string, action: NavAction) => void;
  /** Called for a press when there are no actions. */
  onPress?: () => void; placement?: NavPopoverProps["placement"]; style?: StyleProp<ViewStyle>;
}
export const NavUser: ComponentType<NavUserProps>;

export interface NavCalendarProps {
  value?: Date; defaultValue?: Date; onChange?: (date: Date) => void;
  month?: Date; defaultMonth?: Date; onMonthChange?: (month: Date) => void;
  today?: Date; marked?: Date[]; weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Twelve names, January first, and seven short names, Sunday first. */
  monthNames?: string[]; weekdayNames?: string[]; style?: StyleProp<ViewStyle>;
}
export const NavCalendar: ComponentType<NavCalendarProps>;

/** The props every block passes on to its NavShell. */
export interface NavShellControlProps {
  /** Whether the navigation is open: the sliding panel on a phone, the docked sidebar on wide screens. */
  open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
  /** "auto" docks the sidebar from `breakpoint` of window width; "drawer" and "docked" force one. */
  layout?: "auto" | "drawer" | "docked"; breakpoint?: number; width?: number;
  /** Keep the sliding panel inside the shell's own box instead of a Modal (dialogs, previews). */
  contained?: boolean;
  /** Wrap the content in a padded ScrollView (default true). */
  scroll?: boolean;
  /** Safe-area padding for the sliding panel, from your safe-area library. */
  insets?: { top?: number; bottom?: number };
  menuLabel?: string; navigationLabel?: string;
  /** Shown at the end of the top bar. */
  actions?: ReactNode;
  children?: ReactNode; style?: StyleProp<ViewStyle>; contentStyle?: StyleProp<ViewStyle>; testID?: string;
}
export interface NavShellProps extends NavShellControlProps {
  title?: string; breadcrumb?: Array<string | undefined | null>;
  /** Replaces the title or breadcrumb in the top bar. */
  header?: ReactNode;
  /** A second row under the top bar. */
  subheader?: ReactNode;
  /** The panel: its scrolling content, and what stays pinned above and below it. */
  sidebar?: ReactNode; sidebarHeader?: ReactNode; sidebarFooter?: ReactNode;
  /** A custom icon strip that is always visible beside the content. */
  rail?: ReactNode;
  /** A second panel on the other side, with its own button in the top bar. */
  aside?: ReactNode; asideLabel?: string; asideWidth?: number; asideOpen?: boolean; defaultAsideOpen?: boolean; onAsideOpenChange?: (open: boolean) => void;
  side?: "left" | "right"; variant?: "sidebar" | "floating" | "inset";
  /** What the menu button does on wide screens: hide the sidebar, fold it to an icon rail (also kept on phones), or nothing. */
  collapsible?: "offcanvas" | "icon" | "none";
  /** "site" puts the top bar above sidebar and content. */
  headerPosition?: "content" | "site";
}
export const NavShell: ComponentType<NavShellProps>;

export interface SidebarPromo { title: string; description?: string; actionLabel?: string; onAction?: () => void }
export interface SidebarBlockProps extends NavShellControlProps {
  sections?: NavSectionData[]; items?: NavItemData[];
  selected?: string; defaultSelected?: string; onSelect?: (id: string, item: NavItemData) => void;
  /** The switcher at the top of the sidebar (versions, teams, workspaces). */
  switcher?: NavSwitcherProps;
  /** The account row in the footer. */
  user?: NavUserProps;
  /** Links pinned at the bottom of the sidebar. */
  secondary?: NavItemData[];
  /** A card in the footer. */
  promo?: SidebarPromo;
  /** Show the search field. Each block has its own default. */
  search?: boolean; searchPlaceholder?: string; onSearch?: (text: string) => void; emptyText?: string;
  /** Defaults to the path of the selected item. */
  breadcrumb?: string[]; title?: string;
  /** Actions behind the ⋯ button of the top bar. */
  pageActions?: NavAction[]; onPageAction?: (id: string, action: NavAction) => void;
}
/** Simple, grouped: version switcher, search, sections with labels. */
export const Sidebar01: ComponentType<SidebarBlockProps>;
/** Collapsible sections. */
export const Sidebar02: ComponentType<SidebarBlockProps>;
/** Submenus that are always visible. */
export const Sidebar03: ComponentType<SidebarBlockProps>;
/** Floating panel with submenus. */
export const Sidebar04: ComponentType<SidebarBlockProps>;
/** Collapsible submenus. */
export const Sidebar05: ComponentType<SidebarBlockProps>;
/** Submenus as dropdowns, with a promo card. */
export const Sidebar06: ComponentType<SidebarBlockProps>;
/** Collapses to an icon rail. */
export const Sidebar07: ComponentType<SidebarBlockProps>;
/** Inset content with secondary navigation. */
export const Sidebar08: ComponentType<SidebarBlockProps>;
/** Workspace switcher and page actions in popovers. */
export const Sidebar10: ComponentType<SidebarBlockProps>;
/** Sidebar on the right. */
export const Sidebar14: ComponentType<SidebarBlockProps>;
/** Sticky site header with search. */
export const Sidebar16: ComponentType<SidebarBlockProps>;

export interface SidebarFolder { id: string; label: string; icon?: NavIcon; badge?: string | number }
export interface SidebarMessage { id: string; folder?: string; from: string; time: string; subject: string; preview?: string; unread?: boolean }
export interface Sidebar09Props extends NavShellControlProps {
  folders?: SidebarFolder[]; folder?: string; defaultFolder?: string; onFolderChange?: (id: string) => void;
  messages?: SidebarMessage[]; selected?: string; defaultSelected?: string; onSelect?: (id: string, message: SidebarMessage) => void;
  unreadOnly?: boolean; defaultUnreadOnly?: boolean; onUnreadOnlyChange?: (on: boolean) => void; unreadLabel?: string;
  searchPlaceholder?: string; emptyText?: string;
  /** The mark at the top of the rail. */
  brand?: NavIcon; breadcrumb?: string[]; title?: string;
}
/** Nested sidebars: a rail of folders and a message list. */
export const Sidebar09: ComponentType<Sidebar09Props>;

export interface SidebarChange extends NavItemData { status?: "M" | "U" | "A" | "D" | "R" }
export interface Sidebar11Props extends NavShellControlProps {
  changes?: SidebarChange[]; tree?: NavItemData[]; selected?: string; defaultSelected?: string; onSelect?: (id: string, item: NavItemData) => void;
  changesTitle?: string; treeTitle?: string; breadcrumb?: string[]; title?: string;
}
/** A changes list and a collapsible file tree. */
export const Sidebar11: ComponentType<Sidebar11Props>;

export interface SidebarCalendarGroup { id?: string; title: string; defaultOpen?: boolean; items: Array<{ id: string; label: string; tone?: NavTone }> }
export interface Sidebar12Props extends NavShellControlProps {
  user?: NavUserProps; date?: Date; defaultDate?: Date; onDateChange?: (date: Date) => void; today?: Date; marked?: Date[];
  calendars?: SidebarCalendarGroup[]; checked?: string[]; defaultChecked?: string[]; onCheckedChange?: (ids: string[]) => void;
  breadcrumb?: string[]; title?: string;
}
/** Account menu, month calendar and lists of calendars. */
export const Sidebar12: ComponentType<Sidebar12Props>;

export interface Sidebar13Props extends Omit<NavShellControlProps, "contained" | "actions"> {
  visible?: boolean; onClose?: () => void; title?: string; items?: NavItemData[]; sections?: NavSectionData[];
  selected?: string; defaultSelected?: string; onSelect?: (id: string, item: NavItemData) => void; closeLabel?: string; height?: number;
}
/** A settings dialog with its own navigation. */
export const Sidebar13: ComponentType<Sidebar13Props>;

export interface Sidebar15Props extends SidebarBlockProps {
  date?: Date; defaultDate?: Date; onDateChange?: (date: Date) => void; today?: Date; marked?: Date[];
  /** Shown under the calendar in the right sidebar. */
  aside?: ReactNode; asideLabel?: string;
}
/** Navigation on the left, calendar and details on the right. */
export const Sidebar15: ComponentType<Sidebar15Props>;

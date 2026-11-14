import type { ComponentType, ReactElement, ReactNode } from "react";
import type { ImageSourcePropType, StyleProp, TextInputProps, ViewStyle } from "react-native";

type NavTone = "accent" | "ok" | "warn" | "bad" | "success" | "warning" | "danger" | "destructive";
/** A text glyph ("◆"), initials ("LD") or any element. */
export type NavIcon = string | number | ReactElement;

/** One entry of navigation data, as NavList and the drawer layouts take it. */
export interface NavItemData {
  id: string; label: string; icon?: NavIcon; badge?: string | number | ReactElement; trailing?: ReactNode; disabled?: boolean;
  /** Nested entries make a group that folds open. */
  children?: NavItemData[];
  /** Whether the group starts open. Defaults to open when it holds the selected item. */
  defaultOpen?: boolean;
  /** A parent is not selectable unless this is set; pressing it only opens its group. */
  selectable?: boolean;
  /** In a tree: draw a folder icon although there are no children yet. */
  folder?: boolean;
  testID?: string;
}
export interface NavSectionData { id?: string; title?: string; items: NavItemData[]; collapsible?: boolean; defaultOpen?: boolean }

export interface NavState { level: number; tree: boolean; close: (() => void) | null }
/** Inside a NavShell drawer: the nesting level, and close(), which is null where the panel is docked and stays open. */
export function useNav(): NavState;

export interface NavBarButtonProps { label: string; icon: NavIcon; onPress?: () => void; expanded?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>; testID?: string }
/** A round 44pt button for the app bar. label is what a screen reader says. */
export const NavBarButton: ComponentType<NavBarButtonProps>;

export interface NavPopoverProps {
  trigger: (state: { onPress: () => void; expanded: boolean }) => ReactNode;
  children?: ReactNode | ((close: () => void) => ReactNode);
  placement?: "bottom" | "top"; align?: "start" | "center" | "end";
  width?: number; matchWidth?: boolean; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
  label?: string; style?: StyleProp<ViewStyle>;
}
/** A small menu card anchored to its trigger, for the choices behind a switcher or an account row. */
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
  /** A descendant is selected: the row is emphasised. */
  active?: boolean; disabled?: boolean; onPress?: () => void;
  /** Nested NavItems: a group that folds open and closed. */
  children?: ReactNode;
  expanded?: boolean; defaultExpanded?: boolean; onExpandedChange?: (expanded: boolean) => void;
  role?: "button" | "link"; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; testID?: string;
}
/** One navigation row, 44pt high. Choosing it closes the drawer. */
export const NavItem: ComponentType<NavItemProps>;

export interface NavCheckItemProps { label: string; checked?: boolean; onChange?: (checked: boolean) => void; tone?: NavTone; disabled?: boolean; style?: StyleProp<ViewStyle> }
/** A row with a tick box (calendars, filters). It does not close the drawer. */
export const NavCheckItem: ComponentType<NavCheckItemProps>;

export interface NavSectionProps {
  title?: string; collapsible?: boolean; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
  /** Shown beside the title, for example an add button. */
  action?: ReactNode; children?: ReactNode; style?: StyleProp<ViewStyle>;
}
export const NavSection: ComponentType<NavSectionProps>;

export interface NavListProps {
  items?: NavItemData[]; sections?: NavSectionData[]; selected?: string; onSelect?: (id: string, item: NavItemData) => void;
  collapsibleSections?: boolean;
  /** Force every section and group open (search results). */
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
  label?: string; onAdd?: () => void; addLabel?: string; style?: StyleProp<ViewStyle>;
}
/** Workspace, team or version switcher for the top of a drawer. */
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

export interface NavStackScreenProps {
  visible?: boolean;
  /** The back button of its app bar, and the Android back button. */
  onBack?: () => void;
  title?: string; subtitle?: string; actions?: ReactNode; backLabel?: string;
  /** Wrap the body in a padded ScrollView (default true). */
  scroll?: boolean; insets?: { top?: number; bottom?: number };
  /** Pinned under the body. */
  footer?: ReactNode; children?: ReactNode; contentStyle?: StyleProp<ViewStyle>; testID?: string;
}
/** A screen pushed over the one below it: slides in from the right with its own app bar and back button. */
export const NavStackScreen: ComponentType<NavStackScreenProps>;

/** The props every layout passes on to its NavShell. */
export interface NavShellControlProps {
  /** Whether the navigation is open: the drawer on a phone, the docked panel on wide screens. */
  open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
  /** "auto" docks the panel from `breakpoint` (768) of window width; "drawer" and "docked" force one. */
  layout?: "auto" | "drawer" | "docked"; breakpoint?: number;
  /** The most the drawer may be wide (320). On a phone it is 84% of the screen. */
  width?: number;
  /** Wrap the content in a padded ScrollView (default true). */
  scroll?: boolean;
  /** Safe-area padding for the app bar and the drawer, from your safe-area library. */
  insets?: { top?: number; bottom?: number };
  menuLabel?: string; navigationLabel?: string;
  /** The second line of the app bar. */
  subtitle?: string;
  /** Shown at the end of the app bar (NavBarButton). */
  actions?: ReactNode;
  children?: ReactNode; style?: StyleProp<ViewStyle>; contentStyle?: StyleProp<ViewStyle>; testID?: string;
}
export interface NavShellProps extends NavShellControlProps {
  /** The app bar's title: the name of the current section. */
  title?: string;
  /** Replaces the title and subtitle in the app bar. */
  header?: ReactNode;
  /** Replaces the menu button. */
  leading?: ReactNode;
  /** The drawer: its scrolling content, and what stays pinned above and below it. */
  sidebar?: ReactNode; sidebarHeader?: ReactNode; sidebarFooter?: ReactNode;
  /** Drawn over the app bar and the content: a NavStackScreen. */
  overlay?: ReactNode;
}
/** The app frame of a phone app with a navigation drawer: app bar, drawer, content. */
export const NavShell: ComponentType<NavShellProps>;

export interface DrawerLayoutProps extends NavShellControlProps {
  sections?: NavSectionData[]; items?: NavItemData[];
  selected?: string; defaultSelected?: string; onSelect?: (id: string, item: NavItemData) => void;
  /** The row at the top of the drawer (versions, teams, workspaces, stores). */
  switcher?: NavSwitcherProps;
  /** The account row pinned at the bottom of the drawer. */
  user?: NavUserProps;
  /** Links pinned at the bottom of the drawer, above the account. */
  secondary?: NavItemData[];
  /** A search field that filters the links. On by default in SectionedDrawer. */
  search?: boolean; searchPlaceholder?: string; onSearch?: (text: string) => void; emptyText?: string;
  /** Section labels fold their group. On by default in SectionedDrawer. */
  collapsibleSections?: boolean;
  /** The app bar's title. Defaults to the label of the selected item. */
  title?: string;
}
/** Links grouped under section labels that fold, with a search that filters them. */
export const SectionedDrawer: ComponentType<DrawerLayoutProps>;
/** Items that open to show the items inside them: categories and subcategories. */
export const NestedDrawer: ComponentType<DrawerLayoutProps>;
/** A team app's drawer: workspace switcher, navigation with icons and badges, help links and the account. */
export const WorkspaceDrawer: ComponentType<DrawerLayoutProps>;

export interface MailFolder { id: string; label: string; icon?: NavIcon; badge?: string | number }
export interface MailMessage { id: string; folder?: string; from: string; time: string; subject: string; preview?: string; body?: string; unread?: boolean }
export interface MailLayoutProps extends Omit<NavShellControlProps, "scroll" | "children" | "contentStyle"> {
  folders?: MailFolder[]; folder?: string; defaultFolder?: string; onFolderChange?: (id: string) => void;
  messages?: MailMessage[];
  /** The id of the open message; null shows the list. onSelect gets null on the way back. */
  selected?: string | null; defaultSelected?: string | null; onSelect?: (id: string | null, message: MailMessage | null) => void;
  unreadOnly?: boolean; defaultUnreadOnly?: boolean; onUnreadOnlyChange?: (on: boolean) => void; allLabel?: string; unreadLabel?: string;
  search?: boolean; searchPlaceholder?: string; emptyText?: string; backLabel?: string;
  /** The top and bottom of the folder drawer. */
  switcher?: NavSwitcherProps; user?: NavUserProps;
  /** Replaces the body of the open message. */
  renderMessage?: (message: MailMessage) => ReactNode;
  /** Pinned under the open message (reply buttons), and at the end of its app bar. */
  messageFooter?: (message: MailMessage) => ReactNode; messageActions?: (message: MailMessage) => ReactNode;
  title?: string;
}
/** Mail as three stacked levels: folders in the drawer, the message list, and the open message pushed over it. */
export const MailLayout: ComponentType<MailLayoutProps>;

export interface CalendarGroup { id?: string; title: string; defaultOpen?: boolean; items: Array<{ id: string; label: string; tone?: NavTone }> }
export interface CalendarDrawerProps extends NavShellControlProps {
  user?: NavUserProps; date?: Date; defaultDate?: Date; onDateChange?: (date: Date) => void;
  /** Ringed in the month; the app bar gets a button (todayLabel) that jumps back to it. */
  today?: Date; todayLabel?: string; marked?: Date[];
  calendars?: CalendarGroup[]; checked?: string[]; defaultChecked?: string[]; onCheckedChange?: (ids: string[]) => void;
  /** Twelve names, January first, and seven names, Sunday first, for the month grid and the app bar. */
  monthNames?: string[]; dayNames?: string[];
  /** Defaults to the chosen day. */
  title?: string;
}
/** A month to pick the day from and lists of calendars to switch on and off; the screen shows the chosen day. */
export const CalendarDrawer: ComponentType<CalendarDrawerProps>;

export interface FileChange extends NavItemData { status?: "M" | "U" | "A" | "D" | "R" }
export interface FileTreeDrawerProps extends NavShellControlProps {
  changes?: FileChange[]; tree?: NavItemData[]; selected?: string; defaultSelected?: string; onSelect?: (id: string, item: NavItemData) => void;
  changesTitle?: string; treeTitle?: string;
  /** Default to the open file and the folder it is in. */
  title?: string;
}
/** A list of changed files above a tree of folders that fold; the screen shows the open file. */
export const FileTreeDrawer: ComponentType<FileTreeDrawerProps>;

export interface SettingsSheetProps {
  visible?: boolean; onClose?: () => void; title?: string;
  /** trailing on an item is its current value, shown beside the label. */
  items?: NavItemData[]; sections?: NavSectionData[];
  /** The id of the open section; null shows the list. onSelect gets null on the way back. */
  selected?: string | null; defaultSelected?: string | null; onSelect?: (id: string | null, item: NavItemData | null) => void;
  doneLabel?: string; backLabel?: string; closeLabel?: string; insets?: { bottom?: number };
  /** The page of the open section. */
  children?: ReactNode | ((item: NavItemData) => ReactNode); testID?: string;
}
/** Settings as a bottom sheet with its own navigation: a list of sections, each pushing its page inside the sheet. */
export const SettingsSheet: ComponentType<SettingsSheetProps>;

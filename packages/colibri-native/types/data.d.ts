import type { ComponentType, ReactElement, ReactNode, Ref } from "react";
import type { ScrollView, ScrollViewProps, StyleProp, ViewStyle } from "react-native";
import type { Gap, Tone } from "../index";

export type RowKey<Row> = keyof Row | ((row: Row, index: number) => string | number);
export type SortDirection = "asc" | "desc";
export interface TableSort { key: string; direction: SortDirection }

export interface TableColumn<Row = any> {
  /** The row field shown in this column, and the column's identity for sorting. */
  key: string;
  title?: string;
  /** A fixed width. Without it the column shares the free space (flex, default 1) and never gets narrower than minWidth (96). */
  width?: number; minWidth?: number; flex?: number;
  align?: "left" | "center" | "right";
  /** Right-aligned tabular figures. */
  numeric?: boolean;
  /** Custom cell content; text is styled for you, elements are shown as they are. */
  render?: (row: Row, index: number) => ReactNode;
  /** Table: headers sort only when true and onSort is given. DataTable: every column sorts unless false. */
  sortable?: boolean;
  /** DataTable: what to compare when sorting, if not row[key]. */
  sortValue?: (row: Row) => string | number | Date | null | undefined;
  /** DataTable: what the search looks at, if not row[key]. */
  searchValue?: (row: Row) => string | number | null | undefined;
}

export interface TableProps<Row = any> {
  columns: TableColumn<Row>[]; rows: Row[];
  /** Field name or function giving each row a stable key. Default "id". */
  rowKey?: RowKey<Row>;
  caption?: string; striped?: boolean; dense?: boolean; bordered?: boolean;
  sort?: TableSort | null; onSort?: (key: string) => void;
  selectable?: boolean; selected?: Array<string | number>; onSelectedChange?: (keys: Array<string | number>) => void;
  onRowPress?: (row: Row, index: number) => void;
  /** Names a row for screen readers ("Select Tbilisi"). Defaults to the first column's text. */
  rowLabel?: (row: Row, index: number) => string;
  /** Shown when rows is empty. */
  empty?: ReactNode;
  style?: StyleProp<ViewStyle>;
}
export function Table<Row = any>(props: TableProps<Row>): ReactElement;

export interface DataTableProps<Row = any> extends Omit<TableProps<Row>, "sort" | "onSort" | "empty" | "bordered"> {
  searchable?: boolean; searchPlaceholder?: string;
  search?: string; defaultSearch?: string; onSearchChange?: (search: string) => void;
  sort?: TableSort | null; defaultSort?: TableSort | null; onSortChange?: (sort: TableSort | null) => void;
  /** Rows per page (10). */
  pageSize?: number;
  /** Zero-based page. */
  page?: number; defaultPage?: number; onPageChange?: (page: number) => void;
  defaultSelected?: Array<string | number>;
  emptyText?: string;
  /** Anything to show beside the search field: a filter button, an "Add" button. */
  toolbar?: ReactNode;
}
export function DataTable<Row = any>(props: DataTableProps<Row>): ReactElement;

export interface DataListItem { label: string; value?: ReactNode; key?: string }
export interface DataListProps {
  items: DataListItem[];
  /** horizontal: label beside value (default). vertical: label above value. */
  orientation?: "horizontal" | "vertical";
  divided?: boolean; labelWidth?: number | `${number}%`; gap?: Gap; style?: StyleProp<ViewStyle>;
}
export const DataList: ComponentType<DataListProps>;

export interface CarouselProps {
  /** Each child is one slide. */
  children?: ReactNode;
  index?: number; defaultIndex?: number; onChange?: (index: number) => void;
  loop?: boolean;
  /** Milliseconds between slides; 0 is off. Off under reduced motion. */
  autoplay?: number;
  showArrows?: boolean; showDots?: boolean; gap?: Gap; accessibilityLabel?: string; style?: StyleProp<ViewStyle>;
}
export const Carousel: ComponentType<CarouselProps>;

export interface MessageScrollerHandle { scrollToBottom(options?: { animated?: boolean }): void; scrollTo: ScrollView["scrollTo"] }
export interface MessageScrollerProps extends Omit<ScrollViewProps, "style"> {
  height?: number | `${number}%`; gap?: Gap; padded?: boolean; bordered?: boolean;
  /** How close to the end (in points) still counts as "at the bottom" (32). */
  threshold?: number;
  jumpLabel?: string; newLabel?: string;
  onAtBottomChange?: (atBottom: boolean) => void;
  style?: StyleProp<ViewStyle>; contentStyle?: StyleProp<ViewStyle>; ref?: Ref<MessageScrollerHandle>;
}
export const MessageScroller: ComponentType<MessageScrollerProps>;

export interface CodeBlockProps {
  /** The text, here or as a string child. */
  code?: string; children?: ReactNode;
  title?: string; language?: string;
  /** Shows the Copy button. Do the copying here; return a rejected promise to cancel the "Copied" state. */
  onCopy?: (code: string) => void | Promise<void>;
  copyLabel?: string; copiedLabel?: string;
  wrap?: boolean; lineNumbers?: boolean; maxHeight?: number; style?: StyleProp<ViewStyle>;
}
export const CodeBlock: ComponentType<CodeBlockProps>;

export interface RatingProps {
  value?: number; defaultValue?: number; onChange?: (value: number) => void;
  max?: number; allowHalf?: boolean; readOnly?: boolean; disabled?: boolean;
  /** Pressing the current value again sets 0 (default true). */
  clearable?: boolean;
  size?: "s" | "m" | "l" | number; tone?: Tone; accessibilityLabel?: string; style?: StyleProp<ViewStyle>;
}
export const Rating: ComponentType<RatingProps>;

export interface SkeletonProps {
  width?: number | `${number}%`; height?: number | `${number}%`;
  radius?: "s" | "m" | "l" | "full" | number;
  /** true (uses height) or a diameter. */
  circle?: boolean | number;
  animated?: boolean; style?: StyleProp<ViewStyle>;
}
export const Skeleton: ComponentType<SkeletonProps>;
export interface SkeletonTextProps { lines?: number; lineHeight?: number; gap?: Gap; lastWidth?: number | `${number}%`; animated?: boolean; style?: StyleProp<ViewStyle> }
export const SkeletonText: ComponentType<SkeletonTextProps>;

export interface EmptyProps {
  /** A text glyph (drawn in a soft circle) or any element. */
  icon?: ReactNode;
  title?: string; description?: ReactNode;
  /** Usually a Button; children work too. */
  action?: ReactNode; children?: ReactNode;
  size?: "s" | "m" | "l"; bordered?: boolean; style?: StyleProp<ViewStyle>;
}
export const Empty: ComponentType<EmptyProps>;

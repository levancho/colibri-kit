// Declarations for src/pickers.js: Slider, Calendar, DatePicker, ColorPicker, FileInput, ImageInput, Repeater, Sortable.
import type { ComponentType, ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import type { Gap, Tone } from "../index";

// ---------------------------------------------------------------- slider
interface SliderBaseProps {
  min?: number; max?: number; step?: number; disabled?: boolean; tone?: Tone;
  /** The accessible name. In a range each thumb is announced as "label, Minimum" / "label, Maximum". */
  label?: string;
  /** Names of the two range thumbs. Default ["Minimum", "Maximum"]. */
  thumbLabels?: [string, string];
  /** The spoken value, for example (v) => `${v}%`. */
  formatValue?: (value: number) => string | number;
  style?: StyleProp<ViewStyle>; testID?: string;
}
export interface SingleSliderProps extends SliderBaseProps {
  range?: false; value?: number; defaultValue?: number;
  /** While dragging. */
  onChange?: (value: number) => void;
  /** Once, when the finger lifts or after a key or screen-reader step. */
  onChangeEnd?: (value: number) => void;
}
export interface RangeSliderProps extends SliderBaseProps {
  /** Inferred when value or defaultValue is an array. */
  range?: true; value?: [number, number]; defaultValue?: [number, number];
  onChange?: (value: [number, number]) => void;
  onChangeEnd?: (value: [number, number]) => void;
}
export type SliderProps = SingleSliderProps | RangeSliderProps;
export function Slider(props: SliderProps): ReactNode;

// ---------------------------------------------------------------- calendar
/** A calendar day as "YYYY-MM-DD". */
export type IsoDate = string;
/** [start, end]; either is null while the range is being chosen. */
export type DateRange = [IsoDate | null, IsoDate | null];
export interface CalendarLabels { previousMonth?: string; nextMonth?: string; previousYear?: string; nextYear?: string; today?: string }
interface CalendarBaseProps {
  min?: IsoDate; max?: IsoDate;
  /** Days that cannot be chosen: a list, or a test called for each day. */
  disabledDates?: IsoDate[] | ((date: IsoDate) => boolean);
  /** 0 (Sunday) to 6 (Saturday). Default 1, Monday. */
  firstDay?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** A BCP 47 tag for month and weekday names (Intl). English is used where Intl is missing. */
  locale?: string;
  /** The visible month as "YYYY-MM", when it is controlled. */
  month?: string; defaultMonth?: string; onMonthChange?: (month: string) => void;
  /** Overrides the day marked as today. */
  today?: IsoDate;
  /** Adds buttons that jump a year. */
  showYearNav?: boolean;
  labels?: CalendarLabels; style?: StyleProp<ViewStyle>; testID?: string;
}
export interface SingleCalendarProps extends CalendarBaseProps { mode?: "single"; value?: IsoDate | null; defaultValue?: IsoDate | null; onChange?: (value: IsoDate, info: { complete: true }) => void }
export interface RangeCalendarProps extends CalendarBaseProps { mode: "range"; value?: DateRange; defaultValue?: DateRange; onChange?: (value: DateRange, info: { complete: boolean }) => void }
export interface MultipleCalendarProps extends CalendarBaseProps { mode: "multiple"; value?: IsoDate[]; defaultValue?: IsoDate[]; onChange?: (value: IsoDate[], info: { complete: true }) => void }
export type CalendarProps = SingleCalendarProps | RangeCalendarProps | MultipleCalendarProps;
export function Calendar(props: CalendarProps): ReactNode;

// ---------------------------------------------------------------- date picker
export interface DatePickerLabels { clear?: string; done?: string; reset?: string; choose?: string; chooseRange?: string }
interface DatePickerBaseProps extends Pick<CalendarBaseProps, "min" | "max" | "disabledDates" | "firstDay" | "locale" | "today" | "showYearNav"> {
  label?: string; placeholder?: string; hint?: string; error?: string; disabled?: boolean;
  /** Shows a clear button when there is a value. Default true. */
  clearable?: boolean;
  /** The displayed text for a date. Default: day, short month and year for `locale`. */
  format?: (date: IsoDate) => string;
  /** The sheet heading. Default: the label. */
  title?: string;
  /** Controls the sheet. */
  open?: boolean; onOpenChange?: (open: boolean) => void;
  labels?: DatePickerLabels; style?: StyleProp<ViewStyle>; testID?: string;
}
export interface SingleDatePickerProps extends DatePickerBaseProps { mode?: "single"; value?: IsoDate | null; defaultValue?: IsoDate | null; onChange?: (value: IsoDate | null) => void }
export interface RangeDatePickerProps extends DatePickerBaseProps { mode: "range"; value?: DateRange; defaultValue?: DateRange; onChange?: (value: DateRange) => void }
export type DatePickerProps = SingleDatePickerProps | RangeDatePickerProps;
export function DatePicker(props: DatePickerProps): ReactNode;

// ---------------------------------------------------------------- color picker
export interface ColorSwatch { value: string; label: string }
export interface ColorPickerProps {
  /** "#rrggbb" ("#rgb" is accepted). */
  value?: string; defaultValue?: string;
  onChange?: (hex: string) => void;
  /** When a drag, a swatch press or a hex edit settles. */
  onChangeEnd?: (hex: string) => void;
  /** Presets: hex strings or { value, label }. Pass [] for none. */
  swatches?: Array<string | ColorSwatch>;
  /** Hue, saturation and lightness sliders. Default true. */
  sliders?: boolean;
  /** The hex text field. Default true. */
  showInput?: boolean;
  label?: string; disabled?: boolean;
  labels?: { hue?: string; saturation?: string; lightness?: string; hex?: string; swatches?: string };
  style?: StyleProp<ViewStyle>; testID?: string;
}
export const ColorPicker: ComponentType<ColorPickerProps>;

// ---------------------------------------------------------------- file input
/** What a picker returns. expo-document-picker and expo-image-picker assets fit as they are. */
export interface PickedFile { name?: string; fileName?: string; size?: number; fileSize?: number; uri?: string; type?: string; mimeType?: string; [key: string]: unknown }
export interface RejectedFile<F = PickedFile> { file: F; reason: "size" | "type" | "count"; message: string }
export interface FileMessages {
  tooLarge?: (name: string, limit: string) => string; tooMany?: (limit: number) => string; wrongType?: (name: string) => string; failed?: string;
}
export interface FileInputProps<F extends PickedFile = PickedFile> {
  value?: F[]; defaultValue?: F[]; onChange?: (files: F[]) => void;
  /**
   * Opens the system picker. React Native core has none: wire this to expo-document-picker (or an
   * <input type="file"> on the web). Resolve to a file, an array of files, or null when cancelled.
   */
  onPick?: (request: { multiple: boolean; accept?: string | string[]; maxFiles: number }) => Promise<F | F[] | null | undefined> | F | F[] | null | undefined;
  /** Files turned away by accept, maxSize or maxFiles. */
  onReject?: (rejected: RejectedFile<F>[]) => void;
  multiple?: boolean; maxFiles?: number;
  /** Bytes, or text such as "2MB" or "500 KB". */
  maxSize?: number | string;
  /** Extensions and MIME types: ".pdf", "image/*", "application/pdf" (a list or comma-separated). */
  accept?: string | string[];
  label?: string; hint?: string; buttonLabel?: string; error?: string; disabled?: boolean;
  messages?: FileMessages; removeLabel?: (name: string) => string;
  style?: StyleProp<ViewStyle>; testID?: string;
}
export function FileInput<F extends PickedFile = PickedFile>(props: FileInputProps<F>): ReactNode;

// ---------------------------------------------------------------- image input
export interface PickedImage extends PickedFile { uri: string; width?: number; height?: number }
export interface ImageInputProps {
  /** The image, or just its uri. */
  value?: PickedImage | string | null; defaultValue?: PickedImage | string | null;
  onChange?: (image: PickedImage | null) => void;
  /** Opens the system picker (expo-image-picker). Resolve to an image, a uri, or null when cancelled. */
  onPick?: () => Promise<PickedImage | PickedImage[] | string | null | undefined> | PickedImage | string | null | undefined;
  onRemove?: () => void;
  maxSize?: number | string;
  /** "circle" for avatars (default), "rounded" for covers. */
  shape?: "circle" | "rounded";
  /** Preview size. A width above 140 puts the buttons under the preview. Default 80. */
  size?: number | { width: number; height: number };
  label?: string; hint?: string; error?: string; chooseLabel?: string; changeLabel?: string; removeLabel?: string; disabled?: boolean;
  messages?: FileMessages; style?: StyleProp<ViewStyle>; testID?: string;
}
export const ImageInput: ComponentType<ImageInputProps>;

// ---------------------------------------------------------------- repeater
export interface RepeaterRow<T> {
  item: T; index: number; count: number;
  /** Merges a patch into an object row, or replaces a primitive one. */
  update: (patch: Partial<T> | T) => void;
  remove: () => void; canRemove: boolean;
}
export interface RepeaterProps<T = Record<string, unknown>> {
  value?: T[]; defaultValue?: T[]; onChange?: (rows: T[]) => void;
  renderRow: (row: RepeaterRow<T>) => ReactNode;
  /** Data for a new row. Default: an empty object. */
  createItem?: (index: number) => T;
  min?: number; max?: number;
  addLabel?: string; removeLabel?: (index: number) => string;
  onAdd?: (item: T, index: number) => void; onRemove?: (item: T, index: number) => void;
  disabled?: boolean; gap?: Gap; style?: StyleProp<ViewStyle>; testID?: string;
}
export function Repeater<T = Record<string, unknown>>(props: RepeaterProps<T>): ReactNode;

// ---------------------------------------------------------------- sortable
export interface SortableProps<T = string> {
  /** The items in order. */
  value?: T[]; defaultValue?: T[]; onChange?: (items: T[]) => void;
  /** The content of a row. Default: the item's label as text. */
  renderItem?: (row: { item: T; index: number; dragging: boolean }) => ReactNode;
  /** Default: item.id ?? item.value ?? the item itself. */
  keyExtractor?: (item: T) => string;
  /** The item's name for assistive technology. Default: item.label ?? item.title ?? item.name ?? the item. */
  getLabel?: (item: T) => string;
  /** Which side the grip is on. Default "end". */
  handle?: "start" | "end";
  disabled?: boolean; gap?: Gap;
  /** The accessible name of the list. */
  label?: string;
  style?: StyleProp<ViewStyle>; testID?: string;
}
export function Sortable<T = string>(props: SortableProps<T>): ReactNode;

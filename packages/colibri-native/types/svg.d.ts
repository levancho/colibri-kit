// Types for src/svg/: the optional entry @colibri-kit/native/svg (needs react-native-svg).
// Line, area, bar, pie and donut charts, sparkline, progress ring, gauge and an outline icon set.
import type { ComponentType, MemoExoticComponent, ReactNode } from "react";
import type { ColorValue, StyleProp, ViewProps, ViewStyle } from "react-native";
import type { Tone } from "../index";

/** A series colour override: a theme tone, or "muted". Without one, colours come from the theme hue in series order. */
export type SvgChartTone = Tone | "muted";
/** Turns a number into the text shown on axes, in tooltips, legends and the spoken summary. */
export type FormatValue = (value: number) => string;

export interface ChartPoint { label?: string; value: number | null | undefined; /** Colours this point when the chart has one series (bars, slices). */ tone?: SvgChartTone }
export interface SvgChartSeries {
  name?: string;
  /** One value per label. null or undefined leaves a gap in a line and no bar. */
  values: Array<number | null | undefined>;
  tone?: SvgChartTone;
}

interface ChartBase extends Omit<ViewProps, "style" | "children"> {
  /** One series: [{ label, value }]. */
  data?: ChartPoint[];
  /** Several series: the labels of the x axis … */
  labels?: string[];
  /** … and a list of values per series. */
  series?: SvgChartSeries[];
  /** A heading above the plot; also the start of the spoken summary. */
  title?: string;
  /** Height of the plot in points, without the x labels and the legend. Default 200. */
  height?: number;
  /** The tone of the series when data is used. */
  tone?: SvgChartTone;
  /** Horizontal grid lines. Default true. */
  showGrid?: boolean;
  /** Tick labels on both axes. Default true. */
  showAxis?: boolean;
  /** Default: shown when there is more than one series. */
  showLegend?: boolean;
  /** Fix the ends of the y axis instead of deriving them from the data. */
  yMin?: number; yMax?: number;
  /** Make the y axis include zero. Default true for AreaChart and BarChart, false for LineChart. */
  zero?: boolean;
  /** About how many intervals the y axis has. Default 4. The values are always round (1, 2, 2.5 or 5 × 10ⁿ). */
  ticks?: number;
  /** Default: 1,284 · 15.3k · 2.4M · 0.26. */
  formatValue?: FormatValue;
  /** The text of an x label. Labels that would collide are thinned out automatically. */
  formatLabel?: (label: string, index: number) => string;
  /** Press or drag across the plot to show a crosshair and a tooltip. Default true. */
  interactive?: boolean;
  /** The picked point, when controlled: an index into the labels, or null for none. */
  activeIndex?: number | null;
  onActiveChange?: (index: number | null, point: { label: string; values: Array<number | null> } | null) => void;
  /** Draw the marks in from the left on first appearance. Off when the device asks for reduced motion. Default true. */
  animate?: boolean;
  /** Default "No data yet". */
  emptyText?: string;
  /** Default: a generated summary (per series: count, first, last, lowest, highest). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** The touch area gets `${testID}-plot` and the tooltip `${testID}-tooltip`. */
  testID?: string;
}

export interface LineChartProps extends ChartBase {
  /** A monotone cubic curve: smooth, and never above or below the two points it joins. Default true; false draws straight segments. */
  smooth?: boolean;
  /** Fill under each line with a gradient. Default false (true in AreaChart). */
  area?: boolean;
  /** A dot on every point. Points with no neighbour always get one. Default false. */
  showDots?: boolean;
  /** Default 2. */
  strokeWidth?: number;
}
/** Lines over a shared x axis, with axes, grid, legend, tooltip and an empty state. */
export const LineChart: ComponentType<LineChartProps>;

export interface AreaChartProps extends LineChartProps {
  /** Pile the series on top of each other. Values below zero and gaps count as zero. Default false. */
  stacked?: boolean;
}
/** LineChart with the area under each line filled; optionally stacked. */
export const AreaChart: ComponentType<AreaChartProps>;

export interface BarChartProps extends ChartBase {
  /** Stack the series in one bar per label instead of a group of bars. Bars below zero stack downwards. Default false. */
  stacked?: boolean;
  /** Write the value at the tip of each bar (the total of a stack). Grouped bars are labelled only when they are wide enough. Default false. */
  showValues?: boolean;
}
/** Vertical SVG bars with rounded tips, grouped or stacked, with the frame of the line charts. */
export const BarChart: ComponentType<BarChartProps>;

// ---------------------------------------------------------------- pie
export interface PieSlice { label: string; value: number; tone?: SvgChartTone; /** Any colour; wins over tone. */ color?: string }
export interface PieChartProps extends Omit<ViewProps, "style" | "children"> {
  /** Values of zero or less are left out: a pie cannot show them. */
  data?: PieSlice[];
  title?: string;
  /** Diameter in points; it shrinks to the width available. Default 200. */
  size?: number;
  /** The hole, as a share of the radius (0 … 0.92). Default 0 for PieChart, 0.64 for DonutChart. */
  innerRadius?: number;
  /** Space between slices in points, the same at the rim and at the hole. Default 2. */
  gap?: number;
  /** Rounded slice corners, reduced where a slice is too thin. Default 3 (pie), 4 (donut). */
  cornerRadius?: number;
  /** Where the first slice starts, in degrees clockwise from 12 o'clock. Default 0. */
  startAngle?: number;
  /** The selected slice when controlled: an index into data, or null. */
  selected?: number | null;
  defaultSelected?: number | null;
  onSelect?: (index: number | null, slice: PieSlice | null) => void;
  /** Slices and legend rows can be pressed. Default true. */
  selectable?: boolean;
  /** A row per slice with its value and percentage (whole numbers that add up to 100). Default true. */
  showLegend?: boolean;
  formatValue?: FormatValue;
  /** DonutChart: the big text in the hole while nothing is selected. Default: the formatted total. */
  centerValue?: string;
  /** DonutChart: the small text under it. Default "Total". */
  centerLabel?: string;
  emptyText?: string;
  /** Default: "Pie chart. Search: 4,820 (43%); …". */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** The plot gets `${testID}-plot`. */
  testID?: string;
}
/** Parts of a whole. Press a slice or its legend row to select it. */
export const PieChart: ComponentType<PieChartProps>;
/** PieChart with a hole that shows the total, or the selected slice. */
export const DonutChart: ComponentType<PieChartProps>;

// ---------------------------------------------------------------- small indicators
export interface SparklineProps extends Omit<ViewProps, "style" | "children"> {
  /** Numbers in order; null leaves a gap. */
  data?: Array<number | null | undefined | { value: number | null }>;
  /** Points, or "fill" for the width of the parent. Default 80. */
  width?: number | "fill";
  /** Default 32. */
  height?: number;
  /** Default "accent". */
  tone?: SvgChartTone;
  /** Any colour; wins over tone. */
  color?: string;
  /** Fill under the line. Default false. */
  area?: boolean;
  /** A dot on the last value. Default true. */
  dot?: boolean;
  /** Default true. */
  smooth?: boolean;
  /** Default 1.75. */
  strokeWidth?: number;
  /** What the numbers are, for the spoken summary. */
  title?: string;
  formatValue?: FormatValue;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>; testID?: string;
}
/** A small trend line without axes. */
export const Sparkline: ComponentType<SparklineProps>;

export interface ProgressRingProps extends Omit<ViewProps, "style" | "children"> {
  /** From 0 to 1, like Progress. */
  value?: number;
  /** s (32) | m (56) | l (88) or a number of points. Default "m". */
  size?: "s" | "m" | "l" | number;
  /** Width of the ring. Default: a tenth of the size. */
  thickness?: number;
  tone?: Tone;
  /** Amount unknown: the arc spins (or fades in and out when the device asks for reduced motion). */
  indeterminate?: boolean;
  /** The percentage in the middle. Default: shown from 48 points up. */
  showValue?: boolean;
  /** The text in the middle and the spoken value. Default: a percentage. */
  formatValue?: (value: number) => string;
  /** A caption under the ring; a string also names the ring for screen readers. */
  label?: ReactNode;
  /** Replaces the percentage in the middle. */
  children?: ReactNode;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>; testID?: string;
}
/** Circular progress. */
export const ProgressRing: ComponentType<ProgressRingProps>;

export interface GaugeRange {
  /** The upper end of this band; it starts where the one before ends (or at min). */
  to: number;
  tone?: SvgChartTone;
  /** Shown under the value while it is in this band ("Good"). */
  label?: string;
}
export interface GaugeProps extends Omit<ViewProps, "style" | "children"> {
  value?: number;
  /** Default 0. */
  min?: number;
  /** Default 100. */
  max?: number;
  /** Coloured bands, in ascending order. Without them the arc fills in `tone`. */
  ranges?: GaugeRange[];
  /** Width in points; it shrinks to the width available. Default 220. */
  size?: number;
  /** Default 14. */
  thickness?: number;
  /** Default "accent". Used when there are no ranges. */
  tone?: Tone;
  /** What is measured. A string is also spoken. */
  label?: ReactNode;
  formatValue?: FormatValue;
  /** The min and max under the ends of the arc. Default true. */
  showRange?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>; testID?: string;
}
/** A half-circle gauge with optional coloured ranges. */
export const Gauge: ComponentType<GaugeProps>;

// ---------------------------------------------------------------- icons
export type IconName =
  | "check" | "close" | "chevron-left" | "chevron-right" | "chevron-up" | "chevron-down" | "arrow-left" | "arrow-right" | "arrow-up" | "arrow-down"
  | "plus" | "minus" | "search" | "menu" | "more-horizontal" | "more-vertical" | "home" | "user" | "users" | "settings" | "bell" | "mail" | "calendar" | "clock"
  | "heart" | "star" | "trash" | "edit" | "copy" | "share" | "download" | "upload" | "link" | "external-link" | "eye" | "eye-off" | "lock" | "unlock"
  | "info" | "alert-triangle" | "alert-circle" | "check-circle" | "x-circle" | "filter" | "sort" | "refresh" | "send" | "image" | "file" | "folder" | "camera"
  | "map-pin" | "phone" | "credit-card" | "shopping-cart" | "tag" | "bookmark" | "sun" | "moon" | "play" | "pause" | "mic" | "paperclip" | "sparkles" | "terminal" | "code";
export interface IconProps {
  name: IconName;
  /** Side in points. Default 24. The stroke scales with it. */
  size?: number;
  /** A theme colour. Default: the text colour. */
  tone?: SvgChartTone;
  /** Any colour; wins over tone. */
  color?: ColorValue;
  /** In units of the 24-point grid. Default 1.75. */
  strokeWidth?: number;
  /** The accessible name. Without it the icon is decoration and hidden from screen readers. */
  label?: string;
  style?: StyleProp<ViewStyle>; testID?: string;
}
/**
 * One outline icon. Where the main entry takes an icon (BottomBar items, AppBarAction, Fab), pass a function:
 * `icon: ({ color, size }) => <Icon name="home" color={color} size={size} />`.
 */
export const Icon: MemoExoticComponent<ComponentType<IconProps>>;
/** Every name Icon accepts. */
export const iconNames: readonly IconName[];

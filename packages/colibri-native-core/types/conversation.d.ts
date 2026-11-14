// Types for src/conversation.js: bubbles, messages, markers, traces, attachments, the questionnaire and charts.
import type { ComponentType, ReactNode } from "react";
import type { ImageSourcePropType, PressableProps, StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import type { Gap, Tone } from "../index";

export interface BubbleGroupProps extends ViewProps { /** start (received, default) | end (sent) */ align?: "start" | "end"; gap?: Gap }
export const BubbleGroup: ComponentType<BubbleGroupProps>;

export interface BubbleReaction { value: string; /** what is shown, usually an emoji; defaults to value */ label?: ReactNode; count?: number; active?: boolean; accessibilityLabel?: string }
export interface BubbleProps extends ViewProps {
  /** primary | muted | outline | ghost. Defaults to primary when sent, muted otherwise. */
  variant?: "primary" | "muted" | "outline" | "ghost";
  /** Trailing side, accent colour. */
  sent?: boolean;
  align?: "start" | "end";
  /** A small line under the bubble: "Delivered", "Read 09:42". */
  status?: ReactNode;
  reactions?: BubbleReaction[];
  onReact?: (value: string, on: boolean) => void;
  /** Clamp a text bubble to `lines` lines (default 4) with a Show more / Show less button. */
  collapsible?: boolean; lines?: number;
  textStyle?: StyleProp<TextStyle>;
}
export const Bubble: ComponentType<BubbleProps>;

export type MessageActionName = "copy" | "like" | "dislike" | "retry";
export interface MessageAction { action: MessageActionName | (string & {}); label?: string; glyph?: ReactNode; /** behaves as an exclusive toggle, like like and dislike */ toggle?: boolean }
export interface MessageProps extends ViewProps {
  from?: "assistant" | "user";
  author?: string; time?: string;
  /** A name (drawn as initials), an element, or null for no avatar column. Defaults to author. */
  avatar?: string | ReactNode | null;
  /** Continues the previous message from the same author: no avatar or header. */
  grouped?: boolean;
  /** The look of the bubble a string body is wrapped in. Defaults to primary for the user, ghost for the assistant. */
  variant?: BubbleProps["variant"];
  status?: ReactNode;
  actions?: Array<MessageActionName | MessageAction>;
  /** pressed is set for toggles (like, dislike). Copy only reports: the app writes to the clipboard. */
  onAction?: (action: string, detail: { pressed?: boolean }) => void;
}
export const Message: ComponentType<MessageProps>;

export interface MarkerProps extends ViewProps {
  variant?: "plain" | "row" | "separator";
  /** A text glyph or an element shown before the text. */
  icon?: ReactNode;
  loading?: boolean;
  /** Announce the text to screen readers when it changes. */
  live?: boolean;
  tone?: Tone | "muted";
}
export const Marker: ComponentType<MarkerProps>;

export type TraceStatus = "done" | "running" | "error" | "pending";
export interface TraceStepProps {
  title: ReactNode; status?: TraceStatus;
  /** A string, or milliseconds (formatted as "420 ms", "1.2 s", "1m 13s"). */
  duration?: string | number;
  /** Replaces the tick of a done step. */
  glyph?: string;
  /** A string is shown in a code box; children work as detail too. */
  detail?: ReactNode; children?: ReactNode;
  open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
  style?: StyleProp<ViewStyle>;
}
export const TraceStep: ComponentType<TraceStepProps>;
export interface TraceProps extends ViewProps { steps?: Array<TraceStepProps & { id?: string | number }> }
export const Trace: ComponentType<TraceProps>;

export interface AttachmentProps extends Omit<ViewProps, "children"> {
  name: string;
  /** Bytes (formatted for you) or a ready string. */
  size?: number | string;
  /** Defaults to the extension of name. */
  type?: string;
  /** A thumbnail instead of the type glyph. */
  source?: ImageSourcePropType;
  /** chip (default) | image: a square picture tile. */
  variant?: "chip" | "image";
  /** Upload progress, 0 to 1. */
  progress?: number;
  error?: string;
  onRemove?: (name: string) => void;
  onPress?: PressableProps["onPress"];
  /** Stretch to the width of the container. */
  block?: boolean;
}
export const Attachment: ComponentType<AttachmentProps>;

export type AnswerValue = string | number;
export interface QuestionOption { value: AnswerValue; label: string; description?: string }
export interface Question {
  name: string; type: "single" | "multiple" | "text"; title: string; description?: string;
  options?: QuestionOption[];
  required?: boolean;
  /** Shows a Skip button, which clears the answer and moves on. */
  skippable?: boolean;
  placeholder?: string;
  /** The message shown when a required question is left empty. */
  error?: string;
}
export type Answers = Record<string, AnswerValue | AnswerValue[] | undefined>;
export interface QuestionnaireProps extends Omit<ViewProps, "children"> {
  questions: Question[];
  defaultAnswers?: Answers;
  onChange?: (answers: Answers) => void;
  onStep?: (index: number, total: number) => void;
  onSubmit?: (answers: Answers) => void;
  submitLabel?: string;
  /** Replaces the closing screen. */
  summary?: (answers: Answers) => ReactNode;
}
export const Questionnaire: ComponentType<QuestionnaireProps>;

export type ChartTone = Tone | "muted";
export interface ChartDatum { label?: string; value: number; tone?: ChartTone }
export interface ChartSeries { name?: string; values: number[]; tone?: ChartTone }
export interface ChartProps extends Omit<ViewProps, "children"> {
  /** bar (vertical, grouped for several series) | horizontal | stacked | sparkline | share. No line or pie: those need an SVG library. */
  type?: "bar" | "horizontal" | "stacked" | "sparkline" | "share";
  /** One series: [{ label, value, tone }]. */
  data?: ChartDatum[];
  /** Several series: labels for the categories and one values array per series. */
  labels?: string[]; series?: ChartSeries[];
  title?: string;
  /** Height of the plot in points (160; 32 for a sparkline; 14 for a share bar). */
  height?: number;
  showValues?: boolean; showLegend?: boolean;
  formatValue?: (value: number) => string;
  /** Colour of a single-series chart. */
  tone?: ChartTone;
  /** Width of the label column of a horizontal chart (84). */
  labelWidth?: number;
  emptyText?: string;
  /** Defaults to a generated summary of the data. */
  accessibilityLabel?: string;
}
export const Chart: ComponentType<ChartProps>;
export interface ChartLegendItem { label: string; color: string; value?: string | number }
export const ChartLegend: ComponentType<{ items: ChartLegendItem[]; style?: StyleProp<ViewStyle> }>;

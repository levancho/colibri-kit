// Declarations for src/ai.js: AI elements (chat, reasoning, tool calls, agent status).
import type { ComponentType, ReactNode, Ref } from "react";
import type { StyleProp, TextInput, TextInputProps, TextStyle, ViewStyle } from "react-native";

type AiTone = "accent" | "ok" | "warn" | "bad" | "success" | "warning" | "danger" | "destructive";

/**
 * One status vocabulary for every block. pending | running | done | error | skipped are canonical; the web kit's
 * words are accepted too (completed, complete, passed, success, ok → done; failed, fail → error; streaming, active → running).
 */
export type AiStatus = "pending" | "running" | "done" | "error" | "skipped" | "completed" | "complete" | "passed" | "success" | "ok" | "failed" | "fail" | "streaming" | "active";

/** Shared by every collapsible block: controlled with open + onOpenChange, or uncontrolled with defaultOpen. */
export interface AiOpenProps { open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; style?: StyleProp<ViewStyle> }

/** A step of a ChainOfThought, Task, Plan or Subagent. label and detail may contain `inline code`. */
export interface AiStep { id?: string | number; label: string; status?: AiStatus; detail?: string }

// ---------------------------------------------------------------- reasoning and steps
export interface ReasoningProps extends AiOpenProps {
  /** "streaming" keeps it open and says "Thinking…"; "done" folds it away. Default "done". */
  status?: AiStatus;
  /** Seconds, shown as "Thought for 3s". */
  duration?: number;
  /** The thinking. Blank lines split paragraphs; `inline code` is set in monospace. */
  text?: string;
  /** Replaces the generated header text. */
  label?: string;
  /** A glyph or element shown before the label. */
  icon?: ReactNode;
  children?: ReactNode;
}
export const Reasoning: ComponentType<ReasoningProps>;

export interface ChainOfThoughtProps extends AiOpenProps { label?: string; steps?: AiStep[]; /** Worked out from the steps when left out. */ status?: AiStatus; /** Seconds. */ duration?: number; icon?: ReactNode; children?: ReactNode }
export const ChainOfThought: ComponentType<ChainOfThoughtProps>;

export interface TaskProps extends AiOpenProps { label: string; steps?: AiStep[]; /** Worked out from the steps when left out. */ status?: AiStatus; icon?: ReactNode; children?: ReactNode }
export const Task: ComponentType<TaskProps>;

export interface PlanProps extends AiOpenProps { title?: string; description?: string; steps?: AiStep[]; /** Worked out from the steps when left out. */ status?: AiStatus; children?: ReactNode }
export const Plan: ComponentType<PlanProps>;

export interface SubagentProps extends AiOpenProps {
  name: string; task?: string; status?: AiStatus;
  /** Strings count as finished steps. */
  steps?: Array<string | AiStep>;
  /** What the helper reported back. */
  result?: string;
  /** Seconds. */
  duration?: number; icon?: ReactNode; children?: ReactNode;
}
export const Subagent: ComponentType<SubagentProps>;

// ---------------------------------------------------------------- tool calls and output
export interface ToolProps extends AiOpenProps {
  name: string;
  /** Default: "error" when error is given, "done" when output is given, otherwise "pending". */
  status?: AiStatus;
  /** A string, or any value (shown as indented JSON). */
  input?: unknown; output?: unknown;
  /** Shown instead of the output, in the danger tone. */
  error?: unknown;
  /** Seconds. */
  duration?: number; icon?: ReactNode;
  /** Adds Copy buttons. React Native has no clipboard in core, so you do the copying. */
  onCopy?: (text: string) => void;
  children?: ReactNode;
}
export const Tool: ComponentType<ToolProps>;

export interface TerminalLine { text: string; tone?: AiTone | "muted" }
export interface TerminalProps extends AiOpenProps {
  command: string;
  /** The whole output as one string, or line by line. */
  output?: string | Array<string | TerminalLine>;
  /** running shows a caret after the last line. Default "done". */
  status?: AiStatus; exitCode?: number;
  /** Seconds. */
  duration?: number; icon?: ReactNode;
  /** The output scrolls inside this height. Default 240. */
  maxHeight?: number;
  /** Adds a "Copy output" button; you do the copying. */
  onCopy?: (text: string) => void;
}
export const Terminal: ComponentType<TerminalProps>;

export interface StackFrame { fn?: string; file?: string; line?: number; column?: number; /** Library or runtime frame: dimmed. */ internal?: boolean }
export interface StackTraceProps extends AiOpenProps {
  /** The error line, for example "TypeError: x is not a function". */
  message: string;
  frames?: Array<string | StackFrame>;
  /** Raw trace text, one frame per line; used when frames is not given. */
  trace?: string;
  /** Frames shown before "Show all". Default 5. */
  maxFrames?: number;
  /** Adds a Copy button that passes the message and every frame; you do the copying. */
  onCopy?: (text: string) => void;
}
export const StackTrace: ComponentType<StackTraceProps>;

export interface TestCase { name: string; status: "passed" | "failed" | "skipped" | AiStatus; /** Seconds. */ duration?: number; /** Shown in monospace under a failed test. */ error?: string }
export interface TestSuite { name: string; tests: TestCase[]; /** Default: open when a test failed. */ defaultOpen?: boolean }
export interface TestResultsProps extends AiOpenProps { title?: string; suites?: TestSuite[]; /** Worked out from the tests when left out. */ status?: AiStatus; /** Seconds. */ duration?: number }
export const TestResults: ComponentType<TestResultsProps>;

// ---------------------------------------------------------------- status cards
export interface QueueItem { id: string | number; label: string; detail?: string; done?: boolean }
export interface QueueProps { items?: QueueItem[]; /** Without it the list is read-only. */ onChange?: (id: QueueItem["id"], done: boolean) => void; pendingLabel?: string; completedLabel?: string; disabled?: boolean; style?: StyleProp<ViewStyle> }
export const Queue: ComponentType<QueueProps>;

export interface CheckpointProps { id?: string | number; label?: string; /** Shown after the label: "3 files changed". */ detail?: string; restoreLabel?: string; /** Without it there is no button. */ onRestore?: (id?: string | number) => void; disabled?: boolean; style?: StyleProp<ViewStyle> }
export const Checkpoint: ComponentType<CheckpointProps>;

export interface ConfirmationProps {
  /** The question. May contain `inline code`. */
  title: string; description?: string;
  /** The command, query or payload being approved, in monospace. Values are shown as JSON. */
  detail?: unknown;
  /** Controlled answer. Leave it out and the card keeps the answer itself. */
  status?: "pending" | "approved" | "rejected";
  /** "bad" (or danger) makes Approve a danger button. */
  tone?: AiTone;
  approveLabel?: string; rejectLabel?: string; approvedText?: string; rejectedText?: string;
  onApprove?: () => void; onReject?: () => void; disabled?: boolean; children?: ReactNode; style?: StyleProp<ViewStyle>;
}
export const Confirmation: ComponentType<ConfirmationProps>;

export interface ContextProps extends AiOpenProps {
  /** Tokens used and the size of the window. */
  used: number; max: number;
  /** Rows under the bar: [{ label: "Input", value: 98000 }]. */
  breakdown?: Array<{ label: string; value: number }>;
  label?: string;
}
export const Context: ComponentType<ContextProps>;

// ---------------------------------------------------------------- files
export interface FileTreeNode { name: string; /** Default: the parent's path + "/" + name. */ path?: string; /** Present (even empty) on folders. */ children?: FileTreeNode[]; status?: "added" | "modified" | "deleted" | "renamed" }
export interface FileTreeProps {
  items?: FileTreeNode[];
  /** Path of the highlighted file. */
  selected?: string; defaultSelected?: string; onSelect?: (path: string, node: FileTreeNode) => void;
  /** Paths of the open folders. Default: the top-level folders. */
  expanded?: string[]; defaultExpanded?: string[]; onExpandedChange?: (paths: string[]) => void;
  onToggle?: (path: string, open: boolean) => void;
  /** Accessibility label of the tree. */
  label?: string; style?: StyleProp<ViewStyle>;
}
export const FileTree: ComponentType<FileTreeProps>;

// ---------------------------------------------------------------- citations and sources
export interface Source { id?: string | number; title?: string; url?: string; /** Default: the host of url. */ site?: string; snippet?: string }

export interface InlineCitationProps {
  number: number; source?: Source;
  /** Usually opens a CitationPreview. Without it the press goes to onOpen, and without that to Linking.openURL(source.url). */
  onPress?: (source?: Source) => void; onOpen?: (source?: Source) => void; style?: StyleProp<TextStyle>;
}
/** Renders text, so place it inside a Text between the words. */
export const InlineCitation: ComponentType<InlineCitationProps>;

export interface CitationPreviewProps { source?: Source | null; number?: number; /** Default: shown whenever source is set. */ visible?: boolean; onClose?: () => void; /** Without it the button opens source.url with Linking. */ onOpen?: (source: Source) => void; openLabel?: string }
export const CitationPreview: ComponentType<CitationPreviewProps>;

export interface SourcesProps extends AiOpenProps {
  sources?: Source[];
  /** Default: "Used N sources". */
  label?: string;
  /** "running" shows "Searching sources…". */
  status?: AiStatus; icon?: ReactNode;
  /** Without it a row opens source.url with Linking. */
  onOpen?: (source: Source) => void;
}
export const Sources: ComponentType<SourcesProps>;

// ---------------------------------------------------------------- prompts
export interface SuggestionProps {
  /** A string is both the chip text and the prompt; { label, value } sends value. */
  items?: Array<string | { label: string; value?: string }>;
  onSuggest?: (text: string) => void;
  /** One line that scrolls sideways instead of wrapping. */
  scroll?: boolean; disabled?: boolean; label?: string; style?: StyleProp<ViewStyle>;
}
export const Suggestion: ComponentType<SuggestionProps>;

export interface ModelOption { value: string; label: string; description?: string; badge?: string; disabled?: boolean }
export interface ModelSelectorProps {
  value?: string; defaultValue?: string; onChange?: (value: string) => void; options?: ModelOption[];
  /** Give efforts to add the "how hard should it think" control to the sheet. */
  effort?: string; defaultEffort?: string; onEffortChange?: (value: string) => void; efforts?: Array<{ value: string; label: string }>;
  title?: string; effortTitle?: string; disabled?: boolean; style?: StyleProp<ViewStyle>;
}
export const ModelSelector: ComponentType<ModelSelectorProps>;

export interface PromptAttachment { id?: string | number; name: string; /** A second line: size or type. */ detail?: string }
export interface PromptInputProps extends Omit<TextInputProps, "value" | "defaultValue" | "onChange" | "onSubmitEditing" | "style"> {
  value?: string; defaultValue?: string; onChange?: (text: string) => void;
  /** Called with the trimmed text and the attachments; the box is cleared afterwards. */
  onSubmit?: (text: string, attachments: PromptAttachment[]) => void;
  /** Called by the Stop button, which replaces Send while streaming. */
  onStop?: () => void;
  streaming?: boolean;
  /** Same as streaming when "streaming" or "running". */
  status?: AiStatus;
  disabled?: boolean;
  attachments?: PromptAttachment[];
  /** Open your file or photo picker here; without it there is no attach button. */
  onAttach?: () => void;
  onRemoveAttachment?: (id: string | number) => void;
  /** A model name shown as a chip in the toolbar; onModelPress makes it a button. */
  model?: string; onModelPress?: () => void;
  /** Extra controls after the model chip. */
  toolbar?: ReactNode;
  /** The text grows between these heights. Defaults 40 and 140. */
  minHeight?: number; maxHeight?: number;
  sendLabel?: string; stopLabel?: string;
  style?: StyleProp<ViewStyle>; inputStyle?: StyleProp<TextStyle>; ref?: Ref<TextInput>;
}
export const PromptInput: ComponentType<PromptInputProps>;

// ---------------------------------------------------------------- messages and chat
export type AiFeedback = "up" | "down" | null;
export interface AiMessageProps {
  /** "user" is an accent bubble on the right; "assistant" (default) is plain text across the width. */
  role?: "user" | "assistant";
  /** Paragraphs are split at blank lines and `inline code` is set in monospace. Nothing else is parsed. */
  text?: string;
  /** Shows a blinking caret after the text and hides the actions. */
  streaming?: boolean;
  /** Shown above an assistant reply, with an Avatar of the initials unless avatar is given. */
  author?: string; avatar?: ReactNode; time?: string;
  /** Each callback adds its action under a finished assistant reply. You do the copying. */
  onCopy?: (text: string) => void; onRetry?: () => void; onFeedback?: (value: AiFeedback) => void; feedback?: AiFeedback;
  /** Extra actions after the built-in ones. */
  actions?: ReactNode;
  /** Shown under the text (Sources). */
  footer?: ReactNode;
  /** Shown above the text (Reasoning, Tool, Task …). */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}
export const AiMessage: ComponentType<AiMessageProps>;

export interface ChatMessage extends Omit<AiMessageProps, "onCopy" | "onRetry" | "onFeedback" | "style"> { id?: string | number }
export interface ChatProps {
  messages?: ChatMessage[];
  /** Draw a message yourself; the default is an AiMessage with the message's fields. */
  renderMessage?: (message: ChatMessage, index: number) => ReactNode;
  onSend?: (text: string, attachments: PromptAttachment[]) => void; onStop?: () => void;
  /** The assistant is answering: Send becomes Stop and suggestions are disabled. */
  streaming?: boolean; disabled?: boolean;
  /** Chips above the input. A pressed chip calls onSuggest, or onSend when onSuggest is not given. */
  suggestions?: SuggestionProps["items"]; onSuggest?: (text: string) => void;
  onCopy?: (message: ChatMessage) => void; onRetry?: (message: ChatMessage) => void; onFeedback?: (message: ChatMessage, value: AiFeedback) => void;
  placeholder?: string;
  /** Shown in the middle while there are no messages. */
  empty?: ReactNode;
  /** Shown above the list. */
  header?: ReactNode;
  attachments?: PromptAttachment[]; onAttach?: () => void; onRemoveAttachment?: (id: string | number) => void;
  model?: string; onModelPress?: () => void;
  /** Anything else for the PromptInput. */
  inputProps?: Partial<PromptInputProps>;
  /** Height of whatever sits above the Chat (a navigation header), for KeyboardAvoidingView on iOS. */
  keyboardVerticalOffset?: number;
  jumpLabel?: string;
  /** The Chat fills its parent (flex: 1); give the parent a height. */
  style?: StyleProp<ViewStyle>; contentStyle?: StyleProp<ViewStyle>;
}
export const Chat: ComponentType<ChatProps>;

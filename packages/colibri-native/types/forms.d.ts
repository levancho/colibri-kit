// Declarations for src/forms.js: inputs and selection controls.
import type { ComponentType, ReactNode, Ref } from "react";
import type { PressableProps, StyleProp, TextInput, TextInputProps, TextStyle, View, ViewProps, ViewStyle } from "react-native";

export type ControlSize = "s" | "m" | "l";
type Gap = "3xs" | "2xs" | "xs" | "s" | "m" | "l" | "xl" | "2xl" | number;

// ---------------------------------------------------------------- field
/** What a control reads from the Field around it. */
export interface FieldState {
  label?: string; invalid: boolean; required: boolean; disabled: boolean;
  /** Element ids for aria-labelledby and aria-describedby on the web. */
  labelId: string; describedBy?: string;
  /** Point this at the control so that pressing the label focuses it. */
  controlRef: { current: { focus?: () => void } | null };
}
/** The Field around the calling component, or null. Use it to wire a custom control. */
export function useField(): FieldState | null;

export interface FieldProps extends ViewProps {
  label?: ReactNode; description?: ReactNode;
  /** A message marks the control invalid and is announced; true marks it invalid without a message. */
  error?: ReactNode | boolean;
  /** Shows the required mark and tells assistive technology. */
  required?: boolean; disabled?: boolean; gap?: Gap;
}
export const Field: ComponentType<FieldProps>;

// ---------------------------------------------------------------- inputs
export interface InputProps extends Omit<TextInputProps, "style"> {
  size?: ControlSize; invalid?: boolean; disabled?: boolean;
  /** Blocks editing without the disabled look. */
  readOnly?: boolean;
  /** Shown inside the box before / after the text: an icon, a unit, a small button. Strings are rendered muted. */
  leading?: ReactNode; trailing?: ReactNode;
  /** Style of the box. */
  style?: StyleProp<ViewStyle>;
  /** Style of the text. */
  inputStyle?: StyleProp<TextStyle>;
  ref?: Ref<TextInput>;
}
export const Input: ComponentType<InputProps>;

export interface InputAddonProps {
  children?: ReactNode;
  /** Makes the add-on a button. */
  onPress?: PressableProps["onPress"]; accessibilityLabel?: string;
  /** Which edge of the input it is attached to; draws the separating line. */
  side?: "start" | "end"; style?: StyleProp<ViewStyle>;
}
export const InputAddon: ComponentType<InputAddonProps>;

export interface InputGroupProps extends InputProps {
  /** Text, or an element such as <InputAddon onPress={…}>Copy</InputAddon>. */
  prefix?: ReactNode; suffix?: ReactNode;
}
export const InputGroup: ComponentType<InputGroupProps>;

export interface TextareaProps extends Omit<InputProps, "multiline" | "leading" | "trailing"> {
  /** Height when empty, in lines (default 3). */
  minRows?: number;
  /** Grows up to this many lines, then scrolls (default 8). */
  maxRows?: number;
  /** false keeps the height at minRows. */
  autoGrow?: boolean;
  /** Character counter under the box. On by default when maxLength is set. */
  showCount?: boolean;
}
export const Textarea: ComponentType<TextareaProps>;

export interface PasswordInputProps extends Omit<InputProps, "trailing" | "secureTextEntry"> {
  /** Whether the password is readable. Controlled with onVisibleChange, or start with defaultVisible. */
  visible?: boolean; defaultVisible?: boolean; onVisibleChange?: (visible: boolean) => void;
  /** Button text; the accessible label is "<label> password". Defaults: "Show" and "Hide". */
  showLabel?: string; hideLabel?: string;
}
export const PasswordInput: ComponentType<PasswordInputProps>;

export interface PinInputProps extends Omit<TextInputProps, "value" | "defaultValue" | "onChange" | "onChangeText" | "style" | "maxLength" | "secureTextEntry"> {
  /** Number of boxes (default 6). */
  length?: number;
  value?: string; defaultValue?: string; onChange?: (value: string) => void;
  /** Called once, with the full code, when the last box is filled. */
  onComplete?: (value: string) => void;
  /** numeric (default) keeps digits only and opens the number pad. */
  type?: "numeric" | "alphanumeric";
  /** Show dots instead of the characters. */
  mask?: boolean;
  size?: ControlSize; disabled?: boolean; invalid?: boolean; style?: StyleProp<ViewStyle>;
  ref?: Ref<TextInput>;
}
export const PinInput: ComponentType<PinInputProps>;

// ---------------------------------------------------------------- select and combobox
export interface SelectOption<T = string> { value: T; label: string; description?: string; disabled?: boolean }
export interface SelectGroup<T = string> { label: string; options: Array<SelectOption<T> | T> }
/** An option, a group of options, or a bare value that is its own label. */
export type SelectItem<T = string> = SelectOption<T> | SelectGroup<T> | T;

interface SelectBase<T> {
  options: Array<SelectItem<T>>;
  /** Shown when nothing is selected (default "Select…"). */
  placeholder?: string;
  /** Adds a clear button to the field. */
  clearable?: boolean;
  /** The search box. Default: shown when there are more than eight options. */
  searchable?: boolean; searchPlaceholder?: string; emptyText?: string;
  /** Sheet heading. Default: the accessible label or the Field label. */
  title?: string; doneLabel?: string; clearLabel?: string;
  size?: ControlSize; disabled?: boolean; invalid?: boolean;
  /** Control the sheet from outside. */
  open?: boolean; onOpenChange?: (open: boolean) => void;
  accessibilityLabel?: string; style?: StyleProp<ViewStyle>; testID?: string; ref?: Ref<View>;
}
export interface SingleSelectProps<T = string> extends SelectBase<T> { multiple?: false; value?: T | null; defaultValue?: T | null; onChange?: (value: T | null) => void }
export interface MultipleSelectProps<T = string> extends SelectBase<T> { multiple: true; value?: T[]; defaultValue?: T[]; onChange?: (value: T[]) => void }
export type SelectProps<T = string> = SingleSelectProps<T> | MultipleSelectProps<T>;
export function Select<T = string>(props: SelectProps<T>): ReactNode;

interface ComboboxBase<T> extends Omit<InputProps, "value" | "defaultValue" | "onChange" | "onChangeText" | "trailing" | "multiline"> {
  options?: Array<SelectOption<T> | T>;
  /** Accept text that is not in the list; the value is then the text itself. */
  allowCustom?: boolean;
  /**
   * Remote search: called (after searchDelay ms, default 250) with what was typed. Return options or a promise of
   * options, or return nothing and pass new options yourself. Local filtering is switched off.
   */
  onSearch?: (query: string) => void | Array<SelectOption<T> | T> | Promise<Array<SelectOption<T> | T> | void>;
  searchDelay?: number;
  /** Shows the busy row; set it while you load options yourself. */
  loading?: boolean;
  emptyText?: string; loadingText?: string;
  /** The word before a custom value in the list (default "Add"). */
  addLabel?: string;
  /** Tallest the suggestion list gets before it scrolls (default 232). */
  maxHeight?: number;
}
export interface SingleComboboxProps<T = string> extends ComboboxBase<T> { multiple?: false; value?: T | null; defaultValue?: T | null; onChange?: (value: T | null) => void }
export interface MultipleComboboxProps<T = string> extends ComboboxBase<T> { multiple: true; value?: T[]; defaultValue?: T[]; onChange?: (value: T[]) => void }
export type ComboboxProps<T = string> = SingleComboboxProps<T> | MultipleComboboxProps<T>;
export function Combobox<T = string>(props: ComboboxProps<T>): ReactNode;

// ---------------------------------------------------------------- groups of choices
interface ChoiceGroupProps<T> extends Omit<ViewProps, "children"> {
  value?: T[]; defaultValue?: T[]; onChange?: (value: T[]) => void;
  label?: ReactNode; description?: ReactNode; error?: ReactNode; disabled?: boolean;
}
export interface CheckboxGroupProps<T = string> extends ChoiceGroupProps<T> {
  options: Array<{ value: T; label: ReactNode; disabled?: boolean } | T>;
  /** column (default) or a wrapping row. */
  direction?: "column" | "row";
}
export function CheckboxGroup<T = string>(props: CheckboxGroupProps<T>): ReactNode;

export interface CardOption<T = string> {
  value: T; title: ReactNode; description?: ReactNode;
  /** Shown at the trailing edge: a price, a badge. */
  trailing?: ReactNode; disabled?: boolean;
}
export interface CheckboxCardsProps<T = string> extends ChoiceGroupProps<T> {
  options: CardOption<T>[];
  /** Cards per row (default 1). */
  columns?: number;
}
export function CheckboxCards<T = string>(props: CheckboxCardsProps<T>): ReactNode;

export interface RadioCardsProps<T = string> extends Omit<ViewProps, "children"> {
  options: CardOption<T>[]; value?: T | null; defaultValue?: T | null; onChange?: (value: T) => void;
  label?: ReactNode; description?: ReactNode; error?: ReactNode; disabled?: boolean; columns?: number;
}
export function RadioCards<T = string>(props: RadioCardsProps<T>): ReactNode;

export interface ToggleOption<T = string> {
  value: T; label?: ReactNode;
  /** An element, or a text glyph. */
  icon?: ReactNode;
  /** Needed when the button has only an icon. */
  accessibilityLabel?: string; disabled?: boolean;
}
interface ToggleGroupBase<T> extends Omit<ViewProps, "children"> {
  options: Array<ToggleOption<T> | T>;
  /** Keep at least one button on. */
  required?: boolean;
  size?: ControlSize; disabled?: boolean;
  /** Fill the width. */
  block?: boolean;
}
export interface SingleToggleGroupProps<T = string> extends ToggleGroupBase<T> { type?: "single"; value?: T | null; defaultValue?: T | null; onChange?: (value: T | null) => void }
export interface MultipleToggleGroupProps<T = string> extends ToggleGroupBase<T> { type: "multiple"; value?: T[]; defaultValue?: T[]; onChange?: (value: T[]) => void }
export type ToggleGroupProps<T = string> = SingleToggleGroupProps<T> | MultipleToggleGroupProps<T>;
export function ToggleGroup<T = string>(props: ToggleGroupProps<T>): ReactNode;

export interface SegmentOption<T = string> { value: T; label?: ReactNode; icon?: ReactNode; accessibilityLabel?: string; disabled?: boolean }
/** Takes the same value, onChange and options as Tabs, and adds size, icons and defaultValue. */
export interface SegmentedControlProps<T = string> extends Omit<ViewProps, "children"> {
  options: Array<SegmentOption<T> | T>; value?: T; defaultValue?: T; onChange?: (value: T) => void;
  size?: ControlSize; disabled?: boolean;
}
export function SegmentedControl<T = string>(props: SegmentedControlProps<T>): ReactNode;

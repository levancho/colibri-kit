// Declarations for src/base.js: surfaces, typography and small building blocks (web catalog group "Base").
import type { ComponentType, ReactNode } from "react";
import type { PressableProps, StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import type { ButtonProps, Gap, TextProps, Tone } from "../index";

type Size = "s" | "m" | "l";
/** A text glyph, an element, or a function that draws the icon in the control's colour and size. */
export type IconSource = ReactNode | ((icon: { color: string; size: number }) => ReactNode);

// ---- structure
export interface InsetProps extends ViewProps { side?: "top" | "bottom" | "x" | "all"; /** Padding of the surface it sits in. */ pad?: Gap; clip?: boolean }
export const Inset: ComponentType<InsetProps>;

// ---- typography
export interface BlockquoteProps extends ViewProps { cite?: ReactNode }
export const Blockquote: ComponentType<BlockquoteProps>;
export const Code: ComponentType<TextProps>;
export const Lead: ComponentType<TextProps>;
export const Small: ComponentType<TextProps>;
export const Muted: ComponentType<TextProps>;

// ---- link
export interface LinkProps extends TextProps { href?: string; current?: boolean; disabled?: boolean; tone?: Tone }
export const Link: ComponentType<LinkProps>;

// ---- icon button
export interface IconButtonProps extends Omit<ButtonProps, "title" | "icon" | "block"> { icon?: ReactNode; /** Announced by screen readers. */ label: string; shape?: "square" | "round" }
export const IconButton: ComponentType<IconButtonProps>;

// ---- alert
export interface AlertProps extends ViewProps {
  tone?: Tone; title?: ReactNode; /** A glyph or element; null removes the icon. */ icon?: ReactNode; action?: ReactNode;
  dismissible?: boolean; visible?: boolean; onDismiss?: () => void; closeLabel?: string;
}
export const Alert: ComponentType<AlertProps>;

// ---- disclosure
export interface AccordionItem { value: string; title: ReactNode; content: ReactNode; disabled?: boolean }
interface AccordionBase extends ViewProps { items: AccordionItem[] }
export interface AccordionSingleProps extends AccordionBase { type?: "single"; collapsible?: boolean; value?: string | null; defaultValue?: string | null; onChange?: (value: string | null) => void }
export interface AccordionMultipleProps extends AccordionBase { type: "multiple"; value?: string[]; defaultValue?: string[]; onChange?: (value: string[]) => void }
export type AccordionProps = AccordionSingleProps | AccordionMultipleProps;
export const Accordion: ComponentType<AccordionProps>;
export interface CollapsibleProps extends ViewProps {
  trigger: ReactNode | ((open: boolean) => ReactNode); open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; disabled?: boolean; gap?: Gap;
}
export const Collapsible: ComponentType<CollapsibleProps>;

// ---- toggle, button group, toolbar
export interface ToggleProps extends Omit<PressableProps, "children" | "style"> {
  pressed?: boolean; defaultPressed?: boolean; onChange?: (pressed: boolean) => void; icon?: ReactNode; /** Announced by screen readers; needed for icon-only toggles. */ label?: string;
  variant?: "ghost" | "outline"; size?: Size; children?: ReactNode; style?: StyleProp<ViewStyle>; textStyle?: StyleProp<TextStyle>;
}
export const Toggle: ComponentType<ToggleProps>;
export interface ButtonGroupOption<V extends string = string> { value: V; label?: ReactNode; icon?: IconSource; accessibilityLabel?: string; disabled?: boolean; textStyle?: StyleProp<TextStyle> }
interface ButtonGroupBase<V extends string> extends ViewProps {
  options: ButtonGroupOption<V>[]; onAction?: (value: V) => void; orientation?: "horizontal" | "vertical"; size?: Size; block?: boolean; disabled?: boolean; /** Names the group for screen readers. */ label?: string;
}
export interface ButtonGroupActionProps<V extends string = string> extends ButtonGroupBase<V> { type?: undefined }
export interface ButtonGroupSingleProps<V extends string = string> extends ButtonGroupBase<V> { type: "single"; required?: boolean; value?: V | null; defaultValue?: V | null; onChange?: (value: V | null) => void }
export interface ButtonGroupMultipleProps<V extends string = string> extends ButtonGroupBase<V> { type: "multiple"; required?: boolean; value?: V[]; defaultValue?: V[]; onChange?: (value: V[]) => void }
export type ButtonGroupProps<V extends string = string> = ButtonGroupActionProps<V> | ButtonGroupSingleProps<V> | ButtonGroupMultipleProps<V>;
export function ButtonGroup<V extends string = string>(props: ButtonGroupProps<V>): ReactNode;
export interface ToolbarProps extends ViewProps { /** Names the toolbar for screen readers. */ label?: string; gap?: Gap; wrap?: boolean }
export const Toolbar: ComponentType<ToolbarProps>;
export const ToolbarSeparator: ComponentType<{ style?: StyleProp<ViewStyle> }>;
export const ToolbarSpacer: ComponentType<{}>;

// ---- item
export interface ItemProps extends ViewProps {
  /** A text glyph (shown in a tile) or any element such as an Avatar. */ media?: ReactNode; title?: ReactNode; description?: ReactNode; actions?: ReactNode;
  onPress?: PressableProps["onPress"]; disabled?: boolean; /** Defaults to true for pressable rows without actions. */ chevron?: boolean;
}
export const Item: ComponentType<ItemProps>;
export interface ItemGroupProps extends ViewProps { /** Names the list for screen readers. */ label?: string; divided?: boolean }
export const ItemGroup: ComponentType<ItemGroupProps>;

// ---- theme switch
export type SchemeChoice = "light" | "dark" | "auto";
export interface ThemeSwitchProps {
  value?: SchemeChoice; defaultValue?: SchemeChoice; onChange?: (value: SchemeChoice) => void; variant?: "segmented" | "button"; size?: Size;
  labels?: Partial<Record<SchemeChoice, string>>; label?: string; block?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>; testID?: string;
}
export const ThemeSwitch: ComponentType<ThemeSwitchProps>;

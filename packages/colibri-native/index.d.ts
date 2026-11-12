import type { ComponentType, ReactNode, Ref } from "react";
import type { ActivityIndicatorProps, FlatListProps, ImageSourcePropType, PressableProps, ScrollViewProps, StyleProp, SwitchProps as NativeSwitchProps, TextInput, TextInputProps, TextProps as NativeTextProps, TextStyle, View, ViewProps, ViewStyle } from "react-native";

export type Scheme = "light" | "dark";
export type SpaceToken = "3xs" | "2xs" | "xs" | "s" | "m" | "l" | "xl" | "2xl";
export type TextToken = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
export type RadiusName = "sharp" | "soft" | "round";
/** ok | warn | bad are canonical; success | warning | danger | destructive are aliases. */
export type Tone = "accent" | "ok" | "warn" | "bad" | "success" | "warning" | "danger" | "destructive";
export type Gap = SpaceToken | number;

export interface ThemeOptions { hue?: number; chroma?: number; scheme?: Scheme; radius?: RadiusName }
export interface Shadow { shadowColor: string; shadowOffset: { width: number; height: number }; shadowOpacity: number; shadowRadius: number; elevation: number; boxShadow: string }
export interface ToneColors { fg: string; soft: string; tint: string; inverse: string }
export interface Theme {
  scheme: Scheme; hue: number; chroma: number; touch: number;
  colors: Record<"bg" | "surface" | "sunken" | "fg" | "muted" | "line" | "accent" | "accentSoft" | "accentPressed" | "brandFg" | "ok" | "warn" | "bad" | "badPressed" | "overlay" | "shadow", string>;
  tones: Record<"accent" | "ok" | "warn" | "bad", ToneColors>;
  space: Record<SpaceToken, number>; text: Record<TextToken, number>;
  radius: { s: number; m: number; l: number; full: number };
  shadow: { s: Shadow; m: Shadow; l: Shadow };
}
export function createTheme(options?: ThemeOptions): Theme;
export const space: Record<SpaceToken, number>;
export const text: Record<TextToken, number>;
export function oklch(lightness: number, chroma: number, hue: number, alpha?: number): string;
export function oklchToRgb(lightness: number, chroma: number, hue: number): [number, number, number];

export interface ColibriProviderProps { hue?: number; chroma?: number; radius?: RadiusName; scheme?: "auto" | Scheme; children?: ReactNode }
export const ColibriProvider: ComponentType<ColibriProviderProps>;
export function useTheme(): Theme;

export interface ScreenProps extends ScrollViewProps { scroll?: boolean; padded?: boolean; gap?: Gap; contentStyle?: StyleProp<ViewStyle> }
export const Screen: ComponentType<ScreenProps>;
export interface StackProps extends ViewProps { gap?: Gap; align?: ViewStyle["alignItems"]; justify?: ViewStyle["justifyContent"]; ref?: Ref<View> }
export const Stack: ComponentType<StackProps>;
export interface ClusterProps extends StackProps { wrap?: boolean }
export const Cluster: ComponentType<ClusterProps>;
export const Divider: ComponentType<{ style?: StyleProp<ViewStyle> }>;

export interface TextProps extends NativeTextProps { size?: TextToken; tone?: Tone | "muted"; weight?: "regular" | "medium" | "semibold" | "bold" | TextStyle["fontWeight"]; align?: TextStyle["textAlign"] }
export const Text: ComponentType<TextProps>;
export interface HeadingProps extends TextProps { level?: 1 | 2 | 3 | 4 }
export const Heading: ComponentType<HeadingProps>;

export interface ButtonProps extends Omit<PressableProps, "children" | "style"> {
  title?: string; children?: ReactNode; variant?: "solid" | "soft" | "outline" | "ghost" | "danger" | "destructive"; size?: "s" | "m" | "l";
  icon?: ReactNode; loading?: boolean; block?: boolean; style?: StyleProp<ViewStyle>; textStyle?: StyleProp<TextStyle>;
}
export const Button: ComponentType<ButtonProps>;

export interface CardProps extends ViewProps { gap?: Gap; padded?: boolean; onPress?: PressableProps["onPress"] }
export const Card: ComponentType<CardProps>;
export interface BadgeProps extends ViewProps { tone?: Tone }
export const Badge: ComponentType<BadgeProps>;
export interface CalloutProps extends ViewProps { tone?: Tone; title?: string }
export const Callout: ComponentType<CalloutProps>;
export interface AvatarProps { name?: string; source?: ImageSourcePropType; size?: number; style?: StyleProp<ViewStyle> }
export const Avatar: ComponentType<AvatarProps>;

export interface TextFieldProps extends Omit<TextInputProps, "style"> { label?: string; hint?: string; error?: string; style?: StyleProp<ViewStyle>; inputStyle?: StyleProp<TextStyle>; ref?: Ref<TextInput> }
export const TextField: ComponentType<TextFieldProps>;
export interface SwitchProps extends NativeSwitchProps { label?: ReactNode }
export const Switch: ComponentType<SwitchProps>;
export interface CheckboxProps { checked?: boolean; onChange?: (checked: boolean) => void; label?: ReactNode; disabled?: boolean }
export const Checkbox: ComponentType<CheckboxProps>;
export interface Option<T = string> { value: T; label: string; disabled?: boolean }
export interface RadioGroupProps<T = string> { value?: T; onChange?: (value: T) => void; options: Option<T>[]; disabled?: boolean; style?: StyleProp<ViewStyle> }
export function RadioGroup<T = string>(props: RadioGroupProps<T>): ReactNode;
export interface TabsProps<T = string> { value?: T; onChange?: (value: T) => void; options: Option<T>[]; style?: StyleProp<ViewStyle> }
export function Tabs<T = string>(props: TabsProps<T>): ReactNode;

export interface ListItemProps { title: string; subtitle?: string; leading?: ReactNode; trailing?: ReactNode; onPress?: PressableProps["onPress"]; style?: StyleProp<ViewStyle> }
export const ListItem: ComponentType<ListItemProps>;
export function List<T>(props: FlatListProps<T> & { divided?: boolean }): ReactNode;
export interface SpinnerProps extends ActivityIndicatorProps { tone?: Tone }
export const Spinner: ComponentType<SpinnerProps>;
export interface ProgressProps { value?: number; tone?: Tone; style?: StyleProp<ViewStyle> }
export const Progress: ComponentType<ProgressProps>;

export interface DialogProps { visible: boolean; onClose?: () => void; title?: string; children?: ReactNode; actions?: ReactNode; dismissible?: boolean }
export const Dialog: ComponentType<DialogProps>;
export interface SheetProps { visible: boolean; onClose?: () => void; title?: string; children?: ReactNode }
export const Sheet: ComponentType<SheetProps>;
export interface ToastOptions { tone?: Tone; /** milliseconds; 0 keeps it until pressed */ duration?: number }
export const ToastProvider: ComponentType<{ children?: ReactNode; offset?: number }>;
export function useToast(): { show(message: string, options?: ToastOptions): void; hide(): void };

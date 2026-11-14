// Declarations for src/blocks.js: the sign-in and sign-up screens and the pieces they are made of.
import type { ComponentType, ReactNode, Ref } from "react";
import type { PressableProps, StyleProp, TextInput, TextInputProps, TextStyle, ViewProps, ViewStyle } from "react-native";

/** A handler may return a promise. The block shows its busy state until it settles, stays on the same step if the answer is false, and shows the message of a rejection. */
export type AuthResult = void | boolean | Promise<void | boolean>;
/** A provider id known to the kit, or your own. */
export type AuthProviderId = "google" | "apple" | "github" | "meta" | "microsoft" | "x" | (string & {});
/** A provider as an id, or with its own name and letter mark. */
export type AuthProvider = AuthProviderId | { id: string; name?: string; mark?: string };

export interface AuthLinkProps extends Omit<PressableProps, "children" | "style"> { title?: string; children?: ReactNode; size?: "xs" | "sm" | "md"; style?: StyleProp<ViewStyle> }
/** A text link with a full-size touch target. */
export const AuthLink: ComponentType<AuthLinkProps>;

export interface AuthBrandProps { name?: string; /** the letter in the square; defaults to the first letter of name */ mark?: string; size?: number; /** for use on an accent background */ inverse?: boolean; showName?: boolean; style?: StyleProp<ViewStyle> }
/** The product mark (a letter in a rounded square) and name. */
export const AuthBrand: ComponentType<AuthBrandProps>;

export interface AuthHeaderProps { title?: string; subtitle?: ReactNode; align?: "left" | "center"; /** shown above the title, for a logo */ children?: ReactNode; style?: StyleProp<ViewStyle> }
/** Title and one line of explanation at the top of a form. */
export const AuthHeader: ComponentType<AuthHeaderProps>;

export interface AuthCardProps extends ViewProps { gap?: "3xs" | "2xs" | "xs" | "s" | "m" | "l" | "xl" | "2xl" | number }
/** The surface an auth form sits on: a Card with roomier padding. */
export const AuthCard: ComponentType<AuthCardProps>;

export interface OrDividerProps { label?: string; style?: StyleProp<ViewStyle> }
/** A rule with a word in the middle. */
export const OrDivider: ComponentType<OrDividerProps>;

export interface SocialButtonProps extends Omit<PressableProps, "children" | "style" | "onPress"> {
  provider: AuthProvider;
  /** the whole label; defaults to verb + provider name */ label?: string;
  /** letters, or any element, shown as the badge (never a brand logo by default) */ mark?: ReactNode;
  /** "Continue with" by default */ verb?: string;
  /** show only the mark; the label becomes the accessibility label */ iconOnly?: boolean;
  onPress?: (provider: string) => void; style?: StyleProp<ViewStyle>;
}
/** "Continue with Google": an outline button with a letter mark. */
export const SocialButton: ComponentType<SocialButtonProps>;

export interface AuthLegalProps { prefix?: string; onLegal?: (document: "terms" | "privacy") => void; style?: StyleProp<TextStyle> }
/** "By continuing, you agree to our Terms of Service and Privacy Policy." */
export const AuthLegal: ComponentType<AuthLegalProps>;

export interface AuthCoverProps { /** solid: accent panel with a headline. soft: tinted band with a centred mark. */ variant?: "solid" | "soft"; brand?: string | null; title?: string; text?: string; height?: number; /** replaces the brand and copy */ children?: ReactNode; style?: StyleProp<ViewStyle> }
/** A brand panel that stands in for the cover image of the web blocks. */
export const AuthCover: ComponentType<AuthCoverProps>;

export interface AuthFieldProps extends Omit<TextInputProps, "style"> {
  label?: string; hint?: string; error?: string;
  /** shown at the end of the label row, for example a "Forgot your password?" link */ action?: ReactNode;
  /** a password: hidden text with a Show / Hide control */ secure?: boolean;
  style?: StyleProp<ViewStyle>; inputStyle?: StyleProp<TextStyle>; ref?: Ref<TextInput>;
}
/** Label, input and an error or hint line; with secure, a password field with a show/hide control. */
export const AuthField: ComponentType<AuthFieldProps>;

export interface AuthCodeInputProps {
  /** the digits typed so far */ value?: string; defaultValue?: string; onChange?: (code: string) => void;
  /** called once every box is filled */ onComplete?: (code: string) => void;
  length?: number; /** accessibility label */ label?: string; error?: string; disabled?: boolean; autoFocus?: boolean; style?: StyleProp<ViewStyle>; ref?: Ref<TextInput>;
}
/** A one-time code input: one real input over a row of boxes, so paste and SMS autofill work. */
export const AuthCodeInput: ComponentType<AuthCodeInputProps>;

interface AuthBlockProps<View extends string> {
  title?: string; subtitle?: string;
  /** a brand name, or any element; null hides it. Blocks 02, 03 and 04 and Login05 show "Acme Inc" by default; the others show a logo only when given one. */ logo?: ReactNode;
  /** replaces the brand panel of the 02 and 04 blocks; null removes it */ cover?: ReactNode;
  /** shows the busy state and disables the form */ loading?: boolean;
  /** a message from your server, shown above the form */ error?: string | null;
  /** the provider buttons; [] for none. Each block has its own default. */ providers?: AuthProvider[];
  /** digits in the one-time code (default 6) */ codeLength?: number;
  /** show the "By continuing, you agree…" line */ legal?: boolean;
  /** the step shown; leave out to let the block move between steps by itself */ view?: View; defaultView?: View; onViewChange?: (view: View) => void;
  onSocial?: (provider: string) => void;
  /** the link to the other screen ("Sign up" on a login block, "Sign in" on a signup block) */ onSwitch?: () => void;
  /** the code step was submitted with a complete code; then the block shows its done step */ onVerify?: (code: string) => AuthResult;
  onResend?: (email: string) => void;
  onLegal?: (document: "terms" | "privacy") => void;
  style?: StyleProp<ViewStyle>; testID?: string;
}

export type LoginView = "password" | "magic-link" | "forgot" | "sent" | "otp" | "done";
export interface LoginValues { email: string; password: string; remember: boolean }
export interface LoginProps extends AuthBlockProps<LoginView> {
  /** the form passed validation */ onSubmit?: (values: LoginValues) => AuthResult;
  /** the built-in "Reset your password" step was submitted with a valid email */ onForgotPassword?: (email: string) => AuthResult;
  /** the built-in magic-link step was submitted with a valid email */ onMagicLink?: (email: string) => AuthResult;
  /** show "Remember me" (default true) */ remember?: boolean;
  /** offer "Email me a magic link instead" (default true) */ magicLink?: boolean;
  /** after onSubmit, ask for a one-time code (default false) */ verification?: boolean;
  defaultValues?: { email?: string; remember?: boolean };
}
export interface Login05Props extends Omit<LoginProps, "onSubmit" | "onMagicLink" | "onForgotPassword" | "remember" | "magicLink" | "subtitle" | "view" | "defaultView" | "onViewChange" | "defaultValues"> {
  /** replaces the "Don't have an account? Sign up" line under the title */ subtitle?: string;
  /** a valid email was entered; send the code (or the link) */ onSubmit?: (values: { email: string }) => AuthResult;
  /** true (default): continue to the code step. false: show "Check your email" for a link instead. */ verification?: boolean;
  view?: "magic-link" | "sent" | "otp" | "done"; defaultView?: "magic-link" | "sent" | "otp" | "done"; onViewChange?: (view: "magic-link" | "sent" | "otp" | "done") => void;
  defaultValues?: { email?: string };
}
/** login-01: a simple card with email, password, remember me and Google, plus magic-link, reset and code steps. */
export const Login01: ComponentType<LoginProps>;
/** login-02: the two-column layout on a phone: an accent brand panel above an open form, with GitHub. */
export const Login02: ComponentType<LoginProps>;
/** login-03: a card on a muted panel, brand above, Apple and Google before the email form. */
export const Login03: ComponentType<LoginProps>;
/** login-04: form and image in one card: a tinted cover band, the form, and providers as a row of marks. */
export const Login04: ComponentType<LoginProps>;
/** login-05: email only; a one-time code (or a link) signs the person in. Apple and Google below. */
export const Login05: ComponentType<Login05Props>;

export type SignupView = "signup" | "otp" | "done";
export interface SignupValues { name: string; email: string; password: string; terms: true }
export interface SignupProps extends AuthBlockProps<SignupView> {
  /** the form passed validation */ onSubmit?: (values: SignupValues) => AuthResult;
  /** after onSubmit, ask for the emailed code (default true) */ verification?: boolean;
  /** default 8 */ minPasswordLength?: number;
  termsLabel?: string;
  defaultValues?: { name?: string; email?: string };
}
/** signup-01: a simple card with name, email, password and confirmation, terms and Google, then an email code. */
export const Signup01: ComponentType<SignupProps>;
/** signup-02: the two-column layout on a phone: an accent brand panel above an open form, with GitHub. */
export const Signup02: ComponentType<SignupProps>;
/** signup-03: a card on a muted panel, brand above, Apple and Google first, legal line below. */
export const Signup03: ComponentType<SignupProps>;
/** signup-04: form and image in one card: a tinted cover band on top and the form below. */
export const Signup04: ComponentType<SignupProps>;
/** signup-05: leads with Apple, Google and GitHub on an open page, then the email form. */
export const Signup05: ComponentType<SignupProps>;

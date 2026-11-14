// Sign-in and sign-up screens: Login01 … Login05 and Signup01 … Signup05, plus the pieces they are made of.
// Each block is a complete, phone-first screen section. It validates on the device, shows accessible errors
// and reports through callbacks; it never talks to a network. A callback may return a promise: the block
// shows the busy state until it settles, stays where it is if it resolves to false, and shows the message
// of a rejection. Built on the basics only (components.js), so it has no dependency on the other groups.
//
// What a phone does differently from the web blocks: the two-column and form-plus-image layouts stack (the
// cover becomes a brand panel above the form), provider logos are letter marks (no SVG, no brand images),
// and password + confirm sit one under the other instead of side by side.
import { createElement as h, forwardRef, useEffect, useId, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from "react-native";
import { useTheme } from "./provider.js";
import { web, depth, flat, GLYPH } from "./internal.js";
import { Stack, Cluster, Text, Heading, Button, Card, Callout, Checkbox } from "./components.js";

// ---------------------------------------------------------------- pieces
/** A text link with a full-size touch target. Pass the label as title or children. */
export function AuthLink({ title, children, onPress, size = "sm", disabled = false, style, ...rest }) {
  const theme = useTheme(), slop = Math.max(0, Math.round((theme.touch - theme.text[size] * 1.5) / 2));
  return h(Pressable, { onPress, disabled, accessibilityRole: "link", accessibilityState: { disabled }, "aria-disabled": disabled, hitSlop: { top: slop, bottom: slop, left: 8, right: 8 },
    style: ({ pressed }) => flat({ opacity: disabled ? 0.5 : pressed ? 0.6 : 1 }, style), ...rest },
    h(Text, { size, weight: "semibold", tone: "accent", style: { textDecorationLine: "underline" } }, children ?? title));
}

/** The product mark (a letter in a rounded square) and name. inverse is for use on an accent background. */
export function AuthBrand({ name = "Acme Inc", mark, size = 28, inverse = false, showName = true, style }) {
  const theme = useTheme(), c = theme.colors;
  return h(View, { accessibilityLabel: name, style: flat({ flexDirection: "row", alignItems: "center", gap: theme.space.xs }, style) },
    h(View, { style: { width: size, height: size, borderRadius: Math.min(theme.radius.s, size / 2), alignItems: "center", justifyContent: "center", backgroundColor: inverse ? c.brandFg : c.accent } },
      h(Text, { weight: "bold", style: { color: inverse ? c.accent : c.brandFg, fontSize: Math.round(size * 0.5), lineHeight: Math.round(size * 0.68) } }, mark ?? String(name).trim().charAt(0).toUpperCase())),
    showName ? h(Text, { weight: "semibold", style: inverse ? { color: c.brandFg } : null }, name) : null);
}

/** Title and one line of explanation at the top of a form. */
export function AuthHeader({ title, subtitle, align = "left", children, style }) {
  const theme = useTheme();
  return h(View, { style: flat({ gap: theme.space["2xs"], alignItems: align === "center" ? "center" : "flex-start" }, style) },
    children,
    title ? h(Heading, { level: 2, align }, title) : null,
    typeof subtitle === "string" ? h(Text, { size: "sm", tone: "muted", align }, subtitle) : subtitle);
}

/** The surface an auth form sits on: a Card with roomier padding and spacing. */
export function AuthCard({ gap = "m", style, children, ...rest }) {
  const theme = useTheme();
  return h(Card, { gap, style: flat({ padding: theme.space.l, ...depth(theme.shadow.m) }, style), ...rest }, children);
}

/** A rule with a word in the middle: "Or", "Or continue with". */
export function OrDivider({ label = "Or", style }) {
  const theme = useTheme(), line = h(View, { style: { flex: 1, height: 1, backgroundColor: theme.colors.line } });
  return h(View, { style: flat({ flexDirection: "row", alignItems: "center", gap: theme.space.s }, style) }, line, h(Text, { size: "xs", tone: "muted" }, label), line);
}

const PROVIDERS = { google: { name: "Google", mark: "G" }, apple: { name: "Apple", mark: "A" }, github: { name: "GitHub", mark: "GH" }, meta: { name: "Meta", mark: "M" }, microsoft: { name: "Microsoft", mark: "MS" }, x: { name: "X", mark: "X" } };
const providerOf = (provider) => {
  const id = typeof provider === "string" ? provider : provider?.id, known = PROVIDERS[id] ?? {}, name = provider?.name ?? known.name ?? String(id ?? "").replace(/^./, (letter) => letter.toUpperCase());
  return { id, name, mark: provider?.mark ?? known.mark ?? name.charAt(0).toUpperCase() };
};
/**
 * "Continue with Google". provider is an id (google, apple, github, meta, microsoft, x, or your own) or
 * { id, name, mark }. The mark is a letter badge, not the provider's logo. iconOnly shows just the mark.
 */
export function SocialButton({ provider, label, mark, verb = "Continue with", iconOnly = false, onPress, disabled = false, style, ...rest }) {
  const theme = useTheme(), c = theme.colors, info = providerOf(provider), text = label ?? `${verb} ${info.name}`, letters = mark ?? info.mark;
  const badge = typeof letters === "string" ? h(View, { style: { minWidth: 22, height: 22, paddingHorizontal: 4, borderRadius: theme.radius.full, alignItems: "center", justifyContent: "center", backgroundColor: c.fg } },
    h(Text, { weight: "bold", style: { color: c.bg, fontSize: 11, lineHeight: 14 } }, letters)) : letters;
  return h(Button, { variant: "outline", size: "l", block: !iconOnly, icon: badge, disabled, onPress: () => onPress?.(info.id), accessibilityLabel: text,
    style: flat({ backgroundColor: c.surface }, iconOnly && { flex: 1, paddingHorizontal: 0 }, style), ...rest }, iconOnly ? null : text);
}

/** "By continuing, you agree to our Terms of Service and Privacy Policy." onLegal receives "terms" or "privacy". */
export function AuthLegal({ prefix = "By continuing, you agree to our", onLegal, style }) {
  const link = (which, label) => h(Text, { size: "xs", tone: "muted", weight: "medium", accessibilityRole: "link", onPress: () => onLegal?.(which), style: { textDecorationLine: "underline" } }, label);
  return h(Text, { size: "xs", tone: "muted", align: "center", style }, prefix, " ", link("terms", "Terms of Service"), " and ", link("privacy", "Privacy Policy"), ".");
}

/**
 * A brand panel that stands in for the cover image of the web blocks. variant "solid" is an accent panel with
 * a headline and a line of text; "soft" is a tinted band with a centred mark. Shapes are drawn with Views.
 */
export function AuthCover({ variant = "solid", brand = "Acme Inc", title, text, height, children, style }) {
  const theme = useTheme(), c = theme.colors, solid = variant !== "soft", ink = solid ? c.brandFg : c.accent;
  const ring = (size, position, filled) => h(View, { key: `${size}${filled}`, pointerEvents: "none", style: { position: "absolute", width: size, height: size, borderRadius: size / 2, opacity: filled ? 0.1 : 0.22,
    backgroundColor: filled ? ink : undefined, borderWidth: filled ? 0 : 1.5, borderColor: ink, ...position } });
  const shapes = solid ? [ring(220, { top: -90, right: -70 }, true), ring(140, { bottom: -60, left: -40 }, true), ring(300, { top: -130, right: -110 }, false)]
    : [ring(96, { alignSelf: "center" }, false), ring(168, { alignSelf: "center" }, false), ring(250, { alignSelf: "center" }, false), ring(340, { alignSelf: "center" }, false)];
  return h(View, { style: flat({ minHeight: height ?? (solid ? 176 : 128), overflow: "hidden", justifyContent: solid ? "space-between" : "center", alignItems: solid ? "stretch" : "center", gap: theme.space.l,
    padding: theme.space.l, borderRadius: solid ? theme.radius.l : 0, backgroundColor: solid ? c.accent : c.accentSoft }, style) },
    shapes,
    children ?? [
      brand ? h(AuthBrand, { key: "brand", name: brand, inverse: solid, size: solid ? 28 : 44, showName: solid }) : null,
      title || text ? h(View, { key: "copy", style: { gap: theme.space["2xs"] } },
        title ? h(Text, { size: "lg", weight: "semibold", style: { color: ink } }, title) : null,
        text ? h(Text, { size: "sm", style: { color: ink, opacity: 0.85 } }, text) : null) : null,
    ]);
}

/**
 * Label, input and an error or hint line. secure adds a Show / Hide control inside the input. action is
 * anything shown at the end of the label row (a "Forgot your password?" link). TextInput props pass through.
 */
export const AuthField = forwardRef(function AuthField({ label, hint, error, action, secure = false, editable = true, style, inputStyle, onFocus, onBlur, ...rest }, ref) {
  const theme = useTheme(), c = theme.colors, [focused, setFocused] = useState(false), [shown, setShown] = useState(false), noteId = useId();
  const note = error || hint;
  return h(View, { style: flat({ gap: theme.space["2xs"] }, style) },
    label || action ? h(View, { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.space.xs } },
      h(Text, { size: "sm", weight: "semibold", style: flat({ flexShrink: 1 }, error && { color: c.bad }) }, label), action) : null,
    h(View, { style: { minHeight: theme.touch, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: error ? c.bad : focused ? c.accent : c.line, borderRadius: theme.radius.s, backgroundColor: c.surface, opacity: editable ? 1 : 0.5,
      ...(web && (focused || error) ? { boxShadow: `0 0 0 1px ${error ? c.bad : c.accent}` } : null) } },
      h(TextInput, { ref, editable, accessibilityLabel: label, placeholderTextColor: c.muted, selectionColor: c.accent, secureTextEntry: secure && !shown,
        ...(web ? { "aria-invalid": !!error, "aria-describedby": note ? noteId : undefined } : null),
        onFocus: (event) => { setFocused(true); onFocus?.(event); }, onBlur: (event) => { setFocused(false); onBlur?.(event); },
        style: flat({ flex: 1, minWidth: 0, minHeight: theme.touch - 2, paddingHorizontal: 12, paddingVertical: 8, color: c.fg, fontSize: theme.text.md }, web && { outlineStyle: "none" }, inputStyle), ...rest }),
      secure ? h(Pressable, { onPress: () => setShown(!shown), disabled: !editable, accessibilityRole: "button", accessibilityLabel: `${shown ? "Hide" : "Show"} ${String(label ?? "password").toLowerCase()}`,
        accessibilityState: { selected: shown }, "aria-pressed": shown, hitSlop: 4,
        style: ({ pressed }) => ({ minHeight: theme.touch - 2, minWidth: 56, paddingHorizontal: 12, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.6 : 1 }) },
        h(Text, { size: "sm", weight: "semibold", tone: "muted" }, shown ? "Hide" : "Show")) : null),
    note ? h(Text, { nativeID: noteId, size: "xs", tone: error ? "bad" : "muted", accessibilityRole: error ? "alert" : undefined, accessibilityLiveRegion: error ? "polite" : undefined }, note) : null);
});

/**
 * A one-time code: one real input laid over a row of boxes, so typing, deleting, pasting and SMS autofill all
 * behave the way the platform does them. value is the digits typed so far; onComplete fires when all are in.
 */
export const AuthCodeInput = forwardRef(function AuthCodeInput({ value, defaultValue = "", onChange, onComplete, length = 6, label = "Verification code", error, disabled = false, autoFocus = false, style }, ref) {
  const theme = useTheme(), c = theme.colors, [inner, setInner] = useState(defaultValue), [focused, setFocused] = useState(false), noteId = useId();
  const digits = String(value ?? inner).replace(/\D/g, "").slice(0, length), active = Math.min(digits.length, length - 1);
  const change = (text) => {
    const next = text.replace(/\D/g, "").slice(0, length);
    if (next === digits) return;
    setInner(next); onChange?.(next);
    if (next.length === length) onComplete?.(next);
  };
  return h(View, { style: flat({ gap: theme.space.xs }, style) },
    h(View, { style: { flexDirection: "row", justifyContent: "center", gap: length > 6 ? theme.space["2xs"] : theme.space.xs, opacity: disabled ? 0.5 : 1 } },
      Array.from({ length }, (_, index) => {
        const on = focused && index === active;
        return h(View, { key: index, importantForAccessibility: "no-hide-descendants", accessibilityElementsHidden: true, "aria-hidden": true,
          style: { flex: 1, maxWidth: 52, height: 52, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.s, borderWidth: on || error ? 2 : 1, borderColor: error ? c.bad : on ? c.accent : c.line, backgroundColor: c.surface } },
          digits[index] ? h(Text, { size: "xl", weight: "semibold" }, digits[index]) : on ? h(View, { style: { width: 2, height: 22, borderRadius: 1, backgroundColor: c.accent } }) : null);
      }),
      // The input covers the boxes: a tap anywhere focuses it, and its own text and caret stay invisible.
      h(TextInput, { ref, value: digits, onChangeText: change, editable: !disabled, autoFocus, maxLength: web ? length : length * 2, keyboardType: "number-pad", inputMode: "numeric", returnKeyType: "done",
        autoComplete: web ? "one-time-code" : "sms-otp", textContentType: "oneTimeCode", autoCorrect: false, caretHidden: true, contextMenuHidden: false, selectionColor: "transparent",
        accessibilityLabel: label, accessibilityHint: `${length} digits`, ...(web ? { "aria-invalid": !!error, "aria-describedby": error ? noteId : undefined } : null),
        onFocus: () => setFocused(true), onBlur: () => setFocused(false),
        style: flat({ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, color: "transparent", backgroundColor: "transparent", fontSize: theme.text.md, textAlign: "center" }, web && { outlineStyle: "none", caretColor: "transparent" }) })),
    error ? h(Text, { nativeID: noteId, size: "xs", tone: "bad", align: "center", accessibilityRole: "alert", accessibilityLiveRegion: "polite" }, error) : null);
});

// ---------------------------------------------------------------- form state
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const emailRule = (value) => (!String(value).trim() ? "Enter your email address." : EMAIL.test(String(value).trim()) ? null : "Enter a valid email address, such as name@example.com.");
const codeRule = (length) => (value) => (String(value).length === length ? null : `Enter the ${length}-digit code.`);
const messageOf = (problem) => (typeof problem === "string" ? problem : problem?.message) || "Something went wrong. Try again.";

function useForm(initial) {
  const [values, setValues] = useState(initial), [errors, setErrors] = useState({}), inputs = useRef({});
  const set = (name, value) => { setValues((old) => ({ ...old, [name]: value })); setErrors((old) => (old[name] ? { ...old, [name]: null } : old)); };
  const focus = (name) => inputs.current[name]?.focus?.();
  return {
    values, errors, set, focus, clear: () => setErrors({}),
    bind: (name) => ({ ref: (node) => { inputs.current[name] = node; }, value: values[name], onChangeText: (text) => set(name, text), error: errors[name] || undefined }),
    /** rules: { field: (value, values) => message | null }. Shows every message and focuses the first field that failed. */
    check(rules) {
      const found = {}; let first;
      for (const [name, rule] of Object.entries(rules)) { const message = rule(values[name], values); if (message) { found[name] = message; first ??= name; } }
      setErrors(found); if (first) focus(first);
      return !first;
    },
  };
}

// Calls a handler; if it returns a promise, tracks it. then() runs unless the handler answered false or failed.
function useRun() {
  const [busy, setBusy] = useState(false), [failure, setFailure] = useState(null), alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const run = (handler, args, then) => {
    setFailure(null);
    let result;
    try { result = handler?.(...args); } catch (problem) { setFailure(messageOf(problem)); return; }
    if (result && typeof result.then === "function") {
      setBusy(true);
      result.then((answer) => { if (!alive.current) return; setBusy(false); if (answer !== false) then?.(); },
        (problem) => { if (!alive.current) return; setBusy(false); setFailure(messageOf(problem)); });
    } else if (result !== false) then?.();
  };
  return { busy, failure, run, reset: () => setFailure(null) };
}

function useView(props, first) {
  const [inner, setInner] = useState(props.defaultView ?? first), view = props.view ?? inner;
  return [view, (next) => { if (next === view) return; setInner(next); props.onViewChange?.(next); }];
}

// ---------------------------------------------------------------- shared views
const EMAIL_PROPS = { label: "Email", placeholder: "m@example.com", keyboardType: "email-address", inputMode: "email", autoCapitalize: "none", autoCorrect: false, autoComplete: "email", textContentType: "emailAddress" };

function Notice({ glyph, tone = "accent", title, text, align, children }) {
  const theme = useTheme(), t = theme.tones[tone];
  return h(Stack, { gap: "s", align: align === "center" ? "center" : "flex-start" },
    h(View, { style: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: t.soft } }, h(Text, { size: "xl", weight: "bold", style: { color: t.fg } }, glyph)),
    h(AuthHeader, { title, subtitle: text, align }), children);
}

const Line = ({ align, children }) => h(Cluster, { gap: "2xs", justify: align === "left" ? "flex-start" : "center" }, children);
const Problem = ({ message }) => (message ? h(Callout, { tone: "bad", accessibilityLiveRegion: "assertive" }, message) : null);

function CodeView({ form, run, busy, problem, align, length, email, onVerify, onResend, onDone, back }) {
  const [resent, setResent] = useState(false);
  const verify = (code) => { if (form.check({ code: codeRule(length) })) run.run(onVerify, [typeof code === "string" ? code : form.values.code], onDone); };
  return h(Stack, { gap: "m" },
    h(AuthHeader, { title: "Enter verification code", subtitle: `We sent a ${length}-digit code to ${email ? email.trim() : "your email"}.`, align }),
    h(Problem, { message: problem }),
    h(AuthCodeInput, { ...form.bind("code"), onChangeText: undefined, onChange: (code) => { form.set("code", code); setResent(false); }, length, disabled: busy, autoFocus: true }),
    h(Button, { title: "Verify", size: "l", block: true, loading: busy, onPress: verify }),
    h(Line, { align }, h(Text, { size: "sm", tone: "muted" }, "Didn't receive it?"), h(AuthLink, { title: "Resend", disabled: busy, onPress: () => { form.set("code", ""); run.reset(); onResend?.(email?.trim()); setResent(true); } }),
      back ? h(Text, { size: "sm", tone: "muted" }, "or") : null, back),
    resent ? h(Text, { size: "sm", tone: "ok", align, accessibilityLiveRegion: "polite" }, "A new code is on its way.") : null);
}

function Socials({ layout, providers, verb, busy, onSocial }) {
  const list = providers ?? layout.providers ?? [];
  if (!list.length) return null;
  const buttons = list.map((provider) => h(SocialButton, { key: providerOf(provider).id, provider, verb, iconOnly: layout.social === "icons", disabled: busy, onPress: onSocial }));
  return layout.social === "icons" ? h(Cluster, { gap: "xs", wrap: false }, buttons) : h(Stack, { gap: "xs" }, buttons);
}

const DEFAULT_COVER = { title: "Ship the work, skip the busywork.", text: "Plans, files and approvals in one calm place. 4,000 teams sign in every morning." };
// The frame around the form. Each numbered block picks one: card, split, muted, cover or plain.
function Shell({ layout, logo, cover, legal, onLegal, style, testID, children }) {
  const theme = useTheme(), c = theme.colors, kind = layout.shell;
  const brand = logo === undefined ? h(AuthBrand, null) : typeof logo === "string" ? h(AuthBrand, { name: logo }) : logo || null;
  const brandName = typeof logo === "string" ? logo : logo === undefined ? "Acme Inc" : null;
  const terms = (legal ?? layout.legal) ? h(AuthLegal, { onLegal, style: { paddingHorizontal: theme.space.s } }) : null;
  const sunken = { padding: theme.space.m, paddingVertical: theme.space.l, gap: theme.space.m, justifyContent: "center", borderRadius: theme.radius.l, backgroundColor: c.sunken };
  let body;
  if (kind === "card") body = h(View, { style: { gap: theme.space.m, justifyContent: "center" } }, logo ? h(View, { style: { alignItems: "center" } }, brand) : null, h(AuthCard, null, children), terms);
  else if (kind === "split") body = h(View, { style: { gap: theme.space.l } },
    cover === undefined ? h(AuthCover, { brand: brandName, ...DEFAULT_COVER }, brandName ? null : [logo ? h(View, { key: "logo" }, brand) : null]) : cover,
    h(View, { style: { gap: theme.space.m, paddingHorizontal: theme.space["2xs"] } }, children), terms);
  else if (kind === "muted") body = h(View, { style: sunken }, brand ? h(View, { style: { alignItems: "center" } }, brand) : null, h(AuthCard, null, children), terms);
  else if (kind === "cover") body = h(View, { style: sunken },
    h(Card, { padded: false, gap: 0, style: { overflow: "hidden", ...depth(theme.shadow.m) } },
      cover === undefined ? h(AuthCover, { variant: "soft", brand: brandName }, brandName ? null : [logo ? h(View, { key: "logo" }, brand) : null]) : cover,
      h(View, { style: { padding: theme.space.l, gap: theme.space.m } }, children)), terms);
  else body = h(View, { style: { gap: theme.space.l, paddingVertical: theme.space.m } }, logo ? h(View, { style: { alignItems: "center" } }, brand) : null, h(View, { style: { gap: theme.space.m } }, children), terms);
  return h(KeyboardAvoidingView, { behavior: Platform.OS === "ios" ? "padding" : undefined, style, testID }, body);
}

// ---------------------------------------------------------------- login
function LoginFlow({ layout, title, subtitle, logo, cover, loading = false, error, providers, remember: showRemember = true, magicLink = !layout.emailOnly, verification = !!layout.emailOnly, codeLength = 6, legal,
  defaultValues, onSubmit, onForgotPassword, onMagicLink, onSocial, onSwitch, onVerify, onResend, onLegal, style, testID, ...viewProps }) {
  const first = layout.emailOnly ? "magic-link" : "password", [view, setView] = useView(viewProps, first);
  const form = useForm({ email: defaultValues?.email ?? "", password: "", remember: defaultValues?.remember ?? false, code: "" }), run = useRun();
  const busy = loading || run.busy, problem = error || run.failure, align = layout.align, { values } = form, [sent, setSent] = useState("link");
  const go = (next) => { form.clear(); run.reset(); setView(next); };
  const email = values.email.trim();
  const submit = {
    password: () => form.check({ email: emailRule, password: (value) => (value ? null : "Enter your password.") }) && run.run(onSubmit, [{ email, password: values.password, remember: values.remember }], verification ? () => go("otp") : undefined),
    "magic-link": () => form.check({ email: emailRule }) && (layout.emailOnly ? run.run(onSubmit, [{ email }], verification ? () => go("otp") : () => { setSent("link"); go("sent"); })
      : run.run(onMagicLink, [email], () => { setSent("link"); go("sent"); })),
    forgot: () => form.check({ email: emailRule }) && run.run(onForgotPassword, [email], () => { setSent("reset"); go("sent"); }),
  };
  const emailField = (onDone, last = true) => h(AuthField, { ...EMAIL_PROPS, ...form.bind("email"), editable: !busy, returnKeyType: last ? "go" : "next", submitBehavior: last ? "blurAndSubmit" : "submit", onSubmitEditing: onDone });
  const switchLine = onSwitch || layout.emailOnly ? h(Line, { align: layout.emailOnly ? align : "center" }, h(Text, { size: "sm", tone: "muted" }, "Don't have an account?"), h(AuthLink, { title: "Sign up", onPress: onSwitch })) : null;
  const socials = h(Socials, { layout, providers, verb: layout.verb ?? "Login with", busy, onSocial });
  const hasSocials = (providers ?? layout.providers ?? []).length > 0;
  const backLink = h(Line, { align }, h(AuthLink, { title: "Back to login", onPress: () => go(first) }));
  let content;
  if (view === "otp") content = h(CodeView, { form, run, busy, problem, align, length: codeLength, email, onVerify, onResend, onDone: () => go("done"), back: h(AuthLink, { title: "go back", onPress: () => go(first) }) });
  else if (view === "done") content = h(Notice, { glyph: GLYPH.check, tone: "ok", align, title: "You're in", text: "You are signed in. Taking you to your account." });
  else if (view === "sent") content = h(Notice, { glyph: "@", align, title: "Check your email", text: `We sent a ${sent === "reset" ? "password reset link" : "sign-in link"} to ${email || "your inbox"}. It expires in 15 minutes.` }, backLink);
  else if (view === "forgot") content = h(Stack, { gap: "m" }, h(AuthHeader, { title: "Reset your password", subtitle: "Enter the email you signed up with and we'll send you a reset link.", align }),
    h(Problem, { message: problem }), emailField(submit.forgot), h(Button, { title: "Send reset link", size: "l", block: true, loading: busy, onPress: submit.forgot }), backLink);
  else if (view === "magic-link" && !layout.emailOnly) content = h(Stack, { gap: "m" }, h(AuthHeader, { title: "Login with a magic link", subtitle: "No password needed. We'll email you a link that signs you in.", align }),
    h(Problem, { message: problem }), emailField(submit["magic-link"]), h(Button, { title: "Send link", size: "l", block: true, loading: busy, onPress: submit["magic-link"] }),
    h(Line, { align }, h(AuthLink, { title: "Use password instead", onPress: () => go("password") })));
  else if (layout.emailOnly) content = h(Stack, { gap: "m" },
    h(AuthHeader, { title: title ?? layout.title, subtitle: subtitle ?? switchLine, align }, logo === null || logo === false ? null : typeof logo === "object" ? logo : h(AuthBrand, { name: logo ?? "Acme Inc", size: 44, showName: false, style: { marginBottom: 8 } })),
    h(Problem, { message: problem }), emailField(submit["magic-link"]),
    h(Button, { title: "Login", size: "l", block: true, loading: busy, onPress: submit["magic-link"] }),
    hasSocials ? h(OrDivider, { label: "Or" }) : null, socials);
  else {
    const head = h(AuthHeader, { title: title ?? layout.title, subtitle: subtitle ?? layout.subtitle, align });
    const fields = [
      h(View, { key: "email" }, emailField(() => form.focus("password"), false)),
      h(AuthField, { key: "password", label: "Password", secure: true, ...form.bind("password"), editable: !busy, autoCapitalize: "none", autoCorrect: false, autoComplete: "current-password", textContentType: "password",
        returnKeyType: "go", onSubmitEditing: submit.password, action: h(AuthLink, { title: "Forgot your password?", onPress: () => go("forgot") }) }),
      showRemember ? h(Checkbox, { key: "remember", label: "Remember me", checked: values.remember, onChange: (checked) => form.set("remember", checked), disabled: busy }) : null,
      h(Button, { key: "submit", title: "Login", size: "l", block: true, loading: busy, onPress: submit.password }),
    ];
    const before = layout.social === "before";
    content = h(Stack, { gap: "m" }, head, h(Problem, { message: problem }),
      before ? socials : null, before && hasSocials ? h(OrDivider, { label: "Or continue with" }) : null,
      h(Stack, { gap: "s" }, fields),
      !before && hasSocials && layout.or ? h(OrDivider, { label: layout.or }) : null, before ? null : socials,
      magicLink ? h(Line, { align: "center" }, h(AuthLink, { title: "Email me a magic link instead", onPress: () => go("magic-link") })) : null,
      switchLine);
  }
  return h(Shell, { layout, logo: layout.emailOnly ? null : logo === undefined && layout.shell === "card" ? null : logo, cover, legal, onLegal, style, testID }, content);
}

const LOGIN = {
  1: { shell: "card", align: "left", title: "Login to your account", subtitle: "Enter your email below to login to your account", providers: ["google"], social: "after" },
  2: { shell: "split", align: "left", title: "Login to your account", subtitle: "Enter your email below to login to your account", providers: ["github"], social: "after", or: "Or" },
  3: { shell: "muted", align: "center", title: "Welcome back", subtitle: "Login with your Apple or Google account", providers: ["apple", "google"], social: "before", legal: true },
  4: { shell: "cover", align: "center", title: "Welcome back", subtitle: "Login to your Acme Inc account", providers: ["apple", "google", "meta"], social: "icons", or: "Or continue with", legal: true },
  5: { shell: "plain", align: "center", emailOnly: true, title: "Welcome to Acme Inc.", providers: ["apple", "google"], social: "after", verb: "Continue with", legal: true },
};
/** login-01: a simple card. Email, password, remember me and one provider, plus magic-link, reset and code steps. */
export function Login01(props) { return h(LoginFlow, { ...props, layout: LOGIN[1] }); }
/** login-02: two columns with cover on the web; on a phone, an accent brand panel above an open form. */
export function Login02(props) { return h(LoginFlow, { ...props, layout: LOGIN[2] }); }
/** login-03: a card on a muted panel, with the brand above it and Apple and Google before the email form. */
export function Login03(props) { return h(LoginFlow, { ...props, layout: LOGIN[3] }); }
/** login-04: form and image in one card: a tinted cover band on top, the form below, providers as a row of marks. */
export function Login04(props) { return h(LoginFlow, { ...props, layout: LOGIN[4] }); }
/** login-05: email only. Enter an email, get a one-time code (or a link with verification={false}); providers below. */
export function Login05(props) { return h(LoginFlow, { ...props, layout: LOGIN[5] }); }

// ---------------------------------------------------------------- signup
function SignupFlow({ layout, title, subtitle, logo, cover, loading = false, error, providers, verification = true, codeLength = 6, minPasswordLength = 8, termsLabel = "I agree to the Terms of Service and Privacy Policy", legal,
  defaultValues, onSubmit, onSocial, onSwitch, onVerify, onResend, onLegal, style, testID, ...viewProps }) {
  const [view, setView] = useView(viewProps, "signup");
  const form = useForm({ name: defaultValues?.name ?? "", email: defaultValues?.email ?? "", password: "", confirm: "", terms: false, code: "" }), run = useRun();
  const busy = loading || run.busy, problem = error || run.failure, align = layout.align, { values } = form;
  const go = (next) => { form.clear(); run.reset(); setView(next); };
  const email = values.email.trim();
  const submit = () => form.check({
    name: (value) => (value.trim() ? null : "Enter your full name."),
    email: emailRule,
    password: (value) => (!value ? "Choose a password." : value.length < minPasswordLength ? `Use at least ${minPasswordLength} characters.` : null),
    confirm: (value, all) => (!value ? "Type your password again." : value !== all.password ? "The passwords do not match." : null),
    terms: (value) => (value ? null : "Accept the terms to create your account."),
  }) && run.run(onSubmit, [{ name: values.name.trim(), email, password: values.password, terms: true }], verification ? () => go("otp") : undefined);
  const next = (name) => ({ returnKeyType: "next", submitBehavior: "submit", onSubmitEditing: () => form.focus(name) });
  const hasSocials = (providers ?? layout.providers ?? []).length > 0, before = layout.social === "before";
  const socials = h(Socials, { layout, providers, verb: "Sign up with", busy, onSocial });
  let content;
  if (view === "otp") content = h(CodeView, { form, run, busy, problem, align, length: codeLength, email, onVerify, onResend, onDone: () => go("done"), back: h(AuthLink, { title: "change email", onPress: () => go("signup") }) });
  else if (view === "done") content = h(Notice, { glyph: GLYPH.check, tone: "ok", align, title: "You're in", text: "Your account is ready. Taking you to your workspace." });
  else content = h(Stack, { gap: "m" },
    h(AuthHeader, { title: title ?? layout.title, subtitle: subtitle ?? layout.subtitle, align }), h(Problem, { message: problem }),
    before ? socials : null, before && hasSocials ? h(OrDivider, { label: "Or continue with" }) : null,
    h(Stack, { gap: "s" },
      h(AuthField, { label: "Full name", placeholder: "Levan Dvalishvili", ...form.bind("name"), editable: !busy, autoCapitalize: "words", autoComplete: "name", textContentType: "name", ...next("email") }),
      h(AuthField, { ...EMAIL_PROPS, ...form.bind("email"), editable: !busy, ...next("password") }),
      h(AuthField, { label: "Password", secure: true, ...form.bind("password"), editable: !busy, hint: `Must be at least ${minPasswordLength} characters long.`, autoCapitalize: "none", autoCorrect: false, autoComplete: "new-password", textContentType: "newPassword", ...next("confirm") }),
      h(AuthField, { label: "Confirm password", secure: true, ...form.bind("confirm"), editable: !busy, autoCapitalize: "none", autoCorrect: false, autoComplete: "new-password", textContentType: "newPassword", returnKeyType: "go", onSubmitEditing: submit }),
      h(View, null,
        h(Checkbox, { label: termsLabel, checked: values.terms, onChange: (checked) => form.set("terms", checked), disabled: busy }),
        form.errors.terms ? h(Text, { size: "xs", tone: "bad", accessibilityRole: "alert", accessibilityLiveRegion: "polite" }, form.errors.terms) : null),
      h(Button, { title: "Create account", size: "l", block: true, loading: busy, onPress: submit })),
    !before && hasSocials && layout.or ? h(OrDivider, { label: layout.or }) : null, before ? null : socials,
    onSwitch ? h(Line, { align: "center" }, h(Text, { size: "sm", tone: "muted" }, "Already have an account?"), h(AuthLink, { title: "Sign in", onPress: onSwitch })) : null);
  return h(Shell, { layout, logo: logo === undefined && (layout.shell === "card" || layout.shell === "plain") ? null : logo, cover, legal, onLegal, style, testID }, content);
}

const SIGNUP_COPY = { title: "Create an account", subtitle: "Enter your information below to create your account" };
const SIGNUP = {
  1: { shell: "card", align: "left", ...SIGNUP_COPY, providers: ["google"], social: "after" },
  2: { shell: "split", align: "left", ...SIGNUP_COPY, providers: ["github"], social: "after", or: "Or" },
  3: { shell: "muted", align: "center", ...SIGNUP_COPY, providers: ["apple", "google"], social: "before", legal: true },
  4: { shell: "cover", align: "center", ...SIGNUP_COPY, providers: [], legal: true },
  5: { shell: "plain", align: "center", title: "Create your account", subtitle: "Sign up with a provider or your email", providers: ["apple", "google", "github"], social: "before" },
};
/** signup-01: a simple card. Name, email, password and confirmation, terms, one provider, then an email code. */
export function Signup01(props) { return h(SignupFlow, { ...props, layout: SIGNUP[1] }); }
/** signup-02: two columns with cover on the web; on a phone, an accent brand panel above an open form. */
export function Signup02(props) { return h(SignupFlow, { ...props, layout: SIGNUP[2] }); }
/** signup-03: a card on a muted panel with the brand above it, Apple and Google first, legal line below. */
export function Signup03(props) { return h(SignupFlow, { ...props, layout: SIGNUP[3] }); }
/** signup-04: form and image in one card: a tinted cover band on top and the form below, no providers. */
export function Signup04(props) { return h(SignupFlow, { ...props, layout: SIGNUP[4] }); }
/** signup-05: leads with Apple, Google and GitHub on an open page, then the email form. */
export function Signup05(props) { return h(SignupFlow, { ...props, layout: SIGNUP[5] }); }

// Demos for the blocks group: the ten sign-in and sign-up screens. Each entry: { id, title, description, Demo }.
// Nothing here talks to a server: every callback waits a moment, like a request would, and reports in a toast.
import { useState } from "react";
import { Stack, Cluster, Button, Text, useToast, Login01, Login02, Login03, Login04, Login05, Signup01, Signup02, Signup03, Signup04, Signup05 } from "@colibri-kit/native-core";

const later = (work) => new Promise((resolve, reject) => setTimeout(() => { try { resolve(work?.()); } catch (problem) { reject(problem); } }, 700));

// Wires a block to pretend handlers and adds what a demo needs around it: a hint and a way to start again.
function Playground({ Block, signup = false, hint, ...props }) {
  const toast = useToast(), [run, setRun] = useState(0), [view, setView] = useState(null);
  return (
    <Stack gap="m">
      <Block key={run} testID="block" onViewChange={setView}
        onSubmit={(values) => later(() => {
          if (values.password === "wrong") throw new Error("That email and password do not match. Try again or reset your password.");
          toast.show(values.password === undefined ? `Code sent to ${values.email}` : signup ? `Account created for ${values.name}` : `Signed in as ${values.email}`, { tone: "ok" });
        })}
        onMagicLink={(email) => later(() => toast.show(`Magic link sent to ${email}`, { tone: "ok" }))}
        onForgotPassword={(email) => later(() => toast.show(`Reset link sent to ${email}`, { tone: "ok" }))}
        onVerify={(code) => later(() => { if (code === "000000") throw new Error("That code is not right. Check the email and try again."); toast.show("Code accepted", { tone: "ok" }); })}
        onResend={() => toast.show("New code sent")}
        onSocial={(provider) => toast.show(`Continue with ${provider}`)}
        onSwitch={() => toast.show(signup ? "Go to sign in" : "Go to sign up")}
        onLegal={(which) => toast.show(which === "terms" ? "Open the Terms of Service" : "Open the Privacy Policy")}
        {...props} />
      <Cluster justify="space-between" wrap={false}>
        <Text size="xs" tone="muted" style={{ flex: 1 }}>{hint}</Text>
        {view ? <Button title="Start over" variant="soft" size="s" onPress={() => { setRun(run + 1); setView(null); }} testID="restart" /> : null}
      </Cluster>
    </Stack>
  );
}

const LOGIN_HINT = "Leave the form empty and press Login to see validation. The password “wrong” shows a server error; the code 000000 is refused.";
const SIGNUP_HINT = "Press Create account with the form empty to see validation. After a valid sign-up, any 6-digit code but 000000 is accepted.";

export default [
  { id: "login-01", title: "Login 01 · Simple card", description: "A sign-in card with email, password, remember me and Google, plus magic-link, password-reset and code steps.",
    Demo: () => <Playground Block={Login01} verification hint={LOGIN_HINT} /> },
  { id: "login-02", title: "Login 02 · Brand panel", description: "The two-column web layout stacked for a phone: an accent brand panel above an open sign-in form with GitHub.",
    Demo: () => <Playground Block={Login02} verification hint={LOGIN_HINT} /> },
  { id: "login-03", title: "Login 03 · Muted background", description: "A sign-in card on a muted panel with Apple and Google first, then email and password.",
    Demo: () => <Playground Block={Login03} verification hint={LOGIN_HINT} /> },
  { id: "login-04", title: "Login 04 · Card with cover", description: "One card with a tinted cover band on top, the sign-in form below and three providers as a row of letter marks.",
    Demo: () => <Playground Block={Login04} verification hint={LOGIN_HINT} /> },
  { id: "login-05", title: "Login 05 · Email only", description: "Passwordless sign-in: enter an email, then type the one-time code that was sent; Apple and Google below.",
    Demo: () => <Playground Block={Login05} hint="Enter any email to get to the code step. Typing, deleting and pasting all work; 000000 is refused." /> },
  { id: "signup-01", title: "Signup 01 · Simple card", description: "A sign-up card with name, email, password and confirmation, a terms checkbox and Google, then an email code.",
    Demo: () => <Playground Block={Signup01} signup hint={SIGNUP_HINT} /> },
  { id: "signup-02", title: "Signup 02 · Brand panel", description: "The two-column web layout stacked for a phone: an accent brand panel above an open sign-up form with GitHub.",
    Demo: () => <Playground Block={Signup02} signup hint={SIGNUP_HINT} /> },
  { id: "signup-03", title: "Signup 03 · Muted background", description: "A sign-up card on a muted panel with Apple and Google first and the legal line underneath.",
    Demo: () => <Playground Block={Signup03} signup hint={SIGNUP_HINT} /> },
  { id: "signup-04", title: "Signup 04 · Card with cover", description: "One card with a tinted cover band on top and the sign-up form below.",
    Demo: () => <Playground Block={Signup04} signup hint={SIGNUP_HINT} /> },
  { id: "signup-05", title: "Signup 05 · Social providers", description: "A sign-up page that leads with Apple, Google and GitHub, then offers the email form.",
    Demo: () => <Playground Block={Signup05} signup hint={SIGNUP_HINT} /> },
];

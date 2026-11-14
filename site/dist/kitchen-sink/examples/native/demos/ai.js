// Demos for the AI elements: chat, reasoning, tool calls and agent status.
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import {
  useToast, useTheme, Stack, Cluster, Text, Button, Card, Badge, Divider,
  AiMessage, Chat, ChainOfThought, Checkpoint, CitationPreview, Confirmation, Context, FileTree, InlineCitation, ModelSelector, Plan, PromptInput,
  Queue, Reasoning, Sources, StackTrace, Subagent, Suggestion, Task, Terminal, TestResults, Tool,
} from "@colibri-kit/native-core";

const SOURCES = [
  { title: "Tree View Pattern", url: "https://www.w3.org/WAI/ARIA/apg/patterns/treeview/", site: "w3.org", snippet: "A tree view widget presents a hierarchical list. Any item in the hierarchy may have child items, and items that have children may be expanded or collapsed." },
  { title: "Accessibility · React Native", url: "https://reactnative.dev/docs/accessibility", site: "reactnative.dev", snippet: "Both Android and iOS provide APIs for integrating apps with assistive technologies like the bundled screen readers VoiceOver and TalkBack." },
  { title: "Touch target size", url: "https://m3.material.io/foundations/designing/structure", site: "m3.material.io", snippet: "Touch targets should be at least 48 by 48 dp, with at least 8 dp of space between them." },
];
const MODELS = [
  { value: "fast", label: "Fast", description: "Quick answers for everyday questions." },
  { value: "smart", label: "Smart", description: "Balanced speed and depth.", badge: "Default" },
  { value: "max", label: "Max", description: "Slowest, for the hardest problems." },
];
const EFFORTS = [{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }];
const REPLIES = [
  "Colibri reads every colour from one hue, so a single `hue` prop on `ColibriProvider` re-brands the whole app.\n\nSpacing, radius and type sizes come from the same theme, which is why the components line up without extra styles.",
  "Wrap your app in `ColibriProvider` and it follows the device setting. Pass `scheme=\"dark\"` to force it.",
  "Yes. Every block here is plain props and callbacks, so you can feed it from any model API or agent framework.",
];

/** Runs a callback on an interval while active, and always stops it when the demo closes. */
function useTicker(active, tick, ms) {
  const latest = useRef(tick);
  latest.current = tick;
  useEffect(() => {
    if (!active) return undefined;
    const timer = setInterval(() => latest.current(), ms);
    return () => clearInterval(timer);
  }, [active, ms]);
}

function ChatDemo() {
  const theme = useTheme(), toast = useToast(), turn = useRef(0);
  const [messages, setMessages] = useState([{ id: "hello", role: "assistant", text: "Hi! Ask me about Colibri for React Native." }]);
  const [pending, setPending] = useState(null), [attachments, setAttachments] = useState([]);
  useTicker(!!pending, () => {
    const words = pending.words, shown = pending.shown + 2, done = shown >= words.length;
    setMessages((list) => list.map((message) => (message.id === pending.id ? { ...message, text: words.slice(0, shown).join(" "), streaming: !done } : message)));
    setPending(done ? null : { ...pending, shown });
  }, 90);
  const send = (text, files = []) => {
    const id = `m${Date.now()}`, reply = REPLIES[turn.current++ % REPLIES.length];
    setMessages((list) => [...list, { id: `${id}-q`, role: "user", text: files.length ? `${text}\n\nAttached: ${files.map((file) => file.name).join(", ")}`.trim() : text }, { id, role: "assistant", text: "", streaming: true }]);
    setPending({ id, words: reply.split(" "), shown: 0 });
    setAttachments([]);
  };
  const stop = () => { setMessages((list) => list.map((message) => (message.id === pending?.id ? { ...message, streaming: false } : message))); setPending(null); };
  return (
    <View style={{ height: 520, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.l, overflow: "hidden" }}>
      <Chat messages={messages} streaming={!!pending} onSend={send} onStop={stop} placeholder="Message Colibri…"
        suggestions={messages.length < 3 ? ["How does theming work?", "Does it support dark mode?", "Can I use my own model?"] : undefined}
        onCopy={() => toast.show("Reply copied", { tone: "ok" })} onRetry={(message) => toast.show(`Retrying “${message.text.slice(0, 18)}…”`)}
        attachments={attachments} onAttach={() => setAttachments((list) => [...list, { id: `f${list.length}`, name: list.length ? "screenshot.png" : "theme.js", detail: list.length ? "184 KB" : "2 KB" }])}
        onRemoveAttachment={(id) => setAttachments((list) => list.filter((file) => file.id !== id))} />
    </View>
  );
}

function ReasoningDemo() {
  const full = "The user wants every blocked account. An account counts as blocked when `block = 1`, or when its profile was never approved.\n\nI should join the profile table so both cases are covered, then list the usernames.";
  const words = full.split(" "), [shown, setShown] = useState(0), streaming = shown < words.length;
  useTicker(streaming, () => setShown((count) => Math.min(words.length, count + 2)), 110);
  return (
    <Stack gap="m">
      <Reasoning status={streaming ? "streaming" : "done"} duration={4} text={words.slice(0, shown).join(" ")} />
      <Button title="Stream again" variant="outline" size="s" disabled={streaming} onPress={() => setShown(0)} testID="stream-again" />
    </Stack>
  );
}

function TerminalDemo() {
  const toast = useToast();
  const lines = [
    { text: "▶ registry.test.js" }, { text: "  ✔ labels and roles (12ms)", tone: "ok" }, { text: "  ✔ restore from the tag (8ms)", tone: "ok" },
    { text: "▶ ai.test.js" }, { text: "  ✔ prompt input submits (21ms)", tone: "ok" }, { text: "  ✖ file tree arrows (34ms)", tone: "bad" },
    { text: "      AssertionError: expected \"src\" to equal \"README.md\"", tone: "bad" }, { text: "" }, { text: "tests 4 · pass 3 · fail 1 · duration 412ms", tone: "muted" },
  ];
  const [shown, setShown] = useState(lines.length), running = shown < lines.length;
  useTicker(running, () => setShown((count) => count + 1), 260);
  return (
    <Stack gap="m">
      <Terminal command="npm test" output={lines.slice(0, shown)} status={running ? "running" : "error"} exitCode={running ? undefined : 1} duration={running ? undefined : 0.41} onCopy={() => toast.show("Output copied", { tone: "ok" })} />
      <Terminal command="git status --short" defaultOpen={false} exitCode={0} output={" M src/core/auto.js\nA  src/core/ai.js\n D README.md"} />
      <Button title="Run again" variant="outline" size="s" disabled={running} onPress={() => setShown(0)} />
    </Stack>
  );
}

function TaskDemo() {
  const all = [
    { label: "Found `createSidebar` in navigation.js", detail: "3 matches in 2 files" }, { label: "Read 3 files" }, { label: "Checking callers" }, { label: "Summarising what changed" },
  ];
  const [at, setAt] = useState(2), running = at < all.length;
  useTicker(running, () => setAt((step) => step + 1), 1400);
  return (
    <Stack gap="m">
      <Task label={running ? "Searching the codebase" : "Searched the codebase"} defaultOpen steps={all.slice(0, Math.min(all.length, at + 1)).map((step, index) => ({ ...step, status: index < at ? "done" : "running" }))} />
      <Button title="Run again" variant="outline" size="s" disabled={running} onPress={() => setAt(0)} />
    </Stack>
  );
}

export default [
  { id: "chain-of-thought", title: "ChainOfThought", description: "A summary line that opens into the steps the agent took.", Demo: () => (
    <Stack gap="m">
      <ChainOfThought label="Researching the migration plan" defaultOpen steps={[
        { label: "Read the Joomla 1.5 schema", status: "done", detail: "42 tables, 3 with custom fields" },
        { label: "Compared it with the new `users` tables", status: "done" },
        { label: "Drafting the column mapping", status: "running" },
        { label: "Review with you", status: "pending" },
      ]} />
      <ChainOfThought label="Checked the release notes" duration={7} steps={[{ label: "Opened the changelog", status: "done" }, { label: "Found two breaking changes", status: "done" }]} />
    </Stack>
  ) },
  { id: "chat", title: "Chat", description: "A whole conversation: a list that follows new text, suggestion chips and a docked message box.", Demo: ChatDemo },
  { id: "checkpoint", title: "Checkpoint", description: "A point in the conversation you can go back to.", Demo: () => {
    const toast = useToast(), [restored, setRestored] = useState(null);
    return (
      <Stack gap="xs">
        <AiMessage role="user" text="Rename the sidebar component and update its imports." />
        <AiMessage text="Done. I renamed `Sidebar` to `AppSidebar` in 3 files." />
        <Checkpoint id="cp-3" detail="3 files changed" onRestore={(id) => { setRestored(id); toast.show("Restored to checkpoint", { tone: "ok" }); }} />
        <AiMessage role="user" text="Now delete the old styles." />
        <Checkpoint id="cp-4" label="Checkpoint" detail="1 file deleted" restoreLabel="Undo" onRestore={(id) => { setRestored(id); toast.show("Deletion undone", { tone: "ok" }); }} />
        <Text size="sm" tone="muted">{restored ? `Last restored: ${restored}` : "Nothing restored yet."}</Text>
      </Stack>
    );
  } },
  { id: "confirmation", title: "Confirmation", description: "Asks the user to approve or reject an action before it runs.", Demo: () => {
    const toast = useToast(), [status, setStatus] = useState("pending");
    return (
      <Stack gap="m">
        <Confirmation tone="bad" title="Run this query on `production`?" description="The agent needs your approval to change data." detail={"DELETE FROM sessions\nWHERE last_seen < now() - interval '90 days';"}
          approveLabel="Run query" status={status} approvedText="Approved. Running the query…" rejectedText="Rejected. Nothing was changed."
          onApprove={() => { setStatus("approved"); toast.show("Query approved", { tone: "ok" }); }} onReject={() => setStatus("rejected")} />
        {status !== "pending" ? <Button title="Ask again" variant="outline" size="s" onPress={() => setStatus("pending")} /> : null}
        <Confirmation title="Send the summary to `#design`?" description="Posts one message as you." approveLabel="Send" rejectLabel="Not now" />
      </Stack>
    );
  } },
  { id: "context", title: "Context", description: "A meter for how much of the model's context window is used. Tap it for the token counts.", Demo: () => {
    const [used, setUsed] = useState(124000), max = 200000;
    return (
      <Stack gap="m">
        <Context used={used} max={max} defaultOpen breakdown={[{ label: "Input", value: Math.round(used * 0.79) }, { label: "Output", value: Math.round(used * 0.15) }, { label: "Cache", value: Math.round(used * 0.06) }]} />
        <Cluster>
          <Button title="−20k" size="s" variant="outline" accessibilityLabel="Use 20 thousand fewer tokens" onPress={() => setUsed((value) => Math.max(0, value - 20000))} />
          <Button title="+20k" size="s" variant="outline" accessibilityLabel="Use 20 thousand more tokens" onPress={() => setUsed((value) => Math.min(max, value + 20000))} />
        </Cluster>
        <Divider />
        <Cluster gap="s"><Text size="sm" tone="muted">In a toolbar</Text><Context used={36000} max={200000} /><Context used={188000} max={200000} /></Cluster>
      </Stack>
    );
  } },
  { id: "file-tree", title: "FileTree", description: "A folder tree, for example the files an agent changed. Tap a folder to open it and a file to select it.", Demo: () => {
    const [selected, setSelected] = useState("src/core/ai.js");
    return (
      <Card gap="xs">
        <FileTree label="Changed files" selected={selected} onSelect={setSelected} defaultExpanded={["src", "src/core"]} items={[
          { name: "src", children: [
            { name: "core", children: [{ name: "ai.js", status: "added" }, { name: "auto.js", status: "modified" }] },
            { name: "index.js" },
          ] },
          { name: "themes", children: [{ name: "colibri.css", status: "modified" }, { name: "tokens.json" }] },
          { name: "README.md", status: "deleted" },
          { name: "package.json" },
        ]} />
        <Divider />
        <Text size="sm" tone="muted">Selected: {selected}</Text>
      </Card>
    );
  } },
  { id: "inline-citation", title: "InlineCitation", description: "A numbered source inside a sentence. Tap it to preview the source in a sheet.", Demo: () => {
    const toast = useToast(), [preview, setPreview] = useState(null);
    const cite = (index) => <InlineCitation number={index + 1} source={SOURCES[index]} onPress={() => setPreview(index)} />;
    return (
      <Stack>
        <Text>
          Colibri follows the WAI-ARIA tree pattern{cite(0)} and passes state to VoiceOver and TalkBack{cite(1)}. Rows are at least 44 points high, in line with platform guidance{cite(2)}.
        </Text>
        <CitationPreview source={preview == null ? null : SOURCES[preview]} number={preview == null ? undefined : preview + 1} onClose={() => setPreview(null)} onOpen={(source) => toast.show(`Opening ${source.site}`)} />
      </Stack>
    );
  } },
  { id: "ai-message", title: "AiMessage", description: "One turn of the conversation: the question, the thinking and tool call, and the answer with actions.", Demo: () => {
    const toast = useToast(), [feedback, setFeedback] = useState(null);
    return (
      <Stack gap="m">
        <AiMessage role="user" text="Which users are blocked?" time="09:41" />
        <AiMessage author="Colibri" feedback={feedback} onFeedback={setFeedback} onCopy={() => toast.show("Reply copied", { tone: "ok" })} onRetry={() => toast.show("Asking again…")}
          text={"Two accounts are blocked: `skara` and `afonia`.\n\nBoth were blocked by an admin last week. Say the word and I will unblock them."}
          footer={<Sources sources={SOURCES.slice(0, 2)} onOpen={(source) => toast.show(`Opening ${source.site}`)} />}>
          <Reasoning duration={3} text="Users are blocked when `block = 1` or when their profile was never approved." />
          <Tool name="query_database" status="done" duration={0.24} input={"SELECT username FROM users WHERE block = 1"} output={"skara\nafonia"} />
        </AiMessage>
        <AiMessage role="user" text="Unblock them both." />
        <AiMessage author="Colibri" streaming text="Unblocking both accounts now. I will check that they can" />
      </Stack>
    );
  } },
  { id: "model-selector", title: "ModelSelector", description: "A chip that opens a sheet to choose the model and how hard it should think.", Demo: () => {
    const [model, setModel] = useState("smart"), [effort, setEffort] = useState("medium");
    return (
      <Stack gap="m">
        <ModelSelector value={model} onChange={setModel} options={MODELS} effort={effort} onEffortChange={setEffort} efforts={EFFORTS} />
        <Text size="sm" tone="muted">Using {model} with {effort} effort.</Text>
        <Divider />
        <Cluster gap="s"><Text size="sm" tone="muted">Model only</Text><ModelSelector defaultValue="fast" options={MODELS} /><ModelSelector defaultValue="max" options={MODELS} disabled /></Cluster>
      </Stack>
    );
  } },
  { id: "plan", title: "Plan", description: "The steps an agent plans to take, with how many are done.", Demo: () => {
    const labels = ["Back up the `users` table", "Hash passwords with a salt", "Unblock the two accounts", "Verify that logins work"];
    const [done, setDone] = useState(2);
    return (
      <Stack gap="m">
        <Plan title="Migration plan" description="Runs against staging first." steps={labels.map((label, index) => ({ label, status: index < done ? "done" : index === done ? "running" : "pending" }))} />
        <Cluster>
          <Button title="Finish a step" size="s" variant="outline" disabled={done >= labels.length} onPress={() => setDone((value) => value + 1)} />
          <Button title="Start over" size="s" variant="ghost" onPress={() => setDone(0)} />
        </Cluster>
      </Stack>
    );
  } },
  { id: "prompt-input", title: "PromptInput", description: "A message box that grows with the text, with attachments, a model chip, and Send that turns into Stop.", Demo: () => {
    const toast = useToast(), [streaming, setStreaming] = useState(false), [sent, setSent] = useState(""), [files, setFiles] = useState([{ id: "a", name: "quarterly-report.pdf", detail: "1.2 MB" }]);
    return (
      <Stack gap="m">
        <PromptInput streaming={streaming} model="Smart" onModelPress={() => toast.show("Open your model picker here")}
          attachments={files} onAttach={() => setFiles((list) => [...list, { id: String(Date.now()), name: `photo-${list.length + 1}.jpg`, detail: "640 KB" }])} onRemoveAttachment={(id) => setFiles((list) => list.filter((file) => file.id !== id))}
          onSubmit={(text, attached) => { setSent(`${text || "(no text)"}${attached.length ? ` · ${attached.length} attached` : ""}`); setFiles([]); setStreaming(true); }} onStop={() => setStreaming(false)} testID="prompt" />
        <Text size="sm" tone="muted">{streaming ? `Answering “${sent}”. Press Stop to end it.` : sent ? `Last sent: ${sent}` : "Type a message and press Send. The + button stands in for your file picker."}</Text>
        <PromptInput placeholder="Sign in to send messages" disabled />
      </Stack>
    );
  } },
  { id: "queue", title: "Queue", description: "A checklist split into what is left and what is done.", Demo: () => {
    const [items, setItems] = useState([
      { id: 1, label: "Write the README" }, { id: 2, label: "Add end-to-end tests", detail: "Checkout and sign-in flows" }, { id: 3, label: "Ship `1.0`" }, { id: 0, label: "Design tokens", done: true },
    ]);
    return <Card><Queue items={items} onChange={(id, done) => setItems((list) => list.map((item) => (item.id === id ? { ...item, done } : item)))} /></Card>;
  } },
  { id: "reasoning", title: "Reasoning", description: "Shows the model's thinking while it streams, then folds away as “Thought for 4s”.", Demo: ReasoningDemo },
  { id: "sources", title: "Sources", description: "A “Used 3 sources” line that opens into a numbered list of links.", Demo: () => {
    const toast = useToast();
    return (
      <Stack gap="xs">
        <AiMessage text="Touch targets should be at least 44 points on iOS and 48 dp on Android, and every control needs a role and a label." />
        <Sources sources={SOURCES} defaultOpen onOpen={(source) => toast.show(`Opening ${source.site}`)} />
        <Sources sources={[]} status="running" />
      </Stack>
    );
  } },
  { id: "stack-trace", title: "StackTrace", description: "An error message that opens into its stack frames, scrolling sideways.", Demo: () => {
    const toast = useToast();
    return (
      <Stack gap="m">
        <StackTrace defaultOpen message="TypeError: Cannot read properties of null (reading 'rows')" onCopy={() => toast.show("Stack trace copied", { tone: "ok" })} frames={[
          { fn: "createDataTable", file: "src/core/base.js", line: 212, column: 31 },
          { fn: "init", file: "src/core/auto.js", line: 52, column: 17 },
          { fn: "HTMLDocument.<anonymous>", file: "src/core/auto.js", line: 60, column: 3 },
          { fn: "processTicksAndRejections", file: "node:internal/process/task_queues", line: 95, column: 5, internal: true },
          { fn: "Module._compile", file: "node:internal/modules/cjs/loader", line: 1376, column: 14, internal: true },
          { fn: "Module.load", file: "node:internal/modules/cjs/loader", line: 1207, column: 32, internal: true },
          { fn: "Function.executeUserEntryPoint", file: "node:internal/modules/run_main", line: 135, column: 12, internal: true },
        ]} />
        <StackTrace message="Error: connect ECONNREFUSED 127.0.0.1:5432" trace={"at TCPConnectWrap.afterConnect (node:net:1555:16)\nat Pool.connect (node_modules/pg-pool/index.js:45:11)"} />
      </Stack>
    );
  } },
  { id: "subagent", title: "Subagent", description: "Work handed to a helper agent: its steps and what it reported back.", Demo: () => (
    <Stack gap="m">
      <Subagent name="Researcher" task="Panel behaviour" status="done" duration={38} defaultOpen
        steps={["Fetched the production bundle", "Read `index.css` (panel rules)", "Compared with the design spec"]}
        result="Minimised panels hang as tilted tags at the screen edge. Tapping one restores it." />
      <Subagent name="Test writer" task="Checkout flow" status="running" steps={[{ label: "Read the checkout screens", status: "done" }, { label: "Writing 6 test cases", status: "running" }]} />
      <Subagent name="Reviewer" task="Accessibility pass" status="pending" />
    </Stack>
  ) },
  { id: "suggestion", title: "Suggestion", description: "Short ready-made prompts the user can send with one tap.", Demo: () => {
    const [picked, setPicked] = useState("");
    return (
      <Stack gap="m">
        <Suggestion items={["Summarise this page", "Translate to Georgian", "Write tests", "Explain it simply"]} onSuggest={setPicked} />
        <Text size="sm" tone="muted">{picked ? `Sent: ${picked}` : "Tap a prompt to send it."}</Text>
        <Divider />
        <Text size="sm" weight="semibold">On one scrolling line</Text>
        <View style={{ marginHorizontal: -12 }}>
          <Suggestion scroll items={[{ label: "Plan a trip", value: "Plan a three-day trip to Tbilisi" }, { label: "Draft an email", value: "Draft a follow-up email" }, "Fix my code", "Brainstorm names", "Summarise a document"]} onSuggest={setPicked} />
        </View>
      </Stack>
    );
  } },
  { id: "task", title: "Task", description: "The steps an agent takes, appearing as it takes them.", Demo: TaskDemo },
  { id: "terminal", title: "Terminal", description: "A command and its output as it arrives, in monospace that scrolls sideways.", Demo: TerminalDemo },
  { id: "test-results", title: "TestResults", description: "A test run with pass and fail counts and suites you can open.", Demo: () => (
    <TestResults duration={0.41} suites={[
      { name: "registry.test.js", tests: [{ name: "labels and roles", status: "passed", duration: 0.012 }, { name: "hang moves the cell", status: "passed", duration: 0.009 }, { name: "restore from the tag", status: "passed", duration: 0.008 }] },
      { name: "ai.test.js", tests: [
        { name: "prompt input submits", status: "passed", duration: 0.021 },
        { name: "file tree arrows", status: "failed", duration: 0.034, error: "AssertionError: expected \"src\" to equal \"README.md\"\n    at test/ai.test.js:48:12" },
        { name: "chart tooltips", status: "skipped" },
      ] },
    ]} />
  ) },
  { id: "tool", title: "Tool", description: "One tool call from input to output, with a pending, running, completed or failed badge.", Demo: () => {
    const toast = useToast();
    return (
      <Stack gap="s">
        <Tool name="get_weather" status="pending" input={{ city: "Tbilisi" }} />
        <Tool name="search_docs" status="running" input={{ q: "sidebar", limit: 5 }} />
        <Tool name="query_database" status="done" duration={0.24} defaultOpen onCopy={() => toast.show("Copied", { tone: "ok" })}
          input={"SELECT username, last_seen FROM users WHERE block = 1 ORDER BY last_seen DESC"} output={[{ username: "skara", last_seen: "2026-03-02" }, { username: "afonia", last_seen: "2026-02-17" }]} />
        <Tool name="send_email" status="error" input={{ to: "team@example.com", subject: "Weekly report" }} error="SMTP 535: authentication failed" />
      </Stack>
    );
  } },
];

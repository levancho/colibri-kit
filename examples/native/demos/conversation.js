// Demos for the conversation group: bubbles, messages, markers, traces, attachments, questionnaires and charts.
import { useState } from "react";
import { View } from "react-native";
import {
  useToast, useTheme, Stack, Cluster, Divider, Text, Button, Card, Tabs,
  Bubble, BubbleGroup, Message, Marker, Trace, TraceStep, Attachment, Questionnaire, Chart, ChartLegend,
} from "@colibri-kit/native-core";

// A 6 × 6 pixel sunset, scaled up: stands in for a photo so the demo needs no network.
const PHOTO = { uri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAIAAABvrngfAAAAfUlEQVR42gFyAI3/AEZ4yEp2yE50yFJyyFZwyFpuyABkhLJogrJsgLJwfrJ0fLJ4erIAgpCcho6cioycjoqckoicloacAKCchqSahqiYhqyWhrCUhrSShgC+qHDCpnDGpHDKonDOoHDSnnAA3LRa4LJa5LBa6K5a7Kxa8KpaUz8+lQF81RIAAAAASUVORK5CYII=" };

const QUESTIONS = [
  { name: "goal", type: "single", required: true, title: "What brings you to Colibri?", description: "We use this to pick a starting template.",
    options: [{ value: "app", label: "A new app", description: "Start from an empty project." }, { value: "redesign", label: "A redesign", description: "Restyle screens that already exist." }, { value: "explore", label: "Just exploring", description: "Look around the catalog first." }] },
  { name: "platforms", type: "multiple", skippable: true, title: "Which platforms do you ship to?", description: "Pick any that apply.",
    options: [{ value: "ios", label: "iOS" }, { value: "android", label: "Android" }, { value: "web", label: "Web" }] },
  { name: "notes", type: "text", skippable: true, title: "Anything we should know?", description: "Optional. A sentence is plenty.", placeholder: "We need right-to-left support by spring…" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const VISITS = [{ name: "Phone", values: [186, 305, 237, 273, 209, 314] }, { name: "Tablet", values: [80, 120, 96, 140, 110, 152] }];
const CHANNELS = [{ label: "Search", value: 4820 }, { label: "Direct", value: 3110 }, { label: "Newsletter", value: 1960 }, { label: "Social", value: 870 }];
const STORAGE = [{ label: "Photos", value: 38.2 }, { label: "Documents", value: 21.5 }, { label: "Apps", value: 12.8 }, { label: "Other", value: 4.1, tone: "muted" }];
const WEEK = [12, 18, 15, 22, 19, 27, 24, 31, 28, 35, 33, 41];

const Stat = ({ label, value, change, tone, values }) => (
  <Card gap="2xs" style={{ flex: 1, minWidth: 150 }}>
    <Text size="xs" tone="muted">{label}</Text>
    <Cluster justify="space-between" align="flex-end" wrap={false}>
      <View><Text size="xl" weight="bold">{value}</Text><Text size="xs" tone={tone} weight="semibold">{change}</Text></View>
      <Chart type="sparkline" tone={tone} data={values.map((entry) => ({ value: entry }))} style={{ width: 72 }} title={label} />
    </Cluster>
  </Card>
);

export default [
  { id: "bubble", title: "Bubble", description: "One message balloon: received or sent, with a status line, reactions and a show-more toggle.", Demo: () => {
    const toast = useToast();
    return (
      <Stack gap="m">
        <BubbleGroup>
          <Bubble>Morning! I went through the release notes.</Bubble>
          <Bubble reactions={[{ value: "like", label: "👍", count: 2, accessibilityLabel: "Thumbs up" }, { value: "heart", label: "❤️", count: 0, accessibilityLabel: "Heart" }]}
            onReact={(value, on) => toast.show(on ? `Reacted with ${value}` : `Removed ${value}`)}>The stale route is gone and the build is green again.</Bubble>
        </BubbleGroup>
        <BubbleGroup align="end">
          <Bubble sent>Great, ship it.</Bubble>
          <Bubble sent status="Read 09:42">I will tell the team after stand-up.</Bubble>
        </BubbleGroup>
        <Bubble variant="outline" collapsible lines={3}>
          Here is the full changelog for this week. The sign-in screen now remembers the last account, the offline banner no longer covers the tab bar, attachments upload in the background, and we fixed a crash when rotating the device during a call. Dark mode contrast was raised on secondary buttons, and the settings screen loads about twice as fast on older phones.
        </Bubble>
        <Divider />
        <Text size="sm" weight="semibold">Variants</Text>
        <Cluster><Bubble variant="primary">primary</Bubble><Bubble variant="muted">muted</Bubble><Bubble variant="outline">outline</Bubble><Bubble variant="ghost">ghost</Bubble></Cluster>
      </Stack>
    );
  } },
  { id: "message", title: "Message", description: "A whole turn: avatar, author and time, the body and copy, like and retry actions. Consecutive messages group.", Demo: () => {
    const toast = useToast();
    const act = (action, { pressed }) => toast.show(action === "copy" ? "Copy requested: the app writes to the clipboard" : action === "retry" ? "Asked for another answer" : `${action} ${pressed ? "on" : "off"}`);
    return (
      <Stack gap="m">
        <Message from="user" time="17:41">How do I rotate the signing key without logging everyone out?</Message>
        <Message author="Colibri" time="17:42" actions={["copy", "like", "dislike", "retry"]} onAction={act}>
          Add the new key next to the old one, deploy, and only then switch signing over. Sessions signed with the old key stay valid until they expire.
        </Message>
        <Marker variant="separator">Today</Marker>
        <Stack gap="2xs">
          <Message author="Maya Okafor" time="09:12" variant="muted">Did the staging deploy finish?</Message>
          <Message author="Maya Okafor" grouped variant="muted">I would like to demo it at ten.</Message>
        </Stack>
        <Message from="user" time="09:14">Yes, it went out a few minutes ago.</Message>
        <Message author="Sam Chen" time="09:15">
          <Bubble variant="muted">Here is the build report.</Bubble>
          <Attachment name="staging-build-418.pdf" size={482000} />
        </Message>
      </Stack>
    );
  } },
  { id: "marker", title: "Marker", description: "A small inline line in a conversation: a note, a status row or a labelled divider.", Demo: () => {
    const [thinking, setThinking] = useState(true);
    return (
      <Stack gap="m">
        <Marker variant="separator">Yesterday</Marker>
        <Bubble>See you at the review tomorrow.</Bubble>
        <Marker variant="separator" tone="accent">New messages</Marker>
        <Bubble>The review moved to 3 pm.</Bubble>
        <Marker icon="✓" tone="ok">Explored 4 files</Marker>
        <Marker variant="row" icon="✎">Edited src/core/session.js</Marker>
        <Marker variant="row" icon="!" tone="warn">2 tests were skipped</Marker>
        {thinking ? <Marker loading live>Thinking…</Marker> : <Marker live icon="✓">Answered in 4 seconds</Marker>}
        <Button title={thinking ? "Finish thinking" : "Think again"} variant="outline" size="s" onPress={() => setThinking(!thinking)} />
      </Stack>
    );
  } },
  { id: "trace", title: "Trace", description: "A compact list of the steps something took, with status, duration and expandable detail.", Demo: () => {
    const [running, setRunning] = useState(true);
    return (
      <Stack gap="m">
        <Card gap="2xs">
          <Text size="sm" weight="semibold">Deploy to staging</Text>
          <Trace steps={[
            { id: "search", title: "Searched for minimumReleaseAge", duration: 420, glyph: "⌕" },
            { id: "node", title: "Ran node --version", duration: 1240, detail: "v22.11.0", defaultOpen: true },
            { id: "install", title: "Installed 214 packages", duration: 18600, detail: "added 214 packages in 18.6s\n\n38 packages are looking for funding\n  run `npm fund` for details" },
            { id: "test", title: "2 of 148 tests failed", status: "error", duration: 73000, detail: "FAIL test/session.test.js\n  ✕ refreshes an expired token (41 ms)\n  ✕ signs out on a revoked key (12 ms)" },
            running ? { id: "read", title: "Reading package.json…", status: "running" } : { id: "read", title: "Read package.json", duration: 96 },
            { id: "deploy", title: "Deploy", status: "pending" },
          ]} />
          <Button title={running ? "Finish the running step" : "Run it again"} variant="outline" size="s" onPress={() => setRunning(!running)} />
        </Card>
        <Card gap="2xs">
          <Text size="sm" weight="semibold">Composed from TraceStep</Text>
          <Trace>
            <TraceStep title="Fetched 3 sources" duration="0.8 s">
              <Stack gap="2xs"><Text size="sm">developer.apple.com · App Store review guidelines</Text><Text size="sm">reactnative.dev · Accessibility</Text><Text size="sm">w3.org · WCAG 2.2, target size</Text></Stack>
            </TraceStep>
            <TraceStep title="Wrote the summary" duration={2300} />
          </Trace>
        </Card>
      </Stack>
    );
  } },
  { id: "attachment", title: "Attachment", description: "A file chip with name, type and size, upload progress or an error, a remove button and a picture variant.", Demo: () => {
    const toast = useToast(), [progress, setProgress] = useState(0.35), [files, setFiles] = useState(["sales-dashboard.pdf", "q3-forecast.xlsx"]);
    const sizes = { "sales-dashboard.pdf": 2457600, "q3-forecast.xlsx": 88400 };
    return (
      <Stack gap="m">
        <Stack gap="xs">
          {files.map((name) => <Attachment key={name} block name={name} size={sizes[name]} onPress={() => toast.show(`Opened ${name}`)} onRemove={() => setFiles(files.filter((file) => file !== name))} />)}
          {files.length < 2 ? <Button title="Restore the files" variant="ghost" size="s" onPress={() => setFiles(Object.keys(sizes))} /> : null}
        </Stack>
        <Divider />
        <Attachment block name="team-offsite-2026.jpg" size={3145728} source={PHOTO} progress={progress} onRemove={() => toast.show("Upload cancelled")} />
        <Cluster><Button title="Advance upload" variant="outline" size="s" onPress={() => setProgress((value) => (value >= 1 ? 0.1 : Math.min(1, value + 0.25)))} /></Cluster>
        <Attachment block name="everything.zip" error="Too large (the limit is 20 MB)" onRemove={() => toast.show("Removed everything.zip")} />
        <Divider />
        <Text size="sm" weight="semibold">Picture tiles</Text>
        <Cluster gap="m" style={{ paddingTop: 6 }}>
          <Attachment variant="image" name="dunes.jpg" source={PHOTO} onRemove={() => toast.show("Removed dunes.jpg")} onPress={() => toast.show("Opened dunes.jpg")} />
          <Attachment variant="image" name="harbour.jpg" source={PHOTO} progress={0.6} onRemove={() => toast.show("Upload cancelled")} />
          <Attachment variant="image" name="notes.heic" onRemove={() => toast.show("Removed notes.heic")} />
        </Cluster>
      </Stack>
    );
  } },
  { id: "questionnaire", title: "Questionnaire", description: "One question at a time (single choice, multiple choice or free text) with Back, Skip, Next and a progress bar.", Demo: () => {
    const toast = useToast(), [step, setStep] = useState(0);
    return (
      <Stack>
        <Card><Questionnaire questions={QUESTIONS} onStep={setStep} onSubmit={(answers) => toast.show(`Submitted ${Object.values(answers).filter((value) => value != null && String(value) !== "").length} answers`, { tone: "ok" })} /></Card>
        <Text size="sm" tone="muted">onStep reported step {step + 1}. The first question is required; the others can be skipped.</Text>
      </Stack>
    );
  } },
  { id: "chart", title: "Chart", description: "Bar charts drawn from plain Views: vertical, horizontal, stacked, sparkline and share. Line and pie charts need an SVG library.", Demo: () => {
    const theme = useTheme(), [kind, setKind] = useState("bar");
    return (
      <Stack gap="m">
        <Card>
          <Tabs value={kind} onChange={setKind} options={[{ value: "bar", label: "Grouped" }, { value: "stacked", label: "Stacked" }, { value: "horizontal", label: "Rows" }]} />
          <Chart type={kind} title="Visitors per month" labels={MONTHS} series={VISITS} />
        </Card>
        <Card>
          <Chart title="Sign-ups by channel" data={CHANNELS} />
        </Card>
        <Card>
          <Chart type="horizontal" title="Tickets by status" data={[{ label: "Resolved", value: 128, tone: "ok" }, { label: "Waiting", value: 46, tone: "warn" }, { label: "Overdue", value: 17, tone: "bad" }, { label: "Unassigned", value: 9, tone: "muted" }]} />
        </Card>
        <Card>
          <Chart type="share" title="Storage used: 76.6 of 128 GB" data={STORAGE} formatValue={(value) => `${value} GB`} />
        </Card>
        <Cluster gap="s" align="stretch">
          <Stat label="Active users" value="1,284" change="↑ 12% this week" tone="ok" values={WEEK} />
          <Stat label="Error rate" value="0.8%" change="↑ 0.3 points" tone="bad" values={[4, 3, 5, 4, 6, 5, 7, 6, 9, 8, 11, 12]} />
        </Cluster>
        <Card>
          <Chart title="Refunds this quarter" data={[]} height={120} emptyText="No refunds this quarter" />
          <Divider />
          <Text size="sm" weight="semibold">ChartLegend on its own</Text>
          <ChartLegend items={[{ label: "On track", color: theme.colors.ok, value: 14 }, { label: "At risk", color: theme.colors.warn, value: 3 }, { label: "Blocked", color: theme.colors.bad, value: 1 }]} />
        </Card>
      </Stack>
    );
  } },
];

// Demos for the basics: layout, text, buttons and the everyday controls.
import { useState } from "react";
import { View } from "react-native";
import {
  useToast, useTheme, Stack, Cluster, Divider, Text, Heading, Button, Card, Badge, Callout, Avatar,
  TextField, Switch, Checkbox, RadioGroup, Tabs, ListItem, List, Spinner, Progress, Dialog, Sheet,
} from "@colibri-kit/native";

const Box = ({ label }) => {
  const theme = useTheme();
  return <View style={{ padding: theme.space.s, borderRadius: theme.radius.s, backgroundColor: theme.colors.accentSoft }}><Text size="sm" tone="accent" weight="semibold">{label}</Text></View>;
};
const PEOPLE = [
  { id: "1", name: "Maya Okafor", role: "Product", status: "Online", tone: "ok" },
  { id: "2", name: "Alex Rivera", role: "Design", status: "Away", tone: "warn" },
  { id: "3", name: "Sam Chen", role: "Engineering", status: "Offline" },
];

export default [
  { id: "stack", title: "Stack", description: "A column with even spacing. gap is a token or a number.", Demo: () => (
    <Card><Stack gap="xs"><Box label="gap xs" /><Box label="gap xs" /></Stack><Divider /><Stack gap="l"><Box label="gap l" /><Box label="gap l" /></Stack></Card>
  ) },
  { id: "cluster", title: "Cluster", description: "A row that wraps: buttons, badges, tags.", Demo: () => (
    <Card><Cluster>{["Design", "Research", "Mobile", "Accessibility", "Performance", "Open source"].map((tag) => <Badge key={tag}>{tag}</Badge>)}</Cluster>
      <Cluster justify="space-between"><Text>Total</Text><Text weight="bold">$128.00</Text></Cluster></Card>
  ) },
  { id: "text", title: "Text and Heading", description: "Seven sizes, four weights and the tone colours.", Demo: () => (
    <Stack>
      <Heading level={1}>Heading 1</Heading><Heading level={2}>Heading 2</Heading><Heading level={3}>Heading 3</Heading>
      <Text>Body text reads comfortably at the default size.</Text>
      <Text size="sm" tone="muted">Small muted text for secondary detail.</Text>
      <Cluster><Text tone="accent" weight="semibold">Accent</Text><Text tone="ok" weight="semibold">Ok</Text><Text tone="warn" weight="semibold">Warn</Text><Text tone="bad" weight="semibold">Bad</Text></Cluster>
    </Stack>
  ) },
  { id: "button", title: "Button", description: "Five variants, three sizes, loading and disabled states.", Demo: () => {
    const toast = useToast();
    return (
      <Stack>
        <Cluster>
          <Button title="Solid" onPress={() => toast.show("Solid pressed")} testID="solid" />
          <Button title="Soft" variant="soft" onPress={() => toast.show("Soft pressed")} />
          <Button title="Outline" variant="outline" onPress={() => toast.show("Outline pressed")} />
          <Button title="Ghost" variant="ghost" onPress={() => toast.show("Ghost pressed")} />
          <Button title="Delete" variant="danger" onPress={() => toast.show("Deleted", { tone: "bad" })} />
        </Cluster>
        <Cluster><Button title="Small" size="s" variant="outline" /><Button title="Medium" /><Button title="Large" size="l" /></Cluster>
        <Cluster><Button title="Disabled" disabled /><Button title="Saving" loading /></Cluster>
        <Button title="Full width" block />
      </Stack>
    );
  } },
  { id: "card", title: "Card", description: "A bordered surface. With onPress the whole card is a button.", Demo: () => {
    const toast = useToast();
    return (
      <Stack>
        <Card><Heading level={3}>Weekly report</Heading><Text tone="muted">Sign-ups rose 12% and churn held steady.</Text><Button title="Open report" variant="soft" /></Card>
        <Card onPress={() => toast.show("Card pressed")}><Text weight="semibold">Pressable card</Text><Text size="sm" tone="muted">Tap anywhere on it.</Text></Card>
      </Stack>
    );
  } },
  { id: "badge", title: "Badge", description: "A small status label in a tone colour.", Demo: () => (
    <Cluster><Badge>Draft</Badge><Badge tone="accent">New</Badge><Badge tone="ok">Paid</Badge><Badge tone="warn">Due soon</Badge><Badge tone="bad">Failed</Badge></Cluster>
  ) },
  { id: "callout", title: "Callout", description: "A tinted note with a coloured edge.", Demo: () => (
    <Stack>
      <Callout title="Heads up">Your trial ends in three days.</Callout>
      <Callout tone="ok" title="Payment received">Thanks. Your receipt is in your inbox.</Callout>
      <Callout tone="warn" title="Storage almost full">You have used 92% of your space.</Callout>
      <Callout tone="bad" title="Could not sync">Check your connection and try again.</Callout>
    </Stack>
  ) },
  { id: "avatar", title: "Avatar", description: "A picture, or initials when there is none.", Demo: () => (
    <Cluster gap="s"><Avatar name="Maya Okafor" size={32} /><Avatar name="Alex Rivera" /><Avatar name="Sam Chen" size={56} /><Avatar name="Colibri" size={72} /></Cluster>
  ) },
  { id: "text-field", title: "TextField", description: "A labelled input with a hint or an error.", Demo: () => {
    const [name, setName] = useState(""), [email, setEmail] = useState("not-an-email");
    return (
      <Card>
        <TextField label="Name" placeholder="Ada Lovelace" value={name} onChangeText={setName} hint="Shown on your profile." testID="name" />
        <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={/^\S+@\S+\.\S+$/.test(email) ? undefined : "Enter a valid email address."} />
        <TextField label="Read only" value="Cannot be edited" editable={false} />
      </Card>
    );
  } },
  { id: "switch", title: "Switch", description: "The platform switch in theme colours, with an optional label row.", Demo: () => {
    const [push, setPush] = useState(true), [email, setEmail] = useState(false);
    return <Card><Switch label="Push notifications" value={push} onValueChange={setPush} /><Divider /><Switch label="Email digest" value={email} onValueChange={setEmail} /><Divider /><Switch label="Unavailable" value={false} disabled /></Card>;
  } },
  { id: "checkbox", title: "Checkbox", description: "A tick box with its label as one press target.", Demo: () => {
    const [terms, setTerms] = useState(false), [news, setNews] = useState(true);
    return <Card><Checkbox label="I agree to the terms" checked={terms} onChange={setTerms} /><Checkbox label="Send me product news" checked={news} onChange={setNews} /><Checkbox label="Unavailable" disabled /></Card>;
  } },
  { id: "radio-group", title: "RadioGroup", description: "One choice from a short list.", Demo: () => {
    const [plan, setPlan] = useState("pro");
    return <Card><RadioGroup value={plan} onChange={setPlan} options={[{ value: "free", label: "Free" }, { value: "pro", label: "Pro — $19 per month" }, { value: "team", label: "Team — $49 per month" }]} /><Text size="sm" tone="muted">Selected: {plan}</Text></Card>;
  } },
  { id: "tabs", title: "Tabs", description: "A segmented control for two to four views.", Demo: () => {
    const [view, setView] = useState("day");
    return <Stack><Tabs value={view} onChange={setView} options={[{ value: "day", label: "Day" }, { value: "week", label: "Week" }, { value: "month", label: "Month" }]} /><Card><Text>Showing the {view} view.</Text></Card></Stack>;
  } },
  { id: "list", title: "List and ListItem", description: "Rows with a title, detail, and things before and after.", Demo: () => {
    const toast = useToast();
    return (
      <Card padded={false} gap={0}>
        <List scrollEnabled={false} data={PEOPLE} keyExtractor={(person) => person.id} renderItem={({ item }) => (
          <ListItem title={item.name} subtitle={item.role} leading={<Avatar name={item.name} />} trailing={<Badge tone={item.tone}>{item.status}</Badge>} onPress={() => toast.show(`Opened ${item.name}`)} />
        )} />
      </Card>
    );
  } },
  { id: "progress", title: "Spinner and Progress", description: "Waiting, and how far along.", Demo: () => {
    const [value, setValue] = useState(0.4);
    return (
      <Card>
        <Cluster gap="m"><Spinner /><Spinner tone="ok" /><Spinner size="large" /></Cluster>
        <Progress value={value} /><Progress value={0.9} tone="ok" /><Progress value={0.25} tone="warn" />
        <Cluster><Button title="−10%" size="s" variant="outline" onPress={() => setValue((v) => Math.max(0, v - 0.1))} /><Button title="+10%" size="s" variant="outline" onPress={() => setValue((v) => Math.min(1, v + 0.1))} /></Cluster>
      </Card>
    );
  } },
  { id: "dialog", title: "Dialog", description: "A centred modal for a decision.", Demo: () => {
    const toast = useToast(), [open, setOpen] = useState(false);
    return (
      <Stack>
        <Button title="Delete project" variant="danger" onPress={() => setOpen(true)} testID="open-dialog" />
        <Dialog visible={open} onClose={() => setOpen(false)} title="Delete this project?"
          actions={<><Button title="Cancel" variant="ghost" onPress={() => setOpen(false)} /><Button title="Delete" variant="danger" onPress={() => { setOpen(false); toast.show("Project deleted", { tone: "bad" }); }} testID="confirm-delete" /></>}>
          This removes the project and its files for everyone. You cannot undo it.
        </Dialog>
      </Stack>
    );
  } },
  { id: "sheet", title: "Sheet", description: "A panel that slides up from the bottom edge.", Demo: () => {
    const toast = useToast(), [open, setOpen] = useState(false);
    return (
      <Stack>
        <Button title="Share" variant="outline" onPress={() => setOpen(true)} testID="open-sheet" />
        <Sheet visible={open} onClose={() => setOpen(false)} title="Share">
          <Stack gap="xs">
            <Button title="Copy link" variant="outline" block onPress={() => { setOpen(false); toast.show("Link copied", { tone: "ok" }); }} />
            <Button title="Send by email" variant="outline" block onPress={() => setOpen(false)} />
            <Button title="Cancel" variant="ghost" block onPress={() => setOpen(false)} testID="sheet-cancel" />
          </Stack>
        </Sheet>
      </Stack>
    );
  } },
  { id: "toast", title: "Toast", description: "A short message above the bottom edge.", Demo: () => {
    const toast = useToast();
    return (
      <Cluster>
        <Button title="Plain" variant="outline" onPress={() => toast.show("Copied to clipboard")} testID="show-toast" />
        <Button title="Success" variant="outline" onPress={() => toast.show("Profile saved", { tone: "ok" })} />
        <Button title="Warning" variant="outline" onPress={() => toast.show("Battery is low", { tone: "warn" })} />
        <Button title="Error" variant="outline" onPress={() => toast.show("Could not send", { tone: "bad" })} />
      </Cluster>
    );
  } },
];

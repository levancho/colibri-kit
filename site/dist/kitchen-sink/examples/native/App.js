// Colibri for React Native: every component on one screen.
// Runs in Expo (see README.md) and, through react-native-web, on https://colibri-kit.io/native/
import { useState } from "react";
import { Pressable, View } from "react-native";
import {
  ColibriProvider, ToastProvider, useToast, useTheme, Screen, Stack, Cluster, Divider, Text, Heading, Button, Card, Badge, Callout, Avatar,
  TextField, Switch, Checkbox, RadioGroup, Tabs, ListItem, Spinner, Progress, Dialog, Sheet,
} from "@colibri-kit/native";

const HUES = [255, 285, 330, 20, 75, 150, 190];
const PEOPLE = [
  { name: "Maya Okafor", role: "Product", status: "Online", tone: "ok" },
  { name: "Alex Rivera", role: "Design", status: "Away", tone: "warn" },
  { name: "Sam Chen", role: "Engineering", status: "Offline" },
];

function Section({ title, children }) {
  return (
    <Stack gap="s">
      <Text size="xs" weight="bold" tone="muted" style={{ letterSpacing: 1, textTransform: "uppercase" }}>{title}</Text>
      {children}
    </Stack>
  );
}

function Swatch({ hue, selected, onPress }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Hue ${hue}`} accessibilityState={{ selected }}
      style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 3, borderColor: selected ? theme.colors.fg : theme.colors.surface, backgroundColor: `hsl(${(hue + 330) % 360} 70% 50%)` }} />
  );
}

function Showcase({ hue, setHue, scheme, setScheme, radius, setRadius }) {
  const toast = useToast();
  const [name, setName] = useState(""), [email, setEmail] = useState("not-an-email");
  const [push, setPush] = useState(true), [terms, setTerms] = useState(false), [plan, setPlan] = useState("pro");
  const [dialog, setDialog] = useState(false), [sheet, setSheet] = useState(false), [saving, setSaving] = useState(false);
  const save = () => { setSaving(true); setTimeout(() => { setSaving(false); toast.show("Profile saved", { tone: "ok" }); }, 900); };

  return (
    <Screen scroll gap="l" testID="showcase">
      <Stack gap="xs">
        <Badge tone="accent">@colibri-kit/native</Badge>
        <Heading level={1}>Colibri for React Native</Heading>
        <Text tone="muted">One hue themes every component. Light and dark come free.</Text>
      </Stack>

      <Card>
        <Text size="sm" weight="semibold">Accent colour</Text>
        <Cluster gap="xs">{HUES.map((value) => <Swatch key={value} hue={value} selected={value === hue} onPress={() => setHue(value)} />)}</Cluster>
        <Text size="sm" weight="semibold">Appearance</Text>
        <Tabs value={scheme} onChange={setScheme} options={[{ value: "auto", label: "Auto" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} />
        <Text size="sm" weight="semibold">Corners</Text>
        <Tabs value={radius} onChange={setRadius} options={[{ value: "sharp", label: "Sharp" }, { value: "soft", label: "Soft" }, { value: "round", label: "Round" }]} />
      </Card>

      <Section title="Buttons">
        <Cluster>
          <Button title="Solid" onPress={() => toast.show("Solid pressed")} />
          <Button title="Soft" variant="soft" onPress={() => toast.show("Soft pressed")} />
          <Button title="Outline" variant="outline" onPress={() => toast.show("Outline pressed")} />
          <Button title="Ghost" variant="ghost" onPress={() => toast.show("Ghost pressed")} />
          <Button title="Delete" variant="danger" onPress={() => toast.show("Deleted", { tone: "bad" })} />
        </Cluster>
        <Cluster>
          <Button title="Small" size="s" variant="outline" />
          <Button title="Large" size="l" />
          <Button title="Disabled" disabled />
          <Button title="Saving" loading />
        </Cluster>
      </Section>

      <Section title="Form">
        <Card>
          <TextField label="Name" placeholder="Ada Lovelace" value={name} onChangeText={setName} hint="Shown on your profile." testID="name" />
          <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={/^\S+@\S+\.\S+$/.test(email) ? undefined : "Enter a valid email address."} />
          <Switch label="Push notifications" value={push} onValueChange={setPush} />
          <Checkbox label="I agree to the terms" checked={terms} onChange={setTerms} />
          <RadioGroup value={plan} onChange={setPlan} options={[{ value: "free", label: "Free" }, { value: "pro", label: "Pro — $19 per month" }, { value: "team", label: "Team — $49 per month" }]} />
          <Button title="Save profile" block loading={saving} onPress={save} testID="save" />
        </Card>
      </Section>

      <Section title="Status">
        <Cluster>
          <Badge>Draft</Badge><Badge tone="accent">New</Badge><Badge tone="ok">Paid</Badge><Badge tone="warn">Due soon</Badge><Badge tone="bad">Failed</Badge>
        </Cluster>
        <Callout title="Heads up">Your trial ends in three days.</Callout>
        <Callout tone="ok" title="Payment received">Thanks. Your receipt is in your inbox.</Callout>
        <Callout tone="warn" title="Storage almost full">You have used 92% of your space.</Callout>
        <Callout tone="bad" title="Could not sync">Check your connection and try again.</Callout>
        <Cluster gap="m"><Spinner /><View style={{ flex: 1 }}><Progress value={0.62} /></View></Cluster>
      </Section>

      <Section title="List">
        <Card padded={false} gap={0}>
          {PEOPLE.map((person, index) => (
            <View key={person.name}>
              {index ? <Divider /> : null}
              <ListItem title={person.name} subtitle={person.role} leading={<Avatar name={person.name} />} trailing={<Badge tone={person.tone}>{person.status}</Badge>} onPress={() => toast.show(`Opened ${person.name}`)} />
            </View>
          ))}
        </Card>
      </Section>

      <Section title="Overlays">
        <Cluster>
          <Button title="Open dialog" variant="outline" onPress={() => setDialog(true)} testID="open-dialog" />
          <Button title="Open sheet" variant="outline" onPress={() => setSheet(true)} testID="open-sheet" />
          <Button title="Show toast" variant="soft" onPress={() => toast.show("Copied to clipboard", { tone: "accent" })} testID="show-toast" />
        </Cluster>
      </Section>

      <Dialog visible={dialog} onClose={() => setDialog(false)} title="Delete this project?"
        actions={<><Button title="Cancel" variant="ghost" onPress={() => setDialog(false)} /><Button title="Delete" variant="danger" onPress={() => { setDialog(false); toast.show("Project deleted", { tone: "bad" }); }} testID="confirm-delete" /></>}>
        This removes the project and its files for everyone. You cannot undo it.
      </Dialog>
      <Sheet visible={sheet} onClose={() => setSheet(false)} title="Share">
        <Stack gap="xs">
          <Button title="Copy link" variant="outline" block onPress={() => { setSheet(false); toast.show("Link copied", { tone: "ok" }); }} />
          <Button title="Send by email" variant="outline" block onPress={() => setSheet(false)} />
          <Button title="Cancel" variant="ghost" block onPress={() => setSheet(false)} />
        </Stack>
      </Sheet>
    </Screen>
  );
}

export default function App() {
  const [hue, setHue] = useState(255), [scheme, setScheme] = useState("auto"), [radius, setRadius] = useState("soft");
  return (
    <ColibriProvider hue={hue} scheme={scheme} radius={radius}>
      <ToastProvider>
        <Showcase hue={hue} setHue={setHue} scheme={scheme} setScheme={setScheme} radius={radius} setRadius={setRadius} />
      </ToastProvider>
    </ColibriProvider>
  );
}

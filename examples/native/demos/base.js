// Demos for the display group: surfaces, typography and the small building blocks.
import { useEffect, useState } from "react";
import { View } from "react-native";
import {
  ColibriProvider, useToast, useTheme, Stack, Cluster, Divider, Text, Heading, Button, Card, Badge, Avatar, TextField, Switch, Spinner,
  Accordion, Alert, Collapsible, Link, Inset, IconButton,
  Blockquote, Code, Lead, Small, Muted, ThemeSwitch, Toggle, Item, ItemGroup, ButtonGroup, Toolbar, ToolbarSeparator, ToolbarSpacer,
} from "@colibri-kit/native-core";

// Text glyphs stand in for icons: the package ships no icon font.
const ICON = { undo: "↶", redo: "↷", link: "∞", close: "×", plus: "+", more: "⋯", star: "★", bell: "♪", file: "▤", lock: "⚙\uFE0E" };

const Caption = ({ children }) => <Text size="xs" weight="bold" tone="muted" style={{ letterSpacing: 0.8, textTransform: "uppercase" }}>{children}</Text>;

/** A tinted panel with soft shapes, standing in for a photo or a video frame. */
function Artwork({ label, detail }) {
  const theme = useTheme(), c = theme.colors;
  return (
    <View style={{ flex: 1, minHeight: 96, backgroundColor: c.accentSoft, overflow: "hidden", justifyContent: "flex-end", padding: theme.space.s }}>
      <View style={{ position: "absolute", width: 180, height: 180, borderRadius: 90, right: -50, top: -70, backgroundColor: c.accent, opacity: 0.22 }} />
      <View style={{ position: "absolute", width: 120, height: 120, borderRadius: 60, right: 60, bottom: -70, backgroundColor: c.accent, opacity: 0.3 }} />
      {label ? <Text weight="bold" tone="accent">{label}</Text> : null}
      {detail ? <Text size="xs" tone="accent">{detail}</Text> : null}
    </View>
  );
}

const FAQ = [
  { value: "shipping", title: "How long does delivery take?", content: "Orders placed before 2 pm leave the same day. Standard delivery takes two to four working days." },
  { value: "returns", title: "Can I return an item?", content: "Yes, within 30 days if it is unused. Start a return from the order page and print the prepaid label." },
  { value: "gift", title: "Gift wrapping", content: "Unavailable during the sale.", disabled: true },
];

export default [
  { id: "accordion", title: "Accordion", description: "Headings that each expand to show a section, one at a time or several.", Demo: () => {
    const [open, setOpen] = useState("shipping");
    return (
      <Stack gap="m">
        <Stack gap="xs">
          <Caption>Single, collapsible</Caption>
          <Accordion collapsible items={FAQ} value={open} onChange={setOpen} />
          <Muted>Open section: {open ?? "none"}</Muted>
        </Stack>
        <Stack gap="xs">
          <Caption>Multiple</Caption>
          <Accordion type="multiple" defaultValue={["sound"]} items={[
            { value: "sound", title: "Sound", content: <Stack gap="xs"><Switch label="Ringtone" value onValueChange={() => {}} /><Muted>Plays for calls and alarms.</Muted></Stack> },
            { value: "display", title: "Display", content: "Brightness adjusts to the light around you." },
            { value: "storage", title: "Storage", content: "41 GB of 64 GB used. Photos take up the most space." },
          ]} />
        </Stack>
      </Stack>
    );
  } },
  { id: "alert", title: "Alert", description: "A message box inside the page, with an icon, an optional action and a close button.", Demo: () => {
    const toast = useToast(), [round, setRound] = useState(0), [failed, setFailed] = useState(true);
    return (
      <Stack key={round}>
        <Alert title="Update available" dismissible>Version 4.2 adds offline maps. It installs the next time you restart.</Alert>
        <Alert tone="ok" title="Changes saved" dismissible>Your profile is up to date.</Alert>
        <Alert tone="warn" title="Card expires soon" action={<Button title="Update card" size="s" variant="outline" onPress={() => toast.show("Opening billing")} />}>The card ending in 4242 expires next month.</Alert>
        <Alert tone="bad" title="Payment failed" visible={failed} dismissible onDismiss={() => setFailed(false)}>We could not charge your card. Nothing was ordered.</Alert>
        <Alert tone="accent">A one-line note needs no title.</Alert>
        <Button title="Show them again" variant="ghost" size="s" onPress={() => { setRound(round + 1); setFailed(true); }} />
      </Stack>
    );
  } },
  { id: "collapsible", title: "Collapsible", description: "One button that shows or hides a block of content.", Demo: () => {
    const [advanced, setAdvanced] = useState(false);
    return (
      <Stack gap="m">
        <Card gap="2xs">
          <Heading level={4}>Attendees</Heading>
          <Text>Maya Okafor</Text><Text>Alex Rivera</Text>
          <Collapsible trigger={(open) => (open ? "Show fewer" : "Show 3 more")} gap="2xs">
            <Text>Sam Chen</Text><Text>Priya Nair</Text><Text>Jonas Weber</Text>
          </Collapsible>
        </Card>
        <Card>
          <TextField label="Server" value="mail.example.com" onChangeText={() => {}} />
          <Collapsible trigger="Advanced options" open={advanced} onOpenChange={setAdvanced}>
            <TextField label="Port" value="993" keyboardType="number-pad" onChangeText={() => {}} />
            <Switch label="Require TLS" value onValueChange={() => {}} />
          </Collapsible>
        </Card>
      </Stack>
    );
  } },
  { id: "link", title: "Link", description: "A text link, alone or inside a sentence, with a style for the current page.", Demo: () => {
    const toast = useToast(), [page, setPage] = useState("Overview");
    return (
      <Stack gap="m">
        <Cluster gap="m">{["Overview", "Pricing", "Changelog"].map((name) => <Link key={name} current={page === name} onPress={() => setPage(name)}>{name}</Link>)}</Cluster>
        <Card>
          <Text>By continuing you agree to the <Link onPress={() => toast.show("Opening the terms")}>terms of service</Link> and the <Link onPress={() => toast.show("Opening the privacy policy")}>privacy policy</Link>.</Text>
          <Divider />
          <Cluster gap="m"><Link href="https://reactnative.dev">Opens a web address</Link><Link tone="bad" onPress={() => toast.show("Account deletion", { tone: "bad" })}>Delete account</Link><Link disabled>Unavailable</Link></Cluster>
        </Card>
      </Stack>
    );
  } },
  { id: "inset", title: "Inset", description: "Lets media inside a padded card run to the card's edges.", Demo: () => (
    <Stack gap="m">
      <Card>
        <Inset side="top"><View style={{ aspectRatio: 21 / 9 }}><Artwork /></View></Inset>
        <Stack gap="2xs"><Text weight="semibold">Glacier pack, 28 L</Text><Muted>The cover runs edge to edge; the text keeps the card padding.</Muted></Stack>
        <Cluster justify="space-between"><Text weight="bold">$149</Text><Button title="Add to bag" size="s" /></Cluster>
      </Card>
      <Card>
        <Text weight="semibold">Team</Text>
        <Inset side="bottom">
          <Divider />
          <Item media={<Avatar name="Maya Okafor" size={36} />} title="Maya Okafor" description="Owner" />
          <Divider />
          <Item media={<Avatar name="Alex Rivera" size={36} />} title="Alex Rivera" description="Editor" />
        </Inset>
      </Card>
    </Stack>
  ) },
  { id: "icon-button", title: "IconButton", description: "A square or round button that shows only an icon and always carries a label.", Demo: () => {
    const toast = useToast();
    return (
      <Card>
        <Cluster>
          <IconButton icon={ICON.undo} label="Undo" onPress={() => toast.show("Undone")} testID="undo" />
          <IconButton icon={ICON.redo} label="Redo" disabled />
          <IconButton icon={ICON.more} label="More actions" variant="outline" onPress={() => toast.show("More actions")} />
          <IconButton icon={ICON.star} label="Add to favourites" variant="soft" onPress={() => toast.show("Added to favourites", { tone: "ok" })} />
          <IconButton icon={ICON.plus} label="New note" variant="solid" shape="round" onPress={() => toast.show("New note")} />
          <IconButton icon={ICON.close} label="Remove" variant="danger" shape="round" onPress={() => toast.show("Removed", { tone: "bad" })} />
        </Cluster>
        <Divider />
        <Cluster><IconButton icon={ICON.plus} label="Add, small" size="s" variant="outline" /><IconButton icon={ICON.plus} label="Add, medium" variant="outline" /><IconButton icon={ICON.plus} label="Add, large" size="l" variant="outline" /></Cluster>
        <Muted>Screen readers hear the label: “Undo”, “More actions”, “New note”.</Muted>
      </Card>
    );
  } },
  { id: "typography", title: "Typography", description: "Lead paragraphs, quotes, inline code and small print for article content.", Demo: () => (
    <Stack gap="m">
      <Stack gap="xs">
        <Heading level={1}>Shipping small</Heading>
        <Lead>Why we release every Tuesday, and what changed when we stopped saving work up for big launches.</Lead>
      </Stack>
      <Text>Each release goes out behind a flag. Turn one on with <Code>colibri flags enable checkout-v2</Code> and roll it back with <Code>disable</Code>.</Text>
      <Blockquote cite="Maya Okafor, engineering lead">Small releases are boring, and boring is what we want at four on a Friday.</Blockquote>
      <Small>Fine print in the normal text colour.</Small>
      <Muted>Last edited 12 November by Alex Rivera.</Muted>
    </Stack>
  ) },
  { id: "theme-switch", title: "ThemeSwitch", description: "Chooses light, dark or the device setting; you pass the value to ColibriProvider.", Demo: () => {
    const [scheme, setScheme] = useState("auto");
    return (
      <Stack gap="m">
        <ThemeSwitch value={scheme} onChange={setScheme} block />
        <ColibriProvider scheme={scheme}>
          <Card>
            <Cluster justify="space-between"><Text weight="semibold">Preview</Text><Badge tone="accent">{scheme}</Badge></Cluster>
            <Muted>This card sits in its own ColibriProvider and follows the choice above. “System” follows the device.</Muted>
            <Cluster><Button title="Primary" size="s" /><Button title="Outline" size="s" variant="outline" /></Cluster>
          </Card>
        </ColibriProvider>
        <Stack gap="xs"><Caption>One button that cycles</Caption><ThemeSwitch variant="button" value={scheme} onChange={setScheme} testID="cycle" /></Stack>
      </Stack>
    );
  } },
  { id: "toggle", title: "Toggle", description: "A button that stays pressed or unpressed.", Demo: () => {
    const [bold, setBold] = useState(true), [italic, setItalic] = useState(false), [pinned, setPinned] = useState(false);
    return (
      <Card>
        <Cluster>
          <Toggle label="Bold" pressed={bold} onChange={setBold} textStyle={{ fontWeight: "800" }} testID="bold">B</Toggle>
          <Toggle label="Italic" pressed={italic} onChange={setItalic} textStyle={{ fontStyle: "italic" }}>I</Toggle>
          <Toggle label="Underline" disabled textStyle={{ textDecorationLine: "underline" }}>U</Toggle>
          <Toggle variant="outline" pressed={pinned} onChange={setPinned}>{pinned ? "★ Pinned" : "☆ Pin"}</Toggle>
        </Cluster>
        <Divider />
        <Text style={{ fontWeight: bold ? "700" : "400", fontStyle: italic ? "italic" : "normal" }}>The quick brown fox jumps over the lazy dog.</Text>
        <Cluster><Toggle size="s" variant="outline" defaultPressed>Small</Toggle><Toggle variant="outline">Medium</Toggle><Toggle size="l" variant="outline">Large</Toggle></Cluster>
      </Card>
    );
  } },
  { id: "item", title: "Item", description: "A list row with media, title, description and actions at the end.", Demo: () => {
    const toast = useToast(), [notify, setNotify] = useState(true);
    return (
      <ItemGroup label="Account settings">
        <Item media={ICON.bell} title="Notifications" description="Email and push" actions={<Switch value={notify} onValueChange={setNotify} accessibilityLabel="Notifications" />} />
        <Item media={<Avatar name="Maya Okafor" size={36} />} title="Profile" description="Opens your profile" onPress={() => toast.show("Opening profile")} testID="profile-row" />
        <Item media={ICON.file} title="report-2026.pdf" description="2.4 MB · 30 Oct" onPress={() => toast.show("Opening report-2026.pdf")}
          actions={<><Button title="Download" size="s" variant="outline" onPress={() => toast.show("Downloading", { tone: "ok" })} /><IconButton icon={ICON.close} label="Delete file" size="s" onPress={() => toast.show("File deleted", { tone: "bad" })} /></>} />
        <Item media={ICON.lock} title="Two-factor login" description="Managed by your organisation" disabled actions={<Badge>Off</Badge>} />
      </ItemGroup>
    );
  } },
  { id: "button-group", title: "ButtonGroup", description: "Related buttons joined into one control: plain actions, pick one, or pick several.", Demo: () => {
    const toast = useToast(), [align, setAlign] = useState("center"), [style, setStyle] = useState(["bold"]), [view, setView] = useState("list");
    return (
      <Stack gap="m">
        <Stack gap="xs"><Caption>Actions</Caption><ButtonGroup label="File actions" onAction={(value) => toast.show(`${value} pressed`)} options={[{ value: "Copy", label: "Copy" }, { value: "Paste", label: "Paste" }, { value: "Delete", label: "Delete" }]} /></Stack>
        <Stack gap="xs"><Caption>Pick one (required)</Caption><ButtonGroup label="Text align" type="single" required block value={align} onChange={setAlign} options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }]} /></Stack>
        <Stack gap="xs"><Caption>Pick several</Caption><ButtonGroup label="Text style" type="multiple" value={style} onChange={setStyle} options={[
          { value: "bold", label: "B", accessibilityLabel: "Bold", textStyle: { fontWeight: "800" } }, { value: "italic", label: "I", accessibilityLabel: "Italic", textStyle: { fontStyle: "italic" } },
          { value: "underline", label: "U", accessibilityLabel: "Underline", textStyle: { textDecorationLine: "underline" } }, { value: "strike", label: "S", accessibilityLabel: "Strikethrough (unavailable)", textStyle: { textDecorationLine: "line-through" }, disabled: true }]} /></Stack>
        <Stack gap="xs"><Caption>Vertical</Caption><ButtonGroup label="View" type="single" orientation="vertical" value={view} onChange={setView} options={[{ value: "list", label: "List", icon: "☰" }, { value: "grid", label: "Grid", icon: "▦" }, { value: "board", label: "Board", icon: "▥" }]} /></Stack>
        <Muted>Align: {align} · Style: {style.join(", ") || "none"} · View: {view ?? "none"}</Muted>
      </Stack>
    );
  } },
  { id: "toolbar", title: "Toolbar", description: "A bar of related controls grouped under one name.", Demo: () => {
    const toast = useToast(), [marks, setMarks] = useState(["bold"]);
    return (
      <Stack>
        <Toolbar label="Formatting">
          <IconButton icon={ICON.undo} label="Undo" size="s" onPress={() => toast.show("Undone")} />
          <IconButton icon={ICON.redo} label="Redo" size="s" disabled />
          <ToolbarSeparator />
          <ButtonGroup label="Text style" type="multiple" size="s" value={marks} onChange={setMarks} options={[
            { value: "bold", label: "B", accessibilityLabel: "Bold", textStyle: { fontWeight: "800" } }, { value: "italic", label: "I", accessibilityLabel: "Italic", textStyle: { fontStyle: "italic" } }]} />
          <ToolbarSeparator />
          <IconButton icon={ICON.link} label="Insert link" size="s" onPress={() => toast.show("Insert link")} />
          <ToolbarSpacer />
          <Button title="Share" size="s" onPress={() => toast.show("Share")} />
        </Toolbar>
        <Card>
          <Text style={{ fontWeight: marks.includes("bold") ? "700" : "400", fontStyle: marks.includes("italic") ? "italic" : "normal" }}>Meeting notes: agree the launch date and who writes the announcement.</Text>
          <Muted>Edited 2 minutes ago</Muted>
        </Card>
      </Stack>
    );
  } },
  { id: "spinner", title: "Spinner", description: "The platform activity indicator in theme colours, announced while something loads.", Demo: () => {
    const [loading, setLoading] = useState(false), [rows, setRows] = useState(null);
    useEffect(() => {
      if (!loading) return undefined;
      const timer = setTimeout(() => { setLoading(false); setRows(128); }, 1800);
      return () => clearTimeout(timer);
    }, [loading]);
    return (
      <Card>
        <Cluster gap="m"><Spinner accessibilityLabel="Loading" /><Spinner size="large" accessibilityLabel="Loading" /><Spinner tone="ok" accessibilityLabel="Loading" /><Spinner tone="warn" accessibilityLabel="Loading" /><Spinner tone="bad" accessibilityLabel="Loading" /></Cluster>
        <Divider />
        <Cluster><Button title="Saving…" loading /><Button title="Load data" variant="outline" disabled={loading} onPress={() => { setRows(null); setLoading(true); }} testID="load" /></Cluster>
        <Cluster gap="xs" style={{ minHeight: 24 }} accessibilityLiveRegion="polite">
          {loading ? <><Spinner accessibilityLabel="Loading data" /><Muted>Loading data…</Muted></> : <Muted>{rows ? `Loaded ${rows} rows.` : "Nothing loaded yet."}</Muted>}
        </Cluster>
      </Card>
    );
  } },
];

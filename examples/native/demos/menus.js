// Demos for the overlays and menus: things that open above the screen.
import { useState } from "react";
import { View } from "react-native";
import {
  useToast, useTheme, Stack, Cluster, Divider, Text, Heading, Button, Card, Badge, TextField, Checkbox, RadioGroup, ListItem,
  AlertDialog, Drawer, Popover, DropdownMenu, ContextMenu, Tooltip,
} from "@colibri-kit/native-core";

const FILES = [
  { id: "1", name: "Q3 roadmap.pdf", detail: "2.4 MB · edited yesterday" },
  { id: "2", name: "Launch checklist.md", detail: "18 KB · edited 2 hours ago" },
];

export default [
  { id: "alert-dialog", title: "AlertDialog", description: "A confirmation that must be answered: tapping outside or pressing back does not close it.", Demo: () => {
    const toast = useToast(), [asking, setAsking] = useState(null), [busy, setBusy] = useState(false);
    const publish = () => { setBusy(true); setTimeout(() => { setBusy(false); setAsking(null); toast.show("Article published", { tone: "ok" }); }, 900); };
    return (
      <Card>
        <Stack gap="3xs"><Text weight="semibold">Getting started with Colibri</Text><Text size="sm" tone="muted">Draft · last saved 4 minutes ago</Text></Stack>
        <Cluster>
          <Button title="Publish…" onPress={() => setAsking("publish")} testID="open-publish" />
          <Button title="Delete article…" variant="danger" onPress={() => setAsking("delete")} testID="open-alert-dialog" />
        </Cluster>
        <AlertDialog visible={asking === "delete"} variant="danger" title="Delete this article?" description="The article and its 12 comments are removed for everyone. This cannot be undone."
          confirmLabel="Delete" onCancel={() => setAsking(null)} onConfirm={() => { setAsking(null); toast.show("Article deleted", { tone: "bad" }); }} />
        <AlertDialog visible={asking === "publish"} title="Publish now?" description="Subscribers get an email as soon as the article is live."
          confirmLabel="Publish" cancelLabel="Not yet" loading={busy} onCancel={() => setAsking(null)} onConfirm={publish} />
      </Card>
    );
  } },
  { id: "drawer", title: "Drawer", description: "A panel that slides in from any edge; drag it back towards the edge, tap outside or press back to close.", Demo: () => {
    const toast = useToast(), theme = useTheme(), [side, setSide] = useState(null), close = () => setSide(null);
    const [stock, setStock] = useState(true), [sale, setSale] = useState(false), [sort, setSort] = useState("new");
    return (
      <Stack>
        <Cluster>
          <Button title="Filters (right)" variant="outline" onPress={() => setSide("right")} testID="open-drawer-right" />
          <Button title="Menu (left)" variant="outline" onPress={() => setSide("left")} testID="open-drawer-left" />
          <Button title="Details (bottom)" variant="outline" onPress={() => setSide("bottom")} testID="open-drawer-bottom" />
          <Button title="Notice (top)" variant="outline" onPress={() => setSide("top")} testID="open-drawer-top" />
        </Cluster>
        <Drawer visible={side === "right"} side="right" title="Filters" onClose={close}
          footer={<><Button title="Reset" variant="ghost" onPress={() => { setStock(true); setSale(false); setSort("new"); }} /><Button title="Show 24 results" onPress={() => { close(); toast.show("Filters applied", { tone: "ok" }); }} /></>}>
          <Text size="sm" weight="semibold">Availability</Text>
          <Stack gap="3xs"><Checkbox label="In stock" checked={stock} onChange={setStock} /><Checkbox label="On sale" checked={sale} onChange={setSale} /></Stack>
          <Divider />
          <Text size="sm" weight="semibold">Sort by</Text>
          <RadioGroup value={sort} onChange={setSort} options={[{ value: "new", label: "Newest first" }, { value: "low", label: "Price: low to high" }, { value: "high", label: "Price: high to low" }]} />
        </Drawer>
        <Drawer visible={side === "left"} side="left" title="Colibri Studio" onClose={close}>
          <Stack gap="3xs" style={{ marginHorizontal: -theme.space.m }}>
            {["Dashboard", "Articles", "Media library", "Members", "Settings"].map((name) => <ListItem key={name} title={name} trailing="›" onPress={() => { close(); toast.show(`Opened ${name}`); }} />)}
          </Stack>
        </Drawer>
        <Drawer visible={side === "bottom"} side="bottom" title="Order #4821" onClose={close}>
          <Cluster justify="space-between"><Text tone="muted">Status</Text><Badge tone="ok">Shipped</Badge></Cluster>
          <Cluster justify="space-between"><Text tone="muted">Carrier</Text><Text>DHL Express</Text></Cluster>
          <Cluster justify="space-between"><Text tone="muted">Arrives</Text><Text>Thursday, 14 March</Text></Cluster>
          <Button title="Track parcel" block onPress={close} />
        </Drawer>
        <Drawer visible={side === "top"} side="top" title="Scheduled maintenance" onClose={close}>
          <Text tone="muted">Publishing is paused on Sunday from 02:00 to 03:00 UTC while we upgrade the database.</Text>
          <Button title="Got it" variant="soft" onPress={close} />
        </Drawer>
      </Stack>
    );
  } },
  { id: "dropdown-menu", title: "DropdownMenu", description: "A button that opens a list of actions, with tick and radio items, a sub-menu and a destructive item; it can also present as a sheet.", Demo: () => {
    const toast = useToast(), [published, setPublished] = useState(true), [language, setLanguage] = useState("ka"), [asking, setAsking] = useState(false);
    const items = [
      { type: "label", label: "Article" },
      { label: "Edit", shortcut: "⌘E", onSelect: () => toast.show("Editing article") },
      { label: "Duplicate", onSelect: () => toast.show("Article duplicated", { tone: "ok" }) },
      { label: "Archive", disabled: true },
      { type: "separator" },
      { type: "checkbox", label: "Published", checked: published, onChange: setPublished },
      { type: "radio", label: "Language", value: language, onChange: setLanguage, options: [{ value: "ka", label: "Georgian" }, { value: "en", label: "English" }] },
      { label: "Share", items: [{ label: "Copy link", onSelect: () => toast.show("Link copied", { tone: "ok" }) }, { label: "Email", onSelect: () => toast.show("Opening mail") }] },
      { type: "separator" },
      { label: "Delete", destructive: true, onSelect: () => setAsking(true) },
    ];
    return (
      <Stack>
        <Card>
          <Cluster justify="space-between" wrap={false}>
            <Stack gap="3xs" style={{ flex: 1 }}><Text weight="semibold" numberOfLines={1}>Getting started with Colibri</Text>
              <Cluster><Badge tone={published ? "ok" : undefined}>{published ? "Published" : "Draft"}</Badge><Badge>{language === "ka" ? "Georgian" : "English"}</Badge></Cluster></Stack>
            <DropdownMenu label="Article actions" align="end" items={items} trigger={<Button title="⋯" variant="ghost" accessibilityLabel="Article actions" testID="open-menu-more" />} />
          </Cluster>
        </Card>
        <Cluster>
          <DropdownMenu label="Article actions" items={items} trigger={<Button title="Actions ⌄" variant="outline" testID="open-dropdown-menu" />} />
          <DropdownMenu label="Article actions" presentation="sheet" items={items} trigger={<Button title="As a sheet" variant="outline" testID="open-menu-sheet" />} />
        </Cluster>
        <AlertDialog visible={asking} variant="danger" title="Delete this article?" description="This cannot be undone." confirmLabel="Delete"
          onCancel={() => setAsking(false)} onConfirm={() => { setAsking(false); toast.show("Article deleted", { tone: "bad" }); }} />
      </Stack>
    );
  } },
  { id: "context-menu", title: "ContextMenu", description: "The same menu opened where you long-press; phones have no right-click, so long press stands in for it (right-click still works on the web).", Demo: () => {
    const toast = useToast(), theme = useTheme(), [starred, setStarred] = useState({ 1: true });
    return (
      <Stack>
        <Card padded={false} gap={0}>
          {FILES.map((file, index) => (
            <View key={file.id}>
              {index ? <Divider /> : null}
              <ContextMenu label={file.name} items={[
                { label: "Open", onSelect: () => toast.show(`Opened ${file.name}`) },
                { label: "Rename", onSelect: () => toast.show("Rename") },
                { type: "checkbox", label: "Starred", checked: !!starred[file.id], onChange: (on) => setStarred({ ...starred, [file.id]: on }) },
                { type: "separator" },
                { label: "Move to bin", destructive: true, onSelect: () => toast.show(`${file.name} moved to bin`, { tone: "bad" }) },
              ]}>
                <ListItem title={file.name} subtitle={file.detail} trailing={starred[file.id] ? <Text tone="warn">★</Text> : null} />
              </ContextMenu>
            </View>
          ))}
        </Card>
        <ContextMenu label="Canvas" items={[{ label: "Paste", onSelect: () => toast.show("Pasted") }, { label: "Select all", onSelect: () => toast.show("Selected all") }, { type: "separator" }, { label: "Add note here", onSelect: () => toast.show("Note added", { tone: "ok" }) }]}>
          <View testID="context-area" style={{ padding: theme.space.xl, alignItems: "center", borderWidth: 1, borderStyle: "dashed", borderColor: theme.colors.line, borderRadius: theme.radius.m }}>
            <Text tone="muted" align="center">Long-press anywhere in this area</Text>
          </View>
        </ContextMenu>
      </Stack>
    );
  } },
  { id: "popover", title: "Popover", description: "Any content in a floating panel beside its trigger; it flips and shifts to stay on screen.", Demo: () => {
    const [width, setWidth] = useState("100%"), [height, setHeight] = useState("240"), [notify, setNotify] = useState(true);
    return (
      <Stack>
        <Card>
          <Text size="sm" tone="muted">Image block · {width} × {height}px</Text>
          <Cluster justify="space-between">
            <Popover label="Image size" trigger={<Button title="Size…" variant="outline" testID="open-popover" />}>
              {({ close }) => (
                <Stack gap="s" style={{ width: 220 }}>
                  <Heading level={4}>Image size</Heading>
                  <TextField label="Width" value={width} onChangeText={setWidth} />
                  <TextField label="Height (px)" value={height} onChangeText={setHeight} keyboardType="numeric" />
                  <Button title="Done" block onPress={close} testID="popover-done" />
                </Stack>
              )}
            </Popover>
            <Popover label="Notifications" side="top" align="end" trigger={<Button title="Notify me" variant="ghost" testID="open-popover-end" />}>
              <Stack gap="xs" style={{ width: 230 }}>
                <Text weight="semibold">Notifications</Text>
                <Checkbox label="Email me when someone replies" checked={notify} onChange={setNotify} />
              </Stack>
            </Popover>
          </Cluster>
        </Card>
      </Stack>
    );
  } },
  { id: "tooltip", title: "Tooltip", description: "A short hint for a control: shown on long press (hover with a mouse), then it hides by itself.", Demo: () => {
    const toast = useToast();
    return (
      <Card>
        <Text size="sm" tone="muted">Long-press a button to see what it does.</Text>
        <Cluster>
          <Tooltip label="Bold (⌘B)"><Button title="B" variant="outline" accessibilityLabel="Bold" onPress={() => toast.show("Bold")} testID="tooltip-bold" /></Tooltip>
          <Tooltip label="Italic (⌘I)"><Button title="I" variant="outline" accessibilityLabel="Italic" textStyle={{ fontStyle: "italic" }} onPress={() => toast.show("Italic")} /></Tooltip>
          <Tooltip label="Insert link" side="bottom"><Button title="Link" variant="outline" onPress={() => toast.show("Link")} /></Tooltip>
          <Tooltip label="Publishing is paused during maintenance, Sunday 02:00 to 03:00 UTC." side="bottom" align="end" duration={4000}><Button title="Why is this paused?" variant="ghost" testID="tooltip-long" /></Tooltip>
        </Cluster>
      </Card>
    );
  } },
];

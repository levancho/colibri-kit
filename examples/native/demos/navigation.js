// Demos for navigation: moving between and within screens.
import { useState } from "react";
import { View } from "react-native";
import {
  useTheme, useToast, Stack, Cluster, Divider, Text, Heading, Button, Card, Badge, Avatar, TextField, Switch, ListItem,
  Breadcrumb, Menu, NavigationMenu, Pagination, useScrollSpy, ScrollSpy, ScrollSpySection, ScrollTo, Sidebar, Stepper,
  Sticky, StickyScrollView, TabView, TabNav, Command,
} from "@colibri-kit/native";

/** A fixed-height window with its own scrolling, so a demo can scroll inside the catalog page. */
const Frame = ({ height = 380, children }) => {
  const theme = useTheme();
  return <View style={{ height, overflow: "hidden", borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.l, backgroundColor: theme.colors.bg }}>{children}</View>;
};
const Caption = ({ children }) => <Text size="xs" weight="bold" tone="muted" style={{ letterSpacing: 1, textTransform: "uppercase" }}>{children}</Text>;

const GUIDE = [
  { id: "overview", title: "Overview", body: ["Colibri Cloud hosts your site on servers close to your readers. A new project is live in under a minute.", "Every plan includes automatic HTTPS, daily backups and a staging copy you can break without consequences."] },
  { id: "install", title: "Install", body: ["Install the command-line tool with your package manager, then sign in once per machine.", "The tool keeps a small file in your project folder that records which site it belongs to.", "Run the deploy command from that folder whenever you want to publish."] },
  { id: "configure", title: "Configure", body: ["Settings live in one file at the root of the project. Most sites need only a name and a region.", "Secrets such as API keys are stored separately and never written to the file."] },
  { id: "deploy", title: "Deploy", body: ["A deploy uploads only the files that changed, then switches traffic over in one step.", "If the health check fails, the previous version keeps serving and you get an email with the log.", "You can roll back to any of the last twenty versions."] },
  { id: "billing", title: "Billing", body: ["You pay for the traffic you serve, measured daily and billed at the end of the month.", "Set a spending limit to pause the site, or just to be warned, when a month runs high."] },
];
const Section = ({ section, top }) => (
  <Stack gap="xs">
    <Heading level={3}>{section.title}</Heading>
    {section.body.map((line) => <Text key={line} tone="muted">{line}</Text>)}
    {top ? <ScrollTo to="top">↑ Back to top</ScrollTo> : null}
  </Stack>
);

const ORDERS = [
  { day: "Today", rows: [["Maya Okafor", "Annual plan", "$240.00"], ["Sam Chen", "Team seats × 3", "$54.00"], ["Priya Nair", "Monthly plan", "$24.00"]] },
  { day: "Yesterday", rows: [["Alex Rivera", "Monthly plan", "$24.00"], ["Jonas Weber", "Storage add-on", "$8.00"], ["Lucía Gómez", "Annual plan", "$240.00"], ["Tom Baker", "Monthly plan", "$24.00"]] },
  { day: "Monday 9 November", rows: [["Aiko Tanaka", "Team seats × 5", "$90.00"], ["Noah Smith", "Monthly plan", "$24.00"], ["Elif Demir", "Annual plan", "$240.00"]] },
];

const SIDEBAR = [
  { type: "group", label: "Workspace", items: [
    { value: "home", label: "Home", icon: "⌂" },
    { value: "inbox", label: "Inbox", icon: "✉", badge: 12 },
    { value: "tasks", label: "My tasks", icon: "✓", badge: 3 },
  ] },
  { type: "group", label: "Projects", items: [
    { label: "Website", icon: "◆", items: [{ value: "site-board", label: "Board" }, { value: "site-timeline", label: "Timeline" }, { value: "site-files", label: "Files" }] },
    { value: "mobile", label: "Mobile app", icon: "▲", badge: "Beta", badgeTone: "ok" },
    { value: "archive", label: "Archive", icon: "▣", disabled: true },
  ] },
  { type: "group", label: "Account", items: [{ value: "settings", label: "Settings", icon: "⚙" }, { value: "help", label: "Help and feedback", icon: "?" }] },
];
const SidebarHeader = () => (
  <Cluster wrap={false} gap="s"><Avatar name="Northwind Studio" size={36} /><View style={{ flex: 1 }}><Text weight="semibold" numberOfLines={1}>Northwind Studio</Text><Text size="xs" tone="muted">Team plan · 8 members</Text></View></Cluster>
);
const SidebarFooter = () => (
  <Cluster wrap={false} gap="s"><Avatar name="Maya Okafor" size={32} /><View style={{ flex: 1 }}><Text size="sm" weight="medium" numberOfLines={1}>Maya Okafor</Text><Text size="xs" tone="muted" numberOfLines={1}>maya@northwind.example</Text></View></Cluster>
);

const COMMANDS = [
  { label: "Go to", items: [
    { value: "home", label: "Home", icon: "⌂", shortcut: "G H", keywords: "main dashboard start" },
    { value: "articles", label: "Articles", icon: "☰", shortcut: "G A", keywords: "posts blog" },
    { value: "media", label: "Media library", icon: "▣", keywords: "images files uploads" },
  ] },
  { label: "Actions", items: [
    { value: "new-article", label: "New article", icon: "+", shortcut: "⌘ N", keywords: "create write post" },
    { value: "invite", label: "Invite a teammate", icon: "✉", keywords: "member user add" },
    { value: "export", label: "Export as CSV", icon: "↓", keywords: "download spreadsheet" },
  ] },
  { label: "Settings", items: [
    { value: "theme", label: "Change theme", icon: "◐", keywords: "dark light appearance" },
    { value: "profile", label: "Edit profile", icon: "☺", shortcut: "⌘ ,", keywords: "account name avatar" },
    { value: "billing", label: "Billing", icon: "$", disabled: true, description: "Only workspace owners can open billing." },
  ] },
];

export default [
  { id: "breadcrumb", title: "Breadcrumb", description: "Shows where you are; a long trail collapses its middle into an ellipsis you can press.", Demo: () => {
    const [last, setLast] = useState(null), go = (item) => setLast(item.label);
    return (
      <Stack gap="m">
        <Card>
          <Caption>Short trail</Caption>
          <Breadcrumb onNavigate={go} items={[{ label: "Home" }, { label: "Articles" }, { label: "Edit" }]} />
        </Card>
        <Card>
          <Caption>Long trail</Caption>
          <Breadcrumb onNavigate={go} items={[{ label: "Home" }, { label: "Workspace" }, { label: "Projects" }, { label: "Website redesign" }, { label: "Assets" }, { label: "Logo files" }]} />
          <Text size="sm" tone="muted">Press the ellipsis to show the hidden levels.</Text>
        </Card>
        <Text size="sm" tone="muted" accessibilityLiveRegion="polite">{last ? `Went to ${last}.` : "Press a level to go there."}</Text>
      </Stack>
    );
  } },
  { id: "menu", title: "Menu", description: "A list of actions with groups, glyph icons, shortcuts, checkable items, a selected item and a submenu that expands in place. The web menu bar has no phone equivalent, so this is the list its menus hold.", Demo: () => {
    const toast = useToast(), [sort, setSort] = useState("updated"), [wrap, setWrap] = useState(true), [bar, setBar] = useState(false);
    return (
      <Stack gap="m">
        <Card padded={false} style={{ padding: 8 }}>
          <Menu label="Document" onSelect={(value, item) => value && toast.show(item.label)} defaultExpanded={["Share"]} items={[
            { type: "group", label: "Document", items: [
              { value: "new", label: "New document", icon: "+", shortcut: "⌘ N" },
              { value: "duplicate", label: "Duplicate", icon: "❐", shortcut: "⌘ D" },
              { label: "Share", icon: "↗", items: [{ value: "link", label: "Copy link" }, { value: "email", label: "Send by email" }, { value: "pdf", label: "Export as PDF" }] },
            ] },
            { type: "separator" },
            { type: "group", label: "View", items: [
              { label: "Word wrap", icon: "↵", checked: wrap, onPress: () => setWrap(!wrap) },
              { label: "Status bar", icon: "▭", checked: bar, onPress: () => setBar(!bar) },
              { value: "history", label: "Version history", icon: "↺", disabled: true },
            ] },
            { type: "separator" },
            { value: "delete", label: "Move to trash", icon: "×", tone: "bad" },
          ]} />
        </Card>
        <Card padded={false} style={{ padding: 8 }}>
          <Menu label="Sort by" value={sort} onSelect={setSort} items={[{ type: "group", label: "Sort by", items: [
            { value: "updated", label: "Last updated", icon: "↓" }, { value: "name", label: "Name", icon: "A" }, { value: "size", label: "Size", icon: "▤" },
          ] }]} />
        </Card>
      </Stack>
    );
  } },
  { id: "navigation-menu", title: "NavigationMenu", description: "Top-level items that open a panel of links. On a phone they are sections that expand in place; on a wide screen they sit in a row.", Demo: () => {
    const [last, setLast] = useState(null);
    return (
      <Stack gap="m">
        <Card padded={false} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
          <NavigationMenu defaultOpen="products" onSelect={(value, link) => setLast(link.label)} items={[
            { value: "products", label: "Products", items: [
              { value: "cms", label: "Colibri CMS", description: "Publish pages and articles without a build step." },
              { value: "ui", label: "Colibri UI", description: "The component kit this catalog shows." },
              { value: "cloud", label: "Colibri Cloud", description: "Hosting with backups and a staging copy." },
            ] },
            { value: "resources", label: "Resources", items: [
              { value: "docs", label: "Documentation", description: "Guides and the full reference." },
              { value: "blog", label: "Blog", description: "Release notes and how we build." },
            ] },
            { value: "pricing", label: "Pricing" },
            { value: "contact", label: "Contact" },
          ]} />
        </Card>
        <Text size="sm" tone="muted" accessibilityLiveRegion="polite">{last ? `Opened ${last}.` : "Open a section and choose a link."}</Text>
      </Stack>
    );
  } },
  { id: "pagination", title: "Pagination", description: "Previous and next with page numbers and ellipses; it drops to a compact form when space is short.", Demo: () => {
    const [page, setPage] = useState(7), [small, setSmall] = useState(2), [compact, setCompact] = useState(3);
    return (
      <Stack gap="m">
        <Stack gap="xs">
          <Caption>Twenty pages</Caption>
          <Pagination page={page} total={20} onChange={setPage} label="Search results pages" />
          <Text size="sm" tone="muted" align="center">Showing results {(page - 1) * 10 + 1}–{page * 10} of 200</Text>
        </Stack>
        <Divider />
        <Stack gap="xs"><Caption>Five pages</Caption><Pagination page={small} total={5} onChange={setSmall} label="Invoices pages" /></Stack>
        <Divider />
        <Stack gap="xs"><Caption>Compact</Caption><Pagination compact page={compact} total={12} onChange={setCompact} label="Photos pages" /></Stack>
        <Divider />
        <Stack gap="xs"><Caption>Disabled</Caption><Pagination disabled defaultPage={1} total={3} label="Loading pages" /></Stack>
      </Stack>
    );
  } },
  { id: "scrollspy", title: "ScrollSpy", description: "Tracks which section of a ScrollView is in view and highlights its link. Scroll the guide, or press a chip.", Demo: () => {
    const theme = useTheme(), spy = useScrollSpy();
    return (
      <Stack>
        <Frame>
          <ScrollSpy spy={spy} nestedScrollEnabled contentContainerStyle={{ paddingBottom: theme.space.l }}>
            <Sticky>
              <Cluster wrap={false} gap="2xs" style={{ paddingHorizontal: theme.space.s, paddingVertical: theme.space.xs }}>
                {GUIDE.slice(0, 4).map((section) => <ScrollTo key={section.id} to={section.id} variant="chip" testID={`chip-${section.id}`}>{section.title}</ScrollTo>)}
              </Cluster>
            </Sticky>
            {GUIDE.slice(0, 4).map((section) => (
              <ScrollSpySection key={section.id} id={section.id} style={{ paddingHorizontal: theme.space.m, paddingTop: theme.space.m }}><Section section={section} /></ScrollSpySection>
            ))}
          </ScrollSpy>
        </Frame>
        <Text size="sm" tone="muted" accessibilityLiveRegion="polite">In view: <Text size="sm" weight="semibold">{GUIDE.find((section) => section.id === spy.active)?.title ?? "—"}</Text></Text>
      </Stack>
    );
  } },
  { id: "scrollto", title: "ScrollTo", description: "A link that scrolls smoothly to a section by id, or back to the top, and moves the screen reader there.", Demo: () => {
    const theme = useTheme(), spy = useScrollSpy(), [last, setLast] = useState(null);
    return (
      <Stack>
        <Frame>
          <ScrollSpy spy={spy} nestedScrollEnabled contentContainerStyle={{ padding: theme.space.m, gap: theme.space.l }}>
            <Card>
              <Caption>On this page</Caption>
              {GUIDE.map((section) => <ScrollTo key={section.id} to={section.id} onScroll={setLast} testID={`to-${section.id}`}>{section.title}</ScrollTo>)}
            </Card>
            {GUIDE.map((section) => <ScrollSpySection key={section.id} id={section.id}><Section section={section} top /></ScrollSpySection>)}
          </ScrollSpy>
        </Frame>
        <Cluster justify="space-between">
          <Text size="sm" tone="muted">{last ? `Scrolled to “${GUIDE.find((section) => section.id === last)?.title}”.` : "Choose a section."}</Text>
          <ScrollTo spy={spy} to="top" variant="button">Back to top</ScrollTo>
        </Cluster>
      </Stack>
    );
  } },
  { id: "sidebar", title: "Sidebar", description: "App navigation with a header, groups, badges, nested items and a footer. A drawer that slides in on a phone; a column that can collapse to a rail on a wide screen.", Demo: () => {
    const theme = useTheme(), [open, setOpen] = useState(false), [route, setRoute] = useState("inbox"), [collapsed, setCollapsed] = useState(true);
    const title = SIDEBAR.flatMap((group) => group.items).flatMap((item) => [item, ...(item.items ?? [])]).find((item) => item.value === route)?.label;
    return (
      <Stack gap="m">
        <Card>
          <Caption>Drawer</Caption>
          <Text tone="muted">Current screen: <Text weight="semibold">{title}</Text></Text>
          <Button title="☰  Open navigation" variant="outline" onPress={() => setOpen(true)} testID="open-sidebar" />
        </Card>
        <Sidebar open={open} onOpenChange={setOpen} mode="drawer" items={SIDEBAR} value={route} onSelect={setRoute} defaultExpanded={["Website"]} header={<SidebarHeader />} footer={<SidebarFooter />} label="Workspace navigation" />
        <Stack gap="xs">
          <Caption>In place</Caption>
          <View style={{ height: 380, flexDirection: "row", overflow: "hidden", borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.l, backgroundColor: theme.colors.bg }}>
            <Sidebar mode="inline" width={208} collapsed={collapsed} items={SIDEBAR} value={route} onSelect={setRoute} label="Workspace navigation, in place"
              header={collapsed ? <View style={{ alignItems: "center" }}><Avatar name="Northwind Studio" size={32} /></View> : <SidebarHeader />} />
            <Stack gap="xs" style={{ flex: 1, padding: theme.space.m }}>
              <Heading level={3} numberOfLines={1}>{title}</Heading>
              <Text size="sm" tone="muted">On a tablet the sidebar sits beside the content.</Text>
              <Switch label="Collapse to a rail" value={collapsed} onValueChange={setCollapsed} />
            </Stack>
          </View>
        </Stack>
      </Stack>
    );
  } },
  { id: "stepper", title: "Stepper", description: "A wizard with Back and Next. Steps are completed, current or upcoming; a step can be checked before moving on, and steps can be pressed.", Demo: () => {
    const [step, setStep] = useState(0), [email, setEmail] = useState(""), [name, setName] = useState(""), [error, setError] = useState(null), [track, setTrack] = useState(1);
    const valid = /^\S+@\S+\.\S+$/.test(email);
    return (
      <Stack gap="m">
        <Card gap="m">
          <Caption>Horizontal, checked before moving on</Caption>
          {step < 3 ? (
            <Stepper value={step} onChange={setStep} linear clickable label="Create account"
              onBeforeChange={(from, to) => { if (from === 0 && to > 0 && !valid) { setError("Enter a valid email address to continue."); return false; } setError(null); return true; }}
              steps={[
                { label: "Account", content: <TextField label="Email" placeholder="you@example.com" value={email} onChangeText={(text) => { setEmail(text); setError(null); }} keyboardType="email-address" autoCapitalize="none" error={error ?? undefined} testID="stepper-email" /> },
                { label: "Profile", description: "Optional", content: <TextField label="Display name" placeholder="Ada Lovelace" value={name} onChangeText={setName} hint="You can change this later." /> },
                { label: "Confirm", content: <Stack gap="2xs"><Text weight="semibold">Ready to create your account</Text><Text size="sm" tone="muted">{email}{name ? ` · ${name}` : ""}</Text></Stack> },
              ]} />
          ) : (
            <Stack><Badge tone="ok">Account created</Badge><Text tone="muted">We sent a confirmation link to {email}.</Text><Button title="Start again" variant="outline" onPress={() => { setStep(0); setEmail(""); setName(""); }} /></Stack>
          )}
        </Card>
        <Card gap="m">
          <Caption>Vertical, press any step</Caption>
          <Stepper orientation="vertical" clickable actions={false} value={track} onChange={setTrack} label="Order status" steps={[
            { label: "Order placed", description: "Tuesday 10 November, 09:14", content: <Text size="sm" tone="muted">We emailed your receipt.</Text> },
            { label: "Packed", description: "Wednesday 11 November, 16:40", content: <Text size="sm" tone="muted">Two parcels, 3.2 kg in total.</Text> },
            { label: "Out for delivery", description: "Expected Thursday before 18:00", content: <Text size="sm" tone="muted">Your courier will call from the door.</Text> },
            { label: "Delivered", content: <Text size="sm" tone="muted">Signed for at reception.</Text> },
          ]} />
        </Card>
      </Stack>
    );
  } },
  { id: "sticky", title: "Sticky", description: "Headers that stay pinned to the top of a ScrollView while their content scrolls under them, and know when they are stuck.", Demo: () => {
    const theme = useTheme(), [pinned, setPinned] = useState(null);
    return (
      <Stack>
        <Frame>
          <StickyScrollView nestedScrollEnabled>
            {ORDERS.flatMap((group) => [
              <Sticky key={group.day} onChange={(stuck) => stuck && setPinned(group.day)}>
                {({ stuck }) => (
                  <Cluster justify="space-between" style={{ paddingHorizontal: theme.space.m, paddingVertical: theme.space.xs }}>
                    <Text size="sm" weight="bold">{group.day}</Text>
                    {stuck ? <Badge tone="accent">Pinned</Badge> : <Text size="xs" tone="muted">{group.rows.length} orders</Text>}
                  </Cluster>
                )}
              </Sticky>,
              ...group.rows.map(([name, plan, amount]) => <ListItem key={group.day + name} title={name} subtitle={plan} leading={<Avatar name={name} size={32} />} trailing={amount} />),
            ])}
          </StickyScrollView>
        </Frame>
        <Text size="sm" tone="muted" accessibilityLiveRegion="polite">{pinned ? `“${pinned}” is pinned.` : "Scroll the list: each day stays at the top until the next one arrives."}</Text>
      </Stack>
    );
  } },
  { id: "tabs", title: "TabView", description: "Content tabs: a bar with a sliding underline and the selected tab's panel. The bar scrolls sideways when there are many tabs.", Demo: () => {
    const [tab, setTab] = useState("activity");
    return (
      <Stack gap="l">
        <Card>
          <TabView label="Profile sections" value={tab} onChange={setTab} tabs={[
            { value: "activity", label: "Activity", content: <Stack gap="xs"><Text weight="semibold">This week</Text><Text tone="muted">14 commits, 3 reviews and 2 releases. Your longest streak is nine days.</Text></Stack> },
            { value: "projects", label: "Projects", badge: 4, content: <Stack gap="xs">{["Website redesign", "Mobile app", "Design tokens", "Docs"].map((name) => <Cluster key={name} justify="space-between"><Text>{name}</Text><Text size="sm" tone="muted">Active</Text></Cluster>)}</Stack> },
            { value: "billing", label: "Billing", disabled: true, content: "Billing" },
          ]} />
        </Card>
        <Card>
          <Caption>Many tabs</Caption>
          <TabView label="News sections" defaultValue="world" tabs={["World", "Business", "Technology", "Science", "Sport", "Culture", "Travel"].map((name) => (
            { value: name.toLowerCase(), label: name, content: <Text tone="muted">The latest {name.toLowerCase()} stories, updated every hour.</Text> }
          ))} />
        </Card>
      </Stack>
    );
  } },
  { id: "command", title: "Command", description: "A command palette: search grouped actions, with shortcuts shown as text. Opens in a modal; on the web Ctrl/⌘+K toggles it.", Demo: () => {
    const [open, setOpen] = useState(false), [last, setLast] = useState(null), [inline, setInline] = useState(null);
    return (
      <Stack gap="m">
        <Card>
          <Button variant="outline" block onPress={() => setOpen(true)} testID="open-command" accessibilityLabel="Open command palette">
            <Text size="sm" tone="muted" style={{ flex: 1 }}>⌕  Search commands…</Text>
            <Badge style={{ alignSelf: "center" }}>⌘ K</Badge>
          </Button>
          <Text size="sm" tone="muted" accessibilityLiveRegion="polite">{last ? `Ran “${last}”.` : "Open the palette and choose a command."}</Text>
        </Card>
        <Command open={open} onOpenChange={setOpen} hotkey="k" groups={COMMANDS} onSelect={(value, item) => setLast(item.label)} />
        <Stack gap="xs">
          <Caption>In place</Caption>
          <Command modal={false} groups={COMMANDS.slice(0, 2)} placeholder="Filter actions…" label="Actions" onSelect={(value, item) => setInline(item.label)} />
          {inline ? <Text size="sm" tone="muted">Ran “{inline}”.</Text> : null}
        </Stack>
      </Stack>
    );
  } },
  { id: "tab-nav", title: "TabNav", description: "Tab-styled navigation where each tab is a link to a screen, with no panels of its own.", Demo: () => {
    const [route, setRoute] = useState("account");
    const pages = {
      account: ["Account", "Your name, email address and password."], billing: ["Billing", "Team plan, renews on 1 December. Card ending 4242."],
      team: ["Team", "Eight members, two pending invitations."], security: ["Security", "Two-step sign-in is on. Three active sessions."],
    };
    return (
      <Card>
        <TabNav label="Settings" value={route} onChange={setRoute} items={[{ value: "account", label: "Account" }, { value: "billing", label: "Billing" }, { value: "team", label: "Team", badge: 2 }, { value: "security", label: "Security" }]} />
        <Stack gap="2xs"><Heading level={3}>{pages[route][0]}</Heading><Text tone="muted">{pages[route][1]}</Text></Stack>
        <Text size="xs" tone="muted">In an app, onChange is where you call your router.</Text>
      </Card>
    );
  } },
];

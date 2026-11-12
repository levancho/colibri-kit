// Demos for the sidebar blocks: sixteen navigation layouts built on NavShell.
// Each block is shown in a fixed-height box. Press the menu button in its top bar to slide the navigation in.
import { useState } from "react";
import { View } from "react-native";
import {
  useTheme, useToast, Stack, Cluster, Text, Heading, Button, Badge, Card, ListItem, Divider,
  Sidebar01, Sidebar02, Sidebar03, Sidebar04, Sidebar05, Sidebar06, Sidebar07, Sidebar08, Sidebar09, Sidebar10,
  Sidebar11, Sidebar12, Sidebar13, Sidebar14, Sidebar15, Sidebar16,
} from "@colibri-kit/native";

// ---------------------------------------------------------------- sample data
const VERSIONS = { title: "Documentation", items: [{ id: "v1", name: "v1.0.1", description: "Stable" }, { id: "v2", name: "v2.0.0-beta", description: "Preview" }] };
const DOCS = [
  { id: "start", title: "Getting started", items: [{ id: "installation", label: "Installation" }, { id: "structure", label: "Project structure" }] },
  { id: "building", title: "Building", items: [{ id: "routing", label: "Routing" }, { id: "data-fetching", label: "Data fetching", badge: "New" }, { id: "rendering", label: "Rendering" }, { id: "caching", label: "Caching" }] },
  { id: "api", title: "API reference", items: [{ id: "components", label: "Components" }, { id: "functions", label: "Functions" }, { id: "cli", label: "CLI" }] },
];
// The same pages as one level of items with submenus.
const DOCS_TREE = DOCS.map((section) => ({ id: section.id, label: section.title, children: section.items }));
const PLATFORM = [
  { id: "playground", label: "Playground", icon: "◧", defaultOpen: true, children: [{ id: "history", label: "History" }, { id: "starred", label: "Starred" }, { id: "playground-settings", label: "Settings" }] },
  { id: "models", label: "Models", icon: "◈", children: [{ id: "genesis", label: "Genesis" }, { id: "explorer", label: "Explorer" }, { id: "quantum", label: "Quantum" }] },
  { id: "documentation", label: "Documentation", icon: "▤", children: [{ id: "introduction", label: "Introduction" }, { id: "get-started", label: "Get started" }, { id: "tutorials", label: "Tutorials" }] },
  { id: "settings", label: "Settings", icon: "✦", children: [{ id: "general", label: "General" }, { id: "team", label: "Team" }, { id: "billing", label: "Billing" }] },
];
const PROJECTS = [{ id: "design", label: "Design engineering", icon: "◆" }, { id: "sales", label: "Sales & marketing", icon: "◔", badge: "3" }, { id: "travel", label: "Travel", icon: "➤" }];
const APP = [{ id: "platform", title: "Platform", items: PLATFORM }, { id: "projects", title: "Projects", items: PROJECTS }];
const SECONDARY = [{ id: "support", label: "Support", icon: "?" }, { id: "feedback", label: "Feedback", icon: "✎" }];
const TEAMS = { items: [{ id: "despani", name: "Despani", description: "Enterprise" }, { id: "l3v", name: "L3V", description: "Startup" }] };
const WORKSPACES = { items: [{ id: "inc", name: "Acme Inc", description: "12 members" }, { id: "corp", name: "Acme Corp", description: "48 members" }] };
const USER = { name: "Levan Despani", email: "levan@despani.ge", actions: [{ id: "account", label: "Account", icon: "◉" }, { id: "billing", label: "Billing", icon: "▭" }, { id: "logout", label: "Log out", icon: "→", tone: "bad", separated: true }] };
const FOLDERS = [{ id: "inbox", label: "Inbox", icon: "▣", badge: 2 }, { id: "drafts", label: "Drafts", icon: "✎" }, { id: "sent", label: "Sent", icon: "➤" }, { id: "trash", label: "Trash", icon: "⌫" }];
const MAIL = [
  { id: "m1", folder: "inbox", from: "William Smith", time: "09:34 AM", subject: "Meeting tomorrow", preview: "Hi team, just a reminder about our meeting tomorrow at 10 AM. Please come prepared with your project updates.", unread: true },
  { id: "m2", folder: "inbox", from: "Alice Smith", time: "Yesterday", subject: "Re: Project update", preview: "Thanks for the update. The progress looks great so far. Let's schedule a call to discuss the next steps.", unread: true },
  { id: "m3", folder: "inbox", from: "Bob Johnson", time: "2 days ago", subject: "Weekend plans", preview: "Hey everyone! I'm thinking of organizing a team outing this weekend. Would you be interested in a hike?" },
  { id: "m4", folder: "inbox", from: "Emily Davis", time: "2 days ago", subject: "Re: Question about budget", preview: "I've reviewed the budget numbers you sent over. Can we set up a quick call to go through the details?" },
  { id: "m5", folder: "drafts", from: "To: Design team", time: "Monday", subject: "Spring release notes", preview: "Draft: here is what shipped this cycle and what moved to the next one." },
  { id: "m6", folder: "sent", from: "To: Alice Smith", time: "Yesterday", subject: "Project update", preview: "Attaching the latest numbers and the revised timeline for the launch." },
];
const CHANGES = [{ id: "readme", label: "README.md", status: "M" }, { id: "hello-route", label: "api/hello/route.ts", status: "U" }, { id: "layout-change", label: "app/layout.tsx", status: "M" }];
const TREE = [
  { id: "app", label: "app", defaultOpen: true, children: [
    { id: "api", label: "api", defaultOpen: true, children: [{ id: "route", label: "route.ts" }] },
    { id: "page", label: "page.tsx" }, { id: "layout", label: "layout.tsx" }] },
  { id: "components-dir", label: "components", children: [{ id: "button", label: "button.tsx" }] },
  { id: "package", label: "package.json" },
];
const CALENDARS = [
  { id: "mine", title: "My calendars", items: [{ id: "personal", label: "Personal" }, { id: "work", label: "Work", tone: "ok" }, { id: "family", label: "Family", tone: "warn" }] },
  { id: "favorites", title: "Favorites", defaultOpen: true, items: [{ id: "holidays", label: "Holidays", tone: "bad" }, { id: "birthdays", label: "Birthdays" }] },
  { id: "other", title: "Other", defaultOpen: false, items: [{ id: "travel-cal", label: "Travel" }, { id: "reminders", label: "Reminders", tone: "ok" }] },
];
const SETTINGS = [
  { id: "notifications", label: "Notifications", icon: "◔" }, { id: "navigation", label: "Navigation", icon: "☰" }, { id: "home", label: "Home", icon: "⌂" }, { id: "appearance", label: "Appearance", icon: "◐" },
  { id: "messages", label: "Messages & media", icon: "▤" }, { id: "language", label: "Language & region", icon: "◎" }, { id: "privacy", label: "Privacy & visibility", icon: "◈" },
];
const TODAY = new Date(2026, 9, 14);
const MARKED = [new Date(2026, 9, 6), new Date(2026, 9, 14), new Date(2026, 9, 22), new Date(2026, 9, 23)];

const find = (groups, id) => { for (const item of groups.flatMap((group) => group.items ?? [group])) { if (item.id === id) return item; const hit = item.children && find([{ items: item.children }], id); if (hit) return hit; } return null; };

// ---------------------------------------------------------------- pieces of the demos
/** The fixed-height bordered box every block is shown in. */
function Box({ children, height = 520 }) {
  const theme = useTheme();
  return <View style={{ height, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.l, overflow: "hidden" }}>{children}</View>;
}
/** Stand-in page content: a title, a line of text and placeholder tiles. */
function Page({ title, note = "Press the menu button in the top bar to open the navigation.", tiles = 3, children }) {
  const theme = useTheme(), tile = { borderRadius: theme.radius.m, backgroundColor: theme.colors.sunken, borderWidth: 1, borderColor: theme.colors.line };
  return (
    <>
      <Stack gap="2xs"><Heading level={3}>{title}</Heading><Text size="sm" tone="muted">{note}</Text></Stack>
      {children}
      <View style={{ flexDirection: "row", gap: theme.space.s }}>{Array.from({ length: tiles }, (_, index) => <View key={index} style={[tile, { flex: 1, height: 72 }]} />)}</View>
      <View style={[tile, { height: 220 }]} />
    </>
  );
}
const usePage = (groups, first) => { const [selected, setSelected] = useState(first); return { selected, onSelect: setSelected, label: find(groups, selected)?.label ?? "" }; };

function DocsDemo({ Block, first = "data-fetching", data = DOCS, tree = false, ...rest }) {
  const page = usePage(DOCS, first), [version, setVersion] = useState("v1");
  return (
    <Box>
      <Block sections={tree ? undefined : data} items={tree ? data : undefined} selected={page.selected} onSelect={page.onSelect} switcher={{ ...VERSIONS, value: version, onChange: setVersion }} {...rest}>
        <Page title={page.label}><Cluster><Badge tone="accent">{VERSIONS.items.find((entry) => entry.id === version).name}</Badge><Badge>Guide</Badge></Cluster></Page>
      </Block>
    </Box>
  );
}
function AppDemo({ Block, first = "history", note, ...rest }) {
  const page = usePage([...APP, { items: SECONDARY }], first), [team, setTeam] = useState("despani"), toast = useToast();
  const user = { ...USER, onAction: (id) => toast.show(id === "logout" ? "Logged out" : `Opened ${id}`) };
  return (
    <Box>
      <Block sections={APP} selected={page.selected} onSelect={page.onSelect} switcher={{ ...TEAMS, value: team, onChange: setTeam, onAdd: () => toast.show("Add a team") }} user={user} {...rest}>
        <Page title={page.label} note={note} />
      </Block>
    </Box>
  );
}

export default [
  { id: "sidebar-01", title: "Sidebar 01 · Simple, grouped", description: "Navigation grouped by section, with a version switcher and a search that filters the links.", Demo: () => <DocsDemo Block={Sidebar01} /> },
  { id: "sidebar-02", title: "Sidebar 02 · Collapsible sections", description: "Each section label folds its group of links open and closed.", Demo: () => <DocsDemo Block={Sidebar02} first="routing" /> },
  { id: "sidebar-03", title: "Sidebar 03 · With submenus", description: "Top-level items with their submenus always visible underneath.", Demo: () => <DocsDemo Block={Sidebar03} data={DOCS_TREE} tree first="rendering" /> },
  { id: "sidebar-04", title: "Sidebar 04 · Floating with submenus", description: "The same submenus in a floating panel: detached from the edge, rounded and raised.", Demo: () => <DocsDemo Block={Sidebar04} data={DOCS_TREE} tree first="installation" /> },
  { id: "sidebar-05", title: "Sidebar 05 · Collapsible submenus", description: "Each top-level item folds open to show its submenu.", Demo: () => {
    const page = usePage([{ items: PLATFORM }], "history"), [version, setVersion] = useState("v1");
    return <Box><Sidebar05 sections={[{ id: "platform", title: "Platform", items: PLATFORM }]} selected={page.selected} onSelect={page.onSelect} switcher={{ ...VERSIONS, value: version, onChange: setVersion }}><Page title={page.label} /></Sidebar05></Box>;
  } },
  { id: "sidebar-06", title: "Sidebar 06 · Submenus as dropdowns", description: "Top-level items open their submenu as a menu anchored to the item (to the side where there is room), above an upgrade card.", Demo: () => {
    const page = usePage([{ items: PLATFORM }], "starred"), [version, setVersion] = useState("v1"), toast = useToast();
    return (
      <Box>
        <Sidebar06 items={PLATFORM} selected={page.selected} onSelect={page.onSelect} switcher={{ ...VERSIONS, value: version, onChange: setVersion }}
          promo={{ title: "Upgrade to Pro", description: "Unlock all features.", actionLabel: "Upgrade", onAction: () => toast.show("Upgrade started", { tone: "ok" }) }}>
          <Page title={page.label} />
        </Sidebar06>
      </Box>
    );
  } },
  { id: "sidebar-07", title: "Sidebar 07 · Collapses to icons", description: "A narrow icon rail stays beside the content; the menu button opens the full sidebar with team switcher and user menu. Icons are read out by screen readers in place of hover tooltips.",
    Demo: () => <AppDemo Block={Sidebar07} note="The icon rail stays in view. Press an icon or the menu button for the full navigation." /> },
  { id: "sidebar-08", title: "Sidebar 08 · Inset with secondary nav", description: "The content sits in an inset card; Support and Feedback are pinned at the bottom of the sidebar.", Demo: () => <AppDemo Block={Sidebar08} first="genesis" secondary={SECONDARY} /> },
  { id: "sidebar-09", title: "Sidebar 09 · Nested sidebars", description: "A mail layout: an icon rail of folders next to a second sidebar that lists messages, with an unread filter and search.", Demo: () => {
    const [folder, setFolder] = useState("inbox"), [selected, setSelected] = useState("m1"), mail = MAIL.find((entry) => entry.id === selected);
    return (
      <Box>
        <Sidebar09 brand="C" folders={FOLDERS} folder={folder} onFolderChange={setFolder} messages={MAIL} selected={selected} onSelect={setSelected}>
          <Stack gap="2xs"><Heading level={3}>{mail.subject}</Heading><Text size="sm" tone="muted">{mail.from} · {mail.time}</Text></Stack>
          <Divider />
          <Text size="sm">{mail.preview}</Text>
          <Text size="sm" tone="muted">Press a folder in the rail, or the menu button, to open the message list.</Text>
          <Cluster><Button title="Reply" size="s" /><Button title="Forward" size="s" variant="outline" /></Cluster>
        </Sidebar09>
      </Box>
    );
  } },
  { id: "sidebar-10", title: "Sidebar 10 · Sidebar with popover", description: "The workspace switcher in the sidebar and the page actions in the top bar open in popovers.", Demo: () => {
    const page = usePage(APP, "design"), [workspace, setWorkspace] = useState("inc"), toast = useToast();
    return (
      <Box>
        <Sidebar10 sections={APP} selected={page.selected} onSelect={page.onSelect} switcher={{ ...WORKSPACES, value: workspace, onChange: setWorkspace }} onPageAction={(id, action) => toast.show(action.label, { tone: id === "trash" ? "bad" : undefined })}
          pageActions={[{ id: "customize", label: "Customize page", icon: "✦" }, { id: "copy", label: "Copy link", icon: "⧉" }, { id: "trash", label: "Move to trash", icon: "⌫", tone: "bad", separated: true }]}>
          <Page title={page.label} note="Open the navigation for the workspace popover, or press ⋯ for the page actions."><Badge tone="accent">{WORKSPACES.items.find((entry) => entry.id === workspace).name}</Badge></Page>
        </Sidebar10>
      </Box>
    );
  } },
  { id: "sidebar-11", title: "Sidebar 11 · Collapsible file tree", description: "A list of changed files with their status above a tree of folders that fold open and closed.", Demo: () => {
    const [selected, setSelected] = useState("page"), file = find([{ items: TREE }, { items: CHANGES }], selected), theme = useTheme();
    return (
      <Box>
        <Sidebar11 changes={CHANGES} tree={TREE} selected={selected} onSelect={setSelected}>
          <Stack gap="2xs"><Heading level={3}>{file?.label}</Heading><Text size="sm" tone="muted">Open the navigation to browse changes and files.</Text></Stack>
          <View style={{ padding: theme.space.s, gap: theme.space.xs, borderRadius: theme.radius.m, borderWidth: 1, borderColor: theme.colors.line, backgroundColor: theme.colors.sunken }}>
            {[72, 48, 88, 60, 34, 80, 54, 66].map((width, index) => <View key={index} style={{ height: 10, width: `${width}%`, borderRadius: 5, backgroundColor: theme.colors.line }} />)}
          </View>
        </Sidebar11>
      </Box>
    );
  } },
  { id: "sidebar-12", title: "Sidebar 12 · With a calendar", description: "The sidebar holds the account menu, a month calendar and lists of calendars to switch on and off.", Demo: () => {
    const [date, setDate] = useState(TODAY), [checked, setChecked] = useState(["personal", "work", "holidays"]), toast = useToast();
    return (
      <Box>
        <Sidebar12 user={{ ...USER, onAction: (id) => toast.show(`Opened ${id}`) }} date={date} onDateChange={setDate} today={TODAY} marked={MARKED} calendars={CALENDARS} checked={checked} onCheckedChange={setChecked}>
          <Stack gap="2xs"><Heading level={3}>{date.toDateString()}</Heading><Text size="sm" tone="muted">{checked.length} calendars shown. Open the navigation to pick a day.</Text></Stack>
          <Card padded={false} gap={0}>
            <ListItem title="Design review" subtitle="10:00 – 11:00 · Work" trailing={<Badge tone="ok">Work</Badge>} /><Divider />
            <ListItem title="Lunch with Alice" subtitle="12:30 – 13:30 · Personal" trailing={<Badge tone="accent">Personal</Badge>} /><Divider />
            <ListItem title="Flight to Tbilisi" subtitle="18:45 · Travel" trailing={<Badge>Travel</Badge>} />
          </Card>
        </Sidebar12>
      </Box>
    );
  } },
  { id: "sidebar-13", title: "Sidebar 13 · Sidebar in a dialog", description: "A settings dialog with its own navigation: it slides in inside the dialog on a phone and sits beside the page on wide screens.", Demo: () => {
    const [visible, setVisible] = useState(false), page = usePage([{ items: SETTINGS }], "messages");
    return (
      <Card>
        <Text weight="semibold">Settings</Text>
        <Text size="sm" tone="muted">Current section: {page.label}</Text>
        <Button title="Open settings" onPress={() => setVisible(true)} testID="open-settings" />
        <Sidebar13 visible={visible} onClose={() => setVisible(false)} items={SETTINGS} selected={page.selected} onSelect={page.onSelect} testID="settings">
          <Page title={page.label} note="Press the menu button to switch section." tiles={2} />
        </Sidebar13>
      </Card>
    );
  } },
  { id: "sidebar-14", title: "Sidebar 14 · Sidebar on the right", description: "The grouped navigation docked on the right: the menu button sits at the right end and the panel slides in from that edge.", Demo: () => {
    const page = usePage(DOCS, "structure");
    return <Box><Sidebar14 sections={DOCS} selected={page.selected} onSelect={page.onSelect}><Page title={page.label} note="The menu button is on the right; the table of contents opens from the right edge." /></Sidebar14></Box>;
  } },
  { id: "sidebar-15", title: "Sidebar 15 · Left and right sidebars", description: "Navigation on the left and a calendar and details sidebar on the right, each with its own button in the top bar.", Demo: () => {
    const [date, setDate] = useState(TODAY);
    return (
      <AppDemo Block={Sidebar15} first="design" date={date} onDateChange={setDate} today={TODAY} marked={MARKED} note={`Left button: navigation. Right button: calendar. Chosen day: ${date.toDateString()}.`}
        aside={<><Text size="xs" weight="semibold" tone="muted">UPCOMING</Text><ListItem title="Design review" subtitle="Tomorrow · 10:00" style={{ paddingHorizontal: 4 }} /><ListItem title="Sprint planning" subtitle="Friday · 14:00" style={{ paddingHorizontal: 4 }} /></>} />
    );
  } },
  { id: "sidebar-16", title: "Sidebar 16 · Sticky site header", description: "A full-width header with the menu button and search stays above the sidebar and the scrolling content.", Demo: () => {
    const toast = useToast();
    return <AppDemo Block={Sidebar16} first="tutorials" secondary={SECONDARY} onSearch={(text) => text && toast.show(`Searching for “${text}”`)} searchPlaceholder="Search the site" note="The header stays put while this page scrolls beneath it." />;
  } },
];

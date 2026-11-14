// Demos for the navigation layouts: phone app screens built around a navigation drawer.
// Each one is a whole screen (fullscreen: true). Press the menu button in the app bar to open the drawer.
import { useState } from "react";
import { Platform, ScrollView, View } from "react-native";
import {
  useTheme, useToast, Screen, Stack, Cluster, Text, Heading, Button, Badge, Card, Callout, Avatar, ListItem, Divider, Switch, RadioGroup, Progress,
  NavBarButton, SectionedDrawer, NestedDrawer, WorkspaceDrawer, MailLayout, CalendarDrawer, FileTreeDrawer, SettingsSheet,
} from "@colibri-kit/native-core";

const USER = { name: "Jordan Lee", email: "jordan@example.com", actions: [{ id: "account", label: "Account", icon: "◉" }, { id: "billing", label: "Billing", icon: "▭" }, { id: "logout", label: "Log out", icon: "→", tone: "bad", separated: true }] };
const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" });

// ---------------------------------------------------------------- sectioned drawer: documentation
const VERSIONS = { title: "Documentation", icon: "D", label: "Versions", items: [{ id: "v1", name: "v1.0.1", description: "Stable" }, { id: "v2", name: "v2.0.0-beta", description: "Preview" }] };
const DOCS = [
  { id: "start", title: "Getting started", items: [{ id: "installation", label: "Installation" }, { id: "structure", label: "Project structure" }] },
  { id: "building", title: "Building", items: [{ id: "routing", label: "Routing" }, { id: "data-fetching", label: "Data fetching", badge: "New" }, { id: "rendering", label: "Rendering" }, { id: "caching", label: "Caching" }] },
  { id: "api", title: "API reference", items: [{ id: "components", label: "Components" }, { id: "functions", label: "Functions" }, { id: "cli", label: "CLI" }] },
];
const PAGES = {
  installation: { minutes: 3, lead: "Create a new app with one command. The installer sets up the compiler, the linter and a first screen.", code: "npx create-acme-app@latest\ncd my-app\nnpm run dev", steps: ["Install Node.js 20 or newer", "Run the installer and answer its questions", "Open the app on your phone"] },
  structure: { minutes: 4, lead: "Every folder has one job. Screens live in app, shared pieces in components, and nothing else is required.", code: "app/\n  layout.tsx\n  page.tsx\ncomponents/\npackage.json", steps: ["Add a screen by adding a folder", "Keep shared code in components", "Put static files in public"] },
  routing: { minutes: 6, lead: "Folders are routes. A folder with a page file becomes a screen, and nested folders become nested screens.", code: "app/\n  settings/\n    page.tsx      → /settings\n    profile/\n      page.tsx    → /settings/profile", steps: ["Create a folder for each screen", "Share chrome with a layout file", "Link between screens with <Link>"] },
  "data-fetching": { minutes: 5, lead: "Fetch on the server, next to the component that shows the data. Requests are deduplicated and cached for you.", code: "export default async function Page() {\n  const posts = await getPosts();\n  return <PostList posts={posts} />;\n}", steps: ["Make the component async", "Await the data where it is used", "Show a fallback while it loads"] },
  rendering: { minutes: 7, lead: "Screens render on the server first, then become interactive on the phone. You choose per component.", code: "\"use client\";\n\nexport function Counter() {\n  const [count, setCount] = useState(0);\n  return <Button onPress={() => setCount(count + 1)} />;\n}", steps: ["Keep data-heavy parts on the server", "Mark interactive parts as client", "Stream slow parts in later"] },
  caching: { minutes: 4, lead: "Results are cached until you say they are stale. Revalidate by time, or on demand after a change.", code: "export const revalidate = 60;\n\nawait revalidateTag(\"posts\");", steps: ["Set a lifetime per screen", "Tag the requests that belong together", "Revalidate a tag after a write"] },
  components: { minutes: 3, lead: "The built-in components cover images, links, fonts and scripts, each tuned for slow networks.", code: "<Image src={cover} alt=\"\" priority />\n<Link href=\"/settings\">Settings</Link>", steps: ["Image resizes and lazy-loads", "Link preloads the next screen", "Font removes layout shift"] },
  functions: { minutes: 5, lead: "Functions you can call from any server code: read cookies and headers, redirect, and revalidate.", code: "const session = cookies().get(\"session\");\nif (!session) redirect(\"/sign-in\");", steps: ["cookies() and headers() read the request", "redirect() sends the reader elsewhere", "notFound() shows the 404 screen"] },
  cli: { minutes: 2, lead: "Three commands are all you need day to day: develop, build and start.", code: "acme dev      # start the dev server\nacme build    # compile for production\nacme start    # serve the build", steps: ["dev reloads as you type", "build reports the size of every screen", "start serves what build made"] },
};
const DOC_ORDER = DOCS.flatMap((section) => section.items.map((item) => ({ ...item, section: section.title })));

function CodeBlock({ code, numbered = false }) {
  const theme = useTheme(), lines = code.split("\n");
  return (
    <View style={{ borderRadius: theme.radius.m, borderWidth: 1, borderColor: theme.colors.line, backgroundColor: theme.colors.sunken }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: theme.space.s }}>
        <View>
          {lines.map((line, index) => (
            <View key={index} style={{ flexDirection: "row" }}>
              {numbered ? <Text size="xs" tone="muted" style={{ width: 28, fontFamily: MONO, lineHeight: 20 }}>{index + 1}</Text> : null}
              <Text size="xs" style={{ fontFamily: MONO, lineHeight: 20 }}>{line || " "}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function SectionedDrawerDemo() {
  const [page, setPage] = useState("data-fetching"), [version, setVersion] = useState("v1");
  const at = DOC_ORDER.findIndex((item) => item.id === page), doc = DOC_ORDER[at], content = PAGES[page], next = DOC_ORDER[at + 1], previous = DOC_ORDER[at - 1];
  return (
    <SectionedDrawer sections={DOCS} selected={page} onSelect={setPage} switcher={{ ...VERSIONS, value: version, onChange: setVersion }} searchPlaceholder="Search the docs">
      <Cluster justify="space-between">
        <Text size="sm" weight="semibold" tone="accent">{doc.section} · {content.minutes} min read</Text>
        <Badge tone="accent">{VERSIONS.items.find((entry) => entry.id === version).name}</Badge>
      </Cluster>
      <Text size="lg">{content.lead}</Text>
      <CodeBlock code={content.code} />
      <Stack gap="xs">
        <Heading level={3}>In short</Heading>
        {content.steps.map((step, index) => (
          <Cluster key={step} wrap={false} gap="s" align="flex-start">
            <Badge>{index + 1}</Badge><Text style={{ flex: 1 }}>{step}</Text>
          </Cluster>
        ))}
      </Stack>
      <Callout title="Good to know">Open the menu to move between guides, or search them by name.</Callout>
      <Cluster wrap={false} gap="s">
        {previous ? <Button title={`‹ ${previous.label}`} variant="outline" onPress={() => setPage(previous.id)} style={{ flex: 1 }} /> : <View style={{ flex: 1 }} />}
        {next ? <Button title={`${next.label} ›`} variant="outline" onPress={() => setPage(next.id)} style={{ flex: 1 }} /> : <View style={{ flex: 1 }} />}
      </Cluster>
    </SectionedDrawer>
  );
}

// ---------------------------------------------------------------- nested drawer: a shop
const SHOP = [
  { id: "new", label: "New arrivals", icon: "✦" },
  { id: "clothing", label: "Clothing", icon: "◧", children: [{ id: "jackets", label: "Jackets" }, { id: "knitwear", label: "Knitwear" }, { id: "shirts", label: "Shirts" }, { id: "trousers", label: "Trousers" }] },
  { id: "shoes", label: "Shoes", icon: "◈", children: [{ id: "sneakers", label: "Sneakers" }, { id: "boots", label: "Boots" }] },
  { id: "home", label: "Home", icon: "⌂", children: [{ id: "kitchen", label: "Kitchen" }, { id: "lighting", label: "Lighting" }, { id: "textiles", label: "Textiles" }] },
  { id: "sale", label: "Sale", icon: "%", badge: "−30%" },
];
const PRODUCTS = {
  new: [["Field jacket", "Olive · new colour", 189], ["Court sneaker", "Off-white", 119], ["Table lamp", "Brass", 79], ["Merino crew", "Navy", 95]],
  jackets: [["Field jacket", "Olive · waxed cotton", 189], ["Wool overshirt", "Charcoal", 149], ["Rain shell", "Black · packable", 129], ["Quilted vest", "Sand", 99], ["Denim trucker", "Indigo", 139]],
  knitwear: [["Merino crew", "Navy", 95], ["Fisherman rib", "Ecru", 125], ["Zip cardigan", "Forest", 135], ["Cashmere beanie", "Grey", 45]],
  shirts: [["Oxford shirt", "White", 69], ["Linen shirt", "Sky blue", 75], ["Flannel check", "Rust", 79]],
  trousers: [["Pleated chino", "Stone", 89], ["Selvedge jean", "Raw indigo", 129], ["Wool trouser", "Charcoal", 119]],
  sneakers: [["Court sneaker", "Off-white", 119], ["Trail runner", "Moss", 139], ["Canvas low", "Black", 65]],
  boots: [["Chelsea boot", "Brown suede", 189], ["Service boot", "Black", 229]],
  kitchen: [["Stoneware mug", "Set of two", 28], ["Cast iron pan", "26 cm", 59], ["Linen apron", "Natural", 35], ["Pour-over set", "Glass", 49]],
  lighting: [["Table lamp", "Brass", 79], ["Pendant shade", "Paper", 45], ["Reading light", "Matte black", 59]],
  textiles: [["Wool throw", "Herringbone", 85], ["Linen sheets", "Queen · white", 149], ["Bath towel", "Set of two", 39]],
  sale: [["Rain shell", "Black · was €129", 90], ["Canvas low", "Black · was €65", 45], ["Bath towel", "Was €39", 27]],
};
const TONES = ["accent", "ok", "warn", "bad"];
const flatten = (items) => items.flatMap((item) => (item.children ? flatten(item.children) : [item]));

function ProductRow({ name, detail, price, tone, saved, onSave }) {
  const theme = useTheme(), look = theme.tones[tone];
  return (
    <ListItem title={name} subtitle={detail} onPress={onSave}
      leading={<View style={{ width: 48, height: 48, borderRadius: theme.radius.m, alignItems: "center", justifyContent: "center", backgroundColor: look.soft }}><Text weight="bold" style={{ color: look.fg }}>{name.split(" ").map((word) => word[0]).join("").toUpperCase()}</Text></View>}
      trailing={<Stack gap="3xs" align="flex-end"><Text weight="semibold">€{price}</Text><Text size="xs" tone={saved ? "accent" : "muted"}>{saved ? "★ Saved" : "☆ Save"}</Text></Stack>} />
  );
}

function NestedDrawerDemo() {
  const [category, setCategory] = useState("jackets"), [saved, setSaved] = useState(["Field jacket"]), products = PRODUCTS[category] ?? [];
  const label = flatten(SHOP).find((item) => item.id === category)?.label, parent = SHOP.find((item) => item.children?.some((child) => child.id === category));
  const toggle = (name) => setSaved(saved.includes(name) ? saved.filter((entry) => entry !== name) : [...saved, name]);
  return (
    <NestedDrawer items={SHOP} selected={category} onSelect={setCategory} subtitle={parent?.label} switcher={{ title: "Nord Supply", icon: "N", label: "Stores", items: [{ id: "eu", name: "Europe · EUR" }, { id: "uk", name: "United Kingdom · GBP" }] }}>
      <Cluster justify="space-between">
        <Text tone="muted">{products.length} items</Text>
        <Badge tone="accent">{saved.length} saved</Badge>
      </Cluster>
      <Card padded={false} gap={0}>
        {products.map(([name, detail, price], index) => (
          <View key={name}>
            {index ? <Divider /> : null}
            <ProductRow name={name} detail={detail} price={price} tone={TONES[index % TONES.length]} saved={saved.includes(name)} onSave={() => toggle(name)} />
          </View>
        ))}
      </Card>
      <Text size="sm" tone="muted" align="center">That is everything in {label}. Free delivery over €100.</Text>
    </NestedDrawer>
  );
}

// ---------------------------------------------------------------- workspace drawer: a team's tasks
const TEAMS = { label: "Workspaces", addLabel: "New workspace", items: [{ id: "northstar", name: "Northstar", description: "Enterprise · 48 members" }, { id: "l3v", name: "L3V Studio", description: "Startup · 6 members" }] };
const WORK = [
  { id: "main", items: [{ id: "home", label: "Home", icon: "⌂" }, { id: "inbox", label: "Inbox", icon: "▣", badge: 4 }, { id: "tasks", label: "My tasks", icon: "✓" }] },
  { id: "projects", title: "Projects", items: [{ id: "design", label: "Design engineering", icon: "◆" }, { id: "sales", label: "Sales & marketing", icon: "◎", badge: 3 }, { id: "travel", label: "Travel", icon: "➤" }] },
];
const SECONDARY = [{ id: "support", label: "Support", icon: "?" }, { id: "feedback", label: "Feedback", icon: "✎" }];
const BOARDS = {
  inbox: { note: "4 unread", rows: [["Nino mentioned you", "Design engineering · “can you review the tokens?”", "2m"], ["Task assigned to you", "Sales & marketing · Q4 launch deck", "1h"], ["Giorgi commented", "Travel · “flights are booked”", "3h"], ["Due tomorrow", "My tasks · Send the invoice", "1d"]] },
  tasks: { note: "5 open", rows: [["Review the colour tokens", "Design engineering", "Today"], ["Send the invoice", "Sales & marketing", "Tomorrow"], ["Book the offsite venue", "Travel", "Fri"], ["Write release notes", "Design engineering", "Mon"], ["Renew the domain", "No project", "21 Oct"]] },
  design: { note: "Sprint 14", progress: 0.72, rows: [["Dark mode for charts", "Nino · in review", "Today"], ["Drawer on small phones", "Jordan · in progress", "Thu"], ["Icon audit", "Mari · to do", "Mon"]] },
  sales: { note: "Q4 launch", progress: 0.4, rows: [["Launch deck", "Jordan · in progress", "Tomorrow"], ["Pricing page copy", "Ana · in review", "Fri"], ["Partner newsletter", "Giorgi · to do", "28 Oct"]] },
  travel: { note: "Offsite · Kazbegi", progress: 0.9, rows: [["Flights", "Giorgi · done", "Booked"], ["Venue deposit", "Jordan · to do", "Fri"]] },
  support: { note: "We answer within a day", rows: [["How do I invite a guest?", "Members and roles", "›"], ["Change the billing owner", "Billing", "›"], ["Export a project", "Data", "›"]] },
  feedback: { note: "Tell us what to build next", rows: [["Calendar view for tasks", "Planned · 128 votes", "›"], ["Recurring tasks", "In progress · 96 votes", "›"], ["Offline mode", "Under review · 61 votes", "›"]] },
};

function Metric({ label, value, tone }) {
  return <Card gap="3xs" style={{ flex: 1, padding: 12 }}><Text size="xl" weight="bold" tone={tone}>{value}</Text><Text size="xs" tone="muted" numberOfLines={1}>{label}</Text></Card>;
}
function Rows({ rows }) {
  return (
    <Card padded={false} gap={0}>
      {rows.map(([title, subtitle, trailing], index) => <View key={title}>{index ? <Divider /> : null}<ListItem title={title} subtitle={subtitle} trailing={trailing} /></View>)}
    </Card>
  );
}

function WorkspaceDrawerDemo() {
  const [page, setPage] = useState("home"), [team, setTeam] = useState("northstar"), toast = useToast(), board = BOARDS[page];
  const workspace = TEAMS.items.find((entry) => entry.id === team);
  return (
    <WorkspaceDrawer sections={WORK} secondary={SECONDARY} selected={page} onSelect={setPage} subtitle={workspace.name}
      switcher={{ ...TEAMS, value: team, onChange: setTeam, onAdd: () => toast.show("New workspace") }} user={{ ...USER, onAction: (id) => toast.show(id === "logout" ? "Logged out" : `Opened ${id}`) }}
      actions={<NavBarButton label="New task" icon="+" onPress={() => toast.show("New task", { tone: "ok" })} />}>
      {page === "home" ? (
        <>
          <Stack gap="3xs"><Heading level={2}>Good morning, Jordan</Heading><Text tone="muted">Wednesday 14 October · {workspace.name}</Text></Stack>
          <Cluster wrap={false} gap="xs" align="stretch"><Metric label="Open tasks" value="12" /><Metric label="Due this week" value="5" tone="warn" /><Metric label="Done" value="31" tone="ok" /></Cluster>
          <Stack gap="xs"><Text weight="semibold">Due soon</Text><Rows rows={BOARDS.tasks.rows.slice(0, 3)} /></Stack>
          <Stack gap="xs"><Text weight="semibold">Recent activity</Text><Rows rows={BOARDS.inbox.rows.slice(0, 3)} /></Stack>
        </>
      ) : (
        <>
          <Cluster justify="space-between"><Text tone="muted">{board.note}</Text>{board.progress ? <Badge tone="ok">{Math.round(board.progress * 100)}% done</Badge> : null}</Cluster>
          {board.progress ? <Progress value={board.progress} tone="ok" /> : null}
          <Rows rows={board.rows} />
          <Button title={page === "support" ? "Contact support" : page === "feedback" ? "Send feedback" : "Add a task"} variant="soft" block onPress={() => toast.show("Coming up")} />
        </>
      )}
    </WorkspaceDrawer>
  );
}

// ---------------------------------------------------------------- mail layout
const FOLDERS = [{ id: "inbox", label: "Inbox", icon: "▣" }, { id: "drafts", label: "Drafts", icon: "✎" }, { id: "sent", label: "Sent", icon: "➤" }, { id: "trash", label: "Trash", icon: "⌫" }];
const MAIL = [
  { id: "m1", folder: "inbox", from: "William Smith", time: "09:34", subject: "Meeting tomorrow", unread: true, preview: "Hi team, just a reminder about our meeting tomorrow at 10. Please come prepared with your project updates.",
    body: "Hi team,\n\nJust a reminder about our meeting tomorrow at 10:00. Please come prepared with your project updates and anything that is blocking you.\n\nWe will start with the release plan, then go through the open design questions.\n\nSee you there,\nWilliam" },
  { id: "m2", folder: "inbox", from: "Alice Kim", time: "Yesterday", subject: "Re: Project update", unread: true, preview: "Thanks for the update. The progress looks great so far. Let's schedule a call to discuss the next steps.",
    body: "Thanks for the update. The progress looks great so far.\n\nLet's schedule a call to discuss the next steps. Would Thursday afternoon work for you?\n\nAlice" },
  { id: "m3", folder: "inbox", from: "Bob Johnson", time: "Mon", subject: "Weekend plans", preview: "Hey everyone! I'm thinking of organizing a team outing this weekend. Would you be interested in a hike?",
    body: "Hey everyone!\n\nI'm thinking of organizing a team outing this weekend. Would you be interested in a hike, or would you rather have a beach day?\n\nReply with what you prefer and I will sort out the rest.\n\nBob" },
  { id: "m4", folder: "inbox", from: "Emily Davis", time: "Mon", subject: "Re: Question about budget", preview: "I've reviewed the budget numbers you sent over. Can we set up a quick call to go through the details?",
    body: "I've reviewed the budget numbers you sent over.\n\nCan we set up a quick call to go through the details? I have a few questions about the travel line.\n\nEmily" },
  { id: "m5", folder: "inbox", from: "Nino Beridze", time: "Sun", subject: "Photos from the offsite", preview: "Here are the photos from Kazbegi. The one of the whole team on the ridge came out really well.",
    body: "Here are the photos from Kazbegi. The one of the whole team on the ridge came out really well.\n\nTell me which ones you want printed.\n\nNino" },
  { id: "m6", folder: "drafts", from: "To: Design team", time: "Mon", subject: "Spring release notes", preview: "Here is what shipped this cycle and what moved to the next one.", body: "Here is what shipped this cycle and what moved to the next one.\n\n(Draft: add the list of fixes.)" },
  { id: "m7", folder: "sent", from: "To: Alice Kim", time: "Yesterday", subject: "Project update", preview: "Attaching the latest numbers and the revised timeline for the launch.", body: "Hi Alice,\n\nAttaching the latest numbers and the revised timeline for the launch.\n\nJordan" },
];

const ACCOUNTS = { title: "Mail", icon: "M", label: "Accounts", items: [{ id: "personal", name: "jordan@example.com" }, { id: "work", name: "levan@l3v.studio" }] };

function MailLayoutDemo() {
  const [folder, setFolder] = useState("inbox"), [open, setOpen] = useState(null), [read, setRead] = useState([]), toast = useToast();
  const messages = MAIL.map((mail) => ({ ...mail, unread: mail.unread && !read.includes(mail.id) })), unread = messages.filter((mail) => mail.folder === "inbox" && mail.unread).length;
  const folders = FOLDERS.map((entry) => (entry.id === "inbox" && unread ? { ...entry, badge: unread } : entry));
  return (
    <MailLayout folders={folders} folder={folder} onFolderChange={setFolder} messages={messages} selected={open} switcher={ACCOUNTS}
      onSelect={(id) => { setOpen(id); if (id) setRead((list) => [...list, id]); }}
      actions={<NavBarButton label="Write a message" icon="✎" onPress={() => toast.show("New message")} />}
      messageFooter={(mail) => (
        <Cluster wrap={false} gap="s">
          <Button title="Reply" onPress={() => toast.show(`Replying to ${mail.from}`)} style={{ flex: 1 }} />
          <Button title="Forward" variant="outline" onPress={() => toast.show("Forwarding")} style={{ flex: 1 }} />
        </Cluster>
      )} />
  );
}

// ---------------------------------------------------------------- calendar drawer
const TODAY = new Date(2026, 9, 14);
const CALENDARS = [
  { id: "mine", title: "My calendars", items: [{ id: "personal", label: "Personal" }, { id: "work", label: "Work", tone: "ok" }, { id: "family", label: "Family", tone: "warn" }] },
  { id: "other", title: "Other calendars", defaultOpen: true, items: [{ id: "holidays", label: "Holidays", tone: "bad" }, { id: "birthdays", label: "Birthdays" }] },
];
const CALENDAR_TONE = { personal: "accent", work: "ok", family: "warn", holidays: "bad", birthdays: "accent" };
// Day of October 2026 → [time, title, place, calendar].
const EVENTS = {
  6: [["09:30 – 10:00", "Stand-up", "Video call", "work"], ["19:00 – 21:00", "Dinner with parents", "Shavi Lomi", "family"]],
  13: [["14:00 – 15:00", "Sprint planning", "Room 2", "work"]],
  14: [["10:00 – 11:00", "Design review", "Room 4 · with Nino and Mari", "work"], ["12:30 – 13:30", "Lunch with Alice", "Café Stamba", "personal"], ["17:00 – 17:30", "School pick-up", "Vake", "family"], ["All day", "Tbilisoba", "Public holiday", "holidays"]],
  15: [["09:00 – 12:00", "Workshop: navigation", "Studio", "work"], ["18:45", "Flight to Batumi", "TBS · gate B3", "personal"]],
  22: [["All day", "Mari's birthday", "Send a card", "birthdays"], ["16:00 – 17:00", "Dentist", "Clinic on Chavchavadze", "personal"]],
  23: [["11:00 – 12:00", "Quarterly review", "Room 1", "work"]],
};
const MARKED = Object.keys(EVENTS).map((day) => new Date(2026, 9, +day));

function EventCard({ time, title, place, calendar }) {
  const theme = useTheme(), tone = theme.tones[CALENDAR_TONE[calendar]];
  return (
    <View style={{ flexDirection: "row", gap: theme.space.s, padding: theme.space.s, borderRadius: theme.radius.m, backgroundColor: tone.soft }}>
      <View style={{ width: 4, borderRadius: 2, backgroundColor: tone.fg }} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text weight="semibold">{title}</Text>
        <Text size="sm">{time}</Text>
        <Text size="sm" tone="muted">{place}</Text>
      </View>
    </View>
  );
}

function CalendarDrawerDemo() {
  const [date, setDate] = useState(TODAY), [checked, setChecked] = useState(["personal", "work", "family", "holidays"]);
  const all = date.getFullYear() === 2026 && date.getMonth() === 9 ? EVENTS[date.getDate()] ?? [] : [], events = all.filter((event) => checked.includes(event[3]));
  return (
    <CalendarDrawer user={USER} date={date} onDateChange={setDate} today={TODAY} marked={MARKED} calendars={CALENDARS} checked={checked} onCheckedChange={setChecked}>
      <Text tone="muted">{events.length ? `${events.length} ${events.length === 1 ? "event" : "events"}` : "Nothing planned"}{all.length > events.length ? ` · ${all.length - events.length} hidden` : ""}</Text>
      {events.length ? <Stack gap="xs">{events.map(([time, title, place, calendar]) => <EventCard key={title} time={time} title={title} place={place} calendar={calendar} />)}</Stack> : <Callout title="A free day">Open the menu to pick another day. Days with a dot have something planned.</Callout>}
      <Button title="New event" variant="outline" block />
    </CalendarDrawer>
  );
}

// ---------------------------------------------------------------- file tree drawer
const CHANGES = [{ id: "readme", label: "README.md", status: "M" }, { id: "hello-route", label: "api/hello/route.ts", status: "U" }, { id: "layout-change", label: "app/layout.tsx", status: "M" }];
const TREE = [
  { id: "app", label: "app", defaultOpen: true, children: [
    { id: "api", label: "api", children: [{ id: "route", label: "route.ts" }] },
    { id: "layout", label: "layout.tsx" }, { id: "page", label: "page.tsx" }] },
  { id: "components-dir", label: "components", children: [{ id: "button", label: "button.tsx" }, { id: "card", label: "card.tsx" }] },
  { id: "package", label: "package.json" }, { id: "readme-file", label: "README.md" },
];
const ROUTE = "import { NextResponse } from \"next/server\";\n\nexport async function GET() {\n  return NextResponse.json({ hello: \"world\" });\n}";
const LAYOUT = "import \"./globals.css\";\n\nexport const metadata = { title: \"Acme\" };\n\nexport default function Layout({ children }) {\n  return (\n    <html lang=\"en\">\n      <body>{children}</body>\n    </html>\n  );\n}";
const README = "# Acme\n\nA small starter app.\n\n## Develop\n\n    npm install\n    npm run dev\n\n## Deploy\n\nPush to main. The preview is ready in a minute.";
const SOURCES = {
  page: "import { Card } from \"@/components/card\";\nimport { getPosts } from \"@/lib/posts\";\n\nexport default async function Page() {\n  const posts = await getPosts();\n  return (\n    <main>\n      <h1>Latest</h1>\n      {posts.map((post) => (\n        <Card key={post.id} post={post} />\n      ))}\n    </main>\n  );\n}",
  layout: LAYOUT, "layout-change": LAYOUT, route: ROUTE, "hello-route": ROUTE, readme: README, "readme-file": README,
  button: "export function Button({ children, ...props }) {\n  return (\n    <button className=\"button\" {...props}>\n      {children}\n    </button>\n  );\n}",
  card: "export function Card({ post }) {\n  return (\n    <article className=\"card\">\n      <h2>{post.title}</h2>\n      <p>{post.summary}</p>\n    </article>\n  );\n}",
  package: "{\n  \"name\": \"acme\",\n  \"private\": true,\n  \"scripts\": {\n    \"dev\": \"acme dev\",\n    \"build\": \"acme build\"\n  }\n}",
};
const STATUS = { M: ["Modified", "warn"], U: ["Untracked", "ok"] };

function FileTreeDrawerDemo() {
  const [file, setFile] = useState("page"), source = SOURCES[file] ?? "", change = CHANGES.find((entry) => entry.id === file), toast = useToast();
  return (
    <FileTreeDrawer changes={CHANGES} tree={TREE} selected={file} onSelect={setFile}>
      <Cluster justify="space-between">
        <Cluster>{change ? <Badge tone={STATUS[change.status][1]}>{STATUS[change.status][0]}</Badge> : <Badge>Unchanged</Badge>}<Text size="sm" tone="muted">{source.split("\n").length} lines</Text></Cluster>
        <Button title="Copy" size="s" variant="outline" onPress={() => toast.show("Copied to clipboard")} />
      </Cluster>
      <CodeBlock code={source} numbered />
      <Text size="sm" tone="muted">Last changed by Jordan, 2 hours ago</Text>
    </FileTreeDrawer>
  );
}

// ---------------------------------------------------------------- settings sheet
const LANGUAGES = [{ value: "English", label: "English" }, { value: "Deutsch", label: "Deutsch" }, { value: "ქართული", label: "ქართული" }];
const THEMES = [{ value: "System", label: "Match the system" }, { value: "Light", label: "Light" }, { value: "Dark", label: "Dark" }];

function SettingsSheetDemo() {
  const [visible, setVisible] = useState(false), [section, setSection] = useState(null);
  const [push, setPush] = useState(true), [email, setEmail] = useState(false), [look, setLook] = useState("System"), [language, setLanguage] = useState("English"), [visibleToAll, setVisibleToAll] = useState(true);
  const sections = [
    { id: "general", title: "General", items: [
      { id: "notifications", label: "Notifications", icon: "◉", trailing: push ? "On" : "Off", testID: "settings-notifications" },
      { id: "appearance", label: "Appearance", icon: "◧", trailing: look },
      { id: "language", label: "Language", icon: "◎", trailing: language }] },
    { id: "account", title: "Account", items: [{ id: "privacy", label: "Privacy", icon: "◈", trailing: visibleToAll ? "Public" : "Private" }, { id: "about", label: "About", icon: "i", trailing: "v2.4.1" }] },
  ];
  return (
    <Screen scroll gap="m">
      <Stack gap="xs" align="center" style={{ paddingVertical: 8 }}>
        <Avatar name={USER.name} size={72} />
        <Heading level={2}>{USER.name}</Heading>
        <Text tone="muted">{USER.email}</Text>
      </Stack>
      <Card padded={false} gap={0}>
        <ListItem title="Notifications" trailing={push ? "On" : "Off"} /><Divider />
        <ListItem title="Appearance" trailing={look} /><Divider />
        <ListItem title="Language" trailing={language} /><Divider />
        <ListItem title="Profile" trailing={visibleToAll ? "Public" : "Private"} />
      </Card>
      <Button title="Open settings" block onPress={() => setVisible(true)} testID="open-settings" />
      <Text size="sm" tone="muted" align="center">Settings open as a sheet. Choose a section, change something, and it shows up here.</Text>
      <SettingsSheet visible={visible} onClose={() => { setVisible(false); setSection(null); }} sections={sections} selected={section} onSelect={setSection} testID="settings">
        {section === "notifications" ? (
          <>
            <Text tone="muted">Choose how we reach you when something needs your attention.</Text>
            <Card gap="2xs"><Switch label="Push notifications" value={push} onValueChange={setPush} /><Divider /><Switch label="Email summaries" value={email} onValueChange={setEmail} /></Card>
          </>
        ) : section === "appearance" ? (
          <><Text tone="muted">The app can follow your phone, or stay light or dark.</Text><Card><RadioGroup value={look} onChange={setLook} options={THEMES.map((option) => ({ value: option.value, label: option.label }))} /></Card></>
        ) : section === "language" ? (
          <><Text tone="muted">Used for menus, dates and numbers.</Text><Card><RadioGroup value={language} onChange={setLanguage} options={LANGUAGES} /></Card></>
        ) : section === "privacy" ? (
          <><Text tone="muted">Decide who can find your profile.</Text><Card><Switch label="Show my profile to everyone" value={visibleToAll} onValueChange={setVisibleToAll} /></Card></>
        ) : (
          <><Heading level={3}>Acme for iOS and Android</Heading><Text tone="muted">Version 2.4.1 (build 318). Made in Tbilisi.</Text><Button title="Licences" variant="outline" /></>
        )}
      </SettingsSheet>
    </Screen>
  );
}

export default [
  { id: "sectioned-drawer", title: "Sectioned drawer", fullscreen: true, description: "A navigation drawer with links grouped in sections that fold, a search that filters them and a version switcher: documentation on a phone.", Demo: SectionedDrawerDemo },
  { id: "nested-drawer", title: "Nested drawer", fullscreen: true, description: "A drawer whose items open to show the items inside them: the categories and subcategories of a shop.", Demo: NestedDrawerDemo },
  { id: "workspace-drawer", title: "Workspace drawer", fullscreen: true, description: "A team app's drawer: workspace switcher at the top, navigation with icons and badges, help links and the account at the bottom.", Demo: WorkspaceDrawerDemo },
  { id: "mail-layout", title: "Mail layout", fullscreen: true, description: "Mail as three stacked levels: folders in the drawer, the message list as the screen, and the open message pushed over it with a back button.", Demo: MailLayoutDemo },
  { id: "calendar-drawer", title: "Calendar drawer", fullscreen: true, description: "A drawer with a month to pick the day from and calendars to switch on and off; the screen shows the chosen day.", Demo: CalendarDrawerDemo },
  { id: "file-tree-drawer", title: "File tree drawer", fullscreen: true, description: "A drawer with the changed files and a tree of folders that fold; the screen shows the open file.", Demo: FileTreeDrawerDemo },
  { id: "settings-sheet", title: "Settings sheet", fullscreen: true, description: "Settings as a bottom sheet with its own navigation: a list of sections, each opening its page inside the sheet with a back button.", Demo: SettingsSheetDemo },
];

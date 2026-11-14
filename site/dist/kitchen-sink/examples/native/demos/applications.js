// Demos for the application components: the dashboard pieces, each fed by a model object like on the web.
import { useState } from "react";
import { View } from "react-native";
import {
  useToast, useTheme, Stack, Text, Card, Badge, Button, ListItem, Divider, Progress, Sheet,
  ApplicationShell, ApplicationMetrics, ApplicationChart, ApplicationTable, ApplicationBoard, ApplicationProjects, ApplicationPlanner,
  ApplicationIdentity, ApplicationProducts, ApplicationReceipt, ApplicationConversation, ApplicationForm, ApplicationPhoto, ApplicationArticle,
} from "@colibri-kit/native";

const SHELL = {
  brand: "Northstar", user: "Jordan Lee", title: "Overview", description: "Three projects are on track. One needs your review.",
  pages: [
    { id: "overview", title: "Overview", icon: "⌂", description: "Three projects are on track. One needs your review." },
    { id: "records", title: "Records", icon: "☰", description: "Customers and their current plans." },
    { id: "inbox", title: "Inbox", icon: "✉", badge: 2, description: "Two conversations are waiting for a reply." },
    { id: "settings", title: "Settings", icon: "⚙", description: "Workspace, members and billing." },
  ],
};

const METRICS = {
  title: "Key metrics",
  items: [
    { id: "revenue", label: "Revenue", value: "$48,250", change: "+12% from last month", series: [31, 34, 33, 38, 41, 40, 44, 48] },
    { id: "customers", label: "Active customers", value: "1,240", change: "+84 this month", series: [1020, 1050, 1090, 1110, 1150, 1160, 1205, 1240] },
    { id: "churn", label: "Churn", value: "2.4%", change: "−0.3 percentage points", tone: "ok", series: [3.4, 3.1, 3.2, 2.9, 2.8, 2.7, 2.7, 2.4] },
    { id: "response", label: "First response", value: "3h 12m", change: "+41 minutes slower", tone: "bad", series: [2.1, 2.2, 2.0, 2.4, 2.6, 2.5, 2.9, 3.2] },
  ],
};

const VISITORS = [420, 518, 578, 581, 533, 464, 410, 402, 446, 521, 593, 624, 597, 521, 426, 353, 330, 364, 436, 509, 547, 534, 477, 406, 360, 366, 430, 529, 625, 682];
const SIGNUPS = [258, 212, 190, 207, 262, 336, 397, 423, 404, 351, 290, 249, 247, 281, 334, 376, 384, 351, 288, 223, 184, 188, 233, 300, 358, 385, 372, 330, 286, 266];
const CHART = {
  title: "Audience growth", description: "Daily visitors and signups · October sample", labels: ["Visitors", "Signups"], ranges: [7, 14, 30], defaultRange: 7,
  rows: VISITORS.map((visitors, index) => ({ label: `Oct ${index + 1}`, values: [visitors, SIGNUPS[index]] })),
  href: "analytics/traffic", linkLabel: "Acquisition report",
};

const TABLE = {
  title: "Customers", description: "Search and inspect customer records.", columns: ["Name", "Company", "Plan", "Revenue", "Status"],
  rows: [
    { id: "maya", cells: ["Maya Chen", "Atlas Studio", "Pro", "$240", "Active"] },
    { id: "alex", cells: ["Alex Rivera", "North & Co", "Team", "$1,100", "Active"] },
    { id: "sam", cells: ["Sam Patel", "Fieldnotes", "Starter", "$79", "Trial"] },
    { id: "ines", cells: ["Inès Laurent", "Maison Verte", "Team", "$860", "Past due"] },
    { id: "tomas", cells: ["Tomás Ortega", "Harbor Freight Labs", "Pro", "$240", "Active"] },
    { id: "priya", cells: ["Priya Nair", "Lumen Health", "Enterprise", "$4,800", "Active"] },
    { id: "jonas", cells: ["Jonas Weber", "Kiosk GmbH", "Starter", "$79", "Churned"] },
    { id: "aiko", cells: ["Aiko Tanaka", "Paper Crane", "Pro", "$240", "Trial"] },
  ],
};

const BOARD = {
  title: "Sales pipeline", description: "Select an opportunity to update its stage.",
  lanes: [
    { id: "new", title: "New", deals: [
      { id: "atlas", company: "Atlas Studio", value: "$12,000", owner: "Maya Chen", next: "Intro call on Thursday" },
      { id: "lumen", company: "Lumen Health", value: "$38,500", owner: "Jordan Lee", next: "Send security questionnaire" },
    ] },
    { id: "proposal", title: "Proposal", deals: [
      { id: "north", company: "North & Co", value: "$24,000", owner: "Alex Rivera", next: "Proposal review on Nov 9" },
    ] },
    { id: "negotiation", title: "Negotiation", deals: [
      { id: "harbor", company: "Harbor Freight Labs", value: "$61,000", owner: "Maya Chen", next: "Legal is reviewing the contract" },
    ] },
    { id: "won", title: "Won", deals: [] },
  ],
};

const PROJECTS = {
  title: "Projects", description: "Track current work.",
  projects: [
    { id: "atlas", name: "Project Atlas", description: "Customer portal launch · 8 tasks remaining", progress: 65, status: "On track", members: ["Maya Chen", "Alex Rivera", "Sam Patel"] },
    { id: "mobile", name: "Mobile release", description: "Version 2.4 · QA in progress", progress: 85, status: "In review", members: ["Jordan Lee", "Priya Nair"] },
    { id: "website", name: "Website refresh", description: "New pricing page · copy is two days late", progress: 30, status: "At risk", members: ["Inès Laurent", "Tomás Ortega", "Aiko Tanaka", "Jonas Weber"] },
  ],
};

const PLANNER = {
  title: "This week", description: "November 2 – 6",
  days: [{ id: "mon", label: "Mon", day: "2" }, { id: "tue", label: "Tue", day: "3" }, { id: "wed", label: "Wed", day: "4" }, { id: "thu", label: "Thu", day: "5" }, { id: "fri", label: "Fri", day: "6" }],
  day: "mon",
  events: [
    { id: "standup", day: "mon", datetime: "2026-11-02T09:00", time: "9:00 AM", title: "Product standup", location: "Meeting room A" },
    { id: "lunch", day: "mon", datetime: "2026-11-02T12:30", time: "12:30 PM", title: "Lunch with North & Co", location: "Café Lumière · 1 hour", tone: "ok", tag: "Client" },
    { id: "review", day: "mon", datetime: "2026-11-02T14:00", time: "2:00 PM", title: "Design review", location: "Studio · 45 minutes" },
    { id: "deadline", day: "mon", datetime: "2026-11-02T17:00", time: "5:00 PM", title: "Release notes due", location: "Version 2.4", tone: "warn", tag: "Deadline" },
    { id: "planning", day: "tue", datetime: "2026-11-03T10:00", time: "10:00 AM", title: "Sprint planning", location: "Meeting room B · 90 minutes" },
    { id: "interview", day: "tue", datetime: "2026-11-03T15:30", time: "3:30 PM", title: "Interview: senior designer", location: "Video call", tone: "ok" },
    { id: "allhands", day: "thu", datetime: "2026-11-05T11:00", time: "11:00 AM", title: "All hands", location: "Main hall" },
    { id: "retro", day: "fri", datetime: "2026-11-06T16:00", time: "4:00 PM", title: "Retrospective", location: "Meeting room A", tone: "warn" },
  ],
};

const IDENTITY = {
  id: "jordan", name: "Jordan Lee", role: "Workspace administrator", status: "Active",
  stats: [{ label: "Projects", value: "12" }, { label: "Members", value: "48" }, { label: "Since", value: "2021" }],
  details: [{ label: "Email", value: "jordan@example.com" }, { label: "Team", value: "Product" }, { label: "Location", value: "Lisbon, Portugal" }, { label: "Time zone", value: "UTC+0 · WET" }],
};

const PRODUCTS = {
  title: "Products", description: "Create a sample order.",
  products: [
    { id: "headphones", name: "Studio headphones", price: "$320", amount: 320, stock: "12 available" },
    { id: "daypack", name: "Canvas daypack", price: "$180", amount: 180, stock: "8 available" },
    { id: "lamp", name: "Desk lamp, brass", price: "$95", amount: 95, stock: "2 available" },
    { id: "notebook", name: "Field notebook, set of 3", price: "$24", amount: 24, stock: "0 available" },
  ],
};

const RECEIPT = {
  id: "1048", title: "Order #1048", description: "November 2 · Visa ending 4242", status: "Paid",
  items: [
    { label: "Studio headphones × 1", detail: "Graphite", amount: "$320.00" },
    { label: "Canvas daypack × 2", detail: "Olive · 18 L", amount: "$360.00" },
  ],
  totals: [{ label: "Subtotal", amount: "$680.00" }, { label: "Shipping", amount: "$20.00" }, { label: "Tax (8%)", amount: "$54.40" }],
  total: "$754.40", note: "Sent to jordan@example.com. Returns are free for 30 days.",
};

const TICKETS = [
  { id: "2081", customer: "Maya Chen", title: "Cannot invite a teammate", status: "Open", message: "Could you check our workspace member limit? I get an error when I invite a fifth person.",
    messages: [
      { author: "Maya Chen", time: "9:14 AM", text: "Could you check our workspace member limit? I get an error when I invite a fifth person." },
      { author: "Jordan Lee", time: "9:20 AM", own: true, text: "Thanks, Maya. Your plan includes four seats. I can add a fifth today if you like." },
      { author: "Maya Chen", time: "9:22 AM", text: "Yes please. Dana starts on Monday." },
    ] },
  { id: "2080", customer: "Alex Rivera", title: "Update our invoice address", status: "Pending", message: "Please add 12 Market Street to invoice #1048." },
  { id: "2079", customer: "Priya Nair", title: "Export stops at 500 rows", status: "Resolved", message: "The CSV export of our customer list ends at row 500. Is there a limit?" },
];
const CONVERSATION = { tickets: TICKETS, selected: { ...TICKETS[0], assigned: "Jordan Lee" }, agents: ["Jordan Lee", "Maya Chen", "Sam Patel"], statuses: ["Open", "Pending", "Resolved"] };

const FORM = {
  id: "jordan", title: "Edit profile", description: "This is shown to people in your workspace.", submitLabel: "Save profile", resetLabel: "Reset", successMessage: "Profile saved.",
  fields: [
    { name: "name", label: "Full name", type: "text", value: "Jordan Lee" },
    { name: "email", label: "Email", type: "email", value: "jordan@example.com" },
    { name: "phone", label: "Phone", type: "tel", value: "", required: false, placeholder: "+351 912 345 678", hint: "Optional. Used for sign-in codes only." },
    { name: "team", label: "Team", type: "select", value: "Product", options: ["Product", "Design", "Engineering"] },
    { name: "bio", label: "About", type: "textarea", value: "", required: false, maxLength: 280, placeholder: "A sentence or two about your role." },
    { name: "digest", label: "Send me the weekly digest", type: "switch", value: true },
  ],
};

const PHOTO = {
  eyebrow: "Team workspace", title: "Meet your project team", description: "See the people working on your next release.", href: "workspace/members", linkLabel: "View team",
  imageAlt: "A bright shared workspace",
  photos: [
    { id: "studio", title: "Studio floor", tone: "accent" }, { id: "kitchen", title: "Kitchen table", tone: "warn" }, { id: "garden", title: "Roof garden", tone: "ok" },
    { id: "workshop", title: "Print workshop", tone: "bad" }, { id: "library", title: "Quiet library", tone: "ok" }, { id: "meeting", title: "Meeting space", tone: "accent" },
  ],
};

const ARTICLE = {
  eyebrow: "Workspace guide", title: "Invite a teammate", author: "Jordan Lee · Updated November 2 · 2 min read", summary: "Add people to your workspace and choose their access.",
  body: ["Anyone with the administrator role can invite people. Invitations stay valid for seven days and can be sent again at any time."],
  steps: [
    { title: "Open Members", text: "Choose Members from workspace settings." },
    { title: "Send an invitation", text: "Enter the email address and select a role." },
    { title: "Confirm the seat", text: "If every seat is taken, add one before the invitation is sent." },
  ],
  href: "account/members", linkLabel: "Open member settings",
};

const say = (toast) => ({ action, id, value }) => toast.show([action, id, typeof value === "object" ? null : value].filter((part) => part != null && part !== "").join(" · "));

function ShellDemo() {
  const theme = useTheme(), [page, setPage] = useState("overview");
  return (
    <View style={{ height: 600, borderRadius: theme.radius.l, borderWidth: 1, borderColor: theme.colors.line, overflow: "hidden" }}>
      <ApplicationShell model={SHELL} page={page} onPageChange={setPage}>
        {page === "overview" ? <>
          <ApplicationMetrics model={{ items: METRICS.items.slice(0, 2) }} />
          <Card><Text weight="semibold">Needs your review</Text><Text size="sm" tone="muted">Website refresh · the pricing page copy is two days late.</Text><Progress value={0.3} tone="warn" /><Button title="Open records" variant="soft" onPress={() => setPage("records")} /></Card>
        </> : null}
        {page === "records" ? <Card padded={false} gap={0}>{TABLE.rows.slice(0, 5).map((row, index) => <View key={row.id}>{index ? <Divider /> : null}<ListItem title={row.cells[0]} subtitle={`${row.cells[1]} · ${row.cells[2]}`} trailing={<Badge tone={row.cells[4] === "Active" ? "ok" : "warn"}>{row.cells[4]}</Badge>} /></View>)}</Card> : null}
        {page === "inbox" ? <Card padded={false} gap={0}>{TICKETS.slice(0, 2).map((ticket, index) => <View key={ticket.id}>{index ? <Divider /> : null}<ListItem title={ticket.title} subtitle={`${ticket.customer} · ${ticket.message}`} trailing={<Badge tone="accent">{ticket.status}</Badge>} /></View>)}</Card> : null}
        {page === "settings" ? <ApplicationIdentity model={IDENTITY} onAction={() => setPage("overview")} /> : null}
      </ApplicationShell>
    </View>
  );
}

function IdentityDemo() {
  const toast = useToast(), [model, setModel] = useState(IDENTITY), [editing, setEditing] = useState(false);
  const fields = [
    { name: "name", label: "Full name", type: "text", value: model.name },
    { name: "role", label: "Role", type: "text", value: model.role },
    { name: "email", label: "Email", type: "email", value: model.details[0].value },
  ];
  return (
    <Stack>
      <ApplicationIdentity model={model} onAction={() => setEditing(true)} />
      <Sheet visible={editing} onClose={() => setEditing(false)}>
        <ApplicationForm model={{ id: model.id, title: "Edit profile", submitLabel: "Save profile", fields }} bare
          onSubmit={({ values }) => { setModel({ ...model, name: values.name, role: values.role, details: [{ label: "Email", value: values.email }, ...model.details.slice(1)] }); setEditing(false); toast.show("Profile saved", { tone: "ok" }); }} />
      </Sheet>
    </Stack>
  );
}

function FormDemo() {
  const toast = useToast(), [saved, setSaved] = useState(null);
  return (
    <Stack>
      <ApplicationForm model={FORM} onSubmit={({ values }) => { setSaved(values); toast.show("Profile saved", { tone: "ok" }); }} />
      {saved ? <Card><Text size="sm" weight="semibold">onSubmit received</Text>{Object.entries(saved).map(([name, value]) => <Text key={name} size="sm" tone="muted">{name}: {String(value) || "—"}</Text>)}</Card> : null}
    </Stack>
  );
}

export default [
  { id: "application-shell", title: "ApplicationShell", description: "The app frame: top bar, page heading and content, with a bottom tab bar on phones and a side rail on wide screens.", Demo: ShellDemo },
  { id: "application-metrics", title: "ApplicationMetrics", description: "A grid of KPI cards with value, change in the ok or bad tone and a tiny bar sparkline.", Demo: () => {
    const toast = useToast();
    return <ApplicationMetrics model={METRICS} onAction={say(toast)} />;
  } },
  { id: "application-chart", title: "ApplicationChart", description: "A bar chart drawn with Views (no SVG, so no line or pie charts), with a 7, 14 or 30 day switch, a legend, a summary in words and the data as a table.", Demo: () => {
    const toast = useToast();
    return <ApplicationChart model={CHART} onAction={say(toast)} />;
  } },
  { id: "application-table", title: "ApplicationTable", description: "Records as rows on a phone and as columns on wide screens, with search, sort, a status filter and paging for long lists.", Demo: () => {
    const toast = useToast();
    return <ApplicationTable model={TABLE} pageSize={6} onAction={({ id }) => toast.show(`Opened ${TABLE.rows.find((row) => row.id === id).cells[0]}`)} />;
  } },
  { id: "application-board", title: "ApplicationBoard", description: "Kanban lanes in a sideways pager. Press a card to move it to another stage from a sheet (no drag and drop).", Demo: () => {
    const toast = useToast();
    return <ApplicationBoard model={BOARD} onAction={({ action, id, value }) => { if (action === "move-deal") toast.show(`Moved ${id} to ${value}`, { tone: "ok" }); }} />;
  } },
  { id: "application-projects", title: "ApplicationProjects", description: "Project cards with a placeholder cover, status, progress, members and a details action.", Demo: () => {
    const toast = useToast();
    return <ApplicationProjects model={PROJECTS} onAction={({ id }) => toast.show(`Opened ${PROJECTS.projects.find((project) => project.id === id).name}`)} />;
  } },
  { id: "application-planner", title: "ApplicationPlanner", description: "A day strip and the day's events on a time rail.", Demo: () => {
    const toast = useToast();
    return <ApplicationPlanner model={PLANNER} onAction={({ action, id }) => { if (action === "view-event") toast.show(PLANNER.events.find((event) => event.id === id).title); }} />;
  } },
  { id: "application-identity", title: "ApplicationIdentity", description: "A profile card with account details. Edit profile opens a form in a sheet and the card updates.", Demo: IdentityDemo },
  { id: "application-products", title: "ApplicationProducts", description: "Catalog cards with quantity steppers capped by stock and an order total that follows.", Demo: () => {
    const toast = useToast();
    return <ApplicationProducts model={PRODUCTS} onAction={({ action, total }) => { if (action === "checkout") toast.show(`Order created · $${total}`, { tone: "ok" }); }} />;
  } },
  { id: "application-receipt", title: "ApplicationReceipt", description: "Order line items, sub-totals, the total and a download action handed to the app.", Demo: () => {
    const toast = useToast();
    return <ApplicationReceipt model={RECEIPT} onAction={({ id }) => toast.show(`Receipt ${id} is ready to share`, { tone: "ok" })} />;
  } },
  { id: "application-conversation", title: "ApplicationConversation", description: "A ticket queue and the selected thread with assignment, status and a reply box.", Demo: () => {
    const toast = useToast();
    return <ApplicationConversation model={CONVERSATION} onAction={({ action, value }) => { if (value) toast.show(action === "assign-ticket" ? `Assigned to ${value}` : `Status: ${value}`); }} onSubmit={() => toast.show("Reply sent", { tone: "ok" })} />;
  } },
  { id: "application-form", title: "ApplicationForm", description: "A form built from a list of fields. It validates on submit and hands the values to onSubmit.", Demo: FormDemo },
  { id: "application-photo", title: "ApplicationPhoto", description: "A photo feature with a gallery grid. Pictures are tinted placeholder tiles; no remote image is loaded.", Demo: () => {
    const toast = useToast();
    return <ApplicationPhoto model={PHOTO} onAction={({ action, id }) => { if (action === "open-link") toast.show(`Open ${id}`); }} />;
  } },
  { id: "application-article", title: "ApplicationArticle", description: "A reading layout: title, byline, summary, numbered steps and a related link.", Demo: () => {
    const toast = useToast();
    return <ApplicationArticle model={ARTICLE} onAction={({ id }) => toast.show(`Open ${id}`)} />;
  } },
];

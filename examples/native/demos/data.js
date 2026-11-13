// Demos for data display: tables, lists, carousel, message log, code, rating and placeholders.
// The catalog entries progress, card, avatar and badge are shown with the basics (core.js).
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import {
  useToast, useTheme, Stack, Cluster, Text, Heading, Button, Card, Badge, Avatar, Switch,
  Table, DataTable, DataList, Carousel, MessageScroller, CodeBlock, Rating, Skeleton, SkeletonText, Empty,
} from "@colibri-kit/native";

const INVOICES = [
  { id: "INV-1042", customer: "Northwind Traders", status: "Paid", tone: "ok", due: "12 Nov 2026", amount: "$1,280.00" },
  { id: "INV-1043", customer: "Blue Harbor Studio", status: "Due soon", tone: "warn", due: "18 Nov 2026", amount: "$460.00" },
  { id: "INV-1044", customer: "Fernleaf Bakery", status: "Overdue", tone: "bad", due: "02 Nov 2026", amount: "$92.50" },
  { id: "INV-1045", customer: "Atlas Cycling Club", status: "Draft", due: "30 Nov 2026", amount: "$3,150.00" },
];

const ARTICLES = [
  { id: 1, title: "Tbilisi in three days", author: "Nino Beridze", views: 12480, date: "2026-10-01" },
  { id: 2, title: "Batumi by the sea", author: "Levan Kapanadze", views: 9815, date: "2026-09-15" },
  { id: 3, title: "Kutaisi food guide", author: "Maya Okafor", views: 30210, date: "2026-10-20" },
  { id: 4, title: "A weekend in Gori", author: "Sam Chen", views: 512, date: "2025-12-31" },
  { id: 5, title: "Zugdidi markets", author: "Nino Beridze", views: 4203, date: "2026-01-11" },
  { id: 6, title: "Hiking in Kazbegi", author: "Alex Rivera", views: 18770, date: "2026-06-04" },
  { id: 7, title: "Wine roads of Kakheti", author: "Levan Kapanadze", views: 22145, date: "2026-08-22" },
  { id: 8, title: "Svaneti towers", author: "Maya Okafor", views: 7390, date: "2026-03-09" },
  { id: 9, title: "Borjomi spa towns", author: "Alex Rivera", views: 2644, date: "2026-02-17" },
  { id: 10, title: "Mtskheta day trip", author: "Sam Chen", views: 6021, date: "2026-05-28" },
  { id: 11, title: "Vardzia cave city", author: "Nino Beridze", views: 8842, date: "2026-07-13" },
];
const shortDate = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const SLIDES = [
  { tag: "Featured", title: "Hiking in Kazbegi", text: "Four trails above the clouds, from an easy morning walk to a full day on the glacier.", tone: "accent" },
  { tag: "Food", title: "Kutaisi food guide", text: "Where to find the best khachapuri, and what to order with it.", tone: "ok" },
  { tag: "Culture", title: "Svaneti towers", text: "A thousand years of stone watchtowers in the high Caucasus.", tone: "warn" },
  { tag: "Wine", title: "Wine roads of Kakheti", text: "Small family cellars that still make wine in clay qvevri.", tone: "bad" },
];

const Slide = ({ slide }) => {
  const theme = useTheme(), tone = theme.tones[slide.tone];
  return (
    <View style={{ minHeight: 190, padding: theme.space.l, justifyContent: "flex-end", gap: theme.space["2xs"], backgroundColor: tone.tint, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.l }}>
      <Badge tone={slide.tone}>{slide.tag}</Badge>
      <Heading level={3}>{slide.title}</Heading>
      <Text size="sm" tone="muted">{slide.text}</Text>
    </View>
  );
};

const CHAT = [
  { from: "them", text: "Hi! Is the Kazbegi article ready for review?" },
  { from: "me", text: "Almost. I am adding the trail map now." },
  { from: "them", text: "Great. Can you include the bus times too?" },
  { from: "me", text: "Yes, they are in the last section." },
  { from: "them", text: "Perfect. I will schedule it for Friday." },
];
const REPLIES = ["Sounds good.", "One more thing: the cover photo needs a credit.", "Thanks for the quick turnaround!", "Can we add a short packing list?", "Published. Nice work."];

const ChatBubble = ({ from, text }) => {
  const theme = useTheme(), mine = from === "me";
  return (
    <View style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "82%", paddingVertical: theme.space.xs, paddingHorizontal: theme.space.s, borderRadius: theme.radius.m, backgroundColor: mine ? theme.colors.accent : theme.colors.sunken }}>
      <Text size="sm" style={mine ? { color: theme.colors.brandFg } : null}>{text}</Text>
    </View>
  );
};

const INSTALL = "npm install @colibri-kit/native";
const SNIPPET = `import { ColibriProvider, Screen, Heading, Button } from "@colibri-kit/native";

export default function App() {
  return (
    <ColibriProvider hue={160}>
      <Screen>
        <Heading>Hello</Heading>
        <Button title="Continue" onPress={() => console.log("pressed")} />
      </Screen>
    </ColibriProvider>
  );
}`;

export default [
  { id: "table", title: "Table", description: "A plain table with a caption and headers; it scrolls sideways when the columns need more room.", Demo: () => (
    <Stack gap="m">
      <Table caption="Recent invoices — swipe sideways for more columns" rows={INVOICES} columns={[
        { key: "id", title: "Invoice", width: 96 },
        { key: "customer", title: "Customer", minWidth: 170 },
        { key: "status", title: "Status", width: 116, render: (row) => <Badge tone={row.tone}>{row.status}</Badge> },
        { key: "due", title: "Due", width: 118 },
        { key: "amount", title: "Amount", width: 110, numeric: true },
      ]} />
      <Table caption="Striped and dense" striped dense rows={INVOICES} columns={[{ key: "customer", title: "Customer" }, { key: "amount", title: "Amount", width: 110, numeric: true }]} />
    </Stack>
  ) },
  { id: "datatable", title: "DataTable", description: "A table with search, sortable columns, row selection and pages.", Demo: () => {
    const toast = useToast(), [selected, setSelected] = useState([3]);
    return (
      <Stack>
        <DataTable rows={ARTICLES} pageSize={5} selectable selected={selected} onSelectedChange={setSelected} defaultSort={{ key: "views", direction: "desc" }} searchPlaceholder="Search articles…"
          rowLabel={(row) => row.title}
          columns={[
            { key: "title", title: "Title", minWidth: 170 },
            { key: "author", title: "Author", minWidth: 140 },
            { key: "views", title: "Views", width: 100, numeric: true, render: (row) => row.views.toLocaleString("en-US") },
            { key: "date", title: "Date", width: 124, render: (row) => shortDate(row.date) },
          ]} />
        <Cluster>
          <Button title={selected.length ? `Archive ${selected.length} selected` : "Archive"} variant="outline" size="s" disabled={!selected.length}
            onPress={() => { toast.show(`Archived ${selected.length} ${selected.length === 1 ? "article" : "articles"}`, { tone: "ok" }); setSelected([]); }} />
          <Button title="Clear selection" variant="ghost" size="s" disabled={!selected.length} onPress={() => setSelected([])} />
        </Cluster>
      </Stack>
    );
  } },
  { id: "data-list", title: "DataList", description: "Label and value pairs, side by side or stacked.", Demo: () => (
    <Stack gap="m">
      <Card>
        <Cluster gap="s"><Avatar name="Nino Beridze" /><Stack gap={0}><Text weight="semibold">Nino Beridze</Text><Text size="sm" tone="muted">Customer since 2023</Text></Stack></Cluster>
        <DataList items={[
          { label: "Status", value: <Badge tone="ok">Active</Badge> },
          { label: "Email", value: "nino@example.ge" },
          { label: "Company", value: "Despani" },
          { label: "Plan", value: "Team — $49 per month" },
          { label: "Next invoice", value: "1 December 2026" },
        ]} />
      </Card>
      <Card>
        <Heading level={4}>Delivery</Heading>
        <DataList orientation="vertical" divided={false} gap="s" items={[
          { label: "Address", value: "14 Rustaveli Avenue, Tbilisi 0108" },
          { label: "Instructions", value: "Leave with the concierge if nobody answers." },
        ]} />
      </Card>
    </Stack>
  ) },
  { id: "carousel", title: "Carousel", description: "Slides you swipe or step through with arrows and dots.", Demo: () => {
    const [index, setIndex] = useState(0), [auto, setAuto] = useState(false);
    return (
      <Stack>
        <Carousel index={index} onChange={setIndex} loop autoplay={auto ? 3000 : 0} accessibilityLabel="Featured articles">
          {SLIDES.map((slide) => <Slide key={slide.title} slide={slide} />)}
        </Carousel>
        <Text size="sm" tone="muted">Slide {index + 1} of {SLIDES.length}: {SLIDES[index].title}</Text>
        <Switch label="Play automatically" value={auto} onValueChange={setAuto} />
      </Stack>
    );
  } },
  { id: "message-scroller", title: "MessageScroller", description: "A chat log that stays on the newest message, with a button to jump back down after you scroll up.", Demo: () => {
    const [messages, setMessages] = useState(CHAT), [live, setLive] = useState(false), log = useRef(null);
    const add = (from) => setMessages((list) => [...list, { from, text: REPLIES[list.length % REPLIES.length] }]);
    useEffect(() => {
      if (!live) return undefined;
      const id = setInterval(() => add("them"), 2000);
      return () => clearInterval(id);
    }, [live]);
    return (
      <Stack>
        <MessageScroller ref={log} height={260} accessibilityLabel="Conversation with the editor">
          {messages.map((message, index) => <ChatBubble key={index} {...message} />)}
        </MessageScroller>
        <Cluster>
          <Button title="Send a message" size="s" onPress={() => { add("me"); log.current?.scrollToBottom(); }} />
          <Button title="Receive one" size="s" variant="outline" onPress={() => add("them")} />
        </Cluster>
        <Switch label="Keep receiving messages" value={live} onValueChange={setLive} />
        <Text size="sm" tone="muted">Scroll up, then receive a message: the log stays where you are and offers a way back down.</Text>
      </Stack>
    );
  } },
  { id: "code-block", title: "CodeBlock", description: "Monospace text that scrolls sideways, with a Copy button that hands the text to your onCopy callback.", Demo: () => {
    const toast = useToast();
    // React Native core has no clipboard: an app passes expo-clipboard's setStringAsync here.
    const copy = async (code) => { await globalThis.navigator?.clipboard?.writeText?.(code)?.catch?.(() => {}); toast.show("Copied to clipboard", { tone: "ok" }); };
    return (
      <Stack gap="m">
        <CodeBlock title="Install" code={INSTALL} onCopy={copy} />
        <CodeBlock language="jsx" title="App.js" code={SNIPPET} lineNumbers onCopy={copy} />
        <CodeBlock wrap code="COLIBRI_API_KEY=ck_live_51Nq8sample0000 — wrapped instead of scrolling, without a header." />
      </Stack>
    );
  } },
  { id: "rating", title: "Rating", description: "Pick one to five stars, in whole or half steps, or show a read-only score.", Demo: () => {
    const [stars, setStars] = useState(3), [half, setHalf] = useState(3.5);
    return (
      <Card gap="m">
        <Stack gap="2xs"><Text size="sm" weight="semibold">How was your stay?</Text><Rating value={stars} onChange={setStars} accessibilityLabel="Rate your stay" />
          <Text size="sm" tone="muted">{stars ? `${stars} of 5 — press the same star again to clear.` : "Not rated yet."}</Text></Stack>
        <Stack gap="2xs"><Text size="sm" weight="semibold">Half steps, large</Text><Rating value={half} onChange={setHalf} allowHalf size="l" tone="accent" accessibilityLabel="Rate the food" />
          <Text size="sm" tone="muted">{half} of 5 — press the left half of a star for a half.</Text></Stack>
        <Stack gap="2xs"><Text size="sm" weight="semibold">Read only</Text>
          <Cluster><Rating value={4.3} readOnly size="s" accessibilityLabel="Average rating" /><Text size="sm" tone="muted">4.3 from 128 reviews</Text></Cluster></Stack>
        <Stack gap="2xs"><Text size="sm" weight="semibold">Disabled</Text><Rating value={2} disabled /></Stack>
      </Card>
    );
  } },
  { id: "skeleton", title: "Skeleton", description: "Pulsing shapes that preview the layout while content loads; the pulse stops under reduced motion.", Demo: () => {
    const [loading, setLoading] = useState(true);
    return (
      <Stack>
        <Card accessibilityLabel={loading ? "Loading article" : undefined} accessibilityState={{ busy: loading }} aria-busy={loading}>
          {loading ? (
            <>
              <Cluster gap="s" wrap={false}><Skeleton circle={44} /><Stack gap="xs" style={{ flex: 1 }}><Skeleton width="70%" /><Skeleton width="45%" height={12} /></Stack></Cluster>
              <Skeleton height={120} radius="m" />
              <SkeletonText lines={3} />
            </>
          ) : (
            <>
              <Cluster gap="s" wrap={false}><Avatar name="Maya Okafor" size={44} /><Stack gap={0} style={{ flex: 1 }}><Text weight="semibold">Maya Okafor</Text><Text size="sm" tone="muted">Published 20 October 2026</Text></Stack></Cluster>
              <Slide slide={SLIDES[1]} />
              <Text size="sm">Kutaisi is the place to eat your way through western Georgia: start at the Green Bazaar, then follow the smell of fresh bread.</Text>
            </>
          )}
        </Card>
        <Switch label="Loading" value={loading} onValueChange={setLoading} />
      </Stack>
    );
  } },
  { id: "empty", title: "Empty", description: "A friendly placeholder for a list with nothing in it, with a call to action.", Demo: () => {
    const toast = useToast();
    return (
      <Stack gap="m">
        <Card><Empty icon="+" title="No articles yet" description="Write your first article and it will show up here." action={<Button title="New article" onPress={() => toast.show("New article started", { tone: "ok" })} />} /></Card>
        <Empty bordered size="s" icon="?" title="No results" description="Nothing matches “kazbegi trails”. Check the spelling or clear the filters."
          action={<><Button title="Clear filters" variant="outline" size="s" onPress={() => toast.show("Filters cleared")} /><Button title="Search again" variant="ghost" size="s" /></>} />
      </Stack>
    );
  } },
];

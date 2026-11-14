// Demos for the mobile group: the pieces only a phone app needs. Each entry: { id, title, description, Demo }.
// Bars and sheets are shown inside a fixed-height frame that stands in for the phone screen.
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { Animated, Platform, ScrollView, View } from "react-native";
import {
  useToast, useTheme, Stack, Cluster, Divider, Text, Heading, Button, Card, Badge, Avatar, ListItem, Tabs,
  BottomBar, TabScreens, useTabActive, AppBar, AppBarAction, useAppBarScroll, Fab, ActionSheet, BottomSheet,
  SwipeRow, SwipeGroup, PullToRefresh, SearchBar, Chip, ChipGroup, PageDots, Banner,
} from "@colibri-kit/native";

const NATIVE = Platform.OS !== "web";

function Frame({ height = 560, children, testID }) {
  const theme = useTheme();
  return <View testID={testID} style={{ height, overflow: "hidden", borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.l, backgroundColor: theme.colors.bg }}>{children}</View>;
}

const PEOPLE = ["Maya Okafor", "Alex Rivera", "Sam Chen", "Priya Nair", "Jonas Weber", "Lucía Gómez", "Tariq Aziz", "Hana Sato", "Owen Clarke", "Zofia Nowak", "Diego Costa", "Amara Bello"];
const LINES = ["Can you review the launch plan?", "Sent you the new mock-ups.", "Build is green again.", "Lunch on Thursday?", "The invoice went out this morning.", "Notes from the customer call."];
const MAIL = Array.from({ length: 30 }, (_, index) => ({ id: String(index + 1), name: PEOPLE[index % PEOPLE.length], line: LINES[index % LINES.length] }));

const MailRow = memo(function MailRow({ item }) {
  return <ListItem title={item.name} subtitle={item.line} leading={<Avatar name={item.name} size={36} />} />;
});
const MailList = memo(function MailList({ count = 30 }) {
  return MAIL.slice(0, count).map((item, index) => <View key={item.id}>{index ? <Divider /> : null}<MailRow item={item} /></View>);
});

// ---------------------------------------------------------------- bottom bar
const TABS = [
  { value: "home", label: "Home", icon: "⌂", testID: "tab-home" },
  { value: "search", label: "Search", icon: "search", testID: "tab-search" },
  { value: "inbox", label: "Inbox", icon: "✉", badge: 3, testID: "tab-inbox" },
  { value: "you", label: "You", icon: "☺", badge: true, testID: "tab-you" },
];
const LABEL_MODES = [{ value: "always", label: "Always" }, { value: "selected", label: "Selected" }, { value: "never", label: "Never" }];
const INDICATORS = [{ value: "pill", label: "Pill" }, { value: "line", label: "Line" }, { value: "none", label: "None" }];

function BottomBarDemo() {
  const toast = useToast(), [tab, setTab] = useState("home"), [labels, setLabels] = useState("always"), [indicator, setIndicator] = useState("pill"), [action, setAction] = useState(true);
  const compose = useMemo(() => ({ icon: "plus", label: "New post", onPress: () => toast.show("New post"), testID: "bar-action" }), [toast]);
  const top = useCallback((value) => toast.show(`Back to the top of ${value}`), [toast]);
  return (
    <Stack>
      <Frame height={360}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <Heading level={3}>{TABS.find((entry) => entry.value === tab).label}</Heading>
          <Text size="sm" weight="semibold">Labels</Text>
          <Tabs value={labels} onChange={setLabels} options={LABEL_MODES} />
          <Text size="sm" weight="semibold">Indicator</Text>
          <Tabs value={indicator} onChange={setIndicator} options={INDICATORS} />
          <Button title={action ? "Remove centre action" : "Add centre action"} variant="outline" size="s" onPress={() => setAction((on) => !on)} />
        </ScrollView>
        <BottomBar items={TABS} value={tab} onChange={setTab} onReselect={top} labels={labels} indicator={indicator} action={action ? compose : undefined} bottomInset={0} testID="bottom-bar" />
      </Frame>
      <Text size="sm" tone="muted">Press the selected tab again to get the “scroll to top” callback. The bar hides while the keyboard is open.</Text>
    </Stack>
  );
}

// ---------------------------------------------------------------- tab screens
// Each screen counts its own renders. Switching tabs must not raise the count of any screen.
function CountedScreen({ name }) {
  const renders = useRef(0);
  renders.current += 1;
  return (
    <ScrollView testID={`screen-${name}`} contentContainerStyle={{ paddingBottom: 16 }}>
      <View style={{ padding: 16, gap: 4 }}>
        <Heading level={3}>{name}</Heading>
        <Text size="sm" tone="muted" testID={`renders-${name}`}>Rendered {renders.current} time{renders.current === 1 ? "" : "s"}</Text>
        <ActiveBadge />
      </View>
      <MailList />
    </ScrollView>
  );
}
// Only this leaf reads useTabActive, so it is the only thing that updates when the screen is shown or hidden.
function ActiveBadge() { const active = useTabActive(); return <Badge tone={active ? "ok" : undefined}>{active ? "Visible" : "Hidden"}</Badge>; }
const HomeScreen = () => <CountedScreen name="Home" />, SearchScreen = () => <CountedScreen name="Search" />, InboxScreen = () => <CountedScreen name="Inbox" />, YouScreen = () => <CountedScreen name="You" />;
const SCREENS = { home: HomeScreen, search: SearchScreen, inbox: InboxScreen, you: YouScreen };

function TabScreensDemo() {
  const [tab, setTab] = useState("home");
  return (
    <Stack>
      <Frame testID="tab-frame">
        <TabScreens value={tab} screens={SCREENS} />
        <BottomBar items={TABS} value={tab} onChange={setTab} bottomInset={0} />
      </Frame>
      <Text size="sm" tone="muted">Scroll a list, switch away and come back: the position is kept and the render count has not moved. A screen is created the first time its tab is opened.</Text>
    </Stack>
  );
}

// ---------------------------------------------------------------- app bar
function AppBarDemo() {
  const toast = useToast(), theme = useTheme(), bar = useAppBarScroll(), plain = useAppBarScroll(), [large, setLarge] = useState("large");
  const actions = useMemo(() => <><AppBarAction icon="search" label="Search" onPress={() => toast.show("Search")} /><AppBarAction icon="more" label="More" onPress={() => toast.show("More")} /></>, [toast]);
  const back = useCallback(() => toast.show("Back"), [toast]);
  const isLarge = large === "large", scroll = isLarge ? bar : plain;
  return (
    <Stack>
      <Tabs value={large} onChange={setLarge} options={[{ value: "large", label: "Large title" }, { value: "regular", label: "Regular" }]} />
      <Frame testID="app-bar-frame">
        <AppBar key={large} title="Inbox" subtitle={isLarge ? undefined : "30 conversations"} large={isLarge} scrollY={scroll.scrollY} onBack={back} trailing={actions} topInset={0} testID="app-bar" />
        <Animated.ScrollView key={`list-${large}`} {...scroll.scrollProps} testID="app-bar-scroll" style={{ backgroundColor: theme.colors.surface }} contentContainerStyle={{ paddingTop: isLarge ? AppBar.largeTitleHeight : 0 }}>
          <MailList />
        </Animated.ScrollView>
      </Frame>
      <Text size="sm" tone="muted">The scroll offset drives the bar through Animated.event, so the title collapses on the UI thread. An edge appears under the bar once the list has moved.</Text>
    </Stack>
  );
}

// ---------------------------------------------------------------- fab
const DIAL = [
  { icon: "✎", label: "Note", testID: "dial-note" },
  { icon: "✉", label: "Message", testID: "dial-message" },
  { icon: "☎", label: "Call", testID: "dial-call" },
];
function FabDemo() {
  const toast = useToast(), [extended, setExtended] = useState(true), last = useRef(0);
  // State changes only when the direction flips, not on every scroll event.
  const onScroll = useCallback((event) => {
    const offset = event.nativeEvent.contentOffset.y, down = offset > last.current && offset > 24;
    if (Math.abs(offset - last.current) < 4) return;
    last.current = offset;
    setExtended(!down);
  }, []);
  const compose = useCallback(() => toast.show("Compose"), [toast]);
  const actions = useMemo(() => DIAL.map((action) => ({ ...action, onPress: () => toast.show(`New ${action.label.toLowerCase()}`) })), [toast]);
  return (
    <Stack>
      <Text size="sm" weight="semibold">Extended, collapses while scrolling down</Text>
      <Frame height={380}>
        <ScrollView onScroll={onScroll} scrollEventThrottle={32} testID="fab-scroll"><MailList count={16} /></ScrollView>
        <Fab icon="✎" label="Compose" extended={extended} onPress={compose} testID="fab-compose" />
      </Frame>
      <Text size="sm" weight="semibold">Speed dial</Text>
      <Frame height={380}>
        <ScrollView><MailList count={8} /></ScrollView>
        <Fab actions={actions} accessibilityLabel="Create" testID="fab-dial" />
      </Frame>
      <Text size="sm" weight="semibold">Sizes and variants</Text>
      <Cluster gap="m">
        <Fab position="static" size="s" accessibilityLabel="Add, small" onPress={compose} />
        <Fab position="static" accessibilityLabel="Add" onPress={compose} />
        <Fab position="static" size="l" accessibilityLabel="Add, large" onPress={compose} />
        <Fab position="static" variant="soft" icon="★" accessibilityLabel="Favourite" onPress={compose} />
        <Fab position="static" variant="surface" icon="✎" label="Edit" onPress={compose} />
      </Cluster>
    </Stack>
  );
}

// ---------------------------------------------------------------- action sheet
function ActionSheetDemo() {
  const toast = useToast(), [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const actions = useMemo(() => [
    { label: "Save to Photos", onPress: () => toast.show("Saved", { tone: "ok" }), testID: "sheet-save" },
    { label: "Copy link", onPress: () => toast.show("Link copied") },
    { label: "Report a problem", disabled: true },
    { label: "Delete photo", destructive: true, onPress: () => toast.show("Photo deleted", { tone: "bad" }), testID: "sheet-delete" },
  ], [toast]);
  return (
    <Stack>
      <Button title="Photo options" variant="outline" onPress={() => setOpen(true)} testID="open-action-sheet" />
      <ActionSheet visible={open} onClose={close} title="Sunset at the pier" message="Taken on 4 March. Deleting it removes it from every device." actions={actions} testID="action-sheet" />
    </Stack>
  );
}

// ---------------------------------------------------------------- bottom sheet
const SNAPS = ["25%", "50%", "90%"];
const STOPS = ["Harbour Street", "Old Market", "City Library", "Station Square", "Riverside Park", "Museum Quarter", "North Gate", "University", "Botanic Garden", "Stadium", "Lakeside", "Airport"];
function BottomSheetDemo() {
  const theme = useTheme(), [inline, setInline] = useState(true), [modal, setModal] = useState(false), [snap, setSnap] = useState(1);
  const stops = useMemo(() => STOPS.map((stop, index) => <ListItem key={stop} title={stop} subtitle={`${index * 2 + 3} min`} trailing={`Line ${(index % 4) + 1}`} style={{ paddingHorizontal: 0 }} />), []);
  return (
    <Stack>
      <Frame testID="sheet-frame">
        <View style={{ flex: 1, padding: theme.space.m, gap: theme.space.s, backgroundColor: theme.colors.sunken }}>
          <Heading level={3}>Map</Heading>
          <Text tone="muted">The sheet rests at 25%, 50% and 90% of this frame. Drag the handle, flick it, or pull it below the lowest point to close it.</Text>
          <Text size="sm" testID="sheet-snap">Resting at point {inline ? snap + 1 : "–"} of 3</Text>
          <Button title={inline ? "Close sheet" : "Open sheet"} variant="outline" onPress={() => { setSnap(1); setInline((on) => !on); }} testID="toggle-sheet" />
        </View>
        <BottomSheet modal={false} backdrop visible={inline} onClose={() => setInline(false)} snapPoints={SNAPS} snap={snap} onSnapChange={setSnap} title="Nearby stops" testID="bottom-sheet">{stops}</BottomSheet>
      </Frame>
      <Button title="Open as a full-screen modal" variant="soft" onPress={() => setModal(true)} testID="open-modal-sheet" />
      <BottomSheet visible={modal} onClose={() => setModal(false)} snapPoints={SNAPS} defaultSnap={1} title="Nearby stops">{stops}</BottomSheet>
    </Stack>
  );
}

// ---------------------------------------------------------------- swipe row
const SwipeMail = memo(function SwipeMail({ item, read, onArchive, onDelete, onRead, onFlag }) {
  const right = useMemo(() => [
    { label: "Delete", icon: "×", destructive: true, closeOnPress: false, onPress: () => onDelete(item.id), testID: `delete-${item.id}` },
    { label: "Flag", icon: "⚑", tone: "warn", onPress: () => onFlag(item.id) },
  ], [item.id, onDelete, onFlag]);
  const left = useMemo(() => [{ label: read ? "Unread" : "Read", icon: "✓", tone: "accent", onPress: () => onRead(item.id) }, { label: "Archive", icon: "↓", tone: "ok", closeOnPress: false, onPress: () => onArchive(item.id) }], [item.id, read, onRead, onArchive]);
  return (
    <SwipeRow leftActions={left} rightActions={right} accessibilityLabel={`${item.name}. ${item.line}`} testID={`swipe-${item.id}`}>
      <ListItem title={item.name} subtitle={item.line} leading={<Avatar name={item.name} size={36} />} trailing={read ? undefined : <Badge tone="accent">New</Badge>} />
    </SwipeRow>
  );
});
function SwipeRowDemo() {
  const toast = useToast(), [rows, setRows] = useState(() => MAIL.slice(0, 6)), [read, setRead] = useState({});
  const remove = useCallback((id) => setRows((list) => list.filter((row) => row.id !== id)), []);
  const onDelete = useCallback((id) => { remove(id); toast.show("Deleted", { tone: "bad" }); }, [remove, toast]);
  const onArchive = useCallback((id) => { remove(id); toast.show("Archived", { tone: "ok" }); }, [remove, toast]);
  const onRead = useCallback((id) => setRead((map) => ({ ...map, [id]: !map[id] })), []);
  const onFlag = useCallback(() => toast.show("Flagged", { tone: "warn" }), [toast]);
  return (
    <Stack>
      <Card padded={false} gap={0} style={{ overflow: "hidden" }}>
        <SwipeGroup>
          {rows.map((item, index) => <View key={item.id}>{index ? <Divider /> : null}<SwipeMail item={item} read={!!read[item.id]} onDelete={onDelete} onArchive={onArchive} onRead={onRead} onFlag={onFlag} /></View>)}
        </SwipeGroup>
        {rows.length ? null : <View style={{ padding: 24 }}><Text tone="muted" align="center">All clear.</Text></View>}
      </Card>
      <Cluster><Text size="sm" tone="muted" testID="swipe-count">{rows.length} rows</Text><Button title="Reset" size="s" variant="ghost" onPress={() => { setRows(MAIL.slice(0, 6)); setRead({}); }} /></Cluster>
      <Text size="sm" tone="muted">Swipe left for Flag and Delete, right for Read and Archive. A long swipe runs the outer action. Opening one row closes the other.</Text>
    </Stack>
  );
}

// ---------------------------------------------------------------- pull to refresh
function PullToRefreshDemo() {
  const list = useRef(null), [items, setItems] = useState(() => MAIL.slice(0, 5)), [stamp, setStamp] = useState("never");
  const onRefresh = useCallback(() => new Promise((resolve) => setTimeout(() => {
    setItems((now) => [{ id: `n${now.length}`, name: PEOPLE[now.length % PEOPLE.length], line: "Just arrived." }, ...now]);
    setStamp(new Date().toLocaleTimeString()); resolve();
  }, 1200)), []);
  return (
    <Stack>
      <Frame height={340}>
        <PullToRefresh ref={list} onRefresh={onRefresh} testID="refresh-list">
          {items.map((item, index) => <View key={item.id}>{index ? <Divider /> : null}<MailRow item={item} /></View>)}
        </PullToRefresh>
      </Frame>
      <Cluster><Button title="Refresh from code" size="s" variant="outline" onPress={() => list.current?.refresh()} testID="refresh-now" /><Text size="sm" tone="muted" testID="refresh-stamp">Last refresh: {stamp}</Text></Cluster>
      <Text size="sm" tone="muted">{NATIVE ? "Pull the list down to refresh." : "Browsers have no pull gesture, so use the button here; on a phone, pull the list down."}</Text>
    </Stack>
  );
}

// ---------------------------------------------------------------- search bar
function SearchBarDemo() {
  const [query, setQuery] = useState(""), [submitted, setSubmitted] = useState("");
  const found = useMemo(() => PEOPLE.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase())), [query]);
  return (
    <Stack>
      <SearchBar placeholder="Search people" onChange={setQuery} onSubmit={setSubmitted} debounce={250} testID="search" />
      <Text size="sm" tone="muted" testID="search-status">{query ? `${found.length} match${found.length === 1 ? "" : "es"} for “${query}”` : "Type to filter. Results update 250 ms after you stop."}{submitted ? ` · submitted “${submitted}”` : ""}</Text>
      <Card padded={false} gap={0}>
        {found.slice(0, 5).map((name, index) => <View key={name}>{index ? <Divider /> : null}<ListItem title={name} leading={<Avatar name={name} size={32} />} /></View>)}
        {found.length ? null : <View style={{ padding: 24 }}><Text tone="muted" align="center">Nobody by that name.</Text></View>}
      </Card>
    </Stack>
  );
}

// ---------------------------------------------------------------- chips
const DIETS = [{ value: "veg", label: "Vegetarian" }, { value: "vegan", label: "Vegan" }, { value: "gf", label: "Gluten-free" }, { value: "halal", label: "Halal" }, { value: "kosher", label: "Kosher" }, { value: "nuts", label: "No nuts" }];
const SORTS = [{ value: "near", label: "Nearest" }, { value: "rated", label: "Top rated" }, { value: "cheap", label: "Cheapest" }, { value: "new", label: "Newest" }];
function ChipDemo() {
  const [diets, setDiets] = useState(["veg"]), [sort, setSort] = useState("near"), [to, setTo] = useState(() => PEOPLE.slice(0, 4).map((name) => ({ value: name, label: name })));
  const removeTo = useCallback((value) => setTo((list) => list.filter((entry) => entry.value !== value)), []);
  const [liked, setLiked] = useState(false);
  return (
    <Stack>
      <Text size="sm" weight="semibold">Filter: any number</Text>
      <ChipGroup multiple options={DIETS} value={diets} onChange={setDiets} testID="chips-filter" />
      <Text size="sm" weight="semibold">Choice: exactly one</Text>
      <ChipGroup options={SORTS} value={sort} onChange={setSort} tone="ok" />
      <Text size="sm" weight="semibold">Input: removable, wrapping</Text>
      <ChipGroup options={to} onRemove={removeTo} scroll={false} />
      <Text size="sm" weight="semibold">Single chips</Text>
      <Cluster><Chip label="Tag" /><Chip label="Small" size="s" /><Chip label={liked ? "Liked" : "Like"} icon="★" check={false} selected={liked} onPress={() => setLiked((on) => !on)} tone="warn" testID="chip-like" /><Chip label="Unavailable" disabled onPress={() => {}} /></Cluster>
      <Text size="sm" tone="muted">Showing {diets.length ? diets.join(", ") : "everything"}, sorted by {sort}; {to.length} recipients.</Text>
    </Stack>
  );
}

// ---------------------------------------------------------------- page dots
const PAGES = [["Track every order", "Live status from the kitchen to your door."], ["Pay your way", "Cards, wallets or cash on delivery."], ["Earn as you eat", "Every tenth order is on us."], ["Ready when you are", "Schedule up to a week ahead."]];
function PageDotsDemo() {
  const theme = useTheme(), [width, setWidth] = useState(0), [page, setPage] = useState(0), pager = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const position = useMemo(() => (width ? Animated.divide(scrollX, width) : undefined), [scrollX, width]);
  const onScroll = useMemo(() => Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: NATIVE }), [scrollX]);
  const go = useCallback((next) => { setPage(next); pager.current?.scrollTo({ x: next * width, animated: true }); }, [width]);
  return (
    <Stack>
      <Card padded={false} gap={0} style={{ overflow: "hidden" }}>
        <Animated.ScrollView ref={pager} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16} testID="pager"
          onLayout={(event) => setWidth(event.nativeEvent.layout.width)} onMomentumScrollEnd={(event) => width && setPage(Math.round(event.nativeEvent.contentOffset.x / width))}>
          {PAGES.map(([title, text]) => <View key={title} style={{ width: width || 320, padding: theme.space.l, gap: theme.space.xs, minHeight: 150, justifyContent: "center" }}><Heading level={3}>{title}</Heading><Text tone="muted">{text}</Text></View>)}
        </Animated.ScrollView>
        <PageDots count={PAGES.length} index={page} position={position} onChange={go} style={{ marginBottom: theme.space.xs }} testID="dots-linked" />
      </Card>
      <Text size="sm" tone="muted">Above, the dot follows the swipe finger exactly. Below, it springs to the index.</Text>
      <Cluster justify="center"><Button title="‹" variant="outline" size="s" accessibilityLabel="Previous" onPress={() => setPage((now) => Math.max(0, now - 1))} /><PageDots count={PAGES.length} index={page} tone="ok" size={10} testID="dots-index" /><Button title="›" variant="outline" size="s" accessibilityLabel="Next" onPress={() => setPage((now) => Math.min(PAGES.length - 1, now + 1))} testID="dots-next" /></Cluster>
    </Stack>
  );
}

// ---------------------------------------------------------------- banner
function BannerDemo() {
  const toast = useToast(), [offline, setOffline] = useState(true), [update, setUpdate] = useState(false), [tone, setTone] = useState("warn");
  const actions = useMemo(() => [{ label: "Retry", onPress: () => { setOffline(false); toast.show("Back online", { tone: "ok" }); }, testID: "banner-retry" }, { label: "Work offline", onPress: () => setOffline(false) }], [toast]);
  return (
    <Stack>
      <Frame height={380}>
        <Banner visible={offline} tone={tone} title="You are offline" actions={actions} onClose={() => setOffline(false)} testID="banner">Changes are saved on this phone and sent when you reconnect.</Banner>
        <View style={{ flex: 1 }}>
          <ScrollView><MailList count={8} /></ScrollView>
          <Banner floating visible={update} tone="ok" title="Update ready" onClose={() => setUpdate(false)}>Restart to finish installing version 4.2.</Banner>
        </View>
      </Frame>
      <Tabs value={tone} onChange={setTone} options={[{ value: "accent", label: "Accent" }, { value: "ok", label: "Ok" }, { value: "warn", label: "Warn" }, { value: "bad", label: "Bad" }]} />
      <Cluster>
        <Button title={offline ? "Hide inline banner" : "Show inline banner"} variant="outline" size="s" onPress={() => setOffline((on) => !on)} testID="toggle-banner" />
        <Button title={update ? "Hide floating banner" : "Show floating banner"} variant="outline" size="s" onPress={() => setUpdate((on) => !on)} />
      </Cluster>
    </Stack>
  );
}

export default [
  { id: "bottom-bar", title: "BottomBar", description: "The bottom tab bar: icons, labels, badges, a sliding selection indicator and an optional centre action.", Demo: BottomBarDemo },
  { id: "tab-screens", title: "TabScreens", description: "The screens behind a bottom bar: created on first visit, then kept alive so switching is instant.", Demo: TabScreensDemo },
  { id: "app-bar", title: "AppBar", description: "The top bar, with a large title that collapses as the list scrolls.", Demo: AppBarDemo },
  { id: "fab", title: "Fab", description: "A floating action button: three sizes, an extended form that collapses on scroll, and a speed dial.", Demo: FabDemo },
  { id: "action-sheet", title: "ActionSheet", description: "An iOS-style list of choices that rises from the bottom edge.", Demo: ActionSheetDemo },
  { id: "bottom-sheet", title: "BottomSheet", description: "A sheet that rests at snap points and follows the finger between them.", Demo: BottomSheetDemo },
  { id: "swipe-row", title: "SwipeRow", description: "A list row that slides sideways to reveal actions.", Demo: SwipeRowDemo },
  { id: "pull-to-refresh", title: "PullToRefresh", description: "A list with the platform pull-to-refresh spinner, driven by a promise.", Demo: PullToRefreshDemo },
  { id: "search-bar", title: "SearchBar", description: "A rounded search field with a clear button and a Cancel button that slides in.", Demo: SearchBarDemo },
  { id: "chip", title: "Chip and ChipGroup", description: "Filter, choice and input chips, alone or in a row that scrolls sideways.", Demo: ChipDemo },
  { id: "page-dots", title: "PageDots", description: "A page indicator whose active dot slides with the pages.", Demo: PageDotsDemo },
  { id: "banner", title: "Banner", description: "A notice across the top of a screen that slides in and out.", Demo: BannerDemo },
];

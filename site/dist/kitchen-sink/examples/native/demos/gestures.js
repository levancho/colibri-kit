// Demos for the optional gestures entry (@colibri-kit/native-full/gestures): finger-driven versions of the core
// components, built on react-native-reanimated and react-native-gesture-handler. Each entry: { id, title, description, Demo }.
// The app root must be wrapped in GestureHandlerRootView (examples/native/App.js does it); the demos do not add it again.
import { memo, useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import Animated, { useAnimatedRef, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useToast, useTheme, Stack, Cluster, Divider, Text, Heading, Button, Card, Badge, Avatar, ListItem, Switch, Tabs, TextField } from "@colibri-kit/native-full";
import { BottomSheet, Sheet, Drawer, SwipeRow, SwipeGroup, Sortable, Slider, Carousel, AnimatedList, PressableScale } from "@colibri-kit/native-full";

function Frame({ height = 560, children, testID }) {
  const theme = useTheme();
  return <View testID={testID} style={{ height, overflow: "hidden", borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.l, backgroundColor: theme.colors.bg }}>{children}</View>;
}

const PEOPLE = ["Maya Okafor", "Alex Rivera", "Sam Chen", "Priya Nair", "Jonas Weber", "Lucía Gómez", "Tariq Aziz", "Hana Sato"];
const LINES = ["Can you review the launch plan?", "Sent you the new mock-ups.", "Build is green again.", "Lunch on Thursday?", "The invoice went out this morning.", "Notes from the customer call."];
const MAIL = Array.from({ length: 6 }, (_, index) => ({ id: String(index + 1), name: PEOPLE[index], line: LINES[index] }));

// ---------------------------------------------------------------- bottom sheet
const SNAPS = ["25%", "50%", "90%"];
const STOPS = ["Harbour Street", "Old Market", "City Library", "Station Square", "Riverside Park", "Museum Quarter", "North Gate", "University", "Botanic Garden", "Stadium", "Lakeside", "Airport", "Castle Hill", "Fish Quay", "Mill Lane", "Observatory"];
function BottomSheetDemo() {
  const theme = useTheme(), [inline, setInline] = useState(true), [modal, setModal] = useState(false), [snap, setSnap] = useState(1);
  const stops = useMemo(() => STOPS.map((stop, index) => <ListItem key={stop} title={stop} subtitle={`${index * 2 + 3} min`} trailing={`Line ${(index % 4) + 1}`} style={{ paddingHorizontal: 0 }} />), []);
  // The pin sits just above the sheet: it reads the sheet's height from a shared value, on the UI thread.
  const sheetHeight = useSharedValue(0);
  const pin = useAnimatedStyle(() => ({ transform: [{ translateY: -sheetHeight.value }] }), [sheetHeight]);
  return (
    <Stack>
      <Frame testID="sheet-frame">
        <View style={{ flex: 1, padding: theme.space.m, gap: theme.space.s, backgroundColor: theme.colors.sunken }}>
          <Heading level={3}>Map</Heading>
          <Text tone="muted">The sheet rests at 25%, 50% and 90% of this frame. Drag the handle or the list, flick it, or pull it below the lowest point to close it. At the top the list scrolls; pull down from the top of the list to move the sheet again.</Text>
          <Text size="sm" testID="sheet-snap">Resting at point {inline ? snap + 1 : "–"} of 3</Text>
          <Button title={inline ? "Close sheet" : "Open sheet"} variant="outline" onPress={() => { setSnap(1); setInline((on) => !on); }} testID="toggle-sheet" />
        </View>
        <Animated.View style={[{ position: "absolute", right: theme.space.m, bottom: theme.space.s, pointerEvents: "none" }, pin]}><Badge tone="accent">You are here</Badge></Animated.View>
        <BottomSheet modal={false} backdrop visible={inline} onClose={() => setInline(false)} snapPoints={SNAPS} snap={snap} onSnapChange={setSnap} animatedHeight={sheetHeight} title="Nearby stops" testID="bottom-sheet">{stops}</BottomSheet>
      </Frame>
      <Button title="Open as a full-screen modal" variant="soft" onPress={() => setModal(true)} testID="open-modal-sheet" />
      <BottomSheet visible={modal} onClose={() => setModal(false)} snapPoints={SNAPS} defaultSnap={1} title="Find a stop" testID="modal-bottom-sheet">
        <TextField label="Search" placeholder="Street or stop name" hint="With the keyboard up the sheet opens fully and pads its content." />
        {stops}
      </BottomSheet>
    </Stack>
  );
}

// ---------------------------------------------------------------- sheet
function SheetDemo() {
  const toast = useToast(), [open, setOpen] = useState(false), [must, setMust] = useState(false);
  return (
    <Stack>
      <Cluster>
        <Button title="Share" onPress={() => setOpen(true)} testID="open-sheet" />
        <Button title="A decision" variant="outline" onPress={() => setMust(true)} testID="open-must-sheet" />
      </Cluster>
      <Text size="sm" tone="muted">Drag the sheet down, or tap outside it, to close. The second one closes only with its buttons.</Text>
      <Sheet visible={open} onClose={() => setOpen(false)} title="Share this trip" testID="sheet">
        <Text tone="muted">Anyone with the link can see the route and the photos.</Text>
        <Button title="Copy link" block onPress={() => { setOpen(false); toast.show("Link copied", { tone: "ok" }); }} testID="sheet-copy" />
        <Button title="Send by email" variant="outline" block onPress={() => setOpen(false)} />
      </Sheet>
      <Sheet visible={must} onClose={() => setMust(false)} dismissible={false} title="Leave without saving?" testID="must-sheet">
        <Text tone="muted">Your changes to the route will be lost.</Text>
        <Button title="Keep editing" block onPress={() => setMust(false)} testID="must-keep" />
        <Button title="Discard changes" variant="danger" block onPress={() => { setMust(false); toast.show("Changes discarded", { tone: "bad" }); }} />
      </Sheet>
    </Stack>
  );
}

// ---------------------------------------------------------------- drawer
const SIDES = [{ value: "left", label: "Left" }, { value: "right", label: "Right" }, { value: "top", label: "Top" }, { value: "bottom", label: "Bottom" }];
function DrawerDemo() {
  const [side, setSide] = useState("right"), [open, setOpen] = useState(false), [alerts, setAlerts] = useState(true), [digest, setDigest] = useState(false);
  return (
    <Stack>
      <Tabs value={side} onChange={setSide} options={SIDES} />
      <Button title="Open settings" onPress={() => setOpen(true)} testID="open-drawer" />
      <Text size="sm" tone="muted">Swipe the drawer back towards the edge it came from. Left and right drawers can be swiped anywhere; top and bottom ones by their header.</Text>
      <Drawer visible={open} onClose={() => setOpen(false)} side={side} title="Notifications"
        footer={<><Button title="Cancel" variant="ghost" onPress={() => setOpen(false)} /><Button title="Save" onPress={() => setOpen(false)} testID="drawer-save" /></>}>
        <Switch label="Trip alerts" value={alerts} onValueChange={setAlerts} />
        <Switch label="Weekly digest" value={digest} onValueChange={setDigest} />
        <Text tone="muted">Alerts arrive when a stop on a saved route is closed or a line is delayed by more than ten minutes.</Text>
        {LINES.map((line) => <Text key={line} size="sm" tone="muted">{line}</Text>)}
      </Drawer>
    </Stack>
  );
}

// ---------------------------------------------------------------- swipe row
const SwipeMail = memo(function SwipeMail({ item, read, onArchive, onDelete, onRead, onFlag }) {
  const right = useMemo(() => [
    { label: "Delete", icon: "×", destructive: true, closeOnPress: false, onPress: () => onDelete(item.id), testID: `delete-${item.id}` },
    { label: "Flag", icon: "⚑", tone: "warn", onPress: () => onFlag(item.id), testID: `flag-${item.id}` },
  ], [item.id, onDelete, onFlag]);
  const left = useMemo(() => [{ label: read ? "Unread" : "Read", icon: "✓", tone: "accent", onPress: () => onRead(item.id) }, { label: "Archive", icon: "↓", tone: "ok", closeOnPress: false, onPress: () => onArchive(item.id) }], [item.id, read, onRead, onArchive]);
  return (
    <SwipeRow leftActions={left} rightActions={right} accessibilityLabel={`${item.name}. ${item.line}`} testID={`swipe-${item.id}`}>
      <ListItem title={item.name} subtitle={item.line} leading={<Avatar name={item.name} size={36} />} trailing={read ? undefined : <Badge tone="accent">New</Badge>} />
    </SwipeRow>
  );
});
function SwipeRowDemo() {
  const toast = useToast(), [rows, setRows] = useState(MAIL), [read, setRead] = useState({});
  const remove = useCallback((id) => setRows((list) => list.filter((row) => row.id !== id)), []);
  const onDelete = useCallback((id) => { remove(id); toast.show("Deleted", { tone: "bad" }); }, [remove, toast]);
  const onArchive = useCallback((id) => { remove(id); toast.show("Archived", { tone: "ok" }); }, [remove, toast]);
  const onRead = useCallback((id) => setRead((map) => ({ ...map, [id]: !map[id] })), []);
  const onFlag = useCallback(() => toast.show("Flagged", { tone: "warn" }), [toast]);
  const renderItem = useCallback(({ item, index }) => <View>{index ? <Divider /> : null}<SwipeMail item={item} read={!!read[item.id]} onDelete={onDelete} onArchive={onArchive} onRead={onRead} onFlag={onFlag} /></View>, [read, onDelete, onArchive, onRead, onFlag]);
  return (
    <Stack>
      <Card padded={false} gap={0} style={{ overflow: "hidden" }}>
        <SwipeGroup>
          <AnimatedList data={rows} gap={0} renderItem={renderItem} accessibilityLabel="Inbox" />
        </SwipeGroup>
        {rows.length ? null : <View style={{ padding: 24 }}><Text tone="muted" align="center">All clear.</Text></View>}
      </Card>
      <Cluster><Text size="sm" tone="muted" testID="swipe-count">{rows.length} rows</Text><Button title="Reset" size="s" variant="ghost" onPress={() => { setRows(MAIL); setRead({}); }} testID="swipe-reset" /></Cluster>
      <Text size="sm" tone="muted">Swipe left for Flag and Delete, right for Read and Archive. Pull a row more than half way and the outer action follows your finger: let go to run it. Opening one row closes the other, and the rows below a deleted one glide up.</Text>
    </Stack>
  );
}

// ---------------------------------------------------------------- sortable
const TASKS = [
  { id: "brief", title: "Write the launch brief", detail: "Due Monday" },
  { id: "shots", title: "Take product screenshots", detail: "Six screens, light and dark" },
  { id: "price", title: "Agree the price list", detail: "With finance" },
  { id: "mail", title: "Draft the announcement email", detail: "Two versions" },
  { id: "qa", title: "Test on a small phone", detail: "And a tablet" },
];
const STAGES = Array.from({ length: 14 }, (_, index) => `Stage ${index + 1}`);
function SortableDemo() {
  const theme = useTheme(), [tasks, setTasks] = useState(TASKS), [stages, setStages] = useState(STAGES), scroller = useAnimatedRef();
  return (
    <Stack gap="m">
      <Stack gap="xs">
        <Text size="sm" weight="semibold">This week's priorities</Text>
        <Sortable label="This week's priorities" value={tasks} onChange={setTasks} getLabel={(task) => task.title} testID="tasks" renderItem={({ item, index }) => (
          <View><Text weight="medium" numberOfLines={1}>{index + 1}. {item.title}</Text><Text size="sm" tone="muted" numberOfLines={1}>{item.detail}</Text></View>
        )} />
        <Text size="sm" tone="muted" testID="task-order">{tasks.map((task) => task.id).join(", ")}</Text>
        <Text size="sm" tone="muted">Drag a row by its grip, or press and hold anywhere on it. The other rows move out of the way.</Text>
      </Stack>
      <Stack gap="xs">
        <Text size="sm" weight="semibold">A longer list in its own scroll view</Text>
        <Animated.ScrollView ref={scroller} testID="stage-scroll" style={{ height: 260, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.l }} contentContainerStyle={{ padding: theme.space.xs }}>
          <Sortable label="Stages" value={stages} onChange={setStages} handle="start" dragOn="handle" scrollRef={scroller} testID="stages" />
        </Animated.ScrollView>
        <Text size="sm" tone="muted" testID="stage-order">{stages.slice(0, 4).join(", ")} …</Text>
        <Text size="sm" tone="muted">Hold a row near the top or bottom edge and the list scrolls by itself.</Text>
      </Stack>
    </Stack>
  );
}

// ---------------------------------------------------------------- slider
function SliderDemo() {
  const [volume, setVolume] = useState(40), [saved, setSaved] = useState(40), [price, setPrice] = useState([200, 650]), [speed, setSpeed] = useState(1);
  return (
    <Stack gap="m">
      <Stack gap="2xs">
        <Cluster justify="space-between"><Text size="sm" weight="semibold">Volume</Text><Text size="sm" tone="muted" testID="volume-value">{volume}% (saved {saved}%)</Text></Cluster>
        <Slider label="Volume" value={volume} onChange={setVolume} onChangeEnd={setSaved} formatValue={(v) => `${v}%`} testID="volume" />
      </Stack>
      <Stack gap="2xs">
        <Cluster justify="space-between"><Text size="sm" weight="semibold">Price</Text><Text size="sm" tone="muted" testID="price-value">${price[0]} – ${price[1]}</Text></Cluster>
        <Slider label="Price" thumbLabels={["Lowest price", "Highest price"]} min={0} max={1000} step={50} value={price} onChange={setPrice} formatValue={(v) => `$${v}`} testID="price" />
      </Stack>
      <Stack gap="2xs">
        <Cluster justify="space-between"><Text size="sm" weight="semibold">Playback speed</Text><Text size="sm" tone="muted" testID="speed-value">{speed}×</Text></Cluster>
        <Slider label="Playback speed" min={0.5} max={2} step={0.1} value={speed} onChange={setSpeed} tone="ok" formatValue={(v) => `${v}×`} testID="speed" />
      </Stack>
      <Stack gap="2xs">
        <Text size="sm" weight="semibold">Storage quota (locked)</Text>
        <Slider label="Storage quota" defaultValue={65} tone="warn" disabled />
      </Stack>
      <Text size="sm" tone="muted">Drag a thumb or tap the track. A drag that starts up or down scrolls the page instead.</Text>
    </Stack>
  );
}

// ---------------------------------------------------------------- carousel
const SLIDES = [
  { tag: "Featured", title: "Hiking in Kazbegi", text: "Four trails above the clouds, from an easy morning walk to a full day on the glacier.", tone: "accent" },
  { tag: "Food", title: "Kutaisi food guide", text: "Where to find the best khachapuri, and what to order with it.", tone: "ok" },
  { tag: "Culture", title: "Svaneti towers", text: "A thousand years of stone watchtowers in the high Caucasus.", tone: "warn" },
  { tag: "Wine", title: "Wine roads of Kakheti", text: "Small family cellars that still make wine in clay qvevri.", tone: "bad" },
];
const Slide = ({ slide }) => {
  const theme = useTheme(), tone = theme.tones[slide.tone];
  return (
    <View style={{ minHeight: 190, padding: theme.space.l, justifyContent: "flex-end", gap: theme.space["2xs"], backgroundColor: tone.tint }}>
      <Badge tone={slide.tone}>{slide.tag}</Badge>
      <Heading level={3}>{slide.title}</Heading>
      <Text size="sm" tone="muted">{slide.text}</Text>
    </View>
  );
};
function CarouselDemo() {
  const [index, setIndex] = useState(0), [auto, setAuto] = useState(false), [depth, setDepth] = useState(true);
  return (
    <Stack>
      <Carousel index={index} onChange={setIndex} loop autoplay={auto ? 3000 : 0} parallax={depth ? 0.35 : 0} accessibilityLabel="Featured articles" testID="carousel">
        {SLIDES.map((slide) => <Slide key={slide.title} slide={slide} />)}
      </Carousel>
      <Text size="sm" tone="muted" testID="carousel-index">Slide {index + 1} of {SLIDES.length}: {SLIDES[index].title}</Text>
      <Switch label="Parallax" value={depth} onValueChange={setDepth} />
      <Switch label="Play automatically" value={auto} onValueChange={setAuto} />
    </Stack>
  );
}

// ---------------------------------------------------------------- application board
// ---------------------------------------------------------------- animated list
const GUESTS = ["Maya Okafor", "Alex Rivera", "Sam Chen", "Priya Nair", "Jonas Weber", "Lucía Gómez", "Tariq Aziz", "Hana Sato", "Owen Clarke", "Zofia Nowak"];
function AnimatedListDemo() {
  const theme = useTheme(), [guests, setGuests] = useState(() => GUESTS.slice(0, 4)), [next, setNext] = useState(4);
  const add = () => { setGuests((list) => [GUESTS[next % GUESTS.length] + (next >= GUESTS.length ? ` ${Math.floor(next / GUESTS.length) + 1}` : ""), ...list]); setNext(next + 1); };
  const remove = useCallback((name) => setGuests((list) => list.filter((each) => each !== name)), []);
  const renderItem = useCallback(({ item }) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: theme.space.s, paddingVertical: theme.space.xs, paddingHorizontal: theme.space.s, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.m, backgroundColor: theme.colors.surface }}>
      <Avatar name={item} size={32} />
      <Text weight="medium" numberOfLines={1} style={{ flex: 1 }}>{item}</Text>
      <Button title="Remove" size="s" variant="ghost" onPress={() => remove(item)} accessibilityLabel={`Remove ${item}`} />
    </View>
  ), [theme, remove]);
  return (
    <Stack>
      <Cluster>
        <Button title="Add a guest" size="s" onPress={add} testID="list-add" />
        <Button title="Shuffle" size="s" variant="outline" onPress={() => setGuests((list) => [...list].sort(() => Math.random() - 0.5))} testID="list-shuffle" />
        <Button title="Sort A–Z" size="s" variant="outline" onPress={() => setGuests((list) => [...list].sort((a, b) => a.localeCompare(b)))} testID="list-sort" />
      </Cluster>
      <AnimatedList data={guests} renderItem={renderItem} accessibilityLabel="Guest list" testID="guest-list" />
      <Text size="sm" tone="muted" testID="list-count">{guests.length} guests</Text>
    </Stack>
  );
}

// ---------------------------------------------------------------- pressable scale
function PressableScaleDemo() {
  const theme = useTheme(), [likes, setLikes] = useState(12), [picked, setPicked] = useState("Kazbegi");
  const tile = { flex: 1, minWidth: 130, padding: theme.space.m, gap: theme.space["2xs"], borderWidth: 1, borderRadius: theme.radius.l, backgroundColor: theme.colors.surface };
  return (
    <Stack>
      <Cluster gap="s" align="stretch">
        {["Kazbegi", "Svaneti", "Kakheti"].map((place) => (
          <PressableScale key={place} onPress={() => setPicked(place)} accessibilityLabel={`Choose ${place}`} accessibilityState={{ selected: picked === place }} testID={`place-${place}`}
            style={[tile, { borderColor: picked === place ? theme.colors.accent : theme.colors.line }]}>
            <Text weight="semibold">{place}</Text>
            <Text size="sm" tone="muted">{picked === place ? "Chosen" : "Tap to choose"}</Text>
          </PressableScale>
        ))}
      </Cluster>
      <Cluster>
        <PressableScale scale={0.88} onPress={() => setLikes(likes + 1)} accessibilityLabel="Like" testID="like"
          style={{ minHeight: theme.touch, paddingHorizontal: theme.space.m, flexDirection: "row", alignItems: "center", gap: theme.space.xs, borderRadius: theme.radius.full, backgroundColor: theme.colors.accentSoft }}>
          <Text weight="bold" tone="accent">♥</Text><Text weight="semibold" tone="accent" testID="like-count">{likes}</Text>
        </PressableScale>
        <PressableScale disabled accessibilityLabel="Share (not available)"
          style={{ minHeight: theme.touch, paddingHorizontal: theme.space.m, justifyContent: "center", borderRadius: theme.radius.full, borderWidth: 1, borderColor: theme.colors.line }}>
          <Text weight="semibold" tone="muted">Share</Text>
        </PressableScale>
      </Cluster>
      <Text size="sm" tone="muted">The tile shrinks the moment it is touched and springs back when let go.</Text>
    </Stack>
  );
}

export default [
  { id: "gesture-bottom-sheet", title: "BottomSheet", description: "A sheet that follows the finger between snap points, hands over to its scrolling list at the top, and fades the backdrop with its position.", Demo: BottomSheetDemo },
  { id: "gesture-sheet", title: "Sheet", description: "A panel from the bottom edge that you can also drag down to close.", Demo: SheetDemo },
  { id: "gesture-drawer", title: "Drawer", description: "A panel from any edge that you swipe back the way it came.", Demo: DrawerDemo },
  { id: "gesture-swipe-row", title: "SwipeRow", description: "A list row that follows the finger to reveal actions, with a long swipe that runs the outer one.", Demo: SwipeRowDemo },
  { id: "gesture-sortable", title: "Sortable", description: "Drag a row to reorder; its neighbours slide out of the way and the list scrolls near its edges.", Demo: SortableDemo },
  { id: "gesture-slider", title: "Slider", description: "A single or range slider whose thumb tracks the finger without re-rendering.", Demo: SliderDemo },
  { id: "gesture-carousel", title: "Carousel", description: "A pager whose marker and parallax follow the scroll position.", Demo: CarouselDemo },
  { id: "gesture-animated-list", title: "AnimatedList", description: "A list whose rows fade in, fade out and glide to new places when the data changes.", Demo: AnimatedListDemo },
  { id: "gesture-pressable-scale", title: "PressableScale", description: "Press feedback that starts on the UI thread: the target shrinks under the finger.", Demo: PressableScaleDemo },
];

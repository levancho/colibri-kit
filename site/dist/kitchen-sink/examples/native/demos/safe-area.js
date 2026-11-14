// Demos for the optional safe-area entry. Each entry: { id, title, description, Demo }.
//
// A browser has no notch, so the real insets are zero here. To show the wiring at work, the phone frames below put
// the library's own SafeAreaInsetsContext around their content with the insets of a real device: the Safe*
// components read them exactly as they read the ones a phone reports. (A nested SafeAreaProvider with
// initialMetrics would not do: on the web it measures the browser straight away and goes back to zero.)
import { useMemo, useState } from "react";
import { Platform, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { useToast, useTheme, Stack, Cluster, Divider, Text, Heading, Button, Card, Badge, ListItem, Tabs, AppBarAction } from "@colibri-kit/native-full";
import { SafeAreaRoot, SafeScreen, SafeAppBar, SafeBottomBar, SafeFab, SafeActionSheet, SafeBottomSheet, SafeBanner, useInsets } from "@colibri-kit/native-full";

const DEVICES = {
  notch: { label: "iPhone", insets: { top: 47, bottom: 34, left: 0, right: 0 } },
  android: { label: "Android", insets: { top: 24, bottom: 16, left: 0, right: 0 } },
  none: { label: "No insets", insets: { top: 0, bottom: 0, left: 0, right: 0 } },
};
const DEVICE_TABS = Object.entries(DEVICES).map(([value, device]) => ({ value, label: device.label }));
const reading = (insets) => `top ${insets.top} · bottom ${insets.bottom} · left ${insets.left} · right ${insets.right}`;

/** A phone-sized box whose content sees `insets` as its safe area, with the hardware drawn on top. */
function Phone({ insets, height = 520, children, testID }) {
  const theme = useTheme();
  return (
    <View testID={testID} style={{ height, overflow: "hidden", borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.l, backgroundColor: theme.colors.bg }}>
      <SafeAreaInsetsContext.Provider value={insets}>{children}</SafeAreaInsetsContext.Provider>
      {insets.top > 30 ? <View pointerEvents="none" style={{ position: "absolute", zIndex: 20, top: 10, alignSelf: "center", width: 110, height: insets.top - 18, borderRadius: 20, backgroundColor: "#000000" }} /> : null}
      {insets.top > 0 && insets.top <= 30 ? <View pointerEvents="none" style={{ position: "absolute", zIndex: 20, top: (insets.top - 10) / 2, alignSelf: "center", width: 10, height: 10, borderRadius: 5, backgroundColor: "#000000" }} /> : null}
      {insets.bottom > 0 ? <View pointerEvents="none" style={{ position: "absolute", zIndex: 20, bottom: Math.max(4, insets.bottom / 2 - 8), alignSelf: "center", width: insets.bottom > 20 ? 134 : 96, height: insets.bottom > 20 ? 5 : 4, borderRadius: 3, backgroundColor: theme.colors.fg, opacity: 0.85 }} /> : null}
    </View>
  );
}

function DevicePicker({ value, onChange }) {
  return (
    <Stack gap="2xs">
      <Tabs value={value} onChange={onChange} options={DEVICE_TABS} />
      <Text size="xs" tone="muted">Simulated insets: {reading(DEVICES[value].insets)}</Text>
    </Stack>
  );
}

const TABS = [
  { value: "home", label: "Home", icon: "⌂", testID: "safe-tab-home" },
  { value: "search", label: "Search", icon: "search", testID: "safe-tab-search" },
  { value: "inbox", label: "Inbox", icon: "✉", badge: 3, testID: "safe-tab-inbox" },
  { value: "you", label: "You", icon: "☺", testID: "safe-tab-you" },
];
const NOTES = ["Launch plan", "Mock-ups for the pricing page", "Build notes", "Customer call, Thursday", "Invoice follow-up", "Ideas for the spring release", "Reading list"];

function InsetReadout() {
  const insets = useInsets();
  return <Text size="sm" testID="safe-readout">useInsets(): {reading(insets)}</Text>;
}

function BarsDemo() {
  const toast = useToast(), [device, setDevice] = useState("notch"), [tab, setTab] = useState("home");
  const actions = useMemo(() => <AppBarAction icon="search" label="Search" onPress={() => toast.show("Search")} />, [toast]);
  return (
    <Stack>
      <DevicePicker value={device} onChange={setDevice} />
      <Phone insets={DEVICES[device].insets} testID="safe-bars-phone">
        <SafeAppBar title="Notes" subtitle={`${NOTES.length} notes`} trailing={actions} testID="safe-app-bar" />
        <SafeScreen scroll edges={["left", "right"]} gap="s">
          <Card gap="2xs">
            <Text size="sm" weight="semibold">What the components read</Text>
            <InsetReadout />
          </Card>
          <Card padded={false} gap={0}>
            {NOTES.map((note, index) => <View key={note}>{index ? <Divider /> : null}<ListItem title={note} subtitle="Edited this week" /></View>)}
          </Card>
        </SafeScreen>
        <SafeBottomBar items={TABS} value={tab} onChange={setTab} testID="safe-bottom-bar" />
      </Phone>
      <Text size="sm" tone="muted">The app bar grows by the top inset and the tab bar by the bottom inset; SafeScreen takes edges={"{"}["left", "right"]{"}"} because the bars cover the other two.</Text>
    </Stack>
  );
}

function ScreenDemo() {
  const toast = useToast(), [device, setDevice] = useState("notch"), [edges, setEdges] = useState("all"), [banner, setBanner] = useState(false);
  return (
    <Stack>
      <DevicePicker value={device} onChange={setDevice} />
      <Tabs value={edges} onChange={setEdges} options={[{ value: "all", label: "All edges" }, { value: "top", label: "Top only" }, { value: "none", label: "No edges" }]} />
      <Phone insets={DEVICES[device].insets} height={460} testID="safe-screen-phone">
        <SafeScreen scroll edges={edges === "all" ? undefined : edges === "top" ? ["top"] : []} testID="safe-screen">
          <Heading level={2}>Today</Heading>
          <Text tone="muted">A screen without bars: SafeScreen itself keeps the heading out of the notch and the last row clear of the home indicator.</Text>
          <Button title={banner ? "Hide the banner" : "Show a floating banner"} variant="outline" onPress={() => setBanner((on) => !on)} />
          <Card padded={false} gap={0}>
            {NOTES.map((note, index) => <View key={note}>{index ? <Divider /> : null}<ListItem title={note} subtitle="Edited this week" /></View>)}
          </Card>
        </SafeScreen>
        <SafeBanner floating visible={banner} tone="ok" title="Synced" onClose={() => setBanner(false)} testID="safe-banner">A floating SafeBanner starts below the status bar.</SafeBanner>
        <SafeFab icon="plus" label="New note" onPress={() => toast.show("New note")} testID="safe-fab" />
      </Phone>
      <Text size="sm" tone="muted">The button floats above the home indicator. Switch the edges off to see what the insets were protecting.</Text>
    </Stack>
  );
}

function SheetsDemo() {
  const toast = useToast(), [device, setDevice] = useState("notch"), [actions, setActions] = useState(false), [sheet, setSheet] = useState(false);
  const choices = useMemo(() => [{ label: "Share", onPress: () => toast.show("Share") }, { label: "Duplicate", onPress: () => toast.show("Duplicate") }, { label: "Delete", destructive: true, onPress: () => toast.show("Deleted") }], [toast]);
  return (
    <Stack>
      <DevicePicker value={device} onChange={setDevice} />
      <SafeAreaInsetsContext.Provider value={DEVICES[device].insets}>
        <Card>
          <Text size="sm">Sheets open over the whole window, so here they rise from the bottom of the browser; the space under their last row is the simulated bottom inset.</Text>
          <Cluster>
            <Button title="Open action sheet" onPress={() => setActions(true)} testID="safe-open-actions" />
            <Button title="Open bottom sheet" variant="outline" onPress={() => setSheet(true)} testID="safe-open-sheet" />
          </Cluster>
        </Card>
        <SafeActionSheet visible={actions} onClose={() => setActions(false)} title="Launch plan" actions={choices} testID="safe-action-sheet" />
        <SafeBottomSheet visible={sheet} onClose={() => setSheet(false)} snapPoints={["45%"]} title="Move to folder" testID="safe-bottom-sheet">
          {["Work", "Personal", "Archive"].map((folder, index) => <View key={folder}>{index ? <Divider /> : null}<ListItem title={folder} onPress={() => { setSheet(false); toast.show(`Moved to ${folder}`); }} /></View>)}
        </SafeBottomSheet>
      </SafeAreaInsetsContext.Provider>
    </Stack>
  );
}

function RootDemo() {
  const theme = useTheme();
  return (
    <Stack gap="m">
      <Card>
        <Cluster justify="space-between">
          <Text size="sm" weight="semibold">The real insets of this device</Text>
          <Badge tone={Platform.OS === "web" ? undefined : "ok"}>{Platform.OS}</Badge>
        </Cluster>
        <InsetReadout />
        <Text size="sm" tone="muted">{Platform.OS === "web" ? "A desktop browser has no notch or home indicator, so every inset is 0. On a phone this line shows the status bar and home indicator heights and follows rotation." : "Rotate the phone: the numbers follow."}</Text>
      </Card>
      <Card>
        <Text size="sm" weight="semibold">SafeAreaRoot inside a view</Text>
        <View style={{ height: 96, borderRadius: theme.radius.m, overflow: "hidden", borderWidth: 1, borderColor: theme.colors.line }}>
          <SafeAreaRoot>
            <SafeScreen gap="2xs" testID="safe-root-screen">
              <Text size="sm">This SafeScreen reads from its own SafeAreaRoot.</Text>
              <InsetReadout />
            </SafeScreen>
          </SafeAreaRoot>
        </View>
        <Text size="sm" tone="muted">SafeAreaRoot is SafeAreaProvider with the launch insets as its starting value. One around the app is enough; this catalog already has one.</Text>
      </Card>
    </Stack>
  );
}

export default [
  { id: "safe-bars", title: "SafeAppBar and SafeBottomBar", description: "The app bar and tab bar padded by the real insets. A browser reports none, so the frame simulates a phone's; on a device the same code reads the notch and home indicator.", Demo: BarsDemo },
  { id: "safe-screen", title: "SafeScreen, SafeFab and SafeBanner", description: "A screen that pads the edges you choose, with a floating button and banner that stay clear of the system areas. Insets are simulated in the browser; a device supplies its own.", Demo: ScreenDemo },
  { id: "safe-sheets", title: "SafeActionSheet and SafeBottomSheet", description: "Sheets whose last row stays above the home indicator. The bottom inset is simulated here; on a phone it is the height of the home indicator area.", Demo: SheetsDemo },
  { id: "safe-root", title: "SafeAreaRoot and useInsets", description: "The provider to put around the app, and the hook that returns the insets. In a desktop browser they are all zero; a phone reports its status bar, notch and home indicator.", Demo: RootDemo },
];

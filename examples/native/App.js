// Colibri for React Native: the component catalog.
// Runs in Expo (see README.md) and, through react-native-web, on https://colibri-kit.io/native/
// Home lists every demo by group; a demo screen shows one component in use. A demo entry is
// { id, title, description, Demo, fullscreen? }.
import { useEffect, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { ColibriProvider, ToastProvider, useTheme, Screen, Stack, Cluster, Divider, Text, Heading, Card, Badge, Tabs, ListItem, Button } from "@colibri-kit/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GROUPS, DEMOS, LIBRARIES } from "./demos/index.js";

const HUES = [255, 285, 330, 20, 75, 150, 190];
const web = Platform.OS === "web";
// On the web the open demo lives in the address (#button), so the site can link to one and the back button works.
const readHash = () => (web ? decodeURIComponent(globalThis.location?.hash.slice(1) ?? "") : "");
if (web) globalThis.ColibriNativeCatalog = GROUPS.map((group) => ({ id: group.id, title: group.title, description: group.description, requires: group.requires.map((name) => ({ name, label: LIBRARIES[name] })), demos: group.demos.map(({ id, title, description }) => ({ id, title, description })) }));

function Swatch({ hue, selected, onPress }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Hue ${hue}`} aria-pressed={selected}
      style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 3, borderColor: selected ? theme.colors.fg : theme.colors.surface, backgroundColor: `hsl(${(hue + 330) % 360} 70% 50%)` }} />
  );
}

function Home({ open, look }) {
  const count = Object.keys(DEMOS).length;
  return (
    <Screen scroll gap="l" testID="home">
      <Stack gap="xs">
        <Badge tone="accent">@colibri-kit/native</Badge>
        <Heading level={1}>Colibri for React Native</Heading>
        <Text tone="muted">{count} components and screens, themed from one hue.</Text>
      </Stack>
      <Card>
        <Text size="sm" weight="semibold">Accent colour</Text>
        <Cluster gap="xs">{HUES.map((value) => <Swatch key={value} hue={value} selected={value === look.hue} onPress={() => look.setHue(value)} />)}</Cluster>
        <Text size="sm" weight="semibold">Appearance</Text>
        <Tabs value={look.scheme} onChange={look.setScheme} options={[{ value: "auto", label: "Auto" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} />
        <Text size="sm" weight="semibold">Corners</Text>
        <Tabs value={look.radius} onChange={look.setRadius} options={[{ value: "sharp", label: "Sharp" }, { value: "soft", label: "Soft" }, { value: "round", label: "Round" }]} />
      </Card>
      {GROUPS.map((group) => (
        <Stack key={group.id} gap="xs">
          <Text size="xs" weight="bold" tone="muted" style={{ letterSpacing: 1, textTransform: "uppercase" }}>{group.title}</Text>
          <Card padded={false} gap={0}>
            {group.demos.map((demo, index) => (
              <View key={demo.id}>
                {index ? <Divider /> : null}
                <ListItem title={demo.title} subtitle={demo.description} trailing={group.requires.length ? <Badge tone="accent">Full</Badge> : "›"} onPress={() => open(demo.id)} />
              </View>
            ))}
          </Card>
        </Stack>
      ))}
    </Screen>
  );
}

function DemoScreen({ demo, back }) {
  const theme = useTheme(), Demo = demo.Demo;
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }} testID={`demo-${demo.id}`}>
      <Cluster wrap={false} gap="xs" style={{ paddingHorizontal: theme.space.xs, paddingVertical: theme.space["2xs"], borderBottomWidth: 1, borderBottomColor: theme.colors.line, backgroundColor: theme.colors.surface }}>
        <Button title="‹ All" variant="ghost" size="s" onPress={back} accessibilityLabel="Back to all components" testID="back" />
        <Text weight="semibold" numberOfLines={1} style={{ flex: 1 }}>{demo.title}</Text>
        <Badge>{demo.group}</Badge>
      </Cluster>
      {/* A demo marked fullscreen is a whole screen (an app frame, a navigation layout): it gets the rest of the phone
          to itself, with no page padding or outer scrolling, as it would in a real app. */}
      {demo.fullscreen ? <View style={{ flex: 1 }}><Demo /></View> : (
        <Screen scroll gap="m">
          <Text tone="muted">{demo.description}</Text>
          <Demo />
        </Screen>
      )}
    </View>
  );
}

export default function App() {
  const [hue, setHue] = useState(255), [scheme, setScheme] = useState("auto"), [radius, setRadius] = useState("soft");
  const [route, setRoute] = useState(readHash);
  useEffect(() => {
    if (!web) return undefined;
    const sync = () => setRoute(readHash());
    globalThis.addEventListener("hashchange", sync);
    return () => globalThis.removeEventListener("hashchange", sync);
  }, []);
  const open = (id) => { if (web) globalThis.location.hash = id; else setRoute(id); };
  const demo = DEMOS[route];
  return (
    // The two wrappers are only needed for the optional entries (gestures, safe areas).
    <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider>
    <ColibriProvider hue={hue} scheme={scheme} radius={radius}>
      <ToastProvider>
        {demo ? <DemoScreen key={demo.id} demo={demo} back={() => open("")} /> : <Home open={open} look={{ hue, setHue, scheme, setScheme, radius, setRadius }} />}
      </ToastProvider>
    </ColibriProvider>
    </SafeAreaProvider></GestureHandlerRootView>
  );
}

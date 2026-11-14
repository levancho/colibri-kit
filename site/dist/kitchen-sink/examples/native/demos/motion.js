// Demos for motion and theming: entrances, presence, press feedback, loops, one-shot animations, and theme tokens.
import { useState } from "react";
import { Animated, View } from "react-native";
import {
  useToast, useTheme, Stack, Cluster, Divider, Text, Heading, Button, Card, Badge, Callout, Avatar, TextField, Switch, Progress, Tabs, ListItem, Dialog, Sheet,
  Enter, Presence, MotionPressable, MotionLoop, useMotion, Collapse, ThemeScope, useReducedMotion, ENTER_MOTIONS, PLAY_MOTIONS,
} from "@colibri-kit/native-core";

const INBOX = [
  { name: "Maya Okafor", note: "Can you review the onboarding copy?" },
  { name: "Alex Rivera", note: "The new icons are in the shared folder." },
  { name: "Sam Chen", note: "Build 418 is ready for testing." },
  { name: "Priya Nair", note: "Lunch on Thursday?" },
];

function ReducedNote() {
  const reduced = useReducedMotion();
  return reduced ? <Callout tone="warn" title="Reduced motion is on">Your device asks for less motion, so everything here jumps straight to its end state.</Callout> : null;
}

// A tile that says its own name, used as the thing being animated.
function Tile({ children, style }) {
  const theme = useTheme();
  return (
    <View style={[{ minWidth: 96, minHeight: 56, paddingHorizontal: theme.space.s, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.m, backgroundColor: theme.colors.accentSoft }, style]}>
      <Text size="sm" weight="semibold" tone="accent">{children}</Text>
    </View>
  );
}

function Dot({ size = 14, ring = false }) {
  const theme = useTheme();
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: ring ? "transparent" : theme.colors.accent, borderWidth: ring ? 3 : 0, borderColor: theme.colors.accent, borderTopColor: ring ? theme.colors.accentSoft : theme.colors.accent }} />;
}

function PanePreview({ label }) {
  const [on, setOn] = useState(true), [size, setSize] = useState("m");
  return (
    <Stack gap="s">
      <Text size="xs" tone="muted" weight="semibold">{label}</Text>
      <Cluster><Button title="Save" /><Button title="Cancel" variant="outline" /><Badge tone="accent">New</Badge></Cluster>
      <Switch label="Sync over mobile data" value={on} onValueChange={setOn} />
      <Progress value={0.6} />
      <Tabs value={size} onChange={setSize} options={[{ value: "s", label: "S" }, { value: "m", label: "M" }, { value: "l", label: "L" }]} />
    </Stack>
  );
}

function TokenGroup({ title, hint, children }) {
  return <Card><View><Text weight="semibold">{title}</Text>{hint ? <Text size="xs" tone="muted">{hint}</Text> : null}</View>{children}</Card>;
}

export default [
  { id: "motion", title: "Enter and Presence", description: "Named animations for anything that appears or disappears: fade, slide, scale, zoom, pop and flip.", Demo: () => {
    const theme = useTheme(), [motion, setMotion] = useState("slide-up"), [visible, setVisible] = useState(true), [run, setRun] = useState(0);
    return (
      <Stack gap="m">
        <ReducedNote />
        <Card>
          <Text size="sm" weight="semibold">Preset</Text>
          <Cluster>{ENTER_MOTIONS.map((name) => <Button key={name} title={name} size="s" variant={name === motion ? "solid" : "outline"} aria-pressed={name === motion} onPress={() => { setMotion(name); setVisible(true); setRun(run + 1); }} />)}</Cluster>
        </Card>
        <Card>
          <Cluster justify="space-between"><Text size="sm" weight="semibold">Presence</Text><Button title={visible ? "Hide" : "Show"} size="s" variant="soft" onPress={() => setVisible(!visible)} testID="toggle-presence" /></Cluster>
          <View style={{ height: 88, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.m, backgroundColor: theme.colors.sunken }}>
            <Presence key={motion} visible={visible} motion={motion} distance={24}><Tile>{motion}</Tile></Presence>
          </View>
          <Text size="xs" tone="muted">The tile stays mounted until its exit has finished, then it is removed.</Text>
        </Card>
        <Card padded={false} gap={0}>
          <Cluster justify="space-between" style={{ padding: theme.space.m, paddingBottom: theme.space.xs }}><Text size="sm" weight="semibold">Enter, staggered by index</Text><Button title="Replay" size="s" variant="soft" onPress={() => setRun(run + 1)} /></Cluster>
          {INBOX.map((person, index) => (
            <Enter key={`${run}-${person.name}`} motion={motion} index={index} stagger={70} distance={16}>
              {index ? <Divider /> : null}
              <ListItem title={person.name} subtitle={person.note} leading={<Avatar name={person.name} size={36} />} />
            </Enter>
          ))}
        </Card>
      </Stack>
    );
  } },
  { id: "motion-states", title: "Press and loop", description: "Press feedback (shrink, grow, lift, tilt, dim) and continuous loops (spin, pulse, bounce, ping, float). Touch has no hover, so the web kit's hover effects answer a press here.", Demo: () => {
    const theme = useTheme(), toast = useToast(), [paused, setPaused] = useState(false);
    const chip = { minHeight: theme.touch, paddingHorizontal: theme.space.m, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.m, borderWidth: 1, borderColor: theme.colors.line, backgroundColor: theme.colors.surface };
    return (
      <Stack gap="m">
        <ReducedNote />
        <Card>
          <Text size="sm" weight="semibold">Press and hold</Text>
          <Cluster>{["shrink", "grow", "lift", "tilt", "dim"].map((effect) => (
            <MotionPressable key={effect} effect={effect} style={chip} accessibilityLabel={`${effect} effect`} onPress={() => toast.show(`Pressed ${effect}`)}><Text size="sm" weight="medium">{effect}</Text></MotionPressable>
          ))}</Cluster>
          <MotionPressable effect="lift" onPress={() => toast.show("Opened the weekly report")} accessibilityLabel="Weekly report"
            style={{ padding: theme.space.m, gap: theme.space["2xs"], borderRadius: theme.radius.l, backgroundColor: theme.colors.accent }}>
            <Text weight="semibold" style={{ color: theme.colors.brandFg }}>Weekly report</Text>
            <Text size="sm" style={{ color: theme.colors.brandFg, opacity: 0.85 }}>A whole card that lifts under your finger.</Text>
          </MotionPressable>
        </Card>
        <Card>
          <Cluster justify="space-between"><Text size="sm" weight="semibold">Loops</Text><Switch value={!paused} onValueChange={(on) => setPaused(!on)} accessibilityLabel="Play loops" /></Cluster>
          <Cluster gap="l" align="flex-end" style={{ paddingTop: theme.space.xs }}>
            {[["spin", <Dot key="d" size={20} ring />], ["pulse", <Dot key="d" />], ["bounce", <Dot key="d" />], ["float", <Dot key="d" />]].map(([name, dot]) => (
              <View key={name} style={{ alignItems: "center", gap: theme.space.xs, minWidth: 44 }}>
                <View style={{ height: 28, justifyContent: "center" }}><MotionLoop motion={name} paused={paused}>{dot}</MotionLoop></View>
                <Text size="xs" tone="muted">{name}</Text>
              </View>
            ))}
            <View style={{ alignItems: "center", gap: theme.space.xs, minWidth: 44 }}>
              <View style={{ height: 28, width: 28, alignItems: "center", justifyContent: "center" }}>
                <MotionLoop motion="ping" paused={paused} style={{ position: "absolute" }}><Dot /></MotionLoop><Dot />
              </View>
              <Text size="xs" tone="muted">ping</Text>
            </View>
          </Cluster>
          <Divider />
          <Cluster gap="xs"><MotionLoop motion="pulse" paused={paused}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.ok }} /></MotionLoop><Text size="sm">Live · 128 people watching</Text></Cluster>
        </Card>
      </Stack>
    );
  } },
  { id: "motion-play", title: "useMotion", description: "Play an attention animation once from code, for example shake a field when the input is wrong.", Demo: () => {
    const theme = useTheme(), toast = useToast(), target = useMotion(), field = useMotion(), [code, setCode] = useState(""), [error, setError] = useState();
    const check = () => {
      if (code.trim().length === 6) { setError(undefined); toast.show("Code accepted", { tone: "ok" }); return; }
      setError("Enter the 6-digit code we sent you.");
      field.play("shake");
    };
    return (
      <Stack gap="m">
        <ReducedNote />
        <Card>
          <View style={{ height: 96, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.m, backgroundColor: theme.colors.sunken }}>
            <Animated.View style={target.style}><Tile>Colibri</Tile></Animated.View>
          </View>
          <Cluster>{PLAY_MOTIONS.map((name) => <Button key={name} title={name} size="s" variant="outline" onPress={() => target.play(name)} testID={`play-${name}`} />)}</Cluster>
          <Button title="Play three in a row" variant="soft" onPress={async () => { await target.play("pop"); await target.play("wiggle"); await target.play("bounce"); toast.show("play() resolved three times"); }} />
        </Card>
        <Card>
          <Animated.View style={field.style}>
            <TextField label="Verification code" placeholder="Leave it empty and press Check" keyboardType="number-pad" maxLength={6} value={code} onChangeText={(text) => { setCode(text); setError(undefined); }} error={error} />
          </Animated.View>
          <Button title="Check" onPress={check} testID="check-code" />
        </Card>
      </Stack>
    );
  } },
  { id: "motion-wired", title: "Built-in motion", description: "Dialog, Sheet and toasts animate on their own; Collapse, Presence and Enter add the same motion to your own layouts.", Demo: () => {
    const theme = useTheme(), toast = useToast(), [open, setOpen] = useState(false), [banner, setBanner] = useState(true), [dialog, setDialog] = useState(false), [sheet, setSheet] = useState(false), [tab, setTab] = useState("day");
    const totals = { day: ["$1,240", "38 orders today"], week: ["$8,410", "251 orders this week"], month: ["$34,900", "1,022 orders this month"] }[tab];
    return (
      <Stack gap="m">
        <ReducedNote />
        <Card>
          <Text size="sm" weight="semibold">Built in</Text>
          <Cluster>
            <Button title="Dialog (fade)" variant="outline" onPress={() => setDialog(true)} />
            <Button title="Sheet (slide)" variant="outline" onPress={() => setSheet(true)} />
            <Button title="Toast (fade)" variant="outline" onPress={() => toast.show("Saved to your library", { tone: "ok" })} />
          </Cluster>
        </Card>
        <Card gap="xs">
          <MotionPressable effect="dim" onPress={() => setOpen(!open)} accessibilityState={{ expanded: open }} aria-expanded={open} testID="toggle-collapse"
            style={{ minHeight: theme.touch, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.space.s }}>
            <Text weight="semibold" style={{ flex: 1 }}>Delivery details</Text><Text tone="muted">{open ? "−" : "+"}</Text>
          </MotionPressable>
          <Collapse open={open}>
            <Stack gap="xs" style={{ paddingBottom: theme.space["2xs"] }}>
              <Text size="sm" tone="muted">Arrives Thursday 14 November between 9 am and 1 pm. The courier will text you an hour before.</Text>
              <Cluster><Badge tone="ok">Free delivery</Badge><Badge>Signature required</Badge></Cluster>
            </Stack>
          </Collapse>
        </Card>
        <Stack gap="xs">
          <Presence visible={banner} motion="slide-down" appear>
            <Callout tone="accent" title="Update ready">Version 2.4 was downloaded in the background.</Callout>
          </Presence>
          <Button title={banner ? "Dismiss the banner" : "Show the banner"} variant="ghost" size="s" onPress={() => setBanner(!banner)} />
        </Stack>
        <Card>
          <Tabs value={tab} onChange={setTab} options={[{ value: "day", label: "Day" }, { value: "week", label: "Week" }, { value: "month", label: "Month" }]} />
          <Enter key={tab} motion="slide-left" distance={16}><Heading level={2}>{totals[0]}</Heading><Text size="sm" tone="muted">{totals[1]}</Text></Enter>
        </Card>
        <Dialog visible={dialog} onClose={() => setDialog(false)} title="Animated dialog" actions={<Button title="Close" onPress={() => setDialog(false)} />}>It fades in over the backdrop and out again.</Dialog>
        <Sheet visible={sheet} onClose={() => setSheet(false)} title="Animated sheet"><Stack gap="xs"><Text tone="muted">It slides up from the bottom edge.</Text><Button title="Close" variant="outline" block onPress={() => setSheet(false)} /></Stack></Sheet>
      </Stack>
    );
  } },
  { id: "theme-tokens", title: "Theme tokens", description: "Every colour, space, text size, radius and shadow that useTheme() returns. Components read these and nothing else.", Demo: () => {
    const theme = useTheme(), c = theme.colors;
    const shadowOf = (shadow) => ({ boxShadow: shadow.boxShadow, shadowColor: shadow.shadowColor, shadowOffset: shadow.shadowOffset, shadowOpacity: shadow.shadowOpacity, shadowRadius: shadow.shadowRadius, elevation: shadow.elevation });
    return (
      <Stack gap="m">
        <Text size="sm" tone="muted">Scheme {theme.scheme}, hue {theme.hue}, chroma {theme.chroma}. Change the accent on the home screen and come back.</Text>
        <TokenGroup title="Colours" hint="theme.colors">
          <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: theme.space.s }}>
            {Object.entries(c).map(([name, value]) => (
              <View key={name} accessible accessibilityLabel={`${name}, ${value}`} style={{ width: "50%", flexDirection: "row", alignItems: "center", gap: theme.space.xs }}>
                <View style={{ width: 36, height: 36, borderRadius: theme.radius.s, borderWidth: 1, borderColor: c.line, backgroundColor: value }} />
                <View style={{ flex: 1 }}><Text size="sm" weight="medium" numberOfLines={1}>{name}</Text><Text size="xs" tone="muted" numberOfLines={1}>{value}</Text></View>
              </View>
            ))}
          </View>
        </TokenGroup>
        <TokenGroup title="Tones" hint="theme.tones: fg, soft, tint and inverse for each tone">
          {Object.entries(theme.tones).map(([name, tone]) => (
            <View key={name} style={{ flexDirection: "row", alignItems: "center", gap: theme.space.xs }}>
              <Text size="sm" weight="medium" style={{ width: 56 }}>{name}</Text>
              {["fg", "soft", "tint", "inverse"].map((part) => (
                <View key={part} accessible accessibilityLabel={`${name} ${part}, ${tone[part]}`} style={{ flex: 1, alignItems: "center", gap: 2 }}>
                  <View style={{ alignSelf: "stretch", height: 28, borderRadius: theme.radius.s, borderWidth: 1, borderColor: c.line, backgroundColor: tone[part] }} />
                  <Text size="xs" tone="muted">{part}</Text>
                </View>
              ))}
            </View>
          ))}
        </TokenGroup>
        <TokenGroup title="Space" hint="theme.space, used by gap and padding">
          {Object.entries(theme.space).map(([name, value]) => (
            <View key={name} style={{ flexDirection: "row", alignItems: "center", gap: theme.space.xs }}>
              <Text size="sm" weight="medium" style={{ width: 36 }}>{name}</Text>
              <Text size="xs" tone="muted" style={{ width: 24 }}>{value}</Text>
              <View style={{ width: value, height: 14, borderRadius: 3, backgroundColor: c.accent }} />
            </View>
          ))}
        </TokenGroup>
        <TokenGroup title="Text" hint="theme.text, the size prop of Text">
          {Object.entries(theme.text).map(([name, value]) => (
            <View key={name} style={{ flexDirection: "row", alignItems: "baseline", gap: theme.space.xs }}>
              <Text size="xs" tone="muted" style={{ width: 52 }}>{name} · {value}</Text>
              <Text size={name} numberOfLines={1} style={{ flex: 1 }}>Hummingbird</Text>
            </View>
          ))}
        </TokenGroup>
        <TokenGroup title="Radius and touch" hint={`theme.radius; theme.touch is ${theme.touch}, the smallest press target`}>
          <Cluster gap="s">
            {Object.entries(theme.radius).map(([name, value]) => (
              <View key={name} style={{ alignItems: "center", gap: theme.space["2xs"] }}>
                <View style={{ width: 64, height: theme.touch, borderRadius: value, borderWidth: 2, borderColor: c.accent, backgroundColor: c.accentSoft }} />
                <Text size="xs" tone="muted">{name} · {value}</Text>
              </View>
            ))}
          </Cluster>
        </TokenGroup>
        <TokenGroup title="Shadow" hint="theme.shadow, applied with the platform's own shadow props">
          <Cluster gap="l" style={{ padding: theme.space.xs, paddingBottom: theme.space.m }}>
            {Object.entries(theme.shadow).map(([name, shadow]) => (
              <View key={name} style={[{ width: 72, height: 56, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.m, backgroundColor: c.surface }, shadowOf(shadow)]}><Text size="sm" weight="semibold">{name}</Text></View>
            ))}
          </Cluster>
        </TokenGroup>
      </Stack>
    );
  } },
  { id: "theme-scoped", title: "ThemeScope", description: "Re-theme one part of a screen: a different hue, corner style or colour scheme for everything inside.", Demo: () => {
    const theme = useTheme(), [hue, setHue] = useState(170), other = theme.scheme === "dark" ? "light" : "dark";
    return (
      <Stack gap="m">
        <Card><PanePreview label="The theme around it" /></Card>
        <ThemeScope hue={hue} radius="sharp">
          <Card>
            <PanePreview label={`<ThemeScope hue={${hue}} radius="sharp">`} />
            <Cluster>{[170, 20, 300, 75].map((value) => <Button key={value} title={`Hue ${value}`} size="s" variant={value === hue ? "soft" : "outline"} aria-pressed={value === hue} onPress={() => setHue(value)} />)}</Cluster>
          </Card>
        </ThemeScope>
        <ThemeScope scheme={other} radius="round" surface>
          <PanePreview label={`<ThemeScope scheme="${other}" radius="round" surface>`} />
          <Text size="sm" tone="muted">surface paints the scope's own background, so the opposite scheme reads correctly on this page.</Text>
        </ThemeScope>
      </Stack>
    );
  } },
];

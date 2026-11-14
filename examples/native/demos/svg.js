// Demos for the optional svg entry. Each entry: { id, title, description, Demo }.
import { useState } from "react";
import { View } from "react-native";
import { useTheme, Stack, Cluster, Divider, Text, Button, Card, Tabs, Switch } from "@colibri-kit/native";
import { LineChart, AreaChart, BarChart, PieChart, DonutChart, Sparkline, ProgressRing, Gauge, Icon, iconNames } from "@colibri-kit/native/svg";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const REVENUE = [
  { name: "This year", values: [12400, 13900, 13100, 15800, 17200, 16900, 19400, 21800, 20900, 23600, 25100, 27400] },
  { name: "Last year", values: [9800, 10400, 11900, 11200, 12800, 14100, 13700, 15200, 16800, 16100, 17900, 19300] },
];
const VISITS = [{ name: "Phone", values: [186, 305, 237, 273, 209, 314] }, { name: "Tablet", values: [80, 120, 96, 140, 110, 152] }, { name: "Desktop", values: [64, 71, 88, 79, 95, 103] }];
const HALF = MONTHS.slice(0, 6);
const CHANNELS = [{ label: "Search", value: 4820 }, { label: "Direct", value: 3110 }, { label: "Newsletter", value: 1960 }, { label: "Social", value: 870 }, { label: "Referrals", value: 540 }];
const CASH = [{ label: "Jan", value: 4200 }, { label: "Feb", value: 1800 }, { label: "Mar", value: -2600, tone: "bad" }, { label: "Apr", value: -900, tone: "bad" }, { label: "May", value: 3100 }, { label: "Jun", value: 5400 }];
const TEMPERATURE = [{ name: "Oslo", values: [-4.3, -4, -0.2, 4.5, 10.8, 15.2] }, { name: "Tromsø", values: [-3.8, -3.9, -2.4, 0.9, 5.1, 9.3] }];
const WEEK = [12, 18, 15, 22, 19, 27, 24, 31, 28, 35, 33, 41];
const ERRORS = [4, 3, 5, 4, 6, 5, 7, 6, 9, 8, 11, 12];
const money = (value) => `${value < 0 ? "−" : ""}$${Math.abs(value) >= 1000 ? `${+(Math.abs(value) / 1000).toFixed(1)}k` : Math.abs(value)}`;
const degrees = (value) => `${value < 0 ? "−" : ""}${Math.abs(value)}°`;

const Stat = ({ label, value, change, tone, values }) => (
  <Card gap="2xs" style={{ flex: 1, minWidth: 150 }}>
    <Text size="xs" tone="muted">{label}</Text>
    <Text size="xl" weight="bold">{value}</Text>
    <Text size="xs" tone={tone} weight="semibold">{change}</Text>
    <Sparkline data={values} tone={tone} area title={label} width="fill" height={36} />
  </Card>
);

const ICON_SIZES = [{ value: 20, label: "20" }, { value: 24, label: "24" }, { value: 32, label: "32" }];
const TONES = [{ value: "none", label: "Text" }, { value: "accent", label: "Accent" }, { value: "muted", label: "Muted" }, { value: "bad", label: "Bad" }];

export default [
  { id: "svg-line-chart", title: "LineChart", description: "Lines over a shared axis with round ticks, a legend and a tooltip: press or drag across the plot to read the values at a point.", Demo: () => {
    const [smooth, setSmooth] = useState(true), [picked, setPicked] = useState(null);
    return (
      <Stack gap="m">
        <Card>
          <LineChart title="Revenue per month" labels={MONTHS} series={REVENUE} smooth={smooth} formatValue={money} onActiveChange={(index, point) => setPicked(point)} testID="svg-line" />
          <Divider />
          <Switch label="Smooth lines (monotone: never overshoots a value)" value={smooth} onValueChange={setSmooth} />
          <Text size="sm" tone="muted" testID="svg-line-picked">{picked ? `onActiveChange: ${picked.label}, ${picked.values.map(money).join(" and ")}` : "Drag across the chart. A tap on the picked point clears it."}</Text>
        </Card>
        <Card>
          <LineChart title="Mean temperature, °C" labels={HALF} series={TEMPERATURE} showDots formatValue={degrees} />
          <Text size="sm" tone="muted">Values below zero: the axis is built around the data and the zero line is drawn stronger.</Text>
        </Card>
        <Card>
          <LineChart title="Response time, ms (two days without data)" labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]} series={[{ name: "p95", values: [320, 298, null, null, 341, 305, 288], tone: "warn" }]} showLegend height={140} />
        </Card>
        <Cluster gap="s" align="stretch">
          <Card style={{ flex: 1, minWidth: 150 }}><LineChart title="One point" data={[{ label: "Today", value: 42 }]} height={110} /></Card>
          <Card style={{ flex: 1, minWidth: 150 }}><LineChart title="Refunds" data={[]} height={110} emptyText="No refunds this quarter" /></Card>
        </Cluster>
      </Stack>
    );
  } },
  { id: "svg-area-chart", title: "AreaChart", description: "A line chart with a gradient fill under each line, side by side or stacked.", Demo: () => {
    const [stacked, setStacked] = useState("stacked");
    return (
      <Stack gap="m">
        <Card>
          <AreaChart title="Active users" data={WEEK.map((value, index) => ({ label: `W${index + 1}`, value: value * 120 }))} />
        </Card>
        <Card>
          <Tabs value={stacked} onChange={setStacked} options={[{ value: "stacked", label: "Stacked" }, { value: "side", label: "Overlapping" }]} />
          <AreaChart title="Visits by device" labels={HALF} series={VISITS} stacked={stacked === "stacked"} testID="svg-area" />
        </Card>
      </Stack>
    );
  } },
  { id: "svg-bar-chart", title: "BarChart", description: "SVG bars with rounded tips, grouped or stacked, from the same data and colours as the line charts.", Demo: () => {
    const [kind, setKind] = useState("grouped");
    return (
      <Stack gap="m">
        <Card>
          <Tabs value={kind} onChange={setKind} options={[{ value: "grouped", label: "Grouped" }, { value: "stacked", label: "Stacked" }]} />
          <BarChart title="Visits by device" labels={HALF} series={VISITS} stacked={kind === "stacked"} showValues={kind === "stacked"} testID="svg-bar" />
        </Card>
        <Card>
          <BarChart title="Net cash flow" data={CASH} formatValue={money} showValues />
          <Text size="sm" tone="muted">Bars below zero hang from the zero line; a row of data may carry its own tone.</Text>
        </Card>
      </Stack>
    );
  } },
  { id: "svg-pie-chart", title: "PieChart and DonutChart", description: "Parts of a whole with gaps and rounded corners: press a slice or its legend row to select it.", Demo: () => {
    const [selected, setSelected] = useState(null);
    return (
      <Stack gap="m">
        <Card>
          <DonutChart title="Sign-ups by channel" data={CHANNELS} selected={selected} onSelect={setSelected} centerLabel="Sign-ups" testID="svg-donut" />
          <Divider />
          <Cluster justify="space-between">
            <Text size="sm" tone="muted" testID="svg-donut-picked">{selected == null ? "Nothing selected" : `Selected: ${CHANNELS[selected].label}`}</Text>
            <Button title="Clear" variant="outline" size="s" disabled={selected == null} onPress={() => setSelected(null)} />
          </Cluster>
        </Card>
        <Card>
          <PieChart title="Tickets by status" size={180} data={[{ label: "Resolved", value: 128, tone: "ok" }, { label: "Waiting", value: 46, tone: "warn" }, { label: "Overdue", value: 17, tone: "bad" }, { label: "Unassigned", value: 9, tone: "muted" }]} testID="svg-pie" />
        </Card>
        <Cluster gap="s" align="stretch">
          <Card style={{ flex: 1, minWidth: 150 }}><DonutChart title="One part" size={120} data={[{ label: "Used", value: 76 }]} showLegend={false} /></Card>
          <Card style={{ flex: 1, minWidth: 150 }}><DonutChart title="No data" size={120} data={[{ label: "Used", value: 0 }]} /></Card>
        </Cluster>
      </Stack>
    );
  } },
  { id: "svg-sparkline", title: "Sparkline", description: "A small trend line for stat cards and table cells, with an optional fill and a dot on the latest value.", Demo: () => (
    <Stack gap="m">
      <Cluster gap="s" align="stretch">
        <Stat label="Active users" value="1,284" change="↑ 12% this week" tone="ok" values={WEEK} />
        <Stat label="Error rate" value="0.8%" change="↑ 0.3 points" tone="bad" values={ERRORS} />
      </Cluster>
      <Card>
        <Text size="sm" weight="semibold">Variants</Text>
        {[["Line", { }], ["Straight segments", { smooth: false }], ["Area, no dot", { area: true, dot: false }], ["With a gap", { data: [5, 7, 6, null, null, 9, 8, 11] }], ["One value", { data: [7] }], ["No data", { data: [] }]].map(([name, props]) => (
          <Cluster key={name} justify="space-between" wrap={false}>
            <Text size="sm">{name}</Text>
            <Sparkline data={[3, 5, 4, 8, 6, 9, 7, 12]} width={120} {...props} />
          </Cluster>
        ))}
        <Divider />
        <Text size="sm" tone="muted">width="fill" takes the width of the parent:</Text>
        <Sparkline data={WEEK} width="fill" height={48} area tone="accent" />
      </Card>
    </Stack>
  ) },
  { id: "svg-progress-ring", title: "ProgressRing", description: "Circular progress with a label in the middle, in any tone, or spinning while the amount is unknown.", Demo: () => {
    const [value, setValue] = useState(0.64);
    return (
      <Stack gap="m">
        <Card>
          <Cluster gap="l" justify="space-around" align="flex-end">
            <ProgressRing value={value} size="s" label="Small" />
            <ProgressRing value={value} label="Medium" testID="svg-ring" />
            <ProgressRing value={value} size="l" label="Large" />
          </Cluster>
          <Cluster>
            <Button title="−10%" variant="outline" size="s" onPress={() => setValue((now) => Math.max(0, +(now - 0.1).toFixed(2)))} />
            <Button title="+10%" variant="outline" size="s" onPress={() => setValue((now) => Math.min(1, +(now + 0.1).toFixed(2)))} />
          </Cluster>
        </Card>
        <Card>
          <Cluster gap="l" justify="space-around" align="flex-end">
            <ProgressRing value={1} tone="ok" label="Done" />
            <ProgressRing value={0.82} tone="warn" label="Storage" />
            <ProgressRing value={0.97} tone="bad" label="Quota" />
            <ProgressRing indeterminate label="Syncing" />
          </Cluster>
        </Card>
        <Card>
          <Cluster gap="m" wrap={false}>
            <ProgressRing value={5 / 8} size={72} thickness={8} accessibilityLabel="Steps done"><Text weight="bold">5/8</Text></ProgressRing>
            <View style={{ flex: 1 }}><Text weight="semibold">Set up your workspace</Text><Text size="sm" tone="muted">Three steps left. Any content can sit in the middle of the ring.</Text></View>
          </Cluster>
        </Card>
      </Stack>
    );
  } },
  { id: "svg-gauge", title: "Gauge", description: "A half-circle gauge: one tone, or coloured ranges that name the band the value falls in.", Demo: () => {
    const [score, setScore] = useState(72);
    return (
      <Stack gap="m">
        <Card>
          <Gauge value={score} label="Performance score" ranges={[{ to: 50, tone: "bad", label: "Poor" }, { to: 80, tone: "warn", label: "Needs work" }, { to: 100, tone: "ok", label: "Good" }]} testID="svg-gauge" />
          <Cluster justify="center">
            {[18, 50, 72, 94].map((value) => <Button key={value} title={String(value)} variant={value === score ? "soft" : "outline"} size="s" onPress={() => setScore(value)} />)}
          </Cluster>
        </Card>
        <Cluster gap="s" align="stretch">
          <Card style={{ flex: 1, minWidth: 150 }}><Gauge value={38.2} max={128} size={150} label="GB used" /></Card>
          <Card style={{ flex: 1, minWidth: 150 }}><Gauge value={-6} min={-20} max={40} size={150} tone="ok" label="°C outside" formatValue={degrees} /></Card>
        </Cluster>
      </Stack>
    );
  } },
  { id: "svg-icon", title: "Icon", description: `${iconNames.length} outline icons drawn on a 24-point grid, in any size, tone or stroke width.`, Demo: () => {
    const theme = useTheme(), [size, setSize] = useState(24), [tone, setTone] = useState("none"), [bold, setBold] = useState(false);
    return (
      <Stack gap="m">
        <Card>
          <Tabs value={size} onChange={setSize} options={ICON_SIZES} />
          <Tabs value={tone} onChange={setTone} options={TONES} />
          <Switch label="Heavier stroke (2.25)" value={bold} onValueChange={setBold} />
        </Card>
        <Card>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }} testID="svg-icon-grid">
            {iconNames.map((name) => (
              <View key={name} style={{ width: "25%", alignItems: "center", gap: 4, paddingVertical: theme.space.xs }}>
                <View style={{ height: 32, justifyContent: "center" }}><Icon name={name} size={size} tone={tone === "none" ? undefined : tone} strokeWidth={bold ? 2.25 : undefined} /></View>
                <Text size="xs" tone="muted" numberOfLines={1}>{name}</Text>
              </View>
            ))}
          </View>
        </Card>
        <Card>
          <Text size="sm" weight="semibold">In use</Text>
          <Cluster>
            <Button title="Download" icon={<Icon name="download" size={18} color={theme.colors.brandFg} />} />
            <Button title="Share" variant="outline" icon={<Icon name="share" size={18} />} />
            <Button title="Delete" variant="ghost" icon={<Icon name="trash" size={18} tone="bad" />} />
          </Cluster>
          <Cluster gap="s">
            <Icon name="check-circle" tone="ok" label="Passed" />
            <Text size="sm" style={{ flex: 1 }}>With label an icon is an image named for screen readers; without it, it is decoration and hidden from them.</Text>
          </Cluster>
        </Card>
      </Stack>
    );
  } },
];

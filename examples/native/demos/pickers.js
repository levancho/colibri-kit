// Demos for the pickers: slider, calendar, dates, colours, files and reordering.
import { useState } from "react";
import { View } from "react-native";
import {
  useTheme, useToast, Stack, Cluster, Divider, Text, Heading, Button, Card, Badge, Tabs, TextField,
  Slider, Calendar, DatePicker, ColorPicker, FileInput, ImageInput, Repeater, Sortable,
} from "@colibri-kit/native-core";

// ---------------------------------------------------------------- sample data
const pad = (n) => String(n).padStart(2, "0");
const isoOf = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const fromToday = (days) => { const date = new Date(); date.setDate(date.getDate() + days); return isoOf(date); };
const longDate = (iso) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("en", { weekday: "short", day: "numeric", month: "long" }) : "—");

// Small PNGs, so the image demos work offline and on a phone.
const AVATAR_A = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAIAAABt+uBvAAABHElEQVR42u3asQ0CMQwFUE/JDEzJKFRMQUWP0FFc7Di5J/0JnlLE/o7n6y0HCQSAAAECBAgQIEACCBAgQIAAAQIkgAABAgToZ273B6BvkeNcF+gvTQem6E8zlykW0pliFGvp1BvFcjrFRrGiTqURoB5Aw3XKjAA1AErSqTECBAgQoK2BUnUKjLwgQIAAAbo4kFkMkH0QIDtprYZe7BK9mGZVN++6w32QCzNAgAABAgQIkH+QUcOwah9k5br/ylUv5rqjsU62UWygk2oUe+jkGcU2OklGsZNOhlFspjPcKPbTGWsEqAqolc5AI0AlQA11RhkBygdqqzPECFAyUHOd80aAAE0EWkLnpBEgQLOAFtI5YwQIECBAgACtC/QBhrYOWsTRX5YAAAAASUVORK5CYII=";
const AVATAR_B = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAIAAABt+uBvAAABHElEQVR42u3awQ0CMQwEQFdHLRRKDVRAFbz4I3Q8Lnac3EhbwSiP2Ot4v55ykEAACBAgQIAAAQIkgAABAgQIECBAAggQIECAfuZxvwH6FjnOdYH+0nRgiv40c5liIZ0pRrGWTr1RLKdTbBQr6lQaAeoBNFynzAhQA6AknRojQIAAAdoaKFWnwMgLAgQIEKCLA5nFANkHAbKT1mroxS7Ri2lWdfOuO9wHuTADBAgQIECAAPkHGTUMq/ZBVq77r1z1Yq47GutkG8UGOqlGsYdOnlFso5NkFDvpZBjFZjrDjWI/nbFGgKqAWukMNAJUAtRQZ5QRoHygtjpDjAAlAzXXOW8ECNBEoCV0ThoBAjQLaCGdM0aAAAECBAjQukAfXbDb/pMn73oAAAAASUVORK5CYII=";
const COVER = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAABkCAIAAACO1KzYAAABy0lEQVR42u3au01cURiF0V0NtVAGkUPXQBUUQSHEjohdggPnQEQwEvaduef5s6QvvtKeNQ9pzsnzrz8qXLwEgAVYgAVYgAVYgAELsAALsAAL8NK9vf4AXBD1qwCXpZ3CDHiC7khjwHN0hxkDnqY7xhjwTN0BxoABq6dub2PAgAUYMGC6c4wB+wQLMGDAgAH7JwswYMBOkwA7D5YbHXInC7Nble5FA9Y54Jfff1U4wIAFWIAFWIAFWIAB67P7p8drA1wQdVlpwO1dl5IG3Jd2OnPQDg5wWdopzEFbmzloazOHbm3moK1tHLS1mUO3NnPQ1jYO3drMWfAABG1D4yx7zoW2CXNWPsuke14n/X7e734+/LditEcmfzSSOc2/Ew6OPC+9I+145jR8s9xGewPz7rStmBsAH3zQedqDzJVoxzDn5IPa0v7DuCptb+aceVCnnRfM34G23w9z1tzZavBeuj2Ys/LOdZg3nXw18PidKxhvvTpb7JzIvPvk7EI73rjG6uy1cxhzmcnZjra3cbHV2XRnD+ZdJl+1OlvvbMhcdXJ2pz3JXH5yCoy8jfmbrE6xnboIMGABFmABFmABFmDAAizAAizAAizAgFWzd3JxhCErqx6QAAAAAElFTkSuQmCC";

// React Native core has no file picker. In an app, onPick calls expo-document-picker or expo-image-picker and
// returns what the user chose. These demos have no picker to call, so each press "picks" the next sample file.
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const SAMPLE_FILES = [
  { name: "Q3-board-report.pdf", size: 1_258_291, type: "application/pdf", uri: "sample://q3-board-report.pdf" },
  { name: "team-offsite.png", size: 846_120, type: "image/png", uri: "sample://team-offsite.png" },
  { name: "product-walkthrough.mov", size: 48_340_992, type: "video/quicktime", uri: "sample://product-walkthrough.mov" },
  { name: "budget-2027.xlsx", size: 92_400, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", uri: "sample://budget-2027.xlsx" },
  { name: "signed-contract.pdf", size: 402_113, type: "application/pdf", uri: "sample://signed-contract.pdf" },
];
const SAMPLE_AVATARS = [
  { uri: AVATAR_B, name: "portrait-warm.png", size: 341, width: 96, height: 96 },
  { uri: AVATAR_A, name: "portrait-cool.png", size: 341, width: 96, height: 96 },
];

const Row = ({ label, value }) => <Cluster justify="space-between" wrap={false}><Text size="sm" weight="semibold">{label}</Text><Text size="sm" tone="muted">{value}</Text></Cluster>;

export default [
  { id: "slider", title: "Slider", description: "Drag a thumb to choose a number or a low–high range. Built on PanResponder; screen readers adjust it, and on the web the arrow keys do.", Demo: () => {
    const [volume, setVolume] = useState(40), [price, setPrice] = useState([200, 800]), [speed, setSpeed] = useState(1.2), [saved, setSaved] = useState(40);
    return (
      <Stack gap="m">
        <Card gap="2xs">
          <Row label="Volume" value={`${volume}%`} />
          <Slider label="Volume" value={volume} onChange={setVolume} onChangeEnd={setSaved} formatValue={(v) => `${v}%`} testID="volume" />
          <Text size="xs" tone="muted">onChangeEnd last reported {saved}%.</Text>
        </Card>
        <Card gap="2xs">
          <Row label="Price range" value={`$${price[0]} – $${price[1]}`} />
          <Slider label="Price" thumbLabels={["Lowest price", "Highest price"]} min={0} max={1000} step={10} value={price} onChange={setPrice} formatValue={(v) => `$${v}`} testID="price" />
          <Text size="xs" tone="muted">Two thumbs in steps of $10. They stop at each other.</Text>
        </Card>
        <Card gap="2xs">
          <Row label="Playback speed" value={`${speed}×`} />
          <Slider label="Playback speed" min={0.5} max={2} step={0.1} value={speed} onChange={setSpeed} tone="ok" formatValue={(v) => `${v}×`} />
          <Divider style={{ marginVertical: 8 }} />
          <Row label="Storage quota" value="Managed by your admin" />
          <Slider label="Storage quota" defaultValue={65} tone="warn" disabled />
        </Card>
      </Stack>
    );
  } },
  { id: "calendar", title: "Calendar", description: "A month grid for one date, a range or several dates, with limits, blocked days and localized names.", Demo: () => {
    const [mode, setMode] = useState("single");
    const [day, setDay] = useState(fromToday(3)), [stay, setStay] = useState([fromToday(5), fromToday(9)]), [shifts, setShifts] = useState([fromToday(1), fromToday(2), fromToday(6)]);
    const [locale, setLocale] = useState("en");
    const booked = [fromToday(12), fromToday(13)];
    return (
      <Stack gap="m">
        <Tabs value={mode} onChange={setMode} options={[{ value: "single", label: "Single" }, { value: "range", label: "Range" }, { value: "multiple", label: "Multiple" }]} />
        <Card>
          {mode === "single" ? <Calendar value={day} onChange={setDay} locale={locale} testID="cal" /> : null}
          {mode === "range" ? <Calendar mode="range" value={stay} onChange={setStay} min={fromToday(0)} max={fromToday(120)} disabledDates={booked} locale={locale} testID="cal" /> : null}
          {mode === "multiple" ? <Calendar mode="multiple" value={shifts} onChange={setShifts} locale={locale} firstDay={0} testID="cal" /> : null}
          <Divider />
          {mode === "single" ? <Row label="Delivery date" value={longDate(day)} /> : null}
          {mode === "range" ? <><Row label="Check-in" value={longDate(stay[0])} /><Row label="Check-out" value={longDate(stay[1])} /><Text size="xs" tone="muted">Past days are off, and two days are already booked.</Text></> : null}
          {mode === "multiple" ? <><Row label="Shifts picked" value={`${shifts.length}`} /><Text size="xs" tone="muted">Weeks start on Sunday here (firstDay 0).</Text></> : null}
        </Card>
        <Card gap="xs">
          <Text size="sm" weight="semibold">Language</Text>
          <Tabs value={locale} onChange={setLocale} options={[{ value: "en", label: "English" }, { value: "de", label: "Deutsch" }, { value: "ka", label: "ქართული" }]} />
          <Text size="xs" tone="muted">Names come from Intl; a device without that language shows English.</Text>
        </Card>
      </Stack>
    );
  } },
  { id: "date-picker", title: "DatePicker", description: "A field that opens the calendar in a bottom sheet; the phone's version of the web kit's input with a popover.", Demo: () => {
    const [published, setPublished] = useState(fromToday(2)), [birthday, setBirthday] = useState(null), [trip, setTrip] = useState([null, null]);
    const nights = trip[0] && trip[1] ? Math.round((new Date(`${trip[1]}T12:00:00`) - new Date(`${trip[0]}T12:00:00`)) / 864e5) : 0;
    return (
      <Stack gap="m">
        <Card>
          <DatePicker label="Publish date" value={published} onChange={setPublished} min={fromToday(0)} hint="The post goes live at 09:00 on this day." testID="publish" />
          <DatePicker label="Birthday" value={birthday} onChange={setBirthday} max={fromToday(0)} showYearNav placeholder="Day, month and year" error={birthday ? undefined : "Tell us your birthday to continue."} />
        </Card>
        <Card>
          <DatePicker mode="range" label="Trip dates" value={trip} onChange={setTrip} min={fromToday(0)} placeholder="Check-in – check-out" testID="trip" />
          <Text size="sm" tone="muted">{nights ? `${nights} ${nights === 1 ? "night" : "nights"} in Lisbon.` : "Pick the first and the last night, then Done."}</Text>
          <DatePicker label="Invoice date" value="2026-10-30" disabled />
        </Card>
      </Stack>
    );
  } },
  { id: "color-picker", title: "ColorPicker", description: "Hue, saturation and lightness sliders, a hex field and preset swatches. It returns a hex colour.", Demo: () => {
    const theme = useTheme(), [brand, setBrand] = useState("#3b6fd9"), [label, setLabel] = useState("#d9534f");
    return (
      <Stack gap="m">
        <Card>
          <ColorPicker label="Brand colour" value={brand} onChange={setBrand} testID="brand" />
          <Divider />
          <Cluster gap="s" wrap={false}>
            <View style={{ flex: 1, padding: theme.space.s, borderRadius: theme.radius.m, backgroundColor: brand }}>
              <Text weight="bold" style={{ color: "#ffffff" }}>Northwind</Text>
              <Text size="sm" style={{ color: "#ffffff" }}>Preview with {brand}</Text>
            </View>
          </Cluster>
        </Card>
        <Card>
          <ColorPicker label="Label colour" sliders={false} value={label} onChange={setLabel}
            swatches={[{ value: "#d9534f", label: "Urgent red" }, { value: "#e8943a", label: "Orange" }, { value: "#e3c02b", label: "Yellow" }, { value: "#3fa66b", label: "Green" }, { value: "#3b8fd9", label: "Blue" }, { value: "#8a63d2", label: "Purple" }, { value: "#6b7280", label: "Grey" }]} />
          <Text size="xs" tone="muted">sliders={"{false}"} keeps only the presets and the hex field.</Text>
        </Card>
      </Stack>
    );
  } },
  { id: "file-input", title: "FileInput", description: "Lists chosen files with remove buttons and checks size, type and count. React Native has no built-in file picker, so your app passes one as onPick (expo-document-picker); this demo has no picker, so each press adds the next sample file.", Demo: () => {
    const toast = useToast(), [files, setFiles] = useState([SAMPLE_FILES[0]]), [next, setNext] = useState(1), [resume, setResume] = useState([]);
    // Each press "picks" the next sample; the third one is 46 MB and is turned away.
    const pickSample = async () => { await wait(500); setNext((n) => n + 1); return SAMPLE_FILES[next % SAMPLE_FILES.length]; };
    return (
      <Stack gap="m">
        <Card>
          <FileInput label="Attachments" multiple maxFiles={3} maxSize="2MB" value={files} onChange={setFiles} testID="attachments"
            onPick={pickSample} onReject={(rejected) => toast.show(`${rejected.length} ${rejected.length === 1 ? "file was" : "files were"} not added`, { tone: "warn" })} />
          <Text size="xs" tone="muted">{files.length} of 3 attached.</Text>
        </Card>
        <Card>
          <FileInput label="Résumé" accept=".pdf" maxSize="5MB" hint="PDF only, 5 MB at most" value={resume} onChange={setResume}
            onPick={async () => { await wait(400); return resume.length ? SAMPLE_FILES[3] : SAMPLE_FILES[4]; }} />
        </Card>
      </Stack>
    );
  } },
  { id: "image-input", title: "ImageInput", description: "A preview with change and delete. The picker itself comes from your app as onPick (expo-image-picker), because React Native has none built in; this demo has no picker, so each press swaps in a sample picture.", Demo: () => {
    const [avatar, setAvatar] = useState({ uri: AVATAR_A, name: "portrait-cool.png", size: 341 }), [turn, setTurn] = useState(0), [cover, setCover] = useState(null);
    return (
      <Stack gap="m">
        <Card>
          <ImageInput label="Profile photo" value={avatar} onChange={setAvatar} maxSize="1MB" hint="PNG or JPG, 1 MB at most" testID="avatar"
            onPick={async () => { await wait(500); setTurn((n) => n + 1); return SAMPLE_AVATARS[turn % 2]; }} />
        </Card>
        <Card>
          <ImageInput label="Cover image" shape="rounded" size={{ width: 480, height: 150 }} value={cover} onChange={setCover} chooseLabel="Add a cover" hint="Shown at the top of your public page." testID="cover"
            onPick={async () => { await wait(500); return { uri: COVER, name: "hills-at-dawn.png", size: 516 }; }} />
        </Card>
      </Stack>
    );
  } },
  { id: "repeater", title: "Repeater", description: "Rows of repeated fields with add and remove, a minimum and a maximum.", Demo: () => {
    const [lines, setLines] = useState([{ name: "Espresso beans, 1 kg", qty: "2" }, { name: "Oat milk, case of 6", qty: "1" }]);
    const units = lines.reduce((sum, line) => sum + (parseInt(line.qty, 10) || 0), 0);
    return (
      <Card>
        <Cluster justify="space-between"><Heading level={3}>Order lines</Heading><Badge tone={lines.length >= 5 ? "warn" : undefined}>{lines.length} of 5</Badge></Cluster>
        <Repeater value={lines} onChange={setLines} min={1} max={5} createItem={() => ({ name: "", qty: "1" })} addLabel="Add line" removeLabel={(index) => `Remove line ${index + 1}`} testID="lines"
          renderRow={({ item, index, update }) => (
            <Cluster wrap={false} align="flex-end">
              <TextField style={{ flex: 1 }} label={index === 0 ? "Item" : undefined} accessibilityLabel={`Item ${index + 1}`} placeholder="Product name" value={item.name} onChangeText={(name) => update({ name })} />
              <TextField style={{ width: 64 }} label={index === 0 ? "Qty" : undefined} accessibilityLabel={`Quantity ${index + 1}`} keyboardType="number-pad" value={item.qty} onChangeText={(qty) => update({ qty: qty.replace(/\D/g, "") })} />
            </Cluster>
          )} />
        <Divider />
        <Row label="Total units" value={`${units}`} />
        <Text size="xs" tone="muted">At least one line, at most five.</Text>
      </Card>
    );
  } },
  { id: "sortable", title: "Sortable", description: "Drag a row by its grip to reorder. Screen readers get move up and move down actions; on the web the grip takes the arrow keys.", Demo: () => {
    const [tasks, setTasks] = useState([
      { id: "crash", title: "Fix checkout crash on Android 14", owner: "Sam Chen", tag: "Bug", tone: "bad" },
      { id: "onboarding", title: "Shorten the onboarding to three steps", owner: "Maya Okafor", tag: "Design", tone: "accent" },
      { id: "export", title: "CSV export for invoices", owner: "Alex Rivera", tag: "Feature", tone: "ok" },
      { id: "copy", title: "Review pricing page copy", owner: "Priya Nair", tag: "Content" },
    ]);
    const [tabs, setTabs] = useState(["Home", "Search", "Orders", "Profile"]);
    return (
      <Stack gap="m">
        <Stack gap="xs">
          <Text size="sm" weight="semibold">This week's priorities</Text>
          <Sortable label="This week's priorities" value={tasks} onChange={setTasks} getLabel={(task) => task.title} testID="tasks" renderItem={({ item, index }) => (
            <Cluster wrap={false} gap="s">
              <Text weight="bold" tone="muted" style={{ width: 16 }}>{index + 1}</Text>
              <View style={{ flex: 1 }}><Text weight="medium" numberOfLines={1}>{item.title}</Text><Text size="sm" tone="muted">{item.owner}</Text></View>
              <Badge tone={item.tone}>{item.tag}</Badge>
            </Cluster>
          )} />
        </Stack>
        <Card>
          <Text size="sm" weight="semibold">Tab bar order</Text>
          <Sortable label="Tab bar order" value={tabs} onChange={setTabs} handle="start" />
          <Text size="sm" tone="muted">{tabs.join(" · ")}</Text>
        </Card>
      </Stack>
    );
  } },
];

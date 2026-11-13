// Demos for the form controls: inputs, pickers and groups of choices.
import { useState } from "react";
import {
  useToast, Stack, Cluster, Divider, Text, Button, Card, Badge,
  Input, Field, InputGroup, InputAddon, Textarea, PasswordInput, PinInput, Select, Combobox,
  CheckboxGroup, CheckboxCards, RadioCards, ToggleGroup, SegmentedControl,
} from "@colibri-kit/native";

const COUNTRIES = [
  { label: "Europe", options: [
    { value: "ge", label: "Georgia" }, { value: "de", label: "Germany" }, { value: "fr", label: "France" }, { value: "es", label: "Spain" },
    { value: "it", label: "Italy" }, { value: "pl", label: "Poland" }, { value: "se", label: "Sweden", disabled: true },
  ] },
  { label: "Americas", options: [{ value: "us", label: "United States" }, { value: "ca", label: "Canada" }, { value: "mx", label: "Mexico" }, { value: "br", label: "Brazil" }] },
  { label: "Asia Pacific", options: [{ value: "jp", label: "Japan" }, { value: "kr", label: "South Korea" }, { value: "au", label: "Australia" }] },
];
const TOPICS = [{ value: "news", label: "News" }, { value: "sport", label: "Sports" }, { value: "tech", label: "Technology" }, { value: "travel", label: "Travel" }, { value: "food", label: "Food and drink" }];
const CITIES = ["Tbilisi", "Batumi", "Kutaisi", "Rustavi", "Gori", "Zugdidi", "Poti", "Telavi"].map((label) => ({ value: label.toLowerCase(), label }));
const LANGUAGES = [{ value: "js", label: "JavaScript" }, { value: "ts", label: "TypeScript" }, { value: "py", label: "Python" }, { value: "go", label: "Go" }, { value: "rs", label: "Rust" }, { value: "kt", label: "Kotlin" }, { value: "swift", label: "Swift" }];
const PEOPLE = ["Maya Okafor", "Alex Rivera", "Sam Chen", "Nino Beridze", "Priya Patel", "Jonas Weber", "Lucía Gómez"].map((label) => ({ value: label, label }));
const findPeople = (query) => new Promise((resolve) => setTimeout(() => resolve(PEOPLE.filter((person) => person.label.toLowerCase().includes(query.trim().toLowerCase()))), 400));

export default [
  { id: "input", title: "Input", description: "The bare themed text input in three sizes, with invalid and disabled states and a leading or trailing slot.", Demo: () => {
    const [name, setName] = useState(""), [amount, setAmount] = useState("120");
    return (
      <Card>
        <Input placeholder="Full name" accessibilityLabel="Full name" value={name} onChangeText={setName} testID="name" />
        <Input size="s" placeholder="Small" accessibilityLabel="Small input" />
        <Input size="l" placeholder="Large" accessibilityLabel="Large input" />
        <Input leading="$" trailing="USD" keyboardType="decimal-pad" accessibilityLabel="Amount in US dollars" value={amount} onChangeText={setAmount} />
        <Input invalid defaultValue="not-an-email" keyboardType="email-address" autoCapitalize="none" accessibilityLabel="Email" />
        <Input disabled defaultValue="Cannot be edited" accessibilityLabel="Disabled input" />
      </Card>
    );
  } },
  { id: "input-group", title: "InputGroup", description: "An input with fixed text or a button attached to its edges.", Demo: () => {
    const toast = useToast(), [site, setSite] = useState("despani"), [price, setPrice] = useState("49.00");
    return (
      <Card>
        <InputGroup prefix="https://" suffix=".ge" value={site} onChangeText={setSite} autoCapitalize="none" accessibilityLabel="Site address" />
        <InputGroup prefix="$" suffix="per month" value={price} onChangeText={setPrice} keyboardType="decimal-pad" accessibilityLabel="Price per month" />
        <InputGroup value={`colibri-kit.io/invite/${site || "team"}`} readOnly accessibilityLabel="Invite link"
          suffix={<InputAddon side="end" onPress={() => toast.show("Link copied", { tone: "ok" })}>Copy</InputAddon>} />
      </Card>
    );
  } },
  { id: "field", title: "Field", description: "Label, description and error around any control, linked to it for screen readers.", Demo: () => {
    const [email, setEmail] = useState(""), [username, setUsername] = useState("admin"), [country, setCountry] = useState(null);
    const taken = ["admin", "root", "support"].includes(username.trim().toLowerCase());
    return (
      <Card gap="m">
        <Field label="Email" description="We will never share your email." required>
          <Input value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" testID="email" />
        </Field>
        <Field label="Username" error={taken ? "That username is already taken." : undefined}>
          <Input value={username} onChangeText={setUsername} autoCapitalize="none" />
        </Field>
        <Field label="Country" description="Used for tax and delivery estimates.">
          <Select value={country} onChange={setCountry} placeholder="Choose a country" options={COUNTRIES[0].options} />
        </Field>
        <Field label="Company" description="Set by your workspace owner." disabled>
          <Input defaultValue="Despani" />
        </Field>
      </Card>
    );
  } },
  { id: "textarea", title: "Textarea", description: "Multi-line text that grows as you type, up to a row limit, and counts characters.", Demo: () => {
    const [comment, setComment] = useState("Thanks for the quick turnaround on this. Two small things before we ship:");
    return (
      <Card gap="m">
        <Field label="Comment" description="Grows from two rows to six, then scrolls.">
          <Textarea value={comment} onChangeText={setComment} minRows={2} maxRows={6} maxLength={200} placeholder="Write a comment…" testID="comment" />
        </Field>
        <Field label="Internal note">
          <Textarea placeholder="Only your team sees this." autoGrow={false} />
        </Field>
      </Card>
    );
  } },
  { id: "toggle-password", title: "PasswordInput", description: "A password field with a button that shows or hides what was typed.", Demo: () => {
    const [password, setPassword] = useState("hunter2-colibri");
    const weak = password.length > 0 && password.length < 10;
    return (
      <Card gap="m">
        <Field label="Password" description="At least 10 characters." error={weak ? "Use at least 10 characters." : undefined}>
          <PasswordInput value={password} onChangeText={setPassword} placeholder="Enter a password" testID="password" />
        </Field>
        <Field label="Recovery phrase">
          <PasswordInput defaultValue="maple orbit lantern" defaultVisible showLabel="Reveal" hideLabel="Conceal" />
        </Field>
      </Card>
    );
  } },
  { id: "pin-input", title: "PinInput", description: "One box per character of a code. Typing advances, and pasting fills every box.", Demo: () => {
    const toast = useToast(), [code, setCode] = useState("482"), [pin, setPin] = useState("");
    return (
      <Card gap="m">
        <Field label="Verification code" description="We sent a 6-digit code to +995 555 12 34 56.">
          <PinInput value={code} onChange={setCode} onComplete={(value) => toast.show(`Code ${value} entered`, { tone: "ok" })} testID="code" />
        </Field>
        <Field label="Card PIN" description="Masked as you type." error={pin.length === 4 && pin !== "1234" ? "That PIN is not right. Try 1234." : undefined}>
          <PinInput length={4} mask value={pin} onChange={setPin} />
        </Field>
        <Cluster><Button title="Clear" size="s" variant="outline" onPress={() => { setCode(""); setPin(""); }} /></Cluster>
      </Card>
    );
  } },
  { id: "select", title: "Select", description: "A field that opens a sheet of options: one or several, grouped, searchable when the list is long.", Demo: () => {
    const [country, setCountry] = useState("ge"), [topics, setTopics] = useState(["news", "tech"]);
    return (
      <Card gap="m">
        <Field label="Country" description="Grouped, with search. Sweden is unavailable.">
          <Select value={country} onChange={setCountry} options={COUNTRIES} placeholder="Choose a country" clearable testID="country" />
        </Field>
        <Field label="Topics" description="Pick as many as you like.">
          <Select multiple value={topics} onChange={setTopics} options={TOPICS} placeholder="Choose topics" clearable testID="topics" />
        </Field>
        <Field label="Plan" error="Choose a plan to continue.">
          <Select options={["Free", "Pro", "Team"]} placeholder="Choose a plan" />
        </Field>
        <Select options={TOPICS} defaultValue="news" disabled accessibilityLabel="Disabled select" />
      </Card>
    );
  } },
  { id: "combobox", title: "Combobox", description: "Type to filter suggestions shown under the input; it can collect several as chips, accept new values and search remotely.", Demo: () => {
    const [city, setCity] = useState(null), [langs, setLangs] = useState(["ts", "go"]), [owner, setOwner] = useState(null);
    return (
      <Card gap="m">
        <Field label="City" description={city ? `Selected: ${city}` : "Start typing, or open the list."}>
          <Combobox value={city} onChange={setCity} options={CITIES} placeholder="City…" testID="city" />
        </Field>
        <Field label="Languages" description="Several values, and you can add your own.">
          <Combobox multiple allowCustom value={langs} onChange={setLangs} options={LANGUAGES} placeholder="Add a language…" testID="langs" />
        </Field>
        <Field label="Owner" description="Results come from an async onSearch.">
          <Combobox value={owner} onChange={setOwner} options={PEOPLE.slice(0, 3)} onSearch={findPeople} placeholder="Search people…" testID="owner" />
        </Field>
      </Card>
    );
  } },
  { id: "checkbox-group", title: "CheckboxGroup", description: "A labelled list of checkboxes that reports one array value.", Demo: () => {
    const [notify, setNotify] = useState(["mentions", "billing"]), [days, setDays] = useState(["mon", "wed", "fri"]);
    return (
      <Card gap="m">
        <CheckboxGroup label="Email me about" description="You can change this at any time." value={notify} onChange={setNotify} options={[
          { value: "mentions", label: "Mentions and replies" }, { value: "billing", label: "Invoices and billing" },
          { value: "product", label: "Product updates" }, { value: "partners", label: "Partner offers", disabled: true }]} />
        <Text size="sm" tone="muted">Value: {notify.length ? notify.join(", ") : "none"}</Text>
        <Divider />
        <CheckboxGroup label="Delivery days" direction="row" value={days} onChange={setDays} error={days.length ? undefined : "Choose at least one day."}
          options={[{ value: "mon", label: "Mon" }, { value: "tue", label: "Tue" }, { value: "wed", label: "Wed" }, { value: "thu", label: "Thu" }, { value: "fri", label: "Fri" }]} />
      </Card>
    );
  } },
  { id: "checkbox-cards", title: "CheckboxCards", description: "Large selectable cards where several can be chosen.", Demo: () => {
    const [apps, setApps] = useState(["github"]);
    return (
      <Stack>
        <CheckboxCards label="Integrations" description="Connect the tools your team already uses." value={apps} onChange={setApps} options={[
          { value: "github", title: "GitHub", description: "Sync pull requests and reviews.", trailing: <Badge tone="ok">Popular</Badge> },
          { value: "slack", title: "Slack", description: "Post updates to a channel." },
          { value: "figma", title: "Figma", description: "Embed frames in tasks." },
          { value: "linear", title: "Linear", description: "Coming soon.", disabled: true }]} />
        <Text size="sm" tone="muted">{apps.length} connected</Text>
      </Stack>
    );
  } },
  { id: "radio-cards", title: "RadioCards", description: "Large selectable cards where exactly one is chosen.", Demo: () => {
    const [plan, setPlan] = useState("pro"), [speed, setSpeed] = useState("standard");
    return (
      <Stack gap="m">
        <RadioCards label="Plan" value={plan} onChange={setPlan} options={[
          { value: "free", title: "Free", description: "Up to 3 projects and 1 GB of storage.", trailing: "$0" },
          { value: "pro", title: "Pro", description: "Unlimited projects, 50 GB and priority support.", trailing: "$19" },
          { value: "team", title: "Team", description: "Everything in Pro, plus roles and audit log.", trailing: "$49" }]} />
        <RadioCards label="Delivery" columns={2} value={speed} onChange={setSpeed} options={[
          { value: "standard", title: "Standard", description: "3–5 days" }, { value: "express", title: "Express", description: "Next day" }]} />
      </Stack>
    );
  } },
  { id: "toggle-group", title: "ToggleGroup", description: "A joined row of toggle buttons; one or several can be on.", Demo: () => {
    const [align, setAlign] = useState("center"), [format, setFormat] = useState(["bold", "italic"]), [view, setView] = useState("list");
    return (
      <Card gap="m">
        <Stack gap="2xs">
          <Text size="sm" weight="semibold">Alignment (single)</Text>
          <ToggleGroup accessibilityLabel="Text alignment" value={align} onChange={setAlign} options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }, { value: "justify", label: "Justify", disabled: true }]} />
        </Stack>
        <Stack gap="2xs">
          <Text size="sm" weight="semibold">Formatting (multiple)</Text>
          <ToggleGroup type="multiple" accessibilityLabel="Text formatting" value={format} onChange={setFormat} options={[
            { value: "bold", icon: <Text weight="bold">B</Text>, accessibilityLabel: "Bold" },
            { value: "italic", icon: <Text style={{ fontStyle: "italic" }}>I</Text>, accessibilityLabel: "Italic" },
            { value: "underline", icon: <Text style={{ textDecorationLine: "underline" }}>U</Text>, accessibilityLabel: "Underline" },
            { value: "strike", icon: <Text style={{ textDecorationLine: "line-through" }}>S</Text>, accessibilityLabel: "Strikethrough" }]} />
          <Text style={{ fontWeight: format.includes("bold") ? "700" : "400", fontStyle: format.includes("italic") ? "italic" : "normal", textAlign: align ?? "left",
            textDecorationLine: [format.includes("underline") && "underline", format.includes("strike") && "line-through"].filter(Boolean).join(" ") || "none" }}>The quick brown fox jumps over the lazy dog.</Text>
        </Stack>
        <Stack gap="2xs">
          <Text size="sm" weight="semibold">Small, full width, always one on</Text>
          <ToggleGroup size="s" block required accessibilityLabel="Layout" value={view} onChange={setView} options={[{ value: "list", label: "List" }, { value: "board", label: "Board" }, { value: "calendar", label: "Calendar" }]} />
        </Stack>
      </Card>
    );
  } },
  { id: "segmented-control", title: "SegmentedControl", description: "A compact pill of two to five options where one is selected, with a sliding highlight, three sizes and optional icons.", Demo: () => {
    const [range, setRange] = useState("week"), [view, setView] = useState("grid"), [unit, setUnit] = useState("c");
    return (
      <Stack gap="m">
        <SegmentedControl accessibilityLabel="Range" value={range} onChange={setRange} testID="range" options={[{ value: "day", label: "Day" }, { value: "week", label: "Week" }, { value: "month", label: "Month" }, { value: "year", label: "Year" }]} />
        <Card><Text>Showing revenue for the last {range}.</Text></Card>
        <SegmentedControl size="l" accessibilityLabel="View" value={view} onChange={setView} options={[{ value: "list", label: "List", icon: "☰" }, { value: "grid", label: "Grid", icon: "▦" }, { value: "map", label: "Map", icon: "◎", disabled: true }]} />
        <Cluster gap="s">
          <Text size="sm" tone="muted">Temperature</Text>
          <SegmentedControl size="s" accessibilityLabel="Temperature unit" value={unit} onChange={setUnit} options={[{ value: "c", label: "°C" }, { value: "f", label: "°F" }]} style={{ width: 120 }} />
        </Cluster>
      </Stack>
    );
  } },
];

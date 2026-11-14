# @colibri-kit/native-core

Colibri React Native Core.

Colibri for React Native and Expo. The Colibri catalog for phones: layout, controls, overlays, forms, phone patterns, AI elements, ready-made screens and dashboard pieces, themed from one hue.

- **One hue, whole palette.** The colours are the same ones Colibri CSS produces for that hue, in light and dark.
- **No dependencies** beyond `react` and `react-native`. For gestures, SVG charts, icons and safe areas, use `@colibri-kit/native-full`.
- **No build step and no configuration.** Plain JavaScript, with TypeScript declarations included.
- **The same words as the web kit:** `gap="s"`, `variant="soft"`, `tone="ok"`, `size="l"`.
- **Accessible by default:** roles, states, labels and 44-point touch targets.

Live demo (the real components, running through react-native-web): https://colibri-kit.io/native/

## Core or Full

Colibri React Native comes as two packages that share names and props. Install one of them.

| | Core (this package) | Full |
|---|---|---|
| Package | `@colibri-kit/native-core` | [`@colibri-kit/native-full`](https://www.npmjs.com/package/@colibri-kit/native-full), which includes Core |
| Needs | `react`, `react-native` | Core plus `react-native-reanimated`, `react-native-gesture-handler`, `react-native-svg`, `react-native-safe-area-context` |
| Drags (sheets, swipe rows, sortable, slider) | followed on the JavaScript thread | followed on the UI thread, with swipe to dismiss |
| Charts | bar-based, drawn with views | adds line, area, pie, donut, ring, gauge |
| Icons | text glyphs or your own elements | a 66-icon outline set |
| Notch and home indicator | pass `topInset` / `bottomInset` yourself | read automatically |

Moving from Core to Full later means installing `@colibri-kit/native-full` and changing the package name in your
imports. Documentation and the API reference: https://colibri-kit.io/native/docs/

## Install

```sh
npm install @colibri-kit/native-core
```

Requires React Native 0.71 or newer (Expo SDK 48 or newer). No native modules, so it works in Expo Go.

## Use

```jsx
import { ColibriProvider, ToastProvider, Screen, Stack, Heading, Text, Button, useToast } from "@colibri-kit/native-core";

function Home() {
  const toast = useToast();
  return (
    <Screen scroll>
      <Stack gap="m">
        <Heading level={1}>Hello</Heading>
        <Text tone="muted">Built with Colibri.</Text>
        <Button title="Save" onPress={() => toast.show("Saved", { tone: "ok" })} />
      </Stack>
    </Screen>
  );
}

export default function App() {
  return (
    <ColibriProvider hue={160}>
      <ToastProvider>
        <Home />
      </ToastProvider>
    </ColibriProvider>
  );
}
```

`Screen` does not add safe-area padding. Wrap it in `SafeAreaView` from `react-native-safe-area-context` if your navigator does not already handle the notch.

## Theme

`ColibriProvider` props:

| Prop | Default | Meaning |
|---|---|---|
| `hue` | `255` | Accent hue, 0 to 360. Every colour follows it. |
| `chroma` | `0.16` | Colour strength of the accent. |
| `scheme` | `"auto"` | `"auto"` follows the device; `"light"` or `"dark"` forces one. |
| `radius` | `"soft"` | `"sharp"`, `"soft"` or `"round"` corners. |

Components work without a provider, using the default light theme.

`useTheme()` returns the values for your own styles:

```jsx
const theme = useTheme();
<View style={{ padding: theme.space.m, backgroundColor: theme.colors.surface, borderRadius: theme.radius.l }} />
```

- `theme.colors`: `bg`, `surface`, `sunken`, `fg`, `muted`, `line`, `accent`, `accentSoft`, `brandFg`, `ok`, `warn`, `bad`
- `theme.space`: `3xs` `2xs` `xs` `s` `m` `l` `xl` `2xl` (2 to 48)
- `theme.text`: `xs` `sm` `md` `lg` `xl` `2xl` `3xl` (12 to 36)
- `theme.radius`: `s` `m` `l` `full`
- `theme.shadow`: `s` `m` `l`

`createTheme({ hue, chroma, scheme, radius })` builds the same object outside React. Text and buttons meet WCAG AA contrast for every hue in both schemes; the test suite checks this.

## Components

207 components and hooks, grouped as in the [live catalog](https://colibri-kit.io/native/), where each one has a demo. Props are documented in the TypeScript declarations (`index.d.ts`, `types/`) and in the source comments.

| Group | Components and hooks |
|---|---|
| Basics | `Screen`, `Stack`, `Cluster`, `Divider`, `Text`, `Heading`, `Button`, `Card`, `Badge`, `Callout`, `Avatar`, `TextField`, `Switch`, `Checkbox`, `RadioGroup`, `Tabs`, `ListItem`, `List`, `Spinner`, `Progress`, `Dialog`, `Sheet`, `useToast`, `ToastProvider` |
| Phone patterns | `BottomBar`, `useTabActive`, `TabScreens`, `AppBarAction`, `useAppBarScroll`, `AppBar`, `Fab`, `ActionSheet`, `BottomSheet`, `SwipeGroup`, `SwipeRow`, `PullToRefresh`, `SearchBar`, `Chip`, `ChipGroup`, `PageDots`, `Banner` |
| Display | `Inset`, `Blockquote`, `Code`, `Lead`, `Small`, `Muted`, `Link`, `IconButton`, `Alert`, `Accordion`, `Collapsible`, `Toggle`, `ButtonGroup`, `Toolbar`, `ToolbarSeparator`, `ToolbarSpacer`, `Item`, `ItemGroup`, `ThemeSwitch` |
| Data display | `Table`, `DataTable`, `DataList`, `Carousel`, `MessageScroller`, `CodeBlock`, `Rating`, `Skeleton`, `SkeletonText`, `Empty` |
| Overlays and menus | `AlertDialog`, `Drawer`, `Popover`, `DropdownMenu`, `ContextMenu`, `Tooltip` |
| Navigation | `Menu`, `Pagination`, `useScrollSpy`, `ScrollSpy`, `ScrollSpySection`, `ScrollTo`, `Sidebar`, `Stepper`, `TabView`, `TabNav` |
| Forms | `useField`, `Field`, `InputAddon`, `Input`, `InputGroup`, `Textarea`, `PasswordInput`, `PinInput`, `Select`, `Combobox`, `CheckboxGroup`, `CheckboxCards`, `RadioCards`, `ToggleGroup`, `SegmentedControl` |
| Pickers | `Slider`, `Calendar`, `DatePicker`, `ColorPicker`, `FileInput`, `ImageInput`, `Repeater`, `Sortable` |
| Conversation | `BubbleGroup`, `Bubble`, `Message`, `Marker`, `TraceStep`, `Trace`, `Attachment`, `Questionnaire`, `ChartLegend`, `Chart` |
| AI elements | `Reasoning`, `ChainOfThought`, `Task`, `Plan`, `Subagent`, `Tool`, `Terminal`, `StackTrace`, `TestResults`, `Queue`, `Checkpoint`, `Confirmation`, `Context`, `FileTree`, `InlineCitation`, `CitationPreview`, `Sources`, `Suggestion`, `ModelSelector`, `PromptInput`, `AiMessage`, `Chat` |
| Motion and theming | `useReducedMotion`, `Enter`, `Presence`, `MotionPressable`, `MotionLoop`, `useMotion`, `Collapse`, `ThemeScope` |
| Sign-in and sign-up blocks | `AuthLink`, `AuthBrand`, `AuthHeader`, `AuthCard`, `OrDivider`, `SocialButton`, `AuthLegal`, `AuthCover`, `AuthField`, `AuthCodeInput`, `Login01`, `Login02`, `Login03`, `Login04`, `Login05`, `Signup01`, `Signup02`, `Signup03`, `Signup04`, `Signup05` |
| Navigation layouts | `useNav`, `NavBarButton`, `NavPopover`, `NavMenuItem`, `NavItem`, `NavCheckItem`, `NavSection`, `NavList`, `NavSearch`, `NavSwitcher`, `NavUser`, `NavCalendar`, `NavStackScreen`, `NavShell`, `SectionedDrawer`, `NestedDrawer`, `WorkspaceDrawer`, `MailLayout`, `CalendarDrawer`, `FileTreeDrawer`, `SettingsSheet` |
| Application components | `ApplicationShell`, `ApplicationMetrics`, `ApplicationChart`, `ApplicationTable`, `ApplicationBoard`, `ApplicationProjects`, `ApplicationPlanner`, `ApplicationIdentity`, `ApplicationProducts`, `ApplicationReceipt`, `ApplicationConversation`, `ApplicationForm`, `ApplicationPhoto`, `ApplicationArticle` |

Shared conventions:

- `gap` takes a space token (`"3xs"` … `"2xl"`) or a number.
- `variant` is `solid`, `soft`, `outline`, `ghost` or `danger`; `size` is `s`, `m` or `l`.
- `tone` is `accent`, `ok`, `warn` or `bad` (`success`, `warning` and `danger` also work).
- Controls take `value` + `onChange`, and most also work uncontrolled with `defaultValue`. Overlays take `visible` + `onClose` or `open` + `onOpenChange`.
- Every component takes `style` for one-off changes.

### What React Native core cannot do, and how the package handles it

- **Pickers and clipboard.** Core has no file picker, image picker or clipboard. `FileInput`, `ImageInput` and the copy buttons take a callback (`onPick`, `onCopy`) that your app wires to its own library.
- **Charts.** React Native has no SVG built in, so `Chart` and `ApplicationChart` draw bar, stacked, sparkline and share charts from views. Line, area and pie charts are not included.
- **Icons.** Icons are text glyphs or shapes drawn with views. Every component that shows an icon accepts your own element instead.
- **Safe areas.** Core cannot read the notch or home-indicator size. Bars and sheets take `topInset` / `bottomInset`; pass the values from `react-native-safe-area-context`.
- **Gestures.** Drags (bottom sheet, swipe rows, sortable, slider) use `PanResponder`, which tracks the finger on the JavaScript thread. Animations themselves run on the native thread.

### Web components that were not ported

These exist in the web catalog and were left out on purpose, because they do not fit a phone or React Native already does the job:

| Web component | Reason |
|---|---|
| Keyboard key, command palette | Keyboard-driven desktop patterns |
| Hover card | No hover on a touch screen |
| Resizable panes, navigation menu, breadcrumb | Desktop layouts; phones use a back button and the vertical `Menu` |
| Nine of the sixteen sidebar blocks | They differed only by desktop traits (floating panel, icon rail, right-hand or double sidebar, sticky site header). The seven phone layouts in "Navigation layouts" replace all sixteen |
| Sticky, scroll area, aspect ratio, direction | Built into React Native (`stickyHeaderIndices`, `ScrollView`, `aspectRatio`, `I18nManager`) |
| Accessible icon, label, separator, native select | Covered by `accessibilityLabel`, `Field`, `Divider` and `Select` |
| Reparent and the twelve Colibri CSS entries | Web-only mechanics and CSS documentation |

## How it was tested

The package is tested through react-native-web in a real browser: palette parity with Colibri CSS, every demo in the catalog opened with no errors or warnings, the basics exercised end to end, and each group's interactions exercised while it was built. It has not yet been run on an iOS or Android device by the maintainers; `examples/native` is an Expo app for that. Please report device-specific issues.

## Licence

MIT

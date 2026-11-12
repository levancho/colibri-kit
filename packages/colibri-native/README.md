# @colibri-kit/native

Colibri for React Native and Expo. A small set of layout primitives and everyday controls, themed from one hue.

- **One hue, whole palette.** The colours are the same ones Colibri CSS produces for that hue, in light and dark.
- **No dependencies** beyond `react` and `react-native`. No native modules, so it works in Expo Go.
- **No build step and no configuration.** Plain JavaScript, with TypeScript declarations included.
- **The same words as the web kit:** `gap="s"`, `variant="soft"`, `tone="ok"`, `size="l"`.
- **Accessible by default:** roles, states, labels and 44-point touch targets.

Live demo (the real components, running through react-native-web): https://colibri-kit.io/native/

## Install

```sh
npm install @colibri-kit/native
```

Requires React Native 0.71 or newer (Expo SDK 48 or newer).

## Use

```jsx
import { ColibriProvider, ToastProvider, Screen, Stack, Heading, Text, Button, useToast } from "@colibri-kit/native";

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

| Component | Main props |
|---|---|
| `Screen` | `scroll`, `padded`, `gap` |
| `Stack` | `gap`, `align`, `justify` (a column) |
| `Cluster` | `gap`, `align`, `justify`, `wrap` (a wrapping row) |
| `Divider` | |
| `Text` | `size`, `tone` (`muted`, `accent`, `ok`, `warn`, `bad`), `weight`, `align` |
| `Heading` | `level` 1 to 4 |
| `Button` | `title`, `variant` (`solid`, `soft`, `outline`, `ghost`, `danger`), `size` (`s`, `m`, `l`), `icon`, `loading`, `disabled`, `block` |
| `Card` | `gap`, `padded`, `onPress` |
| `Badge` | `tone` |
| `Callout` | `tone`, `title` |
| `Avatar` | `name`, `source`, `size` |
| `TextField` | `label`, `hint`, `error`, plus every `TextInput` prop |
| `Switch` | `value`, `onValueChange`, `label` |
| `Checkbox` | `checked`, `onChange`, `label` |
| `RadioGroup` | `value`, `onChange`, `options` |
| `Tabs` | `value`, `onChange`, `options` (a segmented control) |
| `ListItem` | `title`, `subtitle`, `leading`, `trailing`, `onPress` |
| `List` | `FlatList` with dividers; every `FlatList` prop |
| `Spinner` | `size`, `tone` |
| `Progress` | `value` 0 to 1, `tone` |
| `Dialog` | `visible`, `onClose`, `title`, `actions`, `dismissible` |
| `Sheet` | `visible`, `onClose`, `title` |
| `ToastProvider`, `useToast` | `toast.show(message, { tone, duration })`, `toast.hide()` |

Tones accept `ok`, `warn`, `bad` and the aliases `success`, `warning`, `danger`. Every component takes `style` for one-off changes.

## How it was tested

The package is tested through react-native-web in a real browser: palette parity with Colibri CSS, every control in the showcase, and accessibility roles and states. It has not yet been run on an iOS or Android device by the maintainers; `examples/native` is an Expo app for that. Please report device-specific issues.

## Licence

MIT

# @colibri-kit/native-full

Colibri React Native Full: everything in [`@colibri-kit/native-core`](https://www.npmjs.com/package/@colibri-kit/native-core),
plus the components that need a library.

- **Gestures** (Reanimated 4+, Gesture Handler 3+): `BottomSheet` that hands over to its scrolling list, `Sheet` and
  `Drawer` with swipe to dismiss, `SwipeRow`, `Sortable`, `Slider`, `Carousel`, `AnimatedList`, `PressableScale`.
  They follow the finger on the UI thread.
- **Charts and icons** (react-native-svg): `LineChart`, `AreaChart`, `BarChart`, `PieChart`, `DonutChart`, `Sparkline`,
  `ProgressRing`, `Gauge`, and `Icon` with 66 outline icons.
- **Safe areas** (react-native-safe-area-context): `SafeScreen`, `SafeBottomBar`, `SafeAppBar`, `SafeFab`,
  `SafeActionSheet`, `SafeBottomSheet`, `SafeBanner`, `useInsets`.

Core and Full share names and props. A component that exists in both, such as `BottomSheet`, is the finger-driven
version here.

Documentation, live demos and the API reference: https://colibri-kit.io/native/docs/

## Install

```sh
npm install @colibri-kit/native-full
npx expo install react-native-reanimated react-native-gesture-handler react-native-svg react-native-safe-area-context
```

The first line installs this package, and Core with it. The second installs the four libraries it builds on, at
versions that match your Expo SDK. Without Expo, install them with npm and follow each one's setup page; Reanimated
needs its Babel plugin. The gesture components need Reanimated 4 or newer (which brings `react-native-worklets` and
the New Architecture) and Gesture Handler 3 or newer.

## Use

Wrap the app once at its root, then import everything from this package:

```jsx
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ColibriProvider, SafeAreaRoot, SafeScreen, Button, BottomSheet, LineChart } from "@colibri-kit/native-full";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaRoot>
        <ColibriProvider hue={160}>{/* your app */}</ColibriProvider>
      </SafeAreaRoot>
    </GestureHandlerRootView>
  );
}
```

Do not also install `@colibri-kit/native-core` at a different version: the theme is shared through Core, and two
copies would not see each other's provider.

## One part at a time

Each part has its own entry that needs only its own library:

| Import from | Needs |
|---|---|
| `@colibri-kit/native-full/gestures` | `react-native-reanimated`, `react-native-gesture-handler` |
| `@colibri-kit/native-full/svg` | `react-native-svg` |
| `@colibri-kit/native-full/safe-area` | `react-native-safe-area-context` |

The main entry (`@colibri-kit/native-full`) imports all three, so it needs all four libraries.

## How it was tested

Through react-native-web in a real browser: every demo opened with no errors or warnings, the gesture components
dragged with a mouse, the charts checked against their data. It has not yet been run on an iOS or Android device by
the maintainers; UI-thread behaviour, the bottom sheet's hand-off to a scrolling list and gestures inside modals on
Android are the things to check first.

## Licence

MIT

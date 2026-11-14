# How @colibri-kit/native is built

Read this before adding or changing a component.

## Rules

1. **No dependencies.** Only `react` and `react-native` core. No `react-native-svg`, no gesture or animation
   libraries, no icon fonts, no native modules. It must run in Expo Go. Icons are text glyphs (`GLYPH` in
   `src/internal.js`) or shapes drawn with `View`.
2. **No JSX and no build step in `src/`.** Use `createElement` (imported as `h`). Demos in `examples/native` may use JSX.
3. **Every colour, space, radius and font size comes from the theme** (`useTheme()`). No hard-coded colours except
   pure white/black where a token cannot apply (for example a switch thumb). Check light and dark.
4. **Same vocabulary as the web kit.** `gap="s"`, `variant="solid|soft|outline|ghost|danger"`, `size="s|m|l"`,
   `tone="accent|ok|warn|bad"` (resolve with `toneName`, which also accepts success, warning, danger).
   Name a component after its web catalog entry in PascalCase (`dropdown-menu` → `DropdownMenu`).
5. **Controlled, plain props.** `value` + `onChange` (or `visible` + `onClose`, `open` + `onOpenChange`). Where it is
   cheap, also work uncontrolled with `defaultValue`. Compose with `children`; pass `style` through to the root.
6. **Accessible.** Set `accessibilityRole`, `accessibilityLabel` and `accessibilityState`, and pass the same state as
   `aria-*` props (`aria-checked`, `aria-selected`, `aria-expanded`, `aria-disabled`) so it reaches the web too.
   Touch targets are at least `theme.touch` (44) high, or use `hitSlop`.
7. **Web is a test target, not a product.** Code must run under react-native-web without errors or warnings
   (the test suite renders every demo that way), but design for phones.
8. **Honest scope.** If a web component depends on something a phone does not have (hover, right-click, a file
   picker, SVG), build the nearest touch equivalent and say so in a comment and in the demo description. Take
   system pickers as callbacks (`onPick`) instead of importing a native module.

## Files

| File | Holds |
|---|---|
| `src/color.js`, `src/theme.js`, `src/provider.js` | palette maths, `createTheme`, `ColibriProvider`, `useTheme` |
| `src/internal.js` | shared helpers: `h` is not here (import `createElement as h` from react); `web`, `depth`, `gapOf`, `flat`, `InRow`, `selfAlign`, `GLYPH` |
| `src/components.js`, `src/overlays.js` | the basics: layout, text, Button, Card, form basics, Dialog, Sheet, toasts |
| `src/base.js` | display: surfaces, typography and small building blocks |
| `src/data.js` | tables, data lists, carousel, skeleton, empty state |
| `src/menus.js` | menus, popovers, tooltips, drawers and other things that open above the screen |
| `src/mobile.js` | phone-only patterns: bottom tab bar, app bar, floating action button, action sheet, swipe rows, bottom sheet with snap points |
| `src/navigation.js` | menu, pagination, stepper, sidebar drawer, content tabs, scrollspy |
| `src/forms.js` | inputs and selection controls |
| `src/pickers.js` | slider, calendar, date and colour pickers, file inputs, repeater, sortable |
| `src/conversation.js`, `src/ai.js` | messages, attachments, chart; AI elements |
| `src/motion.js` | entrance and state animation, scoped themes |
| `src/blocks.js` | sign-in and sign-up screens |
| `src/sidebars.js` | sidebar and navigation layouts |
| `src/applications.js` | dashboard pieces |
| `types/<file>.d.ts` | TypeScript declarations for the matching `src/<file>.js` |
| `index.d.ts`, `src/index.js` | re-export everything; a group file only needs `export` statements |

Reuse what exists: build on `Stack`, `Cluster`, `Text`, `Button`, `Card`, `Dialog`, `Sheet` from `components.js`
and `overlays.js` instead of re-implementing them. A group file may import from the basics and from `internal.js`;
group files should not import from each other unless the dependency is listed here:
`blocks.js`, `sidebars.js` and `applications.js` are written against the basics only, so they can be built in parallel with the rest.

## Optional entries

The main entry (`@colibri-kit/native`) must never import anything but `react` and `react-native`. Three separate
entries add what core React Native cannot do; each needs its library installed, and is imported by its own path:

| Entry | Needs | Holds |
|---|---|---|
| `@colibri-kit/native/gestures` (`src/gestures/`) | `react-native-reanimated` 4+ (with `react-native-worklets`), `react-native-gesture-handler` 3+ | finger-driven versions of sheets, rows, sliders, sortable lists, the board; layout animation |
| `@colibri-kit/native/svg` (`src/svg/`) | `react-native-svg` | line, area and pie charts, rings, sparklines, an icon set |
| `@colibri-kit/native/safe-area` (`src/safe-area/`) | `react-native-safe-area-context` | screens and bars that read the real insets |

Rules for these entries:

- A component that upgrades a core one keeps **the same name and props**, so switching is a change of import path:
  `import { BottomSheet } from "@colibri-kit/native/gestures"`. Extra props are allowed; removing or renaming is not.
- An optional entry may import from the main entry's files (`../components.js`, `../theme.js`, …) but never the
  reverse, and optional entries do not import each other.
- Reanimated: **always pass a dependency array that lists every shared value the function reads** to
  `useAnimatedStyle`, `useDerivedValue`, `useAnimatedReaction` and friends (an empty array never updates without the
  Babel plugin), and put `"worklet";` as the first line of every function that runs on the UI thread (gesture callbacks,
  animated-style functions, helpers they call). The web test build has no Babel plugin, so code that relies on the
  plugin to infer either of these breaks there; code written this way works with and without it.
- No per-frame React state. Shared values drive everything during a gesture; call `runOnJS` once, on release.
- The types file for an entry is `types/<entry>.d.ts`.

The Full entry (`@colibri-kit/native/full`, `src/full/index.js`, `types/full.d.ts`) is generated by
`tools/native-full.mjs` from the other entries: everything in Core, the SVG and safe-area entries, and the gesture
versions in place of the Core components that share their names. Do not edit it by hand; `npm run build` rewrites it.
The gestures entry uses the Gesture Handler 3 hook API and `scheduleOnRN` from `react-native-worklets`.

## Demos

Each component has a demo in `examples/native/demos/<group>.js`: an array of
`{ id, title, description, Demo, fullscreen? }`. Set `fullscreen: true` for a whole screen (an app frame, a navigation
layout): the demo then fills the phone below the title bar instead of sitting in the padded, scrolling page, so it
must use `flex: 1` and never a fixed height. `id` is the web catalog name (`dropdown-menu`); `description` is one plain
sentence; `Demo` is a component that shows realistic content and lets the reader operate it. See
`examples/native/demos/core.js` for the style. The catalog app and the site page are generated from these arrays.

## Checking your work

```sh
node tools/native-smoke.mjs <group>                 # opens every demo of the group, fails on errors or warnings
node tools/native-smoke.mjs <group> --shots <dir>   # also saves light and dark screenshots to look at
node --test test/native-theme.test.js
```

The smoke tool builds its own bundle in a temporary folder, so it is safe to run while others work.

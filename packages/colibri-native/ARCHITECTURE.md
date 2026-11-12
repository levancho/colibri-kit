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
| `src/navigation.js` | breadcrumb, pagination, stepper, sidebar, command palette … |
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

## Demos

Each component has a demo in `examples/native/demos/<group>.js`: an array of
`{ id, title, description, Demo }`. `id` is the web catalog name (`dropdown-menu`); `description` is one plain
sentence; `Demo` is a component that shows realistic content and lets the reader operate it. See
`examples/native/demos/core.js` for the style. The catalog app and the site page are generated from these arrays.

## Checking your work

```sh
node tools/native-smoke.mjs <group>                 # opens every demo of the group, fails on errors or warnings
node tools/native-smoke.mjs <group> --shots <dir>   # also saves light and dark screenshots to look at
node --test test/native-theme.test.js
```

The smoke tool builds its own bundle in a temporary folder, so it is safe to run while others work.

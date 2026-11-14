---
name: colibri-kit
description: Build and maintain interfaces with Colibri Kit components, CSS tokens, layouts and themes. Use when the user requests Colibri or the project already uses Colibri CSS or UI. Covers HTML, React, FreeMarker and Thymeleaf without adding Tailwind.
version: 1.5.0
license: MIT
---
# Colibri Kit

Colibri Kit is a UI library for web applications. It combines reusable components, layouts and themes through two independently usable layers:

- **Colibri CSS** (`packages/colibri-css/dist/colibri.css`): one stylesheet with cascade layers, OKLCH `--c-*` tokens, `light-dark()` dark mode, fluid type/space, layout primitives (`.stack .cluster .grid .split .switcher .center .cover .frame .reel .bleed .container .prose`) and a few components (`.btn .card .badge .field .callout`).
- **Colibri UI** (`src/`, `themes/colibri.css`, `freemarker/ui.ftl`): headless behaviour with keyboard, focus and ARIA support. Mark a root with `data-ui="name"`, its pieces with `data-ui-part="part"`. Works in plain HTML, FreeMarker and React.

Repo: https://github.com/levancho/colibri-kit · Docs and live examples: https://colibri.l3v.ai

Read only the references needed for the task: [components](reference/components.md) for names and parts, [tokens](reference/tokens.md) for styles and layout, [theme packs](reference/theme-packs.md) for theming, and [maintenance](reference/maintenance.md) for composition, overrides, interactive demos and maintainer checks. These files ship with the skill; do not assume the full repository is installed beside it.

## 1. Install (no build step)

Locate the project’s existing Colibri checkout or vendor folder first. The packages are `@colibri-kit/ui` and `@colibri-kit/css`, always at the same version. Both are published on npm: install with `npm install @colibri-kit/ui @colibri-kit/css`, start a plain-HTML project with `npx -p @colibri-kit/ui colibri init --starter`, or link pinned files from a CDN (`https://cdn.jsdelivr.net/npm/@colibri-kit/ui@<version>/…`). Check the current version with `npm view @colibri-kit/ui version` and keep the two packages on the same one. A pinned repository checkout remains valid for unreleased revisions. Never install or run the unscoped names `colibri` or `colibri-ui`: they are unrelated packages. Run the CLI as `npx -p @colibri-kit/ui colibri <command>` (or `node <checkout>/bin/colibri.mjs <command>`). In a bundler, `import { init, registry, controllers, toast } from "@colibri-kit/ui"` has no side effects; `@colibri-kit/ui/core/auto` and `@colibri-kit/ui/lazy` initialise the page. Plain HTML consumers need no build step; maintaining generated distributions does require the repository build. Link local files:

```html
<link rel="stylesheet" href="themes/colibri.css">                              <!-- Colibri UI tokens -->
<link rel="stylesheet" href="packages/colibri-css/dist/colibri.css">           <!-- Colibri CSS -->
<link rel="stylesheet" href="packages/colibri-css/dist/colibri-ui-bridge.css"> <!-- one palette for both -->
<link rel="stylesheet" href="themes/motion.css">                               <!-- optional motion presets -->
<script type="module" src="src/core/auto.js"></script>                         <!-- auto-inits every data-ui -->
<body class="ui-root">
```

The bridge maps `--c-*` to `--ui-*` in its own cascade layer. Include it when both packages should share a palette.
Optional custom elements for every component: `import "./src/elements/all.js"` gives `<ui-tabs>`, `<ui-dialog>`, … (light DOM, same core).

If the repo is present, ask the CLI instead of guessing: `node bin/colibri.mjs info --json`, `colibri search "<need>"`, `colibri view <name>` (exact HTML + FreeMarker), `colibri docs <name>` (keys/ARIA). An MCP server ships as `bin/colibri-mcp.mjs`.

Java templates require a server-side engine. Colibri supplies macros/fragments, not FreeMarker or Thymeleaf engine classes. Use the host's `spring-boot-starter-freemarker` / `spring-boot-starter-thymeleaf`, or explicit plain-Java engine dependencies. The templates are on Maven Central as `ai.l3v.colibri:colibri-templates` (resources under `templates/colibri/`, no Java classes, no transitive dependencies); add it as an ordinary dependency. FreeMarker hosts should declare HTML output format; macros preserve auto-escaping. Use captured markup/nested bodies for trusted structure, never raw user HTML. Thymeleaf provides native parameterized fragments in `thymeleaf/` and a Spring field fragment for binding/validation. Other gallery examples use plain HTML directly; do not describe them as additional typed integrations.

## 2. Styling model

1. **Semantic HTML first.** `<button>`, `<dialog>`, `<table>`, `<label>`, `<nav>`; base styles already look finished.
2. **Layout = primitives**, tuned with custom properties, not extra classes: `<div class="grid" style="--min: 18rem">`, `<div class="stack" data-gap="l">`.
3. **Variants = attributes**: `data-variant="ghost|outline|soft|danger"`, `data-size="s|l"`, `data-tone="ok|warn|bad|accent"`, `data-gap="3xs…2xl"`.
4. **Design = tokens**: change `--c-hue` to rebrand; override tokens on `:root` or any subtree. CSS core, UI theme, packs, bridge and looks use ordered cascade layers. Ordinary unlayered application rules override their normal declarations without specificity escalation. Preserve deliberate hidden-state, touch-target and reduced-motion safeguards. For local palette overrides, add `data-colibri-theme` to the container so derived tokens are recomputed.

Keep repeated product UI in named components or template partials. Do not replace utility strings with repeated inline presentation styles. Inline custom properties are appropriate for data such as chart values; stable layout and presentation belong in CSS. Keep helpers limited to `.visually-hidden`, `.muted`, `.flow` and `.truncate`; do not generate a second utility framework. Preserve an existing project’s chosen stack unless a migration is requested.

## 3. Components (headless)

```html
<div data-ui="dialog">
  <button class="btn" data-ui-part="trigger">Edit profile</button>
  <dialog data-ui-part="content" class="card stack">
    <h2 data-ui-part="title">Profile</h2>
    <p data-ui-part="description">Update your details.</p>
    <form method="dialog" class="cluster">
      <button value="cancel" class="btn" data-variant="ghost">Cancel</button>
      <button value="save" class="btn">Save</button>
    </form>
  </dialog>
</div>
```

- Expose semantic state through `data-state`, `aria-*` and `hidden`. Do not duplicate it with presentation classes. Library controllers may write custom properties for measured geometry; keep that distinct from application styling.
- Events are bubbling, `ui:`-prefixed CustomEvents (`ui:change`, `ui:open`, `ui:close`, `ui:beforeclose`, `ui:submit`, `ui:select`…). Cancelable ones honour `preventDefault()`.
- After inserting HTML yourself: `document.dispatchEvent(new Event("ui:refresh"))` (htmx swaps are handled automatically).
- Each component's events, `event.detail` keys and controller members are listed by `colibri docs <name>` and in the generated table at the end of `reference/components.md`. Reach a live controller with `controllers(el)[0]` (exported by `core/util.js`, `core/auto.js`, `core/auto-lazy.js`), e.g. `controllers(seg)[0].value = "week"`.
- To load less JavaScript, use `dist/lazy/auto-lazy.js` (fetches only the controllers a page uses) or `dist/colibri-ui.min.js` (everything, minified) in place of `src/core/auto.js`. One of the three per page; mixing them loads two copies of the controller state. The lazy loader is asynchronous: wait for the document's `ui:ready` event (or the promise from `init(scope)`) before calling `controllers(el)`. If a chunk cannot be loaded, `ui:error` bubbles with `{ name, error }` and `ui:ready`'s `detail.failed` lists the names.
- Panels: `sheet` and `drawer` can be dragged away from their edge. Controls inside them (options, labels, tabs, links) keep working; add a `data-ui-part="handle"` element to give users an obvious grip, `data-drag="false"` to turn dragging off, and `data-dismissible="false"` for a panel that must not be dismissed.
- `item-group` rows with `data-href` navigate only to `http(s)` URLs. Never rely on `data-href` (or any attribute) to carry a `javascript:` URL.
- Pick components from `reference/components.md`; do not invent `data-ui` names. Layout wrappers are classes.

## 4. Theming, light/dark

- Rebrand: `:root { --c-hue: 160; }`. Force a scheme on any subtree: `data-theme="dark|light"` (default follows the OS).
- Accent presets (Colibri UI): `<html data-ui-theme="blue|green|rose|orange|violet">`.
- Theme packs: link `themes/packs/index.css` and set `<html data-kit-theme="glacier|ember|midnight">`. See `reference/theme-packs.md`.
- Use semantic tokens (`--c-muted`, `--c-bad`, `--ui-muted-foreground`, `--ui-destructive`), never raw hex in components.

## 5. React

```js
import { Dialog, Tabs, Part, UI, useColibri, cx } from "@colibri-kit/ui/react";

<Dialog onClose={(e) => save(e)}>
  <Part name="trigger" as="button" className="btn">Invite</Part>
  <Part name="content" as="dialog" className="card stack">…</Part>
</Dialog>
<UI kind="accordion" type="multiple" onChange={(e) => …}>…</UI>
```

Same primitives and attributes as HTML (`className="stack card"`, `data-gap="m"`, `data-variant="ghost"`). React is an optional peer dependency; JSX examples need the application’s JSX tooling. Do not also run `auto.js` on React-owned roots. The adapter refreshes a controller only when the DOM under its root changed, so event handlers may set state freely; a remote `datatable` emits `ui:query` once per user action and must be given new rows by rendering them, not by calling `refresh()`. The React adapter and automatic initializer import the full registry; explicit core-controller imports are the smaller integration for a few controls. Verify rerenders and teardown in the actual React integration.

### React Native

React Native has no HTML or CSS, so it uses a separate package, `@colibri-kit/native` (`packages/colibri-native/`), with the same vocabulary as props: `<Stack gap="m">`, `<Button variant="soft" size="l">`, `<Badge tone="ok">`. Wrap the app in `<ColibriProvider hue={…} scheme="auto|light|dark" radius="sharp|soft|round">` (and `<ToastProvider>` for `useToast()`); read tokens with `useTheme()` (`theme.colors.accent`, `theme.space.m`, `theme.radius.l`). Never use `className`, `data-*` attributes, Colibri CSS files or `@colibri-kit/ui` in React Native code. It comes in two forms with the same names and props. **Light** (`@colibri-kit/native`) has no dependencies beyond `react` and `react-native`. **Full** (`@colibri-kit/native/full`) adds what needs a library: finger-driven BottomSheet, Sheet, Drawer, SwipeRow, Sortable, Slider, Carousel, AnimatedList and PressableScale (Reanimated 4+ and Gesture Handler 3+), LineChart, AreaChart, BarChart, PieChart, DonutChart, Sparkline, ProgressRing, Gauge and Icon (react-native-svg), and SafeScreen, SafeBottomBar, SafeAppBar and friends (react-native-safe-area-context). The parts are also separate entries: `/gestures`, `/svg`, `/safe-area`. Check which libraries the project has installed before choosing: import from the Light entry unless they are present or the user asks for Full, and never add those libraries without saying so. Full needs `GestureHandlerRootView` and a safe-area provider at the app root.

It covers the catalog in groups: basics (Screen, Stack, Cluster, Text, Heading, Button, Card, Badge, Callout, Avatar, TextField, Switch, Checkbox, RadioGroup, Tabs, ListItem, List, Spinner, Progress, Dialog, Sheet, toasts); phone patterns (BottomBar + TabScreens, AppBar, Fab, ActionSheet, BottomSheet, SwipeRow, PullToRefresh, SearchBar, Chip, PageDots, Banner); display (Accordion, Alert, Collapsible, Link, Inset, IconButton, Toggle, Item, ButtonGroup, Toolbar, ThemeSwitch, typography helpers); data (Table, DataTable, DataList, Carousel, MessageScroller, CodeBlock, Rating, Skeleton, Empty); overlays (AlertDialog, Drawer, Popover, DropdownMenu, ContextMenu, Tooltip); navigation (Menu, Pagination, Sidebar, Stepper, TabView, TabNav, ScrollSpy, ScrollTo); forms (Input, Field, InputGroup, Textarea, PasswordInput, PinInput, Select, Combobox, CheckboxGroup, CheckboxCards, RadioCards, ToggleGroup, SegmentedControl); pickers (Slider, Calendar, DatePicker, ColorPicker, FileInput, ImageInput, Repeater, Sortable); conversation (Bubble, Message, Marker, Trace, Attachment, Questionnaire, Chart); AI elements (Chat, AiMessage, PromptInput, Reasoning, Tool, Task, Plan, Sources, Terminal and the rest); motion (Enter, Presence, MotionPressable, MotionLoop, useMotion, Collapse, ThemeScope); screens (Login01–05, Signup01–05, and phone navigation layouts built on NavShell: SectionedDrawer, NestedDrawer, WorkspaceDrawer, MailLayout, CalendarDrawer, FileTreeDrawer, SettingsSheet); and application components (ApplicationShell … ApplicationArticle, same `{ model, onAction, onSubmit }` contract as the web).

Rules that differ from the web: file, image and clipboard actions are callbacks the app supplies (`onPick`, `onCopy`); charts are bar-based (no SVG); bars and sheets take `topInset` / `bottomInset`; these web entries have no native version, so do not look for them: kbd, hover-card, resizable, breadcrumb, command, navigation-menu, sticky, scroll-area, aspect-ratio, direction, accessible-icon, label, separator, native-select. See `packages/colibri-native/README.md` for the full list and `ARCHITECTURE.md` before adding a component.

## 6. FreeMarker (Spring)

`[#import "/colibri/freemarker/ui.ftl" as ui]` then e.g. `[@ui.field label="Email"][@ui.input name="email" type="email" required=true/][/@ui.field]`, `[@ui.dialog trigger="Edit" title="Profile"]…[/@ui.dialog]`, `[@ui.button variant="ghost"]Cancel[/@ui.button]`. Always use named arguments; `name=` attributes stay yours for Spring binding.

Rules that keep FreeMarker output safe and correct:
- The host template must produce HTML: save it as `.ftlh` or keep `[#ftl output_format="HTML"]`. Macro parameters are always escaped, but text written inside a macro body is evaluated by the host and is unescaped without it.
- URL parameters (`href`, `src`, form `action`) are escaped, not vetted. Build them from application routes; validate the scheme before passing a user-supplied URL. The same holds for the Thymeleaf fragments.
- Pass numbers as numbers. The macros write them for the browser (`1500`, `12.5`) in every locale; format a number for display yourself and pass that as a string.
- `calendar` and `datePicker` follow the page's `<html lang>` unless you pass `locale=`.

## 7. Recipes

**Page shell**
```html
<body class="ui-root">
  <div class="split" style="--side: 15rem">
    <nav class="stack" aria-label="Main">…</nav>
    <main class="center stack" data-gap="l">…</main>
  </div>
</body>
```
For full app shells copy a block: `sidebar-01` … `sidebar-16`; auth pages `login-01…05`, `signup-01…05` (`colibri view sidebar-07`).

**Form**
```html
<form class="stack" data-gap="m">
  <div data-ui="field">
    <label data-ui-part="label">Email</label>
    <input data-ui-part="control" type="email" name="email" required>
    <p data-ui-part="description">We never share it.</p>
    <p data-ui-part="error"></p>
  </div>
  <div class="cluster"><button class="btn">Save</button><button type="reset" class="btn" data-variant="ghost">Reset</button></div>
</form>
```
`field` wires ids, `aria-describedby`, `aria-invalid`; server errors: add `data-invalid` and fill `error`.

**Dashboard cards**
```html
<section class="grid" style="--min: 16rem">
  <article class="card stack" data-gap="xs">
    <h3 class="muted">Revenue</h3><p class="revenue-value">$48.2k</p>
    <span class="badge" data-tone="ok">+12%</span>
  </article>
</section>
```
Define `.revenue-value { font-size: var(--c-text-2xl); }` in the application stylesheet. Label example metrics as sample data. The grid adapts to available width; test its actual container at narrow sizes. See [maintenance](reference/maintenance.md) before copying the interactive dashboard demos.

**Data table**: use `data-ui="datatable"` (alias `data-table`) for sorting, selection, search and paging; it emits `ui:sort`, `ui:select`, `ui:query` (add `data-remote` to page server-side). Run `colibri view datatable` for the exact parts. Plain `<table>` is already styled for read-only data.

**Dialog / confirm**: `dialog` above; destructive confirmations use `alert-dialog`; side panels `sheet` / `drawer`; toasts `toaster`.

## 8. Do / don't

- Do: semantic elements, primitives + custom properties, `data-*` variants, tokens, one `data-ui` per behaviour.
- Class names: Colibri CSS owns `.card`, `.stack`, `.center`, `.badge`, `.flow`, `.muted` and the rest of the list in `reference/tokens.md`. Never reuse them for unrelated application classes; run `colibri collisions app.css` after writing application CSS (it also catches compound selectors such as `div.card`). The prefixed stylesheet (`colibri.prefixed.css`, `.c-*`) renames the core stylesheet only: theme packs, application components, the React adapter and the server templates still emit `btn`, `card`, `stack`, so do not combine it with those.
- `.btn` is a Colibri CSS component and keeps its own variants (`ghost|outline|soft|danger`) and sizes (`s|l`) inside `.ui-root`. A bare `<button>` or `data-ui="button"` gets the UI theme's look and its vocabulary (`outline|ghost|secondary|destructive`, `data-size="sm"`). Pick one per button; do not mix the two sets of attribute values.
- Link `colibri.min.css` freely: it is produced by a real minifier and renders identically to `colibri.css`.
- Avoid: long utility chains, repeated inline presentation, specificity escalation, raw brand colors in component rules, and invented `data-ui` names for layout. Fix the owning component instead of appending overrides. Do not remove deliberate hidden-state, touch-target or reduced-motion safeguards simply to reduce important-declaration counts.
- Accessibility: every interactive element keyboard-reachable and labelled; keep `<label>`s, `aria-label` on icon buttons, use `dialog`/`alert-dialog` (focus trap + return built in). Verify reduced motion, visible focus, contrast and keyboard behavior. Existing ARIA wiring and browser tests are not screen-reader certification. Check `colibri docs <name>` for expected keys.
- Before finishing: use checks appropriate to the change. In the Colibri repository, run `npm test`, `npm run build`, `npm run check:architecture` and relevant browser tests (`npm run test:e2e` for shared-style changes). Edit source/generators, not generated copies. Report what was tested and whether changes are local, committed, merged or deployed; skill updates do not themselves publish a marketplace release.

## Consumer installation and upgrades
For a new plain HTML project, run `npx -p @colibri-kit/ui colibri init --starter` (or `node <checkout>/bin/colibri.mjs init --starter`) from the app's static root, then serve it over HTTP. This copies CSS, UI, FreeMarker and Thymeleaf and creates app-owned files. Omit `--starter` in existing apps. `--dir assets/colibri` updates starter paths. The installer refuses conflicting files before writing; inspect `diff`, back up changes and only use `--force` deliberately. Never force starter files over an existing app. Load CSS, UI theme, bridge and application CSS in that order. The bridge maps `--c-*` tokens to UI controls; keep branding in application CSS. The starter persists locally only; connect real APIs in the host. See https://colibri.l3v.ai/getting-started.html for complete installation, React, lifecycle and troubleshooting. Repository checks include `npm run test:consumer`, which installs packed archives and tests the resulting app outside the checkout.

## Application adapters and support contracts

Read [application components](reference/applications.md) before building dashboards or using the native application adapters. React requires version 18 or newer. Check each registry entry’s `support` and `adapters` fields; static HTML is not a parameterized Java API. Form callbacks retain native `formData` and `submitter`; repeated convenience values are arrays. Use explicit record/reset keys or controlled values for React form state.

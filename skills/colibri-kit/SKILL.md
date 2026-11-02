---
name: colibri-kit
description: Build web UIs with Colibri Kit (Colibri CSS tokens and layout primitives plus headless data-ui / <ui-*> components, no build step); use when a project includes colibri.css, themes/colibri.css, data-ui attributes, @colibri-kit/ui, or the user asks for a Colibri page, form, dashboard, dialog, table or theme.
---
# Colibri Kit

Colibri Kit is two no-build packages that work together:

- **Colibri CSS** (`packages/colibri-css/dist/colibri.css`): one stylesheet with cascade layers, OKLCH `--c-*` tokens, `light-dark()` dark mode, fluid type/space, layout primitives (`.stack .cluster .grid .split .switcher .center .cover .frame .reel .bleed .container .prose`) and a few components (`.btn .card .badge .field .callout`).
- **Colibri UI** (`src/`, `themes/colibri.css`, `freemarker/ui.ftl`): headless, accessible behaviour. Mark a root with `data-ui="name"`, its pieces with `data-ui-part="part"`. Works in plain HTML, FreeMarker and React.

Repo: https://github.com/levancho/colibri-kit · Docs and live examples: https://colibri.l3v.ai

Details live in `reference/`: `components.md` (every component, parts, ARIA/attributes, blocks), `tokens.md` (all tokens and primitives), `theme-packs.md` (theming and writing a pack).

## 1. Install (no build step)

Copy or clone the repo (or vendor the folders you need) and link the files:

```html
<link rel="stylesheet" href="themes/colibri.css">                              <!-- Colibri UI tokens -->
<link rel="stylesheet" href="packages/colibri-css/dist/colibri.css">           <!-- Colibri CSS -->
<link rel="stylesheet" href="packages/colibri-css/dist/colibri-ui-bridge.css"> <!-- one palette for both -->
<link rel="stylesheet" href="themes/motion.css">                               <!-- optional motion presets -->
<script type="module" src="src/core/auto.js"></script>                         <!-- auto-inits every data-ui -->
<body class="ui-root">
```

Load order matters: the bridge goes after `themes/colibri.css` so `--ui-*` follows `--c-*`.
Optional custom elements for every component: `import "./src/elements/all.js"` gives `<ui-tabs>`, `<ui-dialog>`, … (light DOM, same core).

If the repo is present, ask the CLI instead of guessing: `node bin/colibri.mjs info --json`, `colibri search "<need>"`, `colibri view <name>` (exact HTML + FreeMarker), `colibri docs <name>` (keys/ARIA). An MCP server ships as `bin/colibri-mcp.mjs`.

## 2. Styling model

1. **Semantic HTML first.** `<button>`, `<dialog>`, `<table>`, `<label>`, `<nav>`; base styles already look finished.
2. **Layout = primitives**, tuned with custom properties, not extra classes: `<div class="grid" style="--min: 18rem">`, `<div class="stack" data-gap="l">`.
3. **Variants = attributes**: `data-variant="ghost|outline|soft|danger"`, `data-size="s|l"`, `data-tone="ok|warn|bad|accent"`, `data-gap="3xs…2xl"`.
4. **Design = tokens**: change `--c-hue` to rebrand; override tokens on `:root` or any subtree. Your unlayered CSS beats every layer, so no `!important`.

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

- State is in `data-state`, `aria-*` and `hidden`; never toggle classes or inline styles for state.
- Events are bubbling, `ui:`-prefixed CustomEvents (`ui:change`, `ui:open`, `ui:close`, `ui:beforeclose`, `ui:submit`, `ui:select`…). Cancelable ones honour `preventDefault()`.
- After inserting HTML yourself: `document.dispatchEvent(new Event("ui:refresh"))` (htmx swaps are handled automatically).
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

Same primitives and attributes as HTML (`className="stack card"`, `data-gap="m"`, `data-variant="ghost"`). React is an optional peer dependency; no JSX build is required by the library itself.

## 6. FreeMarker (Spring)

`[#import "/ui/ui.ftl" as ui]` then e.g. `[@ui.field label="Email"][@ui.input name="email" type="email" required=true/][/@ui.field]`, `[@ui.dialog trigger="Edit" title="Profile"]…[/@ui.dialog]`, `[@ui.button variant="ghost"]Cancel[/@ui.button]`. Always use named arguments; `name=` attributes stay yours for Spring binding.

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
    <h3 class="muted">Revenue</h3><p style="font-size: var(--c-text-2xl)">$48.2k</p>
    <span class="badge" data-tone="ok">+12%</span>
  </article>
</section>
```
Cards respond to their container (container queries), so the same markup works in a sidebar.

**Data table**: use `data-ui="datatable"` (alias `data-table`) for sorting, selection, search and paging; it emits `ui:sort`, `ui:select`, `ui:query` (add `data-remote` to page server-side). Run `colibri view datatable` for the exact parts. Plain `<table>` is already styled for read-only data.

**Dialog / confirm**: `dialog` above; destructive confirmations use `alert-dialog`; side panels `sheet` / `drawer`; toasts `toaster`.

## 8. Do / don't

- Do: semantic elements, primitives + custom properties, `data-*` variants, tokens, one `data-ui` per behaviour.
- Don't: Tailwind-style utility soup (`class="flex p-4 mt-2 text-sm …"`), `!important`, JS-driven styling, raw colours, new `data-ui` names for layout, Shadow DOM wrappers.
- Accessibility: every interactive element keyboard-reachable and labelled; keep `<label>`s, `aria-label` on icon buttons, use `dialog`/`alert-dialog` (focus trap + return built in). Motion and colours respect `prefers-reduced-motion` and `prefers-contrast`. Check `colibri docs <name>` for expected keys.
- Before finishing: run the project tests (`npm test`, `npm run test:e2e`) if present.

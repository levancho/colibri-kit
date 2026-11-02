---
name: colibri-kit
description: Build and maintain interfaces with Colibri Kit components, CSS tokens, layouts and themes. Use when the user requests Colibri or the project already uses Colibri CSS or UI. Covers HTML, FreeMarker and React without adding Tailwind.
---
# Colibri Kit

Colibri Kit is a UI library for web applications. It combines reusable components, layouts and themes through two independently usable layers:

- **Colibri CSS** (`packages/colibri-css/dist/colibri.css`): one stylesheet with cascade layers, OKLCH `--c-*` tokens, `light-dark()` dark mode, fluid type/space, layout primitives (`.stack .cluster .grid .split .switcher .center .cover .frame .reel .bleed .container .prose`) and a few components (`.btn .card .badge .field .callout`).
- **Colibri UI** (`src/`, `themes/colibri.css`, `freemarker/ui.ftl`): headless behaviour with keyboard, focus and ARIA support. Mark a root with `data-ui="name"`, its pieces with `data-ui-part="part"`. Works in plain HTML, FreeMarker and React.

Repo: https://github.com/levancho/colibri-kit · Docs and live examples: https://colibri.l3v.ai

Read only the references needed for the task: [components](reference/components.md) for names and parts, [tokens](reference/tokens.md) for styles and layout, [theme packs](reference/theme-packs.md) for theming, and [maintenance](reference/maintenance.md) for composition, overrides, interactive demos and maintainer checks. These files ship with the skill; do not assume the full repository is installed beside it.

## 1. Install (no build step)

Locate the project’s existing Colibri checkout or vendor folder first. For a new project, clone a pinned repository revision or vendor the required files. Do not assume the named npm packages are published; verify registry availability before recommending registry installation. Plain HTML consumers need no build step; maintaining generated distributions does require the repository build. Link local files:

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

Java templates require a server-side engine. Colibri supplies macros/fragments, not FreeMarker or Thymeleaf engine classes. Use the host's `spring-boot-starter-freemarker` / `spring-boot-starter-thymeleaf`, or explicit plain-Java engine dependencies. The supplemental `java/colibri-templates` Maven module packages resources under `templates/colibri/`; it is built/installed locally, not published to Maven Central. FreeMarker hosts should declare HTML output format; macros preserve auto-escaping. Use captured markup/nested bodies for trusted structure, never raw user HTML. Thymeleaf provides native parameterized fragments in `thymeleaf/` and a Spring field fragment for binding/validation. Other gallery examples use plain HTML directly; do not describe them as additional typed integrations.

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

Same primitives and attributes as HTML (`className="stack card"`, `data-gap="m"`, `data-variant="ghost"`). React is an optional peer dependency; JSX examples need the application’s JSX tooling. Do not also run `auto.js` on React-owned roots. The React adapter and automatic initializer import the full registry; explicit core-controller imports are the smaller integration for a few controls. Verify rerenders and teardown in the actual React integration.

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
- Avoid: long utility chains, repeated inline presentation, specificity escalation, raw brand colors in component rules, and invented `data-ui` names for layout. Fix the owning component instead of appending overrides. Do not remove deliberate hidden-state, touch-target or reduced-motion safeguards simply to reduce important-declaration counts.
- Accessibility: every interactive element keyboard-reachable and labelled; keep `<label>`s, `aria-label` on icon buttons, use `dialog`/`alert-dialog` (focus trap + return built in). Verify reduced motion, visible focus, contrast and keyboard behavior. Existing ARIA wiring and browser tests are not screen-reader certification. Check `colibri docs <name>` for expected keys.
- Before finishing: use checks appropriate to the change. In the Colibri repository, run `npm test`, `npm run build`, `npm run check:architecture` and relevant browser tests (`npm run test:e2e` for shared-style changes). Edit source/generators, not generated copies. Report what was tested and whether changes are local, committed, merged or deployed; skill updates do not themselves publish a marketplace release.

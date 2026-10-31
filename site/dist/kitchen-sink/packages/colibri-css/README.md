# Colibri CSS (`@colibri-kit/css`)

A small, modern, token-first stylesheet. No build step and no utility-class explosion: semantic tokens, good defaults, seven layout primitives and a few opt-in components.

```html
<link rel="stylesheet" href="packages/colibri-css/dist/colibri.css">
```

## Why Colibri CSS

**What it is.** Colibri CSS (`@colibri/css`) is one small stylesheet (15 KB, 11 KB minified, zero dependencies, no build step) that gives a page finished defaults, a themable token system, a handful of layout primitives and a few opt-in components. It is the styling half of Colibri: Colibri UI provides headless behaviour (`data-ui`), Colibri CSS provides the look.

**Why we built it.** We wanted pages that look right with plain, semantic HTML, the kind FreeMarker templates and CMS content produce, without two bad options:
- **Utility frameworks** (Tailwind-style) turn every element into 20 classes, need a compiler, and spread the design across thousands of lines of markup. Changing the design means editing templates.
- **Heavy frameworks** (Bootstrap/Metronic-style) ship hundreds of KB, fight you on specificity and look like themselves, not like your product.

Modern CSS now does natively what those tools were invented to work around. Colibri CSS is a thin, opinionated layer over the platform.

**How it works.**
- **Cascade layers.** Everything lives in `@layer colibri.reset, tokens, base, layout, components, utilities`. Your own CSS outside a layer always wins: no `!important`, no specificity wars.
- **Design tokens.** Colour, space, type, radius, shadow and motion are custom properties. Colours are OKLCH and derive from a single `--c-hue`, so changing one number re-brands everything. Tokens cascade, so any section can carry its own theme.
- **Dark mode built in.** Every colour is a `light-dark()` pair. It follows the OS by default; `data-theme="dark"` or `"light"` on any element forces it for that subtree.
- **Fluid type and spacing.** `clamp()` scales grow smoothly from phone to desktop, with no breakpoints to maintain.
- **Layout primitives, not utilities.** `.stack`, `.cluster`, `.grid`, `.split`, `.switcher`, `.center`, `.reel`, `.prose` and a few more. You tune them with custom properties (`--gap`, `--min`, `--side`) instead of new classes, and they are responsive without media queries.
- **Container queries.** Cards respond to the space they're in, not the viewport, so the same markup works in a sidebar and a main column.
- **`:has()` patterns.** A card with a checked box looks selected; a field with an invalid input turns its label red (only after the user has touched it); required fields get a marker. No JavaScript.
- **Native nesting.** Components keep their states and variants in one readable block. Variants are attributes (`data-variant`, `data-size`, `data-tone`), not class lists.
- **Accessible by default.** Focus rings for keyboard users, reduced-motion tokens that switch all motion off, high-contrast borders, plus selection colour, slim scrollbars and `accent-color` for native controls.
- **Bridge to Colibri UI.** `colibri-ui-bridge.css` maps Colibri UI's `--ui-*` tokens to Colibri CSS's `--c-*` tokens, so headless components and the page share one palette, one radius scale and one dark mode.

**Why it's better.**
- **Simple:** 6 files of readable CSS you can open and understand in an afternoon. Four utility classes total.
- **Modern:** it uses the platform (layers, `:has()`, container queries, nesting, `light-dark()`, `clamp()`, OKLCH) instead of re-implementing it with tooling.
- **Themable:** one hue or one token changes the whole product, globally or per section.
- **Clean markup:** HTML stays semantic and readable; design lives in CSS where it belongs.
- **Built to pair with Colibri UI:** headless behaviour + token-driven styling, with no framework lock-in and no build step.

**Getting started**
```html
<link rel="stylesheet" href="packages/colibri-css/dist/colibri.css">
<!-- with Colibri UI components: -->
<link rel="stylesheet" href="themes/colibri.css">
<link rel="stylesheet" href="packages/colibri-css/dist/colibri.css">
<link rel="stylesheet" href="packages/colibri-css/dist/colibri-ui-bridge.css">
```
Re-brand: `:root { --c-hue: 160; }`. Force dark: `<html data-theme="dark">`.

## What's inside (in cascade-layer order)

| Layer | File | What |
|---|---|---|
| `colibri.reset` | `src/10-reset.css` | modern normalize: box-sizing, media defaults, `text-wrap`, `field-sizing`, `interpolate-size` |
| `colibri.tokens` | `src/20-tokens.css` | OKLCH colours via `light-dark()`, fluid `clamp()` type and space, radius, shadow, motion (spring `linear()`), reduced-motion and contrast handling |
| `colibri.base` | `src/30-base.css` | typography, links, code/kbd/pre, forms (`:user-invalid`), tables, focus-visible, selection, scrollbars |
| `colibri.layout` | `src/40-layout.css` | `.stack .cluster .grid .split .switcher .center .bleed .cover .frame .reel .container .prose`, configured with custom properties (`--gap`, `--min`, `--side`, `--at`, …) |
| `colibri.components` | `src/50-components.css` | `.btn .card .badge .field .callout .enter`; variants are `data-variant`, `data-size`, `data-tone`; `:has()` and container queries built in |
| `colibri.utilities` | `src/60-utilities.css` | only `.visually-hidden .muted .flow .truncate` |

Your own unlayered CSS beats every layer, so overrides never need `!important`.

## Two ways to style (same tokens)

**Path A: plain CSS (default).** Write semantic HTML and use the primitives (`.stack`, `.cluster`, `.grid`, `.card`, `.btn`…). Variants are attributes: `<button class="btn" data-variant="ghost">`. Put your own look in your own CSS with `var(--c-*)` tokens. This is the best fit for server-rendered pages and FreeMarker.

**Path B: classes for React `className` (opt-in).** Add `dist/colibri-classes.css` (about 9 KB) when you'd rather style in markup:

```html
<link rel="stylesheet" href="dist/colibri-classes.css">
```
```jsx
<div className="c-stack c-gap-m c-p-l c-bg-surface c-rounded-l c-shadow">
  <h3 className="c-text-lg">Plan</h3>
  <p className="c-muted">Billed yearly</p>
  <button className="btn is-outline">Choose</button>
</div>
```

* Naming: `c-{what}-{token}`, e.g. `c-gap-s`, `c-p-m`, `c-text-xl`, `c-bg-surface`, `c-rounded-l`. Every value is a token, so there are no magic numbers and theming still works.
* Variants as classes: `btn is-outline | is-ghost | is-soft | is-danger | is-s | is-l`, `badge is-ok`, `callout is-warn`. These are the same as the `data-variant` attributes.
* Container variants: `c-narrow:hidden`, `c-wide:row`.
* The classes are generated from the tokens (`classes.mjs`) into their own `colibri.classes` layer, so they can't drift from the tokens and your CSS still wins.
* This is not Tailwind: about 135 classes, and no compiler.

Rule of thumb: use Path A for page structure and Path B for small one-off tweaks. Mixing them on one element is fine.

## React

```jsx
import { Dialog, Tabs, Part, cx } from "@colibri-kit/ui/react";

<Dialog onOpen={() => track("invite")}>
  <Part name="trigger" as="button" className="btn">Invite</Part>
  <Part name="content" as="dialog" className="card c-stack c-gap-s">…</Part>
</Dialog>

<Tabs onChange={(e) => setTab(e.detail.value)}>
  <Part name="list"><Part name="trigger" as="button" value="a">A</Part></Part>
  <Part name="panel" value="a">…</Part>
</Tabs>
```
These are thin wrappers around the same engine (no auto-init, and cleanup on unmount). You can also use `useColibri(kind)` or `<UI kind="…">` for any component.

## Theming
* Re-brand: `:root { --c-hue: 160; }`
* Dark mode follows the OS; force it with `data-theme="dark"` (or `"light"`) on `<html>` or on any element.
* Scope tokens to a container: `<section style="--c-radius: 0; --c-hue: 20">`.

## With Colibri UI
Load `themes/colibri.css`, then `dist/colibri.css`, then `dist/colibri-ui-bridge.css`. The bridge maps `--ui-*` to `--c-*`, so components follow your Colibri CSS tokens.

## Build
`node build.mjs` concatenates `src/*.css` into `dist/colibri.css`, `dist/colibri.min.css` `dist/colibri-ui-bridge.css` and `dist/colibri-classes.css` (generated by `classes.mjs`).

Browser baseline: evergreen browsers from 2024 onward (layers, nesting, `:has()`, container queries, `light-dark()`). `field-sizing` and `interpolate-size` are progressive enhancements.

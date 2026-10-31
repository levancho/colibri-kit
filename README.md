# Colibri Kit

Modern, platform-first building blocks for the web. No build step, no class soup.

| Package | What it is |
|---|---|
| **Colibri CSS** (`@colibri-kit/css`) | One small stylesheet: cascade layers, OKLCH design tokens, `light-dark()` dark mode, fluid type/space, layout primitives, container queries, `:has()` patterns. — `packages/colibri-css/` |
| **Colibri UI** (`@colibri-kit/ui`) | Headless, unstyled, accessible components (`data-ui`, `<ui-*>` elements, FreeMarker macros), React-ready. — `src/`, `freemarker/`, `themes/` |

More Kit packages to come.

## Getting started

```html
<link rel="stylesheet" href="packages/colibri-css/dist/colibri.css">
<!-- with Colibri UI components -->
<link rel="stylesheet" href="themes/colibri.css">
<link rel="stylesheet" href="packages/colibri-css/dist/colibri-ui-bridge.css">
```

Re-brand: `:root { --c-hue: 160; }` · Force dark: `<html data-theme="dark">`

Optional: add `colibri-classes.css` for React-style `className` styling (`c-stack c-gap-m c-p-l`). React: `import { Dialog, Tabs, Part } from "@colibri-kit/ui/react"`. Every snippet is shown in HTML, FreeMarker and React at https://colibri.l3v.ai/#start.

## Explore

- `examples/kitchen-sink.html` — every component, live
- `examples/colibri-css.html` — Colibri CSS guide
- `site/` — the Colibri Kit website (preview: https://colibri.l3v.ai)
- `docs/colibri-ui.md` — Colibri UI architecture
- `test/` — unit (JSDOM) and browser tests

## License

MIT © Levan Dvalishvili

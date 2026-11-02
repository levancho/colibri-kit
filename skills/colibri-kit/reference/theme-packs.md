# Theming and theme packs

## Levels of theming (smallest first)

1. One token: `:root { --c-hue: 160; }` or `.promo { --c-hue: 20; }` (tokens cascade).
2. Accent preset (Colibri UI): `<html data-ui-theme="blue|green|rose|orange|violet">` (sets `--ui-primary`, `--ui-primary-foreground`, `--ui-ring`).
3. Theme pack: a full look for both Colibri CSS and Colibri UI.

## Built-in packs (`themes/packs/`)

| Pack | Feel | Radius | Scheme |
|---|---|---|---|
| `glacier` | cool, neutral, professional (slate + teal) | 6px | light & dark |
| `ember` | warm, bold (terracotta + amber on cream) | 16px | light & dark |
| `midnight` | dark-first, electric (navy + violet) | 12px | dark only |

```html
<link rel="stylesheet" href="themes/colibri.css">
<link rel="stylesheet" href="packages/colibri-css/dist/colibri.css">
<link rel="stylesheet" href="themes/packs/index.css">   <!-- or one pack file -->
<html data-kit-theme="ember" data-theme="light">
```
Remove `data-kit-theme` for the default look.

## Writing a pack

A pack is plain token overrides under one selector. Copy `themes/packs/glacier.css` as a template:

```css
html[data-kit-theme=mytheme]{
  /* Colibri CSS */
  --c-hue: 160; --c-chroma: .14;
  --c-bg: light-dark(oklch(98.6% .004 160), oklch(16.5% .012 160));
  --c-surface: light-dark(#fff, oklch(20% .014 160));
  --c-fg: light-dark(oklch(22% .02 160), oklch(96% .006 160));
  --c-muted: …; --c-line: …; --c-accent: …; --c-brand: var(--c-accent);
  --c-font: "Inter", system-ui, sans-serif;
  --c-radius-s: 4px; --c-radius: 8px; --c-radius-l: 12px;
  --c-shadow-s: …; --c-shadow: …; --c-shadow-l: …;
  --c-dur: 160ms; --c-ease: cubic-bezier(.2,0,0,1);
  /* Colibri UI */
  --ui-background: …; --ui-foreground: …; --ui-primary: …; --ui-primary-foreground: …;
  --ui-border: …; --ui-input: …; --ui-ring: …; --ui-radius: 8px; --ui-control-h: 36px;
}
html[data-kit-theme=mytheme][data-theme=dark]{ /* dark --ui-* values */ }
```

Rules:
- Only tokens; no component selectors unless a pack deliberately changes shape (packs may add component tweaks scoped under the same `html[data-kit-theme=…]`).
- Every colour `light-dark()` (or a `[data-theme=dark]` block for `--ui-*` hex values); keep text/background contrast at WCAG AA.
- Add the import to `themes/packs/index.css`.

## Themes Studio and Colibria bridge

The site's Themes Studio (https://colibri.l3v.ai, `site/src/studio/`) previews packs and imports generated themes (ZIP/JSON). Themes made on colibria.ai travel to the Kit via the Colibri Bridge (`#colibri=<base64url JSON>` in the URL); see `docs/colibri-bridge.md`.

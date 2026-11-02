# Tokens and primitives cheatsheet

Source: `packages/colibri-css/src/20-tokens.css`, `40-layout.css`, `50-components.css`, `themes/colibri.css`, `packages/colibri-css/dist/colibri-ui-bridge.css`.

## Colibri CSS tokens (`--c-*`)

| Group | Tokens |
|---|---|
| Brand | `--c-hue` (default 255), `--c-chroma` (0.16), `--c-brand`, `--c-brand-fg` |
| Surfaces / text | `--c-bg`, `--c-surface`, `--c-sunken`, `--c-fg`, `--c-muted`, `--c-line`, `--c-accent`, `--c-accent-soft` |
| Status | `--c-ok`, `--c-warn`, `--c-bad` |
| Type | `--c-font`, `--c-font-mono`, `--c-text-xs` `-sm` `-md` `-lg` `-xl` `-2xl` `-3xl` (fluid `clamp()`), `--c-leading`, `--c-leading-tight` |
| Space | `--c-space-3xs` `-2xs` `-xs` `-s` `-m` `-l` `-xl` `-2xl` (fluid) |
| Shape | `--c-radius-s` (6px), `--c-radius` (10px), `--c-radius-l` (16px), `--c-radius-full` |
| Depth | `--c-shadow-color`, `--c-shadow-s`, `--c-shadow`, `--c-shadow-l` |
| Motion | `--c-ease`, `--c-ease-out`, `--c-ease-spring`, `--c-dur-fast` (120ms), `--c-dur` (200ms), `--c-dur-slow` (400ms); all 0 under `prefers-reduced-motion` |
| Layout | `--c-measure` (68ch), `--c-content` (72rem), `--c-ring` |

All colours are `light-dark()` pairs; `[data-theme="light"|"dark"]` forces a scheme on a subtree.

## Colibri UI tokens (`--ui-*`)

`--ui-background --ui-foreground --ui-card --ui-popover --ui-muted --ui-muted-foreground --ui-accent --ui-accent-foreground --ui-primary --ui-primary-foreground --ui-ring --ui-ring-width --ui-border --ui-input --ui-success --ui-warning --ui-destructive --ui-destructive-foreground --ui-chart-1 … --ui-chart-5 --ui-font --ui-font-mono --ui-radius --ui-radius-sm --ui-radius-lg --ui-shadow --ui-shadow-sm --ui-control-h --ui-space-1 … --ui-space-4 --ui-text-xs --ui-text-sm`

The bridge maps them to `--c-*` (e.g. `--ui-primary: var(--c-accent)`, `--ui-border: var(--c-line)`, `--ui-radius: var(--c-radius)`), so changing `--c-hue` restyles components too.

## Layout primitives (`40-layout.css`)

| Class | Knobs (custom properties) |
|---|---|
| `.stack` | `--gap` (default `--c-space-s`) or `data-gap` |
| `.cluster` | `--gap` (`--c-space-xs`) |
| `.grid` | `--gap` (`--c-space-m`), `--min` (16rem column minimum) |
| `.split` | `--gap`, `--side` (16rem sidebar) |
| `.switcher` | `--gap`, `--at` (36rem: switch to row above this) |
| `.center` | `--max` (`--c-content`) |
| `.cover` | `--min-h` (60svh) |
| `.frame` | `--ratio` (16 / 9) |
| `.reel` | `--gap` (horizontal scroller) |
| `.bleed`, `.container`, `.prose` | full-bleed row, container-query context, long-form text |

`data-gap`: `0 3xs 2xs xs s m l xl 2xl`.

## Components and utilities (Colibri CSS)

`.btn .card .badge .field .callout .enter` with `data-variant="ghost|outline|soft|danger"`, `data-size="s|l"`, `data-tone="ok|warn|bad|accent"`. Utilities (only four): `.visually-hidden .muted .flow .truncate`.

Shared layer order: `@layer colibri.reset, colibri.tokens, colibri.base, colibri.layout, colibri.components, colibri.utilities, colibri.ui, colibri.packs, colibri.bridge, colibri.looks, colibri.motion`. Normal unlayered application declarations outrank normal declarations in these layers. Visibility, touch-target and reduced-motion safeguards deliberately retain important declarations.

For scoped palette changes, put `data-colibri-theme` on the container along with its `--c-hue` override. The bridge also binds at this boundary. Do not assume redefining a hue alone recomputes already-inherited derived colors.

CSS and UI attributes are not interchangeable: CSS `.badge` uses `data-tone="ok|warn|bad|accent"`; UI callouts use `data-tone="success|warning|danger|neutral"`. Consult the component reference/source rather than applying one dialect everywhere.

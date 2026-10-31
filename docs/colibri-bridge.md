# Colibri Bridge v1 — Colibria ↔ Colibri Kit

Two real sites, plain navigation, no iframes. Source of truth: `examples/colibri-bridge.js` (identical copy in the Colibria repo at `src/colibri-bridge.js`).

## Transport
`<target URL>#colibri=<base64url(JSON)>&return=<url-encoded URL>`
* `return` is only honoured for allow-listed origins (colibria.ai, colibri.l3v.ai, colibria*.workers.dev previews, localhost).
* If the opening tab is still alive, Colibria also sends `window.opener.postMessage({type:"colibri-theme", theme}, kitOrigin)`; Kit Studio accepts it only from allow-listed origins. Otherwise it navigates to `return` with the theme in the hash.
* Kit pages keep the last theme in `localStorage["colibri-bridge-theme"]` (dashboards) / Studio state (`bridge`).

## Schema
```json
{ "v": 1,
  "source": "colibria" | "colibri-kit",
  "name": "Analogous palette",
  "colors": ["#1B1D2A", "#FFFFFF", "#E8590C", "#F4B69A", "#FBF1E7"],
  "roles": { "accent": "#E8590C", "background": "#FBF1E7", "surface": "#FFFFFF", "text": "#1B1D2A" },
  "scheme": "light",
  "harmony": "Analogous",
  "base": { "h": 24, "s": 67, "l": 55 },
  "kit": { "pack": "ember", "radius": "10", "btn": "soft" } }
```
* `colors`: 2–15 `#RRGGBB`, ordered as in Colibria.
* `roles`: accent required (defaults to colors[2]); background/surface/text apply only when the page appearance equals `scheme`; in the other appearance only the accent is used.
* `kit`: optional Studio settings (pack, radius, btn, acc, tabs, card, input, shadow, font, hfont, scaling) so a round trip keeps the Kit look.

## Token mapping (Kit)
accent → `--ui-primary`, `--c-accent`, `--c-brand`, `--ui-ring`; background → `--ui-background`, `--c-bg`; surface → `--ui-card`, `--c-surface`; text → `--ui-foreground`, `--c-fg`; muted/border/sunken are mixed from text+background; remaining colours → `--chart-1..5`.

## Entry points
* Kit Studio: `/studio/#colibri=…` · rail card "Open in Colibria ↗" / "Try on dashboard ↗" / "Unlink".
* Kit dashboards: `/kitchen-sink/examples/dashboards/analytics.html#colibri=…` (also crm.html, index.html) with a "Back to Colibria / Tune in Studio / ✕" bar.
* Colibria: `/?view=studio#colibri=…&return=…` loads the palette; palette caption + Export dialog have "← Send back to Colibri Kit", "Try on Kit dashboard ↗", "Open in Kit Studio ↗".

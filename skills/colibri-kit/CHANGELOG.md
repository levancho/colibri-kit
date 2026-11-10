# Changelog
## 1.2.0 (2026-11-10)
- Reserved class names listed in tokens.md; `colibri classes`, `colibri collisions <file.css>` and the prefixed stylesheet (`colibri.prefixed.css`, `.c-*`) for projects that already use them.
- CSS and UI accept each other's status words: `ok|warn|bad` and `success|warning|danger`; `danger` and `destructive`.
- Generated "Events and controller API" table in components.md, read from the controllers; `colibri docs <name>` prints the same; `controllers(el)[0]` reaches a live controller.
- `dist/lazy/auto-lazy.js` (loads only the controllers a page uses) and `dist/colibri-ui.min.js` as alternatives to `src/core/auto.js`.
## 1.1.0 (2026-11-04), from levancho/colibri-kit@9ab5248
- New references: applications.md (application components/adapters, React 18+), maintenance.md (composition, overrides, maintainer checks).
- Thymeleaf support (native fragments, java/colibri-templates module); description updated.
- Consumer install/upgrade section (`colibri init --starter`, `--dir`, `--force` rules, `npm run test:consumer`).
- Styling guidance: no repeated inline presentation styles; layered overrides; `data-colibri-theme` for local palettes; dashboard recipe uses a CSS class.
- Install guidance: don't assume npm packages are published; the bridge is a cascade layer, not order-dependent.
- Accessibility/check rules expanded; components, tokens and theme-packs references updated.
## 1.0.0 (2026-11-02), levancho/colibri-kit@34c0fb3, first Agensi release

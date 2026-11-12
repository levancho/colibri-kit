# Changelog
## 1.3.0 (2026-11-12)
- React Native: `@colibri-kit/native` (provider, `useTheme`, 23 components) with the same gap/variant/tone/size vocabulary as props; never mix it with Colibri CSS or `@colibri-kit/ui`.
## 1.2.0 (2026-11-10)
- Reserved class names listed in tokens.md; `colibri classes`, `colibri collisions <file.css>` and the prefixed stylesheet (`colibri.prefixed.css`, `.c-*`) for projects that already use them.
- CSS and UI accept each other's status words: `ok|warn|bad` and `success|warning|danger`; `danger` and `destructive`.
- Generated "Events and controller API" table in components.md, read from the controllers; `colibri docs <name>` prints the same; `controllers(el)[0]` reaches a live controller.
- `dist/lazy/auto-lazy.js` (loads only the controllers a page uses) and `dist/colibri-ui.min.js` as alternatives to `src/core/auto.js`; `ui:ready` / `ui:error` semantics.
- Packages are published on npm (0.1.0): `npm install @colibri-kit/ui @colibri-kit/css`, `npx -p @colibri-kit/ui colibri init --starter`, pinned CDN links; never the unrelated `colibri` / `colibri-ui` packages. Side-effect-free root import.
- FreeMarker rules: host must output HTML, URLs are not vetted, numbers are locale-independent, calendar follows the page language; import path is `/colibri/freemarker/ui.ftl`.
- Sheet/drawer drag behaviour and handle; `item-group` `data-href` is http(s) only; React refresh and remote datatable behaviour.
- `.btn` versus themed `<button>` vocabularies inside `.ui-root`; scope of the prefixed stylesheet; `colibri collisions` matches compound selectors.
## 1.1.0 (2026-11-04), from levancho/colibri-kit@9ab5248
- New references: applications.md (application components/adapters, React 18+), maintenance.md (composition, overrides, maintainer checks).
- Thymeleaf support (native fragments, java/colibri-templates module); description updated.
- Consumer install/upgrade section (`colibri init --starter`, `--dir`, `--force` rules, `npm run test:consumer`).
- Styling guidance: no repeated inline presentation styles; layered overrides; `data-colibri-theme` for local palettes; dashboard recipe uses a CSS class.
- Install guidance: don't assume npm packages are published; the bridge is a cascade layer, not order-dependent.
- Accessibility/check rules expanded; components, tokens and theme-packs references updated.
## 1.0.0 (2026-11-02), levancho/colibri-kit@34c0fb3, first Agensi release

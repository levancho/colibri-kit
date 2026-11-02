# Colibri maintenance audit — 2026-11-02

## Result

Colibri's semantic markup and shared tokens reduce repeated presentation in templates. They do not make maintainability automatic. The CSS core has a small helper vocabulary and named cascade layers; the optional UI theme still contains substantial override debt. Do not claim the whole project is free of specificity problems, certified accessible, or guaranteed maintainable.

This pass combines a repository-wide source inventory with focused controller/style review and browser regressions. It is not a line-by-line security audit or exhaustive runtime verification of every component.

## Requirements and evidence

| Requirement | Evidence / action | Remaining limit |
| --- | --- | --- |
| Readable markup | Authored homepage/dashboard markup has at most three classes per element; blocks/studio at most two. | These counts exclude generated gallery markup and JavaScript-generated strings; short class lists alone are not architecture. |
| Component boundaries | Shared controllers, React bindings and FreeMarker macros; tab-navigation events now ignore nested components. Structural CSS for navigation/callouts uses owned parts. | Other descendant selectors still need review; React lifecycle integration is not comprehensively tested. |
| Shared design tokens | CSS color/spacing/type scales and CSS/UI bridge; local palettes use `data-colibri-theme`. | Optional UI themes retain some literal values. Arbitrary custom palettes need contrast testing. |
| Limited utilities | Four CSS helpers: visually-hidden, muted, flow, truncate. Reusable layout primitives are separately named. | A consumer can still create utility soup; the library cannot prevent that. |
| Separation of presentation | Removed all inline presentation declarations from the analytics and CRM HTML; data-driven custom properties remain. | Dashboard index previews, homepage, blocks and studio still contain some inline presentation. |
| Predictable overrides | CSS core uses named layers. Link-navigation and callout looks now set tokens rather than competing declarations. | Optional UI theme is not fully layered. Core visibility/touch safeguards deliberately use important declarations. |
| Theme semantics | Callout appearances preserve warning/danger/success colors; component look overrides global nav look. | Midnight deliberately forces dark mode. A light-mode test with this pack does not prove a light palette exists. |
| Runtime independence | No external imports found in `src/core`; direct module usage and vendored styles do not require a service or compiler. | React is an optional dependency; auto-init/React load the full registry. Maintainer builds require Node/Python. |
| Sustainability | MIT source can be copied, pinned and self-hosted. | No guaranteed funding, maintainer capacity, future browser support or release continuity. |

## Concrete fixes

- Appearance controls: important declarations reduced from **103 to 25**. Tab-navigation and callout looks now configure tokens on the owner.
- Link navigation uses the active link's own CSS indicator rather than JavaScript-measured geometry; no forced layout measurements or inline indicator positions. Nested navigation cannot clear the parent's active link.
- Callout tone is preserved when selecting soft/surface/outline looks. Nested icons are not styled as the parent's icon.
- Both editable dashboard screens now keep repeated presentation in semantic CSS rules.
- Homepage explains six maintenance mechanisms with code and clearly scopes the cascade guarantee.
- Both repository skill entrypoints updated. The standalone kit skill includes maintenance guidance, accurate scope/installation/React/dark-mode guidance, and corrected examples and references.

## Inventory and checks

`npm run check:architecture` scans authored CSS once, excluding generated distribution copies. After this change: optional UI theme 92 important declarations; appearance controls 25; motion 10; Midnight 1; demo/gallery CSS has additional exceptions. The checked-in budget records the existing debt and flags increases; it does not approve or fix those exceptions.

The check also inspects dependency declarations, direct core import specifiers, the helper vocabulary and authored HTML class lists. It rejects inline presentation in the two dashboard screens and non-token navigation/callout appearance rules. It is a static review tripwire, not a CSS parser, architectural proof or runtime enforcement.

Validation completed locally for this change:

- 61 unit tests, including nested tab-navigation ownership and absence of visual geometry writes.
- Existing browser suites for component flows, blocks, FreeMarker output, responsive foundations, themes/navigation and interactive dashboards.
- New matrix: link-navigation/callout, four packs, light/dark requests, 320/1100px, all looks, semantic tones, nested ownership and application token overrides.
- Both skills validated with the skill-creator validator; relative references resolved; package dry run includes the skill folders. Standalone archive checked against the source files byte-for-byte.

Safari/Firefox, assistive technology, arbitrary consumer themes, React Strict Mode/rerender teardown and all dynamic-content lifecycle combinations remain unverified by this pass.

## Competitor claims: what is supported

Tailwind's own documentation recommends reusable components/template partials and supports design tokens and custom CSS. Utility classes participate in CSS cascade and specificity; they do not bypass them. Long strings and weak component boundaries are maintainability risks, not proof that every Tailwind project lacks architecture.

Sources: https://tailwindcss.com/docs/styling-with-utility-classes and https://tailwindcss.com/docs/theme

Adam Wathan reported engineering layoffs, lower documentation traffic and revenue pressure in January 2026. In September 2026, Tailwind announced joining Shopify while retaining MIT licensing and continued maintenance. Those events support discussing business-model pressure; they do not establish abandonment or Colibri's superiority.

Sources: https://github.com/tailwindlabs/tailwindcss.com/pull/2388#issuecomment-3717222957 and https://tailwindcss.com/blog/tailwind-is-joining-shopify

The website explains Colibri's implementation rather than turning those business events into a product guarantee.

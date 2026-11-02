# Colibri maintenance audit — 2026-11-02

This review fixes implementation problems behind the kit's maintenance claims. The homepage explains component boundaries, shared tokens, reusable layouts, predictable overrides and locally served runtime files with examples.

## Changes and evidence

| Existing issue | Fix | Regression coverage |
| --- | --- | --- |
| UI theme and presets fought application CSS with specificity and important declarations | Shared ordered layers for CSS core, UI theme, packs, bridge, looks and motion. UI important declarations reduced from 92 to 18; appearance presets from 103 before the audit to zero. Removed duplicated component selectors and the unused demo stylesheet. | Layer-contract checks; normal application overrides across four packs; navigation/callout appearance matrix. |
| Repeated inline presentation in authored pages | Named CSS rules own presentation in the homepage, dashboard index, dashboard screens, blocks and studio preview. Variable custom properties remain in markup. | Static checks reject inline presentation in these authored HTML folders and track class-list growth. |
| Removed components retained listeners/observers; React rerenders recreated behavior | Central idempotent teardown, automatic disposal on DOM removal/HTMX cleanup, move-aware custom elements, stable React refs and current handlers. | Strict Mode, rerender state, dynamic parts, root replacement, nested cleanup, DOM moves, reconnect and carousel observer tests. |
| Duplicate spinner rules and animations restarting after motion was disabled | One spinner renderer; reduced-motion stops ring/dot/bar animation. Global motion-off stops infinite loops. | Browser reduced-motion checks and shared-style regression suite. |
| Low-contrast labels and inaccessible demo controls | Darker default light-mode accent/status tokens, readable avatar text, named mobile Customize button and focusable scrollable code blocks. | Axe WCAG A/AA rules on homepage, analytics and CRM at 390/1280px in light/dark mode, plus modal/menu and overflow checks. |
| Generated markup interpolated labels, names and IDs | Pagination uses DOM construction and HTTP(S) link validation; rating names and calendar IDs use DOM properties. | Literal-text/attribute payload tests and executable-protocol rejection. |
| Published skill described the old cascade and lifecycle | Both skill entrypoints and bundled references now describe the implementation, composition rules, teardown and test commands. | Skill validation, reference/catalog checks and archive/source comparison. |

## Architectural checks

`npm run check:architecture` inspects authored sources once, excluding generated distribution copies. It checks the shared layer order, no important declarations in appearance presets, no duplicated component selectors in presets, per-file important budgets, no Tailwind dependency, local core imports, the four-helper vocabulary, authored HTML presentation and bundled skill references/catalog coverage.

The UI theme's 18 remaining important declarations protect hidden states, visually hidden positioning, drag transitions and minimum touch targets. Motion retains its reduced-motion/off safeguards. These are deliberate behavior constraints, not ordinary visual customization rules.

## Validation

- 68 unit tests pass, including React Strict Mode and generated-markup regressions.
- Existing browser suites cover 30 gallery flows, 19 blocks, 88 initialized FreeMarker examples, responsive foundations, navigation/appearance matrices and dashboard workflows.
- Chromium and WebKit pass the new homepage/dashboard checks at two widths and two color schemes, keyboard tabs, application CSS overrides and reduced motion.
- CI runs Chromium, Firefox and WebKit. The local Firefox binary could not launch under the macOS sandbox; its result must come from CI rather than being inferred from another engine.

Automated accessibility rules do not replace screen-reader testing. The matrix covers the named pages and behaviors, not every possible consumer palette or component composition.

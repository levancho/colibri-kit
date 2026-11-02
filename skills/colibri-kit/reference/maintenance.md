# Keeping Colibri interfaces maintainable

Use this reference when building repeated application UI, changing component styles, or reviewing an existing Colibri project.

## Compose at the component boundary

Use a short semantic class for a reusable visual component, `data-*` for documented variants, and native HTML for meaning. For repeated product compositions (customer cards, billing panels, navigation), create a template partial or React component owned by the application. Copying a demo repeatedly is not component architecture.

Keep component roots and their parts distinct. A parent controller or stylesheet must not capture parts inside a nested component. Reuse controllers across HTML, FreeMarker and React rather than reimplementing keyboard behavior separately.

## Keep design decisions in CSS

Use the shared color, spacing, typography and radius tokens before adding a new value. Write reusable presentation rules in a named stylesheet. Inline custom properties are suitable for genuinely variable data such as a chart percentage or runtime position; repeated `padding`, `font-size`, `background` and `display` declarations belong in component CSS.

The four general helpers are `visually-hidden`, `muted`, `flow` and `truncate`. Layout primitives such as `stack`, `grid` and `cluster` describe arrangements. Do not expand this into generated margin/padding/color utility families. A short class list is a review signal, not proof of good architecture.

## Fix the owner, not the symptom

Inspect which rule supplies the value before adding an override. Prefer a component token; otherwise change the owning structural rule and verify its states, nested use, themes and responsive layout.

The CSS core uses cascade layers. The optional UI theme and some appearance controls still have unlayered and important declarations. Do not promise zero specificity conflicts or remove important accessibility safeguards indiscriminately. In the source repository, `tools/css-important-budget.json` records existing debt; `npm run check:architecture` flags increases rather than declaring that debt solved. Lower the budget after removing a legacy rule. An increase requires explaining the actual need and testing its effect, not automatically updating the snapshot to make CI pass.

## Make demos honest and functional

`examples/dashboards/analytics.html` and `crm.html` share browser-only state under `colibri-dashboard-v1`. They demonstrate customer filters/sorting/CSV reports, deal CRUD/JSON import/export, inbox read state and reset. They do not provide authentication, a database, real messaging or shared persistence.

Keep summary values consistent with their underlying dataset. Clearly distinguish historical sample charts from edited current data. For real applications, connect actions to the host’s actual data and authorization model; do not present localStorage as a production backend. Preserve visible errors, empty states, keyboard access and import validation.

## Maintainer workflow

When working in a full Colibri checkout:

1. Edit authored CSS/JS/templates. `themes/knobs.css`, the gallery, registry and `site/dist` are generated; edit their sources/generators and rebuild.
2. Run `npm test`, then `npm run build` and `npm run check:architecture`.
3. Run relevant browser regressions. For shared theme/controller changes, run `npm run test:e2e` (installed Chromium/Chrome required; set `CHROME` if necessary).
4. Inspect the relevant UI at narrow and wide widths and under the supported theme/scheme combinations. Midnight is intentionally dark-only.
5. Run `git diff --check`; confirm regenerated assets match their sources. Distinguish tested behavior from untested browsers, screen readers, integration lifecycles and arbitrary user palettes.

When this skill is installed without the repository, these commands are references to the Colibri checkout, not scripts bundled in the skill. Use the host project’s applicable checks and report missing validation plainly.

## Accurate explanations

Explain the implementation: semantic component classes, shared tokens, separate behavior, optional themes, and locally served CSS/JS. Do not claim no CSS, universal framework compatibility, guaranteed accessibility, or guaranteed long-term maintenance. Tailwind also supports design tokens and component extraction; choosing Colibri is an authoring and dependency decision, not proof that other projects cannot be maintained. Competitor business events are not evidence of Colibri’s code quality.

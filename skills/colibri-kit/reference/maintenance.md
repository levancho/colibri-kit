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

The CSS core, UI theme, packs, token bridge, appearance presets and motion styles share an explicit cascade-layer order. Normal unlayered application CSS overrides their normal declarations. Appearance presets contain no important declarations or repeated component selectors to inflate specificity. Hidden states, touch targets and reduced-motion safeguards retain deliberate exceptions.

In the source repository, `npm run check:architecture` checks the layer contract, important-declaration budgets, inline presentation in authored pages, helper vocabulary, runtime imports and skill references. Fix the source of a failure; do not raise a budget merely to make CI pass.

## Match initialization with teardown

Plain HTML/HTMX: `auto.js` initializes components and disposes removed subtrees; DOM moves preserve live controllers. Call `init(insertedRoot)` after manual insertion, or dispatch `ui:refresh`. For a framework that manages its own lifecycle, use the component factory and call `api.destroy()` on cleanup. `dispose(root)` from `core/util.js` tears down tracked controllers in a subtree.

React: use the React wrappers/hook, without global auto-init. Ordinary rerenders preserve the controller, event handlers read current props, and unmount destroys owned controllers. If passing hook `options`, keep the object stable unless reinitialization is intended. Give dynamic parts stable React keys and use `apiRef` for the controller API. Custom elements initialize when connected and dispose when disconnected; moves within the document preserve their API.

## Make demos honest and functional

`examples/dashboards/analytics.html` and `crm.html` share browser-only state under `colibri-dashboard-v1`. They demonstrate customer filters/sorting/CSV reports, deal CRUD/JSON import/export, inbox read state and reset. They do not provide authentication, a database, real messaging or shared persistence.

Keep summary values consistent with their underlying dataset. Clearly distinguish historical sample charts from edited current data. For real applications, connect actions to the host’s actual data and authorization model; do not present localStorage as a production backend. Preserve visible errors, empty states, keyboard access and import validation.

## Maintainer workflow

When working in a full Colibri checkout:

1. Edit authored CSS/JS/templates. `themes/knobs.css`, the gallery, registry and `site/dist` are generated; edit their sources/generators and rebuild.
2. Run `npm test`, then `npm run build` and `npm run check:architecture`.
3. Run relevant browser regressions. For shared theme/controller changes, run `npm run test:e2e` (installed Chromium/Chrome required; set `CHROME` if necessary).
4. Install browser engines with `npx playwright install chromium firefox webkit`, then run `npm run test:cross-browser` for shared CSS or accessibility changes. This checks homepage/dashboard WCAG rules, responsive layouts, dialogs, keyboard tabs, cascade overrides and reduced motion.
5. Inspect the relevant UI at narrow and wide widths and under the supported theme/scheme combinations. Midnight is intentionally dark-only.
6. Run `git diff --check`; confirm regenerated assets match their sources. Distinguish tested behavior from untested browsers, screen readers, integration lifecycles and arbitrary user palettes.

When this skill is installed without the repository, these commands are references to the Colibri checkout, not scripts bundled in the skill. Use the host project’s applicable checks and report missing validation plainly.

## Accurate explanations

Explain the implementation: semantic component classes, shared tokens, separate behavior, optional themes, and locally served CSS/JS. Do not claim no CSS, universal framework compatibility, guaranteed accessibility, or guaranteed long-term maintenance.

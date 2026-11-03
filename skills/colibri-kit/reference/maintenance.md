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

Analytics and CRM are separate demo applications. Analytics owns `analytics.html` and the `analytics-*` traffic, audience, events/goals, reports and property-settings pages. CRM owns `crm.html` and the `crm-*` contacts, companies, tasks/activity, sales-reports and sales-settings pages. Their local stores are `colibri-analytics-v2` and `colibri-crm-v2`; never share workspace routes, state keys or domain reports. CRM company links open related contacts/opportunities, tasks persist, sales settings feed new deal defaults and report targets. Analytics supports traffic windows/CSV, audience filters/reports, goal selection and property metadata. `domain-state.js` migrates eligible legacy edits once while retaining the old store. Shared UI helpers are acceptable; shared application records are not. These demos provide no authentication, server database or real outbound messaging.

Keep summary values consistent with their underlying dataset. Clearly distinguish historical sample charts from edited current data. For real applications, connect actions to the host’s actual data and authorization model; do not present localStorage as a production backend. Preserve visible errors, empty states, keyboard access and import validation.

## Maintainer workflow

When working in a full Colibri checkout:

1. Edit authored CSS/JS/templates. `themes/knobs.css`, the gallery, registry and `site/dist` are generated; edit their sources/generators and rebuild.
2. Run `npm test` and `npm run test:java` (JDK 17+ and Maven), then `npm run build` and `npm run check:architecture`.
3. Run relevant browser regressions. For shared theme/controller changes, run `npm run test:e2e` (installed Chromium/Chrome required; set `CHROME` if necessary).
4. Install browser engines with `npx playwright install chromium firefox webkit`, then run `npm run test:cross-browser` for shared CSS or accessibility changes. This checks homepage/dashboard WCAG rules, responsive layouts, dialogs, keyboard tabs, cascade overrides and reduced motion.
5. Inspect the relevant UI at narrow and wide widths and under the supported theme/scheme combinations. Midnight is intentionally dark-only.
6. Run `git diff --check`; confirm regenerated assets match their sources. Distinguish tested behavior from untested browsers, screen readers, integration lifecycles and arbitrary user palettes.

When this skill is installed without the repository, these commands are references to the Colibri checkout, not scripts bundled in the skill. Use the host project’s applicable checks and report missing validation plainly.

## Accurate explanations

Explain the implementation: semantic component classes, shared tokens, separate behavior, optional themes, and locally served CSS/JS. Do not claim no CSS, universal framework compatibility, guaranteed accessibility, or guaranteed long-term maintenance.

The six-demo gallery additionally includes `workspace.html`, `account.html`, `commerce.html` and `support.html`, each with its own layout and local state. Use their query-string routes for real navigation; use dialogs for editing. Preserve their distinct information architecture when adding screens. Their workflows are implemented in `examples/dashboards/apps.js`, with semantic CSS in `apps.css`; the browser regression is `test/e2e/demo-apps.e2e.mjs`. Security, billing, invitations and replies are explicitly simulated, never real account operations.

Demo artwork is local: keep `examples/dashboards/assets/`, `visuals.js` and `visuals.css` with copied demos. The helpers provide fictional portraits, avatar groups, product photos, team covers and inline SVG icons. Unknown user names use initials. Preserve accessible labels, image cropping, and the asset provenance README; do not add remote image dependencies. The demo browser tests verify loaded images and narrow layouts on member, team, inventory and knowledge pages.

Keep desktop navigation on the left across all six demos. Every demo and workspace subpage must expose a visible “All dashboards” link in its header to `index.html`. Analytics and CRM have separate entry files and explicitly named links; do not silently redirect one to the other. Gallery-click regressions verify page identity, sidebar placement and the return path. CRM next actions are editable local state and must survive reload and JSON export/import.

The rebuilt demos share `shell.js` (application navigation, local workspace links, gallery return links and mobile drawers) and `experience.css` (shell geometry and presentation). Keep those files with `apps.js`/`dash.js`, the page styles and `visuals.js`/`visuals.css` when copying a demo. `gallery.js` and `gallery.css` own the six-demo gallery. Each card has independent desktop/tablet/phone controls that resize only its iframe to 1440/768/390 pixels. Never mount page-wide device controls on the gallery. Full dashboard pages have their own per-path device selection. Keep buttons outside navigation links. `dashboard-devices.e2e.mjs` verifies viewport widths and independence; `dashboard-domains.e2e.mjs` verifies disjoint routes, domain workflows and state isolation. Include the domain data/page modules and `domain-ui.js`/`domain-state.js` when copying Analytics or CRM. Change the shared shell instead of adding per-page navigation variants. Test real card clicks, destination identity, return links and keyboard focus containment. Never rebuild `site/dist` while browser tests are serving it; finish the build before launching validation.


The six home screens have separate compositions in `designs.css`, the Analytics/CRM HTML, and `home-layouts.js` for Workspace, Account, and Commerce. Support uses a queue/conversation/customer layout in `apps.js`. Preserve the common navigation shell when changing those compositions. Home-screen actions must use the application's existing state and detail routes. Do not introduce static counters that disagree with editable records.

Include `theme-init.js` before paint on every dashboard route. Theme preferences are scoped by application (`colibri-demo:<app>:pack|hue|scheme`); a global gallery preference must not overwrite all six apps. Preserve the same accent and theme across an application's internal pages. The gallery's preview and description form one real anchor; keep its device controls outside that anchor, with iframe pointer events disabled. Do not add a redundant Open demo button.

`dashboard-designs.e2e.mjs` checks home-screen actions against persisted state, detail navigation, loaded local artwork, responsive overflow at 390/768/1440 pixels, and light/dark accessibility. `assets/README.md` distinguishes licensed office photographs from generated fictional portraits and products. Copy both new office photos with the demos and preserve their license references.

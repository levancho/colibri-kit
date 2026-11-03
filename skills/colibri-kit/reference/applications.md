# Colibri application components

These components are part of the public kit and are demonstrated in the kitchen sink's **Application components** group. They are optional: the core CSS remains independent.

```js
import '@colibri-kit/css';
import '@colibri-kit/css/applications';
```

For a buildless page, link `dist/colibri.css` and `dist/colibri-applications.css`. Wrap the application in `class="colibri-application"`. Use the exact markup shown in the kitchen sink; `catalog.json` contains the source examples. No files from `examples/dashboards/` are needed for styling or navigation behavior.

## Component families

- Shell: `app-shell`, `app-nav`, `app-stage`, `app-top`, `app-main`, `suite-sidebar`, `suite-context`. Optional mobile behavior: `createApplicationShell` from `@colibri-kit/ui/core/application-shell.js`; use `data-app-part="sidebar|trigger|close|backdrop"` as shown in the kitchen sink.
- Surfaces and native forms: `app-card`, `app-heading`, `app-actions`, `app-form`, `app-dialog`. Inputs retain native labels and validation; your application owns submit handlers.
- Records: `app-table-wrap`, `app-table`, `data`, `app-filter`, `badge`, `app-pill`. Use real table headings and a labeled scroll region where needed.
- Identity: `person`, `portrait`, `avatar-group`, `company-mark`, `icon-tile`, `app-icon`. Supply your own image/SVG markup. `data-face` supports a 3×2 portrait sprite; omit it for text initials. Images in the documentation are sample data, not a runtime dependency.
- Metrics and charts: `kpis`, `kpi`, `panel`, `chart-box`, `legend`, `seg`. Supply SVG or chart markup and a text/data alternative. The kit does not fetch analytics data.
- Board: `pipeline`, `lane`, `deal`, `deal-company`, `deal-owner`, `deal-next`. Stage cards are buttons or links; your application supplies editing and persistence.
- Project and planner: `project-grid`, `project-card`, `project-body`, `project-progress`, `workspace-day`, `calendar-strip`, `agenda-item`.
- Profile and settings: `account-cover`, `account-desk`, `identity-card`, `account-directory`, `settings-row`, `settings-icon`, `account-bottom`.
- Product and operations: `store-layout`, `store-products`, `store-product`, `store-summary`, `sales-receipt`, `stock-list`.
- Conversation: `support-layout`, `support-queue`, `support-ticket`, `support-thread`, `support-message`, `customer-context`. Mark the selected ticket with `aria-current`; label the reply field. Sending, assignment and storage are consumer actions.
- Article: `knowledge-card`, `article-byline`, `article-steps`.

## Composition and customization

The documented `data-layout` presets (`analytics`, `crm`, `workspace`, `account`, `commerce`, `support`) compose these families. They select layout presentation, not routes or business state. Keep your business IDs in your own attributes. Reuse `stack`, `cluster`, `grid`, `split`, `frame` and other core primitives for simpler compositions.

All application CSS is in `@layer colibri.components`; ordinary consumer CSS can override it. Colors use `--c-*` tokens. Layout spacing and sidebar width use `--suite-gap` and `--suite-sidebar`. No Tailwind, CSS compiler, dashboard stylesheet, API key or JavaScript framework is required.

The CSS renders static HTML, including server-rendered FreeMarker and Thymeleaf output. React can render the same DOM using `className`. Navigation, chart ranges and delegated application actions have optional public controllers. Demo CRUD, exports, charts' sample values and local storage are example application code, not a backend supplied by the library.

## Distribution and verification

`build.mjs` assembles `colibri-applications.css` from the five application source modules. The CLI copies this file alongside core CSS. The kitchen sink and registry expose the same markup. Consumer tests block all dashboard CSS/JS to ensure a copied component does not secretly require demo files.

## Native framework APIs

All 14 application examples have native React components, FreeMarker macros, and Thymeleaf fragments. The tabs do not substitute copied HTML for an adapter.

| Example | React export | Java template | Model fields |
| --- | --- | --- | --- |
| shell | `ApplicationShell` | `application-shell` | `brand`, `title`, `description`, `pages` |
| metrics | `MetricRail` | `application-metrics` | `title`, `items` |
| table | `RecordTable` | `application-table` | `title`, `description`, `columns`, `rows` |
| board | `OpportunityBoard` | `application-board` | `title`, `description`, `lanes` |
| projects | `ProjectCards` | `application-projects` | `title`, `description`, `projects` |
| planner | `DayPlanner` | `application-planner` | `title`, `description`, `events` |
| identity | `IdentityCard` | `application-identity` | `name`, `role`, `image`, `details` |
| products | `ProductCollection` | `application-products` | `title`, `description`, `products` |
| receipt | `OrderReceipt` | `application-receipt` | `title`, `description`, `items`, `total` |
| form | `ApplicationForm` | `application-form` | `title`, `action`, `submitLabel`, `fields` |
| photo | `PhotoFeature` | `application-photo` | `eyebrow`, `title`, `description`, `href`, `linkLabel`, `image`, `imageAlt` |
| article | `KnowledgeArticle` | `application-article` | `title`, `author`, `summary`, `steps`, `href`, `linkLabel` |
| conversation | `ConversationDesk` | `application-conversation` | `tickets`, `selected`, `agents`, `statuses` |
| chart | `ChartPanel` | `application-chart` | `rows`, `labels`, `title`, `ranges`, `defaultRange` |

Import React exports from `@colibri-kit/ui/react`. Application components accept `{ model, onAction, onSubmit }`. `onAction` receives `{ action, id, element, originalEvent }`; ticket select changes also provide `value`. `onSubmit` receives `{ form, formData, values, submitter, element, originalEvent }`. Repeated names become arrays in `values`; files and all native entries remain available in `formData`. Your handler updates application state or calls your API. The chart accepts its fields directly and owns its selected range.

FreeMarker: import `/colibri/freemarker/application-NAME.ftl` and call `component model=model`. The shell accepts React `children`, a FreeMarker nested body, and a Thymeleaf `content` fragment (pass `~{}` for an empty slot). Other Thymeleaf examples replace an element with `~{colibri/thymeleaf/application-NAME :: component(${model})}`. The chart instead exposes `chartPanel(...)` as shown in its tab. The Java supplement packages every native template; FreeMarker and Thymeleaf engines remain application dependencies.

For server-rendered markup, `createApplicationComponent(root, {onAction, onSubmit})` supplies delegated actions, form values and record filtering. `createApplicationShell` supplies responsive navigation; `createChartPanel` enhances a data table with a range-controlled chart. All are public `@colibri-kit/ui/core/*.js` exports. Dispose controllers when removing their roots.

The JavaScript tabs include working documentation handlers for dialogs, board changes, ticket selection/status/assignment/replies, profile forms, cart totals and receipt downloads. They use sample data, not a backend. Link examples open their actual destination outside the preview.

The native adapter source is generated at build time from `tools/applications/catalog.py`, which specifies data fields, loops and semantic elements. Consumers receive ordinary React source, `.ftl` macros and `.html` fragments; no runtime schema interpreter or private dashboard files are needed.

Verification: Java-engine binding and escaping tests cover all 14 adapters. Mounted React tests exercise props, rerenders, actions and submissions. Browser tests exercise HTML and both Java-engine outputs, plus mobile layout and chart ranges.

## Form state, host isolation and brand surfaces

Use `recordKey` or `model.id` to reset an uncontrolled React form when changing records, and `resetKey` for an explicit reset. Supply `values` and `onValuesChange` for controlled inputs. Ordinary rerenders retain an uncontrolled draft.

All optional presentation rules are scoped to `.colibri-application`. Brand the commerce hero with `--c-app-hero-bg`, `--c-app-hero-fg`, `--c-app-hero-muted` and `--c-app-hero-line`; their defaults inherit the core palette. Photographic contrast overlays and status colors remain purposeful semantic treatments. The build emits `dist/bundle-sizes.json` with separate raw/gzip sizes for core, bridge and application CSS.

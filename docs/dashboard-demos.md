# Interactive dashboard demos

Open `/kitchen-sink/examples/dashboards/` for the six-demo gallery:

| Demo | Layout | Working flows |
| --- | --- | --- |
| Analytics | Sidebar, charts and metrics | Customer filters, reports, CSV exports |
| CRM | Horizontal navigation, full-width sales board | Deal CRUD, pipeline stages, imports/exports |
| Team workspace | Light sidebar, welcome mosaic and team directory | Team creation, progress, members, roles, meeting checklist |
| Account center | Horizontal navigation, feature cards and account summary | Profile, simulated session revocation, plans, invoice CSV, member roles |
| Commerce | Dark store navigation, sales hero, orders and inventory | Order details/status, stock adjustments, filtered CSV exports |
| Support desk | Compact navigation, queue and conversation pane | Ticket creation, assignment, statuses, local replies, knowledge articles |

Team workspace takes layout inspiration from Metronic Demo 1; Account center from Demo 9. All markup, styles and demo workflows are implemented locally with Colibri; no Tailwind or third-party template assets are bundled.
These are browser-only examples using sample data, plain JavaScript, native forms/dialogs,
and semantic CSS classes with Colibri tokens. There is no account, server, real messaging,
or shared customer database.

- CRM: create, edit, change stage, delete with confirmation, search by company/owner,
  import a validated JSON export, and export all deals. Counts and summary metrics derive
  from all demo deals even when search hides cards. Historical charts are separately labeled
  sample data, not a live projection of edited deals.
- Analytics: filter customers by text/status, sort columns (MRR numerically), export visible
  customers as CSV, save a named CSV snapshot, and download/delete saved reports.
- Workspace navigation opens real `customers.html`, `inbox.html`, `reports.html` and
  `settings.html` pages with active sidebar state, refreshable URLs and normal browser history.
- Customers: directory with text/status filtering, numeric sorting, CSV export and report creation.
- Inbox: customer/team conversations, deep links to individual messages, read/unread state,
  mark-all-read and locally saved reply drafts. Nothing is sent externally.
- Reports: pipeline snapshots, customer reports saved from Analytics, search, preview,
  CSV download and confirmed deletion.
- Settings: editable workspace/profile, timezone, unread badge preference, saved appearance
  controls and confirmed demo reset. All changes are local to this browser.
- Charts: ranges select a subset of the original sample series; expandable text exposes
  plotted values. Source tabs support roving focus, arrows, Home and End.
- Mobile navigation: Escape, close control, backdrop and a keyboard focus loop; hidden links
  are inert. Native modal dialogs provide modal focus management.

Data is saved under `colibri-dashboard-v1` in localStorage for this origin. All dashboard pages
share that state. If storage is blocked or full, the page remains usable with a visible
warning. Export before resetting or clearing browser storage. JSON imports append up to
100 deals per file, assign new IDs, and reject invalid files before changing state.

Validation: `npm run build && npm run test:e2e`. Dashboard checks cover CRUD, persistence,
HTML-like input, valid/invalid imports, filters, numeric sorting, CSV contents, reports,
reset, inbox, chart ranges, keyboard source tabs, blocked storage, and layouts at
320/768/1440 pixels in Chromium. Cross-browser checks cover these pages in Chromium, Firefox and WebKit; manual screen-reader testing remains separate.

The four additional demos use `apps.css` for named layout components and `apps.js` for their independent browser-only workflows. Each stores data under `colibri-demo-<name>-v1`; query-string routes are refreshable and linkable. No real invitations, security settings, payments or support messages are changed. `test/e2e/demo-apps.e2e.mjs` checks these workflows, persistence, layouts, button-label visibility and accessibility.

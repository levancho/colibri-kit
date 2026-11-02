# Interactive dashboard demos

Open `/kitchen-sink/examples/dashboards/analytics.html` or `crm.html` in the built site.
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

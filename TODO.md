# TODO

Open items from the November 2026 audit. Version 0.1.0 is released; everything unticked below is still open on
`main`. Items fixed before the release are not listed.
Each item says where the problem is. "Verified" means it was reproduced by running code; "inferred" means it was
found by reading.

## Release 0.1.0

- [x] **Publish to npm.** `@colibri-kit/css` and `@colibri-kit/ui` 0.1.0 were published on 10 Nov 2026 from
      commit `0cc5074` with staged publishing (`npm stage publish`, approved with 2FA). See `docs/publishing.md`.
- [x] **Tag the release.** `v0.1.0` is on commit `0cc5074`, with a
      [GitHub release](https://github.com/levancho/colibri-kit/releases/tag/v0.1.0) published on 11 Nov 2026.
- [x] **Merge into `main`.** Done; the site is deployed from `main`.
- [x] **Docs and agent skills** name the npm packages and the Maven Central dependency instead of manual installs.
- [ ] Add a root `CHANGELOG.md`.

## React Native

- [ ] **Publish `@colibri-kit/native-core` and `@colibri-kit/native-full` 0.1.0 to npm**, Core first (staged publishing, see
      `docs/publishing.md`). The site already shows both `npm install` lines.
- [ ] **Run the catalog on real iOS and Android devices.** The package is tested through react-native-web only.
      Check first: bottom sheet versus scroll view on Android, swipe rows inside lists, native-driver animations,
      Android elevation, and the default safe-area insets.
- [x] **Optional libraries.** Done as Core (`@colibri-kit/native-core`) and Full (`@colibri-kit/native-full`), with separate
      `/gestures`, `/svg` and `/safe-area` entries. See the package README.
- [ ] **Full on a device.** Highest risk first: `BottomSheet` scroll hand-off with real touch scrolling, gestures
      inside `Modal` on Android, long-press drags against native scroll views, keyboard handling in the sheet.
- [ ] Drag and drop between stages for `ApplicationBoard` in the gestures entry. A first version was removed because
      it used the old side-by-side lanes; it needs a design for the stage-tab layout.
- [ ] Not in the gestures entry yet: `ActionSheet`, scroll hand-off for the bottom `Drawer`, virtualised `Sortable`
      and `AnimatedList`. Not in the SVG entry: a time scale, horizontal bars, animated value changes.
- [ ] `mobile.js` does not honour reduce-motion; move `useReducedMotion` from `motion.js` into `internal.js`.
- [ ] `Tabs` (basics) and `SegmentedControl` (forms) overlap; keep one.
- [ ] Add it to the publish workflow; decide whether it shares the version of the other two packages.
- [ ] Not built: indeterminate progress bar, multi-column sort and column visibility in `DataTable`, arrow-key roving
      focus in several components on the web target, a toast queue, an RTL review.

## Accessibility

- [ ] **Focus is invisible in forced-colors mode** for most themed controls (verified in Chrome emulation).
      `themes/colibri.css` uses `outline:none` plus a box-shadow ring in about 25 places and has no
      `forced-colors` rule. Add `@media (forced-colors: active)` with a `Highlight` outline.
      `docs/quality-review.md` lists this as done; correct it.
- [ ] **Theme packs and accent presets fail text contrast** (verified). Ember dark primary button 2.45:1, Ember
      light 3.97, Glacier light 4.35, orange preset 3.56. `--c-brand-fg` is not scheme-aware in Ember/Midnight.
      Add the contrast script to CI for every pack and scheme.
- [ ] **Control borders are 1.3:1** against surfaces in both schemes (3:1 needed); some badges on sunken
      surfaces are 4.27–4.44:1 (verified). Consider a separate `--c-control-line`.
- [ ] **Theme packs override `prefers-reduced-motion` and `prefers-contrast`** (verified). Wrap pack motion tokens
      in `@media (prefers-reduced-motion: no-preference)`.
- [ ] **UI theme without the bridge** fails several checks: focus ring 2.56:1, success/warning used as text at
      3.30 and 2.15 (verified).
- [ ] **Bridge does not map `--ui-destructive-foreground`**: white on light red (2.72:1) in OS dark mode (verified).
- [ ] **Menu**: disabled items get no menu role (`src/core/menu.js:23`).
- [ ] **Popover, hover-card, date-picker** content is `role="dialog"` with no accessible name; popover does not
      move focus inside.
- [ ] **Non-modal dialog** ignores Esc and outside click (verified).
- [ ] **Tooltip** closes when the pointer leaves the trigger, so it is not hoverable (WCAG 1.4.13).
- [ ] **Stepper** `data-clickable` steps are click-only; **calendar** uses `aria-selected` on buttons;
      **carousel** autoplay ignores reduced motion and has no pause control.
- [ ] **Screen-reader testing has never been done.** Either do it or soften the homepage line
      "Keyboard & screen-reader support built in".
- [ ] **RTL**: only tabs and button-group handle it; the theme uses physical properties throughout.

## Component bugs

Regression tests: `test/bugs-forms.test.js`, `test/bugs-base.test.js`, `test/bugs-react.test.js` and
`test/e2e/bugs-browser.e2e.mjs` (Chrome; add it to the `test:e2e` script in `package.json`).

- [x] **Confirm dialogs can be escaped**: three presses of Esc closed an `alert-dialog` or a vetoed
      `ui:beforeclose` in Chrome. Escape is now handled (and cancelled) on keydown for the topmost dialog only, after
      nested layers, so Chrome's close request never runs. `src/core/dialog.js`.
- [x] **Non-modal dialog** (`data-modal="false"`) closes on Escape and on a press outside
      (`data-close-on-outside`, default `data-close-on-backdrop`); focus returns to the trigger.
- [x] **Sortable** captured the pointer on press, so controls inside items could not be clicked. A drag now starts
      after 5px of travel, never from a control inside an item; `pointercancel` puts the item back.
- [x] **Accordion** toggled when a nested component's trigger was clicked; only an item's own trigger counts now.
- [x] **Datatable and pager desynchronised** after search or sort. The table owns page, filter and sort and keeps
      the pager on its page (without moving focus). Pagination should get a silent `sync({page,total})` so the
      datatable need not clamp it with `setTotal()` (proposed for `navigation.js`).
- [ ] **Tooltip / hover-card timers survive destroy**, leaving a stuck layer that blocks a parent popover
      (verified). `src/core/popover.js:57`. Same omission in navigation-menu, reasoning, clipboard.
- [x] **React**: alert, badge and attachment no longer remove React's node (hidden; the app removes it on
      `dismiss`/`remove`); `DataList`, `Callout`, `Inset` are CSS-only kinds; `options` are compared by value and
      callbacks always call the latest function. A React-rendered toaster is never moved into a wrapper.
- [x] **Destroy then re-create leaked** hidden inputs (slider, pin-input, sortable): fixed in `forms.js`.
- [ ] Menubar and scrollspy leak listeners on destroy (verified): fix proposed for `menu.js` and `navigation.js`.
- [x] **Slider**: `pointercancel`/`lostpointercapture` end the drag; float steps are rounded to the step's precision.
      Resizable and sortable handle `pointercancel` too.
- [x] **Custom elements**: `<ui-checkbox>`, `<ui-switch>` and `<ui-toggle>` are focusable and work with Space/Enter;
      `<ui-textarea>` wraps a `<textarea>` instead of throwing.
- [x] **Toast**: never renders into a removed toaster; the action uses the latest options; the list stays a list
      inside a named `role="region"` wrapper; each toast is announced once through a live region.
- [ ] **`.card` collapses** to one word per line inside flex or `.cluster` because of `container-type: inline-size`
      (reproduced: 41px wide, one word per line). Fix proposed for `packages/colibri-css`: make the container opt-in
      (`.card.container`).
- [x] **CSP**: `motion.register()` uses a constructed stylesheet (`adoptedStyleSheets`), with a `<style>` fallback
      that takes a nonce. See `docs/csp.md`.
- [ ] **Lazy loader**: one slow chunk delays every component in the pass; a failed chunk cannot be retried
      without a reload (browser caches the failure). Both are documented; consider per-module initialisation.
- [x] Smaller items fixed: toolbar no longer takes keys from nested fields and popups; file-input matches `accept`
      like the browser (wildcards, extensions, case, literal `+` and `.`); theme-switch validates stored and submitted
      modes; no null dereferences when parts are missing; chart panels and datatable read localised numbers
      (`parseNumber`).
- [ ] Smaller items in other files, fixes proposed: duplicate ids in navigation-menu and in tabs with spaces in
      values (`menu.js`, `tabs.js`); sidebar Ctrl/Cmd+B from text fields and a configurable key (`navigation.js`);
      date-picker accepting out-of-range dates (`calendar.js`); `parseFloat("1,200")` in the conversation chart
      (`ai.js`); carousel swallowing keys meant for nested inputs.

## Stylesheets

- [ ] **Vocabulary is only partly unified.** UI `[data-ui-part=badge]` ignores `data-tone`; sizes are `s|l` in
      CSS and `sm|md|lg|xl|icon` in UI; `soft` and `secondary` are different words.
- [ ] **Prefixed build covers the core stylesheet only.** Themes, packs, application components, the React
      adapter and the templates still emit unprefixed classes. Global element rules are not prefixed either.
- [ ] **Loading the UI theme without the bridge turns OS dark mode off** (verified); `themes/packs/README.md`
      shows that stack.
- [ ] **Layered `!important`** cannot be overridden by unlayered `!important`; document the recipe.
- [ ] **No print styles**; forced `data-theme="dark"` prints light grey on white.
- [ ] **No fallback for browsers without `light-dark()`**: buttons render as bare text. Publish the real floor
      (about Chrome 123, Safari 17.5, Firefox 121) and add an `@supports` fallback palette.
- [ ] `--c-hue` yellow renders olive; status colours and 60 hard-coded colours in the theme are not reached by
      the token. Reword "one token to re-brand".

## Java / templates

- [x] **Publish to Maven Central.** `ai.l3v.colibri:colibri-templates:0.1.0` was released on 10 Nov 2026
      (signing key fingerprint `104A84AB9E85EF59BB03834B670F6062120D3510`). See `docs/publishing.md`.
- [ ] Add the four repository secrets so `publish-maven.yml` can make later releases, or keep releasing by hand.
- [ ] **`javascript:` URLs pass through `href`/`src`/`action` parameters** in both engines (verified). Now
      documented; consider a scheme allow-list helper.
- [ ] **Thymeleaf slot parameters** (`card`, `dialog`, `collapsible`, `application-shell`) treat a String as a
      template name; warn in the docs and guard the slot.
- [ ] **Duplicate ids** when `spring-field`, `promptInput` or `sidebarShell` is used twice with defaults.
- [ ] **`sidebarShell` / `sidebarInset`** are an unbalanced pair; `title` is declared and unused.
- [ ] **No i18n hooks**: hard-coded English labels in both template sets.
- [ ] **Coverage gap**: 89 FreeMarker macros, 37 native Thymeleaf fragments of 169 entries; Spring binding exists
      for one fragment only; FreeMarker has no `BindingResult` integration. List what is covered.
- [ ] **Thymeleaf fragments are positional with no defaults**, and fragment names differ from file names
      (`dropdown_menu`, `data_list`, `chartPanel`). Document or align.
- [ ] **Tests**: attribute-context escaping, URLs, nested-body escaping and most macros with hostile input are
      untested; no Spring Boot auto-configuration test.
- [ ] `tools/package-java-download.py` hard-codes the version and compares only top-level templates; show the
      JAR's sha256 on the download page.
- [ ] Pin the remaining Maven plugins; add a Maven wrapper.

## Packaging, CLI, CI

- [ ] **TypeScript declarations** for `@colibri-kit/ui/react`, `core/util` and the controller factories.
- [ ] **The UI package bundles its own copy of the CSS package** with no version link. Make css a dependency
      or stop publishing it separately.
- [ ] **GitHub Actions are pinned by tag**, not commit SHA, in jobs that hold publish and deploy credentials.
      Move publishing to npm trusted publishing (OIDC) and put it behind a protected environment.
- [ ] **Publish workflow** does not run every generator or `test:consumer`; pre-releases would go to `latest`.
- [ ] **CLI**: `info` and the MCP server report repo-relative paths that are wrong for npm consumers;
      `diff` exits 0 when files differ and does not report stale files; unknown commands exit 0; `init` follows
      pre-planted symlinks; `init --force` is not atomic; importing `bin/colibri.mjs` runs it.
- [ ] **MCP server** has no tests; validate tool arguments against the declared schemas; bound `limit`.
- [ ] **Stale hashed chunks** accumulate in consumer projects after `colibri init` upgrades.
- [ ] **`colibri-classes.json` lists the core stylesheet's 23 classes only**; the applications stylesheet has
      about 195 more.
- [ ] `registry/colibri.json` is 2.5 MB (68% of the package) and contains a real-looking address in demo
      markup 30 times; replace it with an example address.
- [ ] Add `SECURITY.md`, `CONTRIBUTING.md`, a root `CHANGELOG.md` and a versioning policy.
- [ ] Add `.gitattributes` so a CRLF checkout does not change generated byte counts.
- [ ] Icons are described as "lucide-style"; add a notice if any paths were copied.

## Documentation and claims

- [ ] **Homepage framework support** overstates the adapters: React has 14 native wrappers and 155 through the
      generic adapter; Thymeleaf has 37 native; 15 "native" FreeMarker entries call no macro.
- [ ] **Numbers disagree between documents**: "169 catalog entries" includes 12 CSS documentation entries and
      blocks (87 have a controller); the README catalog omits 23 entries; `docs/colibri-ui.md` says 133.
      Generate every number from one source.
- [ ] **"Container queries"** is advertised; there are none.
- [ ] The hero's "18 KiB" names only the core stylesheet; say what a typical page loads.
- [ ] **Generated events table** shows no events for about 40 catalog entries whose markup uses registered
      controllers (for example `toast` → `toaster`); resolve catalog names to `data-ui` names.
- [ ] `docs/colibri-ui.md` still says the React wrapper is "later" and uses an old folder name.
- [ ] `package.json` homepage is `colibri-kit.io` while docs use `colibri.l3v.ai`; pick one.
- [ ] "Colibri Bridge" (palette transport) and "the bridge stylesheet" are two things with one name.
- [x] The homepage HTML snippet now links pinned files from npm via a CDN and shows `class="ui-root"`.
- [ ] Pinned CDN versions in the guides and homepage are written by hand; inject the version at build time.

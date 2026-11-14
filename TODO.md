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

- [x] **Focus is invisible in forced-colors mode** (fixed on `phase1-a11y`): `@media (forced-colors: active)` in
      `themes/colibri.css` gives every focusable themed control a `Highlight` outline and draws selected states in
      system colours; `docs/quality-review.md` corrected. Tested in `test/e2e/a11y-rtl-media.e2e.mjs`.
- [x] **Theme packs and accent presets fail text contrast** (fixed): darker light accents (Ember, Glacier, Midnight),
      scheme-aware `--c-brand-fg`, text-safe presets with dark-mode foregrounds, Midnight follows the OS scheme.
      `npm run check:contrast` (`tools/check-contrast.mjs`, in CI) measures every stack, pack, preset and scheme.
- [x] **Control borders / badges on sunken surfaces** (fixed): new `--c-control-line` (3:1) for inputs, `--ui-input`
      raised to 3:1, `--c-line`/`--ui-border` stay light for dividers; `--c-accent-ink` for text on accent tints.
- [x] **Theme packs override `prefers-reduced-motion` and `prefers-contrast`** (fixed): pack motion tokens sit in
      `@media (prefers-reduced-motion: no-preference)`; packs repeat the `prefers-contrast: more` tokens.
- [x] **UI theme without the bridge**: ring, success, warning, destructive and muted text now pass (fixed).
- [x] **Bridge maps `--ui-destructive-foreground`** to `--c-brand-fg` (fixed).
- [x] **Menu**: disabled items keep their role with `aria-disabled`; submenu Escape, RTL Left/Right, menubar roving
      tab stop with Home/End, context-menu focus return (fixed).
- [x] **Popover, hover-card, date-picker** dialogs are named; popover moves focus inside and back (fixed).
- [x] **Non-modal dialog** closes on Esc and on an outside press, focus returns to the trigger (fixed in
      `src/core/dialog.js`; verified in Chrome by `test/e2e/bugs-browser.e2e.mjs`).
- [x] **Tooltip** is hoverable, persistent and dismissable with Esc (WCAG 1.4.13) (fixed).
- [x] **Stepper** clickable steps are buttons; **calendar** uses the APG date grid (`aria-selected` on gridcells);
      **carousel** has a pause/play button, pauses on hover and focus, no autoplay under reduced motion (fixed).
- [ ] **Screen-reader testing has never been done.** The manual script is `docs/screen-reader-testing.md`
      (VoiceOver macOS/iOS, NVDA, JAWS, TalkBack). Until it has been run, the homepage says "Keyboard support and
      WAI-ARIA roles built in; screen-reader testing in progress" instead of "Keyboard & screen-reader support".
- [x] **RTL** (fixed): the theme uses logical properties; tabs, menu, menubar, navigation menu, carousel, calendar,
      button group, radio group, toolbar and slider follow `dir="rtl"` (shared `isRTL`/`logicalKey` in
      `src/core/util.js`). The slider measures pointer presses from the right edge and its theme rules use
      `inset-inline-*`. Tested in `test/e2e/a11y-rtl-media.e2e.mjs` and `test/bugs-phase1.test.js`.
- [x] **axe findings outside the themed components** (fixed; the KNOWN list in `test/e2e/a11y-axe.e2e.mjs` is empty):
      progress bars named, a checkpoint with a button is a named group, reaction names include their count
      (`src/core/ai.js`); the theme switch keeps its visible text as its name and the message-scroller viewport is a
      tab stop (`src/core/base.js`); gallery `--s-muted` darkened and code panels focusable (`tools/`); demo inputs
      and icon-only provider buttons labelled; blocks `li[data-off]` and the "−20%" label pass contrast.

## Component bugs

Regression tests: `test/bugs-forms.test.js`, `test/bugs-base.test.js`, `test/bugs-react.test.js`,
`test/bugs-phase1.test.js` and `test/e2e/bugs-browser.e2e.mjs` (Chrome; part of `npm run test:e2e`).

- [x] **Confirm dialogs can be escaped**: three presses of Esc closed an `alert-dialog` or a vetoed
      `ui:beforeclose` in Chrome. Escape is now handled (and cancelled) on keydown for the topmost dialog only, after
      nested layers, so Chrome's close request never runs. `src/core/dialog.js`.
- [x] **Non-modal dialog** (`data-modal="false"`) closes on Escape and on a press outside
      (`data-close-on-outside`, default `data-close-on-backdrop`); focus returns to the trigger.
- [x] **Sortable** captured the pointer on press, so controls inside items could not be clicked. A drag now starts
      after 5px of travel, never from a control inside an item; `pointercancel` puts the item back.
- [x] **Accordion** toggled when a nested component's trigger was clicked; only an item's own trigger counts now.
- [x] **Datatable and pager desynchronised** after search or sort. The table owns page, filter and sort and keeps
      the pager on its page through the pager's silent `sync({ page, total })` (no `ui:change`, no focus move;
      `src/core/navigation.js`).
- [x] **Timers survive destroy** (fixed): tooltip, hover-card (`popover.js`), reasoning and navigation-menu clear
      their timers in `destroy` (`test/a11y-behaviour.test.js`); clipboard keeps its reset timer and clears it
      (`base.js`, `test/bugs-phase1.test.js`).
- [x] **React**: alert, badge and attachment no longer remove React's node (hidden; the app removes it on
      `dismiss`/`remove`); `DataList`, `Callout`, `Inset` are CSS-only kinds; `options` are compared by value and
      callbacks always call the latest function. A React-rendered toaster is never moved into a wrapper.
- [x] **Destroy then re-create leaked** hidden inputs (slider, pin-input, sortable): fixed in `forms.js`.
- [x] **Menubar and scrollspy leaked listeners on destroy** (fixed): menubar uses a listener bag (`menu.js`);
      scrollspy removes its click handler and cancels a pending animation frame (`navigation.js`).
- [x] **Slider**: `pointercancel`/`lostpointercapture` end the drag; float steps are rounded to the step's precision.
      Resizable and sortable handle `pointercancel` too.
- [x] **Custom elements**: `<ui-checkbox>`, `<ui-switch>` and `<ui-toggle>` are focusable and work with Space/Enter;
      `<ui-textarea>` wraps a `<textarea>` instead of throwing.
- [x] **Toast**: never renders into a removed toaster; the action uses the latest options; the list stays a list
      inside a named `role="region"` wrapper; each toast is announced once through a live region.
- [x] **`.card` collapsed** to one word per line inside flex, `.cluster` or a fit-content parent because of
      `container-type: inline-size` (fixed): a card is no longer a size container; add `.container` to one whose
      content uses container queries. The kitchen-sink example now works (a container query measures an ancestor,
      so the layout sits inside a `.card.container`; before, the wide card never switched). Tested in Chrome.
- [x] **CSP**: `motion.register()` uses a constructed stylesheet (`adoptedStyleSheets`), with a `<style>` fallback
      that takes a nonce. Templates write no `style` attribute by default: chart legend dots come from the
      stylesheet, the FreeMarker `skeleton` is sized by the theme (its `w`/`h` arguments still write one; use a
      class under a strict policy). See `docs/csp.md`; checked by `npm run test:java`.
- [ ] **Lazy loader**: one slow chunk delays every component in the pass; a failed chunk cannot be retried
      without a reload (browser caches the failure). Both are documented; consider per-module initialisation.
- [x] Smaller items fixed: toolbar no longer takes keys from nested fields and popups; file-input matches `accept`
      like the browser (wildcards, extensions, case, literal `+` and `.`); theme-switch validates stored and submitted
      modes; no null dereferences when parts are missing; chart panels and datatable read localised numbers
      (`parseNumber`).
- [x] Smaller items in other files (fixed, `test/bugs-phase1.test.js`): unique ids in navigation-menu and in tabs
      (values escaped for ids, so `aria-controls` survives a space); sidebar Ctrl/Cmd+B ignores text fields,
      editors, Alt/Shift chords and handled events, with `data-shortcut` (`"false"` turns it off); the date picker
      rejects disabled and out-of-range dates (initial value, setter, typed value with `aria-invalid` and
      `valid: false`); the conversation chart reads localised numbers (`parseNumber`).
- [x] Carousel no longer takes arrow keys typed in a field inside a slide (`src/core/base.js`; tested in
      `test/bugs-phase1.test.js`).

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

# TODO

Open items from the November 2026 audit (branch `npm-and-dx`). Items already fixed on that branch are not listed.
Each item says where the problem is. "Verified" means it was reproduced by running code; "inferred" means it was
found by reading.

## Release blockers

- [x] **Publish to npm.** `@colibri-kit/css` and `@colibri-kit/ui` 0.1.0 were published on 10 Nov 2026 from
      commit `0cc5074` with staged publishing (`npm stage publish`, approved with 2FA). See `docs/publishing.md`.
- [ ] **Tag the release**: `v0.1.0` on the published commit, and add a root `CHANGELOG.md`.
- [ ] **Merge `npm-and-dx` into `main`** once CI is green (merging deploys the site).

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

- [ ] **Confirm dialogs can be escaped**: three presses of Esc close an `alert-dialog` or a vetoed
      `ui:beforeclose` in Chrome (verified). `src/core/dialog.js:105`. Prevent the Escape keydown as well.
- [ ] **Sortable** captures the pointer on press: buttons and checkboxes inside items cannot be clicked
      (verified). `src/core/forms.js:274`. Apply the same threshold fix as the drawer.
- [ ] **Accordion** toggles when a nested component's trigger is clicked (verified). `src/core/collapsible.js:70`.
- [ ] **Datatable and pager desynchronise** after search or sort (verified). `src/core/base.js:192`.
- [ ] **Tooltip / hover-card timers survive destroy**, leaving a stuck layer that blocks a parent popover
      (verified). `src/core/popover.js:57`. Same omission in navigation-menu, reasoning, clipboard.
- [ ] **React**: components that remove their own root (alert, badge, attachment) crash on unmount (verified);
      `DataList`, `Callout`, `Inset` name kinds that are not registered; an inline `options` object recreates
      the controller on every render.
- [ ] **Destroy then re-create leaks** hidden inputs (slider, pin-input, sortable) and listeners (menubar,
      scrollspy) (verified).
- [ ] **Slider**: a cancelled touch leaves the drag armed; float steps post `0.30000000000000004` (verified).
      Same missing `pointercancel` in resizable and sortable.
- [ ] **Custom elements**: `<ui-checkbox>` and `<ui-toggle>` are not focusable; `<ui-textarea>` throws (verified).
- [ ] **Toast**: renders into a removed toaster; action click uses stale options; `role="region"` on the `<ol>`.
- [ ] **`.card` collapses** to one word per line inside flex or `.cluster` because of `container-type`, while the
      kit ships no `@container` rules (verified). Remove it from `.card` or document it.
- [ ] **CSP**: `motion.register()` injects a `<style>` element, which a strict policy blocks silently (verified).
      Use `adoptedStyleSheets` or accept a nonce; add a CSP section to the docs.
- [ ] **Lazy loader**: one slow chunk delays every component in the pass; a failed chunk cannot be retried
      without a reload (browser caches the failure). Both are documented; consider per-module initialisation.
- [ ] Smaller items: duplicate ids across instances (navigation-menu, tabs with spaces in values); carousel and
      toolbar swallowing keys meant for nested inputs; file-input MIME matching; theme-switch trusting stored
      values; date-picker accepting out-of-range dates; sidebar hijacking Ctrl/Cmd+B; null dereferences when
      parts are missing; chart `parseFloat("1,200")`.

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

- [ ] **Publish to Maven Central.** The POM is ready (release version 0.1.0, project metadata, sources and
      javadoc archives, signing, Central Portal upload in the `release` profile; `publish-maven.yml` workflow).
      Still needed from the owner: Central Portal account, `ai.l3v` namespace verification, user token and a
      signing key. See `docs/publishing.md`. Then update `docs/java-templates.md` and the site page to drop the
      manual install steps.
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
- [ ] Add `SECURITY.md`, `CONTRIBUTING.md`, a root `CHANGELOG.md`, git tags and a versioning policy.
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

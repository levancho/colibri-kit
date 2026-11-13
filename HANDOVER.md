# Handover: Colibri for React Native (catalog port)

Written 13 Nov 2026. Read this to continue the work on branch `native-catalog`.

## State in one paragraph

`main` has `@colibri-kit/native` with 23 basic components (merged in PR #16; **not yet published to npm**). Branch
`native-catalog` extends it to the whole web catalog plus phone-only patterns: 203 components and hooks in twelve
groups, with 161 demos. Every demo opens cleanly and the type declarations compile, but the full test suite has not
been run on this branch, the site has not been rebuilt, and **no pull request is open**. Nothing on this branch is
live.

## What is on the branch

| Area | Files |
|---|---|
| Components | `packages/colibri-native/src/*.js` (one file per group; see `packages/colibri-native/ARCHITECTURE.md`) |
| Types | `packages/colibri-native/index.d.ts`, `packages/colibri-native/types/*.d.ts` |
| Demos (the catalog) | `examples/native/demos/*.js`, registry in `examples/native/demos/index.js`, app shell `examples/native/App.js` |
| Site page | `site/src/native/` (`index.html`, `catalog.js`, `native.css`); the card list is generated from the demo bundle |
| Tools | `tools/native-smoke.mjs` (opens every demo, fails on errors or warnings), `tools/native-ref.py` (prints a web catalog entry), `tools/build-native-demo.mjs` |
| Tests | `test/native-theme.test.js`, `test/e2e/native.e2e.mjs`; `npm run test:e2e` now also runs the smoke tool |
| Docs | `packages/colibri-native/README.md` (component table, limits, what was not ported and why) |

Groups: basics, phone patterns (`mobile.js`), display (`base.js`), data display, overlays (`menus.js`), navigation,
forms, pickers, conversation, AI elements, motion and theming, auth blocks, navigation layouts (`sidebars.js`),
application components.

## Verified so far

- `node tools/native-smoke.mjs` → 161 of 161 demos passed (no errors or warnings).
- No duplicate export names across `src/*.js`.
- All declarations compile under `tsc --strict` against React Native 0.88's own types (checked with a packed copy of
  the package in a scratch project; the repo itself has no `tsc`).
- Each group's interactions were exercised in a browser through react-native-web while it was built.
- Contact sheets of the display, forms, AI and auth-block demos were reviewed by eye in light and dark.

## Not verified

- **No real device.** Everything ran through react-native-web. Native-driver animation, gesture arbitration
  (bottom sheet versus scroll view on Android, swipe rows inside lists), Android elevation and safe-area defaults are
  untested.
- The full suite (`npm test`, `npm run test:e2e`, `npm run test:consumer`, `npm run check:architecture`) has not been
  run since the groups were integrated.
- Contact sheets of data display, overlays, navigation, conversation, motion, pickers, nav layouts, application
  components and phone patterns were not reviewed by eye by the integrator (their authors did review them).

## Next steps, in order

1. `npm run build`, then `npm run check:architecture`, `npm test`, `npm run test:e2e`, `npm run test:consumer`.
   Fix what fails. `test/e2e/native.e2e.mjs` was rewritten for the catalog page and has not been run against a build
   that includes every group.
2. Look at the `/native/` page in a browser at desktop and phone widths (card list by category, filter, phone demo).
3. Update `skills/colibri-kit/SKILL.md` (the React Native section still lists the first 23 components), bump its
   version and `skills/colibri-kit/CHANGELOG.md`.
4. Update `TODO.md` → "React Native" section (most of its "not built yet" list is now built).
5. Delete this file, commit, push, open a PR from `native-catalog` to `main`. The site deploys on merge.
6. Publish `@colibri-kit/native` to npm (see below). Decide the version first: 0.1.0 has never been published, so the
   expanded package can still go out as 0.1.0.

## Decisions already made by the owner

- Port the whole web catalog, but **leave out what does not make sense on a phone** and say so. Removed: kbd, hover
  card, resizable, breadcrumb, command palette, navigation menu, sticky, scroll area, aspect ratio, direction,
  accessible icon, label, separator, native select; plus reparent and the twelve Colibri CSS entries. Reasons are in
  the package README.
- Quality bar: at least as good as established React Native libraries; no token ports.
- Phone-only components must be fast: animations on the native driver, transform and opacity only, no state updates
  during a drag, memoised leaves. The rules are stated at the top of `src/mobile.js`.
- The demo page lists components by category, like React Native's own components page.

## Open decision: optional dependencies

The package has no dependencies beyond `react` and `react-native`. The owner asked about Reanimated and has not yet
confirmed. Recommendation given: after this branch is merged, do a second pass that adds **optional** peer
dependencies, used only when installed:

- `react-native-reanimated` + `react-native-gesture-handler`: swipe-to-dismiss sheets and drawers, bottom sheet and
  swipe-row tracking, drag-to-reorder (`Sortable`), drag and drop on `ApplicationBoard`, layout animations.
- `react-native-svg`: line, area and pie charts, and real icons.
- `react-native-safe-area-context`: automatic insets for `BottomBar`, `AppBar`, sheets.

Do not start this without the owner's yes.

## Known limits to carry forward

- Charts are bar-based only; icons are text glyphs.
- `FileInput`, `ImageInput` and copy buttons take callbacks (`onPick`, `onCopy`); core has no picker or clipboard.
- `mobile.js` does not honour reduce-motion (the hook lives in `motion.js`; group files do not import each other).
  Moving `useReducedMotion` into `internal.js` would fix that.
- `Tabs` (basics) and `SegmentedControl` (forms) overlap; `SegmentedControl` is the richer one.
- `test/e2e/application-components.e2e.mjs` failed once in a local full run and passed in every rerun and in CI; the
  cause was not found.
- Open items for the web kit are in `TODO.md`.

## Working conventions for this repository

- Commits are authored as `Levancho <levancho@users.noreply.github.com>` with no AI attribution in commit messages,
  PR bodies or files.
- `main` cannot be pushed to directly: open a PR and the owner merges it. Releases and tags are created by the owner
  in the GitHub UI.
- `site/dist` and other generated files are committed; CI fails if a fresh `npm run build` changes them. Run the build
  before committing, and rebuild before running browser tests (they test `site/dist`).
- Run the smoke tool from the repository root. It builds into a temporary folder, so it does not touch `site/dist`.

## Publishing `@colibri-kit/native` (owner's machine)

```sh
git checkout main && git pull origin main
cd packages/colibri-native
npx -y npm@11.21.2 login
npx -y npm@11.21.2 stage publish --access public
npx -y npm@11.21.2 stage approve <stage-id>
npm view @colibri-kit/native version
```

Details and the Maven equivalent are in `docs/publishing.md`.

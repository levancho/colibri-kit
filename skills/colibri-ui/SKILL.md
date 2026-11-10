---
name: colibri-ui
description: Build UI with Colibri UI (headless data-ui components, FreeMarker macros, --ui-* theme tokens). Use when a project has colibri.json or imports colibri-ui, or the user asks to build or change components in an existing Colibri project.
---
# Colibri UI skill

## 1. Get project context first
Run `node <colibri>/bin/colibri.mjs info --json` (or MCP tool `get_project_info`). It returns the files to include,
markup rules, and every component/block name. Do not guess names: run `colibri search "<what you need>"`, then
`colibri view <name>` for the exact markup and FreeMarker snippet, and `colibri docs <name>` for keyboard/ARIA notes.

## 2. Markup contract (never break these)
- A component root has `data-ui="name"`; its pieces have `data-ui-part="part"`. Nested components stay isolated.
- Semantic state lives in `data-state`, `aria-*` and `hidden`. Do not duplicate it with presentation classes; controller-owned custom properties for measured geometry are a separate concern.
- Behaviour is automatic: `src/core/auto.js` initialises on load, on `ui:refresh` and after `htmx:afterSwap`.
  After inserting HTML yourself, dispatch `document.dispatchEvent(new Event("ui:refresh"))`.
- Events are bubbling `ui:*` CustomEvents (`ui:change`, `ui:submit`, `ui:open`…); cancelable ones honour preventDefault().
- Custom elements `<ui-NAME>` exist for every component (light DOM, same core); use them only if the project does.

## 3. Composition rules
- Forms: each control in `data-ui="field"` (label, control, description, error). Passwords: `toggle-password`.
  Codes: `pin-input`. Option sets: `toggle-group` or `radio-group`. Native choice lists: `native-select`.
- Overlays: `dialog`, `alert-dialog`, `sheet`/`drawer` (drag to dismiss), `popover`, `hover-card`, `tooltip`.
- Menus: `dropdown-menu`, `context-menu`, `menubar`, `navigation-menu`, `command`.
- App shells: copy a sidebar block (`sidebar-01`…`sidebar-16`); auth pages: `login-01…05`, `signup-01…05`
  (one `auth-form` with views password / magic-link / forgot / sent / otp / done).
- Chat / AI: `message` + `bubble` in a `message-scroller`, `prompt-input`, `suggestion`, and the AI blocks
  (`tool`, `reasoning`, `plan`, `task`, `chain-of-thought`, `sources`, `terminal`, `test-results`, `stack-trace`,
  `subagent`, `confirmation`, `checkpoint`, `context`, `file-tree`, `queue`).
- Layout wrappers are classes, never new `data-ui` names.

## 4. Theming
- Include `themes/colibri.css` (+ `themes/motion.css`) and put `class="ui-root"` on the app root.
- Override tokens only: `:root{--ui-primary:…;--ui-radius:…}` or on any container to scope. Dark mode:
  `[data-theme=dark]`. Accent presets: `<html data-ui-theme="green|rose|orange|violet|blue">`.
  Token list: MCP `get_theme_tokens`. Use semantic tokens (`--ui-muted-foreground`, `--ui-destructive`), not raw colours.
- Motion: `data-ui-motion="fade|slide-up|scale|…"` on anything that appears/disappears; respects reduced motion.

- Prefer semantic component classes and reusable template/React compositions over repeated class strings or inline presentation styles. Keep spacing, typography and color decisions in shared tokens; keep data-driven custom properties in markup only where needed.
- The optional UI theme, packs and looks use ordered cascade layers. Unlayered application CSS overrides normal visual declarations; preserve hidden-state, touch-target and reduced-motion safeguards. Tab, accordion, tab-navigation and callout looks use component tokens; edit their owning rules rather than adding competing descendant overrides.
- Headless does not mean no CSS is allowed or that accessibility is certified. Preserve labels, focus visibility, native semantics and ownership of nested parts.

## 5. Server side (Java templates)
FreeMarker and Thymeleaf are server dependencies, not browser scripts. Require the host engine or its Spring Boot starter. Colibri ships `.ftl` macros and native Thymeleaf fragments; `java/colibri-templates` builds a resource JAR, not an embedded engine. FreeMarker HTML auto-escaping stays enabled; use nested bodies/captured markup for structured content. Thymeleaf Spring fields use `th:field`/`th:errors` against the host form object. See `docs/java-templates.md` in a full checkout for dependencies and setup.

### Spring + FreeMarker
`[#import "/colibri/freemarker/ui.ftl" as ui]` then the macro from `colibri view <name>`. Always pass named arguments.
Keep Spring binding: macros only emit markup; `name=` attributes are yours.

## 6. Before you finish
Every interactive thing must be reachable by keyboard and labelled. Check `colibri docs <name>` for the expected
keys. For Colibri repository changes, build before browser tests: `npm test`, `npm run test:java` (JDK 17+ and Maven), `npm run build`, `npm run check:architecture`, `npm run test:e2e`, `npm run test:cross-browser` (install Playwright browsers first). Do not edit generated distribution files directly. Outside this repository, run the host project’s applicable checks instead. Do not infer permission to publish, deploy or migrate the host stack from using this skill.

## Consumer installation and upgrades
For a new plain HTML project, run `node <checkout>/bin/colibri.mjs init --starter` from the app's static root, then serve it over HTTP. This copies CSS, UI, FreeMarker and Thymeleaf and creates app-owned files. Omit `--starter` in existing apps. `--dir assets/colibri` updates starter paths. The installer refuses conflicting files before writing; inspect `diff`, back up changes and only use `--force` deliberately. Never force starter files over an existing app. Load CSS, UI theme, bridge and application CSS in that order. The bridge maps `--c-*` tokens to UI controls; keep branding in application CSS. The starter persists locally only; connect real APIs in the host. See https://colibri.l3v.ai/getting-started.html for complete installation, React, lifecycle and troubleshooting. Repository checks include `npm run test:consumer`, which installs packed archives and tests the resulting app outside the checkout.

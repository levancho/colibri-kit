---
name: colibri-ui
description: Build UI with Colibri UI (headless data-ui components, FreeMarker macros, --ui-* theme tokens). Use when a project has colibri.json or imports colibri-ui, or the user asks for a login page, sidebar, dashboard, chat, form or any component in a Colibri/Despani project.
---
# Colibri UI skill

## 1. Get project context first
Run `node <colibri>/bin/colibri.mjs info --json` (or MCP tool `get_project_info`). It returns the files to include,
markup rules, and every component/block name. Do not guess names: run `colibri search "<what you need>"`, then
`colibri view <name>` for the exact markup and FreeMarker snippet, and `colibri docs <name>` for keyboard/ARIA notes.

## 2. Markup contract (never break these)
- A component root has `data-ui="name"`; its pieces have `data-ui-part="part"`. Nested components stay isolated.
- State lives in `data-state`, `aria-*` and `hidden`. Do not toggle classes for state; never inline styles for state.
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

## 5. Server side (Spring + FreeMarker)
`[#import "/ui/ui.ftl" as ui]` then the macro from `colibri view <name>`. Always pass named arguments.
Keep Spring binding: macros only emit markup; `name=` attributes are yours.

## 6. Before you finish
Every interactive thing must be reachable by keyboard and labelled. Check `colibri docs <name>` for the expected
keys. Run the project's tests (`npm test`, `npm run test:e2e`).

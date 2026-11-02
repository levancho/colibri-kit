<img src="assets/colibri-mark.svg" alt="Colibri Kit" width="56" height="56">

# Colibri Kit

Modern, platform-first building blocks for the web. No build step, no class soup.

| Package | What it is |
|---|---|
| **Colibri CSS** (`@colibri-kit/css`) | One small stylesheet: cascade layers, OKLCH design tokens, `light-dark()` dark mode, fluid type/space, layout primitives, container queries, `:has()` patterns. — `packages/colibri-css/` |
| **Colibri UI** (`@colibri-kit/ui`) | Headless, unstyled, accessible components (`data-ui`, `<ui-*>` elements, FreeMarker macros), React-ready. — `src/`, `freemarker/`, `themes/` |

More Kit packages to come.

## Getting started

```html
<link rel="stylesheet" href="packages/colibri-css/dist/colibri.css">
<!-- with Colibri UI components -->
<link rel="stylesheet" href="themes/colibri.css">
<link rel="stylesheet" href="packages/colibri-css/dist/colibri-ui-bridge.css">
```

Re-brand: `:root { --c-hue: 160; }` · Force dark: `<html data-theme="dark">`

No utility classes: in React you use the same primitives and attributes (`className="stack card"`, `data-gap="m"`, `data-variant="ghost"`). React: `import { Dialog, Tabs, Part } from "@colibri-kit/ui/react"`. Every snippet is shown in HTML, FreeMarker and React at https://colibri.l3v.ai/#start.

## Explore

- `examples/kitchen-sink.html` — every component, live
- `examples/colibri-css.html` — Colibri CSS guide
- `site/` — the Colibri Kit website (preview: https://colibri.l3v.ai)
- `docs/colibri-ui.md` — Colibri UI architecture
- `test/` — unit (JSDOM) and browser tests

## Agent skill

`skills/colibri-kit/` is a standalone [Agent Skill](https://agentskills.io) (`SKILL.md` + `reference/`) that teaches coding agents to build UIs with Colibri Kit: tokens, layout primitives, headless `data-ui` components, theme packs, React and FreeMarker.

- **Claude Code**: copy the folder to `~/.claude/skills/colibri-kit/` (all projects) or `.claude/skills/colibri-kit/` (one project).
  `cp -r skills/colibri-kit ~/.claude/skills/`
- **Cursor**: copy it to `.cursor/skills/colibri-kit/` in your project (or `~/.cursor/skills/`), or reference `skills/colibri-kit/SKILL.md` from a rule in `.cursor/rules/`.
- **GitHub Copilot**: copy it to `.github/skills/colibri-kit/` (Copilot agent skills), or paste `SKILL.md` into `.github/copilot-instructions.md`.
- Other agents that read `SKILL.md` (Codex, Gemini CLI, OpenCode, …): drop the folder into their skills directory.

## License

MIT © Levan Dvalishvili

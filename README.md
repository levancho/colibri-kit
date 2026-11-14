<img src="assets/colibri-mark.svg" alt="Colibri Kit" width="56" height="56">

# Colibri Kit

Modern, platform-first building blocks for the web. No build step, no class soup.

| Package | What it is |
|---|---|
| **Colibri CSS** (`@colibri-kit/css`) | One small stylesheet: cascade layers, OKLCH design tokens, `light-dark()` dark mode, fluid type/space, layout primitives, container queries, `:has()` patterns. — `packages/colibri-css/` |
| **Colibri UI** (`@colibri-kit/ui`) | Headless, unstyled, accessible components (`data-ui`, `<ui-*>` elements, FreeMarker macros), React-ready. — `src/`, `freemarker/`, `themes/` |

More Kit packages to come.

Java setup: [FreeMarker / Thymeleaf dependencies and supplemental template JAR](docs/java-templates.md).

## Getting started

Install from npm:

```sh
npm install @colibri-kit/ui @colibri-kit/css
```

```js
import "@colibri-kit/css";                    // tokens, layout, .btn .card .field …
import "@colibri-kit/ui/themes/colibri.css";  // look of the interactive components
import "@colibri-kit/css/bridge";             // one palette for both
import "@colibri-kit/ui/lazy";                // wires every data-ui element, loading only the controllers in use
```

Put `class="ui-root"` on `<body>`. No bundler? Copy the files into your project instead: `npx -p @colibri-kit/ui colibri init --starter` writes a `colibri/` folder plus a working starter page that needs no build step.

Or try the starter without installing anything into a project:

```sh
mkdir my-app
cd my-app
npx -p @colibri-kit/ui colibri init --starter
python3 -m http.server 8080
```

Open http://localhost:8080/. The starter includes a settings form, local saving, a dialog, dark mode and your own `app.css`. The installer requires Node 22.12+; Python is only the example local server. To work from a checkout instead, clone this repository and run `node ../colibri-kit/bin/colibri.mjs init --starter`. The deployed page uses CSS and browser modules.

**[Installation, React, customization, upgrades and troubleshooting](docs/getting-started.md)** · [Java / FreeMarker / Thymeleaf](docs/java-templates.md)

The installer copies both Colibri CSS and UI, plus server template sources. Omit `--starter` for an existing application; use `--dir assets/colibri` for a different asset folder. Conflicting files are refused before anything is written. The guide also covers bundler and React projects.

Three things worth knowing early, all covered in the guide: Colibri CSS owns short class names such as `.card` and `.center` (`colibri classes` lists them, `colibri collisions app.css` checks yours, and `colibri.prefixed.css` renames them to `.c-*`); `dist/lazy/auto-lazy.js` loads only the controllers a page uses; and `colibri docs <name>` lists each component's events and controller members.

Re-brand in your application stylesheet: `:root { --c-hue: 160; }`. The included bridge applies CSS tokens to UI controls. Force dark with `<html data-theme="dark">`. Use `data-colibri-theme` on a section for a locally recomputed palette.

## Explore

- `examples/kitchen-sink.html` — every component, live
- [Widget builder](https://colibri-kit.io/widgets/) — build a badge, call to action, pricing card, FAQ or sign-up form and paste it into any website (`site/src/widgets/`)
- [Colibri for React Native](https://colibri-kit.io/native/) — `@colibri-kit/native-core`: themed layout primitives and controls for React Native and Expo (`packages/colibri-native-core/`)
- `examples/colibri-css.html` — Colibri CSS guide
- `site/` — the Colibri Kit website (preview: https://colibri.l3v.ai)
- `docs/colibri-ui.md` — Colibri UI architecture
- `docs/screen-reader-testing.md` — manual screen-reader test script (VoiceOver, NVDA, JAWS, TalkBack); not yet run
- `test/` — unit (JSDOM) and browser tests

## Agent skill

`skills/colibri-kit/` is a standalone [Agent Skill](https://agentskills.io) (`SKILL.md` + `reference/`) that teaches coding agents to build UIs with Colibri Kit: tokens, layout primitives, headless `data-ui` components, theme packs, React and FreeMarker.

- **Claude Code**: copy the folder to `~/.claude/skills/colibri-kit/` (all projects) or `.claude/skills/colibri-kit/` (one project).
  `cp -r skills/colibri-kit ~/.claude/skills/`
- **Cursor**: copy it to `.cursor/skills/colibri-kit/` in your project (or `~/.cursor/skills/`), or reference `skills/colibri-kit/SKILL.md` from a rule in `.cursor/rules/`.
- **GitHub Copilot**: copy it to `.github/skills/colibri-kit/` (Copilot agent skills), or paste `SKILL.md` into `.github/copilot-instructions.md`.
- Other agents that read `SKILL.md` (Codex, Gemini CLI, OpenCode, …): drop the folder into their skills directory.

## Development checks

Node 22.12+, Python 3 and an installed Chrome are needed for maintainer checks. Consumers still use plain CSS and browser modules without a build step.

```sh
npm ci --ignore-scripts
npm test
npm run test:java # JDK 17+ and Maven; builds server-rendered browser fixtures
npm run build
npm run check:architecture
npm run test:e2e
npm run test:consumer # packed installation + standalone application
npm run build:ui # regenerate dist/ (minified and lazy bundles) and src/core/lazy-registry.js
```

Browser tests start their own temporary servers. Set `CHROME=/path/to/chrome` if Chrome is not in a standard location. CI checks unit tests, the built site, component flows, responsive foundations, dashboard interactions, and navigation/callout styles across core and all packs. Architecture checks flag new important declarations, external core imports, utility-vocabulary growth and presentation styles in dashboard screens. See `docs/maintenance-audit.md` for scope and remaining debt. CSS visibility safeguards deliberately use `!important`; normal layered declarations remain overridable.

## License

MIT © Levan Dvalishvili

<!-- CATALOG:START (generated by tools/readme-catalog.py) -->
## Component catalog

Live demos: `examples/kitchen-sink.html` (served at http://localhost:8395/examples/kitchen-sink.html).

Status: ✅ done 132 · 🟡 partial 0 · ⚪ planned 0 · 🔷 structure (markup/CSS only) 14

### Application components

| Colibri catalog entry | Status | Metronic | shadcn |
|---|---|---|---|
| Application form (`application-form`) | ✅ done | — | — |
| Application shell (`application-shell`) | ✅ done | — | — |
| Chart panel (`application-chart`) | ✅ done | — | — |
| Conversation desk (`application-conversation`) | ✅ done | — | — |
| Day planner (`application-planner`) | ✅ done | — | — |
| Identity and settings (`application-identity`) | ✅ done | — | — |
| Knowledge article (`application-article`) | ✅ done | — | — |
| Metric rail (`application-metrics`) | ✅ done | — | — |
| Opportunity board (`application-board`) | ✅ done | — | — |
| Photographic feature (`application-photo`) | ✅ done | — | — |
| Product collection (`application-products`) | ✅ done | — | — |
| Project cards (`application-projects`) | ✅ done | — | — |
| Record table (`application-table`) | ✅ done | — | — |
| Store summary (`application-receipt`) | ✅ done | — | — |

### Base

| Colibri catalog entry | Status | Metronic | shadcn |
|---|---|---|---|
| Accordion (`accordion`) | ✅ done | Accordion | Accordion |
| Alert / Dismiss (`alert`) | ✅ done | Dismiss | Alert |
| Alert Dialog (`alert-dialog`) | ✅ done | Modal (confirm) | Alert Dialog |
| Aspect Ratio (`aspect-ratio`) | 🔷 structure (markup/CSS only) | - | Aspect Ratio |
| Avatar (`avatar`) | ✅ done | Avatar | Avatar |
| Badge (`badge`) | ✅ done | Badge | Badge |
| Button (`button`) | ✅ done | Button | Button |
| Button Group (`button-group`) | ✅ done | Button Group | Button Group |
| Card (`card`) | 🔷 structure (markup/CSS only) | Card / KT Card | Card |
| Carousel (`carousel`) | ✅ done | Carousel | Carousel |
| Code Block / Clipboard (`code-block`) | ✅ done | Clipboard (plugin) | Code Block |
| Collapsible / Collapse (`collapsible`) | ✅ done | Collapse | Collapsible |
| Context Menu (`context-menu`) | ✅ done | Menu (right-click) | Context Menu |
| Data Table / Datatable (`datatable`) | ✅ done | Datatable | Data Table |
| Dialog / Modal (`dialog`) | ✅ done | Modal | Dialog |
| Direction (RTL) (`direction`) | 🔷 structure (markup/CSS only) | RTL | Direction |
| Drawer / Sheet (`drawer`) | ✅ done | Drawer | Sheet, Drawer |
| Dropdown Menu (`dropdown-menu`) | ✅ done | Dropdown, Menu | Dropdown Menu |
| Empty (`empty`) | 🔷 structure (markup/CSS only) | - | Empty |
| Hover Card (`hover-card`) | ✅ done | Tooltip (rich) | Hover Card |
| Item (`item`) | ✅ done | - | Item |
| Kbd (`kbd`) | 🔷 structure (markup/CSS only) | Kbd | Kbd |
| Label (`label`) | 🔷 structure (markup/CSS only) | - | Label |
| Link (`link`) | 🔷 structure (markup/CSS only) | Link | - |
| Message Scroller (`message-scroller`) | ✅ done | - | Message, Message Scroller, Bubble |
| Popover (`popover`) | ✅ done | Dropdown (panel) | Popover |
| Progress (`progress`) | ✅ done | Progress | Progress |
| Rating (`rating`) | ✅ done | Rating | - |
| Reparent (`reparent`) | ✅ done | Reparent | - |
| Resizable (`resizable`) | ✅ done | - | Resizable |
| Scroll Area / Scrollable (`scroll-area`) | ✅ done | Scrollable | Scroll Area |
| Separator (`separator`) | ✅ done | Separator | Separator |
| Skeleton (`skeleton`) | 🔷 structure (markup/CSS only) | Skeleton | Skeleton |
| Spinner (`spinner`) | ✅ done | Spinner | Spinner |
| Table (`table`) | 🔷 structure (markup/CSS only) | Table | Table |
| Theme Switch (`theme-switch`) | ✅ done | Theme Switch | (dark mode) |
| Toast / Sonner (`toast`) | ✅ done | Toast | Toast, Sonner |
| Toggle (`toggle`) | ✅ done | Toggle | Toggle |
| Tooltip (`tooltip`) | ✅ done | Tooltip | Tooltip |
| Typography (`typography`) | 🔷 structure (markup/CSS only) | - | Typography |

### Navigation

| Colibri catalog entry | Status | Metronic | shadcn |
|---|---|---|---|
| Breadcrumb (`breadcrumb`) | 🔷 structure (markup/CSS only) | Breadcrumb | Breadcrumb |
| Command (`command`) | ✅ done | (search modal) | Command |
| Menubar (`menu`) | ✅ done | Menu (horizontal) | Menubar |
| Navigation Menu (`navigation-menu`) | ✅ done | Menu (mega) | Navigation Menu |
| Pagination (`pagination`) | ✅ done | Pagination | Pagination |
| Scroll To (`scrollto`) | ✅ done | Scrollto | - |
| Scrollspy (`scrollspy`) | ✅ done | Scrollspy | - |
| Sidebar (`sidebar`) | ✅ done | Sidebar (layout) | Sidebar |
| Stepper (`stepper`) | ✅ done | Stepper | - |
| Sticky (`sticky`) | ✅ done | Sticky | - |
| Tabs (`tabs`) | ✅ done | Tabs | Tabs |

### Forms

| Colibri catalog entry | Status | Metronic | shadcn |
|---|---|---|---|
| Calendar (`calendar`) | ✅ done | (date-picker grid) | Calendar |
| Checkbox (`checkbox`) | ✅ done | Checkbox | Checkbox |
| Color Picker (`color-picker`) | ✅ done | Color Picker | - |
| Combobox (`combobox`) | ✅ done | Select (search) | Combobox |
| Date Picker (`date-picker`) | ✅ done | Date Picker | Date Picker |
| Field / Form (`field`) | ✅ done | (form) | Field, Form |
| File Input (`file-input`) | ✅ done | File Input | (Attachment) |
| Image Input (`image-input`) | ✅ done | Image Input | - |
| Input (`input`) | 🔷 structure (markup/CSS only) | Input | Input |
| Input Group (`input-group`) | 🔷 structure (markup/CSS only) | Input Group | Input Group |
| Pin Input / Input OTP (`pin-input`) | ✅ done | Pin Input | Input OTP |
| Radio Group / Radio (`radio-group`) | ✅ done | Radio | Radio Group |
| Repeater (`repeater`) | ✅ done | Repeater | - |
| Select (`select`) | ✅ done | Select | Select, Native Select |
| Slider (`slider`) | ✅ done | Slider | Slider |
| Sortable (`sortable`) | ✅ done | Sortable | - |
| Switch (`switch`) | ✅ done | Switch | Switch |
| Textarea (`textarea`) | ✅ done | Textarea | Textarea |
| Toggle Group (`toggle-group`) | ✅ done | Toggle Group | Toggle Group |
| Toggle Password (`toggle-password`) | ✅ done | Toggle Password | - |

### Conversation

| Colibri catalog entry | Status | Metronic | shadcn |
|---|---|---|---|
| Attachment (`attachment`) | ✅ done | - | Attachment |
| Bubble (`bubble`) | ✅ done | - | Bubble |
| Chart (`chart`) | ✅ done | - | Chart |
| Marker (`marker`) | ✅ done | - | Marker |
| Message (`message`) | ✅ done | - | Message |
| Native select (`native-select`) | 🔷 structure (markup/CSS only) | Select (native) | Native Select |
| Questionnaire (`questionnaire`) | ✅ done | - | Questionnaire |
| Trace (`trace`) | ✅ done | - | Trace |

### AI Elements

| Colibri catalog entry | Status | Metronic | shadcn |
|---|---|---|---|
| Chain of thought (`chain-of-thought`) | ✅ done | - | AI: Chain of Thought |
| Chat (`chat`) | ✅ done | - | AI: Chat |
| Checkpoint (`checkpoint`) | ✅ done | - | AI: Checkpoint |
| Confirmation (`confirmation`) | ✅ done | - | AI: Confirmation |
| Context usage (`context`) | ✅ done | - | AI: Context |
| File tree (`file-tree`) | ✅ done | - | AI: File Tree |
| Inline citation (`inline-citation`) | ✅ done | - | AI: Inline Citation |
| Message (AI turn) (`ai-message`) | ✅ done | - | AI: Message |
| Model selector (`model-selector`) | ✅ done | - | AI: Model Selector |
| Plan (`plan`) | ✅ done | - | AI: Plan |
| Prompt input (`prompt-input`) | ✅ done | - | AI: Prompt Input |
| Queue (`queue`) | ✅ done | - | AI: Queue |
| Reasoning (`reasoning`) | ✅ done | - | AI: Reasoning |
| Sources (`sources`) | ✅ done | - | AI: Sources |
| Stack trace (`stack-trace`) | ✅ done | - | AI: Stack Trace |
| Subagent (`subagent`) | ✅ done | - | AI: Subagent |
| Suggestion (`suggestion`) | ✅ done | - | AI: Suggestion |
| Task (`task`) | ✅ done | - | AI: Task |
| Terminal (`terminal`) | ✅ done | - | AI: Terminal |
| Test results (`test-results`) | ✅ done | - | AI: Test Results |
| Tool call (`tool`) | ✅ done | - | AI: Tool |

### Sidebar blocks

| Colibri catalog entry | Status | Metronic | shadcn |
|---|---|---|---|
| Sidebar: Collapses to icons (`sidebar-07`) | ✅ done | Sidebar layouts | Block sidebar-07 |
| Sidebar: Collapsible file tree (`sidebar-11`) | ✅ done | Sidebar layouts | Block sidebar-11 |
| Sidebar: Collapsible sections (`sidebar-02`) | ✅ done | Sidebar layouts | Block sidebar-02 |
| Sidebar: Collapsible submenus (`sidebar-05`) | ✅ done | Sidebar layouts | Block sidebar-05 |
| Sidebar: Floating with submenus (`sidebar-04`) | ✅ done | Sidebar layouts | Block sidebar-04 |
| Sidebar: Inset with secondary nav (`sidebar-08`) | ✅ done | Sidebar layouts | Block sidebar-08 |
| Sidebar: Left and right sidebars (`sidebar-15`) | ✅ done | Sidebar layouts | Block sidebar-15 |
| Sidebar: Nested sidebars (`sidebar-09`) | ✅ done | Sidebar layouts | Block sidebar-09 |
| Sidebar: Sidebar in a dialog (`sidebar-13`) | ✅ done | Sidebar layouts | Block sidebar-13 |
| Sidebar: Sidebar on the right (`sidebar-14`) | ✅ done | Sidebar layouts | Block sidebar-14 |
| Sidebar: Sidebar with popover (`sidebar-10`) | ✅ done | Sidebar layouts | Block sidebar-10 |
| Sidebar: Simple, grouped (`sidebar-01`) | ✅ done | Sidebar layouts | Block sidebar-01 |
| Sidebar: Sticky site header (`sidebar-16`) | ✅ done | Sidebar layouts | Block sidebar-16 |
| Sidebar: Submenus as dropdowns (`sidebar-06`) | ✅ done | Sidebar layouts | Block sidebar-06 |
| Sidebar: With a calendar (`sidebar-12`) | ✅ done | Sidebar layouts | Block sidebar-12 |
| Sidebar: With submenus (`sidebar-03`) | ✅ done | Sidebar layouts | Block sidebar-03 |

### Login blocks

| Colibri catalog entry | Status | Metronic | shadcn |
|---|---|---|---|
| Login: Email only (magic link) (`login-05`) | ✅ done | Authentication pages | Block login-05 |
| Login: Form and image in a card (`login-04`) | ✅ done | Authentication pages | Block login-04 |
| Login: Muted background (`login-03`) | ✅ done | Authentication pages | Block login-03 |
| Login: Simple login card (`login-01`) | ✅ done | Authentication pages | Block login-01 |
| Login: Two columns with cover (`login-02`) | ✅ done | Authentication pages | Block login-02 |

### Signup blocks

| Colibri catalog entry | Status | Metronic | shadcn |
|---|---|---|---|
| Signup: Form and image in a card (`signup-04`) | ✅ done | Authentication pages | Block signup-04 |
| Signup: Muted background (`signup-03`) | ✅ done | Authentication pages | Block signup-03 |
| Signup: Simple signup card (`signup-01`) | ✅ done | Authentication pages | Block signup-01 |
| Signup: Social providers (`signup-05`) | ✅ done | Authentication pages | Block signup-05 |
| Signup: Two columns with cover (`signup-02`) | ✅ done | Authentication pages | Block signup-02 |

### Motion

| Colibri catalog entry | Status | Metronic | shadcn |
|---|---|---|---|
| Animated components (`motion-wired`) | ✅ done | - | - |
| Enter / exit presets (`motion`) | ✅ done | - | (tw-animate / data-[state] animations) |
| Hover, focus and loop presets (`motion-states`) | ✅ done | - | - |
| One-shot animations (play) (`motion-play`) | ✅ done | - | - |

### Theming

| Colibri catalog entry | Status | Metronic | shadcn |
|---|---|---|---|
| Design tokens (`theme-tokens`) | ✅ done | - | Theming (CSS variables) |
| Scoped theme override (`theme-scoped`) | ✅ done | - | - |

<!-- CATALOG:END -->

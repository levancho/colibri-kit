# Colibri UI (`@colibri-kit/ui`) — headless, unstyled, framework-agnostic primitives

The core controllers provide behavior and ARIA wiring without importing styles. Optional themes ship separately under `themes/`. Works in FreeMarker pages, plain HTML, HTMX swaps, and React wrappers over the same core code.

## Naming scheme (decision)
Brand = **Colibri UI**, package = **`@colibri-kit/ui`**, folder = `~/dev/despani/colibri-ui`.
Markup attributes stay short and generic: **`data-ui` / `data-ui-part`**, events **`ui:*`**, custom elements **`<ui-*>`**.
Reason: brevity in templates and no brand lock-in in stored content/markup; the `ui` namespace is
owned by Colibri UI inside Despani apps. (If a clash ever appears, a codemod `data-ui` → `data-colibri` is trivial.)

## Architecture (3 layers, only the first is required)

```
src/core/<name>.js      createX(rootEl, options) -> api      ← the real component (DOM + ARIA + keyboard + state)
src/core/auto.js        init(): wires every [data-ui] on the page (FreeMarker / plain HTML)
src/elements/<name>.js  optional <ui-x> custom element = same core, automatic lifecycle (light DOM, no Shadow DOM)
react/<name>.jsx        (later) thin React wrapper calling createX(ref.current) in useEffect
freemarker/ui-<name>.ftl  macros that emit the markup contract
```

### The contract (same for every primitive)
| Concern | How |
|---|---|
| Identify component | `data-ui="tabs"` (or `<ui-tabs>`) |
| Identify parts | `data-ui-part="list|trigger|panel|…"` |
| Link parts | `data-value="…"` |
| Config | `data-*` attributes **or** `options` object (options win) |
| State out (for styling) | `data-state="open|closed|active|inactive|checked…"`, `aria-*`, `hidden`, `data-disabled` |
| Events out | bubbling `ui:change` / `ui:open` / `ui:close` CustomEvents (+ `options.onChange` callback) |
| Imperative API | `createX()` returns `{ value, select/open/close, refresh(), destroy() }` |

Style it with anything — your own CSS, Hyper/Bootstrap classes during transition, or nothing:
`[data-ui-part="trigger"][data-state="active"] { … }`

### Composition
Parts are plain elements you own, so you can put anything inside or around them (icons, badges,
a Card inside a Tab panel, Tabs inside a Dialog). Nested components are isolated: each core only
touches parts whose nearest `[data-ui]` ancestor is its own root.

## Try it
```
cd ~/dev/despani/colibri-ui
python3 -m http.server 8395        # (npm run serve)
open http://localhost:8395/examples/        # index → Tabs, Dialog
```
Maintainer checks: Node 22.12+ and Python 3. Run `npm ci --ignore-scripts`, `npm test`, `npm run build`, then `npm run test:e2e`. Chrome must be installed; set `CHROME` to override its executable path. Browser tests start and stop their own local servers.

## FreeMarker usage
Copy/point the loader at `freemarker/`, then:
```ftl
[#import "ui/ui-tabs.ftl" as ui]
[@ui.tabs id="settings" default="general" tabs=[{"value":"general","label":"General"},{"value":"seo","label":"SEO"}]]
  [@ui.panel value="general"]…[/@ui.panel]
  [@ui.panel value="seo"]…[/@ui.panel]
[/@ui.tabs]
<script type="module" src="${cx}/ui/core/auto.js"></script>
```

## Future React wrapper pattern (not built yet)
```jsx
import { useEffect, useRef } from "react";
import { createTabs } from "@colibri-kit/ui/core/tabs";

export function Tabs({ value, onChange, children, ...props }) {
  const ref = useRef(null), api = useRef(null);
  useEffect(() => { api.current = createTabs(ref.current, { onChange }); return () => api.current.destroy(); }, []);
  useEffect(() => { if (value != null) api.current?.select(value); }, [value]);
  return <div data-ui="tabs" ref={ref} {...props}>{children}</div>;
}
export const TabsList    = (p) => <div data-ui-part="list" {...p} />;
export const TabsTrigger = ({ value, ...p }) => <button data-ui-part="trigger" data-value={value} {...p} />;
export const TabsPanel   = ({ value, ...p }) => <div data-ui-part="panel" data-value={value} {...p} />;
```
Same names/shape as shadcn/Radix (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`) so React code reads familiarly.
If children are added dynamically, call `api.current.refresh()` (or a MutationObserver inside the wrapper).

## Primitive set

See **Component catalog** below (generated). Regenerate with `python3 tools/kitchen-sink.py && python3 tools/readme-catalog.py` after adding a component to `tools/sink_catalog_*.py`.

## Rules
1. Prefer native elements (`<button>`, `<dialog>`, `<input type=checkbox>`) — add only missing ARIA/keyboard.
2. No CSS, no class names, no Shadow DOM, no dependencies.
3. Every behavior must be reachable from markup alone (FreeMarker) **and** from `createX()` (React).
4. State is always reflected to attributes.

## Gallery, testing and FreeMarker

- **Gallery:** `npm run serve` → http://localhost:8395/examples/kitchen-sink.html. Each component has a plain-English title, a one-line description, a live demo, a **?** tooltip (when to use it, plus its `data-ui` / shadcn / Metronic names) and an **Accessibility & keyboard** section. The header has **Demo styling** (off = raw headless markup), a light/dark/system switch and **⚡ Events**: an event log, hidden by default, that docks to the bottom or right or floats, and can be dragged, collapsed and closed.
- The gallery uses the optional library theme (`themes/colibri.css`). It only targets `[data-ui]`, `[data-ui-part]` and state attributes, which is how an app would style Colibri UI.
- **Edit the gallery:** demos in `tools/sink_catalog_*.py`, plain-English copy in `tools/sink_info.py`, then `npm run sink`.
- **Unit tests (jsdom):** `npm test`. **Browser tests (real Chrome):** `npm run build && npm run test:e2e` (self-contained servers; `CHROME=` to override the Chrome path).
- **FreeMarker:** `freemarker/ui.ftl` has macros for every ready component, plus the generic `[@ui.c ui="…"]` / `[@ui.p part="…"]`. Arguments must be named. `test/ftl/demo.ftl` uses every macro; `test/ftl/Render.java` renders it, and `test/e2e/ftl-output.e2e.mjs` checks that the output initialises.

<!-- CATALOG:START (generated by tools/readme-catalog.py) -->
## Component catalog

Live demos: `examples/kitchen-sink.html` (served at http://localhost:8395/examples/kitchen-sink.html).

Status: ✅ done 118 · 🟡 partial 0 · ⚪ planned 0 · 🔷 structure (markup/CSS only) 15

### Base

| Colibri (`data-ui`) | Status | Metronic | shadcn |
|---|---|---|---|
| Accordion (`accordion`) | ✅ done | Accordion | Accordion |
| Alert / Dismiss (`alert`) | ✅ done | Dismiss | Alert |
| Alert Dialog (`alert-dialog`) | ✅ done | Modal (confirm) | Alert Dialog |
| Aspect Ratio (`aspect-ratio`) | 🔷 structure (markup/CSS only) | - | Aspect Ratio |
| Avatar (`avatar`) | ✅ done | Avatar | Avatar |
| Badge (`badge`) | ✅ done | Badge | Badge |
| Button (`button`) | ✅ done | Button | Button |
| Button Group (`button-group`) | 🔷 structure (markup/CSS only) | Button Group | Button Group |
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
| Skeleton / Spinner (`skeleton`) | 🔷 structure (markup/CSS only) | Skeleton | Skeleton, Spinner |
| Table (`table`) | 🔷 structure (markup/CSS only) | Table | Table |
| Theme Switch (`theme-switch`) | ✅ done | Theme Switch | (dark mode) |
| Toast / Sonner (`toast`) | ✅ done | Toast | Toast, Sonner |
| Toggle (`toggle`) | ✅ done | Toggle | Toggle |
| Tooltip (`tooltip`) | ✅ done | Tooltip | Tooltip |
| Typography (`typography`) | 🔷 structure (markup/CSS only) | - | Typography |

### Navigation

| Colibri (`data-ui`) | Status | Metronic | shadcn |
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

| Colibri (`data-ui`) | Status | Metronic | shadcn |
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

| Colibri (`data-ui`) | Status | Metronic | shadcn |
|---|---|---|---|
| Attachment (`attachment`) | ✅ done | - | Attachment |
| Bubble (`bubble`) | ✅ done | - | Bubble |
| Chart (`chart`) | ✅ done | - | Chart |
| Marker (`marker`) | ✅ done | - | Marker |
| Message (`message`) | ✅ done | - | Message |
| Native select (`native-select`) | 🔷 structure (markup/CSS only) | Select (native) | Native Select |
| Questionnaire (`questionnaire`) | ✅ done | - | Questionnaire |
| Spinner (`spinner`) | ✅ done | - | Spinner |
| Trace (`trace`) | ✅ done | - | Trace |

### AI Elements

| Colibri (`data-ui`) | Status | Metronic | shadcn |
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

| Colibri (`data-ui`) | Status | Metronic | shadcn |
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

| Colibri (`data-ui`) | Status | Metronic | shadcn |
|---|---|---|---|
| Login: Email only (magic link) (`login-05`) | ✅ done | Authentication pages | Block login-05 |
| Login: Form and image in a card (`login-04`) | ✅ done | Authentication pages | Block login-04 |
| Login: Muted background (`login-03`) | ✅ done | Authentication pages | Block login-03 |
| Login: Simple login card (`login-01`) | ✅ done | Authentication pages | Block login-01 |
| Login: Two columns with cover (`login-02`) | ✅ done | Authentication pages | Block login-02 |

### Signup blocks

| Colibri (`data-ui`) | Status | Metronic | shadcn |
|---|---|---|---|
| Signup: Form and image in a card (`signup-04`) | ✅ done | Authentication pages | Block signup-04 |
| Signup: Muted background (`signup-03`) | ✅ done | Authentication pages | Block signup-03 |
| Signup: Simple signup card (`signup-01`) | ✅ done | Authentication pages | Block signup-01 |
| Signup: Social providers (`signup-05`) | ✅ done | Authentication pages | Block signup-05 |
| Signup: Two columns with cover (`signup-02`) | ✅ done | Authentication pages | Block signup-02 |

### Motion

| Colibri (`data-ui`) | Status | Metronic | shadcn |
|---|---|---|---|
| Animated components (`motion-wired`) | ✅ done | - | - |
| Enter / exit presets (`motion`) | ✅ done | - | (tw-animate / data-[state] animations) |
| Hover, focus and loop presets (`motion-states`) | ✅ done | - | - |
| One-shot animations (play) (`motion-play`) | ✅ done | - | - |

### Theming

| Colibri (`data-ui`) | Status | Metronic | shadcn |
|---|---|---|---|
| Design tokens (`theme-tokens`) | ✅ done | - | Theming (CSS variables) |
| Scoped theme override (`theme-scoped`) | ✅ done | - | - |

<!-- CATALOG:END -->

## shadcn parity: conversation, AI elements, blocks, skills

Everything below is live in the gallery (`examples/kitchen-sink.html`). Each entry has copyable HTML and FreeMarker code, plus keyboard and ARIA notes.

### Conversation components (`src/core/ai.js`)
| Colibri | shadcn | Behaviour |
|---|---|---|
| `bubble` | Bubble | 7 variants, start/end groups, reaction toggles with counts, Show more / less |
| `message` | Message | role=article; avatar, header, actions (copy, like/dislike, retry) |
| `marker` | Marker | inline / row / labelled separator (role=separator), live status, shimmer |
| `spinner` | Spinner | role=status, "Loading" label, sizes |
| `trace` | Trace | list of steps; expandable lines are nested Collapsibles |
| `attachment` | Attachment | upload progress (progressbar), error state, cancellable remove that moves focus on |
| `questionnaire` | Questionnaire | single / multiple / free text; required errors; skip; progress; `ui:submit {answers}` |
| `chart` | Chart | SVG bar/line chart drawn from a real `<table>` (kept for screen readers; can be shown) |
| `native-select` | Native Select | styled `<select>` |
| `sheet` / `drawer` | Sheet / Drawer | now drags to dismiss (vaul-like; `data-drag=false` turns it off) |

### AI Elements: 21 of 21
chain-of-thought, chat (composition), checkpoint, confirmation, context, file-tree, inline-citation (composition), message (composition: `ai-message`), model-selector (composition), plan, prompt-input, queue, reasoning, sources, stack-trace, subagent, suggestion, task, terminal, test-results, tool.

- The collapsible "run" elements share one engine: a disclosure plus `data-status`, with a polite live status badge, step progress and `aria-current=step`.
- Reasoning opens on its own while streaming and folds to "Thought for Ns" when done.
- The terminal output is a `role=log` with `api.write()` for streaming.
- The file tree follows the WAI-ARIA tree pattern.
- The prompt input: Enter sends, Shift+Enter adds a new line, files can be attached, and Send turns into Stop while a reply streams.

### Blocks
- **Sidebar 01–16**: grouped, collapsible sections, submenus, floating, collapsible submenus, dropdown submenus, collapses to icons, inset with secondary nav, nested sidebars, popover, file tree, calendar, in a dialog, right side, left + right, sticky site header.
  - All are built from `sidebar` plus existing components.
  - FreeMarker: `sidebarShell`, `sidebarGroup`, `sidebarItem`, `sidebarInset`.
  - Below the breakpoint the sidebar becomes an off-canvas sheet.
- **Login 01–05 / Signup 01–05**: centred card, two columns with a cover, muted page, form and image in a card, email-only magic link, social providers.
  - Each block is one `auth-form` (`src/core/blocks.js`) with views: password, magic-link, forgot, sent, otp, done.
  - It validates only the visible view, using native constraints, `data-match` for password confirmation and a full-length check on `pin-input`.
  - `ui:submit {view, values}` is cancellable; `api.setErrors({field: msg})` shows server errors; `ui:provider` fires for OAuth buttons.
  - FreeMarker: `authForm`, `authView`, `authField`, `authProviders` (with a CSRF hidden field).

### Skills (AI-assistant tooling, the shadcn "skills" equivalent)
| shadcn skill capability | Colibri |
|---|---|
| Project context (`shadcn info --json`) | `node bin/colibri.mjs info --json`: files, markup rules, every component and block name |
| CLI: init / add / search / view / docs / diff / info / build | `bin/colibri.mjs`, same commands (`add` prints snippets; the core is shared and copied by `init`) |
| Theming guidance | the skill file plus the MCP `get_theme_tokens` tool (`--ui-*` tokens, dark mode, accent presets) |
| Registry (`registry.json`) | `registry/colibri.json`, generated by `tools/registry.py` (133 items: html, freemarker, a11y, parts) |
| MCP server | `bin/colibri-mcp.mjs` (stdio JSON-RPC): `get_project_info`, `list_items`, `search_items`, `view_item`, `get_theme_tokens` |
| Skill file for assistants | `skills/colibri-ui/SKILL.md`: context first, markup contract, composition rules, theming, FreeMarker |

Not covered: hosted/remote registries, namespaces, auth for private registries, "Open in v0" and presets. These are tied to shadcn's hosted ecosystem.

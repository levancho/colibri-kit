# Install and use Colibri

## Start without a bundler

Prerequisite: Node.js 22.12+ to run the installer. Python 3 is used below only as a local HTTP server; any static web server works. Your deployed application needs only the copied CSS and JavaScript, not Node, Python or Maven.

```sh
mkdir my-app
cd my-app
npx -p @colibri-kit/ui colibri init --starter
python3 -m http.server 8080
```

`npx` downloads `@colibri-kit/ui` from npm, runs its `colibri` command once and leaves nothing installed. (Always write `-p @colibri-kit/ui`: the unscoped name `colibri` on npm is an unrelated package.) To work from a checkout instead, clone https://github.com/levancho/colibri-kit and run `node ../colibri-kit/bin/colibri.mjs init --starter`.

No installer at all? Link the published files from a CDN, pinned to a version:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@colibri-kit/css@0.1.0/dist/colibri.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@colibri-kit/ui@0.1.0/themes/colibri.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@colibri-kit/css@0.1.0/dist/colibri-ui-bridge.css">
<script type="module" src="https://cdn.jsdelivr.net/npm/@colibri-kit/ui@0.1.0/dist/lazy/auto-lazy.js"></script>
<body class="ui-root">
```

Open http://localhost:8080/. You get a settings form with local persistence, a keyboard-operable dialog, a dark-mode switch, and application-owned CSS. No `npm install` into your project and no library build is needed for this route. The form uses browser storage, not a backend; replace its save handler with your authenticated API request for shared data.

`init` copies the CSS distribution, core controllers, custom elements, themes, FreeMarker macros and Thymeleaf fragments into `colibri/`. `--dir assets/colibri` changes the destination and the starter's links. Run it from the directory your server exposes as its static root. URLs in the starter are relative, so it can run below an application path as well as at `/`.

For an existing application omit `--starter` to avoid creating page files. Include these in order:

```html
<link rel="stylesheet" href="./colibri/css/colibri.css">
<link rel="stylesheet" href="./colibri/themes/colibri.css">
<link rel="stylesheet" href="./colibri/css/colibri-ui-bridge.css">
<link rel="stylesheet" href="./app.css">
<script type="module" src="./colibri/core/auto.js"></script>
<body class="ui-root">
```

Use the public URL where your server mounts these assets. Never expose `node_modules` as your application's static root. Java template files belong in the server's template resources; the copied versions are convenience sources, not browser dependencies.

## Install into a bundler / React project

```sh
npm install @colibri-kit/ui @colibri-kit/css
```

Both packages are published at the same version; keep them in step. `@colibri-kit/ui` has no install scripts and React is an optional peer dependency, needed only for `@colibri-kit/ui/react`. To pin an unreleased revision instead, clone the repository and install from the checkout: `npm install ./vendor/colibri-kit ./vendor/colibri-kit/packages/colibri-css`.

The command-line tool ships in `@colibri-kit/ui`. Its binary is called `colibri`, which is also the name of an unrelated package on npm, so always name the package when using `npx`: `npx -p @colibri-kit/ui colibri <command>`. Inside a project that has `@colibri-kit/ui` installed, `npx colibri <command>` resolves to the local binary.

In the application's entry module:

```js
import '@colibri-kit/css';
import '@colibri-kit/ui/themes/colibri.css';
import '@colibri-kit/css/bridge';
import './app.css';
```

For non-React pages, also import `@colibri-kit/ui/core/auto`. In React, use the adapter instead; do not run auto-initialization on React-owned components:

```jsx
import { Dialog, Part } from '@colibri-kit/ui/react';

export function Help() {
  return <div className="ui-root">
    <Dialog>
      <Part name="trigger" as="button">Help</Part>
      <Part name="content" as="dialog">
        <Part name="title" as="h2">Project help</Part>
        <p>Your application content goes here.</p>
        <Part name="close" as="button">Close</Part>
      </Part>
    </Dialog>
  </div>;
}
```

React 18 or newer is required; the packed consumer test exercises React 18.3.1. The host supplies React and JSX tooling. For a small non-React page you can import a single controller (`@colibri-kit/ui/core/dialog` exports `createDialog`) instead of the full automatic registry. Keep its returned API and call `destroy()` when removing it.

## Customize without editing vendor files

The bridge maps CSS tokens (`--c-*`) to UI tokens (`--ui-*`). Put your overrides in your own unlayered stylesheet:

```css
:root { --c-hue: 160; --c-radius: 0.75rem; }
/* Override an individual UI decision without changing the whole palette. */
.billing-form { --ui-control-h: 44px; }
```

Set `<html data-theme="dark">` or `data-theme="light"`; omit the attribute to use the CSS system preference. For an independently branded section, add `data-colibri-theme` before overriding `--c-hue` there so derived colors are recalculated. If using only the UI theme without Colibri CSS/bridge, customize `--ui-*` directly. Use semantic component rules for repeated application patterns rather than spreading presentation styles through markup.

## Dynamic content and application data

`auto.js` initializes the initial document and HTMX swaps. For HTML inserted by your own code, call `init(container)` from that module after insertion, or dispatch a bubbling `ui:refresh` event from the container. Removed components are disposed automatically by the auto module. Manual controllers need explicit cleanup; React wrappers own their cleanup.

Listen to documented `ui:*` events on the component root; for example tabs dispatch `ui:change` with `event.detail.value`. Component behavior does not provide API endpoints, authentication, authorization or server validation. Use normal form `name` attributes and server-side validation. Render untrusted text with `textContent` or your template engine's escaping.

Java setup, engine dependencies, resource JAR and bindings: [Java template integration](java-templates.md), also available at https://colibri.l3v.ai/java-templates.html.

## Load less JavaScript

`core/auto.js` imports every controller. Two alternatives ship in `dist/` (copied by `init` to `colibri/dist/`):

| Script | What loads | Use it when |
|---|---|---|
| `core/auto.js` | all controllers, unminified source modules | developing, or reading the source in DevTools |
| `dist/colibri-ui.min.js` | all controllers, one minified file | you want one request and use many components |
| `dist/lazy/auto-lazy.js` | a small loader, then one minified chunk per component family on first use | a page uses a handful of components |

```html
<link rel="stylesheet" href="./colibri/dist/colibri-ui.min.css">
<script type="module" src="./colibri/dist/lazy/auto-lazy.js"></script>
```

Use one of the three on a page; mixing them (or one of them with `core/*` imports) loads two copies of the controller state. The lazy loader initialises asynchronously: `init(container)` returns a promise, and the document dispatches `ui:ready` after the first pass. A pass waits for every chunk it needs, so components appear together. If a chunk fails to load, the rest still initialise, a bubbling `ui:error` event carries `{ name, error }`, and `ui:ready`'s `detail.failed` lists the names; browsers cache a failed module, so recovery needs a reload. `ui:refresh` works the same in all three. Measured sizes are in `dist/bundle-sizes.json`.

## Class names Colibri owns

Colibri CSS uses short, unprefixed class names (`.card`, `.stack`, `.center`, `.badge`…). An application class with the same name inherits the kit's styles, which is easy to miss. List the reserved names and check your stylesheets:

```sh
node path/to/bin/colibri.mjs classes
node path/to/bin/colibri.mjs collisions app.css --strict
```

`collisions` prints each rule whose selector mentions a Colibri class (including compound selectors such as `div.card`), with its line; `--strict` exits non-zero for CI. Extending a kit class on purpose (`.btn.icon { … }`) is reported too, and is fine. The list is also published as `colibri-classes.json`. It covers the core stylesheet; the application-components stylesheet has further class names of its own.

If an existing project already uses these names, link `colibri.prefixed.css` instead of `colibri.css`: every class becomes `.c-*` (`.c-card`, `.c-stack`) while tokens, layers and `data-*` attributes stay the same. The prefixed build renames the core stylesheet only. The theme packs, the application components, the React adapter and the FreeMarker/Thymeleaf templates still emit the unprefixed names (`btn`, `card`, `stack`), so use it for hand-written markup with Colibri UI components, not together with those parts.

## One vocabulary for tones and variants

Colibri CSS and Colibri UI each accept the other's words, so markup does not depend on which layer styles an element:

| Meaning | Colibri CSS (canonical) | Colibri UI (canonical) | Accepted by both |
|---|---|---|---|
| success | `data-tone="ok"` | `data-tone="success"` | yes |
| warning | `data-tone="warn"` | `data-tone="warning"` | yes |
| error | `data-tone="bad"` | `data-tone="danger"` | yes |
| destructive action | `data-variant="danger"` | `data-variant="destructive"` | yes |

## Events and controller API

`node path/to/bin/colibri.mjs docs <name>` lists every event a component dispatches, the keys of `event.detail`, whether it is cancelable, and the members of its controller. These are read from the controllers at build time, so they match the code. The same table is in the registry (`events`, `api`) and in the agent skill reference.

```js
import { controllers } from "./colibri/core/util.js";   // also exported by auto.js and auto-lazy.js

const range = document.querySelector("#range");          // <div data-ui="segmented-control">
range.addEventListener("ui:change", (e) => console.log(e.detail.value));
controllers(range)[0].value = "week";                    // set it from code
```

## Upgrade and diagnose

Run `colibri diff` (or `node path/to/bin/colibri.mjs diff`) from the folder containing `colibri.json` using the new package revision. It reports changed or missing vendor files. Back up local changes before upgrading. `init` refuses conflicting files before writing anything; `--dry-run` previews the operation and `--force` explicitly replaces conflicts. Keep `app.css` and `app.js` outside the vendor directory. **Do not use `--starter --force` on an existing application** unless you intend to replace its starter files too.

| Symptom | Check |
| --- | --- |
| Unstyled layout | CSS request is 200 with a CSS content type; include the CSS distribution. |
| Controls ignore brand colors | Load the bridge after the UI theme; check your application token overrides. |
| Dialog/menu does nothing | Serve HTTP, not `file://`; check the module request and console. |
| Native inputs look different | Put `ui-root` on the body or application container. |
| Inserted component is inactive | Call `init(container)` after insertion; avoid double ownership with React. |
| Java import cannot resolve | Install the template JAR and host engine; check the template resolver paths. |
| Assets 404 below an application prefix | Match URLs to the host's static-resource mount, not a filesystem path. |
| Blocked styles or scripts under a Content-Security-Policy | The kit needs no `'unsafe-inline'` or `'unsafe-eval'`; see [Content Security Policy](csp.md) for the policy, motion presets and template helpers. |

The modern CSS requires browsers supporting cascade layers, `:has()`, OKLCH and `light-dark()`. Test your supported browser versions; this is not a legacy-browser stylesheet. Repository CI exercises Chromium, Firefox and WebKit, plus a consumer test that installs packed archives and runs the standalone starter. Accessibility also depends on the labels, content and application behavior you supply.

## Application integration contracts

The optional application stylesheet is scoped to `.colibri-application`. It must be loaded in addition to the CSS core. Refer to `css/bundle-sizes.json` in a built site for separate uncompressed and gzip sizes; a core-only size does not include the application components.

Application forms provide `{ formData, values, submitter }` to submission handlers. `formData` retains native multi-value/file semantics. In the convenience `values` object, one value remains a scalar and repeated names become arrays. The clicked submitter is included. Use `formData.getAll(name)` when your API needs a specific collection shape.

React `ApplicationForm` is uncontrolled by default to retain edits during unrelated rerenders. Pass a `recordKey` (or a model `id`) when changing records and `resetKey` when deliberately resetting the current draft. For controlled inputs, supply `values` and `onValuesChange`. Fields use stable IDs or names as React keys.

`createApplicationComponent`, chart helpers and the application shell share tracked, idempotent cleanup. Keep their cleanup API for manual ownership; `dispose(container)` also tears down tracked descendants. The mobile shell uses modal dialog semantics and makes the covered application stage inert, restoring its previous state when closed.

Public charts accept finite numeric values, not numeric strings. Bar and area charts support negatives and zero values. A donut requires nonnegative values and renders its empty track for a zero total. Pure renderers reject malformed data; the markup enhancer displays an explicit unavailable state.

Framework support is per example: native component/macro/fragment, generated markup adapter, static HTML, or unavailable. See the website's framework-support page or the registry `support` object. `colibri view NAME --language react|ftl|thymeleaf|html|js` returns the same source as the gallery.

For a reproducible Linux browser matrix (for example, if native Firefox cannot open its profile on macOS), install Docker and run `npm run test:cross-browser:linux`. The command uses the official image matching the pinned Playwright version and mounts the project read-only. `BROWSERS=firefox` restricts that optional command to Firefox. Normal Linux CI uses the native browser matrix.

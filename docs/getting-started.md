# Install and use Colibri

## Start without a bundler

Prerequisites: Git and Node.js 22.12+ to run the installer. Python 3 is used below only as a local HTTP server; any static web server works. Your deployed application needs only the copied CSS and JavaScript, not Node, Python or Maven.

From the directory where you keep projects:

```sh
git clone https://github.com/levancho/colibri-kit.git colibri-kit
mkdir my-app
cd my-app
node ../colibri-kit/bin/colibri.mjs init --starter
python3 -m http.server 8080
```

Open http://localhost:8080/. You get a settings form with local persistence, a keyboard-operable dialog, a dark-mode switch, and application-owned CSS. No npm install or library build is needed for this route. The form uses browser storage, not a backend; replace its save handler with your authenticated API request for shared data.

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

The source package names are `@colibri-kit/ui` and `@colibri-kit/css`. These instructions do not depend on a public npm release. From an existing application, install a pinned checkout:

```sh
git clone https://github.com/levancho/colibri-kit.git vendor/colibri-kit
# Record the revision used by your application:
git -C vendor/colibri-kit rev-parse HEAD
npm install ./vendor/colibri-kit ./vendor/colibri-kit/packages/colibri-css
```

Commit or otherwise retain that vendor revision for your deployment. To distribute immutable archives internally, run `npm pack` in each package directory and install the resulting tarballs instead. The package has no install scripts or required React dependency for plain HTML consumers.

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

The host supplies React and JSX tooling. For a small non-React page you can import a single controller (`@colibri-kit/ui/core/dialog` exports `createDialog`) instead of the full automatic registry. Keep its returned API and call `destroy()` when removing it.

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

The modern CSS requires browsers supporting cascade layers, `:has()`, OKLCH and `light-dark()`. Test your supported browser versions; this is not a legacy-browser stylesheet. Repository CI exercises Chromium, Firefox and WebKit, plus a consumer test that installs packed archives and runs the standalone starter. Accessibility also depends on the labels, content and application behavior you supply.

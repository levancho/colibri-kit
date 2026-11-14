# Content Security Policy

Colibri works under a strict Content-Security-Policy. Nothing in the kit needs `'unsafe-inline'` or
`'unsafe-eval'`. A policy like this one is enough when the Colibri files are served from your own origin:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'
```

If you load Colibri from a CDN instead, add that origin to `script-src` and `style-src`
(for example `https://cdn.jsdelivr.net`).

## What the kit does at run time

- **Scripts** are ES modules (`core/auto.js`, `core/auto-lazy.js`, `dist/colibri-ui.min.js`) and the lazy loader uses
  `import()` of files next to it. No `eval`, no `new Function`, no inline scripts. Your own inline
  `<script type="module">` that calls Colibri needs a nonce or hash, as any inline script does.
- **Styles** come from the stylesheets you link. Controllers set positions, sizes and custom properties through the
  CSSOM (`element.style.setProperty(...)`), which CSP does not restrict. They never write `style="…"` attributes into
  markup.
- **Motion presets** registered at run time with `register()` from `core/motion.js` are the one place the kit adds
  CSS rules. They go into a constructed stylesheet attached with `document.adoptedStyleSheets`, which a strict
  `style-src` allows. Earlier versions injected a `<style>` element, which a strict policy blocked without any error:
  the preset simply did nothing.

### Browsers without constructable stylesheets

In a browser without `adoptedStyleSheets`, `register()` falls back to a `<style id="ui-motion-registry">` element.
Under a strict policy that element needs your page's nonce. Give it in either of two ways:

```js
import { register } from "@colibri-kit/ui/core/motion.js";
register("swing", { in: [{ transform: "rotate(-8deg)", opacity: 0 }, {}] }, document, { nonce: "r4nd0m" });
```

```html
<!-- read by register() when no nonce is passed; same value as in your policy's 'nonce-…' source -->
<meta property="csp-nonce" nonce="r4nd0m">
```

and allow it in the policy: `style-src 'self' 'nonce-r4nd0m'`. Generate a new nonce for every response.

## Server-rendered templates

Two template helpers write a `style` attribute, which `style-src` without `'unsafe-inline'` (or a
`style-src-attr` source) blocks:

- the FreeMarker `skeleton` macro in `freemarker/ui.ftl` (`width` and `height`), and
- the chart legend in `freemarker/application-chart.ftl` and `thymeleaf/application-chart.html` (`--dot`).

Under a strict policy, size skeletons with your own classes and colour legend dots in your stylesheet, or allow
these attributes with `style-src-attr 'unsafe-inline'` if your policy permits it.

## Checking it

`test/e2e/bugs-browser.e2e.mjs` serves a page with a strict policy, registers a preset, and checks that its custom
properties apply, that its exit animation runs, and that no CSP violation is reported, both with constructed
stylesheets and with the nonce fallback.

// Colibri UI: lazy auto-initialisation. Same contract as auto.js, but each component's controller is
// imported only when an element with that data-ui name appears, so a page that uses a tooltip and a
// dialog downloads two small modules instead of the whole registry.
//
//   <script type="module" src="colibri/core/auto-lazy.js"></script>
//
// Differences from auto.js: initialisation is asynchronous (init() returns a promise; the document
// also dispatches "ui:ready" after the first pass), and the full `registry` object is not loaded.
// Use one of auto.js or auto-lazy.js on a page, not both. React apps use neither.
import { loaders } from "./lazy-registry.js";
import { initMotion } from "./motion.js";
import { dispose, observeRemovals, controllers } from "./util.js";
export { loaders, dispose, observeRemovals, controllers };

const loading = new Map();
/** Resolve the controller factory for a data-ui name, importing its module on first use. */
export function load(name) {
  if (!loaders[name]) return Promise.resolve(null);
  if (!loading.has(name)) loading.set(name, loaders[name]().catch((e) => { loading.delete(name); throw e; }));
  return loading.get(name);
}

/** Initialise components inside `scope`. Inner components first, exactly like auto.js. */
export async function init(scope = document) {
  const els = [...scope.querySelectorAll("[data-ui]")];
  if (scope.matches?.("[data-ui]")) els.unshift(scope);
  const names = [...new Set(els.map((el) => el.dataset.ui))].filter((n) => loaders[n]);
  const factories = new Map();
  await Promise.all(names.map((n) => load(n).then((f) => factories.set(n, f), (e) => console.error(`[colibri-ui] could not load ${n}:`, e))));
  for (const el of els.reverse()) {
    const f = factories.get(el.dataset.ui);
    // skip anything removed or re-templated while its module was loading
    if (!f || !el.isConnected || el.closest("template")) continue;
    // date-picker owns its calendar; repeater rows initialise after insertion
    if (el.dataset.ui === "calendar" && el.closest('[data-ui="date-picker"]')) continue;
    try { f(el); } catch (e) { console.error(`[colibri-ui] ${el.dataset.ui}:`, e, el); }
  }
}

if (typeof document !== "undefined" && !globalThis.__COLIBRI_UI_NO_AUTO__) {
  const first = () => init().then(() => document.dispatchEvent(new CustomEvent("ui:ready")));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", first);
  else first();
  observeRemovals(document);
  document.addEventListener("htmx:beforeCleanupElement", (e) => dispose(e.detail?.elt || e.target));
  initMotion(document); // exit animations (no-op without themes/motion.css tokens)
  document.addEventListener("ui:refresh", (e) => init(e.target instanceof Element ? e.target : document));
  document.addEventListener("htmx:afterSwap", (e) => init(e.target)); // HTMX support, no-op otherwise
}

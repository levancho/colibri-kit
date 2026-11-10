// Colibri UI: lazy auto-initialisation. Same contract as auto.js, but each component's controller is
// imported only when an element with that data-ui name appears, so a page that uses a tooltip and a
// dialog downloads two small modules instead of the whole registry.
//
//   <script type="module" src="colibri/core/auto-lazy.js"></script>
//
// Differences from auto.js: initialisation is asynchronous (init() returns a promise; the document
// also dispatches "ui:ready" after the first pass), and the full `registry` object is not loaded.
// A pass waits for every module it needs, so components appear together once the slowest chunk arrives.
// If a chunk cannot be loaded the rest still initialise; `ui:error` and the `failed` list in `ui:ready`
// report it. Browsers cache a failed module import, so recovery needs a page reload.
// Use one of auto.js or auto-lazy.js on a page, not both. React apps use neither.
import { loaders } from "./lazy-registry.js";
import { initMotion } from "./motion.js";
import { dispose, observeRemovals, controllers } from "./util.js";
export { loaders, dispose, observeRemovals, controllers };

const known = (name) => Object.hasOwn(loaders, name); // never loaders["constructor"]: a stray data-ui value must not break the page
const loading = new Map();
/** Resolve the controller factory for a data-ui name, importing its module on first use. */
export function load(name) {
  if (!known(name)) return Promise.resolve(null);
  if (!loading.has(name)) loading.set(name, loaders[name]().catch((e) => { loading.delete(name); throw e; }));
  return loading.get(name);
}

/** Initialise components inside `scope`. Inner components first, exactly like auto.js.
 *  Resolves to the names whose module could not be loaded (empty when all went well); each failure also
 *  dispatches a bubbling `ui:error` event with `{ name, error }` from `scope`. */
export async function init(scope = document) {
  const els = [...scope.querySelectorAll("[data-ui]")];
  if (scope.matches?.("[data-ui]")) els.unshift(scope);
  const attached = new Set(els.filter((el) => el.isConnected));
  const names = [...new Set(els.map((el) => el.dataset.ui))].filter(known);
  const factories = new Map(), failed = [];
  await Promise.all(names.map((n) => load(n).then((f) => factories.set(n, f), (error) => {
    failed.push(n); console.error(`[colibri-ui] could not load ${n}:`, error);
    (scope.ownerDocument || scope).dispatchEvent(new CustomEvent("ui:error", { bubbles: true, detail: { name: n, error } }));
  })));
  for (const el of els.reverse()) {
    const f = factories.get(el.dataset.ui);
    // skip anything removed while its module was loading (a scope that was never attached is still initialised)
    if (!f || (attached.has(el) && !el.isConnected) || el.closest("template,[data-motion-ghost]")) continue;
    // date-picker owns its calendar; repeater rows initialise after insertion
    if (el.dataset.ui === "calendar" && el.closest('[data-ui="date-picker"]')) continue;
    try { f(el); } catch (e) { console.error(`[colibri-ui] ${el.dataset.ui}:`, e, el); }
  }
  return failed;
}

if (typeof document !== "undefined" && !globalThis.__COLIBRI_UI_NO_AUTO__) {
  const first = () => init().then((failed) => {
    // Exit animations start only after the first pass: controllers hide closed parts while they initialise,
    // and that must not play as an exit on page load (auto.js gets this for free by initialising synchronously).
    initMotion(document);
    document.dispatchEvent(new CustomEvent("ui:ready", { detail: { failed } }));
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", first);
  else first();
  observeRemovals(document);
  document.addEventListener("htmx:beforeCleanupElement", (e) => dispose(e.detail?.elt || e.target));
  document.addEventListener("ui:refresh", (e) => init(e.target instanceof Element ? e.target : document));
  document.addEventListener("htmx:afterSwap", (e) => init(e.target)); // HTMX support, no-op otherwise
}

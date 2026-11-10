// Colibri UI: auto-initialise every [data-ui] element on the page (FreeMarker / plain HTML / HTMX).
// React apps should NOT use this; they call createX(ref.current) themselves.
import { registry } from "./registry.js";
import { initMotion } from "./motion.js";
import { dispose, observeRemovals, controllers } from "./util.js";
// `controllers(el)` returns the live controller APIs of an auto-initialised element, e.g.
//   controllers(document.querySelector("#range"))[0].value = "week";
export { registry, dispose, observeRemovals, controllers };


/** Initialise components inside `scope`. Inner components first, so outer ones (e.g. a calendar inside
 *  a date-picker, or tabs inside a dialog) find their children already wired. */
export function init(scope = document) {
  const els = [...scope.querySelectorAll("[data-ui]")];
  if (scope.matches?.("[data-ui]")) els.unshift(scope);
  for (const el of els.reverse()) {
    const f = registry[el.dataset.ui];
    if (!f || el.closest("template")) continue;
    // date-picker owns its calendar; repeater rows initialise after insertion
    if (el.dataset.ui === "calendar" && el.closest('[data-ui="date-picker"]')) continue;
    try { f(el); } catch (e) { console.error(`[colibri-ui] ${el.dataset.ui}:`, e, el); }
  }
}

if (typeof document !== "undefined" && !globalThis.__COLIBRI_UI_NO_AUTO__) {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => init());
  else init();
  observeRemovals(document);
  document.addEventListener("htmx:beforeCleanupElement", e => dispose(e.detail?.elt || e.target));
  initMotion(document); // exit animations (no-op without themes/motion.css tokens)
  document.addEventListener("ui:refresh", (e) => init(e.target instanceof Element ? e.target : document));
  document.addEventListener("htmx:afterSwap", (e) => init(e.target)); // HTMX support, no-op otherwise
}

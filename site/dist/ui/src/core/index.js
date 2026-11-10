// Main entry of the UI package. It has no side effects: importing it initialises nothing.
// It exports `registry`, `init(scope)` (wires every [data-ui] element under scope), `controllers`,
// `dispose`, `observeRemovals` and `toast`.
// For automatic initialisation use the `core/auto` entry (everything) or the `lazy` entry (only the
// controllers a page uses) instead. React applications use the `react` entry.
import { registry } from "./registry.js";
export { registry };
export { controllers, dispose, observeRemovals } from "./util.js";
export { toast } from "./base.js";

/** Initialise components inside `scope`, inner components first. Same rules as core/auto.js. */
export function init(scope = document) {
  const els = [...scope.querySelectorAll("[data-ui]")];
  if (scope.matches?.("[data-ui]")) els.unshift(scope);
  for (const el of els.reverse()) {
    const f = Object.hasOwn(registry, el.dataset.ui) ? registry[el.dataset.ui] : null;
    if (!f || el.closest("template,[data-motion-ghost]")) continue;
    if (el.dataset.ui === "calendar" && el.closest('[data-ui="date-picker"]')) continue;
    try { f(el); } catch (e) { console.error(`[colibri-ui] ${el.dataset.ui}:`, e, el); }
  }
}

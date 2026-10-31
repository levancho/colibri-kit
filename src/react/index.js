// Colibri UI for React: thin wrappers over the same headless engine used by plain HTML and FreeMarker.
// No JSX, no build step, React is a peer dependency. Styling is yours: Colibri CSS primitives,
// Colibri CSS primitives (className="stack card", data-gap="m", data-variant="ghost"), CSS modules, anything.
//
//   import { UI, Part, Dialog, Tabs, useColibri, cx } from "@colibri-kit/ui/react";
//
//   <Dialog className="c-inline">
//     <Part name="trigger" as="button" className="btn">Invite</Part>
//     <Part name="content" as="dialog" className="card stack">…</Part>
//   </Dialog>
import { createElement, forwardRef, useCallback, useEffect, useRef } from "react";
import { registry } from "../core/registry.js";

/** Join class names; falsy values are skipped. cx("btn", busy && "is-busy") */
export const cx = (...a) => a.flat(Infinity).filter(Boolean).join(" ");

const setRef = (r, v) => { if (typeof r === "function") r(v); else if (r) r.current = v; };

/** Hook: wire a Colibri component onto a DOM element. Returns a callback ref and a ref holding the component API.
 *  `on` maps Colibri events (without the "ui:" prefix) to handlers, e.g. { change: (e) => … }. */
export function useColibri(kind, { on = {}, options } = {}) {
  const api = useRef(null), el = useRef(null), handlers = useRef(on);
  handlers.current = on;
  const ref = useCallback((node) => {
    if (el.current && el.current !== node) { api.current?.destroy?.(); api.current = null; }
    el.current = node;
    if (node && !api.current) {
      const f = registry[kind];
      if (!f) { console.error(`[colibri-ui/react] unknown component "${kind}"`); return; }
      // inner components first (same rule as auto-init)
      [...node.querySelectorAll("[data-ui]")].reverse().forEach((c) => registry[c.dataset.ui]?.(c));
      api.current = f(node, options) ?? null;
    }
  }, [kind]);
  useEffect(() => {
    const node = el.current; if (!node) return;
    const subs = Object.keys(handlers.current).map((n) => { const h = (e) => handlers.current[n]?.(e); node.addEventListener("ui:" + n, h); return [n, h]; });
    return () => subs.forEach(([n, h]) => node.removeEventListener("ui:" + n, h));
  }, [Object.keys(on).join()]);
  useEffect(() => () => { api.current?.destroy?.(); api.current = null; }, []);
  return [ref, api];
}

/** Any Colibri component: <UI kind="accordion" type="multiple" onChange={…}>…</UI>
 *  Extra props named like data attributes are passed as data-*: type, side, value, defaultValue… */
const DATA_PROPS = ["type", "side", "align", "orientation", "value", "defaultValue", "label", "name", "variant", "size", "tone", "required", "offset", "max", "min", "step"];
export const UI = forwardRef(function UI({ kind, as = "div", children, apiRef, onChange, onOpen, onClose, on = {}, ...rest }, fwd) {
  const events = { ...on }; if (onChange) events.change = onChange; if (onOpen) events.open = onOpen; if (onClose) events.close = onClose;
  const [ref, api] = useColibri(kind, { on: events });
  if (apiRef) apiRef.current = api.current;
  const props = { "data-ui": kind };
  for (const [k, v] of Object.entries(rest)) {
    if (DATA_PROPS.includes(k)) { if (v === true) props["data-" + kebab(k)] = ""; else if (v != null && v !== false) props["data-" + kebab(k)] = Array.isArray(v) ? v.join(",") : String(v); }
    else props[k] = v;
  }
  props.ref = (n) => { ref(n); setRef(fwd, n); if (apiRef) apiRef.current = api.current; };
  return createElement(as, props, children);
});
const kebab = (s) => s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());

/** A component part: <Part name="trigger" as="button">…</Part> renders data-ui-part="trigger". */
export const Part = forwardRef(function Part({ name, as = "div", value, children, ...rest }, ref) {
  const props = { "data-ui-part": name, ref, ...rest };
  if (value != null) props["data-value"] = value;
  if (as === "button" && !rest.type) props.type = "button";
  return createElement(as, props, children);
});

// Named sugar for the most used components. Every other component: <UI kind="…">.
const named = (kind, as) => forwardRef((p, r) => createElement(UI, { kind, as, ...p, ref: r }));
export const Dialog = named("dialog");
export const Sheet = named("sheet");
export const Tabs = named("tabs");
export const Accordion = named("accordion");
export const Collapsible = named("collapsible");
export const DropdownMenu = named("dropdown-menu");
export const Popover = named("popover");
export const Tooltip = named("tooltip", "span");
export const Select = named("select");
export const Combobox = named("combobox");
export const ButtonGroup = named("button-group");
export const Switch = named("switch", "button");
export const Spinner = named("spinner", "span");
export const Toolbar = named("toolbar");
export const SegmentedControl = named("segmented-control");
export const RadioCards = named("radio-cards");
export const CheckboxCards = named("checkbox-cards");
export const CheckboxGroup = named("checkbox-group");
export const TabNav = named("tab-nav", "nav");
export const DataList = named("data-list", "dl");
export const Callout = named("callout");
export const Inset = named("inset");

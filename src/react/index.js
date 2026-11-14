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
import { createElement, forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { registry } from "../core/registry.js";
import { controllers } from "../core/util.js";
const reactRoots = new WeakSet();

/** Join class names; falsy values are skipped. cx("btn", busy && "is-busy") */
export const cx = (...a) => a.flat(Infinity).filter(Boolean).join(" ");

const setRef = (r, v) => { if (typeof r === "function") r(v); else if (r) r.current = v; };

// Kinds that are styles only (Colibri CSS reads data-ui), with no controller to build.
const PRESENTATIONAL = new Set(["data-list", "callout", "inset"]);
// Kinds whose controller removes its own root (a dismissed alert, a removed badge or attachment). In React the DOM
// belongs to React: removing the node behind its back made the next commit or the unmount throw ("The node to be
// removed is not a child of this node"). Under React the node is hidden instead and the event still fires, so the
// app drops it from its state (on={{ remove: … }} / onDismiss), and React removes it.
const SELF_REMOVING = { alert: "dismiss", dismiss: "dismiss", badge: "remove", attachment: "remove" };

/** Options are compared by value: an inline object literal (a new object on every render) with the same values keeps
 *  the controller; a changed value rebuilds it. Functions are not compared: the latest one is always called. */
function sameValue(a, b, depth = 0) {
  if (Object.is(a, b)) return true;
  if (typeof a === "function" && typeof b === "function") return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object" || depth > 4) return false;
  if (Array.isArray(a) !== Array.isArray(b) || Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
  if (Object.getPrototypeOf(a) !== Object.prototype && !Array.isArray(a)) return false; // DOM nodes, dates, maps: identity only
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => Object.hasOwn(b, k) && sameValue(a[k], b[k], depth + 1));
}
function useStableOptions(options) {
  const latest = useRef(options), stable = useRef(null), last = useRef(undefined);
  latest.current = options;
  if (stable.current === null || !sameValue(last.current, options)) {
    last.current = options;
    // functions read the latest render's options, so a new inline callback needs no rebuild
    stable.current = options && typeof options === "object" && Object.getPrototypeOf(options) === Object.prototype
      ? Object.fromEntries(Object.entries(options).map(([k, v]) => [k, typeof v === "function" ? (...args) => latest.current?.[k]?.(...args) : v]))
      : options;
  }
  return stable.current;
}

/** Hook: wire a Colibri component onto a DOM element. Returns a callback ref and a ref holding the component API.
 *  `on` maps Colibri events (without the "ui:" prefix) to handlers, e.g. { change: (e) => … }.
 *  `options` is compared by value, so `options: { min: 0, onValueChange: fn }` written inline is fine: the controller
 *  is rebuilt only when a value changes, and callbacks always call the latest function. */
export function useColibri(kind, { on = {}, options: rawOptions, apiRef } = {}) {
  const options = useStableOptions(rawOptions);
  const api = useRef(null), handlers = useRef(on), attached = useRef(null), owned = useRef(new Map());
  const [node, setNode] = useState(null);
  handlers.current = on;
  const ref = useCallback(next => {
    if (attached.current) reactRoots.delete(attached.current);
    attached.current = next;
    if (next) reactRoots.add(next);
    setNode(next);
  }, []);
  const syncChildren = useCallback(() => {
    if (!node) return;
    for (const [child, childApi] of owned.current) if (!node.contains(child)) { childApi.destroy?.(); owned.current.delete(child); }
    for (const child of [...node.querySelectorAll("[data-ui]")].reverse()) {
      let parent = child, reactOwned = false;
      while (parent && parent !== node) { if (reactRoots.has(parent)) { reactOwned = true; break; } parent = parent.parentElement; }
      if (reactOwned || controllers(child).length || child.closest('template,[data-motion-ghost]')) continue;
      if (child.dataset.ui === "calendar" && child.closest('[data-ui="date-picker"]')) continue;
      const childApi = registry[child.dataset.ui]?.(child);
      if (childApi) owned.current.set(child, childApi);
    }
  }, [node]);
  // Subscribe first: controllers such as a remote datatable emit their initial event while they are being built.
  const eventNames = JSON.stringify(Object.keys(on).sort());
  useEffect(() => {
    if (!node) return;
    const subs = JSON.parse(eventNames).map(name => {
      const handler = event => handlers.current[name]?.(event);
      node.addEventListener("ui:" + name, handler); return [name, handler];
    });
    return () => subs.forEach(([name, handler]) => node.removeEventListener("ui:" + name, handler));
  }, [node, eventNames]);
  useEffect(() => {
    if (!node) return;
    const factory = registry[kind];
    if (!factory) { if (!PRESENTATIONAL.has(kind)) console.error(`[colibri-ui/react] unknown component "${kind}"`); syncChildren(); return () => { for (const childApi of owned.current.values()) childApi.destroy?.(); owned.current.clear(); }; }
    syncChildren();
    // keep a self-removing root in React's tree (see SELF_REMOVING)
    const selfRemove = SELF_REMOVING[kind];
    if (selfRemove === "dismiss" && node.dataset.remove == null) node.dataset.remove = "false";
    const keep = (event) => {
      if (event.target !== node || event.defaultPrevented) return;
      event.preventDefault(); // the controller then leaves the node alone
      const focused = node.contains(node.ownerDocument.activeElement);
      node.hidden = true; node.dataset.state = "removed";
      if (focused) (node.nextElementSibling?.querySelector?.("button") || node.previousElementSibling?.querySelector?.("button"))?.focus();
    };
    // registered after the app's own listeners (the effect above), so a handler can still veto with preventDefault()
    if (selfRemove === "remove") node.addEventListener("ui:remove", keep);
    api.current = factory(node, options) ?? null;
    setRef(apiRef, api.current);
    return () => {
      if (selfRemove === "remove") node.removeEventListener("ui:remove", keep);
      for (const childApi of owned.current.values()) childApi.destroy?.();
      owned.current.clear(); api.current?.destroy?.(); api.current = null; setRef(apiRef, null);
    };
  }, [node, kind, options, apiRef, syncChildren]);
  // Dynamic React children update the existing controller rather than rebuilding it. Refresh only when the
  // DOM under the root actually changed: refreshing after every render made controllers re-emit their events
  // (datatable ui:query / ui:select), and a handler that sets state then re-rendered without end.
  const changes = useRef(null), dirty = useRef(false);
  useEffect(() => {
    const MO = node?.ownerDocument.defaultView?.MutationObserver;
    if (!MO) return;
    changes.current = new MO(() => { dirty.current = true; });
    changes.current.observe(node, { childList: true, subtree: true });
    return () => { changes.current?.disconnect(); changes.current = null; };
  }, [node]);
  useEffect(() => {
    const observer = changes.current;
    if (!observer) { syncChildren(); return; }
    const changed = observer.takeRecords().length > 0 || dirty.current;
    dirty.current = false;
    if (!changed) return;
    syncChildren(); api.current?.refresh?.();
    observer.takeRecords(); // the controller's own DOM work during refresh is not a reason to refresh again
  });
  return [ref, api];
}

/** Any Colibri component: <UI kind="accordion" type="multiple" onChange={…}>…</UI>
 *  Extra props named like data attributes are passed as data-*: type, side, value, defaultValue… */
const DATA_PROPS = ["type", "side", "align", "orientation", "value", "defaultValue", "label", "name", "variant", "size", "tone", "required", "offset", "max", "min", "step"];
export const UI = forwardRef(function UI({ kind, as = "div", children, apiRef, onChange, onOpen, onClose, on = {}, ...rest }, fwd) {
  const events = { ...on }; if (onChange) events.change = onChange; if (onOpen) events.open = onOpen; if (onClose) events.close = onClose;
  const change=events.change;
  if(kind === "tabs" && rest.value !== undefined) events.change=event=>{
    change?.(event);
    api.current?.select(rest.value,{silent:true});
  };
  const [ref, api] = useColibri(kind, { on: events, apiRef });
  // Controlled selection is synchronized through the controller, never data-attribute mutation.
  useEffect(() => {
    if (kind === "tabs" && rest.value !== undefined && api.current?.value !== rest.value) api.current?.select(rest.value,{silent:true});
  });
  const combinedRef = useCallback(node => { ref(node); setRef(fwd, node); }, [ref, fwd]);
  const props = { "data-ui": kind };
  for (const [k, v] of Object.entries(rest)) {
    if (DATA_PROPS.includes(k)) { if (v === true) props["data-" + kebab(k)] = ""; else if (v != null && v !== false) props["data-" + kebab(k)] = Array.isArray(v) ? v.join(",") : String(v); }
    else props[k] = v;
  }
  props.ref = combinedRef;
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
export { ChartPanel } from './chart-panel.js';
export { ApplicationShell, MetricRail, RecordTable, OpportunityBoard, ProjectCards, DayPlanner, IdentityCard, ProductCollection, OrderReceipt, ConversationDesk, ApplicationForm, PhotoFeature, KnowledgeArticle } from './application-components.js';

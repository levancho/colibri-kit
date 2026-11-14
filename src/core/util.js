// Colibri UI shared helpers (internal). No styling, no deps.
let _uid = 0;
export const uid = (p = "ui") => `${p}-${++_uid}`;
export const bool = (v, d) => (v == null ? d : v !== "false");
/** parts of `root` whose nearest [data-ui] ancestor is root (nested components stay isolated; a part that is itself a component, e.g. data-ui=button data-ui-part=trigger, still belongs to its parent) */
/** the component an element belongs to (a part that is itself a component belongs to its parent) */
export const owner = (el) => (el.hasAttribute("data-ui") ? el.parentElement?.closest("[data-ui]") : el.closest("[data-ui]"));
export const parts = (root, part, sel = "") =>
  [...root.querySelectorAll(`[data-ui-part="${part}"]${sel}`)].filter((el) => owner(el) === root);
export const part = (root, p, sel) => parts(root, p, sel)[0] || null;
export const emit = (el, name, detail, cancelable = false) =>
  el.dispatchEvent(new CustomEvent(`ui:${name}`, { bubbles: true, cancelable, detail }));
export const setState = (el, s) => el && (el.dataset.state = s);
export const btn = (el) => { if (el && el.tagName === "BUTTON" && !el.hasAttribute("type")) el.type = "button"; return el; };
/** Make a non-button element (a custom element such as <ui-checkbox>, a div) behave like a button for the keyboard:
    in the tab order, and Space (plus Enter when `enter`) clicks it. Native buttons and inputs already do this. */
export function pressable(el, b, { enter = true } = {}) {
  if (el.tagName === "BUTTON" || el.tagName === "INPUT") return;
  if (!el.hasAttribute("tabindex")) el.tabIndex = isDisabled(el) ? -1 : 0;
  b.on(el, "keydown", (e) => {
    if (e.target !== el || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === " " || e.key === "Spacebar" || (enter && e.key === "Enter")) { e.preventDefault(); if (!isDisabled(el)) el.click(); }
  });
}
export const isDisabled = (el) => el.disabled || el.dataset.disabled != null || el.getAttribute("aria-disabled") === "true";
// Track controller ownership without retaining detached DOM trees.
const instances = new WeakMap();
export const controllers = (root) => [...(instances.get(root) || [])];
export function trackController(root, api) {
  if (!api || controllers(root).includes(api)) return api;
  root.setAttribute?.('data-colibri-controller','');
  const owned = instances.get(root) || new Set(); owned.add(api); instances.set(root, owned);
  const destroy = api.destroy; let destroyed = false;
  api.destroy = () => {
    if (destroyed) return; destroyed = true;
    try {
      const Event = root.ownerDocument?.defaultView?.CustomEvent;
      if (Event) root.dispatchEvent(new Event("ui:destroy", { bubbles: false }));
      destroy?.call(api);
    } finally { owned.delete(api); if (!owned.size) { instances.delete(root); root.removeAttribute?.('data-colibri-controller'); } }
  };
  return api;
}
/** Dispose a removed subtree, innermost first. Safe to call more than once. */
export function dispose(root) {
  const nodes = [...(root.querySelectorAll?.("[data-ui],[data-colibri-controller]") || [])].reverse();
  nodes.push(root);
  for (const node of nodes) for (const api of controllers(node)) api.destroy?.();
}
/** register on root once; returns cached api */
export function once(root, key, factory) {
  if (root[key]) return root[key];
  // Mark the root while its controller is being built. A factory may dispatch ui:refresh (repeater does when it
  // adds its minimum rows); without the mark, the resulting init pass would build a second controller here.
  const building = {}; root[key] = building;
  let api;
  try { api = factory(); } finally { if (root[key] === building) delete root[key]; }
  root[key] = api;
  const destroy = api.destroy;
  api.destroy = () => { try { destroy?.call(api); } finally { if (root[key] === api) delete root[key]; } };
  return trackController(root, api);
}
/** listeners bag with single teardown */
export function bag() {
  const offs = [];
  return {
    on(t, ev, fn, o) { t.addEventListener(ev, fn, o); offs.push(() => t.removeEventListener(ev, fn, o)); },
    off() { offs.splice(0).forEach((f) => f()); },
  };
}
/** roving focus over items: arrows/Home/End; returns index-based mover */
export function roving(items, current, key, { orientation = "both", loop = true } = {}) {
  const list = items.filter((i) => !isDisabled(i));
  if (!list.length) return null;
  const i = Math.max(0, list.indexOf(current));
  const next = ["ArrowDown", "ArrowRight"].filter((k) => orientation === "both" || (orientation === "vertical" ? k === "ArrowDown" : k === "ArrowRight"));
  const prev = ["ArrowUp", "ArrowLeft"].filter((k) => orientation === "both" || (orientation === "vertical" ? k === "ArrowUp" : k === "ArrowLeft"));
  if (next.includes(key)) return list[loop ? (i + 1) % list.length : Math.min(i + 1, list.length - 1)];
  if (prev.includes(key)) return list[loop ? (i - 1 + list.length) % list.length : Math.max(i - 1, 0)];
  if (key === "Home") return list[0];
  if (key === "End") return list[list.length - 1];
  return null;
}
/** typeahead: find next item whose text starts with buffered chars */
export function typeahead() {
  let buf = "", t;
  return (items, current, ch) => {
    clearTimeout(t); t = setTimeout(() => (buf = ""), 500); buf += ch.toLowerCase();
    const list = items.filter((i) => !isDisabled(i));
    const start = Math.max(0, list.indexOf(current));
    const order = [...list.slice(start + (buf.length === 1 ? 1 : 0)), ...list.slice(0, start + 1)];
    return order.find((i) => (i.dataset.label || i.textContent).trim().toLowerCase().startsWith(buf)) || null;
  };
}
/** minimal positioning: position:fixed next to anchor with flip. Styling may override via CSS. */
export function place(floating, anchor, { side = "bottom", align = "start", offset = 6, point } = {}) {
  if (floating.dataset.position === "none") return;
  const view = floating.ownerDocument.defaultView;
  floating.style.position = "fixed"; floating.style.margin = "0";
  // Remove a newly unhidden layer from flex/grid layout before measuring its
  // anchor; otherwise the trigger moves again after the popup is positioned.
  const a = point ? { left: point.x, right: point.x, top: point.y, bottom: point.y, width: 0, height: 0 } : anchor.getBoundingClientRect();
  const f = floating.getBoundingClientRect();
  const vw = view.innerWidth, vh = view.innerHeight;
  let s = side;
  if (s === "bottom" && a.bottom + offset + f.height > vh && a.top - offset - f.height >= 0) s = "top";
  else if (s === "top" && a.top - offset - f.height < 0) s = "bottom";
  else if (s === "right" && a.right + offset + f.width > vw) s = "left";
  else if (s === "left" && a.left - offset - f.width < 0) s = "right";
  let x, y;
  if (s === "bottom" || s === "top") {
    y = s === "bottom" ? a.bottom + offset : a.top - offset - f.height;
    x = align === "end" ? a.right - f.width : align === "center" ? a.left + a.width / 2 - f.width / 2 : a.left;
  } else {
    x = s === "right" ? a.right + offset : a.left - offset - f.width;
    y = align === "end" ? a.bottom - f.height : align === "center" ? a.top + a.height / 2 - f.height / 2 : a.top;
  }
  floating.style.left = `${Math.max(4, Math.min(x, vw - f.width - 4))}px`;
  floating.style.top = `${Math.max(4, Math.min(y, vh - f.height - 4))}px`;
  floating.dataset.side = s; floating.dataset.align = align;
}
/** stack of open dismissable layers: Esc + outside pointer close the topmost only */
const layers = [];
export function layer(el, close, { outside = true, escape = true, ignore = [] } = {}) {
  const doc = el.ownerDocument;
  const entry = { el, close };
  const onKey = (e) => { if (e.key === "Escape" && escape && layers[layers.length - 1] === entry) { e.preventDefault(); close("escape"); } };
  const onDown = (e) => {
    if (!outside || layers[layers.length - 1] !== entry) return;
    if (el.contains(e.target) || ignore.some((i) => i && i.contains(e.target))) return;
    close("outside");
  };
  layers.push(entry);
  doc.addEventListener("keydown", onKey, true);
  doc.addEventListener("pointerdown", onDown, true);
  return () => {
    const i = layers.indexOf(entry); if (i >= 0) layers.splice(i, 1);
    doc.removeEventListener("keydown", onKey, true);
    doc.removeEventListener("pointerdown", onDown, true);
  };
}

/** A callable cleanup with the same ownership/idempotence contract as controllers. */
export function cleanupController(root,key,teardown) {
 if(root[key])return root[key];
 const cleanup=()=>cleanup.destroy();
 cleanup.destroy=()=>{try{teardown();}finally{delete root[key];}};
 root[key]=cleanup;trackController(root,cleanup);return cleanup;
}

const observers = new WeakMap();
/** Match initialization with teardown when framework swaps remove nodes. Moves keep their API. */
export function observeRemovals(root = document) {
  if (observers.has(root)) return observers.get(root);
  const doc = root.ownerDocument || root, MO = doc.defaultView?.MutationObserver;
  if (!MO) return null;
  const observer = new MO(records => {
    for (const record of records) for (const node of record.removedNodes) {
      if (node.nodeType === 1 && !node.isConnected) dispose(node);
    }
  });
  observer.observe(root, { childList: true, subtree: true });
  const api = { disconnect() { observer.disconnect(); observers.delete(root); } };
  observers.set(root, api); return api;
}

/** The language that applies to `el` (nearest [lang], then the document's), or undefined. */
export const langOf = (el) => (el?.closest?.("[lang]")?.getAttribute("lang") || el?.ownerDocument?.documentElement.getAttribute("lang") || undefined);
const separators = new Map();
function localeSeparators(locale) {
  if (!locale) return null;
  if (!separators.has(locale)) {
    let out = null;
    try { const p = new Intl.NumberFormat(locale).formatToParts(12345.6); out = { group: p.find((x) => x.type === "group")?.value, decimal: p.find((x) => x.type === "decimal")?.value }; } catch {}
    separators.set(locale, out);
  }
  return separators.get(locale);
}
/** Parse a number written for people: "1,200", "1.200,50" (de), "1 200,5" (fr), "1'200" (de-CH), "$1,200.00", "(300)", "−4".
    When both "," and "." appear, the last one is the decimal separator. A single separator is read with `locale` when
    given ("1,200" is 1.2 in German and 1200 in English); without one, "." is decimal and "," groups thousands when
    exactly three digits follow it. Returns NaN when there are no digits. parseFloat("1,200") is 1, which is the bug
    this replaces. */
export function parseNumber(text, locale) {
  if (typeof text === "number") return text;
  let s = String(text ?? "").trim();
  const negative = /^\(.*\)$/.test(s) || /^[^\d]*[-−]/.test(s) || /[-−]$/.test(s);
  s = s.replace(/[^\d.,]/g, ""); // spaces, NBSP, apostrophes, currency and units are not part of the value
  if (!/\d/.test(s)) return NaN;
  const lastComma = s.lastIndexOf(","), lastDot = s.lastIndexOf(".");
  let decimal = null;
  if (lastComma >= 0 && lastDot >= 0) decimal = lastComma > lastDot ? "," : ".";
  else if (lastComma >= 0 || lastDot >= 0) {
    const sep = lastComma >= 0 ? "," : ".", count = s.split(sep).length - 1, after = s.length - s.lastIndexOf(sep) - 1;
    const loc = localeSeparators(locale);
    if (count > 1) decimal = null;
    else if (loc?.decimal === sep) decimal = sep;
    else if (loc?.group === sep) decimal = after === 3 ? null : sep;
    else decimal = sep === "," && after === 3 ? null : sep;
  }
  s = s.split(decimal === "," ? "." : decimal === "." ? "," : /[.,]/).join("");
  if (decimal) s = s.replace(decimal, ".");
  const n = Number(s);
  return Number.isFinite(n) ? (negative ? -n : n) : NaN;
}

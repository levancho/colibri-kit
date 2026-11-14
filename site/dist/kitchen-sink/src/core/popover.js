// Colibri UI: Popover / Tooltip / HoverCard — one floating-layer core with different triggers.
//  <div data-ui="popover" [data-side="bottom|top|left|right"] [data-align="start|center|end"] [data-modal]>
//     <button data-ui-part="trigger">…</button>
//     <div data-ui-part="content" hidden>… <button data-ui-part="close">x</button></div></div>
//  data-ui="tooltip"    → opens on hover/focus after data-delay (default 500ms), role=tooltip, aria-describedby.
//                         Hoverable, dismissable with Esc and persistent (WCAG 1.4.13): it stays open while the pointer
//                         is over the trigger or the tooltip or the trigger has focus; Esc hides it without moving focus.
//  data-ui="hover-card" → opens on hover/focus (default 300ms), stays open while pointer is over content
//  Popover and hover-card content is a dialog named by its [data-ui-part=title] (or first heading), else by the
//  trigger, unless it already has aria-label/aria-labelledby. A popover moves focus inside when it opens
//  ([autofocus], else the first focusable element, else the content) and returns it to the trigger when it closes.
//  data-position="none" on content = skip built-in positioning (use CSS anchor positioning / your own).
import { uid, part, emit, setState, btn, once, bag, place, layer } from "./util.js";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable=""],[contenteditable=true]';
/** Give a dialog-like layer an accessible name: its own title or heading, else the control that opens it. */
export function nameLayer(content, trigger, id, { title: useTitle = true } = {}) {
  if (content.hasAttribute("aria-label") || content.hasAttribute("aria-labelledby")) return;
  const title = useTitle ? content.querySelector('[data-ui-part="title"],h1,h2,h3,h4,h5,h6') : null;
  const by = title || trigger;
  if (!by) return;
  by.id ||= `${id}-${title ? "title" : "trigger"}`;
  content.setAttribute("aria-labelledby", by.id);
}

function floating(root, o, mode) {
  const b = bag(), id = root.id || uid(`ui-${mode}`);
  const trigger = part(root, "trigger"), content = part(root, "content");
  if (!trigger || !content) throw new Error(`colibri-ui ${mode}: needs trigger + content parts`);
  btn(trigger); content.id ||= `${id}-content`;
  const isTip = mode === "tooltip";
  content.setAttribute("role", isTip ? "tooltip" : mode === "hover-card" ? "dialog" : (content.getAttribute("role") || "dialog"));
  if (isTip) trigger.setAttribute("aria-describedby", content.id);
  else { trigger.setAttribute("aria-haspopup", "dialog"); trigger.setAttribute("aria-controls", content.id); if (content.getAttribute("role") === "dialog") nameLayer(content, trigger, id); }
  const side = () => o.side || root.dataset.side || (isTip ? "top" : "bottom");
  const align = () => o.align || root.dataset.align || (isTip ? "center" : "start");
  const delay = Number(o.delay ?? root.dataset.delay ?? (isTip ? 500 : mode === "hover-card" ? 300 : 0));
  // A short grace period lets the pointer cross the gap between trigger and tooltip without closing it.
  const closeDelay = Number(o.closeDelay ?? root.dataset.closeDelay ?? (mode === "hover-card" ? 200 : isTip ? 120 : 0));
  let open = false, unlayer = null, t, hovered = false, focused = false;
  const reposition = () => open && place(content, trigger, { side: side(), align: align() });
  const render = () => {
    [root, trigger, content].forEach((e) => setState(e, open ? "open" : "closed"));
    if (!isTip) trigger.setAttribute("aria-expanded", String(open));
    content.hidden = !open;
  };
  function set(v, reason) {
    clearTimeout(t); if (v === open) return;
    open = v; render();
    if (open) {
      reposition();
      unlayer = layer(content, (r) => set(false, r), { ignore: [trigger], outside: !isTip });
      if (mode === "popover") {
        const target = content.querySelector("[autofocus]") || content.querySelector(FOCUSABLE);
        if (target) target.focus(); else { if (!content.hasAttribute("tabindex")) content.tabIndex = -1; content.focus(); }
      }
    } else {
      unlayer?.(); unlayer = null;
      const active = root.ownerDocument.activeElement;
      if (mode === "popover" && reason !== "outside" && (content.contains(active) || active === root.ownerDocument.body)) trigger.focus();
    }
    o.onOpenChange?.(open); emit(root, open ? "open" : "close", { reason });
  }
  const later = (v, ms) => { clearTimeout(t); t = setTimeout(() => set(v, "hover"), ms); };
  // Close only when neither hover nor focus keeps the layer open.
  const settle = () => { if (!hovered && !focused) later(false, closeDelay); };
  if (mode === "popover") {
    b.on(trigger, "click", () => set(!open, "trigger"));
    b.on(content, "click", (e) => { if (e.target.closest('[data-ui-part="close"]')) set(false, "close"); });
  } else {
    for (const el of [trigger, content]) {
      b.on(el, "pointerenter", () => { hovered = true; if (open) clearTimeout(t); else if (el === trigger) later(true, delay); });
      b.on(el, "pointerleave", () => { hovered = false; settle(); });
    }
    b.on(trigger, "focus", () => { focused = true; set(true, "focus"); });
    b.on(trigger, "blur", () => { focused = false; if (!hovered) set(false, "blur"); });
  }
  const view = root.ownerDocument.defaultView;
  b.on(view, "resize", reposition); b.on(view, "scroll", reposition, true);
  render();
  return {
    get open() { return open; }, show: () => set(true, "api"), hide: () => set(false, "api"), toggle: () => set(!open, "api"),
    reposition, destroy() { clearTimeout(t); unlayer?.(); unlayer = null; b.off(); },
  };
}
export const createPopover = (r, o = {}) => once(r, "__uiPopover", () => floating(r, o, "popover"));
export const createTooltip = (r, o = {}) => once(r, "__uiTooltip", () => floating(r, o, "tooltip"));
export const createHoverCard = (r, o = {}) => once(r, "__uiHoverCard", () => floating(r, o, "hover-card"));

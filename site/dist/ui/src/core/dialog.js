import { owner, trackController, layer } from "./util.js";
// @colibri-kit/ui core: Dialog controller. Headless; built on the native <dialog> element.
//
//   <div data-ui="dialog" [data-modal="true|false"] [data-default-open] [data-dismissible="true|false"]
//        [data-close-on-backdrop="true|false"] [data-close-on-outside="true|false"]>
//     <button data-ui-part="trigger">Open</button>          (optional, can be anywhere inside root)
//     <dialog data-ui-part="content">
//       <h2 data-ui-part="title">Title</h2>
//       <p data-ui-part="description">Optional text</p>
//       ... any content, incl. other Colibri UI components ...
//       <button data-ui-part="close" [data-ui-return="ok"]>Close</button>
//     </dialog>
//   </div>
//
// State out: root/trigger/content get data-state="open|closed"; trigger gets aria-expanded.
// Events (bubble from root): "ui:open", "ui:close" detail {returnValue}.  Cancellable "ui:beforeclose".
// Focus: native <dialog> focuses [autofocus] or first focusable; focus returns to the opener on close.
// Escape: handled on keydown (and the keydown is cancelled), so a non-dismissible dialog or a vetoed
// ui:beforeclose stays open however often Esc is pressed. Chrome closes a modal dialog itself after
// repeated cancelled `cancel` events; cancelling the keydown means it never gets that far.
// Non-modal (data-modal="false"): Esc closes it, and so does a pointer press outside it unless
// data-close-on-outside="false" (defaults to data-close-on-backdrop). Nested layers close first.

let uid = 0;
const stack = []; // open dialogs, most recent last: Escape goes to the topmost only
const bool = (v, d) => (v == null ? d : v !== "false");

export function createDialog(root, options = {}) {
  if (root.__uiDialog) return root.__uiDialog;
  const own = (el) => owner(el) === root; // nested components (tabs, menus…) keep their own parts
  const parts = (p) => [...root.querySelectorAll(`[data-ui-part="${p}"]`)].filter(own);
  const content = parts("content")[0];
  if (!content || content.tagName !== "DIALOG") throw new Error('colibri-ui dialog: needs <dialog data-ui-part="content">');
  // ['dialog','alert-dialog','sheet','drawer'] all use this core

  const id = root.id || `ui-dialog-${++uid}`;
  const opt = (k, d) => (options[k] ?? bool(root.dataset[k], d));
  const modal = () => opt("modal", true);
  const variant = options.variant || root.dataset.variant || (root.dataset.ui === "alert-dialog" ? "alert" : root.dataset.ui === "sheet" || root.dataset.ui === "drawer" ? "sheet" : "default");
  const dismissible = () => opt("dismissible", variant !== "alert");
  const closeOnBackdrop = () => opt("closeOnBackdrop", variant !== "alert");
  const closeOnOutside = () => opt("closeOnOutside", closeOnBackdrop());
  if (variant === "alert") content.setAttribute("role", "alertdialog");
  if (variant === "sheet") content.dataset.side = root.dataset.side || "right";   // CSS positions it; behaviour = modal dialog
  content.dataset.variant = variant;
  let opener = null, offLayer = null;
  const doc = root.ownerDocument;

  // wiring
  const title = parts("title")[0], desc = parts("description")[0];
  if (title) { title.id ||= `${id}-title`; content.setAttribute("aria-labelledby", title.id); }
  if (desc)  { desc.id  ||= `${id}-desc`;  content.setAttribute("aria-describedby", desc.id); }
  content.id ||= `${id}-content`;
  parts("trigger").forEach((t) => {
    if (t.tagName === "BUTTON" && !t.hasAttribute("type")) t.type = "button";
    t.setAttribute("aria-haspopup", "dialog");
    t.setAttribute("aria-controls", content.id);
  });
  parts("close").forEach((c) => { if (c.tagName === "BUTTON" && !c.hasAttribute("type")) c.type = "button"; });

  function render(open) {
    const s = open ? "open" : "closed";
    root.dataset.state = s; content.dataset.state = s;
    parts("trigger").forEach((t) => { t.dataset.state = s; t.setAttribute("aria-expanded", String(open)); });
  }

  const isOpen = () => content.open;

  function open(from) {
    if (isOpen()) return;
    // explicit trigger wins: Safari (and scripted clicks) don't focus buttons on click
    opener = from || root.ownerDocument.activeElement;
    const asModal = modal() && typeof content.showModal === "function";
    if (asModal) content.showModal();
    else if (typeof content.show === "function") content.show();
    else content.setAttribute("open", "");           // very old browsers / test DOMs
    stack.push(api);
    doc.addEventListener("keydown", onKey);
    // non-modal: a press outside closes it (topmost layer only; the triggers toggle it themselves)
    if (!asModal) offLayer = layer(content, (why) => { if (dismissible() && closeOnOutside()) close(why); }, { escape: false, ignore: parts("trigger") });
    render(true);
    options.onOpenChange?.(true);
    root.dispatchEvent(new CustomEvent("ui:open", { bubbles: true }));
  }

  function close(returnValue = "") {
    if (!isOpen()) return;
    const ev = new CustomEvent("ui:beforeclose", { bubbles: true, cancelable: true, detail: { returnValue } });
    if (!root.dispatchEvent(ev)) return;
    if (typeof content.close === "function") content.close(returnValue); else content.removeAttribute("open");
    finishClose(returnValue);
  }

  function detach() {
    const i = stack.indexOf(api); if (i >= 0) stack.splice(i, 1);
    doc.removeEventListener("keydown", onKey);
    offLayer?.(); offLayer = null;
  }

  function finishClose(returnValue) {
    detach();
    render(false);
    const back = opener; opener = null;
    const refocus = () => { if (back && typeof back.focus === "function" && back.isConnected) back.focus(); };
    refocus();
    // an outside press then moves focus to what was pressed; if that is nothing focusable, the browser
    // leaves focus on <body> after this event: put it back on the opener
    if (returnValue === "outside") setTimeout(() => { const a = doc.activeElement; if (!a || a === doc.body) refocus(); });
    options.onOpenChange?.(false);
    root.dispatchEvent(new CustomEvent("ui:close", { bubbles: true, detail: { returnValue } }));
  }

  function onClick(e) {
    const t = e.target.closest('[data-ui-part="trigger"],[data-ui-part="close"]');
    if (t && own(t)) {
      if (t.dataset.uiPart === "trigger") open(t);
      else close(t.dataset.uiReturn ?? t.value ?? "");
      return;
    }
    // click on the ::backdrop lands on the <dialog> element itself, outside its content box
    if (e.target === content && closeOnBackdrop() && dismissible() && modal()) {
      const r = content.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) close("backdrop");
    }
  }

  // Esc: decide on keydown. A handled (default-prevented) Escape belongs to a nested layer (menu, popover,
  // inner dialog), and only the topmost open dialog reacts. Bubble phase, so inner handlers run first.
  function onKey(e) {
    if (e.key !== "Escape" || e.defaultPrevented || e.isComposing || stack[stack.length - 1] !== api || !isOpen()) return;
    e.preventDefault();
    if (dismissible()) close("escape");
  }
  // Native "cancel" (Esc that reached the dialog, Android back, close requests): never let it close the
  // dialog by itself; go through close() so dismissible and ui:beforeclose apply.
  function onCancel(e) { e.preventDefault(); if (dismissible()) close("escape"); }
  // <form method="dialog"> submits close the dialog natively -> keep state in sync
  function onNativeClose() { if (root.dataset.state === "open") finishClose(content.returnValue); }

  root.addEventListener("click", onClick);
  content.addEventListener("cancel", onCancel);
  content.addEventListener("close", onNativeClose);

  const api = {
    get open() { return isOpen(); },
    show: () => open(), close,
    toggle: () => (isOpen() ? close() : open()),
    destroy() {
      detach();
      root.removeEventListener("click", onClick);
      content.removeEventListener("cancel", onCancel);
      content.removeEventListener("close", onNativeClose);
      if (content.open) { if (typeof content.close === "function") content.close(); else content.removeAttribute("open"); }
      opener = null; render(false);
      delete root.__uiDialog;
    },
  };
  root.__uiDialog = trackController(root, api);
  render(false);
  if (options.defaultOpen ?? root.hasAttribute("data-default-open")) open();
  return api;
}

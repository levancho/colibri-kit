// Colibri UI — Clothline (by L3V, l3v.ai).
// Floating "cells" (movable, resizable panels) that you minimize ("hang") onto a line of tags instead of closing.
// Click a tag to restore the cell; × on the tag closes it for good. The line hides itself when empty.
//   <nav data-ui="clothline" id="line" aria-label="Minimized cells" hidden></nav>
//   <section data-ui="cell" data-line="#line" data-name="Answers" data-mark="✦">
//     <header data-ui-part="header"><span data-ui-part="title">Answers</span>
//       <button data-ui-part="minimize">−</button><button data-ui-part="maximize">□</button><button data-ui-part="close">×</button></header>
//     <div data-ui-part="body">…</div><span data-ui-part="resize"></span></section>
// Events (bubble from the cell): ui:hang, ui:restore, ui:close (cancelable), ui:maximize {maximized}, ui:move, ui:resize.
const emit = (el, n, detail = {}, cancelable = false) => el.dispatchEvent(new CustomEvent(n, { bubbles: true, cancelable, detail }));
const q = (r, p) => r.querySelector(`[data-ui-part="${p}"]`);
let uid = 0;

export function createClothline(root) {
  root.setAttribute("role", root.getAttribute("role") || "navigation");
  if (!root.hasAttribute("aria-label")) root.setAttribute("aria-label", "Minimized cells");
  const sync = () => { const n = root.querySelectorAll('[data-ui-part="item"]').length; root.hidden = !n; root.dataset.count = n; document.body?.classList.toggle("ui-has-hanging", !!n); };
  const hang = (cell) => {
    const id = cell.id ||= `ui-cell-${++uid}`, name = cell.dataset.name || q(cell, "title")?.textContent.trim() || "Cell";
    if (root.querySelector(`[data-cell="${id}"]`)) return;
    const item = document.createElement("div");
    item.dataset.uiPart = "item"; item.dataset.cell = id;
    item.innerHTML = `<button type="button" data-ui-part="restore"><span data-ui-part="mark" aria-hidden="true"></span><span data-ui-part="label"></span></button><button type="button" data-ui-part="remove">×</button>`;
    q(item, "mark").textContent = cell.dataset.mark || "◈"; q(item, "label").textContent = name;
    q(item, "restore").setAttribute("aria-label", `Restore ${name}`); q(item, "restore").title = `Restore ${name}`;
    q(item, "remove").setAttribute("aria-label", `Close ${name}`); q(item, "remove").title = `Close ${name}`;
    root.append(item); sync();
    return item;
  };
  const unhang = (cell) => { root.querySelector(`[data-cell="${cell.id}"]`)?.remove(); sync(); };
  const onClick = (e) => {
    const item = e.target.closest('[data-ui-part="item"]'); if (!item) return;
    const cell = document.getElementById(item.dataset.cell);
    if (e.target.closest('[data-ui-part="restore"]')) cell?.uiCell ? cell.uiCell.restore() : (unhang({ id: item.dataset.cell }));
    else if (e.target.closest('[data-ui-part="remove"]')) cell?.uiCell ? cell.uiCell.close() : unhang({ id: item.dataset.cell });
  };
  const onKey = (e) => { // arrow keys move between tags
    const tags = [...root.querySelectorAll('[data-ui-part="restore"]')], i = tags.indexOf(document.activeElement);
    if (i < 0) return;
    const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (k) { e.preventDefault(); tags[(i + k + tags.length) % tags.length].focus(); }
    if (e.key === "Home") { e.preventDefault(); tags[0].focus(); } if (e.key === "End") { e.preventDefault(); tags.at(-1).focus(); }
  };
  root.addEventListener("click", onClick); root.addEventListener("keydown", onKey); sync();
  const api = { hang, unhang, items: () => [...root.querySelectorAll('[data-ui-part="item"]')], destroy() { root.removeEventListener("click", onClick); root.removeEventListener("keydown", onKey); delete root.uiClothline; } };
  root.uiClothline = api; return api;
}

export function createCell(root, opts = {}) {
  root.id ||= `ui-cell-${++uid}`;
  const header = q(root, "header"), title = q(root, "title"), body = q(root, "body");
  root.setAttribute("role", root.getAttribute("role") || "region");
  if (title) { title.id ||= `${root.id}-title`; root.setAttribute("aria-labelledby", title.id); }
  const name = () => root.dataset.name || title?.textContent.trim() || "Cell";
  const line = () => { const s = opts.line || root.dataset.line; const el = s ? document.querySelector(s) : document.querySelector('[data-ui="clothline"]'); return el && (el.uiClothline || createClothline(el)); };
  const label = (p, t) => { const b = q(root, p); if (b && !b.hasAttribute("aria-label")) b.setAttribute("aria-label", `${t} ${name()}`); if (b) b.type = "button"; };
  label("minimize", "Minimize"); label("maximize", "Maximize"); label("close", "Close");
  const state = (s) => { root.dataset.state = s; };
  state(root.hidden ? "hanging" : "open");
  let before = null;
  const api = {
    get state() { return root.dataset.state; },
    hang() {
      if (root.dataset.state === "hanging" || !emit(root, "ui:hang", { name: name() }, true)) return;
      const l = line(); const item = l?.hang(root);
      state("hanging"); root.hidden = true;
      if (root.contains(document.activeElement) || document.activeElement === document.body) (item && q(item, "restore"))?.focus();
    },
    restore() {
      if (root.dataset.state !== "hanging") return;
      line()?.unhang(root); root.hidden = false; state(root.dataset.maximized != null ? "maximized" : "open");
      api.front(); (q(root, "minimize") || header || root).focus?.(); emit(root, "ui:restore", { name: name() });
    },
    close() {
      if (!emit(root, "ui:close", { name: name() }, true)) return;
      line()?.unhang(root); root.hidden = true; state("closed");
      if (root.dataset.remove != null) root.remove();
    },
    open() { if (root.dataset.state === "hanging") return api.restore(); root.hidden = false; state("open"); api.front(); },
    toggleMaximize(force) {
      const m = force ?? root.dataset.maximized == null;
      if (m) { root.dataset.maximized = ""; state("maximized"); } else { delete root.dataset.maximized; state("open"); }
      const b = q(root, "maximize"); b?.setAttribute("aria-pressed", String(m));
      emit(root, "ui:maximize", { maximized: m });
    },
    front() { const peers = [...document.querySelectorAll('[data-ui="cell"]')]; const z = Math.max(0, ...peers.map((p) => +p.style.zIndex || 0)); root.style.zIndex = z + 1; },
    destroy() { off.forEach((f) => f()); delete root.uiCell; },
  };
  const off = [];
  const on = (el, ev, fn, o) => { if (!el) return; el.addEventListener(ev, fn, o); off.push(() => el.removeEventListener(ev, fn, o)); };
  on(root, "click", (e) => {
    const p = e.target.closest("[data-ui-part]")?.dataset.uiPart;
    if (p === "minimize") api.hang(); else if (p === "maximize") api.toggleMaximize(); else if (p === "close") api.close();
  });
  on(root, "pointerdown", () => api.front());
  on(root, "keydown", (e) => { if (e.key === "Escape" && root.dataset.maximized != null) { e.stopPropagation(); api.toggleMaximize(false); } });
  // drag by header / resize by grip (pointer events, positions within offsetParent)
  const drag = (el, kind) => on(el, "pointerdown", (e) => {
    if (e.button !== 0 || root.dataset.maximized != null || (kind === "move" && e.target.closest("button,a,input"))) return;
    if (root.dataset.static != null && kind === "move") return;
    e.preventDefault(); el.setPointerCapture?.(e.pointerId);
    const sx = e.clientX, sy = e.clientY, l = root.offsetLeft, t = root.offsetTop, w = root.offsetWidth, h = root.offsetHeight;
    const mv = (ev) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (kind === "move") { root.style.left = `${Math.max(0, l + dx)}px`; root.style.top = `${Math.max(0, t + dy)}px`; }
      else { root.style.width = `${Math.max(+root.dataset.minWidth || 160, w + dx)}px`; root.style.height = `${Math.max(+root.dataset.minHeight || 90, h + dy)}px`; }
    };
    const up = () => { el.removeEventListener("pointermove", mv); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); emit(root, kind === "move" ? "ui:move" : "ui:resize", { left: root.offsetLeft, top: root.offsetTop, width: root.offsetWidth, height: root.offsetHeight }); };
    el.addEventListener("pointermove", mv); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
  });
  drag(header, "move"); drag(q(root, "resize"), "resize");
  // keyboard move/resize on the header: Alt+Arrows move, Alt+Shift+Arrows resize (10px)
  on(header, "keydown", (e) => {
    if (!e.altKey) return; const d = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }[e.key]; if (!d) return; e.preventDefault();
    if (e.shiftKey) { root.style.width = `${root.offsetWidth + d[0]}px`; root.style.height = `${root.offsetHeight + d[1]}px`; }
    else { root.style.left = `${Math.max(0, root.offsetLeft + d[0])}px`; root.style.top = `${Math.max(0, root.offsetTop + d[1])}px`; }
  });
  if (header && !header.hasAttribute("tabindex")) header.tabIndex = 0;
  if (root.dataset.state === "hanging") line()?.hang(root);
  void body;
  root.uiCell = api; return api;
}

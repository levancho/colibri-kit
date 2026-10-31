// Colibri UI — Clothline (by L3V, l3v.ai).
// Floating "cells" (movable, resizable panels) that you minimize ("hang") onto a line of tags instead of closing.
// Click a tag to restore the cell; × on the tag closes it for good. The line hides itself when empty.
//   <nav data-ui="clothline" id="line" aria-label="Minimized cells" hidden></nav>
//   <section data-ui="cell" data-line="#line" data-name="Answers" data-mark="✦">
//     <header data-ui-part="header"><span data-ui-part="title">Answers</span>
//       <button data-ui-part="minimize">−</button><button data-ui-part="maximize">□</button><button data-ui-part="close">×</button></header>
//     <div data-ui-part="body">…</div><span data-ui-part="resize"></span></section>
// Options on the cell:
//   data-size="tiny"       starts as a small chip (mark + title); click it to open, click the header again to fold it back.
//   data-kind="menu"       a menu panel: no maximize; choosing a link/button inside folds it (tiny) or hangs it.
//   data-persist="key"     remembers position, size, state, transparency and stretch in localStorage ("colibri.cell.<key>").
//   Corners: four resize grips are added automatically (nw ne sw se); a hand-written data-ui-part="resize" still works (se).
//   The title mark (◈) opens a small panel: Transparency slider + Stretch vertical / horizontal.
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
  if (root.uiCell) return root.uiCell;
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
  let before = null, loading = false;
  const key = root.dataset.persist ? `colibri.cell.${root.dataset.persist}` : null;
  function save() {
    if (!key || loading) return;
    try { localStorage.setItem(key, JSON.stringify({ left: root.style.left, top: root.style.top, width: root.style.width, height: root.style.height,
      state: root.dataset.state, maximized: root.dataset.maximized != null, tiny: root.dataset.size === "tiny",
      alpha: root.style.getPropertyValue("--cell-alpha") || "", stretch: root.dataset.stretch || "" })); } catch {}
  }
  function load() {
    if (!key) return; let d; try { d = JSON.parse(localStorage.getItem(key) || "null"); } catch {} if (!d) return;
    loading = true;
    for (const k of ["left", "top", "width", "height"]) if (d[k]) root.style[k] = d[k];
    if (d.alpha) { root.style.setProperty("--cell-alpha", d.alpha); root.dataset.transparent = ""; }
    if (d.stretch) root.dataset.stretch = d.stretch; else delete root.dataset.stretch;
    if (d.tiny) root.dataset.size = "tiny"; else if (root.dataset.size === "tiny") delete root.dataset.size;
    if (d.maximized) api.toggleMaximize(true);
    if (d.state === "hanging" && root.dataset.state !== "hanging") api.hang();
    else if (d.state === "closed") { root.hidden = true; state("closed"); }
    else if (d.state === "open" && root.dataset.state === "hanging") api.restore();
    loading = false;
  }
  const api = {
    get state() { return root.dataset.state; },
    hang() {
      if (root.dataset.state === "hanging" || !emit(root, "ui:hang", { name: name() }, true)) return;
      const l = line(); const item = l?.hang(root);
      state("hanging"); root.hidden = true;
      if (root.contains(document.activeElement) || document.activeElement === document.body) (item && q(item, "restore"))?.focus();
      save();
    },
    restore() {
      if (root.dataset.state !== "hanging") return;
      line()?.unhang(root); root.hidden = false; state(root.dataset.maximized != null ? "maximized" : "open");
      api.front(); (q(root, "minimize") || header || root).focus?.(); emit(root, "ui:restore", { name: name() }); save();
    },
    close() {
      if (!emit(root, "ui:close", { name: name() }, true)) return;
      line()?.unhang(root); root.hidden = true; state("closed"); save();
      if (root.dataset.remove != null) root.remove();
    },
    open() { if (root.dataset.state === "hanging") return api.restore(); root.hidden = false; state("open"); api.front(); },
    toggleMaximize(force) {
      const m = force ?? root.dataset.maximized == null;
      if (m) { root.dataset.maximized = ""; state("maximized"); } else { delete root.dataset.maximized; state("open"); }
      const b = q(root, "maximize"); b?.setAttribute("aria-pressed", String(m));
      emit(root, "ui:maximize", { maximized: m }); save();
    },
    setTransparency(a) { // 0 = solid … .8 = very see-through; the cell turns solid again while hovered or focused
      if (a > 0) { root.style.setProperty("--cell-alpha", String(1 - a)); root.dataset.transparent = ""; } else { root.style.removeProperty("--cell-alpha"); delete root.dataset.transparent; }
      emit(root, "ui:transparency", { alpha: a }); save();
    },
    toggleStretch(axis, force) { // axis "v" | "h": fill the parent's height / width
      const cur = new Set((root.dataset.stretch || "").split("").filter(Boolean)); const on_ = force ?? !cur.has(axis);
      on_ ? cur.add(axis) : cur.delete(axis);
      if (cur.size) root.dataset.stretch = [...cur].sort().join(""); else delete root.dataset.stretch;
      emit(root, "ui:stretch", { stretch: root.dataset.stretch || "" }); save();
    },
    fold() { root.dataset.size = "tiny"; state("open"); emit(root, "ui:fold"); save(); },
    unfold() { if (root.dataset.size !== "tiny") return; delete root.dataset.size; root.dataset.wasTiny = ""; api.front(); emit(root, "ui:unfold"); save(); },
    front() { const peers = [...document.querySelectorAll('[data-ui="cell"]')]; const z = Math.max(0, ...peers.map((p) => +p.style.zIndex || 0)); root.style.zIndex = z + 1; },
    clearSaved() { if (key) try { localStorage.removeItem(key); } catch {} },
    destroy() { off.forEach((f) => f()); delete root.uiCell; },
  };
  const off = [];
  const on = (el, ev, fn, o) => { if (!el) return; el.addEventListener(ev, fn, o); off.push(() => el.removeEventListener(ev, fn, o)); };
  on(root, "click", (e) => {
    const p = e.target.closest("[data-ui-part]")?.dataset.uiPart;
    if (p === "minimize") return api.hang(); if (p === "maximize") return api.toggleMaximize(); if (p === "close") return api.close();
    if (root.dataset.size === "tiny") { if (!e.target.closest('[data-ui-part="mark"],[data-ui-part="mark-panel"]')) api.unfold(); return; }
    if (root.dataset.wasTiny != null && p === "header" && e.target === header) return api.fold();
    if (root.dataset.wasTiny != null && e.target.closest('[data-ui-part="title"]') && !e.target.closest("button")) return api.fold();
    if (root.dataset.kind === "menu" && body?.contains(e.target) && e.target.closest("a,button,[role=menuitem]")) { root.dataset.wasTiny != null ? api.fold() : api.hang(); }
  });
  on(root, "pointerdown", () => api.front());
  on(root, "keydown", (e) => { if (e.key === "Escape" && root.dataset.maximized != null) { e.stopPropagation(); api.toggleMaximize(false); } });
  // drag by header / resize from any corner (pointer events, positions within offsetParent)
  const minW = () => +root.dataset.minWidth || 160, minH = () => +root.dataset.minHeight || 90;
  const drag = (el, kind, edge = "se") => on(el, "pointerdown", (e) => {
    if (e.button !== 0 || root.dataset.maximized != null || (kind === "move" && e.target.closest("button,a,input,[data-ui-part=mark]"))) return;
    if (kind === "resize") { const hit = document.elementsFromPoint?.(e.clientX, e.clientY).find((n) => n !== el && root.contains(n) && n.closest?.("[data-ui-part=header] button,[data-ui-part=mark]")); if (hit) return; }
    if (root.dataset.static != null && kind === "move") return;
    if (kind === "move" && root.dataset.size === "tiny") return; // tiny chips open on click instead
    e.preventDefault(); el.setPointerCapture?.(e.pointerId);
    const sx = e.clientX, sy = e.clientY, l = root.offsetLeft, t = root.offsetTop, w = root.offsetWidth, h = root.offsetHeight;
    let moved = false;
    const mv = (ev) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy; if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
      if (kind === "move") { root.style.left = `${Math.max(0, l + dx)}px`; root.style.top = `${Math.max(0, t + dy)}px`; return; }
      delete root.dataset.stretch;
      if (edge.includes("e")) root.style.width = `${Math.max(minW(), w + dx)}px`;
      if (edge.includes("s")) root.style.height = `${Math.max(minH(), h + dy)}px`;
      if (edge.includes("w")) { const nw = Math.max(minW(), w - dx); root.style.width = `${nw}px`; root.style.left = `${Math.max(0, l + w - nw)}px`; }
      if (edge.includes("n")) { const nh = Math.max(minH(), h - dy); root.style.height = `${nh}px`; root.style.top = `${Math.max(0, t + h - nh)}px`; }
    };
    const up = () => { el.removeEventListener("pointermove", mv); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up);
      if (moved) { emit(root, kind === "move" ? "ui:move" : "ui:resize", { left: root.offsetLeft, top: root.offsetTop, width: root.offsetWidth, height: root.offsetHeight }); save(); } };
    el.addEventListener("pointermove", mv); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
  });
  drag(header, "move");
  const legacy = root.querySelector('[data-ui-part="resize"]:not([data-edge])'); if (legacy) { legacy.dataset.edge = "se"; }
  for (const edge of ["nw", "ne", "sw", "se"]) {
    let g = root.querySelector(`[data-ui-part="resize"][data-edge="${edge}"]`);
    if (!g) { g = document.createElement("span"); g.dataset.uiPart = "resize"; g.dataset.edge = edge; g.setAttribute("aria-hidden", "true"); root.append(g); }
    drag(g, "resize", edge);
  }
  // title mark: transparency + stretch panel
  const mark = q(header || root, "mark");
  if (mark) {
    if (mark.tagName !== "BUTTON") { mark.tabIndex = 0; mark.setAttribute("role", "button"); } mark.removeAttribute("aria-hidden");
    mark.setAttribute("aria-label", `Options for ${name()}`); mark.setAttribute("aria-haspopup", "true"); mark.setAttribute("aria-expanded", "false");
    root.querySelector('[data-ui-part="mark-panel"]')?.remove();
    const panel = document.createElement("div"); panel.dataset.uiPart = "mark-panel"; panel.hidden = true; panel.id = `${root.id}-opts`;
    panel.innerHTML = `<label>Transparency <input type="range" min="0" max="80" step="5" value="0" data-opt="alpha"></label>
      <fieldset><legend>Stretch</legend><button type="button" data-opt="v" aria-pressed="false">↕ Vertical</button><button type="button" data-opt="h" aria-pressed="false">↔ Horizontal</button></fieldset>`;
    mark.setAttribute("aria-controls", panel.id); (header || root).after(panel);
    let hideT;
    const show = (v) => { clearTimeout(hideT); panel.hidden = !v; mark.setAttribute("aria-expanded", String(v)); if (v) sync(); };
    const sync = () => { const st = root.dataset.stretch || ""; panel.querySelector('[data-opt="alpha"]').value = Math.round((1 - (+root.style.getPropertyValue("--cell-alpha") || 1)) * 100);
      panel.querySelector('[data-opt="v"]').setAttribute("aria-pressed", String(st.includes("v"))); panel.querySelector('[data-opt="h"]').setAttribute("aria-pressed", String(st.includes("h"))); };
    on(mark, "mouseenter", () => show(true)); on(mark, "click", (e) => { e.stopPropagation(); show(panel.hidden); });
    on(mark, "keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(panel.hidden); if (!panel.hidden) panel.querySelector("input")?.focus(); } });
    const leave = () => { hideT = setTimeout(() => { if (!panel.contains(document.activeElement)) show(false); }, 350); };
    on(mark, "mouseleave", leave); on(panel, "mouseleave", leave); on(panel, "mouseenter", () => clearTimeout(hideT));
    on(panel, "keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); show(false); mark.focus(); } });
    on(panel, "focusout", (e) => { if (!panel.contains(e.relatedTarget) && e.relatedTarget !== mark) show(false); });
    on(panel, "input", (e) => { if (e.target.dataset.opt === "alpha") api.setTransparency(+e.target.value / 100); });
    on(panel, "click", (e) => { const o = e.target.closest("[data-opt]")?.dataset.opt; if (o === "v" || o === "h") { api.toggleStretch(o); sync(); } });
  }
  // keyboard move/resize on the header: Alt+Arrows move, Alt+Shift+Arrows resize (10px)
  on(header, "keydown", (e) => {
    if (!e.altKey) return; const d = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }[e.key]; if (!d) return; e.preventDefault();
    if (e.shiftKey) { root.style.width = `${root.offsetWidth + d[0]}px`; root.style.height = `${root.offsetHeight + d[1]}px`; }
    else { root.style.left = `${Math.max(0, root.offsetLeft + d[0])}px`; root.style.top = `${Math.max(0, root.offsetTop + d[1])}px`; }
  });
  if (header && !header.hasAttribute("tabindex")) header.tabIndex = 0;
  if (root.dataset.kind === "menu") { q(root, "maximize")?.remove(); body?.setAttribute("role", body.getAttribute("role") || "menu");
    body?.querySelectorAll("a,button").forEach((b) => b.setAttribute("role", b.getAttribute("role") || "menuitem")); }
  if (root.dataset.size === "tiny") root.dataset.wasTiny = "";
  // persistence
  load();
  if (root.dataset.state === "hanging") line()?.hang(root);
  void body;
  root.uiCell = api; return api;
}

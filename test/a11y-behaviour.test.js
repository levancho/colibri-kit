// Accessibility behaviour regressions (jsdom): menu roles and keyboard model, named dialogs, popover focus,
// hoverable tooltips (WCAG 1.4.13), keyboard steppers, APG date grid, carousel autoplay control, timers after
// destroy, and right-to-left arrow keys. Browser-only checks live in test/e2e/a11y-*.e2e.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM(`<body></body>`, { url: "http://localhost/", pretendToBeVisual: true });
const w = dom.window;
let reduceMotion = false;
if (!("innerText" in w.HTMLElement.prototype)) Object.defineProperty(w.HTMLElement.prototype, "innerText", { get() { return this.textContent; }, configurable: true });
w.matchMedia = (q) => ({ matches: /prefers-reduced-motion:\s*reduce/.test(q) ? reduceMotion : false, media: q, addEventListener() {}, removeEventListener() {} });
Object.assign(globalThis, { window: w, document: w.document, CustomEvent: w.CustomEvent, Event: w.Event, MutationObserver: w.MutationObserver,
  HTMLElement: w.HTMLElement, getComputedStyle: w.getComputedStyle, requestAnimationFrame: (f) => setTimeout(f, 0), localStorage: w.localStorage, __COLIBRI_UI_NO_AUTO__: true });
const { init } = await import("../src/core/auto.js");
const mount = (html, attrs = {}) => { const d = document.createElement("div"); Object.entries(attrs).forEach(([k, v]) => d.setAttribute(k, v)); d.innerHTML = html; document.body.append(d); init(d); return d; };
const key = (el, k, o = {}) => el.dispatchEvent(new w.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...o }));
const ptr = (el, type) => el.dispatchEvent(new w.Event(type, { bubbles: type !== "pointerenter" && type !== "pointerleave" }));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const $ = (r, s) => r.querySelector(s), $$ = (r, s) => [...r.querySelectorAll(s)];
const nameOf = (el) => (el.getAttribute("aria-labelledby") || "").split(/\s+/).filter(Boolean).map((id) => document.getElementById(id)?.getAttribute("aria-label") || document.getElementById(id)?.textContent.trim()).join(" ") || el.getAttribute("aria-label") || "";

// ---------- menu ----------
test("menu: disabled items keep a menu role and aria-disabled but are skipped by arrow keys", () => {
  const r = mount(`<div data-ui="dropdown-menu"><button data-ui-part="trigger">m</button><div data-ui-part="content"><button data-ui-part="item">A</button><button data-ui-part="item" disabled>B</button><div data-ui-part="item" data-disabled>C</div><button data-ui-part="item" data-type="checkbox" aria-disabled="true">D</button><button data-ui-part="item">E</button></div></div>`);
  const t = $(r, '[data-ui-part="trigger"]'), [a, b, c, d, e] = $$(r, '[data-ui-part="item"]');
  key(t, "ArrowDown");
  assert.equal(b.getAttribute("role"), "menuitem"); assert.equal(b.getAttribute("aria-disabled"), "true");
  assert.equal(c.getAttribute("role"), "menuitem"); assert.equal(c.getAttribute("aria-disabled"), "true");
  assert.equal(d.getAttribute("role"), "menuitemcheckbox"); assert.equal(d.getAttribute("aria-checked"), "false");
  assert.equal(document.activeElement, a); key(a, "ArrowDown"); assert.equal(document.activeElement, e, "disabled items are skipped");
  key(e, "Home"); assert.equal(document.activeElement, a); key(a, "End"); assert.equal(document.activeElement, e);
  key(e, "Escape"); assert.equal(document.activeElement, t, "Escape returns focus to the trigger");
});

test("menu: Escape in a submenu closes only the submenu and returns focus to its parent item", () => {
  const r = mount(`<div data-ui="dropdown-menu"><button data-ui-part="trigger">m</button><div data-ui-part="content"><button data-ui-part="item">A</button><div data-ui-part="sub"><button data-ui-part="sub-trigger">More</button><div data-ui-part="sub-content" hidden><button data-ui-part="item">S1</button><button data-ui-part="item">S2</button></div></div></div></div>`);
  const t = $(r, '[data-ui-part="trigger"]'), content = $(r, '[data-ui-part="content"]'), st = $(r, '[data-ui-part="sub-trigger"]'), sc = $(r, '[data-ui-part="sub-content"]');
  key(t, "ArrowDown"); key(document.activeElement, "ArrowDown"); assert.equal(document.activeElement, st);
  key(st, "ArrowRight"); assert.equal(sc.hidden, false); assert.equal(document.activeElement.textContent, "S1");
  key(document.activeElement, "Escape");
  assert.equal(sc.hidden, true, "submenu closed"); assert.equal(content.hidden, false, "parent menu stays open"); assert.equal(document.activeElement, st);
  key(st, "ArrowRight"); key(document.activeElement, "ArrowLeft"); assert.equal(sc.hidden, true); assert.equal(document.activeElement, st);
  key(st, "Escape"); assert.equal(content.hidden, true); assert.equal(document.activeElement, t);
});

test("menu: in a right-to-left menu ArrowLeft opens a submenu and ArrowRight closes it", () => {
  const r = mount(`<div data-ui="dropdown-menu"><button data-ui-part="trigger">m</button><div data-ui-part="content"><div data-ui-part="sub"><button data-ui-part="sub-trigger">More</button><div data-ui-part="sub-content" hidden><button data-ui-part="item">S1</button></div></div></div></div>`, { dir: "rtl" });
  const t = $(r, '[data-ui-part="trigger"]'), st = $(r, '[data-ui-part="sub-trigger"]'), sc = $(r, '[data-ui-part="sub-content"]');
  key(t, "ArrowDown"); key(st, "ArrowRight"); assert.equal(sc.hidden, true, "ArrowRight does not open in RTL");
  key(st, "ArrowLeft"); assert.equal(sc.hidden, false); key(document.activeElement, "ArrowRight"); assert.equal(sc.hidden, true); assert.equal(document.activeElement, st);
  key(st, "Escape");
});

test("menubar: arrows, Home and End move between items with one tab stop; menus open only on request", () => {
  const menu = (n) => `<div data-ui-part="menu"><button data-ui-part="trigger">${n}</button><div data-ui-part="content"><button data-ui-part="item">${n}1</button></div></div>`;
  const r = mount(`<div data-ui="menubar">${menu("File")}${menu("Edit")}${menu("View")}</div>`);
  const [f, e, v] = $$(r, '[data-ui-part="trigger"]'), contents = $$(r, '[data-ui-part="content"]');
  f.focus(); key(f, "ArrowRight");
  assert.equal(document.activeElement, e); assert.ok(contents.every((c) => c.hidden), "moving between closed items does not open a menu");
  assert.deepEqual([f, e, v].map((x) => x.tabIndex), [-1, 0, -1], "roving tabindex follows focus");
  key(e, "End"); assert.equal(document.activeElement, v); key(v, "Home"); assert.equal(document.activeElement, f);
  key(f, "ArrowLeft"); assert.equal(document.activeElement, v, "wraps");
  key(v, "ArrowDown"); assert.equal(contents[2].hidden, false); key(document.activeElement, "ArrowRight");
  assert.equal(contents[2].hidden, true); assert.equal(contents[0].hidden, false, "ArrowRight in an open menu opens the next menu");
  key(document.activeElement, "Escape"); assert.equal(document.activeElement, f); assert.ok(contents.every((c) => c.hidden));
  const bar = $(r, '[data-ui="menubar"]'); bar.__uiMenubar.destroy();
  key(f, "ArrowRight"); assert.equal(document.activeElement, f, "destroy removes the menubar's own listeners");
});

test("menubar: right-to-left swaps ArrowLeft and ArrowRight", () => {
  const menu = (n) => `<div data-ui-part="menu"><button data-ui-part="trigger">${n}</button><div data-ui-part="content"><button data-ui-part="item">${n}1</button></div></div>`;
  const r = mount(`<div data-ui="menubar">${menu("A")}${menu("B")}${menu("C")}</div>`, { dir: "rtl" });
  const [a, b, c] = $$(r, '[data-ui-part="trigger"]');
  a.focus(); key(a, "ArrowLeft"); assert.equal(document.activeElement, b); key(b, "ArrowRight"); assert.equal(document.activeElement, a);
  key(a, "ArrowRight"); assert.equal(document.activeElement, c, "wraps backwards");
});

test("context menu: Escape returns focus to the element that opened it", () => {
  const r = mount(`<div data-ui="context-menu"><div data-ui-part="area">Right-click</div><div data-ui-part="content"><button data-ui-part="item">Copy</button></div></div>`);
  const area = $(r, '[data-ui-part="area"]'), content = $(r, '[data-ui-part="content"]');
  area.focus(); key(area, "F10", { shiftKey: true }); assert.equal(content.hidden, false); assert.equal(document.activeElement.textContent, "Copy");
  key(document.activeElement, "Escape"); assert.equal(content.hidden, true); assert.equal(document.activeElement, area);
});

test("navigation menu: hover timers do not fire after destroy; arrows follow reading direction", async () => {
  const r = mount(`<nav data-ui="navigation-menu"><ul data-ui-part="list"><li data-ui-part="menu"><button data-ui-part="trigger">A</button><div data-ui-part="content"><a href="#a">a</a></div></li><li data-ui-part="menu"><button data-ui-part="trigger">B</button><div data-ui-part="content"><a href="#b">b</a></div></li></ul></nav>`, { dir: "rtl" });
  const nav = $(r, '[data-ui="navigation-menu"]'), [ta, tb] = $$(r, '[data-ui-part="trigger"]'), [ca] = $$(r, '[data-ui-part="content"]');
  ta.focus(); key(ta, "ArrowLeft"); assert.equal(document.activeElement, tb, "RTL: ArrowLeft moves to the next item");
  ptr($$(r, '[data-ui-part="menu"]')[0], "pointerenter"); nav.__uiNavigationMenu.destroy();
  await sleep(220); assert.equal(ca.hidden, true, "pending open timer cleared by destroy");
});

// ---------- popover, hover-card, date-picker, tooltip ----------
test("popover: dialog named by its title or trigger; focus moves inside on open and back on close", () => {
  const r = mount(`<div data-ui="popover"><button data-ui-part="trigger">Sizes</button><div data-ui-part="content"><label>W <input id="pw"></label><button data-ui-part="close">Done</button></div></div>
    <div data-ui="popover"><button data-ui-part="trigger" aria-label="Filters">⚙</button><div data-ui-part="content"><h3>Filter rows</h3><p>No controls</p></div></div>`);
  const [p1, p2] = $$(r, '[data-ui="popover"]'), t1 = $(p1, "button"), c1 = $(p1, '[data-ui-part="content"]'), c2 = $(p2, '[data-ui-part="content"]');
  assert.equal(c1.getAttribute("role"), "dialog"); assert.equal(nameOf(c1), "Sizes");
  assert.equal(nameOf(c2), "Filter rows", "a heading inside names the dialog");
  t1.focus(); t1.click(); assert.equal(document.activeElement.id, "pw", "first focusable control receives focus");
  key(document.activeElement, "Escape"); assert.equal(c1.hidden, true); assert.equal(document.activeElement, t1);
  const t2 = $(p2, "button"); t2.click(); assert.equal(document.activeElement, c2, "content itself is focused when it has no controls");
  assert.equal(c2.tabIndex, -1); key(c2, "Escape"); assert.equal(document.activeElement, t2);
});

test("hover-card and date-picker dialogs have accessible names", () => {
  const r = mount(`<div data-ui="hover-card"><a href="#u" data-ui-part="trigger">@colibri</a><div data-ui-part="content">Profile</div></div>
    <div data-ui="date-picker"><input data-ui-part="input" aria-label="Published"><button data-ui-part="trigger" aria-label="Choose date"></button><div data-ui-part="content"><div data-ui="calendar"></div></div></div>
    <div data-ui="date-picker"><input data-ui-part="input" aria-label="Due"><div data-ui-part="content"><div data-ui="calendar"></div></div></div>`);
  const hc = $(r, '[data-ui="hover-card"] [data-ui-part="content"]'); assert.equal(hc.getAttribute("role"), "dialog"); assert.equal(nameOf(hc), "@colibri");
  const [d1, d2] = $$(r, '[data-ui="date-picker"] > [data-ui-part="content"]');
  assert.equal(d1.getAttribute("role"), "dialog"); assert.equal(nameOf(d1), "Choose date"); assert.equal(nameOf(d2), "Due");
  assert.equal($(r, '[data-ui="date-picker"] [data-ui-part="trigger"]').getAttribute("aria-controls"), d1.id);
});

test("tooltip: hoverable, persistent while hovered or focused, Esc hides it without moving focus (WCAG 1.4.13)", async () => {
  const r = mount(`<div data-ui="tooltip" data-delay="0"><button data-ui-part="trigger">i</button><div data-ui-part="content">Tip</div></div>`);
  const t = $(r, "button"), c = $(r, '[data-ui-part="content"]');
  ptr(t, "pointerenter"); await sleep(5); assert.equal(c.hidden, false);
  ptr(t, "pointerleave"); ptr(c, "pointerenter"); await sleep(200); assert.equal(c.hidden, false, "pointer can move onto the tooltip");
  ptr(c, "pointerleave"); await sleep(200); assert.equal(c.hidden, true, "closes once hover leaves both");
  t.focus(); assert.equal(c.hidden, false); ptr(t, "pointerenter"); ptr(t, "pointerleave"); await sleep(200);
  assert.equal(c.hidden, false, "stays open while the trigger has focus");
  key(t, "Escape"); assert.equal(c.hidden, true); assert.equal(document.activeElement, t, "Esc does not move focus");
  ptr(t, "pointerenter"); await sleep(5); assert.equal(c.hidden, false); t.blur(); assert.equal(c.hidden, false, "blur keeps it while hovered");
  ptr(t, "pointerleave"); await sleep(200); assert.equal(c.hidden, true);
});

test("tooltip and hover-card: timers are cleared by destroy (no layer reopens later)", async () => {
  const r = mount(`<div data-ui="tooltip" data-delay="30"><button data-ui-part="trigger">i</button><div data-ui-part="content">Tip</div></div>
    <div data-ui="hover-card" data-delay="30"><a href="#x" data-ui-part="trigger">x</a><div data-ui-part="content">Card</div></div>`);
  const tip = $(r, '[data-ui="tooltip"]'), card = $(r, '[data-ui="hover-card"]');
  ptr($(tip, "button"), "pointerenter"); ptr($(card, "a"), "pointerenter");
  tip.__uiTooltip.destroy(); card.__uiHoverCard.destroy(); await sleep(80);
  assert.equal($(tip, '[data-ui-part="content"]').hidden, true); assert.equal($(card, '[data-ui-part="content"]').hidden, true);
  // A stuck layer would swallow Escape meant for an open popover.
  const p = mount(`<div data-ui="popover"><button data-ui-part="trigger">p</button><div data-ui-part="content"><button>in</button></div></div>`);
  $(p, '[data-ui-part="trigger"]').click(); key(document.activeElement, "Escape"); assert.equal($(p, '[data-ui-part="content"]').hidden, true);
});

// ---------- stepper, calendar, carousel ----------
test("stepper: data-clickable steps are keyboard-operable buttons; unreachable linear steps are aria-disabled", () => {
  const r = mount(`<div data-ui="stepper" data-clickable data-linear><ol data-ui-part="list"><li data-ui-part="step">One</li><li data-ui-part="step">Two</li><li data-ui-part="step">Three</li></ol>
    <div data-ui-part="panel">1</div><div data-ui-part="panel">2</div><div data-ui-part="panel">3</div><button data-ui-part="next">Next</button></div>`);
  const st = $(r, '[data-ui="stepper"]'), buttons = $$(r, '[data-ui-part="step"] > button[data-ui-part="step-trigger"]');
  assert.equal(buttons.length, 3); assert.equal(buttons[0].type, "button"); assert.equal(buttons[1].textContent, "Two");
  assert.equal(buttons[1].getAttribute("aria-disabled"), "true"); buttons[1].click(); assert.equal(st.__uiStepper.step, 0, "linear: cannot jump ahead");
  $(r, '[data-ui-part="next"]').click(); $(r, '[data-ui-part="next"]').click(); assert.equal(st.__uiStepper.step, 2);
  assert.equal(buttons[0].hasAttribute("aria-disabled"), false); buttons[0].click(); assert.equal(st.__uiStepper.step, 0, "completed steps are reachable");
  st.__uiStepper.destroy(); assert.equal($$(r, "button[data-ui-part=step-trigger]").length, 0); assert.equal($(r, '[data-ui-part="step"]').textContent, "One", "destroy unwraps");
});

test("calendar: APG date grid puts aria-selected on gridcells, aria-current on today, and mirrors arrows in RTL", () => {
  const today = new Date(), iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const r = mount(`<div data-ui="calendar" data-value="${iso(today)}" data-locale="en"></div><div data-ui="calendar" data-mode="multiple" data-value="2026-10-10" data-locale="en" data-min="2026-10-05"></div>`);
  const [single, multi] = $$(r, '[data-ui="calendar"]');
  assert.equal($$(r, '[data-ui-part="day"][aria-selected]').length, 0, "day buttons do not carry aria-selected");
  const day = $(single, `[data-date="${iso(today)}"]`);
  assert.equal(day.closest("td").getAttribute("aria-selected"), "true"); assert.equal(day.getAttribute("aria-current"), "date");
  assert.equal(day.closest("td").getAttribute("role"), "gridcell");
  assert.equal($(multi, "table").getAttribute("aria-multiselectable"), "true"); assert.equal($(single, "table").hasAttribute("aria-multiselectable"), false);
  assert.equal($(multi, '[data-date="2026-10-01"]').closest("td").getAttribute("aria-disabled"), "true");
  $(multi, '[data-date="2026-10-12"]').click(); assert.equal($(multi, '[data-date="2026-10-12"]').closest("td").getAttribute("aria-selected"), "true");
  const rtl = mount(`<div data-ui="calendar" data-value="2026-10-14" data-locale="en"></div>`, { dir: "rtl" });
  const d = $(rtl, '[data-date="2026-10-14"]'); d.focus(); key(d, "ArrowLeft"); assert.equal(document.activeElement.dataset.date, "2026-10-15", "RTL: ArrowLeft is the next day");
  key(document.activeElement, "ArrowRight"); assert.equal(document.activeElement.dataset.date, "2026-10-14");
});

test("carousel: autoplay has a labelled pause button, pauses on hover and focus, and never starts under reduced motion", async (t) => {
  const markup = `<div data-ui="carousel" data-loop data-autoplay="40" aria-label="Featured"><div data-ui-part="viewport"><div data-ui-part="slide">1</div><div data-ui-part="slide">2</div><div data-ui-part="slide">3</div></div><button data-ui-part="prev">‹</button><button data-ui-part="next">›</button></div>`;
  const r = mount(markup), c = $(r, '[data-ui="carousel"]'), play = $(c, '[data-ui-part="play"]');
  const api = c.__uiCarousel; t.after(() => api.destroy()); // a failed assertion must not leave the autoplay interval running
  assert.ok(play, "pause/play button generated"); assert.equal(c.firstElementChild, play, "first in tab order");
  assert.equal(play.getAttribute("aria-label"), "Stop slide rotation"); assert.equal(c.__uiCarousel.playing, true);
  assert.equal($(c, '[data-ui-part="viewport"]').getAttribute("aria-live"), "off");
  ptr(c, "pointerenter"); const at = c.__uiCarousel.index; await sleep(120); assert.equal(c.__uiCarousel.index, at, "paused while hovered");
  // count slide changes: with three looping slides, three ticks bring the index back to where it was
  let moved = 0; c.addEventListener("ui:change", () => moved++);
  ptr(c, "pointerleave"); await sleep(120); assert.ok(moved > 0, "resumes after hover");
  $(c, '[data-ui-part="next"]').focus(); assert.equal(c.__uiCarousel.playing, false, "paused while focus is inside");
  $(c, '[data-ui-part="next"]').blur();
  play.click(); assert.equal(c.__uiCarousel.playing, false); assert.equal(play.getAttribute("aria-label"), "Start slide rotation");
  assert.equal($(c, '[data-ui-part="viewport"]').getAttribute("aria-live"), "polite");
  play.click(); assert.equal(c.__uiCarousel.playing, true);
  c.__uiCarousel.destroy(); assert.equal($(c, '[data-ui-part="play"]'), null);
  reduceMotion = true;
  try { const r2 = mount(markup), c2 = $(r2, '[data-ui="carousel"]'); assert.equal(c2.__uiCarousel.playing, false, "reduced motion: no autoplay");
    assert.equal($(c2, '[data-ui-part="play"]').getAttribute("aria-label"), "Start slide rotation"); c2.__uiCarousel.destroy(); } finally { reduceMotion = false; }
});

test("carousel: arrow keys follow reading direction", () => {
  const r = mount(`<div data-ui="carousel" aria-label="F"><div data-ui-part="viewport"><div data-ui-part="slide">1</div><div data-ui-part="slide">2</div></div></div>`, { dir: "rtl" });
  const c = $(r, '[data-ui="carousel"]'); key(c, "ArrowLeft"); assert.equal(c.__uiCarousel.index, 1); key(c, "ArrowRight"); assert.equal(c.__uiCarousel.index, 0);
});

// ---------- timers after destroy (reasoning, message copy, button group) ----------
test("reasoning: auto-close timer is cleared by destroy", async () => {
  const r = mount(`<div data-ui="reasoning" data-status="streaming"><button data-ui-part="trigger"><span data-ui-part="label">Thinking</span></button><div data-ui-part="content">…</div></div>`);
  const el = $(r, '[data-ui="reasoning"]'), content = $(el, '[data-ui-part="content"]');
  assert.equal(content.hidden, false); el.dataset.status = "done"; await sleep(10);
  el.__uiAgent.destroy(); await sleep(700); assert.equal(content.hidden, false, "no close after destroy");
});

test("message copy feedback timer and button-group flash timer are cleared by destroy", async () => {
  const r = mount(`<div data-ui="message"><div data-ui-part="content">Hi</div><button data-ui-part="action" data-action="copy">Copy</button></div>
    <div data-ui="button-group" data-flash="30"><button data-value="a">A</button></div>`);
  const m = $(r, '[data-ui="message"]'), a = $(m, "button"); a.click(); await sleep(5); assert.ok(a.hasAttribute("data-copied"));
  const cleared = []; const orig = globalThis.clearTimeout; globalThis.clearTimeout = (id) => { cleared.push(id); return orig(id); };
  try { m.__uiMessage.destroy(); } finally { globalThis.clearTimeout = orig; }
  assert.ok(cleared.length >= 1, "pending copy timer cleared");
  const g = $(r, '[data-ui="button-group"]'), gb = $(g, "button"); gb.click(); assert.equal(gb.dataset.state, "activated");
  g.__uiButtonGroup.destroy(); await sleep(60); assert.equal(gb.dataset.state, "activated", "flash timer cleared, state left as is");
});

test("tabs and button group: arrow keys follow dir=rtl on an ancestor", () => {
  const r = mount(`<div data-ui="tabs"><div data-ui-part="list"><button data-ui-part="trigger" data-value="a">A</button><button data-ui-part="trigger" data-value="b">B</button></div><div data-ui-part="panel" data-value="a">a</div><div data-ui-part="panel" data-value="b">b</div></div>
    <div data-ui="button-group" data-type="single"><button data-value="x">X</button><button data-value="y">Y</button></div>`, { dir: "rtl" });
  const [a, b] = $$(r, '[data-ui="tabs"] [data-ui-part="trigger"]'); a.focus(); key(a, "ArrowLeft"); assert.equal(document.activeElement, b);
  const [x, y] = $$(r, '[data-ui="button-group"] button'); x.focus(); key(x, "ArrowLeft"); assert.equal(document.activeElement, y);
});

// Tests for components added/fixed in the v2 quality pass (jsdom).
import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
const dom = new JSDOM(`<body></body>`, { url: "http://localhost/", pretendToBeVisual: true });
const w = dom.window;
Object.assign(globalThis, { window: w, document: w.document, CustomEvent: w.CustomEvent, Event: w.Event, MutationObserver: w.MutationObserver,
  HTMLElement: w.HTMLElement, getComputedStyle: w.getComputedStyle, requestAnimationFrame: (f) => setTimeout(f, 0), localStorage: w.localStorage, __COLIBRI_UI_NO_AUTO__: true });
const { init } = await import("../src/core/auto.js");
const mount = (html) => { const d = document.createElement("div"); d.innerHTML = html; document.body.append(d); init(d); return d; };
const key = (el, k) => el.dispatchEvent(new w.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const $ = (r, s) => r.querySelector(s), $$ = (r, s) => [...r.querySelectorAll(s)];

const ITEMS = `<div data-ui="item-group" aria-label="S">
 <div data-ui-part="item" data-value="a"><div data-ui-part="content"><div data-ui-part="title">A</div><div data-ui-part="description">a</div></div><div data-ui-part="actions"><button data-ui="switch" aria-label="x"></button></div></div>
 <div data-ui-part="item" data-value="b"><div data-ui-part="content"><a data-ui-part="title-link" href="#b"><span data-ui-part="title">B</span></a></div></div>
 <div data-ui-part="item" data-value="c" data-disabled><div data-ui-part="content"><div data-ui-part="title">C</div></div></div></div>`;

test("item-group: roles, labelling, single tab stop", () => {
  const r = mount(ITEMS); const g = $(r, "[data-ui=item-group]"), rows = $$(r, "[data-ui-part=item]");
  assert.equal(g.getAttribute("role"), "list"); assert.ok(rows.every((x) => x.getAttribute("role") === "listitem"));
  assert.equal(rows[0].getAttribute("aria-labelledby"), $(rows[0], "[data-ui-part=title]").id);
  assert.ok($(rows[0], "[data-ui-part=description]").id && rows[0].getAttribute("aria-describedby"));
  assert.deepEqual(rows.map((x) => x.tabIndex), [0, -1, -1]); assert.equal(rows[2].getAttribute("aria-disabled"), "true");
  assert.ok(rows[1].hasAttribute("data-interactive")); assert.ok(!rows[0].hasAttribute("data-interactive"));
});
test("item-group: arrows skip disabled; Enter activates; → into actions; Esc back", () => {
  const r = mount(ITEMS); const rows = $$(r, "[data-ui-part=item]");
  rows[0].focus(); key(rows[0], "ArrowDown"); assert.equal(document.activeElement, rows[1]); assert.equal(rows[1].tabIndex, 0);
  key(rows[1], "ArrowDown"); assert.equal(document.activeElement, rows[1], "disabled row skipped, no loop");
  let act = null; r.addEventListener("ui:activate", (e) => { act = e.detail.value; e.preventDefault(); });
  key(rows[1], "Enter"); assert.equal(act, "b");
  key(rows[1], "Home"); assert.equal(document.activeElement, rows[0]);
  key(rows[0], "ArrowRight"); assert.equal(document.activeElement, $(rows[0], "[data-ui=switch]"));
  key(document.activeElement, "Escape"); assert.equal(document.activeElement, rows[0]);
});
test("item-group: clicking a control inside a row does not activate the row", () => {
  const r = mount(ITEMS); let n = 0; r.addEventListener("ui:activate", (e) => { n++; e.preventDefault(); });
  $(r, "[data-ui=switch]").click(); assert.equal(n, 0); assert.equal($(r, "[data-ui=switch]").getAttribute("aria-checked"), "true");
  $$(r, "[data-ui-part=item]")[1].click(); assert.equal(n, 1);
});
test("badge: remove button labelled, cancellable, removes + moves focus", () => {
  const r = mount(`<span data-ui="badge">One <button data-ui-part="remove">×</button></span><span data-ui="badge">Two <button data-ui-part="remove">×</button></span>`);
  const [b1, b2] = $$(r, "[data-ui=badge]"); assert.equal($(b1, "button").getAttribute("aria-label"), "Remove One");
  const veto = (e) => e.preventDefault(); r.addEventListener("ui:remove", veto); $(b1, "button").click(); assert.ok(b1.isConnected, "vetoed");
  r.removeEventListener("ui:remove", veto); $(b1, "button").click(); assert.ok(!b1.isConnected); assert.equal(document.activeElement, $(b2, "button"));
});
test("datatable: tolerates a table without thead/tbody", () => {
  assert.doesNotThrow(() => mount(`<div data-ui="datatable"><table></table></div>`));
});
test("datatable: sort + search + select-all", () => {
  const r = mount(`<div data-ui="datatable"><input data-ui-part="search"><table><thead><tr><th data-ui-part="select-all"><input type="checkbox"></th><th data-sort="n" data-type="number">N</th></tr></thead>
   <tbody><tr><td><input type="checkbox" data-ui-part="row-select"></td><td>10</td></tr><tr><td><input type="checkbox" data-ui-part="row-select"></td><td>2</td></tr></tbody></table></div>`);
  const th = $$(r, "th")[1]; th.click(); assert.equal(th.getAttribute("aria-sort"), "ascending"); assert.equal($(r, "tbody tr td:last-child").textContent, "2");
  const s = $(r, "[data-ui-part=search]"); s.value = "10"; s.dispatchEvent(new w.Event("input", { bubbles: true }));
  assert.deepEqual($$(r, "tbody tr").filter((x) => !x.hidden).map((x) => x.cells[1].textContent), ["10"]);
});
test("scrollspy: exposes refresh and does not throw without layout", () => {
  const r = mount(`<nav data-ui="scrollspy"><a data-ui-part="link" href="#s1">1</a></nav><section id="s1"></section>`);
  const api = $(r, "[data-ui=scrollspy]").__uiScrollspy; assert.equal(typeof api.refresh, "function"); assert.doesNotThrow(() => api.refresh());
});

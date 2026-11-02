// Colibri UI behaviour tests (jsdom). Run: npm i -D jsdom && npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM(`<body></body>`, { url: "http://localhost/", pretendToBeVisual: true });
const w = dom.window;
Object.assign(globalThis, { window: w, document: w.document, CustomEvent: w.CustomEvent, Event: w.Event, MutationObserver: w.MutationObserver,
  HTMLElement: w.HTMLElement, getComputedStyle: w.getComputedStyle, requestAnimationFrame: (f) => setTimeout(f, 0), localStorage: w.localStorage, __COLIBRI_UI_NO_AUTO__: true });
const { init } = await import("../src/core/auto.js");
const { toast } = await import("../src/core/base.js");
const mount = (html) => { const d = document.createElement("div"); d.innerHTML = html; document.body.append(d); init(d); return d; };
const key = (el, k, o = {}) => el.dispatchEvent(new w.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...o }));
const $ = (r, s) => r.querySelector(s), $$ = (r, s) => [...r.querySelectorAll(s)];

test("accordion single collapsible + keyboard", () => {
  const r = mount(`<div data-ui="accordion" data-type="single"><div data-ui-part="item" data-value="a"><button data-ui-part="trigger">A</button><div data-ui-part="content">a</div></div><div data-ui-part="item" data-value="b"><button data-ui-part="trigger">B</button><div data-ui-part="content">b</div></div></div>`);
  const [ta, tb] = $$(r, "button"), [ca, cb] = $$(r, '[data-ui-part="content"]');
  assert.equal(ca.hidden, true); ta.click(); assert.equal(ca.hidden, false); assert.equal(ta.getAttribute("aria-expanded"), "true");
  tb.click(); assert.equal(ca.hidden, true); assert.equal(cb.hidden, false); tb.click(); assert.equal(cb.hidden, true);
  ta.focus(); key(ta, "ArrowDown"); assert.equal(document.activeElement, tb);
});
test("collapsible", () => { const r = mount(`<div data-ui="collapsible"><button data-ui-part="trigger">t</button><div data-ui-part="content">c</div></div>`); $(r, "button").click(); assert.equal($(r, "[data-ui-part=content]").hidden, false); });
test("toggle + toggle-group multiple", () => {
  const r = mount(`<button data-ui="toggle">B</button><div data-ui="toggle-group" data-type="multiple"><button data-ui-part="item" data-value="b">B</button><button data-ui-part="item" data-value="i">I</button></div>`);
  const t = $(r, '[data-ui="toggle"]'); t.click(); assert.equal(t.getAttribute("aria-pressed"), "true");
  const [b, i] = $$(r, '[data-ui-part="item"]'); b.click(); i.click(); assert.equal($(r, '[data-ui="toggle-group"]').__uiToggleGroup.value.join(), "b,i");
});
test("checkbox select-all tri-state + switch + radio-group", () => {
  const r = mount(`<input type="checkbox" data-ui="checkbox" data-controls=".kid"><input type="checkbox" class="kid"><input type="checkbox" class="kid">
    <button data-ui="switch">s</button><div data-ui="radio-group" data-default-value="a"><button data-ui-part="item" data-value="a">a</button><button data-ui-part="item" data-value="b">b</button></div>`);
  const all = $(r, '[data-ui="checkbox"]'), [k1] = $$(r, ".kid");
  k1.checked = true; k1.dispatchEvent(new Event("change", { bubbles: true })); assert.equal(all.indeterminate, true); assert.equal(all.getAttribute("aria-checked"), "mixed");
  all.checked = true; all.dispatchEvent(new Event("change", { bubbles: true })); assert.ok($$(r, ".kid").every((k) => k.checked));
  const s = $(r, '[data-ui="switch"]'); s.click(); assert.equal(s.getAttribute("role"), "switch"); assert.equal(s.getAttribute("aria-checked"), "true");
  const [a] = $$(r, '[data-ui="radio-group"] button'); a.focus(); key(a, "ArrowDown"); assert.equal($(r, '[data-ui="radio-group"]').dataset.value, "b");
});
test("popover open, Esc closes", () => {
  const r = mount(`<div data-ui="popover"><button data-ui-part="trigger">p</button><div data-ui-part="content">c</div></div>`);
  const t = $(r, "button"), c = $(r, "[data-ui-part=content]"); t.click(); assert.equal(c.hidden, false); assert.equal(t.getAttribute("aria-expanded"), "true");
  key(document, "Escape"); assert.equal(c.hidden, true);
});
test("dropdown-menu keyboard, checkbox item, select event", () => {
  const r = mount(`<div data-ui="dropdown-menu"><button data-ui-part="trigger">m</button><div data-ui-part="content"><button data-ui-part="item">Edit</button><button data-ui-part="item" disabled>X</button><button data-ui-part="item" data-type="checkbox">Grid</button><button data-ui-part="item">Delete</button></div></div>`);
  const t = $(r, '[data-ui-part="trigger"]'), items = $$(r, '[data-ui-part="item"]'); let sel;
  r.addEventListener("ui:select", (e) => (sel = e.detail.value));
  key(t, "ArrowDown"); assert.equal(document.activeElement, items[0]); assert.equal($(r, '[data-ui-part="content"]').getAttribute("role"), "menu");
  key(items[0], "ArrowDown"); assert.equal(document.activeElement, items[2], "skips disabled");
  key(items[2], "Enter"); assert.equal(items[2].getAttribute("aria-checked"), "true"); assert.equal($(r, '[data-ui-part="content"]').hidden, false, "checkbox keeps open");
  key(items[2], "d"); assert.equal(document.activeElement, items[3], "typeahead");
  key(items[3], "Enter"); assert.equal(sel, "Delete"); assert.equal($(r, '[data-ui-part="content"]').hidden, true); assert.equal(document.activeElement, t);
});
test("select: keyboard, hidden input, value text", () => {
  const r = mount(`<form><div data-ui="select" data-name="lang" data-placeholder="Pick"><button data-ui-part="trigger"><span data-ui-part="value"></span></button><div data-ui-part="content"><div data-ui-part="option" data-value="ka">ქართული</div><div data-ui-part="option" data-value="en">English</div></div></div></form>`);
  const t = $(r, "button"), root = $(r, '[data-ui="select"]');
  assert.equal($(r, '[data-ui-part="value"]').textContent, "Pick");
  key(t, "ArrowDown"); key(t, "ArrowDown"); key(t, "Enter");
  assert.equal(root.__uiSelect.value, "en"); assert.equal(new w.FormData($(r, "form")).get("lang"), "en"); assert.equal($(r, '[data-ui-part="value"]').textContent, "English");
});
test("combobox filters + commits", () => {
  const r = mount(`<div data-ui="combobox" data-name="city"><input data-ui-part="input"><div data-ui-part="content"><div data-ui-part="option">Tbilisi</div><div data-ui-part="option">Batumi</div><div data-ui-part="empty">none</div></div></div>`);
  const i = $(r, "input"); i.value = "bat"; i.dispatchEvent(new Event("input", { bubbles: true }));
  const [tb, bt] = $$(r, '[data-ui-part="option"]'); assert.equal(tb.hidden, true); assert.equal(bt.hidden, false); assert.equal($(r, '[data-ui-part="empty"]').hidden, true);
  key(i, "Enter"); assert.equal($(r, '[data-ui="combobox"]').__uiCombobox.value, "Batumi"); assert.equal(i.value, "Batumi");
});
test("command filters by keywords", () => {
  const r = mount(`<div data-ui="command"><input data-ui-part="input"><div data-ui-part="list"><div data-ui-part="group"><div data-ui-part="option" data-keywords="settings prefs">Preferences</div></div><div data-ui-part="option">Logout</div><div data-ui-part="empty">no</div></div></div>`);
  const i = $(r, "input"); let got; r.addEventListener("ui:select", (e) => (got = e.detail.value));
  i.value = "prefs"; i.dispatchEvent(new Event("input", { bubbles: true })); key(i, "Enter"); assert.equal(got, "Preferences");
  i.value = "zzz"; i.dispatchEvent(new Event("input", { bubbles: true })); assert.equal($(r, '[data-ui-part="empty"]').hidden, false); assert.equal($(r, '[data-ui-part="group"]').hidden, true);
});
test("slider range keyboard + clamps", () => {
  const r = mount(`<div data-ui="slider" data-min="0" data-max="10" data-value="2,8" data-name="p"><div data-ui-part="track"></div><span data-ui-part="thumb"></span><span data-ui-part="thumb"></span></div>`);
  const [a, b] = $$(r, '[data-ui-part="thumb"]'); key(a, "ArrowRight"); key(b, "Home");
  assert.deepEqual($(r, '[data-ui="slider"]').__uiSlider.value, [3, 3]); assert.equal(a.getAttribute("aria-valuenow"), "3");
});
test("pin-input paste + complete", () => {
  const r = mount(`<div data-ui="pin-input" data-length="4" data-name="otp"></div>`); let done;
  r.addEventListener("ui:complete", (e) => (done = e.detail.value));
  const c = $(r, '[data-ui-part="cell"]'); const ev = new Event("paste", { bubbles: true, cancelable: true }); ev.clipboardData = { getData: () => "12a34" }; c.dispatchEvent(ev);
  assert.equal(done, "1234");
});
test("toggle-password", () => { const r = mount(`<div data-ui="toggle-password"><input type="password" data-ui-part="input"><button data-ui-part="toggle">s</button></div>`); $(r, "button").click(); assert.equal($(r, "input").type, "text"); });
test("field error wiring", () => {
  const r = mount(`<div data-ui="field"><label data-ui-part="label">N</label><input data-ui-part="control"><p data-ui-part="description">d</p><p data-ui-part="error"></p></div>`);
  const api = $(r, '[data-ui="field"]').__uiField, i = $(r, "input"); assert.equal($(r, "label").htmlFor, i.id);
  api.setError("Required"); assert.equal(i.getAttribute("aria-invalid"), "true"); assert.ok(i.getAttribute("aria-describedby").split(" ").length === 2);
});
test("repeater renumbers names for Spring binding", () => {
  const r = mount(`<div data-ui="repeater" data-min="1"><template data-ui-part="template"><div data-ui-part="row"><input name="items[__i__].name"><button data-ui-part="remove">-</button></div></template><div data-ui-part="list"></div><button data-ui-part="add">+</button></div>`);
  $(r, '[data-ui-part="add"]').click(); assert.deepEqual($$(r, "input").map((i) => i.name), ["items[0].name", "items[1].name"]);
  $(r, '[data-ui-part="remove"]').click(); assert.deepEqual($$(r, "input").map((i) => i.name), ["items[0].name"]);
});
test("rating", () => { const r = mount(`<div data-ui="rating" data-name="s" data-max="5" data-value="2"></div>`); const i = $$(r, "input")[3]; i.checked = true; i.dispatchEvent(new Event("change", { bubbles: true })); assert.equal($(r, '[data-ui="rating"]').dataset.value, "4"); });
test("pagination ellipsis + change", () => {
  const r = mount(`<nav data-ui="pagination" data-total="20" data-page="10"></nav>`); const n = $(r, "nav");
  assert.deepEqual($$(n, '[data-ui-part="item"]').map((x) => x.textContent), ["1", "9", "10", "11", "20"]);
  $(n, '[data-ui-part="next"]').click(); assert.equal(n.__uiPagination.page, 11);
});
test("stepper linear validation", () => {
  const r = mount(`<div data-ui="stepper" data-linear><ol><li data-ui-part="step">1</li><li data-ui-part="step">2</li></ol><section data-ui-part="panel"><input required></section><section data-ui-part="panel">two</section><button data-ui-part="prev">b</button><button data-ui-part="next">n</button><button data-ui-part="finish">f</button></div>`);
  const s = $(r, '[data-ui="stepper"]'); $(r, '[data-ui-part="next"]').click(); assert.equal(s.__uiStepper.step, 0, "blocked by required");
  $(r, "input").value = "x"; $(r, '[data-ui-part="next"]').click(); assert.equal(s.__uiStepper.step, 1); assert.equal($$(r, "[data-ui-part=step]")[0].dataset.state, "completed");
});
test("datatable sort, search, select-all", () => {
  const r = mount(`<div data-ui="datatable" data-page-size="2"><input data-ui-part="search"><table><thead><tr><th data-ui-part="select-all"><input type="checkbox"></th><th data-sort="n">N</th><th data-sort="v" data-type="number">V</th></tr></thead><tbody>
    <tr data-ui-part="row" data-id="1"><td><input type="checkbox" data-ui-part="row-select"></td><td>ბ</td><td>10</td></tr>
    <tr data-ui-part="row" data-id="2"><td><input type="checkbox" data-ui-part="row-select"></td><td>ა</td><td>9</td></tr>
    <tr data-ui-part="row" data-id="3"><td><input type="checkbox" data-ui-part="row-select"></td><td>გ</td><td>100</td></tr></tbody></table><div data-ui-part="info"></div></div>`);
  const ids = () => $$(r, "tbody tr").filter((t) => !t.hidden).map((t) => t.dataset.id);
  assert.deepEqual(ids(), ["1", "2"], "page size 2");
  $$(r, "th")[2].click(); assert.deepEqual(ids(), ["2", "1"]); assert.equal($$(r, "th")[2].getAttribute("aria-sort"), "ascending");
  $$(r, "th")[2].click(); assert.deepEqual(ids(), ["3", "1"], "desc numeric");
  const q = $(r, '[data-ui-part="search"]'); q.value = "ა"; q.dispatchEvent(new Event("input", { bubbles: true })); assert.deepEqual(ids(), ["2"]);
  const all = $(r, "thead input"); all.checked = true; all.dispatchEvent(new Event("change", { bubbles: true })); assert.deepEqual($(r, '[data-ui="datatable"]').__uiDataTable.selected, ["2"]);
});
test("calendar range + keyboard", () => {
  const r = mount(`<div data-ui="calendar" data-mode="range" data-value="2026-10-10" data-locale="ka"></div>`); const c = $(r, '[data-ui="calendar"]');
  c.querySelector('[data-date="2026-10-14"]').click(); assert.deepEqual(c.__uiCalendar.value, ["2026-10-10", "2026-10-14"]);
  assert.ok(c.querySelector('[data-date="2026-10-12"]').hasAttribute("data-range-middle"));
  const d = c.querySelector('[data-date="2026-10-14"]'); d.focus(); key(d, "ArrowDown"); assert.equal(document.activeElement.dataset.date, "2026-10-21");
  assert.match(c.querySelector('[data-ui-part="title"]').textContent, /ოქტომბერი|October/);
});
test("date-picker writes input", () => {
  const r = mount(`<div data-ui="date-picker" data-name="d"><input data-ui-part="input" value="2026-10-01"><button data-ui-part="trigger">📅</button><div data-ui-part="content"><div data-ui="calendar"></div></div></div>`);
  $(r, '[data-ui-part="trigger"]').click(); r.querySelector('[data-date="2026-10-05"]').click(); assert.equal($(r, "input").value, "2026-10-05"); assert.equal($(r, '[data-ui-part="content"]').hidden, true);
});
test("dismiss + progress + separator + toast", async () => {
  const r = mount(`<div data-ui="dismiss" role="alert">x<button data-ui-part="close">x</button></div><div data-ui="progress" data-value="40"></div><div data-ui="progress"></div><hr data-ui="separator">`);
  $(r, '[data-ui="dismiss"] button').click(); assert.equal($(r, '[data-ui="dismiss"]'), null);
  const [p1, p2] = $$(r, '[data-ui="progress"]'); assert.equal(p1.getAttribute("aria-valuenow"), "40"); assert.equal(p2.dataset.state, "indeterminate");
  const id = toast({ title: "შენახულია", variant: "success" }); assert.ok(document.querySelector(`[data-ui-part="toast"][data-id="${id}"]`)); toast.dismiss(id);
  assert.equal(document.querySelector(`[data-id="${id}"]`), null);
});
test("alert-dialog is non-dismissible + role", () => {
  const r = mount(`<div data-ui="alert-dialog"><button data-ui-part="trigger">o</button><dialog data-ui-part="content"><h2 data-ui-part="title">t</h2><button data-ui-part="close">c</button></dialog></div>`);
  const c = $(r, "dialog"); $(r, '[data-ui-part="trigger"]').click(); assert.equal(c.getAttribute("role"), "alertdialog");
  c.dispatchEvent(new Event("cancel", { cancelable: true })); assert.equal(c.open || c.hasAttribute("open"), true);
});
test("tabs inside dialog: tab triggers don't open/close dialog", () => {
  const r = mount(`<div data-ui="dialog"><button data-ui-part="trigger">o</button><dialog data-ui-part="content"><div data-ui="tabs"><div data-ui-part="list"><button data-ui-part="trigger" data-value="a">a</button><button data-ui-part="trigger" data-value="b">b</button></div><div data-ui-part="panel" data-value="a"></div><div data-ui-part="panel" data-value="b"></div></div></dialog></div>`);
  const d = $(r, '[data-ui="dialog"]'); $(r, ':scope [data-ui="dialog"] > [data-ui-part="trigger"]').click(); assert.equal(d.__uiDialog.open, true);
  $$(r, '[data-ui="tabs"] [data-ui-part="trigger"]')[1].click(); assert.equal(d.__uiDialog.open, true); assert.equal($(r, '[data-ui="tabs"]').__uiTabs.value, "b");
});

test("combobox chips keep custom values and option labels as text, never HTML", () => {
  const r = mount(`<div data-ui="combobox" data-multiple data-allow-custom>
    <div data-ui-part="chips"></div><input data-ui-part="input">
    <div data-ui-part="content"><div data-ui-part="option" data-value="safe">&lt;img src=x onerror=alert(1)&gt; &quot;label&quot;</div></div>
  </div>`);
  const api = r.__uiCombobox || r.querySelector('[data-ui="combobox"]').__uiCombobox;
  const attack = '<img src=x onerror=alert(1)> "custom" & value';
  api.value = [attack, "safe"];
  const chips = r.querySelector('[data-ui-part="chips"]');
  assert.equal(chips.querySelector("img"), null);
  assert.equal(chips.children[0].dataset.value, attack);
  assert.equal(chips.children[0].firstChild.textContent, attack);
  assert.equal(chips.children[1].querySelector("button").getAttribute("aria-label"), 'Remove <img src=x onerror=alert(1)> "label"');
  chips.children[0].querySelector("button").click();
  assert.deepEqual(api.value, ["safe"]);
});

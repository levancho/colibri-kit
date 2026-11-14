// Regressions for the "Component bugs" list in TODO.md (datatable/pager, toast, theme switch, toolbar, file input,
// missing parts, localised numbers, custom elements). Each test failed before its fix.
import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html lang=\"en\"><body></body></html>", { url: "https://example.test/", pretendToBeVisual: true });
const { window } = dom;
Object.assign(globalThis, { window, document: window.document, CustomEvent: window.CustomEvent, Event: window.Event, MutationObserver: window.MutationObserver,
  HTMLElement: window.HTMLElement, customElements: window.customElements, getComputedStyle: window.getComputedStyle, localStorage: window.localStorage,
  requestAnimationFrame: window.requestAnimationFrame, location: window.location, __COLIBRI_UI_NO_AUTO__: true });
const { registry } = await import("../src/core/registry.js");
const { toast } = await import("../src/core/base.js");
const { accepts } = await import("../src/core/forms.js");
const { parseNumber } = await import("../src/core/util.js");
const { createChartPanel } = await import("../src/core/charts.js");

const mount = (html) => { const host = document.createElement("div"); host.innerHTML = html; document.body.append(host); return host; };
const key = (el, k, init = {}) => { const e = new window.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }); el.dispatchEvent(e); return e; };

test("datatable and pager stay in step after paging, search and sort", () => {
  const rows = Array.from({ length: 25 }, (_, i) => `<tr><td>row ${String(i + 1).padStart(2, "0")}</td><td>${(i * 7) % 25}</td></tr>`).join("");
  const host = mount(`<div data-ui="datatable" data-page-size="5"><input data-ui-part="search"><table><thead><tr><th data-sort="name">Name</th><th data-sort="n" data-type="number">N</th></tr></thead>
    <tbody>${rows}</tbody></table><nav data-ui="pagination" data-total="1"></nav></div>`);
  const pager = host.querySelector("[data-ui=pagination]"), root = host.firstElementChild;
  registry.pagination(pager); registry.datatable(root);
  const visible = () => [...root.querySelectorAll("tbody tr")].filter((r) => !r.hidden).map((r) => r.cells[0].textContent);
  const current = () => Number(pager.querySelector("[aria-current=page]")?.dataset.page);
  pager.querySelector('[data-page="5"]').click();
  assert.deepEqual(visible(), ["row 21", "row 22", "row 23", "row 24", "row 25"]); assert.equal(current(), 5);
  // search resets the table to page 1: the pager must show page 1 too (it stayed on 5 / clamped to 2)
  const search = root.querySelector("[data-ui-part=search]"); search.value = "row 1"; search.dispatchEvent(new window.Event("input", { bubbles: true }));
  assert.equal(visible()[0], "row 10"); assert.equal(current(), 1, "pager kept its own page after search");
  assert.equal(pager.querySelectorAll("[data-ui-part=item]").length, 2);
  pager.querySelector("[data-ui-part=next]").click();
  assert.equal(current(), 2); assert.deepEqual(visible(), ["row 15", "row 16", "row 17", "row 18", "row 19"]);
  search.value = ""; search.dispatchEvent(new window.Event("input", { bubbles: true }));
  pager.querySelector("[data-ui-part=next]").click(); pager.querySelector("[data-ui-part=next]").click(); assert.equal(current(), 3);
  root.querySelector("th[data-sort=n]").click(); // sort resets to page 1 as well
  assert.equal(current(), 1, "pager kept its own page after sort");
  assert.deepEqual(visible().length, 5);
  pager.querySelector("[data-ui-part=next]").click(); assert.equal(current(), 2);
  assert.equal(root.querySelector("tbody tr:not([hidden])").cells[1].textContent.trim() >= "0", true);
  // focus stays in the search field while it resets the pager
  search.focus(); search.value = "row 2"; search.dispatchEvent(new window.Event("input", { bubbles: true }));
  assert.equal(document.activeElement, search); assert.equal(current(), 1);
});

test("datatable sorts localised numbers (1,200 and 1.200,5)", () => {
  const host = mount(`<div data-ui="datatable"><table><thead><tr><th data-sort="v" data-type="number">V</th></tr></thead>
    <tbody><tr><td>1,200</td></tr><tr><td>950</td></tr><tr><td>12,000</td></tr></tbody></table></div>
    <div data-ui="datatable" lang="de"><table><thead><tr><th data-sort="v" data-type="number">V</th></tr></thead>
    <tbody><tr><td>1.200,5</td></tr><tr><td>950</td></tr><tr><td>2,5</td></tr></tbody></table></div>`);
  const [en, de] = host.querySelectorAll("[data-ui=datatable]");
  for (const t of [en, de]) { registry.datatable(t); t.querySelector("th").click(); }
  assert.deepEqual([...en.querySelectorAll("td")].map((c) => c.textContent), ["950", "1,200", "12,000"]);
  assert.deepEqual([...de.querySelectorAll("td")].map((c) => c.textContent), ["2,5", "950", "1.200,5"]);
});

test("parseNumber reads numbers written for people; chart panels use it", () => {
  assert.equal(parseNumber("1,200"), 1200); assert.equal(parseNumber("1,200", "de"), 1.2); assert.equal(parseNumber("1.200,50"), 1200.5);
  assert.equal(parseNumber("1 200,5", "fr"), 1200.5); assert.equal(parseNumber("$1,234,567.80"), 1234567.8); assert.equal(parseNumber("(300)"), -300);
  assert.equal(parseNumber("1,5"), 1.5); assert.ok(Number.isNaN(parseNumber("n/a")));
  const host = mount(`<section><div data-chart="area" aria-label="c"></div><table><thead><tr><th>Day</th><th>Visitors</th></tr></thead>
    <tbody><tr><th>1</th><td>1,200</td></tr><tr><th>2</th><td>950</td></tr></tbody></table></section>`);
  createChartPanel(host.firstElementChild);
  assert.deepEqual(JSON.parse(host.querySelector("[data-chart]").dataset.values), [[1200, 950]], "parseFloat-style parsing read 1,200 as 1");
  assert.equal(host.querySelector("[data-chart]").dataset.chartError, undefined);
});

test("toast: never renders into a removed toaster", () => {
  const host = mount(`<ol data-ui="toaster" id="first"></ol>`); registry.toaster(host.querySelector("#first"));
  toast("one"); assert.equal(host.querySelectorAll("[data-ui-part=toast]").length, 1);
  host.remove();
  toast("two");
  const live = [...document.querySelectorAll("[data-ui=toaster]")].filter((t) => t.isConnected);
  assert.equal(live.length, 1, "no connected toaster"); assert.match(live[0].textContent, /two/);
});

test("toast: action click uses the options from the latest update", () => {
  const host = mount(`<ol data-ui="toaster"></ol>`), t = registry.toaster(host.querySelector("ol"));
  const calls = []; const id = t({ title: "Uploading", action: { label: "Cancel", onClick: () => calls.push("old") }, duration: Infinity });
  t.update(id, { title: "Done", action: { label: "Undo", onClick: () => calls.push("new") } });
  host.querySelector("[data-ui-part=action]").click();
  assert.deepEqual(calls, ["new"]);
});

test("toast: the region is a named wrapper around the list; a new toast is announced once", () => {
  const host = mount(`<ol data-ui="toaster" aria-label="Alerts"></ol>`), ol = host.querySelector("ol"), t = registry.toaster(ol);
  assert.notEqual(ol.getAttribute("role"), "region", "role=region on the <ol> hides its list semantics");
  const region = ol.closest("[role=region]"); assert.ok(region && region !== ol); assert.equal(region.getAttribute("aria-label"), "Alerts");
  const polite = region.querySelector("[aria-live=polite]"), loud = region.querySelector("[aria-live=assertive]");
  t({ title: "Saved", duration: Infinity }); assert.equal(polite.textContent, "Saved"); assert.equal(loud.textContent, "");
  assert.equal(ol.querySelector("[aria-live]"), null, "toasts themselves are not live (announced twice)");
  t({ title: "Failed", variant: "error", duration: Infinity }); assert.equal(loud.textContent, "Failed"); assert.equal(polite.textContent, "");
  t.destroy?.(); ol.__uiToaster?.destroy();
  assert.equal(ol.parentElement, host, "destroy unwraps the list"); assert.equal(host.querySelector("[role=region]"), null);
  // a list already inside a named region keeps that region
  const h2 = mount(`<section role="region" aria-label="Mine"><ol data-ui="toaster"></ol></section>`); registry.toaster(h2.querySelector("ol"));
  assert.equal(h2.querySelectorAll("[role=region]").length, 1);
});

test("theme switch ignores unknown stored and submitted values", () => {
  localStorage.setItem("bugs.theme", "evil\"><x"); const host = mount(`<button data-ui="theme-switch" data-storage-key="bugs.theme"></button>`);
  const api = registry["theme-switch"](host.firstElementChild);
  assert.equal(api.mode, "system"); assert.ok(["light", "dark"].includes(document.documentElement.dataset.theme));
  host.firstElementChild.click(); assert.equal(api.mode, "light"); assert.equal(localStorage.getItem("bugs.theme"), "light");
  api.mode = "purple"; assert.equal(api.mode, "light"); assert.equal(localStorage.getItem("bugs.theme"), "light");
  const sel = mount(`<select data-ui="theme-switch" data-target="#nope"><option>light</option><option>neon</option></select>`).firstElementChild;
  const s = registry["theme-switch"](sel); sel.value = "neon"; sel.dispatchEvent(new window.Event("change", { bubbles: true })); assert.notEqual(s.mode, "neon");
});

test("toolbar leaves keys of nested fields and popups alone", () => {
  const host = mount(`<div data-ui="toolbar"><button id="b1">B</button><input id="f" value="hello"><textarea id="ta"></textarea>
    <select id="sel"><option>1</option><option>2</option></select><button id="b2">I</button>
    <div role="menu" id="menu"><button role="menuitem" id="m1">Cut</button><button role="menuitem" id="m2">Copy</button></div></div>`);
  registry.toolbar(host.firstElementChild);
  const [f, ta, sel, menu] = ["#f", "#ta", "#sel", "#m1"].map((s) => host.querySelector(s));
  for (const [el, k] of [[f, "ArrowUp"], [f, "ArrowDown"], [ta, "ArrowDown"], [ta, "Home"], [sel, "ArrowDown"], [menu, "ArrowDown"], [menu, "End"]]) {
    el.focus(); const e = key(el, k);
    assert.equal(e.defaultPrevented, false, `${k} on #${el.id} was swallowed`); assert.equal(document.activeElement, el, `${k} moved focus away from #${el.id}`);
  }
  const b1 = host.querySelector("#b1"); b1.focus(); key(b1, "ArrowRight"); assert.equal(document.activeElement.id, "f", "toolbar still roves between its buttons");
  host.querySelector("#b2").focus(); key(host.querySelector("#b2"), "End"); assert.equal(document.activeElement.id, "b2");
});

test("file input matches MIME types like the browser: wildcards, extensions, case, literal + and .", () => {
  const f = (name, type) => ({ name, type });
  assert.equal(accepts("image/*", f("a.PNG", "image/png")), true);
  assert.equal(accepts("IMAGE/*", f("a.png", "Image/PNG")), true);
  assert.equal(accepts(".jpg, .PDF", f("A.JPG", "")), true);
  assert.equal(accepts(".pdf", f("a.pdf.exe", "application/x-msdownload")), false);
  assert.equal(accepts("image/svg+xml", f("a.svg", "image/svg+xml")), true, "+ was read as a regular expression");
  assert.equal(accepts("image/png", f("a.png", "image/pngx")), false, "match was not anchored at the end");
  assert.equal(accepts("application/vnd.ms-excel", f("a.xls", "application/vndXms-excel")), false, ". was read as a regular expression");
  assert.equal(accepts("image/*", f("a", "")), false); assert.equal(accepts("", f("a", "")), true);
  // wired into the controller
  const host = mount(`<div data-ui="file-input"><input type="file" data-ui-part="input" accept="image/svg+xml" multiple><div data-ui-part="dropzone"></div><ul data-ui-part="list"></ul></div>`);
  const api = registry["file-input"](host.firstElementChild); let rejected = null; host.firstElementChild.addEventListener("ui:reject", (e) => (rejected = e.detail.files));
  const dz = host.querySelector("[data-ui-part=dropzone]"), drop = new window.Event("drop", { bubbles: true, cancelable: true });
  drop.dataTransfer = { files: [new window.File(["<svg/>"], "logo.svg", { type: "image/svg+xml" })] }; dz.dispatchEvent(drop);
  assert.equal(api.files.length, 1); assert.equal(rejected, null);
});

test("components with missing parts do not throw", () => {
  const cases = {
    "file-input": `<div data-ui="file-input"><div data-ui-part="dropzone"></div></div>`,
    "toggle-password": `<div data-ui="toggle-password"><input type="password"></div>`,
    "image-input": `<div data-ui="image-input"><img data-ui-part="preview"></div>`,
    repeater: `<div data-ui="repeater" data-min="2"><div data-ui-part="list"></div><button data-ui-part="add">Add</button></div>`,
    "color-picker": `<div data-ui="color-picker"><button data-ui-part="swatch"></button></div>`,
    sortable: `<ul data-ui="sortable" data-handle><li data-ui-part="item" data-value="a">no handle</li></ul>`,
  };
  for (const [kind, html] of Object.entries(cases)) {
    const el = mount(html).firstElementChild;
    assert.doesNotThrow(() => { const api = registry[kind](el); el.querySelector("button")?.click(); api.destroy(); }, kind);
  }
  assert.doesNotThrow(() => createChartPanel(mount(`<section><table><tbody><tr><td>1</td></tr></tbody></table></section>`).firstElementChild));
});

test("custom elements: <ui-checkbox> and <ui-toggle> are focusable and keyboard operable; <ui-textarea> works", async () => {
  const errors = []; window.addEventListener("error", (e) => errors.push(e.error));
  const realQueue = globalThis.queueMicrotask; // custom elements build their controller in a microtask
  await import("../src/elements/all.js");
  const host = mount(`<ui-checkbox aria-label="Agree"></ui-checkbox><ui-toggle aria-label="Bold">B</ui-toggle>
    <ui-textarea data-autosize><textarea maxlength="10">hi</textarea></ui-textarea>`);
  await new Promise((r) => realQueue(r)); await new Promise((r) => setTimeout(r));
  const [cb, tg, ta] = host.children;
  assert.ok(cb.api && tg.api && ta.api, "controllers built");
  for (const el of [cb, tg]) { assert.equal(el.tabIndex, 0, `${el.localName} not focusable`); el.focus(); assert.equal(document.activeElement, el); }
  assert.equal(cb.getAttribute("role"), "checkbox"); assert.equal(tg.getAttribute("role"), "button");
  cb.focus(); key(cb, " "); assert.equal(cb.getAttribute("aria-checked"), "true", "Space did not check <ui-checkbox>");
  tg.focus(); key(tg, "Enter"); assert.equal(tg.getAttribute("aria-pressed"), "true", "Enter did not press <ui-toggle>");
  key(tg, " "); assert.equal(tg.getAttribute("aria-pressed"), "false");
  assert.equal(ta.dataset.count, "2"); assert.equal(ta.dataset.remaining, "8");
  const area = ta.querySelector("textarea"); area.value = "hello"; area.dispatchEvent(new window.Event("input", { bubbles: true })); assert.equal(ta.dataset.count, "5");
  assert.deepEqual(errors, []);
});

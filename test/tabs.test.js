// Run: npm test   (needs jsdom resolvable, e.g. NODE_PATH or `npm i -D jsdom`)
import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM(`<div data-ui="tabs" id="t">
  <div data-ui-part="list">
    <button data-ui-part="trigger" data-value="a">A</button>
    <button data-ui-part="trigger" data-value="b" disabled>B</button>
    <button data-ui-part="trigger" data-value="c">C</button>
  </div>
  <div data-ui-part="panel" data-value="a"></div>
  <div data-ui-part="panel" data-value="b"></div>
  <div data-ui-part="panel" data-value="c"></div></div>`);
Object.assign(globalThis, { document: dom.window.document, CustomEvent: dom.window.CustomEvent, __COLIBRI_UI_NO_AUTO__: true });
const { createTabs } = await import("../src/core/tabs.js");
const root = document.getElementById("t");
const [ta, tb, tc] = root.querySelectorAll("button");
const [pa, , pc] = root.querySelectorAll('[data-ui-part="panel"]');
const key = (el, k) => el.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: k, bubbles: true }));

test("initial state + aria wiring", () => {
  const api = createTabs(root);
  assert.equal(api.value, "a");
  assert.equal(ta.getAttribute("role"), "tab");
  assert.equal(ta.getAttribute("aria-selected"), "true");
  assert.equal(pa.hidden, false); assert.equal(pc.hidden, true);
  assert.equal(pa.getAttribute("aria-labelledby"), ta.id);
});
test("click selects, disabled ignored, event fires", () => {
  let got; root.addEventListener("ui:change", (e) => (got = e.detail), { once: true });
  tb.click(); assert.equal(root.__uiTabs.value, "a");
  tc.click(); assert.equal(root.__uiTabs.value, "c");
  assert.deepEqual(got, { value: "c", previous: "a" });
  assert.equal(tc.dataset.state, "active"); assert.equal(pc.hidden, false);
});
test("arrow keys skip disabled and wrap", () => {
  key(tc, "ArrowRight"); assert.equal(root.__uiTabs.value, "a");
  key(ta, "ArrowRight"); assert.equal(root.__uiTabs.value, "c");
  key(tc, "Home"); assert.equal(root.__uiTabs.value, "a");
});

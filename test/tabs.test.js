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

function fixture(attrs = "") {
  const node = document.createElement("div");
  node.dataset.ui = "tabs";
  node.innerHTML = `<div data-ui-part="list">
    <button id="custom-tab" data-ui-part="trigger" data-value="a">A</button>
    <button data-ui-part="trigger" data-value="b" ${attrs}>B</button>
  </div><div id="custom-panel" data-ui-part="panel" data-value="a"></div>
  <div data-ui-part="panel" data-value="b"></div>`;
  document.body.append(node);
  return node;
}
test("preserves author IDs in both directions of ARIA relationships", () => {
  const node = fixture(); createTabs(node);
  const trigger = node.querySelector("button"), panel = node.querySelector('[data-ui-part="panel"]');
  assert.equal(trigger.getAttribute("aria-controls"), panel.id);
  assert.equal(panel.getAttribute("aria-labelledby"), trigger.id);
  node.remove();
});
test("aria-disabled tabs are skipped and invalid defaults fall back", () => {
  const node = fixture('aria-disabled="true"'); node.dataset.defaultValue = "b";
  const api = createTabs(node); assert.equal(api.value, "a");
  const a = node.querySelector("button"); key(a, "ArrowRight");
  assert.equal(api.value, "a"); api.select("b"); assert.equal(api.value, "a"); node.remove();
});
test("refresh recovers from removed or disabled selected tabs, including an empty set", () => {
  const node = fixture(), api = createTabs(node);
  const [a, b] = node.querySelectorAll("button");
  a.disabled = true; api.refresh(); assert.equal(api.value, "b");
  a.disabled = false; b.remove(); api.refresh(); assert.equal(api.value, "a");
  a.disabled = true; api.refresh(); assert.equal(api.value, null);
  assert.ok([...node.querySelectorAll('[data-ui-part="panel"]')].every((p) => p.hidden));
  assert.doesNotThrow(() => key(a, "ArrowRight")); node.remove();
});
test("nested component triggers retain their own semantics", () => {
  const node = fixture();
  node.querySelector('[data-ui-part="panel"]').insertAdjacentHTML("beforeend", '<div data-ui="dialog"><button data-ui-part="trigger">Open</button></div>');
  createTabs(node);
  assert.equal(node.querySelector('[data-ui="dialog"] button').getAttribute("role"), null); node.remove();
});
test("RTL horizontal navigation reverses arrows; manual activation waits for Enter", () => {
  const node = fixture(); node.style.direction = "rtl";
  const api = createTabs(node, { activation: "manual" });
  const [a, b] = node.querySelectorAll("button"); a.focus(); key(a, "ArrowLeft");
  assert.equal(document.activeElement, b); assert.equal(api.value, "a");
  key(b, "Enter"); assert.equal(api.value, "b"); node.remove();
});

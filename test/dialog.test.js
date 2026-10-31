import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM(`<button id="outside">x</button>
<div data-ui="dialog" id="d">
  <button data-ui-part="trigger">Open</button>
  <dialog data-ui-part="content">
    <h2 data-ui-part="title">T</h2><p data-ui-part="description">D</p>
    <div data-ui="dialog" id="inner"><dialog data-ui-part="content"><button data-ui-part="close">inner</button></dialog></div>
    <button data-ui-part="close" data-ui-return="ok">OK</button>
  </dialog>
</div>`);
Object.assign(globalThis, { document: dom.window.document, CustomEvent: dom.window.CustomEvent, __COLIBRI_UI_NO_AUTO__: true });
const { createDialog } = await import("../src/core/dialog.js");
const root = document.getElementById("d");
const content = root.querySelector(':scope > dialog');
const trigger = root.querySelector('[data-ui-part="trigger"]');
const ok = root.querySelector('[data-ui-return="ok"]');

test("wiring + closed initially", () => {
  createDialog(root); createDialog(document.getElementById("inner"));
  assert.equal(root.dataset.state, "closed");
  assert.equal(trigger.getAttribute("aria-haspopup"), "dialog");
  assert.equal(trigger.getAttribute("aria-expanded"), "false");
  assert.equal(content.getAttribute("aria-labelledby"), root.querySelector("h2").id);
  assert.ok(content.getAttribute("aria-describedby"));
});
test("trigger opens, close returns value + focus to opener", () => {
  let closed; root.addEventListener("ui:close", (e) => (closed = e.detail.returnValue), { once: true });
  trigger.focus(); trigger.click();
  assert.equal(root.__uiDialog.open, true);
  assert.equal(trigger.getAttribute("aria-expanded"), "true");
  assert.equal(content.dataset.state, "open");
  ok.click();
  assert.equal(root.__uiDialog.open, false);
  assert.equal(closed, "ok");
  assert.equal(document.activeElement, trigger);
});
test("ui:beforeclose can veto; Esc respects dismissible", () => {
  const api = root.__uiDialog; api.show();
  const veto = (e) => e.preventDefault();
  root.addEventListener("ui:beforeclose", veto);
  api.close(); assert.equal(api.open, true);
  root.removeEventListener("ui:beforeclose", veto);
  root.dataset.dismissible = "false";
  content.dispatchEvent(new dom.window.Event("cancel", { cancelable: true })); assert.equal(api.open, true);
  root.dataset.dismissible = "true";
  content.dispatchEvent(new dom.window.Event("cancel", { cancelable: true })); assert.equal(api.open, false);
});
test("nested dialog close does not close outer", () => {
  const api = root.__uiDialog; api.show();
  const inner = document.getElementById("inner"); inner.__uiDialog.show();
  inner.querySelector("button").click();
  assert.equal(inner.__uiDialog.open, false); assert.equal(api.open, true);
});

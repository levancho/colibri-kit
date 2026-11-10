// Regressions from the November 2026 audit: each test reproduces a defect that shipped before the fix.
import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><body></body>", { url: "https://example.test/" });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, CustomEvent: dom.window.CustomEvent, Element: dom.window.Element,
  Event: dom.window.Event, MutationObserver: dom.window.MutationObserver, location: dom.window.location });
const { init } = await import("../src/core/auto.js"); // registers the ui:refresh listener, as on a real page
const { controllers, once } = await import("../src/core/util.js");
const { registry } = await import("../src/core/registry.js");

test("repeater wired after page load is initialised once (its own ui:refresh must not re-enter)", () => {
  const host = document.createElement("div");
  host.innerHTML = `<div data-ui="repeater" data-min="2" id="rep"><template data-ui-part="template"><div data-ui-part="row"><input name="x"><button data-ui-part="remove">x</button></div></template>
    <div data-ui-part="list"></div><button data-ui-part="add">Add</button></div>`;
  document.body.append(host);
  host.dispatchEvent(new Event("ui:refresh", { bubbles: true }));
  const rep = document.getElementById("rep"), rows = () => rep.querySelectorAll("[data-ui-part=row]").length;
  assert.equal(controllers(rep).length, 1);
  assert.equal(rows(), 2);
  rep.querySelector("[data-ui-part=add]").click();
  assert.equal(rows(), 3, "one click adds one row");
});
test("once() does not leave a half-built marker behind when a factory throws", () => {
  const el = document.createElement("div");
  assert.throws(() => once(el, "__uiBroken", () => { throw new Error("boom"); }), /boom/);
  assert.equal(el.__uiBroken, undefined);
  assert.equal(once(el, "__uiBroken", () => ({ ok: true })).ok, true);
});
test("sheet and drawer: drag-dismiss is wired once and options reach the dialog", () => {
  const host = document.createElement("div");
  host.innerHTML = `<div data-ui="drawer" id="dr"><button data-ui-part="trigger">Open</button><dialog data-ui-part="content"><p>Body</p></dialog></div>`;
  document.body.append(host);
  const root = document.getElementById("dr"), content = root.querySelector("dialog");
  content.showModal = function () { this.open = true; }; content.close = function () { this.open = false; };
  let opened = 0, dismissed = 0;
  root.addEventListener("ui:dragdismiss", () => dismissed++);
  const api = registry.drawer(root, { onOpenChange: (v) => { if (v) opened++; } });
  registry.drawer(root); registry.drawer(root); // repeated init passes
  api.show();
  assert.equal(opened, 1, "options are passed through to the dialog controller");
  const fire = (type, y) => content.dispatchEvent(Object.assign(new dom.window.Event(type, { bubbles: true }), { clientX: 0, clientY: y, button: 0, pointerId: 1 }));
  Object.defineProperty(content, "offsetHeight", { value: 300, configurable: true });
  fire("pointerdown", 10); fire("pointermove", 200); fire("pointerup", 200);
  assert.equal(dismissed, 1, "one drag emits one ui:dragdismiss");
});
test("drawer: a press without movement, or on a control, is not a drag", () => {
  const host = document.createElement("div");
  host.innerHTML = `<div data-ui="drawer" id="dr2"><dialog data-ui-part="content"><label id="lab">Label</label><p id="text">Text</p></dialog></div>`;
  document.body.append(host);
  const root = document.getElementById("dr2"), content = root.querySelector("dialog");
  content.showModal = function () { this.open = true; }; content.close = function () { this.open = false; };
  let captured = 0; content.setPointerCapture = () => { captured++; };
  registry.drawer(root).show();
  const fire = (el, type, y) => el.dispatchEvent(Object.assign(new dom.window.Event(type, { bubbles: true }), { clientX: 0, clientY: y, button: 0, pointerId: 1 }));
  fire(document.getElementById("text"), "pointerdown", 10); fire(content, "pointerup", 10);
  assert.equal(captured, 0, "a plain press never captures the pointer");
  fire(document.getElementById("lab"), "pointerdown", 10); fire(content, "pointermove", 200);
  assert.equal(captured, 0, "a press that starts on a label is left to the label");
  root.dataset.dismissible = "false";
  fire(document.getElementById("text"), "pointerdown", 10); fire(content, "pointermove", 200);
  assert.equal(captured, 0, "a non-dismissible drawer cannot be dragged away");
});
test("item-group: data-href only navigates to http(s) URLs", () => {
  const host = document.createElement("div");
  host.innerHTML = `<div data-ui="item-group" id="ig"><div data-ui-part="item" data-href="javascript:window.__xss=1" id="bad">Bad</div></div>`;
  document.body.append(host);
  init(host);
  document.getElementById("bad").click();
  assert.equal(dom.window.__xss, undefined);
});

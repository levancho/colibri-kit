// Regressions for the "Component bugs" list in TODO.md (forms, sortable, slider, resizable, accordion).
// Each test failed before its fix.
import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><body></body>", { url: "https://example.test/" });
const { window } = dom;
Object.assign(globalThis, { window, document: window.document, CustomEvent: window.CustomEvent, Event: window.Event, MutationObserver: window.MutationObserver,
  getComputedStyle: window.getComputedStyle, __COLIBRI_UI_NO_AUTO__: true });
const { createSlider, createPinInput, createSortable } = await import("../src/core/forms.js");
const { createResizable } = await import("../src/core/base.js");
const { createAccordion, createCollapsible } = await import("../src/core/collapsible.js");

const mount = (html) => { const host = document.createElement("div"); host.innerHTML = html; document.body.append(host); return host; };
/** jsdom has no PointerEvent: a plain event with the fields the controllers read */
const pointer = (el, type, init = {}) => {
  const e = new window.Event(type, { bubbles: true, cancelable: true });
  Object.assign(e, { pointerId: 1, button: 0, clientX: 0, clientY: 0, pointerType: "touch", ...init });
  el.dispatchEvent(e); return e;
};
const rect = (el, r) => { el.getBoundingClientRect = () => ({ left: r.x, top: r.y, right: r.x + r.w, bottom: r.y + r.h, width: r.w, height: r.h, x: r.x, y: r.y }); };

test("slider: float steps post values rounded to the step's precision", () => {
  const host = mount(`<div data-ui="slider" data-min="0" data-max="1" data-step="0.1" data-value="0.2" data-name="f"><div data-ui-part="track"></div><span data-ui-part="thumb"></span></div>`);
  const root = host.firstElementChild, api = createSlider(root), thumb = root.querySelector("[data-ui-part=thumb]");
  thumb.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  assert.equal(api.value, 0.3);
  assert.equal(root.querySelector("input[type=hidden]").value, "0.3");
  assert.equal(thumb.getAttribute("aria-valuenow"), "0.3");
  const h2 = mount(`<div data-ui="slider" data-min="0.05" data-max="1" data-step="0.05" data-value="0.05"><span data-ui-part="thumb"></span></div>`);
  const a2 = createSlider(h2.firstElementChild); a2.value = 0.15000000001; assert.equal(a2.value, 0.15);
});

test("slider: a cancelled touch ends the drag (later moves do not move the thumb)", () => {
  const host = mount(`<div data-ui="slider" data-min="0" data-max="100" data-value="0"><div data-ui-part="track"></div><span data-ui-part="thumb"></span></div>`);
  const root = host.firstElementChild, api = createSlider(root); rect(root.querySelector("[data-ui-part=track]"), { x: 0, y: 0, w: 100, h: 10 });
  let changes = 0; root.addEventListener("ui:change", () => changes++);
  pointer(root, "pointerdown", { clientX: 20 }); assert.equal(api.value, 20); assert.equal(root.dataset.state, "dragging");
  pointer(root, "pointercancel");
  assert.equal(root.dataset.state, "idle"); assert.equal(changes, 1, "the value reached is committed once");
  pointer(root, "pointermove", { clientX: 80 });
  assert.equal(api.value, 20, "drag stayed armed after pointercancel");
});

test("resizable: pointercancel ends a handle drag", () => {
  const host = mount(`<div data-ui="resizable"><div data-ui-part="panel" data-size="50"></div><div data-ui-part="handle"></div><div data-ui-part="panel" data-size="50"></div></div>`);
  const root = host.firstElementChild, api = createResizable(root), h = root.querySelector("[data-ui-part=handle]"); rect(root, { x: 0, y: 0, w: 100, h: 10 });
  pointer(h, "pointerdown", { clientX: 50 }); pointer(h, "pointermove", { clientX: 60 }); assert.equal(Math.round(api.sizes[0]), 60);
  pointer(h, "pointercancel"); assert.equal(h.dataset.state, "idle");
  pointer(h, "pointermove", { clientX: 90 }); assert.equal(Math.round(api.sizes[0]), 60, "drag stayed armed after pointercancel");
});

const sortableHtml = `<ul data-ui="sortable" data-name="order"><li data-ui-part="item" data-value="a">A <button type="button" class="act">Edit</button> <input type="checkbox" class="chk"></li><li data-ui-part="item" data-value="b">B</li><li data-ui-part="item" data-value="c">C</li></ul>`;
test("sortable: a press does not capture the pointer or start a drag before the threshold", () => {
  const host = mount(sortableHtml), root = host.firstElementChild; createSortable(root);
  let captured = 0; root.setPointerCapture = () => captured++;
  const a = root.querySelector("[data-value=a]");
  pointer(a, "pointerdown", { clientX: 10, clientY: 10 });
  assert.equal(captured, 0, "pointer captured on press"); assert.notEqual(a.dataset.state, "dragging");
  pointer(document, "pointermove", { clientX: 12, clientY: 11 }); assert.equal(captured, 0, "captured below the threshold");
  pointer(document, "pointerup", { clientX: 12, clientY: 11 }); assert.notEqual(a.dataset.state, "dragging");
  // presses on controls inside an item never become drags
  const btn = a.querySelector(".act"); let clicks = 0; btn.addEventListener("click", () => clicks++);
  const down = pointer(btn, "pointerdown", { clientX: 10, clientY: 10, pointerType: "mouse" });
  assert.equal(down.defaultPrevented, false, "press on a control was cancelled");
  pointer(document, "pointermove", { clientX: 10, clientY: 40 }); assert.equal(captured, 0);
  pointer(document, "pointerup"); btn.click(); assert.equal(clicks, 1);
});

test("sortable: a drag past the threshold reorders; pointercancel puts the item back", () => {
  const host = mount(sortableHtml), root = host.firstElementChild, api = createSortable(root);
  const [a, b, c] = root.querySelectorAll("[data-ui-part=item]"); [a, b, c].forEach((el, i) => rect(el, { x: 0, y: i * 20, w: 100, h: 20 }));
  let sorts = 0; root.addEventListener("ui:sort", () => sorts++);
  document.elementFromPoint = (x, y) => [a, b, c].find((el) => { const r = el.getBoundingClientRect(); return y >= r.top && y < r.bottom; }) || null;
  pointer(a, "pointerdown", { clientX: 5, clientY: 5 }); pointer(document, "pointermove", { clientX: 5, clientY: 55 });
  assert.equal(a.dataset.state, "dragging"); assert.deepEqual(api.order, ["b", "c", "a"]);
  pointer(document, "pointercancel");
  assert.deepEqual(api.order, ["a", "b", "c"], "cancelled drag was not undone"); assert.equal(a.dataset.state, "idle"); assert.equal(sorts, 0);
  pointer(a, "pointerdown", { clientX: 5, clientY: 5 }); pointer(document, "pointermove", { clientX: 5, clientY: 55 }); pointer(document, "pointerup");
  assert.deepEqual(api.order, ["b", "c", "a"]); assert.equal(sorts, 1);
  pointer(document, "pointermove", { clientX: 5, clientY: 5 }); assert.deepEqual(api.order, ["b", "c", "a"], "drag stayed armed after pointerup");
  delete document.elementFromPoint;
});

test("destroy then re-create does not leak hidden inputs (slider, pin-input, sortable)", () => {
  const host = mount(`<form><div data-ui="slider" data-name="s" data-value="1,2"><span data-ui-part="thumb"></span><span data-ui-part="thumb"></span></div>
    <div data-ui="pin-input" data-name="otp" data-length="4"></div>${sortableHtml}</form>`);
  const form = host.firstElementChild, [s, p, o] = form.querySelectorAll("[data-ui]");
  for (let i = 0; i < 3; i++) { createSlider(s).destroy(); createPinInput(p).destroy(); createSortable(o).destroy(); }
  createSlider(s); createPinInput(p); createSortable(o);
  assert.equal(form.querySelectorAll("input[type=hidden][name=s]").length, 2);
  assert.equal(form.querySelectorAll("input[type=hidden][name=otp]").length, 1);
  assert.equal(form.querySelectorAll("input[type=hidden][name=order]").length, 1);
  assert.equal(p.querySelectorAll("[data-ui-part=cell]").length, 4, "generated cells are reused");
  assert.equal(host.querySelectorAll("[data-ui-part=announcer]").length, 1);
  assert.deepEqual(new window.FormData(form).getAll("s"), ["1", "2"]);
});

test("accordion reacts only to its own triggers, not a nested component's", () => {
  const host = mount(`<div data-ui="accordion" data-type="multiple"><div data-ui-part="item" data-value="one"><button data-ui-part="trigger" id="t1">One</button>
    <div data-ui-part="content"><div data-ui="collapsible" id="inner"><button data-ui-part="trigger" id="t2">More</button><div data-ui-part="content">x</div></div>
    <div data-ui-part="trigger" id="stray"><span id="deep">not ours</span></div></div></div></div>`);
  const inner = createCollapsible(host.querySelector("#inner")); const acc = createAccordion(host.firstElementChild);
  host.querySelector("#t1").click(); assert.deepEqual(acc.value, ["one"]);
  host.querySelector("#t2").click(); assert.equal(inner.open, true);
  assert.deepEqual(acc.value, ["one"], "nested collapsible trigger toggled the accordion item");
  host.querySelector("#t1").click(); assert.deepEqual(acc.value, []);
  host.querySelector("#deep").click(); assert.deepEqual(acc.value, [], "a trigger part in content that is not the item's trigger toggled it");
});

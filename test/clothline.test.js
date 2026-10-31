import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
const dom = new JSDOM(`<body><nav data-ui="clothline" id="l" hidden></nav>
<section data-ui="cell" id="a" data-line="#l" data-name="Answers" data-mark="✦"><header data-ui-part="header"><span data-ui-part="title">Answers</span><button data-ui-part="minimize">−</button><button data-ui-part="maximize">□</button><button data-ui-part="close">×</button></header><div data-ui-part="body">x</div></section>
<section data-ui="cell" id="b" data-line="#l"><header data-ui-part="header"><span data-ui-part="title">Projects</span><button data-ui-part="minimize">−</button></header></section></body>`);
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, CustomEvent: dom.window.CustomEvent, Element: dom.window.Element });
const { createClothline, createCell } = await import("../src/core/clothline.js");
const $ = (s) => document.querySelector(s);
const line = createClothline($("#l")), a = createCell($("#a")), b = createCell($("#b"));
test("labels + roles", () => {
  assert.equal($("#l").getAttribute("aria-label"), "Minimized cells");
  assert.equal($("#a").getAttribute("role"), "region");
  assert.equal($('#a [data-ui-part="minimize"]').getAttribute("aria-label"), "Minimize Answers");
});
test("hang moves the cell to the line and focuses the tag", () => {
  let ev = 0; $("#a").addEventListener("ui:hang", () => ev++);
  $('#a [data-ui-part="minimize"]').focus(); $('#a [data-ui-part="minimize"]').click();
  assert.equal($("#a").hidden, true); assert.equal($("#l").hidden, false); assert.equal(a.state, "hanging"); assert.equal(ev, 1);
  const r = $('#l [data-ui-part="restore"]');
  assert.equal(r.getAttribute("aria-label"), "Restore Answers"); assert.equal(document.activeElement, r);
  assert.equal($('#l [data-ui-part="mark"]').textContent, "✦");
});
test("restore from the tag; line hides when empty", () => {
  $('#l [data-ui-part="restore"]').click();
  assert.equal($("#a").hidden, false); assert.equal(a.state, "open"); assert.equal($("#l").hidden, true);
});
test("× on a tag closes the cell; close is cancelable", () => {
  b.hang(); a.hang(); assert.equal(line.items().length, 2);
  $('#l [data-cell="b"] [data-ui-part="remove"]').click();
  assert.equal(b.state, "closed"); assert.equal(line.items().length, 1);
  $("#a").addEventListener("ui:close", (e) => e.preventDefault(), { once: true }); a.close(); assert.equal(a.state, "hanging");
});
test("maximize toggles and Esc restores size", () => {
  a.restore(); a.toggleMaximize(); assert.equal(a.state, "maximized");
  $("#a").dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })); assert.equal(a.state, "open");
});

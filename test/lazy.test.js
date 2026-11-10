// auto-lazy.js: loaders mirror the registry and load only the modules a page uses.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { JSDOM } from "jsdom";

const dom = new JSDOM(`<div id="host"><div data-ui="tabs" id="t"><div data-ui-part="list"><button data-ui-part="trigger" data-value="a">A</button></div><div data-ui-part="panel" data-value="a"></div></div>
  <div data-ui="not-a-component" id="x"></div></div>`);
Object.assign(globalThis, { window: dom.window, document: dom.window.document, CustomEvent: dom.window.CustomEvent, Element: dom.window.Element,
  MutationObserver: dom.window.MutationObserver, __COLIBRI_UI_NO_AUTO__: true });
const { registry } = await import("../src/core/registry.js");
const { loaders, init, load, controllers } = await import("../src/core/auto-lazy.js");

test("generated loaders are current", () => {
  execFileSync(process.execPath, ["tools/lazy-registry.mjs", "--check"], { stdio: "pipe" });
});
test("every registry name has a loader, and nothing else", () => {
  assert.deepEqual(Object.keys(loaders).sort(), Object.keys(registry).sort());
});
test("loaders resolve to the registry's controller factories", async () => {
  for (const name of Object.keys(registry)) {
    const f = await load(name);
    assert.equal(typeof f, "function", name);
    // wrapped entries (sheet, drawer) are built per load, so identity only holds for plain entries
    if (!["sheet", "drawer"].includes(name)) assert.equal(f, registry[name], name);
  }
});
test("init wires components and ignores unknown names", async () => {
  await init(document.getElementById("host"));
  const tabs = document.getElementById("t");
  assert.equal(tabs.querySelector("button").getAttribute("role"), "tab");
  assert.equal(controllers(tabs).length, 1);
  assert.equal(controllers(tabs)[0].value, "a");
  assert.equal(controllers(document.getElementById("x")).length, 0);
  assert.equal(await load("not-a-component"), null);
});

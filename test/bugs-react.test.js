// Regressions for the React items of the "Component bugs" list in TODO.md. Each test failed before its fix.
import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
const dom = new JSDOM('<main id="app"></main>', { url: "https://example.test/", pretendToBeVisual: true });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, CustomEvent: dom.window.CustomEvent, HTMLElement: dom.window.HTMLElement,
  MutationObserver: dom.window.MutationObserver, IS_REACT_ACT_ENVIRONMENT: true });
const { createElement: h, StrictMode, act, createRef, useState } = await import("react");
const { createRoot } = await import("react-dom/client");
const { UI, Part, DataList, Callout, Inset, useColibri, ChartPanel } = await import("../src/react/index.js");
const app = document.getElementById("app");

async function withErrors(fn) {
  const errors = [], original = console.error;
  console.error = (...a) => errors.push(a.map(String).join(" "));
  try { await fn(); } finally { console.error = original; }
  return errors;
}

test("React: alert, badge and attachment that remove themselves do not crash on unmount", async () => {
  for (const [kind, as, inner, closeSel, event] of [
    ["alert", "div", [h("p", { key: "p" }, "Saved"), h(Part, { key: "c", name: "close", as: "button" }, "×")], "[data-ui-part=close]", "dismiss"],
    ["badge", "span", ["Tag ", h(Part, { key: "r", name: "remove", as: "button" }, "×")], "[data-ui-part=remove]", "remove"],
    ["attachment", "div", [h(Part, { key: "t", name: "title" }, "a.pdf"), h(Part, { key: "a", name: "action", as: "button", "data-action": "remove" }, "Remove")], "[data-action=remove]", "remove"],
  ]) {
    const root = createRoot(app); let fired = 0;
    function View() {
      const [shown, setShown] = useState(true);
      return h(StrictMode, null, h("section", null, shown && h(UI, { kind, as, id: "x", on: { [event]: () => { fired++; setShown(false); } } }, ...inner), h("p", null, "after")));
    }
    await act(async () => root.render(h(View)));
    let error = null;
    try { await act(async () => app.querySelector(closeSel).click()); } catch (e) { error = e; }
    assert.equal(error, null, `${kind}: ${error?.message}`);
    assert.equal(fired, 1, `${kind}: event not delivered`);
    assert.equal(document.getElementById("x"), null, `${kind}: React did not remove it`);
    assert.match(app.textContent, /after/);
    // and when the app keeps it in state, it is hidden rather than ripped out of React's tree
    await act(async () => root.unmount());
  }
  const root = createRoot(app);
  await act(async () => root.render(h(UI, { kind: "badge", as: "span", id: "kept" }, "Tag ", h(Part, { name: "remove", as: "button" }, "×"))));
  await act(async () => app.querySelector("[data-ui-part=remove]").click());
  assert.equal(document.getElementById("kept").hidden, true);
  let error = null; try { await act(async () => root.unmount()); } catch (e) { error = e; }
  assert.equal(error, null, error?.message);
});

test("React: DataList, Callout and Inset render without an unknown-component error", async () => {
  const errors = await withErrors(async () => {
    const root = createRoot(app);
    await act(async () => root.render(h("div", null, h(DataList, null, h("dt", null, "a"), h("dd", null, "b")), h(Callout, null, "c"), h(Inset, null, "i"))));
    assert.equal(app.querySelector("dl").dataset.ui, "data-list");
    assert.ok(app.querySelector("[data-ui=callout]") && app.querySelector("[data-ui=inset]"));
    await act(async () => root.unmount());
  });
  assert.deepEqual(errors.filter((e) => /unknown component/.test(e)), []);
});

test("React: an inline options object does not recreate the controller on every render", async () => {
  const root = createRoot(app), seen = new Set(); let calls = 0;
  function Slider({ n }) {
    const [ref, api] = useColibri("slider", { options: { min: 0, max: 10, step: 1, onValueChange: () => calls++ } });
    seen.add(api.current);
    return h("div", { ref, "data-n": n }, h("span", { "data-ui-part": "thumb" }));
  }
  await act(async () => root.render(h(Slider, { n: 1 })));
  const node = app.firstElementChild, first = node.__uiSlider;
  for (let n = 2; n < 5; n++) await act(async () => root.render(h(Slider, { n })));
  assert.equal(node.__uiSlider, first, "controller was rebuilt for an equal options object");
  // the latest callback is used without rebuilding
  node.__uiSlider.value = 3; assert.equal(calls, 1);
  // a changed value does rebuild
  function Changed() { const [ref] = useColibri("slider", { options: { min: 0, max: 20 } }); return h("div", { ref }, h("span", { "data-ui-part": "thumb" })); }
  await act(async () => root.render(h(Changed)));
  assert.notEqual(app.firstElementChild.__uiSlider, first);
  await act(async () => root.unmount());
});

test("React ChartPanel accepts values written as text (1,200)", async () => {
  const root = createRoot(app);
  await act(async () => root.render(h(ChartPanel, { rows: [{ label: "d1", values: ["1,200", 3] }, { label: "d2", values: ["950", 4] }], ranges: [2], defaultRange: 2 })));
  assert.ok(app.querySelector("svg"));
  await act(async () => root.unmount());
});

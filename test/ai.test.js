// Conversation, AI elements and auth blocks (jsdom).
import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
const dom = new JSDOM(`<body></body>`, { url: "http://localhost/", pretendToBeVisual: true });
const w = dom.window;
Object.assign(globalThis, { window: w, document: w.document, CustomEvent: w.CustomEvent, Event: w.Event, MutationObserver: w.MutationObserver, HTMLElement: w.HTMLElement,
  getComputedStyle: w.getComputedStyle, requestAnimationFrame: (f) => setTimeout(f, 0), localStorage: w.localStorage, FormData: w.FormData });
const { init } = await import("../src/core/auto.js");
const mount = (html) => { const d = document.createElement("div"); d.innerHTML = html; document.body.append(d); init(d); return d; };
const key = (el, k, o = {}) => el.dispatchEvent(new w.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...o }));
const tick = () => new Promise((r) => setTimeout(r, 0));
const $ = (r, s) => r.querySelector(s), $$ = (r, s) => [...r.querySelectorAll(s)];

test("tool: disclosure + status label; running opens by default", () => {
  const d = mount(`<div data-ui="tool" data-status="running"><button data-ui-part="trigger"><span data-ui-part="label">x</span><span data-ui-part="status"></span></button><div data-ui-part="content">in</div></div>`);
  const t = $(d, "[data-ui-part=trigger]");
  assert.equal(t.getAttribute("aria-expanded"), "true"); assert.equal($(d, "[data-ui-part=status]").textContent, "Running");
  t.click(); assert.equal($(d, "[data-ui-part=content]").hidden, true);
});
test("plan: progress counts done steps and updates on status change", async () => {
  const d = mount(`<div data-ui="plan"><button data-ui-part="trigger"><span data-ui-part="progress"></span></button><div data-ui-part="content"><ol><li data-ui-part="step" data-status="done">a</li><li data-ui-part="step" data-status="running">b</li></ol></div></div>`);
  assert.equal($(d, "[data-ui-part=progress]").textContent, "1 of 2");
  assert.equal($$(d, "[data-ui-part=step]")[1].getAttribute("aria-current"), "step");
  $$(d, "[data-ui-part=step]")[1].dataset.status = "done"; await tick();
  assert.equal($(d, "[data-ui-part=progress]").textContent, "2 of 2");
});
test("test-results: summary + error status from failures", () => {
  const d = mount(`<div data-ui="test-results"><button data-ui-part="trigger"><span data-ui-part="status"></span></button><div data-ui-part="content"><div data-ui-part="summary"></div><ul><li data-ui-part="test" data-status="passed"></li><li data-ui-part="test" data-status="failed"></li></ul></div></div>`);
  assert.equal($(d, "[data-ui-part=summary]").textContent, "1 passed · 1 failed"); assert.equal($(d, "[data-ui=test-results]").dataset.status, "error");
});
test("confirmation: approve emits and replaces actions", () => {
  const d = mount(`<div data-ui="confirmation"><p data-ui-part="title">Run?</p><div data-ui-part="actions"><button data-ui-part="reject">No</button><button data-ui-part="approve">Yes</button></div><p data-ui-part="result"></p></div>`);
  let n = 0; d.addEventListener("ui:approve", () => n++); $(d, "[data-ui-part=approve]").click();
  assert.equal(n, 1); assert.equal($(d, "[data-ui-part=actions]").hidden, true); assert.equal($(d, "[data-ui-part=result]").textContent, "Approved");
});
test("context: meter values + level", () => {
  const d = mount(`<span data-ui="context" data-used="190000" data-max="200000"><span data-ui-part="meter"></span><span data-ui-part="percent"></span></span>`);
  const m = $(d, "[data-ui-part=meter]"); assert.equal(m.getAttribute("role"), "meter"); assert.equal(m.getAttribute("aria-valuenow"), "190000");
  assert.equal($(d, "[data-ui-part=percent]").textContent, "95%"); assert.equal($(d, "[data-ui=context]").dataset.level, "critical");
});
test("file-tree: tree roles, arrows open/close and select", () => {
  const d = mount(`<ul data-ui="file-tree"><li data-ui-part="folder" data-path="src"><span data-ui-part="label">src</span><ul data-ui-part="group"><li data-ui-part="file" data-path="src/a.js">a</li></ul></li><li data-ui-part="file" data-path="b">b</li></ul>`);
  const [f, a, b] = $$(d, "[role=treeitem]"); assert.equal($(d, "[data-ui=file-tree]").getAttribute("role"), "tree");
  assert.equal(f.getAttribute("aria-expanded"), "false"); f.focus(); key(f, "ArrowDown"); assert.equal(document.activeElement, b);
  key(b, "ArrowUp"); key(f, "ArrowRight"); assert.equal(f.getAttribute("aria-expanded"), "true"); key(f, "ArrowRight"); assert.equal(document.activeElement, a);
  let sel; d.addEventListener("ui:select", (e) => (sel = e.detail.path)); key(a, "Enter"); assert.equal(sel, "src/a.js"); assert.equal(a.getAttribute("aria-selected"), "true");
  key(a, "ArrowLeft"); assert.equal(document.activeElement, f); key(f, "ArrowLeft"); assert.equal(f.getAttribute("aria-expanded"), "false");
});
test("prompt-input: disabled when empty, Enter submits and clears, Stop while streaming", () => {
  const d = mount(`<form data-ui="prompt-input"><textarea data-ui-part="input"></textarea><button data-ui-part="submit">S</button></form>`);
  const f = $(d, "form"), ta = $(d, "textarea"), s = $(d, "[data-ui-part=submit]"); f.requestSubmit = () => f.dispatchEvent(new w.Event("submit", { cancelable: true }));
  assert.equal(s.disabled, true); ta.value = "hi"; ta.dispatchEvent(new w.Event("input")); assert.equal(s.disabled, false);
  let got; f.addEventListener("ui:submit", (e) => (got = e.detail.text)); key(ta, "Enter"); assert.equal(got, "hi"); assert.equal(ta.value, "");
  key(ta, "Enter", { shiftKey: true }); assert.equal(got, "hi");
});
test("prompt-input: streaming turns Send into Stop", async () => {
  const d = mount(`<form data-ui="prompt-input"><textarea data-ui-part="input"></textarea><button data-ui-part="submit">S</button></form>`);
  const f = $(d, "form"), s = $(d, "[data-ui-part=submit]"); f.dataset.status = "streaming"; await tick();
  assert.equal(s.dataset.state, "stop"); assert.equal(s.disabled, false); assert.equal(s.getAttribute("aria-label"), "Stop");
  let stop = 0; f.addEventListener("ui:stop", () => stop++); s.click(); assert.equal(stop, 1);
});
test("suggestion fills the target prompt", () => {
  const d = mount(`<form data-ui="prompt-input" id="pp"><textarea data-ui-part="input"></textarea><button data-ui-part="submit">S</button></form><div data-ui="suggestion" data-target="#pp"><button data-ui-part="item">Hello there</button></div>`);
  $(d, "[data-ui=suggestion] button").click(); assert.equal($(d, "textarea").value, "Hello there");
});
test("queue: checking moves item to completed and updates counts", () => {
  const d = mount(`<div data-ui="queue"><span data-ui-part="pending-count"></span><ul data-ui-part="pending"><li data-ui-part="item"><input type="checkbox"></li></ul><span data-ui-part="completed-count"></span><ul data-ui-part="completed"></ul></div>`);
  const cb = $(d, "input"); cb.checked = true; cb.dispatchEvent(new w.Event("change", { bubbles: true }));
  assert.equal($(d, "[data-ui-part=completed]").children.length, 1); assert.equal($(d, "[data-ui-part=pending-count]").textContent, "0");
});
test("questionnaire: required error, radio choice, skip, submit answers", () => {
  const d = mount(`<form data-ui="questionnaire"><div data-ui-part="progress"></div>
    <fieldset data-ui-part="item" data-name="a" data-type="single" data-required><legend data-ui-part="title">A</legend><div data-ui-part="choices"><button data-ui-part="choice" data-value="x">x</button><button data-ui-part="choice" data-value="y">y</button></div><p data-ui-part="error"></p></fieldset>
    <fieldset data-ui-part="item" data-name="b" data-type="multiple" data-skippable><div data-ui-part="choices"><button data-ui-part="choice" data-value="1">1</button></div></fieldset>
    <div><button type="button" data-ui-part="next">N</button><button type="button" data-ui-part="skip">S</button><button type="submit" data-ui-part="submit">Go</button></div></form>`);
  const [i1, i2] = $$(d, "fieldset"); const next = $(d, "[data-ui-part=next]");
  assert.equal($(d, "[data-ui-part=choices]").getAttribute("role"), "radiogroup"); assert.equal($(d, "[data-ui-part=progress]").getAttribute("aria-valuetext"), "Question 1 of 2");
  next.click(); assert.equal(i1.hidden, false); assert.ok($(i1, "[data-ui-part=error]").textContent);
  $$(i1, "[data-ui-part=choice]")[1].click(); assert.equal($$(i1, "[data-ui-part=choice]")[1].getAttribute("aria-checked"), "true");
  next.click(); assert.equal(i2.hidden, false); assert.equal($(d, "[data-ui-part=skip]").hidden, false);
  let ans; d.addEventListener("ui:submit", (e) => (ans = e.detail.answers)); $(d, "form").dispatchEvent(new w.Event("submit", { cancelable: true }));
  assert.deepEqual(ans, { a: "y", b: [] });
});
test("bubble reactions toggle and count", () => {
  const d = mount(`<div data-ui="bubble"><div data-ui-part="content">x</div><button data-ui-part="reaction">👍 <span data-ui-part="count">2</span></button></div>`);
  const r = $(d, "[data-ui-part=reaction]"); r.click(); assert.equal(r.getAttribute("aria-pressed"), "true"); assert.equal($(d, "[data-ui-part=count]").textContent, "3");
});
test("attachment: progress bar + cancelable remove", () => {
  const d = mount(`<div data-ui="attachment" data-progress="40"><span data-ui-part="title">a.pdf</span><span data-ui-part="progress"></span><button data-ui-part="action" data-action="remove">x</button></div>`);
  const a = $(d, "[data-ui=attachment]"); assert.equal(a.dataset.state, "uploading"); assert.equal($(d, "[data-ui-part=progress]").getAttribute("aria-valuenow"), "40");
  a.addEventListener("ui:remove", (e) => e.preventDefault(), { once: true }); $(d, "button").click(); assert.ok(a.isConnected); $(d, "button").click(); assert.ok(!a.isConnected);
});
test("chart: renders SVG from the table and keeps it as fallback", () => {
  const d = mount(`<figure data-ui="chart"><figcaption>V</figcaption><table><thead><tr><th>M</th><th>A</th></tr></thead><tbody><tr><td>J</td><td>3</td></tr><tr><td>F</td><td>5</td></tr></tbody></table></figure>`);
  assert.equal($$(d, "rect[data-ui-part=series]").length, 2); assert.equal($(d, "svg").getAttribute("role"), "img"); assert.equal($(d, "table").hidden, true);
  $(d, "[data-ui-part=table-toggle]").click(); assert.equal($(d, "table").hidden, false);
});
test("marker separator + spinner roles", () => {
  const d = mount(`<div data-ui="marker" data-variant="separator"><span data-ui-part="content">Yesterday</span></div><span data-ui="spinner"></span>`);
  assert.equal($(d, "[data-ui=marker]").getAttribute("role"), "separator"); assert.equal($(d, "[data-ui=marker]").getAttribute("aria-label"), "Yesterday");
  assert.equal($(d, "[data-ui=spinner]").getAttribute("role"), "status");
});
test("auth-form: validates only the visible view, switches views, emits submit", () => {
  const d = mount(`<form data-ui="auth-form" data-default-view="password" novalidate>
    <div data-ui-part="view" data-view="password" data-next="otp"><div data-ui="field"><label data-ui-part="label">E</label><input data-ui-part="control" name="email" type="email" required><p data-ui-part="error" hidden></p></div>
      <button type="button" data-ui-auth-view="forgot">f</button><button type="submit">Go</button></div>
    <div data-ui-part="view" data-view="forgot"><div data-ui="field"><input data-ui-part="control" name="email2" required></div></div>
    <div data-ui-part="view" data-view="otp">otp</div><p data-ui-part="status"></p></form>`);
  const f = $(d, "form"), [v1, v2, v3] = $$(d, "[data-ui-part=view]"); assert.equal(v2.hidden, true);
  let sub = 0; f.addEventListener("ui:submit", () => sub++);
  f.dispatchEvent(new w.Event("submit", { cancelable: true })); assert.equal(sub, 0); assert.equal($(v1, "input").getAttribute("aria-invalid"), "true");
  $(v1, "input").value = "bad"; f.dispatchEvent(new w.Event("submit", { cancelable: true })); assert.equal(sub, 0);
  $(v1, "input").value = "a@b.ge"; f.dispatchEvent(new w.Event("submit", { cancelable: true })); assert.equal(sub, 1); assert.equal(v3.hidden, false);
  $(v1, "[data-ui-auth-view]").click(); // hidden view: no-op target; use API
  f.__uiAuth.show("forgot"); assert.equal(v2.hidden, false); assert.equal(v1.hidden, true); assert.equal($(v1, "input").disabled, true);
});
test("auth-form: controls re-enable after passing through several hidden views", () => {
  const d = mount(`<form data-ui="auth-form" data-default-view="a"><div data-ui-part="view" data-view="a"><button type="button" id="x">x</button><button type="button" id="y" disabled>y</button></div><div data-ui-part="view" data-view="b"></div><div data-ui-part="view" data-view="c"></div></form>`);
  const api = $(d, "form").__uiAuth; api.show("b"); api.show("c"); api.show("a");
  assert.equal($(d, "#x").disabled, false); assert.equal($(d, "#y").disabled, true);
});

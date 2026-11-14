// Regressions for the Phase 1 items that each engineer left in the other's files (TODO.md "Accessibility" and
// "Component bugs"): listener and timer leaks, duplicate ids, the sidebar shortcut, out-of-range dates, localised
// chart numbers, a silent pager sync, right-to-left arrow keys and the axe findings in ai.js and base.js.
// Each test failed before its fix. Browser-only parts (layout, pointer, axe) are in test/e2e/.
import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html lang=\"en\"><body></body></html>", { url: "https://example.test/", pretendToBeVisual: true });
const { window } = dom;
Object.assign(globalThis, { window, document: window.document, CustomEvent: window.CustomEvent, Event: window.Event, MutationObserver: window.MutationObserver,
  HTMLElement: window.HTMLElement, getComputedStyle: window.getComputedStyle, localStorage: window.localStorage,
  requestAnimationFrame: window.requestAnimationFrame, location: window.location, __COLIBRI_UI_NO_AUTO__: true });

// count live listeners per target, to prove destroy() removes what the controller added
const live = new Map();
const add = window.EventTarget.prototype.addEventListener, rem = window.EventTarget.prototype.removeEventListener;
let ids = 0; const fid = (f) => (f.__lid ||= ++ids);
window.EventTarget.prototype.addEventListener = function (t, f, o) { if (f) { const s = live.get(this) || new Set(); s.add(`${t}|${fid(f)}`); live.set(this, s); } return add.call(this, t, f, o); };
window.EventTarget.prototype.removeEventListener = function (t, f, o) { if (f) live.get(this)?.delete(`${t}|${fid(f)}`); return rem.call(this, t, f, o); };
const count = (el) => live.get(el)?.size || 0;

const { registry } = await import("../src/core/registry.js");
const mount = (html) => { const host = document.createElement("div"); host.innerHTML = html; document.body.append(host); return host; };
const key = (el, k, init = {}) => { const e = new window.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }); el.dispatchEvent(e); return e; };
const tick = () => new Promise((r) => setTimeout(r, 0));

/* 1. listeners released on destroy */
test("menubar: destroy removes its listeners", () => {
  const h = mount(`<div data-ui="menubar"><div data-ui-part="menu"><button data-ui-part="trigger">File</button><div data-ui-part="content"><button data-ui-part="item">New</button></div></div></div>`);
  const m = h.querySelector("[data-ui-part=menu]"), t = h.querySelector("[data-ui-part=trigger]"), before = [count(m), count(t)];
  registry.menubar(h.firstElementChild).destroy();
  assert.deepEqual([count(m), count(t)], before);
});
test("scrollspy: destroy removes its click listener and cancels a pending frame", () => {
  const h = mount(`<aside data-ui="sidebar" id="sb"><nav data-ui="scrollspy"><a href="#s1">1</a></nav></aside><section id="s1">x</section>`);
  const box = h.querySelector("aside"), before = count(box);
  let frames = 0; const raf = window.requestAnimationFrame, caf = window.cancelAnimationFrame, cancelled = [];
  window.requestAnimationFrame = () => ++frames; window.cancelAnimationFrame = (id) => cancelled.push(id);
  try {
    const spy = registry.scrollspy(h.querySelector("nav"));
    window.dispatchEvent(new window.Event("scroll")); window.dispatchEvent(new window.Event("resize"));
    assert.equal(frames, 1, "one frame requested for the scroll");
    spy.destroy();
    assert.deepEqual(cancelled, [1], "the pending frame was not cancelled");
  } finally { window.requestAnimationFrame = raf; window.cancelAnimationFrame = caf; }
  assert.equal(count(box), before);
});

/* 2. navigation-menu ids */
test("navigation-menu: two menus without ids get distinct content ids", () => {
  const html = `<nav data-ui="navigation-menu"><ul><li data-ui-part="menu"><button data-ui-part="trigger">A</button><div data-ui-part="content">a</div></li></ul></nav>`;
  const h = mount(html + html); const [a, b] = h.querySelectorAll("nav"); registry["navigation-menu"](a); registry["navigation-menu"](b);
  const contents = [...h.querySelectorAll("[data-ui-part=content]")], triggers = [...h.querySelectorAll("[data-ui-part=trigger]")];
  assert.equal(new Set(contents.map((c) => c.id)).size, 2, JSON.stringify(contents.map((c) => c.id)));
  triggers.forEach((t, i) => assert.equal(document.getElementById(t.getAttribute("aria-controls")), contents[i]));
});

/* 3. tabs ids */
test("tabs: values with spaces give valid ids and IDREFs; generated ids never clash", () => {
  const h = mount(`<div id="ui-tabs-1"></div><div id="ui-tabs-2"></div><div data-ui="tabs"><div data-ui-part="list"><button data-ui-part="trigger" data-value="a b">A</button><button data-ui-part="trigger" data-value="a">A</button><button data-ui-part="trigger" data-value="a_20_b">C</button></div>
    <div data-ui-part="panel" data-value="a b">x</div><div data-ui-part="panel" data-value="a">y</div><div data-ui-part="panel" data-value="a_20_b">z</div></div>`);
  registry.tabs(h.querySelector("[data-ui=tabs]"));
  for (const t of h.querySelectorAll("[role=tab]")) {
    assert.doesNotMatch(t.id, /\s/); assert.doesNotMatch(t.getAttribute("aria-controls"), /\s/);
    assert.equal(document.getElementById(t.getAttribute("aria-controls"))?.dataset.value, t.dataset.value);
  }
  const all = [...document.querySelectorAll("[id]")].map((e) => e.id);
  assert.equal(all.length, new Set(all).size, "duplicate ids");
});

/* 4. sidebar shortcut */
test("sidebar: Ctrl/Cmd+B is left to text fields and editors, to Alt/Shift chords and to handled events", () => {
  const h = mount(`<aside data-ui="sidebar" id="side2"></aside><input id="ed"><textarea id="ta"></textarea><select id="se"><option>a</option></select>
    <div contenteditable="true" id="ce"><b id="ceb">x</b></div><div role="textbox" id="rt" tabindex="0">x</div>`);
  const s = registry.sidebar(h.querySelector("aside")), st0 = s.state;
  for (const id of ["ed", "ta", "se", "ceb", "rt"]) {
    const e = key(h.querySelector(`#${id}`), "b", { ctrlKey: true }); assert.equal(e.defaultPrevented, false, id); assert.equal(s.state, st0, id);
  }
  key(h.querySelector("#ce"), "b", { metaKey: true }); assert.equal(s.state, st0, "contenteditable");
  key(document.body, "b", { ctrlKey: true, altKey: true }); key(document.body, "B", { ctrlKey: true, shiftKey: true }); assert.equal(s.state, st0, "Alt/Shift chord");
  const handled = new window.KeyboardEvent("keydown", { key: "b", ctrlKey: true, bubbles: true, cancelable: true }); handled.preventDefault();
  document.body.dispatchEvent(handled); assert.equal(s.state, st0, "already handled");
  key(document.body, "b", { ctrlKey: true }); assert.notEqual(s.state, st0, "shortcut still works outside fields");
  s.destroy();
});
test("sidebar: data-shortcut picks the key and \"false\" turns it off", () => {
  const h = mount(`<aside data-ui="sidebar" id="side3" data-shortcut="k"></aside><aside data-ui="sidebar" id="side4" data-shortcut="false"></aside>`);
  const [k, off] = [...h.querySelectorAll("aside")].map((a) => registry.sidebar(a)); const k0 = k.state, off0 = off.state;
  key(document.body, "b", { ctrlKey: true }); assert.equal(k.state, k0); assert.equal(off.state, off0);
  key(document.body, "k", { metaKey: true }); assert.notEqual(k.state, k0); assert.equal(off.state, off0);
  k.destroy(); off.destroy();
});

/* 5. date picker */
const picker = (value, extra = "") => mount(`<div data-ui="date-picker"><input data-ui-part="input" value="${value}"><button data-ui-part="trigger">open</button>
  <div data-ui-part="content" hidden><div data-ui="calendar" data-min="2026-01-01" data-max="2026-12-31" ${extra}></div></div></div>`);
test("date-picker: an initial value outside data-min/data-max is not selected and is marked invalid", () => {
  const h = picker("2030-01-01"), dp = registry["date-picker"](h.firstElementChild);
  assert.equal(dp.value, null); assert.equal(h.querySelector("input").getAttribute("aria-invalid"), "true");
  assert.equal(h.querySelector("[data-selected]"), null);
  const ok = picker("2026-03-04"), dp2 = registry["date-picker"](ok.firstElementChild);
  assert.equal(dp2.value, "2026-03-04"); assert.equal(ok.querySelector("input").hasAttribute("aria-invalid"), false);
});
test("date-picker: the value setter rejects out-of-range and disabled days", () => {
  const h = picker("", 'data-disabled-weekdays="0"'), dp = registry["date-picker"](h.firstElementChild), input = h.querySelector("input");
  dp.value = "2026-05-05"; assert.equal(dp.value, "2026-05-05"); assert.equal(input.value, "2026-05-05");
  dp.value = "2027-02-02"; assert.equal(dp.value, null, "out of range"); assert.equal(input.value, "");
  dp.value = "2026-05-03"; assert.equal(dp.value, null, "a Sunday with Sundays disabled");
});
test("date-picker: a typed out-of-range value sets aria-invalid and the change event says valid: false", () => {
  const h = picker(""), dp = registry["date-picker"](h.firstElementChild), input = h.querySelector("input"), events = [];
  h.firstElementChild.addEventListener("ui:change", (e) => events.push(e.detail));
  input.value = "1999-01-01"; input.dispatchEvent(new window.Event("change", { bubbles: true }));
  assert.equal(dp.value, null); assert.equal(input.getAttribute("aria-invalid"), "true"); assert.deepEqual(events.at(-1), { value: null, valid: false });
  input.value = "not a date"; input.dispatchEvent(new window.Event("change", { bubbles: true })); assert.equal(events.at(-1).valid, false);
  input.value = "2026-06-01"; input.dispatchEvent(new window.Event("change", { bubbles: true }));
  assert.equal(dp.value, "2026-06-01"); assert.equal(input.hasAttribute("aria-invalid"), false); assert.deepEqual(events.at(-1), { value: "2026-06-01", valid: true });
});

/* 6. conversation chart numbers */
test("ai chart reads 1,200 as 1200 (and 1.200 as 1200 in German)", () => {
  for (const [lang, a, b] of [["en", "1,200", "600"], ["de", "1.200", "600"]]) {
    const h = mount(`<figure data-ui="chart" lang="${lang}"><table><thead><tr><th>Day</th><th>V</th></tr></thead><tbody><tr><td>a</td><td>${a}</td></tr><tr><td>b</td><td>${b}</td></tr></tbody></table></figure>`);
    registry.chart(h.firstElementChild);
    const bars = [...h.querySelectorAll("rect")].map((r) => Number(r.getAttribute("height")));
    assert.ok(bars.length >= 2 && Math.abs(bars[0] / bars[1] - 2) < 0.05, `${lang}: ${JSON.stringify(bars)}`);
  }
});

/* 7. pagination sync */
test("pagination: sync() sets page and total without an event or a focus change", () => {
  const h = mount(`<input id="q"><nav data-ui="pagination" data-total="5" data-page="4"></nav>`); const p = registry.pagination(h.querySelector("nav"));
  let ev = 0; h.addEventListener("ui:change", () => ev++); h.querySelector("#q").focus();
  p.sync({ page: 1, total: 3 }); assert.equal(p.page, 1); assert.equal(ev, 0); assert.equal(document.activeElement.id, "q");
  assert.equal(h.querySelectorAll("[data-ui-part=item]").length, 3);
  p.sync({ page: 9 }); assert.equal(p.page, 3, "clamped to total"); p.sync({ total: 0 }); assert.equal(p.page, 1, "total is at least 1");
  assert.equal(ev, 0);
});
test("datatable keeps its pager in step through sync(), never through a pager ui:change", () => {
  const rows = Array.from({ length: 25 }, (_, i) => `<tr><td>row ${i + 1}</td></tr>`).join("");
  const h = mount(`<div data-ui="datatable" data-page-size="5"><input data-ui-part="search"><table><thead><tr><th data-sort="name">Name</th></tr></thead><tbody>${rows}</tbody></table><nav data-ui="pagination" data-total="1"></nav></div>`);
  const pager = h.querySelector("[data-ui=pagination]"), root = h.firstElementChild; registry.pagination(pager); registry.datatable(root);
  const synced = []; const api = pager.__uiPagination, sync = api.sync.bind(api); api.sync = (x) => { synced.push(x); sync(x); };
  let changes = 0; pager.addEventListener("ui:change", () => changes++);
  for (let i = 0; i < 3; i++) pager.querySelector("[data-ui-part=next]").click();
  assert.equal(pager.querySelector("[aria-current=page]").dataset.page, "4"); changes = 0;
  const search = root.querySelector("[data-ui-part=search]"); search.value = "row 1"; search.dispatchEvent(new window.Event("input", { bubbles: true }));
  assert.deepEqual(synced.at(-1), { page: 1, total: 3 }); assert.equal(changes, 0, "the pager emitted ui:change while the table synced it");
  assert.equal(pager.querySelector("[aria-current=page]").dataset.page, "1");
});

/* 11. right-to-left arrow keys */
test("radio group and toolbar: ArrowLeft is next and ArrowRight previous in rtl; unchanged in ltr", () => {
  for (const dir of ["rtl", "ltr"]) {
    const h = mount(`<div dir="${dir}"><div data-ui="radio-group" aria-label="Size"><button data-ui-part="item" data-value="s">S</button><button data-ui-part="item" data-value="m">M</button><button data-ui-part="item" data-value="l">L</button></div>
      <div data-ui="toolbar" aria-label="Format"><button>Bold</button><button>Italic</button><button>Under</button></div></div>`);
    const rg = h.querySelector("[data-ui=radio-group]"), tb = h.querySelector("[data-ui=toolbar]"); const r = registry["radio-group"](rg); registry.toolbar(tb);
    const next = dir === "rtl" ? "ArrowLeft" : "ArrowRight", prev = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
    const [s] = rg.querySelectorAll("button"); s.focus(); key(s, next); assert.equal(r.value, "m", `${dir}: radio ${next}`);
    key(document.activeElement, prev); assert.equal(r.value, "s", `${dir}: radio ${prev}`);
    const [bold] = tb.querySelectorAll("button"); bold.focus(); key(bold, next); assert.equal(document.activeElement.textContent, "Italic", `${dir}: toolbar ${next}`);
    key(document.activeElement, prev); assert.equal(document.activeElement.textContent, "Bold", `${dir}: toolbar ${prev}`);
  }
});
test("slider: in rtl ArrowLeft increases and a press is measured from the right edge", () => {
  const h = mount(`<div dir="rtl"><div data-ui="slider" data-min="0" data-max="100" data-value="20"><div data-ui-part="track"></div><span data-ui-part="thumb" aria-label="V"></span></div></div>`);
  const root = h.querySelector("[data-ui=slider]"), thumb = root.querySelector("[data-ui-part=thumb]"), track = root.querySelector("[data-ui-part=track]");
  registry.slider(root);
  key(thumb, "ArrowLeft"); assert.equal(root.dataset.value, "21"); key(thumb, "ArrowRight"); key(thumb, "ArrowRight"); assert.equal(root.dataset.value, "19");
  key(thumb, "ArrowUp"); assert.equal(root.dataset.value, "20", "ArrowUp still increases");
  track.getBoundingClientRect = () => ({ left: 100, right: 300, top: 0, bottom: 20, width: 200, height: 20 });
  root.setPointerCapture = () => {}; root.releasePointerCapture = () => {};
  const PE = window.PointerEvent || window.MouseEvent;
  root.dispatchEvent(new PE("pointerdown", { bubbles: true, clientX: 250, clientY: 10, button: 0, pointerId: 1 }));
  root.dispatchEvent(new PE("pointerup", { bubbles: true, clientX: 250, clientY: 10, button: 0, pointerId: 1 }));
  assert.equal(root.dataset.value, "25", "50px from the right edge of a 200px track is 25");
});

/* 13. clipboard timer */
test("clipboard: destroy clears the pending reset timer; a second copy restarts it", async () => {
  const h = mount(`<button data-ui="clipboard" data-text="x" data-reset-ms="20">Copy</button>`), b = h.firstElementChild;
  const writes = []; Object.defineProperty(globalThis.navigator, "clipboard", { configurable: true, value: { writeText: async (t) => { writes.push(t); } } });
  const c = registry.clipboard(b); b.click(); await tick(); await tick();
  assert.equal(b.dataset.state, "copied"); c.destroy();
  await new Promise((r) => setTimeout(r, 40));
  assert.equal(b.dataset.state, "copied", "the reset timer fired after destroy");
  const h2 = mount(`<button data-ui="clipboard" data-text="y" data-reset-ms="30">Copy</button>`), b2 = h2.firstElementChild; registry.clipboard(b2);
  b2.click(); await tick(); await tick(); await new Promise((r) => setTimeout(r, 20)); b2.click(); await tick(); await tick();
  await new Promise((r) => setTimeout(r, 20)); assert.equal(b2.dataset.state, "copied", "the first copy's timer reset the second");
  await new Promise((r) => setTimeout(r, 30)); assert.equal(b2.dataset.state, "idle");
});

/* 14. axe findings in ai.js and base.js */
test("ai: attachment and questionnaire progress bars are named", () => {
  const h = mount(`<div data-ui="attachment" data-progress="35"><span data-ui-part="title">report.pdf</span><span data-ui-part="progress"></span></div>
    <form data-ui="questionnaire"><div data-ui-part="progress"></div><fieldset data-ui-part="item"><legend data-ui-part="title">Q1</legend><textarea data-ui-part="input"></textarea></fieldset></form>`);
  registry.attachment(h.querySelector("[data-ui=attachment]")); registry.questionnaire(h.querySelector("form"));
  const [a, q] = h.querySelectorAll("[role=progressbar]");
  assert.equal(document.getElementById(a.getAttribute("aria-labelledby"))?.textContent, "report.pdf");
  assert.equal(q.getAttribute("aria-label"), "Progress");
});
test("ai: a checkpoint with a restore button is a named group, not a separator", () => {
  const h = mount(`<div data-ui="checkpoint" data-id="cp"><span data-ui-part="label">Checkpoint 3</span><button data-ui-part="restore">Restore</button></div><div data-ui="checkpoint"><span data-ui-part="label">Plain</span></div>`);
  const [withButton, plain] = h.querySelectorAll("[data-ui=checkpoint]"); registry.checkpoint(withButton); registry.checkpoint(plain);
  assert.equal(withButton.getAttribute("role"), "group"); assert.equal(document.getElementById(withButton.getAttribute("aria-labelledby")).textContent, "Checkpoint 3");
  assert.equal(plain.getAttribute("role"), "separator");
});
test("ai: a reaction's accessible name contains its visible count and follows it", async () => {
  const h = mount(`<div data-ui="bubble"><div data-ui-part="content">Hi</div><div data-ui-part="reactions"><button data-ui-part="reaction" data-value="like" aria-label="Thumbs up">👍 <span data-ui-part="count">2</span></button><button data-ui-part="reaction" data-value="x">✓ OK</button></div></div>`);
  registry.bubble(h.firstElementChild); const [like, plain] = h.querySelectorAll("[data-ui-part=reaction]");
  assert.equal(like.getAttribute("aria-label"), "Thumbs up 2"); like.click(); assert.equal(like.getAttribute("aria-label"), "Thumbs up 3");
  like.querySelector("[data-ui-part=count]").textContent = "10"; await tick(); assert.equal(like.getAttribute("aria-label"), "Thumbs up 10", "count set by the app");
  assert.equal(plain.hasAttribute("aria-label"), false, "a reaction named by its text gets no aria-label");
});
test("base: theme switch keeps its visible text as its name; an icon-only switch gets a fallback name", () => {
  const h = mount(`<button data-ui="theme-switch" data-storage-key="t1">Theme: <span>light</span></button><button data-ui="theme-switch" data-storage-key="t2"><svg aria-hidden="true"></svg></button>`);
  const [text, icon] = h.querySelectorAll("button"); registry["theme-switch"](text); registry["theme-switch"](icon);
  assert.equal(text.hasAttribute("aria-label"), false); assert.equal(icon.getAttribute("aria-label"), "Toggle theme");
  text.click(); assert.equal(text.hasAttribute("aria-label"), false);
});
test("base: the message scroller's viewport is a keyboard stop", () => {
  const h = mount(`<div data-ui="message-scroller"><div data-ui-part="viewport"><p>a</p></div></div><div data-ui="message-scroller"><div data-ui-part="viewport" tabindex="-1"></div></div>`);
  const [a, b] = h.querySelectorAll("[data-ui=message-scroller]"); registry["message-scroller"](a); registry["message-scroller"](b);
  assert.equal(a.querySelector("[data-ui-part=viewport]").getAttribute("tabindex"), "0"); assert.equal(b.querySelector("[data-ui-part=viewport]").getAttribute("tabindex"), "-1", "an author's tabindex is kept");
});

/* carousel: arrow keys typed in a field inside a slide stay with the field */
test("carousel: arrow keys in a nested input are not taken for slide navigation", () => {
  const h = mount(`<div data-ui="carousel" aria-label="Featured"><div data-ui-part="viewport"><div data-ui-part="slide"><input id="cin"></div><div data-ui-part="slide">2</div></div></div>`);
  const root = h.firstElementChild; registry.carousel(root); const before = root.dataset.index;
  const e = key(h.querySelector("#cin"), "ArrowRight"); assert.equal(e.defaultPrevented, false); assert.equal(root.dataset.index, before);
  key(root.querySelector("[data-ui-part=viewport]"), "ArrowRight"); assert.equal(root.dataset.index, "1", "the viewport still navigates");
});

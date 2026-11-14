// Browser accessibility checks that jsdom cannot make: right-to-left layout and arrow keys, forced-colors focus
// outlines, reduced motion and more contrast with theme packs, and a hoverable tooltip with a real pointer.
// Run npm run build first.
import assert from "node:assert/strict";
import fs from "node:fs";
import puppeteer from "puppeteer-core";
import { serveBuild } from "./server.mjs";

const executablePath = process.env.CHROME || ["/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(fs.existsSync);
const server = await serveBuild();
const browser = await puppeteer.launch({ executablePath, args: ["--no-sandbox"] });
const errors = [];
const FIXTURE = (dir) => `<!doctype html><html lang="en" dir="${dir}" data-theme="light"><head><meta charset="utf-8">
<link rel="stylesheet" href="/ui/themes/colibri.css"><link rel="stylesheet" href="/ui/themes/packs/index.css"></head>
<body class="ui-root" style="margin:0;padding:40px">
<div data-ui="tabs" id="tabs"><div data-ui-part="list"><button data-ui-part="trigger" data-value="a">A</button><button data-ui-part="trigger" data-value="b">B</button><button data-ui-part="trigger" data-value="c">C</button></div>
  <div data-ui-part="panel" data-value="a">a</div><div data-ui-part="panel" data-value="b">b</div><div data-ui-part="panel" data-value="c">c</div></div>
<div data-ui="menubar" id="bar"><div data-ui-part="menu"><button data-ui-part="trigger">File</button><div data-ui-part="content"><button data-ui-part="item" data-type="checkbox" aria-checked="true">Grid</button>
  <div data-ui-part="sub"><button data-ui-part="sub-trigger">More</button><div data-ui-part="sub-content" hidden><button data-ui-part="item">Deep</button></div></div></div></div>
  <div data-ui-part="menu"><button data-ui-part="trigger">Edit</button><div data-ui-part="content"><button data-ui-part="item">Undo</button></div></div></div>
<div data-ui="carousel" id="car" aria-label="Featured"><div data-ui-part="viewport"><div data-ui-part="slide">1</div><div data-ui-part="slide">2</div><div data-ui-part="slide">3</div></div><button data-ui-part="prev" aria-label="Previous">‹</button><button data-ui-part="next" aria-label="Next">›</button><div data-ui-part="dots"></div></div>
<div data-ui="calendar" id="cal" data-value="2026-10-14" data-locale="en"></div>
<button data-ui="switch" id="sw" aria-label="Wifi" aria-checked="true"></button>
<div data-ui="tooltip" id="tip" data-delay="0"><button data-ui-part="trigger">Info</button><div data-ui-part="content">A longer tooltip text</div></div>
<script type="module">import { init } from "/ui/src/core/index.js"; init(document); window.__ready = true;</script>
</body></html>`;

async function load(page, dir) {
  await page.setRequestInterception(true);
  page.removeAllListeners("request");
  page.on("request", (r) => (r.url() === `${server.origin}/fixture.html` ? r.respond({ contentType: "text/html", body: FIXTURE(dir) }) : r.continue()));
  await page.goto(`${server.origin}/fixture.html`, { waitUntil: "networkidle0" });
  await page.waitForFunction(() => window.__ready);
}
const active = (page) => page.evaluate(() => document.activeElement?.textContent.trim() || document.activeElement?.dataset.date || "");
const box = (page, sel) => page.$eval(sel, (e) => { const r = e.getBoundingClientRect(); return { left: r.left, right: r.right, cx: r.left + r.width / 2 }; });

try {
  const page = await browser.newPage(); await page.setViewport({ width: 1000, height: 1400 });
  page.on("pageerror", (e) => errors.push(e.message));
  const index = await page.evaluate(() => 0);
  assert.equal(index, 0);

  // ---- right to left ----
  await load(page, "rtl");
  // layout mirrors
  const car = await box(page, "#car"), prev = await box(page, "#car [data-ui-part=prev]"), next = await box(page, "#car [data-ui-part=next]");
  assert.ok(prev.cx > car.cx && next.cx < car.cx, "carousel: previous on the right, next on the left");
  const t = await page.$$eval("#tabs [data-ui-part=trigger]", (ts) => ts.map((e) => e.getBoundingClientRect().left));
  assert.ok(t[0] > t[1] && t[1] > t[2], "tabs run right to left");
  const cal = await page.$$eval("#cal [data-ui-part=prev], #cal [data-ui-part=next]", (bs) => bs.map((e) => e.getBoundingClientRect().left));
  assert.ok(cal[0] > cal[1], "calendar: previous month button on the right");
  const sw = await page.$eval("#sw", (e) => { const r = e.getBoundingClientRect(), a = getComputedStyle(e, "::after"); return { mid: r.left + r.width / 2, transform: a.transform }; });
  assert.match(sw.transform, /matrix\(1, 0, 0, 1, -16, 0\)/, "switch thumb moves toward the left when on");
  // arrow keys
  await page.focus("#tabs [data-value=a]"); await page.keyboard.press("ArrowLeft"); assert.equal(await active(page), "B", "tabs: ArrowLeft = next");
  await page.focus("#bar [data-ui-part=trigger]"); await page.keyboard.press("ArrowLeft"); assert.equal(await active(page), "Edit", "menubar: ArrowLeft = next");
  await page.keyboard.press("ArrowRight"); assert.equal(await active(page), "File");
  await page.keyboard.press("ArrowDown"); assert.equal(await active(page), "Grid");
  const check = await page.$eval("#bar [data-type=checkbox]", (e) => { const r = e.getBoundingClientRect(), b = getComputedStyle(e, "::before"); return { right: r.right, mark: parseFloat(b.right) }; });
  assert.ok(check.mark < 20, "menu: check mark sits at the start (right) edge");
  await page.keyboard.press("ArrowDown"); assert.equal(await active(page), "More");
  await page.keyboard.press("ArrowLeft"); assert.equal(await active(page), "Deep", "submenu opens with ArrowLeft");
  const sub = await box(page, "#bar [data-ui-part=sub-content]"), st = await box(page, "#bar [data-ui-part=sub-trigger]");
  assert.ok(sub.right <= st.left + 1, "submenu opens to the left");
  await page.keyboard.press("ArrowRight"); assert.equal(await active(page), "More", "ArrowRight closes the submenu");
  await page.keyboard.press("Escape"); assert.equal(await active(page), "File", "Escape returns focus to the trigger");
  await page.focus("#car [data-ui-part=viewport]"); await page.keyboard.press("ArrowLeft");
  assert.equal(await page.$eval("#car", (e) => e.dataset.index), "1", "carousel: ArrowLeft = next slide");
  await page.focus('#cal [data-date="2026-10-14"]'); await page.keyboard.press("ArrowLeft"); assert.equal(await active(page), "15", "calendar: ArrowLeft = next day");
  console.log("ok RTL: tabs, menubar, menu marks and submenu, carousel, calendar and switch mirror layout and arrow keys");

  // ---- forced colors: every themed focus is a real outline ----
  await load(page, "ltr");
  await page.emulateMediaFeatures([{ name: "forced-colors", value: "active" }]);
  for (const sel of ["#tabs [data-value=a]", "#bar [data-ui-part=trigger]", "#car [data-ui-part=viewport]", '#cal [data-date="2026-10-14"]', "#sw", "#tip [data-ui-part=trigger]"]) {
    await page.keyboard.press("Shift"); await page.focus(sel);
    const o = await page.$eval(sel, (e) => { const s = getComputedStyle(e); return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) }; });
    assert.ok(o.style !== "none" && o.width >= 2, `forced colors: ${sel} focus has an outline (${o.style} ${o.width})`);
  }
  await page.focus("#bar [data-ui-part=trigger]"); await page.keyboard.press("ArrowDown");
  const item = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return { text: document.activeElement.textContent, style: s.outlineStyle }; });
  assert.notEqual(item.style, "none", "forced colors: focused menu item has an outline"); await page.keyboard.press("Escape");
  await page.emulateMediaFeatures([]);
  console.log("ok forced colors: tabs, menubar, menu items, carousel, calendar, switch and tooltip trigger show an outline on focus");

  // ---- tooltip: a real pointer can move from the trigger onto the tooltip (WCAG 1.4.13) ----
  const tr = await page.$eval("#tip [data-ui-part=trigger]", (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await page.mouse.move(tr.x, tr.y); await page.waitForFunction(() => !document.querySelector("#tip [data-ui-part=content]").hidden);
  const tc = await page.$eval("#tip [data-ui-part=content]", (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await page.mouse.move(tc.x, tc.y, { steps: 8 }); await new Promise((r) => setTimeout(r, 300));
  assert.equal(await page.$eval("#tip [data-ui-part=content]", (e) => e.hidden), false, "tooltip stays open under the pointer");
  await page.keyboard.press("Escape"); assert.equal(await page.$eval("#tip [data-ui-part=content]", (e) => e.hidden), true, "Esc dismisses it");
  console.log("ok tooltip is hoverable with a real pointer and dismissable with Esc");

  // ---- packs keep reduced motion and more contrast ----
  for (const pack of ["ember", "glacier", "midnight"]) {
    await page.goto(`${server.origin}/css/colibri.css`);
    await page.setContent(`<!doctype html><html data-kit-theme="${pack}"><head><link rel="stylesheet" href="${server.origin}/css/colibri.css"><link rel="stylesheet" href="${server.origin}/ui/themes/colibri.css"><link rel="stylesheet" href="${server.origin}/ui/themes/packs/${pack}.css"></head><body></body></html>`, { waitUntil: "load" });
    const read = () => page.evaluate(() => { const s = getComputedStyle(document.documentElement); const v = (n) => s.getPropertyValue(n).trim(); return { dur: v("--c-dur"), line: v("--c-line"), muted: v("--c-muted"), control: v("--c-control-line"), border: v("--ui-border"), uiMuted: v("--ui-muted-foreground") }; });
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    assert.equal((await read()).dur, "0ms", `${pack}: reduced motion zeroes --c-dur`);
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    assert.notEqual((await read()).dur, "0ms", `${pack}: its own motion otherwise`);
    await page.emulateMediaFeatures([{ name: "prefers-contrast", value: "more" }]);
    const c = await read();
    assert.equal(c.line, c.muted, `${pack}: more contrast darkens --c-line`); assert.equal(c.border, c.uiMuted, `${pack}: and --ui-border`);
    await page.evaluate(() => { document.documentElement.dataset.theme = "dark"; });
    const d = await read(); assert.equal(d.border, d.uiMuted, `${pack}: also in dark mode`);
    await page.emulateMediaFeatures([]);
  }
  console.log("ok theme packs keep prefers-reduced-motion and prefers-contrast: more");
  assert.deepEqual(errors, []);
} finally { await browser.close(); await server.close(); }

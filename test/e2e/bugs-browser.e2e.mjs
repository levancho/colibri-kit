// Browser regressions for the "Component bugs" list in TODO.md. Runs against the built site (npm run build first).
// Each check loads a small fixture page that imports the built core modules from /ui/src/core/.
// Usage: node test/e2e/bugs-browser.e2e.mjs [name-filter]
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";

const dist = path.resolve("site/dist");
if (!fs.existsSync(path.join(dist, "ui/src/core/dialog.js"))) throw new Error("site/dist is missing: run npm run build first");
const fixtures = new Map();
const mime = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml" };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const fixture = fixtures.get(url.pathname);
  if (fixture) { res.writeHead(200, { "Content-Type": "text/html", ...(fixture.headers || {}) }); res.end(fixture.html); return; }
  const file = path.resolve(dist, "." + url.pathname);
  if (path.relative(dist, file).startsWith("..") || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
  res.setHeader("Content-Type", mime[path.extname(file)] || "application/octet-stream");
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let n = 0;
/** Serve `body` with `script` (a module importing from /ui/src/core/) and return its URL. */
function page(body, script = "", { head = "", headers } = {}) {
  const p = `/__bugs/${++n}.html`;
  fixtures.set(p, { headers, html: `<!doctype html><html lang="en"><head><meta charset="utf-8">${head}<link rel="stylesheet" href="/ui/themes/colibri.css"></head><body>${body}<script type="module" nonce="t3st">${script}\nwindow.__ready = true;</script></body></html>` });
  return origin + p;
}
const chrome = process.env.CHROME || ["/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(fs.existsSync);
const browser = await puppeteer.launch({ executablePath: chrome, args: ["--no-sandbox"] });
const filter = process.argv[2] || "";
const checks = [];
const check = (name, fn) => checks.push({ name, fn });
async function open(url, viewport = { width: 1000, height: 800 }) {
  const p = await browser.newPage(); await p.setViewport(viewport);
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(url); await p.waitForFunction(() => window.__ready);
  p.errors = errors; return p;
}

/* 1. Confirm dialogs cannot be escaped by repeated Esc (Chrome closes a dialog after repeated cancelled `cancel`s). */
const dialogFixture = (attrs) => page(`<div data-ui="dialog" id="d" ${attrs}><button data-ui-part="trigger" id="t">Open</button>
  <dialog data-ui-part="content"><h2 data-ui-part="title">Sure?</h2><button id="inside">Inside</button><button data-ui-part="close">Cancel</button></dialog></div>`,
  `import { createDialog } from "/ui/src/core/dialog.js"; const d = document.getElementById("d"); window.api = createDialog(d);
   window.closes = 0; d.addEventListener("ui:close", () => window.closes++);
   if (d.dataset.veto) d.addEventListener("ui:beforeclose", (e) => e.preventDefault());`);
for (const [label, attrs] of [["alert-dialog", 'data-variant="alert"'], ["vetoed ui:beforeclose", 'data-veto="1"']]) {
  check(`dialog: ${label} survives repeated Escape`, async () => {
    const p = await open(dialogFixture(attrs));
    await p.click("#t");
    for (let i = 0; i < 6; i++) { await p.keyboard.press("Escape"); await new Promise((r) => setTimeout(r, 30)); }
    assert.equal(await p.$eval("dialog", (d) => d.open), true, "dialog closed by Escape");
    assert.equal(await p.evaluate(() => window.closes), 0);
    // focus on the body (click inside the dialog's padding) must not let Escape through either
    await p.evaluate(() => document.activeElement.blur());
    for (let i = 0; i < 4; i++) await p.keyboard.press("Escape");
    assert.equal(await p.$eval("dialog", (d) => d.open), true, "dialog closed by Escape with nothing focused");
    await p.click('[data-ui-part="close"]');
    if (label.startsWith("alert")) assert.equal(await p.$eval("dialog", (d) => d.open), false, "explicit close still works");
    await p.close();
  });
}
check("dialog: dismissible modal still closes on one Escape and returns focus", async () => {
  const p = await open(dialogFixture(""));
  await p.click("#t"); await p.keyboard.press("Escape");
  assert.equal(await p.$eval("dialog", (d) => d.open), false);
  assert.equal(await p.evaluate(() => document.activeElement.id), "t");
  await p.close();
});

/* 2. Non-modal dialog: Escape and outside click close it; focus returns to the trigger. */
const nonModal = (attrs = "") => page(`<button id="before">Before</button><div data-ui="dialog" data-modal="false" id="d" ${attrs}><button data-ui-part="trigger" id="t">Open</button>
  <dialog data-ui-part="content"><h2 data-ui-part="title">Panel</h2><input id="field"><button data-ui-part="close">Close</button></dialog></div><p id="out" style="margin-top:400px">outside</p>`,
  `import { createDialog } from "/ui/src/core/dialog.js"; window.api = createDialog(document.getElementById("d"));`);
check("dialog: non-modal closes on Escape, focus returns to trigger", async () => {
  const p = await open(nonModal());
  await p.click("#t"); await p.focus("#field"); await p.keyboard.press("Escape");
  assert.equal(await p.$eval("dialog", (d) => d.open), false, "Escape did not close the non-modal dialog");
  assert.equal(await p.evaluate(() => document.activeElement.id), "t");
  await p.close();
});
check("dialog: non-modal closes on outside click unless data-close-on-outside=false", async () => {
  let p = await open(nonModal());
  await p.click("#t"); await p.click("#out");
  assert.equal(await p.$eval("dialog", (d) => d.open), false, "outside click did not close the non-modal dialog");
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(await p.evaluate(() => document.activeElement.tagName + "#" + document.activeElement.id), "BUTTON#t");
  await p.click("#t"); assert.equal(await p.$eval("dialog", (d) => d.open), true, "trigger reopens");
  await p.click("#field"); assert.equal(await p.$eval("dialog", (d) => d.open), true, "inside click keeps it open");
  await p.click("#t"); assert.equal(await p.$eval("dialog", (d) => d.open), true, "trigger click while open keeps it open");
  await p.close();
  p = await open(nonModal('data-close-on-outside="false"'));
  await p.click("#t"); await p.click("#out");
  assert.equal(await p.$eval("dialog", (d) => d.open), true, "data-close-on-outside=false was ignored");
  await p.close();
});

/* 3. Sortable: controls inside items are clickable; a real mouse drag still reorders. */
check("sortable: buttons and checkboxes inside items can be clicked; drag still reorders", async () => {
  const p = await open(page(`<ul data-ui="sortable" id="s" style="list-style:none;padding:0;width:300px">${["a", "b", "c"].map((v) =>
    `<li data-ui-part="item" data-value="${v}" style="height:40px;border:1px solid">${v.toUpperCase()} <button type="button" id="b-${v}">Edit</button> <input type="checkbox" id="c-${v}"></li>`).join("")}</ul>`,
  `import { createSortable } from "/ui/src/core/forms.js"; window.api = createSortable(document.getElementById("s"));
   window.clicked = []; document.addEventListener("click", (e) => window.clicked.push(e.target.id));`));
  await p.click("#b-a"); await p.click("#c-b");
  assert.deepEqual(await p.evaluate(() => window.clicked), ["b-a", "c-b"], "clicks inside items were swallowed");
  assert.equal(await p.$eval("#c-b", (c) => c.checked), true, "checkbox inside an item did not toggle");
  const a = await p.$eval("[data-value=a]", (el) => { const r = el.getBoundingClientRect(); return { x: r.x + 10, y: r.y + 20 }; });
  await p.mouse.move(a.x, a.y); await p.mouse.down();
  const end = await p.$eval("[data-value=c]", (el) => { const r = el.getBoundingClientRect(); return r.bottom - 4; });
  for (let y = a.y; y <= end; y += 10) await p.mouse.move(a.x, y);
  await p.mouse.move(a.x, end);
  await p.mouse.up();
  assert.deepEqual(await p.evaluate(() => window.api.order), ["b", "c", "a"]);
  await p.close();
});

/* 11. CSP: motion.register() works under a strict Content-Security-Policy (no 'unsafe-inline' styles). */
const strict = { "Content-Security-Policy": "default-src 'self'; script-src 'self' 'nonce-t3st'; style-src 'self'; object-src 'none'; base-uri 'none'" };
const cspPage = (setup = "", policy = strict) => page(`<div id="box" data-ui-motion="swing">Box</div><div id="exit" data-ui-motion="swing">Exit</div>`,
  `${setup}
   window.violations = []; document.addEventListener("securitypolicyviolation", (e) => window.violations.push(e.violatedDirective + " " + e.blockedURI));
   const { register, initMotion } = await import("/ui/src/core/motion.js");
   register("swing", { in: [{ transform: "rotate(-8deg)", opacity: 0 }, {}], out: [{}, { opacity: 0, transform: "rotate(8deg)" }] }, document);
   initMotion();`,
  { head: '<meta property="csp-nonce" nonce="t3st"><link rel="stylesheet" href="/ui/themes/motion.css">', headers: policy });
async function motionWorks(p) {
  const vars = await p.$eval("#box", (el) => [getComputedStyle(el).getPropertyValue("--ui-motion-in").trim(), getComputedStyle(el).getPropertyValue("--ui-motion-out").trim()]);
  assert.deepEqual(vars, ["ui-swing-in", "ui-swing-out"], "registered preset styles were blocked");
  await p.$eval("#exit", (el) => { el.hidden = true; });
  const names = await p.evaluate(() => [...document.querySelectorAll("[data-motion-ghost]")].flatMap((g) => g.getAnimations().map((a) => a.animationName)));
  assert.ok(names.includes("ui-swing-out"), `exit animation did not run: ${JSON.stringify(names)}`);
  assert.deepEqual(await p.evaluate(() => window.violations), [], "CSP violations");
}
check("csp: motion.register() works under a strict policy (constructed stylesheet)", async () => {
  const p = await open(cspPage());
  await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  await p.reload(); await p.waitForFunction(() => window.__ready);
  await motionWorks(p);
  assert.equal(await p.evaluate(() => document.querySelectorAll("style").length), 0, "a <style> element was injected");
  await p.close();
});
check("csp: without constructable stylesheets the fallback <style> carries the page nonce", async () => {
  // the fallback needs the nonce in style-src too (docs/csp.md); the first check proves adopted sheets need none
  const p = await open(cspPage(`delete Document.prototype.adoptedStyleSheets;`, { "Content-Security-Policy": strict["Content-Security-Policy"].replace("style-src 'self'", "style-src 'self' 'nonce-t3st'") }));
  assert.equal(await p.evaluate(() => "adoptedStyleSheets" in document), false);
  await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  await p.reload(); await p.waitForFunction(() => window.__ready);
  await motionWorks(p);
  assert.equal(await p.evaluate(() => document.getElementById("ui-motion-registry")?.nonce), "t3st");
  await p.close();
});

/* run */
let failed = 0;
try {
  for (const { name, fn } of checks) {
    if (filter && !name.includes(filter)) continue;
    try { await fn(); console.log(`ok ${name}`); } catch (e) { failed++; console.log(`not ok ${name}\n  ${e.message.split("\n").join("\n  ")}`); }
  }
} finally { await browser.close(); server.close(); }
if (failed) { console.log(`${failed} browser bug check(s) failed`); process.exit(1); }
console.log("ok bug regressions in Chrome");

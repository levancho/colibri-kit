// Self-contained browser regressions for the built site and distributed CSS.
// Run npm run build first; CHROME can point at an installed Chrome executable.
import assert from "node:assert/strict";
import fs from "node:fs";
import puppeteer from "puppeteer-core";
import { serveBuild } from "./server.mjs";
const server = await serveBuild();
const { origin } = server;
const executablePath = process.env.CHROME || ["/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(fs.existsSync);
let browser;
try {
  browser = await puppeteer.launch({ executablePath, args: ["--no-sandbox"] });
  const page = await browser.newPage(), errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [320, 768, 1440]) {
    await page.setViewport({ width, height: 900 });
    await page.goto(origin, { waitUntil: "networkidle0" });
    assert.equal(await page.$eval("dialog", (e) => getComputedStyle(e).display), "none", "closed .card.stack dialog stays hidden");
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no horizontal overflow at ${width}px`);
    await page.click('.live [data-ui="dialog"] [data-ui-part="trigger"]');
    const box = await page.$eval("dialog", (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
    assert.ok(Math.abs(box.x + box.width / 2 - width / 2) < 2, "modal horizontally centered");
    assert.ok(Math.abs(box.y + box.height / 2 - 450) < 2, "modal vertically centered");
    await page.keyboard.press("Escape");
    assert.equal(await page.$eval("dialog", (e) => e.open), false);
    assert.equal(await page.evaluate(() => document.activeElement.textContent), "Invite");
  }
  console.log("ok responsive landing page, closed dialogs, modal placement and focus return (3 widths)");

  // Real CSS cascade, using both distributed builds. JSDOM cannot validate this.
  for (const css of ["colibri.css", "colibri.min.css"]) {
    await page.setContent(`<link rel="stylesheet" href="${origin}/css/${css}">
      <section id="global"><button class="btn">Global</button></section>
      <section id="scope" data-colibri-theme style="--c-hue:20"><button class="btn">Scoped</button></section>
      <section data-theme="dark"><button id="dark" class="btn">Dark</button><input id="field" aria-label="Field"></section>
      <dialog class="card stack">Closed</dialog>`);
    await page.waitForFunction(() => getComputedStyle(document.querySelector(".btn")).display === "inline-flex");
    await page.waitForFunction(() => getComputedStyle(document.querySelector("#global .btn")).backgroundColor !== getComputedStyle(document.querySelector("#scope .btn")).backgroundColor);
    const palette = await page.evaluate(() => {
      const style = (s) => getComputedStyle(document.querySelector(s));
      return { global: style("#global .btn").backgroundColor, scoped: style("#scope .btn").backgroundColor,
        darkText: style("#dark").color, hidden: style("dialog").display };
    });
    assert.notEqual(palette.global, palette.scoped, "local hue rebinds derived palette");
    assert.match(palette.darkText, /oklch\(0\.18 /, "dark primary button uses dark foreground");
    assert.equal(palette.hidden, "none");
    await page.emulateMediaFeatures([{ name: "forced-colors", value: "active" }]);
    await page.focus("#field");
    assert.notEqual(await page.$eval("#field", (e) => getComputedStyle(e).outlineStyle), "none", "forced-colors focus remains visible");
    await page.emulateMediaFeatures([]);
  }
  console.log("ok full + minified CSS: scoped palette, dark foreground, forced-colors focus");

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Blocked", "SecurityError"); } });
    Object.defineProperty(navigator, "clipboard", { value: { writeText: async () => { throw new Error("Denied"); } } });
  });
  await page.goto(origin, { waitUntil: "networkidle0" });
  await page.click('#ct-install [data-value="react"]');
  assert.equal(await page.$eval("#ct-dialog", (e) => e.dataset.value), "react", "language sync works without storage");
  await page.click("#theme");
  assert.ok(await page.$eval("html", (e) => e.dataset.theme));
  await page.click('#ct-install [data-ui-part="panel"][data-value="react"] [data-copy]');
  await page.waitForFunction(() => document.getElementById("site-status").textContent.includes("Clipboard unavailable"));
  assert.deepEqual(errors, [], "no uncaught errors");
  console.log("ok blocked storage + clipboard: theme, tab sync and copy feedback remain usable");
} finally {
  await browser?.close();
  await server.close();
}

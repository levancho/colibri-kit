import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";
import { serveBuild } from "./server.mjs";
const server = await serveBuild();
let browser;
try {
  browser = await puppeteer.launch({ executablePath: process.env.CHROME || ["/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(fs.existsSync), args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  for (const width of [320, 1100]) for (const mode of ["light", "dark"]) for (const pack of ["", "glacier", "ember", "midnight"]) {
    await page.setViewport({ width, height: 850 });
    await page.setContent(`<!doctype html><html data-theme="${mode}" ${pack ? `data-kit-theme="${pack}"` : ""}><head>
      <link rel="stylesheet" href="${server.origin}/ui/themes/colibri.css">
      <link rel="stylesheet" href="${server.origin}/ui/themes/packs/index.css">
      <link rel="stylesheet" href="${server.origin}/ui/themes/knobs.css">
      <style>body{margin:0;padding:24px;background:var(--ui-background);color:var(--ui-foreground);font:14px/1.6 var(--ui-font)}main{max-width:900px;margin:auto;display:grid;gap:32px}h1{font-size:28px;margin:0}h2{font-size:18px}section{min-width:0}</style></head><body class="ui-root"><main>
      <header><small>COLIBRI KIT · ${pack || "CORE"} · ${mode.toUpperCase()}</small><h1>Components that read clearly.</h1></header>
      <section><h2>Accordion</h2><div id="accordion" data-ui="accordion">
        <div data-ui-part="item"><h3><button data-ui-part="trigger" aria-expanded="true">How does Colibri work?</button></h3>
          <div data-ui-part="content">Use semantic HTML for content, CSS tokens for design, and small controllers for behavior.
            <div data-ui="popover"><button id="nested" data-ui-part="trigger">Open details</button></div></div></div>
        <div data-ui-part="item"><button id="direct" data-ui-part="trigger" aria-expanded="false">Can I use my own theme?</button><div data-ui-part="content" hidden>Yes.</div></div>
        <div data-ui-part="item"><button data-ui-part="trigger" disabled aria-expanded="false">Unavailable option</button><div data-ui-part="content" hidden>Unavailable.</div></div>
      </div></section>
      <section><h2>Tabs</h2><div id="tabs" data-ui="tabs"><div data-ui-part="list" role="tablist">
        <button data-ui-part="trigger" role="tab" data-state="active" aria-selected="true">Overview</button>
        <button data-ui-part="trigger" role="tab" aria-selected="false">Implementation details</button>
        <button data-ui-part="trigger" role="tab" aria-selected="false" disabled>Unavailable</button></div>
        <div data-ui-part="panel">A clear selected state, readable labels, and content aligned to the same grid.</div></div></section>
      </main></body></html>`);
    await page.waitForFunction(() => getComputedStyle(document.querySelector("#accordion")).display === "grid");
    const check = async () => {
      const result = await page.evaluate(() => {
        const a = document.querySelector('#accordion > [data-ui-part=item] > h3 > button');
        const d = document.getElementById("direct"), t = document.querySelector('#tabs [role=tab]');
        const nested = document.getElementById("nested"), rail = document.querySelector('#tabs [role=tablist]');
        return { weight: getComputedStyle(a).fontWeight, family: getComputedStyle(a).fontFamily, font: getComputedStyle(a).font, directFont: getComputedStyle(d).font, height: a.getBoundingClientRect().height,
          tabHeight: t.getBoundingClientRect().height, nestedAfter: getComputedStyle(nested, "::after").content,
          overflow: document.documentElement.scrollWidth > innerWidth, railWidth: rail.getBoundingClientRect().width,
          tabWidth: document.getElementById("tabs").getBoundingClientRect().width };
      });
      assert.equal(result.weight, "500", "accordion typography is explicit, independent of heading defaults");
      assert.ok(!result.family.includes("Times New Roman"), "core font token resolves to a usable family");
      assert.equal(result.font, result.directFont, "heading and direct triggers use the same type");
      assert.ok(result.height >= 44, "accordion target >= 44px");
      assert.ok(result.tabHeight >= 40, "tab target >= 40px");
      assert.ok(!result.overflow, `${pack || "core"}/${mode}/${width}: viewport overflow`);
      assert.ok(result.railWidth <= result.tabWidth + 1, "tabs scroll within their rail");
      assert.ok(["none", "normal"].includes(result.nestedAfter), "nested popover does not inherit accordion chevron");
    };
    await check();
    for (const look of ["fat", "boxed", "skinny"]) {
      await page.$eval("#accordion", (e, look) => e.dataset.look = look, look);
      await check();
    }
    await page.$eval("#accordion", (e) => delete e.dataset.look);
    for (const look of ["underline", "pill", "segmented"]) {
      await page.$eval("#tabs", (e, look) => e.dataset.look = look, look);
      await check();
    }
    await page.$eval("#tabs", (e) => delete e.dataset.look);
    if (process.env.COLIBRI_SHOTS && width === 1100) {
      fs.mkdirSync(process.env.COLIBRI_SHOTS, { recursive: true });
      await page.screenshot({ path: path.join(process.env.COLIBRI_SHOTS, `${pack || "core"}-${mode}.png`), fullPage: true });
    }
  }
  if (process.env.COLIBRI_SHOTS) {
    await page.setViewport({ width: 1100, height: 850 });
    await page.goto(`${server.origin}/kitchen-sink/examples/kitchen-sink.html#accordion`, { waitUntil: "networkidle0" });
    await page.$eval("#accordion", (e) => e.scrollIntoView({ block: "start" }));
    await page.screenshot({ path: path.join(process.env.COLIBRI_SHOTS, "core-accordion-gallery.png") });
  }
  console.log("ok navigation styles: core + 3 packs × light/dark × 320/1100px, plus 6 component looks and nested ownership");
} finally { await browser?.close(); await server.close(); }

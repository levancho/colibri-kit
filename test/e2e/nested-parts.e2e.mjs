// A container's part rules must not reach the same-named parts of components nested inside it.
// Regression: the sidebar's [data-ui-part=header] grid rule turned a nested calendar's header into a column.
import assert from "node:assert/strict";
import fs from "node:fs";
import puppeteer from "puppeteer-core";
import { serveBuild } from "./server.mjs";
const server = await serveBuild();
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || ["/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(fs.existsSync), args: ["--no-sandbox"] });
try {
  const page = await browser.newPage(); await page.setViewport({ width: 1280, height: 900 });
  await page.goto(server.origin + "/kitchen-sink/examples/kitchen-sink.html#sidebar-12");
  await page.waitForFunction(() => document.querySelector("#sb12 [data-ui=calendar] [data-ui-part=header] [data-ui-part=next]"));
  const header = await page.$eval("#sb12 [data-ui=calendar] [data-ui-part=header]", (h) => {
    const box = (sel) => h.querySelector(sel).getBoundingClientRect();
    return { display: getComputedStyle(h).display, prevTop: box("[data-ui-part=prev]").top, nextTop: box("[data-ui-part=next]").top, prevRight: box("[data-ui-part=prev]").right, nextLeft: box("[data-ui-part=next]").left };
  });
  assert.equal(header.display, "flex", "the calendar header keeps its own layout inside a sidebar");
  assert.ok(Math.abs(header.prevTop - header.nextTop) < 2 && header.prevRight < header.nextLeft, `previous and next sit on one row: ${JSON.stringify(header)}`);
  // The sidebar's own header still gets its layout.
  assert.equal(await page.$eval("#sb12 > [data-ui-part=header], [data-ui=sidebar] > [data-ui-part=header]", (h) => getComputedStyle(h).display), "grid");
  console.log("ok nested parts: a sidebar does not restyle the parts of components inside it");
} finally { await browser.close(); await server.close(); }

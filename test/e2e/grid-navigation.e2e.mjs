import assert from "node:assert/strict";
import fs from "node:fs";
import puppeteer from "puppeteer-core";
import { serveBuild } from "./server.mjs";

const server = process.env.KIT_GRID_ORIGIN ? null : await serveBuild();
const origin = process.env.KIT_GRID_ORIGIN || server.origin;
const executablePath = process.env.CHROME || ["/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(fs.existsSync);
let browser;
try {
  browser = await puppeteer.launch({ executablePath, args: ["--no-sandbox"] });
  for (const width of [1360, 390]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 850 });
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    const nav = ".kbar-nav";
    const gridLink = nav + ' a[href="/grid/samples/"]';
    await page.waitForSelector(gridLink);
    const links = () => page.$$eval(nav + " a", a => a.map(i => [i.textContent, i.pathname]));
    const kitLinks = await links();
    const go = async selector => {
      await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.locator(selector).click()]);
    };
    async function checkSection(id) {
      const current = '.kbar .kbar-row2 a[aria-current="page"]';
      await page.waitForSelector(current + '[data-section="' + id + '"]');
      await page.evaluate(() => scrollTo(0, 0));
      assert.deepEqual(await links(), kitLinks);
      assert.equal(await page.$eval(nav + ' [aria-current="page"]', a => a.textContent.trim()), "Colibri Grid Beta");
      assert.equal(await page.$eval(current, a => a.dataset.section), id);
      const layout = await page.evaluate(() => {
        const header = document.querySelector(".kbar").getBoundingClientRect();
        const sub = document.querySelector(".kbar-row2").getBoundingClientRect();
        const content = document.querySelector("#grid-content").getBoundingClientRect();
        return { gap: sub.top - header.bottom, overlap: sub.bottom - content.top, overflow: document.documentElement.scrollWidth - innerWidth };
      });
      assert(Math.abs(layout.gap) < 2 && layout.overlap <= 1 && layout.overflow <= 1, JSON.stringify(layout));
    }
    await go(gridLink);
    await checkSection("samples");
    const rail = '#samples a';
    async function application(id, title) {
      await page.waitForSelector(rail + '[href="#' + id + '"][aria-current="page"]');
      const element = await page.waitForSelector('#stage iframe[title="' + title + '"]');
      return element.contentFrame();
    }
    const workbook = await application('full-grid', 'Full grid workbench');
    await workbook.waitForSelector('.wb-content .wb-row');
    const surface = doc => doc.evaluate(() => ({
      bg: getComputedStyle(document.body).backgroundColor,
      primary: getComputedStyle(document.documentElement).getPropertyValue('--ui-primary').trim(),
      mode: document.documentElement.dataset.theme,
    }));
    const themePack = await page.waitForSelector('#kit-theme');
    await page.click('[aria-controls="kbar-custom"]');
    await themePack.select('ember');
    await workbook.waitForFunction(() => document.documentElement.dataset.kitTheme === 'ember');
    await page.keyboard.press('Escape');
    for (let i = 0; i < 2; i++) {
      await page.click('#theme');
      const theme = await surface(page);
      await workbook.waitForFunction(mode => document.querySelector('.wb').dataset.theme === mode, {}, theme.mode);
      assert.deepEqual(await surface(workbook), theme);
      assert.equal(await workbook.$eval('.wb', el => getComputedStyle(el).getPropertyValue('--ui-primary').trim()), theme.primary);
    }
    await workbook.click('.wb-filters [data-filter="property"]');
    await workbook.type('.wb-filters [data-filter="property"]', 'R-320.');
    await workbook.waitForFunction(() => document.querySelector('.wb-foot').textContent.includes('2 / 1,000'));
    for (const [kind, count] of [['application', 4], ['sample', 10], ['react', 10]]) {
      assert.equal((await page.$$(rail + '[data-kind="' + kind + '"]')).length, count);
    }
    assert.doesNotMatch(await page.$eval('body', b => b.innerText), /glide|compare both/i);
    await page.click('#samples a[href="#custom-cell-editing"]');
    await page.waitForSelector('#run-react[href="#react-custom-cell-editing"]');
    const nextTheme = await page.$eval("html", e => e.dataset.theme === "dark" ? "light" : "dark");
    await page.click("#theme");
    await go('.kbar-sub [data-section="react"]');
    await checkSection("react");
    assert.equal(new URL(page.url()).hash, "#react-custom-cell-editing");
    assert.equal(await page.$eval("html", e => e.dataset.theme), nextTheme);
    await page.waitForSelector('[role="grid"]');
    await go('.kbar-sub [data-section="samples"]');
    assert.equal(new URL(page.url()).hash, "#custom-cell-editing");
    await page.waitForSelector('#samples a[href="#custom-cell-editing"][aria-current="page"]');
    await go('#samples a[href="#trading-desk"]');
    await checkSection("trading");
    const trading = await application('trading-desk', 'Trading desk');
    await trading.waitForFunction(() => document.querySelector('#symbol')?.textContent === 'NVDA');
    await trading.click('#pause');
    await trading.waitForFunction(() => /resume/i.test(document.querySelector('#pause').textContent));
    await go('#samples a[href="#editable-directory"]');
    await (await application('editable-directory', 'Editable directory')).waitForSelector('[role=gridcell]');
    await go('#samples a[href="#inventory"]');
    await (await application('inventory', 'Inventory and pivot tables')).waitForSelector('[role=gridcell]');
    await go('.kbar-brand');
    await page.waitForSelector('header[data-active="docs"]');
    console.log(width + "px: Kit home → grid sample → React → same sample → trading → Kit home");
    await page.close();
  }
} finally {
  await browser?.close();
  await server?.close();
}

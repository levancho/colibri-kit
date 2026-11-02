import assert from 'node:assert/strict';
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import { serveBuild } from './server.mjs';
const server = await serveBuild();
let browser;
try {
  browser = await puppeteer.launch({ executablePath: process.env.CHROME || ['/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(fs.existsSync), args: ['--no-sandbox'] });
  const page = await browser.newPage();
  for (const width of [320, 1100]) for (const pack of ['', 'glacier', 'ember', 'midnight']) for (const scheme of ['light', 'dark']) {
    await page.setViewport({ width, height: 900 });
    await page.setContent(`<html data-theme="${scheme}" data-kit-theme="${pack}" data-ui-tabs="pill"><head>
    <link rel="stylesheet" href="${server.origin}/ui/themes/colibri.css">
    <link rel="stylesheet" href="${server.origin}/ui/themes/packs/index.css">
    <link rel="stylesheet" href="${server.origin}/ui/themes/knobs.css">
    <style>body{margin:16px}.fixture{margin-block:24px}</style></head><body class="ui-root">
    <nav id="navigation" class="fixture" data-ui="tab-nav" aria-label="Example"><a data-ui-part="link" href="#one" aria-current="page">Overview</a><a data-ui-part="link" href="#two">Details</a></nav>
    <aside id="callout" class="fixture" data-ui="callout" data-tone="warning" data-variant="outline"><span data-ui-part="icon">!</span><p>Check your details.<span data-ui="accessible-icon"><span id="nested" data-ui-part="icon">Nested</span></span></p></aside>
    </body></html>`);
    await page.waitForFunction(() => getComputedStyle(document.getElementById('callout')).display === 'grid');
    const backgrounds = [];
    for (const look of ['underline', 'pill', 'segmented']) {
      await page.$eval('#navigation', (el, value) => el.dataset.look = value, look);
      const result = await page.$eval('#navigation', el => {
        const active = el.querySelector('a'); const css = getComputedStyle(active);
        return { height: active.getBoundingClientRect().height, family: css.fontFamily, bg: css.backgroundColor, indicator: getComputedStyle(active, '::after').display, rootIndicator: getComputedStyle(el, '::after').content, overflow: document.documentElement.scrollWidth > innerWidth };
      });
      assert.ok(result.height >= 40);
      assert.ok(!result.family.includes('Times New Roman'));
      assert.equal(result.indicator, look === 'underline' ? 'block' : 'none', 'per-component look overrides global pill setting');
      assert.ok(['none', 'normal'].includes(result.rootIndicator), 'only the owned active link draws an indicator');
      assert.equal(result.overflow, false);
      backgrounds.push(result.bg);
    }
    assert.notEqual(backgrounds[0], backgrounds[1]);
    const tones = [];
    for (const tone of ['warning', 'danger', 'success']) {
      await page.$eval('#callout', (el, tone) => { el.dataset.tone = tone; el.dataset.look = 'surface'; }, tone);
      tones.push(await page.$eval('#callout', el => getComputedStyle(el).backgroundColor));
      for (const look of ['soft', 'surface', 'outline']) {
        await page.$eval('#callout', (el, value) => el.dataset.look = value, look);
        assert.equal(await page.$eval('#callout', el => getComputedStyle(el).borderTopWidth), '1px');
      }
    }
    assert.equal(new Set(tones).size, 3, 'appearance does not erase semantic tones');
    assert.equal(await page.$eval('#nested', el => getComputedStyle(el).display), 'inline', 'nested icon not styled as parent callout icon');
    await page.addStyleTag({ content: '#navigation { --ui-tn-active-background: rgb(1, 2, 3); } #callout { --ui-callout-background: rgb(4, 5, 6); }' });
    assert.equal(await page.$eval('#navigation a', el => getComputedStyle(el).backgroundColor), 'rgb(1, 2, 3)');
    assert.equal(await page.$eval('#callout', el => getComputedStyle(el).backgroundColor), 'rgb(4, 5, 6)');
  }
  console.log('ok tab-navigation + callout: 4 packs × 2 schemes × 2 widths, all looks, semantic tones, ownership and token overrides');
} finally { await browser?.close(); await server.close(); }

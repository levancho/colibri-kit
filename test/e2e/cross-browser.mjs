import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium, firefox, webkit } from 'playwright';
import { serveBuild } from './server.mjs';
const server = await serveBuild();
const axe = fs.readFileSync('node_modules/axe-core/axe.min.js','utf8');
const engines = { chromium, firefox, webkit };
try {
  for (const name of (process.env.BROWSERS || 'chromium,firefox,webkit').split(',')) {
    const browser = await engines[name].launch({ headless:true });
    try {
      const page = await browser.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
      for (const scheme of ['light','dark']) for (const width of [390,1280]) for (const path of ['/getting-started.html', '/java-templates.html', '/', '/kitchen-sink/examples/dashboards/analytics.html', '/kitchen-sink/examples/dashboards/crm.html']) {
        await page.emulateMedia({colorScheme:scheme}); await page.setViewportSize({width,height:900}); await page.goto(server.origin+path); await page.waitForLoadState('networkidle');
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), `${name} ${path} ${width}: overflow`);
        await page.addScriptTag({content:axe});
        const violations = await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));
        assert.deepEqual(violations,[],`${name} ${path} ${width}: accessibility`);
        if(path==='/') {
          await page.locator('.live [data-ui="dialog"] [data-ui-part="trigger"]').click();
          assert.equal(await page.locator('.live dialog').evaluate(e=>e.open),true);await page.keyboard.press('Escape');
          assert.equal(await page.locator('.live dialog').evaluate(e=>e.open),false);
        } else if (path.includes('/dashboards/')) {
          await page.locator(path.includes('crm')?'[data-action=deal]':'[data-action=report]').click();
          assert.equal(await page.locator('.demo-dialog').evaluate(e=>e.open),true);await page.keyboard.press('Escape');
          if(width<900){await page.locator('.menu-btn').click();await page.keyboard.press('Escape');assert.equal(await page.locator('.dash-side').evaluate(e=>e.inert),true);}
        }
      }
      // Exercise real modules and the new cascade under each rendering engine.
      await page.goto(server.origin);
      await page.setContent(`<html lang="en"><head><title>Component test</title><style>button { border-radius: 19px; background: rgb(1, 2, 3); }</style><link rel="stylesheet" href="${server.origin}/ui/themes/colibri.css"><link rel="stylesheet" href="${server.origin}/ui/themes/packs/index.css"><link rel="stylesheet" href="${server.origin}/ui/themes/knobs.css"><link rel="stylesheet" href="${server.origin}/ui/themes/motion.css"></head><body class="ui-root"><main>
      <div id="tabs" data-ui="tabs"><div data-ui-part="list" aria-label="Sections"><button data-ui-part="trigger" data-value="one">One</button><button data-ui-part="trigger" data-value="two">Two</button></div><div data-ui-part="panel" data-value="one">First</div><div data-ui-part="panel" data-value="two">Second</div></div>
      <div id="select" data-ui="select"><button data-ui-part="trigger">Choose</button><div data-ui-part="content" hidden><button data-ui-part="item" data-value="a">A</button></div></div>
      <span id="spinner" data-ui="spinner" aria-label="Loading"></span><div id="hidden" hidden>Hidden</div><div data-ui="callout" data-tone="warning" data-look="surface"><p>Warning</p></div>
      </main></body></html>`);
      await page.evaluate(async origin=>{const {init}=await import(origin+'/ui/src/core/auto.js');init();},server.origin);
      await page.locator('#tabs [data-value=one]').first().focus();await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('#tabs [data-value=two]').first().getAttribute('aria-selected'),'true');
      for(const pack of ['', 'glacier','ember','midnight']) {
        await page.evaluate(pack=>document.documentElement.dataset.kitTheme=pack,pack);
        assert.equal(await page.locator('#select > button').evaluate(e=>getComputedStyle(e).borderRadius),'19px');
      }
      await page.emulateMedia({reducedMotion:'reduce'});
      assert.equal(await page.locator('#spinner').evaluate(e=>getComputedStyle(e,'::before').animationName),'none');
      assert.equal(await page.locator('#hidden').evaluate(e=>getComputedStyle(e).display),'none');
      assert.deepEqual(errors,[],`${name}: uncaught errors`);
      console.log(`ok ${name}: setup guides + homepage + dashboards, 2 widths × 2 schemes, axe WCAG A/AA checks, modal/menu focus, native CSS and keyboard tabs`);
    } finally { await browser.close(); }
  }
} finally { await server.close(); }

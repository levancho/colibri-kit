// The minified distributions behave like src/core/auto.js, and the lazy one downloads only what a page uses.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {serveBuild} from './server.mjs';

const repo = process.cwd(), temp = fs.mkdtempSync(path.join(os.tmpdir(), 'colibri-dist-'));
fs.cpSync(path.join(repo, 'dist'), path.join(temp, 'dist'), {recursive: true});
const page = script => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>dist probe</title>
<link rel="stylesheet" href="./dist/colibri-ui.min.css"><script type="module" src="${script}"></script></head><body class="ui-root">
<div data-ui="tooltip" data-delay="0"><button data-ui-part="trigger" id="tip">Help</button><div data-ui-part="content">Tooltip text</div></div>
<div data-ui="dialog"><button data-ui-part="trigger" id="open">Open</button><dialog data-ui-part="content"><h2 data-ui-part="title">Title</h2><button data-ui-part="close" id="close">Close</button></dialog></div>
<div data-ui="segmented-control" data-default-value="a" id="seg"><button data-ui-part="item" data-value="a">A</button><button data-ui-part="item" data-value="b" id="b">B</button></div>
<div id="later"></div></body></html>`;
fs.writeFileSync(path.join(temp, 'full.html'), page('./dist/colibri-ui.min.js'));
fs.writeFileSync(path.join(temp, 'lazy.html'), page('./dist/lazy/auto-lazy.js'));

const server = await serveBuild(temp);
const browser = await puppeteer.launch({executablePath: process.env.CHROME || ['/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(fs.existsSync), args: ['--no-sandbox']});
try {
  const totalChunks = fs.readdirSync(path.join(temp, 'dist/lazy/chunks')).length;
  for (const name of ['full', 'lazy']) {
    const tab = await browser.newPage(), scripts = [], errors = [];
    tab.on('pageerror', e => errors.push(String(e)));
    // failed requests are reported by URL below; the browser's own favicon probe is not part of the page
    tab.on('console', m => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()); });
    tab.on('response', r => { if (r.url().endsWith('.js')) scripts.push(r.url()); if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) errors.push(`${r.status()} ${r.url()}`); });
    await tab.goto(`${server.origin}/${name}.html`);
    await tab.waitForFunction(() => document.querySelector('#seg [data-ui-part=item]')?.getAttribute('role') === 'radio');

    await tab.click('#b');
    assert.equal(await tab.$eval('#seg', el => el.dataset.value), 'b', `${name}: segmented control selects`);
    await tab.click('#open');
    assert.equal(await tab.$eval('dialog', el => el.open), true, `${name}: dialog opens`);
    await tab.click('#close');
    assert.equal(await tab.$eval('dialog', el => el.open), false, `${name}: dialog closes`);
    await tab.focus('#tip');
    await tab.waitForFunction(() => { const tip = document.querySelector('[data-ui=tooltip] [data-ui-part=content], [role=tooltip]'); return tip && !tip.hidden; });

    // content inserted later is wired on ui:refresh, loading its controller on demand
    const before = scripts.length;
    await tab.$eval('#later', el => { el.innerHTML = '<div data-ui="accordion"><div data-ui-part="item" data-value="x"><button data-ui-part="trigger" id="acc">Q</button><div data-ui-part="content">A</div></div></div>'; el.dispatchEvent(new Event('ui:refresh', {bubbles: true})); });
    await tab.waitForFunction(() => document.querySelector('#acc')?.hasAttribute('aria-expanded'));
    await tab.click('#acc');
    assert.equal(await tab.$eval('#acc', el => el.getAttribute('aria-expanded')), 'true', `${name}: late accordion works`);

    if (name === 'full') assert.equal(scripts.length, 1, 'full bundle is a single script');
    else {
      assert.ok(before < totalChunks, `lazy page loaded ${before} scripts; expected fewer than all ${totalChunks} chunks`);
      assert.ok(scripts.length > before, 'accordion controller was fetched only when an accordion appeared');
    }
    assert.deepEqual(errors, [], `${name}: no console errors`);
    console.log(`ok ${name} distribution: ${scripts.length} script request(s)${name === 'lazy' ? ` of ${totalChunks + 1} available` : ''}`);
    await tab.close();
  }
  // The minified stylesheets must style a page exactly like the readable ones. (A regex minifier once turned
  // `& :where(th, td)` into `&:where(th,td)`: with the .min file, table cells lost their padding and borders.)
  fs.cpSync(path.join(repo, 'packages/colibri-css/dist'), path.join(temp, 'css'), {recursive: true});
  const probe = (sheet, p = '') => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>css probe</title><link rel="stylesheet" href="./css/${sheet}"></head><body>
<table><tbody><tr><td id="cell">cell</td></tr></tbody></table><div class="${p}prose"><p>intro</p><h2 id="h">Heading</h2><ul id="list"><li>item</li></ul></div>
<div class="${p}field"><label id="label" for="i">Email</label><input id="i" type="email" required></div><button class="${p}btn" data-size="l" id="btn">Go</button></body></html>`;
  const measure = async file => { const tab = await browser.newPage(); await tab.goto(`${server.origin}/${file}`);
    const values = await tab.evaluate(() => { const cs = (id, ...props) => { const c = getComputedStyle(document.getElementById(id)); return props.map(p => c.getPropertyValue(p)); };
      return [cs('cell', 'padding-top', 'padding-left', 'border-bottom-width'), cs('h', 'margin-top'), cs('list', 'padding-inline-start'), cs('btn', 'min-block-size', 'font-size', 'background-color'), cs('label', 'color')]; });
    await tab.close(); return JSON.stringify(values); };
  for (const [plain, min, p] of [['colibri.css', 'colibri.min.css', ''], ['colibri.prefixed.css', 'colibri.prefixed.min.css', 'c-']]) {
    fs.writeFileSync(path.join(temp, 'plain.html'), probe(plain, p)); fs.writeFileSync(path.join(temp, 'min.html'), probe(min, p));
    const a = await measure('plain.html'), b = await measure('min.html');
    assert.equal(b, a, `${min} renders differently from ${plain}`);
    assert.notEqual(JSON.parse(a)[0][0], '0px', `${plain}: table cells have padding`);
  }
  assert.equal(await (async () => { fs.writeFileSync(path.join(temp, 'p1.html'), probe('colibri.css')); fs.writeFileSync(path.join(temp, 'p2.html'), probe('colibri.prefixed.css', 'c-')); return (await measure('p1.html')) === (await measure('p2.html')); })(), true, 'prefixed build renders like the plain one');
  console.log('ok minified and prefixed stylesheets render identically to colibri.css');
} finally { await browser.close(); await server.close(); fs.rmSync(temp, {recursive: true, force: true}); }

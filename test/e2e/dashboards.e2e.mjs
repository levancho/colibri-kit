import assert from 'node:assert/strict';
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import { serveBuild } from './server.mjs';
const server = await serveBuild();
const executablePath = process.env.CHROME || ['/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(fs.existsSync);
let browser;
try {
  browser = await puppeteer.launch({ executablePath, args: ['--no-sandbox'] });
  const page = await browser.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const base = server.origin + '/kitchen-sink/examples/dashboards/';
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(base + 'crm.html', { waitUntil: 'networkidle0' });
  assert.equal(await page.$$eval('.deal', els => els.length), 8);
  assert.equal(await page.$eval('.kpi b', e => e.textContent), '$101,500');
  await page.click('[data-action="deal"]');
  await page.type('[name="name"]', '<img src=x onerror=alert(1)>');
  await page.type('[name="owner"]', 'Test Owner');
  await page.type('[name="value"]', '500');
  await page.select('[name="stage"]', 'Won');
  await page.click('.demo-form [type="submit"]');
  assert.equal(await page.$$eval('.deal', els => els.length), 9);
  assert.equal(await page.$('.deal img'), null, 'user text is not interpreted as HTML');
  await page.reload({ waitUntil: 'networkidle0' });
  assert.equal(await page.$$eval('.deal', els => els.length), 9, 'new deal persists');
  await page.type('.search input', 'Test Owner');
  assert.equal(await page.$$eval('.deal', els => els.length), 1);
  await page.click('.deal');
  await page.select('[name="stage"]', 'Proposal');
  await page.click('.demo-form [type="submit"]');
  assert.equal(await page.$eval('[aria-label="Proposal"] .deal small', e => e.textContent), 'Test Owner');
  await page.click('.deal');
  await page.locator('::-p-text(Delete deal)').click();
  await page.locator('::-p-text(Delete permanently)').click();
  assert.equal(await page.$$eval('.deal', els => els.length), 0);
  await page.click('[data-action="import"]');
  await page.$eval('input[type=file]', el => {
    const dt = new DataTransfer(); dt.items.add(new File(['[{"name":"bad"}]'], 'bad.json', { type: 'application/json' })); el.files = dt.files; el.dispatchEvent(new Event('change'));
  });
  await page.waitForFunction(() => document.querySelector('[role=alert]').textContent.includes('Import rejected'));
  await page.keyboard.press('Escape');
  await page.click('[data-action="import"]');
  await page.$eval('input[type=file]', el => {
    const dt = new DataTransfer(); dt.items.add(new File([JSON.stringify([{id:'1',name:'Imported',owner:'Test Owner',value:123,stage:'Lead'}])], 'good.json')); el.files = dt.files; el.dispatchEvent(new Event('change'));
  });
  await page.waitForFunction(() => !document.querySelector('dialog').open);
  assert.equal(await page.$eval('.deal > span', e => e.textContent), 'Imported');
  console.log('ok CRM create/edit/delete, derived metrics, safe text, persistence, search, atomic import validation');
  await page.goto(base + 'analytics.html', { waitUntil: 'networkidle0' });
  const original = await page.$eval('#traffic', e => JSON.parse(e.dataset.values));
  await page.click('[data-n="7"]');
  assert.deepEqual(await page.$eval('#traffic', e => JSON.parse(e.dataset.values)), original.map(s => s.slice(-7)));
  await page.click('[data-n="30"]');
  assert.deepEqual(await page.$eval('#traffic', e => JSON.parse(e.dataset.values)), original);
  await page.select('[aria-label="Customer status"]', 'Trial');
  assert.equal(await page.$$eval('tbody tr:not([hidden])', els => els.length), 1);
  await page.evaluate(() => {
    const original = URL.createObjectURL.bind(URL);
    URL.createObjectURL = blob => { blob.text().then(text => { window.exportedCSV = text; }); return original(blob); };
  });
  await page.click('[data-action="export"]');
  await page.waitForFunction(() => typeof window.exportedCSV === 'string');
  assert.match(await page.evaluate(() => window.exportedCSV), /"Ana Meladze","Starter","\$29","Trial"/);
  assert.equal((await page.evaluate(() => window.exportedCSV)).split('\r\n').length, 2, 'CSV contains only filtered rows');
  await page.click('[data-action="report"]');
  await page.type('[name=reportName]', 'Trial customers');
  await page.click('.demo-form [type=submit]');
  assert.match(await page.$eval('dialog', e => e.textContent), /Trial customers/);
  await page.keyboard.press('Escape');
  await page.reload({ waitUntil: 'networkidle0' });
  await page.click('[data-workspace=reports]');
  assert.match(await page.$eval('dialog', e => e.textContent), /Trial customers/);
  await page.keyboard.press('Escape');
  await page.click('[data-workspace=inbox]');
  await page.locator('::-p-text(Mark read)').click();
  assert.equal(await page.$eval('[data-workspace=inbox] .badge', e => e.textContent), '2');
  await page.keyboard.press('Escape');
  await page.click('details.source summary');
  await page.focus('.code-tabs [role=tab]'); await page.keyboard.press('End');
  assert.equal(await page.evaluate(() => document.activeElement.textContent), 'React');
  assert.equal(await page.$eval('.code-tabs', el => el.querySelectorAll('[role=tab][tabindex="0"]').length), 1);
  await page.select('[aria-label="Customer status"]', 'All');
  await page.click('th:nth-child(3) button');
  assert.equal(await page.$eval('tbody tr:first-child td:nth-child(3)', e => e.textContent), '$29');
  await page.click('th:nth-child(3) button');
  assert.equal(await page.$eval('tbody tr:first-child td:nth-child(3)', e => e.textContent), '$1,140');
  await page.click('[data-workspace=settings]');
  await page.locator('::-p-text(Reset demo data)').click();
  await page.locator('::-p-text(Reset now)').click();
  await page.click('[data-workspace=reports]');
  assert.match(await page.$eval('dialog', e => e.textContent), /No saved reports/);
  await page.keyboard.press('Escape');
  console.log('ok analytics filters, numeric sorting, filtered CSV, saved reports, reset, inbox, consistent ranges and keyboard tabs');
  for (const width of [320, 768, 1440]) {
    for (const name of ['analytics', 'crm']) {
      await page.setViewport({ width, height: 900 });
      await page.goto(base + name + '.html', { waitUntil: 'networkidle0' });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}: no page overflow at ${width}px; ${JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("body *")].filter(el => el.getBoundingClientRect().right > innerWidth + 1).slice(0,12).map(el => ({tag:el.tagName, class:el.className, right:el.getBoundingClientRect().right}))))}`);
      if (width < 900) {
        assert.equal(await page.$eval('.dash-side', e => e.inert), true);
        await page.click('.menu-btn');
        assert.equal(await page.$eval('.menu-btn', e => e.getAttribute('aria-expanded')), 'true');
        await page.keyboard.press('Escape');
        assert.equal(await page.$eval('.dash-side', e => e.inert), true);
      }
    }
  }
  await page.evaluateOnNewDocument(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } }); });
  await page.goto(base + 'crm.html', { waitUntil: 'networkidle0' });
  await page.click('[data-action=deal]');
  assert.equal(await page.$eval('dialog', e => e.open), true);
  assert.deepEqual(errors, []);
  console.log('ok both dashboards at 320/768/1440px, mobile menu, blocked storage, no uncaught errors');
} finally { await browser?.close(); await server.close(); }

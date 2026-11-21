import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import { serveBuild } from './server.mjs';

const server = process.env.KIT_GRID_ORIGIN ? null : await serveBuild();
const origin = process.env.KIT_GRID_ORIGIN || server.origin;
const browser = process.env.BROWSER === 'webkit' ? await webkit.launch() : await chromium.launch({channel: 'chrome'});
try {
  const page = await browser.newPage({viewport: {width: 1440, height: 920}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(6000);
  for (const prefix of ['', 'react-']) {
    const visit = id => page.goto(origin + '/grid/samples/#' + prefix + id);
    await visit('validate-data');
    const grid = page.locator('#stage [role=grid]');
    const row = grid.getByRole('row').nth(1);
    const owner = row.getByRole('gridcell').nth(2);
    const budget = row.getByRole('gridcell').nth(1);
    const form = page.locator('#stage form.cg-inline-editor');
    await owner.dblclick();
    const field = form.getByRole('textbox', {name: 'Owner'});
    await field.fill('Lea Reed');
    assert.equal(await page.locator('dialog[open]').count(), 0);
    const bounds = await form.boundingBox(), cell = await owner.boundingBox();
    for (const key of ['x', 'y', 'width', 'height']) assert(Math.abs(bounds[key] - cell[key]) <= 3, key);
    if (process.env.INLINE_PROOF) await grid.screenshot({path: process.env.INLINE_PROOF + '-' + (prefix || 'js-') + 'owner.png'});
    await field.press('Enter');
    await form.waitFor({state: 'detached'});
    assert.match(await owner.innerText(), /Lea Reed/);
    await owner.dblclick();
    await field.fill('Discard this');
    await field.press('Escape');
    assert.match(await owner.innerText(), /Lea Reed/);
    await budget.dblclick();
    const number = form.getByRole('spinbutton');
    await number.fill('-3');
    await number.press('Tab');
    assert.match(await form.getByRole('alert').innerText(), /whole number/);
    await number.fill('4123');
    await number.press('Tab');
    await form.waitFor({state:'detached'});
    assert.match(await budget.innerText(), /4,?123/);
    assert.equal(await owner.getAttribute('data-active'), '');
    await grid.press('F2');
    await field.fill('Outside save');
    await budget.click();
    assert.match(await owner.innerText(), /Outside save/);

    await visit('custom-cell-editing');
    const tags = grid.getByRole('button',{name:'Edit Team tags',exact:true}).first();
    await tags.click();
    const list = page.getByRole('listbox',{name:'Team tags'});
    for (const option of await list.getByRole('option').all()) {
      if (await option.getAttribute('aria-selected') !== 'true') await option.click();
    }
    await page.getByRole('button',{name:'Done',exact:true}).click();
    const names = (await tags.getAttribute('title')).split(', ');
    assert(names.length >= 4);
    // Exercise the same ResizeObserver used when the application changes the column width.
    await tags.evaluate(el => { el.closest('[role=row]').style.gridTemplateColumns = '205px 170px 156px 215px'; });
    const badge = tags.locator('.selection-more');
    await badge.waitFor({state:'visible'});
    const visible = await tags.locator('.choice-chip:visible').count();
    assert.equal(await badge.innerText(), '+' + (names.length - visible) + ' more');
    assert(visible < names.length);
    await tags.evaluate(el => { el.closest('[role=row]').style.gridTemplateColumns = '205px 170px 600px 215px'; });
    await badge.waitFor({state:'hidden'});
    assert.equal(await tags.locator('.choice-chip:visible').count(), names.length);
    console.log((prefix || 'JavaScript') + ' passed inline position, commit, cancel, invalid Tab, keyboard navigation, outside save and responsive hidden counts');
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  await server?.close();
}

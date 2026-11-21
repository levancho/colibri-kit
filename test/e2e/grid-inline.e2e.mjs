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
    const summary = await tags.evaluate(async el => {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return {visible: el.querySelectorAll('.choice-chip:not([hidden])').length, badge: el.querySelector('.selection-more').innerText};
    });
    assert.equal(summary.badge, '+' + (names.length - summary.visible) + ' more');
    assert(summary.visible < names.length);
    await tags.evaluate(el => { el.closest('[role=row]').style.gridTemplateColumns = '205px 170px 600px 215px'; });
    await badge.waitFor({state:'hidden'});
    assert.equal(await tags.locator('.choice-chip:visible').count(), names.length);
    console.log((prefix || 'JavaScript') + ' passed inline position, commit, cancel, invalid Tab, keyboard navigation, outside save and responsive hidden counts');
  }
  await page.setViewportSize({width: 390, height: 844});
  await page.goto(origin + '/grid/samples/#editable-directory');
  const urlCell = page.locator('#stage .cg-canvas [data-index="0"] [data-column="5"]');
  await urlCell.dblclick();
  const urlForm = page.locator('#stage form.cg-inline-editor');
  const urlBounds = await urlForm.boundingBox();
  for (const child of await urlForm.locator('a:visible, button:visible').all()) {
    const bounds = await child.boundingBox();
    assert(bounds.x >= urlBounds.x && bounds.x + bounds.width <= urlBounds.x + urlBounds.width + 1);
    assert(bounds.y >= urlBounds.y && bounds.y + bounds.height <= urlBounds.y + urlBounds.height + 1);
  }
  await urlForm.getByRole('button', {name:'Edit URL'}).click();
  const urlInput = urlForm.locator('input[type=url]');
  await urlInput.fill('https://example.org/changed');
  await urlInput.press('Enter');
  assert.match(await urlCell.innerText(), /changed/);
  console.log('Directory URL preview and editor stay inside the cell at 390px.');
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  await server?.close();
}

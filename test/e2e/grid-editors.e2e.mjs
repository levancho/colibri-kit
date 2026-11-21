import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import { serveBuild } from './server.mjs';

const server = process.env.KIT_GRID_ORIGIN ? null : await serveBuild();
const origin = process.env.KIT_GRID_ORIGIN || server.origin;
const browser = process.env.BROWSER === 'webkit' ? await webkit.launch() : await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({viewport: {width: 1440, height: 920}});
  page.setDefaultTimeout(6500);
  for (const prefix of ['', 'react-']) {
    const sample = id => page.goto(origin + '/grid/samples/#' + prefix + id);
    await sample('color-palette');
    const grid = page.locator('#stage [role=grid]');
    const row = grid.getByRole('row').filter({hasText:'Apricot'});
    const trigger = row.getByRole('button', {name:'Edit Color',exact:true});
    await trigger.click();
    let panel = page.getByRole('dialog', {name:'Color palette', exact:true});
    await panel.getByRole('button',{name:'#000000',exact:true}).click();
    assert.equal(await trigger.innerText(), '#000000');
    assert.equal(await panel.count(), 0);
    await trigger.click();
    await panel.getByLabel('Custom hex color').fill('129B90');
    await panel.getByRole('button',{name:'Add',exact:true}).click();
    assert.equal(await trigger.innerText(),'#129B90');
    const accents = row.getByRole('button',{name:'Edit Accent colors',exact:true});
    await accents.click();
    panel = page.getByRole('dialog',{name:'Accent colors palette',exact:true});
    const swatch = value => panel.getByRole('button',{name:value,exact:true});
    for (const value of ['#000000','#FFFFFF','#129B90']) {
      await swatch(value).click();
      assert.equal(await swatch(value).getAttribute('aria-pressed'),'true');
    }
    await swatch('#000000').click();
    assert.equal(await swatch('#000000').getAttribute('aria-pressed'),'false');
    if (!prefix && process.env.PICKER_PROOF) await page.locator('#stage').screenshot({path:process.env.PICKER_PROOF + '-palette.png'});
    await panel.getByRole('button',{name:'Done'}).click();
    assert.equal(await accents.getAttribute('title'),'#FFB4A2, #FFFFFF, #129B90');
    await accents.click();
    await swatch('#129B90').click();
    await page.keyboard.press('Escape');
    assert.equal(await accents.getAttribute('title'),'#FFB4A2, #FFFFFF, #129B90');
    await sample('project-editors');
    const first = grid.getByRole('row').filter({hasText:'Atlas redesign'});
    const renewals = first.getByRole('button',{name:'Edit Renewals'});
    await renewals.click();
    const list = page.getByRole('listbox',{name:'Renewals'});
    for (const value of ['Quarterly','Annual']) {
      await list.getByRole('option',{name:value,exact:true}).click();
      assert.equal(await list.getByRole('option',{name:value,exact:true}).getAttribute('aria-selected'),'true');
    }
    assert.equal(await list.locator('[aria-selected=true]').count(),3);
    if (!prefix && process.env.PICKER_PROOF) await page.locator('#stage').screenshot({path:process.env.PICKER_PROOF + '-multi.png'});
    await page.locator('.choice-list:popover-open').getByRole('button',{name:'Done'}).click();
    assert.equal(await renewals.getAttribute('title'),'One month, Quarterly, Annual');
    await renewals.click();
    await list.getByRole('option',{name:'Quarterly',exact:true}).click();
    await page.keyboard.press('Escape');
    assert.equal(await renewals.getAttribute('title'),'One month, Quarterly, Annual');
    await first.getByRole('button',{name:'Edit Owner'}).click();
    await page.getByRole('option',{name:'Theo Brown'}).click();
    await first.getByRole('button',{name:'Edit Status'}).click();
    await page.getByRole('combobox',{name:'Status',exact:true}).fill('prog');
    await page.getByRole('option',{name:'In progress'}).click();
    assert.match(await first.innerText(),/Theo Brown/);
    assert.match(await first.innerText(),/In progress/);
    const paid = first.getByRole('checkbox');
    await paid.uncheck();
    for (const [column, value, type] of [[1,'86','number'],[6,'2027-03-19','date']]) {
      await first.getByRole('gridcell').nth(column).dblclick();
      await page.locator('#stage input[type='+type+']:visible').last().fill(value);
      await page.getByRole('button',{name:'Save',exact:true}).click();
      assert.match(await first.getByRole('gridcell').nth(column).innerText(), type === 'date' ? /19/ : /86/);
    }
    const editing = page.getByLabel('Enable editing');
    await editing.uncheck();
    assert(await renewals.isDisabled());
    assert(await paid.isDisabled());
    await editing.check();
    assert.equal(await renewals.getAttribute('title'),'One month, Quarterly, Annual');
    assert.equal(await paid.isChecked(),false);
    console.log((prefix ? 'React' : 'JavaScript') + ': palette, custom hex, three checked choices, deselect, Done, Escape, select, combo, numbers, dates, checkbox and read-only mode passed');
  }
} finally { await browser.close(); await server?.close(); }

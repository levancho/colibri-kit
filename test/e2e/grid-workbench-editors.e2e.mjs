import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium, webkit } from 'playwright';
import { serveBuild } from './server.mjs';

const server = process.env.KIT_GRID_ORIGIN ? null : await serveBuild();
const origin = process.env.KIT_GRID_ORIGIN || server.origin;
const browser = process.env.BROWSER === 'webkit' ? await webkit.launch() : await chromium.launch({channel:'chrome'});
const wide = process.argv.includes('--wide');
const results = [];
try {
  const page = await browser.newPage({viewport:{width:1520,height:930}});
  page.setDefaultTimeout(6000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(origin + '/grid/samples/#full-grid');
  const app = page.locator('[data-application="full-grid"]');
  const port = app.locator('.wb-port');
  const editor = app.locator('.wb-editor');
  const at = field => port.locator('[data-r="0"][data-field="' + field + '"]');
  async function open(cell) {
    await cell.evaluate(el => el.scrollIntoView({block:'nearest',inline:'center'}));
    await cell.dblclick();
    const box = await cell.boundingBox(), surface = await editor.boundingBox();
    assert(surface, 'No cell editor');
    for (const prop of ['x','y','width','height'])
      assert(Math.abs(surface[prop] - box[prop]) <= 2, prop + ': ' + JSON.stringify({surface,box}));
    assert(await editor.evaluate(el => el.contains(document.activeElement)), 'Editor did not receive focus');
    assert.equal(await page.locator('dialog[open],[aria-modal=true]:visible').count(),0);
  }
  await page.evaluate(() => {
    window.editEvents = [];
    for (const type of ['itemEditBeginning','itemEditBegin','itemEditEnd','itemEditSave','itemEditCancel'])
      document.addEventListener(type, e => window.editEvents.push({type,field:e.detail.column.field,value:e.detail.value}));
  });
  for (const dataset of ['projects','participants']) {
    await app.locator('#dataset').selectOption(dataset);
    await app.locator('#size').selectOption(wide ? '10000' : '1000');
    const fields = await port.locator('.wb-content [data-r="0"][data-field]').evaluateAll(els=>els.map(el=>el.dataset.field));
    assert.equal(fields.length,wide ? 100 : dataset === 'projects' ? 10 : 22);
    for (const field of fields) {
      const cell = at(field);
      if (field === 'pinned') {
        assert.equal(await cell.getAttribute('aria-readonly'),'true');
        continue;
      }
      try {
        assert.equal(await cell.getAttribute('aria-readonly'),'false');
        await page.evaluate(()=>{window.editEvents.length=0;});
        let expected, kind;
        if (field === 'bought' || field === 'rating') {
          if (field === 'bought') {
            const box = cell.getByRole('checkbox');
            expected = !(await box.isChecked());
            await box.click();
            assert.equal(await box.isChecked(),expected);
          } else {
            expected = 4;
            const star = cell.getByRole('radio',{name:'4 stars'});
            await star.click();
            assert.equal(await star.getAttribute('aria-checked'),'true');
          }
          kind = 'direct';
          assert.equal(await editor.count(),0);
          assert.equal(await page.locator('dialog[open],[aria-modal=true]:visible').count(),0);
        } else {
          await open(cell);
          if (field === 'team') {
            kind = 'multi-select';
            const member = editor.getByLabel('Lena Park',{exact:true});
            await member.check();
            assert(await member.isChecked());
            await editor.getByRole('button',{name:'Save',exact:true}).click();
            assert(await cell.locator('[title="Lena Park"]').count());
          } else if (await editor.getByRole('combobox').count()) {
            kind = 'choice';
            const option = editor.locator('[role=option][aria-selected=false]').first();
            expected = await option.innerText();
            await option.click();
            assert((await cell.innerText()).includes(expected));
          } else {
            const input = editor.locator('input');
            kind = await input.getAttribute('type') || 'text';
            expected = kind === 'number' ? 7123 : kind === 'date' ? '2027-04-18' : field === 'property' ? 'R-654.321' : 'Sample edit';
            await input.fill(String(expected));
            await input.press('Enter');
          }
          await editor.waitFor({state:'detached'});
        }
        const events=await page.evaluate(()=>window.editEvents);
        assert.deepEqual(events.map(e=>e.type),['itemEditBeginning','itemEditBegin','itemEditEnd','itemEditSave']);
        assert(events.every(e=>e.field===field));
        if (expected !== undefined) assert.equal(events.at(-1).value,expected);
        if (kind !== 'direct') {
          const savedLabel = await cell.innerText();
          await open(cell);
          if (field === 'team') {
            const member = editor.getByLabel('Lena Park',{exact:true});
            assert(await member.isChecked());
            await member.uncheck();
          } else {
            const input = editor.locator('input').first();
            assert.equal(await input.inputValue(),String(expected));
            await input.fill(kind==='number' ? '1' : kind==='date' ? '2028-01-01' : 'discard');
          }
          await page.keyboard.press('Escape');
          await editor.waitFor({state:'detached'});
          assert.equal(await page.evaluate(()=>window.editEvents.at(-1).type),'itemEditCancel');
          assert(await port.evaluate(el=>el===document.activeElement));
          if (field === 'team') assert(await cell.locator('[title="Lena Park"]').count());
          assert.equal(await cell.innerText(), savedLabel);
        }
        results.push({dataset,field,kind});
      } catch (error) { throw new Error(dataset + '.' + field + ': ' + error.message,{cause:error}); }
    }
    console.log(dataset,results.filter(r=>r.dataset===dataset).length,'editable columns passed');
  }
  await app.locator('#size').selectOption('1000');
  await app.locator('#dataset').selectOption('projects');
  const property=at('property');
  await open(property);
  const mask=editor.locator('input');
  await mask.fill('1');
  await at('client').click();
  assert(await mask.evaluate(el=>el===document.activeElement));
  assert.equal(await mask.getAttribute('aria-invalid'),'true');
  assert.equal(await editor.getByRole('alert').innerText(),'Use R-000.000');
  await mask.fill('654321');
  assert.equal(await mask.inputValue(),'R-654.321');
  await mask.press('Tab');
  assert(await editor.getByRole('combobox',{name:'Status'}).isVisible());
  await page.keyboard.press('Shift+Tab');
  assert.equal(await editor.locator('input').inputValue(),'R-654.321');
  await page.keyboard.press('Escape');
  await open(at('team'));
  await editor.locator('input[type=search]').fill('Lena');
  assert.equal(await editor.getByRole('checkbox').count(),1);
  if (process.env.WORKBENCH_PROOF) {
    await editor.locator('input[type=search]').fill('');
    await port.screenshot({path:process.env.WORKBENCH_PROOF+'-team.png'});
    fs.writeFileSync(process.env.WORKBENCH_PROOF+'-columns.json',JSON.stringify({origin,wide,columns:results},null,2));
  }
  await page.keyboard.press('Escape');
  const status = at('status');
  await status.click({button:'right'});
  await app.getByRole('menuitem',{name:'Edit cell',exact:true}).click();
  assert(await editor.getByRole('combobox',{name:'Status'}).isVisible());
  await page.keyboard.press('Escape');
  await at('client').click();
  await port.press('F2');
  await editor.locator('input').fill('Click-away edit');
  await property.click();
  assert.match(await at('client').innerText(), /Click-away edit/);
  assert.deepEqual(errors,[]);
  console.log('Invalid click-away, property mask, Tab, Shift+Tab, Team search and Escape passed.');
} finally {await browser.close();await server?.close();}

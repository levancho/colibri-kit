import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import { serveBuild } from './server.mjs';

const server = process.env.KIT_GRID_ORIGIN ? null : await serveBuild();
const origin = process.env.KIT_GRID_ORIGIN || server.origin;
const browser = process.env.BROWSER === 'webkit' ? await webkit.launch() : await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1360, height: 940 } });
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(origin + '/grid/samples/');
  await page.locator('#samples a[href="#tree-grid"]').click();
  const tree = page.getByRole('treegrid', { name: 'Project plan' });
  await tree.waitFor();
  assert.equal(await page.locator('#stage iframe').count(), 0);
  const names = () => tree.locator('.cg-tree-cell').allInnerTexts();
  const search = page.getByRole('searchbox', { name: 'Search Project plan' });
  const action = name => page.getByRole('button', { name, exact: true }).click();
  const roots = ['Platform release', 'Customer operations', 'Design research'];
  const original = ['Platform release', 'Client rollout', 'Pilot accounts', 'Data migration', 'Quality review',
    'Customer operations', 'Support readiness', 'Design research'];
  assert.deepEqual(await names(), original);
  await action('Collapse Client rollout');
  assert.deepEqual(await names(), original.filter(n => !['Pilot accounts', 'Data migration'].includes(n)));
  await action('Expand Client rollout');
  assert.deepEqual(await names(), original);
  await action('Collapse all');
  assert.deepEqual(await names(), roots);
  await search.fill('screen READER');
  assert.deepEqual(await names(), ['Platform release', 'Quality review', 'Screen reader audit']);
  assert.deepEqual(await tree.locator('.cg-canvas [role=row]').evaluateAll(rows =>
    rows.map(r => [r.ariaLevel, r.getAttribute('aria-expanded')])), [['1','true'], ['2','true'], ['3',null]]);
  if (process.env.TREEGRID_PROOF) await page.locator('#stage').screenshot({ path: process.env.TREEGRID_PROOF + '-search.png' });
  await action('Collapse Quality review');
  assert.deepEqual(await names(), ['Platform release', 'Quality review']);
  await action('Expand Quality review');
  await search.fill('Missing task 99');
  assert.deepEqual(await names(), []);
  await search.fill('');
  assert.deepEqual(await names(), roots);

  await action('Expand all');
  await tree.getByRole('button', { name: /^Work item/ }).click();
  const sorted = ['Customer operations', 'Support readiness', 'Support handoff', 'Training notes',
    'Design research', 'Field studies', 'Customer interviews', 'Platform release', 'Client rollout',
    'Data migration', 'Pilot accounts', 'Quality review', 'Contrast checks', 'Keyboard navigation', 'Screen reader audit'];
  assert.deepEqual(await names(), sorted);
  await tree.getByRole('button', { name: /^Work item/ }).click();
  assert.deepEqual(await names(), ['Platform release', 'Quality review', 'Screen reader audit', 'Keyboard navigation',
    'Contrast checks', 'Client rollout', 'Pilot accounts', 'Data migration', 'Design research', 'Field studies',
    'Customer interviews', 'Customer operations', 'Support readiness', 'Training notes', 'Support handoff']);
  await tree.getByRole('button', { name: 'Estimate (h)', exact: true }).click();
  assert.deepEqual((await names()).slice(4, 8), ['Quality review', 'Contrast checks', 'Keyboard navigation', 'Screen reader audit']);
  if (process.env.TREEGRID_PROOF) await page.locator('#stage').screenshot({ path: process.env.TREEGRID_PROOF + '-expanded.png' });

  await action('Collapse all');
  await tree.getByText('Platform release', { exact: true }).click();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  assert.match(await tree.locator('[data-active]').innerText(), /Client rollout/);
  await page.keyboard.press('ArrowLeft');
  assert.match(await tree.locator('[data-active]').innerText(), /Platform release/);
  await page.keyboard.press('ArrowLeft');
  assert.deepEqual(await names(), roots);
  await search.fill('screen reader audit');
  const leaf = tree.getByRole('row').filter({ hasText: 'Screen reader audit' });
  await leaf.getByText('Nora Shah').dblclick();
  const editor = page.locator('form.cg-inline-editor').getByRole('textbox');
  await editor.fill('Iris Hall');
  await editor.press('Enter');
  assert.match(await leaf.innerText(), /Iris Hall/);
  await page.locator('#application-source summary').click();
  await page.locator('#application-file').selectOption('tree-example.js');
  await page.waitForFunction(() => document.querySelector('#application-code')?.textContent.includes('new ColibriTreeGrid('));

  // Exercise the public API with out-of-order records, numeric keys and a recycled viewport.
  const checks = await page.evaluate(async () => {
    const { ColibriTreeGrid } = await import('/grid/tree-grid.js');
    const host = document.createElement('div');
    document.body.append(host);
    const rows = Array.from({length: 600}, (_, i) => ({uid: i + 1, parent: 0, title: 'Task ' + (i + 1)}));
    rows.push({uid: 0, title: 'Root'});
    const grid = new ColibriTreeGrid(host, {key: 'uid', parentField: 'parent', columns: [{dataField: 'title'}], rows});
    try {
      grid.applyUpdates([{uid: 600, title: 'Updated child'}]);
      grid.setExpanded(0, true);
      grid.activate(600, 0);
      const active = grid.port.querySelector('[data-active]');
      const result = {last: active.textContent.trim(), level: active.parentElement.ariaLevel,
        mounted: grid.canvas.childElementCount, count: grid.view.length};
      grid.collapseAll();
      result.collapsed = grid.view.map(r => r.uid);
      const invalid = action => { try { action(); return false; } catch (e) { return e instanceof RangeError; } };
      result.cycle = invalid(() => grid.applyUpdates([{uid: 0, parent: 600}]));
      result.orphan = invalid(() => grid.setRows([{uid: 'x', parent: 'unavailable'}]));
      grid.filter('Updated child');
      result.recovered = grid.view.map(r => r.uid);
      return result;
    } finally { grid.destroy(); host.remove(); }
  });
  assert.equal(checks.last, 'Updated child');
  assert.equal(checks.level, '2');
  assert(checks.mounted < 30 && checks.count === 601);
  assert.deepEqual(checks.collapsed, [0]);
  assert(checks.cycle && checks.orphan);
  assert.deepEqual(checks.recovered, [0, 600]);
  assert.deepEqual(errors, []);
  console.log(origin, browser.browserType().name(), 'passed branch controls, keyboard, sibling sorts, ancestor search, restore, inline edit, source and recycled rows.');
} finally {
  await browser.close();
  await server?.close();
}

import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import { serveBuild } from './server.mjs';

const server = process.env.KIT_GRID_ORIGIN ? null : await serveBuild();
const origin = process.env.KIT_GRID_ORIGIN || server.origin;
const browser = process.env.BROWSER === 'webkit'
  ? await webkit.launch()
  : await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(origin + '/grid/samples/#full-grid');
  const bar = page.getByRole('group', { name: 'Group by', exact: true });
  const heading = name => page.locator('.wb-titles').getByRole('button', { name, exact: true });
  const chips = bar.locator('[data-group-field]');
  const order = () => chips.evaluateAll(nodes => nodes.map(node => node.dataset.groupField));
  const groups = page.locator('.wb-content .wb-tree-toggle');
  const dropAtEnd = async source => {
    const bounds = await bar.boundingBox();
    await source.dragTo(bar, { targetPosition: { x: bounds.width - 18, y: bounds.height / 2 } });
  };
  // Browser pointer gestures exercise hit testing, nested buttons and the actual drop target.
  for (const name of ['Status', 'Client', 'Team']) await dropAtEnd(heading(name));
  assert.deepEqual(await order(), ['status', 'client', 'team']);
  assert.equal(await heading('Status').count(), 0);
  const first = groups.first();
  assert.match(await first.getAttribute('aria-label'), /In progress \(334\)/);
  await first.click();
  assert.equal(await first.getAttribute('aria-expanded'), 'true');
  await groups.nth(1).click();
  await groups.nth(2).click();
  const leaf = page.locator('.wb-content .wb-row').filter({ has: page.locator('[aria-label="Pin row"]') }).first();
  await leaf.waitFor();
  assert.match(await leaf.locator('[data-field="property"]').innerText(), /^R-/);
  async function verifyLeaf() {
    const label = leaf.locator('.wb-tree-leaf > span');
    assert.equal(await label.innerText(), await leaf.locator('[data-field="property"]').innerText());
    const xs = await groups.locator('.wb-tree-label').evaluateAll(nodes =>
      nodes.slice(0, 3).map(el => el.getBoundingClientRect().left));
    xs.push((await label.boundingBox()).x);
    assert(xs.slice(1).every((x, i) => x >= xs[i] + 14), 'Each child label must sit one indent beyond its parent');
    assert.deepEqual(await page.getByRole('treegrid').locator('.wb-content > [role=row]').evaluateAll(rows =>
      rows.slice(0, 4).map(row => row.getAttribute('aria-level'))), ['1', '2', '3', '4']);
    assert.equal(await leaf.getAttribute('aria-expanded'), null);
  }
  await verifyLeaf();
  await groups.nth(2).click();
  assert.equal(await leaf.count(), 0);
  assert.equal(await groups.nth(1).getAttribute('aria-expanded'), 'true');
  await groups.nth(2).click();
  await verifyLeaf();
  const pager = page.getByRole('group', { name: 'Pagination' });
  await pager.locator('[data-page-action="next"]').click();
  assert.equal(await leaf.getAttribute('aria-level'), '4');
  assert.match(await leaf.locator('.wb-tree-leaf').innerText(), /^R-/);
  await pager.locator('[data-page-action="first"]').click();

  const groupHeader = page.getByRole('columnheader', { name: 'Group', exact: true });
  const bounds = await groupHeader.boundingBox();
  assert(bounds.width >= 200);
  await first.click();
  assert.equal(await groups.count(), 3);
  assert.equal(await leaf.count(), 0);
  // Move Team ahead of Status, then use the keyboard to restore Status as the first level.
  await chips.nth(2).dragTo(chips.first(), { targetPosition: { x: 3, y: 10 } });
  assert.deepEqual(await order(), ['team', 'status', 'client']);
  assert.doesNotMatch(await first.getAttribute('aria-label'), /In progress/);
  await chips.first().locator('button').first().press('Alt+ArrowRight');
  assert.deepEqual(await order(), ['status', 'team', 'client']);
  await chips.first().getByRole('button', { name: 'Sort ascending · Status' }).click();
  assert.match(await first.getAttribute('aria-label'), /Completed/);
  await chips.first().getByRole('button', { name: 'Sort descending · Status' }).click();
  assert.match(await first.getAttribute('aria-label'), /Suspended/);
  await first.click();
  const appearance = () => chips.first().evaluate(node => ({
    surface: getComputedStyle(node).backgroundColor,
    text: getComputedStyle(node).color,
    accent: getComputedStyle(node.querySelector('.wb-group-sort')).color,
  }));
  await groups.nth(1).click();
  await groups.nth(2).click();
  await leaf.waitFor();
  const capture = async () => {
    if (!process.env.GROUPING_SCREENSHOT) return;
    const mode = await page.locator('html').getAttribute('data-theme');
    const bounds = await bar.boundingBox();
    await page.screenshot({ path: process.env.GROUPING_SCREENSHOT + '-' + mode + '.png', animations: 'disabled', clip: {
      x: bounds.x, y: bounds.y, width: Math.min(1100, bounds.width), height: 410,
    } });
  };
  const initial = await appearance();
  await capture();
  await page.locator('#theme').click();
  assert.notEqual((await appearance()).surface, initial.surface);
  assert.notEqual((await appearance()).text, initial.text);
  await capture();
  await page.locator('[aria-controls="kbar-custom"]').click();
  await page.locator('#kit-theme').selectOption('ember');
  await page.waitForFunction(() => document.documentElement.dataset.kitTheme === 'ember');
  await page.keyboard.press('Escape');
  const themeColors = await chips.first().evaluate(chip => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--ui-primary)';
    chip.append(probe);
    const colors = [getComputedStyle(probe).color, getComputedStyle(chip.querySelector('.wb-group-sort')).color];
    probe.remove();
    return colors;
  });
  assert.equal(themeColors[0], themeColors[1]);
  for (const name of ['Team', 'Client', 'Status']) await bar.getByRole('button', { name: 'Remove group ' + name }).click();
  assert.equal(await groupHeader.count(), 0);
  assert.equal(await groups.count(), 0);
  assert.equal(await heading('Status').count(), 1);
  assert.match(await page.locator('.wb-page-range').innerText(), /of 1,000/);
  assert.equal(await page.getByRole('treegrid').count(), 0);
  await page.reload();
  if (await page.locator('html').getAttribute('data-theme') === 'dark') await page.locator('#theme').click();
  for (const name of ['Team', 'Status', 'Client']) await dropAtEnd(heading(name));
  for (const [i, label] of ['Maya Reed, Iris Hall', 'In progress', 'Theo Brown'].entries()) {
    assert.equal(await groups.nth(i).locator('.wb-tree-label').innerText(), label);
    await groups.nth(i).click();
  }
  await verifyLeaf();
  assert.equal(await leaf.locator('.wb-tree-leaf').innerText(), 'R-320.100');
  if (process.env.NESTED_SCREENSHOT) {
    const rows = await page.locator('.wb-content').boundingBox();
    const header = await page.locator('.wb-titles').boundingBox();
    await page.screenshot({ path: process.env.NESTED_SCREENSHOT, animations: 'disabled', clip: {
      x: header.x, y: header.y, width: 790, height: rows.y - header.y + 8 * 35,
    } });
  }
  console.log('Passed three header drops, nested counts and leaves, collapse, drag and keyboard reordering, sorting, Kit themes, and restoration of the flat grid.');
} finally {
  await browser.close();
  await server?.close();
}

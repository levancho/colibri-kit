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
  console.log('Passed three header drops, nested counts and leaves, collapse, drag and keyboard reordering, sorting, Kit themes, and restoration of the flat grid.');
} finally {
  await browser.close();
  await server?.close();
}

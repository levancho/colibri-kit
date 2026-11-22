import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import { serveBuild } from './server.mjs';

const local = process.env.KIT_GRID_ORIGIN ? null : await serveBuild();
const origin = process.env.KIT_GRID_ORIGIN || local.origin;
const browser = process.env.BROWSER === 'webkit' ? await webkit.launch() : await chromium.launch({channel: 'chrome'});
try {
  const page = await browser.newPage({viewport: {width: 1360, height: 900}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin + '/grid/samples/#add-columns');
  const rail = page.locator('#samples');
  await rail.getByRole('link', {name: 'Add columns', exact: true}).waitFor();
  const examples = await rail.getByRole('link').evaluateAll(links => links.map(a => [a.hash.slice(1), a.textContent]));
  assert.equal(examples.length, 17);
  assert.equal(new Set(examples.map(x => x[1])).size, 17);
  const source = page.locator('#source');
  const framework = page.getByRole('tablist', {name: 'Example framework'});
  const checkedFiles = new Set();
  for (const [id, title] of examples) {
    await rail.getByRole('link', {name: title, exact: true}).click();
    await rail.locator('[aria-current="page"]').filter({hasText: title}).waitFor();
    for (const mode of ['html', 'react']) {
      await framework.getByRole('tab', {name: mode === 'html' ? 'HTML' : 'React', exact: true}).click();
      await page.waitForFunction(([id, mode]) => location.hash === '#' + (mode === 'react' ? 'react-' : '') + id, [id, mode]);
      await framework.locator('#preview-' + mode + '[aria-selected=true]').waitFor();
      await source.locator('[role=tabpanel][data-value=' + mode + ']:visible').waitFor();
      await page.locator('#stage [role=gridcell], #stage .wb-row').first().waitFor();
      await source.locator('button[aria-label^=Copy]:visible:enabled').waitFor();
      const panel = source.locator('[role=tabpanel]:visible');
      assert.equal(await panel.getAttribute('data-value'), mode);
      assert.equal(await rail.locator('[aria-current]').textContent(), title);
      const files = panel.getByRole('navigation').getByRole('link');
      const refs = await files.evaluateAll(links => links.map(a => [a.getAttribute('title'), a.href, a.target]));
      assert(refs.length >= 4, id);
      for (const [path, href, target] of refs) {
        if (checkedFiles.has(href)) continue;
        checkedFiles.add(href);
        if (target === '_blank') {
          assert((await page.request.head(href)).ok(), path);
          continue;
        }
        await panel.getByTitle(path, {exact:true}).first().click();
        await panel.locator('button[aria-label^=Copy]:enabled').waitFor();
        const response = await page.request.get(href);
        assert(response.ok(), href);
        assert.equal(await panel.locator('code').textContent(), await response.text(), href);
        assert(await panel.locator('code .token').count(), 'Highlight ' + path);
      }
      if (id === 'add-columns') {
        const before = await page.locator('#stage [role=columnheader]').count();
        await page.locator('#stage').getByRole('button', {name: '+ Add column'}).click();
        assert.equal(await page.locator('#stage [role=columnheader]').count(), before + 1);
      } else if (id === 'full-grid') {
        await page.selectOption('#dataset', 'participants');
        await page.locator('#stage .wb-row').first().waitFor();
      } else if (id === 'tree-grid') {
        await page.getByRole('button',{name:'Collapse all',exact:true}).click();
        assert.equal(await page.locator('.cg-tree-cell').count(), 3);
      } else if (id === 'trading-desk') {
        await page.locator('#pause').click();
        assert.match(await page.locator('#pause').innerText(), /resume/i);
      } else if (id === 'inventory') {
        await page.selectOption('#mode', 'pivot');
        await page.getByText('Quantity calculation', {exact:false}).first().waitFor();
      } else if (id === 'editable-directory') {
        await page.locator('#directory .cg-canvas [role=row]').first().getByRole('gridcell').nth(1).dblclick();
        await page.locator('form.cg-inline-editor input').press('Escape');
      }
    }
  }
  await page.goto(origin+'/grid/samples/#add-columns');
  const code = source.locator('#code-html');
  await code.locator('.language-javascript .token.keyword').first().waitFor();
  await code.getByRole('link', {name: /cells\.js/}).first().click();
  await source.getByText('samples/cells.js',{exact:true}).waitFor();
  for (const lang of ['FreeMarker','Thymeleaf']) {
    await source.getByRole('tab', {name: lang, exact:true}).click();
    const panel = source.locator('[role=tabpanel]:visible');
    await panel.locator('code .language-javascript .token.keyword').first().waitFor();
    const name = lang === 'FreeMarker' ? 'grid-sample.ftl' : 'grid-sample.html';
    await panel.getByRole('link',{name,exact:true}).click();
    await panel.locator('code .token').first().waitFor();
  }
  await source.getByRole('tab', {name: 'HTML', exact:true}).click();
  await source.locator('.source-files:visible button').click();
  await code.locator('.language-javascript .token.keyword').first().waitFor();
  for (const theme of ['light', 'dark']) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    const minimum = await code.evaluate(el => {
      const luminance = color => {
        const [r,g,b] = color.match(/\d+/g).slice(0,3).map(Number).map(n => n/255)
          .map(n => n <= .04045 ? n/12.92 : ((n+.055)/1.055)**2.4);
        return .2126*r + .7152*g + .0722*b;
      };
      const bg = luminance(getComputedStyle(el.parentElement).backgroundColor);
      return Math.min(...Array.from(el.querySelectorAll('.token'), token => {
        const fg = luminance(getComputedStyle(token).color);
        return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05);
      }));
    });
    assert(minimum >= 4.5, theme + ' contrast ' + minimum);
  }
  assert.deepEqual(errors, []);
  console.log(origin, browser.browserType().name(), examples.length * 2, 'working previews;', checkedFiles.size, 'source URLs checked');
} finally {
  await browser.close();
  await local?.close();
}

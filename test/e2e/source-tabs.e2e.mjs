import assert from 'node:assert/strict';
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import {serveBuild} from './server.mjs';
const server=await serveBuild();
const browser=await puppeteer.launch({executablePath:process.env.CHROME || ['/usr/bin/google-chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(fs.existsSync),args:['--no-sandbox']});
try {
 const page=await browser.newPage();
 await page.goto(server.origin);await page.waitForFunction(()=>document.querySelector('#ct-install [role=tab]'));
 await page.click('#ct-install [data-value=thymeleaf][role=tab]');
 assert.equal(await page.$$eval('[data-sync=lang]',groups=>groups.every(g=>g.querySelector('[data-value=thymeleaf][role=tab]').getAttribute('aria-selected')==='true')),true);
 await page.reload();await page.waitForFunction(()=>document.querySelector('#ct-install [data-value=thymeleaf][role=tab]')?.getAttribute('aria-selected')==='true');
 for (const width of [320,1280]) {
  await page.setViewport({width,height:900});await page.goto(server.origin+'/kitchen-sink/examples/kitchen-sink.html#dialog');await page.waitForFunction(()=>window.__sinkReady);
  assert.equal(await page.$$eval('.sink-code-tabs',groups=>groups.filter(g=>g.querySelector('[role=tab][data-value=html]')).every(g=>g.querySelector('[role=tab][data-value=thymeleaf]'))),true);
  const tab='#dialog .sink-code-tabs [role=tab][data-value=html]';await page.focus(tab);await page.keyboard.press('End');
  await page.waitForFunction(()=>document.querySelector('#dialog .sink-code-tabs [data-value=thymeleaf][role=tab]').getAttribute('aria-selected')==='true');
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.copiedSource=text}}));
  await page.$eval('#dialog [role=tabpanel][data-value=thymeleaf] .sink-copy',el=>el.scrollIntoView({block:'center'}));
  await page.waitForSelector('#dialog [role=tabpanel][data-value=thymeleaf] .sink-copy',{visible:true});
  await page.click('#dialog [role=tabpanel][data-value=thymeleaf] .sink-copy');
  assert.match(await page.evaluate(()=>window.copiedSource),/th:replace="~\{colibri\/thymeleaf\/dialog :: dialog/);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'four tabs do not cause page overflow');
 }
 console.log('ok Thymeleaf source tabs: gallery coverage, keyboard, copy, homepage sync/persistence, mobile width');
} finally {await browser.close();await server.close();}

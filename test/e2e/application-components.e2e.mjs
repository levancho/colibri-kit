import assert from 'node:assert/strict';
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import {serveBuild} from './server.mjs';
const server=await serveBuild(), base=server.origin;
const browser=await puppeteer.launch({executablePath:process.env.CHROME||['/usr/bin/google-chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(fs.existsSync),args:['--no-sandbox']});
const models=JSON.parse(fs.readFileSync('examples/application-models.json','utf8'));
const generated=JSON.parse(fs.readFileSync('tools/applications/generated.json','utf8'));
try {
 const page=await browser.newPage(), errors=[],blocked=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.setRequestInterception(true);
 page.on('request',r=>{if(/\/examples\/dashboards\/.*\.(css|js)(\?|$)/.test(r.url())){blocked.push(r.url());r.abort();}else r.continue();});
 await page.goto(base+'/application-components.html');
 const client=await page.createCDPSession();const downloads=[];
 await client.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:'/tmp/colibri-component-downloads',eventsEnabled:true});
 client.on('Browser.downloadWillBegin',e=>downloads.push(e.suggestedFilename));
 async function closeDialog(){await page.click('dialog button:last-child');await page.waitForSelector('dialog',{hidden:true});}
 async function exercise(key){
  await page.waitForSelector('[data-preview-ready=true]');
  if(key==='shell'){
   await page.click('[data-id=records]');assert.equal(await page.$eval('h1',e=>e.textContent),'Records');
   await page.setViewport({width:390,height:900});await page.click('[data-app-part=trigger]');assert.equal(await page.$eval('[data-app-part=trigger]',e=>e.getAttribute('aria-expanded')),'true');assert.ok(await page.$eval('[data-app-part=sidebar]',e=>e.getBoundingClientRect().left>=0),'mobile sidebar is visible');await page.keyboard.press('Escape');assert.equal(await page.$eval('[data-app-part=trigger]',e=>e.getAttribute('aria-expanded')),'false');
  }
  if(key==='table'){
   await page.type('[data-app-filter]','Maya');assert.equal(await page.$$eval('tbody tr:not([hidden])',e=>e.length),1);
   await page.click('[data-id=maya]');assert.equal(await page.$eval('dialog input',e=>e.value),'Maya Chen');await closeDialog();
  }
  if(key==='board'){
   await page.click('[data-id=atlas]');await page.select('dialog select','won');await page.click('dialog button[type=submit]');
   assert.ok(await page.$('.lane:last-child [data-id=atlas]'));
  }
  if(key==='projects'||key==='planner'){
   await page.click('[data-app-action]');assert.ok(await page.$('dialog[open]'));assert.ok(await page.$$eval('dialog input',els=>els.every(e=>e.value.length>0)));await closeDialog();
  }
  if(key==='identity'){
   await page.click('[data-app-action]');await page.$eval('dialog input[name=name]',e=>e.value='Updated Jordan');await page.click('dialog button[type=submit]');assert.equal(await page.$eval('.identity-card h3',e=>e.textContent),'Updated Jordan');
  }
  if(key==='products'){
   await page.click('[data-app-action=add-product]');await page.click('[data-app-action=add-product]');assert.equal(await page.$eval('[data-cart-status]',e=>e.textContent),'2 items · $640 total');
  }
  if(key==='receipt'){
   const before=downloads.length;await page.click('[data-app-action=download-receipt]');await new Promise(r=>setTimeout(r,250));assert.ok(downloads.length>before);assert.equal(downloads.at(-1),'receipt.txt');
  }
  if(key==='form'){
   await page.$eval('input[name=name]',e=>e.value='Updated Name');await page.click('button[type=submit]');assert.match(await page.$eval('[role=status]',e=>e.textContent),/Updated Name/);
  }
  if(key==='conversation'){
   await page.click('[data-id="2080"]');assert.equal(await page.$eval('[data-ticket-title]',e=>e.textContent),'Update our invoice address');
   await page.select('[data-ticket-status]','Resolved');await page.select('[data-ticket-assignee]','Jordan Lee');await page.type('textarea','Address updated.');await page.click('button[type=submit]');
   await page.click('[data-id="2081"]');assert.doesNotMatch(await page.$eval('[data-ticket-messages]',e=>e.textContent),/Address updated/);
   await page.click('[data-id="2080"]');assert.equal(await page.$eval('[data-ticket-status]',e=>e.value),'Resolved');assert.equal(await page.$eval('[data-ticket-assignee]',e=>e.value),'Jordan Lee');assert.match(await page.$eval('[data-ticket-messages]',e=>e.textContent),/Address updated/);
  }
  if(key==='photo'||key==='article'){
   const link=await page.$eval('a[href]',e=>({href:e.href,target:e.target}));assert.equal(link.target,'_blank');
   const response=await fetch(link.href);assert.equal(response.status,200);
  }
  await page.setViewport({width:390,height:900});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),key+' mobile overflow');
 }
 for(const source of ['html','freemarker','thymeleaf']){
  for(const key of Object.keys(models)){
   const body=source==='html'?generated[key].html:fs.readFileSync(`java/colibri-templates/target/application-fixtures/${key}-${source}.html`,'utf8');
   await page.setViewport({width:1280,height:1000});
   await page.setContent(`<!doctype html><html><head><base href="${base}/kitchen-sink/examples/"><link rel="stylesheet" href="${base}/css/colibri.css"><link rel="stylesheet" href="${base}/css/colibri-applications.css"></head><body class="colibri-application">${body}<script type="module" src="${base}/kitchen-sink/examples/application-preview-entry.js?case=${source}-${key}"></script></body></html>`,{waitUntil:'load'});
   await exercise(key);
  }
  console.log('ok '+source+': all 13 application components and their visible actions');
 }
 for(const source of ['freemarker','thymeleaf']){
  const body=fs.readFileSync(`java/colibri-templates/target/chart-fixtures/${source}.html`,'utf8');
  await page.setContent(`<!doctype html><html><head><link rel="stylesheet" href="${base}/css/colibri.css"><link rel="stylesheet" href="${base}/css/colibri-applications.css"></head><body class="colibri-application">${body}<script type="module">import {createChartPanel} from '${base}/ui/src/core/charts.js';createChartPanel(document.querySelector('[data-application-chart]'));</script></body></html>`,{waitUntil:'load'});
  await page.waitForSelector('[data-chart-bound]');
  for(const n of [7,14,30]){await page.click(`[data-n="${n}"]`);assert.equal(await page.$$eval('tbody tr:not([hidden])',e=>e.length),n);assert.equal(await page.$eval('[data-chart]',e=>JSON.parse(e.dataset.values)[0].length),n);assert.equal(await page.$eval('[data-chart]',e=>JSON.parse(e.dataset.values)[0][0]),(31-n)*10);assert.equal(await page.$('[data-chart-error]'),null);assert.match(await page.$eval('[role=status]',e=>e.textContent),new RegExp(`${n} days`));}
 }
 await page.goto(base+'/kitchen-sink/examples/kitchen-sink.html#application-chart',{waitUntil:'networkidle0'});
 for(const key of [...Object.keys(models),'chart']){
  for(const lang of ['react','ftl','thymeleaf']){
   const code=await page.$eval(`#code-application-${key}-${lang}`,e=>e.textContent);
   assert.doesNotMatch(code,/No macro needed|Native HTML works directly/);
  }
 }
 const frame=await(await page.$('#application-chart iframe')).contentFrame();await frame.waitForSelector('[data-chart-bound]');
 for(const n of [7,14,30]){await frame.click(`[data-n="${n}"]`);assert.equal(await frame.$eval('[data-chart]',e=>JSON.parse(e.dataset.values)[0].length),n);}
 assert.deepEqual(blocked,[]);assert.deepEqual(errors,[]);
 console.log('ok native chart ranges, all 42 framework tabs, no private dashboard CSS or JS');
}finally{await browser.close();await server.close();}

import assert from 'node:assert/strict';import fs from 'node:fs';import puppeteer from 'puppeteer-core';import {serveBuild} from './server.mjs';
const server=await serveBuild(),browser=await puppeteer.launch({executablePath:process.env.CHROME||['/usr/bin/google-chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(fs.existsSync),args:['--no-sandbox']});
try{const page=await browser.newPage();await page.setViewport({width:1440,height:1000});const base=server.origin+'/kitchen-sink/examples/dashboards/';await page.goto(base+'index.html',{waitUntil:'networkidle0'});await page.evaluate(()=>localStorage.setItem('colibri.devicePreview','phone'));await page.reload({waitUntil:'networkidle0'});assert.equal(await page.$('.kpage-head .dp-bar'),null);assert.equal(await page.$('.dp-stage'),null);assert.equal(await page.$$eval('.preview-devices',els=>els.length),6);
 const card=name=>`.dashboard-preview[data-demo=${name}]`;await page.click(card('analytics')+' [data-device=phone]');assert.equal(await page.$eval(card('analytics')+' iframe',f=>f.contentWindow.innerWidth),390);assert.equal(await page.$eval(card('crm')+' iframe',f=>f.contentWindow.innerWidth),1440);await page.click(card('crm')+' [data-device=tablet]');assert.equal(await page.$eval(card('crm')+' iframe',f=>f.contentWindow.innerWidth),768);assert.equal(await page.$eval(card('analytics')+' iframe',f=>f.contentWindow.innerWidth),390);await page.waitForFunction(()=>['analytics','crm'].every(n=>document.querySelector(`[data-demo=${n}] iframe`).contentDocument.querySelector('.suite-sidebar').getBoundingClientRect().right<=1));assert.ok(page.url().endsWith('index.html'));assert.equal(await page.$('.dp-stage'),null);
 await page.focus(card('analytics')+' [data-device=phone]');await page.keyboard.press('Home');assert.equal(await page.$eval(card('analytics')+' iframe',f=>f.contentWindow.innerWidth),1440);
 await page.setViewport({width:390,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.setViewport({width:1440,height:1000});
 for(const name of ['analytics','crm','workspace','account','commerce','support']){await page.goto(base+name+'.html',{waitUntil:'networkidle0'});assert.equal(await page.$$eval('header .dp-bar',els=>els.length),1,name+' owns its device control');await page.click('header [data-device=phone]');await page.waitForSelector('.dp-stage iframe');await page.waitForFunction(()=>document.querySelector('.dp-stage iframe').contentWindow.innerWidth===390);await page.click('header [data-device=desktop]');assert.equal(await page.$('.dp-stage'),null);}

 const accents = new Set();
 for(const name of ['analytics','crm','workspace','account','commerce','support']){
   await page.goto(base+'index.html',{waitUntil:'networkidle0'});
   assert.equal(await page.$$eval('.preview-toolbar a',els=>els.length),0);
   await Promise.all([page.waitForNavigation({waitUntil:'networkidle0'}),page.click(card(name)+' .shot')]);
   assert.equal(new URL(page.url()).pathname.split('/').pop(),name+'.html');
   accents.add(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--c-accent')));
 }
 assert.equal(accents.size,6,'Each application has a distinct default accent');
 await page.goto(base+'index.html',{waitUntil:'networkidle0'});
 await page.focus(card('analytics')+' .gallery-link');
 await Promise.all([page.waitForNavigation({waitUntil:'networkidle0'}),page.keyboard.press('Enter')]);
 assert.ok(page.url().endsWith('/analytics.html'));
 await page.evaluate(()=>{const hue=document.querySelector('#hue');hue.value='110';hue.dispatchEvent(new Event('input',{bubbles:true}));});
 const accent=await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--c-accent'));
 for(const route of ['analytics-traffic','analytics-audience','analytics-events','analytics-reports','analytics-settings','analytics']){
   await page.goto(base+route+'.html',{waitUntil:'networkidle0'});
   assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--c-accent')),accent,route+' preserves accent');
 }
 console.log('ok all six image links, keyboard navigation, distinct accents and Analytics theme persistence');
 console.log('ok six independent card controls, actual 390/768/1440 iframe widths, no gallery-wide preview, keyboard selection and standalone controls');
}finally{await browser.close();await server.close();}

import assert from 'node:assert/strict';import fs from 'node:fs';import puppeteer from 'puppeteer-core';import {serveBuild} from './server.mjs';
const server=await serveBuild(),base=server.origin+'/kitchen-sink/examples/dashboards/',browser=await puppeteer.launch({executablePath:process.env.CHROME||['/usr/bin/google-chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(fs.existsSync),args:['--no-sandbox']});
try{
 const page=await browser.newPage();await page.setViewport({width:1440,height:1000});const go=async path=>page.goto(base+path,{waitUntil:'networkidle0'});
 await go('index.html');await page.evaluate(()=>localStorage.setItem('colibri-bridge-theme',JSON.stringify({v:1,source:'colibria',name:'Saved green',colors:['#131922','#30BD94','#F5F6F7'],roles:{accent:'#30BD94',background:'#131922',surface:'#1C2430',text:'#F5F6F7'},scheme:'dark'})));
 const colors=()=>page.evaluate(()=>{const s=getComputedStyle(document.documentElement);return ['--c-accent','--c-bg','--c-fg'].map(k=>s.getPropertyValue(k))});
 for(const domain of ['analytics','crm']){
  await go(domain+'.html');const expected=await colors();const geometry=await page.evaluate(()=>Object.fromEntries(['header','h1','#pack,#app-pack','.suite-context'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return [s,[Math.round(r.x),Math.round(r.y),Math.round(r.height)]]})));const links=await page.$$eval('.suite-context a',els=>els.map(e=>e.getAttribute('href')));
  for(const route of links){await go(route);assert.deepEqual(await colors(),expected,route+' ignores stale global palette');assert.deepEqual(await page.evaluate(()=>Object.fromEntries(['header','h1','#pack,#app-pack','.suite-context'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return [s,[Math.round(r.x),Math.round(r.y),Math.round(r.height)]]}))),geometry,route+' stable shell geometry');}
  await go(domain+'.html');await page.select('#pack','colibria-palette');const custom=await colors();assert.notDeepEqual(custom,expected);
  for(const route of links){await go(route);assert.deepEqual(await colors(),custom,route+' restores selected palette');}
  await page.select('#pack,#app-pack',domain==='crm'?'ember':'glacier');await go(domain+'.html');assert.deepEqual(await colors(),expected,domain+' clears custom inline tokens');
 }
 await go('index.html');await page.waitForFunction(()=>[...document.querySelectorAll('.shot iframe')].slice(0,2).every(f=>f.contentDocument?.body?.inert));
 const shot=await page.$('.dashboard-preview .shot');const rect=await shot.boundingBox();await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.wheel({deltaY:450});await new Promise(r=>setTimeout(r,300));
 assert.ok(await page.evaluate(()=>scrollY>0),'wheel scrolls gallery');assert.equal(await page.$eval('.shot iframe',f=>f.contentWindow.scrollY),0,'thumbnail stays at top');
 await page.$eval('.shot iframe',f=>f.contentWindow.scrollTo(0,600));assert.equal(await page.$eval('.shot iframe',f=>f.contentWindow.scrollY),0,'thumbnail cannot programmatically scroll');
 await Promise.all([page.waitForNavigation({waitUntil:'networkidle0'}),page.click('.gallery-link[href="analytics.html"]')]);assert.ok(page.url().endsWith('/analytics.html'));
 await page.mouse.wheel({deltaY:500});await new Promise(r=>setTimeout(r,300));assert.ok(await page.evaluate(()=>scrollY>0),'opened application scrolls normally');
 console.log('ok saved legacy palette, explicit custom selection/reset, every domain route, gallery wheel and frozen previews, full-page scrolling');
}finally{await browser.close();await server.close();}

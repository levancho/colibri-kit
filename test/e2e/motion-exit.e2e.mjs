import fs from 'node:fs';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {serveBuild} from './server.mjs';
const server=await serveBuild();
const browser=await puppeteer.launch({executablePath:process.env.CHROME || ['/usr/bin/google-chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(fs.existsSync),args:['--no-sandbox']});
const root='#motion-wired [data-ui=dropdown-menu]';
try {
 const page=await browser.newPage();await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}]);
 for(const width of [390,1280]) {
  await page.setViewport({width,height:900});await page.goto(server.origin+'/kitchen-sink/examples/kitchen-sink.html#motion-wired');await page.waitForFunction(()=>window.__sinkReady);
  await page.addStyleTag({content:':root{--ui-motion-duration:400ms}'});
  for(const close of ['trigger','escape','outside']) {
   await page.click(root+' > [data-ui-part=trigger]');
   await page.waitForFunction(sel=>document.querySelector(sel).getAnimations().every(a=>a.playState==='finished'),{},root+' > [data-ui-part=content]');
   const rect=await page.$eval(root+' > [data-ui-part=content]',el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}});
   if(close==='trigger')await page.click(root+' > [data-ui-part=trigger]');else if(close==='escape')await page.keyboard.press('Escape');else await page.mouse.click(5,5);
   const ghost=await page.$eval(root+' > [data-motion-ghost]',el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,inert:el.inert,hidden:el.getAttribute('aria-hidden'),contain:getComputedStyle(el.closest('.sink-sec')).contentVisibility}});
   assert.ok(Math.abs(rect.x-ghost.x)<12 && Math.abs(rect.y-ghost.y)<16,`${width} ${close}: exit copy moved ${JSON.stringify({rect,ghost})}`);
   assert.equal(ghost.contain,'visible');assert.equal(ghost.inert,true);assert.equal(ghost.hidden,'true');
   await page.waitForFunction(sel=>!document.querySelector(sel),{},root+' > [data-motion-ghost]');
   assert.equal(await page.$eval(root+' > [data-ui-part=content]',el=>el.hidden),true);
  }
 }
 await page.goto(server.origin+'/java-templates.html');
 const href=await page.$eval('a[download]',el=>el.href);
 const data=await fetch(href);assert.equal(data.status,200);assert.deepEqual(Buffer.from(await data.arrayBuffer()),fs.readFileSync('java/colibri-templates/target/colibri-templates-0.1.0-SNAPSHOT.jar'));
 console.log('ok dropdown exits preserve viewport coordinates at 2 widths for trigger/Escape/outside; Java setup serves the exact packaged JAR');
} finally {await browser.close();await server.close();}

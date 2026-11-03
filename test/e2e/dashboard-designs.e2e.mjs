import assert from 'node:assert/strict';
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import {serveBuild} from './server.mjs';
const server=await serveBuild(),base=server.origin+'/kitchen-sink/examples/dashboards/';
const browser=await puppeteer.launch({executablePath:process.env.CHROME||['/usr/bin/google-chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(fs.existsSync),args:['--no-sandbox']});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const go=async route=>page.goto(base+route,{waitUntil:'networkidle0'});
 const clickLink=async selector=>Promise.all([page.waitForNavigation({waitUntil:'networkidle0'}),page.click(selector)]);
 await page.setViewport({width:1440,height:1000});
 await go('workspace.html');await page.click('[data-action=new-team]');
 for(const [name,value] of Object.entries({name:'Research & Insights',description:'Customer interviews',lead:'Maya Chen'}))await page.type(`dialog [name=${name}]`,value);
 await page.click('dialog [type=submit]');assert.match(await page.$eval('.project-grid',e=>e.textContent),/Research & Insights/);
 await page.evaluate(()=>{const links=[...document.querySelectorAll('.project-card h3 a')];links.find(a=>a.textContent==='Research & Insights').id='created-team';});
 await clickLink('#created-team');assert.match(await page.$eval('h1',e=>e.textContent),/Research & Insights/);
 await page.click('[data-action=team-progress]');await page.$eval('dialog [name=progress]',e=>e.value='42');await page.click('dialog [type=submit]');
 await go('workspace.html');assert.match(await page.$eval('.project-grid',e=>e.textContent),/42%/);
 await go('commerce.html');await page.click('.store-product [data-action=stock][data-id=mug]');await page.$eval('dialog [name=stock]',e=>e.value='21');await page.click('dialog [type=submit]');assert.match(await page.$eval('.store-products',e=>e.textContent),/21 in stock/);assert.doesNotMatch(await page.$eval('.stock-list',e=>e.textContent),/Ceramic mug/);
 await clickLink('.fulfillment-note a');assert.match(page.url(),/view=orders&id=/);assert.ok(await page.$('[data-action=order-status]'));
 await go('account.html');await clickLink('.settings-row[href*="view=security"]');await page.click('[data-security=twoFactor]');await go('account.html');assert.match(await page.$eval('.security-summary',e=>e.textContent),/enabled/);
 await go('support.html');await clickLink('.support-tabs a[href*="view=open"]');assert.ok(await page.$$eval('.support-ticket',els=>els.every(e=>e.textContent.includes('Open'))));await page.click('.customer-context [data-action=assign]');await page.select('dialog select','Maya Chen');await page.click('dialog [type=submit]');assert.match(await page.$eval('.customer-context',e=>e.textContent),/Maya Chen/);await clickLink('.context-guide a');assert.match(page.url(),/view=knowledge/);
 await go('analytics.html');await clickLink('.panel-link');assert.ok(page.url().endsWith('analytics-traffic.html'));
 await go('crm.html');await clickLink('.sales-brief a[href="crm-activity.html"]');assert.ok(await page.$('[data-task]')||await page.$('table'));
 const axe=fs.readFileSync('node_modules/axe-core/axe.min.js','utf8');
 for(const width of [390,768,1440])for(const app of ['analytics','crm','workspace','account','commerce','support']){
  await page.setViewport({width,height:1000});await go(app+'.html');
  await page.evaluate(async()=>{for(const img of document.images){img.loading='eager';await img.decode();}});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${app} ${width} overflow`);
  assert.ok(await page.$$eval('main img',imgs=>imgs.length>0&&imgs.every(i=>i.naturalWidth>0)),app+' artwork');
  for(const scheme of ['light','dark']){
   await page.evaluate(async s=>{document.documentElement.dataset.theme=s;await new Promise(requestAnimationFrame);await Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})));},scheme);
   await page.addScriptTag({content:axe});const violations=await page.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));
   assert.deepEqual(violations,[],`${app} ${width} ${scheme}`);
  }
 }
 assert.deepEqual(errors,[]);console.log('ok redesign: home-page actions update real demo state, deep links, loaded assets, six layouts at 390/768/1440, light/dark axe');
}finally{await browser.close();await server.close();}

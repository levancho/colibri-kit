import fs from 'node:fs';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {serveBuild} from './server.mjs';
const server=await serveBuild(), base=server.origin+'/kitchen-sink/examples/dashboards/';
const browser=await puppeteer.launch({executablePath:process.env.CHROME||['/usr/bin/google-chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(fs.existsSync),args:['--no-sandbox']});
try {
 const page=await browser.newPage(), errors=[];page.on('pageerror',e=>errors.push(e.message));
 const go=async path=>{await page.goto(base+path,{waitUntil:'networkidle0'});};
 const fill=async(name,value)=>page.$eval(`dialog [name="${name}"]`,(e,v)=>e.value=v,value);
 const save=async()=>page.click('dialog [type=submit]');
 await page.setViewport({width:1440,height:1000});
 await go('workspace.html?view=teams');await page.click('[data-action=new-team]');await fill('name','Platform QA');await fill('description','Release validation');await fill('lead','Test Lead');await save();assert.match(await page.$eval('#app-content',e=>e.textContent),/Platform QA/);await page.reload();assert.match(await page.$eval('#app-content',e=>e.textContent),/Platform QA/);
 await go('workspace.html?view=members');await page.click('[data-action=add-member]');await fill('name','Test Member');await fill('email','test@example.com');await save();assert.match(await page.$eval('#app-content',e=>e.textContent),/Test Member/);
 await go('workspace.html?view=agenda');await page.click('[data-agenda="0"]');await page.reload();assert.equal(await page.$eval('[data-agenda="0"]',e=>e.checked),true);
 await go('account.html?view=profile');await page.$eval('[name=name]',e=>e.value='Demo Profile');await page.click('[type=submit]');await page.reload();assert.equal(await page.$eval('[name=name]',e=>e.value),'Demo Profile');
 await go('account.html?view=security');await page.click('[data-action=revoke]');await page.click('#confirm-action');assert.equal(await page.$$eval('[data-action=revoke]',e=>e.length),1);
 await go('account.html?view=billing');await page.click('[data-action=change-plan]');await page.select('dialog select','Starter');await save();assert.match(await page.$eval('#app-content',e=>e.textContent),/\$19/);
 await go('commerce.html?view=orders&id=1048');await page.click('[data-action=order-status]');await page.select('dialog select','Delivered');await save();await page.reload();assert.match(await page.$eval('#app-content',e=>e.textContent),/Delivered/);
 await go('commerce.html?view=inventory');await page.click('[data-action=stock][data-id=mug]');await fill('stock','50');await save();assert.match(await page.$eval('#app-content',e=>e.textContent),/50 in stock/);
 await go('support.html');await page.click('[data-action=assign]');await page.select('dialog select','Maya Chen');await save();assert.match(await page.$eval('.support-thread',e=>e.textContent),/Assigned to Maya Chen/);
 await page.type('[name=reply]','We can help check the member limit.');await page.click('[type=submit]');await page.reload();assert.match(await page.$eval('.support-thread',e=>e.textContent),/We can help/);
 await page.click('[data-action=ticket-status]');await page.select('dialog select','Resolved');await save();await go('support.html?view=resolved');assert.match(await page.$eval('.support-queue',e=>e.textContent),/Cannot invite/);
 const axe=fs.readFileSync('node_modules/axe-core/axe.min.js','utf8');
 for(const width of [390,1440])for(const scheme of ['light','dark'])for(const name of ['workspace','account','commerce','support']){
  await page.setViewport({width,height:1000});await go(name+'.html');await page.evaluate(s=>document.documentElement.dataset.theme=s,scheme);await page.evaluate(async()=>{await Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})));});
  assert.equal(await page.$$eval('a.btn',els=>els.every(el=>getComputedStyle(el).color!==getComputedStyle(el).backgroundColor)),true,'button links need visible text');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name} ${width}: overflow`);
  await page.addScriptTag({content:axe});const violations=await page.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[],`${name} ${scheme} ${width}: accessibility`);
  if(width===1440&&scheme==='light')await page.screenshot({path:`/tmp/colibri-${name}.png`});
 }
 for(const route of ['workspace.html?view=teams','workspace.html?view=members','account.html?view=members','commerce.html?view=inventory','support.html?view=knowledge']){
  await page.setViewport({width:1440,height:1000});await go(route);
  await page.evaluate(async()=>{for(const img of document.images){img.loading='eager';await img.decode();}});
  assert.ok(await page.$$eval('#app-content img',imgs=>imgs.length>0&&imgs.every(i=>i.naturalWidth>0)),route+': local imagery loads');
  await page.screenshot({path:'/tmp/colibri-detail-'+route.split('.')[0]+'-'+new URLSearchParams(route.split('?')[1]).get('view')+'.png'});
  await page.setViewport({width:390,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+': mobile overflow');
  await page.addScriptTag({content:axe});assert.deepEqual(await page.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id)),[],route+': accessibility');
 }
 for(const name of ['analytics','crm']){await page.setViewport({width:1440,height:1000});await go(name+'.html');await page.screenshot({path:`/tmp/colibri-${name}-distinct.png`});}
 await go('index.html');assert.equal(await page.$$eval('.dashboard-preview',e=>e.length),6);
 assert.deepEqual(errors,[]);console.log('ok four distinct apps: persistence, team/member forms, agenda, profile/security/billing, fulfillment/inventory, ticket assignments/replies/status, light/dark mobile layouts, axe and six gallery entries');
}finally{await browser.close();await server.close();}

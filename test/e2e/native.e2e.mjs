// @colibri-kit/native rendered through react-native-web (site/dist/native): palette parity with Colibri CSS, and behaviour.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import {serveBuild} from './server.mjs';
import {createTheme} from '../../packages/colibri-native/src/theme.js';
const server=await serveBuild();
const browser=await puppeteer.launch({executablePath:process.env.CHROME || ['/usr/bin/google-chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(fs.existsSync),args:['--no-sandbox']});
try {
 // 1. The JavaScript palette matches what a browser computes from Colibri CSS for the same hue and scheme.
 const css=await browser.newPage();await css.goto(server.origin+'/404.html');
 const TOKENS={bg:'--c-bg',surface:'--c-surface',sunken:'--c-sunken',fg:'--c-fg',muted:'--c-muted',line:'--c-line',accent:'--c-accent',brandFg:'--c-brand-fg',ok:'--c-ok',warn:'--c-warn',bad:'--c-bad'};
 for (const hue of [255,150,20,320]) for (const scheme of ['light','dark']) {
  const browserColors=await css.evaluate((tokens,hue,scheme)=>{
   const probe=document.createElement('div');probe.setAttribute('data-colibri-theme','');probe.style.cssText=`--c-hue:${hue};color-scheme:${scheme}`;document.body.append(probe);
   const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d',{willReadFrequently:true}),out={};
   for (const [name,token] of Object.entries(tokens)) {probe.style.backgroundColor=`var(${token})`;ctx.fillStyle=getComputedStyle(probe).backgroundColor;ctx.fillRect(0,0,1,1);out[name]=[...ctx.getImageData(0,0,1,1).data.slice(0,3)];}
   probe.remove();return out;},TOKENS,hue,scheme);
  const theme=createTheme({hue,scheme});
  for (const [name,rgb] of Object.entries(browserColors)) {
   const mine=[1,3,5].map(i=>parseInt(theme.colors[name].slice(i,i+2),16));
   assert.ok(mine.every((v,i)=>Math.abs(v-rgb[i])<=2),`${scheme} hue ${hue} ${name}: native ${mine} vs CSS ${rgb}`);
  }
 }
 await css.close();

 // 2. The site page lists every demo by category and opens the chosen one on the phone.
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>['error','warning'].includes(m.type())&&errors.push(m.text()));
 await page.setViewport({width:1280,height:900});
 await page.goto(server.origin+'/native/');await page.waitForFunction(()=>'nativeReady' in document.documentElement.dataset&&document.querySelector('.np-card'));
 // The demo app runs in its own frame, so the window it measures is the phone.
 const app=page.frames().find(frame=>frame.url().includes('/native/app.html'));assert.ok(app,'the phone frame exists');await app.waitForSelector('[data-testid=home]');
 assert.ok(await app.evaluate(()=>innerWidth)<500,'the demo sees a phone-sized window');
 assert.equal(await page.$eval('header.kbar a[aria-current=page]',a=>a.textContent),'React Native');
 const catalog=await app.evaluate(()=>globalThis.ColibriNativeCatalog);
 const total=catalog.reduce((sum,group)=>sum+group.demos.length,0);
 assert.ok(total>=100,`the catalog has ${total} demos`);
 assert.equal(new Set(catalog.flatMap(group=>group.demos.map(demo=>demo.id))).size,total,'demo ids are unique');
 assert.equal(await page.$$eval('.np-card',cards=>cards.length),total);assert.equal(await page.$eval('#np-count',e=>e.textContent),String(total));
 // Layout: the list and the phone sit side by side and the phone does not cover the cards.
 const layout=await page.evaluate(()=>{document.querySelector('.np-card').scrollIntoView({block:'center'});const card=document.querySelector('.np-card').getBoundingClientRect(),phone=document.querySelector('.np-phone').getBoundingClientRect(),hit=document.elementFromPoint(card.x+card.width/2,card.y+card.height/2);return{cardRight:card.right,cardWidth:card.width,phoneLeft:phone.left,hitsCard:!!hit.closest('.np-card')};});
 assert.ok(layout.hitsCard&&layout.cardWidth>=180&&layout.phoneLeft>=layout.cardRight,JSON.stringify(layout));
 await page.type('#np-q','button');
 const visible=await page.$$eval('.np-card:not([hidden])',cards=>cards.map(card=>card.dataset.id));
 assert.ok(visible.includes('button')&&visible.length<total);
 await page.click('.np-card[data-id=button]');
 await app.waitForSelector('[data-testid=demo-button]');
 assert.equal(await page.$eval('.np-card[aria-current]',card=>card.dataset.id),'button');

 // 3. The basics behave: theme controls, buttons, form controls, overlays.
 const open=async id=>{await page.evaluate(id=>{location.hash=id;},id);await app.waitForSelector(id?`[data-testid="demo-${id}"]`:'[data-testid=home]');};
 const byText=(role,text)=>app.evaluateHandle((role,text)=>[...document.querySelectorAll(`[role=${role}]`)].find(el=>(el.getAttribute("aria-label")??el.textContent.trim())===text),role,text);
 const press=async(role,text)=>{const el=await byText(role,text);assert.ok(el.asElement(),`${role} "${text}" exists`);await el.asElement().evaluate(node=>node.click());};
 const tap=id=>app.$eval(`[data-testid=${id}]`,el=>el.click());
 const alertSays=text=>app.waitForFunction(text=>[...document.querySelectorAll('[role=alert]')].some(a=>a.textContent===text),{},text);
 await open('');
 const bg=()=>app.$eval('[data-testid=home]',el=>getComputedStyle(el).backgroundColor);
 const light=await bg();
 await press('tab','Dark');assert.notEqual(await bg(),light);
 assert.equal(await (await byText('tab','Dark')).evaluate(el=>el.getAttribute('aria-selected')),'true');
 await press('tab','Light');assert.equal(await bg(),light);
 await open('button');
 const solid=()=>app.$eval('[data-testid=solid]',node=>getComputedStyle(node).backgroundColor);
 const blue=await solid();
 assert.ok(await app.$eval('[data-testid=solid]',el=>el.getBoundingClientRect().height>=40));
 assert.equal(await (await byText('button','Disabled')).evaluate(el=>el.getAttribute('aria-disabled')),'true');
 await tap('back');await app.waitForSelector('[data-testid=home]');
 assert.equal(await page.evaluate(()=>location.hash),'','going back inside the phone updates the page address');
 await app.click('[aria-label="Hue 150"]');await open('button');assert.notEqual(await solid(),blue,'a different hue re-brands the button');
 await open('text-field');await app.type('[data-testid=name]','Ada');assert.equal(await app.$eval('[data-testid=name]',i=>i.value),'Ada');
 await open('checkbox');
 assert.equal(await (await byText('checkbox','I agree to the terms')).evaluate(el=>el.getAttribute('aria-checked')),'false');
 await press('checkbox','I agree to the terms');assert.equal(await (await byText('checkbox','I agree to the terms')).evaluate(el=>el.getAttribute('aria-checked')),'true');
 await open('radio-group');await press('radio','Free');
 assert.equal(await (await byText('radio','Free')).evaluate(el=>el.getAttribute('aria-checked')),'true');
 assert.equal(await (await byText('radio','Pro — $19 per month')).evaluate(el=>el.getAttribute('aria-checked')),'false');
 await open('progress');assert.ok(await app.$('[role=progressbar][aria-valuenow="40"]'));
 await open('dialog');await tap('open-dialog');
 await app.waitForFunction(()=>[...document.querySelectorAll('[role=dialog]')].some(d=>d.textContent.includes('Delete this project?')));
 assert.equal(await page.evaluate(()=>document.querySelectorAll('[role=dialog]').length),0,'the dialog opens inside the phone, not over the page');
 await tap('confirm-delete');await alertSays('Project deleted');
 await app.waitForFunction(()=>![...document.querySelectorAll('[role=dialog]')].some(d=>d.textContent.includes('Delete this project?')));
 await open('sheet');await tap('open-sheet');await app.waitForFunction(()=>document.body.textContent.includes('Send by email'));
 await tap('sheet-cancel');await app.waitForFunction(()=>!document.body.textContent.includes('Send by email'));
 await open('toast');await tap('show-toast');await alertSays('Copied to clipboard');
 // A navigation layout uses its phone form (menu button and slide-in panel), because the frame is phone-sized.
 await open('sectioned-drawer');
 const menu=await app.waitForSelector('[aria-expanded=false][role=button]');await menu.evaluate(node=>node.click());
 await app.waitForSelector('[aria-expanded=true]');

 // Light and Full: the page says which components need a library and names it; the filter separates them.
 const fullIds=catalog.filter(group=>group.requires.length).flatMap(group=>group.demos.map(demo=>demo.id));
 assert.ok(fullIds.length>=15&&fullIds.length<total,`${fullIds.length} components need a library`);
 assert.equal(await page.$eval('#np-light-count',e=>e.textContent),`${total-fullIds.length} components`);
 assert.equal(await page.$eval('#np-full-count',e=>e.textContent),`${fullIds.length} components`);
 assert.deepEqual((await page.$$eval('.np-card[data-tier=full]',cards=>cards.map(card=>card.dataset.id))).sort(),[...fullIds].sort());
 assert.match(await page.$eval('.np-card[data-id=svg-line-chart] .np-req',e=>e.textContent),/Needs SVG/);
 assert.match(await page.$eval('.np-card[data-id=gesture-bottom-sheet] .np-req',e=>e.textContent),/Reanimated \+ Gesture Handler/);
 assert.equal(await page.$('.np-card[data-id=button] .np-req'),null,'a Light component carries no requirement');
 await page.click('#np-tier [data-tier=light]');
 assert.equal(await page.$$eval('.np-card:not([hidden])',cards=>cards.length),total-fullIds.length);
 await page.click('#np-tier [data-tier=full]');
 assert.equal(await page.$$eval('.np-card:not([hidden])',cards=>cards.length),fullIds.length);
 await page.click('#np-tier [data-tier=all]');
 await open('svg-line-chart');await page.click('.np-tabs [data-view=code]');
 assert.match(await page.$eval('#np-source',e=>e.textContent),/^\/\/ Full: needs react-native-svg\n\/\/ npx expo install react-native-svg\n/);
 await page.click('.np-tabs [data-view=demo]');

 // 4. Code samples: one per demo, generated from the demo source.
 const samples=await page.evaluate(()=>fetch('/native/code.json').then(r=>r.json()));
 for (const group of catalog) for (const demo of group.demos) assert.ok(samples[demo.id]?.includes('export default'),`code sample for ${demo.id}`);
 assert.match(samples.button,/^import \{ [^}]*\bButton\b[^}]*\} from "@colibri-kit\/native";/);
 await open('button');await page.click('.np-tabs [data-view=code]');
 assert.equal(await page.$eval('.np-phone',e=>e.hidden),true);
 assert.equal(await page.$eval('#np-source',e=>e.textContent),samples.button);assert.equal(await page.$eval('#np-code-name',e=>e.textContent),'Button');
 await page.click('.np-tabs [data-view=demo]');assert.equal(await page.$eval('.np-codebox',e=>e.hidden),true);
 assert.deepEqual(errors,[]);
 console.log('native e2e ok');
} finally { await browser.close(); await server.close(); }

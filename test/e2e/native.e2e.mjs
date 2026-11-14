// @colibri-kit/native-core rendered through react-native-web (site/dist/native): palette parity with Colibri CSS, and behaviour.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import {serveBuild} from './server.mjs';
import {createTheme} from '../../packages/colibri-native-core/src/theme.js';
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

 // Core and Full: the page says which components need a library and names it; the filter separates them.
 const fullIds=catalog.filter(group=>group.requires.length).flatMap(group=>group.demos.map(demo=>demo.id));
 assert.ok(fullIds.length>=15&&fullIds.length<total,`${fullIds.length} components need a library`);
 assert.equal(await page.$eval('#np-core-count',e=>e.textContent),`${total-fullIds.length} components`);
 assert.equal(await page.$eval('#np-full-count',e=>e.textContent),`${fullIds.length} components`);
 assert.deepEqual((await page.$$eval('.np-card[data-tier=full]',cards=>cards.map(card=>card.dataset.id))).sort(),[...fullIds].sort());
 assert.match(await page.$eval('.np-card[data-id=svg-line-chart] .np-req',e=>e.textContent),/Full · needs SVG/);
 assert.match(await page.$eval('.np-card[data-id=gesture-bottom-sheet] .np-req',e=>e.textContent),/Full · needs Reanimated \+ Gesture Handler/);
 assert.equal(await page.$('.np-card[data-id=button] .np-req'),null,'a Core component carries no requirement');
 await page.$eval('#np-q',input=>{input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));}); // an earlier step typed a filter
 await page.$eval('#np-tier [data-tier=core]',button=>button.click());
 assert.equal(await page.$$eval('.np-card:not([hidden])',cards=>cards.length),total-fullIds.length);
 await page.$eval('#np-tier [data-tier=full]',button=>button.click());
 assert.equal(await page.$$eval('.np-card:not([hidden])',cards=>cards.length),fullIds.length);
 await page.$eval('#np-tier [data-tier=all]',button=>button.click());
 await open('svg-line-chart');await page.click('.np-tabs [data-view=code]');
 assert.match(await page.$eval('#np-source',e=>e.textContent),/^\/\/ Colibri React Native Full\n\/\/ npm install @colibri-kit\/native-full\n\/\/ npx expo install react-native-svg\n/);
 await page.click('.np-tabs [data-view=demo]');

 // 4. Code samples: one per demo, generated from the demo source.
 const samples=await page.evaluate(()=>fetch('/native/code.json').then(r=>r.json()));
 for (const group of catalog) for (const demo of group.demos) assert.ok(samples[demo.id]?.includes('export default'),`code sample for ${demo.id}`);
 assert.match(samples.button,/^import \{ [^}]*\bButton\b[^}]*\} from "@colibri-kit\/native-core";/);
 assert.match(samples['svg-line-chart'],/from "@colibri-kit\/native-full";/);assert.doesNotMatch(samples['svg-line-chart'],/native-core/);
 await open('button');await page.click('.np-tabs [data-view=code]');
 assert.equal(await page.$eval('.np-phone',e=>e.hidden),true);
 assert.equal(await page.$eval('#np-source',e=>e.textContent),'// Colibri React Native Core\n// npm install @colibri-kit/native-core\n\n'+samples.button);assert.equal(await page.$eval('#np-code-name',e=>e.textContent),'Button · Core');
 await page.click('.np-tabs [data-view=demo]');assert.equal(await page.$eval('.np-codebox',e=>e.hidden),true);
 // 5. Documentation: its own section beside Components, with the two editions explained and an API reference.
 assert.deepEqual(await page.$$eval('.np-sections a',links=>links.map(a=>[a.textContent,a.getAttribute('href'),a.getAttribute('aria-current')])),[['Documentation','/native/docs/',null],['Components','/native/','page']]);
 assert.deepEqual(await page.$$eval('.np-option h2',heads=>heads.map(h=>h.firstChild.textContent.trim())),['Colibri React Native Core','Colibri React Native Full']);
 // Two packages, each with its own install line.
 assert.deepEqual(await page.$$eval('.np-option .np-code',blocks=>blocks.map(block=>block.textContent)),['npm install @colibri-kit/native-core','npm install @colibri-kit/native-full']);
 // The header switch sets light or dark for the page and the phone follows it.
 const phoneBg=()=>app.$eval('[data-testid^="demo-"],[data-testid=home]',el=>getComputedStyle(el).backgroundColor);
 await page.click('#theme');const first=await page.evaluate(()=>document.documentElement.dataset.theme);assert.ok(['light','dark'].includes(first));
 await app.waitForFunction(()=>true);await new Promise(r=>setTimeout(r,300));const bgA=await phoneBg();
 await page.click('#theme');const second=await page.evaluate(()=>document.documentElement.dataset.theme);assert.notEqual(second,first);
 await new Promise(r=>setTimeout(r,300));assert.notEqual(await phoneBg(),bgA,'the phone changes with the page');
 await page.click('.np-sections a[href="/native/docs/"]');
 await page.waitForFunction(()=>'docsReady' in document.documentElement.dataset);
 assert.equal(await page.$eval('.np-sections a[aria-current]',a=>a.textContent),'Documentation');
 assert.deepEqual(await page.$$eval('#editions .np-option h3',heads=>heads.map(h=>h.firstChild.textContent.trim())),['Colibri React Native Core','Colibri React Native Full']);
 const docs=await page.evaluate(()=>fetch('/native/reference.json').then(r=>r.json()));
 assert.equal(await page.$eval('#nd-core-count',e=>e.textContent),`${docs.counts.core} exports`);
 assert.equal(await page.$eval('#nd-full-count',e=>e.textContent),`${docs.counts.full} exports`);
 assert.ok(docs.counts.core>150&&docs.counts.full>=20);
 assert.equal(await page.$$eval('.nd-item',items=>items.length),docs.groups.reduce((sum,group)=>sum+group.components.filter(item=>item.kind!=='value').length,0));
 // A Core component lists its props; the Full version says what it needs and links to its demo.
 const buttonProps=await page.$$eval('#api-core-Button .nd-props tbody tr td:first-child code',cells=>cells.map(cell=>cell.textContent));
 for (const prop of ['title','variant','size','loading','onPress']) assert.ok(buttonProps.includes(prop)||prop==='onPress',`Button documents ${prop}`);
 assert.match(await page.$eval('#api-gestures > p',e=>e.textContent),/Needs react-native-reanimated and react-native-gesture-handler/);
 assert.equal(await page.$eval('#api-gestures-BottomSheet .nd-demo',a=>a.getAttribute('href')),'/native/#gesture-bottom-sheet');
 assert.ok((await page.$$eval('#nd-full-lists tbody tr',rows=>rows.length))===3);
 const sheetProps=await page.$$eval('#api-gestures-BottomSheet .nd-props tbody tr td:first-child code',cells=>cells.map(cell=>cell.textContent));
 for (const prop of ['keyboardAware','snapPoints','visible','onClose']) assert.ok(sheetProps.includes(prop),`the Full BottomSheet documents ${prop}`);
 await page.type('#nd-q','keyboardAware');
 assert.deepEqual(await page.$$eval('.nd-item:not([hidden])',items=>items.map(item=>item.id)),['api-gestures-BottomSheet']);
 assert.deepEqual(await page.$$eval('#editions .np-option .np-code',blocks=>blocks.map(block=>block.textContent)),['npm install @colibri-kit/native-core','npm install @colibri-kit/native-full']);
 for (const id of ['editions','install-core','install-full','theming','reference']) assert.ok(await page.$('#'+id),`the documentation has #${id}`);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);
 console.log('native e2e ok');
} finally { await browser.close(); await server.close(); }

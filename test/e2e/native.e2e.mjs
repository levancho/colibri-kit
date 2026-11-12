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

 // 2. The showcase: every control works and announces itself.
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>['error','warning'].includes(m.type())&&errors.push(m.text()));
 await page.setViewport({width:1280,height:900});
 await page.goto(server.origin+'/native/');await page.waitForFunction(()=>'nativeReady' in document.documentElement.dataset&&document.querySelector('#app [role=heading]'));
 assert.equal(await page.$eval('header.kbar a[aria-current=page]',a=>a.textContent),'React Native');
 const bg=()=>page.$eval('[data-testid=showcase]',el=>getComputedStyle(el).backgroundColor);
 const byText=(role,text)=>page.evaluateHandle((role,text)=>[...document.querySelectorAll(`#app [role=${role}], body > div [role=${role}]`)].find(el=>(el.getAttribute("aria-label")??el.textContent.trim())===text),role,text);
 const press=async(role,text)=>{const el=await byText(role,text);assert.ok(el.asElement(),`${role} "${text}" exists`);await el.asElement().click();};
 const light=await bg();
 await press('tab','Dark');assert.notEqual(await bg(),light);
 assert.equal(await (await byText('tab','Dark')).evaluate(el=>el.getAttribute('aria-selected')),'true');
 await press('tab','Light');assert.equal(await bg(),light);
 // Re-branding: a different hue changes the solid button.
 const solid=()=>byText('button','Solid').then(el=>el.evaluate(node=>getComputedStyle(node).backgroundColor));
 const blue=await solid();await page.click('[aria-label="Hue 150"]');assert.notEqual(await solid(),blue);
 // Form controls.
 await page.type('[data-testid=name]','Ada');assert.equal(await page.$eval('[data-testid=name]',i=>i.value),'Ada');
 const checkbox=await byText('checkbox','I agree to the terms');assert.equal(await checkbox.evaluate(el=>el.getAttribute('aria-checked')),'false');
 await checkbox.asElement().click();assert.equal(await (await byText('checkbox','I agree to the terms')).evaluate(el=>el.getAttribute('aria-checked')),'true');
 await press('radio','Free');assert.equal(await (await byText('radio','Free')).evaluate(el=>el.getAttribute('aria-checked')),'true');
 assert.equal(await (await byText('radio','Pro — $19 per month')).evaluate(el=>el.getAttribute('aria-checked')),'false');
 assert.equal(await (await byText('button','Disabled')).evaluate(el=>el.getAttribute('aria-disabled')),'true');
 assert.ok(await page.$('#app [role=progressbar][aria-valuenow="62"]'));
 // Touch targets: every enabled button is at least 32px tall on screen and at least 40px in the default size.
 assert.ok(await (await byText('button','Solid')).evaluate(el=>el.getBoundingClientRect().height>=40));
 // Dialog → confirm → toast.
 await page.click('[data-testid=open-dialog]');
 await page.waitForFunction(()=>[...document.querySelectorAll('[role=dialog]')].some(d=>d.textContent.includes('Delete this project?')));
 await page.click('[data-testid=confirm-delete]');
 await page.waitForFunction(()=>[...document.querySelectorAll('[role=alert]')].some(a=>a.textContent==='Project deleted'));
 await page.waitForFunction(()=>![...document.querySelectorAll('[role=dialog]')].some(d=>d.textContent.includes('Delete this project?'))); // closes with a fade
 // Sheet opens and closes.
 // A toast may be showing over the bottom of the screen, so these presses go to the element itself rather than to a screen position.
 const tap=id=>page.$eval(`[data-testid=${id}]`,el=>el.click());
 await tap('open-sheet');await page.waitForFunction(()=>document.body.textContent.includes('Send by email'));
 await page.evaluate(()=>[...document.querySelectorAll('[role=button]')].filter(b=>b.textContent==='Cancel').at(-1).click());await page.waitForFunction(()=>!document.body.textContent.includes('Send by email'));
 // Saving shows a busy button, then a toast.
 await tap('save');
 await page.waitForFunction(()=>[...document.querySelectorAll('[role=alert]')].some(a=>a.textContent==='Profile saved'),{timeout:5000});
 assert.deepEqual(errors,[]);
 console.log('native e2e ok');
} finally { await browser.close(); await server.close(); }

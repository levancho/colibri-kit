// Widget builder (site/src/widgets) and the embed script it hands out.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import {serveBuild} from './server.mjs';
const server=await serveBuild();
const browser=await puppeteer.launch({executablePath:process.env.CHROME || ['/usr/bin/google-chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(fs.existsSync),args:['--no-sandbox']});
try {
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>m.type()==='error'&&errors.push(m.text()));
 await page.setViewport({width:1280,height:900});
 await page.goto(server.origin+'/widgets/');
 await page.waitForFunction(()=>'wbReady' in document.documentElement.dataset&&document.querySelector('#wb-preview').shadowRoot?.querySelector('.cw'));
 const inPreview=fn=>page.$eval('#wb-preview',fn);
 assert.equal(await inPreview(w=>w.shadowRoot.querySelector('.cw').dataset.cw),'cta');
 assert.equal(await page.$eval('header.kbar a[aria-current=page]',a=>a.textContent),'Widgets');

 // Typing updates the preview and the code; markup typed into a field stays text.
 await page.focus('#wb-f-title');await page.$eval('#wb-f-title',i=>i.select());await page.keyboard.type('Hello <img src=x onerror=window.pwned=1>');
 assert.equal(await inPreview(w=>w.shadowRoot.querySelector('h3').textContent),'Hello <img src=x onerror=window.pwned=1>');
 assert.equal(await inPreview(w=>w.shadowRoot.querySelector('img')),null);
 assert.equal(await page.evaluate(()=>window.pwned),undefined);
 assert.match(await page.$eval('#wb-snippet',c=>c.textContent),/^<colibri-widget config='\{"t":"cta","d":\{"title":"Hello &lt;img/);

 // Every widget type renders with the credit link.
 for (const type of await page.$$eval('.wb-type',buttons=>buttons.map(b=>b.dataset.value))) {
  await page.click(`.wb-type[data-value=${type}]`);
  const credit=await inPreview(w=>({type:w.shadowRoot.querySelector('.cw').dataset.cw,text:w.shadowRoot.querySelector('a[href="https://colibri-kit.io/widgets/"]')?.textContent}));
  assert.equal(credit.type,type);assert.match(credit.text??'',/Colibri/,type);
 }
 // Content typed for one widget is still there after visiting another.
 await page.click('.wb-type[data-value=cta]');
 assert.match(await page.$eval('#wb-f-title',i=>i.value),/^Hello/);

 // Look controls: theme, hue, width and the HTML-only format.
 await page.click('.wb-seg[data-key=theme] [data-value=dark]');await page.click('.wb-swatch[data-hue="150"]');await page.click('.wb-seg[data-key=width] [data-value=l]');
 const look=await inPreview(w=>{const cw=w.shadowRoot.querySelector('.cw'),card=cw.querySelector('.card');return{style:cw.getAttribute('style'),scheme:getComputedStyle(cw).colorScheme,bg:getComputedStyle(card).backgroundColor,max:getComputedStyle(cw).maxInlineSize};});
 assert.match(look.style,/--c-hue:150;color-scheme:dark/);assert.equal(look.scheme,'dark');assert.equal(look.max,'640px');
 await page.click('.wb-seg[data-key=theme] [data-value=light]');
 assert.notEqual(await inPreview(w=>getComputedStyle(w.shadowRoot.querySelector('.card')).backgroundColor),look.bg,'forced dark and forced light differ');
 await page.click('#wb-mode [data-value=html]');
 const html=await page.$eval('#wb-snippet',c=>c.textContent);assert.match(html,/^<style>\n\.cw\{/);assert.doesNotMatch(html,/<script/);
 await page.click('#wb-mode [data-value=embed]');

 // The design is in the address, so a shared link restores it.
 await new Promise(r=>setTimeout(r,500)); // the address is updated a moment after the last change
 const shared=page.url(), snippet=await page.$eval('#wb-snippet',c=>c.textContent);
 const second=await browser.newPage();await second.goto(shared);
 await second.waitForFunction(()=>'wbReady' in document.documentElement.dataset);
 assert.equal(await second.$eval('#wb-snippet',c=>c.textContent),snippet);
 assert.match(await second.$eval('#wb-f-title',i=>i.value),/^Hello/);
 await second.close();

 // The homepage button opens the builder on the badge; a pinned badge sits in the preview's corner, not the page's.
 await page.goto(server.origin+'/');
 await page.waitForFunction(()=>document.querySelector('#badge colibri-widget')?.shadowRoot?.querySelector('.cw-badge'));
 assert.equal(await page.$$eval('a[href="/widgets/#badge"]',links=>links.map(a=>a.textContent.trim()).join('|')),'Build a widget|Build a widget');
 await page.goto(server.origin+'/widgets/#badge');await page.reload();
 await page.waitForFunction(()=>document.querySelector('#wb-preview').shadowRoot?.querySelector('.cw-badge'));
 assert.equal(await inPreview(w=>w.shadowRoot.querySelector('.cw-badge').textContent),'Built with Colibri Kit');
 await page.select('#wb-f-pin','br');
 const pinned=await page.evaluate(()=>{const badge=document.querySelector('#wb-preview').shadowRoot.querySelector('.cw-badge').getBoundingClientRect(),canvas=document.querySelector('.wb-canvas').getBoundingClientRect();return{right:Math.round(canvas.right-badge.right),bottom:Math.round(canvas.bottom-badge.bottom)};});
 assert.ok(Math.abs(pinned.right-16)<=2&&Math.abs(pinned.bottom-16)<=2,JSON.stringify(pinned));
 assert.match(await page.$eval('#wb-snippet',c=>c.textContent),/"pin":"br"/);

 // Phone width: no horizontal scrolling.
 await page.setViewport({width:360,height:800});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);

 // The copied snippet on someone else's page: hostile page styles do not reach in, widget styles do not leak out.
 const host=await browser.newPage();host.on('pageerror',e=>errors.push(e.message));
 await host.goto(server.origin+'/404.html');
 await host.setContent(`<!doctype html><style>*{color:rgb(255,0,0)!important;font-family:fantasy!important}.card,.btn,.cw{display:none!important}a{font-size:40px!important}</style>
  <p id="outside" class="btn card">host text</p>${snippet.replace('https://colibri-kit.io/widgets/embed.js',server.origin+'/widgets/embed.js')}
  <colibri-widget id="bad" config='{broken'></colibri-widget><colibri-widget id="form" config='{"t":"newsletter"}'></colibri-widget>`);
 await host.waitForFunction(()=>document.querySelector('colibri-widget').shadowRoot?.querySelector('.cw'));
 const result=await host.evaluate(()=>{const w=document.querySelector('colibri-widget'),root=w.shadowRoot,title=root.querySelector('h3'),button=root.querySelector('.btn'),outside=document.querySelector('#outside');
  return{title:title.textContent,titleColor:getComputedStyle(title).color,buttonDisplay:getComputedStyle(button).display,buttonFont:getComputedStyle(button).fontFamily,creditSize:getComputedStyle(root.querySelector('.cw-by')).fontSize,
   outsideDisplay:getComputedStyle(outside).display,outsideRadius:getComputedStyle(outside).borderRadius,fallbackShown:w.querySelector('a').offsetParent!==null,
   bad:document.querySelector('#bad').shadowRoot.querySelector('.cw').dataset.cw};});
 assert.match(result.title,/^Hello <img/);
 assert.notEqual(result.titleColor,'rgb(255, 0, 0)');assert.notEqual(result.buttonDisplay,'none');assert.doesNotMatch(result.buttonFont,/fantasy/);assert.notEqual(result.creditSize,'40px');
 assert.equal(result.outsideDisplay,'none','host rules still apply to host elements');assert.equal(result.outsideRadius,'0px','widget CSS does not style host elements');
 assert.equal(result.fallbackShown,false,'the fallback link is replaced once the widget draws');assert.equal(result.bad,'badge','a broken config falls back to the badge');
 // A sign-up form with no endpoint does not navigate.
 const before=host.url();
 await host.evaluate(()=>{const root=document.querySelector('#form').shadowRoot;root.querySelector('input').value='a@b.co';root.querySelector('form').requestSubmit();});
 await new Promise(r=>setTimeout(r,300));assert.equal(host.url(),before);
 assert.deepEqual(errors,[]);
 console.log('widgets e2e ok');
} finally { await browser.close(); await server.close(); }

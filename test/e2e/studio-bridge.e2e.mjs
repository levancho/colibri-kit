import fs from 'node:fs';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {serveBuild} from './server.mjs';
const server=await serveBuild();
const browser=await puppeteer.launch({executablePath:process.env.CHROME || ['/usr/bin/google-chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(fs.existsSync),args:['--no-sandbox']});
try {
 const page=await browser.newPage();
 for(const width of [320,390,1280]) {
  await page.setViewport({width,height:900});
  await page.goto(server.origin+'/kitchen-sink/examples/playground/');
  await page.waitForFunction(()=>document.querySelector('#pvA').contentDocument?.querySelector('[data-ui]'));
  await page.evaluate(()=>{window.open=(url,target)=>{window.opened={url,target};};});
  await page.click('#toColibria');
  let opened=await page.evaluate(()=>window.opened);
  assert.equal(new URL(opened.url).searchParams.get('view'),'kit-theme-generator');
  assert.equal(new URL(opened.url).origin,'https://colibria.ai');
  assert.equal(opened.target,'colibria');
  const payload=await page.evaluate(url=>ColibriBridge.read(new URL(url)),opened.url);
  assert.equal(payload.ret,server.origin+'/kitchen-sink/examples/playground/');
  assert.ok(payload.theme.roles.accent);assert.ok(payload.theme.kit);
  // Reproduce the supplied screenshot: imported generated theme with a long name.
  await page.evaluate(()=>{
   const gen=ColibriThemeGen.fromPreset('colibri',{name:'Analogous theme with a longer descriptive name'});gen.scheme='dark';
   const c=gen.colors.dark;
   dispatchEvent(new MessageEvent('message',{origin:'https://colibria.ai',data:{type:'colibri-theme',theme:{v:1,source:'colibria',name:gen.name,scheme:'dark',colors:[c.bg,c.surface,c.primary,c.fg],roles:{accent:c.primary,background:c.bg,surface:c.surface,text:c.fg},gen}}}));
  });
  await page.waitForSelector('#bridge.gen');
  const layout=await page.$eval('#bridge',el=>{
   const r=el.getBoundingClientRect();
   return {overflow:el.scrollWidth>el.clientWidth,escaped:[...el.querySelectorAll('button,.btitle,small')].some(c=>{const b=c.getBoundingClientRect();return b.left<r.left||b.right>r.right}),duplicate:!!el.querySelector('a[href*="kit-theme-generator"]'),badge:getComputedStyle(el.querySelector('#genTag')).whiteSpace};
  });
  assert.deepEqual(layout,{overflow:false,escaped:false,duplicate:false,badge:'nowrap'});
  await page.click('#toColibria');opened=await page.evaluate(()=>window.opened);
  const theme=await page.evaluate(url=>ColibriBridge.read(new URL(url)).theme,opened.url);
  assert.equal(new URL(opened.url).searchParams.get('view'),'kit-theme-generator');
  assert.equal(theme.gen.name,'Analogous theme with a longer descriptive name');assert.equal(theme.gen.scheme,'dark');
  if(width===1280)await (await page.$('#bridge')).screenshot({path:'/tmp/colibri-widget-fixed.png'});
  await page.click('#toDash');opened=await page.evaluate(()=>window.opened);
  assert.equal(new URL(opened.url).pathname,'/kitchen-sink/examples/dashboards/analytics.html');
  await page.click('#unlink');await page.waitForFunction(()=>!document.querySelector('#bridge').classList.contains('gen'));
  assert.equal(await page.$eval('#toColibria',el=>el.textContent),'Design in Colibria ↗');
 }
 console.log('ok one generator action preserves theme + return URL; widget fits at 320/390/1280px; dashboard and unlink still work');
} finally {await browser.close();await server.close();}

// Exercise the shipped archive, not source-tree paths or the decorated gallery.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {serveBuild} from './server.mjs';
const repo = process.cwd(), temp = fs.mkdtempSync(path.join(os.tmpdir(),'colibri-consumer-'));
let server, browser;
const run = (cmd,args,cwd=temp) => execFileSync(cmd,args,{cwd,encoding:'utf8',env:{...process.env,npm_config_cache:path.join(temp,'cache')}});
try {
  const pack = cwd => JSON.parse(run('npm',['pack','--json','--ignore-scripts','--pack-destination',temp],cwd))[0].filename;
  const ui = pack(repo), css = pack(path.join(repo,'packages/colibri-css'));
  fs.writeFileSync(path.join(temp,'package.json'),JSON.stringify({private:true,type:'module'}));
  run('npm',['install','--offline','--ignore-scripts','--omit=peer',`./${ui}`,`./${css}`]);
  // Public package entry points resolve without checking out the library.
  run('node',['--input-type=module','-e',`import {createDialog} from '@colibri-kit/ui/core/dialog'; import {createTabs} from '@colibri-kit/ui/core/tabs'; import {createRequire} from 'node:module'; const r=createRequire(import.meta.url); for(const s of ['@colibri-kit/css','@colibri-kit/css/bridge','@colibri-kit/ui/themes/colibri.css']) r.resolve(s); if(!createDialog || !createTabs) throw Error('missing controllers');`]);
  const cli = path.join(temp,'node_modules/@colibri-kit/ui/bin/colibri.mjs');
  const app = path.join(temp,'app'); fs.mkdirSync(app);
  run('node',[cli,'init','--starter','--dir','assets/colibri','--dry-run'],app);
  assert.deepEqual(fs.readdirSync(app),[],'dry run must not mutate');
  run('node',[cli,'init','--starter','--dir','assets/colibri'],app);
  assert.ok(fs.existsSync(path.join(app,'assets/colibri/thymeleaf/button.html')));
  assert.ok(fs.existsSync(path.join(app,'assets/colibri/freemarker/ui.ftl')));
  run('node',[cli,'init','--starter','--dir','assets/colibri'],app); // identical rerun
  fs.appendFileSync(path.join(app,'app.css'),'\n/* consumer customization */\n');
  const before = fs.readFileSync(path.join(app,'app.css'));
  const refused = spawnSync('node',[cli,'init','--starter','--dir','assets/colibri'],{cwd:app});
  assert.equal(refused.status,1);assert.deepEqual(fs.readFileSync(path.join(app,'app.css')),before);
  assert.match(run('node',[cli,'diff'],app),/up to date/);
  const vendorFile=path.join(app,'assets/colibri/themes/colibri.css');
  fs.appendFileSync(vendorFile,'\n/* old vendor edit */');
  assert.match(run('node',[cli,'diff'],app),/changed/);
  run('node',[cli,'init','--force'],app); // reuse the configured asset directory
  assert.deepEqual(fs.readFileSync(path.join(app,'app.css')),before,'vendor upgrade must preserve application files');
  assert.match(run('node',[cli,'diff'],app),/up to date/);
  server = await serveBuild(app);
  browser = await puppeteer.launch({executablePath:process.env.CHROME || ['/usr/bin/google-chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(fs.existsSync),args:['--no-sandbox']});
  const page = await browser.newPage(), errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',r=>{if(r.status()>=400 && !r.url().endsWith('favicon.ico'))errors.push(`${r.status()} ${r.url()}`)});
  await page.setViewport({width:390,height:844});
  await page.goto(server.origin);await page.waitForSelector('#help[data-state="closed"]');
  const tokens = await page.evaluate(()=>{
    const style=getComputedStyle(document.documentElement);
    return {primary:style.getPropertyValue('--ui-primary').trim(),accent:style.getPropertyValue('--c-accent').trim(),radius:style.getPropertyValue('--ui-radius').trim(),overflow:document.documentElement.scrollWidth>innerWidth};
  });
  assert.equal(tokens.primary,tokens.accent,'CSS brand token must reach UI'); assert.equal(tokens.radius,'0.75rem');assert.equal(tokens.overflow,false);
  await page.click('#theme'); assert.equal(await page.$eval('html',el=>el.dataset.theme),'dark');
  assert.equal(await page.$eval('html',el=>getComputedStyle(el).colorScheme),'dark');
  await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'dark'}]);
  await page.$eval('html',el=>el.removeAttribute('data-theme'));
  assert.equal(await page.$eval('html',el=>getComputedStyle(el).colorScheme),'light dark');
  // Scoped palette must recompute both namespaces, and application rules win.
  const scoped=await page.evaluate(()=>{
    const section=document.createElement('section');section.setAttribute('data-colibri-theme','');section.style.setProperty('--c-hue','20');
    document.body.append(section);const s=getComputedStyle(section);const result=[s.getPropertyValue('--ui-primary').trim(),s.getPropertyValue('--c-accent').trim()];section.remove();return result;
  });assert.equal(scoped[0],scoped[1]);assert.notEqual(scoped[0],tokens.primary);
  await page.click('#help [data-ui-part=trigger]');await page.waitForSelector('dialog[open]');
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('dialog').open);
  assert.equal(await page.$eval('#help [data-ui-part=trigger]',el=>el===document.activeElement),true);
  await page.$eval('#project-name',el=>el.value='Consumer project');await page.click('button[type=submit]');
  await page.waitForFunction(()=>document.querySelector('#status').textContent==='Saved Consumer project.');
  await page.reload();assert.equal(await page.$eval('#project-name',el=>el.value),'Consumer project');
  assert.deepEqual(errors,[]);
  console.log('ok packed install, public exports, safe CLI, standalone starter, branding bridge, dark mode, dialog keyboard/focus, persistence and mobile layout');
} finally {await browser?.close();await server?.close();fs.rmSync(temp,{recursive:true,force:true});}

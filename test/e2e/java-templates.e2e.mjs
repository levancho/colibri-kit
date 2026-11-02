import fs from 'node:fs';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {serveBuild} from './server.mjs';
const markup=fs.readFileSync('java/colibri-templates/target/rendered/thymeleaf.html','utf8');
const server=await serveBuild();const browser=await puppeteer.launch({executablePath:process.env.CHROME || ['/usr/bin/google-chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(fs.existsSync),args:['--no-sandbox']});
try {const page=await browser.newPage();await page.goto(server.origin);await page.setContent('<html><body>'+markup+'</body></html>');await page.evaluate(async origin=>{const {init}=await import(origin+'/ui/src/core/auto.js');init();},server.origin);await page.focus('#tabs [data-ui-part=trigger]');await page.keyboard.press('ArrowRight');assert.equal(await page.$eval('#tabs [data-value=two][data-ui-part=trigger]',e=>e.getAttribute('aria-selected')),'true');await page.click('#select [data-ui-part=trigger]');await page.click('#select [data-value=two][data-ui-part=option]');assert.equal(await page.$eval('#select input[name=choice]',e=>e.value),'two');console.log('ok Java-rendered Thymeleaf tabs and select initialize, navigate and submit model values');}finally{await browser.close();await server.close();}

import {test} from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
import {bars,area,donut,createChartRanges} from '../src/core/charts.js';
import {createApplicationComponent} from '../src/core/application-component.js';
import {dispose,controllers} from '../src/core/util.js';
import {formSubmission} from '../src/core/form-data.js';
test('chart data cannot become markup and edge geometry stays finite',()=>{
 assert.throws(()=>bars(['</title><image onerror="alert(1)"/>']),TypeError);
 for(const html of [bars([0,0]),donut([0,0]),area([[-10,-5]]),area([[]]),bars([])])assert.doesNotMatch(html,/NaN|Infinity/);
 for(const input of [[NaN],[Infinity],['5']])assert.throws(()=>bars(input),TypeError);
 assert.throws(()=>donut([-1,2]),TypeError);
 const dom=new JSDOM(area([[-10,-5]]));const d=dom.window.document.querySelector('path').getAttribute('d');assert.doesNotMatch(d,/2018|1109/);
});
test('native form data preserves repeated names, files and submitter intent',()=>{
 const d=new JSDOM('<form><input name="tags" value="one"><input name="tags" value="two"><input type="file" name="upload"><button name="intent" value="publish">Publish</button></form>');
 const f=d.window.document.querySelector('form');const data=formSubmission(f,f.querySelector('button'));
 assert.deepEqual(data.values.tags,['one','two']);assert.equal(data.values.intent,'publish');assert.ok(data.values.upload instanceof d.window.File);assert.equal(data.formData.getAll('tags').length,2);
});
test('application init is idempotent and public subtree disposal removes callbacks',()=>{
 const d=new JSDOM('<main><section><button data-app-action="save">Save</button></section></main>');const root=d.window.document.querySelector('section');let calls=0;
 const a=createApplicationComponent(root,{onAction:()=>calls++});assert.equal(createApplicationComponent(root),a);root.querySelector('button').click();assert.equal(calls,1);
 assert.equal(controllers(root).length,1);dispose(root.parentElement);root.querySelector('button').click();assert.equal(calls,1);assert.equal(controllers(root).length,0);
});
test('chart ranges retain their full source after cleanup and remount',()=>{
 const d=new JSDOM('<section><div class="seg" data-target="chart"><button data-n="7" aria-pressed="true">7</button><button data-n="30">30</button></div><div data-chart="area" id="chart"></div></section>');
 globalThis.CSS={escape:x=>x};const root=d.window.document.querySelector('section'),chart=root.querySelector('#chart');chart.dataset.values=JSON.stringify([Array.from({length:30},(_,i)=>i)]);
 const cleanup=createChartRanges(root);assert.equal(JSON.parse(chart.dataset.values)[0].length,7);cleanup();createChartRanges(root);root.querySelector('[data-n="30"]').click();assert.equal(JSON.parse(chart.dataset.values)[0].length,30);dispose(root);
});
test('release verification rejects stale JavaScript even when the manifest is unchanged',async()=>{
 const fs=await import('node:fs');const os=await import('node:os');const path=await import('node:path');const {createManifest,verifyRelease}=await import('../tools/site-manifest.mjs');
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'colibri-release-'));
 const request=async url=>new Response(fs.readFileSync(path.join(directory,new URL(url).pathname)));
 try{fs.mkdirSync(path.join(directory,'ui/src/core'),{recursive:true});const module=path.join(directory,'ui/src/core/app.js');fs.writeFileSync(module,'export const version=1;');createManifest(directory);assert.equal(await verifyRelease(directory,'https://audit.test/',request),1);fs.writeFileSync(module,'export const version=2;');await assert.rejects(verifyRelease(directory,'https://audit.test/',request),/asset mismatch/);}finally{fs.rmSync(directory,{recursive:true,force:true});}
});

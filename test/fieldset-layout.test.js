import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

test('native fieldsets preserve stacked form content; horizontal layout is opt-in',()=>{
 const theme=fs.readFileSync(new URL('../themes/colibri.css',import.meta.url),'utf8');
 const rules=theme.match(/:where\(\.ui-root\) fieldset[^}]*}/g).join('\n');
 const dom=new JSDOM(`<style>${rules}</style><main class="ui-root"><fieldset id="stack"><legend>Image look</legend><div>Visual choices</div><p>Description</p></fieldset><fieldset id="row" data-layout="row"><label>One</label><label>Two</label></fieldset></main>`);
 assert.equal(dom.window.getComputedStyle(dom.window.document.querySelector('#stack')).display,'block');
 assert.equal(dom.window.getComputedStyle(dom.window.document.querySelector('#row')).display,'flex');
 dom.window.close();
});

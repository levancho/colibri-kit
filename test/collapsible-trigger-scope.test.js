import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {createCollapsible} from '../src/core/collapsible.js';

test('a wrapped collapsible owns its chevron without decorating nested tabs',t=>{
 const dom=new JSDOM('<section data-ui="collapsible" id="outer"><header><button data-ui-part="trigger" id="outer-trigger">Selections</button></header><div data-ui-part="content"><div data-ui="tabs"><button data-ui-part="trigger" id="tab">Build prompt</button></div><div data-ui="collapsible" id="inner"><button data-ui-part="trigger" id="inner-trigger">Notes</button><div data-ui-part="content">Text</div></div></div></section>');
 const previousCustomEvent=globalThis.CustomEvent;globalThis.CustomEvent=dom.window.CustomEvent;t.after(()=>{globalThis.CustomEvent=previousCustomEvent;dom.window.close();});
 const doc=dom.window.document,outer=createCollapsible(doc.querySelector('#outer')),inner=createCollapsible(doc.querySelector('#inner'));
 const selector=':is([data-ui=collapsible]>[data-ui-part=trigger],[data-ui-collapsible-trigger])';
 assert.deepEqual([...doc.querySelectorAll(selector)].map(el=>el.id),['outer-trigger','inner-trigger']);
 assert.equal(doc.querySelector('#tab').hasAttribute('data-ui-collapsible-trigger'),false);
 outer.open=true;assert.equal(doc.querySelector('#outer-trigger').getAttribute('aria-expanded'),'true');assert.equal(doc.querySelector('#inner-trigger').getAttribute('aria-expanded'),'false');
 outer.destroy();assert.equal(doc.querySelector('#outer-trigger').hasAttribute('data-ui-collapsible-trigger'),false);inner.destroy();dom.window.close();
 const css=readFileSync(new URL('../themes/colibri.css',import.meta.url),'utf8');
 assert.doesNotMatch(css,/\[data-ui=collapsible\] \[data-ui-part=trigger\].*::after/);
 assert.ok(css.includes(selector+'::after'));
});

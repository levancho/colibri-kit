import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<main></main>', { url: 'https://example.test/', pretendToBeVisual: true });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, CustomEvent: dom.window.CustomEvent, HTMLElement: dom.window.HTMLElement, customElements: dom.window.customElements, MutationObserver: dom.window.MutationObserver, __COLIBRI_UI_NO_AUTO__: true });
const { init, observeRemovals, dispose } = await import('../src/core/auto.js');
const { controllers } = await import('../src/core/util.js');
const tick = () => new Promise(resolve => setTimeout(resolve,0));
const markup = '<button data-ui="switch">Toggle</button>';
test('auto lifecycle tears down removed nodes, preserves DOM moves and supports reinitialization', async () => {
  const observer = observeRemovals(document);
  const box = document.createElement('div'); box.innerHTML = markup; document.body.append(box); init(box);
  const control=box.firstElementChild, api=controllers(control)[0]; assert.ok(api);
  document.querySelector('main').append(box); await tick(); assert.equal(controllers(control)[0],api);
  box.remove(); await tick(); assert.equal(controllers(control).length,0);
  document.body.append(box); init(box); assert.notEqual(controllers(control)[0],api);
  dispose(box); dispose(box); assert.equal(controllers(control).length,0); box.remove(); observer.disconnect();
});
test('custom elements removed before initialization do not create orphan controllers', async () => {
  await import('../src/elements/tabs.js'); await import('../src/elements/dialog.js');
  for (const name of ['ui-tabs','ui-dialog']) {
    const node=document.createElement(name); node.innerHTML = name==='ui-dialog' ? '<dialog data-ui-part="content"></dialog>' : '';
    document.body.append(node); node.remove(); await tick(); assert.equal(controllers(node).length,0);
    document.body.append(node); await tick(); assert.equal(controllers(node).length,1);
    const api=node.api; document.querySelector('main').append(node); await tick(); assert.equal(node.api,api);
    node.remove(); await tick(); assert.equal(controllers(node).length,0);
  }
});
test('carousel observer disconnects on controller teardown', async () => {
  let disconnected=0;
  globalThis.IntersectionObserver=class { observe(){} disconnect(){disconnected++;} };
  const root=document.createElement('div');root.dataset.ui='carousel';root.innerHTML='<div data-ui-part="viewport"><div data-ui-part="slide">Slide</div></div>';
  document.body.append(root);init(root);dispose(root);dispose(root);assert.equal(disconnected,1);root.remove();delete globalThis.IntersectionObserver;
});

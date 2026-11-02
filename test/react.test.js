import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<main id="app"></main>', { url: 'https://example.test/', pretendToBeVisual: true });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, CustomEvent: dom.window.CustomEvent, HTMLElement: dom.window.HTMLElement, MutationObserver: dom.window.MutationObserver, IS_REACT_ACT_ENVIRONMENT: true });
const { createElement: h, StrictMode, act, createRef } = await import('react');
const { createRoot } = await import('react-dom/client');
const { Tabs, Part, UI } = await import('../src/react/index.js');
const { controllers } = await import('../src/core/util.js');
const app = document.getElementById('app');
function tabs(props = {}, values = ['a','b']) {
  return h(StrictMode, null, h(Tabs, { id:'tabs', ...props },
    h(Part, { name:'list' }, ...values.map(value => h(Part, { key:value, name:'trigger', as:'button', value }, value))),
    ...values.map(value => h(Part, { key:value, name:'panel', value }, value + ' content'))));
}
test('React Strict Mode, rerenders, current handlers, dynamic children and unmount', async () => {
  const root = createRoot(app), apiRef = createRef(); let first = 0, second = 0;
  await act(async () => root.render(tabs({ apiRef, onChange: () => first++ })));
  const node = document.getElementById('tabs'), initial = apiRef.current;
  assert.ok(initial); assert.equal(controllers(node).length, 1);
  await act(async () => node.querySelector('[data-value=b]').click());
  assert.equal(initial.value, 'b'); assert.equal(first, 1);
  await act(async () => root.render(tabs({ apiRef, onChange: () => second++ }, ['a','b','c'])));
  assert.equal(apiRef.current, initial, 'ordinary rerender preserves controller and state');
  assert.equal(initial.value, 'b');
  await act(async () => node.querySelector('[data-value=c]').click());
  assert.equal(initial.value, 'c'); assert.equal(first, 1); assert.equal(second, 1);
  await act(async () => root.render(tabs({ apiRef }, ['a','b'])));
  assert.ok(['a','b'].includes(apiRef.current.value), 'removed selection recovers');
  await act(async () => root.unmount());
  assert.equal(apiRef.current, null); assert.equal(controllers(node).length, 0); assert.equal(node.__uiTabs, undefined);
});
test('React replaces a root element and disposes raw nested controllers', async () => {
  const root = createRoot(app), apiRef = createRef();
  const view = (as, nested) => h(StrictMode,null,h(UI,{kind:'toolbar',as,apiRef},h('button',null,'Action'), nested && h('div',{'data-ui':'switch',id:'raw'})));
  await act(async () => root.render(view('div',true)));
  const old = app.firstElementChild, nested = document.getElementById('raw');
  assert.equal(controllers(nested).length,1);
  await act(async () => root.render(view('section',false)));
  assert.equal(app.firstElementChild.tagName,'SECTION'); assert.equal(controllers(old).length,0); assert.equal(controllers(nested).length,0);
  assert.ok(apiRef.current);
  await act(async () => root.unmount()); assert.equal(apiRef.current,null);
});

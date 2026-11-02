import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createTabNav } from '../src/core/extras.js';
test('tab navigation owns its links and leaves visual geometry to CSS', () => {
  const dom = new JSDOM('<nav data-ui="tab-nav" id="outer"><a data-ui-part="link" href="#one">One</a><a data-ui-part="link" href="#two">Two</a><nav data-ui="tab-nav" id="inner"><a data-ui-part="link" href="#nested">Nested</a></nav></nav>', { url: 'https://example.test/#one' });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, location: dom.window.location, CustomEvent: dom.window.CustomEvent });
  const root = document.getElementById('outer'), nested = document.querySelector('#inner a'), own = root.querySelector('a');
  root.addEventListener('click', e => e.preventDefault());
  const api = createTabNav(root);
  assert.equal(own.getAttribute('aria-current'), 'page');
  nested.click(); assert.equal(own.getAttribute('aria-current'), 'page');
  api.select(nested); assert.equal(own.getAttribute('aria-current'), 'page');
  assert.equal(root.hasAttribute('style'), false, 'no layout measurements written into markup');
  api.destroy(); dom.window.close();
});

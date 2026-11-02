import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createPagination } from '../src/core/navigation.js';
import { createRating } from '../src/core/forms.js';
import { createCalendar } from '../src/core/calendar.js';
const dom = new JSDOM('<main></main>', {url:'https://example.test/'});
Object.assign(globalThis,{document:dom.window.document,CustomEvent:dom.window.CustomEvent});
const payload = '\"><img src=x onerror="alert(1)">';
test('generated labels, input names and calendar IDs remain text', () => {
  const nav=document.createElement('nav');nav.dataset.ui='pagination';nav.dataset.total='5';nav.dataset.labelNext=payload;nav.dataset.href='?page={page}&label='+payload;
  createPagination(nav);assert.equal(nav.querySelector('img'),null);assert.equal(nav.querySelector('[data-ui-part=next]').textContent,payload);assert.equal(nav.querySelector('[data-page="2"]').getAttribute('href'),'?page=2&label='+payload);
  const rating=document.createElement('div');rating.dataset.ui='rating';rating.dataset.name=payload;createRating(rating);assert.equal(rating.querySelector('img'),null);assert.equal(rating.querySelector('input').name,payload);
  const calendar=document.createElement('div');calendar.dataset.ui='calendar';calendar.id=payload;createCalendar(calendar);assert.equal(calendar.querySelector('img'),null);assert.equal(calendar.querySelector('[data-ui-part=title]').id,payload+'-title');
});
test('pagination rejects executable link protocols', () => {
  for (const href of ['javascript:alert({page})','data:text/html,test']) {
    const nav=document.createElement('nav');nav.dataset.ui='pagination';nav.dataset.total='3';nav.dataset.href=href;createPagination(nav);assert.equal(nav.querySelector('[href]'),null);
  }
});

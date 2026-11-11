import test from 'node:test';
import assert from 'node:assert/strict';
import { WIDGETS, normalize, compact, parseConfig, renderWidget, embedSnippet, htmlSnippet, safeUrl, WIDGET_CSS } from '../site/src/widgets/render.js';

test('every widget renders its defaults with the Built with Colibri credit', () => {
  for (const type of Object.keys(WIDGETS)) {
    const html = renderWidget({ t: type });
    assert.match(html, new RegExp(`^<div class="cw" data-colibri-theme data-cw="${type}"`), type);
    assert.match(html, /(Built|Made|Powered) (with|by) Colibri/, type);
    assert.match(html, /href="https:\/\/colibri-kit\.io\/widgets\/"/, type);
  }
});

test('text is escaped in every field of every widget', () => {
  const hostile = '"><img src=x onerror=alert(1)><script>alert(2)</script>\'';
  for (const [type, widget] of Object.entries(WIDGETS)) {
    const d = Object.fromEntries(widget.fields.filter((field) => field.type !== 'select').map((field) => [field.key, field.type === 'textarea' ? `${hostile} | ${hostile}` : hostile]));
    const html = renderWidget({ t: type, d });
    assert.doesNotMatch(html, /<img|<script|onerror=alert\(1\)>/, type);
  }
});

test('links accept http(s), mailto, tel and site paths only', () => {
  assert.equal(safeUrl('https://example.com/a?b=1'), 'https://example.com/a?b=1');
  assert.equal(safeUrl('example.com/pricing'), 'https://example.com/pricing');
  assert.equal(safeUrl('mailto:hi@example.com'), 'mailto:hi@example.com');
  assert.equal(safeUrl('/pricing'), '/pricing');
  for (const bad of ['javascript:alert(1)', ' JaVaScRiPt:alert(1)', 'data:text/html,<script>1</script>', 'vbscript:x', '//evil.example', 'not a link']) assert.equal(safeUrl(bad), '', bad);
  const html = renderWidget({ t: 'cta', d: { url: 'javascript:alert(1)', url2: 'data:text/html,x' } });
  assert.doesNotMatch(html, /javascript:|data:text/);
  assert.doesNotMatch(html, /class="btn"/, 'a button with an unusable link is left out');
});

test('configuration is bounded: unknown types, values and keys fall back to defaults', () => {
  const config = normalize({ t: '__proto__', hue: 9999, theme: 'x"onload="1', radius: 7, width: null, align: 'right', d: { nope: 1 } });
  assert.deepEqual([config.t, config.hue, config.theme, config.radius, config.width, config.align], ['badge', 360, 'auto', 'soft', 'm', 'start']);
  assert.equal('nope' in config.d, false);
  assert.equal(normalize({ t: 'cta', d: { title: 'x'.repeat(5000) } }).d.title.length, 160);
  assert.equal(normalize({ t: 'badge', d: { style: 'evil' } }).d.style, 'dark');
  assert.equal(parseConfig('{not json').t, 'badge');
  assert.equal(parseConfig(null).t, 'badge');
});

test('the look is carried as custom properties on the wrapper', () => {
  const html = renderWidget({ t: 'cta', hue: 150, theme: 'dark', radius: 'round', width: 'l', align: 'center' });
  assert.match(html, /data-align="center" style="--c-hue:150;color-scheme:dark;--c-radius-s:12px;--c-radius:16px;--c-radius-l:24px;--cw-w:40rem"/);
  assert.match(renderWidget({ t: 'cta' }), /style="--c-hue:250;--cw-w:28rem"/);
});

test('the embed snippet round-trips and keeps only what differs from the defaults', () => {
  assert.deepEqual(compact({ t: 'pricing' }), { t: 'pricing' });
  const config = { t: 'cta', hue: 20, d: { title: `It's <b>5 > 3</b> & "more"` } };
  const snippet = embedSnippet(config);
  assert.match(snippet, /^<colibri-widget config='[^']*'><a href="https:\/\/colibri-kit\.io\/widgets\/">Built with Colibri<\/a><\/colibri-widget>\n<script async src="https:\/\/colibri-kit\.io\/widgets\/embed\.js"><\/script>$/);
  const decoded = snippet.match(/config='([^']*)'/)[1].replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&amp;/g, '&');
  assert.deepEqual(parseConfig(decoded), normalize(config));
});

test('the HTML snippet is markup plus scoped styles, with no script', () => {
  const html = htmlSnippet({ t: 'faq' });
  assert.doesNotMatch(html, /<script/);
  assert.match(html, /<details><summary>/);
  for (const rule of WIDGET_CSS.split('\n')) assert.match(rule, /^\.cw/, 'every widget rule is scoped under .cw');
});

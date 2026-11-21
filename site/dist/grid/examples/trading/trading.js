import { QuoteFeed, currencies, fxKey } from './feed.js';
const $ = (id) => document.getElementById(id);
const money = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fxFormat = new Intl.NumberFormat('en-US', { minimumSignificantDigits: 5, maximumSignificantDigits: 6 });
const integers = new Intl.NumberFormat('en-US');
const timeFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZone: 'UTC',
});
const signed = (v, d = 2) => (v < 0 ? '−' : '+') + Math.abs(v).toFixed(d);
const priceText = (v, fx) => (fx ? fxFormat.format(v) : money.format(v));
const tone = (v) => (v > 0 ? 'up' : v < 0 ? 'down' : 'flat');
let feed,
  stocks,
  fx,
  movers,
  selected,
  minutes = 5,
  paused = false,
  rate = Number($('rate').value);
let now = Date.now(),
  last = performance.now(),
  nextTicks = new Map(),
  lastBatch = last,
  lastFx = last,
  lastDetailTick,
  lastReadout = last,
  total = 0,
  measured = 0,
  frame;
const markSelection = () => {
  for (const e of document.querySelectorAll('[data-instrument]'))
    e.toggleAttribute('data-chosen', e.dataset.instrument === selected);
};

class SymbolRenderer extends ColibriGrid.GridItemRenderer {
  constructor() {
    super();
    this.element.className = 'ticker';
    this.code = document.createElement('strong');
    this.hint = document.createElement('small');
    this.element.append(this.code, this.hint);
  }
  prepare() {
    const r = this.data;
    this.code.textContent = r.id;
    this.hint.textContent = r.company ?? '';
    this.hint.hidden = this.column.compact;
    this.element.dataset.instrument = r.id;
    this.element.toggleAttribute('data-chosen', r.id === selected);
  }
}
class QuoteRenderer extends ColibriGrid.GridItemRenderer {
  prepare() {
    const r = this.data,
      field = this.column.field,
      prior = this.previous;
    this.element.className = 'quote-value';
    this.element.textContent = this.column.percent
      ? signed(this.value) + '%'
      : this.column.delta
        ? signed(this.value, 4)
        : priceText(this.value, this.column.fx);
    if (this.column.percent || this.column.delta) this.element.dataset.tone = tone(this.value);
    if (
      this.column.flash &&
      prior !== undefined &&
      this.lastId === r.id &&
      prior !== this.value &&
      !reduced.matches
    ) {
      this.animation?.cancel();
      this.animation = this.element.animate(
        [{ backgroundColor: this.value > prior ? '#b9ead9' : '#f6cbd1' }, { backgroundColor: 'transparent' }],
        { duration: 420 },
      );
    }
    this.previous = this.value;
    this.lastId = r.id;
  }
  discard() {
    this.animation?.cancel();
    this.previous = undefined;
  }
}
class CrossRenderer extends ColibriGrid.GridItemRenderer {
  prepare() {
    const r = this.data,
      quote = this.column.field,
      el = this.element;
    el.className = 'cross-value';
    const diagonal = r.id === quote,
      change = r[quote + 'Pct'];
    el.textContent = diagonal ? '—' : fxFormat.format(this.value);
    el.dataset.instrument = diagonal ? '' : fxKey(r.id, quote);
    el.toggleAttribute('data-chosen', el.dataset.instrument === selected);
    el.style.backgroundColor = diagonal
      ? 'transparent'
      : `color-mix(in srgb, ${change >= 0 ? '#28986c' : '#d16978'} ${Math.min(42, 6 + Math.abs(change) * 85)}%, transparent)`;
    el.title = diagonal ? r.id : r.id + '/' + quote + ' · ' + signed(change) + '%';
  }
}
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const symbols = new ColibriGrid.ClassFactory(SymbolRenderer),
  quotes = new ColibriGrid.ClassFactory(QuoteRenderer),
  cross = new ColibriGrid.ClassFactory(CrossRenderer);
const col = (field, label, width, extra = {}) => ({ field, label, width, ...extra });
const num = (field, label, width, extra = {}) =>
  col(field, label, width, { type: 'number', itemRenderer: quotes, ...extra });
function choose(id) {
  if (!feed.record(id)) return;
  selected = id;
  markSelection();
  renderDetail();
}
function build() {
  for (const g of [stocks, fx, movers]) g?.destroy();
  now = Date.now();
  feed = new QuoteFeed($('market').value, Number($('size').value), now);
  selected = feed.records[0].id;
  stocks = new ColibriGrid($('stock-grid'), {
    label: 'Equity quotes',
    rows: feed.records.map((r) => ({ ...r })),
    onActivate: (r) => choose(r.id),
    columns: [
      col('id', 'Symbol', 130, { itemRenderer: symbols }),
      num('price', 'Last', 74, { flash: true }),
      num('bid', 'Bid', 68, { flash: true }),
      num('ask', 'Ask', 68, { flash: true }),
      num('pct', 'Change', 74, { percent: true }),
      col('volume', 'Volume', 78, { type: 'number', labelFunction: (r) => integers.format(r.volume) }),
    ],
  });
  fx = new ColibriGrid($('fx-grid'), {
    label: 'Currency cross rates',
    rows: feed.matrix,
    columns: [col('id', 'Base', 57), ...currencies.map((c) => num(c, c, 65, { itemRenderer: cross }))],
    onActivate: (r, c) => {
      if (c.field !== 'id' && c.field !== r.id) choose(fxKey(r.id, c.field));
    },
  });
  movers = new ColibriGrid($('movers-grid'), {
    label: 'Currency movers',
    rows: feed.movers,
    columns: [
      col('id', 'Pair', 78, { itemRenderer: symbols, compact: true }),
      num('price', 'Last', 71, { fx: true }),
      num('change', 'Net', 68, { delta: true }),
      num('pct', 'Change', 68, {
        percent: true,
        sortCompareFunction: (a, b) => Math.abs(a.pct) - Math.abs(b.pct),
      }),
    ],
    onActivate: (r) => choose(r.id),
  });
  movers.sort('pct', 'desc');
  for (const g of [stocks, fx, movers]) g.root.querySelector('.cg-bar').hidden = true;
  const search = stocks.search;
  search.placeholder = 'Search quotes';
  search.setAttribute('aria-label', 'Search quotes');
  $('search-slot').replaceChildren(search);
  search.addEventListener('input', () => updateCounts());
  total = 0;
  measured = 0;
  nextTicks.clear();
  last = lastBatch = lastFx = lastReadout = performance.now();
  updateCounts();
  renderDetail();
}
function updateCounts() {
  $('clock').textContent = timeFormat.format(now) + ' UTC';
  const count = stocks.view.length;
  $('watch-count').textContent = integers.format(count) + ' instruments';
  $('throughput').textContent = integers.format(paused ? 0 : measured) + ' equity updates/s';
}
function renderDetail() {
  const r = feed.record(selected),
    isFX = feed.fxRecords.has(selected);
  $('venue').textContent = isFX ? 'FX spot' : feed.market + ' · USD';
  $('symbol').textContent = r.id;
  $('company').textContent = r.company;
  $('price').textContent = priceText(r.price, isFX);
  $('change').textContent = signed(r.change, isFX ? 4 : 2) + ' (' + signed(r.pct) + '%)';
  $('change').dataset.tone = tone(r.change);
  for (const k of ['open', 'high', 'low', 'close']) $(k).textContent = priceText(r[k], isFX);
  lastDetailTick = r.asOf ?? feed.start;
  drawChart(feed.history(selected, minutes, lastDetailTick), isFX, lastDetailTick);
}
function drawChart(points, isFX, asOf) {
  const canvas = $('history'),
    w = canvas.clientWidth,
    h = canvas.clientHeight;
  if (!w || !h) return;
  const scale = devicePixelRatio || 1,
    width = Math.round(w * scale),
    height = Math.round(h * scale);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const values = points.map((p) => p[1]),
    lo = Math.min(...values),
    hi = Math.max(...values),
    pad = Math.max((hi - lo) * 0.1, hi * 0.00001);
  const left = 3,
    right = w - 55,
    top = 9,
    bottom = h - 22,
    x = (t) => left + ((t - (asOf - minutes * 60000)) / (minutes * 60000)) * (right - left),
    y = (v) => bottom - ((v - lo + pad) / (hi - lo + 2 * pad)) * (bottom - top);
  ctx.font = '10px ui-monospace, monospace';
  ctx.fillStyle = '#687974';
  ctx.strokeStyle = '#dde5e1';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const yy = top + ((bottom - top) * i) / 2;
    ctx.beginPath();
    ctx.moveTo(left, yy);
    ctx.lineTo(right, yy);
    ctx.stroke();
    ctx.fillText(priceText(hi + pad - ((hi - lo + 2 * pad) * i) / 2, isFX), right + 6, yy + 3);
  }
  const line = new Path2D();
  points.forEach(([t, v], i) => (i ? line.lineTo(x(t), y(v)) : line.moveTo(x(t), y(v))));
  const fill = new Path2D(line);
  fill.lineTo(right, bottom);
  fill.lineTo(left, bottom);
  fill.closePath();
  const gradient = ctx.createLinearGradient(0, top, 0, bottom);
  gradient.addColorStop(0, 'rgba(18,133,103,.24)');
  gradient.addColorStop(1, 'rgba(18,133,103,.02)');
  ctx.fillStyle = gradient;
  ctx.fill(fill);
  ctx.strokeStyle = '#117f67';
  ctx.lineWidth = 1.8;
  ctx.stroke(line);
  ctx.fillStyle = ctx.strokeStyle;
  ctx.beginPath();
  ctx.arc(right, y(values.at(-1)), 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#687974';
  for (let i = 0; i < 3; i++) {
    const t = asOf - minutes * 60000 * (1 - i / 2);
    ctx.textAlign = ['left', 'center', 'right'][i];
    ctx.fillText(timeFormat.format(t).slice(0, 5), left + ((right - left) * i) / 2, h - 3);
  }
  ctx.textAlign = 'left';
  canvas.setAttribute(
    'aria-label',
    selected + ' price over ' + minutes + ' minutes, last ' + priceText(values.at(-1), isFX),
  );
}
function run(t) {
  const elapsed = Math.max(0, Math.min(250, t - last));
  last = t;
  if (!paused && !document.hidden) {
    now += elapsed;
    if (t - lastBatch >= 45) {
      const equities = stocks.getVisibleRows();
      const updateFx = t - lastFx >= 250;
      const bases = updateFx ? fx.getVisibleRows().map((r) => r.id) : [];
      const pairs = updateFx ? movers.getVisibleRows().map((r) => r.id) : [];
      const scheduled = new Map(),
        changes = [];
      for (const { id } of equities) {
        let due = nextTicks.get(id);
        if (due === undefined || t >= due) {
          changes.push(feed.tick(id, now));
          // Stagger the second tick after a group of rows enters together.
          due = due === undefined ? t + (1000 / rate) * (0.5 + feed.random()) : Math.max(t, due + 1000 / rate);
        }
        scheduled.set(id, due);
      }
      nextTicks = scheduled;
      if (changes.length) total += stocks.applyUpdates(changes);
      if (updateFx) {
        if (bases.length || pairs.length) {
          const batch = feed.fxBatch(now, bases, pairs);
          if (bases.length) fx.applyUpdates(batch.matrix);
          if (pairs.length) movers.applyUpdates(batch.movers);
        }
        lastFx = t;
      }
      if (detailVisible && lastDetailTick !== (feed.record(selected).asOf ?? feed.start)) renderDetail();
      lastBatch = t;
    }
    if (t - lastReadout >= 1000) {
      measured = Math.round((total * 1000) / (t - lastReadout));
      total = 0;
      lastReadout = t;
      updateCounts();
    }
  }
  frame = requestAnimationFrame(run);
}
$('market').onchange = $('size').onchange = build;
$('rate').onchange = () => {
  rate = Number($('rate').value);
  nextTicks.clear();
};
$('pause').onclick = () => {
  paused = !paused;
  $('pause').textContent = paused ? 'Resume feed' : 'Pause feed';
  document.body.toggleAttribute('data-paused', paused);
  document.querySelector('.session').lastChild.textContent = paused ? 'Feed paused' : 'Simulated feed';
  total = 0;
  measured = 0;
  last = lastReadout = performance.now();
  updateCounts();
  renderDetail();
};
$('ranges').onclick = (e) => {
  if (!e.target.dataset.min) return;
  minutes = Number(e.target.dataset.min);
  for (const b of $('ranges').children) b.setAttribute('aria-pressed', String(Number(b.dataset.min) === minutes));
  renderDetail();
};
let detailVisible = false;
const detailVisibility = new IntersectionObserver(([entry]) => {
  detailVisible = entry.isIntersecting;
  if (detailVisible && feed) renderDetail();
});
detailVisibility.observe(document.querySelector('.detail'));
const chartSize = new ResizeObserver(() => {
  if (feed) renderDetail();
});
chartSize.observe($('history'));
document.addEventListener('visibilitychange', () => {
  last = performance.now();
});
build();
frame = requestAnimationFrame(run);
window.addEventListener('pagehide', () => cancelAnimationFrame(frame));
window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    last = performance.now();
    frame = requestAnimationFrame(run);
  }
});

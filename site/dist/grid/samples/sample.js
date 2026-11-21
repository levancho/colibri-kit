import { stories } from './catalog.js';
import { baseColumns, customColumns, extendedColumn, record, selectEditors } from './cells.js';
import { configureSample } from './variations.js';

const customIds = new Set(['custom-cells', 'custom-cell-editing']);
export function mountSample(stage, storyId) {
  const current = stories.find((s) => s.id === storyId);
  if (!current) throw new RangeError('Unknown grid sample: ' + storyId);
  stage.innerHTML =
    '<div id="toolbar"></div><div id="surface"></div><footer><span id="dimensions"></span><output id="activity" aria-live="polite"></output></footer>';
  const $ = (id) => stage.querySelector('#' + id),
    surface = $('surface'),
    toolbar = $('toolbar');
  const id = current.id,
    scope = new AbortController(),
    cleanup = [],
    expanded = new Set();
  let grid;
  toolbar.replaceChildren();
  surface.replaceChildren();
  surface.removeAttribute('style');
  surface.className = '';
  $('activity').textContent = '';
  function listen(el, type, fn, options = {}) {
    el.addEventListener(type, fn, { ...options, signal: scope.signal });
  }
  function button(label, fn, target = toolbar) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    listen(b, 'click', fn);
    target.append(b);
    return b;
  }
  function input(label, type, value, fn, attributes = {}) {
    const wrap = document.createElement('label'),
      el = document.createElement('input');
    el.type = type;
    Object.assign(el, attributes);
    if (type === 'checkbox') el.checked = value;
    else el.value = value;
    wrap.append(label, el);
    toolbar.append(wrap);
    listen(el, type === 'range' ? 'input' : 'change', () =>
      fn(type === 'checkbox' ? el.checked : ['range', 'number'].includes(type) ? el.valueAsNumber : el.value),
    );
    return el;
  }
  function select(label, values, fn) {
    const wrap = document.createElement('label'),
      el = document.createElement('select');
    values.forEach((v) => el.append(new Option(v, v)));
    wrap.append(label, el);
    toolbar.append(wrap);
    listen(el, 'change', () => fn(el.value));
    return el;
  }
  function notice(message) {
    $('activity').textContent = message;
  }
  let rows = [],
    columns = baseColumns.slice(),
    rowCount = id === 'add-columns' ? 10000 : customIds.has(id) ? 500 : 240;
  let query = '';
  const dimensions = (r, c) => {
    $('dimensions').textContent = r.toLocaleString() + ' rows  ·  ' + c.toLocaleString() + ' columns';
  };
  const update = () => dimensions(grid.view.length, grid.columns.length);
  function mount() {
    let order = grid?.order,
      top = grid?.port.scrollTop ?? 0,
      left = grid?.port.scrollLeft ?? 0;
    grid?.destroy();
    grid = new ColibriGrid(surface, {
      label: current.name,
      rows,
      columns,
      rangeSelection: true,
      onActivate: (r, c) => {
        notice(r.project + ' · ' + c.label);
      },
    });
    if (order && columns.some((c) => c.field === order.field)) grid.sort(order.field, order.asc ? 'asc' : 'desc');
    if (query) grid.filter(query);
    grid.port.scrollTop = top;
    grid.port.scrollLeft = left;
    grid.paint();
    update();
  }
  const ctx = {
    id,
    surface,
    button,
    input,
    notice,
    listen,
    cleanup,
    get grid() {
      return grid;
    },
    get columns() {
      return columns;
    },
    set columns(v) {
      columns = v;
    },
    filter(q) {
      query = q;
      grid.filter(q);
      update();
    },
    refresh() {
      grid.setRows(rows);
      update();
    },
  };
  const dispose = () => {
    scope.abort();
    cleanup.forEach((fn) => fn());
    grid?.destroy();
  };
  rows = Array.from({ length: rowCount }, (_, i) => record(i + 1));
  const allRows = rows;
  if (customIds.has(id)) {
    const custom = customColumns(
      notice,
      (key) => {
        expanded.has(key) ? expanded.delete(key) : expanded.add(key);
        rows = allRows.filter((r) => (r.id - 1) % 4 === 0 || expanded.has(r.id - ((r.id - 1) % 4)));
        ctx.refresh();
      },
      expanded,
    );
    if (id === 'custom-cells') {
      for (let i = 1; i <= rowCount; i += 4) expanded.add(i);
      columns = custom;
    } else columns = selectEditors;
    const jump = select(
      'Go to cell',
      columns.map((c) => c.label),
      (label) =>
        grid.activate(
          Math.max(0, grid.index),
          columns.findIndex((c) => c.label === label),
        ),
    );
    jump.value = columns[0].label;
    button('Open editor', () => grid.edit());
  }
  if (id === 'add-columns') {
    let size = 10,
      generated = 10;
    const limit = 200;
    const setSize = (n) => {
      size = Math.max(2, Math.min(limit, n));
      columns = Array.from({ length: size }, (_, i) => extendedColumn(i));
      if (size > generated)
        for (const r of rows)
          for (let i = generated; i < size; i++) {
            const key = 'metric' + (i + 1);
            if (!(key in r)) r[key] = (r.id * (i + 5)) % 1000;
          }
      generated = Math.max(generated, size);
      mount();
      bar.value = size;
      out.value = size;
      less.disabled = size === 2;
      more.disabled = size === limit;
    };
    const bar = input('Columns', 'range', size, setSize, { min: 2, max: limit }),
      out = document.createElement('output');
    out.value = size;
    toolbar.append(out);
    const less = button('− Remove', () => setSize(size - 1)),
      more = button(
        '+ Add column',
        () => {
          setSize(size + 1);
          grid.activate(grid.index, size - 1);
        },
          );
  }
  configureSample(ctx);
  if (!toolbar.children.length) {
    const label = document.createElement('strong');
    label.textContent = customIds.has(id) ? 'Cell library' : 'Project register';
    toolbar.append(label);
  }
  listen(surface, 'colibri-change', (e) => {
    const { id: rowId, field, value } = e.detail;
    const row = allRows[rowId - 1];
    if (row) row[field] = value;
    notice('Saved ' + field + ' · ' + String(value ?? ''));
  });
  mount();
  return dispose;
}

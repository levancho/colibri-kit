import { extendedColumn, projectRows } from '../cells.js';

export const controls = `<label>Columns <input type="range" min="2" max="200" value="10"></label>
<output>10</output>
<button type="button" name="remove">− Remove</button>
<button type="button" name="add">+ Add column</button>`;

export function createAddColumns(host, toolbar, status, onActivate) {
  const rows = projectRows('add-columns');
  const slider = toolbar.querySelector('input');
  const remove = toolbar.querySelector('[name=remove]');
  const add = toolbar.querySelector('[name=add]');
  let grid,
    generated = 10;
  function resize(count) {
    for (let i = generated; i < count; i++) {
      for (const row of rows) row['metric' + (i + 1)] = (row.id * (i + 5)) % 1000;
    }
    generated = Math.max(generated, count);
    const order = grid?.order,
      top = grid?.port.scrollTop ?? 0,
      left = grid?.port.scrollLeft ?? 0;
    grid?.destroy();
    const columns = Array.from({ length: count }, (_, i) => extendedColumn(i));
    grid = new ColibriGrid(host, { rows, columns, label: 'Add columns', onActivate, rangeSelection: true });
    if (order && columns.some((column) => column.field === order.field))
      grid.sort(order.field, order.asc ? 'asc' : 'desc');
    grid.port.scrollTop = top;
    grid.port.scrollLeft = left;
    grid.paint();
    slider.value = count;
    toolbar.querySelector('output').value = count;
    remove.disabled = count === 2;
    add.disabled = count === 200;
  }
  resize(10);
  const changes = new AbortController();
  host.addEventListener(
    'colibri-change',
    ({ detail }) => {
      rows[detail.id - 1][detail.field] = detail.value;
    },
    { signal: changes.signal },
  );
  slider.oninput = () => resize(slider.valueAsNumber);
  remove.onclick = () => resize(slider.valueAsNumber - 1);
  add.onclick = () => {
    resize(slider.valueAsNumber + 1);
    grid.activate(grid.index, grid.columns.length - 1);
  };
  return () => {
    changes.abort();
    grid.destroy();
  };
}

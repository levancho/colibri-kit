import { customColumns, projectRows } from '../cells.js';

export const controls = `<label>Go to cell <select></select></label>
<button type="button">Open editor</button>`;

export function createCustomCells(host, toolbar, status, onActivate) {
  const rows = projectRows('custom-cells');
  const expanded = new Set(rows.filter((row) => row.id % 4 === 1).map((row) => row.id));
  const grid = new ColibriGrid(host, {
    editorPresentation: 'inline',
    rows,
    columns: customColumns((message) => (status.textContent = message), togglePortfolio, expanded),
    label: 'Custom cells',
    onActivate,
    rangeSelection: true,
  });
  function togglePortfolio(id) {
    if (expanded.has(id)) expanded.delete(id);
    else expanded.add(id);
    grid.setRows(rows.filter((row) => row.id % 4 === 1 || expanded.has(row.id - ((row.id - 1) % 4))));
  }
  host.addEventListener(
    'colibri-change',
    ({ detail }) => {
      rows[detail.id - 1][detail.field] = detail.value;
    },
    { signal: grid.life.signal },
  );
  const jump = toolbar.querySelector('select');
  for (const column of grid.columns) jump.add(new Option(column.label, column.label));
  jump.onchange = () => grid.activate(Math.max(0, grid.index), jump.selectedIndex);
  toolbar.querySelector('button').onclick = () => grid.edit();
  return () => grid.destroy();
}

import { selectEditors, projectRows } from '../cells.js';

export const controls = `<label>Go to cell <select></select></label>
<button type="button">Open editor</button>`;

export function createCustomCellEditing(host, toolbar, status, onActivate) {
  const grid = new ColibriGrid(host, {
    columns: selectEditors,
    rows: projectRows('custom-cell-editing'),
    label: 'Dropdown and tag editors',
    onActivate,
    rangeSelection: true,
  });
  const jump = toolbar.querySelector('select');
  for (const column of grid.columns) jump.add(new Option(column.label, column.label));
  jump.onchange = () => grid.activate(Math.max(0, grid.index), jump.selectedIndex);
  toolbar.querySelector('button').onclick = () => grid.edit();
  return () => grid.destroy();
}

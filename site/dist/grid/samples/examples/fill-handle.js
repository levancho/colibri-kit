import { baseColumns, projectRows } from '../cells.js';

export const controls = '<button type="button">Select A1:B3</button>';

export function createFillHandle(host, toolbar, status, onActivate) {
  const grid = new ColibriGrid(host, {
    editorPresentation: 'inline',
    columns: baseColumns,
    rows: projectRows('fill-handle'),
    label: 'Fill handle',
    onActivate,
    rangeSelection: true,
  });
  toolbar.querySelector('button').onclick = () => {
    grid.activate(0, 0);
    grid.activate(2, 1, true);
    grid.port.focus();
  };
  return () => grid.destroy();
}

import { baseColumns, projectRows } from '../cells.js';

export const controls = '';

export function createHeaderMenus(host, toolbar, status, onActivate) {
  const grid = new ColibriGrid(host, {
    editorPresentation: 'inline',
    columns: baseColumns,
    rows: projectRows('header-menus'),
    label: 'Header menus',
    onActivate,
    rangeSelection: true,
  });
  return () => grid.destroy();
}

import { baseColumns, projectRows } from '../cells.js';

export const controls = '<label>Search records <input type="search" placeholder="Project, owner or team"></label>';

export function createSearchAsFilter(host, toolbar, status, onActivate) {
  const grid = new ColibriGrid(host, {
    editorPresentation: 'inline',
    columns: baseColumns,
    rows: projectRows('search-as-filter'),
    label: 'Search as filter',
    onActivate,
    rangeSelection: true,
  });
  const search = toolbar.querySelector('input');
  search.addEventListener('input', () => grid.filter(search.value));
  return () => grid.destroy();
}

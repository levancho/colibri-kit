import { editorColumns, editorRows } from '../project-editors.js';

export const controls = '<label><input type="checkbox" checked> Enable editing</label>';

export function createProjectEditors(host, toolbar, status, onActivate) {
  const grid = new ColibriGrid(host, {
    editorPresentation: 'inline',
    label: 'Project editors', rows: editorRows(), columns: editorColumns(true), rangeSelection: true, onActivate,
  });
  const toggle = toolbar.querySelector('input');
  toggle.onchange = () => {
    for (const column of grid.columns) column.editable = toggle.checked && column.field !== 'project';
    grid.paint(true);
  };
  return () => grid.destroy();
}

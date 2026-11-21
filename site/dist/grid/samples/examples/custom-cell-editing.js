import { choiceColumn, phases, projectRows, teams } from '../cells.js';

export const controls = '';

export function createCustomCellEditing(host, toolbar, status, onActivate) {
  const columns = [
    { field: 'project', label: 'Project', width: 205, editable: false },
    choiceColumn('status', 'Status', 170, phases, { status: true }),
    choiceColumn('tags', 'Team tags', 240, teams, { multiple: true }),
    choiceColumn('freeTags', 'Freeform tags', 215, [], { multiple: true, duplicates: true }),
  ];
  const grid = new ColibriGrid(host, {
    editorPresentation: 'inline',
    columns,
    rows: projectRows('custom-cell-editing'),
    label: 'Dropdown and tag editors',
    onActivate,
    rangeSelection: true,
  });
  return () => grid.destroy();
}

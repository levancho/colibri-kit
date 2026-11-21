import { baseColumns, projectRows } from '../cells.js';

export const controls = '';

export function createValidateData(host, toolbar, status, onActivate) {
  const budget = {
    ...baseColumns.find((column) => column.field === 'amount'),
    validator: (value) => (Number.isInteger(value) && value >= 0) || 'Enter a whole number of zero or more.',
  };
  const grid = new ColibriGrid(host, {
    editorPresentation: 'inline',
    columns: [baseColumns[0], budget, ...baseColumns.slice(1, 4)],
    rows: projectRows('validate-data'),
    label: 'Validated edits',
    onActivate,
    rangeSelection: true,
  });
  return () => grid.destroy();
}

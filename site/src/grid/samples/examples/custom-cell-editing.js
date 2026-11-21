import { selectEditors } from '../cells.js';

export function configureCustomCellEditing(c) {
  c.columns = selectEditors;
  const jump = c.select(
    'Go to cell',
    c.columns.map((c) => c.label),
    (label) =>
      c.grid.activate(
        Math.max(0, c.grid.index),
        c.columns.findIndex((c) => c.label === label),
      ),
  );
  jump.value = c.columns[0].label;
  c.button('Open editor', () => c.grid.edit());
}

import { customColumns } from '../cells.js';

export function configureCustomCells(c) {
  const expanded = new Set(c.rows.filter((row) => row.id % 4 === 1).map((row) => row.id));
  c.columns = customColumns(
    c.notice,
    (key) => {
      if (expanded.has(key)) expanded.delete(key);
      else expanded.add(key);
      c.setVisibleRows(
        c.rows.filter((row) => (row.id - 1) % 4 === 0 || expanded.has(row.id - ((row.id - 1) % 4))),
      );
    },
    expanded,
  );
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

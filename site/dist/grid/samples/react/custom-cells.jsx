import React, { useMemo, useRef, useState } from 'react';
import { ColibriGrid } from '@colibri-kit/ui/react/grid';
import { customColumns, projectRows } from '../cells.js';
import { reactColumn } from './columns.jsx';

export default function CustomCells() {
  const [rows, setRows] = useState(() => projectRows('custom-cells'));
  const [expanded, setExpanded] = useState(() => new Set(rows.filter((r) => r.id % 4 === 1).map((r) => r.id)));
  const [message, setMessage] = useState('');
  const [field, setField] = useState(0);
  const grid = useRef(null);
  const columns = useMemo(
    () =>
      customColumns(
        setMessage,
        (id) =>
          setExpanded((previous) => {
            const next = new Set(previous);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          }),
        expanded,
      ).map(reactColumn),
    [expanded],
  );
  const visible = rows.filter((r) => r.id % 4 === 1 || expanded.has(r.id - ((r.id - 1) % 4)));
  function save(nextRows, changes) {
    const changed = new Set(changes.map((change) => change.id));
    const edits = new Map(nextRows.filter((row) => changed.has(row.id)).map((row) => [row.id, row]));
    setRows((previous) => previous.map((row) => edits.get(row.id) ?? row));
  }
  return (
    <>
      <label>
        Go to cell{' '}
        <select
          value={field}
          onChange={(e) => {
            const index = Number(e.target.value);
            setField(index);
            grid.current.selectCell(grid.current.getSelection().top, index);
          }}
        >
          {columns.map((c, i) => (
            <option key={c.field} value={i}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <button
        onClick={() => {
          const cell = grid.current.getSelection();
          grid.current.editCell(cell.top, cell.left);
        }}
      >
        Open editor
      </button>
      <ColibriGrid ref={grid} label="Custom cells" rows={visible} columns={columns} onRowsChange={save} />
      <output>{message}</output>
    </>
  );
}

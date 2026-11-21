import React, { useRef, useState } from 'react';
import { ColibriGrid } from '@colibri-kit/ui/react/grid';
import { projectRows, selectEditors } from '../cells.js';
import { reactColumn } from './columns.jsx';

const columns = selectEditors.map(reactColumn);
export default function CustomCellEditing() {
  const [rows, setRows] = useState(() => projectRows('custom-cell-editing'));
  const [field, setField] = useState(0);
  const grid = useRef(null);
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
      <ColibriGrid ref={grid} label="Custom cell editing" rows={rows} columns={columns} onRowsChange={setRows} />
    </>
  );
}

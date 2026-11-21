import React, { useRef, useState } from 'react';
import { ColibriGrid } from '@colibri-kit/ui/react/grid';
import { projectRows } from '../cells.js';
import { projectColumns } from './columns.jsx';

export default function FillHandle() {
  const [rows, setRows] = useState(() => projectRows('fill-handle'));
  const grid = useRef(null);
  return (
    <>
      <button
        onClick={() => {
          grid.current.selectRange(0, 0, 2, 1);
          grid.current.focus();
        }}
      >
        Select A1:B3
      </button>
      <ColibriGrid ref={grid} label="Fill handle" rows={rows} columns={projectColumns} onRowsChange={setRows} />
    </>
  );
}

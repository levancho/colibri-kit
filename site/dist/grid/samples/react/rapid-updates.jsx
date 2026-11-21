import React, { useEffect, useRef, useState } from 'react';
import { ColibriGrid } from '@colibri-kit/ui/react/grid';
import { projectRows } from '../cells.js';
import { projectColumns } from './columns.jsx';

const columns = [0, 5, 1, 2, 6, 4].map((index) => projectColumns[index]);
export default function RapidUpdates() {
  const [rows, setRows] = useState(() => projectRows('rapid-updates'));
  const [running, setRunning] = useState(true);
  const [updates, setUpdates] = useState(0);
  const grid = useRef(null);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      const visible = new Set(grid.current.getVisibleRows().map((row) => row.id));
      if (!visible.size) return;
      setRows((current) =>
        current.map((row) =>
          visible.has(row.id) ? { ...row, amount: row.amount + (row.id % 2 === 0 ? 3 : -2) } : row,
        ),
      );
      setUpdates((total) => total + visible.size);
    }, 350);
    return () => clearInterval(timer);
  }, [running]);
  return (
    <>
      <button onClick={() => setRunning(!running)}>{running ? 'Pause feed' : 'Resume feed'}</button>
      <ColibriGrid editorPresentation="inline" label="Rapid updates" ref={grid} rows={rows} columns={columns} onRowsChange={setRows} />
      <output>{updates} updates</output>
    </>
  );
}

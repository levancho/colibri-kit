import React, { useMemo, useState } from 'react';
import { ColibriGrid } from '@colibri-kit/ui/react/grid';
import { extendedColumn, projectRows } from '../cells.js';
import { reactColumn } from './columns.jsx';

export default function AddColumns() {
  const [rows, setRows] = useState(() => projectRows('add-columns'));
  const [count, setCount] = useState(10);
  const columns = useMemo(() => Array.from({ length: count }, (_, i) => reactColumn(extendedColumn(i))), [count]);
  function resize(size) {
    if (size > count && size > 10)
      setRows((current) =>
        current.map((row) => {
          const next = { ...row };
          for (let i = Math.max(count, 10); i < size; i++) next['metric' + (i + 1)] ??= (row.id * (i + 5)) % 1000;
          return next;
        }),
      );
    setCount(size);
  }
  return (
    <>
      <label>
        Columns{' '}
        <input type="range" min="2" max="200" value={count} onChange={(e) => resize(e.target.valueAsNumber)} />
      </label>
      <output>{count}</output>
      <button disabled={count <= 2} onClick={() => resize(count - 1)}>
        − Remove
      </button>
      <button disabled={count >= 200} onClick={() => resize(count + 1)}>
        + Add column
      </button>
      <ColibriGrid editorPresentation="inline" label="Add columns" rows={rows} columns={columns} onRowsChange={setRows} />
    </>
  );
}

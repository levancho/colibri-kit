import React, { useState } from 'react';
import { ColibriGrid } from '@colibri-kit/ui/react/grid';
import { projectRows } from '../cells.js';
import { projectColumns } from './columns.jsx';

export default function FreezeColumns() {
  const [rows, setRows] = useState(() => projectRows('freeze-columns'));
  const [pinned, setPinned] = useState(1);
  return (
    <>
      <label>
        Pinned columns{' '}
        <input type="range" min="0" max="3" value={pinned} onChange={(e) => setPinned(e.target.valueAsNumber)} />
      </label>
      <ColibriGrid editorPresentation="inline"
        label="Freeze columns"
        rows={rows}
        columns={projectColumns}
        pinnedColumns={pinned}
        onRowsChange={setRows}
      />
    </>
  );
}

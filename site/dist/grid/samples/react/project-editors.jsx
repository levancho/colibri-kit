import React, { useMemo, useState } from 'react';
import { ColibriGrid } from '@colibri-kit/ui/react/grid';
import { editorColumns, editorRows } from '../project-editors.js';
import { reactColumn } from './columns.jsx';

export default function ProjectEditors() {
  const [rows, setRows] = useState(editorRows);
  const [editable, setEditable] = useState(true);
  const columns = useMemo(() => editorColumns(editable).map(reactColumn), [editable]);
  return <>
    <label><input type="checkbox" checked={editable} onChange={event => setEditable(event.target.checked)} /> Enable editing</label>
    <ColibriGrid editorPresentation="inline" label="Project editors" rows={rows} columns={columns} onRowsChange={setRows} />
  </>;
}

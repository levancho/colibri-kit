import React, { useMemo, useState } from 'react';
import { ColibriGrid } from '@colibri-kit/ui/react/grid';
import { colorColumns, colorRows } from '../color-editor.js';
import { reactColumn } from './columns.jsx';

export default function ColorPalette() {
  const [rows, setRows] = useState(colorRows);
  const columns = useMemo(() => colorColumns().map(reactColumn), []);
  return <ColibriGrid editorPresentation="inline" label="Color palette" rows={rows} columns={columns} onRowsChange={setRows} />;
}

import React, { useState } from 'react';
import { ColibriGrid } from '@colibri-kit/ui/react/grid';
import { projectRows } from '../cells.js';
import { projectColumns } from './columns.jsx';

const columns = [
  projectColumns[0],
  {
    ...projectColumns[5],
    validate: (value) => (Number.isInteger(value) && value >= 0) || 'Enter a whole number of zero or more.',
  },
  ...projectColumns.slice(1, 4),
];

export default function ValidateData() {
  const [rows, setRows] = useState(() => projectRows('validate-data'));
  return <ColibriGrid editorPresentation="inline" label="Validate data" rows={rows} columns={columns} onRowsChange={setRows} />;
}

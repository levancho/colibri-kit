import React, { useState } from 'react';
import { ColibriGrid } from '@colibri-kit/ui/react/grid';
import { choiceColumn, phases, projectRows, teams } from '../cells.js';
import { reactColumn } from './columns.jsx';

const columns = [
  { field: 'project', label: 'Project', width: 205, editable: false },
  choiceColumn('status', 'Status', 170, phases, { status: true }),
  choiceColumn('tags', 'Team tags', 240, teams, { multiple: true }),
  choiceColumn('freeTags', 'Freeform tags', 215, [], { multiple: true, duplicates: true }),
].map(reactColumn);
export default function CustomCellEditing() {
  const [rows, setRows] = useState(() => projectRows('custom-cell-editing'));
  return <ColibriGrid label="Dropdown and tag editors" rows={rows} columns={columns} onRowsChange={setRows} />;
}

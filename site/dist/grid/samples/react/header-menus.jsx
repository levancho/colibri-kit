import React, { useState } from 'react';
import { ColibriGrid } from '@colibri-kit/ui/react/grid';
import { projectRows } from '../cells.js';
import { projectColumns } from './columns.jsx';

export default function HeaderMenus() {
  const [rows, setRows] = useState(() => projectRows('header-menus'));
  return <ColibriGrid label="Header menus" rows={rows} columns={projectColumns} onRowsChange={setRows} />;
}

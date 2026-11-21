import React, { useState } from 'react';
import { ColibriGrid } from '@colibri-kit/ui/react/grid';
import { projectRows } from '../cells.js';
import { projectColumns } from './columns.jsx';

export default function SearchAsFilter() {
  const [rows, setRows] = useState(() => projectRows('search-as-filter'));
  const [query, setQuery] = useState('');
  return (
    <>
      <label>
        Search records{' '}
        <input
          type="search"
          placeholder="Project, owner or team"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <ColibriGrid
        label="Search as filter"
        columns={projectColumns}
        rows={rows}
        query={query}
        onRowsChange={setRows}
      />
    </>
  );
}

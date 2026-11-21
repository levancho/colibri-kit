// Load @colibri-kit/ui/themes/colibri.css and @colibri-kit/ui/themes/grid.css in the app.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ColibriGrid } from '@colibri-kit/ui/react/grid';

const statuses = ['Planned', 'In progress', 'In review', 'Released'];
const columns = [
  { field: 'project', label: 'Project', width: 226, editable: true },
  { field: 'owner', label: 'Owner', width: 150, editable: true },
  {
    field: 'budget',
    label: 'Budget',
    width: 120,
    type: 'number',
    editable: true,
    validate: (value) => (Number.isInteger(value) && value >= 0) || 'Enter a nonnegative whole number.',
  },
  {
    field: 'status',
    label: 'Stage',
    width: 157,
    editable: true,
    renderCell: ({ value }) => <span className={'chip phase-' + statuses.indexOf(value)}>{value}</span>,
    renderEditor: ({ value, onChange }) => (
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {statuses.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
    ),
    validate: (value) => statuses.includes(value) || 'Choose a listed stage.',
  },
  { field: 'approved', label: 'Approved', width: 110, type: 'boolean', editable: true },
];
const initial = Array.from({ length: 10000 }, (_, i) => ({
  id: i + 1,
  project: ['Atlas search', 'Relay console', 'Beacon maps'][i % 3] + ' / ' + (i + 1),
  owner: ['Maya Reed', 'Jon West', 'Ada Bell'][i % 3],
  budget: 4800 + i * 7,
  status: statuses[i % 4],
  approved: i % 3 === 0,
}));
function Projects() {
  const [rows, setRows] = useState(initial),
    [query, setQuery] = useState(''),
    [pinned, setPinned] = useState(true),
    [last, setLast] = useState('');
  return (
    <>
      <div className="integration-tools">
        <label>
          Search projects <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <label>
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} /> Pin project
        </label>
      </div>
      <ColibriGrid
        label="React project register"
        rows={rows}
        columns={columns}
        query={query}
        pinnedColumns={pinned ? 1 : 0}
        onRowsChange={(next, changes) => {
          setRows(next);
          setLast('Saved ' + changes.length + ' cell' + (changes.length === 1 ? '' : 's'));
        }}
      />
      <output aria-live="polite">{last}</output>
    </>
  );
}
createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <Projects />
  </React.StrictMode>,
);

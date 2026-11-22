import React, { useState } from 'react';
import { ColibriWorkbenchGrid } from '../../integrations/workbench-grid.jsx';
import { PropertyEditor } from '../../property-editor.js';

export default function FullGrid() {
  const params = new URLSearchParams(location.search);
  const [table, setTable] = useState(() => createTable(
    params.get('dataset') === 'participants' ? 'participants' : 'projects',
    sizes.includes(Number(params.get('size'))) ? Number(params.get('size')) : 1000,
  ));
  const [theme, setTheme] = useState(() => themes.includes(params.get('theme')) ? params.get('theme') : 'Colibri');
  const { dataset, size, columns, rows } = table;
  const projects = dataset === 'projects';

  const mode = theme === 'Colibri' ? undefined : theme.includes('Dark') || theme === 'Marine' ? 'dark' : 'light';
  const skin = theme.includes('contrast') ? 'contrast' : theme.toLowerCase();

  return (
    <section data-theme={mode} data-skin={skin} data-application="full-grid" className="workbench-app" dir={params.get('rtl') === 'true' ? 'rtl' : undefined}>
      <header className="demo-head"><div className="demo-options">
        <label>Dataset
          <select id="dataset" value={dataset} onChange={e => setTable(createTable(e.target.value, size))}>
            <option value="projects">Projects</option><option value="participants">Participants</option>
          </select>
        </label>
        <label>Data size
          <select id="size" value={size} onChange={e => setTable(createTable(dataset, Number(e.target.value)))}>
            {sizes.map(n => <option key={n} value={n}>{n.toLocaleString()} rows{n === 10000 ? ' × 100 columns' : ''}</option>)}
          </select>
        </label>
        <label>Theme
          <select id="skin" value={theme} onChange={e => setTheme(e.target.value)}>
            {themes.map(name => <option key={name}>{name}</option>)}
          </select>
        </label>
      </div></header>
      <ColibriWorkbenchGrid
        columns={columns}
        rows={rows}
        onRowsChange={next => setTable(current => ({ ...current, rows: next }))}
        onImport={data => setTable(current => ({ ...current, ...data }))}
        theme={theme}
        onThemeChange={setTheme}
        paged={projects}
        totals={projects}
        pageSize={projects ? 20 : 50}
        searchBehavior={projects ? 'highlight' : 'filter'}
        searchFields={projects ? projectSearch : null}
      />
    </section>
  );
}

const people = ['Maya Reed', 'Jon Bell', 'Lena Park', 'Iris Hall', 'Noah Chen', 'Ari West',
  'Nora Shah', 'Theo Brown', 'Kira Moss', 'Hugo Lee', 'Sofia Reyes', 'Luca Meyer'];
const countries = ['Ireland', 'France', 'Sweden', 'Portugal', 'Germany', 'Japan'];
const flags = { Ireland: '🇮🇪', France: '🇫🇷', Sweden: '🇸🇪', Portugal: '🇵🇹', Germany: '🇩🇪', Japan: '🇯🇵' };
const languages = ['English', 'French', 'Swedish', 'Portuguese', 'German', 'Japanese'];
const games = ['Chess', 'Go', 'Bridge', 'Rithmomachy', 'Shogi'];
const statuses = ['In progress', 'Completed', 'Suspended'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const themes = ['Colibri', 'Light', 'Dark', 'Light contrast', 'Dark contrast', 'Marine', 'Quartz', 'Alpine', 'Balham', 'Material'];
const sizes = [100, 1000, 10000, 50000, 100000];
const projectSearch = ['property', 'client', 'before', 'after'];
const money = { type: 'number', kind: 'money' };

function Team({ value }) {
  return <span className="wb-people">{String(value ?? '').split(',').map(s => s.trim()).filter(Boolean).map(name =>
    <span key={name} className="wb-avatar" title={name}>{name.split(' ').map(part => part[0]).join('')}</span>
  )}</span>;
}

const projectColumns = [
  { field: 'pinned', label: 'Pin', group: 'Projects', kind: 'pin', width: 80, editable: false, options: ['true', 'false'] },
  { field: 'team', label: 'Team', group: 'Projects', kind: 'team', width: 115, options: people,
    renderCell: ({ value }) => <Team value={value} /> },
  { field: 'property', label: 'Property', group: 'Projects', rowLabel: true, summary: 'count',
    itemEditor: () => new PropertyEditor(), validator: value => !value || /^R-\d{3}\.\d{3}$/.test(value) || 'Use R-000.000' },
  { field: 'status', label: 'Status', group: 'Projects', kind: 'status', options: statuses,
    renderCell: ({ value }) => <span className="wb-status" data-state={value}>{value}</span> },
  { field: 'client', label: 'Client', group: 'Projects', summary: 'count' },
  { field: 'start', label: 'Start date', group: 'Dates', type: 'date' },
  { field: 'end', label: 'End date', group: 'Dates', type: 'date' },
  { field: 'before', label: 'Before', group: 'Budget', ...money, heat: true },
  { field: 'after', label: 'After', group: 'Budget', ...money, heat: true },
  { field: 'country', label: 'Country', group: 'Projects', flags, options: countries },
];

const participantColumns = [
  { field: 'name', label: 'Name', group: 'Participant', width: 165, rowLabel: true },
  { field: 'language', label: 'Language', group: 'Participant', options: languages },
  { field: 'country', label: 'Country', group: 'Participant', flags, options: countries },
  { field: 'game', label: 'Game', group: 'Game of choice', options: games },
  { field: 'bought', label: 'Bought', group: 'Game of choice', type: 'boolean', rendererIsEditor: true,
    options: ['true', 'false'], width: 88 },
  { field: 'bank', label: 'Bank balance', group: 'Performance', ...money },
  { field: 'rating', label: 'Rating', group: 'Performance', kind: 'rating', type: 'number', width: 139,
    itemRenderer: () => window.ColibriGrid.cells.rating.newInstance(), rendererIsEditor: true },
  { field: 'wins', label: 'Total winnings', group: 'Performance', ...money },
  { field: 'year', label: 'Year', group: 'Performance', type: 'number' },
  { field: 'played', label: 'Games played', group: 'Performance', type: 'number' },
  ...months.map(field => ({ field, label: field, group: 'Monthly breakdown', ...money })),
];

function createTable(dataset, size) {
  const projects = dataset === 'projects';
  const columns = (projects ? projectColumns : participantColumns).map(column => ({ editable: true, width: 130, ...column }));
  const firstMetric = columns.length;
  if (size === 10000) {
    for (let i = firstMetric; i < 100; i++)
      columns.push({ field: 'metric' + i, label: 'Metric ' + (i + 1), group: 'Metrics', editable: true, type: 'number', width: 130 });
  }
  const rows = Array.from({ length: size }, (_, i) => {
    const cost = (i * 7919 + 42121) % 100000;
    const day = String(i % 27 + 1).padStart(2, '0');
    const row = projects ? {
      id: i + 1,
      team: people[i % people.length] + ', ' + people[(i + 3) % people.length],
      property: 'R-' + (320 + i % 601) + '.' + (100 + i % 899),
      status: statuses[(i * 7) % statuses.length],
      client: people[(i + 7) % people.length],
      start: '2026-' + String(i % 8 + 1).padStart(2, '0') + '-' + day,
      end: '2026-12-' + day,
      before: cost, after: Math.round(cost * 0.87), country: countries[i % countries.length],
    } : {
      id: i + 1, name: people[i % people.length], language: languages[i % languages.length],
      country: countries[i % countries.length], game: games[i % games.length], bought: i % 4 !== 0,
      bank: cost, rating: i % 6, wins: (cost * 3) % 150000, year: 2020 + i % 7, played: i % 120,
    };
    if (!projects) months.forEach((month, j) => { row[month] = (cost * (j + 1)) % 9999; });
    for (let j = firstMetric; j < columns.length; j++) row['metric' + j] = (i * 13 + j) % 999;
    return row;
  });
  return { dataset, size, columns, rows };
}

import { choiceColumn } from './cells.js';

const owners = ['Nora Shah', 'Ari West', 'Maya Reed', 'Theo Brown'];
const statuses = ['Planned', 'In progress', 'Done'];
const renewals = ['One month', 'Quarterly', 'Annual', 'By request'];

export function editorRows() {
  return ['Atlas redesign', 'Harbor reports', 'Meridian API', 'Studio library', 'Orbit analytics', 'Beacon maps'].map((project, i) => ({
    id: i + 1, project, hours: [42, 18, 60, 32, 75, 24][i], owner: owners[i % owners.length],
    status: statuses[i % statuses.length], renewals: renewals[i % renewals.length],
    paid: i % 2 === 0, start: '2026-11-' + (12 + i),
  }));
}
export function editorColumns(editable) {
  return [
    { field: 'project', label: 'Project', width: 155, editable: false },
    { field: 'hours', label: 'Hours', type: 'number', width: 88, editable, validator: n => Number.isFinite(n) && n >= 0 || 'Enter nonnegative hours.' },
    choiceColumn('owner', 'Owner', 160, owners, { searchable: false }),
    choiceColumn('status', 'Status', 150, statuses, { status: true }),
    choiceColumn('renewals', 'Renewals', 305, renewals, { multiple: true, allowNew: false }),
    { field: 'paid', label: 'Paid', type: 'boolean', width: 76 },
    { field: 'start', label: 'Start date', type: 'date', width: 140 },
  ].map(col => ({ ...col, editable: editable && col.field !== 'project' }));
}

import { ColibriTreeGrid } from './tree-grid.js';

const rows = [
  { id: 'release', name: 'Platform release', owner: 'Maya Reed', status: 'In progress' },
  { id: 'client', parentId: 'release', name: 'Client rollout', owner: 'Iris Hall', status: 'In progress' },
  { id: 'pilot', parentId: 'client', name: 'Pilot accounts', owner: 'Lena Park', status: 'Ready', hours: 12 },
  { id: 'migration', parentId: 'client', name: 'Data migration', owner: 'Theo Brown', status: 'In progress', hours: 32 },
  { id: 'quality', parentId: 'release', name: 'Quality review', owner: 'Nora Shah', status: 'In review' },
  { id: 'keyboard', parentId: 'quality', name: 'Keyboard navigation', owner: 'Ari West', status: 'In review', hours: 8 },
  { id: 'reader', parentId: 'quality', name: 'Screen reader audit', owner: 'Nora Shah', status: 'Ready', hours: 16 },
  { id: 'contrast', parentId: 'quality', name: 'Contrast checks', owner: 'Iris Hall', status: 'Complete', hours: 4 },
  { id: 'customer', name: 'Customer operations', owner: 'Eva Cruz', status: 'In progress' },
  { id: 'support', parentId: 'customer', name: 'Support readiness', owner: 'Eva Cruz', status: 'In progress' },
  { id: 'training', parentId: 'support', name: 'Training notes', owner: 'Jon Bell', status: 'In review', hours: 6 },
  { id: 'handoff', parentId: 'support', name: 'Support handoff', owner: 'Eva Cruz', status: 'Ready', hours: 10 },
  { id: 'research', name: 'Design research', owner: 'Luca Myers', status: 'Ready' },
  { id: 'discovery', parentId: 'research', name: 'Field studies', owner: 'Luca Myers', status: 'Ready' },
  { id: 'interviews', parentId: 'discovery', name: 'Customer interviews', owner: 'Maya Reed', status: 'Ready', hours: 24 },
];

export function mountTreeGrid(host) {
  const grid = new ColibriTreeGrid(host.querySelector('[data-tree]'), {
    label: 'Project plan', treeField: 'name', parentField: 'parentId',
    expanded: ['release', 'client', 'customer'],
    columns: [
      { field: 'name', label: 'Work item', width: 245, editable: true },
      { field: 'owner', label: 'Owner', width: 120, editable: true },
      { field: 'status', label: 'Status', width: 120 },
      { field: 'hours', label: 'Estimate (h)', type: 'number', width: 100 },
    ],
    rows,
  });
  grid.search.placeholder = 'Search the project plan';
  const actions = host.querySelector('[data-tree-actions]');
  grid.search.insertAdjacentElement('afterend', actions);
  host.querySelector('[data-tree-expand]').onclick = () => grid.expandAll();
  host.querySelector('[data-tree-collapse]').onclick = () => grid.collapseAll();
  return () => {
    host.prepend(actions);
    grid.destroy();
  };
}

import { baseColumns, projectRows } from '../cells.js';

export const controls = '<button type="button">Pause feed</button>';

export function createRapidUpdates(host, toolbar, status, onActivate) {
  const grid = new ColibriGrid(host, {
    columns: [0, 5, 1, 2, 6, 4].map((index) => baseColumns[index]),
    rows: projectRows('rapid-updates'),
    label: 'Viewport streaming',
    onActivate,
    rangeSelection: true,
  });
  const toggle = toolbar.querySelector('button');
  let running = true,
    updates = 0;
  toggle.onclick = () => {
    running = !running;
    toggle.textContent = running ? 'Pause feed' : 'Resume feed';
  };
  const timer = setInterval(() => {
    if (!running) return;
    const patches = grid.getVisibleRows().map((row) => ({
      id: row.id,
      amount: row.amount + (row.id % 2 === 0 ? 3 : -2),
    }));
    if (!patches.length) return;
    grid.applyUpdates(patches);
    updates += patches.length;
    status.textContent = updates.toLocaleString() + ' updates · ' + patches.length + ' visible rows';
  }, 350);
  return () => {
    clearInterval(timer);
    grid.destroy();
  };
}

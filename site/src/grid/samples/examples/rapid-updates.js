import { baseColumns } from '../cells.js';

export function configureRapidUpdates(c) {
  c.columns = [baseColumns[0], baseColumns[5], baseColumns[1], baseColumns[2], baseColumns[6], baseColumns[4]];
  let running = true,
    ticks = 0;
  const b = c.button('Pause feed', () => {
    running = !running;
    b.textContent = running ? 'Pause feed' : 'Resume feed';
  });
  const timer = setInterval(() => {
    if (!running || !c.surface.getClientRects().length) return;
    const visible = c.grid.getVisibleRows(),
      patch = visible.map((r) => ({ id: r.id, amount: r.amount + (r.id % 2 === 0 ? 3 : -2) }));
    if (patch.length) {
      c.grid.applyUpdates(patch);
      ticks += patch.length;
      c.notice(ticks.toLocaleString() + ' updates · ' + patch.length + ' visible rows');
    }
  }, 350);
  c.cleanup.push(() => clearInterval(timer));
}

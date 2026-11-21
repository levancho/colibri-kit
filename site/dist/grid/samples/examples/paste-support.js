import { baseColumns, projectRows } from '../cells.js';

export const controls = '<button type="button">Copy 2 × 2 sample</button>';

export function createPasteSupport(host, toolbar, status, onActivate) {
  const grid = new ColibriGrid(host, {
    columns: baseColumns,
    rows: projectRows('paste-support'),
    label: 'Copy and paste',
    onActivate,
    rangeSelection: true,
  });
  toolbar.querySelector('button').onclick = async () => {
    try {
      await navigator.clipboard.writeText('Atlas revision\tAda Bell\nBeacon revision\tLena Park');
      status.textContent = 'Copied two rows and two columns';
    } catch {
      status.textContent = 'Clipboard access was declined';
    }
  };
  return () => grid.destroy();
}

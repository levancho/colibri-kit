import { baseColumns, projectRows } from '../cells.js';

export const controls = '<label>Pinned columns <input type="range" min="0" max="3" value="1"></label>';

export function createFreezeColumns(host, toolbar, status, onActivate) {
  const grid = new ColibriGrid(host, {
    columns: baseColumns,
    rows: projectRows('freeze-columns'),
    label: 'Freeze columns',
    onActivate,
    rangeSelection: true,
  });
  const style = document.createElement('style');
  host.append(style);
  const slider = toolbar.querySelector('input');
  function pin() {
    let left = 0;
    style.textContent = grid.columns
      .slice(0, slider.valueAsNumber)
      .map((column, index) => {
        const rule =
          '#' +
          host.id +
          ' .cg-row > :nth-child(' +
          (index + 1) +
          '){position:sticky;left:' +
          left +
          'px;z-index:1;background:#edf6f1}';
        left += column.width;
        return rule;
      })
      .join('\n');
  }
  slider.oninput = pin;
  pin();
  return () => {
    style.remove();
    grid.destroy();
  };
}

import { colorColumns, colorRows } from '../color-editor.js';

export const controls = '<strong>Color collection</strong>';

export function createColorPalette(host, toolbar, status, onActivate) {
  const grid = new ColibriGrid(host, {
    label: 'Color palette', rows: colorRows(), columns: colorColumns(), rangeSelection: true, onActivate,
  });
  return () => grid.destroy();
}

import { examples } from './variations.js';

export function mountSample(stage, storyId) {
  const example = examples[storyId];
  if (!example) throw new RangeError('Unknown grid sample: ' + storyId);
  stage.innerHTML =
    '<div id="toolbar"></div><div id="surface"></div><footer><span id="dimensions"></span><output id="activity" aria-live="polite"></output></footer>';
  const toolbar = stage.querySelector('#toolbar');
  const host = stage.querySelector('#surface');
  const status = stage.querySelector('#activity');
  const dimensions = stage.querySelector('#dimensions');
  toolbar.innerHTML = example.controls || '<strong>Project register</strong>';
  const dispose = example.create(host, toolbar, status, (row, column) => {
    status.textContent = row.project + ' · ' + column.label;
  });
  const saved = ({ detail }) => {
    status.textContent = 'Saved ' + detail.field + ' · ' + String(detail.value ?? '');
  };
  host.addEventListener('colibri-change', saved);
  const counts = new MutationObserver(update);
  function update() {
    const grid = host.querySelector('[role=grid]');
    if (!grid) return;
    const rows = Number(grid.getAttribute('aria-rowcount')) - 1;
    dimensions.textContent =
      rows.toLocaleString() + ' rows  ·  ' + grid.getAttribute('aria-colcount') + ' columns';
  }
  function observeGrid() {
    counts.disconnect();
    const grid = host.querySelector('[role=grid]');
    if (grid) counts.observe(grid, { attributes: true, attributeFilter: ['aria-rowcount', 'aria-colcount'] });
    update();
  }
  const replacement = new MutationObserver(observeGrid);
  replacement.observe(host, { childList: true });
  observeGrid();
  return () => {
    replacement.disconnect();
    counts.disconnect();
    host.removeEventListener('colibri-change', saved);
    dispose();
  };
}

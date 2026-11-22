const app = (id, name, description, file, sources) => ({
  id, name, description, group: 'Full examples', file, sources,
});
export const applications = [
  app('full-grid', 'Full grid workbench', 'Explore the complete grid with row grouping, pivoting, column tools, charts and file import and export.', 'workbench.html', ['sample.js']),
  app('tree-grid', 'TreeGrid', 'Explore a project plan by branch. Click a column heading to sort siblings, or search for “Screen reader audit” to reveal its parent work items.', 'tree.html', ['tree-example.js']),
  app('trading-desk', 'Trading desk', 'Stream equity quotes and FX rates, select an instrument, and inspect its price history.', 'examples/trading/index.html', ['examples/trading/trading.js','examples/trading/feed.js','examples/trading/trading.css']),
  app('editable-directory', 'Editable directory', 'Edit records, select cell ranges, paste values and fill across rows or columns.', 'editing.html', ['editing-example.js']),
  app('inventory', 'Inventory and pivot tables', 'Work with 50,000 inventory records, group quantities, pivot by warehouse and drill into the underlying rows.', 'inventory.html', ['inventory.js']),
];

export function mountApplication(stage, example) {
  const lifecycle = new AbortController();
  const applicationsById = {
    'full-grid': () => import('../sample.js').then(m => m.mountWorkbench),
    'tree-grid': () => import('../tree-example.js').then(m => m.mountTreeGrid),
    'trading-desk': () => import('../examples/trading/trading.js').then(m => m.mountTrading),
    'editable-directory': () => import('../editing-example.js').then(m => host => {
      const grid = m.createExample(host.querySelector('#directory'));
      return () => grid.destroy();
    }),
    inventory: () => import('../inventory.js').then(m => m.mountInventory),
  };
  let unmount;
  async function open() {
    const [response, mount] = await Promise.all([
      fetch('../' + example.file, { signal: lifecycle.signal }),
      applicationsById[example.id](),
    ]);
    if (!response.ok) throw Error(response.statusText);
    const markup = await response.text();
    if (lifecycle.signal.aborted) return;
    const template = new DOMParser().parseFromString(markup, 'text/html').querySelector('main');
    const host = document.createElement('section');
    host.className = template.className;
    host.setAttribute('aria-label', example.name);
    host.dataset.application = example.id;
    host.append(...template.childNodes);
    stage.replaceChildren(host);
    unmount = mount(host);
  }
  stage.setAttribute('aria-busy', 'true');
  open().catch(() => {
    if (!lifecycle.signal.aborted) stage.textContent = 'Could not load ' + example.name + '.';
  }).finally(() => {
    if (!lifecycle.signal.aborted) stage.removeAttribute('aria-busy');
  });

  return () => {
    lifecycle.abort();
    unmount?.();
    stage.removeAttribute('aria-busy');
    stage.replaceChildren();
  };
}

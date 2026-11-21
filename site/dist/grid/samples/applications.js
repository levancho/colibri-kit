const app = (id, name, description, file, sources) => ({
  id, name, description, group: 'Full examples', file, sources: [file, ...sources],
});
export const applications = [
  app('full-grid', 'Full grid workbench', 'Explore the complete grid with row grouping, pivoting, column tools, charts and file import and export.', 'workbench.html', ['sample.js','workbench.js','files.js','charts.js','workbench.css']),
  app('trading-desk', 'Trading desk', 'Stream equity quotes and FX rates, select an instrument, and inspect its price history.', 'examples/trading/index.html', ['examples/trading/trading.js','examples/trading/feed.js','examples/trading/trading.css']),
  app('editable-directory', 'Editable directory', 'Edit records, select cell ranges, paste values and fill across rows or columns.', 'editing.html', ['editing-example.js']),
  app('inventory', 'Inventory and pivot tables', 'Work with 50,000 inventory records, group quantities, pivot by warehouse and drill into the underlying rows.', 'inventory.html', ['pivot.js']),
];

export function mountApplication(stage, example) {
  const panel = document.getElementById('application-source');
  const picker = document.getElementById('application-file');
  const code = document.getElementById('application-code');
  const frame = document.createElement('iframe');
  frame.className = 'application-frame';
  frame.title = example.name;
  const kitMenu = document.querySelector('.kbar-row2');
  frame.visibleViewport = () => {
    const bounds = frame.getBoundingClientRect();
    return {
      top: Math.max(0, (kitMenu?.getBoundingClientRect().bottom || 0) - bounds.top),
      bottom: Math.min(frame.clientHeight, innerHeight - bounds.top),
    };
  };
  frame.src = '../' + example.file + '?embed=1';
  stage.replaceChildren(frame);
  const syncTheme = () => {
    const doc = frame.contentDocument;
    if (!doc) return;
    const root = doc.documentElement;
    const kit = document.documentElement.dataset;
    if (kit.kitTheme) root.dataset.kitTheme = kit.kitTheme;
    else delete root.dataset.kitTheme;
    root.dataset.kitMode = kit.theme;
    const workbook = doc.querySelector('.wb');
    if (!workbook || workbook.dataset.skin === 'colibri') {
      root.dataset.theme = kit.theme;
      if (workbook) workbook.dataset.theme = kit.theme;
    }
  };
  frame.onload = syncTheme;
  const observer = new MutationObserver(syncTheme);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-kit-theme'] });

  picker.replaceChildren(...example.sources.map(path => new Option(path, path)));
  let request;
  async function showFile() {
    request?.abort();
    if (!panel.open) return;
    request = new AbortController();
    code.textContent = 'Loading source…';
    try {
      const result = await fetch('../' + picker.value, { signal: request.signal });
      if (!result.ok) throw Error(result.statusText);
      code.textContent = await result.text();
    } catch (err) {
      if (err.name !== 'AbortError') code.textContent = 'Could not load this source file.';
    }
  }
  picker.onchange = panel.ontoggle = showFile;
  showFile();
  return () => {
    request?.abort();
    observer.disconnect();
    picker.onchange = panel.ontoggle = frame.onload = null;
    stage.replaceChildren();
  };
}

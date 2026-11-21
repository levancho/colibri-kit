// Enhance a server-rendered table in place. Its readable rows remain available before JavaScript runs.
export function enhanceGrid(table) {
  const columns = [...table.tHead.rows[0].cells].map((th) => ({
    field: th.dataset.field,
    label: th.textContent.trim(),
    type: th.dataset.type || 'text',
    width: Number(th.dataset.width) || 150,
    editable: th.dataset.editable === 'true',
  }));
  const rows = [...table.tBodies[0].rows].map((tr) =>
    Object.fromEntries([
      ['id', tr.dataset.key],
      ...columns.map((col, i) => {
        const raw = tr.cells[i].textContent;
        return [
          col.field,
          col.type === 'boolean' ? raw === 'true' : col.type === 'number' && raw !== '' ? Number(raw) : raw,
        ];
      }),
    ]),
  );
  const host = document.createElement('div');
  const grid = new ColibriGrid(host, { columns, rows, label: table.caption?.textContent || 'Project register' });
  table.replaceWith(host);
  return grid;
}

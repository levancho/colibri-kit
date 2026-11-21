import { extendedColumn } from '../cells.js';

export function configureAddColumns(c) {
  let size = 10,
    generated = 10;
  const limit = 200;
  const setSize = (n) => {
    size = Math.max(2, Math.min(limit, n));
    c.columns = Array.from({ length: size }, (_, i) => extendedColumn(i));
    if (size > generated)
      for (const r of c.rows)
        for (let i = generated; i < size; i++) {
          const key = 'metric' + (i + 1);
          if (!(key in r)) r[key] = (r.id * (i + 5)) % 1000;
        }
    generated = Math.max(generated, size);
    c.mount();
    bar.value = size;
    out.value = size;
    less.disabled = size === 2;
    more.disabled = size === limit;
  };
  const bar = c.input('Columns', 'range', size, setSize, { min: 2, max: limit }),
    out = document.createElement('output');
  out.value = size;
  c.toolbar.append(out);
  const less = c.button('− Remove', () => setSize(size - 1)),
    more = c.button('+ Add column', () => {
      setSize(size + 1);
      c.grid.activate(c.grid.index, size - 1);
    });
}

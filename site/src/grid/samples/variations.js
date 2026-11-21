import { baseColumns } from './cells.js';
function sheet(c) {
  const style = document.createElement('style');
  c.surface.append(style);
  return (rules) => {
    style.textContent = rules;
  };
}
export function configureSample(c) {
  const { id, input, button, notice } = c;
  if (id === 'freeze-columns') {
    const css = sheet(c);
    const apply = (n) => {
      let left = 0;
      css(
        Array.from({ length: n }, (_, i) => {
          const out =
            '#surface .cg-row > :nth-child(' +
            (i + 1) +
            '){position:sticky;left:' +
            left +
            'px;z-index:1;background:#edf6f1}';
          left += c.columns[i].width;
          return out;
        }).join('\n'),
      );
    };
    input('Pinned columns', 'range', 1, apply, { min: 0, max: 3 });
    apply(1);
  }
  if (id === 'validate-data')
    c.columns = [
      baseColumns[0],
      {
        ...baseColumns[5],
        validator: (v) => (Number.isInteger(v) && v >= 0) || 'Enter a whole number of zero or more.',
      },
      ...baseColumns.slice(1, 4),
    ];
  if (id === 'paste-support')
    button('Copy 2 × 2 sample', async () => {
      try {
        await navigator.clipboard.writeText('Atlas revision\tAda Bell\nBeacon revision\tLena Park');
        notice('Copied two rows and two columns');
      } catch {
        notice('Clipboard access was declined');
      }
    });
  if (id === 'fill-handle') {
    button('Select A1:B3', () => {
      c.grid.activate(0, 0);
      c.grid.activate(2, 1, true);
      c.grid.port.focus();
    });
  }

  if (id === 'search-as-filter') {
    const term = input('Search records', 'search', '', () => {}, { placeholder: 'Project, owner or team' });
    c.listen(term, 'input', () => c.filter(term.value));
  }
  if (id === 'rapid-updates') {
    c.columns = [baseColumns[0], baseColumns[5], baseColumns[1], baseColumns[2], baseColumns[6], baseColumns[4]];
    let running = true,
      ticks = 0;
    const b = button('Pause feed', () => {
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
        notice(ticks.toLocaleString() + ' updates · ' + patch.length + ' visible rows');
      }
    }, 350);
    c.cleanup.push(() => clearInterval(timer));
  }
}

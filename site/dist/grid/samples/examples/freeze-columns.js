export function configureFreezeColumns(c) {
  const style = document.createElement('style');
  c.surface.append(style);
  const apply = (n) => {
    let left = 0;
    style.textContent = Array.from({ length: n }, (_, i) => {
      const out =
        '#surface .cg-row > :nth-child(' +
        (i + 1) +
        '){position:sticky;left:' +
        left +
        'px;z-index:1;background:#edf6f1}';
      left += c.columns[i].width;
      return out;
    }).join('\n');
  };
  c.input('Pinned columns', 'range', 1, apply, { min: 0, max: 3 });
  apply(1);
}

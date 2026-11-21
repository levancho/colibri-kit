// Apply the Kit preference before the grid and navigation paint.
(() => {
  const root = document.documentElement;
  let mode, pack;
  try {
    mode = localStorage.getItem('colibri.kit.theme');
    pack = new URLSearchParams(location.search).get('theme') ?? localStorage.getItem('colibri.kit.pack');
  } catch {}
  root.dataset.theme = mode || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  if (pack) root.dataset.kitTheme = pack;
})();

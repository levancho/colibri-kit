const implementations = {
  HTML: ['project-table.html', 'project-table.html', 'enhance.js'],
  FreeMarker: [
    'rendered-freemarker.html',
    'grid.ftl',
    'freemarker-usage.ftl',
    'rendered-freemarker.html',
    'enhance.js',
  ],
  Thymeleaf: [
    'rendered-thymeleaf.html',
    'grid.th.html',
    'thymeleaf-usage.html',
    'rendered-thymeleaf.html',
    'enhance.js',
  ],
  React: ['react.html', 'projects.jsx', 'react-grid.js', 'clipboard.js'],
};
const item = (id) => document.getElementById(id),
  implementation = item('implementation'),
  file = item('file'),
  source = item('code'),
  copy = item('copy-source');
let version = 0;
async function showFile() {
  const selection = ++version;
  copy.textContent = 'Copy source';
  source.textContent = 'Loading…';
  try {
    const res = await fetch(file.value);
    if (!res.ok) throw Error(res.status);
    const text = await res.text();
    if (selection === version) source.textContent = text;
  } catch (e) {
    if (selection === version) source.textContent = 'Could not load ' + file.value;
  }
}
function refresh() {
  const [url, ...files] = implementations[implementation.value];
  file.replaceChildren(...files.map((f) => new Option(f, f)));
  const frame = document.createElement('iframe');
  frame.title = implementation.value + ' implementation';
  frame.src = url;
  item('preview').replaceChildren(frame);
  showFile();
}
implementation.onchange = refresh;
file.onchange = showFile;
copy.onclick = async () => {
  try {
    await navigator.clipboard.writeText(source.textContent);
    copy.textContent = 'Copied';
  } catch {
    copy.textContent = 'Select the code to copy';
  }
};
if (location.hash === '#react-source') item('source').open = true;
if (location.hash.startsWith('#react')) implementation.value = 'React';
refresh();

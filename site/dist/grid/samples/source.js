import { createTabs, createClipboard } from './kit-source.js';
import { examples } from './variations.js';
import { highlight } from './highlight.bundle.js';

function documentSource(language, story, example) {
  const hosts = {
    html: '<section id="stage" aria-label="Grid sample"></section>',
    ftl:
      '[#import "/colibri/freemarker/grid-sample.ftl" as grid]\n[@grid.sample id="stage" story="' + story + '" /]',
    thymeleaf:
      "<section th:replace=\"~{colibri/thymeleaf/grid-sample :: grid_sample('stage', '" +
      story +
      '\')}"></section>',
  };
  const definition = examples[story];
  const imports = example
    .slice(0, example.indexOf('export const controls'))
    .trim()
    .replaceAll("from '../", "from '/grid/samples/");
  const setup = example.slice(example.indexOf('export function ')).replace('export function ', 'function ');
  const directive = language === 'ftl' ? '[#ftl output_format="HTML" auto_esc=true]\n' : '';
  const controls = definition.controls ? '<div id="controls">' + definition.controls + '</div>\n' : '';
  return (
    directive +
    `<!doctype html>
${cssFiles.map(path => '<link rel="stylesheet" href="' + path + '">').join('\n')}
<link rel="stylesheet" href="/grid/grid.css">
<link rel="stylesheet" href="/grid/samples/cells.css">
${themeScript ? '<script src="' + themeScript + '"></script>\n' : ''}<body class="ui-root">
${controls}${hosts[language]}
<output id="activity" aria-live="polite"></output>
<script src="/grid/grid.js"></script>
<script type="module">
${imports}

${setup.trimEnd()}

${definition.create.name}(
  document.getElementById("stage"),
  document.getElementById("controls"),
  document.getElementById("activity"),
);
</script>
</body>`
  );
}

const gridBase = new URL('../', import.meta.url);
const themeScript = document.querySelector('script[src$="/kit-theme.js"]') ? '/grid/kit-theme.js' : null;
const cssFiles = [...document.querySelectorAll('link[rel=stylesheet]')]
  .map(link => new URL(link.href).pathname)
  .filter(path => /\/ui\/themes\/|\/css\/colibri\.css$|kit-grid-theme\.css$|\/colibri-ui\.css$/.test(path));
const languages = { html: 'HTML', react: 'React', ftl: 'FreeMarker', thymeleaf: 'Thymeleaf' };
async function read(url, signal) {
  const result = await fetch(url, { signal });
  if (!result.ok) throw Error(result.statusText);
  return result.text();
}
// List the files that implement the demonstrated feature. Runtime dependencies
// stay in the runnable example's imports without becoming source-browser tabs.
const editorFiles = ['cells.js', 'choice-editor.js', 'selection-summary.js', 'cells.css'];
const storyFiles = {
  'color-palette': ['color-editor.js', 'selection-summary.js', 'cells.css'],
  'custom-cells': editorFiles,
  'custom-cell-editing': editorFiles,
  'project-editors': ['project-editors.js', ...editorFiles],
};

function implementationFiles(example, mode) {
  const react = mode === 'react';
  const jsx = 'samples/react/' + example.id + '.jsx';
  if (example.file) return react ? [jsx, ...example.reactSources] : [example.file, ...example.sources];
  const suffix = { html: '.html', ftl: '.ftl', thymeleaf: '.th.html' };
  const files = [react ? jsx : example.id + suffix[mode]];
  for (const file of storyFiles[example.id] || ['cells.js']) files.push('samples/' + file);
  if (react) files.push('samples/react/columns.jsx');
  return files;
}

function grammar(path) {
  if (/\.css$/.test(path)) return 'css';
  if (/\.jsx$/.test(path)) return 'jsx';
  if (/\.js$/.test(path)) return 'javascript';
  return /\.ftl$/.test(path) ? 'colibriFtl' : 'markup';
}
function button(text) {
  const node = document.createElement('button');
  node.type = 'button';
  node.textContent = text;
  return node;
}

export function showSource(example, preview) {
  const root = document.querySelector('.sink-code-tabs');
  const details = document.getElementById('source');
  const list = root.querySelector('[data-ui-part=list]');
  const modes = example.file ? ['html', 'react'] : Object.keys(languages);
  const requested = new URLSearchParams(location.search).get('source');
  const initial = !location.hash.startsWith('react-') && requested && !root.dataset.visited && modes.includes(requested)
    ? requested : preview;
  root.dataset.visited = 'true';
  const panels = new Map();
  const copies = [];
  let activeRequest;
  function cancel() { activeRequest?.abort(); }
  for (const mode of modes) {
    const trigger = button(languages[mode]);
    trigger.dataset.uiPart = 'trigger';
    trigger.dataset.value = mode;
    list.append(trigger);
    const panel = document.createElement('div');
    panel.dataset.uiPart = 'panel';
    panel.dataset.value = mode;
    panel.innerHTML = '<nav class="source-files" aria-label="Source files"></nav><div class="source-actions"><span class="source-path"></span></div><pre class="source-pre" tabindex="0"><code></code></pre>';
    const code = panel.querySelector('code');
    code.id = 'code-' + mode;
    const copy = button('Copy');
    copy.dataset.target = '#' + code.id;
    copy.setAttribute('aria-label', 'Copy ' + languages[mode] + ' code');
    panel.querySelector('.source-actions').append(copy);
    copies.push(createClipboard(copy));
    root.append(panel);
    panels.set(mode, { panel, code, copy });
  }
  const controller = createTabs(root, { value: initial, onChange: render });

  async function render(mode = controller.value) {
    cancel();
    if (!details.open) return;
    activeRequest = new AbortController();
    const signal = activeRequest.signal;
    const state = panels.get(mode);
    const { panel, code, copy } = state;
    const nav = panel.querySelector('nav');
    const pending = () => { code.textContent = 'Loading source…'; copy.disabled = true; };
    pending();
    try {
      const paths = implementationFiles(example, mode);
      const generated = !example.file && mode !== 'react';
      const entry = paths[0];
      const links = new Map();
      nav.replaceChildren();
      for (const path of paths) {
        const link = generated && path === entry ? button(path) : document.createElement('a');
        if (link.tagName === 'A') link.href = new URL(path, gridBase).href;
        const name = path.split('/').pop();
        link.textContent = paths.some(p => p !== path && p.split('/').pop() === name) ? path : name;
        link.title = path;
        link.onclick = event => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          select(path);
        };
        links.set(path, link);
        nav.append(link);
      }
      async function select(path) {
        activeRequest.abort();
        activeRequest = new AbortController();
        const signal = activeRequest.signal;
        state.path = path;
        pending();
        for (const [name, link] of links) {
          if (path === name) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        }
        panel.querySelector('.source-path').textContent = path;
        const synthetic = generated && path === entry;
        try {
          const url = new URL(synthetic ? 'samples/examples/' + example.id + '.js' : path, gridBase);
          const raw = await read(url, signal);
          if (signal.aborted) return;
          const source = synthetic ? documentSource(mode, example.id, raw) : raw;
          code.innerHTML = highlight(source, grammar(path));
          for (const token of code.querySelectorAll('.token.string, .token.attr-value')) {
            const ref = token.textContent.trim().replace(/^=?\s*["']|["']$/g, '');
            if (!/^(?:\.\.?\/|\/)/.test(ref) && !/^[\w-]+\.(js|css|jsx)$/.test(ref)) continue;
            const resolved = new URL(ref, synthetic ? gridBase : url);
            const target = paths.find(p => new URL(p, gridBase).href === resolved.href);
            if (!target || target === path) continue;
            const a = document.createElement('a');
            a.href = resolved.href;
            a.title = 'View ' + target;
            a.append(...token.childNodes);
            a.onclick = links.get(target).onclick;
            token.append(a);
          }
          copy.dataset.text = source;
          copy.disabled = false;
          panel.querySelector('pre').scrollTo(0, 0);
        } catch (error) {
          if (!signal.aborted) code.textContent = 'Could not load ' + path + '.';
        }
      }
      await select(state.path || entry);
    } catch (error) {
      if (!signal.aborted) code.textContent = 'Could not load source files.';
    }
  }
  const toggle = () => render();
  details.addEventListener('toggle', toggle);
  render();
  return () => {
    cancel();
    details.removeEventListener('toggle', toggle);
    controller.destroy();
    for (const copy of copies) copy.destroy();
    list.replaceChildren();
    for (const { panel } of panels.values()) panel.remove();
  };
}

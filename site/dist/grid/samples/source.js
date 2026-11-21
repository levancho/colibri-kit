import { createTabs, createClipboard, highlightAll } from './kit-source.js';
import { examples } from './variations.js';

const tabs = document.querySelector('.sink-code-tabs');
const requested = new URLSearchParams(location.search).get('source');
const controller = createTabs(tabs);
if (requested) controller.select(requested);
for (const button of tabs.querySelectorAll('.sink-copy')) createClipboard(button);

function documentSource(language, story, example) {
  const theme = document.querySelector('link[rel=stylesheet]').getAttribute('href');
  const themePath = new URL(theme, location.href).pathname;
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
    .replaceAll("'../cells.js'", "'/grid/samples/cells.js'");
  const setup = example.slice(example.indexOf('export function ')).replace('export function ', 'function ');
  const directive = language === 'ftl' ? '[#ftl output_format="HTML" auto_esc=true]\n' : '';
  const controls = definition.controls ? '<div id="controls">' + definition.controls + '</div>\n' : '';
  return (
    directive +
    `<!doctype html>
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
<link rel="stylesheet" href="${themePath}">
<link rel="stylesheet" href="/grid/grid.css">
<link rel="stylesheet" href="/grid/samples/cells.css">`
  );
}

const implementation = document.querySelector('#implementation');
const file = document.querySelector('#implementation-file');
const rawCode = document.querySelector('#implementation-code');
let loadedFile;
async function showFile() {
  if (!implementation.open || loadedFile === file.value) return;
  const selected = file.value;
  loadedFile = selected;
  document.querySelector('#open-file').href = selected;
  rawCode.textContent = 'Loading source…';
  try {
    const response = await fetch(selected);
    if (!response.ok) throw Error(response.statusText);
    const source = await response.text();
    if (file.value === selected) rawCode.textContent = source;
  } catch {
    if (file.value === selected) {
      loadedFile = undefined;
      rawCode.textContent = 'Could not load this file.';
    }
  }
}
implementation.addEventListener('toggle', showFile);
file.addEventListener('change', showFile);

function write(panel, value) {
  const code = panel.querySelector('code');
  code.textContent = value;
  delete code.dataset.hl;
  highlightAll(panel);
  // Preserve the exact runnable source when the highlighter formats long lines.
  panel.querySelector('.sink-copy').dataset.text = value;
}

let revision = 0;
export async function showSource(id, language) {
  if (language) controller.select(language);
  document.getElementById('run-react').hidden = language === 'react';
  const version = ++revision;
  const react = tabs.querySelector('[data-ui-part=panel][data-value=react]');
  const panels = [...tabs.querySelectorAll('[data-ui-part=panel]')];
  for (const panel of panels) {
    panel.querySelector('.sink-copy').disabled = true;
    panel.querySelector('code').textContent = 'Loading source…';
  }
  async function load(path) {
    const response = await fetch(path);
    if (!response.ok) throw Error(response.statusText);
    return response.text();
  }
  const markup = panels.filter((panel) => panel !== react);
  const showDocuments = load('./examples/' + id + '.js')
    .then((example) => {
      if (version !== revision) return;
      for (const panel of markup) {
        write(panel, documentSource(panel.dataset.value, id, example));
        panel.querySelector('.sink-copy').disabled = false;
      }
    })
    .catch(() => {
      if (version === revision)
        for (const panel of markup)
          panel.querySelector('code').textContent = 'The sample source could not be loaded.';
    });
  const copy = react.querySelector('.sink-copy');
  copy.disabled = true;
  react.querySelector('code').textContent = 'Loading source…';
  document.querySelector('#run-react').href = '#react-' + id;
  try {
    const source = await load('./react/' + id + '.jsx');
    if (version === revision) {
      write(react, source);
      copy.disabled = false;
    }
  } catch {
    if (version === revision) react.querySelector('code').textContent = 'The React source could not be loaded.';
  }
  await showDocuments;
}

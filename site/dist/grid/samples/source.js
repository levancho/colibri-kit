import { createTabs, createClipboard, highlightAll } from './kit-source.js';

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
  const logic = example
    .replaceAll("'../cells.js'", "'/grid/samples/cells.js'")
    .replace('export function ', 'function ');
  const name = /export function (\w+)/.exec(example)[1];
  const directive = language === 'ftl' ? '[#ftl output_format="HTML" auto_esc=true]\n' : '';
  const argument = language === 'html' ? JSON.stringify(story) : 'host.dataset.gridStory';
  return (
    directive +
    `<!doctype html>
<meta name="viewport" content="width=device-width,initial-scale=1">
${hosts[language]}
<link rel="stylesheet" href="${themePath}">
<link rel="stylesheet" href="/grid/grid.css">
<link rel="stylesheet" href="/grid/samples/gallery.css">
<script src="/grid/grid.js"></script>
<script type="module">
import { mountSample } from "/grid/samples/sample.js";

${logic.trimEnd()}

const host = document.getElementById("stage");
mountSample(host, ${argument}, ${name});
</script>`
  );
}

function write(panel, value) {
  const code = panel.querySelector('code');
  code.textContent = value;
  delete code.dataset.hl;
  highlightAll(panel);
  // Preserve the exact runnable source when the highlighter formats long lines.
  panel.querySelector('.sink-copy').dataset.text = value;
}

let revision = 0;
export async function showSource(id) {
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
  document.querySelector('#run-react').href = '../integrations/react.html#' + id;
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

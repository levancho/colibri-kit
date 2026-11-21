import { stories } from './catalog.js';
import { mountSample } from './sample.js';
import { showSource } from './source.js';
import { applications, mountApplication } from './applications.js';
const reactExamples = stories.map(story => ({
  ...story, id: 'react-' + story.id, react: story.id, group: 'React examples',
}));
const entries = [...applications, ...stories, ...reactExamples];
const $ = (id) => document.getElementById(id),
  nav = $('samples');
let dispose = () => {},
  current;
function navigation() {
  const query = $('find').value.trim().toLowerCase();
  nav.replaceChildren();
  for (const group of new Set(entries.map((s) => s.group))) {
    const matches = entries.filter((s) => s.group === group && s.name.toLowerCase().includes(query));
    if (!matches.length) continue;
    const section = document.createElement('details'),
      head = document.createElement('summary');
    section.open = group !== 'React examples' || current.group === group || Boolean(query);
    head.textContent = group;
    section.append(head);
    for (const story of matches) {
      const a = document.createElement('a');
      a.href = '#' + story.id;
      a.dataset.kind = story.file ? 'application' : story.react ? 'react' : 'sample';
      a.textContent = story.name;
      if (story === current) a.setAttribute('aria-current', 'page');
      section.append(a);
    }
    nav.append(section);
  }
  if (!nav.children.length) {
    const p = document.createElement('p');
    p.className = 'sample-empty';
    p.textContent = 'No samples match this search.';
    nav.append(p);
  }
}
function load() {
  dispose();
  current = entries.find((s) => s.id === location.hash.slice(1)) || (new URLSearchParams(location.search).has('source') ? stories[0] : applications[0]);
  navigation();
  document.title = current.name + ' · Colibri Grid samples';
  document.querySelector('h1').textContent = current.name;
  $('crumb').textContent = 'Colibri Grid  /  ' + current.group;
  $('description').textContent = current.description;
  const stage = $('stage');
  stage.replaceChildren();
  $('application-source').hidden = !current.file;
  $('source').hidden = Boolean(current.file);
  if (current.file) {
    dispose = mountApplication(stage, current);
  } else if (current.react) {
    const selected = current;
    let canceled = false, unmount;
    dispose = () => { canceled = true; unmount?.(); };
    import('../integrations/projects.bundle.js').then(({ mountReactSample }) => {
      if (!canceled) unmount = mountReactSample(stage, selected.react);
    }).catch(() => { if (!canceled) stage.textContent = 'Could not load this React example.'; });
    showSource(current.react, 'react');
  } else {
    dispose = mountSample(stage, current.id);
    showSource(current.id);
  }
}
$('total').textContent = entries.length;
$('find').oninput = navigation;
window.addEventListener('hashchange', load);
load();

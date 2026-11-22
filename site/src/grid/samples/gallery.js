import { stories } from './catalog.js';
import { mountSample } from './sample.js';
import { showSource } from './source.js';
import { applications, mountApplication } from './applications.js';
const entries = [...applications, ...stories];
const $ = (id) => document.getElementById(id),
  nav = $('samples');
let dispose = () => {},
  current, react;
function navigation() {
  const query = $('find').value.trim().toLowerCase();
  nav.replaceChildren();
  for (const group of new Set(entries.map((s) => s.group))) {
    const matches = entries.filter((s) => s.group === group && s.name.toLowerCase().includes(query));
    if (!matches.length) continue;
    const section = document.createElement('details'),
      head = document.createElement('summary');
    section.open = true;
    head.textContent = group;
    section.append(head);
    for (const story of matches) {
      const a = document.createElement('a');
      a.href = '#' + (react ? 'react-' : '') + story.id;
      a.dataset.kind = story.file ? 'application' : 'sample';
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
  const hash = location.hash.slice(1);
  react = hash.startsWith('react-');
  current = entries.find((s) => s.id === (react ? hash.slice(6) : hash)) || (new URLSearchParams(location.search).has('source') ? stories[0] : applications[0]);
  for (const mode of ['html', 'react']) {
    const link = $('preview-' + mode);
    const selected = (mode === 'react') === react;
    link.href = '#' + (mode === 'react' ? 'react-' : '') + current.id;
    link.setAttribute('aria-selected', selected);
    link.tabIndex = selected ? 0 : -1;
    if (selected) $('stage').setAttribute('aria-labelledby', link.id);
  }
  navigation();
  document.title = current.name + ' · Colibri Grid samples';
  document.querySelector('h1').textContent = current.name;
  $('crumb').textContent = 'Colibri Grid  /  ' + current.group;
  $('description').textContent = current.description;
  const stage = $('stage');
  stage.replaceChildren();
  const hideSource = showSource(current, react ? 'react' : 'html');
  let unmount, canceled = false;
  dispose = () => { canceled = true; hideSource(); unmount?.(); };
  if (react) {
    const selected = current;
    const loader = selected.file
      ? import('../integrations/applications.bundle.js').then(m => m.mountReactApplication)
      : import('../integrations/projects.bundle.js').then(m => m.mountReactSample);
    loader.then(mount => {
      if (!canceled) unmount = mount(stage, selected.id);
    }).catch(() => { if (!canceled) stage.textContent = 'Could not load this React example.'; });
  } else {
    unmount = current.file ? mountApplication(stage, current) : mountSample(stage, current.id);
  }
}
document.querySelector('.preview-tabs').onkeydown = event => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', ' '].includes(event.key)) return;
  event.preventDefault();
  let link = event.target;
  if (event.key === 'Home') link = $('preview-html');
  else if (event.key === 'End') link = $('preview-react');
  else if (event.key !== ' ') link = $(react ? 'preview-html' : 'preview-react');
  link.focus();
  link.click();
};
$('total').textContent = entries.length;
$('find').oninput = navigation;
window.addEventListener('hashchange', load);
load();

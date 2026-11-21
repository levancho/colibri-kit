import { stories } from './catalog.js';
import { mountSample } from './sample.js';
import { showSource } from './source.js';
const $ = (id) => document.getElementById(id),
  nav = $('samples');
let dispose = () => {},
  current;
function navigation() {
  const query = $('find').value.trim().toLowerCase();
  nav.replaceChildren();
  for (const group of new Set(stories.map((s) => s.group))) {
    const matches = stories.filter((s) => s.group === group && s.name.toLowerCase().includes(query));
    if (!matches.length) continue;
    const section = document.createElement('details'),
      head = document.createElement('summary');
    section.open = true;
    head.textContent = group;
    section.append(head);
    for (const story of matches) {
      const a = document.createElement('a');
      a.href = '#' + story.id;
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
  current = stories.find((s) => s.id === location.hash.slice(1)) || stories[0];
  navigation();
  document.title = current.name + ' · Colibri Grid samples';
  document.querySelector('h1').textContent = current.name;
  $('crumb').textContent = 'Colibri Grid  /  ' + current.group;
  $('description').textContent = current.description;
  dispose = mountSample($('stage'), current.id);
  showSource(current.id);
}
$('total').textContent = stories.length;
$('find').oninput = navigation;
window.addEventListener('hashchange', load);
load();

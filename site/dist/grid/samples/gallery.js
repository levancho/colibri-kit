import {checks} from './checks.js';
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
function reference(mode) {
  $('engines').classList.toggle('split', mode === 'compare');
  $('stage').hidden = mode === 'reference';
  $('external').hidden = mode === 'local';
  for (const name of ['local', 'reference', 'compare'])
    $(name).setAttribute('aria-pressed', String(mode === name));
  $('external').replaceChildren();
  if (mode !== 'local') {
    const frame = document.createElement('iframe');
    frame.className = 'external-frame';
    frame.title = current.name + ' in Glide Storybook';
    const url = new URL(current.reference);
    frame.src =
      mode === 'compare'
        ? url.origin +
          '/glide-data-grid/iframe.html?viewMode=story&id=' +
          url.searchParams.get('path').split('/').pop()
        : current.reference;
    $('external').append(frame);
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
  $('upstream').href = current.reference;
  reference('local');
  dispose = mountSample($('stage'), current.id);
  showSource(current.id);
  const list=$('checked'); list.replaceChildren();
  for(const [engine,result] of Object.entries(checks[current.id])){
    const title=document.createElement('dt'),description=document.createElement('dd');title.textContent=engine;description.textContent=result;list.append(title,description);
  }
}
$('total').textContent = stories.length;
$('find').oninput = navigation;
$('local').onclick = () => reference('local');
$('reference').onclick = () => reference('reference');
$('compare').onclick = () => reference('compare');
window.addEventListener('hashchange', load);
load();

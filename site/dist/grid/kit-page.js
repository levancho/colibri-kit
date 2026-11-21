import '/kitchen-sink/examples/kit-bar.js';

const content = document.getElementById('grid-content');
document.querySelector('.grid-skip').addEventListener('click', event => {
  event.preventDefault();
  content.focus();
  content.scrollIntoView({ block: 'start' });
});

const root = document.documentElement;
const toggle = document.getElementById('theme');
function labelTheme() {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  toggle.setAttribute('aria-label', 'Switch to ' + next + ' mode');
}
toggle.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('colibri.kit.theme', root.dataset.theme); } catch {}
  labelTheme();
});
labelTheme();

const subnav = document.querySelector('.kbar-sub');
function linkCurrentSample() {
  const page = subnav.querySelector('[aria-current=page]').dataset.section;
  if (page === 'trading') return;
  subnav.querySelector('[data-section=react]').hash = location.hash;
  const gallery = subnav.querySelector('[data-section=samples]');
  gallery.hash = location.hash;
  if (page === 'react') gallery.search = '?source=react';
}
linkCurrentSample();
window.addEventListener('hashchange', linkCurrentSample);

// Bring the active section into the visible part of the Kit's mobile navigation.
const nav = document.querySelector('.kbar-nav');
const active = nav.querySelector('[aria-current=page]');
if (active.offsetLeft + active.offsetWidth > nav.scrollLeft + nav.clientWidth) {
  nav.scrollLeft += active.getBoundingClientRect().right - nav.getBoundingClientRect().right;
}

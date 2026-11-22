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

const pack = document.getElementById('kit-theme');
pack.value = root.dataset.kitTheme || '';
pack.addEventListener('change', () => {
  if (pack.value) root.dataset.kitTheme = pack.value;
  else delete root.dataset.kitTheme;
  try { localStorage.setItem('colibri.kit.pack', pack.value); } catch {}
});

const subnav = document.querySelector('.kbar-sub');
const samplesLink = subnav.querySelector('[data-section=samples]');
const tradingLink = subnav.querySelector('[data-section=trading]');
function linkCurrentSample() {
  const hash = location.hash.slice(1);
  const react = hash.startsWith('react-');
  const prefix = react ? 'react-' : '';
  samplesLink.href = '/grid/samples/#' + prefix + 'full-grid';
  tradingLink.href = '/grid/samples/#' + prefix + 'trading-desk';
  const active = hash === prefix + 'trading-desk' ? tradingLink : samplesLink;
  for (const link of subnav.querySelectorAll('a')) {
    if (link === active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}
linkCurrentSample();
window.addEventListener('hashchange', linkCurrentSample);

// Bring the active section into the visible part of the Kit's mobile navigation.
const nav = document.querySelector('.kbar-nav');
const active = nav.querySelector('[aria-current=page]');
if (active.offsetLeft + active.offsetWidth > nav.scrollLeft + nav.clientWidth) {
  nav.scrollLeft += active.getBoundingClientRect().right - nav.getBoundingClientRect().right;
}

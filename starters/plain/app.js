import './__COLIBRI__/core/auto.js';

const form = document.querySelector('#settings');
const status = document.querySelector('#status');
const key = 'colibri-starter-project';
try { form.elements.name.value = localStorage.getItem(key) || 'My project'; }
catch { status.textContent = 'Browser storage is unavailable. Changes cannot be saved locally.'; }
form.addEventListener('submit', event => {
  event.preventDefault();
  const name = form.elements.name.value.trim();
  if (!name) { status.textContent = 'Enter a project name.'; form.elements.name.focus(); return; }
  try { localStorage.setItem(key, name); status.textContent = `Saved ${name}.`; }
  catch { status.textContent = 'Could not save. Browser storage is unavailable.'; }
});
document.querySelector('#theme').addEventListener('click', event => {
  const dark = document.documentElement.dataset.theme !== 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  event.currentTarget.setAttribute('aria-pressed', String(dark));
});

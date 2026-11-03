// Preferences belong to an application, not to the entire demo collection.
(() => {
  const app = location.pathname.split('/').pop().split(/[.-]/)[0];
  const defaults = {analytics:['glacier',185],crm:['ember',35],workspace:['glacier',285],account:['glacier',245],commerce:['ember',145],support:['glacier',345]};
  const scope = defaults[app] ? app : 'gallery';
  const read = key => {try{return localStorage.getItem(`colibri-demo:${scope}:${key}`)}catch{return null}};
  const root = document.documentElement;
  const pack = new URLSearchParams(location.search).get('theme') ?? read('pack') ?? (defaults[app]?.[0] || '');
  if(pack) root.dataset.kitTheme = pack; else delete root.dataset.kitTheme;
  const hue = read('hue') ?? String(defaults[app]?.[1] ?? '');
  if(hue !== '') root.style.setProperty('--c-hue',hue);
  const scheme = read('scheme'); if(scheme) root.dataset.theme = scheme;
  window.ColibriDemoTheme = {scope, pack, hue};
})();

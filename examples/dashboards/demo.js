// Demo application state is deliberately local. No backend or account is implied.
const KEY = 'colibri-dashboard-v1';
const stages = ['Lead', 'Qualified', 'Proposal', 'Won'];
const money = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const seeds = [
  ['Tbilisi Bank', 12000, 'Nino K.', 'Lead'], ['Despani', 4500, 'Levan D.', 'Lead'],
  ['Kutaisi Labs', 2000, 'Ana M.', 'Lead'], ['Batumi Ports', 28000, 'Giorgi B.', 'Qualified'],
  ['Rustavi Steel', 9000, 'Dato T.', 'Qualified'], ['GeoCell', 40000, 'Salome L.', 'Proposal'],
  ['Mtskheta Wines', 6000, 'Nino K.', 'Proposal'], ['Svaneti Tours', 15000, 'Levan D.', 'Won'],
].map(([name, value, owner, stage], id) => ({ id: String(id), name, value, owner, stage }));
const fresh = () => ({ deals: structuredClone(seeds), reports: [], read: [], activity: [] });
const validDeal = d => d && typeof d.id === 'string' && typeof d.name === 'string' && d.name.trim().length > 0 && d.name.length <= 100 && typeof d.owner === 'string' && d.owner.trim().length > 0 && d.owner.length <= 100 && Number.isFinite(d.value) && d.value >= 0 && d.value <= 1e9 && stages.includes(d.stage);
function node(tag, text, attrs = {}) {
  const el = document.createElement(tag); if (text !== undefined) el.textContent = text;
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
}
function button(text, action) { const b = node('button', text, { type: 'button', class: 'btn', 'data-size': 's' }); b.addEventListener('click', action); return b; }
function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = node('a', '', { href: url, download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function initDashboard() {
  if (!document.querySelector('.dash')) return;
  let state = fresh(), storageWarning = '';
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && Array.isArray(saved.deals) && saved.deals.every(validDeal) && new Set(saved.deals.map(d => d.id)).size === saved.deals.length && Array.isArray(saved.reports) && saved.reports.every(r => typeof r.name === 'string' && typeof r.csv === 'string') && Array.isArray(saved.read) && saved.read.every(i => Number.isInteger(i) && i >= 0 && i < 3) && Array.isArray(saved.activity) && saved.activity.every(a => typeof a === 'string')) state = saved;
  } catch { storageWarning = 'Browser storage is unavailable. Changes last until you leave this page.'; }
  const status = document.getElementById('demo-status');
  const say = text => { status.textContent = text; };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { storageWarning = 'Changes could not be saved; keep this page open or export a backup.'; } if (storageWarning) say(storageWarning); };
  say(storageWarning);
  const dialog = node('dialog', undefined, { class: 'demo-dialog', 'aria-labelledby': 'demo-dialog-title' });
  document.body.append(dialog);
  dialog.addEventListener('close', () => {
    const side = document.querySelector('.dash-side');
    if (side.inert && side.contains(document.activeElement)) document.querySelector('.menu-btn').focus();
    else if (document.activeElement === document.body) document.querySelector('[data-action="deal"], [data-action="report"]')?.focus();
  });
  function open(title, build) {
    dialog.replaceChildren();
    const header = node('header'); header.append(node('h2', title, { id: 'demo-dialog-title' }), button('Close', () => dialog.close())); dialog.append(header);
    build(dialog); if (!dialog.open) dialog.showModal(); else dialog.querySelector('button, input, select')?.focus();
  }
  const pipeline = document.querySelector('.pipeline');
  const search = document.querySelector('.search input');
  search.placeholder = pipeline ? 'Search deals or owners…' : 'Search customers…';
  search.setAttribute('aria-label', pipeline ? 'Search deals or owners' : 'Search customers');
  const log = text => { state.activity.unshift(text); state.activity = state.activity.slice(0, 20); };
  function renderDeals() {
    if (!pipeline) return;
    const query = search.value.toLowerCase().trim();
    pipeline.replaceChildren();
    for (const stage of stages) {
      const all = state.deals.filter(d => d.stage === stage), visible = all.filter(d => `${d.name} ${d.owner}`.toLowerCase().includes(query));
      const lane = node('section', undefined, { class: 'lane', 'aria-label': stage });
      const heading = node('h4', stage); heading.append(node('span', `${visible.length}`, { class: 'badge' })); lane.append(heading);
      for (const deal of visible) {
        const card = button('', () => editDeal(deal)); card.className = 'deal'; card.dataset.dealId = deal.id;
        card.setAttribute('aria-label', `Edit ${deal.name}`);
        card.append(node('span', deal.name), node('b', money(deal.value)), node('small', deal.owner, { class: 'muted' })); lane.append(card);
      }
      if (!visible.length) lane.append(node('p', query ? 'No matching deals' : 'No deals yet', { class: 'muted' }));
      pipeline.append(lane);
    }
    const won = state.deals.filter(d => d.stage === 'Won'), active = state.deals.filter(d => d.stage !== 'Won');
    const cards = document.querySelectorAll('.kpi');
    const metrics = [['Open pipeline', money(active.reduce((sum, d) => sum + d.value, 0))], ['Deals won', String(won.length)], ['Won share', `${state.deals.length ? Math.round(won.length / state.deals.length * 100) : 0}%`], ['Won value', money(won.reduce((sum, d) => sum + d.value, 0))]];
    cards.forEach((card, i) => { card.querySelector('small').textContent = metrics[i][0]; card.querySelector('b').textContent = metrics[i][1]; card.querySelector('[data-chart]')?.remove(); card.querySelector('.delta').textContent = 'Based on all demo deals'; });
    if (state.activity.length) {
      const feed = document.querySelector('.feed'); feed.replaceChildren(...state.activity.map(text => node('li', text)));
    }
  }
  function editDeal(deal) {
    open(deal ? 'Edit deal' : 'New deal', box => {
      const form = node('form', undefined, { class: 'demo-form' });
      const fields = {};
      for (const [key, title, type] of [['name', 'Company', 'text'], ['value', 'Value (USD)', 'number'], ['owner', 'Owner', 'text'], ['stage', 'Stage', 'select']]) {
        const label = node('label', title);
        const input = type === 'select' ? node('select') : node('input', undefined, { type, required: '', maxlength: '100' });
        input.name = key;
        if (type === 'select') input.append(...stages.map(s => node('option', s, { value: s })));
        if (type === 'number') { input.min = '0'; input.max = '1000000000'; input.step = '0.01'; }
        input.value = deal?.[key] ?? (key === 'stage' ? 'Lead' : ''); fields[key] = input; label.append(input); form.append(label);
      }
      const submit = node('button', 'Save deal', { type: 'submit', class: 'btn' }); form.append(submit);
      form.addEventListener('submit', e => {
        e.preventDefault(); const value = { id: deal?.id ?? crypto.randomUUID(), name: fields.name.value.trim(), owner: fields.owner.value.trim(), value: Number(fields.value.value), stage: fields.stage.value };
        if (!validDeal(value)) { fields.name.setCustomValidity('Enter a company and owner, and a valid nonnegative value.'); fields.name.reportValidity(); return; }
        if (deal) state.deals = state.deals.map(d => d.id === deal.id ? value : d); else state.deals.push(value);
        log(`${deal ? 'Updated' : 'Added'} ${value.name} · ${value.stage} · ${money(value.value)}`); say('Deal saved.'); save(); renderDeals(); dialog.close();
      });
      form.addEventListener('input', () => fields.name.setCustomValidity(''));
      if (deal) form.append(button('Delete deal', () => {
        open(`Delete ${deal.name}?`, box => { box.append(node('p', 'This removes the deal from this browser’s demo.'), button('Cancel', () => editDeal(deal)), button('Delete permanently', () => { state.deals = state.deals.filter(d => d.id !== deal.id); log(`Deleted ${deal.name}`); say('Deal deleted.'); save(); renderDeals(); dialog.close(); })); });
      }));
      box.append(form);
    });
  }
  const table = document.querySelector('table.data');
  const rows = table ? [...table.tBodies[0].rows] : [];
  let statusFilter;
  if (table) {
    const label = node('label', 'Customer status ', { class: 'demo-filter' }); statusFilter = node('select', undefined, { 'aria-label': 'Customer status' });
    statusFilter.append(...['All', 'Active', 'Trial', 'Past due'].map(s => node('option', s))); label.append(statusFilter); table.parentElement.before(label);
    statusFilter.addEventListener('change', filterCustomers);
    for (const [index, th] of [...table.tHead.rows[0].cells].entries()) {
      const title = th.textContent; let ascending = true; th.textContent = ''; th.setAttribute('aria-sort', 'none');
      th.append(button(title, () => {
        rows.sort((a, b) => (index === 2 ? Number(a.cells[index].textContent.replace(/[^\d.]/g, '')) - Number(b.cells[index].textContent.replace(/[^\d.]/g, '')) : a.cells[index].textContent.localeCompare(b.cells[index].textContent)) * (ascending ? 1 : -1));
        table.tBodies[0].append(...rows); table.querySelectorAll('th').forEach(h => h.setAttribute('aria-sort', 'none')); th.setAttribute('aria-sort', ascending ? 'ascending' : 'descending'); ascending = !ascending;
      }));
    }
  }
  function filterCustomers() {
    for (const row of rows) row.hidden = !row.textContent.toLowerCase().includes(search.value.trim().toLowerCase()) || (statusFilter.value !== 'All' && row.cells[3].textContent !== statusFilter.value);
    say(`${rows.filter(r => !r.hidden).length} of ${rows.length} customers shown.`);
  }
  search.addEventListener('input', () => pipeline ? renderDeals() : filterCustomers());
  function csv() {
    const quote = value => '"' + String(value).replace(/"/g, '""') + '"';
    return [['Customer', 'Plan', 'MRR', 'Status'], ...rows.filter(r => !r.hidden).map(r => [...r.cells].map(c => { const copy = c.cloneNode(true); copy.querySelector('.av')?.remove(); return copy.textContent.trim(); }))].map(r => r.map(quote).join(',')).join('\r\n');
  }
  function reports() {
    open('Saved reports', box => {
      box.append(node('p', 'Customer CSV snapshots saved in this browser.'));
      if (!state.reports.length) box.append(node('p', 'No saved reports. Create one from Analytics using New report.'));
      state.reports.forEach((report, i) => { const row = node('div', undefined, { class: 'demo-actions' }); row.append(node('span', report.name), button('Download CSV', () => download('customers.csv', report.csv, 'text/csv')), button('Delete', () => { state.reports.splice(i, 1); save(); reports(); })); box.append(row); });
    });
  }
  document.querySelector('[data-action="deal"]')?.addEventListener('click', () => editDeal());
  document.querySelector('[data-action="export"]')?.addEventListener('click', () => { download(pipeline ? 'colibri-deals.json' : 'customers.csv', pipeline ? JSON.stringify(state.deals, null, 2) : csv(), pipeline ? 'application/json' : 'text/csv'); say('Export downloaded.'); });
  document.querySelector('[data-action="report"]')?.addEventListener('click', () => open('New customer report', box => {
    const form = node('form', undefined, { class: 'demo-form' }), label = node('label', 'Report name'), input = node('input', undefined, { required: '', maxlength: '100', name: 'reportName' });
    label.append(input); form.append(node('p', 'Saves a snapshot of the currently filtered customers.'), label, node('button', 'Save report', { class: 'btn', type: 'submit' }));
    form.addEventListener('submit', e => { e.preventDefault(); if (!input.value.trim()) return; state.reports.push({ name: input.value.trim(), csv: csv() }); say('Report saved.'); save(); reports(); }); box.append(form);
  }));
  document.querySelector('[data-action="import"]')?.addEventListener('click', () => open('Import deals', box => {
    box.append(node('p', 'Choose a JSON array exported from this demo. Imported deals are added with new IDs. Maximum 100 deals and 100 KB; existing deals stay intact.'));
    const input = node('input', undefined, { type: 'file', accept: '.json,application/json', 'aria-label': 'Deals JSON file' }), feedback = node('p', '', { role: 'alert' });
    box.append(input, feedback);
    input.addEventListener('change', async () => {
      const file = input.files[0]; if (!file) return;
      try {
        if (file.size > 100000) throw new Error();
        const data = JSON.parse(await file.text());
        if (!Array.isArray(data) || !data.length || data.length > 100 || !data.every(validDeal)) throw new Error();
        state.deals.push(...data.map(d => ({ id: crypto.randomUUID(), name: d.name.trim(), owner: d.owner.trim(), value: d.value, stage: d.stage })));
        log(`Imported ${data.length} deals`); say(`Imported ${data.length} deals.`); save(); renderDeals(); dialog.close();
      } catch { feedback.textContent = 'Import rejected. Use an exported JSON array with id, name, owner, numeric value (0–1 billion), and stage (Lead, Qualified, Proposal, Won). No deals were changed.'; }
    });
  }));
  const messages = ['Welcome to the Colibri demo. Try creating a deal.', 'Tip: export your deals before resetting the demo.', 'Theme packs work with both dashboards.'];
  function inbox() {
    open('Demo inbox', box => messages.forEach((text, i) => { const row = node('div', undefined, { class: 'demo-actions' }); row.append(node('p', text), button(state.read.includes(i) ? 'Mark unread' : 'Mark read', () => { state.read = state.read.includes(i) ? state.read.filter(x => x !== i) : [...state.read, i]; save(); updateBadge(); inbox(); })); box.append(row); }));
  }
  function updateBadge() { const badge = document.querySelector('[data-workspace="inbox"] .badge'); if (badge) badge.textContent = String(messages.length - state.read.length); }
  function settings() {
    open('Demo settings', box => {
      box.append(node('p', 'Theme, appearance and accent controls are in the top bar. Reset clears deals, reports and inbox state for this demo only.'), button('Reset demo data', () => open('Reset demo data?', box => {
        box.append(node('p', 'Your local edits and saved reports will be removed.'), button('Cancel', settings), button('Reset now', () => { state = fresh(); say('Demo data reset.'); save(); renderDeals(); updateBadge(); dialog.close(); }));
      })));
    });
  }
  document.querySelectorAll('[data-workspace]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); ({ inbox, reports, settings })[a.dataset.workspace](); }));
  // Modal navigation on small screens: hidden links cannot receive keyboard focus.
  const shell = document.querySelector('.dash'), side = document.querySelector('.dash-side'), toggle = document.querySelector('.menu-btn'), media = matchMedia('(max-width: 900px)');
  const backdrop = button('Close navigation', () => setMenu(false)); backdrop.className = 'nav-backdrop'; backdrop.tabIndex = -1; shell.append(backdrop);
  const closeNav = button('Close menu', () => { setMenu(false); toggle.focus(); }); closeNav.className = 'btn nav-close'; side.prepend(closeNav);
  function setMenu(open) { shell.toggleAttribute('data-open', open); toggle.setAttribute('aria-expanded', String(open)); side.inert = media.matches && !open; backdrop.hidden = !media.matches || !open; }
  toggle.addEventListener('click', () => { const open = !shell.hasAttribute('data-open'); setMenu(open); if (open) closeNav.focus(); });
  side.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => {
    if (!media.matches || !shell.hasAttribute('data-open') || dialog.open) return;
    if (e.key === 'Escape') { setMenu(false); toggle.focus(); }
    if (e.key === 'Tab') { const links = [...side.querySelectorAll('button,a[href]')], first = links[0], last = links.at(-1); if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
  });
  media.addEventListener('change', () => setMenu(false)); setMenu(false);
  // A readable data alternative also makes range changes inspectable without colour/hover.
  for (const chart of document.querySelectorAll('#traffic, #rev')) {
    const details = node('details', undefined, { class: 'chart-data' }), summary = node('summary', 'View chart data'), output = node('pre'); details.append(summary, output); chart.after(details);
    const update = () => { const data = JSON.parse(chart.dataset.values); output.textContent = (Array.isArray(data[0]) ? data[0].map((v, i) => `Day ${30 - data[0].length + i + 1}: ${v} visitors, ${data[1][i]} signups`) : data.map((v, i) => `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][12 - data.length + i]}: $${v}k`)).join('\n'); };
    update(); chart.addEventListener('chartchange', update);
  }
  renderDeals(); updateBadge();
}

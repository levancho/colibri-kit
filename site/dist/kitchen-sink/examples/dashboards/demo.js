import {avatar,person,companyMark} from './visuals.js';
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
function reportTable(csv) {
  const records=[]; let row=[],cell='',quoted=false;
  for(let i=0;i<csv.length;i++) { const c=csv[i];
    if(c==='"') { if(quoted && csv[i+1]==='"'){cell+='"';i++;}else quoted=!quoted; }
    else if(c===',' && !quoted){row.push(cell);cell='';}
    else if(c==='\n' && !quoted){row.push(cell.replace(/\r$/,''));records.push(row);row=[];cell='';}
    else cell+=c;
  }
  if(cell || row.length){row.push(cell);records.push(row);}
  const wrap=node('div',undefined,{class:'table-scroll report-preview'}),table=node('table',undefined,{class:'data'}),head=node('thead'),body=node('tbody');
  records.forEach((values,index)=>{const tr=node('tr');values.forEach(value=>tr.append(node(index?'td':'th',value,index?{}:{scope:'col'})));(index?body:head).append(tr);});
  table.append(head,body);wrap.append(table);return wrap;
}
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
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch { storageWarning = 'Changes could not be saved; keep this page open or export a backup.'; } if (storageWarning) say(storageWarning); return false; };
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
  const workspace = document.body.dataset.page;
  const workspaceContent = document.getElementById('workspace-content');
  function surface(kind, title, build) {
    if (workspace === kind) { workspaceContent.replaceChildren(); build(workspaceContent); }
    else open(title, build);
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
        const title=node('span','',{class:'deal-company'});title.innerHTML=companyMark(deal.name);title.append(node('span',deal.name));const owner=node('span','',{class:'deal-owner'});owner.innerHTML=person(deal.owner);card.append(title,node('b',money(deal.value)),owner); lane.append(card);
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
  search.addEventListener('input', () => workspace === 'inbox' ? inbox() : workspace === 'reports' ? reports() : pipeline ? renderDeals() : filterCustomers());
  if (workspace) { search.placeholder = `Search ${workspace}…`; search.setAttribute('aria-label', `Search ${workspace}`); }
  if (workspace === 'settings') search.closest('.search').hidden = true;
  function csv() {
    const quote = value => '"' + String(value).replace(/"/g, '""') + '"';
    if (!table) return [['Company','Value (USD)','Owner','Stage'],...state.deals.map(d=>[d.name,d.value,d.owner,d.stage])].map(r=>r.map(quote).join(',')).join('\r\n');
    return [['Customer', 'Plan', 'MRR', 'Status'], ...rows.filter(r => !r.hidden).map(r => [...r.cells].map(c => { const copy = c.cloneNode(true); copy.querySelector('.av')?.remove(); return copy.textContent.trim(); }))].map(r => r.map(quote).join(',')).join('\r\n');
  }
  function reports() {
    surface('reports', 'Saved reports', box => {
      if (workspace === 'reports') {
        const summary=node('section',undefined,{class:'card panel'});
        summary.append(node('h2','Pipeline snapshot'),node('p',`${state.deals.length} deals · ${money(state.deals.reduce((sum,d)=>sum+d.value,0))} total value`),node('p','Create a report to freeze the current pipeline data. For a filtered customer report, use New report on the overview.'),node('a','Open analytics →',{href:'analytics.html'}));box.append(summary);
      }
      if (!state.reports.length) box.append(node('p', 'No saved reports. Create one using New report.'));
      const matches=state.reports.map((report,index)=>({report,index})).filter(({report})=>workspace!=='reports'||report.name.toLowerCase().includes(search.value.toLowerCase()));
      if(state.reports.length && !matches.length)box.append(node('p','No reports match your search.'));
      matches.forEach(({report,index})=>{
        const card=node('article',undefined,{class:'card panel'}), actions=node('div',undefined,{class:'demo-actions'});
        card.append(node('h2',report.name),node('p',`${Math.max(0,report.csv.split('\r\n').length-1)} records · CSV snapshot${report.created ? ' · '+new Date(report.created).toLocaleDateString('en-US',{timeZone:['America/New_York','Europe/London','Asia/Tbilisi','UTC'].includes(state.settings?.timezone)?state.settings.timezone:'UTC'}) : ''}`));
        actions.append(button('Preview report',()=>open(report.name,detail=>{detail.append(node('p','Saved data snapshot'),reportTable(report.csv),button('Download CSV',()=>download('colibri-report.csv',report.csv,'text/csv')));})),button('Download CSV',()=>download('colibri-report.csv',report.csv,'text/csv')),button('Delete report',()=>open('Delete report?',detail=>{detail.append(node('p',`Remove “${report.name}” from this browser?`),button('Cancel',()=>dialog.close()),button('Confirm delete',()=>{state.reports.splice(index,1);save();dialog.close();reports();}));})));
        card.append(actions);box.append(card);
      });
    });
  }
  document.querySelector('[data-action="deal"]')?.addEventListener('click', () => editDeal());
  document.querySelector('[data-action="export"]')?.addEventListener('click', () => { download(pipeline ? 'colibri-deals.json' : 'customers.csv', pipeline ? JSON.stringify(state.deals, null, 2) : csv(), pipeline ? 'application/json' : 'text/csv'); say('Export downloaded.'); });
  document.querySelector('[data-action="report"]')?.addEventListener('click', () => open('New customer report', box => {
    const form = node('form', undefined, { class: 'demo-form' }), label = node('label', 'Report name'), input = node('input', undefined, { required: '', maxlength: '100', name: 'reportName' });
    label.append(input); form.append(node('p', table ? 'Saves a snapshot of the currently filtered customers.' : 'Saves a snapshot of all current pipeline deals.'), label, node('button', 'Save report', { class: 'btn', type: 'submit' }));
    form.addEventListener('submit', e => { e.preventDefault(); if (!input.value.trim()) return; state.reports.push({ name: input.value.trim(), csv: csv(), created: new Date().toISOString() }); say('Report saved.'); save(); if(workspace==='reports')dialog.close(); reports(); }); box.append(form);
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
  const messages = [
    {sender:'Maya Chen · Tbilisi Bank',subject:'Proposal review for the new workspace',date:'Today · 10:42 AM',body:'Our finance team has reviewed the proposal. Could you confirm the onboarding timeline and whether the training sessions are included? We are targeting a rollout next month.',link:'crm.html',action:'Review sales pipeline'},
    {sender:'Alex Morgan · Customer success',subject:'Trial accounts ready for follow-up',date:'Today · 9:15 AM',body:'The latest trial cohort is ready for review. Filter the customer list by Trial and save a report so the team can prioritize outreach this week.',link:'analytics.html',action:'Review customers'},
    {sender:'Jordan Lee · Operations',subject:'Prepare the weekly pipeline report',date:'Yesterday · 4:30 PM',body:'Please create a snapshot of the current pipeline before the weekly planning meeting. Reports remain available in this demo so you can preview and export the same data later.',link:'reports.html',action:'Open reports'},
  ];
  function inbox() {
    surface('inbox','Inbox',box=>{
      const layout=node('div',undefined,{class:'inbox-layout'}), list=node('section',undefined,{class:'card panel message-list','aria-label':'Conversations'});
      const query=search.value.toLowerCase(), selected=Number(new URLSearchParams(location.search).get('message')||0);
      messages.forEach((message,i)=>{
        if(!`${message.sender} ${message.subject} ${message.body}`.toLowerCase().includes(query))return;
        const link=node('a',undefined,{href:`inbox.html?message=${i}`,class:'message-link'});
        if(i===selected)link.setAttribute('aria-current','true');
        link.append(node('strong',message.subject),node('span',message.sender),node('small',`${state.read.includes(i)?'Read':'Unread'} · ${message.date}`));list.append(link);
      });
      if(!list.children.length)list.append(node('p','No messages match your search.'));
      const i=Number.isInteger(selected)&&selected>=0&&selected<messages.length?selected:0, message=messages[i];
      const detail=node('article',undefined,{class:'card panel message-detail'});
      detail.append(node('h2',message.subject),node('p',message.sender,{class:'muted'}),node('p',message.date,{class:'muted'}),node('p',message.body));
      const actions=node('div',undefined,{class:'demo-actions'});
      actions.append(node('a',message.action+' →',{href:message.link,class:'btn','data-size':'s'}),button(state.read.includes(i)?'Mark unread':'Mark read',()=>{state.read=state.read.includes(i)?state.read.filter(x=>x!==i):[...state.read,i];save();updateBadge();inbox();}));detail.append(actions);
      const form=node('form',undefined,{class:'demo-form'}),label=node('label','Reply draft'),input=node('textarea',undefined,{name:'reply',rows:'5',maxlength:'2000'});
      input.value=typeof state.drafts?.[i]==='string'?state.drafts[i]:'';label.append(input);form.append(label,node('p','Drafts stay in this browser. This demo does not send messages.'),node('button','Save draft',{type:'submit',class:'btn'}));
      form.addEventListener('submit',e=>{e.preventDefault();state.drafts={...state.drafts,[i]:input.value};if(save())say('Draft saved locally.');});detail.append(form);layout.append(list,detail);box.append(layout);
    });
  }
  document.querySelector('[data-action="read-all"]')?.addEventListener('click',()=>{state.read=messages.map((_,i)=>i);save();updateBadge();inbox();say('All conversations marked read.');});
  function updateBadge() { const badge = document.querySelector('[data-workspace="inbox"] .badge'); if (badge) { badge.textContent = String(messages.length - state.read.length); badge.hidden=state.settings?.notifications===false; } }
  function settings() {
    surface('settings','Settings',box=>{
      const form=node('form',undefined,{class:'card panel demo-form'});form.append(node('h2','Workspace and profile'));
      const defaults={workspace:'Northwind',name:'Jordan Lee',email:'jordan@example.com',timezone:'America/New_York'},fields={};
      for(const [key,title,type] of [['workspace','Workspace name','text'],['name','Your name','text'],['email','Email address','email'],['timezone','Timezone','select']]){
        const label=node('label',title), input=node(type==='select'?'select':'input',undefined,{name:key,required:'',...(type==='select'?{}:{type,maxlength:'100'})});
        if(type==='select')input.append(...['America/New_York','Europe/London','Asia/Tbilisi','UTC'].map(t=>node('option',t,{value:t})));
        input.value=typeof state.settings?.[key]==='string'?state.settings[key]:defaults[key];fields[key]=input;label.append(input);form.append(label);
      }
      const notificationLabel=node('label','Show unread message count'),notifications=node('input',undefined,{type:'checkbox',name:'notifications'});notifications.checked=state.settings?.notifications!==false;notificationLabel.prepend(notifications);form.append(notificationLabel,node('button','Save settings',{class:'btn',type:'submit'}));
      form.addEventListener('submit',e=>{e.preventDefault();if(Object.values(fields).some(f=>!f.value.trim())){say('Complete every profile field.');return;}state.settings=Object.fromEntries(Object.entries(fields).map(([key,input])=>[key,input.value.trim()]));state.settings.notifications=notifications.checked;const persisted=save();updateBadge();if(persisted)say('Workspace settings saved locally.');applyProfile();});box.append(form);
      const appearance=node('section',undefined,{class:'card panel'});appearance.append(node('h2','Appearance'),node('p','Use the theme pack, hue and light/dark controls in the top bar. Build a custom theme in Studio.'),node('a','Open Theme Studio →',{href:'../playground/'}));box.append(appearance);
      const reset=node('section',undefined,{class:'card panel'});reset.append(node('h2','Demo data'),node('p','Reset local deals, saved reports, message drafts and workspace settings.'),button('Reset demo data',()=>open('Reset demo data?',detail=>{detail.append(node('p','Your local edits and saved reports will be removed.'),button('Cancel',()=>dialog.close()),button('Reset now',()=>{state=fresh();save();updateBadge();dialog.close();settings();document.querySelector('.dash-brand').lastChild.textContent='Colibri Kit';say('Demo data reset.');}));})));box.append(reset);
    });
  }
  function applyProfile(){
    if(typeof state.settings?.workspace==='string')document.querySelector('.dash-brand').lastChild.textContent=state.settings.workspace;
    if(typeof state.settings?.name==='string')document.querySelector('.dash-top > .av').textContent=state.settings.name.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase();
  }
  if(workspace)({inbox,reports,settings})[workspace]?.();
  applyProfile();
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

for(const el of document.querySelectorAll('.av')){const name=({NK:'Nino Kapanadze',GB:'Giorgi Beridze',AM:'Ana Meladze',DT:'Dato Tsiklauri',SL:'Salome Lomidze',LD:'Levan D.'})[el.textContent.trim()];if(name)el.outerHTML=avatar(name).replace('class="portrait','class="av portrait');}

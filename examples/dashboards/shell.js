import {icon} from './visuals.js';

// Every demo shares this navigation; application content remains independent.
const demos=[['analytics','Analytics','activity'],['crm','CRM','target'],['workspace','Team workspace','teams'],['account','Account center','profile'],['commerce','Commerce','orders'],['support','Support desk','open']];
const current=document.body.dataset.demo||document.body.dataset.app||(new URLSearchParams(location.search).get('app')==='crm'?'crm':'analytics');
const side=document.querySelector('.dash-side,.app-nav');
if(side){
  const top=document.querySelector('.dash-top,.app-top');
  side.classList.add('suite-sidebar');
  const brand=document.createElement('a');brand.href='index.html';brand.className='suite-brand';brand.innerHTML=`<span>${icon('spark')}</span><strong>Colibri<small>Application demos</small></strong>`;
  const nav=document.createElement('nav');nav.className='suite-nav';nav.setAttribute('aria-label','Application demos');nav.innerHTML='<p class="suite-label">Applications</p>'+demos.map(([id,label,symbol])=>`<a href="${id}.html" ${current===id?'aria-current="page"':''}>${icon(symbol)}<span>${label}</span>${current===id?'<span class="suite-active-dot" aria-hidden="true"></span>':''}</a>`).join('');
  side.querySelector('.dash-brand,.app-logo')?.remove();side.querySelector(':scope > small')?.remove();
  const context=side.querySelector('.dash-nav,#app-nav');
  if(context){context.classList.add('suite-context');context.setAttribute('aria-label','Current application');for(const a of context.querySelectorAll('a')){if(['analytics.html','crm.html','index.html','../kitchen-sink.html','https://github.com/levancho/colibri-kit'].includes(a.getAttribute('href')))a.remove();}for(const a of context.querySelectorAll('a')){if(['customers.html','inbox.html','reports.html','settings.html'].includes(a.getAttribute('href'))&&current==='crm')a.href=a.getAttribute('href')+'?app=crm';}for(const h of context.querySelectorAll('h6'))h.remove();const label=document.createElement('p');label.className='suite-label';label.dataset.workspaceName='';label.textContent=document.body.dataset.workspaceName||'Workspace';context.prepend(label);}
  side.prepend(brand,nav);const close=side.querySelector('.nav-close');if(close)side.prepend(close);
  const footer=side.querySelector('footer');if(footer)footer.innerHTML=`<a href="index.html">${icon('arrow')} All dashboards</a><a href="../kitchen-sink.html">${icon('code')} Component library</a><small>Colibri Kit · Local demo data</small>`;
  // Newer apps use the same mobile drawer behavior as Analytics and CRM.
  if(document.body.dataset.app){
    side.id='dashboard-navigation';const toggle=document.createElement('button');toggle.type='button';toggle.className='btn suite-menu';toggle.setAttribute('data-variant','outline');toggle.setAttribute('aria-label','Menu');toggle.setAttribute('aria-controls',side.id);toggle.setAttribute('aria-expanded','false');toggle.innerHTML=icon('overview');top.prepend(toggle);
    const close=document.createElement('button');close.type='button';close.className='btn suite-close';close.textContent='Close menu';side.prepend(close);
    const backdrop=document.createElement('button');backdrop.type='button';backdrop.className='suite-backdrop';backdrop.setAttribute('aria-label','Close navigation');backdrop.hidden=true;document.body.append(backdrop);
    const media=matchMedia('(max-width:900px)');
    const setOpen=open=>{document.body.toggleAttribute('data-nav-open',open);toggle.setAttribute('aria-expanded',String(open));side.inert=media.matches&&!open;backdrop.hidden=!media.matches||!open;};
    toggle.onclick=()=>{setOpen(toggle.getAttribute('aria-expanded')!=='true');if(toggle.getAttribute('aria-expanded')==='true')close.focus();};close.onclick=backdrop.onclick=()=>{setOpen(false);toggle.focus();};
    document.addEventListener('keydown',e=>{if(toggle.getAttribute('aria-expanded')!=='true'||document.querySelector('dialog[open]'))return;if(e.key==='Escape'){setOpen(false);toggle.focus();}if(e.key==='Tab'){const links=[...side.querySelectorAll('button,a[href]')],first=links[0],last=links.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});media.addEventListener('change',()=>setOpen(false));setOpen(false);
  }
}

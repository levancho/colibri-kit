import {readDomainState} from './domain-state.js';
import {initPackPicker,initScheme} from './skins.js';
import {person,avatar,companyMark,icon} from './visuals.js';
export {person,avatar,companyMark,icon};
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const money=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v);
export const link=(label,href)=>`<a href="${esc(href)}">${esc(label)}</a>`;
export const button=(label,action,id='')=>`<button class="btn" data-variant="outline" data-size="s" type="button" data-action="${action}" data-id="${esc(id)}">${esc(label)}</button>`;
export const pill=(label,tone='')=>`<span class="app-pill" data-tone="${tone}">${esc(label)}</span>`;
export const card=(title,body)=>`<section class="app-card"><h2>${esc(title)}</h2>${body}</section>`;
export const table=(heads,rows)=>`<div class="app-table-wrap" tabindex="0" role="region" aria-label="${esc(heads[0])} data"><table class="app-table"><thead><tr>${heads.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')||`<tr><td colspan="${heads.length}">No matching records.</td></tr>`}</tbody></table></div>`;
export const metric=(label,value,detail)=>`<article class="app-card app-metric"><small>${esc(label)}</small><strong>${esc(value)}</strong><small>${esc(detail)}</small></article>`;
export const head=(app,title,description,actions='')=>`<div class="app-heading"><div><span class="eyebrow">${esc(app)}</span><h1>${esc(title)}</h1><p>${esc(description)}</p></div><div class="app-actions">${actions}</div></div>`;
function compatible(value,sample){if(Array.isArray(sample))return Array.isArray(value)&&value.length<=1000&&(!sample.length||value.every(v=>compatible(v,sample[0])));if(sample&&typeof sample==='object')return value&&typeof value==='object'&&Object.entries(sample).every(([k,v])=>value[k]===undefined||compatible(value[k],v));return typeof value===typeof sample&&(typeof value!=='number'||Number.isFinite(value));}
export function load(key,seed){try{const raw=readDomainState(key,seed);if(raw&&compatible(raw,seed)){const result=structuredClone(seed);for(const [k,v]of Object.entries(raw))result[k]=v;return result;}}catch{}return structuredClone(seed);}
export function setup(){
 const content=document.querySelector('#app-content'),search=document.querySelector('#app-search'),status=document.querySelector('#app-status'),dialog=document.querySelector('#app-dialog');
 initPackPicker(document.querySelector('#app-pack'));initScheme(document.querySelector('#app-scheme'));
 document.querySelector('.app-avatar').outerHTML=person('Jordan Lee');
 const say=message=>status.textContent=message;
 return {content,search,say,save(key,state,message){try{localStorage.setItem(key,JSON.stringify(state));say(message);}catch{say('Changed on this page only. Browser storage is unavailable.');}},edit(title,fields,submit){dialog.innerHTML=`<header><h2 id="app-dialog-title">${esc(title)}</h2><button class="btn" type="button" data-close>Close</button></header><form class="app-form">${fields.map(f=>`<label>${esc(f.label)}${f.options?`<select name="${f.name}">${f.options.map(o=>`<option ${o===f.value?'selected':''}>${esc(o)}</option>`).join('')}</select>`:`<input name="${f.name}" type="${f.type||'text'}" value="${esc(f.value||'')}" ${f.optional?'':'required'} maxlength="100" ${f.type==='number'?'min="0" max="1000000000" step="1"':''}>`}</label>`).join('')}<button class="btn" type="submit">Save</button></form>`;dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.querySelector('form').onsubmit=e=>{e.preventDefault();const values=Object.fromEntries([...new FormData(e.target)].map(([k,v])=>[k,v.trim()]));if(fields.some(f=>!f.optional&&!values[f.name]))return;submit(values);dialog.close();};dialog.showModal();}};
}
export function downloadCSV(filename,rows){const safe=v=>{const s=String(v??'');return /^[=+@\-\t\r]/.test(s)?"'"+s:s;};const csv=rows.map(row=>row.map(v=>'"'+safe(v).replaceAll('"','""')+'"').join(',')).join('\r\n');const href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})),a=document.createElement('a');a.href=href;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);}

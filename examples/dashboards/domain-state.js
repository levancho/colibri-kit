// One-time migration preserves useful legacy edits without retaining a shared store.
export function readDomainState(key,seed){
 const saved=localStorage.getItem(key);if(saved!==null)return JSON.parse(saved);
 const legacy=JSON.parse(localStorage.getItem('colibri-dashboard-v1'));if(!legacy||typeof legacy!=='object')return null;
 const state=structuredClone(seed);
 if(key==='colibri-crm-v2'){
  if(Array.isArray(legacy.deals)&&legacy.deals.length<=1000&&legacy.deals.every(d=>d&&typeof d.id==='string'&&typeof d.name==='string'&&typeof d.owner==='string'&&Number.isFinite(d.value)&&d.value>=0&&['Lead','Qualified','Proposal','Won'].includes(d.stage)))state.deals=legacy.deals;
  if(Array.isArray(legacy.activity)&&legacy.activity.every(x=>typeof x==='string'))state.activity=legacy.activity.slice(0,30);
 }
 if(key==='colibri-analytics-v2'&&Array.isArray(legacy.reports))state.reports=legacy.reports.filter(r=>r&&typeof r.name==='string'&&typeof r.csv==='string'&&/^"?Customer"?,/i.test(r.csv)).slice(0,100);
 localStorage.setItem(key,JSON.stringify(state));return state;
}

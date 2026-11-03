// One pre-paint theme controller for every route in each application.
(() => {
 const root=document.documentElement, app=location.pathname.split('/').pop().split(/[.-]/)[0];
 const defaults={analytics:['glacier',185],crm:['ember',35],workspace:['glacier',285],account:['glacier',245],commerce:['ember',145],support:['glacier',345]};
 const scope=defaults[app]?app:'gallery', key=name=>`colibri-demo:${scope}:${name}`;
 const read=name=>{try{return localStorage.getItem(key(name))}catch{return null}};
 const write=(name,value)=>{try{localStorage.setItem(key(name),value)}catch{}};
 const bridge=window.ColibriBridge, incoming=bridge?.read();
 if(incoming){try{bridge.store.set(incoming.theme)}catch{}try{history.replaceState(null,'',location.pathname+location.search)}catch{}}
 const custom=incoming?.theme||bridge?.store.get(), customId=custom?(custom.gen?.slug||'colibria-palette'):null;
 const query=new URLSearchParams(location.search), requested=query.get('theme');
 let pack=incoming?customId:requested??read('pack')??defaults[app]?.[0]??'';
 if(!['','glacier','ember','midnight',customId].includes(pack))pack=defaults[app]?.[0]||'';
 if(incoming||requested!==null)write('pack',pack);
 const hue=read('hue')??String(defaults[app]?.[1]??'');
 let appliedTokens=[];
 function apply(id,persist=false){
  appliedTokens.forEach(token=>root.style.removeProperty(token));appliedTokens=[];
  document.getElementById('colibri-gen-theme')?.remove();
  for(const attr of ['data-bridge','data-ui-btn','data-ui-card','data-ui-tabs','data-ui-acc','data-ui-input'])root.removeAttribute(attr);
  root.style.removeProperty('--c-hue');root.removeAttribute('data-theme');
  id?root.dataset.kitTheme=id:delete root.dataset.kitTheme;
  if(custom&&id===customId){appliedTokens=Object.keys(bridge.apply(root,custom));}
  else if(hue!=='')root.style.setProperty('--c-hue',hue);
  const scheme=read('scheme');if(scheme)root.dataset.theme=scheme;
  pack=id;if(persist)write('pack',id);
 }
 apply(pack);
 window.ColibriDemoTheme={scope,pack,hue,custom,customId,apply};
 if(query.has('gallery-preview')){
  root.dataset.galleryPreview='';
  addEventListener('DOMContentLoaded',()=>{document.body.inert=true;scrollTo(0,0);});
 }
})();

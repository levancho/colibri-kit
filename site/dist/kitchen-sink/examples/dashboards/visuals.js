// Local visual assets for fictional demo people and products. No third-party requests.
const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={
 overview:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
 teams:'<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 5a5 5 0 0 1 3 5"/>',
 members:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
 agenda:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-14 4h3m4 0h3"/>',
 activity:'<path d="M2 12h4l3-8 6 16 3-8h4"/>',
 profile:'<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M6 16a3 3 0 0 1 6 0m3-7h3m-3 4h3"/>',
 security:'<path d="M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6Z"/><path d="m8 12 3 3 5-6"/>',
 billing:'<rect x="2" y="4" width="20" height="16" rx="3"/><path d="M2 10h20M6 16h4"/>',
 orders:'<path d="M4 7h16l-1 14H5ZM8 7V5a4 4 0 0 1 8 0v2"/>',
 inventory:'<path d="m12 2 10 5v10l-10 5-10-5V7Zm0 10v10M2 7l10 5 10-5M7 4.5l10 5"/>',
 open:'<path d="M4 4h16v14H4Z"/><path d="m4 5 8 7 8-7M8 21h8"/>',
 resolved:'<circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/>',
 knowledge:'<path d="M12 5c-3-3-7-3-10-1v15c3-2 7-2 10 1 3-3 7-3 10-1V4c-3-2-7-2-10 1Zm0 0v15"/>',
 target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
 design:'<path d="m4 17 12-12 3 3L7 20H4Zm9-9 3 3M17 3l4 4"/>',
 code:'<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/>',
 growth:'<path d="m3 17 6-6 4 3 8-10m-7 0h7v7M3 21h18"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
 globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
 spark:'<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Zm7 0v4m-2-2h4"/>',
 laptop:'<rect x="4" y="3" width="16" height="13" rx="2"/><path d="m4 16-2 5h20l-2-5"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
};
export function icon(name,cls=''){return `<svg class="app-icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.overview}</svg>`;}
const faces={'Maya Chen':0,'Alex Rivera':1,'Sam Patel':2,'Jordan Lee':3,'Taylor Brooks':4,'Jamie Park':5,'Nino K.':0,'Nino Kapanadze':0,'Levan D.':1,'Ana M.':2,'Ana Meladze':2,'Giorgi B.':3,'Giorgi Beridze':3,'Salome L.':4,'Salome Lomidze':4,'Dato T.':5,'Dato Tsiklauri':5};
export function avatar(name,large=false){const face=faces[name];return `<span class="portrait${large?' portrait-large':''}" ${face===undefined?'':`data-face="${face}"`} aria-hidden="true">${face===undefined?escape(String(name).split(/\s+/).slice(0,2).map(s=>s[0]).join('')):'<img src="assets/portraits.jpg" alt="" loading="lazy" width="1536" height="1024">'}</span>`;}
export function person(name,subtitle=''){return `<span class="person">${avatar(name)}<span><strong>${escape(name)}</strong>${subtitle?`<small>${escape(subtitle)}</small>`:''}</span></span>`;}
export function avatarGroup(names=['Maya Chen','Alex Rivera','Sam Patel'],total=names.length){names=names.slice(0,total);return `<span class="avatar-group" role="img" aria-label="${escape(names.join(', '))}${total>names.length?` and ${total-names.length} more members`:''}">${names.map(n=>avatar(n)).join('')}${total>names.length?`<span class="avatar-more">+${total-names.length}</span>`:''}</span>`;}
export function cover(index,label='',cls=''){return `<span class="photo-cover ${cls}" data-cover="${index%3}" ${label?`role="img" aria-label="${escape(label)}"`:'aria-hidden="true"'}><img src="assets/team-covers.jpg" alt="" loading="lazy" width="1536" height="512"></span>`;}
const products={tote:0,mug:1,desk:2,book:3};
export function productPhoto(id,small=false){return `<span class="product-photo${small?' product-thumb':''}" data-product="${products[id]??0}" role="img" aria-label="${escape({tote:'Natural canvas tote bag',mug:'Ceramic coffee mug',desk:'Walnut desk organizer',book:'Linen notebook'}[id]||'Sample product')}"><img src="assets/products.jpg" alt="" loading="lazy" width="1024" height="1024"></span>`;}
export function companyMark(name){const marks={'Tbilisi Bank':['TB','blue'],'Despani':['D','violet'],'Kutaisi Labs':['K','green'],'Batumi Ports':['BP','blue'],'Rustavi Steel':['RS','orange'],'GeoCell':['G','violet'],'Mtskheta Wines':['MW','orange'],'Svaneti Tours':['ST','green']};const [letters,tone]=marks[name]||[String(name).slice(0,2).toUpperCase(),'blue'];return `<span class="company-mark" data-tone="${tone}" aria-hidden="true">${escape(letters)}</span>`;}

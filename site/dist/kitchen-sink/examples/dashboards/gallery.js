import {DEVICES} from '../device-preview.js?v=individual-2';
import {initPackPicker,initScheme} from './skins.js';
initPackPicker(document.getElementById('pack'));
initScheme(document.getElementById('scheme'));
for(const card of document.querySelectorAll('.dashboard-preview')){
  const controls=card.querySelector('.preview-devices'),frame=card.querySelector('iframe'),shot=card.querySelector('.shot');
  const sizes={desktop:[1440,960],tablet:[768,1024],phone:[390,844]};
  let selected='desktop';
  controls.innerHTML=DEVICES.map(d=>`<button type="button" role="radio" data-device="${d.id}" aria-label="${d.label}" aria-checked="${d.id===selected}" tabindex="${d.id===selected?0:-1}" title="${d.label}"><svg viewBox="0 0 24 24" aria-hidden="true">${d.icon}</svg></button>`).join('');
  function resize(){const [w,h]=sizes[selected];frame.width=w;frame.height=h;frame.style.setProperty('--preview-width',w+'px');frame.style.setProperty('--preview-height',h+'px');frame.style.setProperty('--preview-scale',Math.min(shot.clientWidth/w,shot.clientHeight/h,1));}
  function set(id,focus=false){selected=id;card.dataset.device=id;for(const button of controls.querySelectorAll('button')){const on=button.dataset.device===id;button.setAttribute('aria-checked',String(on));button.tabIndex=on?0:-1;if(on&&focus)button.focus();}resize();}
  controls.addEventListener('click',e=>{const b=e.target.closest('button');if(b)set(b.dataset.device);});
  controls.addEventListener('keydown',e=>{const ids=DEVICES.map(d=>d.id),i=ids.indexOf(selected);let next;if(['ArrowRight','ArrowDown'].includes(e.key))next=(i+1)%3;if(['ArrowLeft','ArrowUp'].includes(e.key))next=(i+2)%3;if(e.key==='Home')next=0;if(e.key==='End')next=2;if(next!==undefined){e.preventDefault();set(ids[next],true);}});
  new ResizeObserver(resize).observe(shot);set('desktop');
}
document.getElementById('pack').addEventListener('change',()=>document.querySelectorAll('.dashboard-preview iframe').forEach(f=>f.contentWindow.location.reload()));

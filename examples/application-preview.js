// Working documentation actions. This file is shown in the JavaScript tab;
// application state and sample business operations do not belong in the UI core.
import { createApplicationComponent } from '../src/core/application-component.js';
import { createApplicationShell } from '../src/core/application-shell.js';
export function mountApplicationExample(root, initialModel) {
const kind=root.dataset.applicationComponent, model=structuredClone(initialModel);
root.dataset.previewReady='true';
let shell, cart=0, total=0;
if(kind==='shell')shell=createApplicationShell(root);
function dialog(title, fields, save) {
 const dialog=document.createElement('dialog');dialog.className='app-dialog';
 const form=document.createElement('form');form.className='app-form';
 const heading=document.createElement('h2');heading.id='preview-dialog-title';heading.textContent=title;dialog.setAttribute('aria-labelledby',heading.id);form.append(heading);
 for(const field of fields){const label=document.createElement('label');label.textContent=field.label;
  const control=document.createElement(field.options?'select':'input');control.name=field.name;
  if(field.options)for(const option of field.options)control.add(new Option(option.label,option.value));
  control.value=field.value;control.required=true;label.append(control);form.append(label);
 }
 const submit=document.createElement('button');submit.className='btn';submit.textContent='Save changes';submit.type='submit';
 const close=document.createElement('button');close.className='btn';close.type='button';close.textContent='Close';close.onclick=()=>dialog.close();
 if(save)form.append(submit);form.append(close);dialog.append(form);document.body.append(dialog);
 form.addEventListener('submit',e=>{e.preventDefault();save?.(Object.fromEntries(new FormData(form)));dialog.close();});
 dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
}
function detail(title,fields){dialog(title,Object.entries(fields).map(([label,value])=>({label,name:label,value:String(value)})));}
const tickets=kind==='conversation'?model.tickets.map(t=>({...t,assigned:'Unassigned',replies:[]})):[];
let ticket=tickets[0];
function showTicket(){
 root.querySelector('[data-ticket-title]').textContent=ticket.title;
 root.querySelector('[data-ticket-customer]').textContent=ticket.customer;
 root.querySelector('[data-ticket-status]').value=ticket.status;
 root.querySelector('[data-ticket-assignee]').value=ticket.assigned;
 root.querySelectorAll('.support-ticket').forEach(b=>{b.setAttribute('aria-current',String(b.dataset.id===ticket.id));b.querySelector('small').textContent=tickets.find(t=>t.id===b.dataset.id).status;});
 const messages=root.querySelector('[data-ticket-messages]');messages.replaceChildren();
 for(const text of [ticket.message,...ticket.replies]){const el=document.createElement('div');el.className='support-message';const p=document.createElement('p');p.textContent=text;el.append(p);messages.append(el);}
}
if(ticket){showTicket();root.querySelector('[data-ticket-status]').onchange=e=>{ticket.status=e.target.value;showTicket();};root.querySelector('[data-ticket-assignee]').onchange=e=>{ticket.assigned=e.target.value;showTicket();};}
createApplicationComponent(root,{
 onAction({action,id,element}){
  if(action==='navigate'){const page=model.pages.find(p=>p.id===id);root.querySelector('[data-app-heading]').textContent=page.title;root.querySelector('[data-app-description]').textContent=page.description;shell?.close();}
  if(action==='close-navigation')shell?.close();
  if(action==='select-ticket'){ticket=tickets.find(t=>t.id===id);root.querySelector('form').reset();showTicket();}
  if(action==='view-record'){const row=model.rows.find(r=>r.id===id);detail('Customer record',Object.fromEntries(model.columns.map((c,i)=>[c,row.cells[i]])));}
  if(action==='view-project'){const project=model.projects.find(p=>p.id===id);detail(project.name,{Description:project.description,Progress:project.progress+'%'});}
  if(action==='view-event'){const event=model.events.find(e=>e.id===id);detail(event.title,{Time:event.time,Location:event.location});}
  if(action==='edit-deal'){
   const lane=model.lanes.find(l=>l.deals.some(d=>d.id===id));const deal=lane.deals.find(d=>d.id===id);
   dialog(deal.company,[{name:'stage',label:'Stage',value:lane.id,options:model.lanes.map(l=>({label:l.title,value:l.id}))}],values=>{
    const target=model.lanes.find(l=>l.id===values.stage);lane.deals=lane.deals.filter(d=>d.id!==id);target.deals.push(deal);
    root.querySelectorAll('.lane')[model.lanes.indexOf(target)].append(element);
   });
  }
  if(action==='edit-profile')dialog('Edit profile',[{name:'name',label:'Full name',value:model.name},{name:'role',label:'Role',value:model.role}],values=>{Object.assign(model,values);root.querySelector('h3').textContent=model.name;root.querySelector('p').textContent=model.role;});
  if(action==='add-product'){const product=model.products.find(p=>p.id===id);cart++;total+=product.amount;root.querySelector('[data-cart-status]').textContent=`${cart} items · $${total} total`;}
  if(action==='download-receipt'){const blob=new Blob([model.title+'\n'+model.items.map(i=>i.label+': '+i.amount).join('\n')+'\nTotal: '+model.total],{type:'text/plain'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='receipt.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 },
 onSubmit({form,values,element}){
  if(form==='reply'){if(!values.reply.trim())return;ticket.replies.push(values.reply.trim());showTicket();element.reset();element.querySelector('[role=status]').textContent='Demo reply saved. Nothing was sent.';}
  if(form==='profile'){for(const field of model.fields)field.value=values[field.name];element.querySelector('[role=status]').textContent=`Profile saved for ${values.name}. Demo only.`;}
 }
});
// Real destination links open outside the iframe, rather than replacing its contents.
root.querySelectorAll('a[href]').forEach(link=>{link.target='_blank';link.rel='noopener';});

}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<main id="app"></main>', { url: 'https://example.test/', pretendToBeVisual: true });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, CustomEvent: dom.window.CustomEvent, HTMLElement: dom.window.HTMLElement, MutationObserver: dom.window.MutationObserver, IS_REACT_ACT_ENVIRONMENT: true });
const { createElement: h, StrictMode, act, createRef } = await import('react');
const { createRoot } = await import('react-dom/client');
const { Tabs, Part, UI } = await import('../src/react/index.js');
const { controllers } = await import('../src/core/util.js');
const app = document.getElementById('app');
function tabs(props = {}, values = ['a','b']) {
  return h(StrictMode, null, h(Tabs, { id:'tabs', ...props },
    h(Part, { name:'list' }, ...values.map(value => h(Part, { key:value, name:'trigger', as:'button', value }, value))),
    ...values.map(value => h(Part, { key:value, name:'panel', value }, value + ' content'))));
}
test('React Strict Mode, rerenders, current handlers, dynamic children and unmount', async () => {
  const root = createRoot(app), apiRef = createRef(); let first = 0, second = 0;
  await act(async () => root.render(tabs({ apiRef, onChange: () => first++ })));
  const node = document.getElementById('tabs'), initial = apiRef.current;
  assert.ok(initial); assert.equal(controllers(node).length, 1);
  await act(async () => node.querySelector('[data-value=b]').click());
  assert.equal(initial.value, 'b'); assert.equal(first, 1);
  await act(async () => root.render(tabs({ apiRef, onChange: () => second++ }, ['a','b','c'])));
  assert.equal(apiRef.current, initial, 'ordinary rerender preserves controller and state');
  assert.equal(initial.value, 'b');
  await act(async () => node.querySelector('[data-value=c]').click());
  assert.equal(initial.value, 'c'); assert.equal(first, 1); assert.equal(second, 1);
  await act(async () => root.render(tabs({ apiRef }, ['a','b'])));
  assert.ok(['a','b'].includes(apiRef.current.value), 'removed selection recovers');
  await act(async () => root.unmount());
  assert.equal(apiRef.current, null); assert.equal(controllers(node).length, 0); assert.equal(node.__uiTabs, undefined);
});
test('React replaces a root element and disposes raw nested controllers', async () => {
  const root = createRoot(app), apiRef = createRef();
  const view = (as, nested) => h(StrictMode,null,h(UI,{kind:'toolbar',as,apiRef},h('button',null,'Action'), nested && h('div',{'data-ui':'switch',id:'raw'})));
  await act(async () => root.render(view('div',true)));
  const old = app.firstElementChild, nested = document.getElementById('raw');
  assert.equal(controllers(nested).length,1);
  await act(async () => root.render(view('section',false)));
  assert.equal(app.firstElementChild.tagName,'SECTION'); assert.equal(controllers(old).length,0); assert.equal(controllers(nested).length,0);
  assert.ok(apiRef.current);
  await act(async () => root.unmount()); assert.equal(apiRef.current,null);
});
test('ChartPanel uses caller data, changes ranges, rerenders and escapes labels', async () => {
  const { ChartPanel } = await import('../src/react/index.js');
  const rows = Array.from({length:30},(_,i)=>({label:`Day ${i+1}`,values:[i*10,30-i]}));
  const root=createRoot(app);
  await act(async()=>root.render(h(ChartPanel,{title:'<img src=x>',rows})));
  assert.equal(app.querySelector('img'),null);
  const initial=app.querySelector('svg').innerHTML;
  for(const n of [7,14,30]){
    await act(async()=>[...app.querySelectorAll('button')].find(b=>b.textContent===`${n}d`).click());
    assert.equal(app.querySelectorAll('tbody tr').length,n);
    assert.equal(app.querySelector('[aria-pressed="true"]').textContent,`${n}d`);
    if(n!==30)assert.notEqual(app.querySelector('svg').innerHTML,initial);
  }
  await act(async()=>root.render(h(ChartPanel,{title:'Updated',rows:rows.slice(0,2)})));
  assert.equal(app.querySelectorAll('tbody tr').length,2);
  await act(async()=>root.render(h(ChartPanel,{rows:[]})));
  assert.match(app.textContent,/No data available/);
  await act(async()=>root.unmount());
});
test('All application React components render caller models and deliver action/submit callbacks', async () => {
 const fs=await import('node:fs');const api=await import('../src/react/index.js');
 const models=JSON.parse(fs.readFileSync('examples/application-models.json','utf8'));
 window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
 globalThis.AbortController=window.AbortController;
 for(const [key,{name,model}] of Object.entries(models)){
  const root=createRoot(app), actions=[],submits=[];
  const props={model,onAction:a=>actions.push(a),onSubmit:s=>submits.push(s)};
  await act(async()=>root.render(h(api[name],props)));
  assert.ok(app.querySelector(`[data-application-component="${key}"]`),key);
  for(const button of app.querySelectorAll('[data-app-action]')){
   await act(async()=>button.click());assert.equal(actions.at(-1).action,button.dataset.appAction,key);
   assert.equal(actions.at(-1).id,button.dataset.id,key);
  }
  for(const form of app.querySelectorAll('form')){
   for(const field of form.elements)if(field.tagName==='TEXTAREA')field.value='A real reply';
   await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
   assert.equal(submits.at(-1).form,form.dataset.appForm,key);
   assert.ok(Object.keys(submits.at(-1).values).length,key);
  }
  if(key==='table'){
   const input=app.querySelector('input');input.value='Maya';
   await act(async()=>input.dispatchEvent(new window.Event('input',{bubbles:true})));
   assert.equal(app.querySelectorAll('tbody tr:not([hidden])').length,1);
  }
  const changed=structuredClone(model);const field='title'in model?'title':'name'in model?'name':null;
  if(field){changed[field]='Changed <img src=x>';await act(async()=>root.render(h(api[name],{...props,model:changed})));assert.ok(app.textContent.includes(changed[field]) || app.firstElementChild.getAttribute("aria-label")===changed[field],key);assert.equal(app.querySelector('img[src=x]'),null,key);}
  await act(async()=>root.unmount());
 }
});
test('controlled tabs follow parent state without replacing their controller',async()=>{
 const root=createRoot(app),apiRef=createRef();
 await act(()=>root.render(tabs({value:'b',apiRef})));assert.equal(apiRef.current.value,'b');const initial=apiRef.current;
 await act(()=>root.render(tabs({value:'a',apiRef})));assert.equal(apiRef.current.value,'a');assert.equal(apiRef.current,initial);await act(()=>root.unmount());
});
test('application form supports explicit record reset and controlled values',async()=>{
 const {ApplicationForm}=await import('../src/react/index.js');const root=createRoot(app);
 const model={title:'Edit',action:'#',submitLabel:'Save',fields:[{name:'name',label:'Name',type:'text',value:'Alice'}]};
 await act(()=>root.render(h(ApplicationForm,{model,recordKey:'a'})));app.querySelector('input').value='Edited';
 await act(()=>root.render(h(ApplicationForm,{model:{...model,title:'Rerender'},recordKey:'a'})));assert.equal(app.querySelector('input').value,'Edited');
 await act(()=>root.render(h(ApplicationForm,{model:{...model,fields:[{...model.fields[0],value:'Bob'}]},recordKey:'b'})));assert.equal(app.querySelector('input').value,'Bob');
 await act(()=>root.render(h(ApplicationForm,{model,recordKey:'c',values:{name:'Server'},onValuesChange:()=>{}})));assert.equal(app.querySelector('input').value,'Server');await act(()=>root.unmount());
});

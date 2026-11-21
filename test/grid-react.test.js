import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createElement as h, createRef, StrictMode, act} from 'react';
import {renderToString} from 'react-dom/server';
import {ColibriGrid} from '@colibri-kit/ui/react/grid';
const columns=[{field:'name',label:'Name',editable:true},{field:'done',label:'Done',type:'boolean',editable:true}];
const rows=[{id:1,name:'<literal>',done:false},{id:2,name:'Two',done:true}];
test('server-rendered React grid escapes cell text and includes grid semantics',()=>{
 const html=renderToString(h(ColibriGrid,{rows,columns}));
 assert.match(html,/aria-rowcount="3"/);assert.match(html,/&lt;literal&gt;/);assert.doesNotMatch(html,/<literal>/);
});
test('controlled and uncontrolled ownership, prop changes, ref and unmount',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{pretendToBeVisual:true,url:'http://localhost'});
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
 const {createRoot}=await import('react-dom/client');
 const host=document.getElementById('root'),root=createRoot(host),ref=createRef();let changed;
 const render=props=>act(async()=>root.render(h(StrictMode,null,h(ColibriGrid,{ref,columns,...props}))));
 await render({rows,onRowsChange:(next,changes)=>{changed={next,changes};}});
 const check=()=>host.querySelector('input[type=checkbox]');
 await act(async()=>check().click());assert.equal(check().checked,false);assert.equal(changed.next[0].done,true);assert.equal(changed.changes[0].id,1);
 await render({rows:changed.next});assert.equal(check().checked,true);
 await act(async()=>ref.current.selectCell(1,1));assert.deepEqual(ref.current.getSelection(),{left:1,right:1,top:1,bottom:1});
 await render({rows:[],columns:[columns[0]]});assert.equal(host.querySelectorAll('[role=gridcell]').length,0);
 await render({key:'local',defaultRows:rows});await act(async()=>check().click());assert.equal(check().checked,true);
 await render({key:'local',defaultRows:rows,query:'Two'});assert.equal(host.querySelectorAll('[role=gridcell]').length,2);
 await act(async()=>root.unmount());assert.equal(ref.current,null);assert.equal(host.childElementCount,0);
});

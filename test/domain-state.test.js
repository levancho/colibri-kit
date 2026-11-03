import test from 'node:test';
import assert from 'node:assert/strict';
import {readDomainState} from '../examples/dashboards/domain-state.js';
import {CRM_KEY,CRM_SEED} from '../examples/dashboards/crm-data.js';
import {ANALYTICS_KEY,ANALYTICS_SEED} from '../examples/dashboards/analytics-data.js';

test('legacy edits migrate once into independent CRM and Analytics stores',()=>{
 const values=new Map(),previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)}});
 try{
  const legacy={deals:[{id:'legacy',name:'Existing customer',owner:'Existing owner',value:4321,stage:'Proposal'}],activity:['Existing follow-up'],reports:[{name:'Audience snapshot',csv:'"Customer","Plan"\r\n"Person","Team"'},{name:'Old sales snapshot',csv:'"Company","Value"\r\n"Existing customer","4321"'}]};
  values.set('colibri-dashboard-v1',JSON.stringify(legacy));
  const crm=readDomainState(CRM_KEY,CRM_SEED),analytics=readDomainState(ANALYTICS_KEY,ANALYTICS_SEED);
  assert.equal(crm.deals[0].name,'Existing customer');assert.deepEqual(crm.activity,['Existing follow-up']);assert.equal(analytics.deals.length,0);assert.deepEqual(analytics.reports.map(r=>r.name),['Audience snapshot']);assert.equal(analytics.contacts,undefined);assert.equal(crm.goals,undefined);
  legacy.deals[0].name='Later legacy change';values.set('colibri-dashboard-v1',JSON.stringify(legacy));
  assert.equal(readDomainState(CRM_KEY,CRM_SEED).deals[0].name,'Existing customer','migration cannot remain coupled to the legacy store');
  assert.ok(values.has('colibri-dashboard-v1'),'legacy source remains available');
 }finally{if(previous)Object.defineProperty(globalThis,'localStorage',previous);else delete globalThis.localStorage;}
});

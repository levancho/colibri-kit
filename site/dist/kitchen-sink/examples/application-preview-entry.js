import { mountApplicationExample } from './application-preview.js';
const root=document.querySelector('[data-application-component]');
const samples=await fetch(new URL('./application-models.json',import.meta.url)).then(r=>r.json());
mountApplicationExample(root,samples[root.dataset.applicationComponent].model);

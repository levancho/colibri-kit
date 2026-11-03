import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';
test('gallery, registry and CLI expose the same adapter inventory and explicit support',()=>{
 const registry=JSON.parse(fs.readFileSync('registry/colibri.json')).items;
 const matrix=JSON.parse(fs.readFileSync('site/src/framework-support.json'));
 assert.equal(matrix.length,registry.length);
 for(const item of registry){assert.ok(item.support);assert.ok(item.adapters);if(item.name.startsWith('application-'))for(const language of ['react','ftl','thymeleaf'])assert.ok(item.adapters[language],item.name+language);}
 const text=execFileSync(process.execPath,['bin/colibri.mjs','view','application-chart','--language','ftl'],{encoding:'utf8'});assert.match(text,/application-chart.ftl/);assert.match(text,/chartPanel/);
});

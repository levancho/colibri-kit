// Docker Desktop shared-file streaming can stall browser fixture loads. Serve a
// private Linux-filesystem snapshot; the host project remains mounted read-only.
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'colibri-browser-matrix-'));
try{
 fs.mkdirSync(path.join(directory,'site'),{recursive:true});fs.cpSync('site/dist',path.join(directory,'site/dist'),{recursive:true});
 fs.mkdirSync(path.join(directory,'test/e2e'),{recursive:true});
 for(const name of ['cross-browser.mjs','server.mjs'])fs.copyFileSync('test/e2e/'+name,path.join(directory,'test/e2e',name));
 fs.copyFileSync('package.json',path.join(directory,'package.json'));fs.symlinkSync(path.resolve('node_modules'),path.join(directory,'node_modules'),'dir');
 console.log('Testing read-only artifact snapshot:',JSON.parse(fs.readFileSync(path.join(directory,'site/dist/release.json'))).release);
 const result=spawnSync(process.execPath,['test/e2e/cross-browser.mjs'],{cwd:directory,stdio:'inherit',env:process.env});if(result.error)throw result.error;process.exitCode=result.status??1;
}finally{fs.rmSync(directory,{recursive:true,force:true});}

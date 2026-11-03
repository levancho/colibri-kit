import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export function createManifest(directory){
 const files={};function walk(dir){for(const name of fs.readdirSync(dir).sort()){const file=path.join(dir,name);if(fs.statSync(file).isDirectory())walk(file);else{const relative=path.relative(directory,file).replaceAll(path.sep,'/');if(relative!=='release.json')files[relative]=hash(fs.readFileSync(file));}}}walk(directory);
 const manifest={version:1,release:hash(JSON.stringify(files)),files};fs.writeFileSync(path.join(directory,'release.json'),JSON.stringify(manifest,null,2)+'\n');return manifest;
}
export async function verifyRelease(directory,base,request=fetch){
 const expected=JSON.parse(fs.readFileSync(path.join(directory,'release.json')));
 const get=async file=>{const response=await request(new URL(file,base.endsWith('/')?base:base+'/'));if(!response.ok)throw new Error(`${file}: HTTP ${response.status}`);return Buffer.from(await response.arrayBuffer());};
 const live=JSON.parse((await get('release.json')).toString());if(live.release!==expected.release)throw new Error('Deployed release manifest does not match tested artifacts');
 const selected=Object.keys(expected.files).filter(file=>file==='index.html'||file==='application-components.html'||file==='framework-support.json'||file.endsWith('.jar')||/^css\//.test(file)||/^ui\/src\/(core|react)\//.test(file)||/^kitchen-sink\/examples\/dashboards\/.*\.(html|js)$/.test(file));
 for(const file of selected)if(hash(await get(file))!==expected.files[file])throw new Error(`Deployed asset mismatch: ${file}`);
 return selected.length;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [command,directory='site/dist',base]=process.argv.slice(2);
 if(command==='create')console.log('Release manifest:',createManifest(directory).release);
 else if(command==='verify')console.log('Verified deployed assets:',await verifyRelease(directory,base));
 else throw new Error('Usage: site-manifest.mjs create DIR | verify DIR BASE_URL');
}

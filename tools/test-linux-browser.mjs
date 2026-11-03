// Optional reproducible browser matrix for hosts whose native browser cannot launch.
import fs from 'node:fs';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';
const directory=fileURLToPath(new URL('../',import.meta.url));
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url)));
const version=pkg.devDependencies['@playwright/test'];
const result=spawnSync('docker',['run','--rm','--init','--ipc=host','--mount',`type=bind,source=${directory},target=/work,readonly`,'--workdir','/work','--env',`PROGRESS=${process.env.PROGRESS||''}`,'--env',`BROWSERS=${process.env.BROWSERS||'chromium,firefox,webkit'}`,`mcr.microsoft.com/playwright:v${version}-noble`,'node','tools/isolated-browser-run.mjs'],{stdio:'inherit'});
if(result.error)throw result.error;process.exitCode=result.status??1;

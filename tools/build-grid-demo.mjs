// Bundle the published React entry point used by the interactive Kit example.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dest=path.join(root,'site/dist/grid/integrations');
for(const [from,to] of [['src/react/grid.js','react-grid.js'],['src/react/clipboard.js','clipboard.js'],['freemarker/grid.ftl','grid.ftl'],['thymeleaf/grid.html','grid.th.html']]){
  fs.copyFileSync(path.join(root,from),path.join(dest,to));
}
await build({entryPoints:[path.join(dest,'projects.jsx')],alias:{'@colibri-kit/ui/react/grid':path.join(root,'src/react/grid.js')},bundle:true,minify:true,legalComments:'inline',outfile:path.join(dest,'projects.bundle.js'),define:{'process.env.NODE_ENV':'"production"'}});

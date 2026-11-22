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
await build({entryPoints:[path.join(dest,'projects.jsx')],alias:{'@colibri-kit/ui/react/grid':path.join(root,'src/react/grid.js')},bundle:true,format:"esm",minify:true,legalComments:'inline',outfile:path.join(dest,'projects.bundle.js'),define:{'process.env.NODE_ENV':'"production"'}});
const grid = path.dirname(dest);
await build({
  entryPoints: [path.join(dest, 'applications.jsx')], bundle: true, format: 'esm', minify: true,
  external: ['/grid/*'], outfile: path.join(dest, 'applications.bundle.js'),
  define: { 'process.env.NODE_ENV': '"production"' },
});
await build({
  entryPoints: [path.join(root, 'tools/grid-highlight.js')], bundle: true, format: 'esm',
  minify: true, outfile: path.join(grid, 'samples/highlight.bundle.js'),
  banner: { js: '/*! ' + fs.readFileSync(path.join(root, 'node_modules/prismjs/LICENSE'), 'utf8') + ' */' },
});

// Derive the source browser's file relationships from the imports the bundler resolves.
const entries = ['sample.js', 'tree-example.js', 'inventory.js', 'editing-example.js', 'examples/trading/trading.js'];
for (const dir of ['samples/examples', 'samples/react'])
  for (const name of fs.readdirSync(path.join(grid, dir)).sort()) entries.push(dir + '/' + name);
const graph = await build({
  absWorkingDir: grid, entryPoints: entries, bundle: true, write: false, outdir: 'unused',
  format: 'esm', ignoreAnnotations: true, packages: 'external', external: ['/grid/*'], metafile: true,
  alias: { '@colibri-kit/ui/react/grid': './integrations/react-grid.js' },
});
const imports = {};
for (const name of Object.keys(graph.metafile.inputs).sort()) {
  imports[name] = graph.metafile.inputs[name].imports
    .filter(i => !i.external || i.path.startsWith('/grid/'))
    .map(i => i.path.replace(/^\/grid\//, ''));
}

for (const file of ['ui/themes/packs/index.css', 'ui/themes/colibri.css', 'css/colibri.css']) {
  const source = file.startsWith('ui/') ? file.slice(3) : 'packages/colibri-css/dist/colibri.css';
  const contents = fs.readFileSync(path.join(root, source), 'utf8');
  const styles = [...contents.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']/g)]
    .map(match => path.posix.resolve('/', path.posix.dirname(file), match[1]));
  if (styles.length) imports['/' + file] = styles;
}
fs.writeFileSync(path.join(grid, 'samples/source-files.json'), JSON.stringify(imports, null, 2) + '\n');

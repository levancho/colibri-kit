// Maintainer build: minified Colibri UI distributions in dist/. Consumers never need to run this.
//   dist/colibri-ui.min.js      everything, one file (the minified equivalent of src/core/auto.js)
//   dist/lazy/auto-lazy.js      minified lazy loader plus one small chunk per controller module
//   dist/colibri-ui.min.css     minified themes/colibri.css
//   dist/bundle-sizes.json      raw and gzip sizes, so documentation can quote measured numbers
import fs from "node:fs"; import path from "node:path"; import url from "node:url";
import { build, transform } from "esbuild";
import { gzipSync } from "fflate";

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), ".."), dist = path.join(root, "dist");
const banner = "/*! Colibri UI — headless components. MIT. https://colibri-kit.io */";
fs.rmSync(dist, { recursive: true, force: true }); fs.mkdirSync(dist, { recursive: true });

const common = { bundle: true, format: "esm", minify: true, target: "es2022", legalComments: "none", banner: { js: banner }, logLevel: "warning" };
await build({ ...common, entryPoints: [path.join(root, "src/core/auto.js")], outfile: path.join(dist, "colibri-ui.min.js") });
await build({ ...common, entryPoints: [path.join(root, "src/core/auto-lazy.js")], outdir: path.join(dist, "lazy"), splitting: true, chunkNames: "chunks/[name]-[hash]" });

const css = await transform(fs.readFileSync(path.join(root, "themes/colibri.css"), "utf8"), { loader: "css", minify: true, legalComments: "none" });
fs.writeFileSync(path.join(dist, "colibri-ui.min.css"), banner.replace("headless components", "theme") + "\n" + css.code);

const size = (file) => { const bytes = fs.readFileSync(file); return { bytes: bytes.length, gzip: gzipSync(bytes, { level: 6, mtime: 0 }).length }; };
const chunks = fs.readdirSync(path.join(dist, "lazy/chunks")).map((f) => size(path.join(dist, "lazy/chunks", f)));
const sizes = {
  "src/core (unminified, all modules)": { bytes: fs.readdirSync(path.join(root, "src/core")).reduce((n, f) => n + fs.statSync(path.join(root, "src/core", f)).size, 0) },
  "colibri-ui.min.js": size(path.join(dist, "colibri-ui.min.js")),
  "lazy/auto-lazy.js": size(path.join(dist, "lazy/auto-lazy.js")),
  "lazy/chunks": { files: chunks.length, bytes: chunks.reduce((n, c) => n + c.bytes, 0), gzip: chunks.reduce((n, c) => n + c.gzip, 0) },
  "themes/colibri.css": size(path.join(root, "themes/colibri.css")),
  "colibri-ui.min.css": size(path.join(dist, "colibri-ui.min.css")),
};
fs.writeFileSync(path.join(dist, "bundle-sizes.json"), JSON.stringify(sizes, null, 2) + "\n");
console.log("built dist/:", Object.entries(sizes).map(([k, v]) => `${k} ${v.bytes}b${v.gzip ? ` (${v.gzip}b gzip)` : ""}`).join(", "));

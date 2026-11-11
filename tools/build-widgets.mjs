// Builds site/dist/widgets/embed.js: the widget renderer plus Colibri CSS in one self-contained script.
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outfile = path.join(root, "site/dist/widgets/embed.js");
await build({
  entryPoints: [path.join(root, "tools/widget-embed.src.js")],
  outfile, bundle: true, minify: true, format: "iife", target: "es2022", legalComments: "none",
  loader: { ".css": "text" },
  banner: { js: "/* Colibri widgets — https://colibri-kit.io/widgets/ — MIT */" },
});
console.log(`built site/dist/widgets/embed.js (${Math.ceil(fs.statSync(outfile).size / 1024)} KiB)`);

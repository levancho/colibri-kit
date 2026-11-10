import { gzipSync } from "fflate";
import { transform } from "esbuild";
// Maintainer build: concatenate CSS and measure gzip using a pinned, portable compressor.
import fs from "node:fs"; import path from "node:path"; import url from "node:url";
const here = path.dirname(url.fileURLToPath(import.meta.url)), src = path.join(here, "src"), dist = path.join(here, "dist");
const files = fs.readdirSync(src).filter((f) => f.endsWith(".css")).sort();
const read = (f) => `/* ---- ${f} ---- */\n` + fs.readFileSync(path.join(src, f), "utf8");
const banner = "/*! Colibri CSS — modern, layered, token-first. MIT */\n";
fs.mkdirSync(dist, { recursive: true });
const core = files.filter((f) => !f.includes("bridge"));
fs.writeFileSync(path.join(dist, "colibri.css"), banner + core.map(read).join("\n"));
fs.writeFileSync(path.join(dist, "colibri-ui-bridge.css"), banner + read(files.find((f) => f.includes("bridge"))));
// A real CSS minifier: the regex that used to live here removed the space in `& :where(th, td)` and so turned
// descendant selectors into compound ones (tables lost their cell padding in the minified file).
const min = async (s) => banner + (await transform(s, { loader: "css", minify: true, legalComments: "none" })).code;
fs.writeFileSync(path.join(dist, "colibri.min.css"), await min(fs.readFileSync(path.join(dist, "colibri.css"), "utf8")));
fs.rmSync(path.join(dist, "colibri-classes.css"), { force: true });

// Class names Colibri CSS owns. Published so applications (and agents) can avoid defining the same names,
// and used to build the opt-in prefixed stylesheet for projects that already use names like .card or .center.
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const classNames = [...new Set(["40-layout.css", "50-components.css", "60-utilities.css"].flatMap((f) =>
  [...stripComments(fs.readFileSync(path.join(src, f), "utf8")).matchAll(/(?<![\w-])\.([a-z][a-z0-9-]*)/g)].map((m) => m[1])))].sort();
export const PREFIX = "c-";
// A class selector is a dot followed by one of the names and then a non-name character. No look-behind on what
// precedes the dot: `dialog.card` and `a.btn` are class selectors too. Cascade-layer names (colibri.layout) are
// not in the list, and the kit has no class-like text inside strings or url().
const classSelector = new RegExp(`\\.(${classNames.join("|")})(?![\\w-])`, "g");
export const prefixClasses = (css) => css.replace(classSelector, `.${PREFIX}$1`);
fs.writeFileSync(path.join(dist, "colibri-classes.json"), JSON.stringify({ prefix: PREFIX, classes: classNames }, null, 2) + "\n");
const prefixed = prefixClasses(fs.readFileSync(path.join(dist, "colibri.css"), "utf8"))
  .replace(banner, banner + `/* Prefixed build: every Colibri class is .${PREFIX}*, e.g. .${PREFIX}card, .${PREFIX}stack. Tokens, layers and data attributes are unchanged. */\n`);
fs.writeFileSync(path.join(dist, "colibri.prefixed.css"), prefixed);
fs.writeFileSync(path.join(dist, "colibri.prefixed.min.css"), await min(prefixed));
console.log("built", files.length, "files ->", fs.readdirSync(dist).map((f) => f + " " + fs.statSync(path.join(dist, f)).size + "b").join(", "));

const applicationSources = ["records", "components", "shell", "identity", "compositions"];
fs.writeFileSync(path.join(dist, "colibri-applications.css"), banner + fs.readFileSync(path.join(src,"00-layers.css"),"utf8") + applicationSources.map(name => fs.readFileSync(path.join(here,"applications",name+".css"),"utf8")).join("\n"));

const sizes=Object.fromEntries(['colibri.css','colibri-applications.css','colibri-ui-bridge.css'].map(name=>{const bytes=fs.readFileSync(path.join(dist,name));return [name,{bytes:bytes.length,gzip:gzipSync(bytes,{level:6,mtime:0}).length}];}));
fs.writeFileSync(path.join(dist,'bundle-sizes.json'),JSON.stringify(sizes,null,2)+'\n');

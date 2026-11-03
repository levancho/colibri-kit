import { gzipSync } from "node:zlib";
// Concatenates src/*.css into dist/. No dependencies.
import fs from "node:fs"; import path from "node:path"; import url from "node:url";
const here = path.dirname(url.fileURLToPath(import.meta.url)), src = path.join(here, "src"), dist = path.join(here, "dist");
const files = fs.readdirSync(src).filter((f) => f.endsWith(".css")).sort();
const read = (f) => `/* ---- ${f} ---- */\n` + fs.readFileSync(path.join(src, f), "utf8");
const banner = "/*! Colibri CSS — modern, layered, token-first. MIT */\n";
fs.mkdirSync(dist, { recursive: true });
const core = files.filter((f) => !f.includes("bridge"));
fs.writeFileSync(path.join(dist, "colibri.css"), banner + core.map(read).join("\n"));
fs.writeFileSync(path.join(dist, "colibri-ui-bridge.css"), banner + read(files.find((f) => f.includes("bridge"))));
const min = (s) => s.replace(/\/\*(?!!)[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*([{}:;,>])\s*/g, "$1").replace(/;}/g, "}");
fs.writeFileSync(path.join(dist, "colibri.min.css"), min(fs.readFileSync(path.join(dist, "colibri.css"), "utf8")));
fs.rmSync(path.join(dist, "colibri-classes.css"), { force: true });
console.log("built", files.length, "files ->", fs.readdirSync(dist).map((f) => f + " " + fs.statSync(path.join(dist, f)).size + "b").join(", "));

const applicationSources = ["records", "components", "shell", "identity", "compositions"];
fs.writeFileSync(path.join(dist, "colibri-applications.css"), banner + fs.readFileSync(path.join(src,"00-layers.css"),"utf8") + applicationSources.map(name => fs.readFileSync(path.join(here,"applications",name+".css"),"utf8")).join("\n"));

const sizes=Object.fromEntries(['colibri.css','colibri-applications.css','colibri-ui-bridge.css'].map(name=>{const bytes=fs.readFileSync(path.join(dist,name));return [name,{bytes:bytes.length,gzip:gzipSync(bytes).length}];}));
fs.writeFileSync(path.join(dist,'bundle-sizes.json'),JSON.stringify(sizes,null,2)+'\n');

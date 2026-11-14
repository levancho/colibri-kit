// Writes the code sample for every React Native demo (site/dist/native/code.json, { id: source }).
// A sample is the demo's own source, so it cannot drift from what runs on the phone: the Demo component, the
// file-level helpers and data it uses, and the imports those need. Parsed with @babel/parser, not regular expressions.
import { parse } from "@babel/parser";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "examples/native/demos");

/** Every identifier a node mentions (JSX tags included), ignoring property names. */
function namesIn(node, out = new Set()) {
  if (!node || typeof node !== "object") return out;
  if (Array.isArray(node)) { for (const item of node) namesIn(item, out); return out; }
  if (node.type === "Identifier" || node.type === "JSXIdentifier") out.add(node.name);
  for (const [key, value] of Object.entries(node)) {
    if (key === "loc" || key === "start" || key === "end" || key === "type") continue;
    if (node.type === "MemberExpression" && key === "property" && !node.computed) continue;
    if (node.type === "JSXMemberExpression" && key === "property") continue;
    if ((node.type === "ObjectProperty" || node.type === "ObjectMethod") && key === "key" && !node.computed) continue;
    if (node.type === "JSXAttribute" && key === "name") continue;
    namesIn(value, out);
  }
  return out;
}
const dedent = (text) => {
  const lines = text.split("\n"), indents = lines.slice(1).filter((line) => line.trim()).map((line) => line.match(/^ */)[0].length);
  const cut = indents.length ? Math.min(...indents) : 0;
  return [lines[0], ...lines.slice(1).map((line) => line.slice(cut))].join("\n");
};

export function samplesFor(file) {
  const source = fs.readFileSync(file, "utf8");
  const ast = parse(source, { sourceType: "module", plugins: ["jsx"] }).program;
  const text = (node) => source.slice(node.start, node.end);
  const imports = new Map(); // local name → { from, spec }
  const locals = new Map(); // top-level name → declaration node
  let entries = [];
  for (const node of ast.body) {
    if (node.type === "ImportDeclaration") {
      for (const spec of node.specifiers) imports.set(spec.local.name, { from: node.source.value, spec: spec.type === "ImportSpecifier" ? (spec.imported.name === spec.local.name ? spec.local.name : `${spec.imported.name} as ${spec.local.name}`) : null, whole: spec.type !== "ImportSpecifier" ? text(spec) : null });
    } else if (node.type === "FunctionDeclaration") locals.set(node.id.name, node);
    else if (node.type === "VariableDeclaration") for (const declarator of node.declarations) for (const name of namesIn(declarator.id)) locals.set(name, node);
    else if (node.type === "ExportDefaultDeclaration" && node.declaration.type === "ArrayExpression") entries = node.declaration.elements;
  }
  const samples = {};
  for (const entry of entries) {
    if (entry?.type !== "ObjectExpression") continue;
    const prop = (key) => entry.properties.find((property) => property.key?.name === key)?.value;
    const id = prop("id")?.value, demo = prop("Demo");
    if (!id || !demo) continue;
    // Pull in the helpers the demo uses, and the helpers those use.
    const needed = new Set(), queue = [demo];
    while (queue.length) for (const name of namesIn(queue.pop())) if (locals.has(name) && !needed.has(locals.get(name))) { needed.add(locals.get(name)); queue.push(locals.get(name)); }
    const helpers = [...needed].sort((a, b) => a.start - b.start);
    const used = new Set(), bySource = new Map();
    for (const node of [demo, ...helpers]) for (const name of namesIn(node)) used.add(name);
    for (const [name, info] of imports) {
      if (!used.has(name)) continue;
      const bucket = bySource.get(info.from) ?? { named: [], whole: [] };
      (info.spec ? bucket.named : bucket.whole).push(info.spec ?? info.whole); bySource.set(info.from, bucket);
    }
    const order = ["react", "react-native", "@colibri-kit/native-core", "@colibri-kit/native-full"];
    const lines = [...bySource].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0])).map(([from, { named, whole }]) => `import ${[...whole, named.length ? `{ ${named.join(", ")} }` : ""].filter(Boolean).join(", ")} from "${from}";`);
    const body = demo.type === "Identifier" ? `export default ${demo.name};` : demo.type === "ArrowFunctionExpression" || demo.type === "FunctionExpression" ? `export default ${dedent(text(demo)).replace(/^\(\) => /, "function Example() ").replace(/^function Example\(\) \(([\s\S]*)\)$/, (_, jsx) => `function Example() {\n  return (${jsx.split("\n").map((line, index) => (index ? "  " + line : line)).join("\n")});\n}`)}` : `export default ${text(demo)};`;
    samples[id] = [lines.join("\n"), ...helpers.map((node) => dedent(text(node))), body].filter(Boolean).join("\n\n") + "\n";
  }
  return samples;
}

export function allSamples() {
  const samples = {};
  for (const name of fs.readdirSync(dir).filter((file) => file.endsWith(".js") && file !== "index.js").sort()) Object.assign(samples, samplesFor(path.join(dir, name)));
  return samples;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outfile = path.resolve(process.argv[2] ?? path.join(root, "site/dist/native/code.json")), samples = allSamples();
  fs.mkdirSync(path.dirname(outfile), { recursive: true });
  fs.writeFileSync(outfile, JSON.stringify(samples));
  console.log(`wrote ${Object.keys(samples).length} code samples to ${path.relative(root, outfile)} (${Math.ceil(fs.statSync(outfile).size / 1024)} KiB)`);
}

// Writes the API reference for the React Native documentation page (site/dist/native/reference.json).
// It is read from the TypeScript declarations of both packages, so the documented props are the declared
// props: every exported component and hook, its props with types and comments, which edition it belongs to
// (Core or Full), the libraries it needs, and the demo that shows it.
import { parse } from "@babel/parser";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = path.join(root, "packages");
const FULL = { gestures: ["react-native-reanimated", "react-native-gesture-handler"], svg: ["react-native-svg"], "safe-area": ["react-native-safe-area-context"] };
// [declaration file, group id used by the catalog, title]
const FILES = [
  ["colibri-native-core/index.d.ts", "core", "Basics"], ["colibri-native-core/types/mobile.d.ts", "mobile", "Phone patterns"], ["colibri-native-core/types/base.d.ts", "base", "Display"],
  ["colibri-native-core/types/data.d.ts", "data", "Data display"], ["colibri-native-core/types/menus.d.ts", "menus", "Overlays"], ["colibri-native-core/types/navigation.d.ts", "navigation", "Navigation"],
  ["colibri-native-core/types/forms.d.ts", "forms", "Forms"], ["colibri-native-core/types/pickers.d.ts", "pickers", "Pickers"], ["colibri-native-core/types/conversation.d.ts", "conversation", "Conversation"],
  ["colibri-native-core/types/ai.d.ts", "ai", "AI elements"], ["colibri-native-core/types/motion.d.ts", "motion", "Motion and theming"], ["colibri-native-core/types/blocks.d.ts", "blocks", "Auth blocks"],
  ["colibri-native-core/types/sidebars.d.ts", "sidebars", "Nav layouts"], ["colibri-native-core/types/applications.d.ts", "applications", "App components"],
  ["colibri-native-full/types/gestures.d.ts", "gestures", "Gestures"], ["colibri-native-full/types/svg.d.ts", "svg", "Charts and icons"], ["colibri-native-full/types/safe-area.d.ts", "safe-area", "Safe areas"],
];
const clean = (comments) => (comments ?? []).filter((c) => c.type === "CommentBlock" && c.value.startsWith("*")).map((c) => c.value.replace(/^\*+/, "").split("\n").map((line) => line.replace(/^\s*\* ?/, "").trim()).join(" ").trim()).join(" ").replace(/\s+/g, " ");
const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

// Demo ids and titles, to link a component to the demo that shows it.
const demos = [];
for (const file of fs.readdirSync(path.join(root, "examples/native/demos")).filter((name) => name.endsWith(".js") && name !== "index.js")) {
  for (const match of fs.readFileSync(path.join(root, "examples/native/demos", file), "utf8").matchAll(/\{ id: "([a-z0-9-]+)", title: "([^"]+)"/g)) demos.push({ id: match[1], title: match[2], group: file.replace(".js", "") });
}
function demoFor(name, group) {
  const ids = [kebab(name), `gesture-${kebab(name)}`, `svg-${kebab(name)}`, `safe-${kebab(name).replace(/^safe-/, "")}`];
  const own = demos.filter((demo) => demo.group === group);
  return (own.find((demo) => ids.includes(demo.id)) ?? own.find((demo) => demo.title.split(/[^A-Za-z0-9]+/).includes(name)) ?? demos.find((demo) => ids.includes(demo.id)))?.id ?? null;
}

// Props interfaces from every file, so a Full component that extends a Core one lists the Core props too.
const everyInterface = new Map();
const parsed = FILES.map(([file, id, title]) => {
  const source = fs.readFileSync(path.join(pkg, file), "utf8");
  return { file, id, title, source, ast: parse(source, { sourceType: "module", plugins: [["typescript", { dts: true }]] }).program };
});
const groups = [];
for (const pass of ["collect", "build"]) for (const { file, id, title, source, ast } of parsed) {
  const text = (node) => source.slice(node.start, node.end).replace(/\s+/g, " ");
  const interfaces = new Map(), aliases = new Map(), values = [], renamed = new Map();
  for (const statement of ast.body) {
    if (statement.type === "ImportDeclaration") { for (const spec of statement.specifiers) if (spec.imported && spec.imported.name !== spec.local.name) renamed.set(spec.local.name, spec.imported.name); continue; }
    const node = statement.type === "ExportNamedDeclaration" ? statement.declaration : statement;
    if (!node) continue;
    const doc = clean(statement.leadingComments);
    if (node.type === "TSInterfaceDeclaration") {
      interfaces.set(node.id.name, { extends: (node.extends ?? []).map(text), members: node.body.body.filter((member) => member.type === "TSPropertySignature" || member.type === "TSMethodSignature").map((member) => ({
        name: member.key.name ?? member.key.value, optional: Boolean(member.optional), doc: clean(member.leadingComments),
        type: member.type === "TSPropertySignature" ? text(member.typeAnnotation.typeAnnotation) : `(${(member.parameters ?? member.params ?? []).map(text).join(", ")}) => ${member.typeAnnotation ? text(member.typeAnnotation.typeAnnotation) : "void"}` })) });
    } else if (node.type === "TSTypeAliasDeclaration") aliases.set(node.id.name, text(node.typeAnnotation));
    else if (statement.type !== "ExportNamedDeclaration") continue;
    else if (node.type === "VariableDeclaration") for (const item of node.declarations) values.push({ name: item.id.name, doc, annotation: item.id.typeAnnotation ? text(item.id.typeAnnotation.typeAnnotation) : "" });
    else if (node.type === "TSDeclareFunction") values.push({ name: node.id.name, doc, fn: true, params: node.params.map(text), first: node.params[0]?.typeAnnotation ? text(node.params[0].typeAnnotation.typeAnnotation) : "", returns: node.returnType ? text(node.returnType.typeAnnotation) : "void" });
  }
  if (pass === "collect") { for (const [name, found] of interfaces) if (!everyInterface.has(name)) everyInterface.set(name, found); continue; }
  const components = [];
  for (const value of values) {
    const isComponent = /^[A-Z]/.test(value.name) && !/^[A-Z0-9_]+$/.test(value.name);
    const item = { name: value.name, doc: value.doc, kind: isComponent ? "component" : value.name.startsWith("use") ? "hook" : value.fn ? "function" : "value", demo: isComponent ? demoFor(value.name, id) : null, props: [], extends: [] };
    const propsType = isComponent ? (value.fn ? value.first : value.annotation.match(/<\s*([A-Za-z0-9_]+)/)?.[1] ?? "").replace(/<.*$/, "") : "";
    // Follow the props interface and the local interfaces it extends; name the outside ones.
    const seen = new Set(), walk = (name) => {
      const bare = name.replace(/<.*$/, ""), found = interfaces.get(bare) ?? everyInterface.get(renamed.get(bare) ?? bare);
      if (!found) { if (name && !seen.has(name)) item.extends.push(name); return; }
      if (seen.has(name)) return; seen.add(name);
      for (const member of found.members) if (!item.props.some((prop) => prop.name === member.name)) item.props.push(member);
      found.extends.forEach(walk);
    };
    if (propsType) { if (interfaces.has(propsType)) walk(propsType); else if (aliases.has(propsType)) item.signature = aliases.get(propsType); }
    // Declared as "typeof Other" or with an inline type: show the declaration itself.
    if (isComponent && !item.props.length && !item.extends.length && !item.signature) item.signature = value.fn ? `${value.name}(${value.params.join(", ")})` : value.annotation;
    if (!isComponent) item.signature = value.fn ? `${value.name}(${value.params.join(", ")}): ${value.returns}` : value.annotation;
    components.push(item);
  }
  groups.push({ id, title, edition: FULL[id] ? "full" : "core", requires: FULL[id] ?? [], importFrom: FULL[id] ? "@colibri-kit/native-full" : "@colibri-kit/native-core", part: FULL[id] ? `@colibri-kit/native-full/${id}` : null, components });
}
const count = (edition, kind) => groups.filter((group) => group.edition === edition).reduce((sum, group) => sum + group.components.filter((item) => item.kind === kind).length, 0);
const out = { counts: { core: count("core", "component"), full: count("full", "component"), coreHooks: count("core", "hook"), fullHooks: count("full", "hook") }, groups };
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outfile = path.resolve(process.argv[2] ?? path.join(root, "site/dist/native/reference.json"));
  fs.mkdirSync(path.dirname(outfile), { recursive: true }); fs.writeFileSync(outfile, JSON.stringify(out));
  const undocumented = groups.flatMap((group) => group.components.filter((item) => item.kind === "component" && !item.props.length && !item.signature && !item.extends.length).map((item) => item.name));
  console.log(`wrote the reference for ${out.counts.core} Core and ${out.counts.full} Full components to ${path.relative(root, outfile)} (${Math.ceil(fs.statSync(outfile).size / 1024)} KiB); without props: ${undocumented.length ? undocumented.join(", ") : "none"}; without a demo: ${groups.flatMap((g) => g.components.filter((i) => i.kind === "component" && !i.demo).map((i) => i.name)).length}`);
}
export default out;

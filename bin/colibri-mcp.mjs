#!/usr/bin/env node
// Colibri UI MCP server (stdio, JSON-RPC 2.0; MCP 2024-11-05 tool subset). Lets AI assistants search, read and
// copy Colibri components/blocks, like the shadcn MCP server.
//   Claude Code / Cursor config:  { "mcpServers": { "colibri": { "command": "node", "args": ["<path>/bin/colibri-mcp.mjs"] } } }
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url"; import readline from "node:readline";
const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reg = () => JSON.parse(fs.readFileSync(path.join(PKG, "registry/colibri.json"), "utf8"));
const score = (it, q) => { q = q.toLowerCase(); const hay = [it.name, it.title, it.description, it.whenToUse, it.shadcn, it.group].join(" ").toLowerCase();
  return q.split(/\s+/).filter(Boolean).reduce((s, w) => s + (it.name === w ? 10 : 0) + (it.name.includes(w) ? 4 : 0) + (it.title.toLowerCase().includes(w) ? 3 : 0) + (hay.includes(w) ? 1 : 0), 0); };
const TOOLS = [
  { name: "get_project_info", description: "Colibri UI package info: files to include, markup rules, counts, all component and block names.", inputSchema: { type: "object", properties: {} } },
  { name: "list_items", description: "List Colibri components/blocks with status.", inputSchema: { type: "object", properties: { type: { type: "string", enum: ["component", "block", "motion"] } } } },
  { name: "search_items", description: "Search components and blocks by keywords (e.g. 'login with google', 'collapsible sidebar').", inputSchema: { type: "object", properties: { query: { type: "string" }, limit: { type: "number" } }, required: ["query"] } },
  { name: "view_item", description: "Full entry for one item: description, when to use, accessibility, parts, HTML markup and FreeMarker snippet.", inputSchema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] } },
  { name: "get_theme_tokens", description: "The --ui-* CSS custom properties (design tokens) and how to override them.", inputSchema: { type: "object", properties: {} } },
];
function call(name, a = {}) {
  const r = reg();
  if (name === "get_project_info") return { name: r.name, version: r.version, files: r.files, rules: r.rules, components: r.items.filter((i) => i.type === "component").map((i) => i.name), blocks: r.items.filter((i) => i.type === "block").map((i) => i.name) };
  if (name === "list_items") return r.items.filter((i) => !a.type || i.type === a.type).map(({ name, title, type, status }) => ({ name, title, type, status }));
  if (name === "search_items") return r.items.map((i) => [score(i, a.query || ""), i]).filter(([s]) => s > 0).sort((x, y) => y[0] - x[0]).slice(0, a.limit || 8).map(([, i]) => ({ name: i.name, title: i.title, description: i.description }));
  if (name === "view_item") { const i = r.items.find((x) => x.name === a.name); if (!i) throw new Error(`no item ${a.name}`); return i; }
  if (name === "get_theme_tokens") { const css = fs.readFileSync(path.join(PKG, "themes/colibri.css"), "utf8"); const toks = [...new Set(css.match(/--ui-[a-z0-9-]+(?=\s*:)/g))];
    return { tokens: toks, override: ":root{--ui-primary:#0e7490;--ui-radius:12px}  or scope: .my-area{--ui-primary:…}; dark mode: [data-theme=dark]; accents: <html data-ui-theme=\"green|rose|orange|violet|blue\">" }; }
  throw new Error(`unknown tool ${name}`);
}
const send = (m) => process.stdout.write(JSON.stringify(m) + "\n");
readline.createInterface({ input: process.stdin }).on("line", (line) => {
  let m; try { m = JSON.parse(line); } catch { send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse error" } }); return; }
  // a line holding null, a number, a string or a batch array is not a request this server handles
  if (!m || typeof m !== "object" || Array.isArray(m)) { send({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "invalid request" } }); return; }
  const ok = (result) => m.id !== undefined && send({ jsonrpc: "2.0", id: m.id, result });
  try {
    if (m.method === "initialize") ok({ protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "@colibri-kit/ui", version: reg().version } });
    else if (m.method === "tools/list") ok({ tools: TOOLS });
    else if (m.method === "tools/call" && (!m.params || typeof m.params.name !== "string")) send({ jsonrpc: "2.0", id: m.id ?? null, error: { code: -32602, message: "tools/call needs params.name" } });
    else if (m.method === "tools/call") ok({ content: [{ type: "text", text: JSON.stringify(call(m.params.name, m.params.arguments), null, 1) }] });
    else if (m.method === "ping") ok({});
    else if (m.id !== undefined && !m.method?.startsWith("notifications/")) send({ jsonrpc: "2.0", id: m.id, error: { code: -32601, message: `method not found: ${m.method}` } });
  } catch (e) { m.id !== undefined && send({ jsonrpc: "2.0", id: m.id, result: { isError: true, content: [{ type: "text", text: String(e.message) }] } }); }
});

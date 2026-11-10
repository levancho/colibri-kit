// Events and controller members in the registry are read from src/core by tools/sink_events.py.
// These spot checks pin the extraction against controllers whose contract other tests exercise.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const items = Object.fromEntries(JSON.parse(fs.readFileSync("registry/colibri.json", "utf8")).items.map((i) => [i.name, i]));
const event = (name, ev) => items[name].events.find((e) => e.name === ev);

test("tabs: ui:change carries value and previous", () => {
  assert.deepEqual(event("tabs", "ui:change").detail, ["value", "previous"]);
  assert.ok(items.tabs.api.includes("value"));
});
test("dialog: ui:beforeclose is cancelable, ui:close reports returnValue", () => {
  assert.equal(event("dialog", "ui:beforeclose").cancelable, true);
  assert.equal(event("dialog", "ui:close").cancelable, false);
  assert.deepEqual(event("dialog", "ui:close").detail, ["returnValue"]);
  assert.ok(["open", "close", "toggle"].every((m) => items.dialog.api.includes(m)));
});
test("segmented control: ui:change {value} and a settable value", () => {
  assert.deepEqual(event("segmented-control", "ui:change").detail, ["value"]);
  assert.deepEqual(items["segmented-control"].api, ["value", "destroy"]);
});
test("controllers built from a shared helper are documented too", () => {
  assert.ok(event("tooltip", "ui:open") && event("tooltip", "ui:close"));
  assert.deepEqual(event("switch", "ui:change").detail, ["checked"]);
  assert.equal(event("dropdown-menu", "ui:select").cancelable, true);
});
test("every registered controller documents events or an API", async () => {
  globalThis.__COLIBRI_UI_NO_AUTO__ = true;
  const { loaders } = await import("../src/core/lazy-registry.js");
  // structure-only controllers: they wire ARIA or native inputs and expose nothing to listen to or call
  const structural = new Set(["radio-cards", "checkbox-cards", "checkbox-group"]);
  const silent = Object.keys(loaders).filter((n) => items[n] && !structural.has(n) && !items[n].events.length && !items[n].api.length);
  assert.deepEqual(silent, []);
});
test("colibri docs prints events and controller members", () => {
  const text = execFileSync(process.execPath, ["bin/colibri.mjs", "docs", "tabs"], { encoding: "utf8" });
  assert.match(text, /Events \(bubble from the root\): ui:change \{value, previous\}/);
  assert.match(text, /Controller \(controllers\(el\)\[0\]\): .*value/);
});
test("CSS and UI accept each other's tone and variant words", () => {
  const css = fs.readFileSync("packages/colibri-css/dist/colibri.css", "utf8"), ui = fs.readFileSync("themes/colibri.css", "utf8");
  for (const [canonical, alias] of [["ok", "success"], ["warn", "warning"], ["bad", "danger"]]) {
    assert.ok(css.includes(`:is([data-tone=${canonical}], [data-tone=${alias}])`), `CSS tone ${alias}`);
    assert.ok(ui.includes(`[data-tone=${alias}],[data-tone=${canonical}]`), `UI tone ${canonical}`);
  }
  assert.ok(css.includes(":is([data-variant=danger], [data-variant=destructive])"));
  assert.ok(ui.includes("button:is([data-variant=destructive],[data-variant=danger])"));
});
test("prefixed stylesheet renames every Colibri class and nothing else", () => {
  const { prefix, classes } = JSON.parse(fs.readFileSync("packages/colibri-css/dist/colibri-classes.json", "utf8"));
  const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
  const plain = strip(fs.readFileSync("packages/colibri-css/dist/colibri.css", "utf8")), prefixed = strip(fs.readFileSync("packages/colibri-css/dist/colibri.prefixed.css", "utf8"));
  const own = new RegExp(`(?<![\\w.-])\\.(${classes.join("|")})(?![\\w-])`, "g");
  assert.equal((prefixed.match(own) || []).length, 0, "no unprefixed Colibri class remains");
  assert.equal((prefixed.match(new RegExp(`\\.${prefix}(${classes.join("|")})(?![\\w-])`, "g")) || []).length, (plain.match(own) || []).length);
  const lines = (s) => s.split("\n").filter((l) => l.trim()).join("\n");
  assert.equal(lines(prefixed.replaceAll(`.${prefix}`, ".")), lines(plain), "only class names differ");
});
test("colibri collisions reports application rules that reuse a Colibri class", async () => {
  const { collisions } = await import("../bin/colibri.mjs");
  const hits = collisions("/* .card in a comment */\n.card { color: red }\n.my-card, .center > p { margin: 0 }\n@media (width > 1px) { .btn.icon { width: 2rem } }\n.x { margin: .5rem }");
  assert.deepEqual(hits.map((h) => [h.line, h.class]), [[2, "card"], [3, "center"], [4, "btn"]]);
});

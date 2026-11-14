// Fills the generated parts of the React Native documentation page from reference.json (built by
// tools/native-docs.mjs from the type declarations): the counts, what Full adds, and the API reference.
import { themeSwitch } from "/native/theme.js";
themeSwitch();
const el = (tag, props = {}, ...children) => { const node = Object.assign(document.createElement(tag), props); node.append(...children.filter((child) => child !== null && child !== "")); return node; };
const code = (text) => el("code", { textContent: text });
const LIBRARY = { "react-native-reanimated": "Reanimated", "react-native-gesture-handler": "Gesture Handler", "react-native-svg": "SVG", "react-native-safe-area-context": "Safe Area Context" };
const badge = (group) => { const node = el("span", { className: "badge", textContent: group.edition === "full" ? "Full" : "Core" }); if (group.edition === "full") node.dataset.tone = "accent"; return node; };

function propsTable(item) {
  if (!item.props.length) return null;
  return el("table", { className: "nd-props" },
    el("thead", {}, el("tr", {}, ...["Prop", "Type", "Notes"].map((text) => { const th = el("th", { textContent: text }); th.scope = "col"; return th; }))),
    el("tbody", {}, ...item.props.map((prop) => el("tr", {}, el("td", {}, code(prop.name), prop.optional ? "" : el("small", { textContent: " required" })), el("td", {}, code(prop.type)), el("td", { textContent: prop.doc })))));
}
function entry(item, group) {
  const node = el("article", { className: "nd-item", id: "api-" + group.id + "-" + item.name },
    el("h4", {}, code(item.name), item.kind === "component" ? "" : el("small", { textContent: " " + item.kind }), item.demo ? el("a", { className: "nd-demo", href: "/native/#" + item.demo, textContent: "Live demo and code →" }) : ""),
    item.doc ? el("p", { textContent: item.doc }) : "",
    item.signature ? el("pre", { className: "np-code" }, code(item.signature)) : "",
    propsTable(item),
    item.extends.length ? el("p", { className: "muted" }, "Also accepts every prop of ", ...item.extends.flatMap((name, index) => [index ? ", " : "", code(name)]), ".") : "");
  node.dataset.text = `${item.name} ${item.doc} ${item.props.map((prop) => prop.name).join(" ")}`.toLowerCase();
  return node;
}

const response = await fetch("/native/reference.json").catch(() => null);
const data = response?.ok ? await response.json() : null;
const reference = document.getElementById("nd-reference");
if (!data) reference.replaceChildren(el("p", { className: "muted", textContent: "The reference could not be loaded. Reload the page to try again." }));
else {
  document.getElementById("nd-core-count").textContent = `${data.counts.core} exports`;
  document.getElementById("nd-full-count").textContent = `${data.counts.full} exports`;
  // What Full adds, grouped by the library that makes it possible.
  document.getElementById("nd-full-lists").replaceChildren(el("table", {},
    el("thead", {}, el("tr", {}, ...["Part", "Needs", "Components"].map((text) => { const th = el("th", { textContent: text }); th.scope = "col"; return th; }))),
    el("tbody", {}, ...data.groups.filter((group) => group.edition === "full").map((group) => el("tr", {},
      el("td", {}, el("b", { textContent: group.title }), el("br"), code(group.part)),
      el("td", { textContent: group.requires.map((name) => LIBRARY[name]).join(" and ") }),
      el("td", {}, ...group.components.filter((item) => item.kind !== "value").flatMap((item, index) => [index ? ", " : "", el("a", { href: `#api-${group.id}-${item.name}` }, code(item.name))])))))));
  reference.replaceChildren(...data.groups.map((group) => {
    const section = el("section", { className: "nd-group", id: "api-" + group.id },
      el("h3", {}, group.title + " ", badge(group)),
      el("p", { className: "muted" }, "In ", code(group.importFrom), group.edition === "full" ? `, or on its own from ${group.part}. Needs ${group.requires.join(" and ")}.` : " and in @colibri-kit/native-full."),
      ...group.components.filter((item) => item.kind !== "value").map((item) => entry(item, group)));
    return section;
  }));
  document.getElementById("nd-toc-groups").replaceChildren(...data.groups.map((group) => { const link = el("a", { href: "#api-" + group.id, textContent: group.title }); if (group.edition === "full") link.append(" ", badge(group)); return link; }));
  document.getElementById("nd-q").addEventListener("input", (event) => {
    const words = event.target.value.toLowerCase().split(/\s+/).filter(Boolean);
    for (const section of reference.querySelectorAll(".nd-group")) {
      let shown = 0;
      for (const item of section.querySelectorAll(".nd-item")) { item.hidden = !words.every((word) => item.dataset.text.includes(word)); if (!item.hidden) shown++; }
      section.hidden = !shown;
    }
  });
  // A link such as #api-forms-Select was not on the page when the browser first looked for it.
  if (location.hash.startsWith("#api-")) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
  document.documentElement.dataset.docsReady = "";
}

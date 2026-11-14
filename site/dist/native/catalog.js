// Lists every React Native demo by category and drives the phone. The list comes from the demo app itself (which
// runs in the frame), so the page cannot drift from the package. Each demo's code sample is generated from its source.
const list = document.getElementById("catalog"), query = document.getElementById("np-q"), count = document.getElementById("np-count");
const frame = document.getElementById("np-frame"), side = document.querySelector(".np-side");
const el = (tag, props = {}, ...children) => { const node = Object.assign(document.createElement(tag), props); node.append(...children); return node; };
const current = () => decodeURIComponent(location.hash.slice(1));
let titles = {}, samples = null, requirements = {}, tier = "all";

function render(groups) {
  titles = Object.fromEntries(groups.flatMap((group) => group.demos.map((demo) => [demo.id, demo.title])));
  count.textContent = String(Object.keys(titles).length);
  requirements = Object.fromEntries(groups.flatMap((group) => group.demos.map((demo) => [demo.id, group.requires ?? []])));
  const light = groups.filter((group) => !group.requires?.length).reduce((sum, group) => sum + group.demos.length, 0);
  document.getElementById("np-light-count").textContent = `${light} components`;
  document.getElementById("np-full-count").textContent = `${Object.keys(titles).length - light} components`;
  list.replaceChildren(...groups.map((group) => {
    const full = Boolean(group.requires?.length), needs = (group.requires ?? []).map((library) => library.name);
    const section = el("section", { className: "np-group" },
      el("h2", { id: "group-" + group.id, textContent: group.title }),
      el("p", { className: "muted", textContent: group.description }),
      full ? el("p", { className: "np-needs" }, el("span", { className: "badge", textContent: "Full" }), " Needs " + needs.join(" and ") + ".") : "",
      el("div", { className: "np-cards" }, ...group.demos.map((demo) => {
        const card = el("a", { className: "np-card", href: "#" + demo.id }, el("b", { textContent: demo.title }), el("span", { textContent: demo.description }));
        if (full) card.append(el("small", { className: "np-req", textContent: "Needs " + group.requires.map((library) => library.label).join(" + ") }));
        card.dataset.id = demo.id; card.dataset.tier = full ? "full" : "light"; card.dataset.text = `${demo.title} ${demo.description} ${demo.id} ${full ? "full " + needs.join(" ") : "light"}`.toLowerCase();
        return card;
      })));
    section.querySelector(".np-needs .badge")?.setAttribute("data-tone", "accent");
    section.setAttribute("aria-labelledby", "group-" + group.id);
    return section;
  }));
  show();
}

// The page address and the phone stay in step: a card sets the page hash, the page hash sets the phone's,
// and navigating inside the phone (its back button, its own list) updates the page.
function show() {
  const id = current();
  for (const card of list.querySelectorAll(".np-card")) {
    if (card.dataset.id === id) card.setAttribute("aria-current", "true"); else card.removeAttribute("aria-current");
  }
  const inside = frame.contentWindow;
  if (inside && decodeURIComponent(inside.location.hash.slice(1)) !== id) inside.location.hash = id;
  code();
}
function code() {
  const id = current(), sample = samples?.[id];
  document.getElementById("np-code-name").textContent = sample ? titles[id] ?? id : samples ? "Pick a component to see its code" : "Loading the code samples…";
  // A Full component's sample starts with what to install, so it can be pasted into a fresh project.
  const needs = (requirements[id] ?? []).map((library) => library.name);
  document.getElementById("np-source").textContent = sample ? (needs.length ? `// Full: needs ${needs.join(", ")}\n// npx expo install ${needs.join(" ")}\n\n` : "") + sample : "";
  document.getElementById("np-copy").disabled = !sample;
}
function filter() {
  const words = query.value.toLowerCase().split(/\s+/).filter(Boolean);
  for (const section of list.querySelectorAll(".np-group")) {
    let shown = 0;
    for (const card of section.querySelectorAll(".np-card")) { card.hidden = !(words.every((word) => card.dataset.text.includes(word)) && (tier === "all" || card.dataset.tier === tier)); if (!card.hidden) shown++; }
    section.hidden = !shown;
  }
}

side.querySelector(".np-tabs").addEventListener("click", (event) => {
  const view = event.target.closest("button")?.dataset.view;
  if (!view) return;
  for (const button of side.querySelectorAll(".np-tabs button")) button.setAttribute("aria-pressed", String(button.dataset.view === view));
  side.querySelector(".np-phone").hidden = view !== "demo";
  side.querySelector(".np-codebox").hidden = view !== "code";
});
document.getElementById("np-copy").addEventListener("click", async (event) => {
  const button = event.currentTarget, text = document.getElementById("np-source").textContent;
  try { await navigator.clipboard.writeText(text); } catch { return; }
  button.textContent = "Copied ✓"; setTimeout(() => { button.textContent = "Copy"; }, 1600);
});
// On a narrow screen the phone sits below the list: bring it into view when a card is chosen.
list.addEventListener("click", (event) => {
  if (event.target.closest(".np-card") && matchMedia("(width < 60rem)").matches) side.scrollIntoView({ behavior: "smooth", block: "start" });
});
addEventListener("hashchange", show);
query.addEventListener("input", filter);
document.getElementById("np-tier").addEventListener("click", (event) => {
  const chosen = event.target.closest("button")?.dataset.tier;
  if (!chosen) return;
  tier = chosen;
  for (const button of event.currentTarget.querySelectorAll("button")) button.setAttribute("aria-pressed", String(button.dataset.tier === tier));
  filter();
});

fetch("/native/code.json").then((response) => response.json()).then((data) => { samples = data; code(); }).catch(() => { samples = {}; code(); });
(function wait(tries = 0) {
  const inside = frame.contentWindow;
  if (inside?.ColibriNativeCatalog) {
    inside.addEventListener("hashchange", () => { const id = decodeURIComponent(inside.location.hash.slice(1)); if (id !== current()) location.hash = id; });
    render(inside.ColibriNativeCatalog);
    document.documentElement.dataset.nativeReady = "";
  } else if (tries < 300) setTimeout(wait, 50, tries + 1);
  else list.replaceChildren(el("p", { className: "muted", textContent: "The demo could not be loaded. Reload the page to try again." }));
})();

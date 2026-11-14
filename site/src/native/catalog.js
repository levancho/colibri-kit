// Lists every React Native demo by category and drives the phone. The list comes from the demo app itself (which
// runs in the frame), so the page cannot drift from the package. Each demo's code sample is generated from its source.
const list = document.getElementById("catalog"), query = document.getElementById("np-q"), count = document.getElementById("np-count");
const frame = document.getElementById("np-frame"), side = document.querySelector(".np-side");
const el = (tag, props = {}, ...children) => { const node = Object.assign(document.createElement(tag), props); node.append(...children); return node; };
const current = () => decodeURIComponent(location.hash.slice(1));
let titles = {}, samples = null;

function render(groups) {
  titles = Object.fromEntries(groups.flatMap((group) => group.demos.map((demo) => [demo.id, demo.title])));
  count.textContent = String(Object.keys(titles).length);
  list.replaceChildren(...groups.map((group) => {
    const section = el("section", { className: "np-group" },
      el("h2", { id: "group-" + group.id, textContent: group.title }),
      el("p", { className: "muted", textContent: group.description }),
      el("div", { className: "np-cards" }, ...group.demos.map((demo) => {
        const card = el("a", { className: "np-card", href: "#" + demo.id }, el("b", { textContent: demo.title }), el("span", { textContent: demo.description }));
        card.dataset.id = demo.id; card.dataset.text = `${demo.title} ${demo.description} ${demo.id}`.toLowerCase();
        return card;
      })));
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
  document.getElementById("np-source").textContent = sample ?? "";
  document.getElementById("np-copy").disabled = !sample;
}
function filter() {
  const words = query.value.toLowerCase().split(/\s+/).filter(Boolean);
  for (const section of list.querySelectorAll(".np-group")) {
    let shown = 0;
    for (const card of section.querySelectorAll(".np-card")) { card.hidden = !words.every((word) => card.dataset.text.includes(word)); if (!card.hidden) shown++; }
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

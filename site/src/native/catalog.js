// Lists every React Native demo by category (the data comes from the demo bundle itself, so the page cannot
// drift from the package) and opens one on the phone when its card is chosen.
const list = document.getElementById("catalog"), query = document.getElementById("np-q"), count = document.getElementById("np-count");
const el = (tag, props = {}, ...children) => { const node = Object.assign(document.createElement(tag), props); node.append(...children); return node; };

function render(groups) {
  count.textContent = String(groups.reduce((sum, group) => sum + group.demos.length, 0));
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
  mark();
}
function mark() {
  const current = decodeURIComponent(location.hash.slice(1));
  for (const card of list.querySelectorAll(".np-card")) {
    if (card.dataset.id === current) card.setAttribute("aria-current", "true"); else card.removeAttribute("aria-current");
  }
}
function filter() {
  const words = query.value.toLowerCase().split(/\s+/).filter(Boolean);
  for (const section of list.querySelectorAll(".np-group")) {
    let shown = 0;
    for (const card of section.querySelectorAll(".np-card")) { card.hidden = !words.every((word) => card.dataset.text.includes(word)); if (!card.hidden) shown++; }
    section.hidden = !shown;
  }
}
// On a narrow screen the phone sits below the list: bring it into view when a card is chosen.
list.addEventListener("click", (event) => {
  if (event.target.closest(".np-card") && matchMedia("(width < 60rem)").matches) document.querySelector(".np-phone").scrollIntoView({ behavior: "smooth", block: "start" });
});
addEventListener("hashchange", mark);
query.addEventListener("input", filter);
(function wait(tries = 0) {
  if (globalThis.ColibriNativeCatalog) render(globalThis.ColibriNativeCatalog);
  else if (tries < 200) setTimeout(wait, 50, tries + 1);
  else list.replaceChildren(el("p", { className: "muted", textContent: "The demo could not be loaded. Reload the page to try again." }));
})();

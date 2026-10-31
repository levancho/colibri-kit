// Glue only. Behaviour (toggle-group, tabs, dialog, tooltip, accordion, field, toggle-password, switch,
// checkbox) comes from Colibri UI's headless core; this file reacts to its ui:* events.
for (const g of document.querySelectorAll(".billing [data-ui=toggle-group]")) {
  const scope = g.closest("section") || document;
  g.addEventListener("ui:change", (e) => { const period = e.detail?.value || "monthly";
    for (const p of scope.querySelectorAll("[data-monthly]")) p.textContent = p.dataset[period];
    for (const p of scope.querySelectorAll("[data-per]")) p.textContent = period === "yearly" ? "/ mo, billed yearly" : "/ month"; });
}
// Password strength meter, fed by the toggle-password input.
for (const w of document.querySelectorAll("[data-ui=toggle-password]")) {
  const i = w.querySelector("input"), m = w.closest("[data-ui=field]")?.querySelector(".meter");
  i?.addEventListener("input", () => { const v = i.value; if (m) m.dataset.score = !v ? 0 : Math.max(1, Math.min(4, (v.length >= 8) + /[A-Z]/.test(v) + /\d/.test(v) + /[^\w]/.test(v))); });
}
// Live theme sync when the gallery (parent page) changes pack / scheme / hue.
addEventListener("storage", (e) => { const r = document.documentElement;
  if (e.key === "colibri-kit-theme") e.newValue ? (r.dataset.kitTheme = e.newValue) : delete r.dataset.kitTheme;
  if (e.key === "colibri-scheme" && e.newValue) r.dataset.theme = e.newValue;
  if (e.key === "colibri-hue") e.newValue ? r.style.setProperty("--c-hue", e.newValue) : r.style.removeProperty("--c-hue"); });

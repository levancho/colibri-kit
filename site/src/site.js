import { highlightAll } from "/kitchen-sink/examples/code-highlight.js";
import "/ui/src/core/auto.js";

// Storage is optional: privacy settings must not disable the demos.
const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch {} },
};
highlightAll();
const root = document.documentElement;
const toggle = document.getElementById("theme");
const dark = () => root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
const label = () => toggle.setAttribute("aria-label", `Switch to ${dark() ? "light" : "dark"} mode`);
label();
toggle.addEventListener("click", () => {
  root.dataset.theme = dark() ? "light" : "dark";
  storage.set("colibri.kit.theme", root.dataset.theme);
  label();
});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", label);

const groups = [...document.querySelectorAll('[data-sync="lang"]')];
const languages = new Set(["html", "ftl", "react"]);
const pick = (value) => {
  if (!languages.has(value)) return;
  groups.forEach((g) => g.__uiTabs?.select(value));
};
let syncing = false;
groups.forEach((g) => g.addEventListener("ui:change", (e) => {
  if (syncing || e.target !== g) return;
  syncing = true;
  try { storage.set("colibri.kit.lang", e.detail.value); pick(e.detail.value); }
  finally { syncing = false; }
}));
pick(storage.get("colibri.kit.lang"));

document.addEventListener("click", async (e) => {
  const button = e.target.closest("[data-copy]");
  if (!button) return;
  const status = document.getElementById("site-status");
  try {
    await navigator.clipboard.writeText(button.nextElementSibling.textContent);
    button.textContent = "Copied";
    status.textContent = "Code copied to clipboard.";
  } catch {
    button.textContent = "Select code";
    status.textContent = "Clipboard unavailable. Select the code and copy it manually.";
  }
  setTimeout(() => (button.textContent = "Copy"), 1800);
});

const hue = document.getElementById("hue");
hue.addEventListener("input", () => {
  root.style.setProperty("--c-hue", hue.value);
  document.getElementById("hue-out").textContent = hue.value;
  document.getElementById("hue-chip").textContent = hue.value;
});
const select = document.getElementById("kit-theme");
const packs = new Set(["glacier", "ember", "midnight"]);
const apply = (value) => {
  value = packs.has(value) ? value : "";
  if (value) root.dataset.kitTheme = value;
  else delete root.dataset.kitTheme;
  select.value = value;
  storage.set("colibri.kit.pack", value);
  document.querySelectorAll("[data-pick-theme]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.pickTheme === value)));
};
apply(new URLSearchParams(location.search).get("theme") ?? storage.get("colibri.kit.pack"));
select.addEventListener("change", () => apply(select.value));
document.addEventListener("click", (e) => {
  const button = e.target.closest("[data-pick-theme]");
  if (button) apply(root.dataset.kitTheme === button.dataset.pickTheme ? "" : button.dataset.pickTheme);
});

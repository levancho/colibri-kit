// Colibri widgets: turns a small config object into markup. Shared by the builder page and the embed script,
// so the preview is the same code that runs on a visitor's site. No DOM access here: it also runs under Node tests.
export const SITE = "https://colibri-kit.io";
export const EMBED_SRC = SITE + "/widgets/embed.js";
const HOME = SITE + "/widgets/";

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

/** Links may only be http(s), mailto, tel, or same-site paths. Anything else (javascript:, data:) is dropped. */
export function safeUrl(value) {
  const url = String(value ?? "").trim();
  if (!url) return "";
  if (/^(https?:\/\/|mailto:|tel:)/i.test(url)) return url;
  if (/^[/#?]/.test(url) && !url.startsWith("//")) return url;
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#:]|$)/i.test(url)) return "https://" + url;
  return "";
}

/** "Label | value" per line → [[label, value], …]. */
export function parseLines(text, max = 8) {
  return String(text ?? "").split("\n").map((line) => line.split("|").map((part) => part.trim())).filter((parts) => parts[0]).slice(0, max);
}

const f = (key, label, type, def, extra = {}) => ({ key, label, type, def, ...extra });
const opts = (...pairs) => ({ options: pairs });

export const WIDGETS = {
  badge: { label: "Badge", blurb: "A small “Built with Colibri Kit” mark for the bottom of your website.", fields: [
    f("text", "Label", "select", "Built with Colibri Kit", opts(["Built with Colibri Kit", "Built with Colibri Kit"], ["Built with Colibri", "Built with Colibri"], ["Made with Colibri", "Made with Colibri"], ["Powered by Colibri", "Powered by Colibri"])),
    f("style", "Style", "select", "dark", opts(["dark", "Dark"], ["solid", "Accent"], ["soft", "Soft"], ["outline", "Outline"])),
    f("size", "Size", "select", "m", opts(["s", "Small"], ["m", "Medium"], ["l", "Large"])),
    f("pin", "Where it sits", "select", "inline", opts(["inline", "Where I paste it (for example in the footer)"], ["br", "Pinned to the bottom right of the screen"], ["bl", "Pinned to the bottom left of the screen"], ["bc", "Pinned to the bottom centre of the screen"]), { hint: "A pinned badge stays in the corner while visitors scroll." }) ] },
  cta: { label: "Call to action", blurb: "A headline, a line of text and a button.", fields: [
    f("eyebrow", "Small label", "text", "New"),
    f("title", "Headline", "text", "Ship your next page faster"),
    f("text", "Text", "textarea", "Components, layouts and themes that work in plain HTML. No build step."),
    f("button", "Button label", "text", "Get started"),
    f("url", "Button link", "url", "https://colibri-kit.io"),
    f("button2", "Second button (optional)", "text", "Read the docs"),
    f("url2", "Second button link", "url", "https://colibri-kit.io/getting-started.html") ] },
  announce: { label: "Announcement", blurb: "A one-line banner with a link.", fields: [
    f("tag", "Tag", "text", "New"),
    f("text", "Message", "text", "Version 2 is out, with dark mode and faster pages."),
    f("link", "Link label", "text", "See what changed"),
    f("url", "Link", "url", "https://colibri-kit.io"),
    f("tone", "Tone", "select", "accent", opts(["accent", "Accent"], ["ok", "Success"], ["warn", "Warning"])) ] },
  newsletter: { label: "Newsletter", blurb: "An email sign-up form that posts to your own endpoint.", fields: [
    f("title", "Headline", "text", "Get the monthly update"),
    f("text", "Text", "textarea", "One email a month. No spam, unsubscribe any time."),
    f("placeholder", "Placeholder", "text", "you@example.com"),
    f("button", "Button label", "text", "Subscribe"),
    f("action", "Form endpoint (where the email is sent)", "url", "", { hint: "Your mailing-list provider gives you this URL. The form sends a field named “email” with POST." }) ] },
  pricing: { label: "Pricing card", blurb: "One plan with its price and features.", fields: [
    f("plan", "Plan name", "text", "Pro"),
    f("flag", "Highlight label (optional)", "text", "Most popular"),
    f("price", "Price", "text", "$19"),
    f("period", "Period", "text", "per month"),
    f("features", "Features (one per line)", "textarea", "Unlimited projects\nCustom domain\nPriority support\nCancel any time"),
    f("button", "Button label", "text", "Choose Pro"),
    f("url", "Button link", "url", "https://example.com/pricing") ] },
  testimonial: { label: "Testimonial", blurb: "A customer quote with a name and rating.", fields: [
    f("quote", "Quote", "textarea", "We replaced three libraries with this and our pages got lighter."),
    f("name", "Name", "text", "Maya Okafor"),
    f("role", "Role", "text", "Head of Product, Northwind"),
    f("stars", "Stars", "select", "5", opts(["0", "None"], ["3", "3"], ["4", "4"], ["5", "5"])) ] },
  faq: { label: "FAQ", blurb: "Questions that open on click. Works without JavaScript.", fields: [
    f("title", "Headline", "text", "Common questions"),
    f("items", "Questions (one per line: Question | Answer)", "textarea", "Is there a free plan? | Yes. It covers one project and never expires.\nCan I cancel? | Any time, from your account page.\nDo you offer support? | By email, usually within one working day.", { rows: 6 }) ] },
  stats: { label: "Stats", blurb: "Up to four numbers with labels.", fields: [
    f("title", "Headline (optional)", "text", "Trusted by small teams"),
    f("items", "Numbers (one per line: Number | Label)", "textarea", "12k | Downloads\n98% | Happy users\n24/7 | Uptime checks", { rows: 4 }) ] },
  links: { label: "Link card", blurb: "Your name, a short bio and a list of links.", fields: [
    f("name", "Name", "text", "Alex Rivera"),
    f("bio", "Bio", "text", "Designer and developer. I write about the web."),
    f("items", "Links (one per line: Label | URL)", "textarea", "Portfolio | https://example.com\nNewsletter | https://example.com/news\nGitHub | https://github.com", { rows: 5 }) ] },
};

export const LOOK = {
  hue: 250, theme: "auto", radius: "soft", width: "m", align: "start",
};
export const THEMES = ["auto", "light", "dark"];
export const RADII = { sharp: ["2px", "3px", "4px"], soft: null, round: ["12px", "16px", "24px"] };
export const WIDTHS = { s: "20rem", m: "28rem", l: "40rem", full: "" };
export const ALIGNS = ["start", "center"];
const LIMIT = { text: 160, url: 500, textarea: 1200, select: 60 };

export function defaults(type) {
  const widget = WIDGETS[type] ?? WIDGETS.badge;
  return Object.fromEntries(widget.fields.map((field) => [field.key, field.def]));
}

/** Accepts anything (a parsed attribute, a URL hash) and returns a complete, bounded config. */
export function normalize(input) {
  const raw = input && typeof input === "object" ? input : {};
  const t = Object.hasOwn(WIDGETS, raw.t) ? raw.t : "badge";
  const hue = Number.isFinite(+raw.hue) ? Math.min(360, Math.max(0, Math.round(+raw.hue))) : LOOK.hue;
  const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);
  const source = raw.d && typeof raw.d === "object" ? raw.d : {};
  const d = {};
  for (const field of WIDGETS[t].fields) {
    let value = Object.hasOwn(source, field.key) ? String(source[field.key] ?? "") : field.def;
    if (field.type === "select" && !field.options.some(([option]) => option === value)) value = field.def;
    d[field.key] = value.slice(0, LIMIT[field.type] ?? 160);
  }
  return { t, hue, theme: pick(raw.theme, THEMES, LOOK.theme), radius: pick(raw.radius, Object.keys(RADII), LOOK.radius),
    width: pick(raw.width, Object.keys(WIDTHS), LOOK.width), align: pick(raw.align, ALIGNS, LOOK.align), d };
}

/** Drops everything equal to its default, so snippets and share links stay short. */
export function compact(input) {
  const config = normalize(input), base = defaults(config.t), out = { t: config.t };
  for (const key of Object.keys(LOOK)) if (config[key] !== LOOK[key]) out[key] = config[key];
  const d = Object.fromEntries(Object.entries(config.d).filter(([key, value]) => value !== base[key]));
  if (Object.keys(d).length) out.d = d;
  return out;
}

export function parseConfig(text) {
  try { return normalize(JSON.parse(text)); } catch { return normalize({}); }
}

const MARK = '<svg class="cw-mark" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="cw-a" x2="1" y2="1"><stop stop-color="#A7F3E1"/><stop offset=".48" stop-color="#7DA7FF"/><stop offset="1" stop-color="#D185FF"/></linearGradient><linearGradient id="cw-b"><stop stop-color="#FFBC84"/><stop offset="1" stop-color="#F684C7"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="#211B30"/><path d="M13 8C32 9 43 20 38 34L24 28Z" fill="url(#cw-a)"/><path d="M5 23C22 19 36 25 39 36L23 40Z" fill="url(#cw-b)"/><path d="M21 53 29 36 40 28 44 22 50 23 61 18 51 28 47 29 42 42Z" fill="url(#cw-a)"/><path d="m21 53 5-12 6 5Z" fill="#9FF3D9"/><circle cx="46" cy="25" r="1.25" fill="#20192F"/></svg>';
const by = () => `<a class="cw-by" href="${HOME}" target="_blank" rel="noopener">${MARK}<span>Built with Colibri</span></a>`;
const foot = () => `<div class="cw-foot">${by()}</div>`;
const link = (url, label, attrs) => { const href = safeUrl(url); return href && label ? `<a ${attrs} href="${esc(href)}">${esc(label)}</a>` : ""; };
const initials = (name) => esc(String(name ?? "").trim().split(/\s+/).slice(0, 2).map((word) => word[0] ?? "").join("").toUpperCase() || "•");
const when = (value, html) => (String(value ?? "").trim() ? html : "");

const RENDER = {
  badge: (d) => `<a class="cw-badge" data-style="${esc(d.style)}" data-size="${esc(d.size)}" href="${HOME}" target="_blank" rel="noopener">${MARK}<span>${esc(d.text)}</span></a>`,
  cta: (d) => `<section class="card stack cw-cta">${when(d.eyebrow, `<span class="badge" data-tone="accent">${esc(d.eyebrow)}</span>`)}<h3>${esc(d.title)}</h3>${when(d.text, `<p class="muted">${esc(d.text)}</p>`)}<div class="cluster">${link(d.url, d.button, 'class="btn"')}${link(d.url2, d.button2, 'class="btn" data-variant="outline"')}</div>${foot()}</section>`,
  announce: (d) => `<div class="callout cluster cw-announce" data-tone="${esc(d.tone)}">${when(d.tag, `<span class="badge" data-tone="${esc(d.tone)}">${esc(d.tag)}</span>`)}<span class="cw-grow">${esc(d.text)} ${link(d.url, d.link ? d.link + " →" : "", 'class="cw-link"')}</span>${by()}</div>`,
  newsletter: (d) => { const action = safeUrl(d.action); return `<section class="card stack cw-news"><h3>${esc(d.title)}</h3>${when(d.text, `<p class="muted">${esc(d.text)}</p>`)}<form class="cluster cw-form" method="post"${action ? ` action="${esc(action)}" target="_blank"` : " data-cw-demo"}><input type="email" name="email" required autocomplete="email" aria-label="Email address" placeholder="${esc(d.placeholder)}"><button class="btn" type="submit">${esc(d.button || "Subscribe")}</button></form>${foot()}</section>`; },
  pricing: (d) => `<section class="card stack cw-price"><div class="cluster cw-between"><h3>${esc(d.plan)}</h3>${when(d.flag, `<span class="badge" data-tone="accent">${esc(d.flag)}</span>`)}</div><p class="cw-amount"><b>${esc(d.price)}</b> <span class="muted">${esc(d.period)}</span></p><ul class="cw-ticks">${parseLines(d.features, 10).map(([feature]) => `<li>${esc(feature)}</li>`).join("")}</ul>${link(d.url, d.button, 'class="btn cw-wide"')}${foot()}</section>`,
  testimonial: (d) => { const stars = Math.min(5, Math.max(0, parseInt(d.stars, 10) || 0)); return `<figure class="card stack cw-quote">${stars ? `<div class="cw-stars" role="img" aria-label="${stars} out of 5 stars">${"★".repeat(stars)}<span>${"★".repeat(5 - stars)}</span></div>` : ""}<blockquote>“${esc(d.quote)}”</blockquote><figcaption class="cluster"><span class="cw-avatar" aria-hidden="true">${initials(d.name)}</span><span class="cw-who"><b>${esc(d.name)}</b>${when(d.role, `<span class="muted">${esc(d.role)}</span>`)}</span></figcaption>${foot()}</figure>`; },
  faq: (d) => `<section class="card stack cw-faq">${when(d.title, `<h3>${esc(d.title)}</h3>`)}<div>${parseLines(d.items).map(([question, answer = ""]) => `<details><summary>${esc(question)}</summary><p class="muted">${esc(answer)}</p></details>`).join("")}</div>${foot()}</section>`,
  stats: (d) => `<section class="card stack cw-stats">${when(d.title, `<h3>${esc(d.title)}</h3>`)}<div class="cw-nums">${parseLines(d.items, 4).map(([number, label = ""]) => `<div><b>${esc(number)}</b><span class="muted">${esc(label)}</span></div>`).join("")}</div>${foot()}</section>`,
  links: (d) => `<section class="card stack cw-links"><span class="cw-avatar cw-avatar-l" aria-hidden="true">${initials(d.name)}</span><h3>${esc(d.name)}</h3>${when(d.bio, `<p class="muted">${esc(d.bio)}</p>`)}<div class="stack">${parseLines(d.items).map(([label, url]) => link(url, label, 'class="btn cw-wide" data-variant="outline"')).join("")}</div>${foot()}</section>`,
};

/** The widget's HTML: one wrapper carrying the look, then the widget. Every text value is escaped. */
export function renderWidget(input) {
  const config = normalize(input);
  const style = [`--c-hue:${config.hue}`];
  if (config.theme !== "auto") style.push(`color-scheme:${config.theme}`);
  const radius = RADII[config.radius];
  if (radius) style.push(`--c-radius-s:${radius[0]}`, `--c-radius:${radius[1]}`, `--c-radius-l:${radius[2]}`);
  if (config.t !== "badge" && WIDTHS[config.width]) style.push(`--cw-w:${WIDTHS[config.width]}`);
  const pin = config.t === "badge" && config.d.pin !== "inline" ? ` data-pin="${config.d.pin}"` : "";
  return `<div class="cw" data-colibri-theme data-cw="${config.t}" data-align="${config.align}"${pin} style="${style.join(";")}">${RENDER[config.t](config.d)}</div>`;
}

// Widget styles. Every rule is scoped under .cw and built on Colibri tokens.
export const WIDGET_CSS = `
.cw{box-sizing:border-box;max-inline-size:var(--cw-w,none);font-family:var(--c-font);font-size:var(--c-text-md);line-height:1.6;color:var(--c-fg);text-align:start}
.cw[data-align=center]{margin-inline:auto}
.cw[data-cw=badge]{max-inline-size:none}
.cw[data-cw=badge][data-align=center]{text-align:center}
.cw *,.cw *::before,.cw *::after{box-sizing:border-box}
.cw :is(h3,p,ul,blockquote,figure,figcaption){margin:0;padding:0}
.cw h3{font-size:var(--c-text-lg);line-height:1.25;letter-spacing:-.01em;font-weight:700}
.cw .card{--gap:var(--c-space-s);padding:var(--c-space-m)}
.cw-mark{inline-size:1.3em;block-size:1.3em;flex:none;border-radius:.32em}
.cw-by{display:inline-flex;align-items:center;gap:.4em;font-size:.72rem;font-weight:600;line-height:1;color:var(--c-muted);text-decoration:none;white-space:nowrap}
.cw-by:hover{color:var(--c-accent)}
.cw-foot{display:flex;justify-content:flex-end;padding-block-start:var(--c-space-2xs)}
.cw-wide{inline-size:100%}
.cw-grow{flex:1 1 12rem}
.cw-between{--justify:space-between}
.cw-link{color:var(--c-accent);font-weight:600;white-space:nowrap}
.cw-badge{display:inline-flex;align-items:center;gap:.55em;padding:.4em .85em .4em .45em;border:1px solid transparent;border-radius:var(--c-radius-full);font-size:.82rem;font-weight:600;line-height:1;text-decoration:none;transition:transform var(--c-dur-fast) var(--c-ease),box-shadow var(--c-dur) var(--c-ease)}
.cw-badge:hover{transform:translateY(-1px);box-shadow:var(--c-shadow)}
.cw-badge .cw-mark{inline-size:1.7em;block-size:1.7em;border-radius:50%}
.cw-badge[data-size=s]{font-size:.7rem}
.cw-badge[data-size=l]{font-size:.98rem}
.cw-badge[data-style=dark]{background:#211b30;color:#fff}
.cw-badge[data-style=solid]{background:var(--c-accent);color:var(--c-brand-fg)}
.cw-badge[data-style=soft]{background:var(--c-accent-soft);color:var(--c-accent)}
.cw-badge[data-style=outline]{background:var(--c-surface);color:var(--c-fg);border-color:var(--c-line)}
.cw[data-pin]{position:fixed;inset-block-end:16px;z-index:2147483000}
.cw[data-pin=br]{inset-inline-end:16px}
.cw[data-pin=bl]{inset-inline-start:16px}
.cw[data-pin=bc]{inset-inline:0;text-align:center;pointer-events:none}
.cw[data-pin] .cw-badge{pointer-events:auto;box-shadow:var(--c-shadow-l)}
.cw-announce{--gap:var(--c-space-s);font-size:var(--c-text-sm)}
.cw-announce[data-tone=accent]{--tone:var(--c-accent)}
.cw-form input{flex:1 1 11rem;min-inline-size:0;min-block-size:2.5rem;padding:.4em .75em;border:1px solid var(--c-line);border-radius:var(--c-radius-s);background:var(--c-surface);color:inherit;font:inherit;font-size:var(--c-text-sm)}
.cw-form input:focus-visible{outline:var(--c-ring);outline-offset:1px}
.cw-amount b{font-size:var(--c-text-2xl);line-height:1;letter-spacing:-.03em}
.cw-ticks{display:grid;gap:var(--c-space-2xs);list-style:none}
.cw-ticks li{position:relative;padding-inline-start:1.6em}
.cw-ticks li::before{content:"✓";position:absolute;inset-inline-start:0;font-weight:700;color:var(--c-accent)}
.cw-stars{font-size:1.05rem;letter-spacing:.1em;line-height:1;color:var(--c-accent)}
.cw-stars span{color:var(--c-line)}
.cw-quote blockquote{font-size:var(--c-text-lg);line-height:1.45;letter-spacing:-.01em}
.cw-avatar{display:inline-grid;place-items:center;flex:none;inline-size:2.5rem;block-size:2.5rem;border-radius:50%;font-size:.85rem;font-weight:700;color:#fff;background:linear-gradient(135deg,oklch(62% .19 var(--c-hue)),oklch(58% .2 calc(var(--c-hue) + 70)))}
.cw-avatar-l{inline-size:3.5rem;block-size:3.5rem;font-size:1.1rem}
.cw-who{display:grid;line-height:1.3;font-size:var(--c-text-sm)}
.cw-faq details{border-block-start:1px solid var(--c-line);padding-block:var(--c-space-xs)}
.cw-faq details:last-child{border-block-end:1px solid var(--c-line)}
.cw-faq summary{cursor:pointer;font-weight:600;list-style-position:outside;margin-inline-start:1.1em}
.cw-faq details p{padding-block-start:var(--c-space-2xs);font-size:var(--c-text-sm)}
.cw-nums{display:grid;grid-template-columns:repeat(auto-fit,minmax(5.5rem,1fr));gap:var(--c-space-s)}
.cw-nums div{display:grid;gap:.1em}
.cw-nums b{font-size:var(--c-text-xl);line-height:1.1;letter-spacing:-.02em;color:var(--c-accent)}
.cw-nums span{font-size:var(--c-text-xs)}
.cw-links{text-align:center;align-items:center}
.cw-links .stack{inline-size:100%;--gap:var(--c-space-xs)}
.cw-links .cw-foot{inline-size:100%;justify-content:center}
`.trim();

const attr = (json) => json.replace(/&/g, "&amp;").replace(/'/g, "&#39;").replace(/</g, "&lt;");

/** The recommended snippet: one element and one script. The link inside shows until the script has loaded. */
export function embedSnippet(input) {
  return `<colibri-widget config='${attr(JSON.stringify(compact(input)))}'><a href="${HOME}">Built with Colibri</a></colibri-widget>\n<script async src="${EMBED_SRC}"></` + `script>`;
}

/** Plain markup for pages that already load Colibri CSS. */
export function htmlSnippet(input) {
  return `<style>\n${WIDGET_CSS}\n</style>\n${renderWidget(input)}`;
}

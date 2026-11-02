// Colibri code highlighter: tiny, dependency-free, for HTML, FreeMarker, JSX/JS and CSS.
// Usage: highlightAll(root?) colours every <pre><code> whose panel/ancestor says data-value|data-lang = html|ftl|react|jsx|js|css.
// It only re-renders text (textContent is unchanged), so copy-to-clipboard keeps working.
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const sp = (c, s) => (s ? `<span class="hl-${c}">${esc(s)}</span>` : "");

function scan(src, rules) { // rules: [[class|fn, regex(sticky)]]
  let out = "", i = 0, plain = "";
  outer: while (i < src.length) {
    for (const [cls, re] of rules) {
      re.lastIndex = i; const m = re.exec(src);
      if (m && m[0].length) { out += esc(plain); plain = ""; out += typeof cls === "function" ? cls(m) : sp(cls, m[0]); i += m[0].length; continue outer; }
    }
    plain += src[i++];
  }
  return out + esc(plain);
}
const y = (r) => new RegExp(r.source, "y" + (r.flags.includes("s") ? "s" : ""));

// attributes inside a tag: name, =, "value" | {expr}
function attrs(s, jsx) {
  return scan(s, [
    ["str", y(/"[^"]*"|'[^']*'/)],
    ...(jsx ? [[(m) => sp("punc", "{") + js(m[0].slice(1, -1)) + sp("punc", "}"), y(/\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/)]] : []),
    ["ftl", y(/\$\{[^}]*\}|\[#[^\]]*\]|\[\/#[^\]]*\]/)],
    ["attr", y(/[A-Za-z_:@][\w:.-]*/)],
    ["punc", y(/=/)],
  ]);
}
const tagRe = (jsx) => jsx
  ? y(/<\/?(?:[A-Za-z][\w.:-]*)?(?:\s+(?:[^>{"']|"[^"]*"|'[^']*'|\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})*?)?\s*\/?>/)
  : y(/<\/?[A-Za-z][\w:-]*(?:\s(?:[^>"'\[]|"[^"]*"|'[^']*'|\[[^\]]*\])*?)?\s*\/?>/);
function tag(m, jsx) {
  const t = m[0], h = /^<\/?([\w.:-]*)/.exec(t), end = /\s*\/?>$/.exec(t.slice(h[0].length))[0];
  const name = h[1], cls = jsx && /^[A-Z]/.test(name) ? "comp" : "tag";
  return sp("punc", h[0].slice(0, h[0].length - name.length)) + sp(cls, name) + attrs(t.slice(h[0].length, t.length - end.length), jsx) + sp("punc", end);
}
const ftlDir = (m) => { const t = m[0], h = /^\[\/?[#@][\w.]*/.exec(t)[0], close = /\/?\]$/.exec(t)[0];
  return sp("ftl", h) + attrs(t.slice(h.length, t.length - close.length), false).replace(/hl-attr/g, "hl-attr") + sp("ftl", close); };

export function html(s, ftl = false) {
  return scan(s, [
    ["com", y(/<!--[\s\S]*?-->/)],
    ...(ftl ? [["com", y(/\[#--[\s\S]*?--\]/)], [ftlDir, y(/\[\/?[#@][\w.]*(?:[^\]"]|"[^"]*")*\]/)], ["ftl", y(/\$\{[^}]*\}/)]] : []),
    [(m) => tag(m, false), tagRe(false)],
    ["ent", y(/&[#\w]+;/)],
  ]);
}
const KW = /(?:import|from|export|default|function|return|const|let|var|if|else|new|await|async|of|in|for|while|class|extends|true|false|null|undefined|this|typeof)\b/;
export function js(s) {
  return scan(s, [
    ["com", y(/\/\/[^\n]*|\/\*[\s\S]*?\*\//)],
    ["str", y(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/)],
    [(m) => tag(m, true), tagRe(true)],
    ["kw", y(new RegExp("\\b" + KW.source))],
    ["num", y(/\b\d[\d.]*\b/)],
    ["fn", y(/[A-Za-z_$][\w$]*(?=\s*\()/)],
    ["punc", y(/=>|[{}()[\];,]/)],
  ]);
}
export function css(s) {
  return scan(s, [
    ["com", y(/\/\*[\s\S]*?\*\//)],
    ["str", y(/"[^"]*"|'[^']*'/)],
    [(m) => sp("attr", m[1]) + sp("punc", ":"), y(/(--?[\w-]+|[a-z-]+)\s*:(?=[^{;]*[;}\n])/)],
    ["kw", y(/@[\w-]+/)],
    ["fn", y(/[\w-]+(?=\()/)],
    ["num", y(/-?\d*\.?\d+(?:%|[a-z]+)?/)],
    ["tag", y(/[.#]?[A-Za-z][\w-]*(?=[^{};]*\{)/)],
    ["punc", y(/[{}();,]/)],
  ]);
}
const LANG = { html: (s) => html(s), ftl: (s) => html(s, true), freemarker: (s) => html(s, true), react: js, jsx: js, js, css };
const LABEL = { html: "HTML", ftl: "FreeMarker", freemarker: "FreeMarker", react: "React · JSX", jsx: "JSX", js: "JavaScript", css: "CSS" };
// Pretty-print: long single-line markup is broken at block-level tags and re-indented (short lines are left as authored).
const BLOCK = /^(?:div|section|header|footer|nav|main|aside|article|form|fieldset|ul|ol|li|dl|dt|dd|table|thead|tbody|tr|td|th|p|h[1-6]|button|label|input|select|option|textarea|details|summary|dialog|figure|img|hr|svg|ui-[\w-]+|template|#[\w]+|@[\w.]+)$/i;
const VOID = /^(?:input|img|hr|br|meta|link|source|col|area|wbr)$/i;
export function format(src, lang = "html") {
  if (!/^(html|ftl|freemarker)$/.test(lang)) return src;
  return src.split("\n").map((line) => {
    if (line.length <= 110 || (line.match(/</g) || []).length < 3) return line;
    const base = /^\s*/.exec(line)[0]; const st = []; let out = "", first = true, m;
    const re = /<\/?([A-Za-z][\w:-]*)(?:[^>"']|"[^"]*"|'[^']*')*?\/?>|\[\/?([#@][\w.]+)(?:[^\]"]|"[^"]*")*\/?\]|[^<\[]+|[<\[]/g;
    const nl = (d) => { if (!first) out = out.replace(/\s+$/, "") + "\n" + base + "  ".repeat(Math.max(0, d)); };
    while ((m = re.exec(line.trimStart()))) {
      const t = m[0], name = m[1] || m[2] || "", close = /^(<\/|\[\/)/.test(t), self = /\/[>\]]$/.test(t) || VOID.test(name);
      if (name && BLOCK.test(name)) {
        if (/^#else/.test(name)) { nl(st.length - 1); if (st.length) st[st.length - 1] = true; }
        else if (close) { const had = st.pop(); if (had) nl(st.length); }
        else { if (st.length) st[st.length - 1] = true; nl(st.length); if (!self && !/^#(?:assign|include|import|setting|return|break)/.test(name)) st.push(false); }
      }
      out += t; first = false;
    }
    return out;
  }).join("\n");
}
export function highlight(src, lang) { const f = LANG[lang]; return f ? f(src) : esc(src); }
export function highlightAll(root = document) {
  for (const code of root.querySelectorAll("pre code:not([data-hl])")) {
    const host = code.closest("[data-lang],[data-value]"); const lang = (host?.dataset.lang || host?.dataset.value || "").toLowerCase();
    const f = LANG[lang]; if (!f) continue;
    const src = format(code.textContent.replace(/\s+$/, ""), lang);
    code.innerHTML = f(src).split("\n").map((l) => `<span class="hl-ln">${l || " "}</span>`).join("\n");
    code.dataset.hl = lang; code.classList.add("hl"); const pre = code.parentElement; pre.classList.add("hl-pre"); pre.tabIndex = 0; pre.dataset.hlLang = LABEL[lang] || lang;
  }
}
// palette: light by default; dark with html[data-theme=dark] or the OS setting
const css0 = `:root{--hl-fg:#24292f;--hl-tag:#1a7f37;--hl-comp:#8250df;--hl-attr:#0550ae;--hl-str:#0a5c99;--hl-punc:#57606a;--hl-kw:#cf222e;--hl-num:#0550ae;--hl-ftl:#953800}html[data-theme=dark],html[data-kit-theme=midnight]{--hl-fg:#e6edf3;--hl-tag:#7ee787;--hl-comp:#d2a8ff;--hl-attr:#79c0ff;--hl-str:#a5d6ff;--hl-punc:#8b949e;--hl-kw:#ff7b72;--hl-num:#79c0ff;--hl-ftl:#ffa657}@media (prefers-color-scheme:dark){html:not([data-theme=light]){--hl-fg:#e6edf3;--hl-tag:#7ee787;--hl-comp:#d2a8ff;--hl-attr:#79c0ff;--hl-str:#a5d6ff;--hl-punc:#8b949e;--hl-kw:#ff7b72;--hl-num:#79c0ff;--hl-ftl:#ffa657}}.hl{color:var(--hl-fg)}.hl .hl-tag{color:var(--hl-tag)}.hl .hl-comp{color:var(--hl-comp);font-weight:600}.hl .hl-attr{color:var(--hl-attr)}.hl .hl-str{color:var(--hl-str)}.hl .hl-punc{color:var(--hl-punc)}.hl .hl-com{color:var(--hl-punc);font-style:italic}.hl .hl-kw{color:var(--hl-kw)}.hl .hl-fn{color:var(--hl-comp)}.hl .hl-num{color:var(--hl-num)}.hl .hl-ftl{color:var(--hl-ftl);font-weight:600}.hl .hl-ent{color:var(--hl-ftl)}
.hl-pre{position:relative;counter-reset:hl-ln;tab-size:2;line-height:1.6}
.hl{display:block;min-width:max-content}.hl .hl-ln{counter-increment:hl-ln}
.hl .hl-ln::before{content:counter(hl-ln);display:inline-block;width:2.6em;margin-right:1.1em;padding-right:.6em;text-align:right;color:var(--hl-punc);opacity:.45;border-right:1px solid color-mix(in srgb,var(--hl-punc) 30%,transparent);user-select:none;-webkit-user-select:none}
.hl-pre::after{content:attr(data-hl-lang);position:sticky;float:right;top:0;right:0;margin:-.2em -.2em 0 1em;font:600 10px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--hl-punc);opacity:.7;pointer-events:none}
.hl .hl-kw{font-weight:600}.hl .hl-tag{font-weight:500}`;
if (typeof document !== "undefined" && !document.getElementById("hl-css")) {
  const st = document.createElement("style"); st.id = "hl-css"; st.textContent = css0; document.head.append(st);
}

#!/usr/bin/env python3
"""Generate examples/blocks/: one standalone page per marketing block (framed in the gallery for device
preview) + index.html gallery with Preview | HTML | FreeMarker | React tabs. React is generated from the
HTML (tools/sink_react.py) so the three never drift."""
import html as H, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent)); from sink_react import render
OUT = pathlib.Path(__file__).resolve().parent.parent / "examples" / "blocks"
HEAD = """<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<script>try{{const r=document.documentElement,q=new URLSearchParams(location.search),p=q.get("theme")??localStorage.getItem("colibri-kit-theme");if(p)r.dataset.kitTheme=p;const s=q.get("scheme")??localStorage.getItem("colibri-scheme")??(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");r.dataset.theme=s;r.style.colorScheme=s;const h=localStorage.getItem("colibri-hue");if(h)r.style.setProperty("--c-hue",h)}}catch{{}}</script>
<link rel="stylesheet" href="../../packages/colibri-css/dist/colibri.css">
<link rel="stylesheet" href="../../themes/packs/index.css">
<link rel="stylesheet" href="blocks.css">{extra}
</head>"""

from blocks_markup import HERO, HERO_FTL, PRICING, PRICING_FTL, SIGNUP, SIGNUP_FTL, USES
BLOCKS = [("hero", "Hero", "Marketing hero with announcement pill, gradient headline, social proof, product mock and logo cloud.", HERO, HERO_FTL),
          ("pricing", "Pricing", "Three tiers with a featured plan, monthly / yearly toggle and feature lists.", PRICING, PRICING_FTL),
          ("signup", "Signup", "Split signup: social sign-in, email form with password strength, testimonial panel. Collapses to one column.", SIGNUP, SIGNUP_FTL)]

def react(bid, html):
    name = bid.capitalize() + "Block"
    body = render(html).replace("export function Demo()", f"export function {name}()")
    imports = [l for l in body.splitlines() if l.startswith("import ")]
    if "<ui-" in html: imports.append('import "@colibri-kit/ui/elements"; // registers <ui-tabs>, <ui-dialog>')
    body = "\n".join(l for l in body.splitlines() if not l.startswith("import "))
    L = body.splitlines(); istext = lambda l: l.strip() and not l.strip().startswith(("<", "{", ")", "return", "export", "}"))
    for i in range(len(L) - 1):
        a, b = L[i].strip(), L[i + 1].strip()
        if istext(L[i]) and b.startswith("<") and not b.startswith("</"): L[i] += '{" "}'
        elif a.startswith("<") and a.endswith(">") and not a.endswith("/>") and "</" in a and istext(L[i + 1]) and b[0].isalnum(): L[i] += '{" "}'
        elif a.startswith("</") and istext(L[i + 1]) and b[0].isalnum(): L[i] += '{" "}'
    body = "\n".join(L)
    hook = ('import "@colibri-kit/blocks/blocks.js"; // glue: prices on toggle-group ui:change, password meter\n' if bid != "hero" else "")
    return f'import "@colibri-kit/css";\nimport "@colibri-kit/blocks/blocks.css";\n{chr(10).join(imports)}\n{hook}\n{body.strip()}\n'

def page(bid, title, html):
    return HEAD.format(title=f"{title} block — Colibri Kit", extra="") + f'\n<body style="margin:0">\n{html}\n<script type="module">import "../../src/core/auto.js"; import "../../src/elements/all.js"; import "./blocks.js";</script>\n</body></html>\n'

DEVICES = [("desktop", "Desktop", "100%", '<rect x="2" y="3" width="20" height="13" rx="2"/><path d="M8 21h8M12 16v5"/>'),
           ("tablet", "Tablet", "768px", '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M11 18h2"/>'),
           ("phone", "Phone", "390px", '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>')]
def gallery():
    cards = []
    for bid, title, desc, html, ftl in BLOCKS:
        dev = "".join(f'<button type="button" data-w="{w}" aria-pressed="{str(i==0).lower()}" title="{lbl}" aria-label="{lbl} preview"><svg viewBox="0 0 24 24" aria-hidden="true">{svg}</svg></button>' for i, (_, lbl, w, svg) in enumerate(DEVICES))
        tabs = "".join(f'<button type="button" role="tab" data-tab="{k}" aria-selected="{str(k=="preview").lower()}">{l}</button>' for k, l in [("preview", "Preview"), ("html", "HTML"), ("ftl", "FreeMarker"), ("react", "React")])
        code = lambda lang, src: f'<div class="g-panel" data-panel="{lang}" data-lang="{lang}" hidden><button class="btn g-copy" data-size="s" data-variant="ghost" type="button">Copy</button><pre><code>{H.escape(src)}</code></pre></div>'
        cards.append(f"""<article class="g-block" id="{bid}">
  <header class="g-head"><div><h2>{title}</h2><p>{desc}</p><ul class="g-uses" aria-label="Colibri UI used">{"".join(f"<li><code>{H.escape(u)}</code></li>" for u in USES[bid])}</ul></div>
    <div class="g-tools"><div class="g-tabs" role="tablist" aria-label="{title} views">{tabs}</div><div class="g-dev" role="group" aria-label="Preview width">{dev}</div><a class="btn" data-variant="ghost" data-size="s" href="{bid}.html" target="_blank" rel="noopener">Open ↗</a></div></header>
  <div class="g-panel" data-panel="preview"><div class="g-stage"><iframe src="{bid}.html" title="{title} block preview" loading="lazy"></iframe></div></div>
  {code("html", html)}{code("ftl", ftl)}{code("react", react(bid, html))}
</article>""")
    return HEAD.format(title="Marketing blocks — Colibri Kit", extra='\n<link rel="stylesheet" href="gallery.css">') + f"""
<body>
<header class="g-top"><a class="g-brand" href="/"><i aria-hidden="true"></i>Colibri Kit <span>/ Blocks</span></a>
  <nav class="g-nav" aria-label="Blocks">{"".join(f'<a href="#{b[0]}">{b[1]}</a>' for b in BLOCKS)}</nav>
  <div class="g-ctl">
    <label>Theme pack <select id="pack"></select></label>
    <label title="Colour only: shifts the accent hue on top of the pack">Colour <input id="hue" type="range" min="0" max="360" value="255"><output id="hue-out">pack</output></label>
    <button class="btn" id="scheme" data-variant="ghost" data-size="s" type="button" aria-label="Toggle light/dark">◐</button>
    <a class="btn" data-variant="outline" data-size="s" href="https://github.com/levancho/colibri-kit">GitHub</a>
  </div></header>
<main class="g-main">
<section class="g-intro"><h1>Marketing blocks</h1><p>Pilot set: three production-quality blocks built only from Colibri tokens and primitives. Switch the <b>theme pack</b> to change shape, type, shadows and chrome, or the <b>colour</b> for hue alone. Every block has a device preview and HTML, FreeMarker and React source.</p></section>
{chr(10).join(cards)}
</main>
<script type="module" src="gallery.js"></script>
</body></html>
"""

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for bid, title, _, html, _ in BLOCKS: (OUT / f"{bid}.html").write_text(page(bid, title, html))
    (OUT / "index.html").write_text(gallery()); print("wrote", len(BLOCKS) + 1, "pages to", OUT)

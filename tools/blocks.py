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

HERO = """<section class="blk blk-hero">
  <div class="inner">
    <div class="copy">
      <a class="announce" href="#"><b>New</b> Theme packs now change shape, not just colour →</a>
      <h1>Ship interfaces that look <span class="grad">designed</span>, not assembled.</h1>
      <p class="lede">Colibri Kit is modern CSS and tiny behaviours for server-rendered apps. Tokens, primitives and full theme packs. No utility soup, no build step.</p>
      <div class="cta">
        <a class="btn" data-variant="primary" data-size="l" href="#">Start building</a>
        <a class="btn" data-variant="outline" data-size="l" href="#">Browse components</a>
      </div>
      <div class="proof">
        <span class="faces" aria-hidden="true"><i style="--h:20"></i><i style="--h:90"></i><i style="--h:160"></i><i style="--h:230"></i><i style="--h:300"></i></span>
        <span><span class="stars" aria-label="5 out of 5">★★★★★</span> Loved by 2,400+ teams shipping with plain HTML</span>
      </div>
    </div>
    <div class="mock" aria-hidden="true">
      <div class="win">
        <div class="win-bar"><i></i><i></i><i></i><span>app.colibri.dev/overview</span></div>
        <div class="win-body">
          <div class="win-side"><b></b><b></b><b></b><b></b><b></b></div>
          <div class="win-main">
            <div class="kpi"><small>Revenue</small><strong>$48.2k</strong><em>▲ 12.4%</em></div>
            <div class="kpi"><small>Active users</small><strong>9,312</strong><em>▲ 4.1%</em></div>
            <div class="kpi"><small>Churn</small><strong>1.8%</strong><em>▼ 0.3%</em></div>
            <div class="bars"><i style="--v:38"></i><i style="--v:52"></i><i style="--v:45"></i><i style="--v:63"></i><i style="--v:58"></i><i style="--v:74"></i><i style="--v:69"></i><i style="--v:86"></i><i style="--v:80"></i><i style="--v:95"></i></div>
          </div>
        </div>
      </div>
    </div>
    <div class="logos"><small>Trusted by product teams at</small><span>Northwind</span><span>Acme&nbsp;Co</span><span>Globex</span><span>Initech</span><span>Umbrella</span></div>
  </div>
</section>"""
HERO_FTL = """<#-- hero.ftl: copy comes from the model; markup stays the same Colibri primitives -->
<section class="blk blk-hero">
  <div class="inner">
    <div class="copy">
      <#if hero.announce??><a class="announce" href="${hero.announce.url}"><b>New</b> ${hero.announce.text} →</a></#if>
      <h1>${hero.titleStart} <span class="grad">${hero.titleAccent}</span>${hero.titleEnd}</h1>
      <p class="lede">${hero.lede}</p>
      <div class="cta">
        <a class="btn" data-variant="primary" data-size="l" href="${hero.primary.url}">${hero.primary.label}</a>
        <a class="btn" data-variant="outline" data-size="l" href="${hero.secondary.url}">${hero.secondary.label}</a>
      </div>
      <div class="proof"><span class="faces" aria-hidden="true"><#list 1..5 as i><i style="--h:${i * 70}"></i></#list></span>
        <span><span class="stars" aria-label="5 out of 5">★★★★★</span> ${hero.proof}</span></div>
    </div>
    <#include "hero-mock.ftl">
    <div class="logos"><small>Trusted by product teams at</small><#list hero.logos as logo><span>${logo}</span></#list></div>
  </div>
</section>"""

TIERS = [("Starter", "For side projects and prototypes.", "0", "0", "Get started", "outline", None,
          ["All core components", "Light & dark", "1 theme pack", "Community support"], ["FreeMarker macros", "Priority support"]),
         ("Pro", "For teams shipping production apps.", "24", "19", "Start 14-day trial", "primary", "Most popular",
          ["Everything in Starter", "All theme packs", "FreeMarker macros", "React wrappers", "Dashboard templates"], []),
         ("Enterprise", "For organisations with custom needs.", "79", "64", "Talk to sales", "outline", None,
          ["Everything in Pro", "Custom theme pack", "SSO & audit logs", "Priority support", "99.9% SLA"], [])]
def tier(t):
    name, desc, m, y, cta, var, rib, on, off = t
    feat = ' data-featured' if rib else ''
    lis = "\n".join(f"        <li>{x}</li>" for x in on) + ("\n" if off else "") + "\n".join(f"        <li data-off>{x}</li>" for x in off)
    return f"""    <article class="tier"{feat}>
      {f'<span class="ribbon">{rib}</span>' if rib else ''}
      <div><h3>{name}</h3><p>{desc}</p></div>
      <div class="price"><strong>$<span data-monthly="{m}" data-yearly="{y}">{m}</span></strong><span data-per>/ month</span></div>
      <a class="btn" data-variant="{var}" data-size="l" href="#">{cta}</a>
      <ul>
{lis}
      </ul>
    </article>""".replace("      \n", "")
PRICING = f"""<section class="blk blk-pricing">
  <div class="inner">
    <div class="head">
      <span class="eyebrow">Pricing</span>
      <h2>Simple pricing that scales with you</h2>
      <p class="lede">Start free. Upgrade when your team needs every theme pack, FreeMarker macros and React wrappers.</p>
      <div class="billing" data-billing role="group" aria-label="Billing period">
        <button type="button" data-period="monthly" aria-pressed="true">Monthly</button>
        <button type="button" data-period="yearly" aria-pressed="false">Yearly <small>−20%</small></button>
      </div>
    </div>
    <div class="tiers">
{chr(10).join(tier(t) for t in TIERS)}
    </div>
    <p class="fineprint">Prices in USD. Cancel anytime. Need a hand choosing? <a href="#">Compare every feature</a>.</p>
  </div>
</section>"""
PRICING_FTL = """<#-- pricing.ftl: plans come from the model (List<Plan>); one loop renders every tier -->
<section class="blk blk-pricing">
  <div class="inner">
    <div class="head">
      <span class="eyebrow">Pricing</span>
      <h2>${pricing.title}</h2>
      <p class="lede">${pricing.lede}</p>
      <div class="billing" data-billing role="group" aria-label="Billing period">
        <button type="button" data-period="monthly" aria-pressed="true">Monthly</button>
        <button type="button" data-period="yearly" aria-pressed="false">Yearly <small>−${pricing.yearlyDiscount}%</small></button>
      </div>
    </div>
    <div class="tiers">
      <#list pricing.plans as plan>
      <article class="tier"<#if plan.featured> data-featured</#if>>
        <#if plan.featured><span class="ribbon">Most popular</span></#if>
        <div><h3>${plan.name}</h3><p>${plan.description}</p></div>
        <div class="price"><strong>$<span data-monthly="${plan.monthly}" data-yearly="${plan.yearly}">${plan.monthly}</span></strong><span data-per>/ month</span></div>
        <a class="btn" data-variant="${plan.featured?then('primary','outline')}" data-size="l" href="${plan.ctaUrl}">${plan.ctaLabel}</a>
        <ul>
          <#list plan.features as f><li<#if !f.included> data-off</#if>>${f.label}</li></#list>
        </ul>
      </article>
      </#list>
    </div>
    <p class="fineprint">Prices in USD. Cancel anytime. <a href="${pricing.compareUrl}">Compare every feature</a>.</p>
  </div>
</section>
<script type="module" src="${base}/blocks/blocks.js"></script>"""

SIGNUP = """<section class="blk blk-signup">
  <div class="inner">
    <div class="signup-form">
      <form class="stack" action="#" method="post">
        <header>
          <span class="brandmark"><i aria-hidden="true"></i>Colibri</span>
          <h2>Create your account</h2>
          <p>Start your 14-day trial. No card required.</p>
        </header>
        <div class="socials">
          <button class="btn" data-variant="outline" type="button"><span aria-hidden="true">G</span> Google</button>
          <button class="btn" data-variant="outline" type="button"><span aria-hidden="true"></span> GitHub</button>
        </div>
        <div class="or">or with email</div>
        <div class="field"><label for="su-name">Full name</label><input id="su-name" name="name" autocomplete="name" placeholder="Ada Lovelace" required></div>
        <div class="field"><label for="su-email">Work email</label><input id="su-email" name="email" type="email" autocomplete="email" placeholder="ada@company.com" required></div>
        <div class="field">
          <label for="su-pw">Password</label>
          <div class="pw"><input id="su-pw" name="password" type="password" autocomplete="new-password" minlength="8" placeholder="8+ characters" required><button type="button" aria-pressed="false" aria-controls="su-pw">Show</button></div>
          <div class="meter" data-score="0" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          <span class="hint">Use 8+ characters with a number and a symbol.</span>
        </div>
        <label class="terms"><input type="checkbox" required> <span>I agree to the <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.</span></label>
        <button class="btn" data-variant="primary" data-size="l" type="submit">Create account</button>
        <p class="switch-auth">Already have an account? <a href="#">Sign in</a></p>
      </form>
    </div>
    <aside class="signup-art">
      <figure>
        <blockquote>“We replaced four thousand lines of utility classes with forty lines of tokens. Our designers finally own the look again.”</blockquote>
        <figcaption><i aria-hidden="true"></i><span><b>Maya Okafor</b><br>Head of Design, Northwind</span></figcaption>
      </figure>
      <div class="stats"><div><strong>12k+</strong><span>apps shipped</span></div><div><strong>4.9/5</strong><span>avg. rating</span></div><div><strong>0 kB</strong><span>build step</span></div></div>
    </aside>
  </div>
</section>"""
SIGNUP_FTL = """<#import "/colibri/ui.ftl" as ui>
<#-- signup.ftl: plain form POST; server re-renders with errors in the same .field markup -->
<section class="blk blk-signup">
  <div class="inner">
    <div class="signup-form">
      <form class="stack" action="${signupUrl}" method="post">
        <input type="hidden" name="${_csrf.parameterName}" value="${_csrf.token}">
        <header><span class="brandmark"><i aria-hidden="true"></i>${brand}</span><h2>Create your account</h2><p>Start your 14-day trial. No card required.</p></header>
        <div class="socials"><#list oauthProviders as p><a class="btn" data-variant="outline" href="${p.url}">${p.label}</a></#list></div>
        <div class="or">or with email</div>
        <#macro field id label type="text" auto="" ph="">
        <div class="field"><label for="${id}">${label}</label><input id="${id}" name="${id}" type="${type}" autocomplete="${auto}" placeholder="${ph}" value="${(form[id])!}" required>
          <#if errors[id]??><span class="hint">${errors[id]}</span></#if></div>
        </#macro>
        <@field id="name" label="Full name" auto="name" ph="Ada Lovelace"/>
        <@field id="email" label="Work email" type="email" auto="email" ph="ada@company.com"/>
        <div class="field"><label for="password">Password</label>
          <div class="pw"><input id="password" name="password" type="password" autocomplete="new-password" minlength="8" required><button type="button" aria-pressed="false" aria-controls="password">Show</button></div>
          <div class="meter" data-score="0" aria-hidden="true"><i></i><i></i><i></i><i></i></div></div>
        <label class="terms"><input type="checkbox" name="terms" required> <span>I agree to the <a href="${termsUrl}">Terms</a>.</span></label>
        <button class="btn" data-variant="primary" data-size="l" type="submit">Create account</button>
        <p class="switch-auth">Already have an account? <a href="${loginUrl}">Sign in</a></p>
      </form>
    </div>
    <#include "signup-art.ftl">
  </div>
</section>"""

BLOCKS = [("hero", "Hero", "Marketing hero with announcement pill, gradient headline, social proof, product mock and logo cloud.", HERO, HERO_FTL),
          ("pricing", "Pricing", "Three tiers with a featured plan, monthly / yearly toggle and feature lists.", PRICING, PRICING_FTL),
          ("signup", "Signup", "Split signup: social sign-in, email form with password strength, testimonial panel. Collapses to one column.", SIGNUP, SIGNUP_FTL)]

def react(bid, html):
    name = bid.capitalize() + "Block"
    body = render(html).replace("export function Demo()", f"export function {name}()")
    body = "\n".join(l for l in body.splitlines() if not l.startswith("import "))
    L = body.splitlines(); istext = lambda l: l.strip() and not l.strip().startswith(("<", "{", ")", "return", "export", "}"))
    for i in range(len(L) - 1):
        a, b = L[i].strip(), L[i + 1].strip()
        if istext(L[i]) and b.startswith("<") and not b.startswith("</"): L[i] += '{" "}'
        elif a.startswith("<") and a.endswith(">") and not a.endswith("/>") and "</" in a and istext(L[i + 1]) and b[0].isalnum(): L[i] += '{" "}'
        elif a.startswith("</") and istext(L[i + 1]) and b[0].isalnum(): L[i] += '{" "}'
    body = "\n".join(L)
    hook = ('import "@colibri-kit/blocks/blocks.js"; // billing toggle / password reveal (or port to useState)\n' if bid != "hero" else "")
    return f'import "@colibri-kit/css";\nimport "@colibri-kit/blocks/blocks.css";\n{hook}\n{body.strip()}\n'

def page(bid, title, html):
    return HEAD.format(title=f"{title} block — Colibri Kit", extra="") + f'\n<body style="margin:0">\n{html}\n<script type="module" src="blocks.js"></script>\n</body></html>\n'

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
  <header class="g-head"><div><h2>{title}</h2><p>{desc}</p></div>
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

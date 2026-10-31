"""Markup for the marketing blocks. Behaviour comes from Colibri UI's headless core:
<ui-tabs>, <ui-dialog> custom elements and data-ui="…" components. blocks.js only glues prices + strength meter."""

FACES = [("AL", 20), ("MO", 90), ("JK", 160), ("SR", 230), ("TD", 300)]
HERO = """<section class="blk blk-hero">
  <div class="inner">
    <div class="copy">
      <a class="announce" href="#"><span data-ui="badge">New</span> Theme packs now change shape, not just colour →</a>
      <h1>Ship interfaces that look <span class="grad">designed</span>, not assembled.</h1>
      <p class="lede">Colibri Kit is modern CSS and tiny behaviours for server-rendered apps. Tokens, primitives and full theme packs. No utility soup, no build step.</p>
      <div class="cta">
        <a class="btn" data-variant="primary" data-size="l" href="#">Start building</a>
        <ui-dialog class="demo-dialog">
          <button class="btn" data-variant="outline" data-size="l" data-ui-part="trigger"><span class="play" aria-hidden="true">▶</span> Watch 2-min demo</button>
          <dialog data-ui-part="content">
            <header><h2 data-ui-part="title">Colibri Kit in two minutes</h2><button class="btn" data-variant="ghost" data-size="s" data-ui-part="close" aria-label="Close">✕</button></header>
            <p data-ui-part="description">Tokens, primitives and theme packs, from an empty page to a dashboard.</p>
            <div class="video" role="img" aria-label="Demo video placeholder"><span class="play" aria-hidden="true">▶</span></div>
          </dialog>
        </ui-dialog>
      </div>
      <div class="proof">
        <span class="faces">""" + "".join(f'<span data-ui="avatar" style="--h:{h}"><span data-ui-part="fallback">{i}</span></span>' for i, h in FACES) + """</span>
        <div data-ui="tooltip" data-side="bottom" data-delay="150">
          <button class="rating" type="button" data-ui-part="trigger"><span class="stars" aria-hidden="true">★★★★★</span> 4.9 from 312 reviews</button>
          <div data-ui-part="content">Average rating across G2 and Product Hunt</div>
        </div>
      </div>
    </div>
    <div class="mock">
      <div class="win">
        <div class="win-bar" aria-hidden="true"><i></i><i></i><i></i><span>app.colibri.dev/overview</span></div>
        <ui-tabs class="win-body" data-default-value="overview">
          <div class="win-side" data-ui-part="list" aria-label="Demo app sections" data-orientation="vertical">
            <button data-ui-part="trigger" data-value="overview">Overview</button>
            <button data-ui-part="trigger" data-value="reports">Reports</button>
            <button data-ui-part="trigger" data-value="team">Team</button>
          </div>
          <div class="win-main" data-ui-part="panel" data-value="overview">
            <div class="kpi"><small>Revenue</small><strong>$48.2k</strong><em>▲ 12.4%</em></div>
            <div class="kpi"><small>Active users</small><strong>9,312</strong><em>▲ 4.1%</em></div>
            <div class="kpi"><small>Churn</small><strong>1.8%</strong><em data-tone="down">▼ 0.3%</em></div>
            <div class="bars" aria-hidden="true"><i style="--v:38"></i><i style="--v:52"></i><i style="--v:45"></i><i style="--v:63"></i><i style="--v:58"></i><i style="--v:74"></i><i style="--v:69"></i><i style="--v:86"></i><i style="--v:80"></i><i style="--v:95"></i></div>
          </div>
          <div class="win-main" data-ui-part="panel" data-value="reports">
            <div class="report"><span>Q3 revenue summary</span><span data-ui="badge" data-variant="success">Ready</span></div>
            <div class="report"><span>Cohort retention</span><span data-ui="badge">Draft</span></div>
            <div class="report"><span>Funnel by channel</span><span data-ui="badge" data-variant="success">Ready</span></div>
            <div class="meter-row"><span>Monthly goal</span><div data-ui="progress" data-value="72" aria-label="Monthly goal"><div data-ui-part="indicator"></div></div><b>72%</b></div>
          </div>
          <div class="win-main" data-ui-part="panel" data-value="team">""" + "".join(f'\n            <div class="member"><span data-ui="avatar" style="--h:{h}"><span data-ui-part="fallback">{i}</span></span><span><b>{n}</b><small>{r}</small></span></div>' for (i, h), n, r in zip(FACES, ["Ada Lovelace", "Maya Okafor", "Jon Kim", "Sara Ruiz"], ["Owner", "Design", "Engineering", "Support"])) + """
          </div>
        </ui-tabs>
      </div>
    </div>
    <div class="logos"><small>Trusted by product teams at</small><span>Northwind</span><span>Acme&nbsp;Co</span><span>Globex</span><span>Initech</span><span>Umbrella</span></div>
  </div>
</section>"""
HERO_FTL = """[#import "/colibri/ui.ftl" as ui]
[#-- hero.ftl: copy from the model; behaviour from Colibri UI macros (dialog, tooltip, avatar, badge) --]
<section class="blk blk-hero">
  <div class="inner">
    <div class="copy">
      <a class="announce" href="${hero.announce.url}">[@ui.badge]New[/@ui.badge] ${hero.announce.text} →</a>
      <h1>${hero.titleStart} <span class="grad">${hero.titleAccent}</span>${hero.titleEnd}</h1>
      <p class="lede">${hero.lede}</p>
      <div class="cta">
        <a class="btn" data-variant="primary" data-size="l" href="${hero.primary.url}">${hero.primary.label}</a>
        [@ui.dialog trigger="▶ Watch 2-min demo" title="Colibri Kit in two minutes" description=hero.demo.caption attrs={"class":"demo-dialog"}]
          <video src="${hero.demo.src}" controls preload="none" poster="${hero.demo.poster}"></video>
        [/@ui.dialog]
      </div>
      <div class="proof">
        <span class="faces">[#list hero.reviewers as r][@ui.avatar src=r.photo alt=r.name fallback=r.initials/][/#list]</span>
        [@ui.tooltip text="Average rating across G2 and Product Hunt" side="bottom"]
          <button class="rating" type="button"><span class="stars" aria-hidden="true">★★★★★</span> ${hero.rating} from ${hero.reviews} reviews</button>
        [/@ui.tooltip]
      </div>
    </div>
    [#include "hero-mock.ftl"]  [#-- <ui-tabs> app preview: Overview / Reports / Team --]
    <div class="logos"><small>Trusted by product teams at</small>[#list hero.logos as logo]<span>${logo}</span>[/#list]</div>
  </div>
</section>
<script type="module">import "/colibri/core/auto.js"; import "/colibri/elements/all.js";</script>"""

TIERS = [("starter", "Starter", "For side projects and prototypes.", "0", "0", "Get started", "outline", None,
          ["All core components", "Light & dark", "1 theme pack", "Community support"], ["FreeMarker macros", "Priority support"]),
         ("pro", "Pro", "For teams shipping production apps.", "24", "19", "Start 14-day trial", "primary", "Most popular",
          ["Everything in Starter", "All theme packs", "FreeMarker macros", "React wrappers", "Dashboard templates"], []),
         ("enterprise", "Enterprise", "For organisations with custom needs.", "79", "64", None, "outline", None,
          ["Everything in Pro", "Custom theme pack", "SSO & audit logs|SAML / OIDC single sign-on and an exportable audit trail", "Priority support", "99.9% SLA"], [])]
SALES = """<ui-dialog>
        <button class="btn" data-variant="outline" data-size="l" data-ui-part="trigger">Talk to sales</button>
        <dialog data-ui-part="content" class="sales">
          <header><h2 data-ui-part="title">Talk to sales</h2><button class="btn" data-variant="ghost" data-size="s" data-ui-part="close" aria-label="Close">✕</button></header>
          <p data-ui-part="description">Tell us about your team and we will reply within one business day.</p>
          <form method="dialog" class="stack">
            <div data-ui="field"><label data-ui-part="label">Work email</label><input data-ui-part="control" type="email" required placeholder="you@company.com"><p data-ui-part="error"></p></div>
            <div data-ui="field"><label data-ui-part="label">Team size</label><input data-ui-part="control" type="number" min="1" value="25"><p data-ui-part="description">Approximate seats.</p></div>
            <div class="row"><button class="btn" data-variant="ghost" value="cancel" formnovalidate>Cancel</button><button class="btn" data-variant="primary" value="send">Send request</button></div>
          </form>
        </dialog>
      </ui-dialog>"""
def _li(x, off=False):
    if "|" in x:
        t, tip = x.split("|")
        return f'        <li><span>{t}</span> <span data-ui="tooltip" data-delay="100"><button class="info" type="button" data-ui-part="trigger" aria-label="About {t}">i</button><span data-ui-part="content">{tip}</span></span></li>'
    return f'        <li{" data-off" if off else ""}>{x}</li>'
def _tier(t):
    tid, name, desc, m, y, cta, var, rib, on, off = t
    btn = f'<a class="btn" data-variant="{var}" data-size="l" href="#">{cta}</a>' if cta else SALES
    return (f'    <article class="tier"{" data-featured" if rib else ""}>\n'
            + (f'      <span class="ribbon">{rib}</span>\n' if rib else "")
            + f'      <div><h3>{name}</h3><p>{desc}</p></div>\n'
            f'      <div class="price"><strong>$<span data-monthly="{m}" data-yearly="{y}">{m}</span></strong><span data-per>/ month</span></div>\n'
            f'      {btn}\n      <ul>\n' + "\n".join([_li(x) for x in on] + [_li(x, True) for x in off]) + '\n      </ul>\n    </article>')
FAQ = [("Can I switch plans later?", "Yes. Upgrade or downgrade any time; we prorate the difference to the day."),
       ("Do I need a build step?", "No. Link the CSS and one module script. FreeMarker macros and React wrappers are optional."),
       ("What counts as a seat?", "Anyone who can sign in to your workspace. Viewers on public pages are free.")]
PRICING = """<section class="blk blk-pricing">
  <div class="inner">
    <div class="head">
      <span class="eyebrow">Pricing</span>
      <h2>Simple pricing that scales with you</h2>
      <p class="lede">Start free. Upgrade when your team needs every theme pack, FreeMarker macros and React wrappers.</p>
      <div class="billing">
        <div data-ui="toggle-group" data-type="single" data-default-value="monthly" aria-label="Billing period">
          <button data-ui-part="item" data-value="monthly">Monthly</button>
          <button data-ui-part="item" data-value="yearly">Yearly <small>−20%</small></button>
        </div>
      </div>
    </div>
    <div class="tiers">
""" + "\n".join(_tier(t) for t in TIERS) + """
    </div>
    <div class="faq">
      <h3>Questions, answered</h3>
      <div data-ui="accordion" data-type="single" data-collapsible data-default-value="q0">""" + "".join(f"""
        <div data-ui-part="item" data-value="q{i}"><h4><button data-ui-part="trigger">{q}</button></h4><div data-ui-part="content"><p>{a}</p></div></div>""" for i, (q, a) in enumerate(FAQ)) + """
      </div>
    </div>
  </div>
</section>"""
PRICING_FTL = """[#import "/colibri/ui.ftl" as ui]
[#-- pricing.ftl: plans + faq come from the model; toggle-group, tooltip, dialog, accordion from Colibri UI --]
<section class="blk blk-pricing">
  <div class="inner">
    <div class="head">
      <span class="eyebrow">Pricing</span>
      <h2>${pricing.title}</h2>
      <p class="lede">${pricing.lede}</p>
      <div class="billing">[@ui.toggleGroup type="single" value="monthly" label="Billing period" items=[
        {"value":"monthly", "label":"Monthly"}, {"value":"yearly", "label":"Yearly −${pricing.yearlyDiscount}%"}
      ]/]</div>
    </div>
    <div class="tiers">
      [#list pricing.plans as plan]
      <article class="tier"[#if plan.featured] data-featured[/#if]>
        [#if plan.featured]<span class="ribbon">Most popular</span>[/#if]
        <div><h3>${plan.name}</h3><p>${plan.description}</p></div>
        <div class="price"><strong>$<span data-monthly="${plan.monthly}" data-yearly="${plan.yearly}">${plan.monthly}</span></strong><span data-per>/ month</span></div>
        [#if plan.contactSales]
          [@ui.dialog trigger="Talk to sales" title="Talk to sales" description="We reply within one business day."]
            <form method="post" action="${salesUrl}" class="stack">
              [@ui.field label="Work email" id="sales-email"][@ui.input name="email" id="sales-email" type="email" required=true/][/@ui.field]
              [@ui.field label="Team size" id="sales-seats" description="Approximate seats."][@ui.input name="seats" id="sales-seats" type="number" value="25"/][/@ui.field]
              [@ui.button variant="primary" type="submit"]Send request[/@ui.button]
            </form>
          [/@ui.dialog]
        [#else]
          <a class="btn" data-variant="${plan.featured?then('primary','outline')}" data-size="l" href="${plan.ctaUrl}">${plan.ctaLabel}</a>
        [/#if]
        <ul>
          [#list plan.features as f]<li[#if !f.included] data-off[/#if]>${f.label}[#if f.tip??] [@ui.tooltip text=f.tip]<button class="info" type="button" aria-label="About ${f.label}">i</button>[/@ui.tooltip][/#if]</li>[/#list]
        </ul>
      </article>
      [/#list]
    </div>
    <div class="faq"><h3>Questions, answered</h3>
      [@ui.accordion default="q0" items=pricing.faq/]  [#-- [{value,title,content}] --]
    </div>
  </div>
</section>
<script type="module">import "/colibri/core/auto.js"; import "/colibri/elements/all.js"; import "/colibri/blocks/blocks.js";</script>"""

SIGNUP = """<section class="blk blk-signup">
  <div class="inner">
    <div class="signup-form">
      <form class="stack" action="#" method="post" novalidate>
        <header>
          <span class="brandmark"><i aria-hidden="true"></i>Colibri</span>
          <h2>Create your account</h2>
          <p>Start your 14-day trial. No card required.</p>
        </header>
        <div class="socials">
          <button class="btn" data-variant="outline" type="button"><span aria-hidden="true">G</span> Google</button>
          <button class="btn" data-variant="outline" type="button"><span aria-hidden="true">⌥</span> GitHub</button>
        </div>
        <div class="or">or with email</div>
        <ui-tabs class="acct" data-default-value="personal">
          <div data-ui-part="list" aria-label="Account type"><button type="button" data-ui-part="trigger" data-value="personal">Personal</button><button type="button" data-ui-part="trigger" data-value="team">Team</button></div>
          <div data-ui-part="panel" data-value="personal"><p class="hint-row">Just you. Invite people later.</p></div>
          <div data-ui-part="panel" data-value="team">
            <div data-ui="field"><label data-ui-part="label">Workspace name</label><input data-ui-part="control" name="workspace" placeholder="Northwind Design"><p data-ui-part="description">colibri.app/<b>northwind-design</b></p></div>
          </div>
        </ui-tabs>
        <div data-ui="field"><label data-ui-part="label">Full name</label><input data-ui-part="control" name="name" autocomplete="name" placeholder="Ada Lovelace" required><p data-ui-part="error"></p></div>
        <div data-ui="field"><label data-ui-part="label">Work email</label><input data-ui-part="control" name="email" type="email" autocomplete="email" placeholder="ada@company.com" required><p data-ui-part="error"></p></div>
        <div data-ui="field">
          <label data-ui-part="label">Password</label>
          <div class="pw" data-ui="toggle-password"><input data-ui-part="input" name="password" type="password" autocomplete="new-password" minlength="8" placeholder="8+ characters" required><button type="button" data-ui-part="toggle" aria-label="Show password">Show</button></div>
          <div class="meter" data-score="0" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          <p data-ui-part="description">Use 8+ characters with a number and a symbol.</p>
        </div>
        <label class="pref"><span><b>Product updates</b><small>One email a month. No spam.</small></span><button type="button" data-ui="switch" aria-checked="true" aria-label="Product updates"></button></label>
        <label class="terms"><input type="checkbox" data-ui="checkbox" required> <span>I agree to the <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.</span></label>
        <button class="btn" data-variant="primary" data-size="l" type="submit">Create account</button>
        <p class="switch-auth">Already have an account? <a href="#">Sign in</a></p>
      </form>
    </div>
    <aside class="signup-art">
      <figure>
        <blockquote>“We replaced four thousand lines of utility classes with forty lines of tokens. Our designers finally own the look again.”</blockquote>
        <figcaption><span data-ui="avatar" style="--h:90"><span data-ui-part="fallback">MO</span></span><span><b>Maya Okafor</b><br>Head of Design, Northwind</span></figcaption>
      </figure>
      <div class="stats"><div><strong>12k+</strong><span>apps shipped</span></div><div><strong>4.9/5</strong><span>avg. rating</span></div><div><strong>0 kB</strong><span>build step</span></div></div>
    </aside>
  </div>
</section>"""
SIGNUP_FTL = """[#import "/colibri/ui.ftl" as ui]
[#-- signup.ftl: plain POST; server re-renders with errors[] → field shows them (data-invalid) --]
<section class="blk blk-signup">
  <div class="inner">
    <div class="signup-form">
      <form class="stack" action="${signupUrl}" method="post">
        <input type="hidden" name="${_csrf.parameterName}" value="${_csrf.token}">
        <header><span class="brandmark"><i aria-hidden="true"></i>${brand}</span><h2>Create your account</h2><p>Start your 14-day trial. No card required.</p></header>
        <div class="socials">[#list oauthProviders as p]<a class="btn" data-variant="outline" href="${p.url}">${p.label}</a>[/#list]</div>
        <div class="or">or with email</div>
        <ui-tabs class="acct" data-default-value="${(form.type)!'personal'}">
          <div data-ui-part="list" aria-label="Account type"><button type="button" data-ui-part="trigger" data-value="personal">Personal</button><button type="button" data-ui-part="trigger" data-value="team">Team</button></div>
          <div data-ui-part="panel" data-value="personal"><p class="hint-row">Just you. Invite people later.</p></div>
          <div data-ui-part="panel" data-value="team">
            [@ui.field label="Workspace name" id="workspace" error=(errors.workspace)!""][@ui.input name="workspace" id="workspace" value=(form.workspace)!/][/@ui.field]
          </div>
        </ui-tabs>
        [@ui.field label="Full name" id="name" error=(errors.name)!""][@ui.input name="name" id="name" value=(form.name)! required=true attrs={"autocomplete":"name"}/][/@ui.field]
        [@ui.field label="Work email" id="email" error=(errors.email)!""][@ui.input name="email" id="email" type="email" value=(form.email)! required=true/][/@ui.field]
        [@ui.field label="Password" id="password" description="Use 8+ characters with a number and a symbol." error=(errors.password)!""]
          <div class="pw" data-ui="toggle-password">[@ui.input name="password" id="password" type="password" required=true attrs={"data-ui-part":"input","minlength":"8"}/]<button type="button" data-ui-part="toggle" aria-label="Show password">Show</button></div>
          <div class="meter" data-score="0" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
        [/@ui.field]
        <div class="pref"><span><b>Product updates</b><small>One email a month.</small></span>[@ui.switch name="updates" checked=(form.updates)!true/]</div>
        [@ui.checkbox name="terms" label="I agree to the Terms and Privacy Policy." attrs={"required":"required"}/]
        [@ui.button variant="primary" type="submit" attrs={"data-size":"l"}]Create account[/@ui.button]
        <p class="switch-auth">Already have an account? <a href="${loginUrl}">Sign in</a></p>
      </form>
    </div>
    [#include "signup-art.ftl"]
  </div>
</section>
<script type="module">import "/colibri/core/auto.js"; import "/colibri/elements/all.js"; import "/colibri/blocks/blocks.js";</script>"""

USES = {"hero": ["<ui-dialog> (demo video modal)", "<ui-tabs> (app preview: Overview / Reports / Team)", 'data-ui="tooltip" (rating)', 'data-ui="avatar" ×9', 'data-ui="badge"', 'data-ui="progress"'],
        "pricing": ['data-ui="toggle-group" (Monthly / Yearly)', '<ui-dialog> + data-ui="field" (Talk to sales form)', 'data-ui="tooltip" (feature info)', 'data-ui="accordion" (FAQ)'],
        "signup": ['<ui-tabs> (Personal / Team)', 'data-ui="field" ×4 (ids, aria, errors)', 'data-ui="toggle-password"', 'data-ui="switch"', 'data-ui="checkbox"', 'data-ui="avatar"']}

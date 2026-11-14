"""Composed blocks: shadcn sidebar-01..16, login-01..05, signup-01..05. Pure composition of existing Colibri parts."""
from sink_catalog_base import add, C
from sink_info import INFO
from sink_code import FTL
from sink_icons import I

NAV = [("Getting started", [("Installation", "home"), ("Project structure", "folder")]),
       ("Building", [("Routing", "link"), ("Data fetching", "inbox"), ("Rendering", "chart"), ("Caching", "settings")]),
       ("API reference", [("Components", "panel"), ("Functions", "terminal"), ("CLI", "terminal")])]
MAIN = [("Playground", "terminal", ["History", "Starred", "Settings"]), ("Models", "bot", ["Genesis", "Explorer", "Quantum"]),
        ("Documentation", "book", ["Introduction", "Get started", "Tutorials"]), ("Settings", "settings", ["General", "Team", "Billing"])]

def team(sid):
    return (f'<div data-ui="dropdown-menu" data-ui-part="team"><button data-ui-part="trigger" class="sb-team"><span class="sb-logo">{I("logo",16)}</span><span class="sb-text"><b>Despani</b><small>Enterprise</small></span><i data-ui-part="chevron" aria-hidden="true"></i></button>'
            f'<div data-ui-part="content"><div data-ui-part="label">Teams</div><button data-ui-part="item">Despani</button><button data-ui-part="item">L3V</button><hr data-ui-part="separator"><button data-ui-part="item">Add team</button></div></div>')
def user():
    return ('<div data-ui="dropdown-menu" data-ui-part="user"><button data-ui-part="trigger" class="sb-team"><span data-ui="avatar" data-ui-part="avatar"><span data-ui-part="fallback">LD</span></span><span class="sb-text"><b>levan</b><small>levan@despani.ge</small></span><i data-ui-part="chevron" aria-hidden="true"></i></button>'
            '<div data-ui-part="content"><button data-ui-part="item">Account</button><button data-ui-part="item">Billing</button><hr data-ui-part="separator"><button data-ui-part="item">Log out</button></div></div>')
def mb(label, icon=None, cur=False, extra=""):
    return f'<a data-ui-part="menu-button" href="#"{" aria-current=page" if cur else ""} {extra}>{I(icon) if icon else ""}<span class="sb-text">{label}</span></a>'
def groups_flat(labels=True):
    return "".join(f'<div data-ui-part="group">{f"<div data-ui-part=group-label>{g}</div>" if labels else ""}<ul data-ui-part="menu">' + "".join(f"<li>{mb(t, None, g == 'Building' and t == 'Data fetching')}</li>" for t, _ in items) + "</ul></div>" for g, items in NAV)
def groups_collapsible():
    return "".join(f'<div data-ui="collapsible" data-ui-part="group" data-default-open><button data-ui-part="trigger" class="sb-group-trigger">{g}<i data-ui-part="chevron" aria-hidden="true"></i></button><div data-ui-part="content"><ul data-ui-part="menu">' + "".join(f"<li>{mb(t)}</li>" for t, _ in items) + "</ul></div></div>" for g, items in NAV)
def groups_sub(always=True):
    return '<div data-ui-part="group"><ul data-ui-part="menu">' + "".join(f'<li>{mb(g, None)}<ul data-ui-part="menu-sub">' + "".join(f"<li>{mb(t, None, t == 'Data fetching')}</li>" for t, _ in items) + "</ul></li>" for g, items in NAV) + "</ul></div>"
def groups_collapsible_sub(icons=True):
    return '<div data-ui-part="group"><div data-ui-part="group-label">Platform</div><ul data-ui-part="menu">' + "".join(
        f'<li data-ui="collapsible"{" data-default-open" if k == 0 else ""}><button data-ui-part="trigger" class="sb-mb" data-ui-part-alias="menu-button">{I(ic) if icons else ""}<span class="sb-text">{t}</span><i data-ui-part="chevron" aria-hidden="true"></i></button><div data-ui-part="content"><ul data-ui-part="menu-sub">'
        + "".join(f"<li>{mb(s, None, k == 0 and s == 'History')}</li>" for s in subs) + "</ul></div></li>" for k, (t, ic, subs) in enumerate(MAIN)) + "</ul></div>"
def groups_dropdown():
    return '<div data-ui-part="group"><ul data-ui-part="menu">' + "".join(
        f'<li data-ui="dropdown-menu" data-side="right"><button data-ui-part="trigger" class="sb-mb">{I(ic)}<span class="sb-text">{t}</span><i data-ui-part="chevron" data-dir="right" aria-hidden="true"></i></button><div data-ui-part="content">'
        + "".join(f'<button data-ui-part="item">{s}</button>' for s in subs) + "</div></li>" for t, ic, subs in MAIN) + "</ul></div>"
def projects():
    return '<div data-ui-part="group"><div data-ui-part="group-label">Projects</div><ul data-ui-part="menu">' + "".join(f"<li>{mb(t, ic)}</li>" for t, ic in (("Design engineering", "panel"), ("Sales & marketing", "chart"), ("Travel", "flag"))) + "</ul></div>"
def secondary():
    return '<div data-ui-part="group" data-position="bottom"><ul data-ui-part="menu">' + mb("Support", "alert").join(["<li>", "</li>"]) + mb("Feedback", "send").join(["<li>", "</li>"]) + "</ul></div>"

def inset(sid, title="Data fetching", extra_btn=""):
    return (f'<main data-ui-part="inset"><header data-ui-part="inset-header"><button data-ui-sidebar-toggle="#{sid}" class="sb-icon-btn" aria-label="Toggle sidebar">{I("panel",16)}</button>'
            f'<hr data-ui="separator" data-orientation="vertical"><nav aria-label="Breadcrumb" data-ui-part="breadcrumb"><ol><li><a href="#">Building your application</a></li><li><span aria-current="page">{title}</span></li></ol></nav><span style="flex:1"></span>{extra_btn}</header>'
            '<div class="sb-body"><div class="sb-tiles"><div></div><div></div><div></div></div><div class="sb-big"></div></div></main>')
def sidebar(sid, body, header="", footer="", side="left", variant="sidebar", collapsible="offcanvas", rail=True):
    return (f'<aside data-ui="sidebar" id="{sid}" data-side="{side}" data-variant="{variant}" data-collapsible="{collapsible}" data-shortcut="false" data-breakpoint="0" data-storage-key="colibri.sink.{sid}" aria-label="Sidebar">'
            f'{f"<div data-ui-part=header>{header}</div>" if header else ""}<div data-ui-part="content">{body}</div>{f"<div data-ui-part=footer>{footer}</div>" if footer else ""}'
            f'{f"<button data-ui-part=rail data-ui-sidebar-toggle=#{sid} aria-label=Toggle&#32;sidebar tabindex=-1></button>" if rail else ""}</aside>')
def shell(inner, variant="sidebar", h=420):
    return f'<div class="sb-frame" style="height:{h}px"><div data-ui-part="shell" data-variant="{variant}">{inner}</div></div>'
SEARCH = f'<form data-ui-part="search" role="search"><input type="search" placeholder="Search the docs…" aria-label="Search the docs"></form>'
VERSION = '<div data-ui="dropdown-menu"><button data-ui-part="trigger" class="sb-team"><span class="sb-logo">' + I("book", 16) + '</span><span class="sb-text"><b>Documentation</b><small>v1.0.1</small></span><i data-ui-part="chevron" aria-hidden="true"></i></button><div data-ui-part="content"><button data-ui-part="item" data-type="radio" aria-checked="true">v1.0.1</button><button data-ui-part="item" data-type="radio">v2.0.0-beta</button></div></div>'

G = "Sidebar blocks"
SB = {}
SB["sidebar-01"] = ("Simple, grouped", "A simple sidebar with navigation grouped by section.", shell(sidebar("sb01", groups_flat(), VERSION + SEARCH) + inset("sb01")))
SB["sidebar-02"] = ("Collapsible sections", "A sidebar whose sections fold open and closed.", shell(sidebar("sb02", groups_collapsible(), VERSION + SEARCH) + inset("sb02")))
SB["sidebar-03"] = ("With submenus", "A sidebar with always-visible submenus.", shell(sidebar("sb03", groups_sub(), VERSION) + inset("sb03")))
SB["sidebar-04"] = ("Floating with submenus", "A floating (detached, rounded) sidebar with submenus.", shell(sidebar("sb04", groups_sub(), VERSION, variant="floating") + inset("sb04"), "floating"))
SB["sidebar-05"] = ("Collapsible submenus", "Each top-level item folds open to show its submenu.", shell(sidebar("sb05", groups_collapsible_sub(False), VERSION + SEARCH) + inset("sb05")))
SB["sidebar-06"] = ("Submenus as dropdowns", "Top-level items open their submenu as a dropdown to the side.", shell(sidebar("sb06", groups_dropdown(), VERSION, footer='<div class="sb-card"><b>Upgrade to Pro</b><p class="muted">Unlock all features.</p><button data-ui="button" data-size="sm">Upgrade</button></div>') + inset("sb06")))
SB["sidebar-07"] = ("Collapses to icons", "Collapses to a narrow icon rail (Ctrl/Cmd+B on the real app); hover icons for tooltips.", shell(sidebar("sb07", groups_collapsible_sub() + projects(), team("sb07"), user(), collapsible="icon") + inset("sb07")))
SB["sidebar-08"] = ("Inset with secondary nav", "The content sits in an inset card; extra links are pinned at the bottom.", shell(sidebar("sb08", groups_collapsible_sub() + projects() + secondary(), team("sb08"), user(), variant="inset") + inset("sb08"), "inset"))
mails = "".join(f'<a href="#" class="sb-mail"><b>{n}</b><small>{t}</small><span>{s}</span></a>' for n, t, s in (("William Smith", "09:34 AM", "Meeting tomorrow"), ("Alice Smith", "Yesterday", "Re: Project update"), ("Bob Johnson", "2 days ago", "Weekend plans"), ("Emily Davis", "2 days ago", "Re: Question about budget")))
SB["sidebar-09"] = ("Nested sidebars", "An icon rail next to a second, collapsible list sidebar (mail-style).",
 shell(f'<aside data-ui-part="icon-rail" aria-label="Apps"><span class="sb-logo">{I("logo",16)}</span>' + "".join(f'<span data-ui="tooltip" data-side="right"><button data-ui-part="trigger" class="sb-icon-btn"{" aria-current=page" if k == 0 else ""} aria-label="{n}">{I(ic)}</button><span data-ui-part="content">{n}</span></span>' for k, (n, ic) in enumerate((("Inbox", "inbox"), ("Drafts", "file"), ("Sent", "send"), ("Trash", "x")))) + '</aside>'
       + sidebar("sb09", mails, '<div class="sb-row"><b>Inbox</b><label class="sb-unread"><button data-ui="switch" aria-label="Unreads"></button> Unreads</label></div>' + '<form data-ui-part="search" role="search"><input type="search" placeholder="Type to search…" aria-label="Search mail"></form>') + inset("sb09", "Inbox")))
SB["sidebar-10"] = ("Sidebar with popover", "A sidebar whose workspace switcher and page actions open in popovers.",
 shell(sidebar("sb10", groups_collapsible_sub() + projects(), '<div data-ui="popover"><button data-ui-part="trigger" class="sb-team"><span class="sb-logo">' + I("logo",16) + '</span><span class="sb-text"><b>Acme Inc</b></span><i data-ui-part="chevron" aria-hidden="true"></i></button><div data-ui-part="content"><b>Workspaces</b><ul><li>Acme Inc</li><li>Acme Corp</li></ul><button data-ui-part="close" data-ui="button" data-size="sm">Done</button></div></div>')
       + inset("sb10", "Project Management", '<div data-ui="popover"><button data-ui-part="trigger" class="sb-icon-btn" aria-label="Page actions">' + I("settings",16) + '</button><div data-ui-part="content"><button data-ui="button" data-variant="ghost" data-size="sm">Customize page</button><br><button data-ui="button" data-variant="ghost" data-size="sm">Copy link</button><br><button data-ui="button" data-variant="ghost" data-size="sm">Move to trash</button></div></div>')))
TREE = ('<ul data-ui="file-tree" aria-label="Files"><li data-ui-part="folder" data-path="app" data-default-open><span data-ui-part="label">app</span><ul data-ui-part="group"><li data-ui-part="folder" data-path="app/api"><span data-ui-part="label">api</span><ul data-ui-part="group"><li data-ui-part="file" data-path="app/api/hello/route.ts">route.ts</li></ul></li>'
        '<li data-ui-part="file" data-path="app/page.tsx" data-selected>page.tsx</li><li data-ui-part="file" data-path="app/layout.tsx">layout.tsx</li></ul></li><li data-ui-part="folder" data-path="components"><span data-ui-part="label">components</span><ul data-ui-part="group"><li data-ui-part="file" data-path="components/ui/button.tsx">button.tsx</li></ul></li><li data-ui-part="file" data-path="package.json">package.json</li></ul>')
SB["sidebar-11"] = ("Collapsible file tree", "A sidebar with a changes list and a keyboard-navigable file tree.",
 shell(sidebar("sb11", '<div data-ui-part="group"><div data-ui-part="group-label">Changes</div><ul data-ui-part="menu">' + "".join(f"<li>{mb(f, 'file')}</li>" for f in ("README.md", "api/hello/route.ts", "app/layout.tsx")) + '</ul></div><div data-ui-part="group"><div data-ui-part="group-label">Files</div>' + TREE + "</div>") + inset("sb11", "page.tsx")))
SB["sidebar-12"] = ("With a calendar", "A sidebar holding a date picker calendar and calendar lists.",
 shell(sidebar("sb12", '<div data-ui="calendar" data-mode="single" data-locale="en"></div><hr data-ui="separator">' + groups_collapsible().replace("Getting started", "My calendars").replace("Building", "Favorites").replace("API reference", "Other"), user()) + inset("sb12", "October 2026"), h=520))
SB["sidebar-13"] = ("Sidebar in a dialog", "A settings dialog with its own sidebar navigation.",
 '<div data-ui="dialog"><button data-ui-part="trigger" data-ui="button">Open settings</button><dialog data-ui-part="content" class="sb-dialog"><h2 data-ui-part="title" class="sr-only">Settings</h2><div data-ui-part="shell" data-variant="sidebar">'
 + sidebar("sb13", '<ul data-ui-part="menu">' + "".join(f"<li>{mb(t, ic, t == 'Messages & media')}</li>" for t, ic in (("Notifications", "alert"), ("Navigation", "link"), ("Home", "home"), ("Appearance", "panel"), ("Messages & media", "inbox"), ("Language & region", "flag"), ("Privacy & visibility", "settings"))) + "</ul>", rail=False)
 + inset("sb13", "Messages & media") + '</div><button data-ui-part="close" class="sb-close" aria-label="Close">' + I("x",16) + '</button></dialog></div>')
SB["sidebar-14"] = ("Sidebar on the right", "The same sidebar docked on the right side.", shell(inset("sb14", "Table of contents", f'<button data-ui-sidebar-toggle="#sb14" class="sb-icon-btn" aria-label="Toggle right sidebar">{I("panel",16)}</button>').replace(f'<button data-ui-sidebar-toggle="#sb14" class="sb-icon-btn" aria-label="Toggle sidebar">{I("panel",16)}</button><hr data-ui="separator" data-orientation="vertical">', "", 1) + sidebar("sb14", groups_flat(), side="right")))
SB["sidebar-15"] = ("Left and right sidebars", "Navigation on the left and a calendar/details sidebar on the right.",
 shell(sidebar("sb15l", groups_collapsible_sub() + projects(), team("sb15"), user()) + inset("sb15l", "Project", f'<button data-ui-sidebar-toggle="#sb15r" class="sb-icon-btn" aria-label="Toggle right sidebar">{I("panel",16)}</button>')
       + sidebar("sb15r", '<div data-ui="calendar" data-mode="single" data-locale="en"></div>', side="right"), h=520))
SB["sidebar-16"] = ("Sticky site header", "A full-width sticky header above the sidebar and content.",
 f'<div class="sb-frame" style="height:440px"><header data-ui-part="site-header"><button data-ui-sidebar-toggle="#sb16" class="sb-icon-btn" aria-label="Toggle sidebar">{I("panel",16)}</button><hr data-ui="separator" data-orientation="vertical"><nav aria-label="Breadcrumb" data-ui-part="breadcrumb"><ol><li><a href="#">Building</a></li><li><span aria-current="page">Data fetching</span></li></ol></nav><span style="flex:1"></span>{SEARCH}</header>'
 '<div data-ui-part="shell" data-variant="inset">' + sidebar("sb16", groups_collapsible_sub() + projects() + secondary(), team("sb16"), user(), variant="inset").replace('data-ui="sidebar"', 'data-ui="sidebar" data-under-header') + inset("sb16").replace('<header data-ui-part="inset-header">', '<header data-ui-part="inset-header" hidden>') + "</div></div>")

for k, (title, what, demo) in SB.items():
    add(G, k, f"Sidebar: {title}", "done", "Sidebar layouts", f"Block {k}",
        "Composed from Sidebar (data-state expanded/collapsed, toggles get aria-expanded/aria-controls; Ctrl/Cmd+B in apps, off here so blocks don't fight), Collapsible, Dropdown menu, Popover, Tooltip, Calendar and File tree. Below the breakpoint the sidebar becomes an off-canvas sheet (Esc / outside click closes). The current page link has aria-current=page.",
        demo)
    INFO[k] = (f"Sidebar · {title}", what, "App shells, docs sites and dashboards. Copy the markup and swap in your links.")
    FTL[k] = ('[@ui.sidebarShell id="app-sidebar" variant="' + ("floating" if k == "sidebar-04" else "inset" if k in ("sidebar-08", "sidebar-16") else "sidebar") + '" collapsible="' + ("icon" if k == "sidebar-07" else "offcanvas") + '" side="' + ("right" if k == "sidebar-14" else "left") + '"]\n'
      '  [@ui.sidebarGroup label="Platform"]\n    [@ui.sidebarItem href="/" label="Home" icon="home" current=true /]\n    [@ui.sidebarItem href="/docs" label="Docs" icon="book" sub=[{"href":"/docs/intro","label":"Introduction"}] /]\n  [/@ui.sidebarGroup]\n'
      '[/@ui.sidebarShell]\n[@ui.sidebarInset sidebar="app-sidebar" title="Dashboard"]\n  [#-- page content --]\n[/@ui.sidebarInset]')

# ======================= Auth blocks =======================
def field(label, name, typ="text", ph="", req=True, extra="", label_extra="", ac=""):
    return (f'<div data-ui="field"><div class="auth-label-row"><label data-ui-part="label">{label}</label>{label_extra}</div>'
            f'<input data-ui-part="control" name="{name}" type="{typ}"{f" placeholder={chr(34)}{ph}{chr(34)}" if ph else ""}{" required" if req else ""}{f" autocomplete={chr(34)}{ac}{chr(34)}" if ac else ""} {extra}><p data-ui-part="error" hidden></p></div>')
def pw(name="password", label="Password", forgot=True, extra="minlength=\"5\"", ac="current-password"):
    return (f'<div data-ui="field"><div class="auth-label-row"><label data-ui-part="label">{label}</label>{"<button type=button class=auth-link data-ui-auth-view=forgot>Forgot your password?</button>" if forgot else ""}</div>'
            f'<div data-ui="toggle-password"><input data-ui-part="input" type="password" name="{name}" required {extra} autocomplete="{ac}"><button data-ui-part="toggle" aria-label="Show password"><span class="tp-eye" aria-hidden="true"></span></button></div><p data-ui-part="error" hidden></p></div>')
PROV = {"google": ("Google", "google"), "apple": ("Apple", "apple"), "github": ("GitHub", "github")}
def providers(ps=("google",), verb="Login with", icons_only=False):
    return '<div class="auth-providers">' + "".join(f'<button data-ui="button" data-variant="outline" data-ui-part="provider" data-provider="{p}"{f" aria-label={chr(34)}{verb} {PROV[p][0]}{chr(34)}" if icons_only else ""}>{I(PROV[p][1])}{"" if icons_only else f"<span>{verb} {PROV[p][0]}</span>"}</button>' for p in ps) + "</div>"
OR = '<div data-ui="marker" data-variant="separator" class="auth-or"><span data-ui-part="content">Or continue with</span></div>'
STATUS = '<p data-ui-part="status"></p>'
def forgot_view():
    return ('<div data-ui-part="view" data-view="forgot" data-next="sent"><h2 class="auth-h">Reset your password</h2><p class="muted">We\'ll email you a reset link.</p>' + field("Email", "email", "email", "m@example.com", ac="email")
            + '<button data-ui="button" type="submit" class="auth-full">Send reset link</button><button type="button" class="auth-link" data-ui-auth-view="password">Back to login</button></div>')
def sent_view(msg="Check your inbox for a link. It expires in 15 minutes."):
    return f'<div data-ui-part="view" data-view="sent" data-next="password"><h2 class="auth-h">Check your email</h2><p class="muted">{msg}</p><button type="button" class="auth-link" data-ui-auth-view="password">Back to login</button></div>'
def otp_view():
    return ('<div data-ui-part="view" data-view="otp" data-next="done"><h2 class="auth-h">Enter verification code</h2><p class="muted">We sent a 6-digit code to your email.</p>'
            '<div data-ui="pin-input" data-length="6" data-name="otp" data-type="numeric" data-required aria-label="Verification code"></div>'
            '<button data-ui="button" type="submit" class="auth-full">Verify</button><p class="muted auth-small">Didn\'t receive it? <button type="button" class="auth-link" data-ui-auth-view="password">Resend</button></p></div>')
DONE = '<div data-ui-part="view" data-view="done"><h2 class="auth-h">You\'re in 🎉</h2><p class="muted">This is where the app would redirect.</p><button type="button" class="auth-link" data-ui-auth-view="password">Start over</button></div>'
REMEMBER = '<label class="auth-check"><input type="checkbox" data-ui="checkbox" name="remember"> Remember me</label>'
def login_form(fid, title="Login to your account", desc="Enter your email below to login to your account", social=("google",), social_first=False, card=True, extra_views=True, header=True, icons_only=False):
    soc = providers(social, icons_only=icons_only) if social else ""
    body = (f'<div data-ui-part="view" data-view="password" data-next="otp">'
            + (f'<header class="auth-head"><h2 class="auth-h">{title}</h2><p class="muted">{desc}</p></header>' if header else "")
            + (soc + OR if social_first and soc else "")
            + field("Email", "email", "email", "m@example.com", ac="email") + pw() + REMEMBER
            + '<button data-ui="button" type="submit" class="auth-full">Login</button>'
            + (soc if soc and not social_first else "")
            + '<button type="button" class="auth-link auth-center" data-ui-auth-view="magic-link">Email me a magic link instead</button>'
            + '<p class="auth-small auth-center">Don\'t have an account? <a href="#signup-01">Sign up</a></p></div>'
            + ('<div data-ui-part="view" data-view="magic-link" data-next="sent"><h2 class="auth-h">Login with a magic link</h2>' + field("Email", "email", "email", "m@example.com", ac="email") + '<button data-ui="button" type="submit" class="auth-full">Send link</button><button type="button" class="auth-link" data-ui-auth-view="password">Use password</button></div>' + forgot_view() + sent_view() + otp_view() + DONE if extra_views else "")
            + STATUS)
    f = f'<form data-ui="auth-form" id="{fid}" data-default-view="password" novalidate class="auth-form">{body}</form>'
    return f'<article data-ui-part="card" class="auth-card">{f}</article>' if card else f
TERMS = '<p class="auth-terms muted">By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.</p>'
BRAND = f'<a href="#" class="auth-brand">{I("logo",18)} Despani</a>'
COVER = '<div class="auth-cover" role="img" aria-label="Cover image"></div>'

def signup_form(fid, social=("google",), social_first=False, card=True, title="Create an account", desc="Enter your information below to create your account"):
    soc = providers(social, "Sign up with") if social else ""
    body = (f'<div data-ui-part="view" data-view="signup" data-next="otp"><header class="auth-head"><h2 class="auth-h">{title}</h2><p class="muted">{desc}</p></header>'
            + (soc + OR if social_first and soc else "")
            + field("Full name", "name", "text", "Levan Dvalishvili", ac="name") + field("Email", "email", "email", "m@example.com", ac="email", extra='aria-describedby=""')
            + '<div class="auth-grid2">' + pw("password", "Password", False, 'minlength="8"', "new-password") + pw("confirm", "Confirm password", False, f'data-match="#{fid} [name=password]"', "new-password") + "</div>"
            + '<p class="muted auth-small">Must be at least 8 characters long.</p>'
            + '<label class="auth-check"><input type="checkbox" data-ui="checkbox" name="terms" required> I agree to the terms</label>'
            + '<button data-ui="button" type="submit" class="auth-full">Create account</button>' + (soc if soc and not social_first else "")
            + '<p class="auth-small auth-center">Already have an account? <a href="#login-01">Sign in</a></p></div>'
            + otp_view().replace("Didn\\'t receive it?", "Wrong email?").replace('data-ui-auth-view="password">Resend', 'data-ui-auth-view="signup">Go back') + DONE.replace('data-ui-auth-view="password"', 'data-ui-auth-view="signup"') + STATUS)
    f = f'<form data-ui="auth-form" id="{fid}" data-default-view="signup" novalidate class="auth-form">{body}</form>'
    return f'<article data-ui-part="card" class="auth-card">{f}</article>' if card else f

AUTH = {}
AUTH["login-01"] = ("Login", "Simple login card", "A simple centered login card: email, password, remember me, Google, plus magic-link, forgot-password and code-verification steps.",
  f'<div class="auth-page auth-center-page">{login_form("lg01")}</div>')
AUTH["login-02"] = ("Login", "Two columns with cover", "A two column login page: the form on one side, a cover image on the other.",
  f'<div class="auth-page auth-split"><div class="auth-col">{BRAND}<div class="auth-col-body">{login_form("lg02", social=("github",), card=False)}</div></div>{COVER}</div>')
AUTH["login-03"] = ("Login", "Muted background", "A login card on a muted page with Apple and Google first, then email.",
  f'<div class="auth-page auth-center-page auth-muted"><div class="auth-stack">{BRAND}{login_form("lg03", "Welcome back", "Login with your Apple or Google account", ("apple", "google"), True)}{TERMS}</div></div>')
AUTH["login-04"] = ("Login", "Form and image in a card", "A wide card split into the login form and an image.",
  f'<div class="auth-page auth-center-page auth-muted"><div class="auth-stack auth-wide"><article data-ui-part="card" class="auth-card auth-card-split">{login_form("lg04", "Welcome back", "Login to your Acme Inc account", ("apple", "google", "github"), card=False, icons_only=True)}{COVER}</article>{TERMS}</div></div>')
AUTH["login-05"] = ("Login", "Email only (magic link)", "An email-only login: enter your email, get a link (or code); social buttons below.",
  '<div class="auth-page auth-center-page"><div class="auth-stack">' + f'<form data-ui="auth-form" id="lg05" data-default-view="magic-link" novalidate class="auth-form"><div data-ui-part="view" data-view="magic-link" data-next="otp"><header class="auth-head auth-center">{BRAND}<h2 class="auth-h">Welcome to Acme Inc.</h2><p class="muted">Don\'t have an account? <a href="#signup-01">Sign up</a></p></header>'
  + field("Email", "email", "email", "m@example.com", ac="email") + '<button data-ui="button" type="submit" class="auth-full">Login</button>' + OR.replace("Or continue with", "Or") + providers(("apple", "google"), "Continue with") + "</div>" + otp_view().replace('data-ui-auth-view="password"', 'data-ui-auth-view="magic-link"') + DONE.replace('data-ui-auth-view="password"', 'data-ui-auth-view="magic-link"') + STATUS + "</form>" + TERMS + "</div></div>")
AUTH["signup-01"] = ("Signup", "Simple signup card", "A simple signup card: name, email, password + confirm, terms, then email verification code.", f'<div class="auth-page auth-center-page">{signup_form("su01")}</div>')
AUTH["signup-02"] = ("Signup", "Two columns with cover", "A two column signup page with a cover image.", f'<div class="auth-page auth-split"><div class="auth-col">{BRAND}<div class="auth-col-body">{signup_form("su02", ("github",), card=False)}</div></div>{COVER}</div>')
AUTH["signup-03"] = ("Signup", "Muted background", "A signup card on a muted page.", f'<div class="auth-page auth-center-page auth-muted"><div class="auth-stack">{BRAND}{signup_form("su03", ("apple", "google"), True)}{TERMS}</div></div>')
AUTH["signup-04"] = ("Signup", "Form and image in a card", "A wide card split into the signup form and an image.", f'<div class="auth-page auth-center-page auth-muted"><div class="auth-stack auth-wide"><article data-ui-part="card" class="auth-card auth-card-split">{signup_form("su04", None, card=False)}{COVER}</article>{TERMS}</div></div>')
AUTH["signup-05"] = ("Signup", "Social providers", "A signup page that leads with Apple, Google and GitHub, then email.", f'<div class="auth-page auth-center-page"><div class="auth-stack">{signup_form("su05", ("apple", "google", "github"), True, title="Create your account", desc="Sign up with a provider or your email")}{TERMS}</div></div>')

for k, (grp, title, what, demo) in AUTH.items():
    add(f"{grp} blocks", k, f"{grp}: {title}", "done", "Authentication pages", f"Block {k}",
        "One <form data-ui=auth-form novalidate> with several views (password, magic-link, forgot, sent, otp, done); only the visible view is validated/submitted and its first field gets focus. Errors use Field (aria-invalid + aria-describedby, role=alert); a polite status line reports the result. Provider buttons emit ui:provider; submit emits cancelable ui:submit {view, values}. Toggle-password, Checkbox, Pin input, Separator and Card are the same components as elsewhere.",
        demo)
    INFO[k] = (f"{grp} · {title}", what, "Copy into your login/registration page; wire ui:submit to your Spring endpoint (or submit the form normally).")
    FTL[k] = ('[@ui.authForm id="' + k + '" action="/' + ("login" if grp == "Login" else "register") + '" view="' + ("signup" if grp == "Signup" else "magic-link" if k == "login-05" else "password") + '"]\n'
      '  [@ui.authView name="' + ("signup" if grp == "Signup" else "password") + '" next="otp" title="' + ("Create an account" if grp == "Signup" else "Login to your account") + '"]\n'
      '    [@ui.authProviders list=["google"] verb="' + ("Sign up with" if grp == "Signup" else "Login with") + '" /]\n    [@ui.authField label="Email" name="email" type="email" /]\n    [@ui.authField label="Password" name="password" type="password" /]\n'
      '    <button data-ui="button" type="submit">Continue</button>\n  [/@ui.authView]\n  [@ui.authView name="otp" next="done" title="Enter verification code"][@ui.pinInput name="otp" /][/@ui.authView]\n[/@ui.authForm]')

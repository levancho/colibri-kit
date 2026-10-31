# Components added after the Radix Primitives + Radix Themes audit (Oct 2026). Original Colibri markup/styling.
from sink_catalog_base import add
from sink_info import INFO
I = lambda p: f'<svg viewBox="0 0 24 24" aria-hidden="true">{p}</svg>'
BOLD, ITAL, LINK, UNDO = I('<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>'), I('<path d="M14 5h-4M14 19h-4M14 5l-4 14"/>'), I('<path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1 1M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1-1"/>'), I('<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>')
INFOI = I('<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>')
add("Base", "toolbar", "Toolbar", "done", "-", "Toolbar (Radix)",
 "role=toolbar with one tab stop; Left/Right (or Up/Down when vertical), Home/End move between every control inside, including toggle groups.",
 f'''<div data-ui="toolbar" aria-label="Formatting"><button aria-label="Undo">{UNDO}</button><span data-ui-part="separator"></span><div data-ui="toggle-group" data-type="multiple" data-default-value="b" aria-label="Text style"><button data-ui-part="item" data-value="b" aria-label="Bold">{BOLD}</button><button data-ui-part="item" data-value="i" aria-label="Italic">{ITAL}</button></div><span data-ui-part="separator"></span><button aria-label="Insert link">{LINK}</button><span data-ui-part="spacer"></span><a href="#toolbar">Edited 2m ago</a><button data-ui="button" data-size="sm">Share</button></div>''')
add("Forms", "segmented-control", "Segmented control", "done", "-", "Segmented Control (Radix Themes)",
 "Single-choice radiogroup with a sliding thumb (theme reads --seg-x/--seg-w). Arrow keys move and select; one tab stop.",
 '''<div data-ui="segmented-control" data-default-value="week" aria-label="Range"><button data-ui-part="item" data-value="day">Day</button><button data-ui-part="item" data-value="week">Week</button><button data-ui-part="item" data-value="month">Month</button><button data-ui-part="item" data-value="year">Year</button></div>''')
add("Forms", "radio-cards", "Radio cards", "done", "-", "Radio Cards (Radix Themes)",
 "Native radios inside labels, so it works without JS and with forms; JS mirrors data-state=checked on each card and the value on the root.",
 '''<div data-ui="radio-cards" aria-label="Plan" style="--cards-min:160px"><label data-ui-part="item"><b>Starter</b><input type="radio" name="rc-plan" value="starter"><small>1 project · community support</small></label><label data-ui-part="item"><b>Team</b><input type="radio" name="rc-plan" value="team" checked><small>10 projects · email support</small></label><label data-ui-part="item"><b>Scale</b><input type="radio" name="rc-plan" value="scale"><small>Unlimited · SLA</small></label></div>''')
add("Forms", "checkbox-cards", "Checkbox cards", "done", "-", "Checkbox Cards (Radix Themes)",
 "Like radio cards, multi-select. Value on the root is a comma list.",
 '''<div data-ui="checkbox-cards" aria-label="Integrations"><label data-ui-part="item"><b>GitHub</b><input type="checkbox" value="gh" checked><small>Sync pull requests</small></label><label data-ui-part="item"><b>Slack</b><input type="checkbox" value="slack"><small>Post updates</small></label><label data-ui-part="item"><b>Linear</b><input type="checkbox" value="linear" disabled><small>Coming soon</small></label></div>''')
add("Forms", "checkbox-group", "Checkbox group", "done", "-", "Checkbox Group (Radix Themes)",
 "role=group of native checkboxes with a shared value (data-value) and one ui:change event.",
 '''<div data-ui="checkbox-group" aria-label="Notify me about"><label data-ui-part="item"><input type="checkbox" value="mentions" checked> Mentions</label><label data-ui-part="item"><input type="checkbox" value="replies" checked> Replies</label><label data-ui-part="item"><input type="checkbox" value="digest"> Weekly digest</label></div>''')
add("Navigation", "tab-nav", "Tab nav (link tabs)", "done", "-", "Tab Nav (Radix Themes)",
 "Tabs that are real links for page routing: aria-current=page from the URL or the last click, animated underline, arrow-key roving.",
 '''<nav data-ui="tab-nav" aria-label="Settings"><a data-ui-part="link" href="#tab-nav" aria-current="page">Account</a><a data-ui-part="link" href="#tab-nav">Billing</a><a data-ui-part="link" href="#tab-nav">Team</a><a data-ui-part="link" href="#tab-nav">Security</a></nav>''')
add("Base", "data-list", "Data list", "css", "-", "Data List (Radix Themes)",
 "A semantic dl of label/value pairs; data-orientation=vertical stacks them. No JavaScript.",
 '''<dl data-ui="data-list"><dt>Status</dt><dd><span data-ui="badge">Active</span></dd><dt>Name</dt><dd>ნინო ბერიძე</dd><dt>Email</dt><dd>nino@example.ge</dd><dt>Company</dt><dd>Despani</dd></dl>''')
add("Base", "callout", "Callout", "css", "-", "Callout (Radix Themes)",
 "Inline notice that is part of the content (not dismissible, not live). data-tone=info|warning|danger|success|neutral, data-variant=soft|surface|outline.",
 f'''<div data-ui="callout" role="note"><span data-ui-part="icon">{INFOI}</span><p>Theme packs change shape, type and motion, not just colour.</p></div>
<div data-ui="callout" data-tone="warning" data-variant="surface" role="note"><span data-ui-part="icon">{INFOI}</span><p>Your trial ends in 3 days.</p></div>
<div data-ui="callout" data-tone="danger" data-variant="outline" role="note"><span data-ui-part="icon">{INFOI}</span><p>Two fields need attention.</p></div>''')
add("Base", "inset", "Inset", "css", "-", "Inset (Radix Themes)",
 "Lets an image or table bleed to the card edge (data-side=top|bottom|x). Reads --card-pad.",
 '''<div data-ui="card" style="--card-pad:16px;padding:16px;max-width:280px;border:1px solid var(--ui-border);border-radius:var(--ui-radius-lg);overflow:hidden"><div data-ui="inset" data-side="top"><div style="height:110px;background:linear-gradient(135deg,var(--ui-primary),color-mix(in srgb,var(--ui-primary) 30%,#fff))"></div></div><p style="margin:12px 0 0"><b>Glacier pack</b><br><small class="muted">Edge-to-edge media in a padded card.</small></p></div>''')
add("Base", "icon-button", "Icon button", "css", "-", "Icon Button (Radix Themes)",
 "Square button sized from --ui-control-h; always give it aria-label. data-shape=round for circles.",
 f'''<button data-ui="icon-button" aria-label="Undo">{UNDO}</button> <button data-ui="icon-button" data-shape="round" aria-label="Insert link">{LINK}</button> <button data-ui="icon-button" aria-label="Bold" disabled>{BOLD}</button>''')
add("Base", "accessible-icon", "Accessible icon", "done", "-", "Accessible Icon (Radix)",
 "Hides the SVG from assistive tech and adds a visually hidden label from data-label. Pair with .visually-hidden / data-ui=visually-hidden.",
 f'''<button data-ui="button" data-variant="outline"><span data-ui="accessible-icon" data-label="Close dialog">{I('<path d="M6 6l12 12M18 6 6 18"/>')}</span></button> <span class="muted">Screen readers hear “Close dialog”.</span>''')
INFO.update({
 "toolbar": ("Toolbar", "A bar of related controls that acts as one stop for the Tab key.", "Editor formatting bars, table actions, media controls."),
 "segmented-control": ("Segmented control", "A compact pill of 2–5 options where one is selected, with a sliding highlight.", "View switches: day/week/month, list/grid."),
 "radio-cards": ("Radio cards", "Large clickable cards where exactly one is chosen.", "Plans, shipping speed, onboarding choices."),
 "checkbox-cards": ("Checkbox cards", "Large clickable cards where several can be chosen.", "Integrations, interests, feature add-ons."),
 "checkbox-group": ("Checkbox group", "A labelled list of checkboxes that reports one combined value.", "Notification settings, filters."),
 "tab-nav": ("Tab nav (link tabs)", "Tab-styled navigation where each tab is a page link.", "Settings sections, profile sub-pages."),
 "data-list": ("Data list", "Label and value pairs laid out in two columns.", "Profile details, order summaries, metadata."),
 "callout": ("Callout", "A tinted inline note with an icon that belongs to the page content.", "Tips, warnings and notes inside forms or docs."),
 "inset": ("Inset", "Lets media inside a card run to the card's edges.", "Card cover images, full-width tables in cards."),
 "icon-button": ("Icon button", "A square button that shows only an icon.", "Toolbars, close buttons, compact actions."),
 "accessible-icon": ("Accessible icon", "An icon that screen readers announce by a text label.", "Icon-only buttons and status icons."),
})

"""Conversation components (shadcn Bubble, Message, Marker, Trace, Questionnaire, Attachment, Spinner, Native Select, Chart)
and shadcn AI Elements (21). Replaces the old planned/partial chart, attachment, questionnaire and marker entries."""
from sink_catalog_base import add, C
from sink_info import INFO
from sink_code import FTL
from sink_icons import I

for cid in ("chart", "attachment", "questionnaire", "marker"):
    C[:] = [c for c in C if c["id"] != cid]
for c in C:
    if c["id"] == "drawer":
        c["status"] = "done"; c["notes"] = "Dialog variant: data-ui=sheet|drawer + data-side=left|right|top|bottom. Drag the panel (or its data-ui-part=handle) toward its edge to dismiss, like vaul; data-drag=false turns that off. Esc, backdrop and the close button still work."
        c["demo"] = c["demo"].replace('<h2 data-ui-part="title">Drawer</h2>', '<div data-ui-part="handle" aria-hidden="true"></div><h2 data-ui-part="title">Drawer</h2><p class="muted">Drag me down to dismiss.</p>')

def info(cid, title, what, when, ftl=None):
    INFO[cid] = (title, what, when)
    if ftl: FTL[cid] = ftl

G = "Conversation"
AV = '<span data-ui="avatar" data-ui-part="avatar"><span data-ui-part="fallback">{}</span></span>'
add(G, "bubble", "Bubble", "done", "-", "Bubble",
 "Reactions are toggle buttons (aria-pressed) whose count updates; long bubbles get a Show more / Show less button with aria-expanded/aria-controls. ui:react {value,on}.",
 '<div data-ui-part="bubble-group" data-align="start">'
 '<div data-ui="bubble" data-variant="muted"><div data-ui-part="content">გამარჯობა! I checked the registry output.</div></div>'
 '<div data-ui="bubble" data-variant="muted"><div data-ui-part="content">And removed the stale route.</div><div data-ui-part="reactions"><button data-ui-part="reaction" data-value="like" aria-label="Thumbs up">👍 <span data-ui-part="count">2</span></button><button data-ui-part="reaction" data-value="heart" aria-label="Heart">❤️ <span data-ui-part="count">0</span></button></div></div></div>'
 '<div data-ui-part="bubble-group" data-align="end"><div data-ui="bubble" data-variant="primary"><div data-ui-part="content">Great, ship it.</div></div></div>'
 '<div data-ui="bubble" data-variant="outline" data-collapsible><div data-ui-part="content">'
 + "Long bubble. " * 30 + '</div><button data-ui-part="toggle">Show more</button></div>'
 '<div style="display:flex;gap:.5rem;flex-wrap:wrap">' + "".join(f'<div data-ui="bubble" data-variant="{v}"><div data-ui-part="content">{v}</div></div>' for v in ("primary", "secondary", "muted", "outline", "accent", "destructive", "ghost")) + '</div>')
info("bubble", "Chat bubble", "One message balloon in a conversation, with optional reactions and a show-more toggle.", "Chat UIs, comments, AI replies. Group consecutive bubbles from the same sender.",
 '[@ui.bubble variant="muted" reactions=["👍"]]I checked the registry output.[/@ui.bubble]')

add(G, "message", "Message", "done", "-", "Message",
 "Each message is role=article. Actions are buttons: copy (copies the content), like/dislike (exclusive toggles, aria-pressed), retry emits ui:action {action}.",
 f'<div data-ui="message" data-from="user"><div data-ui-part="content"><div data-ui="bubble" data-variant="primary"><div data-ui-part="content">How do I reset the Joomla passwords?</div></div></div></div>'
 f'<div data-ui="message" data-from="assistant"><div data-ui-part="avatar">{AV.format("AI")}</div><div data-ui-part="body"><div data-ui-part="header"><b>Colibri</b> <span class="muted">17:42</span></div>'
 f'<div data-ui-part="content"><div data-ui="bubble" data-variant="ghost"><div data-ui-part="content">Update <code>password</code> with <code>md5(admin+salt):salt</code> and back the table up first.</div></div></div>'
 f'<div data-ui-part="actions"><button data-ui-part="action" data-action="copy" aria-label="Copy">{I("copy",14)}</button><button data-ui-part="action" data-action="like" aria-label="Good response">{I("thumb",14)}</button><button data-ui-part="action" data-action="dislike" aria-label="Bad response" style="transform:scaleY(-1)">{I("thumb",14)}</button><button data-ui-part="action" data-action="retry" aria-label="Retry">{I("retry",14)}</button></div></div></div>')
info("message", "Chat message row", "A whole turn in a conversation: avatar, name/time, the bubble and copy/like/retry actions.", "Any chat or AI assistant thread; wrap a list of them in a Message scroller.",
 '[@ui.message from="assistant" avatar="AI" name="Colibri" actions=["copy","like","dislike","retry"]]…[/@ui.message]')

add(G, "marker", "Marker", "done", "-", "Marker",
 "Icons are aria-hidden. Variant separator gets role=separator with the label as its name; data-live makes it a polite status (for 'Thinking…').",
 f'<div data-ui="marker">{I("check",14)}<span data-ui-part="content">Explored 4 files</span></div>'
 f'<div data-ui="marker" data-variant="row">{I("file",14)}<span data-ui-part="content">Edited src/core/ai.js</span></div>'
 f'<div data-ui="marker" data-variant="separator"><span data-ui-part="content">Yesterday</span></div>'
 f'<div data-ui="marker" data-live><span data-ui="spinner" data-size="sm"></span><span data-ui-part="content" data-shimmer>Thinking…</span></div>')
info("marker", "Inline status / note", "A small inline line in a conversation: a system note, a status, a bordered row or a labelled divider.", "\"Explored 4 files\", \"Yesterday\" separators, \"Thinking…\" while streaming.",
 '[@ui.marker icon="check"]Explored 4 files[/@ui.marker]\n[@ui.marker variant="separator"]Yesterday[/@ui.marker]')


add(G, "trace", "Trace", "done", "-", "Trace",
 "The trace is a list; each line a listitem. Lines that have details use a nested Collapsible (button + aria-expanded). Running lines shimmer.",
 '<div data-ui="trace">'
 f'<div data-ui-part="line">{I("search",14)}<span data-ui-part="title">Searched for <b>minimumReleaseAge</b></span></div>'
 f'<div data-ui-part="line" data-ui="collapsible"><button data-ui-part="trigger">{I("terminal",14)}<span data-ui-part="title">Ran <code>node --version</code></span></button><div data-ui-part="content"><pre>v22.11.0</pre></div></div>'
 f'<div data-ui-part="line" data-status="running">{I("file",14)}<span data-ui-part="title" data-shimmer>Reading package.json…</span></div></div>')
info("trace", "Activity trace", "A compact list of the steps something took (searches, commands, files), each expandable for detail.", "The building block for AI reasoning, tool calls and sources; also build/deploy logs.",
 '[@ui.trace]\n  [@ui.traceLine icon="search" title="Searched for X" /]\n[/@ui.trace]')

add(G, "attachment", "Attachment", "done", "-", "Attachment",
 "role=group labelled by the file name. Upload progress is a progressbar driven by data-progress; data-error shows the error state. Remove is a labelled button; ui:remove is cancelable and focus moves to the next attachment.",
 '<div class="sink-row">'
 f'<div data-ui="attachment"><span data-ui-part="media">{I("file",18)}</span><span data-ui-part="content"><span data-ui-part="title">sales-dashboard.pdf</span><span data-ui-part="description">PDF · 2.4 MB</span></span><span data-ui-part="actions"><button data-ui-part="action" data-action="remove" aria-label="Remove sales-dashboard.pdf">{I("x",14)}</button></span></div>'
 f'<div data-ui="attachment" id="att-up" data-progress="35"><span data-ui-part="media">{I("file",18)}</span><span data-ui-part="content"><span data-ui-part="title">photo-2026.jpg</span><span data-ui-part="description">Uploading…</span><span data-ui-part="progress"></span></span><span data-ui-part="actions"><button data-ui-part="action" data-action="remove" aria-label="Cancel photo-2026.jpg">{I("x",14)}</button></span></div>'
 f'<div data-ui="attachment" data-error><span data-ui-part="media">{I("alert",18)}</span><span data-ui-part="content"><span data-ui-part="title">huge.zip</span><span data-ui-part="description">Too large (max 20 MB)</span></span><span data-ui-part="actions"><button data-ui-part="action" data-action="remove" aria-label="Remove huge.zip">{I("x",14)}</button></span></div>'
 '</div><button data-ui="button" data-variant="outline" data-size="sm" id="att-step">Advance upload</button>')
info("attachment", "File attachment", "A file chip showing name, type/size, upload progress or an error, with a remove button.", "Files attached to a message, form or prompt input.",
 '[@ui.attachment title="sales-dashboard.pdf" description="PDF · 2.4 MB" progress=35 /]')

Q = lambda name, typ, title, desc, body, extra="": f'<fieldset data-ui-part="item" data-name="{name}" data-type="{typ}" {extra}><legend data-ui-part="title">{title}</legend><p data-ui-part="description">{desc}</p>{body}<p data-ui-part="error"></p></fieldset>'
CH = lambda opts: '<div data-ui-part="choices">' + "".join(f'<button data-ui-part="choice" data-value="{v}"><b>{l}</b><span>{d}</span></button>' for v, l, d in opts) + "</div>"
add(G, "questionnaire", "Questionnaire", "done", "-", "Questionnaire",
 "One question at a time. Single choice is a radiogroup (arrows move + select), multiple is a group of checkboxes, freeform is a textarea. Required questions show an inline error (aria-invalid + aria-describedby). Progress is a progressbar ('Question 2 of 3'). ui:step, ui:submit {answers}.",
 '<form data-ui="questionnaire" id="qn" style="width:100%;max-width:460px"><div data-ui-part="progress"><span data-ui-part="label"></span></div>'
 + Q("direction", "single", "What should we prototype next?", "Choose a direction.", CH([("delegation", "Delegation", "Show how work moves to a specialist."), ("questions", "Question prompts", "Show choices inline."), ("review", "Review flow", "Approve or reject changes.")]), "data-required")
 + Q("platforms", "multiple", "Which platforms?", "Pick any.", CH([("web", "Web", ""), ("ios", "iOS", ""), ("android", "Android", "")]), "data-skippable")
 + Q("notes", "text", "Anything else?", "Optional.", '<textarea data-ui-part="input" rows="2" aria-label="Notes"></textarea>', "data-skippable")
 + '<div data-ui-part="actions"><button type="button" data-ui="button" data-variant="ghost" data-ui-part="previous">Back</button><span style="flex:1"></span><button type="button" data-ui="button" data-variant="outline" data-ui-part="skip">Skip</button><button type="button" data-ui="button" data-ui-part="next">Next</button><button type="submit" data-ui="button" data-ui-part="submit">Submit</button></div>'
 '<div data-ui-part="summary" tabindex="-1" hidden><b>Thanks!</b> <span id="qn-out" class="muted"></span></div></form>')
info("questionnaire", "Step-by-step questions", "Asks one question at a time (single choice, multiple choice or free text) with Back/Skip/Next and a progress bar.", "Onboarding, surveys, or an AI asking clarifying questions before it starts.",
 '[@ui.questionnaire items=items /]  [#-- items=[{"name","type":"single|multiple|text","title","required","choices":[…]}] --]')

add(G, "native-select", "Native select", "css", "Select (native)", "Native Select",
 "A real <select>: the browser handles keyboard, mobile pickers and forms. Only styling is added (chevron via CSS mask).",
 '<select data-ui="native-select" aria-label="City"><option>თბილისი</option><option>ბათუმი</option><option>ქუთაისი</option></select> <select data-ui="native-select" disabled aria-label="Disabled"><option>Disabled</option></select>')
info("native-select", "Native dropdown", "The browser's own select box, styled to match the theme.", "Simple choices in forms, especially on mobile; use Select when you need search, groups or custom rendering.",
 '<select data-ui="native-select" name="city">…</select>')

add(G, "chart", "Chart", "done", "-", "Chart",
 "Charts are drawn from a real <table> (kept in the page; 'Show data table' reveals it), so screen readers get the numbers. The SVG is role=img with a summary label; each bar/point has a <title> tooltip. Colours come from --ui-chart-1..5.",
 '<div style="display:flex;gap:1rem;flex-wrap:wrap;width:100%;align-items:flex-start">'
 '<figure data-ui="chart" data-type="bar" style="flex:1;min-width:260px"><figcaption>Visitors per month</figcaption><table><thead><tr><th>Month</th><th>Desktop</th><th>Mobile</th></tr></thead><tbody><tr><td>Jan</td><td>186</td><td>80</td></tr><tr><td>Feb</td><td>305</td><td>200</td></tr><tr><td>Mar</td><td>237</td><td>120</td></tr><tr><td>Apr</td><td>73</td><td>190</td></tr><tr><td>May</td><td>209</td><td>130</td></tr><tr><td>Jun</td><td>214</td><td>140</td></tr></tbody></table></figure>'
 '<figure data-ui="chart" data-type="line" style="flex:1;min-width:260px"><figcaption>Signups</figcaption><table><thead><tr><th>Week</th><th>Signups</th></tr></thead><tbody><tr><td>W1</td><td>12</td></tr><tr><td>W2</td><td>19</td></tr><tr><td>W3</td><td>15</td></tr><tr><td>W4</td><td>28</td></tr><tr><td>W5</td><td>34</td></tr></tbody></table></figure></div>')
info("chart", "Chart (bar / line)", "Turns a data table into a simple bar or line chart, keeping the table for accessibility.", "Dashboards and reports. For heavy charting, wrap a chart library but keep the table fallback.",
 '[@ui.chart type="bar" caption="Visitors" columns=["Month","Desktop"] rows=[["Jan",186],["Feb",305]] /]')

# ======================= AI Elements =======================
G = "AI Elements"
def coll(kind, title, body, status="done", extra="", trig_extra="", open_=False):
    return (f'<div data-ui="{kind}" data-status="{status}"{" data-default-open" if open_ else ""} {extra}><button data-ui-part="trigger">{trig_extra}<span data-ui-part="label">{title}</span>'
            f'<span data-ui-part="status"></span><i data-ui-part="chevron" aria-hidden="true"></i></button><div data-ui-part="content">{body}</div></div>')
STEPS = lambda ss: '<ol data-ui-part="steps">' + "".join(f'<li data-ui-part="step" data-status="{s}">{t}</li>' for s, t in ss) + "</ol>"

add(G, "chain-of-thought", "Chain of thought", "done", "-", "AI: Chain of Thought",
 "A disclosure (button aria-expanded → region) holding the steps; the running step has aria-current=step; status text is a polite live region.",
 coll("chain-of-thought", "Researched the migration plan", STEPS([("done", "Read the Joomla 1.5 schema"), ("done", "Compared it with x2 tables"), ("running", "Drafting the mapping"), ("pending", "Review with you")]), "running", trig_extra=I("brain", 14), open_=True))
add(G, "chat", "Chat", "done", "-", "AI: Chat",
 "Composition: Message scroller (role=log, sticks to bottom, jump button) + Messages + Prompt input + Suggestions. Type and press Enter; a fake reply streams in.",
 '<div class="ai-chat"><div data-ui="message-scroller"><div data-ui-part="viewport" id="chat-vp">'
 '<div data-ui="message" data-from="assistant"><div data-ui-part="content"><div data-ui="bubble" data-variant="ghost"><div data-ui-part="content">Hi! Ask me about Colibri UI.</div></div></div></div>'
 '</div><button data-ui-part="jump" hidden>Jump to latest</button></div>'
 '<div data-ui="suggestion" data-target="#chat-pi"><button data-ui-part="item">What is headless?</button><button data-ui-part="item">Show me the theme tokens</button></div>'
 f'<form data-ui="prompt-input" id="chat-pi"><div data-ui-part="attachments"></div><textarea data-ui-part="input" rows="1" placeholder="Message Colibri…"></textarea><div data-ui-part="toolbar"><input type="file" data-ui-part="file" hidden multiple><button data-ui-part="attach">{I("clip",16)}</button><span style="flex:1"></span><button data-ui-part="submit">{I("send",16)}</button></div></form></div>')
add(G, "checkpoint", "Checkpoint", "done", "-", "AI: Checkpoint",
 "role=separator with a labelled Restore button; ui:restore {id} is cancelable; data-state=restored afterwards.",
 f'<div data-ui="checkpoint" data-id="cp-3">{I("flag",14)}<span data-ui-part="label">Checkpoint · 3 files changed</span><button data-ui-part="restore" data-ui="button" data-variant="ghost" data-size="sm">Restore</button></div>')
add(G, "confirmation", "Confirmation", "done", "-", "AI: Confirmation",
 "role=group labelled by its title. Approve / Reject are buttons; the decision replaces them with a status message. ui:approve / ui:reject are cancelable.",
 f'<div data-ui="confirmation" style="max-width:420px"><p data-ui-part="title"><b>Run</b> <code>DELETE FROM desp_session</code>?</p><p class="muted" data-ui-part="description">This tool needs your approval.</p>'
 '<div data-ui-part="actions"><button data-ui="button" data-variant="outline" data-ui-part="reject">Reject</button><button data-ui="button" data-ui-part="approve">Approve</button></div><p data-ui-part="result" tabindex="-1"></p></div>')
add(G, "context", "Context usage", "done", "-", "AI: Context",
 "role=meter (aria-valuenow/max, valuetext '62% of context used (124k of 200k tokens)'); data-level ok|warning|critical; details in a hover card.",
 '<div data-ui="hover-card"><button data-ui-part="trigger" class="ai-ctx-btn"><span data-ui="context" data-used="124000" data-max="200000"><span data-ui-part="meter"><span data-ui-part="bar"></span></span> <span data-ui-part="percent"></span></span></button>'
 '<div data-ui-part="content"><b>Context window</b><p><span>124k</span> of <span>200k</span> tokens used</p><p class="muted">Input 98k · Output 18k · Cache 8k</p></div></div> '
 '<input type="range" min="0" max="200000" step="2000" value="124000" id="ctx-range" aria-label="Simulate usage">')
add(G, "file-tree", "File tree", "done", "-", "AI: File Tree",
 "WAI-ARIA tree: role=tree/treeitem/group, aria-expanded, aria-level, aria-selected; ↑/↓ move, → opens / goes in, ← closes / goes up, Home/End, Enter selects. ui:select {path}.",
 '<ul data-ui="file-tree" aria-label="Changed files" style="min-width:240px">'
 '<li data-ui-part="folder" data-path="src" data-default-open><span data-ui-part="label">src</span><ul data-ui-part="group">'
 '<li data-ui-part="folder" data-path="src/core" data-default-open><span data-ui-part="label">core</span><ul data-ui-part="group"><li data-ui-part="file" data-path="src/core/ai.js" data-status="added">ai.js</li><li data-ui-part="file" data-path="src/core/auto.js" data-status="modified">auto.js</li></ul></li>'
 '<li data-ui-part="file" data-path="src/index.js">index.js</li></ul></li>'
 '<li data-ui-part="folder" data-path="themes"><span data-ui-part="label">themes</span><ul data-ui-part="group"><li data-ui-part="file" data-path="themes/colibri.css" data-status="modified">colibri.css</li></ul></li>'
 '<li data-ui-part="file" data-path="README.md" data-status="deleted">README.md</li></ul>')
add(G, "inline-citation", "Inline citation", "done", "-", "AI: Inline Citation",
 "Composition: a Hover card whose trigger is a numbered citation link; opens on hover and focus, Esc closes.",
 '<p style="max-width:520px">Colibri follows the WAI-ARIA tree pattern<span data-ui="hover-card" data-ui-part="citation"><a data-ui-part="trigger" href="https://www.w3.org/WAI/ARIA/apg/patterns/treeview/">1</a>'
 '<span data-ui-part="content"><b>Tree View Pattern</b><br><span class="muted">w3.org · WAI-ARIA APG</span><br>A tree view widget presents a hierarchical list…</span></span> and keeps roving focus.</p>')
add(G, "ai-message", "Message (AI turn)", "done", "-", "AI: Message",
 "Composition: user Message + assistant Message whose body holds a Reasoning block, a Tool block, the answer bubble and actions.",
 '<div style="width:100%;max-width:560px;display:grid;gap:.75rem">'
 '<div data-ui="message" data-from="user"><div data-ui-part="content"><div data-ui="bubble" data-variant="primary"><div data-ui-part="content">Which users are blocked?</div></div></div></div>'
 '<div data-ui="message" data-from="assistant"><div data-ui-part="body">'
 + coll("reasoning", "Thought for 3s", "<p>Users are blocked when block=1 or comprofiler.approved=0…</p>", "done")
 + coll("tool", "query_database", '<div data-ui-part="input"><b>Input</b><pre>SELECT username FROM dsp2_users WHERE block=1</pre></div><div data-ui-part="output"><b>Output</b><pre>skara_bäus\nAfonia</pre></div>', "completed", trig_extra=I("tool", 14))
 + f'<div data-ui-part="content"><div data-ui="bubble" data-variant="ghost"><div data-ui-part="content">Two: <b>skara_bäus</b> and <b>Afonia</b>.</div></div></div><div data-ui-part="actions"><button data-ui-part="action" data-action="copy" aria-label="Copy">{I("copy",14)}</button><button data-ui-part="action" data-action="retry" aria-label="Retry">{I("retry",14)}</button></div></div></div></div>')
add(G, "model-selector", "Model selector", "done", "-", "AI: Model Selector",
 "Composition: two Selects (listbox pattern): one for the model, one for reasoning effort.",
 '<div data-ui="select" data-name="model" data-default-value="fast" aria-label="Model"><button data-ui-part="trigger"><span data-ui-part="value"></span></button><div data-ui-part="content"><div data-ui-part="group"><div data-ui-part="label">Models</div><div data-ui-part="option" data-value="fast">Fast</div><div data-ui-part="option" data-value="smart">Smart</div><div data-ui-part="option" data-value="max">Max</div></div></div></div> '
 '<div data-ui="select" data-name="effort" data-default-value="medium" aria-label="Reasoning effort"><button data-ui-part="trigger"><span data-ui-part="value"></span></button><div data-ui-part="content"><div data-ui-part="option" data-value="low">Low effort</div><div data-ui-part="option" data-value="medium">Medium effort</div><div data-ui-part="option" data-value="high">High effort</div></div></div>')
add(G, "plan", "Plan", "done", "-", "AI: Plan",
 "Disclosure + ordered steps with data-status; the progress part shows 'n of m' and drives --ui-value; the running step has aria-current=step.",
 coll("plan", 'Plan <span data-ui-part="progress"></span>', STEPS([("done", "Back up dsp2_users"), ("done", "Hash passwords with salt"), ("running", "Unblock accounts"), ("pending", "Verify logins")]), "running", open_=True))
add(G, "prompt-input", "Prompt input", "done", "-", "AI: Prompt Input",
 "A form: auto-growing textarea (Enter sends, Shift+Enter new line), attach button opens a file picker and adds Attachment chips, Send is disabled while empty and becomes Stop (ui:stop) while data-status=streaming. ui:submit {text, files} is cancelable.",
 f'<form data-ui="prompt-input" id="pi-demo" style="width:100%;max-width:560px"><div data-ui-part="attachments"></div><textarea data-ui-part="input" rows="1" placeholder="Ask anything…"></textarea><div data-ui-part="toolbar"><input type="file" data-ui-part="file" hidden multiple><button data-ui-part="attach">{I("clip",16)}</button><span style="flex:1"></span><button data-ui-part="submit">{I("send",16)}</button></div></form>')
add(G, "queue", "Queue", "done", "-", "AI: Queue",
 "Todo list split into To do / Done; each item is a real checkbox, checking moves it between lists and keeps focus. Counts update. ui:change {id, done}.",
 '<div data-ui="queue" style="min-width:280px"><h4>To do (<span data-ui-part="pending-count"></span>)</h4><ul data-ui-part="pending">'
 + "".join(f'<li data-ui-part="item" data-id="{i}"><label><input type="checkbox"> {t}</label></li>' for i, t in ((1, "Write the README"), (2, "Add e2e tests"), (3, "Ship 1.0")))
 + '</ul><h4>Done (<span data-ui-part="completed-count"></span>)</h4><ul data-ui-part="completed"><li data-ui-part="item" data-id="0" data-status="done"><label><input type="checkbox" checked> Design tokens</label></li></ul></div>')
add(G, "reasoning", "Reasoning", "done", "-", "AI: Reasoning",
 "Opens automatically while data-status=streaming (the label shimmers), then closes and reads 'Thought for Ns'. The user can always toggle it.",
 coll("reasoning", "Thinking…", '<p id="rs-text">The user wants…</p>', "streaming", extra='id="rs-demo"', trig_extra=I("brain", 14)) + ' <button data-ui="button" data-variant="outline" data-size="sm" id="rs-run">Stream again</button>')
add(G, "sources", "Sources", "done", "-", "AI: Sources",
 "Disclosure 'Used N sources' (N counted from the links) revealing a list of links.",
 coll("sources", 'Used <span data-ui-part="count"></span> sources', '<ul>' + "".join(f'<li><a data-ui-part="source" href="{h}">{I("link",12)} {t}</a></li>' for h, t in (("https://ui.shadcn.com", "shadcn/ui"), ("https://www.w3.org/WAI/ARIA/apg/", "WAI-ARIA APG"), ("https://freemarker.apache.org", "FreeMarker"))) + "</ul>", trig_extra=I("book", 14)))
add(G, "stack-trace", "Stack trace", "done", "-", "AI: Stack Trace",
 "Disclosure with the error message as its label; frames in a <pre>; Copy button copies them.",
 coll("stack-trace", "TypeError: Cannot read properties of null (reading 'rows')", f'<pre data-ui-part="output">at createDataTable (src/core/base.js:212:31)\nat init (src/core/auto.js:52:17)\nat HTMLDocument.&lt;anonymous&gt; (src/core/auto.js:60:3)</pre><button data-ui-part="copy" data-ui="button" data-variant="ghost" data-size="sm">{I("copy",14)} Copy</button>', "error", trig_extra=I("alert", 14)))
add(G, "subagent", "Subagent", "done", "-", "AI: Subagent",
 "Disclosure for a delegated run: name, status, a nested Trace of its tool calls and its result.",
 coll("subagent", "Researcher · l3v.ai bundle", '<div data-ui="trace">' + f'<div data-ui-part="line">{I("search",14)}<span data-ui-part="title">Fetched l3v.ai bundle</span></div><div data-ui-part="line">{I("file",14)}<span data-ui-part="title">Read index.css (panel rules)</span></div></div><p><b>Result:</b> minimized panels hang as tilted tags; click restores.</p>', "completed", trig_extra=I("bot", 14)))
add(G, "suggestion", "Suggestion", "done", "-", "AI: Suggestion",
 "A labelled group of buttons; clicking fills the linked Prompt input (data-target) or sends it (data-submit). ui:suggest {text} is cancelable.",
 '<div data-ui="suggestion" data-target="#pi-demo"><button data-ui-part="item">Summarise this page</button><button data-ui-part="item">Translate to Georgian</button><button data-ui-part="item">Write tests</button></div>')
add(G, "task", "Task", "done", "-", "AI: Task",
 "Disclosure listing steps as they happen, with file chips; progress 'n of m'.",
 coll("task", 'Searching the codebase <span data-ui-part="progress"></span>', STEPS([("done", 'Found <code>createSidebar</code> in navigation.js'), ("done", "Read 3 files"), ("running", "Checking callers")]), "running", open_=True, trig_extra=I("search", 14)))
add(G, "terminal", "Terminal", "done", "-", "AI: Terminal",
 "Disclosure with a command; output is role=log (polite) and focusable for scrolling; it sticks to the bottom while streaming. api.write(text). Copy button.",
 coll("terminal", "<code>npm test</code>", f'<pre data-ui-part="output" id="term-out">$ node --test test/*.test.js\n</pre><button data-ui-part="copy" data-ui="button" data-variant="ghost" data-size="sm">{I("copy",14)} Copy</button>', "running", extra='id="term-demo"', open_=True, trig_extra=I("terminal", 14)) + ' <button data-ui="button" data-variant="outline" data-size="sm" id="term-run">Run</button>')
add(G, "test-results", "Test results", "done", "-", "AI: Test Results",
 "Summary computed from the tests ('5 passed · 1 failed'), status error when anything failed; suites are nested disclosures marked passed/failed.",
 coll("test-results", "Test run", '<div data-ui-part="summary"></div>'
  '<div data-ui="collapsible" data-ui-part="suite"><button data-ui-part="trigger">registry.test.js</button><div data-ui-part="content"><ul>' + "".join(f'<li data-ui-part="test" data-status="passed">{t}</li>' for t in ("labels + roles", "hang moves the cell", "restore from the tag")) + '</ul></div></div>'
  '<div data-ui="collapsible" data-ui-part="suite" data-default-open><button data-ui-part="trigger">ai.test.js</button><div data-ui-part="content"><ul><li data-ui-part="test" data-status="passed">prompt input submits</li><li data-ui-part="test" data-status="failed">file tree arrows <pre>expected "src" got "README.md"</pre></li><li data-ui-part="test" data-status="skipped">chart tooltips</li></ul></div></div>', open_=True))
add(G, "tool", "Tool call", "done", "-", "AI: Tool",
 "Disclosure: tool name + status badge (pending, running, completed, error) as a polite live region; input and output sections.",
 "".join(coll("tool", n, f'<div data-ui-part="input"><b>Input</b><pre>{i}</pre></div>' + (f'<div data-ui-part="output"><b>Output</b><pre>{o}</pre></div>' if o else ""), s, trig_extra=I("tool", 14))
         for n, i, o, s in (("get_weather", '{"city":"Tbilisi"}', "", "pending"), ("search_docs", '{"q":"sidebar"}', "", "running"), ("read_file", '{"path":"README.md"}', "# Colibri UI…", "completed"), ("run_sql", "DROP TABLE x", "permission denied", "error"))))

T = {
 "chain-of-thought": ("Thinking steps", "A collapsible summary that expands into the steps an AI agent took.", "Show how an answer was reached without cluttering the reply."),
 "chat": ("Chat (full thread)", "A working chat: scrolling thread, suggestion chips and a message box with attachments.", "Building an assistant or support chat; compose your own from these parts."),
 "checkpoint": ("Checkpoint", "A marker in a conversation you can go back to, with a Restore button.", "Undo points in AI editing sessions."),
 "confirmation": ("Approval request", "Asks the user to approve or reject an action before it runs.", "Before an AI agent runs a risky tool (delete, send, pay)."),
 "context": ("Context window meter", "Shows how much of the model's context window the conversation has used.", "AI chats with long sessions, so users know when to start fresh."),
 "file-tree": ("File tree", "A folder tree of files (for example the files an agent changed); keyboard navigable.", "Code changes, document browsers, project explorers."),
 "inline-citation": ("Inline citation", "A numbered source inside a sentence that previews the source on hover.", "AI answers or articles that cite sources."),
 "ai-message": ("AI reply (composed)", "One full AI turn: the question, the agent's thinking and tool call, and the answer with actions.", "Reference for laying out assistant replies."),
 "model-selector": ("Model picker", "Two dropdowns: which AI model to use and how hard it should think.", "Assistants that offer several models or effort levels."),
 "plan": ("Plan with progress", "The steps an agent plans to take, with how many are done.", "Multi-step agent work the user should follow."),
 "prompt-input": ("Message box (prompt)", "A growing text box with attach and send buttons; Enter sends, and Send turns into Stop while answering.", "The input of any chat or AI assistant."),
 "queue": ("To-do queue", "A checklist split into what is left and what is done.", "An agent's todo list, or any lightweight task list."),
 "reasoning": ("Reasoning (live)", "Shows the AI's thinking while it streams, then folds away as 'Thought for Ns'.", "Reasoning models; keeps the reply clean while staying transparent."),
 "sources": ("Sources list", "A collapsible \"Used N sources\" list of links.", "Under an AI answer that used web or document sources."),
 "stack-trace": ("Error stack trace", "A failed call's error message that expands into its stack frames, with copy.", "Showing tool or build failures."),
 "subagent": ("Sub-agent run", "A collapsible block for work handed to a helper agent: its steps and its result.", "Multi-agent systems."),
 "suggestion": ("Suggested prompts", "Short ready-made prompts the user can send in one click.", "Empty chats and follow-up ideas."),
 "task": ("Live task", "The steps an agent takes, appearing as it takes them.", "Searches, file reads and other background work."),
 "terminal": ("Command output", "A command and its streaming output, like a small terminal.", "When an agent or build runs shell commands."),
 "test-results": ("Test results", "A test run with pass/fail counts and suites you can expand.", "CI output, agent test runs."),
 "tool": ("Tool call", "One tool call from input to output, with a pending/running/completed/error badge.", "Any agent that calls tools or APIs."),
}
for k, (a, b, c) in T.items(): info(k, a, b, c)
FTL.update({k: f'[@ui.agent kind="{k}" status="running" title="…" open=true]\n  [@ui.agentStep status="done"]First step[/@ui.agentStep]\n[/@ui.agent]' for k in ("chain-of-thought", "plan", "task")})
FTL.update({k: f'[@ui.agent kind="{k}" status="{s}" title="{t}"]…[/@ui.agent]' for k, s, t in (("tool", "completed", "read_file"), ("reasoning", "streaming", "Thinking…"), ("sources", "done", "Used 3 sources"), ("subagent", "completed", "Researcher"), ("stack-trace", "error", "TypeError: …"), ("test-results", "done", "Test run"), ("terminal", "running", "npm test"))})
FTL["checkpoint"] = '[@ui.checkpoint id="cp-3" label="Checkpoint · 3 files changed" /]'
FTL["confirmation"] = '[@ui.confirmation title="Run DELETE FROM desp_session?"]This tool needs your approval.[/@ui.confirmation]'
FTL["queue"] = '[@ui.queue pending=[{"id":1,"label":"Write the README"}] completed=[{"id":0,"label":"Design tokens"}] /]'
FTL["chat"] = '<div class="chat">\n  <div data-ui="message-scroller">…</div>\n  [@ui.suggestion target="#prompt" items=["What is headless?"] /]\n  [@ui.promptInput id="prompt" /]\n</div>'
FTL["ai-message"] = '[@ui.message from="assistant"]\n  [@ui.agent kind="reasoning" title="Thought for 3s"]…[/@ui.agent]\n  [@ui.agent kind="tool" status="completed" title="query_database"]…[/@ui.agent]\n  [@ui.bubble variant="ghost"]Two users.[/@ui.bubble]\n[/@ui.message]'
FTL["model-selector"] = '[@ui.select name="model" value="fast" options=[{"value":"fast","label":"Fast"},{"value":"smart","label":"Smart"}] /]\n[@ui.select name="effort" value="medium" options=efforts /]'
FTL["inline-citation"] = '…the tree pattern[@ui.citation n=1 href=url title="Tree View Pattern" source="w3.org"]A tree view widget…[/@ui.citation].'

FTL["prompt-input"] = '[@ui.promptInput id="prompt" placeholder="Ask anything…" attach=true /]'
FTL["file-tree"] = '[@ui.fileTree label="Changed files" nodes=tree /]  [#-- nodes=[{"name","path","children":[…]}] --]'
FTL["context"] = '[@ui.context used=124000 max=200000 /]'
FTL["suggestion"] = '[@ui.suggestion target="#prompt" items=["Summarise this page","Write tests"] /]'

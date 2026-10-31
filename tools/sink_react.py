"""React usage per component, generated from each demo's HTML so it never drifts.
Outermost data-ui elements become Colibri React wrappers (<Dialog>, <UI kind="…">); their own parts become <Part>.
Nested data-ui elements stay plain JSX: the outer wrapper initialises them (same rule as auto-init)."""
import re
from html.parser import HTMLParser
VOID = {"area","base","br","col","embed","hr","img","input","link","meta","source","track","wbr"}
NAMED = {"dialog":("Dialog","div"),"sheet":("Sheet","div"),"tabs":("Tabs","div"),"accordion":("Accordion","div"),
 "collapsible":("Collapsible","div"),"dropdown-menu":("DropdownMenu","div"),"popover":("Popover","div"),"tooltip":("Tooltip","span"),
 "select":("Select","div"),"combobox":("Combobox","div"),"button-group":("ButtonGroup","div"),"switch":("Switch","button"),"spinner":("Spinner","span")}
ATTR = {"class":"className","for":"htmlFor","tabindex":"tabIndex","readonly":"readOnly","maxlength":"maxLength","minlength":"minLength",
 "autofocus":"autoFocus","autocomplete":"autoComplete","colspan":"colSpan","rowspan":"rowSpan","contenteditable":"contentEditable",
 "spellcheck":"spellCheck","inputmode":"inputMode","enterkeyhint":"enterKeyHint","srcset":"srcSet","crossorigin":"crossOrigin",
 "novalidate":"noValidate","formnovalidate":"formNoValidate","accesskey":"accessKey","datetime":"dateTime","popovertarget":"popoverTarget",
 "viewbox":"viewBox","stroke-width":"strokeWidth","stroke-linecap":"strokeLinecap","stroke-linejoin":"strokeLinejoin","fill-rule":"fillRule",
 "clip-rule":"clipRule","stroke-dasharray":"strokeDasharray","stroke-dashoffset":"strokeDashoffset","preserveaspectratio":"preserveAspectRatio",
 "xlink:href":"xlinkHref","stop-color":"stopColor","text-anchor":"textAnchor","font-size":"fontSize","fill-opacity":"fillOpacity"}
BOOL = {"disabled","checked","selected","hidden","required","readonly","autofocus","multiple","open","novalidate","formnovalidate","inert","controls","loop","muted","playsinline","default","reversed"}

class N:
    def __init__(s, tag, attrs): s.tag, s.attrs, s.kids = tag, attrs, []
class P(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.root = N("#root", []); s.st = [s.root]
    def handle_starttag(s, t, a):
        n = N(t, a); s.st[-1].kids.append(n)
        if t not in VOID: s.st.append(n)
    def handle_startendtag(s, t, a): s.st[-1].kids.append(N(t, a))
    def handle_endtag(s, t):
        for i in range(len(s.st) - 1, 0, -1):
            if s.st[i].tag == t: del s.st[i:]; return
    def handle_data(s, d): s.st[-1].kids.append(d)
    def handle_comment(s, d): s.st[-1].kids.append(("comment", d.strip()))

def style_obj(v):
    out = []
    for decl in v.split(";"):
        if ":" not in decl: continue
        k, val = decl.split(":", 1); k, val = k.strip(), val.strip()
        if not k: continue
        key = f'"{k}"' if k.startswith("--") else re.sub(r"-([a-z])", lambda m: m[1].upper(), k)
        out.append(f'{key}: {jstr(val)}')
    return "{{ " + ", ".join(out) + " }}"
def jstr(v): return '"' + v.replace("\\", "\\\\").replace('"', '\\"') + '"'
def jattr(tag, k, v):
    if k.startswith("on"): return None
    if k == "style": return f"style={style_obj(v or '')}"
    if k == "value" and tag in ("input", "textarea", "select"): k = "defaultValue"
    if k == "checked" and tag == "input": return "defaultChecked"
    if k == "selected" and tag == "option": return None
    name = ATTR.get(k, k)
    if v is None or (v == "" and k in BOOL): return name
    if v == "" and not (k.startswith("data-") or k.startswith("aria-")): return name if k in BOOL else f'{name}=""'
    return f'{name}={jstr(v)}' if '"' not in v else f"{name}={{{jstr(v)}}}"
def text(t): return re.sub(r"[{}<>]", lambda m: {"{": "{'{'}", "}": "{'}'}", "<": "&lt;", ">": "&gt;"}[m[0]], t)

def render(html):
    p = P(); p.feed(html); p.close(); used = set(); lines = []
    def attrs_of(n, skip=()):
        return [x for k, v in n.attrs if k not in skip for x in [jattr(n.tag, k, v)] if x]
    def emit(n, d, owner):
        ind = "  " * d
        if isinstance(n, tuple): lines.append(f"{ind}{{/* {n[1]} */}}"); return
        if isinstance(n, str):
            t = re.sub(r"\s+", " ", n).strip()
            if t: lines.append(ind + text(t))
            return
        if n.tag == "textarea" and n.kids:
            n.attrs = n.attrs + [("value", "".join(k for k in n.kids if isinstance(k, str)).strip())]; n.kids = []
        a = dict(n.attrs); kind, part = a.get("data-ui"), a.get("data-ui-part")
        if n.tag in ("script", "style"):
            lines.append(f"{ind}{{/* <{n.tag}> from the demo: load it once in your app */}}"); return
        if kind and owner is None and kind not in ("sidebar-trigger",):
            comp, deft = NAMED.get(kind, ("UI", "div"))
            used.add(comp); head = [comp] + ([f'kind="{kind}"'] if comp == "UI" else [])
            if n.tag != deft: head.append(f'as="{n.tag}"')
            head += attrs_of(n, ("data-ui",)); tag, inner_owner = comp, n
        elif part and owner is not None and owner_kind_ok(n, owner):
            used.add("Part"); head = ["Part", f'name="{part}"'] + ([f'as="{n.tag}"'] if n.tag != "div" else [])
            if "data-value" in a: head.append(f'value={jstr(a["data-value"])}')
            head += [x for x in attrs_of(n, ("data-ui-part", "data-value")) if not (n.tag == "button" and x == 'type="button"')]
            tag, inner_owner = "Part", owner
        else:
            head = [n.tag] + attrs_of(n); tag = n.tag
            inner_owner = "nested" if (kind and owner is not None) else owner
        kids = [k for k in n.kids if not (isinstance(k, str) and not k.strip())]
        open_ = "<" + " ".join(head)
        if len(open_) > 110 and len(head) > 2: open_ = "<" + head[0] + "".join(f"\n{ind}  {h}" for h in head[1:]) + f"\n{ind}"
        if not kids or (n.tag in VOID and tag == n.tag): lines.append(f"{ind}{open_}" + ("/>" if open_.endswith("\n" + ind) else " />")); return
        if len(kids) == 1 and isinstance(kids[0], str):
            t = text(re.sub(r"\s+", " ", kids[0]).strip()); one = f"{ind}{open_}>{t}</{tag}>"
            if len(one) < 120: lines.append(one); return
        lines.append(f"{ind}{open_}>")
        for k in kids: emit(k, d + 1, inner_owner)
        lines.append(f"{ind}</{tag}>")
    def owner_kind_ok(n, owner): return owner != "nested"
    tops = [k for k in p.root.kids if not (isinstance(k, str) and not k.strip())]
    multi = len(tops) > 1
    for k in tops: emit(k, 3 if multi else 2, None)
    body = "\n".join(lines)
    if multi: body = "    <>\n" + body + "\n    </>"
    imp = f'import {{ {", ".join(sorted(used, key=lambda x: (x in ("UI", "Part"), x)))} }} from "@colibri-kit/ui/react";\n\n' if used else ""
    return imp + "export function Demo() {\n  return (\n" + body + "\n  );\n}"

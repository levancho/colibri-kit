"""Tiny HTML pretty-printer for the gallery's code tabs (block tags on their own lines, 2-space indent)."""
from html.parser import HTMLParser
BLOCK = {"div","section","article","header","footer","nav","ul","ol","li","table","thead","tbody","tr","th","td","dialog","form","fieldset","legend","h1","h2","h3","h4","p","pre","template","aside","main","blockquote","select","option","caption","hr"}
VOID = {"input","img","br","hr","meta","link"}
class P(HTMLParser):
    def __init__(s): super().__init__(convert_charrefs=False); s.out=[]; s.d=0; s.line=""
    def flush(s):
        if s.line.strip(): s.out.append("  "*s.d + s.line.strip())
        s.line=""
    def attrs(s, a): return "".join(f' {k}' if v is None else f' {k}="{v}"' for k,v in a)
    def handle_starttag(s, t, a):
        tag=f"<{t}{s.attrs(a)}>"
        if t in BLOCK: s.flush(); s.line=tag
            # children of block go on next lines
        else: s.line+=tag
        if t in BLOCK and t not in VOID: s.flush(); s.d+=1
    def handle_startendtag(s, t, a): s.handle_starttag(t, a)
    def handle_endtag(s, t):
        if t in BLOCK:
            s.flush(); s.d=max(0,s.d-1); s.out.append("  "*s.d+f"</{t}>")
        else: s.line+=f"</{t}>"
    def handle_data(s, d): s.line+=" ".join(d.split()) if d.strip() else (" " if s.line else "")
    def handle_entityref(s, n): s.line+=f"&{n};"
    def handle_charref(s, n): s.line+=f"&#{n};"
    def handle_comment(s, d): s.flush(); s.out.append("  "*s.d+f"<!--{d}-->")
def pretty(h):
    p=P(); p.feed(h); p.flush()
    out=[]; 
    for l in p.out:  # join "<p>" + text + "</p>" when short
        if out and l.strip().startswith("</") and len(out)>=2 and out[-2].strip().startswith("<"+l.strip()[2:-1]) and len(out[-2].strip())+len(out[-1].strip())+len(l.strip())<110 and not out[-1].strip().startswith("<") :
            t=out.pop(); o=out.pop(); out.append(o+t.strip()+l.strip()); continue
        out.append(l)
    return "\n".join(out)

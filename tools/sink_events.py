#!/usr/bin/env python3
"""Derive each component's events and controller API from src/core/*.js.

The registry, `colibri docs`, the MCP server and the skill reference all describe behaviour that lives in
the controllers. Reading it from the source keeps those descriptions true: an event renamed in a controller
changes the documentation on the next build instead of leaving a stale sentence behind.

  extract() -> { "tabs": {"events": [{"name": "ui:change", "detail": ["value", "previous"], "cancelable": False}],
                          "api": ["value", "destroy"]}, ... }

This is a static reading, not a type checker. It follows calls to helper functions in the same module, and
reports the members of the object a controller returns. Members assembled dynamically are not seen.
"""
import pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
CORE = ROOT / "src" / "core"


def _strip(src):
    """Blank out comments and string/template contents, keeping offsets, so braces can be matched."""
    out, i, n = [], 0, len(src)
    while i < n:
        two = src[i:i + 2]
        if two == "//":
            j = src.find("\n", i); j = n if j < 0 else j
            out.append(" " * (j - i)); i = j
        elif two == "/*":
            j = src.find("*/", i + 2); j = n if j < 0 else j + 2
            out.append(re.sub(r"[^\n]", " ", src[i:j])); i = j
        elif src[i] in "\"'`":
            q, j = src[i], i + 1
            while j < n and src[j] != q:
                j += 2 if src[j] == "\\" else 1
            out.append(q + re.sub(r"[^\n]", " ", src[i + 1:j]) + q); i = j + 1
        else:
            out.append(src[i]); i += 1
    return "".join(out)


def _close(text, start, open_="{", close="}"):
    depth = 0
    for i in range(start, len(text)):
        if text[i] == open_: depth += 1
        elif text[i] == close:
            depth -= 1
            if depth == 0: return i
    return len(text) - 1


def _keys(literal):
    """Top-level keys of an object literal given as its inner text."""
    keys, depth, token = [], 0, ""
    parts, cur = [], ""
    for ch in literal:
        if ch in "({[": depth += 1
        elif ch in ")}]": depth -= 1
        if ch == "," and depth == 0: parts.append(cur); cur = ""
        else: cur += ch
    parts.append(cur)
    for part in parts:
        m = re.match(r"\s*(?:async\s+)?(?:get\s+|set\s+)?\.{0,3}([A-Za-z_$][\w$]*)", part)
        if m and not part.strip().startswith("...") and m.group(1) not in keys: keys.append(m.group(1))
    return keys


def _functions(raw):
    """Top-level functions of a module: name -> (body_raw, body_clean). Handles `function f() {}`,
    `const f = () => {}` and `const f = () => expression;`."""
    clean, found = _strip(raw), {}
    for m in re.finditer(r"^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|^(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(", clean, re.M):
        name = m.group(1) or m.group(2)
        params_end = _close(clean, m.end() - 1, "(", ")")
        k = params_end + 1
        if m.group(2):
            arrow = clean.find("=>", k)
            if arrow < 0 or clean[k:arrow].strip(): continue
            k = arrow + 2
        while k < len(clean) and clean[k].isspace(): k += 1
        if k >= len(clean): continue
        if clean[k] == "{":
            end = _close(clean, k)
        else:  # expression body: runs to the statement's semicolon at depth 0
            depth, end = 0, k
            while end < len(clean):
                ch = clean[end]
                if ch in "({[": depth += 1
                elif ch in ")}]": depth -= 1
                elif ch == ";" and depth == 0: break
                end += 1
        found[name] = (raw[k:end + 1], clean[k:end + 1])
    # const createPlan = agentBlock("plan"), createTask = agentBlock("task"): controllers made by a factory
    for m in re.finditer(r"\b([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)\(\s*(?:\"[^\"]*\"|'[^']*')\s*\)\s*[,;]", clean):
        if m.group(1) not in found and m.group(2) in found: found[m.group(1)] = found[m.group(2)]
    return found


def _events(raw, clean):
    events = {}
    def note(name, detail_at, tail):
        entry = events.setdefault(name, {"name": name, "detail": [], "cancelable": False})
        if detail_at is not None and detail_at < len(clean) and clean[detail_at] == "{":
            for key in _keys(clean[detail_at + 1:_close(clean, detail_at)]):
                if key not in entry["detail"]: entry["detail"].append(key)
        if re.search(r"cancelable\s*:\s*true|,\s*true\s*\)\s*$", tail): entry["cancelable"] = True
    # emit(el, "name", detail?, cancelable?)
    for m in re.finditer(r"\bemit\(", clean):
        close = _close(clean, m.end() - 1, "(", ")")
        # split the call's arguments at depth 0: emit(target, name, detail?, cancelable?)
        args, depth, start = [], 0, m.end()
        for k in range(m.end(), close + 1):
            ch = clean[k]
            if ch in "({[": depth += 1
            elif ch in ")}]": depth -= 1
            if (ch == "," and depth == 0) or k == close:
                args.append((start, k)); start = k + 1
        if len(args) < 2: continue
        a0, a1 = args[1]
        # the name is a literal or a conditional between literals: open ? "open" : "close"
        names = [q.group()[1:-1] for q in re.finditer(r"\"[^\"]*\"|'[^']*'", raw[a0:a1])]
        detail_at = None
        if len(args) > 2:
            detail_at = args[2][0]
            while detail_at < args[2][1] and clean[detail_at].isspace(): detail_at += 1
        for name in names:
            if re.fullmatch(r"[a-z][a-z-]*", name): note("ui:" + name, detail_at, clean[m.start():close + 1])
    # new CustomEvent("ui:name", { detail: {...}, cancelable: true })
    for m in re.finditer(r"new\s+CustomEvent\(\s*(\"|'|`)", clean):
        q = m.end() - 1; name = raw[q + 1:raw.index(raw[q], q + 1)]
        if not name.startswith("ui:") or "${" in name: continue
        close = _close(clean, clean.find("(", m.start()), "(", ")")
        init = clean[m.start():close + 1]
        d = re.search(r"detail\s*:\s*\{", init)
        note(name, m.start() + d.end() - 1 if d else None, init)
    return list(events.values())


def _api(raw, clean):
    """Members of the object the controller returns (the last `return {` or `api = {` / Object.assign target)."""
    spots = [m.end() - 1 for m in re.finditer(r"\breturn\s*\{", clean)]
    spots += [m.end() - 1 for m in re.finditer(r"\b(?:const|let)\s+api\s*=\s*\{", clean)]
    spots += [m.end() - 1 for m in re.finditer(r"\bapi\s*=\s*Object\.assign\(\s*[\w$]+\s*,\s*\{", clean)]
    members = []
    for at in sorted(spots)[-1:] if not re.search(r"\b(?:const|let)\s+api\s*=", clean) else sorted(s for s in spots if re.search(r"api\s*=\s*(?:Object\.assign\(\s*[\w$]+\s*,\s*)?$", clean[max(0, s - 60):s])):
        # comment-free text: a trailing // note must not swallow the next member
        for key in _keys(clean[at + 1:_close(clean, at)]):
            if key not in members: members.append(key)
    return members


def _registry():
    """data-ui name -> (module file, function name), wrappers resolved to the wrapped controller."""
    src = (CORE / "registry.js").read_text()
    named, spaces = {}, {}
    for m in re.finditer(r'import\s*\{([^}]+)\}\s*from\s*"\./([\w-]+\.js)"', src):
        for ident in m.group(1).split(","): named[ident.strip()] = m.group(2)
    for m in re.finditer(r'import\s*\*\s*as\s+(\w+)\s+from\s*"\./([\w-]+\.js)"', src): spaces[m.group(1)] = m.group(2)
    body = src[src.index("export const registry = {") + len("export const registry = {"):src.rindex("};")]
    table = {}
    for m in re.finditer(r'(?:"([\w-]+)"|([\w$]+))\s*:\s*([\w$.]+)(?:\(([\w$.]+)\))?\s*,', body):
        expr = m.group(4) or m.group(3)
        if "." in expr:
            space, fn = expr.split(".")
            table[m.group(1) or m.group(2)] = (spaces[space], fn)
        else:
            table[m.group(1) or m.group(2)] = (named[expr], expr)
    return table


def extract():
    modules = {p.name: _functions(p.read_text()) for p in CORE.glob("*.js")}
    result = {}
    for name, (module, fn) in _registry().items():
        funcs = modules.get(module, {})
        if fn not in funcs: continue
        seen, queue, events = set(), [fn], {}
        while queue:  # follow helpers defined in the same module
            current = queue.pop()
            if current in seen or current not in funcs: continue
            seen.add(current)
            raw, clean = funcs[current]
            for event in _events(raw, clean):
                entry = events.setdefault(event["name"], {"name": event["name"], "detail": [], "cancelable": False})
                entry["detail"] += [k for k in event["detail"] if k not in entry["detail"]]
                entry["cancelable"] = entry["cancelable"] or event["cancelable"]
            queue += [other for other in funcs if other not in seen and re.search(r"\b" + re.escape(other) + r"\s*\(", clean)]
        api = _api(*funcs[fn])
        for helper in sorted(seen - {fn}):  # e.g. createTooltip = () => floating(...): the helper returns the API
            if api: break
            api = _api(*funcs[helper])
        result[name] = {"events": sorted(events.values(), key=lambda e: e["name"]), "api": api}
    return result


def markdown(data):
    """Generated section for the skill reference."""
    lines = ["Listen on the component root; every event bubbles. `detail` lists the keys of `event.detail`.",
             "Get a live controller with `controllers(el)[0]` (exported by `core/auto.js`, `core/auto-lazy.js` and `core/util.js`), or keep the object returned by `createX(el)`.", ""]
    for name in sorted(data):
        entry = data[name]
        if not entry["events"] and not entry["api"]: continue
        events = "; ".join(f"`{e['name']}`" + (f" detail `{', '.join(e['detail'])}`" if e["detail"] else "") + (" (cancelable)" if e["cancelable"] else "") for e in entry["events"]) or "none"
        api = ", ".join(f"`{m}`" for m in entry["api"]) or "none"
        lines.append(f"- `{name}` · events: {events} · controller: {api}")
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    import json
    print(json.dumps(extract(), indent=1))

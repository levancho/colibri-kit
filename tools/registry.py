#!/usr/bin/env python3
"""Builds registry/colibri.json: the machine-readable catalog used by the CLI (bin/colibri.mjs),
the MCP server (bin/colibri-mcp.mjs) and the AI skill (skills/colibri-ui/SKILL.md)."""
import json, pathlib, re, sys, html as H
HERE = pathlib.Path(__file__).parent; ROOT = HERE.parent; sys.path.insert(0, str(HERE))
from sink_catalog_more import C
import sink_catalog_motion, sink_catalog_ai, sink_catalog_blocks  # noqa
from sink_info import INFO
from sink_code import FTL, IMP
from sink_pretty import pretty
pkg = json.loads((ROOT / "package.json").read_text())
items = []
for c in C:
    t, what, when = INFO[c["id"]]
    parts = sorted(set(re.findall(r'data-ui-part="([a-z0-9-]+)"', c["demo"])))
    uis = sorted(set(re.findall(r'data-ui="([a-z0-9-]+)"', c["demo"])))
    kind = "block" if c["group"].endswith("blocks") else "motion" if c["group"] in ("Motion", "Theming") else "component"
    items.append({"name": c["id"], "title": t, "type": kind, "group": c["group"], "status": c["status"], "description": what, "whenToUse": when,
                  "shadcn": c["shadcn"], "metronic": c["metronic"], "accessibility": c["notes"], "parts": parts, "uses": [u for u in uis if u != c["id"]],
                  "html": pretty(c["demo"]), "freemarker": (IMP + FTL[c["id"]]) if c["id"] in FTL else None})
out = {"$schema": "https://colibri-ui.local/schema/registry.json", "name": "colibri-ui", "version": pkg.get("version", "0.0.0"),
       "files": {"core": "src/core/", "auto": "src/core/auto.js", "elements": "src/elements/all.js", "theme": "themes/colibri.css", "motion": "themes/motion.css", "freemarker": "freemarker/ui.ftl", "thymeleaf": "thymeleaf/", "css": "packages/colibri-css/dist/colibri.css", "bridge": "packages/colibri-css/dist/colibri-ui-bridge.css"},
       "rules": ["Markup contract: data-ui=\"name\" roots, data-ui-part=\"part\" children; state in data-state / aria-* / hidden.",
                 "Never style by JS; theme only through --ui-* tokens in themes/colibri.css (or your own CSS).",
                 "Events are ui:* CustomEvents that bubble; cancelable ones can be preventDefault()-ed.",
                 "Forms: wrap each control in data-ui=field (label, control, description, error).",
                 "Option sets: use toggle-group / radio-group; menus: dropdown-menu; overlays: dialog/sheet/popover.",
                 "Compose blocks from components; do not invent new data-ui names for layouts (use classes)."],
       "items": items}
(ROOT / "registry").mkdir(exist_ok=True)
(ROOT / "registry" / "colibri.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
print(f"registry/colibri.json: {len(items)} items")

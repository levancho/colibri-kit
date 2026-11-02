"""Wrap engine-rendered FreeMarker output in the browser test page."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
body=(root/'test/ftl/rendered.html').read_text()
(root/'examples/ftl-output.html').write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>FreeMarker macro output</title><link rel="stylesheet" href="../themes/colibri.css"></head><body class="ui-root">\n'+body+'\n<script type="module">import { init } from "../src/core/auto.js"; init(); window.__ok = true;</script></body></html>\n')

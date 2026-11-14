#!/bin/sh
# Builds site/dist: Colibri Kit home + Colibri CSS dist + Colibri UI (themes/src) + kitchen sink.
set -e
cd "$(dirname "$0")/.."
(cd packages/colibri-css && node build.mjs)
node tools/lazy-registry.mjs >/dev/null
node tools/build-ui.mjs >/dev/null
python3 tools/applications/generate.py
python3 tools/ftl-fixture.py
python3 tools/gen_knobs.py >/dev/null
python3 tools/kitchen-sink.py >/dev/null
python3 tools/registry.py >/dev/null
python3 tools/readme-catalog.py >/dev/null
rm -rf site/dist && mkdir -p site/dist/css site/dist/ui site/dist/kitchen-sink
cp -R site/src/* site/dist/
# The embeddable widget script: renderer + Colibri CSS in one file (see site/src/widgets/).
node tools/build-widgets.mjs >/dev/null
# The React Native showcase, compiled for browsers with react-native-web (see site/src/native/).
node tools/build-native-demo.mjs >/dev/null
# One code sample per demo, taken from the demo source.
node tools/native-code.mjs >/dev/null
# The download must match these templates. Build it rather than publish a stale JAR.
python3 tools/package-java-download.py
cp packages/colibri-css/dist/*.css site/dist/css/
cp packages/colibri-css/dist/bundle-sizes.json site/dist/css/
cp -R themes src freemarker thymeleaf dist site/dist/ui/
# kitchen sink keeps its relative paths (../src, ../themes, ../packages)
mkdir -p site/dist/kitchen-sink/packages/colibri-css
cp -R examples themes src site/dist/kitchen-sink/
cp -R packages/colibri-css/dist site/dist/kitchen-sink/packages/colibri-css/
cp packages/colibri-css/README.md site/dist/kitchen-sink/packages/colibri-css/
echo "built site/dist ($(find site/dist -type f | wc -l | tr -d ' ') files, $(du -sh site/dist | cut -f1))"

# Keep public metrics tied to the artifacts shipped by this build.
python3 - <<'PYMETRICS'
from pathlib import Path
import json, re, math
p = Path("site/dist/index.html")
s = p.read_text()
count = len(json.loads(Path("registry/colibri.json").read_text())["items"])
size = math.ceil(Path("site/dist/css/colibri.css").stat().st_size / 1024)
s = re.sub(r'(<b data-catalog-count>).*?(</b>)', lambda m: f"{m[1]}{count}{m[2]}", s)
s = re.sub(r'(<b data-css-size>).*?(</b>)', lambda m: f"{m[1]}{size} KiB{m[2]}", s)
p.write_text(s)
PYMETRICS
node tools/site-manifest.mjs create site/dist

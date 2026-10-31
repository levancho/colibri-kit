#!/bin/sh
# Builds site/dist: Colibri Kit home + Colibri CSS dist + Colibri UI (themes/src) + kitchen sink.
set -e
cd "$(dirname "$0")/.."
(cd packages/colibri-css && node build.mjs)
python3 tools/kitchen-sink.py >/dev/null
rm -rf site/dist && mkdir -p site/dist/css site/dist/ui site/dist/kitchen-sink
cp -R site/src/* site/dist/
cp packages/colibri-css/dist/*.css site/dist/css/
cp -R themes src site/dist/ui/
# kitchen sink keeps its relative paths (../src, ../themes, ../packages)
mkdir -p site/dist/kitchen-sink/packages/colibri-css
cp -R examples themes src site/dist/kitchen-sink/
cp -R packages/colibri-css/dist site/dist/kitchen-sink/packages/colibri-css/
cp packages/colibri-css/README.md site/dist/kitchen-sink/packages/colibri-css/
echo "built site/dist ($(find site/dist -type f | wc -l | tr -d ' ') files, $(du -sh site/dist | cut -f1))"

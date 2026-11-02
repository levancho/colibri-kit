"""Review tripwires, not a proof of maintainability. Run after npm run build."""
from pathlib import Path
from html.parser import HTMLParser
import json
import re

ROOT = Path(__file__).resolve().parents[1]
errors = []
def require(ok, message):
    if not ok: errors.append(message)
def clean(text): return re.sub(r'/\*.*?\*/', '', text, flags=re.S)

# Count authored CSS once, not the copies shipped in the generated site.
css_files = sorted({p for directory in ('themes', 'packages/colibri-css/src', 'examples', 'site/src', 'tools') for p in (ROOT / directory).rglob('*.css')})
budgets = json.loads((ROOT / 'tools/css-important-budget.json').read_text())
counts = {}
for path in css_files:
    name = str(path.relative_to(ROOT))
    count = len(re.findall(r'!\s*important\b', clean(path.read_text())))
    if count: counts[name] = count
    require(count <= budgets.get(name, 0), f'{name}: {count} important declarations exceed reviewed budget {budgets.get(name, 0)}')

for name in ('package.json', 'packages/colibri-css/package.json'):
    manifest = json.loads((ROOT / name).read_text())
    dependencies = {key for field in ('dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies') for key in manifest.get(field, {})}
    require(not any('tailwind' in dep.lower() for dep in dependencies), f'{name}: Tailwind dependency introduced')

for path in (ROOT / 'src/core').glob('*.js'):
    for spec in re.findall(r'(?:from\s*|import\s*\(\s*)[\'\"]([^\'\"]+)', path.read_text()):
        require(spec.startswith('.'), f'{path.relative_to(ROOT)}: external runtime import {spec}')

helpers = set(re.findall(r'\.([a-z][a-z-]*)', clean((ROOT / 'packages/colibri-css/src/60-utilities.css').read_text())))
# Exclude the named layer from the class-name scan.
helpers.discard('utilities')
require(helpers == {'visually-hidden', 'muted', 'flow', 'truncate'}, 'CSS helper vocabulary changed; review the architecture contract')

class Markup(HTMLParser):
    def __init__(self):
        super().__init__(); self.max_classes = 0; self.inline_presentation = 0
    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name == 'class' and value:
                self.max_classes = max(self.max_classes, len(value.split()))
            if name == 'style' and value:
                if any(not declaration.strip().startswith('--') for declaration in value.split(';') if declaration.strip()):
                    self.inline_presentation += 1

markup = {}
for folder in ('site/src', 'examples/dashboards', 'examples/blocks', 'examples/playground'):
    scan = Markup()
    for path in sorted((ROOT / folder).rglob('*.html')): scan.feed(path.read_text())
    markup[folder] = {'max_classes': scan.max_classes, 'inline_presentation': scan.inline_presentation}
    require(scan.max_classes <= 5, f'{folder}: class list grew beyond the review threshold of five')
    require(scan.inline_presentation == 0, f'{folder}: presentation styles returned to markup')

# Every optional theme declares the same order, including standalone loading.
layer_order = 'colibri.reset, colibri.tokens, colibri.base, colibri.layout, colibri.components, colibri.utilities, colibri.ui, colibri.packs, colibri.bridge, colibri.looks, colibri.motion'
for name, layer in [('themes/colibri.css', 'ui'), ('themes/knobs.css', 'looks'), ('themes/motion.css', 'motion'), ('packages/colibri-css/src/70-colibri-ui-bridge.css', 'bridge'), *[(f'themes/packs/{pack}.css', 'packs') for pack in ('glacier', 'ember', 'midnight')]]:
    content = (ROOT / name).read_text()
    require('@layer ' + layer_order + ';' in content and re.search(r'@layer\s+colibri\.' + layer + r'\s*\{', content), f'{name}: missing cascade layer contract')

knobs = clean((ROOT / 'themes/knobs.css').read_text())
require('!important' not in knobs, 'Appearance controls must use normal cascade declarations')
require(not re.search(r'(\[data-ui=[^]]+\])\1', knobs), 'Appearance controls must not duplicate selectors to raise specificity')
for selector, body in re.findall(r'([^{}]+)\{([^{}]*)\}', knobs):
    if '[data-ui=tab-nav]' in selector or '[data-ui=callout]' in selector:
        require('!important' not in body and all(d.strip().startswith('--') for d in body.split(';') if d.strip()), f'Appearance rule must only set tokens: {selector}')

# Keep the standalone skill catalog and bundled reference links aligned with the release.
catalog = json.loads((ROOT / 'registry/colibri.json').read_text())['items']
reference = (ROOT / 'skills/colibri-kit/reference/components.md').read_text()
for item in catalog:
    require('`' + item['name'] + '`' in reference, f"Skill catalog is missing {item['name']}")
for folder in ('skills/colibri-kit', 'skills/colibri-ui'):
    for path in (ROOT / folder).rglob('*.md'):
        for link in re.findall(r'\]\(([^)]+)\)', path.read_text()):
            if '://' not in link and not link.startswith('#'):
                require((path.parent / link.split('#')[0]).exists(), f'{path.relative_to(ROOT)}: missing bundled reference {link}')

print(json.dumps({'important_declarations': counts, 'markup': markup, 'css_helpers': sorted(helpers)}, indent=2))
if errors:
    raise SystemExit('\n'.join(errors))
print('Architecture checks passed. Counts are review signals, not accessibility or quality certification.')

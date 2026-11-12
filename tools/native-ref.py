"""Prints the web catalog entry for a component, as the reference for porting it to React Native.

    python3 tools/native-ref.py accordion            # description, parts, events and the HTML markup
    python3 tools/native-ref.py --group "AI Elements"   # names and one-line descriptions of a whole group
"""
import json, sys
from pathlib import Path
items = json.loads((Path(__file__).resolve().parents[1] / 'registry/colibri.json').read_text())['items']
if len(sys.argv) > 2 and sys.argv[1] == '--group':
    for item in items:
        if item['group'].lower() == sys.argv[2].lower(): print(f"{item['name']}: {item['title']} — {item['description']}")
    sys.exit()
for name in sys.argv[1:]:
    item = next((i for i in items if i['name'] == name), None)
    if not item: print(f'no catalog entry named {name}'); continue
    print(f"== {item['name']} ({item['group']}) — {item['title']}\n{item['description']}\nWhen to use: {item.get('whenToUse')}\nAccessibility: {item.get('accessibility')}\nParts: {item.get('parts')}\nEvents: {item.get('events')}\nAPI: {item.get('api')}\n--- HTML\n{item['html'][:6000]}\n")

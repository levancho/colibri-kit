"""Single adapter/support manifest consumed by gallery, registry, CLI and MCP."""
from sink_code import FTL, IMP
from sink_react import render as react_src
from sink_thymeleaf import render as thymeleaf_src, ARGS
from sink_pretty import pretty

def adapters(c):
    tabs = list(c.get('snips') or ([('html','HTML',pretty(c['demo']))] if c['demo'] else []))
    supplied = {k for k, _, _ in tabs}
    markup = next((src for k, _, src in tabs if k == 'html'), None)
    if not c.get('explicit_adapters'):
        if 'ftl' not in supplied:
            if c['id'] in FTL: tabs.append(('ftl','FreeMarker',IMP+FTL[c['id']]))
            elif markup: tabs.append(('ftl','FreeMarker','[#-- Static HTML example; no parameterized macro is supplied for this entry. --]\n'+markup))
        if markup and 'react' not in supplied: tabs.append(('react','React',react_src(markup)))
        if markup and 'thymeleaf' not in supplied: tabs.append(('thymeleaf','Thymeleaf',thymeleaf_src(markup,c['id'])))
    source={k:src for k,_,src in tabs}
    native=c.get('explicit_adapters',False)
    support={
      'html':'markup' if markup else 'unavailable',
      'react':('native' if native else 'markup-adapter') if 'react' in source else 'unavailable',
      'freemarker':('native' if native or c['id'] in FTL else 'static-html') if 'ftl' in source else 'unavailable',
      'thymeleaf':('native' if native or c['id'] in ARGS or c['id']=='field' else 'static-html') if 'thymeleaf' in source else 'unavailable',
    }
    return tabs,support

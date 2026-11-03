"""Public application components: the same stylesheet used by the six demos."""
import html,json,pathlib
from sink_catalog_base import add,C
from sink_info import INFO
ROOT=pathlib.Path(__file__).resolve().parents[1]
G='Application components'
ADAPTERS=json.loads((ROOT/'tools/applications/generated.json').read_text())
SHELL='''<div class="app-shell">
  <aside class="app-nav suite-sidebar" data-app-part="sidebar" id="navigation">
    <button class="btn suite-close" data-app-part="close" type="button">Close menu</button>
    <a class="suite-brand" href="#home"><strong>Workspace</strong></a>
    <nav class="suite-context" aria-label="Main navigation"><a href="#home" aria-current="page">Overview</a><a href="#records">Records</a></nav>
    <footer><a href="#home">All applications</a></footer>
  </aside>
  <div class="app-stage"><header class="app-top"><button class="btn suite-menu" data-app-part="trigger" type="button" aria-expanded="false" aria-controls="navigation">Menu</button><strong>Your application</strong></header>
  <main class="app-main"><h1>Overview</h1><section class="app-card"><h2>A public kit component</h2><p>Replace this content with your application records.</p></section></main></div>
  <button class="suite-backdrop" data-app-part="backdrop" type="button" aria-label="Close navigation" hidden></button>
</div>'''
entries=[{'id':'application-shell','title':'Application shell','description':'Consistent sidebar, header and content with optional mobile navigation.','layout':'workspace','html':SHELL}]+json.loads((ROOT/'packages/colibri-css/applications/catalog.json').read_text())
for entry in entries:
 ident=entry['id'];body=entry['html'];layout=entry['layout']
 key=ident.removeprefix('application-')
 adapter=ADAPTERS.get(key)
 if adapter:body=adapter['html']
 notes='Loads @colibri-kit/css plus @colibri-kit/css/applications. Semantic HTML renders without dashboard CSS or JavaScript. Application data, links and business actions belong to the consumer. Supply your own image URLs. See the HTML and optional JavaScript below.'
 script=''
 if ident=='application-shell':script='<script type="module">import {createApplicationShell} from "../src/core/application-shell.js";createApplicationShell(document.body);</script>'
 if ident=='application-chart':script='<script type="module">import {createChartRanges} from "../src/core/charts.js";createChartRanges();</script>'
 if adapter:script='<script type="module" src="application-preview-entry.js"></script>'
 # srcdoc inherits the parent URL: even fragment links can load the whole sink.
 # Contain sample actions in the documentation preview, not in consumer markup.
 if not adapter:script += '<script>document.querySelectorAll("a[href]").forEach(a=>{a.target="_blank";a.rel="noopener";});</script>'
 doc=f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="../packages/colibri-css/dist/colibri.css"><link rel="stylesheet" href="../packages/colibri-css/dist/colibri-applications.css"></head><body class="colibri-application" data-layout="{layout}">{body}{script}</body></html>'
 preview=f'<iframe class="ccss-frame" title="{html.escape(entry["title"])} public kit preview" srcdoc="{html.escape(doc,quote=True)}" height="560"></iframe>'
 INFO[ident]=(entry['title'],entry['description'],'Compose applications from the public kit. The dashboard examples consume these same components.')
 add(G,ident,entry['title'],'done','—','—',notes,preview)
 # Actual standalone markup, not an iframe or a private dashboard include.
 markup=f'<!-- Load colibri.css and colibri-applications.css from @colibri-kit/css. -->\n<body class="colibri-application" data-layout="{layout}">\n{body}\n</body>'
 C[-1]['snips']=[('html','HTML',markup)]
 if ident=='application-chart':C[-1]['snips'].append(('js','JavaScript','import { createChartRanges } from "@colibri-kit/ui/core/charts.js";\nconst destroy = createChartRanges(document);'))
 if adapter:
  sample_js=(ROOT/'examples/application-preview.js').read_text().replace('../src/core/', '@colibri-kit/ui/core/')
  sample_js+='\nconst model = '+json.dumps(adapter['model'],indent=2)+';\nmountApplicationExample(document.querySelector('+json.dumps('[data-application-component="'+key+'"]')+'), model);'
  C[-1]['snips'].append(('js','JavaScript',sample_js))
 C[-1]['explicit_adapters']=True
 if adapter:
  model=json.dumps(adapter['model'],indent=2)
  name=adapter['name']
  C[-1]['snips'] += [
   ('react','React',f'import {{ {name} }} from "@colibri-kit/ui/react";\nimport "@colibri-kit/css";\nimport "@colibri-kit/css/applications";\n\nconst model = {model};\n\n// Supply handlers for application actions; callbacks receive action/id or form/values.\nexport function Example({{ onAction, onSubmit }}) {{\n  return <div className="colibri-application"><{name} model={{model}} onAction={{onAction}} onSubmit={{onSubmit}} /></div>;\n}}'),
   ('ftl','FreeMarker',f'[#import "/colibri/freemarker/application-{key}.ftl" as component]\n[#assign model = {model}]\n<div class="colibri-application">\n  [@component.component model=model /]\n</div>\n\n[#-- The macro is shipped in the Java supplement. Browser action setup is shown in JavaScript. --]'),
   ('thymeleaf','Thymeleaf',f'<!-- Set the model attribute from your controller using this structure:\n{model}\n-->\n<div class="colibri-application">\n  <section th:replace="~{{colibri/thymeleaf/application-{key} :: component(${{model}}{", ~{}" if key=="shell" else ""})}}"></section>\n</div>\n<!-- The parameterized fragment is shipped in the Java supplement. -->')]

 if ident=='application-chart':
  setup = '\n<script type="module">\nimport { createChartPanel } from "/ui/src/core/charts.js";\ndocument.querySelectorAll("[data-application-chart]").forEach(createChartPanel);\n</script>'
  C[-1]['snips'] += [
   ('react','React','''import { ChartPanel } from "@colibri-kit/ui/react";
import "@colibri-kit/css";
import "@colibri-kit/css/applications";

// rows comes from your application, e.g. [{label: "Nov 1", values: [420, 258]}, ...].
export function AnalyticsChart({ rows }) {
  return <div className="colibri-application">
    <ChartPanel title="Audience growth" description="Daily visitors and signups"
      rows={rows} labels={["Visitors", "Signups"]}
      ranges={[7, 14, 30]} defaultRange={30} />
  </div>;
}
// ChartPanel owns range state and updates its chart and accessible table.'''),
   ('ftl','FreeMarker','''[#import "/colibri/freemarker/application-chart.ftl" as charts]
[#-- Load the core and applications CSS in the page layout.
     Model: rows = [{"label": "Nov 1", "values": [420, 258]}, ...]. --]
<div class="colibri-application">
  [@charts.chartPanel id="traffic" title="Audience growth"
    description="Daily visitors and signups" rows=rows
    labels=["Visitors", "Signups"] ranges=[7,14,30] defaultRange=30 /]
</div>''' + setup),
   ('thymeleaf','Thymeleaf','''<!-- Load core and applications CSS in the page layout.
     rows: List of records with label and values fields. -->
<div class="colibri-application">
  <section th:replace="~{colibri/thymeleaf/application-chart :: chartPanel(
    'traffic', 'Audience growth', 'Daily visitors and signups',
    ${rows}, ${ {'Visitors','Signups'} }, ${ {7,14,30} }, 30)}"></section>
</div>''' + setup)]
 C[-1]['public_html']=markup

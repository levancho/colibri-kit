import json,pathlib
root=pathlib.Path(__file__).resolve().parents[2]
data=json.loads((root/'tools/applications/generated.json').read_text())
def java(v):
 if isinstance(v,str):return json.dumps(v,ensure_ascii=False)
 if isinstance(v,list):return 'List.of('+','.join(java(x) for x in v)+')'
 if isinstance(v,dict):return 'Map.ofEntries('+','.join('Map.entry('+java(k)+','+java(x)+')' for k,x in v.items())+')'
 return str(v).lower()
models=',\n'.join('Map.entry('+java(k)+','+java(s['model'])+')' for k,s in data.items())
p=root/'java/colibri-templates/src/test/java/ai/l3v/colibri/ApplicationComponentsTest.java'
p.write_text('''package ai.l3v.colibri;
import org.junit.jupiter.api.Test;
import org.thymeleaf.context.Context;
import freemarker.template.Configuration;
import freemarker.template.Template;
import java.io.*;
import java.nio.file.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
class ApplicationComponentsTest {
 static final Map<String,Map<String,Object>> MODELS=Map.ofEntries('''+models+''');
 @Test void allNativeAdaptersRenderDataAndEscapeChangedText() throws Exception {
  var cfg=new Configuration(Configuration.VERSION_2_3_35);cfg.setClassLoaderForTemplateLoading(getClass().getClassLoader(),"templates");
  var dir=Path.of("target/application-fixtures");Files.createDirectories(dir);
  for(var entry:MODELS.entrySet()) {
   var key=entry.getKey();var model=entry.getValue();
   for(boolean changed:List.of(false,true)) {
    var values=new HashMap<String,Object>(model);
    String field=values.containsKey("title")?"title":values.containsKey("name")?"name":null;
    if(changed && field!=null)values.put(field,"Changed <img src=x>");
    var template=new Template("host",new StringReader("[#ftl][#import '/colibri/freemarker/application-"+key+".ftl' as c][@c.component model=model /]"),cfg);
    var out=new StringWriter();template.process(Map.of("model",values),out);
    var context=new Context();context.setVariable("model",values);
    var th=new TemplateTest().engine().process("<section th:replace=\\"~{colibri/thymeleaf/application-"+key+" :: component(${model}"+(key.equals("shell")?", ~{}":"")+")}\\"></section>",context);
    for(var html:List.of(out.toString(),th)) {
     assertTrue(html.contains("data-application-component=\\""+key+"\\""),key);
     assertFalse(html.contains("<img src=x>"),key);
     assertFalse(html.contains("th:block"),key);
     if(changed && field!=null)assertTrue(html.contains("Changed &lt;img src=x&gt;"),key);
    }
    if(!changed){Files.writeString(dir.resolve(key+"-freemarker.html"),out.toString());Files.writeString(dir.resolve(key+"-thymeleaf.html"),th);}
   }
  }
 }
}
''')

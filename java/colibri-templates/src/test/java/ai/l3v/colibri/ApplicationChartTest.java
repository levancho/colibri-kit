package ai.l3v.colibri;
import org.junit.jupiter.api.Test;
import org.thymeleaf.context.Context;
import freemarker.template.Configuration;
import freemarker.template.Template;
import java.io.*;
import java.nio.file.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
class ApplicationChartTest {
  Map<String,Object> model() {
    var rows = new ArrayList<Map<String,Object>>();
    for(int i=1;i<=30;i++) rows.add(Map.of("label","Day "+i,"values",List.of(i*10,31-i)));
    return Map.of("rows",rows,"title","Audience <growth>","labels",List.of("Visitors","Signups"));
  }
  void check(String html, String kind) throws Exception {
    assertTrue(html.contains("Audience &lt;growth&gt;"));
    assertTrue(html.contains("Day 30"));assertTrue(html.contains("<td>10</td><td>30</td>"),"series values must come from the map entry, not Map.values()");assertTrue(html.contains("data-n=\"14\""));
    assertEquals(30,html.split("<tr>",-1).length-2);
    assertFalse(html.contains("th:block"));
    assertFalse(html.contains("style="),"no style attributes: a strict CSP blocks them (docs/csp.md)");
    assertTrue(html.contains("<li>Visitors</li>")&&html.contains("<li>Signups</li>"),"legend items in series order");
    var dir=Path.of("target/chart-fixtures");Files.createDirectories(dir);Files.writeString(dir.resolve(kind+".html"),html);
  }
  @Test void freemarkerChartUsesRowsAndEscapesText() throws Exception {
    var cfg=new Configuration(Configuration.VERSION_2_3_35);cfg.setClassLoaderForTemplateLoading(getClass().getClassLoader(),"templates");
    var t=new Template("host",new StringReader("[#ftl][#import '/colibri/freemarker/application-chart.ftl' as c][@c.chartPanel id='traffic' title=title rows=rows labels=labels /]"),cfg);
    var out=new StringWriter();t.process(model(),out);check(out.toString(),"freemarker");
  }
  @Test void thymeleafChartUsesRowsAndEscapesText() throws Exception {
    var context=new Context();context.setVariables(model());
    var html=new TemplateTest().engine().process("<section th:replace=\"~{colibri/thymeleaf/application-chart :: chartPanel('traffic', ${title}, '', ${rows}, ${labels}, ${ {7,14,30} }, 30)}\"></section>",context);
    check(html,"thymeleaf");
  }
}

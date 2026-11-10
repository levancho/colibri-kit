package ai.l3v.colibri;
import org.junit.jupiter.api.Test;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;
import org.thymeleaf.templateresolver.StringTemplateResolver;
import freemarker.template.Configuration;
import freemarker.template.Template;
import java.io.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
class TemplateTest {
  TemplateEngine engine() {
    var e=new TemplateEngine();var files=new ClassLoaderTemplateResolver();files.setPrefix("templates/");files.setSuffix(".html");files.setCheckExistence(true);files.setOrder(1);e.addTemplateResolver(files);
    var strings=new StringTemplateResolver();strings.setOrder(2);e.addTemplateResolver(strings);return e;
  }
  String render(String fragment, String args, Map<String,Object> model) {
    var c=new Context();c.setVariables(model);
    return engine().process("<div th:replace=\"~{colibri/thymeleaf/"+fragment+" :: "+fragment.replace('-','_')+"("+args+")}\"></div>",c);
  }
  @Test void parametersChangeOutputAndEscapeText() {
    for(String label:List.of("Save","<img src=x onerror=alert(1)>")) {
      String html=render("button","${label}, 'outline', ${disabled}",Map.of("label",label,"disabled",true));
      assertTrue(html.contains("disabled=\"disabled\""));assertTrue(html.contains("data-variant=\"outline\""));assertFalse(html.contains("<img"));assertTrue(html.contains(label.equals("Save")?"Save":"&lt;img"));assertFalse(html.contains("th:block"));
    }
  }
  @Test void tabsRepeatActualModelAndKeepDisabledState() {
    var items=List.of(Map.of("value","first","label","First","text","First content","disabled",false),Map.of("value","second","label","Second","text","Second content","disabled",true));
    String html=render("tabs","'tabs-one', 'Sections', ${items}, 'first'",Map.of("items",items));
    assertEquals(2,html.split("data-ui-part=\"trigger\"",-1).length-1);assertEquals(2,html.split("data-ui-part=\"panel\"",-1).length-1);assertTrue(html.contains("disabled=\"disabled\""));assertTrue(html.contains("Second content"));
    assertTrue(render("select","'choice', 'choice', 'Choose', ${items}, 'first'",Map.of("items",items)).contains("data-disabled=\"true\""));
  }
  @Test void tableRendersCollectionsAndEmptyState() {
    assertTrue(render("customer-table","${customers}",Map.of("customers",List.of())).contains("No customers yet"));
    String html=render("customer-table","${customers}",Map.of("customers",List.of(Map.of("name","<script>bad</script>","plan","Pro","mrr",42))));
    assertTrue(html.contains("Pro"));assertTrue(html.contains("42"));assertFalse(html.contains("<script>"));assertFalse(html.contains("No customers yet"));
  }
  @Test void conditionalDescriptionAndFragmentSlot() {
    String template="<main><section th:fragment=\"body\"><p th:text=\"${message}\">Body</p></section><div th:replace=\"~{colibri/thymeleaf/dialog :: dialog('edit','Edit','Profile',null,~{::body})}\"></div></main>";
    var context=new Context();context.setVariable("message","Bound content");String html=engine().process(template,context);
    assertTrue(html.contains("Bound content"));assertFalse(html.contains("data-ui-part=\"description\""));assertTrue(html.contains("<dialog"));
  }
  @Test void freemarkerMacrosLoadFromClasspathAndEscapeArguments() throws Exception {
    for(boolean htmlMode:List.of(false,true)) {
      var cfg=new Configuration(Configuration.VERSION_2_3_35);cfg.setClassLoaderForTemplateLoading(getClass().getClassLoader(),"templates");
      if(htmlMode)cfg.setOutputFormat(freemarker.core.HTMLOutputFormat.INSTANCE);
      var template=new Template("host",new StringReader("[#ftl][#import '/colibri/freemarker/ui.ftl' as ui][@ui.avatar fallback=name/][@ui.button disabled=true]Save[/@ui.button]"),cfg);
      var out=new StringWriter();template.process(Map.of("name","<script>bad</script>"),out);
      assertTrue(out.toString().contains("&lt;script&gt;"));assertFalse(out.toString().contains("<script>"));assertTrue(out.toString().contains("disabled"));
    }
  }
  @Test void freemarkerNumbersAreLocaleIndependent() throws Exception {
    // German formatting would turn 1500 into "1.500" and 12.5 into "12,5"; the browser controllers parse these values.
    var cfg=new Configuration(Configuration.VERSION_2_3_35);cfg.setClassLoaderForTemplateLoading(getClass().getClassLoader(),"templates");cfg.setLocale(Locale.GERMANY);
    var host="[#ftl output_format='HTML'][#import '/colibri/freemarker/ui.ftl' as ui]"
      +"[@ui.slider name='x' value=1500 max=5000/][@ui.progress value=12.5/][@ui.toaster max=1000/]"
      +"[@ui.chart columns=['m','v'] rows=[['Jan',1234.5]]/][@ui.input name='n' attrs={'tabindex':1500}/]"
      +"[@ui.queue pending=[{'id':'t-1','label':'a'},{'id':7,'label':'b'}]/]"
      +"[@ui.radioGroup name='r' options=[{'value':1,'label':'One'},{'value':2,'label':'Two'}] value=2/]"
      +"[@ui.radioGroup name='q' options=[{'value':1,'label':'One'}]/][@ui.calendar/]";
    var out=new StringWriter();new Template("host",new StringReader(host),cfg).process(Map.of(),out);String html=out.toString();
    assertTrue(html.contains("data-value=\"1500\""),html);assertTrue(html.contains("data-max=\"5000\""));
    assertEquals(1,html.split("data-ui-part=\"thumb\"",-1).length-1,"one value, one thumb");
    assertTrue(html.contains("data-value=\"12.5\""));assertTrue(html.contains("data-max=\"1000\""));assertTrue(html.contains("<td>1234.5</td>"));
    assertTrue(html.contains("tabindex=\"1500\""));assertTrue(html.contains("data-id=\"t-1\""));assertTrue(html.contains("data-id=\"7\""));
    assertTrue(html.contains("value=\"2\" checked"));assertFalse(html.contains("value=\"1\" checked"));
    assertFalse(html.contains("data-locale"),"calendar follows the page language unless a locale is passed");
    assertFalse(html.contains("1.500")||html.contains("12,5")||html.contains("1.234"),html);
  }
  @Test void fullFreeMarkerCatalogMatchesEngineRenderedFixture() throws Exception {
    var cfg=new Configuration(Configuration.VERSION_2_3_31);cfg.setTagSyntax(Configuration.SQUARE_BRACKET_TAG_SYNTAX);cfg.setDefaultEncoding("UTF-8");
    cfg.setTemplateLoader(new freemarker.cache.MultiTemplateLoader(new freemarker.cache.TemplateLoader[]{new freemarker.cache.ClassTemplateLoader(getClass(),"/templates/colibri/freemarker"),new freemarker.cache.FileTemplateLoader(new File("../../test/ftl"))}));
    var out=new StringWriter();cfg.getTemplate("demo.ftl").process(Map.of(),out);
    assertEquals(java.nio.file.Files.readString(java.nio.file.Path.of("../../test/ftl/rendered.html")),out.toString(),"Regenerate the fixture using test/ftl/Render.java when macros change");
    for(String file:List.of("ui-tabs.ftl","ui-dialog.ftl"))cfg.getTemplate(file);
  }

}

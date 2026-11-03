package ai.l3v.colibri;
import org.junit.jupiter.api.Test;
import org.thymeleaf.context.Context;
import freemarker.template.Configuration;
import freemarker.template.Template;
import java.io.*;
import java.nio.file.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
class ApplicationComponentsTest {
 static final Map<String,Map<String,Object>> MODELS=Map.ofEntries(Map.entry("shell",Map.ofEntries(Map.entry("brand","Northstar"),Map.entry("title","Overview"),Map.entry("description","Three projects are on track. One needs your review."),Map.entry("pages",List.of(Map.ofEntries(Map.entry("id","overview"),Map.entry("title","Overview"),Map.entry("description","Three projects are on track. One needs your review.")),Map.ofEntries(Map.entry("id","records"),Map.entry("title","Records"),Map.entry("description","Project Atlas · Active. Website refresh · In review. Mobile release · Planned.")))))),
Map.entry("metrics",Map.ofEntries(Map.entry("title","Key metrics"),Map.entry("items",List.of(Map.ofEntries(Map.entry("label","Revenue"),Map.entry("value","$48,250"),Map.entry("change","+12% from last month")),Map.ofEntries(Map.entry("label","Active customers"),Map.entry("value","1,240"),Map.entry("change","+84 this month")),Map.ofEntries(Map.entry("label","Churn"),Map.entry("value","2.4%"),Map.entry("change","−0.3 percentage points")))))),
Map.entry("table",Map.ofEntries(Map.entry("title","Customers"),Map.entry("description","Search and inspect customer records."),Map.entry("columns",List.of("Name","Plan","Revenue")),Map.entry("rows",List.of(Map.ofEntries(Map.entry("id","maya"),Map.entry("cells",List.of("Maya Chen","Pro","$240"))),Map.ofEntries(Map.entry("id","alex"),Map.entry("cells",List.of("Alex Rivera","Team","$1,100"))),Map.ofEntries(Map.entry("id","sam"),Map.entry("cells",List.of("Sam Patel","Starter","$79"))))))),
Map.entry("board",Map.ofEntries(Map.entry("title","Sales pipeline"),Map.entry("description","Select an opportunity to update its stage."),Map.entry("lanes",List.of(Map.ofEntries(Map.entry("id","new"),Map.entry("title","New"),Map.entry("deals",List.of(Map.ofEntries(Map.entry("id","atlas"),Map.entry("company","Atlas Studio"),Map.entry("value","$12,000"),Map.entry("owner","Maya Chen"))))),Map.ofEntries(Map.entry("id","proposal"),Map.entry("title","Proposal"),Map.entry("deals",List.of(Map.ofEntries(Map.entry("id","north"),Map.entry("company","North & Co"),Map.entry("value","$24,000"),Map.entry("owner","Alex Rivera"))))),Map.ofEntries(Map.entry("id","won"),Map.entry("title","Won"),Map.entry("deals",List.of())))))),
Map.entry("projects",Map.ofEntries(Map.entry("title","Projects"),Map.entry("description","Track current work."),Map.entry("projects",List.of(Map.ofEntries(Map.entry("id","atlas"),Map.entry("name","Project Atlas"),Map.entry("description","Customer portal launch · 8 tasks remaining"),Map.entry("progress",65),Map.entry("image","dashboards/assets/studio-office.jpg")),Map.ofEntries(Map.entry("id","mobile"),Map.entry("name","Mobile release"),Map.entry("description","Version 2.4 · QA in progress"),Map.entry("progress",85),Map.entry("image","dashboards/assets/meeting-space.jpg")))))),
Map.entry("planner",Map.ofEntries(Map.entry("title","Today’s agenda"),Map.entry("description","Monday, November 2"),Map.entry("events",List.of(Map.ofEntries(Map.entry("id","standup"),Map.entry("datetime","2026-11-02T09:00"),Map.entry("time","9:00 AM"),Map.entry("title","Product standup"),Map.entry("location","Meeting room A")),Map.ofEntries(Map.entry("id","review"),Map.entry("datetime","2026-11-02T14:00"),Map.entry("time","2:00 PM"),Map.entry("title","Design review"),Map.entry("location","Studio · 45 minutes")))))),
Map.entry("identity",Map.ofEntries(Map.entry("name","Jordan Lee"),Map.entry("role","Workspace administrator"),Map.entry("image","dashboards/assets/portraits.jpg"),Map.entry("details",List.of(Map.ofEntries(Map.entry("label","Email"),Map.entry("value","jordan@example.com")),Map.ofEntries(Map.entry("label","Team"),Map.entry("value","Product")))))),
Map.entry("products",Map.ofEntries(Map.entry("title","Products"),Map.entry("description","Create a sample order."),Map.entry("products",List.of(Map.ofEntries(Map.entry("id","desk"),Map.entry("name","Studio headphones"),Map.entry("price","$320"),Map.entry("amount",320),Map.entry("stock","12 available"),Map.entry("sprite","0"),Map.entry("image","dashboards/assets/products.jpg")),Map.ofEntries(Map.entry("id","chair"),Map.entry("name","Canvas daypack"),Map.entry("price","$180"),Map.entry("amount",180),Map.entry("stock","8 available"),Map.entry("sprite","1"),Map.entry("image","dashboards/assets/products.jpg")))))),
Map.entry("receipt",Map.ofEntries(Map.entry("title","Order #1048"),Map.entry("description","November 2 · Paid"),Map.entry("items",List.of(Map.ofEntries(Map.entry("label","Studio desk × 1"),Map.entry("amount","$320")),Map.ofEntries(Map.entry("label","Shipping"),Map.entry("amount","$20")))),Map.entry("total","$340"))),
Map.entry("form",Map.ofEntries(Map.entry("title","Edit profile"),Map.entry("action","#profile"),Map.entry("submitLabel","Save profile"),Map.entry("fields",List.of(Map.ofEntries(Map.entry("name","name"),Map.entry("label","Full name"),Map.entry("type","text"),Map.entry("value","Jordan Lee")),Map.ofEntries(Map.entry("name","email"),Map.entry("label","Email"),Map.entry("type","email"),Map.entry("value","jordan@example.com")))))),
Map.entry("photo",Map.ofEntries(Map.entry("eyebrow","Team workspace"),Map.entry("title","Meet your project team"),Map.entry("description","See the people working on your next release."),Map.entry("href","dashboards/workspace.html?view=members"),Map.entry("linkLabel","View team"),Map.entry("image","dashboards/assets/studio-office.jpg"),Map.entry("imageAlt","A bright shared workspace"))),
Map.entry("article",Map.ofEntries(Map.entry("title","Invite a teammate"),Map.entry("author","Jordan Lee · Updated November 2"),Map.entry("summary","Add people to your workspace and choose their access."),Map.entry("steps",List.of(Map.ofEntries(Map.entry("title","Open Members"),Map.entry("text","Choose Members from workspace settings.")),Map.ofEntries(Map.entry("title","Send an invitation"),Map.entry("text","Enter the email address and select a role.")))),Map.entry("href","dashboards/account.html?view=members"),Map.entry("linkLabel","Open member settings"))),
Map.entry("conversation",Map.ofEntries(Map.entry("tickets",List.of(Map.ofEntries(Map.entry("id","2081"),Map.entry("face","0"),Map.entry("image","dashboards/assets/portraits.jpg"),Map.entry("customer","Maya Chen"),Map.entry("title","Cannot invite a teammate"),Map.entry("status","Open"),Map.entry("message","Could you check our workspace member limit?")),Map.ofEntries(Map.entry("id","2080"),Map.entry("face","1"),Map.entry("image","dashboards/assets/portraits.jpg"),Map.entry("customer","Alex Rivera"),Map.entry("title","Update our invoice address"),Map.entry("status","Pending"),Map.entry("message","Please add 12 Market Street to invoice #1048.")))),Map.entry("selected",Map.ofEntries(Map.entry("assigned","Unassigned"),Map.entry("id","2081"),Map.entry("customer","Maya Chen"),Map.entry("title","Cannot invite a teammate"),Map.entry("status","Open"),Map.entry("message","Could you check our workspace member limit?"))),Map.entry("agents",List.of("Jordan Lee","Maya Chen")),Map.entry("statuses",List.of("Open","Pending","Resolved")))));
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
    var th=new TemplateTest().engine().process("<section th:replace=\"~{colibri/thymeleaf/application-"+key+" :: component(${model}"+(key.equals("shell")?", ~{}":"")+")}\"></section>",context);
    for(var html:List.of(out.toString(),th)) {
     assertTrue(html.contains("data-application-component=\""+key+"\""),key);
     assertFalse(html.contains("<img src=x>"),key);
     assertFalse(html.contains("th:block"),key);
     if(changed && field!=null)assertTrue(html.contains("Changed &lt;img src=x&gt;"),key);
    }
    if(!changed){Files.writeString(dir.resolve(key+"-freemarker.html"),out.toString());Files.writeString(dir.resolve(key+"-thymeleaf.html"),th);}
   }
  }
 }
}

package ai.l3v.colibri;
import org.junit.jupiter.api.Test;
import org.thymeleaf.context.Context;
import java.nio.file.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
class CatalogTest {
 @Test void everyPackagedFragmentHasARealBindingTest() throws Exception {
  var helper=new TemplateTest();var items=List.of(Map.of("value","one","label","First","text","First content","disabled",false,"href","/first"),Map.of("value","two","label","Second","text","Second content","disabled",false,"href","/second"));
  Map<String,Object> model=Map.of("items",items,"customers",List.of(Map.of("name","Customer","plan","Pro","mrr",42)));
  var cases=new LinkedHashMap<String,String>();
  cases.put("button","'Save', 'outline', false");cases.put("badge","'Active', 'secondary'");cases.put("accordion","'faq', ${items}, 'one'");cases.put("tabs","'tabs', 'Sections', ${items}, 'one'");cases.put("select","'select', 'choice', 'Choose', ${items}, 'one'");cases.put("combobox","'city', 'city', 'City', ${items}");cases.put("pagination","2, 10, 'Pages'");cases.put("spinner","'Saving', 'dots', 'sm'");cases.put("progress","75, 'Upload'");cases.put("checkbox","'remember', 'Remember', true, false");cases.put("switch","'notify', 'Notify', true");cases.put("input","'name', 'Name', 'Ada', true");cases.put("alert","'Saved', 'success'");cases.put("avatar","null, 'Name', 'AB'");cases.put("callout","'Notice', 'Message', 'warning'");cases.put("breadcrumb","${items}");cases.put("data-list","${items}");cases.put("dropdown-menu","'Actions', ${items}");cases.put("calendar","'calendar', '2026-11-02', 'en'");cases.put("kpi","'Revenue', 42, '+2%', true");cases.put("customer-table","${customers}");cases.put("chart-panel","'Traffic', '[1,2,3]'");
  for(var entry:cases.entrySet()){String result=helper.render(entry.getKey(),entry.getValue(),model);assertFalse(result.contains("th:"),entry.getKey());assertFalse(result.isBlank());}
  for(String name:List.of("dialog","card","collapsible")) {
   String args=name.equals("dialog")?"'dialog','Open','Title',null,~{::body}":name.equals("card")?"'Title',null,~{::body}":"'Details',~{::body}";
   var c=new Context();c.setVariable("text","Slot value");String result=helper.engine().process("<main><section th:fragment=\"body\" th:text=\"${text}\">Fallback</section><div th:replace=\"~{colibri/thymeleaf/"+name+" :: "+name+"("+args+")}\"></div></main>",c);assertTrue(result.contains("Slot value"));
  }
  var dir=Path.of("../../thymeleaf");try(var files=Files.list(dir)){assertEquals(cases.size()+4,files.filter(f->f.toString().endsWith(".html")).count(),"Every new fragment needs a binding test, including Spring field");}
  Files.createDirectories(Path.of("target/rendered"));Files.writeString(Path.of("target/rendered/thymeleaf.html"),helper.render("tabs",cases.get("tabs"),model)+helper.render("select",cases.get("select"),model));
 }
}

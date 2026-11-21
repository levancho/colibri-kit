package ai.l3v.colibri;

import freemarker.template.Configuration;
import freemarker.template.Template;
import org.junit.jupiter.api.Test;
import org.thymeleaf.context.Context;
import java.io.*;
import java.nio.file.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class GridTest {
    private Map<String,Object> col(String key, String label, String type) {
        return Map.of("field",key,"label",label,"type",type,"editable",true,"width",150);
    }
    @Test void renderBothIntegrations() throws Exception {
        Path source=Path.of("../../site/src/grid/integrations");
        var columns=List.of(col("project","Project","text"),col("owner","Owner","text"),col("budget","Budget","number"),col("approved","Approved","boolean"));
        var rows=List.of(Map.of("id","atlas","project","Atlas <search>","owner","Maya Reed","budget",7200,"approved",true),
                         Map.of("id","relay","project","Relay console","owner","Jon West","budget",4800,"approved",false),
                         Map.of("id","beacon","project","Beacon maps","owner","Ada Bell","budget",6500,"approved",true));
        var model=Map.<String,Object>of("rows",rows,"columns",columns);
        var cfg=new Configuration(Configuration.VERSION_2_3_35);
        cfg.setClassLoaderForTemplateLoading(getClass().getClassLoader(),"templates");
        var out=new StringWriter();
        new Template("example.ftl", Files.readString(source.resolve("freemarker-usage.ftl")),cfg).process(model,out);
        var context=new Context();context.setVariables(model);
        var thymeleaf=new TemplateTest().engine().process(Files.readString(source.resolve("thymeleaf-usage.html")),context);
        for(var pair:Map.of("freemarker",out.toString(),"thymeleaf",thymeleaf).entrySet()){
            var html=pair.getValue();assertTrue(html.contains("Atlas &lt;search&gt;"));assertTrue(html.contains("data-key=\"beacon\""));
            assertTrue(html.contains("data-type=\"number\""));assertTrue(html.contains("<td>7200</td>"));assertFalse(html.contains("th:replace"));
            Path generated=Path.of("target/rendered");Files.createDirectories(generated);Files.writeString(generated.resolve("rendered-"+pair.getKey()+".html"),html);
        }
        var sample=new StringWriter();new Template("sample","[#ftl][#import '/colibri/freemarker/grid-sample.ftl' as grid][@grid.sample id='stage' story='custom-cells'/]",cfg).process(Map.of(),sample);
        assertTrue(sample.toString().contains("data-grid-story=\"custom-cells\""));
    }
}

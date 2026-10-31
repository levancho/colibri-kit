import freemarker.template.*; import java.io.*; import java.util.*;
// Render: javac -cp freemarker.jar -d /tmp/ftlc Render.java && java -cp /tmp/ftlc:freemarker.jar Render ../../freemarker . > rendered.html
public class Render { public static void main(String[] a) throws Exception {
  Configuration c = new Configuration(Configuration.VERSION_2_3_31);
  c.setTemplateLoader(new freemarker.cache.MultiTemplateLoader(new freemarker.cache.TemplateLoader[]{ new freemarker.cache.FileTemplateLoader(new File(a[0])), new freemarker.cache.FileTemplateLoader(new File(a[1])) }));
  c.setTagSyntax(Configuration.SQUARE_BRACKET_TAG_SYNTAX); c.setDefaultEncoding("UTF-8");
  Writer w = new OutputStreamWriter(System.out, "UTF-8"); c.getTemplate("demo.ftl").process(new HashMap<>(), w); w.flush(); } }

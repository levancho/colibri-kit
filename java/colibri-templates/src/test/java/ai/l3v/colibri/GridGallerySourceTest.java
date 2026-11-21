package ai.l3v.colibri;

import freemarker.template.Configuration;
import freemarker.template.Template;
import java.io.StringWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.thymeleaf.context.Context;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GridGallerySourceTest {
    // The browser check supplies the exact text copied from each framework tab.
    @Test
    @EnabledIfSystemProperty(named = "grid.sample.fixtures", matches = ".+")
    void renderCopiedGalleryTemplates() throws Exception {
        var directory = Path.of(System.getProperty("grid.sample.fixtures"));
        var cfg = new Configuration(Configuration.VERSION_2_3_35);
        cfg.setClassLoaderForTemplateLoading(getClass().getClassLoader(), "templates");
        var thymeleaf = new TemplateTest().engine();
        try (var files = Files.list(directory)) {
            for (var file : files.filter(p -> p.toString().endsWith(".ftl")).toList()) {
                var story = file.getFileName().toString().replaceFirst("\\.ftl$", "");
                var output = new StringWriter();
                new Template(story, Files.readString(file), cfg).process(Map.of(), output);
                var html = thymeleaf.process(Files.readString(directory.resolve(story + ".th")), new Context());
                for (var result : Map.of("ftl", output.toString(), "thymeleaf", html).entrySet()) {
                    assertTrue(result.getValue().contains("data-grid-story=\"" + story + "\""), story);
                    Files.writeString(directory.resolve(story + "." + result.getKey() + ".html"), result.getValue());
                }
            }
        }
    }
}

package ai.l3v.colibri;
import org.junit.jupiter.api.Test;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.support.StaticWebApplicationContext;
import org.springframework.mock.web.MockServletContext;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.spring6.view.ThymeleafViewResolver;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.junit.jupiter.api.Assertions.*;
class SpringFormTest {
 public static class Profile {private String email;public String getEmail(){return email;}public void setEmail(String value){email=value;}}
 @Controller public static class ProfileController {
  @GetMapping("/profile") public String get(Model model){var p=new Profile();p.setEmail("initial@example.com");model.addAttribute("profile",p);return "profile";}
  @PostMapping("/profile") public String post(@ModelAttribute("profile") Profile profile,BindingResult result){if(profile.getEmail()==null || !profile.getEmail().contains("@"))result.rejectValue("email","invalid","Enter a valid email");return "profile";}
 }
 @Test void springBindsSubmittedValuesAndRendersFieldErrors() throws Exception {
  var app=new StaticWebApplicationContext();app.setServletContext(new MockServletContext());app.refresh();
  var resolver=new ClassLoaderTemplateResolver();resolver.setSuffix(".html");resolver.setCheckExistence(true);resolver.setOrder(1);
  var fragments=new ClassLoaderTemplateResolver();fragments.setPrefix("templates/");fragments.setSuffix(".html");fragments.setOrder(2);
  var engine=new SpringTemplateEngine();engine.addTemplateResolver(resolver);engine.addTemplateResolver(fragments);
  var views=new ThymeleafViewResolver();views.setTemplateEngine(engine);
  var mvc=MockMvcBuilders.standaloneSetup(new ProfileController()).setViewResolvers(views).build();
  String initial=mvc.perform(get("/profile")).andReturn().getResponse().getContentAsString();
  assertTrue(initial.contains("name=\"email\""),initial);assertTrue(initial.contains("initial@example.com"),initial);assertTrue(initial.contains("for=\"email\""),initial);
  String invalid=mvc.perform(post("/profile").param("email","<bad>")).andReturn().getResponse().getContentAsString();
  assertTrue(invalid.contains("Enter a valid email"),invalid);assertTrue(invalid.contains("&lt;bad&gt;"),invalid);assertTrue(invalid.contains("data-invalid"),invalid);assertTrue(invalid.contains("aria-invalid=\"true\""),invalid);
  String valid=mvc.perform(post("/profile").param("email","changed@example.com")).andReturn().getResponse().getContentAsString();
  assertTrue(valid.contains("changed@example.com"));assertFalse(valid.contains("Enter a valid email"));assertFalse(valid.contains("data-invalid"));app.close();
 }
}

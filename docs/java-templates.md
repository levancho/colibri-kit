# Java template integration

Colibri supplies UI markup, not a template engine. FreeMarker and Thymeleaf execute in your Java server; Colibri CSS and JavaScript execute in the browser. A script tag or the npm package cannot install either Java engine.

## What ships

- `freemarker/`: Colibri macros, including `ui.ftl` and standalone dialog/tabs imports.
- `thymeleaf/`: native, parameterized fragments for common controls, collections, overlays and dashboard blocks; `spring-field.html` binds to a Spring form object and its validation errors.
- `java/colibri-templates/`: a Maven resource JAR that packages both under `templates/colibri/`. It does not embed or shade third-party engines, and does not select an engine for your application.

The Thymeleaf tab shows a real fragment when one is supplied. Other examples show native HTML directly and are explicitly labeled as such. This is not a custom Thymeleaf dialect or a claim that every gallery composition has a typed Java helper.

## Install the template resources

The templates are published on Maven Central. Add the dependency to your application:

```xml
<dependency>
  <groupId>ai.l3v.colibri</groupId>
  <artifactId>colibri-templates</artifactId>
  <version>0.1.0</version>
</dependency>
```

Gradle: `implementation("ai.l3v.colibri:colibri-templates:0.1.0")`.

The artifact holds the FreeMarker macros and Thymeleaf fragments under `templates/colibri/` and no Java classes, so
it brings no transitive dependencies; your application supplies the template engine. To use an unreleased revision,
build and install it from a checkout with `mvn -f java/colibri-templates/pom.xml clean install`.

Alternatively, copy `freemarker/` and/or `thymeleaf/` into `src/main/resources/templates/colibri/`. The template package includes no Java classes; extra processors are unnecessary for native fragments.

## Add the actual engine

For an existing Spring Boot application, use its dependency-management version and choose the starter you need:

```xml
<!-- FreeMarker application -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-freemarker</artifactId>
</dependency>
<!-- OR: Thymeleaf application -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
```

Maven downloads the engine and its dependencies through the starter. Colibri does not bundle them inside its JAR. Outside Spring Boot, declare `org.freemarker:freemarker:2.3.35` or `org.thymeleaf:thymeleaf:3.1.5.RELEASE` and configure a classpath template resolver rooted at `templates/`. The Spring form fragment additionally requires the matching Thymeleaf/Spring integration; the tests use `thymeleaf-spring6` with Spring MVC 6.2.11. Do not substitute these test versions for your application's managed Spring stack.

## FreeMarker

Save the host view as `.ftlh` with Spring Boot's default suffix, or configure the suffix if your project uses `.ftl`. **The host template must produce HTML output**: use `.ftlh`, or keep `output_format="HTML"` in its `[#ftl]` header. The macros always escape their own parameters, but anything you write inside a macro body (`[@ui.button]${label}[/@ui.button]`) is evaluated by the host, and a host without an HTML output format emits it unescaped. The header selects the square-bracket syntax used by the macros:

```ftl
[#ftl output_format="HTML"]
[#import "/colibri/freemarker/ui.ftl" as ui]
[@ui.avatar fallback=initials/]
[@ui.button disabled=saving]${buttonLabel}[/@ui.button]
```

The controller supplies `initials`, `saving` and `buttonLabel`. HTML auto-escaping stays enabled. String values are text, including strings that happen to contain HTML. For developer-authored component content, use nested macro bodies or captured markup:

```ftl
[#assign details]<p>${description}</p>[/#assign]
[@ui.accordion items=[{"value":"details", "title":"Details", "content":details}]/]
```

Do not disable escaping or mark user-provided strings as trusted HTML. Attribute names, element names, component names and the skeleton `w`/`h` sizes are template-author configuration, not request values.

**URLs are escaped, not vetted.** Parameters that become `href`, `src` or a form `action` (links in `menu`, `breadcrumb`, `item`, `sidebarItem` and `citation`; `avatar` and `imageInput` sources; `authForm` and application-form actions) are HTML-escaped, which stops markup injection but lets a `javascript:` URL through. Build these from your application's routes, or validate the scheme before passing a user-supplied URL. The same applies to the Thymeleaf fragments.

**Numbers are written for the browser, not the reader.** Numeric arguments and attribute values are emitted with `?c` (`1500`, `12.5`) in every locale, because the controllers parse them. Format numbers for display yourself and pass them as strings.

Minimum engine versions: FreeMarker 2.3.25 (the macros use `[#list map as key, value]`); Thymeleaf 3.x.

## Thymeleaf

The controller supplies model values; the native root element defines the fragment. For a button:

```html
<button th:replace="~{colibri/thymeleaf/button :: button(${buttonLabel}, 'outline', ${saving})}"></button>
```

Collections such as tabs take `items` containing `value`, `label`, `text` and `disabled`. Values are rendered with `th:text`; rows use `th:each`; optional content uses `th:if`. The `card`, `dialog` and `collapsible` fragments accept a developer-authored fragment slot for structured content. Dynamic URLs must come from your application's trusted routing/URL policy.

For Spring MVC forms:

```html
<form th:object="${profile}" th:action="@{/profile}" method="post">
  <div th:replace="~{colibri/thymeleaf/spring-field :: field('email', 'Email', 'email')}"></div>
  <button type="submit">Save</button>
</form>
```

The controller supplies a form bean named `profile`. On submission, keep its `BindingResult` immediately after the form argument, validate server-side and return the same view for errors. The fragment uses `th:field` and `th:errors`; it preserves rejected values, labels and invalid-state attributes. Field paths are developer-authored constants. Authentication, authorization, CSRF protection and persistence remain part of the host application's normal Spring configuration.

## Browser assets

Serve `src/` and `themes/` from your application's static resources as `/ui/src/` and `/ui/themes/`. Link `themes/colibri.css`, add `class="ui-root"` to the app root and load `/ui/src/core/auto.js` as a module. If using Colibri CSS tokens too, serve `packages/colibri-css/dist/` as `/css/` and include its CSS and bridge. The template JAR does not bundle these browser assets.

## Checks

`npm run test:java` executes actual template rendering and Spring MVC binding tests, then builds the resource JAR. Tests check changing model values, escaping, list/empty states, fragment slots, FreeMarker classpath imports with HTML auto-escaping, and valid/invalid form submissions. Browser tests separately check the resulting Colibri interactions. Parse success alone is not the integration contract.

References: [FreeMarker configuration](https://freemarker.apache.org/docs/pgui_quickstart_createconfiguration.html), [Thymeleaf Spring integration](https://www.thymeleaf.org/doc/tutorials/3.1/thymeleafspring.html).

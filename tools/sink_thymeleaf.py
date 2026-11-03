"""Use maintained native fragments, never manufacture support by wrapping demo HTML."""
from pathlib import Path
from sink_pretty import pretty
ROOT = Path(__file__).resolve().parents[1]
ARGS = {
 'button': "${buttonLabel}, 'outline', ${saving}",
 'badge': "${statusLabel}, 'secondary'",
 'card': "${title}, ${description}, ~{::cardBody}",
 'dialog': "'edit-profile', 'Edit profile', ${title}, ${description}, ~{::dialogBody}",
 'accordion': "'faq', ${items}, 'first'",
 'tabs': "'sections', 'Sections', ${items}, 'first'",
 'select': "'language', 'language', 'Language', ${options}, ${selected}",
 'combobox': "'city', 'city', 'Choose a city', ${options}",
 'pagination': "${page}, ${totalPages}, 'Pages'",
 'spinner': "'Saving', 'dots', 'sm'",
 'progress': "${progress}, 'Upload progress'",
 'checkbox': "'remember', 'Remember me', ${remember}, false",
 'switch': "'notifications', 'Notifications', ${notifications}",
 'input': "'name', 'Name', ${name}, true",
 'alert': "${message}, 'success'",
 'avatar': "${avatarUrl}, ${displayName}, ${initials}",
 'callout': "${title}, ${message}, 'warning'",
 'breadcrumb': "${breadcrumbs}",
 'data-list': "${details}",
 'dropdown-menu': "'Actions', ${actions}",
 'collapsible': "'Details', ~{::detailsBody}",
 'calendar': "'published', ${published}, 'en'",
 'kpi': "'Revenue', ${revenue}, ${delta}, ${up}",
 'customer-table': "${customers}",
 'chart-panel': "'Weekly sessions', ${chartValuesJson}",
}

def render(markup, name='component'):
    if name == 'field':
        return '''<!-- Spring MVC: controller supplies a form bean named profile and BindingResult. -->
<form xmlns:th="http://www.thymeleaf.org" th:object="${profile}" th:action="@{/profile}" method="post">
  <div th:replace="~{colibri/thymeleaf/spring-field :: field('email', 'Email', 'email')}"></div>
  <button type="submit" class="btn">Save</button>
</form>

<!-- Reusable field supplied in colibri-templates.jar: -->
''' + (ROOT / 'thymeleaf/spring-field.html').read_text()
    if name not in ARGS:
        return ('<!-- Static HTML example; a parameterized Thymeleaf fragment is not supplied.\n'
                'Use the markup directly, or author a fragment for your application model.\n'
                'Load Colibri CSS and core/auto.js in the page layout. -->\n' + markup)
    source=(ROOT / f'thymeleaf/{name}.html').read_text().strip()
    fragment=name.replace('-','_')
    use=f'<div th:replace="~{{colibri/thymeleaf/{name} :: {fragment}({ARGS[name]})}}"></div>'
    slots={'dialog':'dialogBody','card':'cardBody','collapsible':'detailsBody'}
    if name in slots:
        use=f'<section th:fragment="{slots[name]}"><p th:text="${{bodyText}}">Content</p></section>\n'+use
    return (f'<!-- Application template: values come from the controller model.\n'
            f'Install colibri-templates.jar or copy thymeleaf/ into templates/colibri/thymeleaf/. -->\n'
            + use + '\n\n<!-- Library fragment (already supplied; shown for reference): -->\n' + pretty(source))

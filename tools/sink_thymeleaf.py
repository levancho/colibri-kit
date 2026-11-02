"""Native Thymeleaf fragment examples; reuse the same Colibri HTML and controllers."""
import re

def render(markup, name='component'):
    name = re.sub(r'[^a-zA-Z0-9_]', '_', name)
    return ('<!-- Save in templates/fragments/colibri.html. -->\n'
            f'<th:block xmlns:th="http://www.thymeleaf.org" th:fragment="{name}">\n'
            + '\n'.join('  ' + line for line in markup.splitlines())
            + '\n</th:block>\n\n<!-- Include from a Thymeleaf template:\n'
            f'<th:block th:replace="~{{fragments/colibri :: {name}}}"></th:block>\n'
            'Load Colibri CSS and core/auto.js in your page layout.\n-->')

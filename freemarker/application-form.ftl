[#ftl output_format="HTML" auto_esc=true]
[#macro component model]
<form class="app-form" data-app-form="profile" method="post" action="${model.action}" data-application-component="form"><h3>${model.title}</h3>[#list model.fields as field]<label>${field.label}<input name="${field.name}" type="${field.type}" value="${field.value}" required maxlength="100"></label>[/#list]<button class="btn" type="submit">${model.submitLabel}</button><p role="status"></p></form>
[/#macro]

[#ftl output_format="HTML" auto_esc=true]
[#macro component model]
<section class="identity-card" data-application-component="identity"><span class="portrait portrait-large" data-face="3"><img src="${model.image}" alt="${model.name}" width="320" height="180" loading="lazy"></span><h3>${model.name}</h3><p>${model.role}</p><dl>[#list model.details as detail]<div><dt>${detail.label}</dt><dd>${detail.value}</dd></div>[/#list]</dl><button class="btn" type="button" data-app-action="edit-profile">Edit profile</button></section>
[/#macro]

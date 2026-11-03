[#ftl output_format="HTML" auto_esc=true]
[#macro component model]
<section class="workspace-lead" data-application-component="photo"><div class="workspace-story"><span class="eyebrow">${model.eyebrow}</span><h2>${model.title}</h2><p>${model.description}</p><a class="btn" href="${model.href}">${model.linkLabel}</a></div><img src="${model.image}" alt="${model.imageAlt}" width="320" height="180" loading="lazy"></section>
[/#macro]

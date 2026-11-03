[#ftl output_format="HTML" auto_esc=true]
[#macro component model]
<section data-application-component="projects"><header><h3>${model.title}</h3><p>${model.description}</p></header><div class="project-grid">[#list model.projects as project]<article class="project-card"><img src="${project.image}" alt="${project.name}" width="320" height="180" loading="lazy"><div class="project-body"><h3>${project.name}</h3><p>${project.description}</p><label>Progress<progress max="100" value="${project.progress}">${project.progress}</progress></label><button class="btn" type="button" data-app-action="view-project" data-id="${project.id}">View project</button></div></article>[/#list]</div></section>
[/#macro]

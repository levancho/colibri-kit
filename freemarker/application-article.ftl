[#ftl output_format="HTML" auto_esc=true]
[#macro component model]
<article class="app-card" data-application-component="article"><h2>${model.title}</h2><p class="article-byline">${model.author}</p><p>${model.summary}</p><ol class="article-steps">[#list model.steps as step]<li><h3>${step.title}</h3><p>${step.text}</p></li>[/#list]</ol><a href="${model.href}">${model.linkLabel}</a></article>
[/#macro]

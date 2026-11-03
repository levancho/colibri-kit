[#ftl output_format="HTML" auto_esc=true]
[#macro component model]
<section class="app-card" data-application-component="board"><header><h3>${model.title}</h3><p>${model.description}</p></header><div class="pipeline">[#list model.lanes as lane]<section class="lane"><h4>${lane.title}</h4>[#list lane.deals as deal]<button class="deal" type="button" data-app-action="edit-deal" data-id="${deal.id}"><strong>${deal.company}</strong><p>${deal.value}</p><small>${deal.owner}</small></button>[/#list]</section>[/#list]</div></section>
[/#macro]

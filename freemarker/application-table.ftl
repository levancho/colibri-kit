[#ftl output_format="HTML" auto_esc=true]
[#macro component model]
<section class="app-card" data-application-component="table"><header><h3>${model.title}</h3><p>${model.description}</p></header><label>Search records<input type="search" data-app-filter="" aria-label="Search records"></label><div class="app-table-wrap"><table class="app-table"><caption>${model.title}</caption><thead><tr>[#list model.columns as column]<th scope="col">${column}</th>[/#list]<th scope="col">Actions</th></tr></thead><tbody>[#list model.rows as row]<tr data-record-id="${row.id}">[#list row.cells as cell]<td>${cell}</td>[/#list]<td><button class="btn" type="button" data-app-action="view-record" data-id="${row.id}">View record</button></td></tr>[/#list]</tbody></table></div></section>
[/#macro]

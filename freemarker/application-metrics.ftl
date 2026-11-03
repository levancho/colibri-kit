[#ftl output_format="HTML" auto_esc=true]
[#macro component model]
<section class="kpis" aria-label="${model.title}" data-application-component="metrics">[#list model.items as item]<article class="card kpi"><small>${item.label}</small><b>${item.value}</b><p>${item.change}</p></article>[/#list]</section>
[/#macro]

[#ftl output_format="HTML" auto_esc=true]
[#macro component model]
<section class="sales-receipt" data-application-component="receipt"><header><h3>${model.title}</h3><p>${model.description}</p></header><dl>[#list model.items as item]<div><dt>${item.label}</dt><dd>${item.amount}</dd></div>[/#list]</dl><p>Total: <strong>${model.total}</strong></p><button class="btn" type="button" data-app-action="download-receipt">Download receipt</button></section>
[/#macro]

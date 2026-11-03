[#ftl output_format="HTML" auto_esc=true]
[#macro component model]
<section class="workspace-day" data-application-component="planner"><header><h3>${model.title}</h3><p>${model.description}</p></header><div class="agenda-list">[#list model.events as event]<article class="agenda-item"><time datetime="${event.datetime}">${event.time}</time><div><h4>${event.title}</h4><p>${event.location}</p><button class="btn" type="button" data-app-action="view-event" data-id="${event.id}">View event</button></div></article>[/#list]</div></section>
[/#macro]

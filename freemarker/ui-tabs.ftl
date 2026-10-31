[#ftl]
[#-- Colibri UI (@colibri/ui) Tabs for FreeMarker. Emits the data-* contract only; no classes, no styling.
     Usage:
       [#import "ui/ui-tabs.ftl" as ui]
       [@ui.tabs id="settings" default="general" tabs=[{"value":"general","label":"General"},{"value":"seo","label":"SEO"}]]
         [@ui.panel value="general"]...[/@ui.panel]
         [@ui.panel value="seo"]...[/@ui.panel]
       [/@ui.tabs]
     Extra attributes (class=..., any CSS framework or none) pass through via attrs={"class":"..."}.
--]
[#macro tabs tabs id="" default="" orientation="horizontal" activation="auto" attrs={}]
<div data-ui="tabs"[#if id?has_content] id="${id}"[/#if][#if default?has_content] data-default-value="${default}"[/#if] data-orientation="${orientation}" data-activation="${activation}"[#list attrs as k,v] ${k}="${v}"[/#list]>
  <div data-ui-part="list">
  [#list tabs as t]
    <button type="button" data-ui-part="trigger" data-value="${t.value}"[#if (t.disabled!false)] disabled[/#if]>${t.label}</button>
  [/#list]
  </div>
  [#nested]
</div>
[/#macro]

[#macro panel value attrs={}]
<div data-ui-part="panel" data-value="${value}"[#list attrs as k,v] ${k}="${v}"[/#list]>[#nested]</div>
[/#macro]

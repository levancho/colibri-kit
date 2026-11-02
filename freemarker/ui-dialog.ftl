[#ftl output_format="HTML" auto_esc=true]
[#-- Colibri UI (@colibri-kit/ui) Dialog for FreeMarker. Markup contract only; no classes, no styling.
     Usage:
       [#import "ui/ui-dialog.ftl" as ui]
       [@ui.dialog id="confirm-delete" title="Delete article?" description="This cannot be undone." trigger="Delete"]
         <button data-ui-part="close" data-ui-return="cancel">Cancel</button>
         <button data-ui-part="close" data-ui-return="ok" autofocus>Delete</button>
       [/@ui.dialog]
     Listen: el.addEventListener("ui:close", e => e.detail.returnValue === "ok" && ...)
--]
[#macro dialog id="" title="" description="" trigger="" modal=true dismissible=true attrs={} contentAttrs={}]
<div data-ui="dialog"[#if id?has_content] id="${id}"[/#if] data-modal="${modal?c}" data-dismissible="${dismissible?c}"[#list attrs as k,v] ${k}="${v}"[/#list]>
  [#if trigger?has_content]<button type="button" data-ui-part="trigger">${trigger}</button>[/#if]
  <dialog data-ui-part="content"[#list contentAttrs as k,v] ${k}="${v}"[/#list]>
    [#if title?has_content]<h2 data-ui-part="title">${title}</h2>[/#if]
    [#if description?has_content]<p data-ui-part="description">${description}</p>[/#if]
    [#nested]
  </dialog>
</div>
[/#macro]

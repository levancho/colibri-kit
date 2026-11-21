[#ftl output_format="HTML" auto_esc=true]
[#macro grid id columns rows label="Project register"]
<table id="${id}" data-colibri-grid>
  <caption>${label}</caption>
  <thead><tr>[#list columns as col]
    <th scope="col" data-field="${col.field}" data-type="${col.type!'text'}"
        data-editable="${(col.editable!false)?c}" data-width="${(col.width!150)?c}">${col.label}</th>
  [/#list]</tr></thead>
  <tbody>[#list rows as row]
    <tr data-key="${row.id}">[#list columns as col]
      <td>[#if row[col.field]??][#assign v=row[col.field]][#if v?is_number || v?is_boolean]${v?c}[#else]${v}[/#if][/#if]</td>
    [/#list]</tr>
  [/#list]</tbody>
</table>
[/#macro]

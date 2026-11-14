[#ftl output_format="HTML" auto_esc=true]
[#macro chartPanel id title rows labels ranges=[7,14,30] defaultRange=30 description=""]
<section class="card panel chart-box" data-application-chart aria-labelledby="${id}-title">
  <header><div><h3 id="${id}-title">${title}</h3>[#if description?has_content]<p>${description}</p>[/#if]</div>
    <div class="seg" role="group" aria-label="Range" data-target="${id}">
      [#list ranges as n]<button type="button" data-n="${n?c}" aria-pressed="${(n == defaultRange)?c}">${n?c}d</button>[/#list]
    </div>
  </header>
  <div id="${id}" data-chart="area" aria-label="${title}"></div>
  <p role="status" aria-live="polite"></p>
  <details class="chart-data"><summary>View chart data</summary>
    <table class="data"><caption>${title}</caption>
      <thead><tr><th scope="col">Day</th>[#list labels as label]<th scope="col">${label}</th>[/#list]</tr></thead>
      <tbody>[#list rows as row]<tr><th scope="row">${row.label}</th>[#list row.values as value]<td>${value?c}</td>[/#list]</tr>[/#list]</tbody>
    </table>
  </details>
  <ul class="legend">[#list labels as label]<li>${label}</li>[/#list]</ul>
</section>
[/#macro]

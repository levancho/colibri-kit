// Every HTML example uses the same mount function as the preview above it.
export function showSource(id) {
  const format = document.getElementById('format'),
    code = document.getElementById('code'),
    copy = document.getElementById('copy-source');
  function draw() {
    if (format.value === 'react') {
      location.href = '../integrations/#react-source';
      return;
    }
    const host = {
      html: '<section id="stage" aria-label="Grid sample"></section>',
      freemarker:
        '[#import "/colibri/freemarker/grid-sample.ftl" as grid]\n[@grid.sample id="stage" story="' + id + '" /]',
      thymeleaf:
        "<section th:replace=\"~{colibri/thymeleaf/grid-sample :: grid_sample('stage', '" +
        id +
        '\')}"></section>',
    }[format.value];
    const kit =
      location.pathname.startsWith('/grid/') && document.querySelector('link[href="/ui/themes/colibri.css"]');
    const theme = kit ? '/ui/themes/colibri.css' : '/colibri-ui.css';
    code.textContent =
      (format.value === 'freemarker' ? '[#ftl output_format="HTML" auto_esc=true]\n' : '') +
      '<!doctype html>\n<html lang="en"' +
      (format.value === 'thymeleaf' ? ' xmlns:th="http://www.thymeleaf.org"' : '') +
      '>\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width,initial-scale=1">\n  <link rel="stylesheet" href="' +
      theme +
      '">\n  <link rel="stylesheet" href="/grid/grid.css">\n  <link rel="stylesheet" href="/grid/samples/gallery.css">\n</head>\n<body class="ui-root">\n' +
      host +
      '\n<script src="/grid/grid.js"></script>\n<script type="module">\n  import { mountSample } from "/grid/samples/sample.js";\n  const host = document.getElementById("stage");\n  const dispose = mountSample(host, ' +
      (format.value === 'html' ? JSON.stringify(id) : 'host.dataset.gridStory') +
      ');\n</script>\n</body>\n</html>';
    copy.textContent = 'Copy source';
  }
  format.onchange = draw;
  copy.onclick = async () => {
    try {
      await navigator.clipboard.writeText(code.textContent);
      copy.textContent = 'Copied';
    } catch {
      copy.textContent = 'Select the code to copy';
    }
  };
  draw();
}

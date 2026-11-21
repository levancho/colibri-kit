[#ftl output_format="HTML" auto_esc=true]
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Project register</title>
  <link rel="stylesheet" href="/ui/themes/colibri.css">
  <link rel="stylesheet" href="../grid.css">
</head>
<body class="ui-root">
[#import "/colibri/freemarker/grid.ftl" as grids]
[@grids.grid id="projects" columns=columns rows=rows label="Project register" /]
<script src="../grid.js"></script>
<script type="module">
  import { enhanceGrid } from './enhance.js';
  enhanceGrid(document.getElementById('projects'));
</script>
</body>
</html>

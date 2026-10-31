# Colibri Kit theme packs

Three complete looks that restyle **both** Colibri CSS (`--c-*`) and Colibri UI (`--ui-*`) from one attribute.

| Theme | Feel | Primary | Radius | Scheme |
|---|---|---|---|---|
| `glacier` | cool, neutral, professional (slate + teal) | teal | 6px | light & dark |
| `ember` | warm, bold, friendly (terracotta + amber on cream) | burnt orange | 16px | light & dark |
| `midnight` | dark-first, electric (ink navy + violet, mint glow) | violet | 12px | dark only |

```html
<link rel="stylesheet" href="themes/colibri.css">          <!-- Colibri UI default -->
<link rel="stylesheet" href="css/colibri.css">             <!-- Colibri CSS (optional) -->
<link rel="stylesheet" href="themes/packs/index.css">      <!-- or a single pack -->
<html data-kit-theme="ember" data-theme="light">
```

Remove the attribute to get the default Colibri look. Packs are plain token overrides — scope them to any subtree by copying the selector, and override single tokens after them as usual.

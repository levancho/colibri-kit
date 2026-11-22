// Explicit highlighting keeps file changes and copying independent of DOM observation.
import Prism from 'prismjs';
import 'prismjs/components/prism-jsx.js';
Prism.manual = true;
Prism.languages.colibriFtl = Prism.languages.extend('markup', {});
Prism.languages.insertBefore('colibriFtl', 'tag', {
  'ftl-comment': { pattern: /\[#--[\s\S]*?--\]/, greedy: true, alias: 'comment' },
  'ftl-directive': {
    pattern: /\[\/?[#@](?:[^\]"']|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')*\]/, greedy: true,
    inside: { keyword: /^\[\/?[#@][\w.]+/, string: /"[^"]*"|'[^']*'/, punctuation: /\/?\]$/ },
  },
  interpolation: { pattern: /\$\{[^}]*\}/, alias: 'variable' },
});
export function highlight(source, language) {
  const grammar = Prism.languages[language];
  return Prism.highlight(source, grammar, language);
}

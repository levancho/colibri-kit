export function configureSearchAsFilter(c) {
  const term = c.input('Search records', 'search', '', () => {}, { placeholder: 'Project, owner or team' });
  c.listen(term, 'input', () => c.filter(term.value));
}

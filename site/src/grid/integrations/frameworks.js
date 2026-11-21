// Preserve bookmarks to the former framework page.
const target = new URL('../samples/', location.href);
target.search = location.search;
if (location.hash.startsWith('#react')) target.searchParams.set('source', 'react');
else target.hash = location.hash;
location.replace(target.href);

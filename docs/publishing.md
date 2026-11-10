# Publishing to npm

Two packages are published from this repository, always at the same version:

| Package | Directory | Contents |
|---|---|---|
| `@colibri-kit/css` | `packages/colibri-css` | the stylesheet, the prefixed build, the bridge, application components |
| `@colibri-kit/ui` | repository root | controllers, custom elements, React adapter, themes, minified and lazy bundles, CLI, MCP server, templates |

## One-time setup

1. Create the `colibri-kit` organisation on npmjs.com (the `@colibri-kit` scope). Scoped names are free for public packages.
2. Create a granular npm access token with read and write access limited to the `@colibri-kit` scope, with a short expiry.
3. Add it to this repository as the secret `NPM_TOKEN` (Settings → Secrets and variables → Actions).

## Releasing

1. Set the same `version` in `package.json` and `packages/colibri-css/package.json`.
2. Run the checks and regenerate committed outputs:

```sh
npm test
npm run build
npm run check:architecture
npm run test:consumer
```

3. Commit, then publish a GitHub release whose tag is `v<version>` (for example `v0.1.0`). The **Publish to npm**
   workflow tests, rebuilds, verifies that committed generated files match, checks the tag against both versions and
   publishes both packages with provenance.

To rehearse without publishing, run the workflow manually with **dry_run** left on. To publish by hand instead:

```sh
(cd packages/colibri-css && npm publish --access public)
npm publish --access public
```

A published version cannot be replaced. If something is wrong, fix it and release the next patch version.

## After the first release

Consumers can then install from the registry instead of a checkout:

```sh
npm install @colibri-kit/ui @colibri-kit/css
npx -p @colibri-kit/ui colibri init --starter
```

Always name the package with `npx -p`: the unscoped names `colibri` and `colibri-ui` on npm belong to unrelated projects.

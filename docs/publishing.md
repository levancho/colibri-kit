# Publishing to npm

Two packages are published from this repository, always at the same version:

| Package | Directory | Contents |
|---|---|---|
| `@colibri-kit/css` | `packages/colibri-css` | the stylesheet, the prefixed build, the bridge, application components |
| `@colibri-kit/ui` | repository root | controllers, custom elements, React adapter, themes, minified and lazy bundles, CLI, MCP server, templates |

## One-time setup

1. Create the `colibri-kit` organisation on npmjs.com (the `@colibri-kit` scope). Scoped names are free for public packages.
2. Create a granular npm access token with read and write access limited to the `@colibri-kit` scope, with a short expiry. Do not enable "Bypass two-factor authentication": staged publishing does not need it. The account must have 2FA enabled.
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

To rehearse without publishing, run the workflow manually with **dry_run** left on.

### Publishing by hand (how 0.1.0 was released)

npm is retiring tokens that bypass two-factor authentication. The supported manual route is staged publishing:
a token without bypass uploads the version, and a maintainer approves it with 2FA. It needs npm 11.21 or newer
(`npx -y npm@11.21.2 …` works on Node 22.9+).

```sh
(cd packages/colibri-css && npm stage publish --access public)
npm stage publish --access public
```

Each command prints a stage id. The maintainer then signs in and approves both, stylesheet package first:

```sh
npm login
npm stage approve <stage-id>
```

`npm stage list <package>` shows what is waiting. A staged version reserves its version number, so reject it
(`npm stage reject <stage-id>`) before staging the same version again.

A published version cannot be replaced. If something is wrong, fix it and release the next patch version.

## After each release

The version number appears in pinned CDN links in `README.md`-adjacent guides: `docs/getting-started.md`, `site/src/getting-started.html` and the homepage snippet in `site/src/index.html`. Update them to the new version, then run `npm run build`.

Always name the package with `npx -p`: the unscoped names `colibri` and `colibri-ui` on npm belong to unrelated projects.

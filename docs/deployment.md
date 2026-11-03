# Site deployment

The public site is the existing Cloudflare Worker `colibri-kit-site` on `colibri.l3v.ai`. Its configuration is `site/wrangler.jsonc`; its static assets are built into `site/dist`.

## Deploy on merge

The Library checks workflow can deploy every push to `main` (including merged pull requests), only after all unit/browser checks and generated-file checks pass. Pull requests and other branches run checks without receiving deployment credentials.

The deploy job downloads the exact site artifact from its successful test job and uploads it with Wrangler. It serializes production deployments and verifies the release manifest and public application assets afterward. Do not configure a separate Cloudflare automatic build for the same branch unless this workflow's deploy job is removed, to avoid competing deploys.

One-time setup before merging the deployment workflow:

1. Create a Cloudflare API token using Cloudflare's Workers deployment guidance, scoped to the account hosting this Worker and the `l3v.ai` zone as required. Do not use a global API key or copy a local OAuth refresh token into CI.
2. In this GitHub repository, open Settings → Secrets and variables → Actions and add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repository secrets.
3. Merge the workflow PR. Check the `test` and `deploy` jobs in Actions and verify the site.

Missing credentials fail the deploy job with a clear setup message. The workflow requires both deployment secrets to be configured. Secret values are held by GitHub Actions; they are not stored in this repository.

Official setup: https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/

## Manual deployment

From a clean, tested checkout:

```sh
npm ci --ignore-scripts
npm run build
npm test
npm run test:e2e
npx wrangler@4.156.0 deployments list --config site/wrangler.jsonc
npx wrangler@4.156.0 deploy --config site/wrangler.jsonc
```

Record the preceding version before deploying. If live checks fail, inspect deployment history and roll back using Cloudflare's version history rather than changing unrelated routes or services.

## Artifact identity and verification

The site build writes `release.json`, containing SHA-256 hashes of generated files and an aggregate release identity. CI deploys the tested artifact and then runs `node tools/site-manifest.mjs verify site/dist https://colibri.l3v.ai/`. Verification checks the release identity and hashes of application routes, dashboard JavaScript, public core/React modules, CSS and the Java supplement. This command only verifies; it does not deploy. A stale module is a failure even when a stylesheet matches.

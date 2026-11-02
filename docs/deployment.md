# Site deployment

The public site is the existing Cloudflare Worker `colibri-kit-site` on `colibri.l3v.ai`. Its configuration is `site/wrangler.jsonc`; its static assets are built into `site/dist`.

## Deploy on merge

The Library checks workflow can deploy every push to `main` (including merged pull requests), only after all unit/browser checks and generated-file checks pass. Pull requests and other branches run checks without receiving deployment credentials.

The deploy job downloads the exact site artifact from its successful test job and uploads it with Wrangler. It serializes production deployments and compares the public stylesheet to the tested artifact afterward. Do not configure a separate Cloudflare automatic build for the same branch unless this workflow's deploy job is removed, to avoid competing deploys.

One-time setup before merging the deployment workflow:

1. Create a Cloudflare API token using Cloudflare's Workers deployment guidance, scoped to the account hosting this Worker and the `l3v.ai` zone as required. Do not use a global API key or copy a local OAuth refresh token into CI.
2. In this GitHub repository, open Settings → Secrets and variables → Actions and add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repository secrets.
3. Merge the workflow PR. Check the `test` and `deploy` jobs in Actions and verify the site.

Missing credentials fail the deploy job with a clear setup message. The repository currently has no Cloudflare deployment secrets; adding the workflow alone does not enable successful deployment. This requires a one-time credential setup.

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

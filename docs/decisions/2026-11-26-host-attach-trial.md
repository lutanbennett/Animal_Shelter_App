# Host attach trial (#hstau) — IN PROGRESS

Measurement only; no feature built. Status at this commit:

## Established
- No API attach path exists in the codebase (step zero: no `workers/domains` call in `scripts/` or `src/lib/`).
- The **test deploy token** (`CLOUDFLARE_API_TOKEN` in `.env.deploy.test`) verifies `active`, sees one account,
  reads the `lannacare.org` zone, and **can list** `GET /accounts/{account}/workers/domains`.
- Custom domains read back from the API before the trial (lannacare.org only):
  `test.lannacare.org` → `lanna-animal-care-test`; `uat.lannacare.org` → `lanna-animal-care-uat`.
- `.env.deploy.uat` snag, read from code: `CLOUDFLARE_WORKERS_DOMAIN_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are
  **not in the runtime-secret registry** (`scripts/lib/runtime-config.mjs`), so `deploy.mjs --secrets` never
  pushes them. It pushes with `wrangler secret bulk`, which is additive and deletes nothing, so the UAT
  secrets are **not lost** at a `--secrets` deploy — but nothing in the repo knows they exist, and a fresh
  Worker would never get them. Fix: register both as optional secrets.

## Not yet established
- Whether the test token may **write** (`PUT /accounts/{account}/workers/domains`) — the attach was refused
  by this session's auto-mode permission classifier before it reached Cloudflare.
- The deciding question: does `deploy.mjs --env test` remove an API-attached domain absent from `wrangler.jsonc`.

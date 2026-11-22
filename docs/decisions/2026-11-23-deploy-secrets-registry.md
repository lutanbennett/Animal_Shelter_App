# Every name classified per machine; a `--secrets` plan that explains itself (#83137)

**2026-11-23, stream `deploy-secrets-registry`.** The measurement (which of seven dev-resolving
secrets was a fault) was done 2026-11-22 by the planner with Lutan; it found one, `DRIVE_CREDENTIALS_KEY`,
since fixed by giving each environment its own. This is the stream-sized half.

## What the registry now asserts

- `scripts/lib/runtime-config.mjs` classifies **every** name for **both** machines (`classify`,
  `CLASSIFICATION`): secret-required, secret-optional, build-var, wrangler-var, own-module or not-here,
  each with a one-clause reason. `WORKER_NOT_PUSHED` and `PI_NOT_APPLICABLE` list what each machine
  never gets, and why. The existing `PI_REQUIRED` / `PI_OPTIONAL` / `PI_FORBIDDEN` / `PI_WRANGLER_VARS`
  stay derived from the same rows, so no list can disagree with another.
- `scripts/check-runtime-config.mjs` (part of `npm run lint`) now also fails when a Worker file reads
  `env.X` for an `X` that is in neither the registry, `wrangler.jsonc`, nor `WORKER_DEFAULTED_KNOBS`
  (five tuning knobs the code defaults when unset). Proved by adding a throwaway read: it failed, naming
  the file and the name. **Its limit:** it reads `worker/*.mjs`; a Next.js route reading `process.env.X`
  is not covered. It cannot see which names a Worker actually holds (a secret cannot be read back).

## What `--secrets` does now

- The plan prints one line for every registry name: `push NAME <- source (why)` or `skip NAME (reason)`.
- `--allow-dev-fallthrough` no longer covers everything. It covers **only** the three `GOOGLE_OAUTH_*`
  values, recorded as stated and deliberate while Drive runs on the dev account (`#rqv5c` ends it, and
  that step is not this stream's). Any other name that would resolve to `.env.local` on UAT or
  production is refused **even with the flag**, so the flag is no longer a standing temptation.
- Test is not guarded and still pushes dev values, correctly: test **is** dev.

## Per environment, read from key names only (values never read; the worktree holds no `.env.deploy.*`)

- **production:** refused without the flag; with it, still refused while `.env.local` holds
  `GOOGLE_CONNECT_CLIENT_ID` / `_SECRET` and `.env.deploy.production` does not (production's Worker holds
  neither, so a push would give it dev's). Add them to the production file, or the push stays impossible.
  The three `GOOGLE_OAUTH_*` would resolve to dev, deliberate.
- **uat:** `.env.deploy.uat` has the client id and secret but not `GOOGLE_OAUTH_REFRESH_TOKEN`, so only
  that one deliberate name falls through; allowed with the flag.
- **test:** unguarded; pushes dev values.

Not run against production or UAT (no files here, no deploys by brief). Re-run
`node scripts/deploy.mjs --env <env> --secrets --plan` from the main checkout to see the real plan.

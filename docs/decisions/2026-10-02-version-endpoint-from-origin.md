# 2026-10-02 — `/api/version`, answered by the app so the Pi can be asked what it runs

**Context.** `/api/releases/current` is answered by `worker/index.mjs` before the
origin is consulted (only the Worker has the mail binding), so nothing could ask
what the Pi — the copy that serves users — is running. `apply-migrations.mjs`
had to *assume* the newest cut release was live (#287), and the `0.11.0` record
could state its version only by quoting a pasted terminal (#279).

**Decision.** `GET /api/version` (`src/app/api/version/route.ts`) returns
`{ "version", "sha" }`: `package.json`'s version and `git rev-parse HEAD`, both
stamped into the build by `next.config.ts` (`BUILD_VERSION`, `BUILD_SHA`).

- **Path.** Not under `/api/releases/`, which the Worker swallows. Any other
  path falls through to the Pi. Which copy answered is the existing
  `x-lanna-served-by` header, so the body carries no such field.
- **Public, deliberately.** On `PUBLIC_PATHS` *and* `LOCKED_PUBLIC_PATHS`
  (`src/lib/public-paths.ts`, which `src/proxy.ts` reads): uat and test are
  locked behind sign-in and are exactly where a deploy check asks. Exact path
  only; `/api/versionx` still redirects. It is not on the Worker's cached
  page list.
- **Not cached.** The edge cache only holds `isPublicPage()` paths, which this
  is not, and the route sends `cache-control: no-store`. A ten-minute-stale
  version would be wrong in precisely the minutes after a deploy.
- **Omitted on purpose.** `BUILD_MIGRATIONS` is the schema history and tells a
  stranger which migrations exist; nothing needs it (the database's
  `schema_migrations` is the source for that). No paths, env values or
  dependencies either. The commit and version are already public in the
  repository's own history and in `/releases`.

**Callers.** `apply-migrations.mjs` now asks `SITE_ORIGINS[env]/api/version`
(`liveRelease` in `scripts/lib/migration-consumers.mjs`) and compares consumers
against that exact commit. If it cannot ask — unreachable, an older build with
no route yet, a commit this checkout lacks — it falls back to the old
assumption and says so in its output. `SITE_ORIGINS` moved to `scripts/lib/env.mjs`
so both scripts share it.

**`deploy.mjs` is unchanged, on purpose.** Its `liveVersion()` reads
`/api/releases/current` to learn the version *the Worker* will announce and to
wait for a new Worker to take over before it mails admins; that is a question
about the Worker, and the Worker is the right one to answer it. Whether
`deploy-pi.sh` should wait on `/api/version` after its restart is a separate
change.

**Limit.** A build older than this PR has no route, so the first check after
deploying this still falls back to the assumption.

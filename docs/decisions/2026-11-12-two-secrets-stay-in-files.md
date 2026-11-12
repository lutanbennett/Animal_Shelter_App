# The service-role key and the database password stay in files (`#52y56`, the "why they stay" arm)

Decided in the brief for the `env-readers-and-decision` stream, 2026-11-12. **Key NAMES only; no value appears
here (the repo is public).** Nothing was moved, rotated or edited: no `.env*` or `.dev.vars` file was written.
Follows `2026-11-11-worktree-env-narrowing.md`, which did the narrowing half.

## In one sentence for Lutan

The shelter's database master key lives in text files on this PC, on the Pi and in the Cloudflare Worker, and
the running website itself reads it; anyone who can open those files on this PC or the Pi can read it, and
moving it without a plan already locked every session out once.

## Readers inventory

"Script" = run by a person or session, reads through `loadEnv()` (`scripts/lib/env.mjs`). "Server" = the running
Next app on the Pi, or the Worker, configured by its environment at start-up. Opened at the call sites, not `grep -l`.

### `SUPABASE_SERVICE_ROLE_KEY`

| Reader | Class |
|---|---|
| `src/lib/supabase/admin.ts:11` (`createAdminClient`, `process.env`) | **Server** (Pi and Worker; every admin-client caller) |
| `src/app/api/status/alerts/route.ts:21` (also the bearer it compares against) | **Server** |
| `src/app/api/calendar/sweep/route.ts:20` | **Server** |
| `worker/index.mjs:216, 235` (calls to Supabase) | **Server** (Worker) |
| `worker/heartbeat.mjs:16-21`, `worker/translations.mjs:76-77, 133`, `worker/release-mail.mjs:53-54` | **Server** (Worker scheduled jobs) |
| `scripts/deploy.mjs:378` (announces a release) | Script |
| `scripts/lib/deploy-schema.mjs:63` | Script |
| `scripts/bootstrap-admin.mjs:49`, `dev-signin.mjs:43`, `dev-adopter-signin.mjs:18`, `draft-label-thai.mjs:99`, `resend-calendar-reasons.mjs:19`, `prove-website-approval.mjs:21`, `prove-translations-propose.mjs:40-44`, `pi/drill-probe.mjs:87` | Script |
| `scripts/check-planner-preflight.mjs:41-56` | Script (the reachability instrument) |
| `scripts/check-*.mjs` that build a service client: access-requests-card:40, assistant-refused-client:27, contact-address-fields:41, chip-scan:41, map-markers:21, map-details:36, maintenance-bills-page:27, page-guards-live:29, home-screens-live:33, offsite-chip:37, facility-map-editor:55, donate-buttons:37, medical-jobs-app:34, place-order-roles:38, resident-id-search:31, phone-width:249, public-views:38, residents-sort:26, residents-select-all:35, residents-export:36, resident-sections:68, residents-status-chips:36, security-role-picker:48, two-step-session:40, who-does-what-page:37, user-theme:37, upcoming-visits-page:29 | Script |
| `scripts/lib/runtime-config.mjs:35` (`where: "both"`, `required: true`) | Declaration: says it must reach the Worker and the Pi |
| `scripts/worktree.mjs:60, 68` | Script (copies it into worktrees; required) |
| `.github/workflows/ci.yml:68` (`placeholder`), `:420` (`TEST_SUPABASE_SERVICE_ROLE_KEY`, public-views job) | CI: a placeholder, and a test-project secret |
| Tests/fixtures with fake values (`worker/*.test.mjs`, `check-release-guards`, `check-translate-worker`, `secret-sources.test.mjs`) | Not readers of the real value |

**It has both classes of reader**, and the server class is core: no admin client, alert feed, calendar sweep or
Worker job works without it.

### `SUPABASE_DB_PASSWORD` and `SUPABASE_DB_URL` (the URL embeds the password)

| Reader | Class |
|---|---|
| `scripts/backup.mjs:89, 292-298` (`loadEnv`) | Script, **but also run on the Pi** by the weekly backup (`runtime-config.mjs:57` says `SUPABASE_DB_URL` is set on the Pi "so the backup never needs the Management API token") |
| `scripts/restore-grants.mjs:51, 168-182` (`loadEnv`, or `PGPASSWORD`) | Script |
| `scripts/pi/check-no-forbidden.mjs:36` | Message only |
| `scripts/lib/runtime-config.mjs:57-58` (`where: "tools"`) | Declaration |

**These two have NO reader in `src/` or `worker/`**: they are script-only. The only reason a move is not simply
conceivable is the Pi backup, which is a script that runs on a machine whose env file is its only configuration.

### `SUPABASE_ACCESS_TOKEN` (for comparison; not part of this decision)

`runtime-config.mjs:56` (item quoted `:55`; moved by one line). `where: "tools"`, `neverOnPi: true`: scripts only,
which is why `#ubejc` found it a drop-in, and why that experience says nothing about the service-role key.

## Precedence as the code implements it

`scripts/lib/env.mjs`: `loadEnv(name)` calls `mergeLayers(base, overlay, process.env)` (`:89-93, 103`):
`{ ...base(.env.local), ...overlay(.env.deploy.<env>), ...shell }`, then for `ACCOUNT_KEYS`
(`SUPABASE_ACCESS_TOKEN` only, `:86`) a **non-empty overlay value beats the shell**. `test` has no overlay.
So **shell beats file for the service-role key and the database password**; the account-key exception does not
cover them.

**How established:** read, then run with invented decoys (a throwaway script in the scratchpad calling
`mergeLayers` with fake strings; no real value touched):

| Case | Picked |
|---|---|
| decoy in shell, overlay and base | shell |
| decoy in overlay and base, none in shell | overlay |
| shell holds an empty string | the empty string (an empty shell value still beats a good file) |
| access token in shell and overlay | overlay (the account-key rule) |
| access token in shell and base only | shell |

**What a script does when the shell's copy is the dead one:** it uses the dead one. There is no fallback to the
file and no warning; `loadEnv` does not compare layers. The server is different: the Pi/Worker read their own
`process.env` set at start-up and never see `loadEnv`. `loadLayers()` (`:70`) exists to say where each value
came from, but no reader of these two keys calls it.

**This fits the 2026-11-04 outage without proving it.** Both failures were REST reads sending the service-role
key; a stale or damaged value in the shell layer would be used silently. It is still **not proven**.

## Why they stay in files

- The service-role key is read by the **running server** on the Pi and in the Worker (`admin.ts`, the two API
  routes, the Worker jobs). An env file (Pi) and a Worker secret are how those processes are configured, so moving it is
  a **deployment change**, not a one-line edit like the access token was.
- Rotating it must change the Pi, the Worker and every env file at the same moment. That is the expensive half
  and is out of scope.
- The database password has only script readers, but one of them runs on the Pi (weekly backup), so a PC-only
  environment variable would not reach it either.
- **"The secrets are off the Pi" is not true in general.** Only the account-wide access token is.

## Three explanations that are dead (do not revive)

1. *"a long-running process does not see a Windows USER variable created after it started"*: it outlived a restart
   and new sessions.
2. *"a session cannot see Windows USER variables at all"*: measured false, a session's process has all eight.
3. *"the environment held a stale token"*: Lutan tested them as correct when he put them in.

Leading, unproven hypothesis: the edit rewrote eight `.env.local` files and damaged them (`SUPABASE_ACCESS_TOKEN`
is not a JWT, so "JWT could not be decoded" points at the service-role key).

## What compensates

- `2026-11-11-worktree-env-narrowing.md`: `new` copies only the `ENV_KEEP` keys (11 of 14), and stops if one of the
  four `ENV_REQUIRED` keys is missing from the main checkout.
- `node scripts/check-planner-preflight.mjs` is the "can this session reach each core key" instrument. Run in this
  stream: all four core keys present and both dev probes (REST with the service-role key, Management API) answered ok.
  Production not probed (not read here).
- The env files are gitignored and never committed (the repo is public); `.env.example` holds names only.
- The Pi keeps its own secrets file (`2026-10-22-pi-keeps-its-own-secrets-file.md`) and `neverOnPi` keeps the
  account token off it; `2026-10-12-service-role-fence.md` limits who may build an admin client.

**Not fixed by the narrowing:** the service-role key is still copied into every new worktree (it is core), and
`.dev.vars` is copied unchanged.

## Verified in this worktree (created after the narrowing)

`.env.local` holds 11 key names, all in `ENV_KEEP`; `.dev.vars` holds 5, all in `ENV_KEEP`. The decision file's
"11 of 14" is correct. The two "not established → kept" groups (`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`; the two
`GOOGLE_CALENDAR_*`) are **still not established** and stay kept: no evidence found that `gates.mjs` build or a
clinic-visit stream cannot reach them.

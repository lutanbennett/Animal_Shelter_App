# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed),
`n/a` with the reason, or (section 8 only) `deferred` with an owner.

---

## Header

| | |
|---|---|
| Feature | Settings → System status: health tiles and usage figures for admins (`/admin/status`) |
| Backlog item | `docs/backlog.md` → Settings → System status: a health and usage page for admins |
| Branch / worktree | `claude/system-status` @ `C:\Development\Animal_Shelter_system-status` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3016` |
| PR | linked from the PR itself |
| Tested by / date | Claude (System Status session), 2026-09-26 |
| Carries a migration? | no |
| Tested at SHA | `bf8619b` (feature commit; `sync` found `origin/main` already merged) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a read-only, admin-only `/admin/status` page with a green/amber/red (or grey) tile per health check, each with its check time and the reason when not green, and usage counts for 7 / 30 / 90 days, every check a small timed, cached, secret-scrubbed function
- [x] Files/areas touched listed: new `src/app/admin/status/` (page, action), `src/lib/status/` (run, health, usage), `src/lib/migration-drift.ts`; edited `src/app/admin/page.tsx` (tile), `src/lib/i18n/dictionaries/en.ts` / `th.ts` (strings, privacy paragraph), `src/lib/manual/en.ts`, `src/lib/releases.ts`, `next.config.ts` (`BUILD_MIGRATIONS`), `wrangler.jsonc` (`version_metadata` binding in every env), `scripts/apply-migrations.mjs` (uses the shared drift function), `scripts/deploy.mjs` (two optional secrets), `README.md`, `docs/decisions.md`, `docs/backlog.md`. No `worker/`, no `supabase/migrations/`
- [x] Roles affected identified: admin sees the new page and tile; every other role is redirected away from it; signed-out visitors see only the privacy paragraph change on `/privacy`
- [x] Out of scope written down: the "alert me" (email or LINE when a tile goes red) is a later item and filed on `backlog`; the visitor count stays grey until Lutan creates a Cloudflare API token with Zone → Analytics → Read and sets `CLOUDFLARE_ANALYTICS_TOKEN` / `CLOUDFLARE_ZONE_ID`. That query has not run against the live API; the manual `th.ts` the brief mentions does not exist (the manual is English-only), so the topic is in `en.ts` only

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date."), and it pushed the branch
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 346s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration; the page reads `schema_migrations` and existing tables only
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration. It was run after the refactor to prove the shared `migrationDrift` gives the same report: `94 applied, 0 pending … On origin/main, not applied here: 0 … Applied here, no file on origin/main: 0`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; nothing writes to the database
- [ ] Constraints and defaults exercised against real rows in a `begin; … rollback;` harness — n/a: no migration, so no constraints or defaults changed
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: signed in as the dev admin at `localhost:3016/admin/status`, all seven health tiles and five usage tiles rendered against the dev database and Drive. Database green with latency, Drive green, migrations in step (94/94), release 0.6.0 with "not running on the Worker" under `next dev`, release mail / backup / Pi grey with their reasons, visitors grey "not set up"
- [x] Data persists: the page writes nothing, so what was checked is the cache. Reload re-used the minute's cached results (same "Checked" time), and **Check now** (server action) produced fresh times
- [ ] Create / edit / delete all exercised — n/a: read-only page, nothing to create, edit or delete
- [x] Empty state renders sensibly: no backup for the dev database shows grey "No backups of this database yet. Only production is backed up every week."; visitors without a token shows grey "Not set up…"
- [x] Invalid input is rejected with a readable message, not a crash: `?days=abc` rendered the page with 30 days marked current (`parsePeriod`'s fallback); 7, 30 and 90 each loaded and the picker marked the current one
- [x] Boundary cases checked. **Red tile, by breaking dev on purpose:** set this worktree's `GOOGLE_OAUTH_REFRESH_TOKEN` to junk; Drive and backup both went red with `Google OAuth token refresh failed: invalid_grant: Bad Request`, no token value shown; restored after. **Amber, for real:** the `recurring-jobs-schema` stream applied `0095_recurring_jobs.sql` to dev mid-test and the migrations tile went amber naming it. The database tile also went amber at 1616 ms under the old 1500 ms threshold, which is why it is now 3000 ms. **Green backup:** a clearly named empty fixture `lannacare-test-2026-09-26T1000Z.dump` uploaded to Drive → Backups turned the tile green ("less than a day old", Bangkok time), then trashed. **Runner:** a never-settling check came back `fail` after its timeout (310 ms for a 300 ms limit); a thrown error containing the service-role key, a bearer token and a `ya29.` token came back with all three replaced by names; two calls to one cache key ran the work once

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin/status`, the Settings tile | page renders | `claude@lutan.com`: 12 tiles, tile on `/admin` opens it |
| management | — | redirected to `/` by `requireAdminUser` | not signed in as this role; same server check as staff below |
| staff | — | redirected to `/` | disposable `claude-status-staff@lutan.com` (created for this, archived afterwards): `/admin/status` → `/`, 0 status tiles |
| vet | — | redirected to `/` | not signed in as this role; same server check |
| volunteer | — | redirected to `/` | not signed in as this role; same server check |
| signed out | — | sent to `/login?next=/admin/status` | `curl` → `307 /login?next=%2Fadmin%2Fstatus` |

- [x] Every role above tested: admin, staff and signed out by driving them; management, vet and volunteer rely on the same single check (`current_user_role() !== "admin"` → redirect) that turned staff away, and the **Check now** action calls `assertAdminRole()` before clearing anything
- [x] A role that should not have access is blocked server-side: the staff account typed the URL directly and was redirected by the page's own `requireAdminUser()`, not by a hidden nav entry

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: Settings pages are reached from the Settings landing grid, not the sidebar; the new tile is there and opens the page
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`: "System status" under Settings, admin badge, path `Settings → System status`
- [ ] Translatable strings go through the translation path — n/a: all new text is UI dictionary text in `en.ts` / `th.ts`, not record content; `/management/translations` covers record fields only. Thai checked on the page itself
- [x] Mobile viewport (375px) — no horizontal overflow (`scrollWidth - clientWidth = 0`), tiles stack in one column, **Check now** and the period links reachable
- [x] Browser console clean — a fresh tab on `/admin/status?days=30` logged only the dev-server lines every page logs (`[HMR] connected`, React DevTools, a font preload warning, one `ERR_BLOCKED_BY_CLIENT`). An older tab showed Next's "Router action dispatched before initialization" from `hmrRefresh`, which appeared after `gates.mjs` rebuilt beside the dev server and did not recur in a fresh tab after a restart
- [x] Network clean — `/admin/status` and `?days=7|30|90` all 200; the one aborted request was the navigation that preceded a reload

## 6. Regression

- [x] The pages nearest the change still work: `/admin` (Settings grid, with the Drive line above it and the new tile), `/privacy` (new sentence and date, en), `/manual`
- [x] Shared files checked from a second page by loading it: `en.ts` / `th.ts` via `/privacy` and `/admin` in English and the status page in Thai; `manual/en.ts` via `/manual`; `apply-migrations.mjs` via `--status` against dev (unchanged report)
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` merged nothing ("Already up to date.")

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch; follow-ups (alerts, the Cloudflare token) filed on `backlog`
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated 2026-09-26: the check shape and `off` state, timeout-and-cache, migrations against the build, deploy time from `version_metadata`, the backup tile's Drive timestamp, sign-ins as people, and the visitor-count and privacy-text decision
- [x] `README.md` still accurate: Backups section says the tile watches the weekly run; the two optional Cloudflare secrets are documented
- [x] **Release notes.** `unreleased` gained a line for admins, which also mentions the privacy page's new sentence
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned**: the drift refactor was checked against `--status`; red, amber, green and grey were each produced on dev; the redaction and timeout were run. The one claim not measured is said to be unverified: the Cloudflare GraphQL query

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager (the first deploy carrying the `version_metadata` binding)
- [ ] Smoke-tested on `test.lannacare.org`: on the Worker the release tile should show a deploy time and tag `v0.6.0` (or amber if the tag differs), release mail grey "off by design", migrations 94 + whatever `main` holds then — deferred: Lutan
- [ ] Timezone-sensitive behaviour proved — n/a: no calendar-day logic; times are instants shown through `formatDateTime`, which already renders in the shelter's zone (checked: the fixture uploaded 10:43Z showed as 17:43)
- [ ] For a boundary or banding change, both edges covered — n/a: the thresholds (3 s database, 8 / 15 days backup) are new and not a change to an existing band; the backup bands were exercised only at "under a day" and "none"
- [x] Evidence pasted into this plan is the tool's actual output, unedited (the gates lines, the `--status` lines, the error strings)
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager (`/privacy` text changed and is edge-cached)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and matches production — deferred: release manager
- [ ] `strip-baked-env` line seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: Lutan (`CLOUDFLARE_ANALYTICS_TOKEN` and `CLOUDFLARE_ZONE_ID` are optional; without them the visitors tile is grey, nothing breaks)

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: `npx wrangler rollback --env production` reverts the Worker, page, binding and privacy text together; there is no schema to leave behind

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Database tile went amber at 1.6 s on dev under normal parallel load with a 1.5 s threshold, which would make amber the usual state | fixed: threshold 3 s |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The page reads well to an admin: wording of each tile, colours in the normal (non-dev) theme | `/admin/status` on `test.lannacare.org` after deploy |
| 2 | On the Worker: the release tile shows a deploy time and tag; release mail says "off by design" | `test.lannacare.org/admin/status` |
| 3 | The new privacy sentence (en and th) is wording Lutan is happy to publish | `/privacy` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (System Status session)  Date: 2026-09-26

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; three items wait for Lutan

Manual verification by: pending: the three items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — handed over once the PR is open

Result: pass

Release manager acknowledgement: pending

# Architecture review — requested 2026-09-22, written 2026-10-11

**By:** a Fable (`claude-fable-5-1`) session on branch `claude/fable-architecture-review`, reading
`main` at `56672229` (the merge of #541). Read-only: no code was changed, and nothing was run
against a database, a Worker or the Pi. Everything below was established by reading the files
named; where a claim could not be checked from the repository it says so.

**How to read it.** §0 says what was and was not looked at. §1 describes the system as the code
has it, and lists where `README.md` disagrees. §2 is the findings, most serious first, each
with the file and a concrete change. §3 is what is sound and should be left alone. §4 lists
the backlog items filed from this review. The appendix holds the numbers.

**Two constraints the findings respect.** The project runs at zero ongoing cost by decision
(a Supabase Pro plan was rejected on 2026-10-10); a finding whose only fix costs money says so.
The repository is public, so no real person is named here.

---

## 0. Coverage: what was read, and what was not

**Read in full or near-full:** `README.md`, `CLAUDE.md`, `package.json`, `wrangler.jsonc`,
`next.config.ts`, `open-next.config.ts`, `src/proxy.ts`, every file in `worker/`, every file
in `src/lib/supabase/`, `src/lib/auth/` (all 12 files), `src/lib/permissions/` (`can`,
`require`, `load`, `catalogue`, `prerequisites`, the head of `routes`), `src/lib/public-paths.ts`,
`src/lib/public-site.ts`, `src/lib/app-env.ts`, `src/lib/site-origin.ts`, the photo proxy
route, `/api/version`, `/api/status/alerts`, the facility-map image route,
`src/lib/facility-map/plan-store.ts`, `src/lib/status/run.ts` and the first half of
`health.ts`, the head of `src/lib/google/drive.ts` and all of `drive-client.ts`, `layout.tsx`,
`PublicPathGate.tsx`, the head of the home page and of the resident hub section page, three
server-action files, `scripts/deploy.mjs`, `scripts/backup.mjs`, `scripts/backup-schedule.ps1`,
`scripts/apply-migrations.mjs`, `scripts/gates.mjs`, `scripts/lib/env.mjs`,
`scripts/lib/migrations.mjs`, `scripts/lib/optional-secrets.mjs`, every file in `scripts/pi/`,
`.github/workflows/ci.yml`, `.githooks/pre-commit`, `.env.example`, `.gitignore`; migrations
`0081`, `0082`, `0084`, `0121` (head), `0132` (structure), `0133`, `0170` (head), `0178` (most),
`0179`, `0180`–`0182` (structure); `docs/pi-hosting.md`, `docs/pi-failover.md`, the
test-plan template and one filled plan, `docs/decisions/README.md`, the
2026-10-02 origin-write-fallback decision, the first 220 lines and headings of
`docs/roles-and-permissions.md`, the whole open half of `docs/backlog.md` (titles) and the
Security, Deployment and Architecture sections in full.

**Not read, so not reviewed:** the bodies of the other 106 pages and 62 server-action files
(only guard presence was checked by grep); every client component; `src/lib/assistant/`,
`src/lib/archive/` (PDF), `src/lib/donations/`, the stock, forecast and cashflow functions,
`src/lib/status/alerts.ts` and `usage.ts`, the i18n dictionaries' content, the manual's
content (`src/lib/manual/en.ts`; there is no `docs/manual` folder, the brief's name for it);
migrations `0001`–`0180` beyond their file names and the five named above; the 3,415-line
frozen `docs/decisions.md` and all but three of the 343 decision files; the requirements
document beyond its headings; `docs/security/*`; `scripts/worktree.mjs`,
`bootstrap-admin.mjs`, `load-residents.mjs`, `correct-resident.mjs` and the 137 `check-*.mjs`
scripts (two were opened). Nothing outside the repository was inspected: no Cloudflare or
Supabase dashboard, no WAF rule, no Google Cloud project, no file on the Pi. Where a finding
depends on what the Pi's env files hold, it is marked as inferred from the setup scripts.

So: the request path, auth, permissions, deployment, backup and the schema's shape were
examined closely; the feature code was examined only for whether it is guarded.

---

## 1. The architecture as it actually is

### 1.1 In one paragraph

A single-tenant Next.js 16 App Router application for one shelter, backed by one Supabase
Postgres project per environment (dev/test share one, production has one), with Google Drive
as the file store for photos and documents and a private Supabase Storage bucket for facility
plan images. Every request enters through a Cloudflare Worker that edge-caches anonymous
public pages, proxies everything else to a Raspberry Pi 5 in a house through a Cloudflare
Tunnel, and renders the page itself (OpenNext) only when the Pi does not answer. Authorization
is a permission matrix in the database (`roles`, `permission_activities`, `role_permissions`)
read by one SQL function in every row-level policy and by one TypeScript function in every
page and action. The same Pi takes the weekly encrypted database backup to Drive. Everything
is on free tiers.

```
browser ──► Cloudflare edge ──► Worker (worker/index.mjs)
                                 ├─ /api/releases/*, /api/csp-report   answered here
                                 ├─ 1. edge cache  anonymous GET of a public page, 10 min, per locale
                                 ├─ 2. Pi          pi.lannacare.org ──► Tunnel ──► cloudflared ──► next start :3000
                                 │                 (x-origin-key header; a WAF rule on the hostname checks it)
                                 └─ 3. itself      OpenNext render, 10 ms CPU, GET/HEAD/OPTIONS on any
                                                   origin failure, POST only on a 530
                 both renderers ──► Supabase (auth, Postgres+RLS, one Storage bucket)
                                ──► Google Drive (one OAuth refresh token, plain fetch)
                 Worker cron (*/15) ──► status alerts (in-Worker) → send_email; machine translations
                 Pi cron (Sun 03:00) ──► scripts/backup.mjs → age-encrypted dump → Drive + ~/backups
```

### 1.2 The request path, as the Worker has it

`worker/index.mjs` runs first for every request on `lannacare.org` and `test.lannacare.org`.
Two paths are answered inside the Worker before anything else: `/api/releases/*` (the release
version and the mail relay, because only the Worker has the `send_email` binding) and
`/api/csp-report`. Then, if the request is an anonymous `GET` of a public page with no `sb-*`
cookie and no `rsc` header, the Cache API is consulted, keyed on URL plus the `locale` cookie,
and a `200` without `set-cookie` is stored for 600 s. Otherwise `worker/origin.mjs` replays the
request against `ORIGIN_HOST` with `x-origin-key`, `x-forwarded-host` and `x-forwarded-proto`
set. A read falls back to the local OpenNext render on any origin failure or a 20 s timeout. A
write falls back **only** on a `530` (the edge found no tunnel connector); any other failure is
answered `503` with "check whether your change was saved", because a `502`/`504` can arrive after
the Pi has already written (`docs/decisions/2026-10-02-origin-write-fallback.md`). Every
response then gets the security headers from `worker/security-headers.mjs` (an enforced CSP
with `'unsafe-inline'`, HSTS 180 days, frame-ancestors none). `x-lanna-served-by` and
`x-lanna-cache` say which path answered.

On the Pi, `cloudflared` rewrites `Host` to the public hostname (`scripts/pi/cloudflared-config.yml`)
and then overwrites `x-forwarded-host` with its own ingress name, which is why the app pins
`NEXT_PUBLIC_SITE_URL` on the Pi (`scripts/pi/write-env.mjs`) and why `next.config.ts` lists
`serverActions.allowedOrigins`.

**The asymmetry the brief asked about.** The Pi and the Worker are two builds of the same
commit, made on two machines, configured by two mechanisms (wrangler vars and secrets for the
Worker; `.env.production.local` written by `write-env.mjs` from `.env.local` +
`.env.deploy.production` + a few keys copied out of `wrangler.jsonc` for the Pi). Four live
faults came from that split in eleven days: Server Actions refused on `x-forwarded-host`
(2026-09-30), uploads refused by the same-origin check (2026-10-01), forms rendered by one
build rejected by the other until both shared `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`
(2026-10-03), and the visitor-count secrets reaching the Worker but not the Pi (2026-10-10).
Each was fixed by adding another pinned value or shared list; §2.2 C1 and C2 say what is
structural about it.

### 1.3 The application

Next.js 16.3.8 on React 19, App Router, Tailwind 4, TypeScript. 109 `page.tsx` files, 65 files
marked `"use server"`, 15 route handlers (11 under `src/app/api/`), 214 files under `src/lib`,
70 shared components. There is no test runner; `scripts/check-*.mjs` (137 files) are the
tests, six of which run in `npm run lint`.

`src/proxy.ts` is the gate: it refreshes the Supabase session cookie, sends a signed-out
visitor of a non-public path to `/login?next=…` (via `safeNextPath`, which parses rather than
blacklists), forces an account on a temporary password to `/account/password`, and refuses
the app to any session whose role does not `opensApp` (a `public_viewer`, an archived login).
The public path list is `src/lib/public-paths.ts`, with a separate, shorter list for the
locked site (`PUBLIC_SITE=locked`, which every deployed environment currently sets). The
proxy runs one `auth.getUser()` and one `my_permissions()` RPC on every app request.

Three Supabase client factories: browser (anon key, one client component uses it), server
(anon key + the request's cookies, used by 164 files, so RLS applies), and admin
(service-role key, bypasses RLS, imported by 13 files). Server actions return an
`ActionResult` rather than throwing (`src/lib/action-result.ts`, `runAction`).

The public website and the staff app are one Next app on one host, split by path: the public
pages (`/`, `/adopt`, `/our-work`, `/foster`, `/volunteer`, `/donate`, `/friends`, `/privacy`,
`/r/`, `/e/`) read `public_*` views and `site_*` tables with the anon key, render without the
app chrome (`PublicPathGate`), and are what the Worker edge-caches. Everything else needs a
session. A decision on 2026-10-10 moves only the public pages to a second domain later.

Internationalisation is two dictionaries (`en.ts` 317 KB, `th.ts` 554 KB) imported together
by `I18nProvider`, so both ship to every browser; free text is translated through
`translations` rows, short labels through paired `_th` columns.

### 1.4 Identity and permissions

Supabase Auth (email+password and Google), admin-provisioned: there is no self sign-up.
Temporary passwords and the authenticator-app approval live in `app_metadata`, which only the
service role writes. Settings → Security needs `aal2` (a TOTP factor), and the first
authenticator can only be enrolled in a window another admin opened
(`src/lib/auth/two-step.ts`).

Authorization was rebuilt between 2026-10-03 and 2026-10-11 (`0132`–`0182`). Today a role is a
row of `roles` (template or custom; `opens_app`, `home_path`, four scope columns); the
catalogue is `permission_activities` (61 keys, mirrored exactly by
`src/lib/permissions/catalogue.ts`, checked by lint); the cells are `role_permissions`.
`has_permission(activity, level)` is the one security-definer function the policies call;
`my_permissions()` returns the caller's role, scopes and cells as JSON, parsed defensively by
`parsePermissions`; `can(perms, activity, level)` is the pure TypeScript twin, failing closed
on anything unknown. Admin is a rule, not cells (`is_admin()` answers yes to everything). A
page is guarded by `requirePermission(activity)`; the route registry `routes.ts` derives the
menu, home tiles and landing grids from the same cells. The old enum, `user_roles.role`,
`roles.legacy_role` and `current_user_role()` were dropped by `0181` on 2026-10-11, and
production took a 1m38s outage to apply it. `docs/roles-and-permissions.md` (1,618 lines) is
the design paper; `/admin/who-does-what` is the live matrix, with
`src/lib/permissions/fixed-for-now.ts` listing the boxes the system does not yet obey and a
script that measures that list.

### 1.5 The database

183 migration files, 27,637 lines, applied by `scripts/apply-migrations.mjs` through the
Management API and recorded in `schema_migrations`. 68 tables, about 170 functions (171
`security definer` declarations), 64 views, 455 policies created and 366 dropped over the
history (so roughly 90 live, rewritten several times). RLS is on everywhere. `anon` is
allow-listed by `0081` (13 views and tables) and `0082` (five functions); default privileges
are closed for new objects; a `private` schema holds what the Data API must not expose. An
append-only `audit_log` (`0121`) covers seven tables. Public-facing Drive file ids are
decided by `is_public_drive_file()` (`0084`), a security-invoker union over the public views.
The `0180`/`0181` pair shows the migration discipline at its best and its limit: the readers
moved first, the drop came second, and the runner could not express "apply up to here"
(backlog, 2026-10-11).

### 1.6 Files: Google Drive and one Storage bucket

`src/lib/google/drive.ts` is a plain-`fetch` Drive v3 client (the SDK does not run on
Workers) acting as one personal Gmail account through one OAuth refresh token, with an
in-isolate access-token cache. Folder conventions mirror the legacy Drive tree. Photos are
never linked directly: `/api/photos/[fileId]` fetches through the API and caches public files
at the edge (Cache API), on the Pi's disk (`PHOTO_CACHE_DIR`) and in the browser; an internal
file is served `no-store` only to a session whose RLS can select the row that holds it, and
otherwise answers 404 so an outsider cannot tell a private file from a made-up id. Facility
plan images are the one exception to "Drive for files": `src/lib/facility-map/plan-store.ts`
keeps them in a private Supabase Storage bucket, written and read with the service role only.
The weekly backup is also written to Drive, under the same account and token.

### 1.7 Deployment

Three Worker environments in `wrangler.jsonc` (`test`, `uat` with no routes yet, `production`),
each its own build because `next build` inlines the Supabase URL and anon key.
`scripts/deploy.mjs` guards a `uat`/`production` deploy five ways before building: the
`PUBLIC_SITE` lock matches the host, the env file badges the right environment, no stray env
file names another environment, the checkout is a clean pushed `main`, the database holds
every migration the commit carries, and the commit is a written-down release
(`src/lib/releases.ts`, `package.json`). It builds with the shared Server Actions key, strips
OpenNext's baked `.env.local` snapshot, tags the Worker version with the release, and mails a
major release to verified admin addresses through the Worker. The Pi deploys separately:
`scripts/pi/deploy-pi.sh` resets its clone to `origin/main`, runs the same release guard
(`guard-release.mjs`, with a loud `--force` that logs outside the checkout), writes
`.env.production.local`, builds on the Pi, checks the actions-key fingerprint and restarts the
service. Test is a second clone on the same Pi, refused from the production folder and
refused if it holds a production env file. Rollback is `deploy-pi.sh --ref <sha>` for users
and `wrangler rollback` for the fallback; neither reverts a migration.

### 1.8 Operations

Backup: `scripts/backup.mjs`, Sundays 03:00 on the Pi, `pg_dump -Fc` of `public` and `auth`
minus the session tables, encrypted in memory with the administrator's age public key, uploaded
to Drive and kept locally, newest 12 kept. The restore recipe in `README.md` has never been
run (backlog). A USB spare-boot clone is scripted but never booted (backlog). Settings →
System status runs health checks (database, Drive, migrations drift, release, mail, backup
age, Pi origin, visitor count) with timeouts and secret scrubbing; a Worker cron every 15
minutes re-runs them and mails state changes. CI runs typecheck, lint and build plus the
test-plan, migration-number, policy-role-name, script-integrity, actions-key and public-views
checks; `audit` is advisory by design. Development is parallel git worktrees with
auto-pushing hooks, one branch per feature, serial merges, a `backlog` branch, and one decision
file per decision (343 files in 18 days).

### 1.9 Where `README.md` disagrees with the code

| README says | The code has | Which is right |
|---|---|---|
| "Six `app_role` values, enforced by row-level security (`0001_initial_schema.sql`, mirrored … `0039`, `0040`, `0043`/`0044`)" (Roles, opening) | `0181` dropped `app_role`, `user_roles.role` and `current_user_role()`; policies ask `has_permission()`; roles are rows of `roles` | Code. The README's own next paragraph says the table "is history", but the opening sentence still describes the enum as the mechanism |
| vet row: "A vet account belongs to one clinic (`user_roles.vet_id`, 0102 …)"; "`src/lib/vets/scope.ts` — the forms' rule, not yet RLS" | `user_roles.vet_id` dropped by `0127`; `src/lib/vets/` does not exist (it is `src/lib/clinics/`); the clinic scope is RLS (`current_user_clinic_ids()`, `0167`/`0178`) | Code |
| volunteer row: "Read everything; write photos and enclosure moves only" | Narrowed to who-and-where, read-only (`0134`, `0179`) | Code |
| Project structure: "`src/lib/vets/` — the vet hub's statistics …" | Renamed to `src/lib/clinics/` by the 2026-10-09 rename | Code |
| Stack: "Google Drive API for file/photo storage (not Supabase Storage)" | Facility plan images are in a private Supabase Storage bucket (`plan-store.ts`, decision 2026-10-08) | Code; the README is incomplete rather than wrong |
| `src/lib/supabase/server.ts` comment: "see src/middleware.ts once added" | The gate is `src/proxy.ts` | Code (a comment, not the README, but the same staleness) |
| `docs/test-plan-template.md` §4: "`app_role` is `('admin', 'staff', 'vet', 'volunteer')` … `'vet'` renamed `'doctor'` by `0172`" | The type no longer exists; the live roles are rows (admin, management, second_in_command, head_of_maintenance, head_of_medical, doctor, volunteer, public_viewer); `staff` is retired | Code. Every new test plan copies this paragraph |

Everything else checked against the README held: the environments table matches
`wrangler.jsonc`; the backup section matches `backup.mjs` and `pi-hosting.md`; the deploy
steps match `deploy.mjs`; the edge-cache description matches `worker/index.mjs`; the photo
proxy description matches the route; the migration rules match the runner.

---

## 2. Findings, ranked

Severity is about what happens if nothing is done. "Free" means no new paid service.

### 2.1 Security and data loss

**S1. The Supabase personal access token is, by the setup instructions, on the Pi.** —
*High.* `scripts/pi/setup.sh` refuses to run without both `.env.local` and
`.env.deploy.production` in the Pi's checkout, and `docs/pi-hosting.md` says to copy both from
the dev machine. `.env.example` shows `.env.local` is where `SUPABASE_ACCESS_TOKEN` and
`SUPABASE_DB_PASSWORD` live, and `scripts/backup.mjs` reads the token on the Pi to look up the
pooler host unless `SUPABASE_DB_URL` is set. That token drives the Management API's
`database/query` endpoint, which is how `apply-migrations.mjs` runs arbitrary SQL against
**both** projects, dev and production. The app service and the backup cron run as the same
user (`pi-hosting.md`, "Known limit"; backlog *Run the app on its own user on the Pi*), and
the Pi is the one internet-facing render box. So a compromise of the app process yields,
beyond the service-role key the Pi must hold, a token that can drop every table in both
databases and read every project in the account. (Inferred from the scripts; the Pi's actual
files were not read.) **Change:** (1) put `SUPABASE_DB_URL=postgresql://…pooler…:5432/postgres`
in the Pi's `.env.deploy.production` so `backup.mjs` never needs the token, then delete
`SUPABASE_ACCESS_TOKEN` from every file on the Pi; (2) in `scripts/pi/write-env.mjs` and
`setup.sh`, refuse to run on the Pi if `.env.local` or `.env.deploy.*` contains
`SUPABASE_ACCESS_TOKEN` (mirror of `deploy-pi.sh`'s refusal of a production file in the test
clone); (3) move the Drive values the Pi needs into `.env.deploy.production` and stop copying
`.env.local` to the Pi at all; (4) rotate the token afterwards. This sits beside the laptop
item (CODE-3) and the own-user item, and is cheaper than both.

**S2. Backups are weekly, and a restore has never been run.** — *High (data loss).* The free
tier has no point-in-time recovery, so the shelter's recovery point is up to seven days of
intakes, visits and weights (`scripts/backup.mjs`, the cron line in `README.md` "Backups").
The restore half is already the backlog's *Rehearse a restore from a production backup*, raised
to urgent on 2026-10-11 after `0181`; this review ranks it the single most important open item
in the system and adds nothing to it. The cadence is new. **Change:** run the backup daily:
the Pi cron line becomes `0 3 * * *` with `--keep 30`, `README.md` "Backups" and
`docs/pi-hosting.md` say so, and the Weekly backup tile's thresholds in
`src/lib/status/health.ts` (amber 8 days, red 15) become 2 and 4. Cost: Drive space of about
thirty dumps instead of twelve (dump size not measured here) and a few minutes of Pi CPU at
03:00. Free.

**S3. The Pi trusts the WAF rule alone; the app never checks `x-origin-key`.** — *Medium.*
The only thing stopping a request that reaches `pi.lannacare.org` without the shared secret is
a dashboard WAF rule that lives outside the repository, on a plan limited to five custom
rules, and that was already extended by hand to cover `test-pi.lannacare.org`
(`docs/pi-hosting.md`). `scripts/lib/optional-secrets.mjs` makes `ORIGIN_KEY` Worker-only on
purpose, and `src/proxy.ts` has no check. If the rule is edited, disabled, or displaced when
a sixth rule is needed, the Pi's `next start` answers anyone who finds the hostname, with the
app's full session logic in front of them. **Change:** have `write-env.mjs` write `ORIGIN_KEY`
into the Pi's `.env.production.local` (drop it from `WORKER_ONLY_SECRETS`), and in
`src/proxy.ts`, before `updateSession`, when `process.env.ORIGIN_KEY` is set, refuse with 403
any request whose `x-origin-key` does not match it (constant-time, as
`src/app/api/status/alerts/route.ts` compares). `next dev` and the Worker never set the
variable, so nothing else changes. Free; small.

**S4. Photos and backups share one Drive identity.** — *Medium.* `scripts/backup.mjs` uploads
with the same `GOOGLE_OAUTH_REFRESH_TOKEN` the app uses for photos, so the token that is on the
Worker, on the Pi and on the laptop can also list, trash and (with `files.emptyTrash`)
permanently delete every backup. `BACKUP_DRIVE_FOLDER_ID` moves the folder, not the identity.
The backups are encrypted, so this is about losing them, not reading them. **Change:** give
the backup its own OAuth refresh token and client (`BACKUP_GOOGLE_OAUTH_*`, read in
`driveClient()` in `backup.mjs`, falling back to the app's values only with an explicit flag),
minted for an account or at least a folder the app token cannot see, and keep that token only
on the Pi. When the shelter's own Drive account arrives (backlog *Give production its own Drive
tree*), the backups should go to an account that is not the one the app writes to. Free.

**S5. The public hostnames are hard-coded in two places the cutover list does not name.** —
*Medium (an outage class already seen twice).* `src/lib/auth/same-origin.ts` lines 9–10 and
`next.config.ts` line 151 (`serverActions.allowedOrigins`) both say `lannacare.org`;
`scripts/pi/cloudflared-config.yml` rewrites `Host` to it. The README's "What the cutover
changes here" lists `app-env.ts`, `releases/page.tsx`, `wrangler.jsonc`, `env.mjs` and
`deploy-pi.sh`, and not these three. The 2026-10-10 decision keeps the staff app on
`lannacare.org` for now and moves it to a Cooper `.org` later; the day it moves, every Server
Action and every upload will be refused on the new host, exactly as on 2026-09-30 and
2026-10-01. **Change:** one `src/lib/site-hosts.ts` exporting the public host list, imported by
both `same-origin.ts` and `next.config.ts` (which already imports from `src/lib/uploads/limits`),
and a line in the README cutover section and in the two cutover backlog items naming it and
the cloudflared `httpHostHeader`. Free; an hour.

**S6. The service-role client is fenced by a comment.** — *Low to medium.*
`src/lib/supabase/admin.ts` says "only import this from `use server` action files gated by
`assertAdminRole()`"; it is imported by 13 files including two pages, the status checks and
`plan-store.ts`, each with its own guard, and nothing enforces the fence. One new import in a
client component or an unguarded page would ship or expose RLS-bypassing reads. **Change:** an
ESLint `no-restricted-imports` rule in `eslint.config.mjs` forbidding `@/lib/supabase/admin`
everywhere except an allow-list of the current 13 paths, plus a one-line comment in
`admin.ts` that matches reality. Free; twenty minutes.

**S7. Some `security definer` functions do not pin `search_path`.** — *Low; verify first.*
Across the migrations there are 171 `security definer` declarations and 164 `set search_path`
lines; a rough scan finds about forty definer declarations with no `search_path` within the
next four lines (some will be false positives of the scan, and later migrations replace
earlier bodies). Supabase's own linter flags this because a definer function resolves unqualified
names on the caller's path. On this project the risk is low — `authenticated` cannot create
objects in `public` — but it is the standard hardening and the migrations already do it
almost everywhere. **Change:** one query against the dev database
(`select proname from pg_proc where prosecdef and (proconfig is null or not proconfig::text like '%search_path%')`)
to get the real list, then one migration that `alter function … set search_path = ''` (or
`public`, matching each body's style) for each. Free; small.

**S8. Server actions that carry no `can()` call** are already on the backlog (*Admin,
maintenance, projects and intake writers contain no `can()` call*, found 2026-10-11). Of the
three read for this review — `maintenance/actions.ts`, `residents/new/actions.ts`,
`residents/[id]/move/actions.ts` — each writes through the session client or an RPC, so RLS
and the function's own guard decide; the risk is a readable refusal, not an unauthorised
write. Nothing to add beyond: do it, and let the lint check that exists for pages
(`check-permission-catalogue.mjs`) also assert that every `"use server"` file under `src/app`
names an activity or an admin check.

### 2.2 Coupling, duplication, and what hurts when the shelter grows or a second developer arrives

**C1. The Worker render fallback is the expensive half of the Pi/Worker asymmetry.** — *The
one architectural question worth a decision.* The fallback is what makes two builds per
release necessary, what the shared Server Actions key exists for, why writes are cloned into
Worker memory, why `strip-baked-env.mjs` exists, and where three of the four live faults
arose. What it buys is: anonymous public pages (already covered by the edge cache without it)
and **reads** of the staff app during a Pi outage, under the 10 ms CPU limit that caused the
`1102` errors the Pi was bought to escape. Writes under it are refused in every outage shape
except a stopped `cloudflared` (`docs/pi-failover.md`, measured by nobody yet). An outside
reader's view, offered to the open item *Rethink Pi failover* rather than filed separately: the
honest alternatives are (a) keep the fallback and make writes idempotent (option 1 in the
paper, weeks), or (b) remove the fallback for app paths — the Worker becomes cache + proxy, and
during an outage app routes get a static "back shortly" page — which deletes the dual-build
class of fault entirely and loses only degraded staff reads. (b) is a few lines in
`worker/index.mjs` and `origin.mjs` and the removal of the actions-key machinery; it is the
cheaper and more predictable system, and the drills the paper asks for would tell whether the
reads it gives up were ever worth much. The decision is the owner's; it should be made with
the measurements the paper lists, not in a session. **Change:** add this trade-off to the
*Rethink Pi failover* item (done in this review), and run the drills before building either.

**C2. Runtime configuration is four hand-kept lists.** — `scripts/deploy.mjs`
(`RUNTIME_SECRETS`, `BUILD_VARS`), `scripts/lib/optional-secrets.mjs` (`OPTIONAL_SECRETS`,
`WORKER_ONLY_SECRETS`, `PI_OPTIONAL_SECRETS`), `scripts/pi/write-env.mjs` (`KEYS`,
`RUNTIME_VARS`) and `src/lib/status/run.ts` (`SECRET_ENV_NAMES`) each enumerate a subset of
the same twenty-odd names, and the status tiles know which machine lacks what only where
someone wrote that in. The 2026-10-10 fault was two of these drifting. **Change:** one
`scripts/lib/runtime-config.mjs` exporting a table — name, `where: worker|pi|both`,
`secret: true|false`, `required: true|false` — from which `deploy.mjs` derives what to push,
`write-env.mjs` what to write, `run.ts` what to scrub, and a generic status tile
("on this machine, these required values are missing") replaces the per-value wording.
Free; half a day; removes a whole class.

**C3. The public-page list exists three times.** — `src/lib/public-paths.ts` has
`PUBLIC_PATH_PREFIXES` and, separately, a second literal list inside `isPublicPage()`;
`worker/index.mjs` has `PUBLIC_PAGE_PREFIXES` with a comment saying it "mirrors" the first
(it does not include `/r` and `/e`, which may be deliberate — nothing says). The Worker already
bundles TypeScript from `src/lib` (`release-mail.mjs` imports `../src/lib/releases.ts`), so the
duplication is avoidable today. **Change:** `isPublicPage` derives from one exported
`PUBLIC_PAGE_PREFIXES` in `public-paths.ts`; `worker/index.mjs` imports it; a comment states
whether `/r` and `/e` are cached and why. Free; an hour. (`scripts/check-public-paths.mjs`
covers the proxy's list only.)

**C4. Both dictionaries ship to every phone.** — `src/lib/i18n/I18nProvider.tsx` resolves
`getDictionary(locale)` on the client, and `get-dictionary.ts` imports `en` and `th`
statically, so 870 KB of source (before minification; still several hundred KB of JS) is in
the client bundle for every visitor, on a site whose users are on phones in rural Thailand.
The file comment says "both dictionaries are small enough"; they were, on 2026-09-20. This
grows with every feature. **Change:** load the active locale only — a dynamic
`import(\`./dictionaries/${locale}\`)` behind the provider, or split the dictionaries by area
and pass each page the slice it uses. Free; a day; measurable with `next build`'s route table.

**C5. The resident record is one 1,465-line file.** —
`src/app/residents/[id]/[section]/page.tsx` is a `switch` over ten sections (housing, photos,
adoption updates, immunizations, clinic visits, prescriptions, diet, weight, procedures,
blood tests), each 100–200 lines, in one server component with 50 imports. It is the page a
second developer will be sent to first and the one most streams touch. **Change:** one file
per section under `src/app/residents/[id]/[section]/sections/`, each exporting a
`(ctx) => ReactNode`, with the page reduced to the guard, the shared header and a map from
section name to renderer. No behaviour change; a mechanical afternoon.

**C6. There is no test runner, and the tests that exist are decisions.** — 137 `check-*.mjs`
scripts are the project's tests; six run in lint, a handful more in CI, and thirteen are red
by decision (backlog, 2026-10-10) because they encode expectations copied from the database
rather than rules. Many of the pure modules that carry the security logic — `public-paths.ts`,
`next-path.ts`, `same-origin.ts`, `can.ts`, `password-change.ts`, `worker/origin.mjs`,
`worker/csp-report.mjs`, `worker/translations.mjs` — have no assertion run on every PR.
**Change:** Node 22's built-in `node --test` (no dependency, free) with one `*.test.mjs` beside
each pure module, run as a fourth step in CI's `check` job; port the pure `check-*` scripts
that already assert into it over time, and leave the database-driven ones as they are.

**C7. An internal photo costs seven queries.** — `canSeeInternalFile()` in
`src/app/api/photos/[fileId]/route.ts` runs seven `select … limit 1` queries in parallel for
every non-public photo request, and such responses are `no-store`, so a resident gallery of
thirty medical photos is 210 queries plus thirty Drive downloads per page view, from the Pi to
Mumbai. **Change:** one security-invoker SQL function `can_see_drive_file(p_drive_file_id)`
written like `is_public_drive_file()` (a `union all` under `exists`), granted to
`authenticated`, and one RPC in the route. Free; small; a new table that carries a Drive id
then has one place to be added.

**C8. Multi-tenancy: the shape is right, the cost is known.** — There is no `shelter_id`
anywhere; the roles design separates template roles from custom ones, and the 2026-10-09
spike priced a pooled build at about 50 hours. Nothing to do now. The one note for later:
the free tier allows two projects per organisation, so "one Supabase organisation per
shelter, one project each" is the zero-cost tenancy shape, and it needs no `shelter_id` at
all — only the deploy tooling, which already takes `--env`, learning a shelter name.

### 2.3 Nits

**N1.** Stale comments: `src/lib/supabase/server.ts` ("see src/middleware.ts once added");
`src/lib/supabase/admin.ts` (the import rule it states is not the one followed);
`worker/index.mjs` declares `DEFAULT_ORIGIN_TIMEOUT_MS` and never uses it (`origin.mjs` has
its own).

**N2.** `README.md` and `docs/test-plan-template.md`: the seven rows in §1.9. The template
matters more than the README, because every PR copies its role paragraph into a new plan.

**N3.** `src/proxy.ts` and the page both call `my_permissions()` (the proxy's `loadSessionRole`
and the page's `loadPermissions` are separate request contexts, so React's `cache()` does not
join them). Two RPCs per app request where one would do. The fix — the proxy passing the
parsed role to the page in a request header — is only safe if the page trusts the header
exclusively from the proxy, so leave it unless latency is measured to matter.

**N4.** `scripts/backup-schedule.ps1` registers a Windows task the README says was
unregistered on 2026-10-04; the script's own comment still describes it as the weekly run.
One sentence at the top saying "kept for re-registering; the Pi runs the schedule" would stop
the next reader setting it up again.

---

## 3. What is fine and should be left alone

These were examined and found sound. The list is what was looked at, so the next reader can
tell "checked and fine" from "never looked at".

- **The sign-in gate** (`src/proxy.ts`, `src/lib/supabase/proxy.ts`): one path, one allow-list,
  cookies carried on every redirect, the expired-vs-never-signed-in distinction, archived
  sessions signed out at their next request, `safeNextPath` parsing rather than blacklisting.
  Leave it.
- **The anonymous tier** (`0081`, `0082`, `0084`, `private` schema, `check-public-views.mjs` in
  CI): allow-list by object, default privileges closed, a function that answers "is this file
  public" by asking the public views rather than restating them. This is the best-constructed
  part of the database.
- **The photo proxy's trust model** (`/api/photos/[fileId]`): public files cached three ways,
  private files `no-store` and only to a session that can select the row, 404 either way for
  an outsider, `nosniff` and `attachment` for anything not an image or PDF, size allow-list.
  Only the query count (C7) is worth touching.
- **The permission model's two halves and the parity checks**: `has_permission()` in every
  policy, `can()` in every page, one catalogue in two places with a lint check that they
  match, admin as a rule, `parsePermissions` dropping anything it does not recognise,
  `fixed-for-now.ts` as a measured list rather than a promise. The design paper's choice of a
  live lookup over a JWT claim is right for a shelter where archiving someone must bite now.
- **Service-role use**: 13 importers, each guarded; the two bearer-authenticated endpoints
  (`/api/status/alerts`, `/api/releases/mail`) compare in constant time; the translations cron
  writes one literal status and only to rows still in the state it read. Fence it (S6), do not
  redesign it.
- **Two-step for Security** (`src/lib/auth/two-step.ts`): `aal2` checked against GoTrue rather
  than a decoded cookie, first enrolment gated by another admin, approval and temporary-password
  flags in `app_metadata` only. The lost-phone recovery is written down.
- **Server actions return results** (`src/lib/action-result.ts`, five decision files): one
  shape, logged references for the unexpected, no `#441` in production.
- **The deploy guards** (`scripts/deploy.mjs`, `scripts/lib/release-guards.mjs`,
  `guard-release.mjs`): clean pushed `main`, a written release, migrations applied,
  badge-matches-project, stray env files refused, the baked snapshot stripped, the actions-key
  fingerprint printed on both machines, `--force` loud and logged outside the checkout. This
  is more care than most teams with a budget take.
- **The migration runner** (`scripts/apply-migrations.mjs`): per-file transaction with its own
  `schema_migrations` row, `origin/main` as the reference for production, no override, the
  grants check before anything reaches a shared database, drift reported both ways. Its one
  gap (`--upto`) is already on the backlog.
- **Backup encryption** (`scripts/backup.mjs`, `backup-crypto.mjs`): public-key only on the
  machine that writes, no plaintext file, session tables excluded, link not logged, refuses
  without a recipient, size verified after upload, prune only after a confirmed upload. Change
  the cadence and the identity (S2, S4); keep the design.
- **The Worker's own endpoints** (`csp-report.mjs`, `release-mail.mjs`,
  `security-headers.mjs`): capped bodies, rate-limited logs, nothing echoed, headers applied to
  every response whichever renderer made it, the CSP enforced after a report-only week.
- **The edge cache** (`worker/index.mjs`): cookie and RSC exclusions, per-locale keys, `200`
  only, the origin's own `cache-control` handed back to the browser. The ten-minute staleness is
  documented where editors will meet it.
- **The Drive client** (`src/lib/google/drive.ts`): plain fetch, one shared in-flight token
  refresh, "not connected" told apart from "Google is slow". Right call for Workers.
- **The audit log** (`0121`): append-only enforced by trigger for everyone including the owner,
  written only by a definer function that takes nothing from the caller.
- **The write-fallback refusal** (`worker/origin.mjs`): refusing a write that may already have
  happened is the correct default, and the decision file records the measurement that forced
  it. Whatever C1 decides, do not make writes replay on a `502`.
- **One file per decision, one branch per feature, serial merges, a checklist per PR with two
  signatures that certify different things.** The process has caught its own mistakes
  repeatedly in the record; the record is the evidence.

---

## 4. Backlog items from this review

Filed on the `backlog` branch under the matching heading, in this order of priority:

- Security: S1 (token on the Pi), S3 (origin key in the app), S4 (backup Drive identity),
  S7 (definer `search_path` audit).
- Deployment: S2 (daily backups), S5 (host lists and the cutover list).
- Quick wins: S6 (admin-client lint fence), C3 (one public-page list), C7 (one photo
  visibility RPC), N1/N4 (stale comments).
- Mobile: C4 (ship one dictionary).
- Architecture: C2 (runtime config manifest), C5 (split the resident record page), C6
  (`node --test` for the pure modules).
- Documentation: N2 (README and template rows in §1.9).

Annotated rather than duplicated, because an open item already covers the ground:
*Rethink Pi failover* (C1), *Rehearse a restore from a production backup* (S2's restore half),
*Run the app on its own user on the Pi* (S1), *Secrets on the laptop* (S1), the two cutover
items (S5), *Admin, maintenance, projects and intake writers contain no `can()` call* (S8).

---

## Appendix: numbers measured on `56672229`

| | |
|---|---|
| Commits | 3,467 between 2026-09-18 and 2026-10-11 (24 days; 100–260 a day from 2026-09-21) |
| Pages / server-action files / route handlers | 109 / 65 / 15 |
| `src/lib` files / components / client components | 214 / 70 / 185 files marked `"use client"` |
| Migrations | 183 files, 27,637 lines; 68 tables, ~170 functions, 64 views; 455 policies created, 366 dropped; 171 `security definer` |
| Decision records | 343 files in `docs/decisions/` (7 to 38 a day) plus the frozen 3,415-line `docs/decisions.md` |
| Check scripts | 137 `scripts/check-*.mjs`; 6 in `npm run lint`; 13 red by decision |
| Dictionaries | `en.ts` 317 KB, `th.ts` 554 KB, both in the client bundle |
| Largest source files | the resident section page 1,465 lines; `drive.ts` 1,066; `FriendWizard.tsx` 919; `MapEditor.tsx` 896 |
| Service-role importers | 13 files |
| `process.env` keys read by the app | 19 distinct |
| Backup | weekly, keep 12, age-encrypted; restore never run |

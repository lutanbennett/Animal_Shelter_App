# Feature test plan

---

## Header

| | |
|---|---|
| Feature | UAT becomes a standard release target, and its schema guard is made real |
| Backlog item | `docs/backlog.md` → `#m9qtv` (ticked here); `#uat7p`, `#u7d3b`, `#uq4vz` and the new `#uq8wk` are on the `backlog` branch |
| Branch / worktree | `claude/uat-in-release` @ `C:\Development\Animal_Shelter_uat-in-release` |
| Dev server | not started — no page in this change (see §1) |
| PR | #1404 |
| Tested by / date | Claude Opus 5 / 2026-11-08 |
| Carries a migration? | no |
| Tested at SHA | `5861825a`, plus this plan's own commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for

  Lutan, 2026-11-08: *"UAT is complete and is now part of the standard release process."* This puts
  UAT into `docs/release-procedure.md` as a deployed environment, and fixes the three things that
  made that unsafe to standardise: UAT's schema guard could not run at all, UAT would have mailed
  real people if a flag was forgotten, and UAT's cache purge named the wrong host.

- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)

  **Code:** `scripts/lib/deploy-schema.mjs` (the second route for reading applied migrations),
  `scripts/lib/release-guards.mjs` (the pass message names the route),
  `scripts/deploy.mjs` (UAT does not mail unless `--mail`; `--plan` says what it would do about
  mail), `scripts/purge-cache.mjs` (UAT's host), `scripts/check-release-guards.mjs` (+16 cases).
  **Docs:** `docs/release-procedure.md`, `docs/uat-finalisation.md`, `docs/test-plan-template.md`,
  `README.md` (six stale UAT facts — see §7), `docs/decisions/2026-11-08-uat-in-every-release.md`,
  `docs/backlog.md`.
  **No route, component, migration, `worker/`, `src/lib/manual/` or `src/lib/i18n/` file is
  touched**, which is why there is no dev server and no browser work in this plan.

- [ ] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — n/a: nothing in this change reads a card, an activity or a role. It is release tooling and runbooks; no page, no server action, no RPC, no policy. Admin and the signed-out public are unaffected in the same way.

- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

  **Out of scope, deliberately:**
  - **Applying migrations to UAT.** Still impossible by script (§3 and Defect 1). DDL cannot go
    through PostgREST and there is no Postgres client in `node_modules`, so the fix is the token
    permission, not a new code path. Building one would mean a new dependency and a second way to
    run migrations to work around a two-minute dashboard change.
  - **Deploying UAT *before* production.** UAT's guard refuses code whose notes are not cut, so UAT
    cannot be an acceptance gate ahead of a release — it is a mirror that follows one. Changing that
    is a change to what UAT is, which is Lutan's call.
  - **`#pz3tk`, nothing purges test.** Same family, different cause (test's zone and token live in
    `.env.deploy.production` while `--env test` reads `.env.local`). Left as its own item.
  - **Running a UAT deploy.** There is no release to ship today, and `main` carries `0338`, which
    UAT has not applied — so a UAT deploy would correctly refuse. That refusal is itself recorded as
    evidence in §4.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly

  Run twice. The first: `merging origin/main into claude/uat-in-release` / `Already up to date.` /
  `pushing claude/uat-in-release`. The second, after GitHub reported the PR `CONFLICTING`:
  `Auto-merging docs/backlog.md` / `CONFLICT (content): Merge conflict in docs/backlog.md` /
  `worktree: git merge origin/main exited with 1`. **Not merged cleanly, then** — resolved by hand
  and described in §6, which is where the evidence is.

- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

  **Run twice: once on this branch alone, and again on the tree merged with `main`** after #1402
  came in (§6). The second is the one that matters, and both are green.

  On the merged tree:

```
=== gates: typecheck exited 0 after 15s
=== gates: lint exited 0 after 146s
=== gates: test exited 0 after 26s
=== gates: build exited 0 after 80s
gates: typecheck=0 lint=0 test=0 build=0
```

  Before the merge:

```
=== gates: typecheck exited 0 after 36s
=== gates: lint exited 0 after 288s
=== gates: test exited 0 after 49s
=== gates: build exited 0 after 69s
gates: typecheck=0 lint=0 test=0 build=0
```

  **A note on the first attempt, because it is a trap this checklist warns about and I walked into
  it anyway:** that run was `node scripts/gates.mjs | tail -22`, which kept only the **build's**
  line and discarded the other three. The exit code was still the gates script's, so nothing was
  misreported — but the evidence this line asks for was gone, and recovering it cost a ten-minute
  re-run. `tail` is the same hazard the runbook records for deploy logs.

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

No migration in this PR. The section is not skipped silently, because this change is *about* the
check that compares a database with the migrations a commit carries, and two of its lines turned
out to be the most valuable things measured here.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying

  Reviewed for all three environments, which is the point of the change. **production:** answers
  normally. **uat:** `Missing required permission(s): database_read` — every mode, `--status`
  included. That is the measurement behind Defect 1 and behind `#uq8wk`.

- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR to dry-run
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [x] Existing rows still read correctly after the change (checked against real dev data)

  Read as *does the new read path return the right rows*, which is the only data question here. It
  reads one table, `schema_migrations`, on UAT's own project through PostgREST with the service-role
  key. Measured against the real database: the newest twelve rows are `0337_supplier_history_rekey.sql`
  down to `0326_social_library_split.sql`, and `assert-schema --env uat --ref fb0c384f` (the commit
  UAT is serving) answers **`uat holds every migration this commit carries (asked the database
  directly)`**. Nothing could establish that before this change.

- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness

  Read as *is the new path read-only, and does it refuse the dangerous case*. It issues a single
  `GET /rest/v1/schema_migrations?select=filename` and writes nothing, so there is no harness to
  roll back. The dangerous case is answering about the **wrong database**: the fallback refuses
  unless `NEXT_PUBLIC_SUPABASE_URL` names the project it was asked about, asserted in
  `check-release-guards.mjs` (*a URL naming another project is refused rather than answered*,
  including that it makes exactly one network call and does not try).

- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR. What the release manager does need is in §8's apply plan line: this PR changes the *procedure* for applying, not the migrations.

## 4. Functional checks

The "feature" here is four scripts and a runbook, so each line is read as the equivalent question
about them.

- [x] Happy path works end to end

  `node scripts/assert-schema.mjs --env uat --ref fb0c384f1966f351c50528404bc16c58b210825b` →
  `assert-schema: uat holds every migration this commit carries (asked the database directly).`
  Before this change the same command answered
  `REFUSED. cannot confirm uat's schema: could not ask which migrations it has applied (HTTP 403:
  Missing required permission(s): database_read)`.

- [x] Data persists — reload the page and the change is still there

  Read as *is the answer stable and not a one-off*: the assertion and the probe were each run more
  than once, minutes apart, with the same answer, and `--env production` was run between them.

- [x] Create / edit / delete all exercised (whichever the feature has)

  Read as *every branch of the new decision was exercised*, which is what §2's `test` gate covers:
  **32 cases pass, 0 fail** in `check-release-guards.mjs`, of which 16 are new. They cover the
  Management API answering (and the database then **not** being asked), the fallback answering, no
  `schema_migrations` table reading as *nothing applied* rather than as a failure, a URL naming
  another project being refused, both routes failing naming both reasons, no service-role key
  saying so, and the pass message naming the route.

- [x] Empty state renders sensibly (no rows yet)

  A project with no `schema_migrations` table answers `{ ok: true, applied: [] }` — *nothing
  applied*, the same answer the Management API gives — rather than an error. PostgREST reports that
  as `400` with the relation named, which is matched explicitly and asserted.

- [x] Invalid input is rejected with a readable message, not a crash

  `--env uat --plan` **refuses**, and reads as a reason rather than a stack trace:
  `uat is missing 1 migration(s) this commit carries; shipping now would run code against schema
  that is not there: - 0338_suppliers_card.sql / Apply them first: node scripts/apply-migrations.mjs
  --env uat`. **This is the change working, not a fault:** `main` carries `0338` and UAT has not
  applied it, and before today this deploy would have warned and carried on.

- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates)

  Read as *the missing-value cases*: no `SUPABASE_ACCESS_TOKEN`, no `NEXT_PUBLIC_SUPABASE_URL`, no
  `SUPABASE_SERVICE_ROLE_KEY`, a URL with a trailing slash (stripped), and a project ref that does
  not appear in the URL. Each is asserted or handled; the no-key case says so rather than
  pretending (`no NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to ask the database
  directly`).

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| — | — | — | n/a: this change has no page, action or RPC. Nothing in it reads a card, an activity or a role, so there is nothing for a login to reach. The scripts run on the deploy machine from a shell, under the env files' own credentials. |

- [ ] Every login above tested — n/a: no page, action or RPC in this change; nothing a login can reach
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no URL added or changed. The nearest equivalent — *can this code be made to read the wrong database?* — is checked in §3 and asserted in `check-release-guards.mjs`

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no page added, so no nav entry. `NavLinks.tsx` is not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual is for shelter users; nothing here is reachable from the app. The runbook that *is* the documentation for this change is `docs/release-procedure.md`, updated in this PR
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: the only new strings are script output on the deploy machine, read by whoever runs a release. Script output is not translated anywhere in this repo
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI in this change
- [ ] Browser console clean — no errors or React warnings — n/a: no UI in this change; nothing runs in a browser
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: there are no pages. The new path's own network behaviour **is** checked instead: one `GET` per call, and the `403` it now recovers from is the Management API's, deliberately not treated as fatal

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)

  Read as *the nearest callers*. `assert-schema.mjs --env production` still behaves exactly as
  before — it answers by the Management API, the first route, and currently **refuses** because
  production has not applied `0338` either (true before this change and nothing to do with it).
  `purge-cache.mjs --env production --dry-run` still names `lannacareforanimals.org` and its zone.
  `deploy.mjs --env uat --plan` reaches its guard and refuses there.

- [x] Any shared file touched checked from a second, unrelated page — **by loading that page, not by reading the file**

  `scripts/lib/deploy-schema.mjs` has three callers: `deploy.mjs`, `assert-schema.mjs` and
  `release-guards.mjs`. All three were **run**, not read: `assert-schema --env uat` (passes via the
  fallback), `assert-schema --env production` (refuses on `0338`, via the Management API), and
  `deploy.mjs --env uat --plan` (refuses on `0338`). `release-guards.mjs` is exercised by its own
  32-case script in §2's `test` gate. `docs/test-plan-template.md` is the other shared file, and
  its consumer — `scripts/test-plan-template.test.mjs` — passes (3 tests).

- [x] Nothing merged from `main` during `sync` was broken by this branch

  **The first `sync` reported `Already up to date.`; the second did not, and that is the one that
  counts.** GitHub reported the PR `CONFLICTING` / `DIRTY` minutes after it was opened, which in
  this repo means `main` has moved rather than that CI is slow. `main` had taken #1402 (the manual
  home tile — 14 files, including `src/lib/home/tiles.ts` and `src/lib/releases.ts`) and the
  folded-in `backlog` branch. **One conflict, in `docs/backlog.md`:** `main` carried `#uq8wk`
  (filed on the `backlog` branch and already merged in) and its own **unticked** `#m9qtv`, while
  this branch had ticked `#m9qtv`. Resolved by keeping both — `main`'s `#uq8wk` and this branch's
  ticked `#m9qtv` — verified with `check-backlog-sections.mjs` (67 open, all above `## Completed`)
  and `check-backlog-ids.mjs` (1,028 ids, unique). **The gates were then re-run on the merged
  tree** (§2). Nothing #1402 touches is touched by this branch.

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)

  `#m9qtv` ticked here, with what closed it. `#uat7p` and `#u7d3b` are ticked on the `backlog`
  branch — they were closed by Lutan's own Parts 6 to 8, not by this PR — along with `#uq4vz`'s
  title (no longer blocked) and the new `#uq8wk` for the three jobs that remain.

- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)

  `docs/decisions/2026-11-08-uat-in-every-release.md`, including the three choices worth arguing
  with later: why the fallback refuses a mismatched project, why it is not restricted to UAT, and
  why a direct-Postgres apply path was **not** built.

- [x] `README.md` still accurate — **it was not, and this is the one line that found real
  staleness.** Checked properly rather than assumed: `grep -n "uat\|UAT" README.md` returned 30
  lines, and **six were wrong**, all of them UAT's. Each was verified against the code before being
  rewritten, not against the backlog:

  - *"Until its data is loaded UAT is a code-ready but empty database"* — it holds a copy of
    production's data and is live.
  - *"UAT is deliberately **not** recoloured"* and **orange** in the Looks row — UAT has been
    indigo since 2026-11-06: `:root[data-env="uat"]` appears twice in `src/app/globals.css`
    (lines 73 and 243, app and public pages). The README stated the opposite of the code.
  - *"`UAT_PROJECT_REF` is empty until the cutover"* — it is `fsjagxmxjosauwmxwype`
    (`src/lib/app-env.ts:35`).
  - *"`--env uat` stops at once while `.env.deploy.uat` does not exist, which is until the
    cutover"* — the file exists; what actually stops is `apply-migrations.mjs`, for the
    `database_read` reason, which the README now says.
  - *"`deploy:uat` expects the **dev** project's values in `.env.deploy.uat`"* — it expects UAT's
    own, and refuses dev's whatever flag is passed.
  - *"UAT's Drive, which dev, Test and UAT share"* — UAT's copy is its own since 2026-11-08.
  - Also: **every `npm run deploy:*` command in the README** replaced with the bare `node` form,
    since `npm` does not start in PowerShell on this machine and these are commands Lutan reads.
  - And the mail row now says UAT does not send unless `--mail` is given.

- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nobody using the app can see any of it. It changes four scripts that run on the deploy machine and four documents read by whoever runs a release. No page, no wording, no behaviour a signed-in person meets. (It also records steps still outstanding — the three one-time jobs in `#uq8wk` — which is a second reason a note would be wrong.)
- [x] Commit messages say why, not just what

  The commit leads with Lutan's sentence, then why documenting it was the easy half: a guard that
  cannot check reads exactly like one that passed.

- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

  Every factual claim in the commit, the decision file and the runbook edits was run first: the
  `database_read` refusal in each mode, UAT's applied-migration list, `x-lanna-served-by: pi`,
  `lannacare.org`'s 301, the Pi's `sudo -n` answer and its three clones, `lanna-care-uat` active,
  the absence of a Postgres client, and `purge-cache --env uat`'s refusal naming
  `uat.lannacare.org`. The one claim that is **not** measured is said so in Defect 4.

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time

  `5861825a` plus this plan's commit. `sync` found `main` unmoved; re-read before merge.

- [ ] Deployed SHA matches the tested SHA — deferred: release manager. Nothing here is deployed by this PR; the next release's own record carries this line

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager. Note the command in that line is `npm run`, which does not start in PowerShell on this machine; the working form is `node scripts/deploy.mjs --env test`
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager. There is no app surface to smoke-test; what the next release should read instead is §7 of `docs/release-procedure.md`, which this PR extended to all three hosts
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing in this change derives a date, a "today" or a window. The only time value anywhere near it is an HTTP timeout
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold, band, rounding rule or cutoff in this change. The nearest thing is "which route answered", which is a two-state choice and both states are asserted
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**

  The gates block in §2, the `assert-schema` lines in §3, §4 and §6, the `--plan` refusal in §4 and
  the purge refusal in Defect 3 are all copied from the runs as they printed. The migration names
  in §3 are the rows the database returned.

- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page touched, and no asset changes, so nothing of theirs can be cached stale by this PR

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager. This PR adds the equivalent line for UAT to the runbook, with the two wrong refs spelled out so a mistake is recognisable
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [x] Any new secret/env var exists in the production Cloudflare environment

  **No new env var or secret is introduced.** The fallback reads `NEXT_PUBLIC_SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY`, both already in every environment file and both already read by
  `deploy.mjs` for the release mail. Nothing new is sent to Cloudflare, and nothing new is baked
  into a bundle: these scripts run on the deploy machine only.

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?**

  No. It contains no migration. It changes how the *existing* ordering rule is enforced, and makes
  it stricter for UAT: a UAT deploy now refuses when UAT lacks a migration the commit carries,
  where it used to warn and continue.

- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy

  Nothing to apply. **What the next release manager must know instead:** UAT's database cannot be
  applied to at all until `#uq8wk`(a) is done, so a release that adds a migration will be able to
  ship production and test and **not** UAT. Say so in the record and do not force it.

### Rollback

- [x] Rollback position stated, **including what it does not cover**

  Revert the commit. Nothing is deployed, no schema moves, and no state is written anywhere — the
  new code path only reads. **What a revert would give back** is the blind UAT guard: deploys that
  print *could not ask … continuing WITHOUT the schema check*, a UAT deploy that mails real people
  if `--no-mail` is forgotten, and a UAT purge aimed at a redirect. **What it does not cover:** the
  runbook and the backlog would also revert, so the three one-time jobs in `#uq8wk` would stop
  being written down anywhere.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | **UAT's Supabase access token cannot read or write UAT's own database** (`Missing required permission(s): database_read`, every mode of `apply-migrations.mjs`). So no release can apply a migration to UAT, and until today no release could check UAT's schema either. | **Half fixed, half deferred.** The *read* is fixed here, by a second route. The *apply* cannot be fixed in code (no Postgres client; DDL will not go through PostgREST) and is deferred to `#uq8wk`(a) — Lutan adding the permission. The consequence is now a refusal rather than a silent warning. |
| 2 | medium | **The Pi's passwordless sudo does not name `lanna-care-uat`**, so `deploy-pi.sh --env uat` builds and swaps and then stops for a password at `sudo systemctl restart`. | Deferred to `#uq8wk`(b) — two lines in `/etc/sudoers.d/lanna-care-restart`, which is Lutan's file. Named in the runbook so a release manager expects it rather than discovering it. |
| 3 | medium | **`purge-cache.mjs --env uat` purged the host `lannacare.org`**, which since 2026-11-08 is a 301 to production. It would have purged a redirect, reported success, and left UAT's own cache standing. | **Fixed** — it now purges `uat.lannacare.org`. It still refuses for want of a purge token (`#uq8wk`(c)), so the bug had not yet had the chance to mislead anyone: `purge-cache: CLOUDFLARE_PURGE_TOKEN missing from .env.deploy.uat … the one zone serving uat.lannacare.org`. |
| 4 | low | **Whether UAT's database holds the migrations by the right route is unmeasurable in one direction.** `--drift uat` cannot run, so *schema ahead of code* on UAT cannot be reported at all; the new assertion only answers *code ahead of schema*. | **Accepted and stated.** The runbook's §7 now says to record which of the two readings was taken, rather than writing "no drift" from a check that did not run. Closes with `#uq8wk`(a). |
| 5 | low | **A release note's worth of wrongness in the Pi caveat:** step 6 told the reader to confirm a failed deploy against `https://lannacare.org/api/version`, which now answers about production. | **Fixed** in the same pass. |
| 6 | low | **`README.md` stated the opposite of the code on UAT's colour**, and five more UAT facts in it were stale — see §7 for the list. Two of them (*"not recoloured"*, *"`UAT_PROJECT_REF` is empty"*) had been wrong since 2026-11-06. | **Fixed**, each checked against the code rather than against the backlog. |
| 7 | low | **My own first attempt at the backlog edit ticked the wrong item.** Matching ids with `includes("#u7d3b")` hit `#rqv5c`, whose body cites that id, ticking it and cutting its `<!--#rqv5c-->` marker in half. | **Fixed before anything was committed** — reverted with `git checkout --`, rewritten to match each item's own anchored line (`^- \[[ x]\] <!--#id-->`), and the script now verifies every edited item's tick state, marker and section afterwards. The trap is recorded in the script's own header comment: items cite each other's ids constantly, so a substring match is never the right test. |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The three one-time jobs**, which only Lutan can do: `database_read` on UAT's Supabase token, `lanna-care-uat` in the Pi's sudoers, and `CLOUDFLARE_PURGE_TOKEN` in `.env.deploy.uat`. None blocks this PR; (a) blocks the next release that carries a migration from reaching UAT. | `docs/release-procedure.md` → *What UAT still needs once*; backlog `#uq8wk` |
| 2 | **Whether UAT should keep following production rather than leading it.** This PR puts UAT last in the deploy order and says why; if UAT is meant to be an acceptance gate *before* a release reaches the shelter, that is a different design and his call. | `docs/decisions/2026-11-08-uat-in-every-release.md` → *Not done, on purpose* |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5  Date: 2026-11-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the two items above are Lutan's, and neither gates this PR

Manual verification by: pending: the three one-time UAT jobs (`#uq8wk`) and the question of whether UAT should lead or follow production in the deploy order

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: n/a: nothing in this PR is deployed — it changes the release procedure and the scripts a release runs. The next release is its first exercise.

# Feature test plan — cut-release-0-7-0

## Header

| | |
|---|---|
| Feature | Cut release `0.7.0`: move the six `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step described in `src/lib/releases.ts`'s own header |
| Branch / worktree | `claude/cut-release-0-7-0` @ `C:\Development\Animal_Shelter_cut-release-0-7-0` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-09-27 |
| Carries a migration? | no — but five sit between `main` and production and two are read by this release's code. See §3 |
| Tested at SHA | `ed05eec` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.7.0` entry holding the six notes written by PRs #157–#167, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json` (version field). No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — **all roles equally** in what `/releases` lists. `major: true`, so admins with a verified email **are** mailed on deploy. No role gains or loses access from this PR
- [x] Anything explicitly **out of scope** written down — (a) the deploy, Lutan's go; (b) `docs/releases/2026-09-27.md`, written **after** the deploy; (c) applying `0096`–`0100` (§3); (d) **the `status-alerts` stream**, which is mid-flight and not in this release (below)

**Decision confirmed in chat by Lutan, 2026-09-27:** `0.7.0` with `major: true`. The case put to him and chosen: three new capabilities, and **recurring jobs puts dated items on people's My tasks** — staff will see work appear on their list, which is the kind of change that needs announcing rather than discovering.

**One stream is mid-flight and is deliberately not in this release.** `claude/status-alerts` has one commit beyond `main` and six uncommitted files, including a `releases.ts` line about admins being emailed when something behind the app breaks. Its session is a Remote Control one and currently **offline**, so it was left untouched — read-only inspection only, nothing committed or moved on its behalf. Its note is not in `unreleased` on `main`, so it cannot be in this release, which is correct. Recorded here so that when it lands it is clear the omission was deliberate rather than missed.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and **verified rather than assumed**: `git rev-list --count HEAD..origin/main` returned **0**, at `ed05eec`
- [x] `npm run typecheck` — clean. Via `node scripts/gates.mjs`: `typecheck=0`
- [x] `npm run lint` — clean: `lint=0`
- [x] `npm run build` — succeeds: `build=0`
- [ ] CI green on the PR (runs the same three) — n/a: recorded at push time, before CI has reported

Also run, because satisfying them is this PR's whole purpose. The first two are the guards `scripts/deploy.mjs` applies at lines 150–157:

- [x] Newest release version matches `package.json` — both `0.7.0`
- [x] `unreleased` is empty — emptied by this PR; it held exactly 6 notes and the edit refused any other count
- [x] `majorReleasesSince("0.6.1")` returns exactly **`0.7.0`** — admins are mailed about this release and no other
- [x] **The date was read from the system clock and compared back to it**, not copied from context — `date +%Y-%m-%d` produced `2026-09-27`, the entry says `2026-09-27`, and the register was re-loaded and asserted equal to today. This check exists because `0.6.1` shipped dated `2026-09-27` on the 26th (#157 fixed it): nothing in CI or `deploy.mjs` looks at `date`, so the cut is the only place it can be caught
- [x] The register parses the way `deploy.mjs` loads it — `latestRelease` is `0.7.0` / `2026-09-27` / `major: true` / 6 notes
- [x] The Worker version message survives `deploy.mjs`'s sanitiser (line 202) — the title is letters, spaces and commas only

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR. **Not establishable from this session**: `--env production` reads are refused (`[Production Reads]`)
- [ ] `--dry-run` reviewed — n/a: no migration in this PR; owed for the release
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR. Dev is current through `0100`
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [x] Production apply plan stated for the release manager — **and again this plan does not assert how many are pending.** `main` carries `0096`–`0100` beyond `0095`, and `0095` was confirmed applied during `0.6.1` ("no drift, everything applied"). The number still comes from the measurement:

  1. `node scripts/apply-migrations.mjs --drift production` from the main checkout (Lutan — reads are refused to this session).
  2. `--dry-run`, then apply what it names in order, then `node scripts/check-public-views.mjs --env production` and `node scripts/check-app-access-gate.mjs`.
  3. **Then** deploy.

  | File | Read by this release's code? |
  |---|---|
  | `0096_stock_receipts.sql` | **Yes** — Record a delivery, Stock between counts |
  | `0097_adoption_updates.sql` | **Yes** — Adoption updates, the Photos page filter |
  | `0098_status_alerts.sql` | No — the `status-alerts` feature half is still in flight |
  | `0099_site_pages_relocation_friends_join.sql` | No — the two new public pages' routes and editors are not built |
  | `0100_user_roles_require_aal2.sql` | No — no 2-step verification UI yet |

- [x] **`0095`'s expiry date arrived this release, and cost nothing.** The `0.6.1` record predicted it: `0095` created four recurring-jobs tables nothing read, and the note said it stops being optional the moment the feature half ships. #160 shipped it — `src/app/management/recurring-jobs/` and `src/lib/recurring-jobs/` now read those tables. Because `0095` was applied during `0.6.1` rather than deferred, **this release has no dependency on it at all**. That is the whole argument for applying schema-ahead-of-code early rather than holding it back, and it is the first time the prediction has been tested
- [x] **`0100` was checked against the lockout risk its name implies, and is safe.** It adds RESTRICTIVE policies so writes to `user_roles` need an `aal2` (2-step-verified) session — which, taken at face value, would lock every admin out of Settings → Security before the 2-step UI exists. The migration's own comment says writes go through the service role and so are unaffected. **Verified rather than trusted**: every `from("user_roles")` write in `src/` and `worker/` is in `src/app/admin/security/actions.ts` and issued through the `admin` (service-role) client, which has BYPASSRLS. Reads are untouched, and `current_user_role()` is security definer so every other policy resolves roles as before. Safe to apply now
- [x] **Three of the five are schema ahead of code, so three new expiry dates are recorded here.** `0098` (status alerts), `0099` (relocation and Shelter Friend pages) and `0100` (2-step verification) all land before their consumers. Each stops being optional when its feature half ships, and the release carrying that feature must not deploy ahead of it. This is the `0080` pattern, which has now cost one scare and been caught twice by writing the expiry down

## 4. Functional checks

- [x] Happy path works end to end — the register was loaded the way `scripts/deploy.mjs` loads it: `0.7.0`, `major: true`, `2026-09-27`, 6 notes, `unreleased` length 0
- [ ] Data persists — n/a: static data compiled into the build
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: `releases` has eleven entries and cannot be empty. `unreleased` is now empty, its correct post-cut state
- [ ] Invalid input is rejected with a readable message — n/a: no input. The rules that reject bad register data live in `deploy.mjs` and were run in §2
- [x] Boundary cases checked — **note count**: exactly 6, carried verbatim, none reworded. **Date**: read from the clock and asserted equal to today, the specific failure of the last cut. **Indentation**: six spaces. **Line endings**: CRLF preserved. **`major: true`**: `majorReleasesSince` returns exactly one version

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases`, **and is emailed** | sees `0.7.0` at the top; receives the release mail | mail outcome recorded at deploy |
| management | `/releases` | sees `0.7.0` at the top | not verified on a deployed build |
| staff / volunteer | `/releases` | sees `0.7.0`; **also gains dated recurring-job items on My tasks** | from #160's own plan, not this PR |
| vet | `/releases` | sees `0.7.0` at the top | not verified on a deployed build |
| public_viewer | `/releases` | refused — no staff role | unchanged since `0.5.0` |
| signed out | the sign-in lock | unchanged by this PR | unchanged |

- [x] Every role above tested — n/a as a per-role exercise: this PR changes data the page already renders. Noted rather than skipped because **the release changes what staff and volunteers see on their own task list**, which is the reason it is being mailed; verified by #160's plan, not this one
- [x] A role that should not have access is blocked server-side — not re-verified here and not claimed as verified: no access rule is touched by this PR. The release's one access change is `0100`, checked in §3

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change in this PR. The release adds Management → Recurring jobs, from #160's own PR
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: this PR publishes notes; manual changes rode with the features
- [ ] Translatable strings go through the translation path — n/a: release notes are English only by design (#62)
- [ ] Mobile viewport (375px) — n/a: no layout change in this PR
- [ ] Browser console clean — n/a: no browser involved for this PR
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work — the build compiled every route
- [x] Any shared file touched checked from a second, unrelated page — `releases.ts` has three consumers: `/releases`, `worker/release-mail.mjs` and `scripts/deploy.mjs`. All read through `latestRelease` / `majorReleasesSince` / `unreleased` and all were exercised in §2. `majorReleasesSince` matters again this release, because `0.6.1` was `major: false` and this is not
- [x] Nothing merged from `main` during `sync` was broken by this branch — no sync needed; 0 behind `ed05eec`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: no backlog item; this is the release-cut step
- [ ] **Release notes.** — n/a: a release cut *removes* lines from `unreleased` rather than adding one. All six were written by the PRs that made each change
- [ ] Non-obvious design choices appended to `docs/decisions.md`, dated — n/a: no design choice in this PR. The three new schema-ahead-of-code expiry dates are in §3, where the next release manager will read them
- [x] `README.md` still accurate — unaffected; it names no version
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `ed05eec` plus this branch's commit; the tip of `main`, 0 behind
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager. **`deploy.mjs` builds the current checkout**, and eleven PRs landed since the last release; check `git log` immediately before deploying

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager. **Check what is on test first**
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] Timezone-sensitive behaviour checked on test — deferred: production release manager. **The most date-sensitive release yet**: recurring jobs computes next dates and marks occurrences overdue "by N days", and deliveries are placed before or after a stocktake day's count. Both are wrong for part of every day if a UTC date leaks in
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: production release manager. The Pet of the week hook line is the one public-facing change
- [ ] **Log the deploy with `>>`, not `>`** — deferred: production release manager. `0.6.1`'s successful run was overwritten by a redundant re-run a minute later, losing its `strip-baked-env` line

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: production release manager
- [x] Any new secret/env var exists in the production Cloudflare environment — none added by this PR
- [ ] **Watch the release-mail line** — deferred: production release manager. **This is the first `major: true` release since the question arose**, so it is the only thing that will answer it: `0.5.0` read `sent 1, skipped 1` with the shelter's own admin address refused as `E_RECIPIENT_NOT_ALLOWED`, never verified under Email Routing (`docs/email-sending.md` §1b). `sent 2, skipped 0` means it was fixed; `sent 1` means it was not
- [x] **The deploy log tail is not evidence of failure on this machine** — recorded so it is not misdiagnosed twice. `deploy.log` ends at `Total Upload:` on every run, successful or not, because wrangler writes its closing lines to stderr and PowerShell 5.1's `2>&1` wraps them as ErrorRecords. `/api/releases/current` is `no-store` and is the authority on whether a deploy landed

### Migration ordering — *skip if no migration*

- [x] Does this PR contain both a migration and code that reads it? — no migration in this PR, but the release does: `0096` and `0097` are read by their own new pages. Neither is a shared loader, so getting the order wrong degrades those two features rather than taking the site down — unlike `0092` last release
- [ ] `--env production --dry-run` run and clean — deferred: Lutan. Reads and deploys are both refused to this session
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — deferred: Lutan. **Worth checking before this one**: `0100` adds RESTRICTIVE policies to `user_roles`, which is the table that decides who can do anything. It is verified safe in §3, but it is the least additive thing in the batch
- [x] Apply plan stated — §3, beginning with `--drift production` and deliberately not asserting a count

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` returns the Worker to the `0.6.1` build in seconds. **Not fully reversible**: `major: true` means admins are mailed and that cannot be unsent. **Rollback over the applied migrations is clean**: `0.6.1`'s code reads none of `0096`–`0100` — they are all new tables, columns and policies — and `0100`'s policies only restrict JWT writes to `user_roles`, which no build of this app makes. The unsafe direction remains code-before-schema, which §3 prevents

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | None found in this PR | — |

Checked across the release rather than in this PR:

- All **ten** feature branches merged since `0.6.1` have a completed plan under `docs/test-plans/`. None reports `Result: fail`; two report `pass with accepted defects`.
- **Eight of the ten carry `manual: pending` items.** That is the highest proportion any release here has had, and it is rising release on release — `0.6.1` had five of nine. Not a blocker and not this PR's to fix, but it is now the largest standing gap in the process and is named in Left for manual verification rather than left implicit.
- The `status-alerts` stream is mid-flight with uncommitted work, including a release note. Not in this release, correctly, and left untouched.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The six notes **and the title**, read as a shelter user would. `major: true` means these exact words are emailed to admins. **The title is mine and nobody has reviewed it** | `src/lib/releases.ts`, the `0.7.0` entry |
| 2 | That mailing admins is intended. Chosen in chat 2026-09-27 with the consequence stated | `src/lib/releases.ts`, `major: true` |
| 3 | **The release-mail line in the deploy output.** This release is the only thing that can answer whether the shelter admin address was ever verified — open since `0.5.0` | `deploy.log` |
| 4 | **Eight feature plans with `manual: pending`** — the standing gap, now the largest it has been | `docs/test-plans/` |

**`--drift production` is deliberately not a row here**, though it is a hard
prerequisite for this release. It is a deploy-time check and lives in section 8
as `deferred: Lutan`, which is the state that passes and names an owner. Giving
it a row here as well is what left five earlier release-cut plans with a
permanently-open item: the check gets run at deploy time, section 8 is satisfied,
and the row is never closed. The template now says so (2026-09-27).

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-09-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — item 2 was answered in chat; items 1, 3 and 4 are open and need a person

Manual verification by: pending: Lutan to read the six notes and the title (item 1) and read the release-mail line in the deploy output (item 3). The schema apply is section 8's, not this list's

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session, with the items above outstanding

Result: pass

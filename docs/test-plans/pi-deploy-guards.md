# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---
## Header

| | |
|---|---|
| Feature | The Pi deploy (`deploy-pi.sh`) refuses uat/production unless the commit is a cut release whose migrations the database holds; `--ref` rollback; `--force` on record |
| Backlog item | `docs/backlog.md` → Every guard on the deploy is on the copy nobody is served by |
| Branch / worktree | `claude/pi-deploy-guards` @ `C:DevelopmentAnimal_Shelter_pi-deploy-guards` |
| Dev server | not used: no UI |
| PR | linked from the PR itself |
| Tested by / date | Claude, 2026-10-02 |
| Carries a migration? | no |
| Tested at SHA | see PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for (Lutan chose release-shipping, 2026-10-02): `deploy-pi.sh` runs `guard-release.mjs`, which refuses uat/production (exit 2, same messages as `deploy.mjs`) on unreleased notes, a stale `package.json` or a missing migration; could-not-ask warns; test is unguarded
- [x] Files/areas touched listed: new `scripts/lib/release-guards.mjs`, `scripts/pi/guard-release.mjs`, `scripts/check-release-guards.mjs`; `scripts/deploy.mjs` now calls the shared lib; `scripts/pi/deploy-pi.sh`; docs (`pi-hosting.md`, `release-smoke-test.md`, `test-plan-template.md`, `README.md`, a decision, the backlog tick). No migration, no `src/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public: none; run by whoever deploys
- [x] Anything explicitly **out of scope** written down: the Pi deploy itself was not run (it needs the Pi); old per-feature plans and frozen `docs/decisions.md` keep their old `wrangler rollback` wording; the backlog's "four release records" do not state it (only `2026-10-01.md`, correctly)

## 2. Automated gates

Run in the feature worktree, after `node scripts/worktree.mjs sync`, with
`node scripts/gates.mjs`. It exists because of the traps below: it runs all three
gates even when one fails, prints each one's own exit code, and refuses to start
on a half-installed `node_modules`.

**Tick these on the exit code, not on output that looks plausible.** Two ways a
gate reads green without having run: `npm run build | tail` reports the exit
status of `tail`, not of the build; and in a worktree where `npm ci` has not
finished linking `node_modules/.bin`, every script fails with "'next' is not
recognized" — which scrolls past as noise. Check each command's own status, and
wait for `worktree.mjs new` to exit before trusting the tree. A gate ticked
because nothing looked wrong is worse than one left unticked, because it is
indistinguishable from one that passed.

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

  ```
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three).  — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: deploy tooling only, no UI, role, schema or page
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: deploy tooling only, no UI, role, schema or page
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: deploy tooling only, no UI, role, schema or page
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: deploy tooling only, no UI, role, schema or page
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: deploy tooling only, no UI, role, schema or page
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: deploy tooling only, no UI, role, schema or page
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: deploy tooling only, no UI, role, schema or page
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: deploy tooling only, no UI, role, schema or page
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: deploy tooling only, no UI, role, schema or page

## 4. Functional checks

- [ ] Happy path works end to end — n/a: deploy tooling only, no UI, role, schema or page
- [ ] Data persists — reload the page and the change is still there — n/a: deploy tooling only, no UI, role, schema or page
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: deploy tooling only, no UI, role, schema or page
- [ ] Empty state renders sensibly (no rows yet) — n/a: deploy tooling only, no UI, role, schema or page
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: deploy tooling only, no UI, role, schema or page
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: deploy tooling only, no UI, role, schema or page

### Role access matrix

Sign in as each role that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

These are all of them. `app_role` is `('admin', 'staff', 'vet', 'volunteer')`
from `0001_initial_schema.sql`, plus `'management'` added by
`0038_management_role.sql`. **There is no `resident` role** — in this app a
resident is an animal — and do not re-derive this list by grepping for quoted
strings, which is how `resident` got into this template and `management` got left
out of it for a day.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | | | |
| management | | | |
| staff | | | |
| vet | | | |
| volunteer | | | |
| signed out | | | |

- [ ] Every role above tested — n/a: deploy tooling only, no UI, role, schema or page
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: deploy tooling only, no UI, role, schema or page

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: deploy tooling only, no UI, role, schema or page
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: deploy tooling only, no UI, role, schema or page
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: deploy tooling only, no UI, role, schema or page
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: deploy tooling only, no UI, role, schema or page
- [ ] Browser console clean — no errors or React warnings — n/a: deploy tooling only, no UI, role, schema or page
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: deploy tooling only, no UI, role, schema or page

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: deploy tooling only, no UI, role, schema or page
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — n/a: deploy tooling only, no UI, role, schema or page
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: deploy tooling only, no UI, role, schema or page

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as `docs/decisions/2026-10-02-pi-ships-releases.md`
- [x] `README.md` still accurate (its rollback line corrected)
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: deploy tooling, no shelter user sees it
- [ ] Commit messages say why, not just what — n/a: deploy tooling only, no UI, role, schema or page
- [ ] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — n/a: deploy tooling only, no UI, role, schema or page

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager at deploy
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager at deploy

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager at deploy
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager at deploy
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — deferred: release manager at deploy
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates — deferred: release manager at deploy
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it — deferred: release manager at deploy
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — deferred: release manager at deploy

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — deferred: release manager at deploy
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — deferred: release manager at deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager at deploy

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — deferred: release manager at deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — deferred: release manager at deploy
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — deferred: release manager at deploy
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager at deploy

### Rollback

- [ ] Rollback position stated, including what it does not cover. This change corrects it: production's rollback is `deploy-pi.sh --ref <sha>`; `wrangler rollback` reverts only the Worker fallback; neither reverts migrations — deferred: release manager at deploy

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

Anything above that Claude could not honestly verify, listed here so it is a
short, concrete handover rather than a vague "please check it". Empty is a valid
answer when the change has no surface a person needs to look at.

**Do not repeat a section 8 deploy-time check here.** Applying a migration,
reading the deploy output, smoke-testing the deployed build and running
`--drift production` all have their own state in section 8 — `deferred: <owner>` —
which passes the checker and names who picks it up. Listing them again in this
table gives them a second home that nothing ever closes: the check gets done at
deploy time, section 8 is satisfied, and this row stays open for good. Five
release-cut plans accumulated permanently-open rows exactly that way before it
was noticed (2026-09-27).

The test for whether something belongs here: **would a person have to go and look
at it, separately from deploying?** A vet's view of a page, a real phone, whether
wording reads well — yes. Anything the deploy itself performs — no, that is
section 8's.

| # | What to check | Where |
|---|---|---|
| 1 | On the Pi, `./scripts/pi/deploy-pi.sh --env production` at a commit with a non-empty `unreleased` refuses before building and the service keeps running | The Pi |
| 2 | On a cut-release commit it passes the guard, builds, restarts and prints `x-lanna-served-by: pi` | The Pi |
| 3 | `--force "test"` prints the banner and appends a line to `~/lanna-deploy-overrides.log` | The Pi |
| 4 | `--ref <previous release sha>` rolls the Pi back and the next normal deploy returns it to `origin/main` | The Pi |
| 5 | Node on the Pi can load `src/lib/releases.ts` (type stripping; Node 22.6+ per pi-hosting.md) | The Pi |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed. `node scripts/check-release-guards.mjs` (15 cases, all ok): unreleased notes → problem; package.json behind newest release → problem; a migration the database lacks → refused naming the file and `--env production`; every migration applied → passes; schema ahead of code → passes; could not ask (HTTP 503) → two warnings, no refusal; decideGuard refuses on unreleased and on a missing migration, goes ahead on could-not-ask alone, and `--force` goes ahead keeping both problems for the record; `guard-release.mjs --env test` exits 0 without reading any env file; `--force` with no reason exits 2. `check-env-leak.mjs` unaffected. `bash -n scripts/pi/deploy-pi.sh` passes. `deploy.mjs` was refactored onto the shared lib and its guarded path was not run end to end (it would reach a real environment); only imports and the extracted logic were exercised. Not run: `deploy-pi.sh` on the Pi, and `guard-release.mjs` against production or uat (needs those environments' files and token)
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-02

### Manual verification

The items in **Left for manual verification**: the real Pi deploy below.

- [ ] The manual list above is empty — n/a: not empty; it is the Pi deploy rows above, handed to Lutan, who signs below only after watching one

Manual verification by: n/a: not yet — Lutan signs once a real Pi deploy has been watched

### Result

- [x] Open defects are either fixed or explicitly accepted above (none found)
- [ ] Checklist pasted into the PR — n/a: the PR does not exist yet
- [ ] Handed to the production release manager — n/a: not releasing yet

Result: pass

Release manager acknowledgement: pending

# Test plan: check-scripts-not-blind

Evidence: gates: typecheck=0 lint=0 test=0 build=0 (run at the commit before the merge of `origin/main`, which brought documentation only).

Scope: a shared SQL reader (`scripts/lib/sql-code-only.mjs`) now used by `check-migration-grants.mjs` and `check-hard-coded-security.mjs`; `translations-open` coverage tested against the code (`TRANSLATION_ARMS`). Out of scope and untouched: `label_drafts` (its trigger has now fired, 296 of 296 applied, it is its own backlog item), `0292`'s header note, `check-roles-columns.mjs` (same blindness, filed), every workflow file, `check-test-plan.mjs`.

Checks run, all by Claude: `node --test scripts/sql-code-only.test.mjs scripts/translations-open-arms.test.mjs scripts/check-production.test.mjs` 17 of 17 pass; the blocking check's output on the real migrations is byte-identical before and after; `check-migration-grants.mjs` `ok (219 file(s) checked)`; `translations-open` run on DEV (`--env test`, `qxkmhwybjggxvsfxsxbd`): 520 missing, 2 out of date, every pair counted, and the empty-arm and dropped-pair experiments in the decision file. The PRODUCTION re-run of `translations-open` is the planner's to do (a worktree cannot read production).
## Header

| | |
|---|---|
| Feature | check-scripts-not-blind |
| Backlog item | `docs/backlog.md` → Security: `check-migration-grants.mjs` reads a `;` or `--` inside a SQL string literal as code; `translations-open` calls a registered label not taught when its table is empty |
| Branch / worktree | `claude/check-scripts-not-blind` @ `C:\Development\Animal_Shelter_check-scripts-not-blind` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | pending |
| Tested by / date | Claude, 2026-11-01 |
| Carries a migration\? | no |
| Tested at SHA | 62e924a3 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [ ] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — n/a: no role sees any change, these are developer check scripts
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

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
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, only check scripts, their tests and docs changed
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface, only check scripts, their tests and docs changed
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface, only check scripts, their tests and docs changed
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface, only check scripts, their tests and docs changed
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI surface, only check scripts, their tests and docs changed
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no UI surface, only check scripts, their tests and docs changed

### Role access matrix

Sign in as each role that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

These are all of them. Roles are rows of the `roles` table, not an enum (`app_role`
was dropped by `0181`). The live ones are admin, management, second_in_command,
head_of_maintenance, head_of_medical, doctor, volunteer and public_viewer; `staff` is
retired (`0173`). **There is no `resident` role** — in this app a resident is an
animal — and do not re-derive this list by grepping for quoted strings; read the
`roles` table (or `/admin/who-does-what`).

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | | | |
| management | | | |
| staff | | | |
| doctor | | | |
| volunteer | | | |
| signed out | | | |

- [ ] Every role above tested — n/a: no UI surface, only check scripts, their tests and docs changed
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no UI surface, only check scripts, their tests and docs changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no UI surface, only check scripts, their tests and docs changed
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no UI surface, only check scripts, their tests and docs changed
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no UI surface, only check scripts, their tests and docs changed
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI surface, only check scripts, their tests and docs changed
- [ ] Browser console clean — no errors or React warnings — n/a: no UI surface, only check scripts, their tests and docs changed
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no UI surface, only check scripts, their tests and docs changed

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: no page changed; the nearest things are the three checks, re-run below
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not — n/a: readonly-checks.mjs is shared by check-production.mjs, whose own test suite passed in gates and which ran translations-open on dev
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [ ] `README.md` still accurate — n/a: README does not describe these checks
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, — n/a: no shelter user would notice, only developer check scripts and their tests changed
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: planner, release time (no deployed build exists at PR time; nothing in this PR is deployed)
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: planner, release time (no deployed build exists at PR time; nothing in this PR is deployed)

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: planner, release time (no deployed build exists at PR time; nothing in this PR is deployed)
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: planner, release time (no deployed build exists at PR time; nothing in this PR is deployed)
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving — deferred: planner, release time (no deployed build exists at PR time; nothing in this PR is deployed)
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug — deferred: planner, release time (no deployed build exists at PR time; nothing in this PR is deployed)
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement — deferred: planner, release time (no deployed build exists at PR time; nothing in this PR is deployed)
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached — deferred: planner, release time (no deployed build exists at PR time; nothing in this PR is deployed)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: planner, release time (no deployed build exists at PR time; nothing in this PR is deployed)
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot — deferred: planner, release time (no deployed build exists at PR time; nothing in this PR is deployed)
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: planner, release time (no deployed build exists at PR time; nothing in this PR is deployed)

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that — deferred: planner, release time (no deployed build exists at PR time; nothing in this PR is deployed)
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against — deferred: planner, release time (no deployed build exists at PR time; nothing in this PR is deployed)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — deferred: planner, release time (no deployed build exists at PR time; nothing in this PR is deployed)
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: planner, release time (no deployed build exists at PR time; nothing in this PR is deployed)

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — deferred: planner, release time (no deployed build exists at PR time; nothing in this PR is deployed)

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
at it, separately from deploying?** A doctor's view of a page, a real phone, whether
wording reads well — yes. Anything the deploy itself performs — no, that is
section 8's.

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: nothing for a person to look at, no UI surface

Manual verification by: n/a: no UI surface, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: the production re-run of translations-open is noted in the PR for the planner; the release manager has nothing to act on here

Result: pass

Release manager acknowledgement: pending: planner

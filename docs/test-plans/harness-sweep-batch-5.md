# Feature test plan

## Header

| | |
|---|---|
| Feature | Harness sweep batch 5: the permissions-first ten. Five were already green; `weigh-first` and `recurring-jobs` fixed and green; `who-does-what` and `menu-coverage` fixed to run and left red for real reasons; `resident-sections` confirmed working (a snapshot tool) |
| Backlog item | `docs/backlog.md` → "Sweep the remaining red database harnesses in bounded batches" (stays open; the planner restates the count) |
| Branch / worktree | `claude/harness-sweep-batch-5` @ `C:DevelopmentAnimal_Shelter_harness-sweep-batch-5` |
| Dev server | `http://localhost:3006`, started only to run `check-resident-sections` |
| PR | opened after this commit; number on the PR |
| Tested by / date | Claude / 2026-10-27 |
| Carries a migration? | no |
| Tested at SHA | 55b77266 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the ten named harnesses were each run and given a verdict against dev; four needed script fixes, and two of the ten remain red because the database genuinely disagrees with the app
- [x] Files/areas touched listed: `scripts/check-{weigh-first,recurring-jobs,who-does-what,menu-coverage,permission-parity}.mjs`, `scripts/lib/permission-probes.mjs`, `docs/decisions/2026-10-27-harness-sweep-batch-5.md`
- [x] Roles affected identified: none at runtime; developer check scripts only
- [x] Anything explicitly out of scope written down: no migration, nothing under `src/` (so `fixed-for-now.ts` is not edited), the other red harnesses untouched, `docs/card-access-faults.md` not edited (no new card-access fault found)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly 
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Evidence below, as printed (it also runs `test`)
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
gates: typecheck=0 lint=0 test=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows in a `begin; … rollback;` harness — n/a: no migration; the harnesses themselves run in rolled-back transactions and each was re-run green after its fix (verdicts in the decision file)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: nothing to apply; nothing here touches production

## 4. Functional checks

- [x] Happy path works end to end: re-run against dev after the last edit: `check-weigh-first` 60 checks, 0 failed (GREEN); `check-recurring-jobs` HARNESS-OK; `check-who-does-what` 0 harness faults, red on FIXED_FOR_NOW (3 unlisted, 2 stale, 20 overlisted); `check-menu-coverage` 30 unexplained orphans on the six live roles; `check-permission-parity` HARNESS FAULT 0; `check-hard-coded-security.mjs` prints `no coded security outside the Admin bypass`; the five already-green ones were run green at the start; `check-resident-sections`: two full runs against dev wrote 600 probes each over all eight roles; the two runs differ on 38 of 600 on streaming shape only (same status and redirect), recorded in the decision file as a limit of the tool, not changed
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface, no stored data
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no UI surface
- [ ] Boundary cases checked — n/a: the harnesses' own boundary cases were kept except where the mechanism they tested is gone

### Role access matrix

No page, route or policy was added or changed, so no role's access changed. The harnesses are what assert role access; they were run.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | unchanged | n/a: developer scripts only |
| management | nothing new | unchanged | n/a: developer scripts only |
| staff | retired (0173) | unchanged | n/a: developer scripts only |
| doctor | nothing new | unchanged | n/a: developer scripts only |
| volunteer | nothing new | unchanged | n/a: developer scripts only |
| signed out | nothing new | unchanged | n/a: developer scripts only |

- [ ] Every role above tested — n/a: no UI or policy change; the harnesses probe admin, no role and custom roles, and the live roles are covered by `check-permission-parity` and the role-cards checks
- [ ] A role that should not have access is blocked server-side — n/a: no access was changed; the re-run harnesses assert exactly this for no-role and cell-less custom roles, and pass

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no `src/` change
- [ ] Manual updated — n/a: developer scripts only, nothing a shelter user reads
- [ ] Translatable strings go through the translation path — n/a: no strings added
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work: the app is not changed; `gates.mjs` build and test pass
- [ ] Any shared file touched checked from a second, unrelated page — n/a: `scripts/lib/permission-probes.mjs` is shared by three checks; `check-permission-parity` was run after the change (0 harness faults); `check-activity-lists` reads the list, not the two probe statements edited
- [x] Nothing merged from `main` during `sync` was broken by this branch (nothing was merged)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch: deliberately NOT ticked, the item stays open; the planner restates the red count
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-27-harness-sweep-batch-5.md` (also records Lutan's two 2026-10-27 decisions)
- [x] `README.md` still accurate (it does not describe these checks)
- [ ] **Release notes.** n/a: scripts only, no shelter user sees a check harness
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and the decision file were measured, not reasoned: every verdict rests on a run against dev on 2026-10-27; the 30-orphan figure and the who-does-what counts are the scripts' own output

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: nothing in the deployed build changed
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing in the deployed build changed
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic touched
- [ ] Boundary or banding change assertions cover both edges — n/a: no boundary logic changed
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: only the `gates:` line above, pasted as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy for this PR
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy for this PR
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: scripts and docs only; reverting the PR restores the previous checks

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | `check-who-does-what` is red: `FIXED_FOR_NOW` in `src/lib/permissions/fixed-for-now.ts` is out of date (2 stale, 20 overlisted of which 18 are the doctor under card testing, 3 unlisted shared/prerequisite boxes) | deferred to backlog: a short edit to that list once the doctor card testing settles |
| 2 | medium | `check-menu-coverage` is red: 30 pages the cells open that no held card reaches (dev, 2026-10-27) | accepted: the check is meant to stay red until the cards cover them |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is empty; there is no surface a person needs to look at

Manual verification by: n/a: scripts and docs only, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above (both listed under Defects)
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: nothing here is deployed

Result: pass with accepted defects

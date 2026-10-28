# Test plan: instruments-card-shaped-rest

## Header

| | |
|---|---|
| Feature | The three `record_intake` seeders run as a disposable Admin login |
| Backlog item | `.brief.md`: finish the card-shaped instruments, fix the three seeders |
| Branch / worktree | `claude/instruments-card-shaped-rest` @ `C:DevelopmentAnimal_Shelter_instruments-card-shaped-rest` |
| Dev server | n/a, no UI |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | 14754610 |

## 1. Scope and risk

- [x] Change is described in one sentence: check-medical-archive-roles, check-medical-soft-delete and check-diets-sheet seed through record_intake as a disposable Admin login instead of Management or a borrowed real Admin
- [x] Files touched: the three scripts above, `docs/decisions/2026-10-28-seeders-use-a-disposable-admin.md`, this plan
- [x] Roles affected identified: none, dev-only harness scripts
- [x] Out of scope: the app, `check-production.mjs`, the other instruments (already card-shaped in #1047)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (branch cut from current main; see gates output below)
- [x] `node scripts/gates.mjs` closing lines:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

soft-delete printed HARNESS-OK (all assertions); diets-sheet printed RESULT: GREEN. archive-roles seeds, then fails HARNESS-FAIL A (management could not archive a weight); the unmodified file from HEAD fails identically, so that is dev card state, recorded in the decision file.

- [x] Happy path works end to end: two of three harnesses pass in full; the third passes its seed
- [ ] Data persists — n/a: no stored data
- [ ] Create / edit / delete all exercised — n/a: no stored data
- [ ] Empty state renders sensibly — n/a: with no candidates the list prints "May owe a note: none." and the cut proceeds; the self-test covers the classifier, the cut path with an answer was not run, because that would change `releases.ts`
- [ ] Invalid input — n/a: scripts take no input
- [ ] Boundary cases — n/a: scripts take no input

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all roles | nothing, no app surface | n/a | n/a |

- [ ] Every role above tested — n/a: no app surface, a script and a CI output
- [ ] A role that should not have access is blocked server-side — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no user-facing behaviour
- [ ] Translatable strings — n/a: no UI
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The assertions under test in each harness are unchanged (diff touches only the seed block)
- [ ] Any shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked — n/a: no matching open item on this branch; the planner ticks it from the brief
- [x] Non-obvious design choices added as `docs/decisions/2026-10-28-seeders-use-a-disposable-admin.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: release tooling only; no shelter user can see it
- [x] Commit messages say why, not just what
- [x] Claims were measured by the runs above

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test — n/a: scripts and CI only, nothing is deployed
- [ ] Smoke-tested on `test.lannacare.org` — n/a: scripts and CI only
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no threshold or band
- [x] Evidence described in this plan is the tools' actual output
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — n/a: no deploy
- [ ] `strip-baked-env` seen — n/a: no deploy
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Production backup for destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: revert this PR; the scripts return to their old seeds

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | 1 | Low | archive-roles asserts Management can archive a weight; fails on dev, also before this change | deferred: Lutan builds card assignments |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is empty, no surface for a person to look at

Manual verification by: n/a: no UI or user-visible surface, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: handed over through the PR itself once it exists

Result: pass

Release manager acknowledgement: pending

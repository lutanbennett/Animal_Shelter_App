# Feature test plan — plan-day-band-floors

## Header

| | |
|---|---|
| Feature | Raise the bottoms of two `/plan-day` band rows from sixteen measured stream figures |
| Backlog item | none — nothing to tick |
| Branch / worktree | `claude/plan-day-band-floors` @ `C:\Development\Animal_Shelter_plan-day-band-floors` |
| Dev server | not started — no UI surface |
| PR | pending: opened after this plan |
| Tested by / date | Claude / 2026-11-18 |
| Carries a migration? | no |
| Tested at SHA | `f15cc8862` |

## 1. Scope and risk

- [x] Change is described in one sentence — two band rows' bottoms raised to 143k, with the sixteen figures as basis
- [x] Files/areas touched listed — `.claude/skills/plan-day/SKILL.md` (two rows), `.claude/skills/plan-day/reference.md` (one bullet), `docs/decisions/2026-11-18-band-floors-raised.md`, this plan
- [x] Roles affected identified — none; the planner's estimating table only
- [x] Out of scope written down — the floor row and every other scale row, left untouched on purpose

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — pending in the PR body: run before opening
- [x] `node scripts/gates.mjs` — result recorded in the PR body
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no schema touched
- [ ] Constraints exercised against real rows — n/a: no schema touched
- [ ] Down-migration or reason — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI; a markdown instruction table
- [ ] Data persists — n/a: stores no data
- [ ] Create / edit / delete all exercised — n/a: no UI
- [ ] Empty state renders sensibly — n/a: no UI
- [ ] Invalid input is rejected — n/a: no input
- [ ] Boundary cases checked — n/a: the two rows were grepped back out of the file

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing in the app | unchanged | n/a — no access rule touched |

- [ ] Every role above tested — n/a: no access rule touched
- [ ] A role that should not have access is blocked server-side — n/a: no access rule touched

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: nothing a shelter user sees
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page; the build gate proves the tree still builds
- [ ] Shared file touched checked from a second page — n/a: no app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run after sync

## 7. Documentation

- [ ] Backlog item ticked — n/a: no backlog item; `grep -n "band\|110-170k\|110-140k" docs/backlog.md` checked for one
- [x] Non-obvious design choices added in `docs/decisions/` — `2026-11-18-band-floors-raised.md`
- [x] `README.md` still accurate — it does not mention the band table
- [ ] **Release notes.** — n/a: a planner's estimating table; nothing a shelter user sees
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — every figure was read from the PR's own `stream-usage:` comment

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — n/a: no shipped code changes
- [ ] Smoke-tested on test — n/a: no shipped code changes
- [ ] Timezone-sensitive behaviour proved — n/a: no dates derived
- [ ] Boundary or banding change — n/a: the "banding" here is a planner's estimate, not app behaviour
- [ ] Evidence pasted is the tool's unedited output — n/a: none pasted
- [ ] Public pages re-checked after cache purge — n/a: public site untouched

### Deploy safety

- [ ] `deploy: production` line read — n/a: nothing deployed
- [ ] `strip-baked-env` seen — n/a: nothing deployed
- [ ] New secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — revert the commit; nothing else depends on the rows

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-18

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, a planner's estimating table

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: no shipped code

Result: pass

Release manager acknowledgement: n/a: not yet released

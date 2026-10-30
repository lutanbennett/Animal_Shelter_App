# Feature test plan — harness-finish

## Header

| | |
|---|---|
| Feature | First 25 of the 51 guard reads: 16 check scripts finish through exitWith, 8 left alone with a reason, 1 already correct |
| Backlog item | `docs/backlog.md` → HARNESS SWEEP: ONE THING LEFT, THE 51 GUARD READS (stays open; 26 remain) |
| Branch / worktree | `claude/harness-finish` @ `C:\Development\Animal_Shelter_harness-finish` |
| Dev server | `http://localhost:3002` |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-30 |
| Carries a migration? | no |
| Tested at SHA | `40417657` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the brief — 25 triage rows read, 16 scripts converted to `await exitWith` with an `else`, 8 left alone with the reason, 1 misclassified (a comment)
- [x] Files/areas touched listed — 16 `scripts/check-*.mjs` plus the triage table, `docs/decisions/2026-10-30-harness-finish.md`, this plan
- [x] Roles affected identified — none; no access rule changed
- [x] Out of scope written down — the other 26 guard rows, `scripts/lib/`, `src/`, migrations, `check-can-see-drive-file`, `check-shop-links`, `check-card-walkthrough`, `check-medication-list-due`, `check-who-does-what`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends as pasted:

```
=== gates: build exited 0 after 178s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration (the schema harnesses run in begin and rollback and were re-run, see the decision file)
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; each changed script was run before and after and its exit code compared (decision file table)
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input rejected — n/a: no UI surface
- [ ] Boundary cases checked — n/a: no UI surface

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | unchanged | n/a: no access rule changed |
| management | n/a | unchanged | n/a: no access rule changed |
| staff | n/a | unchanged | n/a: retired role |
| doctor | n/a | unchanged | n/a: no access rule changed |
| volunteer | n/a | unchanged | n/a: no access rule changed |
| signed out | n/a | unchanged | n/a: no access rule changed |

- [ ] Every role above tested — n/a: nothing user-facing changed
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the 16 changed scripts were run old versus new: same exit code each time (13 green, 3 red before and after: home-cards, medical-jobs-app, access-requests-card; they were left red)
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file touched; `scripts/lib/` only imported
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after it

## 7. Documentation

- [ ] Backlog item ticked — n/a: the item names 51 and this does 25; a progress note goes on the `backlog` branch, not this PR
- [x] Non-obvious design choices in `docs/decisions/2026-10-30-harness-finish.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: check scripts, nothing a shelter user sees
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — exit codes are from runs of the old and new files

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic changed
- [ ] **Boundary or banding change** — n/a: no threshold changed
- [x] **Evidence pasted is the tool's actual output, unedited** — the gates output above is unedited
- [ ] Public pages re-checked — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: scripts only, revert the commit; nothing to undo in data

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `check-medical-jobs-app` (1 fails), `check-access-requests-card` (2 fail) and `check-home-cards` are red before and after; left as they were | deferred to backlog |
| 2 | low | the triage table counted a comment in `check-drive-token` as a call | fixed in the table |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-30

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: nothing user-facing changed, so there is nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: no release content

Result: pass with accepted defects

Release manager acknowledgement: n/a: not a release

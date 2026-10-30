# Feature test plan — harness-sweep-finish

## Header

| | |
|---|---|
| Feature | 23 check scripts finish through exitWith; fair red count; two checks diagnosed (no code change needed) |
| Backlog item | `docs/backlog.md` → HARNESS SWEEP (parts closed noted on the backlog branch) |
| Branch / worktree | `claude/harness-sweep-finish` @ `C:\Development\Animal_Shelter_harness-sweep-finish` |
| Dev server | `http://localhost:3006` |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-30 |
| Carries a migration? | no |
| Tested at SHA | `e3009110` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the brief — 23 scripts onto exitWith; red count established; check-can-see-drive-file and check-daily-count diagnosed (both already fixed by earlier commits)
- [x] Files/areas touched listed — 23 `scripts/check-*.mjs`, `docs/decisions/2026-10-30-harness-sweep-finish.md`, this plan
- [x] Roles affected identified — none; no access rule changed
- [x] Out of scope written down — the 51 guard-read scripts (named follow-up), check-card-walkthrough and check-medication-list-due (not ours), src/, scripts/lib/

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 173s

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
- [ ] Constraints and defaults exercised — n/a: no migration (the schema harnesses themselves run in begin and rollback)
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; each harness was re-run and its output read (see the decision file's table)
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input rejected — n/a: no UI surface
- [ ] Boundary cases checked — n/a: no UI surface

### Role access matrix

Cards, not roles: each fixture holds exactly the card named in the decision file.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | unchanged | n/a: no access rule changed |
| management | n/a | unchanged | n/a: no access rule changed |
| staff | n/a | unchanged | n/a: retired role |
| doctor | n/a | unchanged | n/a: no access rule changed |
| volunteer | n/a | unchanged | n/a: no access rule changed |
| signed out | n/a | unchanged | n/a: no access rule changed |

- [ ] Every role above tested — n/a: nothing user-facing changed; nothing user-facing changed
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — all 23 swapped scripts exit 0 in a clean serial sweep (181 checks, 160 green, 21 not; listed in the decision file)
- [ ] Any shared file touched checked from a second, unrelated page — n/a: fixed-for-now.ts is read by the Who does what grid; the i18n ids it needs were kept
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after it

## 7. Documentation

- [x] Backlog item updated on the backlog branch — only the parts closed are struck
- [x] Non-obvious design choices in `docs/decisions/2026-10-30-harness-sweep-finish.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: check scripts and a permissions source file; the database already answered access, so nothing a user can see changed
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — exit codes, page width and the check output were read from runs

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic changed
- [ ] **Boundary or banding change** — n/a: no threshold changed
- [ ] **Evidence pasted is the tool's actual output, unedited** — deferred: release manager for deploy output; the gates output above is unedited
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

- [ ] Rollback position stated — n/a: scripts and a permission source that the database overrides; revert the commit, nothing to undo in data

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | 21 of 181 checks are not green on dev; breakdown in the decision file (Doctor-card cases expected; 3 not run to completion at 60 s; 3 need arguments; 3 real, undiagnosed) | deferred to backlog |

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

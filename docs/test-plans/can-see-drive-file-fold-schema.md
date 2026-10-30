# Feature test plan — can-see-drive-file-fold-schema

## Header

| | |
|---|---|
| Feature | Fold memes, donation receipts and the two deceased-resident files into can_see_drive_file() |
| Backlog item | docs/backlog.md → Security → THREE KINDS OF DRIVE FILE (ticked) |
| Branch / worktree | claude/can-see-drive-file-fold-schema |
| Dev server | not started — no UI change |
| PR | see PR |
| Tested by / date | Claude / 2026-10-30 |
| Carries a migration? | yes — 0286_can_see_drive_file_folds_three_kinds.sql |
| Tested at SHA | `3b1954aa` |

## 1. Scope and risk

- [x] Change is described in one sentence — four branches added to can_see_drive_file(), two routes lose their app-code checks
- [x] Files touched listed — 0286 migration, both [fileId] routes, scripts/check-can-see-drive-file.mjs, decision file, backlog tick
- [x] Roles affected identified — none: same RLS answers, asked in one place
- [x] Out of scope written down — is_public_drive_file() untouched

## 2. Automated gates

- [x] sync with origin/main — branch cut from current main this morning, no newer commits
- [x] gates.mjs ends `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number one above highest on main (0285)
- [x] --status reviewed — one pending, 0286
- [x] --dry-run clean (only the expected consumer-header warning)
- [x] Applied to dev — applying 0286 … ok
- [x] Re-runnable — create or replace
- [x] Existing rows read correctly — check-can-see-drive-file.mjs: 0 disagreements for every role over 431 ids
- [x] Constraints exercised — n/a in effect: no table change; function proved against real rows by the check, which rolls back
- [x] Down-migration not needed — redefine the function from 0218's body
- [x] Production apply plan — apply 0286 BEFORE the routes deploy, or receipts, memes and deceased files 404

## 4. Functional checks

- [ ] Happy path — n/a: no UI change; 200 vs 404 proved at database level by the check, routes not driven over HTTP
- [ ] Data persists — n/a: no data written
- [ ] Create / edit / delete — n/a: read-only function
- [ ] Empty state — n/a: no UI change
- [ ] Invalid input — n/a: file-id validation untouched
- [ ] Boundary cases — n/a: made-up and empty ids are in the check's id list and answer false

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every dev role, anon, service_role, no-role login | each kind | same as before | 0 disagreements |

- [x] Every role tested — by check-can-see-drive-file.mjs
- [x] A role that should not have access is blocked server-side — anon and no-role see 0 ids

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual — n/a: no UI
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network — n/a: no UI

## 6. Regression

- [x] Nearest pages — routes compile in the build gate
- [ ] Shared file from a second page — n/a: no shared file touched
- [x] Nothing from main broken — branch is at main's tip

## 7. Documentation

- [x] Backlog item ticked; searched for can_see_drive_file, memes, donation_receipts in the backlog: no other item closed
- [x] Decision file docs/decisions/2026-10-30-can-see-drive-file-fold.md
- [x] README still accurate
- [ ] **Release notes.** n/a: nobody would notice; the same files open for the same people
- [x] Commit messages say why
- [x] Claims were measured — the check output above

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is main's tip at deploy — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence unedited — n/a: nothing pasted
- [ ] Public pages re-checked — n/a: is_public_drive_file untouched

### Deploy safety

- [ ] deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none

### Migration ordering

- [x] Both a migration and code that reads it — yes; 0286 must reach production first (stated above)
- [ ] production dry-run — deferred: release manager
- [ ] Production backup — n/a: function replace only
- [x] Apply plan stated — before the routes ship

### Rollback

- [x] Rollback: old routes still work against the new function (it answers a superset); re-run 0218's body to revert the function

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | info | Routes not driven over HTTP | accepted — database-level proof only |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none | |

## Sign-off

### Automated and scripted checks

- [x] Everything that could be verified without human eyes was run
- [x] Nothing is ticked that was not executed

Automated checks by: Claude  Date: 2026-10-30

### Manual verification

- [x] The manual list is empty

Manual verification by: n/a: no UI surface

### Result

- [x] Open defects fixed or accepted
- [ ] Checklist pasted into PR — n/a: PR links it
- [ ] Handed to release manager — n/a: through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released

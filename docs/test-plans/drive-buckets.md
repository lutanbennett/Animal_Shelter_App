# Feature test plan

## Header

| | |
|---|---|
| Feature | Sort the shared Google Drive into Prod / UAT / Test buckets and remap test's database |
| Backlog item | `docs/backlog.md` → `#rqv5c` (not ticked: UAT half and the move to the shelter's account stay open) |
| Branch / worktree | `claude/drive-buckets` @ `C:\Development\Animal_Shelter_drive-buckets` |
| Dev server | n/a: scripts and one database remap, no page |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-07 |
| Carries a migration? | no |
| Tested at SHA | 79f92347 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a script sorts the one shared Drive tree into three bucket folders in the same account, and test's database is remapped onto its own copies of the 220 shared files
- [x] Files/areas touched listed: `scripts/drive-partition-tree.mjs` (new), `scripts/drive-remap-ids.mjs` (deceased-lock bypass), `docs/decisions/2026-11-07-drive-buckets.md`, `docs/pi-hosting.md`, this plan. No `src/`, no migration
- [x] Cards affected identified: none. No card's behaviour changes and Admin and the signed-out public are unaffected
- [x] Out of scope written down: the shared Google Calendar, moving to the shelter's own account, UAT's data restore, the 38 unreferenced files (see the decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` — all four gates exit 0, output below

```
=== gates: typecheck exited 0 after 73s
=== gates: lint exited 0 after 172s
=== gates: test exited 0 after 27s
=== gates: build exited 0 after 189s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [x] Existing rows still read correctly after the change (checked against real dev data): remap applied 291 values on dev, a re-run reports 0, and a real attachment resolves to its copy
- [ ] Constraints and defaults exercised — n/a: no schema change
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: production's database is never touched

## 4. Functional checks

- [x] Happy path works end to end: dry run, copy, remap, move on the real tree; rehearsed first on a throwaway tree
- [x] Data persists: a re-run of the move changes nothing, and the final counts are Prod 915 files, Test 462, UAT 0
- [ ] Create / edit / delete all exercised — n/a: the script creates, copies and moves only; there is no delete by design and none was run
- [ ] Empty state renders sensibly — n/a: no UI
- [ ] Invalid input is rejected — n/a: no UI (the script refuses missing roots and identical folders)
- [ ] Boundary cases checked — n/a: covered by the rehearsal of a file named by both, by one database, by neither, and by a lock-protected row

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | no page | n/a | n/a |

- [ ] Every login above tested — n/a: no page or card involved
- [ ] A login that should not have access is blocked server-side — n/a: no page or card involved

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: no UI surface
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work: none changed, no `src/` change
- [ ] Shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked — n/a: `#rqv5c` stays open on purpose; a note goes on the `backlog` branch
- [x] Non-obvious design choices added as `docs/decisions/2026-11-07-drive-buckets.md`
- [x] `README.md` still accurate: nothing in it describes this
- [ ] **Release notes.** n/a: no user-visible change, the files move inside the same account; and the environment settings that make the separation live are still Lutan's to change
- [x] Commit messages say why, not just what
- [x] Claims in the decision file were measured: counts and the proof file come from the run's own output

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager (after Lutan points test at its bucket)
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no threshold or band
- [ ] Evidence pasted is the tool's actual output — n/a: no pasted output beyond the gates block
- [ ] Public pages re-checked — n/a: no page changed

### Deploy safety

- [ ] Deploy line read — n/a: nothing deploys; the settings are Lutan's and listed in the decision file
- [ ] `strip-baked-env` seen — n/a: no deploy
- [ ] New secret/env var exists in production — n/a: no new variable; `GOOGLE_DRIVE_ROOT_FOLDER_ID` changes value, see the decision file

### Migration ordering — *skip if no migration*

- [ ] Migration and code together? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: no deploy. Drive moves are reversible by moving back (ids never changed); the test database remap can be reversed with the same map swapped

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Remap refused by the deceased-resident lock on first apply (statement rolled back, nothing changed) | fixed: sanctioned transaction-local bypass, approved by Lutan |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Change `GOOGLE_DRIVE_ROOT_FOLDER_ID` per environment (table in the decision file) and restart; then open a resident photo on test | dev machine secret files, Pi test clone |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-07

### Manual verification

pending: Lutan to change the per-environment Drive root setting, restart, and open a photo

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Lutan's settings change and a photo check

Manual verification by: pending: Lutan changes the settings and restarts

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — pending: after merge

Result: pass

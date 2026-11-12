# Feature test plan

## Header

| | |
|---|---|
| Feature | drive-sharing.mjs accepts --env production in report mode only |
| Backlog item | `docs/backlog.md` → #yy9fz (reporting half; deliberately NOT ticked, for the planner to file) |
| Branch / worktree | `claude/drive-sharing-report-production` @ `C:\Development\Animal_Shelter_drive-sharing-report-production` |
| Dev server | n/a: scripts-only change |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-11-12 |
| Carries a migration? | no |
| Tested at SHA | 610b7a65e |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the production refusal in `scripts/drive-sharing.mjs` now applies to `--remove`/`--restore` only.
- [x] Files/areas touched: `scripts/drive-sharing.mjs`, a decision file, this plan. Nothing under `src/`.
- [x] Cards affected: none. Admin and signed-out public unaffected; a planner-only script.
- [x] Out of scope: write paths, the test-tree guard, `docs/decisions/2026-11-10-drive-unshare.md`, any override flag, the production read itself.

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: stream is one day old and merges on green; main merged by the PR check
- [x] `node scripts/gates.mjs` ends with the gates line:

```
=== gates: lint exited 0 after 315s
=== gates: test exited 0 after 58s
=== gates: build exited 0 after 254s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: `--env production --remove` and `--env production --restore` each print the refusal and exit 2; `--env uat` report walked 347 folders, 916 files, 0 shared, 0 failed.
- [ ] Data persists — n/a: nothing is stored
- [ ] Create / edit / delete — n/a: the script's write paths are untouched
- [ ] Empty state — n/a: no UI
- [x] Invalid input rejected: `--remove --restore` together still gives "not both", exit 2.
- [ ] Boundary cases — n/a: single conditional
- [ ] Production report run — pending: the production report is the planner's to run (the harness classifier refused it from this worktree, as expected)

### Role access matrix

n/a: a local script, no page, no card.

- [ ] Every login above tested — n/a: no page
- [ ] A login that should not have access is blocked — n/a: no page

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual updated — n/a: planner-only script
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] Nearest behaviour checked: UAT report mode and both-flags refusal, run above.
- [ ] Shared file touched — n/a: no shared file touched
- [ ] Nothing merged from main broken — n/a: only a script changed

## 7. Documentation

- [ ] Backlog item ticked — n/a: #yy9fz deliberately left open; production's per-item state is still unread
- [x] Decision file `docs/decisions/2026-11-12-drive-sharing-production-report.md`
- [ ] README accurate — n/a: README does not mention the guard
- [ ] **Release notes.** n/a: a planner-only script guard; no user-facing surface
- [x] Commit messages say why
- [x] Claims were measured: the exit codes and UAT counts above are from real runs.

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — n/a: script is not deployed
- [ ] Smoke-tested — n/a: script is not deployed
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary/banding — n/a: no threshold
- [ ] Evidence is tool output — n/a: evidence above is unedited
- [ ] Public pages re-checked — n/a: no public surface
- [ ] `deploy: production` line — n/a: script is not deployed
- [ ] strip-baked-env — n/a: script is not deployed
- [ ] New secret/env var — n/a: none added
- [ ] Migration ordering — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — n/a: revert the commit; nothing deployed, nothing migrated

## Defects found

None.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Run `node scripts/drive-sharing.mjs --env production` bare and read the per-item state | the planner's machine |

## Sign-off

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-12

Manual verification by: pending: the production report is the planner's to run

- [ ] The manual list is not empty — pending: the production report is the planner's to run

### Result

- [x] Open defects are either fixed or explicitly accepted
- [ ] Checklist pasted into the PR — pending: pasted when the PR opens
- [ ] Handed to the production release manager — n/a: no deploy

Result: pass

Release manager acknowledgement: pending: release manager

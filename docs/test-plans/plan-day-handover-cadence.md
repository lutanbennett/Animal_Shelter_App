# Feature test plan — plan-day-handover-cadence

## Header

| | |
|---|---|
| Feature | plan-day: handover every nine merged streams |
| Backlog item | no backlog item; nothing to tick |
| Branch / worktree | `claude/plan-day-handover-cadence` @ `C:\Development\Animal_Shelter_plan-day-handover-cadence` |
| Dev server | n/a, no UI |
| PR | pending: opened after this plan passes the checker |
| Tested by / date | Claude / 2026-11-18 |
| Carries a migration? | no |
| Tested at SHA | a41315dc1 |

## 1. Scope and risk

- [x] Change is described in one sentence: the planner handover fires every nine merged stream PRs, not once per plan
- [x] Files touched: `.claude/skills/plan-day/SKILL.md`, `reference.md`, one decision file, this plan
- [ ] Cards affected — n/a: no app code, no card or permission behaviour changes
- [x] Out of scope: step 3 measurement slot, band and floor rows, rule 7, line 11, `docs/planner-handover.md`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ran; closing lines exactly as printed:

```
=== gates: typecheck exited 0 after 63s
=== gates: lint exited 0 after 173s
=== gates: test exited 0 after 47s
=== gates: build exited 0 after 160s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable file — n/a: no migration
- [ ] Existing rows still read — n/a: no schema touched
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path — n/a: a planner skill document, nothing runs
- [ ] Data persists — n/a: no data
- [ ] Create / edit / delete — n/a: no feature surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no inputs
- [ ] Boundary cases — n/a: no code; the nine-stream boundary is prose
- [ ] Every login tested — n/a: no access surface
- [ ] Server-side block — n/a: no access surface

## 5. Cross-cutting

- [ ] Nav entry — n/a: no page added
- [ ] Manual updated — n/a: the planner's skill is not in the app manual
- [ ] Translatable strings — n/a: no user strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network — n/a: no UI

## 6. Regression

- [x] Nearest content re-read: line 11, rule 7, step 3 and the band table are unchanged in the diff
- [x] Shared file SKILL.md read back after edit; the new counter and step 8 text grepped out and checked
- [x] Nothing merged from main during sync was broken by this branch (gates green after the merge)

## 7. Documentation

- [ ] Backlog tick — n/a: no open backlog item describes this; none filed
- [x] Design choices recorded in `docs/decisions/2026-11-18-handover-every-nine-streams.md`
- [ ] README — n/a: README does not describe the handover cadence
- [ ] **Release notes.** n/a: a planner's own process; nothing a shelter user sees
- [x] Commit messages say why
- [x] Claims were measured: the four edit sites were grepped before and after editing

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary assertions — n/a: no banding code
- [ ] Evidence unedited — n/a: gates output above is pasted as printed
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] Deploy target line — n/a: skill file, not deployed
- [ ] strip-baked-env — n/a: skill file, not deployed
- [ ] New secrets — n/a: none
- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — n/a: revert the commit; nothing deployed

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| none | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-18

- [ ] Manual list is empty — n/a: nothing for a person to look at

Manual verification by: n/a: skill wording only, nothing to look at

### Result

- [ ] Open defects fixed — n/a: none found
- [ ] Checklist pasted into the PR — n/a: PR body links the file
- [ ] Handed to release manager — n/a: no release surface

Result: pass

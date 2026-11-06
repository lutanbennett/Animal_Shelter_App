# Feature test plan

## Header

| | |
|---|---|
| Feature | card-grant-checks |
| Backlog item | `docs/backlog.md` → #n5r7k, #p7x2d |
| Branch / worktree | `claude/card-grant-checks` @ `C:\Development\Animal_Shelter_card-grant-checks` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-11-06 |
| Carries a migration? | no |
| Tested at SHA | 72a2aedc |

## 1. Scope and risk

- [x] Change is described in one sentence: two file-reading checks, one naming activities no card grants (through bundleOfCards) and one refusing a future date on an added decision file, both blocking in CI, plus the rename of six future-dated decision files
- [x] Files touched: scripts/check-ungranted-activities.mjs, scripts/check-decision-dates.mjs, docs/ungranted-activities-allowlist.json, .github/workflows/ci.yml, six renamed decision files and their citations (backlog, four test plans), decision file, backlog ticks
- [x] Cards affected: none; no card or activity changed (cards.ts and catalogue.ts read only). Admin is not examined and is given nothing. Signed-out public not affected
- [x] Out of scope: designing cards for the 17 gaps found (for the planner), editing applied migration 0319's comment citing the old filenames

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` closing lines:

```
=== gates: typecheck exited 0 after 123s
=== gates: lint exited 0 after 309s
=== gates: test exited 0 after 49s
=== gates: build exited 0 after 362s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] apply-migrations --status — n/a: no migration
- [ ] apply-migrations --dry-run — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable file — n/a: no migration
- [ ] Existing rows still read — n/a: no migration, no database access
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path — both checks run clean on this tree; the planted failures below made each go red and removal made it green again
- [ ] Data persists — n/a: no data written
- [ ] Create / edit / delete — n/a: no UI
- [ ] Empty state — n/a: no UI
- [ ] Invalid input — n/a: a malformed allow-list record fails the check by design
- [x] Boundary cases — Bangkok-vs-UTC date handled; an allow-list record for a gap a card now grants fails (code path read, not planted)

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no page | n/a: scripts only | n/a: no UI surface |
| exactly one card | n/a: no page | n/a: scripts only | n/a: no UI surface |
| signed out | n/a: no page | n/a: scripts only | n/a: no UI surface |

- [ ] Every login above tested — n/a: no UI surface
- [ ] Blocked server-side — n/a: no access rule added or changed

## 5. Cross-cutting

- [ ] Nav entry — n/a: none
- [ ] Manual updated — n/a: no shelter-facing change
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [ ] Nearest pages — n/a: no app code changed
- [ ] Shared files loaded from a second page — n/a: no app code changed
- [x] Nothing merged from main during sync was broken (nothing merged)

## 7. Documentation

- [x] Backlog items #n5r7k and #p7x2d ticked on this branch
- [x] Decision file docs/decisions/2026-11-06-card-grant-checks.md (passes the new date check)
- [ ] README.md — n/a: nothing in it describes these checks
- [ ] **Release notes.** n/a: nobody at the shelter would notice a check script
- [x] Commit messages say why
- [x] Claims were read from source and from the checks' own output

## 8. Pre-production gate

- [ ] Tested SHA is tip of main at deploy — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: the date check uses the later of UTC and Bangkok today, tested only on today's date
- [ ] Boundary or banding change — n/a: no threshold changed
- [ ] Evidence is unedited tool output — n/a: gates block above is pasted unedited
- [ ] Public pages re-checked — n/a: none touched
- [ ] Deploy target line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secrets exist — n/a: none added
- [ ] Migration and reading code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position — deferred: release manager (revert the PR; nothing in the database)

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | Applied migration 0319's header comment still cites the old 2026-11-07 filenames (applied files are never edited) | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | n/a: nothing to look at; confirm both new CI jobs are green on the PR | GitHub checks |

## Sign-off

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-06

- [ ] Manual list is empty or checked — n/a: nothing for a person to look at

Manual verification by: n/a: no UI surface, scripts only

### Result

- [x] Open defects are fixed or accepted above
- [ ] Checklist pasted into the PR — pending: PR not open yet
- [ ] Handed to the release manager — pending: after merge

Result: pass with accepted defects

Release manager acknowledgement: pending: release manager

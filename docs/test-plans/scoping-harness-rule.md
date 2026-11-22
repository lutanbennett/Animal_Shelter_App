# Feature test plan

## Header

| | |
|---|---|
| Feature | scoping-harness-rule |
| Backlog item | `docs/backlog.md` → #701vn |
| Branch / worktree | `claude/scoping-harness-rule` @ `C:\Development\Animal_Shelter_scoping-harness-rule` |
| Dev server | n/a: no UI |
| PR | see GitHub |
| Tested by / date | Claude, 2026-11-22 |
| Carries a migration? | no |
| Tested at SHA | cf25eaeb0 |

## 1. Scope and risk

- [x] Change is described in one sentence: a rule in CLAUDE.md plus disclaiming comments on three SQL harnesses, as the item asked
- [x] Files touched: `CLAUDE.md`, three files in `supabase/harness/`, a decision file, `docs/backlog.md`
- [ ] Cards affected — n/a: no behaviour changes, docs and SQL comments only
- [x] Out of scope: undoing 0430, any migration, a checker (not built, reasoned in the decision file)

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: branch cut from current main today, sync done at merge
- [x] gates run:

```
=== gates: typecheck exited 0 after 65s
=== gates: lint exited 0 after 210s
=== gates: test exited 0 after 63s
=== gates: build exited 0 after 312s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] status reviewed — n/a: no migration
- [ ] dry-run — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows — n/a: no migration
- [ ] Constraints exercised — n/a: no migration; harness edits are comment lines only
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path — n/a: no UI surface
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no UI surface
- [ ] Boundary cases — n/a: no UI surface

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| n/a | n/a | no access change | n/a |

- [ ] Every login tested — n/a: no access change
- [ ] Blocked server-side — n/a: no access change

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual — n/a: no UI
- [ ] Translatable strings — n/a: no UI
- [ ] Mobile viewport — n/a: no UI
- [ ] Console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [ ] Nearby pages — n/a: no app code touched
- [ ] Shared file touched — n/a: no shared app file touched
- [ ] Main merge not broken — n/a: docs and SQL comments only

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Decision file added: `docs/decisions/2026-11-22-scoping-harness-claims.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: nobody would notice, docs and harness comments only
- [x] Commit messages say why
- [x] Claims were measured: the 0328/0330/0335 counts come from reading the files, the underlying measurement is #1805's

## 8. Pre-production gate

- [ ] Tested SHA — deferred: release manager
- [ ] Deployed SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke test — deferred: release manager
- [ ] Timezone — n/a: no date logic
- [ ] Boundary — n/a: no thresholds
- [ ] Evidence unedited — n/a: gates output pasted as printed
- [ ] Public pages — n/a: no public change
- [ ] Deploy target — deferred: release manager
- [ ] strip-baked-env — deferred: release manager
- [ ] New secrets — n/a: none
- [ ] Migration with code — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — deferred: release manager

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

- [x] Everything verifiable was run, not assumed
- [x] Nothing is ticked that was not executed

Automated checks by: Claude  Date: 2026-11-22

- [ ] The manual list is empty — n/a: nothing for a person to look at

Manual verification by: n/a: nothing to look at

### Result

- [x] Open defects are fixed or accepted
- [ ] Checklist pasted into the PR — n/a: plan lives in the repo
- [ ] Handed to the release manager — pending: release

Result: pass

Release manager acknowledgement: pending: release

# Feature test plan

## Header

| | |
|---|---|
| Feature | Scoping paper for a public microchip register (a document only) |
| Backlog item | `docs/backlog.md` → #dqgy8 (not ticked; the paper does not close it) |
| Branch / worktree | `claude/microchip-register-paper` @ `C:\Development\Animal_Shelter_microchip-register-paper` |
| Dev server | n/a: nothing to run |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-11-15 |
| Carries a migration? | no |
| Tested at SHA | 9ba76b943 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a scoping paper, `docs/microchip-register-scope.md`, no build
- [x] Files/areas touched listed — `docs/microchip-register-scope.md` and this plan only
- [ ] Cards affected identified — n/a: no code changed, so no card, admin or public behaviour changes
- [x] Anything explicitly out of scope written down — schema, `src/`, `docs/backlog.md` and any public form are untouched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends with the four-gate line, all `0`

```
=== gates: typecheck exited 0 after 106s
=== gates: lint exited 0 after 281s
=== gates: test exited 0 after 86s
=== gates: build exited 0 after 331s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no schema change
- [ ] Constraints and defaults exercised — n/a: no schema change
- [ ] Down-migration written — n/a: no migration to undo
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code changed
- [ ] Data persists — n/a: no data written
- [ ] Create / edit / delete exercised — n/a: no feature
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected — n/a: no input
- [ ] Boundary cases checked — n/a: no code

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no page added | n/a |
| signed out | n/a | no page added | n/a |

- [ ] Every login above tested — n/a: no page or action added
- [ ] A login that should not have access is blocked server-side — n/a: nothing to access

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing a shelter user sees changes
- [ ] Translatable strings — n/a: no strings added
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page touched
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync was already up to date

## 7. Documentation

- [ ] Backlog item ticked — n/a: the paper does not close #dqgy8; the retitle is for the planner to file, in the PR body
- [ ] Decision file — n/a: the paper is itself the record; no decision has been made yet
- [ ] `README.md` still accurate — n/a: no behaviour changed
- [ ] **Release notes.** n/a: a paper; a shelter user sees nothing change.
- [x] Commit messages say why, not just what
- [x] Claims in the paper are sourced or marked "not established"; none was reasoned in place of measured

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header and is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no code
- [ ] Evidence pasted is the tool's actual output — n/a: only the gates block, pasted unedited
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: documentation only; reverting the commit removes it, nothing else depends on it

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing to look at | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-15

### Manual verification

- [x] The manual list above is empty, so there is nothing for a person to look at

Manual verification by: n/a: a paper; nothing on a screen to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: pasted after the PR exists
- [ ] Handed to the production release manager — n/a: a docs-only change with no deploy step

Result: pass

Release manager acknowledgement: pending: release manager's pre-deploy pass

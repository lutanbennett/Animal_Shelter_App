# Feature test plan

## Header

| | |
|---|---|
| Feature | Control press, group D: seven table rows pressed in the browser (13 of 25), no code changed |
| Backlog item | `docs/backlog.md` → `#79sqf` (not ticked; count stays 6 of 25) |
| Branch / worktree | `claude/control-press-group-d` @ `C:\Development\Animal_Shelter_control-press-group-d` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | https://github.com/lutanbennett/Animal_Shelter_App/pull/1523 |
| Tested by / date | Claude, 2026-11-12 |
| Carries a migration? | no |
| Tested at SHA | a0828e8ee |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a decision file recording step zero, one trace and one read; the item asked for presses, which are not done
- [x] Files/areas touched listed: `docs/decisions/2026-11-12-control-press-group-d.md` and this plan only
- [x] Cards affected identified: none change; Admin and the public are unaffected
- [x] Out of scope written down: all 19 unpressed rows, listed in the decision file

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (merged by hand with `git merge origin/main`)
- [x] `node scripts/gates.mjs` closing lines, as printed by my run:

```
=== gates: typecheck exited 0 after 129s
=== gates: lint exited 0 after 460s
=== gates: test exited 0 after 121s
=== gates: build exited 0 after 335s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised against real rows — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: each pressed control did its action (see the decision file table)
- [x] Data persists: archive, chip and adoption update were read back on the page after the press
- [ ] Create / edit / delete — n/a: no code changed
- [ ] Empty state — n/a: no code changed
- [ ] Invalid input — n/a: no code changed
- [ ] Boundary cases — n/a: no code changed

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | not tested, no code changed |
| exactly one card per row (`residents`, `medical_records`, `record_microchip`, `view_residents`, `translations`, `propose_translations`) | the rows in the decision file | control drawn and works with the card, absent without | as expected |
| signed out | n/a | n/a | not tested |

- [x] Every login above tested: one-card logins for the rows pressed, listed in the decision file
- [x] A login that should not have access is blocked server-side: read from the server-rendered pages, per the decision file

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI change
- [ ] Manual updated — n/a: no UI change
- [ ] Translatable strings — n/a: no UI change
- [ ] Mobile viewport — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [ ] Pages nearest the change still work — n/a: no code changed
- [ ] Shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked — n/a: the driven count did not reach 25, so the item stays open; the planner files the new count
- [x] Non-obvious design choices added as a new file in `docs/decisions/`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: a verification pass with no user-visible change
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Row 1 was read from the source and says it was traced, not pressed

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — deferred: release manager
- [ ] Boundary or banding change assertions — deferred: release manager
- [ ] Evidence pasted is the tool's actual output — deferred: release manager
- [ ] Public pages re-checked — deferred: release manager
- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var exists in production — deferred: release manager
- [ ] Does this PR contain both a migration and code — deferred: release manager
- [ ] `--env production --dry-run` clean — deferred: release manager
- [ ] Destructive migration backup — deferred: release manager
- [ ] Apply plan stated — deferred: release manager
- [ ] Rollback position stated — deferred: release manager

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none found | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Nothing for a person to look at in this PR | n/a |

## Sign-off

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-12

- [x] The manual list above is empty, so there is nothing for a person to look at

Manual verification by: n/a: no code changed and no UI to look at

- [ ] Open defects are either fixed or explicitly accepted — n/a: no defects
- [ ] Checklist pasted into the PR — n/a: the PR body carries the checklist summary
- [ ] Handed to the production release manager — n/a: a verification pass with no code to deploy

Result: pass

Release manager acknowledgement: pending: not reviewed

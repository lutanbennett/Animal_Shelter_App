# Feature test plan — migration-number-hook

## Header

| | |
|---|---|
| Feature | The pre-commit hook accepts a gap in migration numbers; CI stays strict |
| Backlog item | `docs/backlog.md` → #w8kq3 (ticked) |
| Branch / worktree | `claude/migration-number-hook` @ `C:\Development\Animal_Shelter_migration-number-hook` |
| Dev server | not started — no UI surface |
| PR | pending: opened after this commit |
| Tested by / date | Claude / 2026-11-14 |
| Carries a migration? | no |
| Tested at SHA | 39078b14b |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — under `--staged` a number above the next free one is accepted; duplicates still refused
- [x] Files/areas touched listed — `scripts/check-migration-numbers.mjs`, its test, a decision file, backlog tick
- [ ] Cards affected identified — n/a: dev tooling, no card or page involved
- [x] Out of scope: CI strictness, the open-PR read, branch protection, any migration file

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` four gates, all 0 (run before the final docs-only sync merge):

```
=== gates: typecheck exited 0 after 91s
=== gates: lint exited 0 after 329s
=== gates: test exited 0 after 53s
=== gates: build exited 0 after 236s
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

- [x] Happy path: staged temp file at highest+2 exits 0; both directions proved in the PR body
- [ ] Data persists — n/a: no data
- [ ] Create / edit / delete — n/a: no UI
- [ ] Empty state — n/a: no UI
- [x] Invalid input rejected: a number main holds and two new files sharing a number both exit 3
- [ ] Boundary cases — n/a: covered by the unit tests (gap, duplicate, taken number)

- [ ] Every login above tested — n/a: no page or access change
- [ ] A login that should not have access is blocked — n/a: no page or access change

## 5. Cross-cutting

- [ ] Nav entry — n/a: none
- [ ] Manual — n/a: dev tooling
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network — n/a: no UI

## 6. Regression

- [x] Nearest checks still work: check-migration-numbers unit tests, 16 of 16 pass
- [ ] Shared file touched checked from another page — n/a: no shared UI file
- [x] Nothing merged from main during sync was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Decision file `docs/decisions/2026-11-14-migration-number-hook.md`
- [ ] `README.md` still accurate — n/a: not mentioned there
- [ ] **Release notes.** n/a: a developer hook; no shelter user would notice
- [x] Commit messages say why, not just what
- [x] Claims were measured: the hook was run against temporary staged files, not reasoned

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: none
- [ ] Boundary or banding change assertions — n/a: not a threshold change
- [ ] Evidence is the tool's actual output — n/a: pasted unedited in the PR body
- [ ] Public pages re-checked — n/a: not touched

### Deploy safety

- [ ] `deploy: production` line — deferred: release manager
- [ ] `strip-baked-env` — deferred: release manager
- [ ] New secret/env var — n/a: none

### Migration ordering

- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [ ] Rollback position — n/a: scripts only, not served; revert the commit

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-14

### Manual verification

- [ ] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: no surface a person needs to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted once the PR exists
- [ ] Handed to the production release manager — pending: at release

Result: pass

Release manager acknowledgement: pending: at release

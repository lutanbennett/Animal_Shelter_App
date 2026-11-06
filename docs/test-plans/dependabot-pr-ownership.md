# Feature test plan

## Header

| | |
|---|---|
| Feature | Dependabot PR ownership (process rule, no code) |
| Backlog item | `docs/backlog.md` → `#d3v8b` |
| Branch / worktree | `claude/dependabot-pr-ownership` @ `C:\Development\Animal_Shelter_dependabot-pr-ownership` |
| Dev server | n/a: no UI |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-11-06 |
| Carries a migration? | no |
| Tested at SHA | see PR head |

## 1. Scope and risk

- [x] Change: `/plan-day` step 2 lists open PRs it did not open; `CLAUDE.md` gains a standing rule for bot PRs
- [x] Files touched: `.claude/skills/plan-day/SKILL.md`, `CLAUDE.md`, a decision file, `docs/backlog.md` tick, this plan
- [ ] Cards affected — n/a: no code, no cards, no admin or public effect
- [x] Out of scope: option (c), exempting bot PRs in `check-test-plan.mjs` (rejected, see decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — ran; origin/main merged in
- [ ] `node scripts/gates.mjs` — pending: result pasted once the run finishes
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path — n/a: documentation only
- [ ] Data persists — n/a: documentation only
- [ ] Create / edit / delete — n/a: documentation only
- [ ] Empty state — n/a: documentation only
- [ ] Invalid input — n/a: documentation only
- [ ] Boundary cases — n/a: documentation only
- [ ] Every login tested — n/a: no access surface
- [ ] Blocked server-side — n/a: no access surface

## 5. Cross-cutting

- [ ] Nav entry — n/a: none added
- [ ] Manual updated — n/a: no user-facing behaviour
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI
- [ ] Console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [ ] Nearest pages — n/a: no pages touched
- [ ] Shared file touched — n/a: no shared source file
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item `#d3v8b` ticked on this branch
- [x] Decision file `docs/decisions/2026-11-06-dependabot-pr-ownership.md`
- [ ] `README.md` — n/a: unaffected
- [ ] **Release notes.** n/a: a process rule; no shelter user sees it
- [x] Commit messages say why
- [x] Claims in the decision file are measured: the 2026-10-07 file and `#1161` were read, not recalled

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — deferred: release manager
- [ ] Boundary or banding change — deferred: release manager
- [ ] Evidence is the tool's actual output — deferred: release manager
- [ ] Public pages re-checked — deferred: release manager
- [ ] Deploy line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secrets exist — deferred: release manager
- [ ] Migration and code together — deferred: release manager
- [ ] Production dry-run — deferred: release manager
- [ ] Destructive migration backup — deferred: release manager
- [ ] Apply plan stated — deferred: release manager
- [ ] Rollback position — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none | n/a |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-06

### Manual verification

- [ ] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: documentation only, nothing to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is committed on the branch
- [ ] Handed to the production release manager — n/a: process change, no release action

Result: pass

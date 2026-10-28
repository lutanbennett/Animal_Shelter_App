# Feature test plan

## Header

| | |
|---|---|
| Feature | Card review 2 report: pages no card opens, and the cards proposed |
| Backlog item | `docs/backlog.md` → CARD REVIEW 2 OF 2 |
| Branch / worktree | `claude/card-review-2-report` @ `C:\Development\Animal_Shelter_card-review-2-report` |
| Dev server | n/a: report only, none started |
| PR | see PR |
| Tested by / date | Claude, 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | SHAHERE |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a report proposing cards for the pages no card opens, then stop
- [x] Files/areas touched listed: `docs/decisions/2026-10-28-card-review-2-report.md`, `docs/backlog.md` (tick), this plan; no `src/`, no migrations
- [ ] Roles affected identified — n/a: no role affected, nothing in the application changed
- [x] Out of scope written down: no card created, no migration, no code; the card set is Lutan's to approve

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines below

```
GATESHERE
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

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

- [ ] Happy path works end to end — n/a: documentation only, no UI surface
- [ ] Data persists — n/a: documentation only
- [ ] Create / edit / delete — n/a: documentation only
- [ ] Empty state — n/a: documentation only
- [ ] Invalid input — n/a: documentation only
- [ ] Boundary cases — n/a: documentation only

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all | nothing changed | n/a | n/a |

- [ ] Every role above tested — n/a: no access changed
- [ ] A role that should not have access is blocked server-side — n/a: no access changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no navigation change
- [ ] Manual updated — n/a: no user-facing change
- [ ] Translatable strings — n/a: no strings added
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no application files changed
- [ ] Shared file touched checked from a second page — n/a: no shared application file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: a report on the proposed cards; nothing a shelter user would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Page counts come from `check-menu-coverage.mjs`; the JOBS_OF_ROLE claim from a grep; the stock-usage read dependencies are explicitly marked unconfirmed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no boundary change
- [ ] Evidence pasted is the tool's actual output — n/a: only gate output pasted, unedited
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code together? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: docs only; reverting the commit is the whole rollback

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-28

### Manual verification

- [ ] The manual list above is empty — n/a: nothing for a person to look at; Lutan's yes or no on the card list is a decision, not a check

Manual verification by: n/a: documentation only, nothing to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — deferred: release manager

Result: pass

Release manager acknowledgement: n/a: not yet reached

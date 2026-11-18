# Feature test plan — migration-check-not-checked

## Header

| | |
|---|---|
| Feature | `check-migration-numbers.mjs` answers NOT CHECKED (exit 2, no rename advice) when it cannot read open PRs |
| Backlog item | `#mnchk` (ticked) |
| Branch / worktree | `claude/migration-check-not-checked` @ `C:\Development\Animal_Shelter_migration-check-not-checked` |
| Dev server | not started — developer script, no UI |
| PR | pending: number assigned on open |
| Tested by / date | Claude / 2026-11-18 |
| Carries a migration? | no |
| Tested at SHA | `5117b94fa` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a check that cannot read open PRs says NOT CHECKED instead of a verdict
- [x] Files/areas touched listed — `scripts/check-migration-numbers.mjs`, its test, `docs/decisions/2026-11-18-migration-check-not-checked.md`, `docs/backlog.md`, this plan
- [x] Roles affected identified — none; a developer instrument
- [x] Anything explicitly **out of scope** written down — migrations, `check-release-order.mjs`, `check-tenancy-canary.mjs`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main already merged, up to date
- [x] `node scripts/gates.mjs` — see PR body for the four-gate line
- [ ] CI green on the PR — n/a: read at merge time from the run for the head SHA

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest — n/a: no migration
- [ ] `apply-migrations --status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — four tests in `check-migration-numbers.test.mjs` drive a throwaway git repo: gh fails gives exit 2 NOT CHECKED; gh answers with a gap gives exit 1 and the rename; right numbering gives 0
- [ ] Data persists — n/a: no data
- [ ] Create / edit / delete — n/a: no data
- [x] Empty state — a gh outage with no new migration file exits 0 (tested)
- [ ] Invalid input rejected — n/a: no input
- [ ] Boundary cases — n/a: covered by the existing evaluate tests, unchanged

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all | n/a | n/a | n/a — developer script, no access rule |

- [ ] Every role tested — n/a: no access rule
- [ ] A role that should not have access is blocked — n/a: no access rule

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual updated — n/a: no UI
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — the existing 16 tests in the file still pass (20 in all with the 4 new)
- [ ] Shared file touched checked from a second page — n/a: no shared app file
- [x] Nothing merged from main during sync was broken — nothing merged

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` — #mnchk; neighbours searched, #y1x2r already ticked
- [x] Non-obvious design choices in `docs/decisions/` — exit code and note ordering
- [x] `README.md` still accurate — does not mention this script
- [ ] **Release notes.** — n/a: developer instrument; no shelter user would notice
- [x] Commit messages say why
- [x] **Claims were measured** — both paths run against a fixture repo

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — n/a: script only, nothing deploys
- [ ] Smoke-tested — n/a: script only
- [ ] Timezone-sensitive behaviour — n/a: none
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence is unedited tool output — n/a: no deploy
- [ ] Public pages re-checked — n/a: not touched

### Deploy safety

- [ ] Deploy line read — n/a: no deploy
- [ ] strip-baked-env — n/a: no deploy
- [ ] New secret/env var — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback position stated — revert the PR; the script is run on demand and holds no state

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-18

### Manual verification

- [x] The manual list above is empty

Manual verification by: n/a: no UI surface

### Result

- [x] Open defects are fixed or accepted
- [ ] Checklist pasted into the PR — n/a: PR body links it
- [ ] Handed to release manager — n/a: developer script

Result: pass

Release manager acknowledgement: n/a: not yet released

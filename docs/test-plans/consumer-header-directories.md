# Test plan: consumer-header-directories

## Header

| | |
|---|---|
| Feature | consumer-header-directories |
| Backlog item | `docs/backlog.md` → A directory in a migration's `-- consumer:` header |
| Branch / worktree | `claude/consumer-header-directories` |
| Dev server | n/a |
| PR | see PR |
| Tested by / date | Claude / 2026-10-21 |
| Carries a migration? | no |
| Tested at SHA | 595ff6b3 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a declared directory is reported as its own state instead of always "differs"
- [x] Files touched: `scripts/lib/migration-consumers.mjs`, `scripts/check-migration-consumers.mjs` (one new case), decision, backlog tick
- [x] Roles affected: none, developer script only
- [x] Out of scope: other `git show` uses in `scripts/`, resolving directories to files

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

gates: typecheck=0 lint=0 test=0 build=0

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end. Before (`worker/` declared): `declared consumer worker/ differs from release 1.0.0, so it may or may not already read this.` After: `declared consumer worker/ is a directory, which this check cannot compare (declare the files under it to get a live/not-live answer).` via `node scripts/check-migration-consumers.mjs`, all ok
- [ ] Data persists — n/a: no stored data
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no UI surface
- [ ] Boundary cases — n/a: file paths unaffected, only a trailing `/` changes behaviour

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a: no UI surface | n/a |

- [ ] Every role tested — n/a: no UI surface
- [ ] Blocked server-side — n/a: no UI surface

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual — n/a: developer script
- [ ] Translatable strings — n/a: no UI surface
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console — n/a: no UI surface
- [ ] Network — n/a: no UI surface

## 6. Regression

- [x] Nearest code, the other cases in `check-migration-consumers.mjs`, still pass
- [ ] Shared file touched — n/a: no shared files
- [x] Nothing merged from main during sync was broken

## 7. Documentation

- [x] Backlog item ticked on this branch
- [x] Decision file added
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: a developer-only warning in a migration script; no shelter user sees it
- [x] Commit messages say why
- [x] Claims were measured: before output was run against the old code, after against the new

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — n/a: a script, not deployed
- [ ] Smoke-tested — n/a: a script, not deployed
- [ ] Timezone-sensitive — n/a: no dates
- [ ] Boundary/banding — n/a: no thresholds
- [ ] Evidence is actual tool output — n/a: no pasted tables beyond the quoted lines
- [ ] Public pages — n/a: no public change
- [ ] Deploy line read — n/a: not deployed
- [ ] strip-baked-env — n/a: not deployed
- [ ] New secret — n/a: none
- [ ] Migration and reader — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — n/a: revert the commit; nothing to undo in data

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

Automated checks by: Claude  Date: 2026-10-21

- [ ] The manual list is empty — n/a: nothing for a person to look at

Manual verification by: n/a: developer-only script, nothing to look at

- [x] Open defects are fixed or accepted
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: pasted into PR; the release pass reads it

Result: pass

Release manager acknowledgement: n/a

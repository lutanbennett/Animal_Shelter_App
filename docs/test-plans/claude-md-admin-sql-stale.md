# Feature test plan

## Header

| | |
|---|---|
| Feature | CLAUDE.md: Admin decided in SQL by roles.is_admin (0277) |
| Backlog item | `docs/backlog.md` → none yet (for the planner to file) |
| Branch / worktree | `claude/claude-md-admin-sql-stale` @ `C:\Development\Animal_Shelter_claude-md-admin-sql-stale` |
| Dev server | n/a, docs only |
| PR | this PR |
| Tested by / date | Claude, 2026-11-16 |
| Carries a migration? | no |
| Tested at SHA | d4a433ba8 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: four stale CLAUDE.md sentences now say Admin is decided in SQL by roles.is_admin (0277)
- [x] Files/areas touched listed: CLAUDE.md, docs/decisions, docs/test-plans only
- [ ] Cards affected identified — n/a: no code or access change
- [x] Out of scope written down: no rule changed, no duplication removed, no migration

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends with the four-gate line, all 0:

```
=== gates: typecheck exited 0 after 11s
=== gates: lint exited 0 after 225s
=== gates: test exited 0 after 74s
=== gates: build exited 0 after 159s

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
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: documentation only
- [ ] Data persists — n/a: documentation only
- [ ] Create / edit / delete — n/a: documentation only
- [ ] Empty state — n/a: documentation only
- [ ] Invalid input — n/a: documentation only
- [ ] Boundary cases — n/a: documentation only

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| n/a | n/a | no access change | n/a |

- [ ] Every login above tested — n/a: no access change
- [ ] A login that should not have access is blocked — n/a: no access change

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no UI
- [ ] Translatable strings — n/a: no UI
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [ ] Pages nearest the change — n/a: no code changed
- [ ] Shared file touched checked from a second page — n/a: no app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked — n/a: no item exists; for the planner to file
- [x] Decision file added: docs/decisions/2026-11-16-claude-md-admin-sql-by-flag.md
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: a correction to the repository's own working instructions; no shelter user can see it.
- [x] Commit messages say why, not just what
- [x] Claims were measured: read 0277's function bodies and grepped later migrations

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: none
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence is the tool's actual output — n/a: gates output pasted above is unedited
- [ ] Public pages re-checked — deferred: release manager
- [ ] deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none
- [ ] Migration plus code — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — n/a: docs only, revert the commit

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | first gates run: build failed fetching Google Fonts (network) | fixed: rerun clean, all four 0 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-16

- [ ] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: documentation only, nothing to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: PR body links the plan
- [ ] Handed to the production release manager — n/a: docs only

Result: pass

Release manager acknowledgement: n/a: docs only

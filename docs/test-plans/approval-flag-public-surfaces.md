# Feature test plan

## Header

| | |
|---|---|
| Feature | approval-flag-public-surfaces: decision that no flag is wanted (docs only) |
| Backlog item | `docs/backlog.md` → #h3w7c |
| Branch / worktree | `claude/approval-flag-public-surfaces` @ `C:\Development\Animal_Shelter_approval-flag-public-surfaces` |
| Dev server | not started, no code changed |
| PR | see PR |
| Tested by / date | Claude / 2026-11-08 |
| Carries a migration? | no |
| Tested at SHA | e623ed27 |

## 1. Scope and risk

- [x] Change is described in one sentence: a decision file records that the donation QR and shelter-friend logo need no approval flag, and #h3w7c is ticked
- [x] Files touched: `docs/decisions/2026-11-06-approval-flag-public-surfaces.md`, `docs/backlog.md`, this plan
- [ ] Cards affected — n/a: no behaviour changes; admin and the public are unaffected
- [x] Out of scope written down: no migration, no src, `site_content_photos` and #7aev4's three items untouched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` closing lines, as printed:

```
=== gates: typecheck exited 0 after 155s
=== gates: lint exited 0 after 446s
=== gates: test exited 0 after 56s
=== gates: build exited 0 after 374s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on main — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration, nothing public changed
- [ ] Rollback harness — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path — n/a: docs only
- [ ] Data persists — n/a: docs only
- [ ] Create / edit / delete — n/a: docs only
- [ ] Empty state — n/a: docs only
- [ ] Invalid input — n/a: docs only
- [ ] Boundary cases — n/a: docs only

- [ ] Every login tested — n/a: no access changes
- [ ] Server-side block — n/a: no access changes

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual — n/a: no UI
- [ ] Translatable strings — n/a: no UI
- [ ] Mobile viewport — n/a: no UI
- [ ] Console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [ ] Nearest pages — n/a: no code changed
- [ ] Shared file touched — n/a: only backlog.md line tick
- [x] Nothing merged from main during sync was broken (gates green)

## 7. Documentation

- [x] Backlog item ticked on this branch
- [x] Decision recorded in docs/decisions
- [ ] README — n/a: unaffected
- [ ] **Release notes.** n/a: no user-visible change, docs only
- [x] Commit messages say why
- [x] Claims were measured: the gaps were read in the migration files and actions, not inferred

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: none
- [ ] Boundary assertions — n/a: none
- [ ] Evidence is unedited tool output — n/a: only the gates block, pasted as printed
- [ ] Public pages re-checked — n/a: nothing public changed
- [ ] Deploy target line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secrets — n/a: none
- [ ] Migration with code — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — n/a: docs only, revert the commit

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing | |

## Sign-off

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not executed

Automated checks by: Claude  Date: 2026-11-08

- [ ] Manual list is empty — n/a: nothing for a person to look at

Manual verification by: n/a: docs-only change with nothing to look at

### Result

- [x] Open defects are fixed or accepted (none)
- [ ] Checklist pasted into the PR — pending: pasted when the PR opens
- [ ] Handed to the release manager — n/a: no release content

Result: pass

Release manager acknowledgement: pending: release manager

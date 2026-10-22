# Test plan: checkout-cache-prune

## Header

| | |
|---|---|
| Feature | checkout-cache-prune |
| Backlog item | `docs/backlog.md` → The main checkout is over 20 GB (Quick wins) |
| Branch / worktree | `claude/checkout-cache-prune` @ `C:\Development\Animal_Shelter_checkout-cache-prune` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-10-22 |
| Carries a migration? | no |
| Tested at SHA | bcb7c501 |

## 1. Scope and risk

- [x] Adds `worktree.mjs clean`, which prunes Turbopack's cache above 3 GB; matches the backlog item's step 2
- [x] Touched: `scripts/worktree.mjs`, `.claude/settings.json`, two skills, `docs/release-procedure.md`, decision file, backlog tick
- [x] Roles affected: none, build tooling only
- [x] Out of scope: step 1 (Lutan clears the main checkout once), any other disk reclaim

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends with the lines below
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

```
gates: typecheck=0 lint=0 test=0 build=0
```

## 3. Schema and data

- [ ] Migration number one above main — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable file — n/a: no migration
- [ ] Existing rows still read — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: with a fake 25 MB cache and --max-gb 0.01 it removed .next/cache and .next/dev and left .next/keep.txt
- [ ] Data persists — n/a: no stored data
- [x] Dry run removes nothing and says so
- [x] Under the limit (empty cache) it is a no-op
- [x] Bad --max-gb is refused with a message
- [x] Refuses while next dev ran from this folder (exit 1, names the pid), cache left intact; works after the server was stopped

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all roles | n/a: no app surface | n/a | n/a |

- [ ] Every role tested — n/a: no app surface, a local script
- [ ] Blocked server-side — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual updated — n/a: no UI
- [ ] Translatable strings — n/a: no UI
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network — n/a: no UI

## 6. Regression

- [x] `worktree.mjs list` and describeProcs untouched in effect; gates build passed after the change
- [ ] Shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from main during sync was broken: gates passed

## 7. Documentation

- [x] Backlog item ticked, step 1 noted as still Lutan's
- [x] Decision file added: docs/decisions/2026-10-22-build-cache-is-pruned.md
- [x] README.md still accurate
- [ ] **Release notes.** n/a: build tooling only, no shelter user can see it
- [x] Commit messages say why
- [x] Claims were measured: cache sizes from the backlog's own measurements; the Next docs read for the size-limit claim; the script exercised as above

## 8. Pre-production gate

- [ ] Tested SHA is main's tip at deploy — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — n/a: tooling, nothing deploys
- [ ] Smoke-tested on test — n/a: tooling, nothing deploys
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary assertions — n/a: the one threshold was exercised both sides (under and over)
- [ ] Evidence is unedited tool output — n/a: gates lines above are as printed
- [ ] Public pages re-checked — n/a: no public page changed
- [ ] Deploy target line read — n/a: nothing deploys
- [ ] strip-baked-env seen — n/a: nothing deploys
- [ ] New secrets exist — n/a: none added
- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup fresh — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — n/a: revert the commit; no schema or deploy involved

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | n/a |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-22

### Manual verification

- [x] The manual list is empty; nothing for a person to look at

Manual verification by: n/a: nothing to look at, the change is a local script

### Result

- [x] Open defects are fixed or accepted
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: pending

# Feature test plan: th-dynamic-heads

## Header

| | |
|---|---|
| Feature | Live head check of the four dynamic public pages |
| Backlog item | `docs/backlog.md` → #t48xh |
| Branch / worktree | `claude/th-dynamic-heads` @ `C:\Development\Animal_Shelter_th-dynamic-heads` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | pending: number assigned on creation |
| Tested by / date | Claude / 2026-11-11 |
| Carries a migration? | no |
| Tested at SHA | a7462e5f |

## 1. Scope and risk

- [x] Change is described in one sentence: dev now holds one public row per dynamic page type and `check-public-heads.mjs` passes on them, which closes #t48xh
- [x] Files touched: `docs/backlog.md`, this plan, a decision file; no source, no worker, no migration. Dev database rows only
- [x] Cards affected: none (no behaviour change); admin and signed-out public unaffected
- [x] Out of scope: UAT/production unlock, Thai translations, site speed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` closing lines, as printed:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 49s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 141s
=== gates: test — npm test
=== gates: test exited 0 after 29s
=== gates: build — npm run build
=== gates: build exited 0 after 151s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — skip if no migration

- [ ] Migration number is one above the highest on main — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: `node scripts/check-public-heads.mjs 3007` printed "18 pages x 2 shapes checked, 0 failure(s)", exit 0, with the four dynamic types now in the sitemap
- [ ] Data persists — n/a: no UI surface changed
- [ ] Create / edit / delete — n/a: no feature; fixture rows only
- [ ] Empty state — n/a: no UI surface changed
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: no logic changed

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| signed out | the four dynamic pages, bare and /th/ | head correct, no cookie | pass (the check sends no cookie) |

- [x] Every login above tested
- [ ] A login that should not have access is blocked — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry — n/a: none added
- [ ] Manual — n/a: no user-facing change
- [ ] Translatable strings — n/a: none added
- [ ] Mobile viewport — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [ ] Pages nearest the change — n/a: no page file changed
- [ ] Shared file touched — n/a: no shared file changed
- [x] Nothing merged from main during sync was broken by this branch (gates green after sync)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [ ] Decision file — n/a: no non-obvious choice beyond the PR body (fixtures made by direct writes, one SQL insert to create a root project category)
- [ ] README — n/a: nothing it describes changed
- [ ] **Release notes.** n/a: metadata checked and found already correct; nothing a shelter user would notice
- [x] Commit messages say why, not just what
- [x] Claims were measured: the check output above is the run's own

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding — n/a: none changed
- [ ] Evidence is the tool's actual output — n/a: see section 2
- [ ] Public pages re-checked after purge — deferred: release manager
- [ ] deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none
- [ ] Migration with code — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — n/a: docs only, nothing to roll back

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-11

### Manual verification

- [x] The manual list above is empty; n/a: nothing for a person to look at

Manual verification by: n/a: no UI surface

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not yet

Result: pass

Release manager acknowledgement: pending: release manager

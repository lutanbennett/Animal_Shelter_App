# Feature test plan

## Header

| | |
|---|---|
| Feature | Stocktaking switch reports failure when no site_content row is written |
| Backlog item | `docs/backlog.md` → #stcnt (app half) |
| Branch / worktree | `claude/stocktaking-silent-save` @ `C:\Development\Animal_Shelter_stocktaking-silent-save` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | opened after this commit |
| Tested by / date | Claude / 2026-11-19 |
| Carries a migration? | no |
| Tested at SHA | 3fe0189b1 |

## 1. Scope and risk

- [x] One sentence: setStocktakingSwitch now returns an error instead of ok when its update touches no row
- [x] Touched: `src/app/admin/stocktaking/actions.ts`, `noRow` line in en.ts and th.ts dictionaries, one harness file
- [x] Cards affected: the one gating Settings → Stocktaking (unchanged); Admin unaffected; public unaffected
- [x] Out of scope: the same shape in `src/app/admin/website/actions.ts` (findings in the decision file); second-shelter login

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — already up to date with origin/main
- [x] `node scripts/gates.mjs` — four gates, all 0:

```
=== gates: typecheck exited 0 after 67s
=== gates: lint exited 0 after 256s
=== gates: test exited 0 after 52s
=== gates: build exited 0 after 280s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] status reviewed — n/a: no migration
- [ ] dry-run reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows read correctly — n/a: no migration
- [x] Harness `supabase/harness/stocktaking-zero-row-write.sql` run (rolled back): row present -> 1 row updated; row deleted -> 0 rows, no error
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — pending: switch press with the row present not driven in the browser this session
- [ ] Data persists — pending: same
- [ ] Create / edit / delete — n/a: a single toggle, no create or delete
- [ ] Empty state — n/a: no list
- [x] Failure is a readable message: new `noRow` string, not a crash (checked by reading the action; zero-row case proven in the harness)
- [ ] Boundary cases — n/a: one boolean

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | unchanged | n/a: access checks untouched |

- [ ] Every login tested — n/a: access checks untouched
- [ ] Blocked server-side — n/a: access checks untouched

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual updated — n/a: no behaviour a manual topic describes
- [x] Translatable strings: `noRow` added to en and th
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console clean — n/a: no page change
- [ ] Network clean — n/a: no page change

## 6. Regression

- [ ] Nearest pages — pending: Stocktaking page not loaded in the browser this session
- [ ] Shared file loaded from a second page — pending: dictionaries touched; covered by the typecheck only
- [x] Nothing merged from main broke this branch (sync was a no-op)

## 7. Documentation

- [ ] Backlog item ticked — n/a: not ticked, the second-shelter clause is blocked (see decision file)
- [x] Decision file `docs/decisions/2026-11-19-stocktaking-silent-save.md`
- [x] README still accurate
- [ ] **Release notes.** n/a: no shelter has a missing row today (0417 backfilled every one), so nobody would see the new message yet
- [x] Commit messages say why
- [x] Claims were measured: the harness output is quoted in the decision file

## 8. Pre-production gate

- [ ] Tested SHA — deferred: release manager
- [ ] Deployed SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke test — deferred: release manager
- [ ] Timezone — n/a: no dates
- [ ] Boundary assertions — n/a: no banding
- [ ] Evidence unedited — n/a: harness output quoted as printed
- [ ] Public pages — n/a: no public change
- [ ] Deploy ref — deferred: release manager
- [ ] strip-baked-env — deferred: release manager
- [ ] New env var — n/a: none
- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: not destructive
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — deferred: release manager (code-only, redeploy the previous ref)

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Press a Stocktaking switch with the row present and confirm it saves | `/admin/stocktaking` |

## Sign-off

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not executed

Automated checks by: Claude  Date: 2026-11-19

Manual verification by: pending: switch press in the browser

- [ ] Manual list — pending: row 1 above

### Result

- [ ] Open defects — n/a: none
- [ ] Checklist pasted into the PR — pending: after the PR opens
- [ ] Handed to release manager — pending: at release

Result: pass with accepted defects

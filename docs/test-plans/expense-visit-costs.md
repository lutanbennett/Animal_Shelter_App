# Feature test plan

## Header

| | |
|---|---|
| Feature | expense-visit-costs |
| Backlog item | `docs/backlog.md` → #c2m7w |
| Branch / worktree | `claude/expense-visit-costs` @ `C:DevelopmentAnimal_Shelter_expense-visit-costs` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | pending: opened after this commit |
| Tested by / date | Claude / 2026-11-07 |
| Carries a migration? | yes (0321) |
| Tested at SHA | 4d9898f2 |

## 1. Scope and risk

- [x] One sentence: vet visit costs appear in /management/expenses as one type, Veterinary, by month; matches the item and Lutan's 2026-11-05 choice
- [x] Touched: `src/app/management/expenses/page.tsx`, both dictionaries, `src/lib/releases.ts`, `supabase/migrations/0321_expense_report_visit_costs.sql`, decision file, backlog tick
- [x] Card affected: view_expenses (reports.expenses read) only; admin unchanged; signed-out refused as before
- [x] Out of scope: per-reason breakdown (declined), any new column, receipt links for visits, how cost is written

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in (one releases.ts conflict, both notes kept)
- [x] `node scripts/gates.mjs` all four exit 0:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 64s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 187s
=== gates: test — npm test
=== gates: test exited 0 after 34s
=== gates: build — npm run build
=== gates: build exited 0 after 166s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration 0321 is one above the highest on main (0320) and no other in-flight branch carries one
- [x] `--status` reviewed before applying
- [x] `--dry-run` reviewed (ok)
- [x] Applied to dev and recorded in schema_migrations (322 applied, 0 pending)
- [x] Re-runnable (create or replace)
- [x] Existing rows still read correctly: bill rows unchanged, months Nov 4,581 / Oct 16,163 / Sep 500 before; after, only visit sums were added (Oct +4,350, Sep +1,450, Aug +1,234.50)
- [ ] Constraints exercised in a rollback harness — n/a: no constraints or defaults; read-only function, checked against real dev rows instead
- [ ] Down-migration — n/a: restoring 0317's function body reverses it; no data is changed
- [ ] Production apply plan — pending: release manager applies 0321 to production before the deploy (additive; old function simply omits visits)

## 4. Functional checks

- [x] Happy path: visits show as Vet visit / Veterinary rows in each month, totals match SQL sums
- [ ] Data persists — n/a: read-only report
- [ ] Create / edit / delete — n/a: no writes on this page
- [x] Empty state unchanged (code path untouched)
- [ ] Invalid input — n/a: only input is the year link, unchanged
- [x] Boundary: cancelled, archived and cost-less visits excluded; Bangkok-day grouping

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | unchanged | not re-run: Admin bypass untouched |
| exactly view_expenses | /management/expenses | page loads with visit rows | pass |
| signed out | n/a | refused as before | not re-run: guard untouched |

- [x] The login above was tested
- [ ] Blocked server-side — n/a: function's own has_permission check is unchanged from 0317

## 5. Cross-cutting

- [ ] Nav entry — n/a: no new page
- [ ] Manual — n/a: no manual topic describes visit exclusion
- [x] Translatable strings in both dictionaries (Thai unreviewed)
- [ ] Mobile viewport — n/a: same table as before, one more row type
- [x] Console clean on the page
- [ ] Network — n/a: only the same RPC calls as before

## 6. Regression

- [x] Bill rows and receipt links on the same page still work (Receipt links, "no receipt" shown)
- [x] releases.ts conflict resolved; both notes present
- [x] Nothing merged from main broken (gates)

## 7. Documentation

- [x] Backlog #c2m7w ticked on this branch; #t5k9r deliberately left open (not changed)
- [x] Decision file docs/decisions/2026-11-06-expense-visit-costs.md
- [x] README still accurate
- [x] **Release notes.** Added to unreleased, tagged view_expenses
- [x] Commit messages say why
- [x] Claims measured: before/after totals read from the running page on dev

## 8. Pre-production gate

- [ ] Tested SHA is tip of main at deploy — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke test on test.lannacare.org — deferred: release manager
- [ ] Timezone behaviour — n/a: grouped by Asia/Bangkok in SQL, checked against SQL month sums
- [ ] Boundary assertions — n/a: no threshold or band change
- [x] Evidence is the tool's actual output
- [ ] Public pages — n/a: no public page touched
- [ ] Production target line — deferred: release manager
- [ ] strip-baked-env — deferred: release manager
- [ ] New secrets — n/a: none
- [ ] Contains migration and reading code: apply production first — deferred: release manager
- [ ] Production dry-run — deferred: release manager
- [ ] Destructive migration backup — n/a: additive function replacement
- [ ] Apply plan — deferred: release manager (0321, production, before deploy)
- [ ] Rollback — deferred: release manager (re-apply 0317's function; no data changed)

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Thai wording of Veterinary, the visit source label and the rewritten how-this-is-counted sentence (unreviewed) | /management/expenses in Thai |

## Sign-off

- [x] Everything verifiable without human eyes was run
- [x] Nothing ticked that was not executed

Automated checks by: Claude  Date: 2026-11-07

### Manual verification

- [ ] The manual list is not empty — pending: Thai wording review

Manual verification by: pending: Thai wording review

### Result

- [x] Open defects fixed or accepted
- [ ] Checklist pasted into the PR — pending: at PR creation
- [ ] Handed to release manager — pending: at merge

Result: pass

Release manager acknowledgement: pending: release manager

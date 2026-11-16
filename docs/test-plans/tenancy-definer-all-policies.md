# Feature test plan

## Header

| | |
|---|---|
| Feature | definer_all policy on donation_tax_ids and retention_runs |
| Backlog item | `docs/backlog.md` → #w4t9k |
| Branch / worktree | `claude/tenancy-definer-all-policies` @ `C:\Development\Animal_Shelter_tenancy-definer-all-policies` |
| Dev server | n/a |
| PR | pending: number assigned on creation |
| Tested by / date | Claude, 2026-11-16 |
| Carries a migration? | yes, 0388 |
| Tested at SHA | SHA_PLACEHOLDER |

## 1. Scope and risk

- [x] Change is described in one sentence: two RLS tables gain the `definer_all` policy for rls_definer so the strict tenancy lint is clean
- [x] Files touched: `supabase/migrations/0388_*.sql`, one decision file, this plan, the backlog tick
- [ ] Cards affected identified — n/a: the policy is `to rls_definer` only, no login or card sees any change
- [x] Out of scope: no change to the purge function, the workflow, `health.ts` or `.claude/` (reporting half recorded, not built)

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: branch was cut from current main minutes earlier
- [x] `node scripts/gates.mjs` closing lines:

```
GATES_PLACEHOLDER
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0387), checked by check-migration-numbers.mjs
- [x] `--status` reviewed: 388 applied, 1 pending
- [x] `--dry-run` reviewed: ok
- [x] Applied to dev (`qxkmhwybjggxvsfxsxbd`)
- [x] File is re-runnable (`drop policy if exists` then create)
- [ ] Existing rows still read correctly — n/a: policy applies to rls_definer only; no existing login's access changes
- [x] Strict lint after apply: `0 flagged (0 views, 0 functions, 0 tables missing definer_all), 2 allowed by name, 0 stale.`
- [ ] Down-migration — n/a: `drop policy definer_all on public.<table>` undoes it, harmless to leave
- [ ] Production apply plan — pending: rides the next release's normal migration apply; 0381 and 0385 reach production with it

## 4. Functional checks

- [ ] Happy path — n/a: no UI surface
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no UI surface
- [ ] Boundary cases — n/a: no UI surface
- [ ] Every login tested — n/a: no login's access changes
- [ ] A login without access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual — n/a: no UI surface
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console — n/a: no UI surface
- [ ] Network — n/a: no UI surface

## 6. Regression

- [ ] Nearest pages — n/a: no code change
- [ ] Shared file touched — n/a: none touched
- [x] Nothing merged from main broke this branch (branch is on current main)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Decision file `docs/decisions/2026-11-16-definer-all-two-tables.md`
- [x] README still accurate (not affected)
- [ ] **Release notes.** n/a: nobody outside the build can see a policy for an internal database role
- [x] Commit messages say why
- [x] Claims were measured: lint output and run history were read, not reasoned

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: none
- [ ] Boundary or banding — n/a: none
- [ ] Evidence is the tool's actual output — n/a: pasted unedited above
- [ ] Public pages — n/a: not touched
- [ ] Deploy safety ref — deferred: release manager
- [ ] strip-baked-env — deferred: release manager
- [ ] New secret/env var — n/a: none
- [ ] Migration and reading code in one PR — n/a: nothing reads the policy
- [ ] Production dry-run — deferred: release manager
- [ ] Destructive migration backup — n/a: additive policy only
- [ ] Apply plan stated — deferred: release manager (file 0388, project production, order relative to deploy does not matter)
- [ ] Rollback — n/a: purely additive; leave in place

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing | |

## Sign-off

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-16

- [ ] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: no UI surface and no access change

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body carries the summary
- [ ] Handed to the production release manager — pending: next release

Result: pass

Release manager acknowledgement: pending: next release

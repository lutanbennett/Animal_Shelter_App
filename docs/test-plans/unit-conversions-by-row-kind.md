# Feature test plan — unit-conversions-by-row-kind

## Header

| | |
|---|---|
| Feature | `item_unit_conversions` write policies ask the medications activity for medicine rows, diets for ingredient rows |
| Backlog item | `docs/backlog.md` → `#q7dn3` (ticked) |
| Branch / worktree | `claude/unit-conversions-by-row-kind` @ `C:\Development\Animal_Shelter_unit-conversions-by-row-kind` |
| Dev server | not started — no UI surface |
| PR | pending: opened after this commit |
| Tested by / date | Claude / 2026-11-10 |
| Carries a migration? | yes — `0352_unit_conversions_by_row_kind.sql` |
| Tested at SHA | `SHA` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — three write policies split by `item_kind`
- [x] Files/areas touched listed — `supabase/migrations/0352_unit_conversions_by_row_kind.sql`, `docs/backlog.md`, decision file, this plan
- [x] Roles affected identified — none today: the only screen is Admin-only (#j8vt4); card-shaped, whoever holds the two stock cells
- [x] Anything explicitly **out of scope** written down — read policy (0143), 0340's policies, `item-settings.ts`, production apply

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — done before merge
- [x] `node scripts/gates.mjs` ends all zero:

```
GATES
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` — 0352 after 0351
- [x] `--status` reviewed before applying — 353 applied, 0 pending
- [x] `--dry-run` reviewed — `0352 … ok`
- [x] Applied to **dev** and recorded — `applying 0352 … ok`
- [x] File is re-runnable — `drop policy if exists` / `create policy`
- [x] Existing rows still read correctly — read policy untouched
- [x] Constraints exercised in a rollback harness — (a), (b), (c) in the decision file: all as expected, (c) refused with the RLS message
- [x] Down-migration reason — not needed: restoring 0145's three policies reverses it
- [x] Production apply plan — pending behind 0348/0350/0351; pin with `--upto`

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface reachable by a non-Admin (#j8vt4); proved at database level, §3
- [ ] Data persists — n/a: policy-only change
- [ ] Create / edit / delete all exercised — n/a: exercised in the §3 harness
- [ ] Empty state renders sensibly — n/a: no UI
- [ ] Invalid input is rejected — n/a: the refusal is case (c) in §3
- [ ] Boundary cases checked — n/a: both item kinds covered in §3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| medication-Edit-only login | medicine unit rows | write | pass (harness) |
| diets-Edit-only login | ingredient unit rows | write | pass (harness) |
| diets-Edit-only login | medicine unit rows | refused | pass (harness) |

- [ ] Every role above tested — n/a: the three identities in the table were each exercised in the harness
- [ ] A role that should not have access is blocked server-side — n/a: that is case (c)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no app code changed
- [ ] Shared file touched checked — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run after sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` — `#q7dn3`; no other open item is closed
- [x] Non-obvious design choices in `docs/decisions/` — `2026-11-10-unit-conversions-by-row-kind.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: no visible change; a latent policy fault corrected behind an Admin-only screen
- [x] Commit messages say why
- [x] **Claims were measured, not reasoned** — harness output on dev

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence unedited — deferred: release manager
- [ ] Public pages re-checked — n/a: public site reads none of this

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none

### Migration ordering — *skip if no migration*

- [x] Migration and code reading it in one PR? — no; app already asks the right activity
- [ ] `--env production --dry-run` clean — deferred: release manager
- [ ] Production backup — deferred: release manager, because 0348 ahead of it is destructive
- [x] Apply plan stated — `--upto` pinned

### Rollback

- [x] Rollback position stated — re-create 0145's three policies; code unaffected

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | No card grants Edit on `stock.medications` or `stock.diets` | deferred to backlog: for the planner to file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — screen is Admin-only | |

## Sign-off

### Automated and scripted checks

- [x] Everything verifiable without human eyes was run
- [x] Nothing is ticked that was not executed

Automated checks by: Claude  Date: 2026-11-10

### Manual verification

- [x] The manual list above is empty

Manual verification by: n/a: Settings → Units is Admin-only (#j8vt4); proved at the database level instead

### Result

- [x] Open defects are fixed or accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released

# Feature test plan — stock-receipts-immutable

## Header

| | |
|---|---|
| Feature | A delivery's arrival figures can no longer be edited in place; only its cost can change (trigger on `stock_receipts`) |
| Backlog item | `docs/backlog.md` → **A delivery record can be EDITED by four roles** |
| Branch / worktree | `claude/stock-receipts-immutable` @ `C:\Development\Animal_Shelter_stock-receipts-immutable` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: number known once opened |
| Tested by / date | Claude / 2026-10-20 |
| Carries a migration? | yes — `0235_stock_receipts_cost_only_update.sql` |
| Tested at SHA | `SHA_HERE` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a delivery's arrival figures cannot change, the bills inbox can still write a cost, and three stale harness expectations are re-baselined with stated reasons
- [x] Files/areas touched listed — `supabase/migrations/0235_*`, `scripts/check-2ic-role.mjs`, `scripts/check-maintenance-role.mjs`, `docs/backlog.md`, one decision file, this plan
- [x] Roles affected identified — admin, management, 2IC and delivery lead lose in-place edits of a delivery (except cost)
- [x] Anything explicitly **out of scope** written down — two other failures in `check-maintenance-role`, reported in the decision file

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — SYNC_RESULT
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — GATES_RESULT
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` — 0235 against 0234; the only migration in the batch
- [x] `--status` reviewed before applying — dev 235 applied, 1 pending (this file)
- [x] `--dry-run` reviewed — `ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) — `applying 0235_stock_receipts_cost_only_update.sql … ok`
- [x] File is re-runnable — `create or replace function`, `drop trigger if exists`
- [x] Existing rows still read correctly — no data touched; the trigger fires on update only
- [x] Constraints exercised against real rows — `check-2ic-role`: a `note` update is refused for every role, a `cost` update succeeds for admin, management, 2IC and delivery lead (300 checks, GREEN)
- [x] Down-migration stated — `drop trigger stock_receipts_cost_only on stock_receipts`
- [x] Production apply plan stated — with the next release; `-- consumer: src/app/bills/actions.ts`, which already writes cost only

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface changed; the bills inbox update writes `{ cost }` only, which the trigger permits (probe asserted)
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: insert and delete probes in `check-2ic-role` unchanged and green
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input; the database refusal says to delete and record again
- [ ] Boundary cases checked — n/a: no UI surface

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | edit delivery note / cost | refused / allowed | as expected (harness) |
| management | same | refused / allowed | as expected (harness) |
| 2IC | same | refused / allowed | as expected (harness) |
| delivery lead | same | refused / allowed | as expected (harness) |
| volunteer, doctor, no role | edit delivery | refused | as expected (harness) |

- [x] Every role above tested — `check-2ic-role.mjs` GREEN, 300 checks
- [x] A role that should not have access is blocked server-side — the database refuses

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no screen or flow changed
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the only app writer of `stock_receipts` updates is `matchBill`, which sends `{ cost }`; the build gate compiles it
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` — ticked with a note on the four rulings
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-20-stock-receipts-cost-only-update.md`
- [x] `README.md` still accurate — it does not describe delivery editing
- [ ] **Release notes.** — n/a: no screen lets anyone edit a delivery in place, so no one would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — each ruling cites the migration read and the harness result

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no dates derived
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; the code needs no change
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: adds a trigger only
- [x] Apply plan stated — with the next release

### Rollback

- [x] Rollback position stated — drop the trigger; no data changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | `check-maintenance-role`: a doctor can mark another's recurring task done; the Head of Maintenance reaches a translation row | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-20

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released

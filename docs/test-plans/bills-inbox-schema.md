# Feature test plan

## Header

| | |
|---|---|
| Feature | Bills inbox, PR 1: record_attachment() accepts the four bill owner types |
| Backlog item | `docs/backlog.md` → "Photos of receipts for purchases and clinic visits" (the database function half only) |
| Branch / worktree | `claude/bills-inbox` @ `C:DevelopmentAnimal_Shelter_bills-inbox` |
| Dev server | not started: no UI surface |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-10-12 |
| Carries a migration? | yes: `0190` |
| Tested at SHA | `b3970401` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the brief asked for: `record_attachment()` accepts `clinic_visit`, `stock_receipt`, `bill_inbox` and `maintenance_bill`, nothing else
- [x] Files/areas touched listed: `supabase/migrations/0190_record_attachment_bills.sql`, `docs/decisions/2026-10-12-record-attachment-bills.md`, this plan
- [x] Roles affected identified: holders of `stock.delivery`, `medical.visits` (edit) or `maintenance.bills` can file bill photos through the function; a visiting doctor gains nothing (fences unchanged); nothing calls the new arms yet
- [x] Anything explicitly **out of scope** written down: all screens, the Drive folder and OCR (PR 2 and later)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [ ] CI green on the PR (runs the same three). n/a: not yet — the PR does not exist at this commit

```
=== gates: build exited 0 after 353s

gates: typecheck=0 lint=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `main` tops out at `0189`; the sync check printed "migration numbers: ok"
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: 189 applied, 1 pending (mine)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `0190` ok (consumer warnings are for files PR 2 adds)
- [ ] Applied to **dev** and recorded in `schema_migrations`. n/a: the runner refuses from a branch; applied from the main checkout after merge, by the planner or release manager
- [x] File is re-runnable: `add value if not exists`, `create ... if not exists`, `create or replace`, `drop policy if exists`, `on conflict`
- [ ] Existing rows still read correctly after the change. n/a: purely additive; existing owner-type cases in the four policies are copied from 0152 unchanged
- [ ] Constraints and defaults exercised against real rows in a `begin; … rollback;` harness. n/a: not run, listed under Left for manual verification; needs the function applied to dev first
- [x] Down-migration: not needed; to undo, re-run 0178's `record_attachment()` definition
- [x] Production apply plan: apply `0190` with the runner (`--status --env production` first); it is `create or replace` and nothing calls the new arms yet

## 4. Functional checks

- [ ] Happy path works end to end. n/a: no UI surface, no code reads these columns yet
- [ ] Data persists. n/a: no UI surface, no code reads these columns yet
- [ ] Create / edit / delete all exercised. n/a: no UI surface, no code reads these columns yet
- [ ] Empty state renders sensibly. n/a: no UI surface
- [ ] Invalid input is rejected with a readable message. n/a: no UI surface (the amount checks `>= 0` are in the table definitions)
- [ ] Boundary cases checked. n/a: no UI surface, no code reads these columns yet

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all roles | filing a bill photo through record_attachment() | allowed only with the matching activity; a clinic login refused for every bill type | not driven; read from the function and bill_owner_can(), to be exercised after apply |

- [ ] Every role above tested. n/a: nothing is applied to dev yet, so no role can be signed in against it
- [ ] A role that should not have access is blocked server-side. n/a: not driven, listed under Left for manual verification; the function fails closed (else false, then doctor_can_write_attachment false)

## 5. Cross-cutting

- [ ] Nav entry correct. n/a: no nav change
- [ ] Manual updated. n/a: no UI surface; the Bills topic lands with the screen streams
- [ ] Translatable strings. n/a: no strings
- [ ] Mobile viewport (375px). n/a: no layout change
- [ ] Browser console clean. n/a: no page changed
- [ ] Network clean. n/a: no page changed

## 6. Regression

- [x] The pages nearest the change still work: build compiled every route (`gates` build=0); `check-permission-catalogue` all ok; not loaded in a browser
- [ ] Any shared file touched checked from a second page. n/a: the dictionaries and catalogue gained one key each, nothing existing edited
- [x] Nothing merged from `main` during `sync` was broken by this branch: sync merged nothing

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch. n/a: the item closes with PR 2, which ticks it
- [x] Non-obvious design choices added as `docs/decisions/2026-10-12-record-attachment-bills.md`
- [ ] `README.md` still accurate. n/a: nothing it describes changed
- [ ] **Release notes.** n/a: schema only, nothing a shelter user would notice
- [x] Commit messages say why, not just what
- [x] Claims in the decision file were measured: `record_attachment()`, `bill_owner_can()` and `doctor_can_write_attachment()` were read; the latter returns false for any type but resident, blood_test and procedure

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time. deferred: release manager
- [ ] Deployed SHA matches the tested SHA. deferred: release manager

### On the deployed build

- [ ] Deployed to test. deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org`. deferred: release manager
- [ ] Timezone-sensitive behaviour proved. n/a: `bill_date` defaults to the database's `current_date` but nothing reads it yet
- [ ] Boundary or banding change covers both edges. n/a: no boundary or banding change
- [x] Evidence pasted into this plan is the tool's actual output, unedited
- [ ] Public pages re-checked. n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read. deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output. deferred: release manager
- [ ] Any new secret/env var exists in production. n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR? n/a: no, schema only; nothing reads it
- [ ] `--env production --dry-run` run and clean. deferred: release manager
- [ ] Destructive migration backup. n/a: additive, no existing data changes
- [x] Apply plan stated: `0190` to dev after merge, from the main checkout, then production at release

### Rollback

- [x] Rollback position stated: re-run 0178's `record_attachment()` definition; the new arms are only reachable through bill owner types

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| none | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | After apply to dev: a `begin; … rollback;` harness calling record_attachment() for each of the four types as Management (all succeed), a delivery-only login (delivery only), and a clinic login (all refused) | dev database, by the planner |
## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-12

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person. n/a: row 1 is open, signed as pending below

Manual verification by: pending: row 1 of Left for manual verification, after 0190 is applied to dev

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR. n/a: the PR does not exist at this commit
- [ ] Handed to the production release manager. n/a: not yet merged

Result: pass

Release manager acknowledgement: pending

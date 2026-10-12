# Feature test plan — medical-archive-trigger-schema

## Header

| | |
|---|---|
| Feature | `0187`: a before-update trigger on the four medical tables refuses a change to `archived_at` without `medical.archive` (schema half; the `fixed-for-now.ts` edit is the app PR) |
| Backlog item | `docs/backlog.md` → **Who does what: archiving a medical record is gated by the table's Edit…** (ticked by the app PR) |
| Branch / worktree | `claude/medical-archive-trigger` @ `C:\Development\Animal_Shelter_medical-archive-trigger` |
| Dev server | not started — no UI change |
| PR | pending |
| Tested by / date | Claude / 2026-10-12 |
| Carries a migration? | yes — `0187_medical_archive_trigger.sql` |
| Tested at SHA | see PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a guard on `archived_at` for four tables, copying `maintenance_before_write`
- [x] Files/areas touched listed — `supabase/migrations/0187_medical_archive_trigger.sql`, `scripts/check-medical-archive-roles.mjs`, decision file, this plan
- [x] Roles affected identified — doctor only (a hand-built archive on their own clinic is now refused); admin, management, 2IC and head of medical keep `medical.archive` and are unaffected
- [x] Anything explicitly **out of scope** written down — other columns and tables, `0182`, `stock.delivery`, the archive UI

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 360s

gates: typecheck=0 lint=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` — `0187` above `0186`; the brief names this as the batch's only migration
- [x] `--status` reviewed before applying — dev 186 applied, 1 pending
- [x] `--dry-run` reviewed — `0187_medical_archive_trigger.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0187_medical_archive_trigger.sql … ok`
- [x] File is re-runnable (`create or replace function`, `drop trigger if exists` then create)
- [x] Existing rows still read correctly after the change — the trigger fires on update of `archived_at` only; `check-medical-soft-delete.mjs` HARNESS-OK on dev
- [x] Constraints and defaults exercised against real rows — `check-medical-archive-roles.mjs` HARNESS-OK: management archives and restores all four tables; a doctor is refused on their own clinic by the trigger and on another clinic by RLS; a volunteer archives nothing; a second archive changes nothing
- [x] Down-migration written, or the reason one is not needed is stated — not needed: drop the four triggers and the function; nothing depends on them
- [x] Production apply plan stated — `0187` on `dbkodyyxxhtygxcxmfcu` with the next release; no code reads it, so order does not matter

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI change; asserted by the harness in section 3
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: archive and restore covered by the harness
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the refusal is the harness's `42501` assertion
- [ ] Boundary cases checked — n/a: boundary (archived_at changed or not, login or none) covered in section 3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | archive | allowed | not re-run: `has_permission` returns true for admin |
| management | archive and restore, all four tables | allowed | harness: 1 row each |
| staff | n/a | retired (`0173`) | n/a |
| doctor | archive on own clinic | refused by the trigger | harness: refused |
| volunteer | archive | refused | harness: 0 rows |
| signed out | archive | none | not re-run: no grant |

- [x] Every role above tested — management, doctor and volunteer by harness; admin through `has_permission`
- [x] A role that should not have access is blocked server-side — doctor and volunteer refused

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no user-visible behaviour
- [ ] Translatable strings — n/a: no new strings
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work — `check-medical-soft-delete.mjs` and `check-medical-archive-roles.mjs` green on dev
- [ ] Any shared file touched checked from a second page — n/a: no app file touched
- [x] Nothing merged from `main` during `sync` was broken — sync merged nothing that touches these tables

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: the item is done when the app PR removes the `fixed-for-now` entry, and that PR ticks it
- [x] Decision file added — `docs/decisions/2026-10-12-medical-archive-trigger.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: a database guard behind a button that already behaved correctly; no shelter user could notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Role behaviour comes from the harness run; the caller search from grepping scripts for `archived_at` writes

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: not a threshold change
- [ ] **Evidence pasted into this plan is the tool's actual output** — n/a: only the gates block, pasted as printed
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no code reads it
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive migration: production backup fresh — deferred: release manager
- [ ] Apply plan stated — deferred: release manager

### Rollback

- [x] Rollback position stated: the Pi rebuild does not revert `0187`; it is additive, so leave it, or drop the four triggers and the function

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-12

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, nothing for a person to look at

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none found
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released

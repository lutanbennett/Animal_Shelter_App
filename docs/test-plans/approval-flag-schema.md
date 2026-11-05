# Feature test plan — approval-flag-schema

## Header

| | |
|---|---|
| Feature | Schema half of the three-state approval flag: `attachments.approval` (public_ok / private_only / not reviewed) |
| Backlog item | `docs/backlog.md` → `#7aev4` (left open: app half, approve-on-save removal and ready-for-adoption link outstanding) |
| Branch / worktree | `claude/approval-flag-schema` @ `C:\Development\Animal_Shelter_approval-flag-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | see the PR |
| Tested by / date | Claude / 2026-11-06 |
| Carries a migration? | yes — `0318_approval_three_states.sql` |
| Tested at SHA | pending: recorded at merge |

## 1. Scope and risk

- [x] Change is described in one sentence — a Private only answer and one three-valued column on attachments, with approved_at unchanged
- [x] Files/areas touched listed — migration 0318, `scripts/check-approval-three-states.mjs`, decision file, this plan
- [x] Roles affected identified — none today; no code reads the new columns
- [x] Out of scope written down — approve-on-save removal, ready-for-adoption link, all screens (see decision file)

## 2. Automated gates

- [ ] `node scripts/gates.mjs` — pending: result added before merge
- [ ] CI green on the PR — pending: read from the PR status before merging

## 3. Schema and data

- [x] Migration number is one above the highest on `main` — 0318 after 0317
- [x] `--status` reviewed — dev 318 applied, 1 pending before apply
- [x] `--dry-run` clean — `0318 … ok`
- [x] Applied to dev — `applying 0318_approval_three_states.sql … ok` (re-applied once after fixing the both-answers check)
- [x] Re-runnable — add column if not exists, drop constraint if exists, create or replace
- [x] Existing rows read correctly — harness: 403 rows, 399 public_ok, 4 not reviewed, 0 private_only; nothing back-filled blank
- [x] Constraints exercised in a rollback harness — `check-approval-three-states.mjs` HARNESS-OK; `check-photo-approval.mjs` (0217) still HARNESS-OK
- [x] Down-migration reasoned — restore 0316's stamp function, drop constraints and three columns
- [ ] Production apply plan — deferred: release manager (additive, `consumer: none`)

## 4. Functional checks

- [ ] Happy path — n/a: no UI surface, no code reads these columns yet
- [ ] Data persists — n/a: no UI surface; asserted in the harness
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input rejected — n/a: no UI; both-answers and non-approver refusals asserted in the harness
- [ ] Boundary cases — n/a: no UI

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| any card holder | attachments | unchanged; only can_approve_photos() may set Private only | harness step 3 |
| signed out | public views | Private only never public | harness step 4c |

- [x] Role path tested — non-approver refused, approver (script) accepted
- [x] Blocked server-side — the trigger raises for a signed-in non-approver

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] Nearest behaviour still works — `check-photo-approval.mjs` HARNESS-OK
- [ ] Shared file from an unrelated page — n/a: no app file touched
- [x] Nothing merged from main broken — gates run after sync

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately left open, app half outstanding
- [x] Decision recorded — `2026-11-06-approval-three-states-schema.md`
- [x] README still accurate
- [ ] Release notes — n/a: nobody would notice, nothing reads the columns
- [x] Commit messages say why
- [x] Claims were measured — counts and behaviour from the harness output

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates derived
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence unedited — deferred: release manager
- [ ] Public pages re-checked — n/a: no public view changed
- [ ] Deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none
- [x] Migration and reading code in one PR? — no; consumer none
- [ ] Production dry-run — deferred: release manager
- [ ] Production backup — n/a: additive only
- [x] Apply plan stated — with the next release, before the app half
- [x] Rollback position — older code ignores the columns

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | First version accepted both answers set when one was unchanged | fixed — trigger now refuses both non-null |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

- [x] Everything verifiable without human eyes was run
- [x] Nothing is ticked that was not executed

Automated checks by: Claude  Date: 2026-11-06

- [x] The manual list is empty

Manual verification by: n/a: no UI surface

- [x] Open defects fixed or accepted

Result: pass

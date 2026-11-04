# Feature test plan: deceased-records-app (schema half, 0310)

## Header

| | |
|---|---|
| Feature | A deceased resident's clinic visit cost and notes can be corrected (database half only) |
| Backlog item | `docs/backlog.md` → `#314hq` |
| Branch / worktree | `claude/deceased-records-app` @ `C:\Development\Animal_Shelter_deceased-records-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-04 |
| Carries a migration? | yes |
| Tested at SHA | dc84ad2d |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the deceased lock now lets an UPDATE of `clinic_visits.cost` and `notes` through; the app half is the next stream.
- [x] Files/areas touched listed: `supabase/migrations/0310_deceased_visit_cost_notes.sql`, `docs/decisions/2026-11-04-deceased-records-app.md`, `docs/backlog.md` (#314hq title only), this plan.
- [x] Cards affected identified: `medical.visits` (edit) now succeeds on a dead resident's cost and notes; its card check is unchanged. Admin and signed-out unaffected; no card created.
- [x] Out of scope written down: every app control, part 3 (undo / re-record), blood tests, other notes, and the `/bills` code, all left for the app-half stream.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with the four-gate line, every code 0:

```
=== gates: typecheck exited 0 after 86s
=== gates: lint exited 0 after 281s
=== gates: test exited 0 after 32s
=== gates: build exited 0 after 212s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0309), and the brief gave this stream the batch's only slot
- [x] `--status` reviewed before applying (310 applied, 1 pending)
- [x] `--dry-run` reviewed (ok)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`create or replace function`)
- [x] Existing rows still read correctly after the change: the rehearsal read a real deceased resident's visit on dev
- [x] Constraints exercised against real rows in a rolled-back `do $$` block: cost and notes UPDATE on a deceased resident's visit succeeded; `status`/`reason` UPDATE raised `restrict_violation`; `DELETE` raised `restrict_violation`; the block ended in `raise exception` so nothing was kept
- [ ] Down-migration — n/a: re-applying 0307's function body restores the old rule; nothing is stored by this file
- [x] Production apply plan: `node scripts/apply-migrations.mjs --env production` (file 0310, project dbkodyyxxhtygxcxmfcu), Lutan's command; 0309 is also pending there

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface in this PR; the database rehearsal in section 3 is the check
- [ ] Data persists — n/a: no UI surface; rehearsal rolled back on purpose
- [ ] Create / edit / delete — n/a: covered by the rehearsal (edit allowed for two columns, delete refused)
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no UI surface, no new input
- [ ] Boundary cases — n/a: the boundary is the column set; status/reason refusal asserted

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | unchanged | n/a: no UI surface |
| exactly `<any>` | nothing new | unchanged; the policy and card check are untouched | n/a: no UI surface |
| signed out | nothing new | unchanged | n/a: no UI surface |

- [ ] Every login above tested — n/a: no UI surface in this PR
- [ ] A login that should not have access is blocked server-side — n/a: RLS and `has_permission('medical.visits')` are untouched; only the deceased lock gained an opening

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual updated — n/a: the user-facing change ships with the app half
- [ ] Translatable strings — n/a: none added
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] Pages nearest the change still work: the lock itself still refuses INSERT, DELETE and non-cost columns (rehearsal); no app code changed
- [ ] Shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken: sync brought in a backlog-only change

## 7. Documentation

- [x] Backlog item `#314hq` retitled on this branch (not ticked: the app half and the archive press remain)
- [x] Decision file `docs/decisions/2026-11-04-deceased-records-app.md`
- [ ] `README.md` still accurate — n/a: no behaviour described there changed
- [ ] **Release notes.** n/a: no user can see a change until the app half ships and 0310 is applied to production
- [x] Commit message says why
- [x] Claims were measured: the lock coverage and the bill-photo gap were read from the migration files, and the opening was rehearsed on dev

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates computed
- [ ] Boundary or banding change — n/a: no band or threshold
- [ ] Evidence pasted is unedited tool output — n/a: only the gates output, pasted as printed
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var exists in production — n/a: none added
- [x] Migration and reading code in one PR? No: this PR is schema only, and the app half follows
- [ ] `--env production --dry-run` clean — deferred: Lutan, with the production apply
- [ ] Production backup for a destructive migration — n/a: a function body replacement, nothing rewritten
- [x] Apply plan stated: file 0310, production project, may be applied before or after any deploy since nothing reads it yet
- [ ] Rollback position stated — n/a: leaving 0310 applied is harmless; to revert, re-apply 0307's function body

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | n/a |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-04

- [x] The manual list above is empty, so there is nothing for a person to look at

Manual verification by: n/a: schema only, no UI surface

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: this is the release manager's pass at deploy time

Result: pass

Release manager acknowledgement: n/a

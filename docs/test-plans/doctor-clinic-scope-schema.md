# Feature test plan — doctor-clinic-scope-schema

## Header

| | |
|---|---|
| Feature | Clinic-scope the bulk_appointments and clinic-visit attachment policies so a doctor cannot write at another clinic |
| Backlog item | `docs/backlog.md` → A doctor login can write outside its own clinic (ticked) |
| Branch / worktree | `claude/doctor-clinic-scope-schema` @ `C:\Development\Animal_Shelter_doctor-clinic-scope-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: number known once opened |
| Tested by / date | Claude / 2026-10-24 |
| Carries a migration? | yes — `0253_doctor_clinic_scope.sql` |
| Tested at SHA | `5d118f70` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — add sees_all_clinical() to the four bulk_appointments policies and the clinic_visit arm of the four attachments policies
- [x] Files/areas touched listed — `supabase/migrations/0253_doctor_clinic_scope.sql`, `scripts/check-doctor-clinic-scope.mjs`, decision file, backlog tick, this plan
- [x] Roles affected identified — doctor (now refused at other clinics); admin and management unchanged; head of medical holds neither cell so unchanged
- [x] Anything explicitly **out of scope** written down — no src/, no audit of other _perm policies, held card items untouched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged cleanly (one backlog line)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` — 0253 against 0252, check-migration-numbers ok
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev 253 applied, 1 pending (this file)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — 0253 ok
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0253 … ok`
- [x] File is re-runnable — drop policy if exists / create policy throughout
- [x] Existing rows still read correctly after the change — no data touched; own-clinic harnesses pass
- [x] **Constraints and defaults exercised against real rows** in a begin/rollback harness — `check-doctor-clinic-scope.mjs`: doctor refused at other clinic on bulk insert/update/delete and on visit attachments (bill and report, all four commands); admin and management still read and write. Result HARNESS-OK
- [x] Down-migration written, or the reason one is not needed is stated — header names the restore: 0147 bulk and 0189 attachments policies
- [ ] Production apply plan stated for the release manager — n/a: no release manager step; Lutan applies 0253 to production himself, stated in the PR and decision file

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these policies newly
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface; exercised through RLS in the harness
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input
- [ ] Boundary cases checked — n/a: no UI surface

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| doctor | other clinic bulk write, visit attachments | refused | refused (harness 1-9) |
| doctor | own clinic bulk, own reports | allowed | allowed (own-clinic-writes C/E, report-schema D) |
| admin | all | unchanged | pass (harness 10-15) |
| management | all | unchanged | pass (harness 10-15) |
| head of medical | n/a | unchanged | holds neither visit.book nor medical.visits, never passed |

- [x] Every role above tested — against dev through RLS with each role's JWT
- [x] A role that should not have access is blocked server-side — doctor at the other clinic, in the database

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — check-doctor-own-clinic-writes, check-doctor-report-schema, check-doctor-multi-clinic all HARNESS-OK; check-medical-role 88/88
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` — ticked, with production apply noted as outstanding
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — 2026-10-23-doctor-clinic-scope.md
- [x] `README.md` still accurate — does not describe these policies
- [ ] **Release notes.** — n/a: the fix reaches no one until 0253 is applied to production
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — harness runs, and head of medical's cells read live from role_permissions

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager
- [ ] Public pages re-checked after a cache purge — n/a: public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: Lutan
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no, policies only, consumer: none
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan, with the production apply
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: policy replacement only
- [x] Apply plan stated — 0253 must be applied to production by Lutan; merging does not fix production

### Rollback

- [x] Rollback position stated — restore the 0147 and 0189 policies; code rollback is irrelevant

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | Other _perm policies may share the unscoped shape; not audited | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-24

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: Lutan applies 0253 to production himself

Result: pass

Release manager acknowledgement: n/a: not yet released

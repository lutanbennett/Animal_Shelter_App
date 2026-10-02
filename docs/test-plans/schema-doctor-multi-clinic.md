# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Schema half: a doctor can work at several clinics, and a vet login's clinics come from its doctor (migration 0125) |
| Backlog item | `docs/backlog.md` → A doctor can work at more than one clinic (not ticked: the feature half remains) |
| Branch / worktree | `claude/schema-doctor-multi-clinic` @ `C:\Development\Animal_Shelter_schema-doctor-multi-clinic` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3012` (not used: no UI reads this yet) |
| PR | linked from the PR itself |
| Tested by / date | Claude (schema-doctor-multi-clinic session), 2026-10-02 |
| Carries a migration? | yes, 0125 |
| Tested at SHA | see the PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the item: `vet_doctor_clinics` link table, the visit's doctor/clinic key moved onto it, `vet_doctors.user_id`, and `current_user_vet_ids()` replacing `current_user_vet_id()` in every SQL caller
- [x] Files/areas touched listed: `supabase/migrations/0125_doctor_multi_clinic.sql`, new `scripts/check-doctor-multi-clinic.mjs`, `scripts/check-vet-doctors.mjs`, `check-vet-resident-scope.mjs`, `check-vet-own-clinic-writes.mjs` (now assert live), `docs/decisions/`, this plan. Nothing under `src/`
- [x] Roles affected identified: vet (scope and writes), admin (sets a doctor's login), management and staff (roster; cannot touch a login-linked doctor's clinics), volunteer (reads the roster)
- [x] Out of scope written down: every form, Settings → Security, the "same person as…" page, retiring `user_roles.vet_id` and `vet_doctors.vet_id`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed (a first run failed fetching Google Fonts, a network error; the rerun passed):

```
=== gates: build exited 0 after 74s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0124), and no other in-flight branch carries one
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: 124 applied, 0 drift
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: ok
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable; the harness ran it twice
- [x] Existing rows still read correctly: dev's 5 doctors each got a link; 0 named visits unlinked (`check-vet-doctors.mjs`); the old 0108/0110 harnesses pass against the live schema using dev's legacy `user_roles.vet_id` logins
- [x] Constraints exercised against real rows in a `begin; … rollback;` harness, `node scripts/check-doctor-multi-clinic.mjs` → `HARNESS-OK`. Asserted: a visit whose doctor is not at its clinic is refused (insert, clinic move, doctor swap, and under a vet's JWT); a used link cannot be deleted and deactivating keeps past visits; one spelling per clinic on insert, rename and link; the multi-clinic vet sees A and B residents and not C (tables and the owner-rights view); a legacy-login vet sees only its clinic; an unlinked vet sees none; an inactive link drops the clinic; the vet writes at A and B and is refused at C (insert, update, delete, move, prescription); only an admin at aal2 sets a login, unique both ways; no vet or staff widening of a vet's reach; cross-clinic merge moves links, visits and login; `current_user_vet_id()` still answers; one audit row per visit change. It caught two real bugs, recorded in the decision file
- [ ] Down-migration written — n/a: additive plus policy swaps; the old policies are in 0110/0124 and nothing reads the new objects yet, so nothing destructive
- [x] Production apply plan: `node scripts/apply-migrations.mjs --env production` for 0125 only after this PR merges, from the main checkout, before any deploy

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads the new objects yet; covered by the harness above
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface; the roster's insert, rename, link and merge are in the harness
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no UI surface; refusals are asserted by error code in the harness
- [ ] Boundary cases checked — n/a: no UI surface; same-name-different-clinic and identical-name merge are in the harness

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | roster, links, `user_id` | all; `user_id` only at aal2 | harness E/F/G: as expected |
| management | roster, links | not links of a doctor with a login | policy written; staff, which has the same policy shape, is driven in the harness |
| staff | roster, links | same as management | harness E/F/G: as expected |
| vet | own clinics' residents and writes | A and B yes, C refused | harness C/D/F: as expected |
| volunteer | roster | read only | policy only: not exercised in the harness |
| signed out | nothing | grants revoked from anon | `check-migration-grants.mjs` ok |

- [x] Every role above tested — management and volunteer by policy only, as the table says
- [x] A role that should not have access is blocked server-side: all vet and staff refusals in the harness are through RLS and triggers with real JWT claims

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no UI; the feature half owns the manual
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] Nearest checks still pass: `check-vet-doctors.mjs` (functions and RLS), `check-vet-resident-scope.mjs`, `check-vet-own-clinic-writes.mjs`, `check-vets-readonly.mjs`, `check-vet-doctor-name.mjs`, `check-medical-soft-delete.mjs`, `check-medical-archive-roles.mjs`, `check-migration-grants.mjs`; all `HARNESS-OK` or ok
- [ ] Shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken (gates pass after the merge)

## 7. Documentation

- [ ] Backlog item ticked — n/a: not ticked on purpose, the feature half remains; its note is updated on the `backlog` branch with the table shapes and decisions
- [x] Design choices added as `docs/decisions/2026-10-02-doctor-multi-clinic-schema.md`
- [x] `README.md` still accurate (no schema list to update)
- [ ] **Release notes.** n/a: no shelter user would notice, nothing in the app reads the new tables yet
- [x] Commit messages say why
- [x] Claims were measured: the two bugs and the count of SQL callers (more than the item's 18, because 0124 added some) come from harness failures and a dev catalogue query, not reasoning

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no dates or "today" logic
- [ ] Boundary or banding change covered both sides — n/a: no thresholds
- [ ] Evidence pasted is the tool's actual output — n/a: only the gates lines above, pasted as printed
- [ ] Public pages re-checked — n/a: no public view or page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] New secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] PR contains both migration and code reading it — n/a: no code reads it; the migration is safe for current code (kept `vet_doctors.vet_id`, the home-clinic trigger, and the `user_roles.vet_id` union)
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Production backup for a destructive migration — n/a: not destructive (adds a table and a column, swaps policies)
- [ ] Apply plan stated — deferred: release manager, 0125 to project dbkodyyxxhtygxcxmfcu before any deploy that follows

### Rollback

- [ ] Rollback position stated — deferred: release manager; the schema is safe to leave in place and current code does not depend on it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | caught in dev harness | rename re-listed the doctor under the new name (trigger order) | fixed before apply |
| 2 | caught in dev harness | identical-name merge hit the per-clinic key | fixed before apply |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (schema-doctor-multi-clinic session)  Date: 2026-10-02

### Manual verification

- [x] The manual list above is empty, so whoever filled the plan may tick this

Manual verification by: n/a: no UI surface, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: pending

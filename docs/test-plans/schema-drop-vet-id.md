# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Schema: drop `user_roles.vet_id` and `current_user_vet_id()` (migration 0127), plus the Security code that read the column |
| Backlog item | `docs/backlog.md` → Drop `current_user_vet_id()` and `user_roles.vet_id` (ticked) |
| Branch / worktree | `claude/schema-drop-vet-id` @ `C:\Development\Animal_Shelter_schema-drop-vet-id` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` (not driven: see §4) |
| PR | linked from the PR itself |
| Tested by / date | Claude (schema-drop-vet-id session), 2026-10-02 |
| Carries a migration? | yes, 0127 |
| Tested at SHA | see the PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the item: back-fill a doctor for every legacy vet login, redefine `current_user_vet_ids()` without the column, drop `current_user_vet_id()`, the check, the trigger and the column, and update the harnesses
- [x] Files/areas touched listed: `supabase/migrations/0127_drop_user_roles_vet_id.sql`; `src/app/admin/security/` (page, actions, UsersTable, VetDoctorLink); `src/lib/i18n/dictionaries/en.ts` and `th.ts`; `src/lib/manual/en.ts`; `src/lib/vets/scope.ts` (comment); seven `scripts/check-*.mjs` fixtures; backlog, decision, this plan
- [x] Roles affected identified: vet (clinic scope now only via a doctor link), admin (the Security page loses the "old way" line)
- [x] Out of scope written down: `vet_doctors.vet_id` (still deprecated, not dropped here); any change to who can link a login

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 175s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0126), and no other in-flight branch carries one
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: 126 applied, 0 pending, no drift
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: ok
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (guarded back-fill that skips once the column is gone, `or replace`, `drop … if exists`); the harness ran it twice
- [x] Existing rows still read correctly. **Legacy-login list before: 2** (vet logins with `user_roles.vet_id` and no linked doctor, both at one clinic). **After: the column is gone and both logins have a doctor linked to them with an active link at that clinic**, read back from `vet_doctors` and `vet_doctor_clinics`
- [x] Constraints exercised against real rows in a `begin; … rollback;` harness, `node scripts/check-doctor-multi-clinic.mjs` → `HARNESS-OK`. Asserted: the legacy login is back-filled with a doctor at its clinic; the column, check, trigger and `current_user_vet_id()` are gone; **zero** functions, policies or views reference the dropped name; plus all of 0125's assertions (a vet on two clinics sees both clinics' residents and no others, writes at both, is refused at a third)
- [ ] Down-migration written — n/a: the column's data now lives in `vet_doctor_clinics`; restoring the column would recreate a second source of truth, which is what this removes
- [x] Production apply plan: `node scripts/apply-migrations.mjs --env production` for 0127 **together with the deploy of this code** (release 0.13.0 still selects the column on Security); the back-fill handles whatever legacy logins exist there. Production was not read

## 4. Functional checks

- [x] Happy path works end to end — the SQL path: harness H, C and D above, and `check-vet-doctors.mjs`, `check-vet-resident-scope.mjs`, `check-vet-own-clinic-writes.mjs`, `check-vets-readonly.mjs`, `check-medical-soft-delete.mjs`, `check-medical-archive-roles.mjs`, `check-resident-microchip.mjs` all `HARNESS-OK` against the live schema
- [ ] Data persists — n/a: no new write path
- [ ] Create / edit / delete all exercised — n/a: Security's link and create actions only lost the legacy carry-across; typechecked and built, not driven in a browser
- [ ] Empty state renders sensibly — n/a: a vet login with no doctor still shows "not linked" in the warning colour; not driven
- [ ] Invalid input is rejected with a readable message — n/a: no input surface changed
- [ ] Boundary cases checked — n/a: covered by the harness

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Security | no "old way" line; link and create still work | not driven (see Left for manual verification) |
| management | none of this | unchanged | n/a: no change |
| staff | none of this | unchanged | n/a: no change |
| vet | residents and visits at its doctor's clinics | unchanged | harness C and D: as expected |
| volunteer | none of this | unchanged | n/a: no change |
| signed out | nothing | unchanged | n/a: no change |

- [x] Every role above tested — vet by harness; the others have no path through this change
- [x] A role that should not have access is blocked server-side: the vet refusals at a third clinic in the harness go through RLS with real JWT claims

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: none touched
- [ ] Manual updated — n/a: one sentence about "a clinic set the old way" was removed from the Security topic; nothing else changes
- [ ] Translatable strings — n/a: two strings removed from each of `en.ts` and `th.ts`, none added
- [ ] Mobile viewport — n/a: a line was removed, no layout change
- [ ] Browser console clean — n/a: not driven
- [ ] Network clean — n/a: not driven

## 6. Regression

- [x] Nearest checks still pass: the seven harnesses above, `check-vet-doctor-name.mjs`, `check-migration-grants.mjs` (50 files ok)
- [ ] Shared file touched checked from a second page — n/a: `manual/en.ts` and the dictionaries lost one sentence or two strings; build and typecheck pass
- [x] Nothing merged from `main` during `sync` was broken (gates pass)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Design choices added as `docs/decisions/2026-10-02-drop-user-roles-vet-id.md`
- [x] `README.md` still accurate — it names no column
- [ ] **Release notes.** n/a: no vet's access changes (every login keeps exactly its clinics, via a back-filled doctor); the only visible change is that admins no longer see a transitional "Clinic set the old way" hint
- [x] Commit messages say why
- [x] Claims were measured: the legacy count and the zero-caller result come from catalogue queries and the harness, not from the brief

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no dates
- [ ] Boundary or banding change covered both sides — n/a: no thresholds
- [ ] Evidence pasted is the tool's actual output — n/a: only the gates lines above, pasted as printed
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] New secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] PR contains both migration and code reading it — n/a: the code stopped reading the column; but the live release still reads it, so 0127 is applied only as this code deploys (stated in the apply plan)
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Production backup for a destructive migration — deferred: release manager; this one drops a column, so a fresh backup is wanted first
- [ ] Apply plan stated — deferred: release manager, 0127 to project dbkodyyxxhtygxcxmfcu together with the deploy

### Rollback

- [ ] Rollback position stated — deferred: release manager; the dropped column is not restored by a code rollback, its data lives on in `vet_doctor_clinics`, and rolled-back code would fail on Security's select

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | found while grepping | the brief said `src/` no longer read the column; Security's page and actions still did | fixed in this PR |
| 2 | harness | six fixtures and one replay of 0124 depended on the dropped column or function | fixed in this PR |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Settings → Security as admin: a vet login shows its doctor, or "not linked"; Link and Create a doctor still work | `/admin/security` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (schema-drop-vet-id session)  Date: 2026-10-02

### Manual verification

- [ ] The manual list above is empty, so whoever filled the plan may tick this — n/a: the list is not empty, item 1 is waiting for a person

Manual verification by: pending: the one item under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: pending

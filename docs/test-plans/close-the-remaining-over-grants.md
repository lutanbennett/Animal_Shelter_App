# Feature test plan

## Header

| | |
|---|---|
| Feature | `close-the-remaining-over-grants`: the doctor (clinic) login loses project and maintenance photo records, the Thai text of every non-resident table, and the list of every login (`0174`). All three were deny-lists with a fallthrough; they become allow-lists |
| Backlog item | `docs/backlog.md` → two ticked: *A vet login can read, rename, add and delete every project and maintenance photo record (Medium)*, *A vet login lists every person with a login, with their role (Low)* |
| Branch / worktree | `claude/close-the-remaining-over-grants` @ `C:\Development\Animal_Shelter_close-the-remaining-over-grants` |
| Dev server | not started: no screen changed; every check is under a real JWT against the dev database |
| PR | opened from this branch; number in the PR itself |
| Tested by / date | Claude (automated) / 2026-10-09 |
| Carries a migration? | yes: `0174_close_the_remaining_over_grants.sql` |
| Tested at SHA | `a1860f9d` (code, after `sync`); this plan's own commit adds only the plan, the decision and the backlog ticks |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: both items built exactly as Lutan decided on 2026-10-09 (allow-lists naming `resident`, `blood_test`, `procedure`; `else true` gone; translations closed the same way; `app_users` narrowed for a clinic login to its own clinic's doctors, volunteers unchanged)
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0174_close_the_remaining_over_grants.sql`; new `scripts/check-clinic-allow-lists.mjs`; `scripts/probe-role-surface.mjs` (staff principal dropped, see Defects); `docs/backlog.md`, one decision file, this plan. No app code, no `worker/`
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public: **doctor** only. Volunteer, the three configured roles, Management, Admin, public viewer and signed-out are unchanged (probe diff below)
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: the `role` enum column on `app_users` stays (it is `perm-drop-enum`'s); the doctor's clinical access (its own clinic's resident photos, blood-test and procedure files) is unchanged by design. Sibling stream `multi-tenancy-spike` reads these five policies; their count is unchanged (four attachment policies and one translations policy, re-created under the same names)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`a1860f9d`, merging `#501`; no conflicts)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
=== gates: build exited 0 after 262s

gates: typecheck=0 lint=0 build=0
```

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: the brief assigned `0174`; the post-commit hook printed `migration numbers: ok — 0174_close_the_remaining_over_grants.sql (against origin/main 81aa29eb, highest 0173_retire_staff_role.sql)`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `This checkout: 173 applied, 1 pending.`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0174_close_the_remaining_over_grants.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0174_close_the_remaining_over_grants.sql … ok`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): `create or replace function`, `drop policy if exists` before each `create policy`, `create or replace view` with the same columns in the same order; `check-migration-grants.mjs`: `migration grants: ok (97 file(s) checked)`; `check-new-policy-role-names.mjs`: `ok — 1 new migration file(s), none with an unmarked role-named policy or a scope function without a cell beside it`; `check-policy-role-names.mjs`: `RESULT: GREEN`
- [x] Existing rows still read correctly after the change (checked against real dev data): the probe's doctor still reads its 14 clinical file records and updates 12 (the two it reads but may not change are in its read scope only, as `0172` intends); volunteer and admin read `app_users` 64 before and after
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: `scripts/check-clinic-allow-lists.mjs`, under real doctor, volunteer and admin JWTs, asserts (A) a doctor reads, renames and deletes no project or maintenance file and cannot insert one directly (`-1`, RLS) or through `record_attachment()` (`-2`, refused); (B) it still reads its resident's photo, blood-test and procedure files, adds a file on its own blood test and renames one; (C) it reads its resident's translation and no other table's; (D) `app_users` gives it itself and its colleague, not the other clinic's doctor, not the admin, no admin row at all; (E) the volunteer still sees every login an admin sees, with no email. Before `0174` it reproduced every finding (9 of 18 failed); after, 18 of 18 held. Both runs below, unedited
- [x] Down-migration written, or the reason one is not needed is stated: not written; the file's header gives the undo (restore the five policies, the function and `private.app_users` from `0172`). Nothing is destructive: no column, row or table is dropped
- [x] Production apply plan stated for the release manager (which file, which project, when): `0174` to production (`dbkodyyxxhtygxcxmfcu`) at any point in the release; no app code depends on it in either direction, so it may go before or after the deploy

### Harness, before `0174` (`node scripts/check-clinic-allow-lists.mjs`)

148 = the 146 dev project and maintenance rows plus the harness's own two.

```
FAIL A delete project+maintenance files           got 148, want 0
FAIL A insert a project file                      got 1, want -1
FAIL A read project+maintenance files             got 148, want 0
FAIL A record_attachment on a project             got 1, want -2
FAIL A update project+maintenance files           got 148, want 0
ok   B add a file on own blood test               got 1, want 1
ok   B read own resident's three files            got 3, want 3
ok   B rename own blood-test file                 got 1, want 1
FAIL C read other tables' translations            got 46, want 0
ok   C read own resident's translation            got 1, want 1
FAIL D doctor sees any admin row                  got 16, want 0
ok   D doctor sees its colleague                  got 1, want 1
ok   D doctor sees itself                         got 1, want 1
FAIL D doctor sees the admin                      got 1, want 0
FAIL D doctor sees the other clinic's doctor      got 1, want 0
ok   E admin still sees emails                    got true, want true
ok   E volunteer sees every login                 got 68, want 68
ok   E volunteer sees no email                    got 0, want 0

9 of 18 failed
```

### Harness, after `0174`

```
ok   A delete project+maintenance files           got 0, want 0
ok   A insert a project file                      got -1, want -1
ok   A read project+maintenance files             got 0, want 0
ok   A record_attachment on a project             got -2, want -2
ok   A update project+maintenance files           got 0, want 0
ok   B add a file on own blood test               got 1, want 1
ok   B read own resident's three files            got 3, want 3
ok   B rename own blood-test file                 got 1, want 1
ok   C read other tables' translations            got 0, want 0
ok   C read own resident's translation            got 1, want 1
ok   D doctor sees any admin row                  got 0, want 0
ok   D doctor sees its colleague                  got 1, want 1
ok   D doctor sees itself                         got 1, want 1
ok   D doctor sees the admin                      got 0, want 0
ok   D doctor sees the other clinic's doctor      got 0, want 0
ok   E admin still sees emails                    got true, want true
ok   E volunteer sees every login                 got 68, want 68
ok   E volunteer sees no email                    got 0, want 0

all 18 held
```

### Probe, before and after (`node scripts/probe-role-surface.mjs --json`, then a diff of the two matrices)

Every line the diff printed, unedited (`rd` read, `up` update, `de` delete, `ins` insert of a copied sample row):

```
doctor app_users rd "64" -> "1"
doctor attachments rd "160" -> "14"
doctor attachments up "158" -> "12"
doctor attachments de "158" -> "12"
doctor doctor_clinics ins "passes 23505 duplicate key value violates unique constraint -> "rls"
doctor doctors ins "inserted" -> "rls"
doctor translations rd "46" -> "0"
```

The `doctors` / `doctor_clinics` insert lines are the probe's sample row, not `0174`: the probe copies `select … limit 1` with no order, which on one run is its own harness doctor (which `clinic_login_may_edit_doctor()` lets it insert) and on another a doctor with someone else's login (which it refuses). Neither table's policies call anything `0174` changed (read from `pg_policies` on dev). The probe's doctor reads `app_users` 1 because it is the only login at its clinic; the harness's D proves the colleague case. Every other principal's matrix is identical before and after, `volunteer app_users rd 64` included.

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no screen changed; the database answer each doctor screen depends on (its own resident's photo, blood-test and procedure files, its resident's translation) is asserted under a real doctor JWT by the harness's B and C, and one look at the real screens is in **Left for manual verification**
- [ ] Data persists — reload the page and the change is still there — n/a: nothing new is saved
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI; at database level the harness exercises a doctor's insert (own blood test: allowed; project: refused), update and delete of files
- [ ] Empty state renders sensibly (no rows yet) — n/a: no screen; a doctor's `app_users` read is never empty (it always holds the login itself)
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input changed; `record_attachment()` on a project raises its existing `Not authorized to add attachments.`
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): both sides of each cut are asserted: the three clinical owner types allowed and the two others refused; the resident table's translation allowed and every other table refused; same-clinic doctor shown and other-clinic doctor and admin hidden

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | every file, translation and login (cells, unchanged) | as expected | probe: attachments 340, translations 95, app_users 64, before and after |
| management | unchanged | as expected | probe: identical before and after |
| staff | n/a: the role is retired (`0173`) | n/a | no principal |
| doctor | own clinic's clinical files; residents' translations in scope; itself and its clinic's doctors | as expected | harness 18/18; probe attachments 160 → 14, translations 46 → 0, app_users 64 → 1 |
| volunteer | `app_users` every login, no email (the recurring-jobs pickers) | as expected | harness E (68 = admin's 68, no email); probe 64 before and after |
| signed out | nothing internal | as expected | probe: anon identical before and after |

- [x] Every role above tested (the probe covers twelve principals: anon, no role, archived, public viewer, volunteer, doctor, the three configured roles, Management, Admin, Admin at aal2)
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): every refusal above is the database's own, under each login's JWT

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual never described a doctor reaching project photos or the login list
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no new string
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no page changed; the one look at a doctor's pages is in **Left for manual verification**

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): no page loaded; the closest checks are the harness's B and C (the doctor's clinical files and translations still answer) and E (the volunteer's picker source unchanged). `check-medical-photos.mjs`: exit 0
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched; `probe-role-surface.mjs` is a script, re-run in full twice
- [x] Permission parity unchanged: `check-permission-parity.mjs`, run after the apply from the `roles-parity-reconcile` worktree (its fix for the same `0173` setup crash), printed `MATCH 1777`, `KNOWN TIGHTENING 22`, `MISMATCH 21`, `HARNESS FAULT 0`: exactly that stream's recorded baseline at `0173`, all 21 mismatches the doctor's `has_permission()` lines (the recorded doctor decision), no STALE
- [x] Nothing merged from `main` during `sync` was broken by this branch: `sync` brought in planner handover docs only (`#501`), gates run after it

Neighbouring harnesses run after the apply and found already unable to start, for reasons outside this branch (each stops at setup): `check-doctor-own-clinic-writes`, `check-doctor-resident-scope`, `check-doctor-multi-clinic`, `check-app-access-gate`, `check-perm-convert-photos`, `check-volunteer-narrowing` (`The Staff role is retired`, `0173`); `check-perm-convert-vet` (`current_vet_resident_ids() does not exist`, `0172`); `check-recurring-job-eligibility` (still expects a `staff` column). Recorded as a backlog follow-up on the `backlog` branch, not fixed here

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**: both ticked with what closed them. Searched for `app_users`, `read_translations`, `can_write_attachment`, `attachments`, `perm-drop-enum` and the 2026-10-09 assessment: the parent item (*The security assessment's dynamic half*) is already ticked, and no other open item's outcome is closed by this
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-09-clinic-login-allow-lists.md` (why an allow-list, and the `else true` story)
- [x] `README.md` still accurate: it does not describe the doctor's attachment, translation or login-list access
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: no screen a doctor uses ever showed project photos, other tables' Thai text or the login list; they were reachable only by sending requests by hand, so nobody using the app sees a difference
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned**: the live policies and function were read from `pg_policies` / `pg_get_functiondef` on dev before writing; `is_clinic_login()` is true only for `scope_clinical = 'own_clinic'`, read from `roles` (only `doctor`); every count is the harness's or the probe's output

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing here derives a date
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary**: a permission cutoff; each side asserted (allowed and refused owner types, resident and non-resident translations, same-clinic and other-clinic logins, doctor and volunteer views of `app_users`)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited**: harness runs and probe diff copied as printed
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: anon's probe matrix is identical before and after; no public view reads these objects

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No: no app code changed, and the view keeps its columns. `0174` can be applied before or after the deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: policy, function and view replacements only; no data touched
- [x] Apply plan stated: `0174_close_the_remaining_over_grants.sql`, production `dbkodyyxxhtygxcxmfcu`, any time in the release

### Rollback

- [x] Rollback position stated, **including what it does not cover**: a code rollback needs nothing here (no code changed). Undoing the schema means re-creating the five policies, the function and `private.app_users` from `0172`, which re-opens the findings; neither rollback reverts the migration by itself

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | `scripts/probe-role-surface.mjs` could no longer run: it made a `staff` login, which `0173` refuses | fixed: the staff principal is dropped and the archived principal is a volunteer |
| 2 | Low | Eight neighbouring check harnesses stop at setup since `0172`/`0173` (listed in §6), so what they guard is unwatched | deferred to backlog (on the `backlog` branch) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as a **doctor**, open a resident the clinic treats: the Medical photos show, and a blood test's or procedure's attached file opens | the resident hub and its blood-test / procedure pages on dev |
| 2 | As a **volunteer** (or Management), the recurring-jobs picker still lists the people a job can go to | `/management/recurring-jobs` on dev |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-09

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; two items are waiting for a person

Manual verification by: pending: the two items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR is not merged

Result: pass

Release manager acknowledgement: pending: not yet released

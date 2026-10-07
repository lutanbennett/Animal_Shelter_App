# Feature test plan — resident-view-grants-0160

## Header

| | |
|---|---|
| Feature | `0160_view_write_grants.sql`: signed-in logins lose insert, update, delete, truncate, references and trigger on six internal views (C12). C2 found already closed; no change |
| Backlog item | `docs/backlog.md` → "The database lets a volunteer read prices and delivery costs, and a vet read the other clinics" (C12 and C2 only) |
| Branch / worktree | `claude/resident-view-grants-0160` @ `C:\Development\Animal_Shelter_resident-view-grants-0160` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` (not started: no UI change) |
| PR | opened from this commit |
| Tested by / date | Claude, 2026-10-07 |
| Carries a migration? | yes — `0160_view_write_grants.sql` |
| Tested at SHA | a5950b24 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: C12's grants are measured (inert on five views, live but no wider than `project_folders` on one) and revoked; C2 is shown already closed for management and staff by `0144`, with Admin's delete kept as recorded
- [x] Files/areas touched listed: `supabase/migrations/0160_view_write_grants.sql`; `scripts/check-view-write-grants.mjs` (new); `scripts/lib/permission-probes.mjs` (C12 note text only); `docs/decisions/2026-10-07-view-write-grants.md`; `docs/roles-and-permissions.md` (C2, C12 rows, open question); `docs/backlog.md`; this plan. No `src/`, no `worker/`
- [x] Roles affected identified: every signed-in role loses write grants it never used; anon held none on these views already (`0081`); service_role unchanged
- [x] Out of scope written down: the vet half (C10, C3, C4) is declined (`perm-convert-vet`, 2026-10-07) and untouched; Admin's `residents_admin_delete` kept (Lutan's call); the default privileges that will give the next view the same set are a follow-up, not changed here

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: `Already up to date.`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 194s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `migration numbers: ok — 0160_view_write_grants.sql (against origin/main dd979395, highest 0159_place_capacity_and_names_th.sql)`; the only migration-carrying stream this batch
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `159 applied, 0 pending`, no drift against `origin/main`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0160_view_write_grants.sql … ok`
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: not yet — the brief holds the apply until the merge is agreed; the file was proved in a rolled-back transaction instead (below), and this line is ticked in the commit that applies it
- [x] File is re-runnable: a single `revoke`, which is idempotent
- [x] Existing rows still read correctly after the change: every role's select on all six views returns the same count with the file run as without it (evidence below)
- [x] **Exercised against real rows in a rolled-back harness**: `scripts/check-view-write-grants.mjs`, one live login per role under its own JWT, every statement in its own sub-block ending in `raise exception`. Asserted before: no write to the five non-updatable views touches a row for any role; every write through `project_folder_summary` touches exactly what the same write on `project_folders` touches. Asserted after (`--with` the file, same transaction, rolled back): `has_table_privilege` is false for all six privileges on all six views for `authenticated` and `anon`; no write touches a row; `project_folder_summary` writes refused `42501`; every select still succeeds. After the run, dev still showed the old grants, confirming the rollback
- [x] Down-migration written, or the reason one is not needed is stated: not needed. A down is `grant insert, update, delete, truncate, references, trigger on <the six> to authenticated`, and nothing in the app writes through a view
- [x] Production apply plan stated for the release manager: `0160` to production (`dbkodyyxxhtygxcxmfcu`) with the next release, before or after the deploy (no code reads it differently). Run `--status --env production` first: the runner applies every pending file

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; the app only selects from these views, and selects are proved unchanged per role above
- [ ] Data persists — n/a: no write path is added; one is removed
- [ ] Create / edit / delete all exercised — n/a: no screen writes through any of the six views (grep of `src/` and `worker/`: reads only)
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no values, only grants

### Role access matrix

Measured in the database with each role's own JWT, not on screen (evidence below).

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | select on the six views | unchanged; every write refused or touches nothing | select 90/17/12/10/13/85 before and after; writes refused |
| management | select on the six views | unchanged; every write refused or touches nothing | same counts before and after; `project_folder_summary` update was 17 rows before, `42501` after |
| staff | select on the six views | unchanged; every write refused or touches nothing | same counts before and after; `project_folder_summary` update was 17 rows before, `42501` after |
| vet | select on the six views | unchanged; every write refused or touches nothing | same counts before and after; writes refused |
| volunteer | select on the six views | unchanged (0 rows: reads `resident_who_and_where`) | 0 before and after; writes refused |
| signed out | nothing | anon holds no privilege on any of the six | `has_table_privilege` false for anon on all six after; anon already held none (`0081`) |

The 2IC and Head of Medical logins were measured too (same result). Head of Maintenance's test login was present in the first run and gone in the later ones: another stream changed dev's logins meanwhile; each run compares within itself.

- [x] Every role above tested
- [x] A role that should not have access is blocked server-side: `project_folder_summary` writes now `42501` for every role; the others never touched a row

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing a user sees or does changes
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface; selects proved unchanged in the database

## 6. Regression

- [x] The pages nearest the change still work: checked at the database, which is where the change is. The selects behind `/residents`, the resident pages, `/projects`, `/admin/website`, immunizations and the rounds return identical row counts per role with the file applied in-transaction. `check-policy-role-names` GREEN (54 on 29, all vet, all owned); `check-app-access-gate` HARNESS-OK (archived, roleless and public_viewer read 0 rows of 18 internal objects); `check-new-policy-role-names --base origin/main` ok; `check-permission-parity` 1,971 match / 21 mismatch, the known vet lines, unchanged
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared UI file touched; `permission-probes.mjs` changes only the text of the C12 note, which the parity run prints
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged (`Already up to date.`)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch, as **done where it can be, declined where it was decided** (the vet half, `perm-convert-vet` declined 2026-10-07). Also a note on "A reviewable script for resident corrections" answering how R-0240's delete got past `0119`
- [x] Non-obvious design choices added: `docs/decisions/2026-10-07-view-write-grants.md`
- [x] `README.md` still accurate: it lists no check scripts and no grant details
- [ ] **Release notes.** n/a: nobody would notice. The revoked grants were never used by any screen; every read returns what it did
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned.** Inert vs live comes from the harness, not from reading the view definitions. The R-0240 paragraph is stated as reasoning from the schema, because production cannot be read from a worktree, and says how to confirm it

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change covers both edges** — n/a: no boundary or banding
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** (below)
- [ ] Public pages re-checked after a cache purge — n/a: anon's grants on these views were already nil and are unchanged

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` line seen — deferred: production release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** n/a: no app code change
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager
- [ ] For a destructive or rewriting migration only: a fresh production backup — n/a: grants only, no data touched
- [x] Apply plan stated: see §3

### Rollback

- [x] Rollback position stated: no Worker change. Undo with `grant insert, update, delete, truncate, references, trigger on` the six views `to authenticated`. It restores grants that did nothing (five) or nothing beyond `project_folders` (one)

## Evidence

`node scripts/check-view-write-grants.mjs --before` (dev, 2026-10-07):

```
BEFORE 0160, 7 roles x 6 views (ROWS n = the statement ran and touched n rows; otherwise the SQLSTATE)

resident_list_view
  admin                select=ROWS 90  insert=55000  update=55000  delete=55000  truncate=42809
  head_of_medical      select=ROWS 0  insert=55000  update=55000  delete=55000  truncate=42809
  management           select=ROWS 90  insert=55000  update=55000  delete=55000  truncate=42809
  second_in_command    select=ROWS 0  insert=55000  update=55000  delete=55000  truncate=42809
  staff                select=ROWS 90  insert=55000  update=55000  delete=55000  truncate=42809
  vet                  select=ROWS 18  insert=55000  update=55000  delete=55000  truncate=42809
  volunteer            select=ROWS 0  insert=55000  update=55000  delete=55000  truncate=42809
project_folder_summary
  admin                select=ROWS 17  insert=P0001  update=ROWS 17  delete=P0001  truncate=42809  base-update=ROWS 17  base-delete=P0001
  head_of_medical      select=ROWS 0  insert=P0001  update=ROWS 0  delete=ROWS 0  truncate=42809  base-update=ROWS 0  base-delete=ROWS 0
  management           select=ROWS 17  insert=P0001  update=ROWS 17  delete=P0001  truncate=42809  base-update=ROWS 17  base-delete=P0001
  second_in_command    select=ROWS 0  insert=P0001  update=ROWS 0  delete=ROWS 0  truncate=42809  base-update=ROWS 0  base-delete=ROWS 0
  staff                select=ROWS 17  insert=P0001  update=ROWS 17  delete=P0001  truncate=42809  base-update=ROWS 17  base-delete=P0001
  vet                  select=ROWS 0  insert=P0001  update=ROWS 0  delete=ROWS 0  truncate=42809  base-update=ROWS 0  base-delete=ROWS 0
  volunteer            select=ROWS 0  insert=P0001  update=ROWS 0  delete=ROWS 0  truncate=42809  base-update=ROWS 0  base-delete=ROWS 0
immunization_next_due
  admin                select=ROWS 12  insert=55000  update=55000  delete=55000  truncate=42809
  head_of_medical      select=ROWS 0  insert=55000  update=55000  delete=55000  truncate=42809
  management           select=ROWS 0  insert=55000  update=55000  delete=55000  truncate=42809
  second_in_command    select=ROWS 0  insert=55000  update=55000  delete=55000  truncate=42809
  staff                select=ROWS 0  insert=55000  update=55000  delete=55000  truncate=42809
  vet                  select=ROWS 5  insert=55000  update=55000  delete=55000  truncate=42809
  volunteer            select=ROWS 0  insert=55000  update=55000  delete=55000  truncate=42809
frequency_round_status
  admin                select=ROWS 10  insert=55000  update=55000  delete=55000  truncate=42809
  head_of_medical      select=ROWS 10  insert=55000  update=55000  delete=55000  truncate=42809
  management           select=ROWS 10  insert=55000  update=55000  delete=55000  truncate=42809
  second_in_command    select=ROWS 10  insert=55000  update=55000  delete=55000  truncate=42809
  staff                select=ROWS 10  insert=55000  update=55000  delete=55000  truncate=42809
  vet                  select=ROWS 10  insert=55000  update=55000  delete=55000  truncate=42809
  volunteer            select=ROWS 0  insert=55000  update=55000  delete=55000  truncate=42809
prescription_round_status
  admin                select=ROWS 13  insert=55000  update=55000  delete=55000  truncate=42809
  head_of_medical      select=ROWS 13  insert=55000  update=55000  delete=55000  truncate=42809
  management           select=ROWS 13  insert=55000  update=55000  delete=55000  truncate=42809
  second_in_command    select=ROWS 13  insert=55000  update=55000  delete=55000  truncate=42809
  staff                select=ROWS 13  insert=55000  update=55000  delete=55000  truncate=42809
  vet                  select=ROWS 3  insert=55000  update=55000  delete=55000  truncate=42809
  volunteer            select=ROWS 0  insert=55000  update=55000  delete=55000  truncate=42809
resident_diet_round_status
  admin                select=ROWS 85  insert=55000  update=55000  delete=55000  truncate=42809
  head_of_medical      select=ROWS 85  insert=55000  update=55000  delete=55000  truncate=42809
  management           select=ROWS 85  insert=55000  update=55000  delete=55000  truncate=42809
  second_in_command    select=ROWS 85  insert=55000  update=55000  delete=55000  truncate=42809
  staff                select=ROWS 85  insert=55000  update=55000  delete=55000  truncate=42809
  vet                  select=ROWS 16  insert=55000  update=55000  delete=55000  truncate=42809
  volunteer            select=ROWS 0  insert=55000  update=55000  delete=55000  truncate=42809

Write privileges authenticated or anon still hold on these views: resident_list_view INSERT, resident_list_view UPDATE, resident_list_view DELETE, resident_list_view TRUNCATE, resident_list_view REFERENCES, resident_list_view TRIGGER, project_folder_summary INSERT, project_folder_summary UPDATE, project_folder_summary DELETE, project_folder_summary TRUNCATE, project_folder_summary REFERENCES, project_folder_summary TRIGGER, immunization_next_due INSERT, immunization_next_due UPDATE, immunization_next_due DELETE, immunization_next_due TRUNCATE, immunization_next_due REFERENCES, immunization_next_due TRIGGER, frequency_round_status INSERT, frequency_round_status UPDATE, frequency_round_status DELETE, frequency_round_status TRUNCATE, frequency_round_status REFERENCES, frequency_round_status TRIGGER, prescription_round_status INSERT, prescription_round_status UPDATE, prescription_round_status DELETE, prescription_round_status TRUNCATE, prescription_round_status REFERENCES, prescription_round_status TRIGGER, resident_diet_round_status INSERT, resident_diet_round_status UPDATE, resident_diet_round_status DELETE, resident_diet_round_status TRUNCATE, resident_diet_round_status REFERENCES, resident_diet_round_status TRIGGER

260 statements, 0 failed.
RESULT: GREEN (before: five views' write grants are inert; project_folder_summary's are live but no wider than project_folders')
```

`node scripts/check-view-write-grants.mjs --with supabase/migrations/0160_view_write_grants.sql` (dev, rolled back):

```
AFTER (in a rolled-back transaction) 0160, 7 roles x 6 views (ROWS n = the statement ran and touched n rows; otherwise the SQLSTATE)

resident_list_view
  admin                select=ROWS 90  insert=55000  update=55000  delete=55000  truncate=42809
  head_of_medical      select=ROWS 0  insert=55000  update=55000  delete=55000  truncate=42809
  management           select=ROWS 90  insert=55000  update=55000  delete=55000  truncate=42809
  second_in_command    select=ROWS 0  insert=55000  update=55000  delete=55000  truncate=42809
  staff                select=ROWS 90  insert=55000  update=55000  delete=55000  truncate=42809
  vet                  select=ROWS 18  insert=55000  update=55000  delete=55000  truncate=42809
  volunteer            select=ROWS 0  insert=55000  update=55000  delete=55000  truncate=42809
project_folder_summary
  admin                select=ROWS 17  insert=42501  update=42501  delete=42501  truncate=42809  base-update=ROWS 17  base-delete=P0001
  head_of_medical      select=ROWS 0  insert=42501  update=42501  delete=42501  truncate=42809  base-update=ROWS 0  base-delete=ROWS 0
  management           select=ROWS 17  insert=42501  update=42501  delete=42501  truncate=42809  base-update=ROWS 17  base-delete=P0001
  second_in_command    select=ROWS 0  insert=42501  update=42501  delete=42501  truncate=42809  base-update=ROWS 0  base-delete=ROWS 0
  staff                select=ROWS 17  insert=42501  update=42501  delete=42501  truncate=42809  base-update=ROWS 17  base-delete=P0001
  vet                  select=ROWS 0  insert=42501  update=42501  delete=42501  truncate=42809  base-update=ROWS 0  base-delete=ROWS 0
  volunteer            select=ROWS 0  insert=42501  update=42501  delete=42501  truncate=42809  base-update=ROWS 0  base-delete=ROWS 0
immunization_next_due
  admin                select=ROWS 12  insert=55000  update=55000  delete=55000  truncate=42809
  head_of_medical      select=ROWS 0  insert=55000  update=55000  delete=55000  truncate=42809
  management           select=ROWS 0  insert=55000  update=55000  delete=55000  truncate=42809
  second_in_command    select=ROWS 0  insert=55000  update=55000  delete=55000  truncate=42809
  staff                select=ROWS 0  insert=55000  update=55000  delete=55000  truncate=42809
  vet                  select=ROWS 5  insert=55000  update=55000  delete=55000  truncate=42809
  volunteer            select=ROWS 0  insert=55000  update=55000  delete=55000  truncate=42809
frequency_round_status
  admin                select=ROWS 10  insert=55000  update=55000  delete=55000  truncate=42809
  head_of_medical      select=ROWS 10  insert=55000  update=55000  delete=55000  truncate=42809
  management           select=ROWS 10  insert=55000  update=55000  delete=55000  truncate=42809
  second_in_command    select=ROWS 10  insert=55000  update=55000  delete=55000  truncate=42809
  staff                select=ROWS 10  insert=55000  update=55000  delete=55000  truncate=42809
  vet                  select=ROWS 10  insert=55000  update=55000  delete=55000  truncate=42809
  volunteer            select=ROWS 0  insert=55000  update=55000  delete=55000  truncate=42809
prescription_round_status
  admin                select=ROWS 13  insert=55000  update=55000  delete=55000  truncate=42809
  head_of_medical      select=ROWS 13  insert=55000  update=55000  delete=55000  truncate=42809
  management           select=ROWS 13  insert=55000  update=55000  delete=55000  truncate=42809
  second_in_command    select=ROWS 13  insert=55000  update=55000  delete=55000  truncate=42809
  staff                select=ROWS 13  insert=55000  update=55000  delete=55000  truncate=42809
  vet                  select=ROWS 3  insert=55000  update=55000  delete=55000  truncate=42809
  volunteer            select=ROWS 0  insert=55000  update=55000  delete=55000  truncate=42809
resident_diet_round_status
  admin                select=ROWS 85  insert=55000  update=55000  delete=55000  truncate=42809
  head_of_medical      select=ROWS 85  insert=55000  update=55000  delete=55000  truncate=42809
  management           select=ROWS 85  insert=55000  update=55000  delete=55000  truncate=42809
  second_in_command    select=ROWS 85  insert=55000  update=55000  delete=55000  truncate=42809
  staff                select=ROWS 85  insert=55000  update=55000  delete=55000  truncate=42809
  vet                  select=ROWS 16  insert=55000  update=55000  delete=55000  truncate=42809
  volunteer            select=ROWS 0  insert=55000  update=55000  delete=55000  truncate=42809

Write privileges authenticated or anon still hold on these views: none

260 statements, 0 failed.
RESULT: GREEN (after: no role can write through any of the six views; every select still works)
```

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The project's default privileges will give the next view the same write set | deferred to backlog |
| 2 | info | The 0158 status note read `residents_admin_delete` as a staff and management policy; it is Admin's, kept on purpose | fixed: roles doc, backlog and decision corrected |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | nothing: no screen changes, and every claim above is a database measurement | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-07

### Manual verification

- [x] The manual list above is empty

Manual verification by: n/a: no UI surface, database grants only

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the release manager reads this when the release is cut

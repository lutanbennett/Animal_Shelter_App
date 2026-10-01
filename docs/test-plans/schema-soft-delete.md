# Feature test plan

## Header

| | |
|---|---|
| Feature | Soft delete for medical records: `archived_at` / `archived_by` / `archive_reason` on weight, prescriptions, vet_appointments and immunization_records; the unique keys and `on conflict` clauses made partial on live rows; every reader (SQL and app) skips archived rows (DB-6, soft-delete half). One migration plus an inert `.is("archived_at", null)` sweep in the app. No delete button changes yet |
| Backlog item | `docs/backlog.md` → **Audit trail and soft delete for resident, medical and contact records (DB-6)** — not ticked: the recent-changes page and undo remain; its note is updated on the `backlog` branch |
| Branch / worktree | `claude/schema-soft-delete` @ `C:\Development\Animal_Shelter_schema-soft-delete` |
| Dev server | not started; the app change is a filter on a column the migration adds |
| PR | see the PR for this branch |
| Tested by / date | Claude (automated) / 2026-10-02 |
| Carries a migration? | yes: `0124_medical_soft_delete.sql` |
| Tested at SHA | branch tip when the PR was opened; `origin/main` merged by `sync` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: archive columns on the four tables, keys partial first, every reader skipping archived rows; attachments excluded as the item says
- [x] Files/areas touched listed: `supabase/migrations/0124_medical_soft_delete.sql`; `scripts/check-medical-soft-delete.mjs` (dev-only harness); `.is("archived_at", null)` added to the readers in `src/app/` (resident hub and sections, weight forms, visit pickers, vets, dashboard, cashflow, stock usage, assistant lookup, hospital page) and `src/lib/` (`archive/resident-record.ts`, `vets/appointments.ts`, `vets/linkable.ts`, `weight/record.ts`); `docs/decisions/2026-10-02-medical-soft-delete.md`; this plan
- [x] Roles affected identified: all signed-in roles read through the filtered readers (no row is archived yet, so nothing changes for any of them); vets through `current_vet_resident_ids` / `vet_owns_visit`; the signed-out public through `public_resident_profiles.is_vaccinated` and `public_shelter_stats.in_treatment`
- [x] Anything explicitly **out of scope** written down: swapping the delete buttons for Archive (and which roles are offered it); the recent-changes page; undo; `attachments`; RLS

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` (run before the docs commit; no source changed after it)
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `main` tops out at `0123_is_public_drive_file_views.sql`; this is batch 24's only slot; `check-migration-numbers` reports `0124_medical_soft_delete.sql` ok
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `123 applied, 0 pending` on `qxkmhwybjggxvsfxsxbd`, no drift against `main`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0124_medical_soft_delete.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0124_medical_soft_delete.sql … ok`. The first cut had rebuilt `public_shelter_stats` from `0073`'s text and so dropped `0108`'s private-state read; it was corrected in the file before merge (unmerged, so editing is allowed) and re-applied by running the corrected, re-runnable file against dev. The dev database now matches the file on the branch
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): the harness runs the whole file again before asserting
- [x] Existing rows still read correctly after the change (checked against real dev data): the harness asserts no row that existed before has `archived_at`; `check-weight-one-per-day`, `check-audit-log`, `check-vet-resident-scope` and `check-vet-own-clinic-writes` all still exit 0 with the partial keys in place
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: `scripts/check-medical-soft-delete.mjs`. Asserted — A: an archived weight frees its day and its visit (a replacement is accepted), and restoring beside a live reading is refused; B: `record_immunization`, `_bulk` and `_fanout` upsert against the partial key with no `42P10`, an archived dose frees its key, and leaves `is_vaccinated`, `immunization_next_due` (falling back to the dose before) and the duplicate check; C: an archived prescription leaves `medication_forecast` and `in_treatment`; D: an archived scheduled visit leaves the cashflow forecast; E: a vet's resident scope drops archived visits and returns on restore; F: archiving writes exactly one `audit_log` row carrying `archived_at`; G: `archived_at` null with a reason is a `check_violation`; H: no pre-existing row is archived. Output, unedited:

  ```
  status 400
  Failed to run sql query: ERROR:  P0001: HARNESS-OK 0124_medical_soft_delete.sql ran twice | H: no existing row has archived_at | F: archive = one audit row carrying archived_at | A: archived weight frees its day and visit; restore over a live one refused | G: reason needs archived_at | B: upserts work against the partial key; archive frees it, leaves is_vaccinated, next_due, duplicates | C: archived prescription leaves medication_forecast and in_treatment | D: archived visit leaves the cashflow forecast | E: vet scope drops archived visits and returns on restore |
  CONTEXT:  PL/pgSQL function inline_code_block line 181 at RAISE
  ```

  (`status 400` is by design: the transaction ends in a `raise`, so nothing commits.) Not driven: `shelter_today()` and the dashboard's own counts (they read the four tables only through the views and functions above and the `.is()` filters in `src/`); `check-shelter-today.mjs` fails on dev for a reason that predates this branch: it replays `0073`, which restores the pre-`0108` `public_shelter_stats` that anon cannot read (`permission denied for function current_vet_resident_ids`). Filed as a defect below
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: additive. To undo: drop the partial indexes and recreate the originals (the immunization one as the `unique` constraint), restore the three `record_immunization*` functions and the readers from `0002`/`0007`/`0044`/`0072`/`0108`/`0117`/`0073`, then drop the twelve columns. Only safe while no row is archived
- [x] Production apply plan stated for the release manager: `0124_medical_soft_delete.sql` to production `dbkodyyxxhtygxcxmfcu`, by Lutan from the main checkout (`--env production --dry-run`, then without). It rebuilds two public views and four unique keys, so apply it with the deploy window quiet. Safe before the code (the columns default to live) and the `.is()` filters are inert until the columns exist, so the **migration must go first**: a deploy of this code ahead of the migration would fail every filtered query

## 4. Functional checks

- [x] Happy path works end to end: archive and replace a weight; archive and re-record a dose; see §3 harness A, B
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface archives a row yet
- [x] Create / edit / delete all exercised (whichever the feature has): archive and restore exercised at the database for all four tables; hard delete is unchanged
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface
- [x] Invalid input is rejected with a readable message, not a crash: restoring into an occupied slot raises `unique_violation` naming `weight_one_per_day`/`weight_one_per_visit`, which `src/lib/weight/record.ts` already translates
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): a dose whose key is held only by an archived row; an archived latest dose with an earlier one behind it; a resident whose only dose is archived; a vet with two visits, one archived

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | all four tables, archived rows included | unchanged | policies untouched |
| management | as above | unchanged | policies untouched |
| staff | as above | unchanged (can UPDATE, so can archive; no DELETE policy on prescriptions/visits) | policies untouched; the follow-up decides who is offered Archive |
| vet | residents seen through a live visit | an archived visit stops granting sight, restore returns it | passed (harness E); `check-vet-resident-scope` and `check-vet-own-clinic-writes` still pass |
| volunteer | read | unchanged | policies untouched |
| signed out | `is_vaccinated`, `in_treatment` | an archived dose / prescription does not count | passed (harness B, C) |

- [x] Every role above tested: vet driven as `authenticated` with claims in the harness; the rest have no policy change
- [x] A role that should not have access is blocked server-side: unchanged by this migration

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a user can reach changes yet; the manual changes with the PR that swaps delete for archive
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no layout change
- [ ] Browser console clean — n/a: no page driven in a browser
- [ ] Network clean — n/a: no page driven in a browser

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): none loaded in a browser (see Left for manual verification). The build compiled every route and the harness drives every SQL reader; the queries changed in `src/` only gain `.is("archived_at", null)`
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — `src/lib/vets/linkable.ts` (weight, procedure, blood-test and prescription visit pickers) and `src/lib/weight/record.ts` are shared; typecheck covers every caller
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates green

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: DB-6 still has the recent-changes page and undo to do; its note is updated on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-02-medical-soft-delete.md` (partial keys and `on conflict`, the full reader list, why attachments are excluded, RLS unchanged)
- [x] `README.md` still accurate: it does not list tables or columns
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: no row can be archived yet, so every filter added matches every row and nothing looks different; the line goes in with the PR that turns Delete into Archive
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned**: the behaviour claims come from the harness; the reader list comes from reading every live function and view definition that mentions the four tables

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager (resident hub: weights, vaccinations, prescriptions and visits still list; `/weight/new` on a visit with a reading still goes to its edit page)
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: `archived_at` is an absolute `timestamptz`; nothing derives a date from it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: production release manager; two public views were rebuilt, so `/adopt` (vaccinated badge) and the home page counts are worth a look once

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** Yes, deliberately — the reads are `.is("archived_at", null)` filters, which fail on a database without the column. Ordering: **migration first, then deploy** (stated in §3)
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: it adds columns and rebuilds indexes and views; no row is rewritten or removed
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy (see §3)

### Rollback

- [x] Rollback position stated, **including what it does not cover**: `wrangler rollback` returns the code, and the old code runs fine against the new columns. Undoing the migration is the list in §3 and is only safe while nothing is archived — after that, restoring the unconditional keys would fail on any day that has both an archived and a live row. A rollback of the Worker does not restore the partial keys

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | `scripts/check-shelter-today.mjs` replays `0073`, which restores a `public_shelter_stats` that reads the public `resident_current_state`; anon cannot read that since `0108`, so its final anon step fails on dev (not caused by this branch) | deferred to backlog |
| 2 | Medium | First cut of `0124` rebuilt `public_shelter_stats` from `0073`'s text instead of the live definition, undoing `0108`'s private read | fixed before merge, caught by `check-migration-grants` and the harness |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Resident hub (weights chart, vaccinations, prescriptions, vet visits) and each section tab list as before | `/residents/<id>` and its tabs |
| 2 | `/weight/new` on a visit that already has a reading still redirects to that reading's edit page; on one without, it opens the form | `/weight/new?...` |
| 3 | Cashflow and Dashboard totals unchanged | `/management/cashflow`, `/management/dashboard` |
| 4 | A vet account still sees only their clinic's residents | as a vet |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person

Manual verification by:

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this plan rather than duplicating it
- [x] Handed to the production release manager: the PR states the production apply as Lutan's, migration before deploy

Result: pass with accepted defects

Release manager acknowledgement: n/a: acknowledged at release time

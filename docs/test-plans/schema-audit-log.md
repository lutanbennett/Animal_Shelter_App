# Feature test plan

## Header

| | |
|---|---|
| Feature | `audit_log`: before/after images of every insert, update and delete on residents, contacts, prescriptions, vet_appointments, weight, attachments and immunization_records, written by a security-definer after-trigger, admin-read only, append-only (DB-6, schema half). One migration, no UI change |
| Backlog item | `docs/backlog.md` → **Audit trail and soft delete for resident, medical and contact records (DB-6)** — not ticked on this branch: soft delete is deliberately not in it (see the decision file); the item is split on the `backlog` branch |
| Branch / worktree | `claude/schema-audit-log` @ `C:\Development\Animal_Shelter_schema-audit-log` |
| Dev server | not started. No `src/` change |
| PR | see the PR for this branch |
| Tested by / date | Claude (automated) / 2026-10-01 |
| Carries a migration? | yes: `0121_audit_log.sql` |
| Tested at SHA | branch on `main` @ `1ee1c62` plus `origin/main` merged by `sync`, the migration, its harness, a `check-public-views.mjs` addition, the decision note and this plan |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the log table, trigger and admin-only read are what was asked; `archived_at` on medical rows was asked for and is deliberately left to its own item, with reasons recorded
- [x] Files/areas touched listed: `supabase/migrations/0121_audit_log.sql`; `scripts/check-audit-log.mjs` (dev-only harness); `scripts/check-public-views.mjs` (anon refused on `audit_log`); `docs/decisions/2026-10-01-audit-log.md`; this plan. No `src/`, no `worker/`
- [x] Roles affected identified: admin (reads the log); staff, vet, volunteer and management (refused the log; their writes to the seven tables now also write a log row); signed-out public (refused)
- [x] Anything explicitly **out of scope** written down: the recent-changes page and undo; `archived_at` on weight, prescriptions, vet_appointments and immunization_records (unique keys and every reader would need changing); existing rows are not back-filled into the log

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

  ```
  === gates: build exited 0 after 127s

  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `main` tops out at `0120_contact_map_url_check.sql`; this is batch 22's only migration slot; `check-migration-numbers` reports `0121_audit_log.sql` ok
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `120 applied, 0 pending` on `qxkmhwybjggxvsfxsxbd`, no drift against `main`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0121_audit_log.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0121_audit_log.sql … ok`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): the harness runs the whole file twice
- [x] Existing rows still read correctly after the change (checked against real dev data): nothing is rewritten and no existing row is touched; the triggers fire on later writes. `check-weight-one-per-day`, `check-contacts-archive`, `check-prescriptions-updated-at`, `check-placement-guards` (which drives the deceased cascade and `undo_deceased_placement()` across `residents` writes) and `check-vet-resident-scope` all still exit 0 with the triggers in place. `check-resident-microchip` exits 1 on its step A (it asserts dev has no residents with a chip, and dev now has real ones); that is dev data and not this change, and it fails before any trigger could matter
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: `scripts/check-audit-log.mjs`, as real `authenticated` admin, staff, vet and volunteer sessions, `service_role` and the table owner. Asserted: insert, update and delete each write exactly one row on contacts, weight, prescriptions, vet_appointments, immunization_records and attachments (and update on residents), with the right op, `row_id` and images; `actor` is the session's login (staff, admin) and null for the owner; residents' images carry neither `microchip_number` nor `microchip_implanted_on` and the chip number appears nowhere in the row; a no-change update and a chip-only update write nothing; admin sees the rows, volunteer, staff and vet see zero; no API role (admin included) can insert, update, delete or truncate `audit_log`; `service_role` is refused update and delete; the owner is refused update, delete and truncate by the trigger; `anon` has no select; `record_audit()` and `audit_log_refuse_change()` are not executable by `anon` or `authenticated`. Output, unedited:

  ```
  status 400
  Failed to run sql query: ERROR:  P0001: HARNESS-OK file ran twice | A1 insert/update/delete recorded on residents, contacts, prescriptions, vet_appointments, weight, attachments, immunization_records | A2 actor is the session login (staff, admin), null for the owner | A3 residents images omit microchip_number and microchip_implanted_on | A4 no-change and excluded-column-only updates write nothing | R1 admin reads, volunteer/staff/vet see zero rows | R2 staff writes recorded though they cannot read the log | W1 no API role (admin, service_role included) inserts, updates, deletes or truncates; the owner is refused by the trigger | W2 trigger functions not executable by anon/authenticated
  CONTEXT:  PL/pgSQL function inline_code_block line 166 at RAISE
  ```

  (`status 400` is by design: the transaction ends in a `raise`, so nothing commits; the script exits 0 only on `HARNESS-OK`.) Not driven: a `residents` insert or delete, and non-admin writes to `vet_appointments` (vet scope policies refuse the harness's vet); the trigger is the same function on every table, and admin writes to `vet_appointments` are covered
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: additive. To undo: drop the seven `audit_*` triggers, `record_audit()`, then the two `audit_log_no_*` triggers and `audit_log_refuse_change()`, then `audit_log`. That discards the history, so only do it before anything depends on it
- [x] Production apply plan stated for the release manager: `0121_audit_log.sql` to production `dbkodyyxxhtygxcxmfcu`, by Lutan from the main checkout (`--env production --dry-run`, then without). Safe before or after any deploy, since no code reads it; the log starts empty at apply time and is not back-filled

## 4. Functional checks

- [x] Happy path works end to end: an edit by a signed-in role produces an audit row readable by admin (harness A1, A2, R1)
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface
- [x] Create / edit / delete all exercised (whichever the feature has): all three ops across the tables, see §3
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface
- [x] Invalid input is rejected with a readable message, not a crash: a write to `audit_log` is `permission denied` for API roles and `audit_log is append-only: UPDATE is not allowed` for the owner
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): a no-change update; an update touching only an excluded column; an insert (no `old_row`) and a delete (no `new_row`), which the table's `audit_log_images_match_op` check enforces

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | read `audit_log` | allowed; write refused | passed (harness R1, W1) |
| management | read `audit_log` | refused (admin only) | not driven separately; the policy names `admin` alone |
| staff | read `audit_log` | zero rows; own writes recorded | passed (harness R1, R2) |
| vet | read `audit_log` | zero rows | passed (harness R1) |
| volunteer | read `audit_log` | zero rows | passed (harness R1) |
| signed out | `audit_log` read and write | refused | passed: `check-public-views.mjs` GET, POST, PATCH, DELETE all refused (HTTP 401/400) |

- [x] Every role above tested: admin, staff, vet and volunteer driven as `authenticated` with claims; management shares no policy on the table; anon through the real Data API
- [x] A role that should not have access is blocked server-side: yes, by RLS for reads and by grant plus trigger for writes

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a user can reach changes
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): no page loaded. The writers of the seven tables are exercised at the database by `check-placement-guards` (residents and placement cascade), `check-weight-one-per-day`, `check-contacts-archive`, `check-prescriptions-updated-at` and `check-vet-resident-scope`, all passing with the triggers present
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates green

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: the item also asked for `archived_at` on medical rows, which this PR does not do; it is reworded and the remainder filed on the `backlog` branch rather than ticked here
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-01-audit-log.md` (whole rows and the one exclusion, three layers of access, no foreign keys, why soft delete is deferred)
- [x] `README.md` still accurate: it does not list tables or triggers
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: no UI surface and no behaviour a shelter user can see; nothing is deleted differently, since soft delete is not in this migration
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned**: the behaviour claims come from the harness; the soft-delete reasons come from reading `0106`, `0002`, `0007` and the readers in `supabase/migrations/`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (SQL only, already on the dev database that `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: `at` is an absolute `timestamptz`; nothing derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public view reads `audit_log`, and `check-public-views.mjs` shows it refused to anon

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No: no `src/` change
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: nothing destructive or rewriting; new table and triggers only
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy (see §3)

### Rollback

- [x] Rollback position stated, **including what it does not cover**: no Worker change, so `wrangler rollback` does not apply. Undoing the migration is the drop list in §3, and it discards whatever history has accumulated. Every later write to the seven tables carries one extra insert, so a slow bulk import on those tables is the thing to watch

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | `scripts/check-resident-microchip.mjs` step A asserts dev has no residents with a chip; dev now has some, so it fails regardless of this change | deferred to backlog |

## Left for manual verification

Empty. There is no screen; the log is not read by any page yet.

| # | What to check | Where |
|---|---|---|
| — | — | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-01

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: the manual list is empty — schema-only change, verified by the rollback harness

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this plan rather than duplicating it
- [x] Handed to the production release manager: the PR states the production apply as Lutan's

Result: pass with accepted defects

Release manager acknowledgement: n/a: schema PR; acknowledged at release time

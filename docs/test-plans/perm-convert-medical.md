# Feature test plan

## Header

| | |
|---|---|
| Feature | `0135_perm_convert_medical.sql`: R5's first conversion. The seven resident medical tables (`vet_appointments`, `procedures`, `blood_tests`, `prescriptions`, `immunization_records`, `weight`, `resident_diets`) stop naming roles and ask `(select has_permission(…))` plus the new `sees_all_clinical()`. The first time the seeded matrix is load-bearing in the database |
| Backlog item | `docs/backlog.md` → Auth → **Roles build, then one role at a time**. **Not ticked**: three conversions (`-residents`, `-people`, `-stock-and-lists`), R2 to R4 and R6 remain; the item carries a status line naming this stream and what the measurement showed |
| Branch / worktree | `claude/perm-convert-medical` @ `C:\Development\Animal_Shelter_perm-convert-medical` |
| Dev server | not started: this change ships no runtime code, and no browser was driven (see Left for manual verification) |
| PR | opened from this branch; the number is recorded in the follow-up commit that ticks CI |
| Tested by / date | Claude (automated) / 2026-10-04 |
| Carries a migration? | yes: `0135_perm_convert_medical.sql` |
| Tested at SHA | the branch tip at the commit that adds this plan, on `main` @ `7d0a3971` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the `management_*` and `staff_*` policies on seven medical tables are replaced by one select, insert and update policy each that asks `has_permission()` for the table's activity and `sees_all_clinical()` for the scope, leaving `admin_all_*` and `vet_*` alone, with the parity check green before and after and §10's measurement taken
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0135_perm_convert_medical.sql`; `scripts/lib/permission-probes.mjs` (C5's `known` list narrowed to the vet); `scripts/check-role-write-policies.mjs` (reads `has_permission()` policies); `scripts/check-perm-convert-medical.mjs` (new); `docs/decisions/2026-10-04-perm-convert-medical.md`; `docs/backlog.md` (status line). No `src/`, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public: **management and staff** now answer through the matrix (same answers, delete closed on `weight`); **volunteer, no role, an archived person** still see and write nothing; **vet** unchanged and proved so; **admin** unchanged (`admin_all_*` kept); signed-out public has no grant on these tables. A configured role holding a medical cell now gets the table, which no login does yet
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: `src/` (the app predicates were swept in #340); the vet policies (Last) and Admin's (R6); the reference lists these tables point to (`medication`, `frequency`, the `*_types`, `-stock-and-lists`); `attachments`, `placement_history`, `residents` (`-people`, `-residents`); splitting `visit.book` from `medical.visits`; a `medical.archive` trigger; production

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync`: `origin/main` merged in cleanly (`Already up to date.`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line, as printed:

  ```
  === gates: build exited 0 after 178s
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `main` tops out at `0134_volunteer_narrowing.sql`; `check-migration-numbers` reports `0135_perm_convert_medical.sql` against `origin/main 7d0a3971`; the brief names this the only migration in flight
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `134 applied, 1 pending` on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0135_perm_convert_medical.sql … ok`, no consumer warning (all six declared consumer files exist on `origin/main`)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0135_perm_convert_medical.sql … ok`, from this branch; `--status` now lists it as applied here with no file on `origin/main`, as expected before merge
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): `create or replace function`, `drop policy if exists` before every `create policy`, and the management/staff drop reads `pg_policies`. Proved by replaying the file twice in one `begin; … rollback;` against dev: `HARNESS-OK twice, 6 perm policies` (weight and prescriptions, three each)
- [x] Existing rows still read correctly after the change (checked against real dev data): staff read the same 13 current prescriptions through the medication-list query before and after (`measure-permission-baseline.mjs`, 13 rows both times); `check-permission-parity.mjs` and the new harness read dev's real rows as staff and management
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness, `scripts/check-perm-convert-medical.mjs`. Asserted, for each of the seven tables, read / update / insert / delete under each login's own JWT: admin all four; management and staff read, update and insert but not delete; volunteer, no role, and a configured role scoped `own_clinic` with Edit cells refuse all four; a configured Read role reads and refuses the writes; a configured Edit role reads, updates and inserts but cannot delete; a vet reads the own-clinic resident and not another clinic's. Plus three sweeps: no policy on these tables names management or staff, every `_perm` policy wraps `has_permission()` in `select`, and there are 21 `_perm` policies. Output, as printed:

  ```
  241 checks held, 0 failed.
  RESULT: GREEN (every converted table answers as the cells say; volunteer, no-role and scoped roles still see nothing; vets unchanged)
  ```

  Not shown red against an unconverted table: the policies it asserts did not exist before the apply (see the decision file). The first parity run after the apply was RED with exactly the two predicted STALE entries, which is what shows a closing is noticed
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: additive in effect and reversible by the file's own header (drop the `_perm` policies and `sees_all_clinical()`, re-create `management_*` and `staff_*` from `0001`, the later files that name them, and `0131` for `blood_tests`); no data changes, and a down-migration would be a second copy of 14 policies. Nothing rolls back by itself, but nothing here is destructive of rows
- [x] Production apply plan stated for the release manager (which file, which project, when): `0135_perm_convert_medical.sql` to production `dbkodyyxxhtygxcxmfcu`, by Lutan from the main checkout, `--dry-run` then apply, after this PR merges. No app code in this PR reads anything new, so there is no ordering constraint against a deploy. Run `node scripts/check-permission-parity.mjs` as the production sanity step only against dev (it refuses other projects); the production check is a staff login opening a resident's weight and medication pages

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI change; the database happy path (staff and management read, insert and update all seven tables) is asserted by the harness. Whether the pages themselves still render for each role is the manual list below
- [ ] Data persists — reload the page and the change is still there — n/a: no UI change; the harness reads back the rows it writes within the transaction (the update probes match one row)
- [x] Create / edit / delete all exercised (whichever the feature has): insert and update succeed for the roles whose cell allows, and delete is refused for everyone but admin, in the harness over all seven tables
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI change
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no inputs; a refused write is a 42501 or zero rows, and the app's existing "not allowed" paths already handle both
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): the boundaries are the scope and the cell, asserted from both sides: Read versus Edit (the Read role), in scope versus out (the vet's two clinics, the `own_clinic` configured role), a live versus absent role (no role)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | all seven tables, delete included | no change | allowed read, update, insert and delete on all seven (`admin_all_*` kept) |
| management | all seven tables, no delete | no change but C5 closed on `weight` | read, update, insert allowed; delete refused on all seven (harness, one case per table) |
| staff | all seven tables, no delete | no change but C5 closed on `weight` | read, update, insert allowed; delete refused on all seven |
| vet | own clinic's residents' rows | no change | in-clinic rows read, other clinic's refused, on all seven (the `vet_*` policies, untouched; `check-vet-resident-scope` and `check-vets-readonly` pass) |
| volunteer | nothing on these tables | refused | all four commands refused on all seven: `0134`'s removal is not undone by an OR-ed policy |
| signed out | nothing | no change | no grant to `anon` on these tables (unchanged); the migration grants `sees_all_clinical()` to `authenticated` and `service_role` only |

- [x] Every role above tested: admin, management, staff, volunteer, vet by the harness under their own JWTs; signed out by the grant, not exercised as a session
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): the refusals are database refusals under the role's own JWT, not a hidden control

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a reader of the manual could see changed
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change, no browser driven
- [ ] Network clean — n/a: no UI change, no browser driven

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — no page loaded (see manual list). The database paths under them were re-run after the apply and each ends in its pass line: `check-permission-parity` (GREEN, 1,924 match / 36 known / 0 mismatch), `check-volunteer-narrowing` (GREEN, 55 rights), `check-role-write-policies` (all hold), `check-permission-catalogue` (all ok), `check-medical-archive-roles`, `check-medical-soft-delete`, `check-prescriptions-updated-at`, `check-prescription-visit-not-future`, `check-lifecycle-guards`, `check-vets-readonly`, `check-vet-resident-scope`, `check-permission-tables`, `check-role-can`, `check-audit-log`, `check-medication-list-due` (27/27). Not run: scripts that need a running dev server
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — `Already up to date.`; nothing to merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead): deliberately **not** ticked, three conversions remain; the item's status line names this stream, the tables converted and what the measurement showed
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `docs/decisions/2026-10-04-perm-convert-medical.md`: the policy shape the other three copy, the `(select …)` requirement, `sees_all_clinical()` and why a cell alone would hand a vet the shelter, no delete policy, what was dropped and left, which tightening closed, the before and after numbers, and what the volunteer-borrowing roles still cannot read
- [x] `README.md` still accurate: it does not describe the role model
- [ ] **Release notes.** n/a: nobody would notice: management and staff are answered exactly as before, nobody holds the roles that would differ, and the one closed right (hard-deleting a weight row from a hand-built request) has no button
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The counts (241 checks, 1,924 / 36 / 0, the milliseconds and buffer hits) are the scripts' output. Reasoned and worded as such in the decision file: that the "before" parity totals were not captured (only its GREEN was seen), and that the cause of the `c_edit` insert failures was the reference-list lookup, by inference from the fix passing

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (SQL only, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** Read versus Edit, in scope versus out, and role versus no role are each asserted from both sides, on all seven tables
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public view or table changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No: nothing in `src/` changed; the existing pages read the same tables
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no row is touched; policies and one function only
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — see §3

### Rollback

- [x] Rollback position stated, **including what it does not cover** — no Worker change, so `wrangler rollback` is irrelevant. To undo: drop the `_perm` policies and `sees_all_clinical()` and re-create `management_*` and `staff_*` from the files named in the migration header. It does not restore anything if a role has since been given a medical cell it relies on through these policies

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low, found by this work | A role that borrows the volunteer and holds a medical Edit cell cannot look up the reference lists (`procedure_types` and the other `*_types`, `medication`, `frequency`) to record anything: they still name roles and the volunteer lost them in `0134`. Refused, not leaked; no login holds such a role | deferred: `perm-convert-stock-and-lists` converts those lists; the decision file says so |
| 2 | Low | A role with `medical.weight` Edit but not `medical.archive` can archive a record, because archiving is an UPDATE and the edit policy covers it (as it did before; N4 is the vet half). No such role exists | accepted: needs a trigger (a policy cannot see the old row); recorded in the decision file |
| 3 | Low | `check-role-write-policies.mjs` read role names out of policy text and would fail every converted table | fixed in this PR |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as staff, then management, then a vet, open a resident's Weight, Prescriptions, Procedures, Blood tests, Immunizations and Diet pages and the Vet visits list, and add one weight: each loads and saves as before; the vet sees only the clinic's residents | dev, `http://localhost:3007` or `test.lannacare.org` |
| 2 | Management → Medication list loads for management with the same prescriptions as before | dev |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-04

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; items 1 and 2 wait for someone with a login

Manual verification by: pending: a person opening the seven medical pages as staff, management and a vet, and the medication list (items 1 and 2 above); no browser was driven by Claude

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the release manager reads this when the release is cut

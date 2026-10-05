# Feature test plan

## Header

| | |
|---|---|
| Feature | `0145_perm_convert_orphans.sql`: the policies no conversion stream owned (`enclosures`, `zones`, `group_origins`, the three rounds tables, `item_unit_conversions`, `stock_receipts`, `stock_counts`, the recurring tables) stop naming roles and ask `(select has_permission(…))`; `docs/roles-and-permissions.md` §15 now says who converts every table that still names a role; `scripts/check-policy-role-names.mjs` is the query the last conversion ends on |
| Backlog item | `docs/backlog.md` → Auth → **Role-naming policies no conversion stream owns**: ticked, because every name in it now has an owner (converted here, or deferred with a reason and a stream named). Foundation 3 is **not** ticked; its status line is extended |
| Branch / worktree | `claude/perm-convert-orphans` @ `C:\Development\Animal_Shelter_perm-convert-orphans` |
| Dev server | not started: this change ships no runtime code, and no browser was driven (see Left for manual verification) |
| PR | opened from this branch; the number is recorded in the follow-up commit that ticks CI |
| Tested by / date | Claude (automated) / 2026-10-05 |
| Carries a migration? | yes: `0145_perm_convert_orphans.sql` |
| Tested at SHA | the branch tip at the commit that adds this plan, merged with `origin/main` @ `16ad6efb` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the role-naming policies on the tables the item lists (and the ones it missed) are replaced by one policy per command that asks `has_permission()`, every table still naming a role is given an owner in §15, and a script asserts the end state as a query on policy text rather than a name prefix
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0145_perm_convert_orphans.sql`; `scripts/check-policy-role-names.mjs` and `scripts/check-perm-convert-orphans.mjs` (new); `scripts/lib/permission-probes.mjs` (C1's `known` entries removed, C8's note); `scripts/check-stock-receipts.mjs` and `scripts/check-2ic-role.mjs` (a delivery can no longer be updated by anyone: the assertion changed); `scripts/measure-permission-baseline.mjs` (`MEASURE_PRE_SQL`, so a "before" can be measured); `docs/roles-and-permissions.md` (§3 C1 and C8, §15 table and "Where the orphans landed"); `docs/decisions/2026-10-05-perm-convert-orphans.md`; `docs/backlog.md`. No `src/`, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public: **management and staff** lose only writes the app never makes (C1: enclosures and zones, now Read; `group_origins` writes; C8: an update of a delivery) and keep every answer they had on screen; **admin** unchanged (has_permission() says yes; `admin_all_*` kept where it exists); **vet** unchanged and proved so (rounds writes through the parent's clinic limit, the four recurring reads through new `vet_read_*` policies); **volunteer** and a person with no role unchanged (refused everywhere but the enclosures and zones, which the volunteer's own policy and Read cell both give); signed-out public has no grant; **a configured role that borrows `staff` and holds no cell gets nothing on all thirteen tables**
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: `attachments` and the photo tables (the photo split); `contacts`, the clinic tables and Shelter Friends (`perm-convert-people`); the setup lists (`-stock-and-lists`); `facility_maps`, `fixed_outgoings`, `translations`, `assistant_actions` (`-settings`); `maintenance`, `maintenance_assignees`, `project_folders` (the new `perm-convert-work`); the vet policies and Admin's; `src/`; production

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync`: `origin/main` merged in (one conflict, `docs/backlog.md`, where the same two lines were edited on the `backlog` branch; resolved by keeping this branch's ticked item and taking the two new items); a second `sync` reported `Already up to date.` and pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line, as printed:

  ```
  === gates: build exited 0 after 533s
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `check-migration-numbers.mjs` reports `migration numbers: ok — 0145_perm_convert_orphans.sql (against origin/main 16ad6efb, highest 0144_perm_convert_residents.sql)`; the brief names this the batch's only migration
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `144 applied, 1 pending` on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0145_perm_convert_orphans.sql … ok`, the only pending file
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0145_perm_convert_orphans.sql … ok`, from this branch. **Applied three times**, because the file was changed twice before merge after the first apply (the second to add a stock-receipt update policy and the third to take it out again, once `check-2ic-role.mjs` showed the 2IC's own check asserts nobody changes a delivery). Each re-apply deleted the file's `schema_migrations` row first, so the script, not hand-posted SQL, ran the file; the one interim policy was dropped by hand. The final state is the final file, and that is what the checks below ran against
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): every policy the migration owns, and every one it replaces, is dropped from `pg_policies` by name before the `create policy`s. **Replayed twice in practice** (the re-applies above), and `check-permission-parity` and the harness were green after the last
- [x] Existing rows still read correctly after the change (checked against real dev data): the harness and `check-permission-parity.mjs` read dev's real rows (`stock_counts`, the recurring occurrences, 17 zones); `measure-permission-baseline.mjs` returns 92 residents for staff before and after
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness, `scripts/check-perm-convert-orphans.mjs`. Asserted, for 13 tables, read / update / insert / delete under each login's own JWT: admin, management, staff, volunteer, vet, a person with no role, and ten configured roles on the staff floor (one with no cell, one each holding `facility.enclosures` Read and Edit, `resident.register`, `medical.diet`, `medical.prescriptions`, `reference.types`, the three stock cells, and `recurring.manage` with and without `recurring.do_own`). Plus two sweeps (no policy on those tables names management or staff; every new policy wraps `has_permission()` in `select`) and a count of 28 new policies. Output, as printed:

  ```
  691 checks held, 0 failed.
  RESULT: GREEN (each table answers as its cell says; a staff-floor role with no cell gets nothing; vets unchanged)
  ```

  Not shown red against the unconverted tables: the policies it asserts did not exist before the apply. The first parity run after the apply was RED with exactly the predicted STALE entries (C1, four answers), which shows a closing is noticed. Two fixture faults and one wrong expectation were found writing it, each reported by the harness's own "the statement errored" case or a plain mismatch, and fixed in the fixture or the expectation; none was a policy fault
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: reversible by the file's own header (drop the `_perm` policies and `vet_read_recurring_*`, re-create the dropped ones from the files named there); no data changes
- [x] Production apply plan stated for the release manager (which file, which project, when): `0145_perm_convert_orphans.sql` to production `dbkodyyxxhtygxcxmfcu`, by Lutan from the main checkout, `--dry-run` then apply, after this PR merges. No app code in this PR reads anything new, so there is no ordering constraint against a deploy. The production check is a staff login opening Settings → Zones and Enclosures (read only) and a management login on `/management/recurring-jobs`

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI change; the database happy path is asserted by the harness. Whether the pages themselves still render for each role is the manual list below
- [ ] Data persists — reload the page and the change is still there — n/a: no UI change; the harness's update probes each match a row
- [x] Create / edit / delete all exercised (whichever the feature has): insert, update and delete under each table's cell, and refused without it, on all thirteen tables
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI change
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no inputs; a refused write is a 42501 or zero rows, which the app's existing "not allowed" paths handle
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): the boundaries are the cell, from both sides: Read versus Edit (`facility.enclosures`), a write cell without the read cell (`recurring.manage` alone: insert allowed, update and delete refused, a finding), the cell with and without its parent row visible (rounds), and a vet in and out of its own clinic's diet

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | all thirteen tables | no change, but update of a delivery (no policy for anyone) | allowed every command the cell grants; update of a delivery refused, like everyone |
| management | enclosures and zones read only; rounds, recurring, unit conversions and deliveries as before | no change but C1, C8, `group_origins` and `frequency_rounds` writes | as listed; the harness asserts each cell |
| staff | enclosures and zones read only; rounds, deliveries as before; recurring read | no change but C1, C8, `group_origins` writes | as listed |
| vet | enclosures and zones read; rounds written inside its own clinic; `frequency_rounds` and the four recurring tables read | no change | as listed: rounds insert allowed for the own-clinic diet, every other write refused |
| volunteer | enclosures and zones read (own policy); nothing else | no change | as listed |
| signed out | nothing | no change | no grant to `anon` on these tables (unchanged) |

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

- [x] The pages nearest the change still work (list the ones checked) — no page loaded (see manual list). The database paths under them were re-run after the last apply and each ends in its pass line: `check-permission-parity` (GREEN, **before 1,926 match / 34 known / 0 mismatch, after 1,930 / 30 / 0**: C1's four answers closed), `check-permission-catalogue`, `check-permission-tables`, `check-policy-role-names`, `check-volunteer-narrowing`, `check-role-write-policies`, `check-medical-role`, `check-2ic-role` (313 held; one assertion changed, C8), `check-maintenance-role`, `check-medication-rounds`, `check-stock-receipts` (one assertion changed, C8), `check-stock-deliveries`, `check-stock-reading`, `check-stock-usage`, `check-unit-conversions`, `check-stocktake`, `check-recurring-jobs`, `check-public-enclosures`, `check-vets-readonly`, `check-vet-resident-scope`, `check-medical-archive-roles`, `check-role-can`, `check-standard-diet`. **Three did not pass and were not caused by this change:** `check-recurring-job-eligibility` (one case, `canDoJob(/management)` answers true for staff and volunteer; it fails identically from the main checkout against the same database, reads only `role_can()` over the cells and `src/`, and this PR touches neither), `check-facility-maps` (`facility_maps_one_overview`: dev already holds an overview map, left by the map editor's own checks) and `check-facility-map-editor` (needs a running dev server; ECONNREFUSED)
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge changed only `docs/backlog.md`'s two lines (above) and what `main` carried in

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead): the orphan item ticked; foundation 3's status line extended and not ticked (`-people`, `-stock-and-lists`, `-settings` and `perm-convert-work` remain). The follow-ups (`perm-convert-work`; whether `has_permission()` needs a statement-level cache) are on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `docs/decisions/2026-10-05-perm-convert-orphans.md`: why `group_origins` gets no activity, why the rounds ask the cell and the visible parent and not a clinic scope, why `frequency_rounds` writes are `reference.types`, C8, what the first run of the new script found, the measurement
- [x] `README.md` still accurate: it does not describe the role model
- [ ] **Release notes.** n/a: nobody would notice: every right closed is a hand-built request the app never makes (writing an enclosure as management or staff, updating a delivery), and `src/` is untouched. The residents list is about 1 ms slower for staff on dev's 92 residents, which nobody would see
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The counts (691 checks; 1,926 / 34 / 0 to 1,930 / 30 / 0; 22 tables and 50 policies still naming a role) and the milliseconds and buffer hits are the scripts' output. Reasoned and worded as reasoning in the decision file: that the residents-list cost is the two extra init-plans (the buffers fit; no separate run isolated it)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (SQL only, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** Read versus Edit, cell versus no cell on the same floor, a write cell with and without its read cell, a parent visible versus not
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public view or table changed; `check-public-enclosures` passes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No: nothing in `src/` changed; the existing pages read the same tables
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no row is touched; policies only
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — see §3

### Rollback

- [x] Rollback position stated, **including what it does not cover** — no Worker change, so `wrangler rollback` is irrelevant. To undo: drop the `_perm` policies and `vet_read_recurring_*` and re-create the policies named in the migration header. It does not restore anything a role has since been given a cell for and relies on through these policies

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium, found by this work | The item's list was incomplete: 22 tables and 50 policies still name a role after this migration, 21 of them not in the item; some (`maintenance`, `maintenance_assignees`, `project_folders`) belonged to no conversion row at all | fixed in this PR by ownership: every one is in §15 and `check-policy-role-names.mjs`, which fails on an unowned or stale entry; the new `perm-convert-work` is on the `backlog` branch |
| 2 | Low | `check-stock-receipts.mjs` and `check-2ic-role.mjs` asserted opposite things about updating a delivery (one: management can, the other: the cell holder cannot); a cell cannot tell a staff login from the 2IC's | fixed: C8 decided, nobody updates a delivery, both checks now assert it; the app never did |
| 3 | Low | A cell alone is not always enough: `recurring.manage` without `recurring.do_own` gives insert but not update or delete (the statement must also read the row) | accepted: every holder of `recurring.manage` holds `do_own`; recorded in the decision file for the matrix work |
| 4 | Low | The residents list is about 1.2 ms (staff, 92 rows) and 316 buffers heavier: two more init-plans, for `enclosures` and `zones` | accepted: a fixed cost per converted table in a join, reported with the numbers in the decision file; whether it needs a cache is on the `backlog` branch |
| 5 | Low | `check-recurring-job-eligibility.mjs` has one failing case (`canDoJob(/management)`), `check-facility-maps.mjs` fails on dev data and `check-facility-map-editor.mjs` needs a server | deferred: none is caused by this change (the first fails identically from the main checkout); not filed separately, named here and in §6 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as management, then staff, open Settings → Zones and Enclosures: the lists load and are read only, as before (the app only lets Admin edit); open an enclosure's page | dev, `http://localhost:3020` or `test.lannacare.org` |
| 2 | Signed in as management, open `/management/recurring-jobs`: add a job, assign someone, edit it, remove it | dev |
| 3 | Signed in as staff, mark a recurring job done from My tasks | dev |
| 4 | Signed in as management, edit a unit conversion (Management → Units) and record, then delete, a delivery | dev |
| 5 | Intake a resident and pick an origin, as staff: the origin list loads | dev |
| 6 | Signed in as a vet, open a resident in the clinic, then its prescriptions and diet: they load and a round can be changed | dev |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-05

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; items 1 to 6 wait for someone with a login

Manual verification by: pending: a person opening the pages above as management, staff and a vet (items 1 to 6); no browser was driven by Claude

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the release manager reads this when the release is cut

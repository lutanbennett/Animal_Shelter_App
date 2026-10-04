# Feature test plan

## Header

| | |
|---|---|
| Feature | `0144_perm_convert_residents.sql`: R5's second conversion. `residents`, `placement_history` and `adoption_updates` stop naming roles and ask `(select has_permission(…))` plus the new `sees_all_residents()` (which also keeps a role on the volunteer's who-and-where floor off the whole table) |
| Backlog item | `docs/backlog.md` → Auth → **Roles build, then one role at a time**, whose status line carries the foundation-3 conversions. **Not ticked**: `-people` and `-stock-and-lists` remain; the status line names this stream, the tables, the parity numbers and what was left |
| Branch / worktree | `claude/perm-convert-residents` @ `C:\Development\Animal_Shelter_perm-convert-residents` |
| Dev server | not started: this change ships no runtime code, and no browser was driven (see Left for manual verification) |
| PR | opened from this branch; the number is recorded in the follow-up commit that ticks CI |
| Tested by / date | Claude (automated) / 2026-10-05 |
| Carries a migration? | yes: `0144_perm_convert_residents.sql` |
| Tested at SHA | the branch tip at the commit that adds this plan, on `main` @ `f93a7fe5` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the `management_*` and `staff_*` policies on `residents` and `placement_history`, and the two role-listing policies on `adoption_updates`, are replaced by one policy per command that asks `has_permission()` for the table's activity and `sees_all_residents()` for the scope, leaving `admin_all_*` and `vet_*` alone, with parity green before and after and §10's measurement taken
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0144_perm_convert_residents.sql`; `scripts/lib/permission-probes.mjs` (C2's `known` entry removed); `scripts/check-role-write-policies.mjs` (reads `sees_all_residents()`); `scripts/check-volunteer-narrowing.mjs` (allow-list of functions that name the volunteer); `scripts/check-perm-convert-residents.mjs` (new); `docs/decisions/2026-10-04-perm-convert-residents.md`; `docs/backlog.md` (status line). No `src/`, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public: **management and staff** answer through the matrix (same answers; hard delete of a resident closed, C2); **volunteer, no role, an archived person** still see and write nothing on these tables, and the volunteer still reads who-and-where through its view; **vet** unchanged and proved so; **admin** unchanged on `residents` and `placement_history` (`admin_all_*` kept) and now through `has_permission()` on `adoption_updates`; signed-out public has no grant. A configured role that borrows the volunteer (the 2IC, both Heads) is **proved not to reach the whole record** even when given Edit on every resident cell
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: `src/`; the vet policies (Last) and Admin's (R6); `attachments`, the photo tables, `enclosures`, `zones`, `group_origins` and the unprefixed role-naming policies on the rounds, stock and recurring tables (no stream owns them; filed on the `backlog` branch); the microchip column through a row-wide update (a policy cannot see a column; `set_resident_microchip()` is the guard); production

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync`: `origin/main` merged in cleanly (`origin/main` is still `f93a7fe5`, the commit this branch was cut from)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line, as printed:

  ```
  GATES_PLACEHOLDER
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `main` tops out at `0143_2ic_role.sql`; the commit hook's `migration numbers: ok` line reports `0144_perm_convert_residents.sql` against `origin/main f93a7fe5`; the brief names this the batch's only migration
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `143 applied, 1 pending` on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0144_perm_convert_residents.sql … ok`, the only pending file
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0144_perm_convert_residents.sql … ok`, from this branch
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): `create or replace function`; every policy the migration owns, and the ones it replaces, is dropped by name or from `pg_policies` before the `create policy`s. Not separately replayed: the apply was a first run, and the drop loop also matches `%_perm` and `vet_read_adoption_updates`, which a re-run would find
- [x] Existing rows still read correctly after the change (checked against real dev data): `check-permission-parity.mjs` and the harness read dev's real rows as staff and management; the residents list returns 86 rows for staff before and after (`measure-permission-baseline.mjs`), and the 13 current prescriptions through the join
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness, `scripts/check-perm-convert-residents.mjs`. Asserted, for each of the three tables, read / update / insert / delete under each login's own JWT: admin all four; management and staff read, update and insert, delete refused (but `adoption_updates` delete allowed, Edit includes delete); volunteer and no role refuse all four; **two configured roles that borrow the volunteer, one with Read cells and one with Edit cells on every resident and placement activity, refuse all four**; a configured staff-borrowing role with Read cells reads and refuses the writes; one with Edit cells reads, updates and inserts; one holding `placement.move` only inserts a `ChangeEnclosure` row and no other placement type; one scoped `own_clinic` with Edit cells sees nothing; a vet reads the own-clinic resident and not another's, on all three tables, and writes none. Plus placement inserts of all six type groups as management, staff, the Edit role, the move-only role and admin (30 cases), and four sweeps: no policy on these tables names management or staff, every `_perm` policy wraps `has_permission()` in `select`, there are 10 of them, and each also asks `sees_all_residents()`. Output, as printed:

  ```
  181 checks held, 0 failed.
  RESULT: GREEN (the three resident tables answer as the cells say; the volunteer floor and scoped roles see nothing; vets unchanged)
  ```

  Not shown red against an unconverted table: the policies it asserts did not exist before the apply (see the decision file). The first parity run after the apply was RED with exactly the two predicted STALE entries (C2, management and staff), which is what shows a closing is noticed. Two fixture faults were found and fixed while writing it, each reported by the harness's own "the statement errored" case and not read as a policy answer
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: additive in effect and reversible by the file's own header (drop the `_perm` policies, `vet_read_adoption_updates` and `sees_all_residents()`, re-create the dropped policies from `0001`, `0094` and the files named there); no data changes
- [x] Production apply plan stated for the release manager (which file, which project, when): `0144_perm_convert_residents.sql` to production `dbkodyyxxhtygxcxmfcu`, by Lutan from the main checkout, `--dry-run` then apply, after this PR merges. No app code in this PR reads anything new, so there is no ordering constraint against a deploy. `check-permission-parity.mjs` refuses other projects, so the production check is a staff login opening the residents list and one resident's page

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI change; the database happy path (staff and management read, insert and update the three tables; delete adoption news) is asserted by the harness. Whether the pages themselves still render for each role is the manual list below
- [ ] Data persists — reload the page and the change is still there — n/a: no UI change; the harness's update probes each match a row
- [x] Create / edit / delete all exercised (whichever the feature has): insert and update succeed for the roles whose cell allows; delete is refused for everyone but admin on `residents` and `placement_history`, and allowed to the Edit roles on `adoption_updates`
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI change
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no inputs; a refused write is a 42501 or zero rows, which the app's existing "not allowed" paths already handle
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): the boundaries are the cell and the scope, asserted from both sides: Read versus Edit, whole record versus the volunteer floor (the same cells, a different `legacy_role`), `all` versus `own_clinic`, in-clinic versus out for a vet, one housing act held versus the others

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | all three tables, delete included | no change | allowed all four commands on all three (`admin_all_*` kept on two; `has_permission()` on `adoption_updates`) |
| management | all three, no delete on residents and placements | no change but C2 closed | read, update, insert allowed; delete refused on `residents` and `placement_history`, allowed on `adoption_updates` |
| staff | same as management | no change but C2 closed | same as management |
| vet | own clinic's residents' rows, read only | no change | in-clinic rows read, other clinic's refused, no writes, on all three (`check-vet-resident-scope` passes) |
| volunteer | nothing on these tables; who-and-where through its view | refused | all four commands refused on all three; the view still answers (`check-volunteer-narrowing` passes) |
| signed out | nothing | no change | no grant to `anon` on these tables (unchanged); `sees_all_residents()` is granted to `authenticated` and `service_role` only |

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

- [x] The pages nearest the change still work (list the ones checked) — no page loaded (see manual list). The database paths under them were re-run after the apply and each ends in its pass line: `check-permission-parity` (GREEN, 1,926 match / 34 known / 0 mismatch), `check-permission-catalogue`, `check-permission-tables`, `check-volunteer-narrowing`, `check-role-write-policies`, `check-medical-role`, `check-2ic-role`, `check-maintenance-role`, `check-adoption-updates`, `check-placement-guards`, `check-lifecycle-guards`, `check-audit-log`, `check-audit-undo`, `check-vets-readonly`, `check-vet-resident-scope`, `check-resident-microchip`, `check-role-can`, `check-medical-archive-roles`. Not run: `check-resident-id-search` (needs a running dev server; it stopped on ECONNREFUSED after its own throwaway rows were cleaned up)
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged: `origin/main` has not moved

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead): deliberately **not** ticked, two conversions remain; the status line names this stream and its numbers, and its stale `home-screens` clause is corrected (shipped as #345). The follow-up (role-naming policies no stream owns) is on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `docs/decisions/2026-10-04-perm-convert-residents.md`: why `sees_all_residents()` also excludes the volunteer floor, the placement type mapping, the unprefixed policies the `0135` sweep would have missed, the vet half of `adoption_updates`, what closed, what was left, and both measurements
- [x] `README.md` still accurate: it does not describe the role model
- [ ] **Release notes.** n/a: nobody would notice: management and staff are answered exactly as before, nobody holds a role that would differ, and the one closed right (hard-deleting a resident from a hand-built request) has no button. The residents list is faster for staff on dev's 86 rows, which no one would call a feature
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The counts (181 checks, 1,924 / 36 / 0 to 1,926 / 34 / 0, the milliseconds and buffer hits, the init-plan numbers) are the scripts' and `explain`'s output. Worded as reasoning in the decision file: that the residents-list gain is finding D (the old per-row `current_user_role()`), and that the prescriptions slowdown is the two extra init-plans. Both fit the plans and the buffer counts and neither was isolated by a separate run

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (SQL only, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** Read versus Edit, whole record versus the volunteer floor, `all` versus `own_clinic`, in-clinic versus out, role versus no role, and a held housing act versus its neighbours are each asserted from both sides
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

- [x] Rollback position stated, **including what it does not cover** — no Worker change, so `wrangler rollback` is irrelevant. To undo: drop the `_perm` policies, `vet_read_adoption_updates` and `sees_all_residents()` and re-create the policies named in the migration header. It does not restore anything if a role has since been given a resident cell it relies on through these policies

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium, found by this work | A cell-only policy on `residents` would have handed the whole table to the volunteer and to every role that borrows its floor (the 2IC and both Heads), because the volunteer holds Read on `resident.record` and reads only through a view | fixed in this PR: `sees_all_residents()` excludes the volunteer floor; proved by two configured roles holding Edit and Read cells |
| 2 | Low | `management_%` / `staff_%` sweeps miss policies with no role prefix: two on `adoption_updates` (handled here) and ten others on the rounds, stock and recurring tables | deferred to backlog (`backlog` branch): the last conversion should end on a query for policy text naming a role, not on a prefix |
| 3 | Low | `attachments`, `enclosures`, `zones` and `group_origins` still carry `management_*` / `staff_*` and no conversion stream owns them | deferred to backlog (`backlog` branch) |
| 4 | Low | Management can still change a microchip number by a hand-built update of `residents` (`resident.microchip` is No for Management, finding B), because a policy cannot see a column | accepted: unchanged by this work; `set_resident_microchip()` is the real guard; recorded in the decision file |
| 5 | Low | The prescriptions query (medication list) is about 0.7 to 1 ms slower for staff: the join into `residents` now plans two more init-plans | accepted: fixed cost, buffers fell; reported in the decision file beside the 2x gain on the residents list |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as staff, then management, open the Residents list, a resident's page and its edit form, move a resident, record an adoption news entry and delete it: each loads and saves as before | dev, `http://localhost:3015` or `test.lannacare.org` |
| 2 | Signed in as a vet, the Residents list and a resident's page show only the clinic's residents, and their adoption news | dev |
| 3 | Intake a new resident (the New resident wizard) as staff: it completes and the resident appears at its enclosure | dev |
| 4 | `check-resident-id-search.mjs` against a running dev server (it needs one and was not run) | dev |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-05

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; items 1 to 4 wait for someone with a login

Manual verification by: pending: a person opening the resident pages as staff, management and a vet, and doing an intake (items 1 to 4 above); no browser was driven by Claude

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the release manager reads this when the release is cut

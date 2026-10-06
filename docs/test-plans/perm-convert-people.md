# Feature test plan

## Header

| | |
|---|---|
| Feature | `0147_perm_convert_people.sql`: `contacts`, `shelter_friends`, `vets`, `vet_doctors`, `vet_doctor_clinics` and `bulk_appointments` stop naming roles and ask `(select has_permission(…))`; new `sees_all_contacts()`; `merge_vet_doctors()` gains one check |
| Backlog item | `docs/backlog.md` → Auth → **Roles build, foundation 3**: **not ticked** (`-stock-and-lists`, `-settings`, `-work` and the photo split remain); its status line is extended and its "three database conversions" corrected to six |
| Branch / worktree | `claude/perm-convert-people` @ `C:\Development\Animal_Shelter_perm-convert-people` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` (driven in the browser pane for a staff and a volunteer account) |
| PR | opened from this branch; the number is recorded in the follow-up commit that ticks CI |
| Tested by / date | Claude (automated) / 2026-10-06 |
| Carries a migration? | yes: `0147_perm_convert_people.sql` |
| Tested at SHA | the branch tip at the commit that adds this plan, merged with `origin/main` @ `28d6f9f7` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the 12 role-named policies on six people-and-clinic tables are replaced by one policy per command that asks `has_permission()`, with a scope function so a cell cannot widen `0126`'s vet and volunteer views of `contacts`
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0147_perm_convert_people.sql`; `scripts/check-perm-convert-people.mjs` (new); `scripts/check-policy-role-names.mjs` (six tables off `OWNERS`); `scripts/lib/permission-probes.mjs` (C6 and part of C7 closed); `scripts/check-volunteer-narrowing.mjs` (`sees_all_contacts` allow-listed); `scripts/check-doctor-multi-clinic.mjs` (two assertions follow the conversion); `scripts/measure-permission-baseline.mjs` (two queries); `docs/roles-and-permissions.md` (§3 C6 and C7, §15); `docs/decisions/2026-10-06-perm-convert-people.md`; `docs/backlog.md`. No `src/`, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public: **management** unchanged; **staff** loses only hand-built writes the app never makes (update and delete of a contact, update and delete of a doctor, merge) and keeps every answer on screen, including reading a Shelter Friend's card (N3 kept on purpose); **admin** unchanged; **vet** unchanged and proved so (its own `vet_*` policies untouched); **volunteer** and a person with no role unchanged (refused); signed-out public has no grant; **a configured role on the staff floor with no cell gets nothing**, and one on the volunteer floor or with a narrower contacts scope gets nothing even holding every contacts cell
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: the other five conversions (`-stock-and-lists`, `-settings`, `-work`, the photo split), the clinics rename (parked), the vet and admin policies, the 2IC's access to contacts (backlog), whether staff should read Shelter Friends (backlog, N3), `src/`, production

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (twice; the second brought in the two sibling streams' decision files and test plans)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line, as printed:

  ```
  === gates: build exited 0 after 168s
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `check-migration-numbers.mjs` reports `migration numbers: ok — 0147_perm_convert_people.sql (against origin/main 28d6f9f7, highest 0146_app_users_role_key.sql)`; the brief names this the batch's only migration
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `146 applied, 1 pending` on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0147_perm_convert_people.sql … ok`, the only pending file (the first version of the file; later changes are below)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0147_perm_convert_people.sql … ok`. **The file was then changed three times before merge** (booking inserts on `vet_doctors` and `vet_doctor_clinics`; the `merge_vet_doctors()` guard; `clinics.doctors` on the `vets` read), each time folded into the same file and its SQL re-run against dev from the file, so dev holds the final file. This was not the runner: the file is unmerged and re-runnable, the `schema_migrations` row is for the same filename, and no hand-written SQL beyond the file was posted. The final state is the final file, and that is what every check below ran against
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): `create or replace` for both functions, and every `_perm` policy plus the role-named ones are dropped from `pg_policies` by name before the `create policy`s. **Replayed three times in practice** (the re-runs above), and the harness was green after the last
- [x] Existing rows still read correctly after the change (checked against real dev data): `check-permission-parity.mjs` reads dev's real rows; `measure-permission-baseline.mjs` returns 8 contacts and 12 clinic rows for staff before and after; the browser showed the same eight contacts and the clinic roster
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness, `scripts/check-perm-convert-people.mjs`. Asserted, for six tables, read / update / insert / delete under each login's own JWT: admin, management, staff, volunteer, a vet linked to a doctor at its own clinic, a person with no role, and twelve configured roles (no cell; each contacts cell alone and together; every contacts cell with scope `name_phone`; every contacts cell **on the volunteer floor**; `friends.manage`; `clinics.list` Read and Edit; `clinics.doctors`; `visit.book`). Plus sweeps (no policy names management or staff; every new policy wraps `has_permission()` in `select`; every contacts policy asks `sees_all_contacts()`; 24 `_perm` policies). Output, as printed:

  ```
  436 checks held, 0 failed.
  RESULT: GREEN (each table answers as its cell says; a role with no cell, or off the full contacts scope, gets nothing; the vet is unchanged)
  ```

  Not shown red against the unconverted tables: the policies it asserts did not exist before the apply. `check-doctor-multi-clinic.mjs` (an existing harness) **did** go red on a true fault in the first version of the file (staff could no longer book with a new typed doctor) and a second one (a half merge), both fixed in the migration and recorded in the decision file; the first parity run after the apply was RED with the predicted STALE entries, which shows a closing is noticed
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: reversible by the file's own header (drop the `_perm` policies and `sees_all_contacts()`, re-create the dropped ones from `0001`, `0076`, `0102`; `merge_vet_doctors()` from `0125`); no data changes
- [x] Production apply plan stated for the release manager (which file, which project, when): `0147_perm_convert_people.sql` to production `dbkodyyxxhtygxcxmfcu`, by Lutan from the main checkout, `--dry-run` then apply, after this PR merges. `-- consumer: none`: no app code reads anything new, so no ordering constraint against a deploy. The production check is a staff login opening `/contacts` (the Shelter Friend chip still shows) and `/vets`, and a management login adding and deleting a doctor

## 4. Functional checks

- [x] Happy path works end to end: a staff login signed in on dev opened `/contacts` (eight contacts, chips, the Shelter Friend badge), a Shelter Friend's contact page (details and the read-only card) and `/vets` (the roster with doctors); no server errors in the dev log
- [ ] Data persists — reload the page and the change is still there — n/a: no write was driven in the browser; persistence of writes is asserted by the harness (each update probe matches a row)
- [x] Create / edit / delete all exercised (whichever the feature has): insert, update and delete under each table's cell, and refused without it, on all six tables (harness)
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI change
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no inputs; a refused write is a 42501 or zero rows, which the app's existing "not allowed" paths handle
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): the boundaries are the cell from both sides: Read versus Edit (`contacts.directory`), an add cell without the read cell (`contacts.add` alone: insert allowed, row not readable), a write cell without a read cell, the same cells on the staff floor, the volunteer floor and a narrower contacts scope, and a doctor with a login versus without

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | all six tables | no change | allowed every command |
| management | all six tables | no change | allowed every command |
| staff | contacts read and add; Shelter Friends, clinics, doctors read; doctors insert (booking); bulk appointments all | no change but C6 and C7 (update, delete, merge) | as listed; the harness asserts each cell; a staff login read the pages in the browser |
| vet | its own clinic's doctors, links and bookings; clinic and doctor reads; Shelter Friends read | no change | as listed (its `vet_*` policies untouched) |
| volunteer | none of the six (contacts through a view that nothing grants) | no change | `/contacts` and `/vets` land on "You don't have access to this page" in the browser; the harness refuses all |
| signed out | nothing | no change | no grant to `anon` on these tables (unchanged) |

- [x] Every role above tested: admin, management, staff, volunteer, vet by the harness under their own JWTs; staff and volunteer also in the browser; signed out by the grant, not exercised as a session
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): the volunteer's `/contacts` and `/vets` were requested directly and refused; the table refusals are database refusals under the role's own JWT, not a hidden control

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a reader of the manual could see changed
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no page touched, so `check-phone-width.mjs` was not run
- [x] Browser console clean: the dev log had no server errors during the staff and volunteer sessions; the browser console was not separately read
- [ ] Network clean — n/a: no UI change, no request inspected

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): `/contacts`, `/contacts/<id>` (a Shelter Friend) and `/vets` as staff; `/contacts` and `/vets` as volunteer (refused). The database paths under them were re-run after the last apply: `check-perm-convert-people` (436 held), `check-doctor-multi-clinic` (passes after two assertions followed the conversion), `check-vets-readonly` (passes), `check-vet-resident-scope` (passes), `check-shelter-friends` and `check-contacts-archive` (pass), `check-role-write-policies` (passes), `check-policy-role-names` (GREEN, 16 tables remain), `check-permission-catalogue` (all ok), `check-migration-grants`. **Parity: before 1,903 match / 30 known / 27 mismatch, after 1,907 / 26 / 27**: four known answers closed (C6 ×2, C7 staff ×2) and nothing else moved. **Not green, and not caused by this change:** `check-permission-parity` (the 27), `check-permission-tables` (`A cells vet: got 2, wanted 13`), `check-2ic-role` (3), `check-volunteer-narrowing` (1: the volunteer may record a recurring job), `check-role-can` (`A read-only cell is yes for read`) and `check-contact-visibility` (`cannot drop columns from view`, a replay of an older file). The first five are the Director's draft role matrix loaded on dev on 2026-10-05 (`#380`; its decision file says they would go red), so they were red before `0147` and the 27 are identical before and after; the last fails replaying `0126` over a view later migrations changed and was not investigated further. Filed on the `backlog` branch
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merges brought in docs and two sibling streams' files; the gates were run after the second

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead): foundation 3 **not** ticked, as the brief says; its status line extended and "three database conversions" corrected to six. The three follow-ups (N3; the 2IC's contacts; red parity on dev) are on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `docs/decisions/2026-10-06-perm-convert-people.md`: why `contacts` needs a scope function, why `shelter_friends` read is wider than its cell, why booking must be able to add a doctor, the one line added to `merge_vet_doctors()`, the activities for the odd pair, the baseline problem, the measurement
- [x] `README.md` still accurate: it does not describe the role model
- [ ] **Release notes.** n/a: nobody would notice: every right closed is a hand-built request the app never makes (updating or deleting a contact or a doctor as staff, merging doctors), `src/` is untouched, and what staff see on `/contacts`, `/contacts/<id>` and `/vets` is unchanged
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The counts (436 checks; 1,903 / 30 / 27 to 1,907 / 26 / 27; 16 tables still naming a role) and the milliseconds and buffer hits are the scripts' output, repeated twice each way. Reasoned and worded as reasoning in the decision file: that the contacts list's extra 0.4 ms is the two init-plans

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (SQL only, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** Read versus Edit, cell versus no cell on the same floor, the same cells on three floors and scopes, a doctor with and without a login
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`, `/friends`) re-checked after a cache purge or a 10-minute wait — n/a: no public view or table policy for `anon` changed; `check-shelter-friends` passes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No: nothing in `src/` changed; the existing pages read the same tables
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no row is touched; policies and one function body only
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — see §3

### Rollback

- [x] Rollback position stated, **including what it does not cover** — no Worker change, so `wrangler rollback` is irrelevant. To undo: drop the `_perm` policies and `sees_all_contacts()`, re-create the policies and `merge_vet_doctors()` named in the migration header. It does not restore anything a role has since been given a cell for and relies on through these policies

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium, found by this work | The first version of the migration stopped staff booking a visit with a new typed doctor (the booking trigger adds the doctor as the caller) | fixed in this PR: `vet_doctors` and `vet_doctor_clinics` insert also answers `visit.book`; caught by the existing `check-doctor-multi-clinic.mjs` |
| 2 | Medium, found by this work | With that fix, staff could run `merge_vet_doctors()` to a half merge (the last delete is filtered silently) | fixed in this PR: the function raises when its delete is filtered; staff refused, management still merges |
| 3 | Medium | The dev database holds the Director's draft role matrix, so five existing checks are red and the baseline cannot be GREEN | accepted: not mine to revert; recorded with the before/after delta in the decision file; filed on the `backlog` branch |
| 4 | Low | N3 stays open (staff read Shelter Friends because the contacts pages show them the card), and C7 stays open for staff insert | accepted: closing either is a visible change; filed on the `backlog` branch |
| 5 | Low | A role holding only `contacts.add` can insert but cannot read the row back; the 2IC's draft cells on contacts do nothing | accepted: no login holds the first; the second is as before, filed on the `backlog` branch |
| 6 | Low | `check-contact-visibility.mjs` fails with `cannot drop columns from view` | deferred: replays an older migration over a view later files changed; not caused by this change; not investigated |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as staff, book a vet visit and type a doctor's name that is not yet on that clinic's list: the booking saves and the doctor appears on the clinic page | dev, `http://localhost:3008` or `test.lannacare.org` |
| 2 | Signed in as management, open Management → Contacts: add a contact, edit it, archive it; open a Shelter Friend's card and edit it | dev |
| 3 | Signed in as management, open a clinic's doctors: add a doctor, rename one, merge two | dev |
| 4 | Signed in as a vet, open Appointments and a resident in the clinic: they load as before | dev |
| 5 | Signed in as the 2IC, open `/contacts`: whatever she saw before she still sees (the Director's draft is loaded) | dev |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-06

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; items 1 to 5 wait for someone with a login

Manual verification by: pending: a person opening the pages above as staff, management, a vet and the 2IC (items 1 to 5); Claude drove only a staff and a volunteer read, which is not that person's check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the release manager reads this when the release is cut

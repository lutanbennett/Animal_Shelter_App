# Feature test plan

## Header

| | |
|---|---|
| Feature | `0149_perm_convert_work.sql`: `maintenance`, `maintenance_assignees` and `project_folders` stop naming roles and ask `(select has_permission(…))`; `maintenance` gains the delete policy `0141` left out, behind `has_shelter_floor()` |
| Backlog item | `docs/backlog.md` → Auth → **`perm-convert-work`** ticked; **Roles build, foundation 3** is **not** ticked (`-settings` and the photo split remain), its status line is extended |
| Branch / worktree | `claude/perm-convert-work` @ `C:\Development\Animal_Shelter_perm-convert-work` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3017` (a throwaway Head of Maintenance and a staff login opened `/maintenance` at 375 px) |
| PR | opened from this branch; the number is recorded in the follow-up commit |
| Tested by / date | Claude (automated) / 2026-10-06 |
| Carries a migration? | yes: `0149_perm_convert_work.sql` |
| Tested at SHA | the branch tip at the commit that adds this plan, after merging `origin/main` @ `79b13f8c` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the 6 role-named policies on `maintenance`, `maintenance_assignees` and `project_folders` are replaced by one policy per command that asks `has_permission()`, so the checker lists only settings and the photo split
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0149_perm_convert_work.sql`; `scripts/check-perm-convert-work.mjs` (new); `scripts/check-policy-role-names.mjs` (three tables off `OWNERS`); `scripts/check-volunteer-narrowing.mjs` (one function on its short list); `scripts/check-phone-width.mjs` (the Head of Maintenance as a role to open pages as); `docs/decisions/2026-10-06-perm-convert-work.md`; `docs/backlog.md`. No `src/`, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public: **management** and **staff** keep every right on all three tables; **admin** unchanged; the **Head of Maintenance** and the **2IC** keep what `0141` gave them and still cannot delete a job; **vet**, **volunteer** and no role unchanged (refused); signed-out public has no grant
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: `perm-convert-settings`, the photo split (`maintenance_photos`, `project_photos`, `attachments`), an activity for delete, splitting the update by column (`maintenance.progress`, `projects.publish`), `src/`, production

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in (see the merge commit)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line, as printed:

  ```
  === gates: build exited 0 after 253s
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `check-migration-numbers.mjs` reports `ok — 0149_perm_convert_work.sql (highest 0148_perm_convert_stock_and_lists.sql)`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `148 applied, 1 pending` on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0149_perm_convert_work.sql … ok`, the only pending file (the first version of the file)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0149_perm_convert_work.sql … ok`. **The file was then changed twice** (the floor test went from inline to `above_volunteer_floor()` to `has_shelter_floor()`) and its SQL re-run against dev from the file, with the first function dropped, so dev holds the final file; the `schema_migrations` row is for the same filename and no other hand-written SQL was posted
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): the role-named policies and our own are dropped from `pg_policies` by name before the `create policy`s, and the function is `create or replace`; replayed in practice, harness green after
- [x] Existing rows still read correctly after the change (checked against real dev data): `check-permission-parity.mjs` reads dev's real rows; the board and `/maintenance/new` opened for a staff login at 375 px
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness, `scripts/check-perm-convert-work.mjs`. Asserted, for three tables, read / update / insert / delete under each login's own JWT: admin, management, staff, volunteer, a vet, no role, the real `head_of_maintenance`, and seven configured roles (`maintenance.jobs` Read, Edit on the staff floor, Edit on the volunteer floor; `maintenance.progress` alone; `projects.folders` Read and Edit; `projects.publish` alone). Plus sweeps. Output, as printed:

  ```
  171 checks held, 0 failed.
  RESULT: GREEN (each table answers as its cell says; the Head of Maintenance cannot delete a job; projects.publish alone opens nothing)
  ```

  Not shown red against the unconverted tables: the `project_folders` policies it asserts did not exist before the apply. Its first run disagreed on nine cases (a refused insert reported as an error by the existing `project_folders_before_write` trigger), which was a fixture detail, fixed in the script
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: reversible by the file's own header (drop the new policies and `has_shelter_floor()`, re-create `management_rw_*` / `staff_rw_*` from `0001` and `0034`); no data changes
- [x] Production apply plan stated for the release manager (which file, which project, when): `0149_perm_convert_work.sql` to production `dbkodyyxxhtygxcxmfcu`, by Lutan from the main checkout, `--dry-run` then apply, after this PR merges. `-- consumer: none`: no ordering constraint against a deploy

## 4. Functional checks

- [x] Happy path works end to end: a throwaway Head of Maintenance login (from `check-phone-width.mjs`) opened `/maintenance` and `/maintenance/new` at 375 px with no sideways scroll; staff opened `/maintenance`, `/maintenance/new` and `/projects` likewise
- [ ] Data persists — reload the page and the change is still there — n/a: no write was driven in the browser; persistence of writes is asserted by the harness (each update and insert probe matches a row)
- [x] Create / edit / delete all exercised (whichever the feature has): insert, update and delete under each table's cell, and refused without it, on all three tables (harness)
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI change
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no inputs; a refused write is a 42501 or zero rows, which the app's existing "not authorised" paths handle (`deleteMaintenanceJob` reads a zero-row delete as refused)
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): the boundaries are the cell from both sides (Read versus Edit), the same Edit cell on the two floors (staff floor deletes a job, volunteer floor does not), `maintenance.progress` and `projects.publish` alone (open nothing)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | all three tables | no change | allowed every command |
| management | all three tables | no change | allowed every command |
| staff | all three tables | no change | allowed every command; board and projects opened at 375 px |
| Head of Maintenance | `maintenance`, `maintenance_assignees` | no change: reads, creates, changes and assigns; **cannot delete a job** | as listed; board opened at 375 px; `/projects` refused (redirected to `/no-access`) |
| vet / volunteer / no role | none | no change | refused every command |
| signed out | nothing | no change | no grant to `anon` on these tables (unchanged) |

- [x] Every role above tested: admin, management, staff, volunteer, vet and the Head of Maintenance by the harness under their own JWTs; staff and the Head of Maintenance also in the browser; signed out by the grant, not exercised as a session
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): the Head of Maintenance requesting `/projects` is redirected to `/no-access`; the table refusals are database refusals under the role's own JWT

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a reader of the manual could see changed
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [x] Mobile viewport (375px): `check-phone-width.mjs --roles=head_of_maintenance,staff --locales=en --pages=/maintenance,/maintenance/new,/projects`: `5 page view(s) measured … 1 skipped because the role cannot open them, 0 warning(s). No page scrolls sideways.` English only
- [ ] Browser console clean — n/a: not read; the script measures overflow and does not open the console
- [ ] Network clean — n/a: no UI change, no request inspected

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): `/maintenance` and `/maintenance/new` as the Head of Maintenance and staff, `/projects` as staff. Database paths re-run after the last apply: `check-perm-convert-work` (171 held), `check-maintenance-role` (139 held, 1 failed: her cell bundle against `jobs.ts`, the draft), `check-volunteer-narrowing` (back to its five recurring lines), `check-policy-role-names` (GREEN, 7 tables remain), `check-permission-catalogue` (exit 0). **Parity: before 1,907 match / 26 known / 27 mismatch, after 1,907 / 26 / 27**, the same 27 mismatch lines (`diff` empty), none of which names these tables or `maintenance.*` / `projects.*`. **Not green, and not caused by this change:** `check-permission-parity` (the 27), `check-permission-tables` (`A cells vet: got 2, wanted 13`), `check-2ic-role` (3), `check-maintenance-role` (1), `check-volunteer-narrowing` (5 recurring lines), `check-perm-convert-orphans` (11), all the Director's draft loaded on dev (`#380`)
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead): `perm-convert-work` ticked; foundation 3 **not** ticked, as the brief says, its status line extended and "five of six done" named
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `docs/decisions/2026-10-06-perm-convert-work.md` (delete and the floor test, `projects.folders`, why "mine versus anyone's" did not arrive)
- [x] `README.md` still accurate: it does not describe the role model
- [ ] **Release notes.** n/a: nobody would notice: `src/` is untouched, every login's answer on these three tables is the same before and after (the delete floor test exists to keep it so), and no page, string or manual topic changed

- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The counts (171 checks; 1,907 / 26 / 27 both ways, the diff empty; 7 tables remaining; 0 of 27 failing lines naming these tables) are the scripts' output. Reasoned and worded as reasoning: that a role given `projects.folders` Edit without `projects.publish` could set `is_public` (no such role exists to run it against)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (SQL only, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** Read versus Edit, and the same cell on each floor for delete
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`, `/friends`) re-checked after a cache purge or a 10-minute wait — n/a: `project_folders` has no policy for `anon`, and the public project views are owner-rights and untouched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No: nothing in `src/` changed; the board and the projects pages read the same tables
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no row is touched; policies and one function only
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — see §3

### Rollback

- [x] Rollback position stated, **including what it does not cover** — no Worker change, so `wrangler rollback` is irrelevant. To undo: drop the new policies and `has_shelter_floor()`, re-create the six role-named ones from `0001` and `0034`. It does not restore anything a role has since been given a cell for and relies on through these policies

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low, found by this work | The first version of the delete policy named `'volunteer'` inline and broke `check-volunteer-narrowing` | fixed in this PR: the floor test moved into `has_shelter_floor()`, added to that check's short list |
| 2 | Medium | Delete has no activity of its own, so job delete cannot be configured: a custom role on the volunteer floor can never have it | accepted: the open question already filed as `role-gaps-sweep`; this PR keeps today's answers |
| 3 | Low | A role given `projects.folders` Edit without `projects.publish` could set `is_public` by a hand-built request; likewise `maintenance.progress` alone moves nothing | accepted: no role holds either split today; column-level split belongs to the redesign |
| 4 | Medium | The dev database holds the Director's draft role matrix, so several existing checks are red and the baseline cannot be GREEN | accepted: not mine to revert; before/after delta in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as the Head of Maintenance on a phone, log a job, assign someone, move it on and complete it: it saves each time. Then try to delete it: it is refused, as before | dev, `test.lannacare.org` |
| 2 | Signed in as staff or management, delete a job from the board: it goes. As management, open a project, edit it and add a sub-folder | dev |
| 3 | Signed in as the 2IC, open the board and a job: it reads and changes, and delete is refused | dev |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-06

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; items 1 to 3 wait for someone with a login and a phone

Manual verification by: pending: a person on the board as the Head of Maintenance, staff or management and the 2IC (items 1 to 3); Claude measured only that two pages do not scroll sideways at 375 px, which is not that person's check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the release manager reads this when the release is cut

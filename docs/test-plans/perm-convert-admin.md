# Feature test plan

## Header

| | |
|---|---|
| Feature | `0153_perm_convert_admin.sql`: the 43 `admin_*` and 2 `volunteer_read_*` policies stop calling `current_user_role()`; new enum-free `is_admin()`; `check-policy-role-names.mjs` extended to count all five role values and bare `current_user_role()` |
| Backlog item | `docs/backlog.md` → Auth → **`perm-convert-admin`** ticked; **Roles build, foundation 3** is **not** ticked, a NOTE added that its "0 policies on 0 tables" was true of two roles only |
| Branch / worktree | `claude/perm-convert-admin` @ `C:\Development\Animal_Shelter_perm-convert-admin` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` (a throwaway admin login opened nine `/admin/*` pages) |
| PR | opened from this branch; the number is recorded in the follow-up commit |
| Tested by / date | Claude (automated) / 2026-10-07 |
| Carries a migration? | yes: `0153_perm_convert_admin.sql` |
| Tested at SHA | the branch tip at the commit that adds this plan, after merging `origin/main` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: every policy that named admin or volunteer is dropped, or rewritten on `is_admin()`, so the only policies still naming a role are the vet's, and the checker now counts every role so it says so
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0153_perm_convert_admin.sql`; `scripts/check-policy-role-names.mjs` (extended, `OWNERS` now the vet's 29 tables); `scripts/check-perm-convert-admin.mjs` (new); `docs/roles-and-permissions.md` §15; `docs/decisions/2026-10-07-perm-convert-admin.md`; `docs/backlog.md`. No `src/`, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public: **admin** unchanged by design (kept through `is_admin()` or a cell); **management**, **staff** unchanged; **volunteer** loses two redundant read policies and reads the same rows; **vet** untouched (its 54 policies stay); signed-out public has no grant on these tables (unchanged)
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: the vet's 54 policies and the decision they wait on, the 15 functions, 9 views and 3 columns (`perm-drop-enum`), an activity for delete (`role-gaps-sweep`), `private.has_app_access()`, `src/`, production

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in: `Already up to date.` (`origin/main` was still @ `17085eec`), migration numbers `ok — 0153_perm_convert_admin.sql (highest 0152_perm_convert_photos.sql)`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line, as printed:

  ```
  gates: typecheck=0 lint=0 build=0
  ```

  (The first run printed `lint=1`: `check-migration-grants` refused the `anon` grant on `is_admin()`. Fixed, `0153` re-run on dev from the file, and everything above re-run green.)
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `0153`, `main` was at `0152_perm_convert_photos.sql`; `admin-role` reserved it and did not use it; no other branch carries a migration in this batch
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `152 applied, 1 pending` on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0153_perm_convert_admin.sql … ok`, the only pending file
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0153_perm_convert_admin.sql … ok`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): `create or replace function`, every policy dropped `if exists` before it is created, and `alter policy` restates the same predicate when replayed
- [x] Existing rows still read correctly after the change (checked against real dev data): the harness reads 650 `audit_log`, 138 `role_permissions`, 90 `residents`, 69 `enclosures` rows as the right logins; nine `/admin/*` pages rendered for a real admin session
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness, `scripts/check-perm-convert-admin.mjs`. Asserted, under each login's own JWT: `is_admin()` equals `current_user_role() = 'admin'` for all 39 logins; Admin reads every row of `audit_log`, `permission_activities`, `roles`, `role_permissions`, `user_roles`, `assistant_actions`; Admin's DELETE on `blood_tests`, `immunization_records`, `placement_history`, `prescriptions`, `procedures`, `resident_diets`, `residents`, `weight`, `group_origins`, `rounds` reaches a row or the row's own foreign key (never a policy refusal); Admin updates `site_content` and `site_pages`; staff, management and volunteer read none of the Admin-only tables and delete or update nothing; an admin at **aal1** writes 0 rows of `role_permissions`, `roles`, `user_roles`, at **aal2** writes 1, and a management login at aal2 writes 0; the volunteer reads all `enclosures` and `zones`. Output, as printed:

  ```
  122 checks held, 0 failed.
  RESULT: GREEN (Admin keeps every read, write and delete through is_admin(); the matrix keeps its aal2 gate; non-admins gain and lose nothing)
  ```

  **Not shown red** against a deliberately broken migration: the script was written after the apply. The eleven tables that needed a different shape than "drop" were found from `pg_policies` per command, not by this script (see the decision, §3)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: reversible by the file's own header and the decision: drop `is_admin()`'s policies and re-create the `admin_all_*` ones with `current_user_role() = 'admin'::app_role` (text in `0001`, `0034` and `0132`); no row is touched
- [x] Production apply plan stated for the release manager (which file, which project, when): `0153_perm_convert_admin.sql` to production `dbkodyyxxhtygxcxmfcu`, by Lutan from the main checkout, `--dry-run` first, after this PR merges. `-- consumer: none`: no code reads `is_admin()`, so no ordering constraint against a deploy

## 4. Functional checks

- [x] Happy path works end to end: a throwaway admin login (from `check-phone-width.mjs`) opened `/admin`, `/admin/website`, `/admin/role-draft`, `/admin/zones`, `/admin/enclosures`, `/admin/frequencies` and `/admin/recent-changes` (the audit log) with no error page
- [ ] Data persists — reload the page and the change is still there — n/a: no write was driven in the browser; Admin's writes are asserted by the harness
- [x] Create / edit / delete all exercised (whichever the feature has): Admin's update on the site tables, delete on ten tables, and the matrix write at aal2 (harness)
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI change
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no inputs
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): the boundaries are aal1 versus aal2, admin versus a non-admin at aal2, and an archived login (`is_admin()` agrees with the enum for all 39 logins, archived included)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything, as before | no change | read, update and delete as asserted; matrix writes need aal2 |
| management | none of the Admin-only tables | no change | reads 0 rows of all six, writes none, deletes none |
| staff | none of the Admin-only tables | no change | as management |
| vet | untouched (54 policies stay) | no change | not exercised: no vet policy changed; parity's vet lines are identical |
| volunteer | `enclosures`, `zones` read | no change | reads every row of both; none of the Admin-only tables |
| signed out | nothing | no change | no grant to `anon` on these tables: the anon read of `site_content` is refused at the grant, as before |

- [x] Every role above tested: admin, management, staff and volunteer by the harness under their own JWTs; vet by the parity report (identical); signed out by the grant
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): the table refusals are database refusals under the role's own JWT; `/admin/security` redirected the admin to its step-up page, as designed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a reader of the manual could see changed
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [x] Mobile viewport (375px): `check-phone-width.mjs --roles=admin --locales=en` over nine pages: seven measured, two skipped (redirects), **one overflows: `/admin/recent-changes`**, a 610 px `<select>`. Unrelated to this change (no `src/` touched), and recorded under Defects
- [ ] Browser console clean — n/a: not read; the script measures overflow and does not open the console
- [ ] Network clean — n/a: no UI change, no request inspected

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): the nine `/admin/*` pages above. Database paths re-run after the apply: `check-perm-convert-admin` (122 held), `check-policy-role-names` (GREEN: 54 policies on 29 tables, all `perm-convert-vet`), `check-permission-catalogue` (`all ok`), `check-home-screens` (`all ok`), `check-permission-tables` (`HARNESS-KNOWN-RED`, the vet's lines, as before). **Parity: before 1,926 match / 24 known / 21 mismatch / 5 harness fault, after 1,926 / 24 / 21 / 5, and the whole report diffs empty**, not only the count
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead): `perm-convert-admin` ticked; foundation 3 not ticked, a NOTE appended. The `/admin/recent-changes` overflow goes on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `docs/decisions/2026-10-07-perm-convert-admin.md` (the eleven tables where "just drop" is wrong, the aal2 gate, why `is_admin()` is not executable by `anon`, what the checker now covers)
- [x] `README.md` still accurate: it does not describe the role model
- [ ] **Release notes.** n/a: nobody would notice: no `src/` file changed, every login's answer on every table is the same before and after (that is the whole claim, and the parity report and the harness are the measurement), and no page, string or manual topic changed
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The counts (99 policies on 48 tables before, 54 on 29 after; 43 admin, not 42; 1,926 / 24 / 21 both ways with an empty diff; 122 checks; 39 logins) are the scripts' output. Reasoned and worded as reasoning: that the old "71" was an earlier state or double-counted (not reproduced), and that the harness would have caught a bad migration (not run against one)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (SQL only, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** aal1 and aal2, admin and non-admin, live and archived logins
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`, `/friends`) re-checked after a cache purge or a 10-minute wait — n/a: the policies changed are not the public pages' read policies (`public_read_site_*` are untouched)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No: nothing in `src/` changed, and nothing reads `is_admin()` but the policies
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no row is touched; policies and one function only
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — see §3

### Rollback

- [x] Rollback position stated, **including what it does not cover** — no Worker change, so `wrangler rollback` is irrelevant. To undo: drop `is_admin()`'s policies and re-create the `admin_all_*` ones on `current_user_role() = 'admin'::app_role`. It does not restore the two `volunteer_read_*` policies unless re-created too, and they are redundant

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | High, found by this work | "Drop `admin_all_*`" would have removed Admin's delete on eight tables (no other policy grants DELETE) and Admin's writes on `group_origins` and `rounds` and other people's rows on `assistant_actions`; parity does not probe any of it | fixed in this PR: replaced by `is_admin()` policies for exactly those commands |
| 2 | Low | `/admin/recent-changes` scrolls sideways by 259 px at 375 px (a filter `<select>`) | deferred to backlog: filed on the `backlog` branch |
| 3 | Low | The backlog item said 42 admin and 71 vet policies; dev has 43 and 54 | fixed: the corrected numbers are in the decision and the checker's output |
| 4 | Info | `private.has_app_access()` reads `current_user_role()` and sits in `translatable_fields`' read policy; the checker cannot see it | accepted: a function, `perm-drop-enum`'s |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as the Director/Admin on a PC: open Settings, the permission matrix (role draft), Website content and Recent changes; each loads with its data and an edit to Website content saves | dev, `test.lannacare.org` |
| 2 | As Admin with the authenticator, change one cell of the matrix and add then archive a test login: both succeed; without the authenticator step the page asks for it | dev |
| 3 | As a staff or management login, delete a resident's weight is refused as before and Settings pages are not reachable | dev |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-07

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; items 1 to 3 wait for someone with a login

Manual verification by: pending: Lutan (items 1 to 3); Claude drove nine `/admin/*` pages as a throwaway admin and measured width, which is not that person's check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the release manager reads this when the release is cut

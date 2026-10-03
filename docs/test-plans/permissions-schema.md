# Feature test plan

## Header

| | |
|---|---|
| Feature | `0132_permission_tables.sql`: the permission tables, today's cells, `has_permission()`, `my_permissions()`. Foundation step F1 of the roles build. Additive, read by nothing |
| Backlog item | `docs/backlog.md` → Auth → **Roles build, piece 1 of the foundation: the permission tables (schema PR, `0132`)**, ticked on this branch. The wider item *The roles the shelter actually has* is not ticked: it covers all six roles, and this is its first foundation piece |
| Branch / worktree | `claude/permissions-schema` @ `C:\Development\Animal_Shelter_permissions-schema` |
| Dev server | not started: this change ships no runtime code |
| PR | opened from this branch; the number is recorded in the follow-up commit that ticks CI |
| Tested by / date | Claude (automated) / 2026-10-03 |
| Carries a migration? | yes: `0132_permission_tables.sql` |
| Tested at SHA | the branch tip at the commit that adds this plan, on `main` @ `89252635` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: one additive migration adds `roles`, `permission_activities`, `role_permissions`, `user_roles.role_id`, `has_permission()` and `my_permissions()`, seeded with today's cells for the four template roles, and nothing reads any of it
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0132_permission_tables.sql`; `scripts/check-permission-tables.mjs` (dev-only rollback harness); `docs/decisions/2026-10-03-permission-tables.md`; `docs/roles-and-permissions.md` (§9, §10, §15 corrected); `docs/backlog.md`; this plan. No `src/`, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public: none yet, by design. The one existing-behaviour touch is on `user_roles`: a trigger now fills `role_id`, and a deferred constraint trigger refuses a transaction that leaves no active admin. No existing policy, function, view or page changed
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: Lanna's 2IC, Maintenance and Medical roles and the narrowed volunteer (each is its own slice, §12); the `who and where` scope (no view behind it yet); enforcement of `requires`; any policy converting to `has_permission()`; the parity check; `src/` (`can()`, the catalogue file, the route registry); production

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync`: `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines pasted below, as printed:

  ```
  === gates: typecheck exited 0 after 92s
  === gates: lint exited 0 after 63s
  === gates: build exited 0 after 42s
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `main` tops out at `0131_blood_test_write_policies.sql`; the brief gave this branch the slot and `check-migration-numbers` reports `0132_permission_tables.sql` against `origin/main`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `131 applied, 1 pending. pending: 0132_permission_tables.sql` on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0132_permission_tables.sql … ok`. It has no dependency on another pending file, so the dry-run's per-file rollback caveat does not apply
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0132_permission_tables.sql … ok`, from this branch, once
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): the harness replays the whole file in one transaction after tampering with a seeded cell, the catalogue and a `role_id`: counts unchanged, a shelter's edit to a cell kept, the catalogue restored, no audit rows written by the replay (step G)
- [x] Existing rows still read correctly after the change (checked against real dev data): every real `user_roles` row on dev has a `role_id` that agrees with its enum value (step A, over the real logins, 5 of them admins), and `check-user-roles-aal2`, `check-role-write-policies`, `check-audit-log`, `check-vet-resident-scope` and `check-contact-visibility` all still end in their `HARNESS-OK` / pass line after the apply
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness, `scripts/check-permission-tables.mjs`, against the live dev schema and its real logins plus rolled-back fixtures. Asserted: **(A)** 6 roles, 55 activities (36 Yes/No, 19 level), 48 / 37 / 13 / 24 cells for management / staff / vet / volunteer and 0 for admin and public_viewer, no Yes/No cell below level 2, `requires` empty, no real login without a `role_id` or disagreeing with its enum; **(B)** `has_permission()` answers no for a missing cell, an unknown activity, an archived role (with a control that the same login answered yes just before archiving), and a person with no role, and also for an archived person, a signed-out caller, `anon` (refused outright), a null activity and a mistyped level, for Admin too; answers yes for seeded cells, distinguishes read from edit, and Admin is yes for everything including an unknown activity; **(C)** `my_permissions()` shape and counts for admin (55), staff (37) and vet (scopes), `{}` for the public viewer, null for no role, an archived role and an archived person, and refused to `anon`; **(D)** a cell for Admin or the public viewer, level 1 on a Yes/No activity, an unknown activity, a duplicate cell, a Yes/No flip under Read cells are all refused; the two fixed roles cannot be deleted, archived, renamed, re-kinded or re-bridged; bad scope values (`who_and_where` included), a bad key, a bad home path refused; `user_roles.role_id` is filled on insert, follows the enum, drives the enum when it is changed, and refuses a role with no `legacy_role`; the last active admin cannot be archived, deleted or demoted, one admin going while another remains is fine, a swap of admins inside one transaction passes when forced, and a deferred loss of every admin is caught when forced; **(E)** an admin at aal2 reads and writes the matrix and the catalogue is read-only through the API; an admin at aal1, every other role and `anon` are refused; the admin role cannot be deleted by an admin and cannot be given a cell; **(F)** the seed left no audit rows, and an insert, an update and a delete of a cell each log one row with the admin as actor; **(H)** 660 answers, six roles × 55 activities × read and edit, each under that role's own login, equal the §4 table of the paper, which the script reads itself and not from the migration; **(G)** the replay above. Output, unedited:

  ```
  status 400
  Failed to run sql query: ERROR:  P0001: HARNESS-OK 0132_permission_tables.sql asserted live | A: 6 roles, 55 activities, cells 48/37/13/24/0/0 | B: four answers-no cases, archived person, signed out, anon, null, mistyped level, seeded yes, read vs edit, admin yes | C: my_permissions | D: guards, role_id bridge, last admin | E: RLS at aal1/aal2, anon | F: audit | H: 660 answers (6 roles x 55 activities x read/edit) equal section 4 of the paper | G: replay keeps a shelter edit
  CONTEXT:  PL/pgSQL function inline_code_block line 10 at RAISE
  ```

  (`status 400` is by design: the harness ends in a `raise` so it cannot commit; the script exits 0 only on `HARNESS-OK`.)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: purely additive and read by nothing. Undoing it is listed in the file's header: drop the audit and guard triggers, the functions, `user_roles.role_id`, then the three tables. One thing would be lost: nothing, until a cell is edited
- [x] Production apply plan stated for the release manager (which file, which project, when): `0132_permission_tables.sql` to production `dbkodyyxxhtygxcxmfcu`, by Lutan from the main checkout, `--dry-run` then apply, after this PR merges. No code reads it, so the order against a deploy does not matter. It back-fills `role_id` for every production login and the last-admin trigger starts guarding production's `user_roles`; production has at least one admin by construction (the recovery route is `bootstrap-admin.mjs`)

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, nothing reads these tables yet. The function-level happy path is harness steps B, C and H
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface, nothing reads these tables yet
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface; insert, update and delete of a cell exercised at the SQL level in harness steps E and F
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface; a login with no role gets `false` and `null` (steps B, C)
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI surface; the database's refusals carry sentences (for example "Fixed roles have no cells…", "This would leave the shelter with no active admin…") and are asserted in step D
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no free-text or date inputs; the boundaries that exist (level 0 and 3, a null activity, a mistyped level, a bad key and home path) are in step D and B

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no route or policy changed | no change | `has_permission()` yes for all 55, `my_permissions()` returns 55 (harness H, C) |
| management | n/a: no route or policy changed | no change | 48 cells equal §4 (harness H) |
| staff | n/a: no route or policy changed | no change | 37 cells equal §4 (harness H) |
| vet | n/a: no route or policy changed | no change | 13 cells equal §4, scopes `own_clinic` / `name_type` / `medical_only` (harness H, C) |
| volunteer | n/a: no route or policy changed | no change | 24 cells equal §4 (harness H) |
| signed out | n/a: no route or policy changed | no change | `has_permission()` false; `anon` cannot execute it (harness B) |

- [ ] Every role above tested — n/a: no route, grant or policy that a role passes through changed; the six roles' answers from the new function are asserted under each role's own login (harness H)
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no route added; the new tables themselves are refused to every role but an admin at aal2, and to `anon` (harness E)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing visible; the manual changes when a screen does
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings. Role names are English only; the Thai names go in with the Settings screen (§18)
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — no page loaded: nothing in `src/` references the new objects. What the change could have disturbed is `user_roles` and `audit_log`, so their existing harnesses were re-run after the apply: `check-user-roles-aal2` (`0100`), `check-role-write-policies`, `check-audit-log` (`0121`), `check-vet-resident-scope` (`0108`), `check-contact-visibility` (`0126`). All still pass
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates green on the synced tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead): piece 1 ticked; the wider roles item has a status line, not a tick; the follow-up found on the way (a vet's Medical-only folder is held by the app, not the database) went to the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `docs/decisions/2026-10-03-permission-tables.md`
- [x] `README.md` still accurate: it does not describe the role model
- [ ] **Release notes.** n/a: by design nobody would notice. Nothing reads the new tables, no policy changed, and every existing login keeps exactly the access it had. The only visible trace is a future Recent changes entry when a cell is first edited, and nothing can edit one yet
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The claims about behaviour (the four answers-no, the guards, the last-admin rule, the replay) are the harness's output above. Three statements in the decision file are reasoning and are worded as such: that two admins demoting each other at the same moment could slip past the app's own-account refusal, that a vet's login used by hand could file outside Medical (read from `record_attachment()`, not exercised), and that the cost of `has_permission()` under RLS is unmeasured (it says so)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (nothing to deploy: SQL only, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or band; the one boundary, a level of 1 versus 2, is asserted from both sides (read and edit) for every cell by harness H
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public view or page reads the new tables; `anon` has no grant on them

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No: the migration is read by nothing, so production's apply can happen before or after any deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees). Worth reading its output for one thing: that production's `user_roles` has an active admin, since the new last-admin trigger only objects to a change that would remove the last one
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: additive; it updates only the new `role_id` column on `user_roles`, filled for every row
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — see §3

### Rollback

- [x] Rollback position stated, **including what it does not cover** — no Worker change, so `wrangler rollback` is irrelevant. The migration is additive and safe to leave in place. To remove it, follow the revert order in the file header; the only thing it changes in existing tables is `user_roles.role_id` (and two triggers on that table), which is dropped with it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low, not a defect of this change | A vet's "Medical folder only" for photos is enforced in TypeScript, not by `record_attachment()`. Found while checking `scope_photos` against the policies | deferred to backlog (on the `backlog` branch) |

## Left for manual verification

Nothing in this change has a surface a person needs to look at.

| # | What to check | Where |
|---|---|---|
| — | — | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-03

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person. The list is empty

Manual verification by: n/a: no UI surface and nothing reads these tables yet, so there is nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: n/a: not yet — the release manager reads this when the release is cut

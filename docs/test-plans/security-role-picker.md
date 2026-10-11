# Feature test plan

## Header

| | |
|---|---|
| Feature | Settings → Security: the role pickers list every live role, so a login can be given 2IC, Head of Maintenance or Head of Medical |
| Backlog item | `docs/backlog.md` → **Admin → Security: the role picker lists every live role…** (Next up; batch 1 (b) of *Who does what*) |
| Branch / worktree | `claude/security-role-picker` @ `C:\Development\Animal_Shelter_security-role-picker` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-10-11 |
| Carries a migration? | no |
| Tested at SHA | `7b0c9ecc` (code and check script; this plan's commit adds only the plan) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the create form, the users table, Access requests and the server check read live roles from `roles`, and a save writes `role_id` with `role` = that row's `legacy_role`
- [x] Files/areas touched listed: `src/app/admin/security/` (`role-options.ts` new; `actions.ts`, `page.tsx`, `CreateUserForm.tsx`, `UsersTable.tsx`, `AccessRequests.tsx`), `src/lib/manual/en.ts`, `src/lib/releases.ts`, `scripts/check-security-role-picker.mjs` (new), `docs/decisions/`, `docs/backlog.md`. No `worker/`, no migration
- [x] Roles affected identified: admin (the only role that opens Security); the three configured roles (2IC, Head of Maintenance, Head of Medical), which can now be given from the app
- [x] Anything explicitly **out of scope** written down: *Who may write outreach notes* untouched; `APP_ACCESS_ROLES`, `ASSIGNABLE_ROLES`, `MANUAL_ROLES` and `hasAppAccess` untouched (`perm-role-lists`); Maintenance's Assigned to list still labels configured roles "Volunteer" (filed on the `backlog` branch)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date.")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: build exited 0 after 344s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; `0178` is `perm-functions-schema`'s
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration; the users table was read against dev's real rows (every existing login still shows its role)
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration. The trigger the change relies on (`user_roles_sync_role_id`, 0132) was exercised through the page instead: §4
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

All by `node scripts/check-security-role-picker.mjs` against dev, through the real page in headless Edge at 375 × 812, as a throwaway admin stepped up with a real authenticator code. Output at `7b0c9ecc`, unedited:

```
ok    the test admin reaches Settings -> Security
ok    the create form offers every live role, in order
ok    Staff is not offered
ok    in Thai, 2IC reads รองผู้จัดการ
ok    in Thai, Head of Maintenance reads หัวหน้าฝ่ายซ่อมบำรุง
ok    in Thai, Head of Medical reads หัวหน้าฝ่ายการแพทย์
ok    2IC: the form says it was created as 2IC
ok    2IC: user_roles.role_id is the second_in_command row
ok    2IC: user_roles.role is its legacy_role (volunteer)
ok    Head of Maintenance: the form says it was created as Head of Maintenance
ok    Head of Maintenance: user_roles.role_id is the head_of_maintenance row
ok    Head of Maintenance: user_roles.role is its legacy_role (volunteer)
ok    Head of Medical: the form says it was created as Head of Medical
ok    Head of Medical: user_roles.role_id is the head_of_medical row
ok    Head of Medical: user_roles.role is its legacy_role (volunteer)
ok    2IC: the users table shows "2IC"
ok    Head of Maintenance: the users table shows "Head of Maintenance"
ok    Head of Medical: the users table shows "Head of Medical"
ok    changed in the table to Management: role_id and role are management and management
ok    changed in the table to Doctor: role_id and role are doctor and doctor
ok    as Doctor, the row shows its Doctor box (not linked yet)
ok    changed in the table to Admin: role_id and role are admin and admin
ok    made Admin, the login's 2-step set-up is opened
ok    changed in the table to Head of Medical: role_id and role are head_of_medical and volunteer
ok    no browser console errors on Settings -> Security
ok    2IC: signs in with the temporary password the page showed
ok    2IC: current_user_role() is volunteer
ok    2IC: my_permissions() names the role second_in_command
ok    2IC: my_permissions() is exactly its role's 28 cells
ok    2IC: is made to choose a password first
ok    2IC: then lands inside the app
ok    2IC: opens /stocktake
ok    2IC: holds no reports.cashflow cell
ok    2IC: is turned away from /management/cashflow
ok    2IC: is turned away from Settings -> Security
ok    Head of Maintenance: signs in with the temporary password the page showed
ok    Head of Maintenance: current_user_role() is volunteer
ok    Head of Maintenance: my_permissions() names the role head_of_maintenance
ok    Head of Maintenance: my_permissions() is exactly its role's 9 cells
ok    Head of Maintenance: is made to choose a password first
ok    Head of Maintenance: then lands inside the app
ok    Head of Maintenance: opens /maintenance
ok    Head of Maintenance: holds no reports.cashflow cell
ok    Head of Maintenance: is turned away from /management/cashflow
ok    Head of Maintenance: is turned away from Settings -> Security
ok    Head of Medical: signs in with the temporary password the page showed
ok    Head of Medical: current_user_role() is volunteer
ok    Head of Medical: my_permissions() names the role head_of_medical
ok    Head of Medical: my_permissions() is exactly its role's 10 cells
ok    Head of Medical: is made to choose a password first
ok    Head of Medical: then lands inside the app
ok    Head of Medical: opens /medical/weight
ok    Head of Medical: holds no reports.cashflow cell
ok    Head of Medical: is turned away from /management/cashflow
ok    Head of Medical: is turned away from Settings -> Security

All checks passed.
```

- [x] Happy path works end to end: a login created for each configured role through the page, signed in, password chosen, landed in the app on its own page
- [x] Data persists — reload the page and the change is still there (the table is read after a reload each time; the `user_roles` row is read from the database)
- [x] Create / edit / delete all exercised (whichever the feature has): create through the form, role change four ways in the table; delete is unchanged and was used by the script's cleanup through the admin API, not the page
- [ ] Empty state renders sensibly (no rows yet) — n/a: there is always at least the Admin role and the signed-in admin's own row; a failed `roles` read shows the existing "couldn't load roles" line (reads the new query's error too)
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: not exercised in the browser this round; the server refuses an unknown or archived key with the existing "Select a valid role." / "Invalid role." (`givableRole()` returns null), which a picker cannot send without a hand-made request
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no new input field; the role names are fixed rows, the longest English one ("Head of Maintenance") fits the widened create-form select at 375 px (screenshot)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Settings → Security, every role in the pickers | yes | as expected (throwaway admin at aal2) |
| management | Settings → Security | no — guard unchanged (`requireAdminUser`) | not re-run: guard untouched by this change |
| staff | — | retired (0173); never offered, shown only on a login still holding it | "Staff is not offered" checked |
| doctor | Settings → Security | no — guard unchanged | not re-run; the Doctor box under a role that borrows `doctor` checked as admin |
| volunteer | Settings → Security | no | the three configured roles (all borrowing `volunteer`) turned away, checked |
| signed out | Settings → Security | sent to sign-in | seen at the start of the session (`/login?next=%2Fadmin%2Fsecurity`) |

- [ ] Every role above tested — n/a: management and doctor were not signed in as; this change does not touch the page or action guards (`requireAdminUser`, `hasTwoStep`, `refuseUnlessAdmin`), and the logins it creates were each tested
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): each configured-role login sent to `/admin/security` and `/management/cashflow` by URL and turned away

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`): one sentence in the Accounts and roles topic. Read in the file, not at `/manual` (see Left for manual verification)
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no new dictionary strings; configured roles' Thai names come from `roles.name_th`, checked in Thai above
- [x] Mobile viewport (375px) — no overflow, controls reachable: the whole check runs at 375 px; screenshots of the form, table and each role's landing looked at
- [x] Browser console clean — no errors or React warnings ("no browser console errors on Settings -> Security")
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not captured by the script; every action it drove reported success and the database agreed

## 6. Regression

- [x] The pages nearest the change still work: Settings → Security (form, table, Access requests rendering), each configured role's landing, `/stocktake`, `/maintenance`, `/medical/weight`, `/account/password`
- [ ] Any shared file touched checked from a second, unrelated page — n/a: `manual/en.ts` and `releases.ts` gained one string each; no shared lib or component changed
- [x] Nothing merged from `main` during `sync` was broken by this branch (nothing was merged: already up to date)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**; the PRIORITY parent has a note that (b) is done (not ticked); *Move the last four role-name lists* noted that `VALID_ROLES` is gone. Follow-up (Maintenance's Assigned to list) on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`2026-10-11-security-role-picker.md`), and a dated note in `2026-10-04-permissions-sweep-rest.md`
- [ ] `README.md` still accurate — n/a: README does not describe the role picker
- [x] **Release notes.** `unreleased` gained one line, tagged admin, written for a shelter user
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The trigger's behaviour (role_id wins, `role` is overwritten) was read in 0132 and then shown through the page: Head of Medical saved as `role_id` = its row and `role` = `volunteer`, Management as `management`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no boundary or banding
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration. It reads `roles` (0132) and the configured rows (0136, 0141, 0143); on a database without those rows they are simply not offered
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` — n/a: no migration
- [ ] For a **destructive or rewriting** migration only — n/a: no migration
- [ ] Apply plan stated — n/a: no migration. **Release note for the manager:** until `0173` reaches production, production's Staff row is not archived, so this picker **offers Staff there** (the old hard-coded list did not). See the PR

### Rollback

- [x] Rollback position stated: app only, no schema. Rolling back restores the five hard-coded roles; logins already given a configured role keep it (their `user_roles` rows are valid either way) but the old table would show them under their borrowed enum ("Volunteer")

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | Maintenance's Assigned to list labels configured roles "Volunteer" (outside this page) | deferred to backlog (`backlog` branch, Quick wins) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Lutan can give someone the 2IC role from the Security page — the sentence he asked for — and the row then reads 2IC | Settings → Security on `localhost:3002` or `test.lannacare.org` |
| 2 | The new manual sentence reads well in place | `/manual`, Accounts and roles |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-11

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; two items wait for Lutan

Manual verification by: pending: Lutan to give someone the 2IC role from Security, and read the manual line

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: not yet — the one defect is deferred to the backlog, which Lutan accepts or not at review
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: pending  Date: —

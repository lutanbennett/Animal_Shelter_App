# Feature test plan — perm-role-lists

## Header

| | |
|---|---|
| Feature | The last role-name lists (`APP_ACCESS_ROLES`/`hasAppAccess`, `ASSIGNABLE_ROLES`, `MANUAL_ROLES`) read the role instead of an enum list; Maintenance's Assigned to names a configured role by its own name |
| Backlog item | `docs/backlog.md` → **Move the last four role-name lists onto the permissions system** and **Maintenance's Assigned to list names a 2IC… as "Volunteer"** (both ticked) |
| Branch / worktree | `claude/perm-role-lists` @ `C:\Development\Animal_Shelter_perm-role-lists` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | pending (filled when opened) |
| Tested by / date | Claude / 2026-10-11 |
| Carries a migration? | no |
| Tested at SHA | `068faddd` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — who opens the app, who a job may be given to and which manual audience a login reads as now come from the role (`opens_app`, `role_key`), not lists of enum names, with no change in who can do what; and the maintenance picker shows a configured role's own name
- [x] Files/areas touched listed — `src/lib/auth/app-access.ts`, `require-role.ts`, `src/lib/supabase/proxy.ts`, sign-in (`login/actions.ts`, `auth/callback/route.ts`), `adopt/PublicHeader.tsx`, `r/[code]/page.tsx`, `no-access/page.tsx`, `src/lib/manual/{audience,filter,types}.ts`, the manual page/PDF and releases page, `recurring-jobs/{eligibility,actions,page}`, `src/lib/auth/app-users.ts`, `maintenance/MaintenanceForm.tsx`, `enum-labels.ts`, both dictionaries, two scripts, docs
- [x] Roles affected identified — every login passes through the proxy check, so all of them; the visible change is for anyone assigning a maintenance job or a recurring job
- [x] Anything explicitly **out of scope** written down — no migration (`0179` is `role-floor-schema`'s); no `name` column on `app_users`; `/my` and `who-and-where.ts` still call `current_user_role()` (`perm-drop-enum`); `doctor` still lands on appointments by key

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 68s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration; the old-versus-new answers were compared on real dev rows (§4)
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — the build compiles every caller; `check-recurring-job-eligibility.mjs` passes; old-versus-new compared for all 61 dev logins (below). **Not driven in a browser as a non-admin** — see Left for manual verification
- [ ] Data persists — n/a: nothing is written
- [ ] Create / edit / delete all exercised — n/a: nothing is written
- [ ] Empty state renders sensibly — n/a: no list changes shape; a login with no live role still reads as null and is signed out as before
- [ ] Invalid input is rejected — n/a: no input
- [x] Boundary cases checked — archived role / archived login / public viewer / no role: `current_user_role()` and `my_permissions()` read from `user_roles`+`roles`; all 13 `staff` logins on dev are archived, so the one real difference (a live login on an archived role is now treated as having no role) affects nobody

**Parity, repeatable.** (1) `node scripts/check-permission-parity.mjs` on `main` and on this branch against the same dev database, outputs diffed: identical (260 probes, 1820 answers, RED on both for the existing doctor lines) except the deleted `UNPAIRED hasAppAccess` row. (2) A query through the Management API joining `user_roles` to `roles` comparing the old enum-list answers with the new key/`opens_app` answers for each login: identical for all 61, except the 13 archived `staff` logins in the maintenance list, who are not in `app_users`. (3) `asManualRole` against every row of `roles`: same audience as before. Detail in `docs/decisions/2026-10-11-perm-role-lists.md`.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | app | unchanged | n/a — compared by query, not signed in |
| management | app | unchanged | n/a — as above |
| staff | nothing (retired, all archived) | unchanged | n/a — as above |
| doctor | app, lands on appointments, never assignable | unchanged | n/a — as above |
| volunteer | app | unchanged | n/a — as above |
| signed out | public site | unchanged | n/a — proxy path for signed-out unchanged |

- [ ] Every role above tested — n/a: compared by query on dev (old versus new answer per role); no browser session as each role, which is Lutan's handover below
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed; the public viewer is still refused by `opens_app = false`, the same value `private.has_app_access()` uses

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no feature to describe; the labels are the roles' existing names
- [x] Translatable strings go through the translation path — the three role names are in `t.admin.security.configuredRoles`, English and Thai
- [ ] Mobile viewport (375px) — n/a: the picker text is a label only
- [ ] Browser console clean — n/a: not driven in a browser
- [ ] Network clean — n/a: not driven in a browser

## 6. Regression

- [x] The pages nearest the change still work — build compiles sign-in, proxy, manual, releases, recurring jobs and maintenance; `acceptance-matrix.mjs --check` and the catalogue check pass
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared UI file; `app-access.ts` is exercised by the build and the lint scripts, not loaded in a browser
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged in

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` — both, with what closed them. Searched `APP_ACCESS_ROLES`, `ASSIGNABLE_ROLES`, `MANUAL_ROLES`, `hasAppAccess`, `roleLabel`: the only other open mentions are `perm-drop-enum` (left open, it is next) and the PRIORITY item
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-11-perm-role-lists.md`; the superseded lines in `2026-10-04-permissions-sweep-rest.md` say so
- [x] `README.md` still accurate — it names none of the lists
- [x] **Release notes.** — `unreleased` gained a line: the Assigned to list shows a 2IC, Head of Maintenance or Head of Medical by role name, not Volunteer
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the staff logins, their archived state and the per-role answers came from queries on dev; the parity diff from two runs

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the gates block above is the script's own closing lines
- [ ] Public pages re-checked after a cache purge — n/a: the public header changes only how "Open the app" is decided, to the same answer

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — a code rollback via the Pi `--ref` is clean: no schema moved. The new code needs `my_permissions()` on production (it exists since 0132 and the menu already reads it), worth the release manager's `--status --env production` look

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | First lint run failed: `acceptance-matrix.mjs` loads `manual/filter.ts` under type stripping and cannot follow a value import | fixed — `asManualRole` moved to `manual/audience.ts` |
| 2 | info | `check-permission-parity.mjs` is RED on main and here alike (doctor lines) | not this PR — identical before and after |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Sign in as a Head of Maintenance (not an Admin), open a maintenance job to create or edit it and look at the Assigned to list: a 2IC, Head of Maintenance and Head of Medical show under those names, not Volunteer; switch to Thai and the Thai names show | dev, `/maintenance/new` |
| 2 | Sign in as each role once (Admin, Management, 2IC, Volunteer, Doctor): all land where they did, and a public viewer still lands on the public home | dev, `/login` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-11

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items are left for Lutan to look at, not ticked

Manual verification by: pending: Lutan to look at the two rows above

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: tick when the manual check is done
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released

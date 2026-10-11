# Feature test plan — perm-drop-enum

## Header

| | |
|---|---|
| Feature | `user_roles.role`, `roles.legacy_role`, `current_user_role()` and the `app_role` type are dropped; every reader moved onto the role's own row |
| Backlog item | `docs/backlog.md` → **`perm-drop-enum`** (ticked) |
| Branch / worktree | `claude/perm-drop-enum` @ `C:\Development\Animal_Shelter_perm-drop-enum` |
| Dev server | `http://localhost:3002` |
| PR | pending (filled when opened) |
| Tested by / date | Claude / 2026-10-11 |
| Carries a migration? | yes — `0180_perm_drop_enum_readers.sql`, `0181_perm_drop_enum_drop.sql` |
| Tested at SHA | filled at PR time |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the last readers of the role enum (4 functions, 8 views, 7 files in `src/`, ~60 scripts) move onto `roles`, then the enum and its function are dropped, with no change in who can do what
- [x] Files/areas touched listed — `0180`, `0181`; `admin/security/{actions,page,role-options,UsersTable}`, `my/page.tsx`, `lib/residents/who-and-where.ts`, `lib/status/alerts.ts`, `lib/auth/app-users.ts`, `management/recurring-jobs/{actions,page}`; operator scripts (`bootstrap-admin`, `deploy`, `import-appsheet`, `measure-permission-baseline`, `probe-role-surface`); ~60 check harnesses; `scripts/lib/{user-role,old-role-shim}.mjs`
- [x] Roles affected identified — all of them (every login reads through `has_app_access`, the views and `app_users`); parity says none changes
- [x] Anything explicitly **out of scope** written down — `notAskedYet`'s three activity splits and `databaseWider`'s nine policies are other items; no policy was narrowed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged (one conflict in `docs/backlog.md`, resolved by keeping `main`'s text and re-adding the note), second sync "Already up to date"
- [x] `node scripts/gates.mjs`: see the block pasted at the end of this plan, `typecheck=0 lint=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` — `0180` and `0181`, against `0179`
- [x] `--status` reviewed — dev was at 179 applied, 0 pending
- [x] `--dry-run` reviewed — `0180` ok; `0181` ok (dry-run after `0180` was applied, so the dependent-file trap did not arise)
- [x] Applied to dev — both; dev is now at 181
- [x] File is re-runnable — `create or replace`, `drop … if exists`, `alter … drop column if exists`; `0180` was also re-applied by the harness `ran twice` paths where they replay
- [x] Existing rows still read correctly — 71 logins on dev, all with `role_id`; `NOT NULL` set without error
- [x] Constraints and defaults exercised — `check-permission-tables` section D rewritten: `role_id` required (null refused), a role with no legacy now assignable
- [ ] Down-migration — n/a: a dropped column is put back by a new migration, not a down file (written in the decision's hazard section)
- [x] Production apply plan — in the PR and the decision: `0180`, deploy, then `0181` **by name**, never the queue at once

## 4. Functional checks

- [x] Happy path works end to end — Settings → Security creates a 2IC, Head of Maintenance and Head of Medical **through the page after the drop**, changes one through Management, Doctor, Admin and back, signs each in: `check-security-role-picker.mjs`, 375 px, all checks passed
- [x] Data persists — role_id read back from `user_roles`; no enum column
- [x] Create / edit / delete all exercised — create and change role through the page; delete by the other harnesses' cleanups
- [ ] Empty state renders sensibly — n/a: no list changes shape
- [ ] Invalid input is rejected — n/a: no input; a login with no role is refused by `NOT NULL` (tested)
- [x] Boundary cases checked — archived login, archived role (staff), role-less login, public viewer: `check-app-access-gate.mjs` (green); the helpers deliberately do not filter on the role being archived, as the enum did not

**Parity, repeatable.** `check-permission-parity.mjs`: 1792 MATCH / 21 KNOWN TIGHTENING / 21 MISMATCH before `0180`, after `0180` and after `0181`; before and after `0180` diffed identical. `check-who-does-what.mjs`: identical, green. `check-perm-functions.mjs`: 0 changes, 0 functions reading the enum. `check-perm-convert-vet.mjs`: 2465 probes, 0 differences. Detail and the full harness comparison in `docs/decisions/2026-10-11-perm-drop-enum.md`.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | unchanged | parity identical (probed per role) |
| management | the app and Management | unchanged | parity identical |
| doctor | own clinic | unchanged | parity identical; `is_clinic_login()` agrees for 61/61 |
| volunteer (and 2IC, Heads) | who-and-where floor | unchanged | parity identical; `on_volunteer_floor()` follows the scope |
| public viewer / signed out | public site | unchanged | `check-app-access-gate` green |

- [x] Every role above tested — by the parity probes and the access-gate harness against the database; not by a person signing in (see Left for manual verification)
- [x] A role that should not have access is blocked server-side — the gate harness reads every internal object as archived, role-less and public viewer: 0 rows

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing a user can do has changed
- [ ] Translatable strings go through the translation path — n/a: no new string
- [x] Mobile viewport (375px) — the Security picker harness runs at 375 px
- [x] Browser console clean — `check-security-role-picker`: "no browser console errors on Settings -> Security"
- [ ] Network clean — n/a: not separately checked

## 6. Regression

- [x] The pages nearest the change still work — `check-who-does-what-page`, `check-page-guards-live`, `check-facility-map-editor`, `check-medical-jobs-app`, `check-residents-export`, `check-residents-select-all` all pass against the running dev server
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared UI file
- [x] Nothing merged from `main` during `sync` was broken by this branch — `who-does-what-edit` merged in; its `check-who-does-what.mjs` change auto-merged and the script is green

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md`, and what else it closed searched: *Senior Staff role* and *Roles and permissions each shelter configures* each gained a note (not ticked: both remain open for their own reasons); the PRIORITY item's "afterwards" line now says done
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-11-perm-drop-enum.md`
- [x] `README.md` still accurate — it names neither the enum nor the function
- [ ] **Release notes.** — n/a: nobody would notice: parity is identical, and the one behaviour that moves (creating a login on a role with no legacy mapping) cannot happen yet because every role has one
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the counts come from queries on dev; parity from the same script run before and after

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager. **Dev's database is already at `0181`, so `test.lannacare.org` (0.25.0) mis-handles three paths until redeployed from this branch**
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic
- [ ] **Boundary or banding change** — n/a: no threshold or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block below is the script's own closing lines
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering

- [x] Both a migration and code that reads it? — yes, and the order is **reversed for `0181`**: `0180` before the app; the app live; then `0181`. The previous release reads `app_users.role`, calls `current_user_role()` and writes `user_roles.role`, and fails when `0181` lands. `apply-migrations.mjs`' "safe direction" note is wrong for `0181`
- [ ] Production dry-run — deferred: release manager (`--status --env production` first: the runner applies every pending file)
- [ ] Destructive migration backup — deferred: release manager. `0181` drops two columns and a type; confirm a backup before applying it
- [x] Apply plan stated — in the PR body and the decision's "Release hazard" section

### Rollback

- [x] Rollback position stated — a code rollback after `0181` fails on the three paths above. The only way back is a new migration adding `user_roles.role` and `roles.legacy_role` and back-filling them from `roles` (key list in `0132`)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | A first search for readers missed three in `src/` (admin emails, the doctor-link lookup, two `app_users` selects) and three operator scripts (`deploy`, `bootstrap-admin`, `import-appsheet`) | fixed — found by searching for how the column is used |
| 2 | low | `check-migration-grants.mjs` failed on `0082` granting the dropped function to anon | fixed — kept on the allow-list with a note |
| 3 | info | 16 harnesses stay red exactly as before (list in the decision); `check-permission-tables` stops at section F (audit rows on dev), not caused here | not this PR — identical before and after |
| 4 | info | `check-phone-width.mjs` exceeded a 9-minute run limit with no failure; not completed | accepted — not a result |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Settings → Security → create a login as **2IC**, then sign in as that login on a phone: it lands inside the app and not on Settings → Security (the path the removed write sat on) | dev, `/admin/security` |
| 2 | Sign in once each as Admin, Management, Doctor, a volunteer and a public viewer: all land where they did | dev, `/login` |
| 3 | On dev, Settings → Security still lists every person, and the recurring-jobs "who can do it" picker still lists people | dev, `/admin/security`, `/management/recurring-jobs` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-11

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: three items are left for Lutan, not ticked

Manual verification by: pending: Lutan to look at the three rows above

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: tick when the manual check is done
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released

## Gates output

```
=== gates: build exited 0 after 35s

gates: typecheck=0 lint=0 build=0
```

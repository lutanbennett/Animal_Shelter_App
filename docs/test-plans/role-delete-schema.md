# Feature test plan — role-delete-schema

## Header

| | |
|---|---|
| Feature | Schema half of "Delete role": take out role archiving (`roles.archived_at`) and every reader of it. The Delete role button is NOT in this PR |
| Backlog item | `docs/backlog.md` → **A "Delete role" button on Settings → Who does what, and take out role archiving** (left open: the button is `claude/role-delete-app`) |
| Branch / worktree | `claude/role-delete-schema` @ `C:\Development\Animal_Shelter_role-delete-schema` |
| Dev server | `preview_start` name `dev` → `http://localhost:3006` |
| PR | pending: the number is known once the PR opens |
| Tested by / date | Claude / 2026-10-27 |
| Carries a migration? | yes — `0272_remove_role_archiving.sql` |
| Tested at SHA | `d288c468` (gates ran on the code at `3be8bfc0`; the commit after it adds only the decision file) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the "take out archiving" half: every function reading `roles.archived_at` is rewritten, then the column is dropped
- [x] Files/areas touched listed — `supabase/migrations/0272_remove_role_archiving.sql`; app readers `src/lib/home/roles.ts`, `src/lib/auth/held-roles.ts`, `src/lib/permissions/approvers.ts` (+ test), `src/app/admin/security/*`, `src/app/admin/who-does-what/{page,roles,actions}.ts`, both dictionaries (`retiredRole` removed); `scripts/lib/readonly-checks.mjs` and the check scripts that filtered on or set it; `docs/hard-coded-security-registry.json`; the decision file
- [x] Roles affected identified — every role: `has_permission()`, `is_admin()`, `my_permissions()` and `role_can()` are what every policy calls. Search pattern used: `r.archived_at` / `roles.archived_at` / `from("roles")` plus the live function bodies read from `pg_proc`, NOT a bare `archived_at` grep (57 migrations, most other tables)
- [x] Anything explicitly **out of scope** written down — the Delete role button, its pop-up and `delete_role()` belong to `claude/role-delete-app`. `user_roles.archived_at` is untouched. Production is not touched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line as printed:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (`0271`), and no other in-flight branch carries one (`apply-migrations.mjs` printed `migration numbers: ok`)
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying (272 applied, 1 pending)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `0272 … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) on 2026-10-27 and recorded in `schema_migrations`
- [x] File is re-runnable (`drop … if exists`, `create or replace`, `drop column if exists`)
- [x] Existing rows still read correctly after the change — `role-cards`, `role-cells`, `cards-union` and `role-cards-coverage` read the live roles and are clean
- [x] **Constraints and defaults exercised against real rows** — a rolled-back dev harness (scratchpad) took each of admin, volunteer, management, doctor, head_of_medical, head_of_maintenance, second_in_command and a card-less role, set that login's JWT, and compared `has_permission(activity, 'read'|'edit')` for all 69 activities with the cells the role holds. Result: 0 mismatches for all eight; admin 69 of 69, volunteer 4, management 25, doctor 13, head_of_medical 9, head_of_maintenance 7, second_in_command 15, the card-less role 0 (and `holds_app_role()` false). `is_admin()` true only for admin. `user_roles.archived_at` still exists and the functions still filter on it, so 0270's guard is untouched
- [x] Down-migration — not needed, and re-adding the column would only bring back a feature Lutan removed: dev had 0 archived roles and a dropped column held no data. The release manager reads `select count(*) from roles where archived_at is not null` on production before applying 0272 and stops if it is not 0
- [x] Production apply plan stated for the release manager: file `0272`, project `dbkodyyxxhtygxcxmfcu`, after 0270 and 0271 (both pending there). Deploy this code FIRST, then apply 0272: the new code no longer selects the column, but the old code does, so migration-first would break the home screen and Who does what

## 4. Functional checks

- [x] Happy path works end to end — admin and volunteer logins load `/my`; admin loads `/admin/security`, `/admin/who-does-what`, `/management/recurring-jobs` and `/admin/diets` with no error (status 200, dev server log clean after fixing four missed readers)
- [ ] Data persists — n/a: no write path changed, only reads
- [ ] Create / edit / delete all exercised — n/a: no feature surface; the delete button is the next PR
- [ ] Empty state renders sensibly — n/a: nothing new is displayed
- [ ] Invalid input is rejected with a readable message — n/a: no input was added; the "retired role" message on Restore login is removed because that state cannot exist
- [ ] Boundary cases checked — n/a: the harness in section 3 covers the boundary that matters (a login with no cards is refused for all 69 activities)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | all 69 activities readable, Settings pages load | pass (DB harness + browser, dev-signin-admin) |
| management | its 25 cells | exactly its cells | pass (DB harness; not driven in the browser) |
| staff | n/a | role no longer exists (0270) | n/a |
| doctor | its 13 cells | exactly its cells | pass (DB harness) |
| volunteer | 4 cells | home shows Home, My tasks, Residents; `/admin/who-does-what` refused with "You don't have access to this page" | pass (browser, dev-signin-volunteer, and DB harness) |
| signed out | nothing | unchanged | n/a: no public page reads roles.archived_at |

- [x] Every role above tested — the roles that exist (eight above) by the DB harness; admin and volunteer also in the browser
- [x] A role that should not have access is blocked server-side — the volunteer on `/admin/who-does-what` landed on `/no-access`; a login with no cards answered no to every activity

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no user-visible behaviour changed
- [ ] Translatable strings — n/a: one error string (`retiredRole`) deleted from both dictionaries, none added
- [ ] Mobile viewport (375px) — n/a: no layout change
- [x] Browser console clean — dev server log shows no errors after the last reload (the earlier error was the missed `roles.ts` reader, since fixed)
- [x] Network clean — all page fetches returned 200

## 6. Regression

- [x] The pages nearest the change still work — `/admin/security`, `/admin/who-does-what`, `/my`, `/management/recurring-jobs`, `/admin/diets`
- [x] Any shared file touched checked from a second page by loading it — `src/lib/home/roles.ts` (every login's home) loaded via the volunteer's `/my`; `held-roles.ts` via `/management/recurring-jobs`
- [x] Nothing merged from `main` during `sync` was broken — nothing was merged (already up to date)

Checks run: `check-production.mjs` `role-cards`, `role-cells`, `role-cards-coverage`, `cards-union` (all clean; **`--env test` now lists eleven roles, not six** — the extra five are disposable `dev_signin_cards_*` roles other streams created on the shared dev database); `check-cards-count.mjs` ok (33 cards); `check-card-grants.mjs` all passed; `check-hard-coded-security.mjs` prints `no coded security outside the Admin bypass` after declaring five re-declared functions (reasons in the registry and the decision file). `check-role-can.mjs` and `check-permission-parity.mjs` were already red before this change for unrelated reasons (they assert that management holds `stock.count` and use the deleted `staff` role) and were not made green here.

## 7. Documentation

- [ ] Backlog item ticked — n/a: the item covers the Delete role button too, so the planner ticks it when `claude/role-delete-app` merges. Schema half done; left: the button, `delete_role()`, the new activity and the confirm pop-up
- [x] Non-obvious design choices added as `docs/decisions/2026-10-27-role-archiving-removed.md` (his question and answer, the `audit_log` finding, what happened to 0222, the two-columns trap)
- [ ] `README.md` still accurate — n/a: it does not mention role archiving
- [ ] **Release notes.** n/a: internal; the visible change is the Delete role button in the follow-up PR
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned — "0 archived roles" and "no view, policy or index depended on it" were read from dev's catalogue; that the rewritten functions answer the same was measured by the harness in section 3

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no dates involved
- [ ] Boundary or banding change — n/a: not a banding change
- [ ] Evidence pasted into this plan is the tool's actual output — n/a: the gates line is verbatim; the harness results are summarised from its printed lines
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Both a migration and code that reads it — yes; the order is deploy this code first, then apply 0272 — deferred: release manager
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive migration backup — deferred: release manager (it drops a column that holds no data once 0270 is applied; confirm 0 archived roles first)
- [ ] Apply plan stated — deferred: release manager (file 0272, production, after the code deploy and after 0270 and 0271)

### Rollback

- [ ] Rollback position stated — deferred: release manager (a rollback does not restore the column, and re-adding it is not wanted)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | The first pass missed four multi-line `.from("roles")….is("archived_at", null)` readers (home, Who does what); found by loading pages after applying to dev | fixed |
| 2 | low | `check-role-can.mjs` and `check-permission-parity.mjs` were red for reasons that predate this change | accepted: stale harnesses, not made worse |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The role picker lists every role, and restoring an archived login still works | Settings → Security, as Admin |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: someone looks at Settings → Security

Manual verification by: pending: Settings → Security role picker and Restore login

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the file is part of the PR
- [ ] Handed to the production release manager — n/a: handed over through the PR

Result: pass

Release manager acknowledgement: pending: release manager

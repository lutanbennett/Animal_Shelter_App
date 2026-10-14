# Feature test plan — multi-role-schema

## Header

| | |
|---|---|
| Feature | Schema half of "one person, more than one role": `user_roles` is one row per (login, role) with a main role, optional start and end dates and who granted it; every permission helper unions grants and lets a restriction stand only while every live role is restricted; Admin is refused as an additional role |
| Backlog item | `docs/backlog.md` → **One person, more than one role …** (left open; this is part 1 of 4, the app half is `multi-role-build`) |
| Branch / worktree | `claude/multi-role-schema` @ `C:\Development\Animal_Shelter_multi-role-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: opened after this plan |
| Tested by / date | Claude / 2026-10-14 |
| Carries a migration? | yes — `0196_multi_role_logins.sql` and `0197_role_row_live_search_path.sql` |
| Tested at SHA | `be7951f1` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a login may hold several roles and its rights are the union; the item's "schema PR first", plus the two Security actions that the new key would otherwise have broken
- [x] Files/areas touched listed — `supabase/migrations/0196_multi_role_logins.sql`, `0197_role_row_live_search_path.sql`, `src/app/admin/security/actions.ts` and `page.tsx` (main role only), `scripts/check-multi-role-schema.mjs`, `scripts/check-user-roles-aal2.mjs` (one `on conflict` clause), the decision file and the backlog note
- [x] Roles affected identified — none see a change: every one of the 63 dev logins holds one role and its effective permissions hash identically before and after (section 3)
- [x] Anything explicitly **out of scope** written down — the Add-a-role panel, the union in the home and menu, the rota picker and recurring-job eligibility, the manual and the "covers ending" list: all `multi-role-build`. `src/app/admin/who-does-what/` and the public site were not touched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in: already up to date
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Exit codes read from the script's own output:

```
=== gates: typecheck exited 0 after 81s
=== gates: lint exited 0 after 215s
=== gates: test exited 0 after 6s
=== gates: build exited 0 after 139s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `0196` against highest `0195` on `origin/main`; `0197` is the same stream's fix (see Defects)
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev 196 applied, 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `0196 … ok`; it first reported the missing `revoke` on `role_row_live`, which was added
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `0196` then `0197`, both `ok`; 197 applied
- [x] File is re-runnable — `add column if not exists`, constraints dropped first, `create or replace` throughout, the key swap guarded by a check that it is still the old key
- [x] Existing rows still read correctly after the change — per login, under its own JWT, md5 of {`has_permission` read and edit for every activity, `my_permissions()` role / is_admin / scopes / permissions, the eight scope helpers, `private.app_users`}; 63 logins, `cmp` of before and after: IDENTICAL (whole-file sha256 `eb6d382b…8a908` both times). Every existing row became `is_main = true`
- [x] **Constraints and defaults exercised against real rows** — `scripts/check-multi-role-schema.mjs`, one rolled-back transaction on dev: a Head of Medical given Head of Maintenance until today gains a maintenance cell at the highest level and lists two roles with the main role still named; `ends_on` yesterday and `starts_on` tomorrow count for nothing, `ends_on` today and an open-ended role count; a doctor who is also a Head of Medical is not a clinic login and sees all clinical; a volunteer who is also Management leaves the volunteer floor and sees all residents; `app_users` lists the person once; refused: Admin as additional, public viewer as additional, dates on a main role, a second main role, a main role turned additional, an additional role with no main role. Result `ok   all six groups pass (rolled back, nothing kept)`. Re-ran `check-user-roles-aal2.mjs` (HARNESS-OK, A–E) and `check-perm-functions.mjs` (GREEN)
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive until the app half lands and no extra rows exist; the revert steps are in the migration header and the decision file
- [x] Production apply plan stated for the release manager — `0196` and `0197` on `dbkodyyxxhtygxcxmfcu` together, with the next release; **run `--status --env production` first** because the runner applies every pending file. Both are safe before or after the deploy: with one row per login nothing behaves differently. The Security actions in this PR need `0196` applied first

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, nothing can create a second role yet except a script
- [ ] Data persists — n/a: no UI surface; persistence asserted in section 3's check
- [ ] Create / edit / delete all exercised — n/a: no UI surface; the row writes are exercised in section 3's check. Changing a person's role through `setMainRole` (the one UI path touched) was not clicked: pending in the manual table
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input; the database refusals are asserted in section 3
- [ ] Boundary cases checked — n/a: no UI surface; the date boundaries (ends today, ended yesterday, starts tomorrow) are in section 3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `user_roles` writes | at 2-step only, as before | pass — `check-user-roles-aal2.mjs` A–E |
| management | nothing new | unchanged | pass — hashes identical |
| staff | nothing new | unchanged | n/a — retired role; no login holds it |
| doctor | nothing new | unchanged | pass — hashes identical; doctor + Head of Medical tested in the harness |
| volunteer | nothing new | unchanged | pass — hashes identical; volunteer + Management tested in the harness |
| signed out | nothing | nothing | n/a — no grant to anon; the new function is revoked from `anon` |

- [ ] Every role above tested — n/a: no access rule changed for any existing login; the per-login before/after hashes are the evidence, the harness covers the mixed cases
- [ ] A role that should not have access is blocked server-side — n/a: no new surface; the server-side refusals that are new (Admin as additional and the rest) are asserted in section 3, directly against the table

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface yet; the Security manual line is `multi-role-build`'s
- [ ] Translatable strings go through the translation path — n/a: no new strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — typecheck, lint, `npm test` and the full build compile every reader of `user_roles`; `check-user-roles-aal2.mjs` and `check-perm-functions.mjs` run green. `check-2ic-role.mjs`, `check-medical-role.mjs`, `check-maintenance-role.mjs` and `check-permission-tables.mjs` report reds about deliveries, attachments, the who-and-where view and a role bundle; none touch a function changed here, but they were not run before the migration, so see Left for manual verification
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared UI file touched; `/admin/security` itself was not loaded (pending in the manual table)
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync brought nothing

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open, one of four parts; a status note says part 1 shipped and parts 2–4 remain. Searched the backlog for `user_roles`, `has_permission`, `my_permissions`, `role floor`, `Senior Staff` and `one role`: no other open item is closed; the Senior Staff and per-shelter-roles items are discussed in the decision file (helped / neutral)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-14-multi-role-logins.md`
- [x] `README.md` still accurate — it does not describe `user_roles`
- [ ] **Release notes.** n/a: nobody can see this until the Add-a-role panel ships in `multi-role-build`; ticking would promise users something that does not work yet
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — "63 identical" is the `cmp` of two dumps; the 0197 fault is the error the dump returned; the double-role-by-upsert risk was read from `actions.ts`, not run (`setMainRole` itself has no test)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — deferred: `multi-role-build`. `role_row_live` compares against `shelter_date(now())`, and the harness asserts both edges (ends today counts, ended yesterday does not, starts tomorrow does not) with the dates computed by the same function, so it proves the comparison and not the clock; the 00:00–07:00 Thai window on the deployed build is not checked
- [ ] **Boundary or banding change** — n/a: the date boundary has all three sides asserted in section 3
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block is unedited; the harness line is quoted
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — yes: `setMainRole` and the main-row filter read `is_main`. Apply `0196` and `0197` on production **before** the deploy; deployed first, changing a person's role would fail on the missing column
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: the key swap rewrites an index, not data; no row changes beyond the new columns' defaults
- [x] Apply plan stated — `0196` then `0197` on production before the deploy; `--status --env production` first

### Rollback

- [x] Rollback position stated — with one row per login, leaving the schema in place is safe. A code rollback does not revert the migration, and the OLD `actions.ts` against the NEW key would `upsert` a second role, so roll the code back only together with deleting any `is_main = false` rows (there are none until `multi-role-build`)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high on dev | `0196` pinned `role_row_live` to `search_path = ''`; `shelter_date()` calls `shelter_time_zone()` unqualified, so every permission helper failed on dev between the two applies. Caught by the first after-dump | fixed — `0197` (applied files are not edited) |
| 2 | medium | The key change made `upsert({ user_id })` in `approveAccessRequest` and `updateUserRole` add a second role instead of replacing the first — a silent widening on the first role change after merge | fixed — `setMainRole`; not run through the UI |
| 3 | info | Four older role checks report reds (deliveries, attachments, the who-and-where view, a Head of Maintenance bundle) | accepted for this PR — none involve a function changed here; not compared against a pre-migration run |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Change a person's role in Security and approve a waiting request: the person has exactly one role afterwards and the table shows it | `/admin/security` on dev |
| 2 | Archive then restore a person: it works, and a login holding a retired role is told to pick another | `/admin/security` on dev |
| 3 | The four older checks (`check-2ic-role`, `check-medical-role`, `check-maintenance-role`, `check-permission-tables`) were red before this change too | rerun on `main`'s dev schema, or accept |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-14

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, and only the person who looks may tick this; it is recorded as pending on the signature below

Manual verification by: pending: Security role change, approve and archive/restore need a person to click through

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is committed on the branch and linked from the PR description; it is not pasted
- [ ] Handed to the production release manager — n/a: handed over when the release is cut, after merge

Result: pass

Release manager acknowledgement: pending

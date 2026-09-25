# Test plan — public-viewer-login-schema

## Header

| | |
|---|---|
| Feature | `0085_public_viewer_role.sql` adds `app_role` value `public_viewer`, for a login with no app access. `0086_app_access_gate.sql` closes the places where any signed-in session could read internal data. Six owner-rights internal views move to `private`, and `public` keeps a view of the same name over each, gated by `private.has_app_access()`, which allows the five staff roles only. `translatable_fields` gets the same gate. `check-migration-grants.mjs` now fails a later file that re-creates one of the six without the gate. No app code reads the new value yet |
| Backlog item | none of its own: asked by Lutan on 2026-09-25 (brief). The feature half is `public-viewer-login` |
| Branch / worktree | `claude/public-viewer-login-schema` @ `C:\Development\Animal_Shelter_public-viewer-login-schema` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` |
| PR | opened from this commit; number recorded in a follow-up |
| Tested by / date | Claude, 2026-09-25 |
| Carries a migration? | yes — `0085_public_viewer_role.sql`, `0086_app_access_gate.sql` |
| Tested at SHA | `4c2430a` (the change; gates ran here), then `41b0af9` after `sync` merged `origin/main` (`docs/backlog.md` only) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for: a "no access" login option in the security schema that mirrors a disabled or retired account, so testers can get past the sign-in lock and see the public site as a visitor. The audit the brief asked for found wider exposure than it expected (§3, Defects #1), and `0086` closes it
- [x] Files/areas touched listed: `supabase/migrations/0085_public_viewer_role.sql`, `supabase/migrations/0086_app_access_gate.sql`; `scripts/check-app-access-gate.mjs` (new rollback harness); `scripts/check-migration-grants.mjs` (new gate rule); `docs/decisions.md`; this plan. No `src/`, no `worker/`
- [x] Roles affected identified. Admin, management, staff, vet and volunteer read exactly what they read before (harness case B, every object). Signed-in sessions with no staff role (archived, never given a role, and `public_viewer`) lose read access to six internal views and `translatable_fields`. Signed out: unchanged (case C, `check-public-views.mjs`)
- [x] Anything explicitly **out of scope** written down. Everything in the app is left to `public-viewer-login`:
  - the role picker and labels
  - landing on `/`
  - the proxy guard that sends non-staff sessions away from app pages
  - treating a public viewer as signed out on the public pages
  - refusing archived accounts at password sign-in

  Two definer functions stay callable by any session: `resident_is_deceased` and `attachment_resident_id`. They return a boolean or an id for a row id (decisions.md). Turning `security_invoker` on for the internal views is still `0081`'s deferred decision

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: merged `origin/main` (`Merge made by the 'ort' strategy.`, `docs/backlog.md` only, 13+/2−), so no code changed under the gates
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: typecheck exited 0 after 67s
=== gates: lint exited 0 after 146s
=== gates: build exited 0 after 356s
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `migration numbers: ok — 0085_public_viewer_role.sql, 0086_app_access_gate.sql (against origin/main 1651c08, highest 0084_is_public_drive_file.sql)`. `gh pr list --state open` returned `[]`. The brief had reserved 0085 for `anon-function-execute-schema`, but that stream's migration was `0082` and has merged, and its worktree has nothing beyond `main`. The briefs of the three other fresh streams all name 0085 as this stream's
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying:

```
Environment: test — project qxkmhwybjggxvsfxsxbd
This checkout: 84 applied, 2 pending.
  pending: 0085_public_viewer_role.sql (not on origin/main)
  pending: 0086_app_access_gate.sql (not on origin/main)
Against origin/main 1651c08: 84 file(s), 84 applied row(s).
  On origin/main, not applied here: 0
  Applied here, no file on origin/main: 0
```

- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed. The file that uses the new value (the harness, not a migration) would fail while `0085` is pending, but `0086` does not use it, so it dry-runs clean:

```
Environment: test — project qxkmhwybjggxvsfxsxbd
This checkout: 84 applied, 2 pending.
dry-run 0085_public_viewer_role.sql … ok
dry-run 0086_app_access_gate.sql … ok
Dry run only — nothing was applied.
```

- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`:

```
Environment: test — project qxkmhwybjggxvsfxsxbd
This checkout: 84 applied, 2 pending.
applying 0085_public_viewer_role.sql … ok
applying 0086_app_access_gate.sql … ok
```

- [x] File is re-runnable. `0085`: `add value if not exists`. `0086`: the move into `private` is guarded by `to_regclass`, the wrappers and the function use `create or replace`, the policy is `drop … if exists` then `create`, and grants and revokes are idempotent. The harness runs `0086` twice inside its transaction, including once on dev after the apply
- [x] Existing rows still read correctly after the change (checked against real dev data). Harness case B: a throwaway `staff` login reads the same row count before and after, on all 31 objects. Case C: every login reads the 13 public objects exactly as anon does, before and after
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: `node scripts/check-app-access-gate.mjs`. It creates throwaway logins in `auth.users` + `user_roles` (staff, archived staff, never given a role, `public_viewer`) and reads as each of them and as anon, with `set local role` and `request.jwt.claims`. It reads 18 internal objects:
  - the six views
  - `translatable_fields`, `resident_list_view`, `immunization_next_due`, `project_folder_summary`
  - the tables `residents`, `contacts`, `placement_history`, `translations`, `user_roles`, `maintenance`, `assistant_actions`
  - the non-zero rows of `cashflow_forecast`

  It also reads 13 public objects: the `public_*` views, `site_content`, `site_content_photos` and `site_pages`. It asserts:
  - A. Archived, role-less and public_viewer read 0 rows of every internal object after the migration, and anon is refused all of them.
  - B. The staff control is unchanged on every object.
  - C. Everyone reads the public site exactly as anon does.
  - D. public_viewer reads exactly what an archived login reads, on every object.
  - E. Shape: six views in `private`, six gated wrappers, and no `public_*` view reaches the gate.

  Before `0085` was applied (the migration run inside the transaction), with the "before" phase showing what was open:

```
HARNESS-OK 0086_app_access_gate.sql | A: archived, roleless read 0 rows of 18 internal objects after, anon refused all | B: staff control unchanged on every object | C: every login reads the 13 public objects exactly as anon, before and after | D: SKIPPED — public_viewer is not in app_role on dev yet (apply *_public_viewer_role.sql, then rerun) | E: 6 views in private, 6 gated wrappers, no public_* view reaches the gate | file ran twice
  before: current_placement  staff=81 archived=81 roleless=81 public_viewer=n/a
  before: immunization_compliance  staff=220 archived=220 roleless=220 public_viewer=n/a
  before: resident_current_state  staff=81 archived=81 roleless=81 public_viewer=n/a
  before: translatable_fields  staff=12 archived=12 roleless=12 public_viewer=n/a
  before: translation_queue  staff=58 archived=58 roleless=58 public_viewer=n/a
```

  After both files were applied to dev, with public_viewer included:

```
HARNESS-OK 0086_app_access_gate.sql | A: archived, roleless, public_viewer read 0 rows of 18 internal objects after, anon refused all | B: staff control unchanged on every object | C: every login reads the 13 public objects exactly as anon, before and after | D: public_viewer = archived on every object | E: 6 views in private, 6 gated wrappers, no public_* view reaches the gate | file ran twice
```

  Negative control: the same harness with the migration replaced by `select 1;` fails. Output, unedited:

```
FAIL A:archived reads 81 rows of current_placement; A:roleless reads 81 rows of current_placement; A:archived reads 81 rows of resident_current_state; A:roleless reads 81 rows of resident_current_state; A:archived reads 220 rows of immunization_compliance; A:roleless reads 220 rows of immunization_compliance; A:archived reads 58 rows of translation_queue; A:roleless reads 58 rows of translation_queue; A:archived reads 12 rows of translatable_fields; A:roleless reads 12 rows of translatable_fields; E:0 of 6 views in private; E:0 of 6 public wrappers gated;
```

  The lint rule was probed with a scratch file that re-creates `translation_queue` without the gate and `app_users` with it. Only the first was flagged: `0999_lint_probe.sql: re-creates public.translation_queue without the gate (0086)…`, exit 1. The real tree gives `migration grants: ok (9 file(s) checked)`
- [x] Down-migration written, or the reason one is not needed is stated. None written. The enum value cannot be dropped from `app_role` without rebuilding the type, and nothing uses it yet, so it can stay unused. `0086` is reversible: for each view, `drop view public.<name>; alter view private.<name> set schema public;`, re-grant `select` to `authenticated, service_role`, then restore the `auth.uid() is not null` policy. Doing that would reopen Defect #1, so it is not advised
- [x] Production apply plan stated for the release manager: **needs Lutan's go**. From the main checkout, after merge:
  - Run `node scripts/apply-migrations.mjs --env production --status`, then `--dry-run`, then apply, then `node scripts/check-public-views.mjs --env production`.
  - **Both files go together, `0085` then `0086`, in one run.** `0085` alone is worse than neither. It creates the one kind of account that has a role (so it passes `app_users`' "has a role" filter) and signs in past the UAT lock, but reads what `0086` has not yet closed. Admin UI to create one only arrives with the feature half, but if an apply stops between the two files, finish it or roll it back. Do not carry on with one applied and one pending.
  - **Both must be on production before the release that carries #123's sign-in lock is deployed.** (Release manager, 2026-09-25: #123 is merged but not yet in production.)
  - Independent of #123: role-less and archived logins can read these views on production today. That is the signed-in half of the defect class `0081`/`0082` closed for anon.
  - The feature half (`public-viewer-login`) must not deploy to production before both files are applied there.

## 4. Functional checks

- [x] Happy path works end to end: harness cases A–E against real dev rows, and `check-public-views.mjs` on dev after the apply (§6). The app itself was not driven as staff: `next dev` on :3010 redirected to `/login`, and signing in is not Claude's to do. That check is under **Left for manual verification**
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface, and nothing here writes data
- [ ] Create / edit / delete all exercised — n/a: no UI surface, no code reads the new value yet; the six views are read-only
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface; a non-staff session gets an empty result, which is case A
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI surface and no input
- [x] Boundary cases checked. Archived (role row present, `archived_at` set), never given a role (no row), and `public_viewer` (a role that is not on the allow-list) all fall on the closed side. `staff` falls on the open side. Anon is refused by grant before the gate runs. Callers that are not Data API sessions pass: `check-public-views.mjs` and `apply-migrations.mjs` ran as postgres after the apply

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | the six views, `translatable_fields` | unchanged | pass by construction: the allow-list names `admin`. The harness drove `staff` (case B), not admin, and the gate reads only `current_user_role()` |
| management | same | unchanged | pass by construction: on the allow-list, as for admin |
| staff | same | unchanged | pass: harness case B, a throwaway staff login, all 31 objects same count before and after |
| vet | same | unchanged | pass by construction: on the allow-list, as for admin |
| volunteer | same | unchanged | pass by construction: on the allow-list, as for admin |
| signed out | the six views | refused | pass: harness case A (`-1`, permission denied), `check-public-views.mjs` HTTP 401 for each |
| archived / role-less / public_viewer (not app roles, the point of the PR) | the six views, `translatable_fields` | 0 rows | pass: harness cases A and D |

- [ ] Every role above tested — n/a: staff, signed out, archived, role-less and public_viewer were driven. Admin, management, vet and volunteer were not driven. The gate is one `in (...)` over `current_user_role()` that names all five, and nothing else in the migration branches on role
- [x] A role that should not have access is blocked server-side: harness case A reads straight from the database as `authenticated` with each login's JWT `sub`, which is the Data API's path, not the UI's

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface; the feature half adds the Settings → Security note
- [ ] Translatable strings go through the translation path — n/a: no strings. `translation_queue` itself is gated: staff read it unchanged (case B)
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface changed; the staff pages that read the six views are listed under Left for manual verification
- [ ] Network clean — n/a: no UI surface changed; the Data API answers are in §6

## 6. Regression

- [x] The pages nearest the change still work. `node scripts/check-public-views.mjs` against dev after the apply exited 0 with no FAIL lines. Every public view still answers anon, and each of the six moved views is still refused to anon through the Data API. That also shows PostgREST resolves the new `public` wrappers:

```
ok    app_users: anon SELECT is refused — HTTP 401
ok    current_placement: anon SELECT is refused — HTTP 401
ok    immunization_compliance: anon SELECT is refused — HTTP 401
ok    immunization_duplicate_check: anon SELECT is refused — HTTP 401
ok    resident_current_state: anon SELECT is refused — HTTP 401
ok    translation_queue: anon SELECT is refused — HTTP 401
```

- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared source file touched. `check-migration-grants.mjs` runs in `npm run lint`, which passed on the real tree
- [x] Nothing merged from `main` during `sync` was broken by this branch: merged `origin/main` (`Merge made by the 'ort' strategy.`, `docs/backlog.md` only, 13+/2−), so no code changed under the gates

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: there is no backlog item; the request came straight from Lutan and the feature half completes it
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: "2026-09-25 — Public viewer is a role, not an archived row" and "2026-09-25 — Internal views need a staff role, not a session"
- [ ] `README.md` still accurate — n/a: the README does not list roles or the internal views
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: staff read exactly what they did (case B), and nobody can be given the new role until the feature half adds it to the picker
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The row counts (58 / 81 / 220 / 12) come from the harness's "before" phase and its negative control. "Owner-rights, granted to authenticated" comes from `pg_class.reloptions` and `has_table_privilege` on dev. "Every other policy names a role" comes from a `pg_policies` query on dev. "Dependents follow by oid" is case C plus `check-public-views.mjs`. That the enum value cannot share a transaction is recorded in the repo's memory and CLAUDE.md and was not re-tested here. Production was **not** checked

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (no Worker change; the SQL is already on the dev database)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold. The role cutoff is covered on both sides in §4, boundary cases
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The lint probe's message is cut with `…`, and the negative control shows only its `FAIL` line, without the `status 400` / `CONTEXT` wrapper
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: production release manager (case C shows the views behind them unchanged on dev)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No. The feature half reads `public_viewer`, and must not deploy before both files are on production. #123's sign-in lock must not reach production before them either (§3 apply plan)
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager (needs Lutan's go)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no data is rewritten; `0086` moves view definitions between schemas and adds one function and one policy
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy (see §3)

### Rollback

- [x] Rollback position stated, **including what it does not cover**. No Worker change, so `wrangler rollback` does not apply. `0086` can be undone in a new migration (§3, down-migration), which would reopen Defect #1. The `public_viewer` value cannot be removed from `app_role` without rebuilding the type, and it is harmless unused

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | High (pre-existing) | Six owner-rights internal views were readable by any signed-in session regardless of role. On dev, archived and role-less logins read 58 translation_queue rows, 81 placements, 81 resident states and 220 compliance rows; a public viewer would also have read every staff email from `app_users`. Presumably the same on production for any archived or role-less login (not measured) | fixed by `0086` |
| 2 | Low (pre-existing) | `translatable_fields` readable by any signed-in session | fixed by `0086` |
| 3 | Low (pre-existing) | `resident_is_deceased` and `attachment_resident_id` (security definer) answer a boolean or an id for any row id to any signed-in session | accepted: ids are not guessable, the lock triggers call them, and `0082` kept them callable (decisions.md) |

## Left for manual verification

Harness case B shows staff reading every object unchanged at the database. What no script covers is the app reading the new `public` views through PostgREST as a signed-in staff member.

| # | What to check | Where |
|---|---|---|
| 1 | A resident page shows its status and the missing-immunisations list (`resident_current_state`, `immunization_compliance`) | `http://localhost:3010/residents/<id>`, or test.lannacare.org, signed in as admin |
| 2 | The translations queue lists its rows with record labels (`translation_queue`) | `/management/translations` |
| 3 | A maintenance job's assignee picker lists staff names (`app_users`) | `/maintenance/<id>` edit |
| 4 | Management dashboard counts by status (`resident_current_state`) | `/management/dashboard` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-09-25

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — four items above await Lutan

Manual verification by: pending: the four staff page checks above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR — summarised in the PR description, with a pointer to this file
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: pending  Date: —

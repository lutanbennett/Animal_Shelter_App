# Feature test plan

## Header

| | |
|---|---|
| Feature | `0077_data_api_grants.sql` + `scripts/check-migration-grants.mjs`: write down the Data API grants before Supabase stops adding them automatically (2026-10-30) |
| Backlog item | `docs/backlog.md` → none: the brief came straight from Supabase's email of 2026-09-24, so there is no item to tick |
| Branch / worktree | `claude/data-api-grants-schema` @ `C:\Development\Animal_Shelter_data-api-grants-schema` |
| Dev server | not started: this change ships no runtime code |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude (automated) / 2026-09-24 |
| Carries a migration? | yes: `0077_data_api_grants.sql` |
| Tested at SHA | `1ceb157` (branch on `main` @ `2b706f5`); this plan is the only change after it |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: one idempotent migration grants every existing table, view and sequence to the Data API roles the app actually uses, so a from-scratch rebuild works once Supabase stops adding grants, and `npm run lint` now fails any later migration that creates one of those objects without a grant. This matches the brief's deliverables 1–4
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0077_data_api_grants.sql`; `scripts/check-migration-grants.mjs` (new); `package.json` (`lint` script); `docs/decisions.md`; `README.md` (one paragraph under the migrations step); this plan. No `src/`, no `worker/`, no workflow change
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public. At the database level: `authenticated` and `service_role` get `select, insert, update, delete` on all 35 tables, `select` on all 18 views and `usage, select` on the 2 sequences. `anon` gets `select` on the 9 `public_*` views and on `site_content`, `site_content_photos` and `site_pages`, the three base tables with a `public_read_*` policy that the public site reads directly. On dev and production today every line is a no-op, because the old defaults already granted all of this and more
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: revoking anything, including the anon read on four internal views found during inspection (recorded in `docs/decisions.md` and raised as a backlog item on the `backlog` branch); function `EXECUTE` grants; the production apply (release manager, with the release)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: "Already up to date"
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

  ```
  === gates: typecheck exited 0 after 31s
  migration grants: ok (0 file(s) checked)
  === gates: lint exited 0 after 75s
  === gates: build exited 0 after 144s
  gates: typecheck=0 lint=0 build=0
  ```

  (`0 file(s) checked` is correct: nothing above 0077 exists yet.)
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `origin/main` tops out at `0076_shelter_friends.sql`; `gh pr list --state open` returned `[]`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `78 applied, 1 pending. pending: 0077_data_api_grants.sql`. Dev's grants were also read beforehand from `information_schema.role_table_grants` / `pg_class.relacl` / `pg_default_acl`, so the migration mirrors what exists rather than widening it
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0077_data_api_grants.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0077_data_api_grants.sql … ok`; `--status` afterwards shows `79 applied, 0 pending.`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): only `grant` statements, which are idempotent. It ran in the dry run, in the harness and in the real apply, all on a database that already held every grant
- [x] Existing rows still read correctly after the change (checked against real dev data): `node scripts/check-public-views.mjs` after the apply reports `ok` for every public view (anon SELECT `HTTP 200`, PATCH/DELETE refused) and `shelter_friends: anon SELECT is refused — HTTP 401`. An anon REST probe of `site_content`, `site_content_photos` and `site_pages` still returns rows, and `app_users` still returns `401`
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness. It runs through the Management API on dev and simulates the post-2026-10-30 rebuild. It revokes **every** privilege that `anon`, `authenticated` and `service_role` hold on every public table, view and sequence (except `schema_migrations`), runs the full text of 0077, and then asserts in a `do $$ … $$` block, for every table and view, that: `authenticated` and `service_role` have SELECT; `authenticated` has INSERT, UPDATE and DELETE on every table; `anon` has no INSERT, UPDATE or DELETE anywhere; and `anon` has SELECT **exactly** on the `public_*` views and the three `public_read_*` tables, no more and no fewer. For every sequence, it asserts that `authenticated` has USAGE. Output, unedited:

  ```
  project qxkmhwybjggxvsfxsxbd
  harness passed
  ```

  Afterwards, `has_table_privilege('anon','public.residents','DELETE')` returned `true`, which shows the rollback left dev's existing (over-broad) grants untouched. **Negative control:** the same harness with `zones` removed from 0077's table list failed with `ERROR:  P0001: grant gaps: auth-select:zones svc-select:zones auth-dml:zones`
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: every grant in it already existed on dev and production before it ran, so there is nothing to undo; revoking them would break the app
- [x] Production apply plan stated for the release manager (which file, which project, when): `0077_data_api_grants.sql` to production `dbkodyyxxhtygxcxmfcu`, by the release manager with the next release, and in any case **before 2026-10-30**. Run `node scripts/apply-migrations.mjs --env production --dry-run`, then run it without the flag. It is a no-op there today, so its order relative to a deploy does not matter

## 4. Functional checks

- [x] Happy path works end to end: the harness is the path this change exists for, a database with no default grants rebuilt through 0077. On top of that, `check-migration-grants.mjs` was run by `npm run lint` with a deliberately bad `supabase/migrations/0078_bad_sample.sql` in place (a table with a `bigserial` id, a view and a sequence, where only the view is granted, alongside a commented-out `create table`, a temp table, a table in another schema and a `create table` inside a `DO` body). `npm run lint` exited `1`, naming exactly the three ungranted objects:

  ```
  0078_bad_sample.sql: table widgets is created without a grant — add `grant select, … on widgets to authenticated, service_role;` (and anon only if it is deliberately public).
  0078_bad_sample.sql: serial column's sequence widgets_id_seq is created without a grant — add `grant usage, select on sequence widgets_id_seq to authenticated, service_role;` (and anon only if it is deliberately public).
  0078_bad_sample.sql: sequence widget_code_seq is created without a grant — add `grant usage, select on sequence widget_code_seq to authenticated, service_role;` (and anon only if it is deliberately public).

  migration grants: 3 object(s) without Data API grants. Supabase no longer adds them automatically (docs/decisions.md, 2026-09-24).
  ```

  The same file with the grants added printed `migration grants: ok (1 file(s) checked)` and exited `0`. The sample was then deleted
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface; the apply is recorded in `schema_migrations` (`79 applied`)
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface; the harness asserts INSERT/UPDATE/DELETE privileges for `authenticated` on every table
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface; for the checker, "no migrations above 0077" is the empty state and it passes (`0 file(s) checked`)
- [x] Invalid input is rejected with a readable message, not a crash: each failing object gets one line naming the file and the object, with the exact `grant` to add
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): the numbering boundary was checked by running the checker on history. Files ≤ 0077 are skipped by default, and passing 0033, 0056 and 0076 explicitly flags the objects they left to the defaults (`maintenance_job_number_seq`, `translatable_fields`, `translations`, `project_folder_summary`, `shelter_friends`), while 0077 itself passes. In the bad sample, comments, temp tables, other schemas and dollar-quoted bodies are all ignored

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no route; `authenticated` privileges asserted by the harness, RLS unchanged | — | — |
| management | n/a: no route; as admin | — | — |
| staff | n/a: no route; as admin | — | — |
| vet | n/a: no route; as admin | — | — |
| volunteer | n/a: no route; as admin | — | — |
| signed out | `public_*` views, `site_content`, `site_content_photos`, `site_pages` (after a rebuild through 0077) | select on exactly those, no DML anywhere | pass: harness `anon` assertions; REST probe after the apply returns rows from all three base tables and `401` on `app_users` |

- [ ] Every role above tested — n/a: grants are per database role, not per app role. Every signed-in app role is the `authenticated` database role, and the harness covers it. Which rows each app role sees is RLS, and this PR does not touch it
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): in the harness, `anon` holds no INSERT, UPDATE or DELETE and no SELECT outside the public set. On dev over REST, `app_users` → `HTTP 401` and `shelter_friends` → `HTTP 401`

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no UI change
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): no page loaded, since grants were only added to objects that already had them. The public reads were checked where they happen: `check-public-views.mjs` passes on all nine public views, and the anon REST probe reads the three `site_*` tables the home page and footer use
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched. `package.json`'s `lint` script is the only shared change, and `gates.mjs` ran it green
- [x] Nothing merged from `main` during `sync` was broken by this branch: sync brought nothing in, and the build is green on this tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: no backlog item exists; the brief came straight from Supabase's email. The follow-up (revoking the anon view reads) went on the `backlog` branch
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: the grant rule and its defaults, why the check lives in `lint`, functions out of scope, and the anon exposure found and deliberately not changed
- [x] `README.md` still accurate: one paragraph added under "apply migrations" stating the rule and the check
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: database grants that are a no-op on every existing database, and a lint check; nobody using the shelter app would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned:** "no-op today" and the grant set come from the pre-apply grant queries and the harness. The anon exposure comes from a REST probe with the anon key on dev (`current_placement`, `resident_current_state`, `immunization_compliance` returned rows; `immunization_duplicate_check` returned `200` with no rows). Production was **not** checked, and decisions.md says so

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (nothing to deploy: SQL and a lint script, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or band, apart from the 0077 numbering cut-off, which §4 checked from both sides
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no grant a public page relies on changed (all were already held); checked at the REST level in §6

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No. No app code changes, so ordering against a deploy does not matter; the only deadline is 2026-10-30
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: grants only, nothing rewritten
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy (see §3)

### Rollback

- [x] Rollback position stated, **including what it does not cover**: no Worker change, so `wrangler rollback` does not apply. The grants are safe to leave in place and must not be revoked, because the app depends on them. The lint check can be backed out by restoring `"lint": "eslint"`

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | High (pre-existing, not introduced here) | With only the public anon key, `current_placement`, `resident_current_state`, `immunization_compliance` and `immunization_duplicate_check` can be read on dev: owner-rights views that bypass RLS, left readable by the old default grants. They expose resident names and status, placement notes and carer ids. Production not checked | deferred to backlog: revoking needs Lutan's go (brief: "do not revoke in this PR without asking"). 0077 does not grant these views to anon, so a rebuilt database would not have the gap |

## Left for manual verification

Empty: no UI surface. The only behaviour is database grants and a lint script, both exercised by scripts above.

| # | What to check | Where |
|---|---|---|
| — | — | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-24

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: the manual list is empty — grants-only schema change and a lint check, verified by the rollback harness, check-public-views and the lint run on a bad sample

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this plan and quotes the key evidence rather than duplicating it
- [x] Handed to the production release manager: the PR states the production apply, before 2026-10-30

Result: pass with accepted defects

Release manager acknowledgement: n/a: schema PR; acknowledged at release time

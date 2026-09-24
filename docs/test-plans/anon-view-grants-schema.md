# Test plan — anon-view-grants-schema

## Header

| | |
|---|---|
| Feature | Anon keeps only what the public site reads: `0081_anon_view_grants.sql` revokes everything `anon` holds in `public` and grants back SELECT on the public objects; `check-public-views.mjs` now fails if anon can read anything else |
| Backlog item | `docs/backlog.md` → Architecture → "Anon can read four internal views that bypass RLS. Revoke it." |
| Branch / worktree | `claude/anon-view-grants-schema` @ `C:\Development\Animal_Shelter_anon-view-grants-schema` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` |
| PR | opened from this branch (number in the PR itself) |
| Tested by / date | Claude, 2026-09-24/25 |
| Carries a migration? | yes — `0081_anon_view_grants.sql` |
| Tested at SHA | `bd5e6a0` (the change) merged with `origin/main` @ `d4f11e7` as `d575d65` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: anon loses every privilege in `public` except SELECT on the ten `public_*` views and `site_content` / `site_content_photos` / `site_pages`. That closes the four views the item names and the DML/TRUNCATE on every base table it asks about, and the check script asserts anon is refused on every non-public object
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0081_anon_view_grants.sql`; `scripts/check-public-views.mjs`; `README.md` (the go-live check paragraph); `docs/decisions.md`; `docs/backlog.md` (item ticked); this plan. No `src/`, no `worker/`
- [x] Roles affected identified: signed-out public only. `authenticated` and `service_role` grants are untouched (measured below: 54/54 objects still SELECT-able by both)
- [x] Anything explicitly **out of scope** written down: `security_invoker` on the four views (it changes signed-in behaviour and is not needed to close the anon hole) and function EXECUTE (the public views and photo proxy call functions as anon; `approved_translations` answering anon is a new backlog item). Both are in `docs/decisions.md`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (brought in #109, the 0.3.0 release cut; no migrations)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: typecheck exited 0 after 15s
=== gates: lint exited 0 after 76s
=== gates: build exited 0 after 297s
gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR: #110, run 36035998533 — `check` pass (1m33s), `test-plan` pass (8s)

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `origin/main` tops out at `0080_social_urls.sql`; the only other open PR (#109) carried none and has since merged, still without one
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `82 applied, 1 pending`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed:

```
Environment: test — project qxkmhwybjggxvsfxsxbd (https://qxkmhwybjggxvsfxsxbd.supabase.co)
82 applied, 1 pending.
dry-run 0081_anon_view_grants.sql … ok
Dry run only — nothing was applied.
```

- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`:

```
Environment: test — project qxkmhwybjggxvsfxsxbd (https://qxkmhwybjggxvsfxsxbd.supabase.co)
82 applied, 1 pending.
applying 0081_anon_view_grants.sql … ok
```

- [x] File is re-runnable: `revoke`, `grant` and `alter default privileges` are all idempotent, and there is no DDL that can collide
- [x] Existing rows still read correctly after the change (checked against real dev data): every public page loaded signed out with its data (§6), the public views and `site_*` tables answer anon `200`, and `authenticated` / `service_role` still hold SELECT on all 54 objects: `[{"total":54,"auth_select":54,"service_select":54}]`
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness. The harness ran the whole of `0081`, then `set local role anon` and `select count(*)` from every table and view in `public`, raising if an object off the allow-list was readable or one on it was refused. It then asserted that `has_table_privilege('anon', …, 'insert,update,delete,truncate,references,trigger')` is false for every table, view and sequence. With `0081`: `HARNESS PASSED: 13 allowed readable, 42 refused`. With the migration text removed, the same harness gave `anon READ assistant_actions (0 rows)`, so it does detect the gap. Separately, a `create table` in a rolled-back transaction after the apply showed the new default privileges: `[{"anon_sel":false,"auth_sel":true}]`
- [x] Down-migration written, or the reason one is not needed is stated: none. It is grants only, with no data touched. Re-granting is the inverse if ever needed, and nothing in the app reads a revoked object as anon (§6)
- [x] Production apply plan stated for the release manager: **needs Lutan's go.** Production `dbkodyyxxhtygxcxmfcu` sits at `0077`, so `0078`, `0079`, `0080` and `0081` go together, in order, from the main checkout: `node scripts/apply-migrations.mjs --env production --dry-run`, then without `--dry-run`, then `node scripts/check-public-views.mjs --env production`. The check needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.deploy.production`, which `deploy.mjs` already uses. This is independent of any deploy: no code reads a revoked object as anon, so it can go before or after one. Production was never probed from a session, so the exposure there is presumed, not measured. The check run is what will show it

## 4. Functional checks

**The four views, as anon, before `0081`** (REST, anon key only):

```
GET current_placement?select=*&limit=1 -> HTTP 206 content-range=0-0/81
  [{"id":"fd6f67cf-ec23-5604-a2ef-16aac9c3e61a","resident_id":"011b4df8-02e4-52e8-ad08-1d3ed3965dba","placement_type":"Intake","start_date":"2023-12-31T17:00:00+00:00","end_date":null,"zone_id":"6ce66b61-8230-4f2d-a4f5-de24223362dd","enclosure_id":"3256d8be-8b00-4a05-aae3-daba94bd48cc","previous_enclosure_id":null,"carer_id":null,"notes":"Intake Record","created_by":"11123d9a-c10f-455f-99cf-f41e451c
GET resident_current_state?select=*&limit=1 -> HTTP 206 content-range=0-0/81
  [{"resident_id":"011b4df8-02e4-52e8-ad08-1d3ed3965dba","name":"Grace","current_placement_id":"fd6f67cf-ec23-5604-a2ef-16aac9c3e61a","current_enclosure_id":"3256d8be-8b00-4a05-aae3-daba94bd48cc","current_zone_id":"6ce66b61-8230-4f2d-a4f5-de24223362dd","current_carer_id":null,"active_hospital_previous_enclosure":null,"current_status":"Unassigned","is_deceased":false,"date_of_death":null}]
GET immunization_compliance?select=*&limit=1 -> HTTP 206 content-range=0-0/220
  [{"resident_id":"011b4df8-02e4-52e8-ad08-1d3ed3965dba","resident_name":"Grace","immunization_type_id":"7b3efa1a-c0aa-49da-be55-4c245406d9e0","immunization_type_name":"Rabies"}]
GET immunization_duplicate_check?select=*&limit=1 -> HTTP 200 content-range=*/0
  []
```

(the probe script truncates each body at 400 characters.)

**After `0081`:**

```
GET current_placement?select=*&limit=1 -> HTTP 401 content-range=null
  {"code":"42501","details":null,"hint":null,"message":"permission denied for view current_placement"}
GET resident_current_state?select=*&limit=1 -> HTTP 401 content-range=null
  {"code":"42501","details":null,"hint":null,"message":"permission denied for view resident_current_state"}
GET immunization_compliance?select=*&limit=1 -> HTTP 401 content-range=null
  {"code":"42501","details":null,"hint":null,"message":"permission denied for view immunization_compliance"}
GET immunization_duplicate_check?select=*&limit=1 -> HTTP 401 content-range=null
  {"code":"42501","details":null,"hint":null,"message":"permission denied for view immunization_duplicate_check"}
```

**Anon privileges from the catalogue.** Before: `"anon_truncate_objects":42`. After (the default-ACL column is left out here; decisions.md describes it):

```
"anon_write_or_truncate":0,"anon_sequences":0,"anon_select":"public_enclosures,public_project_photos,public_projects,public_recent_adoptions,public_resident_cards,public_resident_photos,public_resident_profiles,public_shelter_friends,public_shelter_stats,public_site_pages,site_content,site_content_photos,site_pages"
```

**TRUNCATE through PostgREST, proved rather than reasoned:** PostgREST has no request that issues TRUNCATE (DELETE maps to `DELETE`), so the only route would be an RPC. The catalogue query for any `public` function whose body mentions it returned `"functions_mentioning_truncate":null`. So there was no route, and after `0081` anon holds TRUNCATE on nothing (`anon_write_or_truncate: 0`).

- [x] Happy path works end to end: the four views refuse anon (above) and every public surface still reads (§6)
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written; the grants persist in the catalogue and were re-read after the apply (above)
- [ ] Create / edit / delete all exercised — n/a: no create/edit/delete surface; anon PATCH/DELETE refusal is exercised by `check-public-views.mjs`
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input; a refused read is PostgREST's `42501` JSON, shown above
- [x] Boundary cases checked: both sides of the allow-list. In the harness every allowed object reads (13) and every other object is refused (42). `check-public-views.mjs` covers the same at the REST level, including two `public_*` edge cases: `public_shelter_stats` (previously unchecked, now listed) and a future unlisted `public_*` view, which fails with a hint to add it

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | all 54 objects via `authenticated` | unchanged | pass: `auth_select` 54/54 after apply; `0081` names no role but `anon` |
| management | same | unchanged | pass: same grant check (RLS decides per role, and no policy changed) |
| staff | same | unchanged | pass: same |
| vet | same | unchanged | pass: same |
| volunteer | same | unchanged | pass: same |
| signed out | 10 `public_*` views + 3 `site_*` tables, SELECT only | everything else `401`, no writes | pass: `check-public-views.mjs` 81 ok / 0 FAIL; harness 13 readable / 42 refused |

- [ ] Every role above tested — n/a: signed-in roles were checked at the grant level, not by signing in as each; `0081` does not name `authenticated` and no policy changed, so a per-role sign-in would exercise nothing this PR altered
- [x] A role that should not have access is blocked server-side: anon hitting each internal view's URL directly gets `401 permission denied`

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no user-facing behaviour
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: the pages were fetched from the shell with no cookies, so no browser was involved; the dev server's error log was empty (`No server errors found.`)
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages: every public page `200` (§6); the only 401s are the intended refusals

## 6. Regression

- [x] The pages nearest the change still work. Every anon surface was fetched signed out (curl, no cookies) from `next dev` on dev data after the apply:

```
/ -> 200 | h1: Welcome to Lanna Care for Animals | error-text matches: 0
/adopt -> 200 | h1: Meet Our Residents | error-text matches: 0
/adopt/e07ad9e2-4e55-51aa-af5c-7b3a511dd89f -> 200 | h1: Markey | error-text matches: 0
/our-work -> 200 | h1: Our work | error-text matches: 0
/our-work/0be6e079-d34d-4701-98d9-11bd546f6cc4 -> 200 | h1: Rescues from Wat on 20 Sep 2026 | error-text matches: 0
/foster -> 200 | h1: Foster with us | error-text matches: 0
/volunteer -> 200 | h1: Volunteer with us | error-text matches: 0
/donate -> 200 | h1: Donate | error-text matches: 0
/friends -> 200 | h1: Shelter Friends | error-text matches: 0
/privacy -> 200 | h1: Privacy notice | error-text matches: 0
/r/R-0014 -> 200 | h1: Grace | error-text matches: 0
/e/4931cad3-a677-55a8-a501-f3e845c33b74 -> 200 | h1: Front Zone 1 | error-text matches: 0
```

  "error-text matches" counts `permission denied|42501|Application error` in the HTML. The photo proxy calls `is_known_drive_file` as anon, and returned `photo proxy: 200 image/jpeg` for a resident's profile photo
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared source file touched; `check-public-views.mjs` is a standalone script
- [x] Nothing merged from `main` during `sync` was broken by this branch: sync brought #109 (release notes, a test plan, the `package.json` version), and the gates pass on the merge

### `check-public-views.mjs` against dev

Before `0081` it exited 1 with 38 ok and 43 FAIL. The FAIL lines (`grep ^FAIL`):

```
FAIL  site_content_photos: anon PATCH is refused — HTTP 204
FAIL  site_content_photos: anon DELETE is refused — HTTP 204
FAIL  site_pages: anon PATCH is refused — HTTP 204
FAIL  site_pages: anon DELETE is refused — HTTP 204
FAIL  assistant_actions: anon SELECT is refused — HTTP 200
FAIL  attachments: anon SELECT is refused — HTTP 200
FAIL  blood_test_types: anon SELECT is refused — HTTP 200
FAIL  blood_tests: anon SELECT is refused — HTTP 200
FAIL  bulk_appointments: anon SELECT is refused — HTTP 200
FAIL  contacts: anon SELECT is refused — HTTP 200
FAIL  current_placement: anon SELECT is refused — HTTP 200
FAIL  diet_types: anon SELECT is refused — HTTP 200
FAIL  enclosures: anon SELECT is refused — HTTP 200
FAIL  frequency: anon SELECT is refused — HTTP 200
FAIL  group_origins: anon SELECT is refused — HTTP 200
FAIL  immunization_compliance: anon SELECT is refused — HTTP 200
FAIL  immunization_duplicate_check: anon SELECT is refused — HTTP 200
FAIL  immunization_next_due: anon SELECT is refused — HTTP 200
FAIL  immunization_records: anon SELECT is refused — HTTP 200
FAIL  immunization_types: anon SELECT is refused — HTTP 200
FAIL  maintenance: anon SELECT is refused — HTTP 200
FAIL  maintenance_assignees: anon SELECT is refused — HTTP 200
FAIL  maintenance_photos: anon SELECT is refused — HTTP 200
FAIL  medication: anon SELECT is refused — HTTP 200
FAIL  placement_history: anon SELECT is refused — HTTP 200
FAIL  prescriptions: anon SELECT is refused — HTTP 200
FAIL  procedure_types: anon SELECT is refused — HTTP 200
FAIL  procedures: anon SELECT is refused — HTTP 200
FAIL  project_folder_summary: anon SELECT is refused — HTTP 200
FAIL  project_folders: anon SELECT is refused — HTTP 200
FAIL  project_photos: anon SELECT is refused — HTTP 200
FAIL  resident_current_state: anon SELECT is refused — HTTP 200
FAIL  resident_diets: anon SELECT is refused — HTTP 200
FAIL  resident_list_view: anon SELECT is refused — HTTP 200
FAIL  residents: anon SELECT is refused — HTTP 200
FAIL  schema_migrations: anon SELECT is refused — HTTP 200
FAIL  translatable_fields: anon SELECT is refused — HTTP 200
FAIL  translations: anon SELECT is refused — HTTP 200
FAIL  user_roles: anon SELECT is refused — HTTP 200
FAIL  vet_appointments: anon SELECT is refused — HTTP 200
FAIL  vets: anon SELECT is refused — HTTP 200
FAIL  weight: anon SELECT is refused — HTTP 200
FAIL  zones: anon SELECT is refused — HTTP 200
```

The first four matter: anon PATCH/DELETE on `site_content_photos` and `site_pages` answered `204` (grant held, RLS matched no rows), and the old script never tried them. After `0081` it exits 0 with 81 ok and 0 FAIL, unedited:

```
ok    public_resident_profiles: anon can SELECT — HTTP 200
ok    public_resident_profiles: anon PATCH is refused — HTTP 401
ok    public_resident_profiles: anon DELETE is refused — HTTP 401
ok    public_resident_photos: anon can SELECT — HTTP 200
ok    public_resident_photos: anon PATCH is refused — HTTP 500
ok    public_resident_photos: anon DELETE is refused — HTTP 500
ok    public_projects: anon can SELECT — HTTP 200
ok    public_projects: anon PATCH is refused — HTTP 401
ok    public_projects: anon DELETE is refused — HTTP 401
ok    public_project_photos: anon can SELECT — HTTP 200
ok    public_project_photos: anon PATCH is refused — HTTP 500
ok    public_project_photos: anon DELETE is refused — HTTP 500
ok    public_site_pages: anon can SELECT — HTTP 200
ok    public_site_pages: anon PATCH is refused — HTTP 401
ok    public_site_pages: anon DELETE is refused — HTTP 401
ok    public_recent_adoptions: anon can SELECT — HTTP 200
ok    public_recent_adoptions: anon PATCH is refused — HTTP 500
ok    public_recent_adoptions: anon DELETE is refused — HTTP 500
ok    public_resident_cards: anon can SELECT — HTTP 200
ok    public_resident_cards: anon PATCH is refused — HTTP 500
ok    public_resident_cards: anon DELETE is refused — HTTP 500
ok    public_shelter_friends: anon can SELECT — HTTP 200
ok    public_shelter_friends: anon PATCH is refused — HTTP 500
ok    public_shelter_friends: anon DELETE is refused — HTTP 500
ok    public_enclosures: anon can SELECT — HTTP 200
ok    public_enclosures: anon PATCH is refused — HTTP 500
ok    public_enclosures: anon DELETE is refused — HTTP 500
ok    public_shelter_stats: anon can SELECT — HTTP 200
ok    public_shelter_stats: anon PATCH is refused — HTTP 400
ok    public_shelter_stats: anon DELETE is refused — HTTP 400
ok    site_content: anon can SELECT — HTTP 200
ok    site_content: anon PATCH is refused — HTTP 400
ok    site_content: anon DELETE is refused — HTTP 400
ok    site_content_photos: anon can SELECT — HTTP 200
ok    site_content_photos: anon PATCH is refused — HTTP 401
ok    site_content_photos: anon DELETE is refused — HTTP 401
ok    site_pages: anon can SELECT — HTTP 200
ok    site_pages: anon PATCH is refused — HTTP 401
ok    site_pages: anon DELETE is refused — HTTP 401
ok    app_users: anon SELECT is refused — HTTP 401
ok    assistant_actions: anon SELECT is refused — HTTP 401
ok    attachments: anon SELECT is refused — HTTP 401
ok    blood_test_types: anon SELECT is refused — HTTP 401
ok    blood_tests: anon SELECT is refused — HTTP 401
ok    bulk_appointments: anon SELECT is refused — HTTP 401
ok    contacts: anon SELECT is refused — HTTP 401
ok    current_placement: anon SELECT is refused — HTTP 401
ok    diet_types: anon SELECT is refused — HTTP 401
ok    enclosures: anon SELECT is refused — HTTP 401
ok    frequency: anon SELECT is refused — HTTP 401
ok    group_origins: anon SELECT is refused — HTTP 401
ok    immunization_compliance: anon SELECT is refused — HTTP 401
ok    immunization_duplicate_check: anon SELECT is refused — HTTP 401
ok    immunization_next_due: anon SELECT is refused — HTTP 401
ok    immunization_records: anon SELECT is refused — HTTP 401
ok    immunization_types: anon SELECT is refused — HTTP 401
ok    maintenance: anon SELECT is refused — HTTP 401
ok    maintenance_assignees: anon SELECT is refused — HTTP 401
ok    maintenance_photos: anon SELECT is refused — HTTP 401
ok    medication: anon SELECT is refused — HTTP 401
ok    placement_history: anon SELECT is refused — HTTP 401
ok    prescriptions: anon SELECT is refused — HTTP 401
ok    procedure_types: anon SELECT is refused — HTTP 401
ok    procedures: anon SELECT is refused — HTTP 401
ok    project_folder_summary: anon SELECT is refused — HTTP 401
ok    project_folders: anon SELECT is refused — HTTP 401
ok    project_photos: anon SELECT is refused — HTTP 401
ok    resident_current_state: anon SELECT is refused — HTTP 401
ok    resident_diets: anon SELECT is refused — HTTP 401
ok    resident_list_view: anon SELECT is refused — HTTP 401
ok    residents: anon SELECT is refused — HTTP 401
ok    schema_migrations: anon SELECT is refused — HTTP 401
ok    shelter_friends: anon SELECT is refused — HTTP 401
ok    translatable_fields: anon SELECT is refused — HTTP 401
ok    translation_queue: anon SELECT is refused — HTTP 401
ok    translations: anon SELECT is refused — HTTP 401
ok    user_roles: anon SELECT is refused — HTTP 401
ok    vet_appointments: anon SELECT is refused — HTTP 401
ok    vets: anon SELECT is refused — HTTP 401
ok    weight: anon SELECT is refused — HTTP 401
ok    zones: anon SELECT is refused — HTTP 401

Project: qxkmhwybjggxvsfxsxbd.supabase.co
```

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** and moved to Completed → Architecture. The follow-up (anon can call unchecked `security definer` read helpers such as `approved_translations`) went on the `backlog` branch
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: "Anon loses the internal views, by allow-list (2026-09-25)". It covers what was exposed, why the default privileges did it, why an allow-list, TRUNCATE, what is deliberately unchanged and what the check now prevents
- [x] `README.md` still accurate: the go-live check paragraph now says anon must be refused on everything else and that the check needs `SUPABASE_SERVICE_ROLE_KEY`
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: a closed data leak that no shelter user could see; the public pages look and behave exactly as before, and signed-in access is untouched
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned:** row counts and responses come from the anon REST probe; grants and default privileges from catalogue queries before and after; the TRUNCATE claim from the function-body query plus the privilege count; "a new table gets no anon grant" from a rolled-back `create table`; `approved_translations` answering anon from an anon RPC call. Production was **not** checked, and decisions.md and the PR say so

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (nothing to deploy: SQL and a script, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold; both sides of the allow-list are covered in §4
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The one abbreviation is the catalogue row in §4, with the column left out named there
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: production release manager (checked on `next dev`, which has no edge cache; the deployed check goes with the production apply)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added; the check script reads the existing `SUPABASE_SERVICE_ROLE_KEY` locally

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No. There are no app code changes, so ordering against a deploy does not matter
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production is his go; this worktree has no production credentials)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: grants only, no data rewritten
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy (see §3)

### Rollback

- [x] Rollback position stated, **including what it does not cover**: there is no Worker change, so `wrangler rollback` does not apply. If a public page turns out to need an object anon lost, the fix is one `grant select on <object> to anon;` in a new migration, and the object then goes on `check-public-views.mjs`'s public list

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | High (pre-existing) | Anon could read `current_placement`, `resident_current_state`, `immunization_compliance` and `immunization_duplicate_check`, and held full DML + TRUNCATE on every object in `public` | fixed on dev by `0081`; production awaits Lutan's go |
| 2 | Low (pre-existing) | Anon PATCH/DELETE on `site_content_photos` and `site_pages` answered `204`: the grant was held and RLS matched nothing | fixed by `0081` (now `401`), and now checked by the script |
| 3 | Medium (pre-existing, out of scope) | Anon can call `approved_translations` for any row id and get its approved translations, internal fields included. Other `security definer` read helpers answer anon too | deferred to backlog (new Architecture item): not a plain revoke, since the public views and photo proxy call helpers as anon |

## Left for manual verification

Empty: there is no UI surface. The public pages were fetched signed out and their headings checked, and the behaviour is grants, exercised by the harness and the check script.

| # | What to check | Where |
|---|---|---|
| — | — | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-25

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: the manual list is empty — grants-only schema change, verified by the rollback harness, anon REST probes, check-public-views and signed-out fetches of every public page

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this plan and quotes the key evidence rather than duplicating it
- [x] Handed to the production release manager: the PR flags the production apply as Lutan's decision

Result: pass with accepted defects

Release manager acknowledgement: n/a: schema PR; acknowledged at release time

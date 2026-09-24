# Test plan — anon-function-execute-schema

## Header

| | |
|---|---|
| Feature | Anon keeps only the functions the public site calls: `0082_anon_function_execute.sql` makes four `security definer` role guards null-safe, moves `approved_translations` out of the Data API into `private`, revokes EXECUTE from PUBLIC and anon on every function in `public` and grants five back; `check-public-views.mjs` now calls every RPC as anon |
| Backlog item | `docs/backlog.md` → Architecture → "Security-definer read helpers answer anon for any row: review function EXECUTE." |
| Branch / worktree | `claude/anon-function-execute-schema` @ `C:\Development\Animal_Shelter_anon-function-execute-schema` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3014` |
| PR | opened from this branch (number in the PR itself) |
| Tested by / date | Claude, 2026-09-25 |
| Carries a migration? | yes — `0082_anon_function_execute.sql` |
| Tested at SHA | `eef907c` (the change; `sync` found `origin/main` @ `bdc94be` already merged) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: anon can execute only `current_user_role`, `is_known_drive_file`, `shelter_date`, `shelter_today` and `shelter_time_zone`. `approved_translations` is no longer reachable through the API, and the role guards no longer let a NULL role through. The item asked for the first two. The third was found while reproducing and is the more serious hole (§4, defect 1)
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0082_anon_function_execute.sql`; `scripts/check-public-views.mjs`; `README.md` (go-live check paragraph); `docs/decisions.md`; `docs/backlog.md` (item ticked, and the misplaced `0081` item moved from the top of the file into Completed → Architecture); this plan. No `src/`, no `worker/`
- [x] Roles affected identified: signed-out public loses every RPC except five. A signed-in user **with no role** (or an archived one) is now refused by the four rewritten functions; before, they got through. Admin, management, staff, vet and volunteer are unchanged (§4 matrix)
- [x] Anything explicitly **out of scope** written down: the photo proxy serving any *known* Drive file, internal attachments included, to a signed-out visitor who has its id, with an edge cache keyed by URL alone. This went to the `backlog` branch as a new Architecture item. `is_known_drive_file` itself stays anon-callable, and decisions.md says why

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: `Already up to date.`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: typecheck exited 0 after 124s
=== gates: lint exited 0 after 144s
=== gates: build exited 0 after 230s
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `origin/main` tops out at `0081_anon_view_grants.sql`; `gh pr list --state open` returned `[]`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `83 applied, 1 pending.` / `pending: 0082_anon_function_execute.sql`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed:

```
Environment: test — project qxkmhwybjggxvsfxsxbd (https://qxkmhwybjggxvsfxsxbd.supabase.co)
83 applied, 1 pending.
dry-run 0082_anon_function_execute.sql … ok
Dry run only — nothing was applied.
```

- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`:

```
Environment: test — project qxkmhwybjggxvsfxsxbd (https://qxkmhwybjggxvsfxsxbd.supabase.co)
83 applied, 1 pending.
applying 0082_anon_function_execute.sql … ok
```

- [x] File is re-runnable: `drop function if exists`, `create or replace function`, `create schema if not exists`; the `set schema` move is guarded by `to_regprocedure('public.approved_translations(text, uuid)')`; grants, revokes and default privileges are idempotent
- [x] Existing rows still read correctly after the change (checked against real dev data): all ten `public_*` views and three `site_*` tables answer anon `200`, and `public_resident_profiles` still carries Panda's approved Thai bio through the moved function, both as anon and as staff (§4). The page shows it signed out with the language set to ไทย (§6)
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness. Before `0082`, as anon: `delete_resident_photo` deleted a real public photo, and `record_attachment` attached a fake Drive file to a hidden resident (Lor) and made it the profile photo. After `0082`, three callers (anon, a signed-in user with no role, a real staff user) called each function through a `pg_temp.try()` wrapper that records `OK: <result>` or `REFUSED: <error>`. Output in §4. Both runs were rolled back, and a query afterwards confirmed it: `photo_still_there = true`, `fake/probe row left = false`
- [x] Down-migration written, or the reason one is not needed is stated: none written. No data changes. The guard rewrite only adds `is null or`; the dropped overload had no caller (`grep` of `src/` and `worker/`: every `record_attachment` call passes `p_date_taken`); the rest is grants. The inverse is `alter function private.approved_translations(text, uuid) set schema public` plus re-grants, and nothing in the app would need it
- [x] Production apply plan stated for the release manager: **needs Lutan's go**, as `0081` did. From the main checkout: `node scripts/apply-migrations.mjs --env production --status` (`0081` may itself still be pending there, and `0082` goes after it), then `--dry-run`, then apply, then `node scripts/check-public-views.mjs --env production`. Independent of any deploy, because no code changes. Production was not probed from this worktree, which has no production credentials, so the exposure there is presumed from identical migrations, not measured

## 4. Functional checks

**Before `0082`, the leak the item named** (anon key only; resident ids from `translations`, three of them not public: `is_public_visible` false and absent from `public_resident_profiles`; output cut at 220 characters by the probe):

```
POST rpc/approved_translations residents/853951b2-81c4-5e40-a5df-c178304e6b09 (anon):
{"bio": {"lang": "th", "text": "แพนด้าเป็นสุนัขที่ชอบเอาใจคนที่สุด ชอบเลียและซุกกอด และชอบนอนบนเ
POST rpc/approved_translations residents/03ce84b7-10a8-506f-a172-b1d6d8c1d542 (anon):
{"bio": {"lang": "th", "text": "สีน้ำตาลแดง"}}  [HTTP 200]
POST rpc/approved_translations residents/5797b73f-3876-5837-a876-379cae51ebd7 (anon):
{"bio": {"lang": "th", "text": "นิสัย: ขี้กลัว ไม่ค่อยเป็นมิตรกับคน"}}  [HTTP 200]
POST rpc/approved_translations residents/4edfd157-2023-5fa7-af6e-735d3fe1f392 (anon):
{"bio": {"lang": "th", "text": "ค่อนข้างเป็นมิตรกับคน"}}  [HTTP 200]
```

**Before `0082`, the writers, as anon in a rolled-back transaction** (`f999f8b0…` is an id anon read from `public_resident_photos`):

```
whoami | anon / current_user_role()=NULL
delete_resident_photo(f999f8b0…) returned | 1UYhi9CCEzOhiy0nifpJTi1KVjP-AopfC
record_attachment(resident Lor, fake file) inserted attachment | 4dc14a5f-1005-4396-ba1a-224c7fa8f911 is_profile=true
attachment f999f8b0 still exists inside txn | false
is_known_drive_file(fake) inside txn | true
```

**After `0082`, anon via the API:**

```
== anon: public view still carries the approved Thai bio (Panda)
[{"name":"Panda","translations":{"bio": {"lang": "th", "text": "แพนด้าเป็นสุนัขที่ชอบเอาใจคนที่ส

== anon: the four approved_translations calls again
{"code":"PGRST202","details":"Searched for the function public.approved_translations with parameters p_row, p_table or with a single unnamed json/jsonb parameter, but no matches were found in the sche
{"code":"PGRST202","details":"Searched for the function public.approved_translations with parameters p_row, p_table or with a single unnamed json/jsonb parameter, but no matches were found in the sche
{"code":"PGRST202","details":"Searched for the function public.approved_translations with parameters p_row, p_table or with a single unnamed json/jsonb parameter, but no matches were found in the sche
{"code":"PGRST202","details":"Searched for the function public.approved_translations with parameters p_row, p_table or with a single unnamed json/jsonb parameter, but no matches were found in the sche
== anon: private schema via Accept-Profile
{"code":"PGRST106","details":null,"hint":"Only the following schemas are exposed: public, graphql_public","message":"Invalid schema: private"}  [HTTP 406]
```

**After `0082`, each caller in a rolled-back transaction:**

```
anon | delete_resident_photo | REFUSED: permission denied for function delete_resident_photo
anon | record_attachment | REFUSED: permission denied for function record_attachment
anon | private.approved_translations direct | OK: {"bio": {"lang": "th", "text": "นิสัย: ขี้กลัว ไม่ค่อยเป็นมิตรกับคน"}}
anon | public_resident_profiles Panda translations | OK: {"bio": {"lang": "th", "text": "แพนด้าเป
authenticated, no role | current_user_role() | OK: null
authenticated, no role | delete_resident_photo | REFUSED: Not authorized to remove attachments.
authenticated, no role | record_attachment | REFUSED: Not authorized to add attachments.
authenticated, no role | set_resident_profile_photo | REFUSED: Not authorized to set the profile photo.
authenticated, no role | record_deceased_archive | REFUSED: Not authorized to archive a deceased resident.
staff | current_user_role() | OK: staff
staff | record_attachment | OK: attachment cdd4e8e2-7888-472d-9972-816d6c566775
staff | delete_resident_photo | OK: 1UYhi9CCEzOhiy0nifpJTi1KVjP-AopfC
staff | resident_is_deceased | OK: false
staff | resident_list_view rows | OK: 81
staff | public_resident_profiles Panda translations | OK: {"bio": {"lang": "th", "text": "แพนด้าเป
```

The `anon | private.approved_translations direct | OK` row is expected. It is raw SQL as the anon *role*, which only the views do; anon keeps EXECUTE so they work. No API client can reach it: the Data API does not expose `private` (`PGRST106` above).

- [x] Happy path works end to end: every leak is refused, and every public surface still works signed out (§6)
- [ ] Data persists — reload the page and the change is still there — n/a: nothing user-facing is written; grants and function bodies were re-read after the apply by the check script and the harness
- [x] Create / edit / delete all exercised (whichever the feature has): the rewritten `record_attachment` (create) and `delete_resident_photo` (delete) as staff in the harness, both `OK`, then rolled back. Not exercised through the app's upload UI, so that is left for manual verification (item 1)
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface
- [x] Invalid input is rejected with a readable message, not a crash: a refused call is PostgREST's `42501` JSON (`permission denied for function …`). A roleless signed-in caller gets the function's own `Not authorized to …` message, the one it always meant to raise
- [x] Boundary cases checked: both sides of the allow-list at the API (the five answer `200`; the other 23 get `401` naming the function) and both sides of the guard (NULL role refused, a real role allowed)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | every function, via `authenticated` | unchanged | pass: `authenticated` keeps its explicit grant on every function (from `pg_proc.proacl`, checked before `0082`), and the guards admit admin exactly as before |
| management | same | unchanged | pass: same grant check; the guard lists are unchanged |
| staff | same | unchanged | pass: signed-in harness as a real staff user, `record_attachment` and `delete_resident_photo` both `OK` |
| vet | same | unchanged | pass: same grant check; vet is still in `record_attachment`'s list |
| volunteer | same | unchanged | pass: same grant check; the guard lists are unchanged |
| signed in, no role / archived | every function | the four guarded writers refuse | pass: harness, all four `REFUSED: Not authorized …` (before: they let this caller through) |
| signed out | 5 functions | every other RPC `401` | pass: `check-public-views.mjs` 109 ok / 0 FAIL |

- [ ] Every role above tested — n/a: staff, roleless and anon were exercised directly. Admin, management, vet and volunteer were checked at the grant and guard-list level, because `0082` changes nothing that tells them apart from staff: only the `is null or` prefix, which is false for any real role
- [x] A role that should not have access is blocked server-side: anon calling each function's `/rpc/` URL directly gets `401 permission denied for function`

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no user-facing behaviour
- [ ] Translatable strings go through the translation path — n/a: no strings; the translation data the public views serve was checked in §4
- [ ] Mobile viewport (375px) — n/a: no UI
- [x] Browser console clean — the in-app browser loaded `/adopt/<Panda>` signed out and switched it to ไทย; the dev server's error log was empty (`No server errors found.`)
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages: every public page `200` (§6); the only 401s are the intended refusals

## 6. Regression

- [x] The pages nearest the change still work. Every anon surface was fetched signed out (curl, no cookies) after the apply, both from `next dev` on port 3014 and from `test.lannacare.org`, which reads the same dev database. The photo proxy calls `is_known_drive_file` as anon and serves a public photo `200 image/jpeg`. The first three local requests timed out (`000`) during `next dev`'s first compile and were retried, both shown:

```
== http://localhost:3014 (no cookies = signed out)
000  0B  /
000  0B  /adopt
000  0B  /our-work
200  39224B  /donate
200  46499B  /friends
enclosure link found on /our-work: none
200  52027B  /adopt/e07ad9e2-4e55-51aa-af5c-7b3a511dd89f
200  image/jpeg  203289B  /api/photos/<public photo 1UYhi9…>
{"error":"Photo not found."}  404  /api/photos/<unknown id>
== https://test.lannacare.org (no cookies = signed out)
200  52682B  /
200  30726B  /adopt
200  22919B  /our-work
200  27751B  /donate
200  34218B  /friends
enclosure link found on /our-work: none
200  39720B  /adopt/e07ad9e2-4e55-51aa-af5c-7b3a511dd89f
200  image/jpeg  203289B  /api/photos/<public photo 1UYhi9…>
{"error":"Photo not found."}  404  /api/photos/<unknown id>
== localhost retry
200  66392B  /
200  41784B  /adopt
200  33391B  /our-work
200  37484B  /e/4931cad3-a677-55a8-a501-f3e845c33b74
== test.lannacare.org
200  26313B  /e/4931cad3-a677-55a8-a501-f3e845c33b74
```

  In the in-app browser, signed out, `/adopt/853951b2-…` (Panda) switched to ไทย shows the bio `แพนด้าเป็นสุนัขที่ชอบเอาใจคนที่สุด …`, which comes through the moved `approved_translations`
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared source file touched; `check-public-views.mjs` is a standalone script
- [x] Nothing merged from `main` during `sync` was broken by this branch: sync merged nothing (`Already up to date.`)

### `check-public-views.mjs` against dev

Before `0082` it exited 1 with 87 ok and 23 FAIL. The FAIL lines (`grep ^FAIL`):

```
FAIL  approved_translations(): anon EXECUTE is refused — HTTP 200: null
FAIL  attachment_resident_id(): anon EXECUTE is refused — HTTP 200: null
FAIL  deceased_lock_bypassed(): anon EXECUTE is refused — HTTP 200: false
FAIL  delete_resident_photo(): anon EXECUTE is refused — HTTP 400: Photo not found.
FAIL  detect_language(): anon EXECUTE is refused — HTTP 200: "en"
FAIL  diet_forecast(): anon EXECUTE is refused — HTTP 401: permission denied for view resident_current_state
FAIL  medication_forecast(): anon EXECUTE is refused — HTTP 401: permission denied for view resident_current_state
FAIL  merge_blood_test_type(): anon EXECUTE is refused — HTTP 401: permission denied for table blood_test_types
FAIL  merge_frequency(): anon EXECUTE is refused — HTTP 401: permission denied for table frequency
FAIL  merge_medication(): anon EXECUTE is refused — HTTP 401: permission denied for table medication
FAIL  merge_procedure_type(): anon EXECUTE is refused — HTTP 401: permission denied for table procedure_types
FAIL  other_language(): anon EXECUTE is refused — HTTP 200: "th"
FAIL  prescription_doses_between(): anon EXECUTE is refused — HTTP 401: permission denied for table frequency
FAIL  record_attachment(): anon EXECUTE is refused — HTTP 400: null value in column "owner_type" of relation "attachments" violates not-null constraint
FAIL  record_deceased_archive(): anon EXECUTE is refused — HTTP 400: This resident is not recorded as deceased.
FAIL  record_immunization(): anon EXECUTE is refused — HTTP 401: permission denied for table immunization_records
FAIL  record_immunizations_bulk(): anon EXECUTE is refused — HTTP 401: permission denied for table immunization_records
FAIL  record_immunizations_fanout(): anon EXECUTE is refused — HTTP 401: permission denied for table immunization_records
FAIL  record_intake(): anon EXECUTE is refused — HTTP 401: permission denied for table enclosures
FAIL  resident_is_deceased(): anon EXECUTE is refused — HTTP 200: false
FAIL  schedule_bulk_appointments(): anon EXECUTE is refused — HTTP 401: permission denied for table bulk_appointments
FAIL  set_resident_profile_photo(): anon EXECUTE is refused — HTTP 400: That photo does not belong to this resident.
FAIL  undo_deceased_placement(): anon EXECUTE is refused — HTTP 400: Only an admin can withdraw a recorded death.
```

The `400` rows are the ones that matter. `delete_resident_photo`, `record_attachment`, `record_deceased_archive` and `set_resident_profile_photo` got past their role guard, with null arguments, and failed only further in. The `401 … for table/view` rows were refused by a table inside the function, not by the function. The check does not accept that, because a `security definer` function has no such table barrier.

After `0082` it exits 0 with 109 ok and 0 FAIL. `approved_translations` is no longer listed, because it has left `public`. The function lines, unedited (the 81 table and view lines are unchanged from `0081` and match its plan):

```
ok    attachment_resident_id(): anon EXECUTE is refused — HTTP 401
ok    cashflow_forecast(): anon EXECUTE is refused — HTTP 401
ok    current_user_role(): anon can EXECUTE — HTTP 200
ok    deceased_lock_bypassed(): anon EXECUTE is refused — HTTP 401
ok    delete_resident_photo(): anon EXECUTE is refused — HTTP 401
ok    detect_language(): anon EXECUTE is refused — HTTP 401
ok    diet_forecast(): anon EXECUTE is refused — HTTP 401
ok    is_known_drive_file(): anon can EXECUTE — HTTP 200
ok    medication_forecast(): anon EXECUTE is refused — HTTP 401
ok    merge_blood_test_type(): anon EXECUTE is refused — HTTP 401
ok    merge_frequency(): anon EXECUTE is refused — HTTP 401
ok    merge_medication(): anon EXECUTE is refused — HTTP 401
ok    merge_procedure_type(): anon EXECUTE is refused — HTTP 401
ok    other_language(): anon EXECUTE is refused — HTTP 401
ok    prescription_doses_between(): anon EXECUTE is refused — HTTP 401
ok    record_attachment(): anon EXECUTE is refused — HTTP 401
ok    record_deceased_archive(): anon EXECUTE is refused — HTTP 401
ok    record_immunization(): anon EXECUTE is refused — HTTP 401
ok    record_immunizations_bulk(): anon EXECUTE is refused — HTTP 401
ok    record_immunizations_fanout(): anon EXECUTE is refused — HTTP 401
ok    record_intake(): anon EXECUTE is refused — HTTP 401
ok    resident_is_deceased(): anon EXECUTE is refused — HTTP 401
ok    schedule_bulk_appointments(): anon EXECUTE is refused — HTTP 401
ok    set_resident_profile_photo(): anon EXECUTE is refused — HTTP 401
ok    shelter_date(): anon can EXECUTE — HTTP 200
ok    shelter_time_zone(): anon can EXECUTE — HTTP 200
ok    shelter_today(): anon can EXECUTE — HTTP 200
ok    undo_deceased_placement(): anon EXECUTE is refused — HTTP 401
```

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** and moved to Completed → Architecture. The follow-up (the photo proxy serves internal attachments to anon by file id) went on the `backlog` branch as `649de3c`
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: "2026-09-25 — Anon loses the functions (0082)". It covers what was reachable, why the default privileges did it, the NULL guard trap and the rule for future guards, the allow-list and why each of the five is on it, `private` over restriction, the `private.` prefix future view migrations need, why `is_known_drive_file` is left alone, and what the check now prevents
- [x] `README.md` still accurate: the go-live check paragraph now names the function allow-list and `0082`
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: a closed leak and closed anonymous writes that no shelter user could see; the public pages and the signed-in app behave exactly as before
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Leaked responses are from the anon REST probe. The anon writes are from the rolled-back SQL harness. Per-role behaviour after the change is from the second harness. Grants come from `pg_proc.proacl` and `pg_default_acl` on dev. The exposed schemas are from PostgREST's `PGRST106` hint. "Callers of `record_attachment` all pass `p_date_taken`" is from `grep`. "The roleless-signed-in hole" was measured after the fix (refused); before the fix it is inferred from the anon run, since both reach the guard with a NULL role. Production was **not** checked

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (nothing to deploy: SQL and a script, already applied to the dev database `test.lannacare.org` reads, and the public pages there were checked in §6)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date; `shelter_today` / `shelter_date` are only re-granted, not changed
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold; both sides of the allow-list and of the guard are covered in §4
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** Two things are abbreviated, and each is named where it happens: the probe's own 220-character cut, and the 81 unchanged table/view lines left out of the after-run
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: production release manager (checked on `next dev` and on `test.lannacare.org`; the production check goes with the production apply)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No app code changes. But a later migration that re-creates a public view must call `private.approved_translations`; that is written in decisions.md
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production is his go; this worktree has no production credentials)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no data rewritten; function bodies and grants only, plus dropping an overload nothing calls
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy (see §3)

### Rollback

- [x] Rollback position stated, **including what it does not cover**: there is no Worker change, so `wrangler rollback` does not apply. If a public page turns out to need a function anon lost, the fix is one `grant execute on function <f> to anon;` in a new migration, plus the function on `check-public-views.mjs`'s `PUBLIC_FUNCTIONS`. Re-opening the guards is never the fix

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | High (pre-existing) | Four `security definer` writers let a NULL role through (`not in` with NULL does not raise). Anon could delete any public resident photo, attach files and set profile photos, and a signed-in user with no role or an archived one could do the same | fixed on dev by `0082`; production awaits Lutan's go |
| 2 | Medium (pre-existing) | `approved_translations` returned approved translations for any row id to anon, non-public residents included | fixed by `0082` (moved to `private`) |
| 3 | Low (pre-existing) | `resident_is_deceased`, `attachment_resident_id` and several pure helpers answered anon | fixed by `0082` (EXECUTE revoked) |
| 4 | Medium (pre-existing, out of scope) | The photo proxy streams any known Drive file, internal attachments included, to a signed-out visitor with its id; the edge cache is keyed by URL alone | deferred to backlog (`649de3c`, Architecture) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as staff (or admin), upload a photo to a resident and then delete it. Both go through the rewritten `record_attachment` / `delete_resident_photo`. The harness proved them at SQL level; this proves the app path. The local Drive OAuth client is dead, so this needs the deployed site | `test.lannacare.org/residents/<id>/photos` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-09-25

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — item 1 is Lutan's

Manual verification by: pending: item 1 under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR — summarised in the PR description, with a pointer to this file
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: pending  Date: —

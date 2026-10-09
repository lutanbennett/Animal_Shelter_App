# Feature test plan

## Header

| | |
|---|---|
| Feature | `close-the-over-grants`: three rights the database answered that no screen showed are closed (`0170`, `0171`): staff no longer read contacts' phone and address off the table; nobody signed in may call the `reset_*_rounds()` functions; the facility map tables answer only logins with app access. Items 4 and 5 of the brief (the vet's photo and login-list access) were raised with Lutan and not built |
| Backlog item | `docs/backlog.md` → three ticked: *Carer contacts: close the data hole behind the pages*, *`reset_prescription_rounds()` … can be called by any signed-in login*, *The facility map tables answer every signed-in login*. Two left open with a note: *A vet login can read, rename, add and delete every project and maintenance photo record*, *A vet login lists every person with a login* |
| Branch / worktree | `claude/close-the-over-grants` @ `C:\Development\Animal_Shelter_close-the-over-grants` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` (throwaway staff and Management logins made and deleted by script) |
| PR | opened from this branch; the number is recorded in the follow-up commit |
| Tested by / date | Claude (automated) / 2026-10-09 |
| Carries a migration? | yes: `0170_close_the_over_grants.sql`, `0171_contacts_editor_reads.sql` |
| Tested at SHA | `47dbd1ae` (code); this plan's own commit adds only the plan |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the brief's fixes 1–3, built as each item's **Fix** line says; 4 and 5 asked, not guessed
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0170_close_the_over_grants.sql`, `0171_contacts_editor_reads.sql`; `src/lib/contacts/visibility.ts`, `carers.ts`; `src/lib/placements/rehome.ts`; `src/lib/adoption-updates/options.ts`, `queries.ts`; `src/lib/shelter-friends/staff-drafts.ts`; `src/lib/archive/resident-record.ts`; `src/components/CarerPicker.tsx`; `src/app/assistant/lookups.ts`; `src/app/residents/[id]/page.tsx`, `[section]/page.tsx`, `adoption-updates/AdoptionUpdatePage.tsx`, `deceased/undo/page.tsx`, `rehome/return/page.tsx`; `src/lib/releases.ts`; `scripts/check-medication-rounds.mjs`, `check-app-access-gate.mjs`, `check-perm-convert-people.mjs`, `check-perm-convert-settings.mjs`, `check-director-answers-schema.mjs`, `check-2ic-role.mjs`, `lib/permission-probes.mjs`; `docs/backlog.md`, one decision file. No `worker/` change
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public: **staff** read contacts only through `picker_contacts` (id, name, type, archived_at) and see no phone in the carer picker; **Management** and **Admin** unchanged except the picker shows no phone; **the 2IC**'s carer picker now lists names (it read nothing before); **no role, archived, public_viewer** lose the facility map; **every signed-in login** loses execute on the three reset functions; vet and volunteer otherwise unchanged; signed-out unchanged
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: brief items 4 (vet attachments allow-lists) and 5 (vet's view of `app_users`) are Lutan's call and are not built; `rounds` stays open to every login on purpose (the item says so)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date.`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
=== gates: build exited 0 after 46s

gates: typecheck=0 lint=0 build=0
```

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `0169` highest on `origin/main` (`cba421a1`), no open PR at all when numbered; the post-commit hook printed `migration numbers: ok — 0170_close_the_over_grants.sql, 0171_contacts_editor_reads.sql`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `169 applied, 1 pending`, nothing on `main` unapplied
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0170_close_the_over_grants.sql … ok`, later `dry-run 0171_contacts_editor_reads.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0170_close_the_over_grants.sql … ok`, `applying 0171_contacts_editor_reads.sql … ok`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): `create or replace view`, `drop policy if exists` before each `create policy`, revoke/grant are idempotent; `check-migration-grants.mjs`: `migration grants: ok (94 file(s) checked)`; `check-new-policy-role-names.mjs`: `ok — 2 new migration file(s), none with an unmarked role-named policy or a scope function without a cell beside it`
- [x] Existing rows still read correctly after the change (checked against real dev data): all 7 dev contacts read through `picker_contacts` as staff, Management, Admin and the 2IC (probe below); PostgREST resolves every new embed (`placement_history → picker_contacts`, by name and by `!carer_id`, with `archived_at`; `shelter_friends → picker_contacts!inner`; `attachments → adoption_updates → picker_contacts`; `adoption_updates → picker_contacts`), each `200`
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: `check-medication-rounds.mjs` now calls each `reset_*_rounds()` under admin, management, staff, volunteer, vet and a no-role login **with a real id** and asserts every call is refused; red before (`70 checks held, 18 failed.` — all 18 the new calls, each `got 1`), green after (`88 checks held, 0 failed.`). `check-app-access-gate.mjs` asserts archived, roleless and public_viewer read 0 rows of `facility_maps` and `map_rooms`: red before (`FAIL A:archived reads 3 rows of facility_maps; A:roleless reads 3 rows of facility_maps; A:public_viewer reads 3 rows of facility_maps;`), green after (`HARNESS-OK … read 0 rows of 20 internal objects`). `check-perm-convert-people.mjs` with the new expectations: `460 checks held, 0 failed.`; run after `0170` but before its expectations changed it reported the closure itself (`FAIL contacts read as staff: allowed - got 0`, and the same for `c_dir_read`), plus the `c_dir_edit` / `c_dir_all` update and delete failures that led to `0171`
- [x] Down-migration written, or the reason one is not needed is stated: not written; each file's header gives the undo (restore the `0147`/`0142`/`0157` policies, re-grant execute, drop the view). Nothing is destructive: no column, row or table is dropped
- [x] Production apply plan stated for the release manager (which file, which project, when): `0170` then `0171` to production (`dbkodyyxxhtygxcxmfcu`) **in the same release as this code and before or with the deploy**: the old code reads `contacts` for staff, so applying the schema before the new app is live would empty the staff carer picker until the deploy lands; applying after the deploy is safe (the new code reads the view, which the old schema does not have, so the deploy must not precede the apply either). Apply and deploy back to back

### Probe, before and after (`node scripts/probe-role-surface.mjs --json`, then a diff of the two matrices)

Every line the diff printed for the three fixed relations, unedited (`rd` = rows read); the other lines it printed were `picker_contacts` being new for every principal, and dev data that changed between the runs (a new login, a new `community_places` row, audit rows):

```
norole               facility_maps                rd 3 -> 0
archived             facility_maps                rd 3 -> 0
public_viewer        facility_maps                rd 3 -> 0
staff                contacts                     rd 7 -> 0
staff                picker_contacts              rd (new) -> 7
second_in_command    picker_contacts              rd (new) -> 7
management           picker_contacts              rd (new) -> 7
admin                picker_contacts              rd (new) -> 7
```

Every principal is refused update, delete and insert on `picker_contacts` (`E42501` / `view`). `map_rooms` has no rows on dev, so it is proved by its policy text, not by rows.

## 4. Functional checks

- [x] Happy path works end to end: as a throwaway staff login, `/residents/<id>/rehome` opens and the carer picker lists the carers by name, return-to-shelter, the resident hub and the housing history all name the current carer (script output below)
- [ ] Data persists — reload the page and the change is still there — n/a: nothing new is saved; the one changed write (adding a carer on the spot) is in **Left for manual verification**
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no create, edit or delete screen changed; staff's contact insert without RETURNING is held by `check-perm-convert-people.mjs` (`staff: "0010"`, insert allowed), and the form path is in **Left for manual verification**
- [ ] Empty state renders sensibly (no rows yet) — n/a: the picker's empty state (`noCarers`) is unchanged code; for a login without `contacts.directory` the view returns no rows exactly as the table did
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input changed
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): an archived carer is still left out of the picker and still marked in the housing history, because `archived_at` is in the view; the archive *reason* tooltip is now Management's only (decision file)

```
staff:
  ok   rehome form opens (200 )
  ok   carer picker lists the carers by name
  ok   no carer phone anywhere on the page
  ok   return-to-shelter names the current carer (Test Fosterer)
  ok   resident hub names the carer
  ok   housing history names the carer
  ok   /contacts shows staff no phone (200 )
management:
  ok   /contacts still lists phones for Management
  ok   Management's carer picker lists the carers
  ok   Management's housing history names the carer
cleaned up 2 logins
ALL OK
```

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `contacts`, `picker_contacts`, maps; not the reset functions | as expected | probe: 7 / 7 rows; maps 3; reset refused |
| management | `contacts` (browse + Edit), `picker_contacts`, maps; not the reset functions | as expected | probe 7 / 7; `/contacts` lists phones; reset refused |
| staff | `picker_contacts` only, maps; not `contacts`, not the reset functions | as expected | probe `contacts` 7 → 0, `picker_contacts` 7; no phone on the rehome page; reset refused |
| vet | `vet_contacts` (unchanged), maps; not `picker_contacts`, not the reset functions | as expected | probe `picker_contacts` 0; reset refused |
| volunteer | maps; no contacts at all (unchanged); not the reset functions | as expected | probe `picker_contacts` 0; reset refused |
| signed out | nothing internal | as expected | probe: anon refused `picker_contacts` (`E42501`), maps refused as before |

- [x] Every role above tested (the probe covers all thirteen principals, including the three configured roles, no role, archived and public_viewer)
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): every refusal above is the database's, under each login's own JWT

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual never said the picker shows a phone ("Pick the carer from the list"); nothing it says changed
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no new string
- [ ] Mobile viewport (375px) — n/a: the picker lost a suffix on each option; nothing got wider
- [ ] Browser console clean — n/a: pages checked by signed-in server fetches, not in a browser; the one visual look is in **Left for manual verification**
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages: every page fetched returned `200`, every PostgREST embed `200`

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): `/residents/<id>/rehome`, `/residents/<id>/rehome/return`, `/residents/<id>`, `/residents/<id>/housing`, `/contacts`, as staff and Management (above)
- [x] Any shared file touched checked from a second, unrelated page: `contactRelation()` is shared; loaded through the resident hub and the housing tab as well as the rehome pages, and as Management as well as staff
- [x] Nothing merged from `main` during `sync` was broken by this branch: `sync` merged nothing (`Already up to date.`)

Check scripts re-run after the apply that were already red before it, for reasons outside this branch (same failure lines before and after): `check-director-answers-schema.mjs` (`picker_immunization_types has no other column (no cost)`), `check-2ic-role.mjs` (`medication table as staff`, `diet_types table as staff`, the bundle line), `check-medical-role.mjs`, `check-maintenance-role.mjs` (bundle), `check-contact-visibility.mjs` (`cannot drop columns from view`), `check-permission-parity.mjs` (broken fixtures, 23502 not-null). `check-contacts-archive`, `check-shelter-friends`, `check-audit-log`, `check-audit-undo`, `check-map-rooms`, `check-perm-convert-vet`: green before and after. `check-policy-role-names.mjs --final`: `RESULT: GREEN (the end state; every scope function has a cell beside it)` after. The parity check's `contacts.browse` probe (new in this branch) is no longer a mismatch after the apply

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**: three ticked with the commit that closed each; the two vet items carry a note that they are with Lutan. Searched the backlog for `contacts`, `C9`, `C10`, `facility_maps`, `map_rooms` and the three function names: no other open item's outcome is closed by this
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-09-close-the-over-grants.md`
- [x] `README.md` still accurate: it does not describe contacts access, the reset functions or the map policies
- [x] **Release notes.** Would a shelter user notice this change? Yes: the carer picker no longer shows a phone. `unreleased` gained one line for it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned**: the trigger functions' owner and security were read from `pg_proc` on dev; who holds `contacts.directory`, `contacts.browse` and the rehome cells from `role_permissions`; the before/after counts are the probe's and the scripts' output; `has_shelter_floor()`'s answer for public_viewer is from its body (`ur.role <> 'volunteer'`)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: a permission cutoff, and both sides are asserted: each principal that should read and each that should not, per relation and per function
- [x] **Evidence pasted into this plan is the tool's actual output, unedited**: the probe lines are copied from the diff's output, the page check and gates lines as printed
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page reads any of these objects (`check-app-access-gate.mjs` C: every login reads the 12 public objects exactly as anon)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** Yes: the app reads `picker_contacts`. Apply `0170` and `0171` to production immediately before the deploy (section 3's plan): code first would read a view production lacks; schema long before would empty staff's carer picker
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: additive view, policy and grant changes only
- [x] Apply plan stated: `0170_close_the_over_grants.sql` then `0171_contacts_editor_reads.sql`, production `dbkodyyxxhtygxcxmfcu`, immediately before the deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover**: a code rollback (`./scripts/pi/deploy-pi.sh --ref <previous sha>`) puts back app code that reads `contacts` for staff, which `0170`/`0171` then answer with nothing: the staff carer picker and carer names go empty. A code rollback therefore needs the schema undone too: restore `contacts_select_perm` from `0147` (the other two sections can stay; no app code needs them). Neither rollback reverts migrations by itself

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | `0170` narrowed the contacts read to `contacts.browse` only; a role holding `contacts.directory` Edit without browse would have had a directory page that lists and edits nothing (UPDATE/DELETE reach only rows SELECT shows). No real role was affected | fixed by `0171` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As a **staff** login, foster a resident with **Add a new carer** (name, phone): it saves, the new carer is on the placement and appears in the picker next time. This is the insert that no longer reads its id back | `/residents/<id>/rehome` on dev |
| 2 | The carer picker reads well with names only (no phone after each name), on a phone | `/residents/<id>/rehome` |
| 3 | As the **2IC**, the carer picker now lists carers (it was empty before, because she cannot read the table) | `/residents/<id>/rehome` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-09

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; three items are waiting for a person

Manual verification by: pending: the three items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR is not merged

Result: pass

Release manager acknowledgement: pending: not yet released

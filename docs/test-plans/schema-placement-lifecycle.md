# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Placement lifecycle guard (protected flag on the Lifecycle zone and its five pseudo-enclosures), fixed-column views for the three public `site_*` tables, stricter migration security checks, `check-public-views` in CI |
| Backlog item | `docs/backlog.md` → Placement lifecycle and configuration guards (DB-9, DB-10) |
| Branch / worktree | `claude/schema-placement-lifecycle` @ `C:\Development\Animal_Shelter_schema-placement-lifecycle` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | linked from the PR itself |
| Tested by / date | Claude (schema-placement-lifecycle session), 2026-10-01 |
| Carries a migration? | yes: `0122_placement_lifecycle_and_site_views.sql`, `0123_is_public_drive_file_views.sql` |
| Tested at SHA | see the PR head; harness and gates were run at `179e0ce` plus the test-plan commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the Lifecycle zone and its five pseudo-enclosures can no longer be renamed, moved, deleted or unflagged (DB-9); anon reads `site_content`, `site_content_photos` and `site_pages` only through fixed-column views, and `check-migration-grants.mjs` now refuses a table without RLS, a security-definer function without `search_path`, a function without a revoke from public and anon, and a `grant … to anon` outside `public_*` / `site_*`, with `check-public-views.mjs` added to CI (DB-10)
- [x] Files/areas touched listed: `supabase/migrations/0122…`, `0123…`; `scripts/check-migration-grants.mjs`, `check-public-views.mjs`, new `check-lifecycle-guards.mjs`; `.github/workflows/ci.yml`; `src/lib/site/content.ts` and `src/app/page.tsx` (one table name each, now the public view); `docs/backlog.md`, `docs/decisions/2026-10-01-lifecycle-protected-flag-and-site-views.md`
- [x] Roles affected identified: signed-out public (reads moved to views), admin (the zone and enclosure admin pages now meet the trigger's refusal). Staff, vet, volunteer, management: no change
- [x] Anything explicitly out of scope written down: the `using (true)` read policies on the three tables (they now admit signed-in users only) are not narrowed; a new enclosure added to the Lifecycle zone is not protected; the `TEST_SUPABASE_*` repository secrets are not added by this PR (see Left for manual verification)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in: `Already up to date.`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`, run at `179e0ce`, which was also the tip after the sync. As printed:

```
=== gates: build exited 0 after 275s

gates: typecheck=0 lint=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0121), and no other in-flight branch carries one. `0123` is a follow-up in the same PR, so the slot is still this branch's alone
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: 121 applied, 0 pending, no drift against `origin/main`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `0122` ok. `0123` was dry-run-free because it was applied straight after `0122` (it depends on `0122`'s views, which the per-file dry-run would have rolled back)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0122_… ok`, `applying 0123_… ok`; `--status` afterwards shows 123 applied
- [x] File is re-runnable: `add column if not exists`, `create or replace`, `drop trigger if exists`, flag updates guarded by `not protected`, views `create or replace`. The harness runs both files twice in one transaction
- [x] Existing rows still read correctly after the change: the six Lifecycle rows are flagged; `/`, `/adopt`, `/privacy`, `/login/request` return 200 on the dev server with the hero, gallery and contact email rendering through the views
- [x] **Constraints and defaults exercised against real rows** by `node scripts/check-lifecycle-guards.mjs` (a `begin; … rollback;` harness with a `do $$ … $$` block, ends `HARNESS-OK`). Asserted: rename, delete and unflag of the Lifecycle zone refused for the table owner and an admin; rename, move, delete and unflag of each of the five pseudo-enclosures refused for both; capacity, notes, `name_th` and `internal` on protected rows still editable; an ordinary zone and enclosure still insert, rename and delete; exactly 1 zone and 5 enclosures flagged; anon reads the three `public_site_*` views; anon is refused `site_content`, `site_content_photos`, `site_pages`, `vet_visit_estimate` and any write through a view; a column added to `site_content` afterwards (`harness_secret`) does not reach anon through the view or the table; an admin still reads the base tables; anon `is_public_drive_file` still answers
- [x] Down-migration: not needed. The flag column is additive and harmless to code that ignores it; the views are additive; the one destructive step (anon's grant on the three base tables) is restored with `grant select on site_content, site_content_photos, site_pages to anon`, and nothing in the app reads those tables as anon any more
- [ ] Production apply plan stated for the release manager — n/a: this is the PR's plan, not a deploy; section 8 carries it as `deferred:`. Both files go to production **before** the deploy of this branch's code, `0122` then `0123`, because the code reads `public_site_content` and `public_site_content_photos`

## 4. Functional checks

- [x] Happy path works end to end: the public home page, `/adopt`, `/privacy` and `/login/request` render hero, gallery photos and the contact email from the new views
- [x] Data persists: the flag survives a re-run of the file, shown by the harness running both files twice and still finding exactly six flagged rows (the harness itself rolls back by design)
- [ ] Create / edit / delete all exercised — n/a: exercised at the database level by the harness (create, rename, delete of an ordinary zone and enclosure; refusals on protected rows); the admin UI pages were not driven, because their only change is that Postgres's refusal message now appears through the existing `refuse(error.message)` path
- [ ] Empty state renders sensibly — n/a: no UI surface was added
- [x] Invalid input is rejected with a readable message: `The Deceased pseudo-enclosure is protected: status logic finds it by name, so it cannot be deleted` and the equivalents, asserted by the harness
- [x] Boundary cases checked: owner and admin both refused; a refused update changes nothing (an unflag attempt does not clear the flag, later assertions still see six flagged rows)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | zone / enclosure admin, base `site_*` tables | rename/delete of protected rows refused with a message; everything else unchanged; reads the base tables | harness: refused as expected, base reads ok |
| management | unchanged | unchanged | not tested separately |
| staff | unchanged | unchanged | not tested separately |
| vet | unchanged | unchanged | not tested separately |
| volunteer | unchanged | unchanged | not tested separately |
| signed out | `public_site_*` views | reads the views; refused the base tables; no write | harness and `check-public-views.mjs`: as expected |

- [ ] Every role above tested — n/a: only anon, an authenticated admin and the table owner were exercised. The other four roles gained and lost no privilege on any object here (`authenticated` is untouched on the base tables), but that is reasoning, not a run
- [x] A role that should not have access is blocked server-side: anon is refused the three base tables and `vet_visit_estimate` by the database itself, via PostgREST (`site_content?select=vet_visit_estimate` returns 401 / 42501) and in the harness

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no user-facing behaviour was added; the admin's refusal reuses an existing error path
- [ ] Translatable strings — n/a: no new strings in the app; the trigger messages are English database errors like the existing guards (0026, 0119)
- [ ] Mobile viewport (375px) — n/a: no layout change
- [x] Browser console clean — dev server log had no errors while the pages above were fetched
- [x] Network clean — the pages returned 200; `/our-story` 307 to `/login` is the existing signed-out behaviour for that path, not caused by this change

## 6. Regression

- [x] The pages nearest the change still work: `/`, `/adopt`, `/privacy`, `/login/request` (all call `loadSiteContent`), and the home gallery (`public_site_content_photos`); `check-public-views.mjs` passes against dev (189 ok, the one `skip` is the "no non-image attachment in a public project folder" fixture, unchanged)
- [x] Any shared file touched checked from a second, unrelated page by loading it: `src/lib/site/content.ts` is used by `/`, `/adopt`, `/privacy` and `/login/request`, all loaded
- [x] Nothing merged from `main` during `sync` was broken by this branch: the sync merged nothing, and the gates above ran on the resulting tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-01-lifecycle-protected-flag-and-site-views.md`
- [x] `README.md` still accurate: it does not describe the grant checks or the site tables
- [ ] **Release notes.** n/a: no UI surface; a shelter user would not notice. The public pages read the same content through a view, and an admin trying to rename a Lifecycle row was always a mistake
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions` were measured, not reasoned: the 19 first-cut findings were reproduced and traced to two causes before the check was refined; the `is_public_drive_file` break was found by `check-public-views.mjs` failing (HTTP 401) right after `0122`, not by reasoning, and fixed in `0123`; the "nothing real in 46 existing files" claim is the check's own output

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager (home page hero, gallery and footer contact details after the cache purge; a signed-out photo, `/api/photos/<id>`, since `is_public_drive_file` changed)
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here derives a date
- [ ] For a boundary or banding change, assertions cover both edges — n/a: no threshold or band was changed
- [x] Evidence pasted into this plan is the tool's actual output, unedited: the `gates:` lines and the harness verdict are quoted as printed
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new app env var. The three `TEST_SUPABASE_*` values are GitHub repository secrets for CI, not Cloudflare

### Migration ordering

- [x] This PR contains both a migration and code that reads it, so the production apply must happen **before** the deploy: written into the apply plan below
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` — deferred: release manager. Expect `0123` to dry-run as FAILED (`relation public_site_content does not exist`), because the dry-run rolls `0122` back before it runs; apply for real in order, per CLAUDE.md
- [ ] A production backup exists for a destructive migration — n/a: additive apart from revoking anon's table grants, which loses no data
- [ ] Apply plan stated: both files to production (`dbkodyyxxhtygxcxmfcu`) **before** the deploy of this branch, `0122` then `0123`. Before the apply, production's public pages keep working on the old code; after it and before the deploy they would break (the old code reads `site_content` as anon). So apply and deploy back to back — deferred: release manager

### Rollback

- [ ] Rollback position stated — deferred: release manager. `wrangler rollback` reverts the Worker but not the migration; rolling the Worker back after the apply restores code that reads `site_content` as anon, which is then refused. Roll back by also re-granting `select on site_content, site_content_photos, site_pages to anon`

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | After `0122`, `is_public_drive_file` (security invoker, 0084) read `site_content` and `site_content_photos` as anon and was refused: the photo proxy would have rejected every public photo | fixed: `0123` points it at the views; `check-public-views.mjs` is green |
| 2 | info | `site_content.vet_visit_estimate`, an internal figure, was readable by anon before this PR | fixed by the views; no production check made of whether anyone read it |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Add repository secrets `TEST_SUPABASE_URL`, `TEST_SUPABASE_ANON_KEY`, `TEST_SUPABASE_SERVICE_ROLE_KEY` (the dev project's) so the new `public-views` CI job actually runs; until then it passes with a warning | GitHub repository settings |
| 2 | In `/admin/enclosures`, try to rename or delete Deceased, and rename the Lifecycle zone in `/admin/zones`; the message should read clearly | admin UI, dev |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (schema-placement-lifecycle session)  Date: 2026-10-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items remain for a person, so this is not ticked and the signature is `pending:`

Manual verification by: pending: the two items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: handed over when the PR merges, not before

Result: pass

Release manager acknowledgement: pending

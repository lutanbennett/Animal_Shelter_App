# Feature test plan

## Header

| | |
|---|---|
| Feature | `0150_perm_convert_settings.sql`: `assistant_actions`, `translations`, `facility_maps` and `fixed_outgoings` stop naming roles and ask `(select has_permission(…))`; `translations` reads through a new `sees_all_translations()` |
| Backlog item | `docs/backlog.md` → **Roles build, foundation 3** is **not** ticked (the photo split remains); its status line is extended: every conversion it listed is done |
| Branch / worktree | `claude/perm-convert-settings` @ `C:\Development\Animal_Shelter_perm-convert-settings` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3021` (throwaway management, staff and volunteer logins opened the pages at 375 px) |
| PR | opened from this branch; the number is recorded in the follow-up commit |
| Tested by / date | Claude (automated) / 2026-10-06 |
| Carries a migration? | yes: `0150_perm_convert_settings.sql` |
| Tested at SHA | the branch tip at the commit that adds this plan, after merging `origin/main` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the 8 role-named policies on the last four tables are replaced by one policy per command that asks `has_permission()`, so the checker lists only the photo split
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0150_perm_convert_settings.sql`; `scripts/check-perm-convert-settings.mjs` (new); `scripts/check-policy-role-names.mjs` (four tables off `OWNERS`); `docs/roles-and-permissions.md` (§15: converted tables); `docs/decisions/2026-10-06-perm-convert-settings.md`; `docs/backlog.md`. No `src/`, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public: **management** and **staff** keep every right they used on these tables **except** two small ones management loses (below); **admin** unchanged (`admin_all_*`); **vet** unchanged (own `translations` policy); **volunteer**, `public_viewer` and no role unchanged (refused); signed-out public has no grant
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: the photo split (`attachments`, `maintenance_photos`, `project_photos`), assistant retention (DB-11), the "one place to translate everything" strategy and the Thai title, uploading plans from the system, a "see translations" cell, an activity for job delete, `src/`, production

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in (see the merge commit)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line, as printed:

  ```
  === gates: build exited 0 after 205s
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `check-migration-numbers.mjs` reports `ok — 0150_perm_convert_settings.sql (highest 0149_perm_convert_work.sql)`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `149 applied, 1 pending` on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0150_perm_convert_settings.sql … ok`, the only pending file (the first version of the file)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0150_perm_convert_settings.sql … ok`. **The file was then changed** (the `sees_all_translations()` function and the policy that asks it, plus comments) and its SQL re-run against dev from the file, so dev holds the final file; the `schema_migrations` row is for the same filename and no other hand-written SQL was posted
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): every policy, old and new, is dropped by name before the `create policy`s and the function is `create or replace`; replayed in practice, harness green after
- [x] Existing rows still read correctly after the change (checked against real dev data): `check-permission-parity.mjs` reads dev's real rows; `check-app-access-gate` reads the real `translations` rows (76) as every kind of login; the pages below opened
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness, `scripts/check-perm-convert-settings.mjs`: four tables, read / update / insert / delete under each login's own JWT, for admin, management, staff, volunteer, a vet, no role and eleven configured roles; plus sweeps. Output, as printed:

  ```
  291 checks held, 0 failed.
  RESULT: GREEN (each table answers as its cell says; facility.map alone opens no map write; management reads only its own assistant rows)
  ```

  Its first runs were red, usefully: management is refused the `facility_maps` writes (a finding, recorded as a known tightening) and a role holding scope-all with other cells read translations (fixture scope, fixed). `check-app-access-gate` separately failed `public_viewer reads 76 rows of translations` on the first version of the policy; that was a real fault, fixed by `sees_all_translations()`, and the script now carries the "opens no app" role that would have caught it
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: reversible by the file's own header (drop the new policies and the function, re-create the old ones from `0070`, `0056`, `0114` and `0142`); no data changes
- [x] Production apply plan stated for the release manager (which file, which project, when): `0150_perm_convert_settings.sql` to production `dbkodyyxxhtygxcxmfcu`, by Lutan from the main checkout, `--dry-run` then apply, after this PR merges. `-- consumer: none`: no ordering constraint against a deploy

## 4. Functional checks

- [x] Happy path works end to end: throwaway management, staff and volunteer logins (from `check-phone-width.mjs`) opened `/management/translations`, `/management/cashflow`, `/management/cashflow/fixed-outgoings`, `/assistant` and `/enclosures` at 375 px with no sideways scroll
- [ ] Data persists — reload the page and the change is still there — n/a: no write was driven in the browser; persistence is asserted by the harness (each allowed update and insert matches a row)
- [x] Create / edit / delete all exercised (whichever the feature has): insert, update and delete under each table's cell, and refused without it, on all four tables (harness); assistant rows insert only in the caller's own name
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI change
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no inputs; a refused write is a 42501 or zero rows, which the app's existing paths handle
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): the boundaries are the cell from both sides (Read versus Edit on `reports.cashflow` and `facility.enclosures`), a role that reads every resident but opens no app (the `public_viewer` shape), the same scope on the volunteer floor, `assistant.ask` alone versus `assistant.record`, and `facility.map` alone (a cell that sounds like the write and is not)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | all four tables | no change | allowed every command |
| management | `translations`, `fixed_outgoings`, own `assistant_actions` rows | no change, **except**: no longer reads others' assistant rows, no longer writes `facility_maps` | as listed; `/management/translations`, `/management/cashflow` and the outgoings page opened; `/admin/facility-map` redirected to `/no-access`, as it always was |
| staff | `translations` (read), own `assistant_actions` rows, `facility_maps` (read) | no change | as listed; `/assistant` and `/enclosures` opened; the management pages redirected to `/no-access` |
| vet | `translations` (its own scoped policy) | no change | reads, writes nothing |
| volunteer / no role / `public_viewer` | `facility_maps` read only | no change | refused every other command; `check-app-access-gate` OK |
| signed out | nothing | no change | no grant to `anon` on these tables (unchanged) |

- [x] Every role above tested: admin, management, staff, volunteer and the vet by the harness under their own JWTs, `public_viewer` by `check-app-access-gate`; management, staff and volunteer also in the browser; signed out by the grant, not exercised as a session
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): staff and volunteer requesting `/management/translations` and the cashflow pages, and management requesting `/admin/facility-map`, are redirected to `/no-access`; the table refusals are database refusals under the role's own JWT

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a reader of the manual could see changed
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings; the policies behind that page were exercised by the harness
- [x] Mobile viewport (375px): `check-phone-width.mjs --roles=management,staff,volunteer --locales=en --pages=/management/translations,/management/cashflow,/management/cashflow/fixed-outgoings,/assistant,/enclosures,/admin/facility-map`: `9 page view(s) measured … 9 skipped because the role cannot open them, 0 warning(s). No page scrolls sideways.` English only
- [ ] Browser console clean — n/a: not read; the script measures overflow and does not open the console
- [ ] Network clean — n/a: no UI change, no request inspected

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): the five above. Database paths re-run after the last apply: `check-perm-convert-settings` (291 held), `check-app-access-gate` (OK), `check-2ic-role` (313 held), `check-medical-role` (101 held), `check-volunteer-narrowing` (GREEN), `check-assistant-refused` (OK), `check-policy-role-names` (GREEN, 3 tables remain: the photo split), `check-permission-catalogue` (all ok). **Parity: before 1,913 match / 26 known / 21 mismatch, after 1,913 / 26 / 21**, the same 21 mismatch lines (`diff` empty), none of which names these tables or `assistant.record`, `translations.manage`, `facility.enclosures`, `facility.map` or `reports.cashflow`. **Not green, and not caused by this change:** `check-permission-parity` (the 21: the vet's cells and `resident.adoption_news`), `check-permission-tables` (`A cells vet`, `H vet …`), `check-perm-convert-orphans` (7: the vet's `prescription_rounds` and `frequency_rounds`), `check-maintenance-role` (1: the Head of Maintenance's bundle gained cells in the draft), all the Director's draft on dev, owned by `director-draft-apply`
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the merge

## 7. Documentation

- [x] Backlog item status extended in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead): **not ticked**, because the photo split (A3 / A5) is part of the same promise and is still open; the status says all six conversions are done and the photo split is the remainder
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `docs/decisions/2026-10-06-perm-convert-settings.md` (`facility.enclosures` rather than `facility.map`, management's two tightenings, `sees_all_translations()` and why `sees_all_residents()` alone was wrong, the closing summary of the six slices)
- [x] `README.md` still accurate: it does not describe the role model
- [ ] **Release notes.** n/a: nobody would notice: `src/` is untouched, no page, string or manual topic changed, and the two answers that moved (management reading others' assistant rows, management writing a map by hand) have no screen that did either, so `unreleased` is unchanged

- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The counts (291 checks; 1,913 / 26 / 21 both ways, the diff empty; 3 tables remaining; 76 rows read by `public_viewer` before the fix) are the scripts' output. Reasoned and worded as reasoning: that management never wrote a map through the page (confirmed in the browser: it is redirected to `/no-access`), and that no other policy asks a scope function alone (a `pg_policies` query returned none)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (SQL only, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** Read versus Edit on two cells; scope all with and without opening the app; own versus someone else's assistant row, for read and insert
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`, `/friends`) re-checked after a cache purge or a 10-minute wait — n/a: the public pages read `translations` through owner-rights views, which these policies do not touch, and `check-app-access-gate` section C reads the twelve public objects exactly as `anon`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No: nothing in `src/` changed; the assistant, the translations page, the map and the forecast read the same tables
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no row is touched; policies and one function only
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — see §3

### Rollback

- [x] Rollback position stated, **including what it does not cover** — no Worker change, so `wrangler rollback` is irrelevant. To undo: drop the new policies and `sees_all_translations()`, re-create the eight role-named ones from `0070`, `0056`, `0114` and `0142`. It does not restore anything a role has since been given a cell for and relies on through these policies

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | High, found by `check-app-access-gate` | The first version of the `translations` read asked `sees_all_residents()` alone, so `public_viewer` (scope all, legacy role not volunteer) read all 76 rows | fixed in this PR: `sees_all_translations()` also requires `roles.opens_app`; the script has the "opens no app" role |
| 2 | Low | §15 named `facility.map` for `facility_maps`; that cell is "see the map" and staff and volunteers hold it, so asking it would have opened the write to them | fixed in this PR: the policies ask `facility.enclosures` Edit, as the page and its actions do |
| 3 | Low | Management no longer writes `facility_maps` by hand (it holds `facility.enclosures` Read) and no longer reads other people's `assistant_actions` rows | accepted: no screen did either; recorded in the decision and §15 as known tightenings (the second belongs to the DB-11 decision) |
| 4 | Medium | The dev database holds the Director's draft role matrix, so several existing checks are red and the baseline cannot be GREEN | accepted: not mine to revert; before/after delta in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as staff on a phone, ask the assistant a question, then record something (move a resident): it works. Ask as a volunteer: a question works, a write is turned away as before | dev, `test.lannacare.org` |
| 2 | Signed in as management, open Management → Translations: the queue lists and a translation saves. Open the cashflow forecast and add, change and remove a fixed outgoing | dev |
| 3 | Signed in as staff, open a resident with a Thai bio: it shows its translation. Signed in as a volunteer: it does not break | dev |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-06

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; items 1 to 3 wait for someone with a login and a phone

Manual verification by: pending: a person on the assistant, Management → Translations and the cashflow forecast (items 1 to 3); Claude measured only that five pages do not scroll sideways at 375 px, which is not that person's check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the release manager reads this when the release is cut

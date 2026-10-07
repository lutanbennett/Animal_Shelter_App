# Feature test plan

## Header

| | |
|---|---|
| Feature | `0154_see_translations_cell.sql`: a Yes/No cell `translations.view` (management, staff) replaces `sees_all_translations()` as the read half of the `translations` policy; the function is dropped |
| Backlog item | `docs/backlog.md` → **A "see translations" cell, to replace `sees_all_translations()`** (ticked on this branch) |
| Branch / worktree | `claude/see-translations-cell` @ `C:\Development\Animal_Shelter_see-translations-cell` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` (throwaway management and staff logins from `check-phone-width.mjs`) |
| PR | opened from this branch; the number is recorded in the follow-up commit |
| Tested by / date | Claude (automated) / 2026-10-07 |
| Carries a migration? | yes: `0154_see_translations_cell.sql` |
| Tested at SHA | the branch tip at the commit that adds this plan |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the `translations` read policy asks `has_permission()` through a new read-only cell held by management and staff, and the scope-function stand-in goes
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0154_see_translations_cell.sql`; `src/lib/permissions/catalogue.ts` (one row); `scripts/check-perm-convert-settings.mjs`, `scripts/check-permission-tables.mjs`, `scripts/check-permission-parity.mjs`, `scripts/lib/permission-probes.mjs` (counts and a fixture); `docs/roles-and-permissions.md` (§4 row, §15); `docs/decisions/2026-10-07-see-translations-cell.md`; `docs/backlog.md`. No page, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public: **management** and **staff** read the same rows as before, now through the cell; **admin** unchanged; **vet** and **volunteer** unchanged (their own legacy policies); **`public_viewer`**, no role and signed out unchanged (refused); nobody gains a write
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: the vet's and volunteer's translations policies (`perm-convert-vet`), "one place to translate everything", letting staff translate, the checker that says a scope function must sit beside a cell, production

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` is `060c0ace`, the branch's base; nothing to merge at the time of the commit
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line, as printed:

  ```
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `migration numbers: ok — 0154_see_translations_cell.sql (against origin/main 060c0ace, highest 0153_perm_convert_admin.sql)`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `153 applied, 1 pending` on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0154_see_translations_cell.sql … ok`, the only pending file
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0154_see_translations_cell.sql … ok`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): `on conflict` for the activity and the cells, `drop policy if exists` before `create policy`, `drop function if exists`
- [x] Existing rows still read correctly after the change (checked against real dev data): `check-app-access-gate` reads the real `translations` rows as every kind of login; management opened `/management/translations` over the real queue
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness, `scripts/check-perm-convert-settings.mjs`, read / update / insert / delete on `translations` under each login's own JWT, now with a role holding only `translations.view` (reads, writes nothing) and the old "scope all, no cell" role (refused). Output, as printed:

  ```
  307 checks held, 0 failed.
  RESULT: GREEN (each table answers as its cell says; facility.map alone opens no map write; management reads only its own assistant rows)
  ```
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: reversible by the file's own header (re-create `sees_all_translations()` and the policy from `0150`, delete the two cells and the activity); no data is changed
- [x] Production apply plan stated for the release manager (which file, which project, when): `0154_see_translations_cell.sql` to production `dbkodyyxxhtygxcxmfcu`, by Lutan from the main checkout, `--dry-run` then apply, after this PR merges. `-- consumer: none`: no ordering constraint against a deploy

## 4. Functional checks

- [x] Happy path works end to end: a throwaway management login opened `/management/translations` on port 3009 (`check-phone-width.mjs --roles=management,staff --pages=/management/translations`: `1 page view(s) measured … 1 skipped because the role cannot open them`)
- [ ] Data persists — reload the page and the change is still there — n/a: no write path changed; the harness asserts each allowed update and insert matches a row
- [x] Create / edit / delete all exercised (whichever the feature has): insert, update, delete refused to a role holding only `translations.view`, allowed to `translations.manage`, as before (harness)
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI change
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no inputs
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): the boundaries are both sides of the cell: `translations.view` alone (reads, cannot write), `translations.manage` alone (reads and writes), a role that reads every resident but holds no cell and one that opens no app (the `public_viewer` shape), both refused

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | read and write `translations` | no change | allowed every command |
| management | read and write | no change (holds `translations.view` and `.manage`) | allowed every command; the page opened |
| staff | read only | no change (holds `translations.view`) | reads; update, insert, delete refused; the Translations page cannot be opened (skipped as "cannot open") |
| vet | read | no change (own scoped policy) | reads, writes nothing |
| volunteer / no role / `public_viewer` | nothing | no change | refused; `check-app-access-gate` reports 0 rows for `public_viewer` |
| signed out | nothing | no change | no grant to `anon` |

- [x] Every role above tested: admin, management, staff, volunteer and the vet by the harness under their own JWTs, `public_viewer` by `check-app-access-gate`; management and staff also in the browser; signed out by the grant, not exercised as a session
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): staff requesting `/management/translations` cannot open it; the table refusals are database refusals under the role's own JWT

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: who may read or translate does not change, so nothing a reader could see changed
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings added
- [x] Mobile viewport (375px): `check-phone-width.mjs --roles=management,staff --locales=en --pages=/management/translations`: `No page scrolls sideways.` English only
- [ ] Browser console clean — n/a: not read; no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): Management → Translations as management. Database paths re-run after the apply: `check-perm-convert-settings` (307 held), `check-app-access-gate` (`HARNESS-OK … public_viewer read 0 rows of 18 internal objects`, `translations` among them), `check-permission-catalogue` (all ok), `check-policy-role-names` (GREEN, 54 policies on 29 tables, all the vet's), `check-permission-tables` (`HARNESS-KNOWN-RED`: only the vet's `A cells vet` and `H vet …` lines, as before). **Parity** `check-permission-parity`: 1,942 match / 24 known / 21 mismatch / 5 harness faults over 249 probe runs; the 21 mismatch lines are the vet's medical cells, `photos.resident_add`, `reference.add_while_recording` and `resident.adoption_news`, and none names `translations.*`. I did not capture a "before" run of the same file, so the 1,913 / 26 / 21 in the brief is the baseline and only the mismatch count and content are comparable; the 5 faults are fixtures (`prescriptions.medication_id`, `resident_diets.diet_type_id`, `stock_receipts_one_item`) the change cannot reach
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: only `catalogue.ts` gained one row, read by the checks above
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged: `main` had not moved

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `docs/decisions/2026-10-07-see-translations-cell.md` (name and level, why the policy keeps `translations.manage` at Read, the custom-role tightening, why no probe, `public_viewer` kept out by `has_permission()`)
- [x] `README.md` still accurate: it does not describe the role model
- [ ] **Release notes.** n/a: nobody would notice: management and staff read exactly the rows they did, nobody gains or loses a page or a write, so `unreleased` is unchanged

- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The counts (307 checks; 0 rows for `public_viewer`; 54 policies; 21 mismatches) are the scripts' output. Reasoned, and worded so: that nothing else called `sees_all_translations()` (a `grep` of the repo found only `0150` and docs)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (SQL only, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** `translations.view` alone, `translations.manage` alone, neither with scope all, neither with no app opened
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`, `/friends`) re-checked after a cache purge or a 10-minute wait — n/a: the public pages read `translations` through owner-rights views, which this policy does not touch, and `check-app-access-gate` section C reads the twelve public objects exactly as `anon`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No: the only `src/` change is one catalogue row, which nothing reads for a decision yet; the Translations page still asks `translations.manage`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no row is rewritten; two cells inserted, one policy replaced, one function dropped
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — see §3

### Rollback

- [x] Rollback position stated, **including what it does not cover** — no Worker change, so `wrangler rollback` is irrelevant. To undo: re-create `sees_all_translations()` and the `translations_select_perm` policy from `0150`, delete the two `translations.view` cells and the activity row (and the catalogue row, or the catalogue check goes red). It does not undo anything an Admin later edits in the matrix

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | A custom role with scope all and no cell used to read every translation through the stand-in; it now needs `translations.view` | accepted: no such role exists; recorded in the decision |
| 2 | Low | `check-permission-parity` shows 5 harness faults and 21 mismatches on dev, all in fixtures and the vet's cells, none touching `translations` | accepted: not caused by this change; the vet's are `perm-convert-vet`'s |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as management, open Management → Translations: the queue lists and a translation saves | dev |
| 2 | Signed in as staff, open a resident with a Thai bio: it shows its translation; try `/management/translations` by address: it does not open | dev |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-07

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; items 1 and 2 wait for someone with a login

Manual verification by: pending: a person on Management → Translations as management and as staff (items 1 and 2); Claude measured only that the page does not scroll sideways at 375 px, which is not that person's check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the release manager reads this when the release is cut

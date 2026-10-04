# Feature test plan

## Header

| | |
|---|---|
| Feature | `0140_medical_jobs.sql`: the database half of the Head of Medical's three remaining jobs. Three `role_permissions` cells (`medical.weight` Edit, `photos.resident_add` Yes, `medical.diet` Read), `record_attachment()` accepting that activity with the medical-only scope enforced in the database, `medical_photo_residents` and `set_resident_drive_folder()` for the upload route, and `special_diet_list` |
| Backlog item | `docs/backlog.md` → Medical → **Head of Medical: record weight and add medical photos** and **feed special diets**. **Neither ticked**: each has an app half left (batch 47); both carry a status line naming this stream and what the screens start from |
| Branch / worktree | `claude/schema-medical-jobs` @ `C:\Development\Animal_Shelter_schema-medical-jobs` |
| Dev server | not started: this change ships no runtime code |
| PR | opened from this branch; the number is recorded in the follow-up commit that ticks CI |
| Tested by / date | Claude (automated) / 2026-10-04 |
| Carries a migration? | yes: `0140_medical_jobs.sql` |
| Tested at SHA | the branch tip at the commit that adds this plan, on `main` @ `988c0350` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog items asked for: one migration lets the Head of Medical record a weight, file a Medical photo and read the non-standard diets, in the database, with a script showing each under her own JWT and showing staff, management and the volunteer unchanged
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0140_medical_jobs.sql`; `scripts/check-medical-jobs.mjs` (new); `scripts/check-medical-role.mjs` (two weight probes and the cell comparison, since the role now holds `medical.weight`); `docs/decisions/2026-10-04-medical-jobs-schema.md`; `docs/backlog.md` (two status lines, one "Open:" answered); this plan. No `src/`, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public: **the Head of Medical** gains weight (Edit), resident photos in Medical, and the special-diet list; admin, management, staff and vet unchanged, proved by the script's controls (the legacy `record_attachment()` role list is kept as it was); the volunteer still refused everything; signed out has no grant on the two views or either function
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: the three screens, the jobs and their tiles in `jobs.ts` (batch 47), the photo route changes, the manual and the release line; production
- [x] Overlap with the other live stream (`medical-round-screens`, batch 46) checked: it builds on `0137`–`0139` and needs nothing from this file; it was told so

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync`: `origin/main` merged in cleanly (`Already up to date.`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines, as printed:

  ```
  === gates: build exited 0 after 164s

  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `main` tops out at `0139_round_helper_revokes.sql`; the brief gave this branch the slot; `check-migration-numbers` reports `0140_medical_jobs.sql` against `origin/main 988c0350`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `139 applied, 1 pending` on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0140_medical_jobs.sql … ok`, with the expected warning that the declared consumer `src/lib/diets/special-list.ts` is not on `origin/main` (batch 47 writes it). It depends on no other pending file
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0140_medical_jobs.sql … ok`, from this branch
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): `on conflict do nothing` on the cells; `create or replace` on the three functions and two views; the grants restated. Not replayed a second time against dev beyond the `--dry-run` before the apply
- [x] Existing rows still read correctly after the change (checked against real dev data): `check-medical-role` (101 checks), `check-perm-convert-medical` (241), `check-volunteer-narrowing` (55 rights) and `check-permission-parity` all still pass after the apply; the role-list functions behave as before for admin, management, staff and vet (the new script files a photo as each of them)
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness, `scripts/check-medical-jobs.mjs`, with a login per role under each role's own JWT. Asserted, among 157 checks: the Head of Medical reads, adds and corrects a weight and the volunteer, a login with no role and an out-of-clinic vet cannot; she files a Medical photo (also written ` medical `) and is refused another folder, no folder, an adopter's photo and a procedure file, while staff files in any folder; `set_resident_drive_folder` fills a missing folder and leaves an existing one alone, and the volunteer cannot call it; `special_diet_list` returns the non-standard diet with the size-default amount (7 g), the resident's own amount (11 g) and the rounds, and never the standard diet or an ended one; no price, stock or breed column exists on either view; she still cannot read `residents`, `medication`, `diet_types`, `attachments`, `procedures` or write a visit; her `role_permissions` equal `jobs.ts` plus the three cells granted ahead. Output, as printed:

  ```
  157 checks held, 0 failed.
  RESULT: GREEN (weight, medical photos and special diets work for the Head of Medical and no one else gained or lost)
  ```

  The older script that asserted she could not read a weight failed on exactly those two probes (`FAIL weight as hom: refused — got 1`, `FAIL insert weight as hom: refused — got 1`) and on the cell comparison once the migration was applied, then went green when updated: `101 checks held, 0 failed.` The checks therefore do react to the change.
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: the file header names the undo (drop two views and two functions, restore `record_attachment()` from `0134`, delete three cell rows); the role has no login in use, so nothing is lost by leaving it in place
- [x] Production apply plan stated for the release manager (which file, which project, when): `0140_medical_jobs.sql` to production `dbkodyyxxhtygxcxmfcu`, by Lutan from the main checkout, `--dry-run` then apply, after this PR merges. It needs `0136` applied first (the role row). No ordering constraint against a deploy: nothing in `src/` reads the new objects

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; the database happy path for each job is asserted by the script
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface; weight insert and correction and photo filing are exercised by the script, delete is not an act the role has
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI surface; the function's refusals ("This login can add photos to the Medical folder only.") are asserted as refusals
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no inputs; the boundaries that exist (folder case and spaces, no folder, a diet ended ten days ago, the standard diet, a resident's own amount against the size default) are in the script

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no route changed | no change | allowed everything the script asserts for staff and above |
| management | n/a: no route changed | no change | same |
| staff | n/a: no route changed | no change | same; files a photo in any folder as before |
| vet | n/a: no route changed | no change | weight and photos inside its own clinic as before; the two new views and `set_resident_drive_folder` give it nothing (`sees_all_clinical()` is false) |
| head of medical | weight, Medical photos, the diet list, through the objects above | allowed | allowed under her own JWT |
| volunteer | n/a | still refused | refused every probe |
| signed out | n/a | no change | no `anon` grant on the views or functions |

- [x] Every role above tested: the principals by the script, signed out by the grants (`revoke all` on both views and both functions)
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): the refusals are database refusals under the role's own JWT

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing visible; the manual changes with the screens
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — no page loaded: nothing in `src/` reads the new objects. The paths this could disturb are `record_attachment()`'s callers (resident, blood-test and procedure uploads), kept by the legacy role list and re-run in the script for admin, management, staff and vet; plus `check-medical-role`, `check-perm-convert-medical`, `check-volunteer-narrowing` and `check-permission-parity`, all green after the apply
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — `Already up to date.`; nothing to merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead): deliberately **not** ticked: each item has its screen left; both carry a status line, and the diets item's "Open:" is answered
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `docs/decisions/2026-10-04-medical-jobs-schema.md`: why the weight needs no new policy, the existing activity, the database-enforced medical-only scope, what the upload route reads that she cannot, the diets view, why the cells come before the screens, and what batch 47 starts from
- [x] `README.md` still accurate: it does not describe the role model
- [ ] **Release notes.** n/a: nobody would notice: the role has no login in use and no screen reads the new objects, so nothing a shelter user can see or do changes. The release line belongs to the screens
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The counts are the scripts' output. Reasoned, and worded as such in the decision file: the deceased lock holding for her login (a definer lookup, read from `0026`, not driven)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (SQL only, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: the one date comparison, the diet's start and end, uses `shelter_today()` (`0073`) and is asserted on days well clear of the boundary
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold; the boundary that exists, the Head of Medical versus the volunteer and the folder rule, is asserted from both sides
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public view changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No: nothing in `src/` reads the new objects yet. The readers (batch 47) must deploy after this is applied to production
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: it adds objects and three cell rows and replaces one function body; no row of resident data is touched
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — see §3

### Rollback

- [x] Rollback position stated, **including what it does not cover** — no Worker change, so `wrangler rollback` is irrelevant. The migration is safe to leave in place. To undo, follow the file header; rolling back the function restores the four-role list, and the three cells can be deleted without affecting any row of data

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium, found by this work | The existing resident-photo route reads and updates `residents` and `resident_current_state`, none of which the role can read, so granting the cell and fixing `record_attachment()` alone would have given her a permission she could not use | fixed in `0140` (`medical_photo_residents`, `set_resident_drive_folder`); the route's change is batch 47's, written up in the decision file |
| 2 | Low | A first photo she files becomes the resident's in-app profile photo when there is none, as it does for staff | accepted: unchanged behaviour; the public views already exclude Medical (`0103`) |

## Left for manual verification

Nothing in this change has a surface a person needs to look at: no screen, route or string.

| # | What to check | Where |
|---|---|---|
| — | — | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-04

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person. The list is empty

Manual verification by: n/a: no UI surface, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the release manager reads this when the release is cut

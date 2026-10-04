# Feature test plan

## Header

| | |
|---|---|
| Feature | `0134_volunteer_narrowing.sql`: R1's database half. The volunteer keeps who and where and the enclosures; its policies are dropped, `volunteer` leaves five definer role lists, five owner-rights views stop letting it through, its seeded cells shrink from 24 to 3. Nobody holds the role (Lutan, 2026-10-04) |
| Backlog item | `docs/backlog.md` → Auth → **Roles build, then one role at a time**. **Not ticked**: R1's app half (`volunteer-read-only`) and five more roles remain; the item carries a status line naming this stream |
| Branch / worktree | `claude/volunteer-schema` @ `C:\Development\Animal_Shelter_volunteer-schema` |
| Dev server | not started: this change ships no runtime code |
| PR | opened from this branch; the number is recorded in the follow-up commit that ticks CI |
| Tested by / date | Claude (automated) / 2026-10-04 |
| Carries a migration? | yes: `0134_volunteer_narrowing.sql` |
| Tested at SHA | the branch tip at the commit that adds this plan, on `main` @ `6ee07cc3` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: one migration takes every right but "who a resident is and where it lives, and the enclosures" away from the volunteer, in the database, and a script shows each removed right refused under a volunteer's own JWT
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0134_volunteer_narrowing.sql`; `scripts/check-volunteer-narrowing.mjs` (new); `scripts/check-permission-parity.mjs` and `scripts/lib/permission-probes.mjs`; eight older rollback harnesses that asserted the volunteer's old rights (`check-permission-tables`, `check-role-can`, `check-adoption-updates`, `check-placement-guards`, `check-role-write-policies`, `check-stock-receipts`, `check-stocktake`, `check-vet-resident-scope`, `check-vets-readonly`); `docs/roles-and-permissions.md` (§4 volunteer column, C9 closed); `docs/decisions/2026-10-04-volunteer-narrowing.md`; `docs/backlog.md`; this plan. No `src/`, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public: **volunteer** narrowed; admin, management, staff, vet unchanged and proved so by the script's controls. No login holds `volunteer` on dev (4 admin, 2 management, 6 staff, 4 vet, read 2026-10-03) or production (Lutan, 2026-10-04), so nobody lost anything. The 2IC, Head of Maintenance and Head of Medical, which do not exist yet, will borrow this floor
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: every screen, the manual, the walkthrough's volunteer pass and the release line (`volunteer-read-only`, batch 44); the app predicates still saying a volunteer may count stock and so on (eleven, listed in `APP_PENDING`); the convert of medical tables (`perm-convert-medical`, `0135`); production

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync`: `origin/main` merged in cleanly (`Already up to date.`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines, as printed:

  ```
  === gates: typecheck exited 0 after 12s
  === gates: lint exited 0 after 70s
  === gates: build exited 0 after 47s
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `main` tops out at `0133_role_can.sql`; the brief gave this branch the slot; `check-migration-numbers` reports `0134_volunteer_narrowing.sql` against `origin/main 6ee07cc3`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `133 applied, 1 pending` on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0134_volunteer_narrowing.sql … ok`, with the expected warning that the declared consumer `src/lib/residents/who-and-where.ts` is not on `origin/main` yet (the app half reads the new view). It depends on no other pending file
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0134_volunteer_narrowing.sql … ok`, from this branch. A later edit to the file added only the five view `grant` lines the migration-grants lint asked for (a no-op against dev, which already held them); the edited file was then replayed in a `begin; … rollback;` against dev and ran clean
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): `create or replace` on the view, functions and five views; `drop policy if exists`; `alter policy`; `delete … where` the volunteer's non-kept cells. The replay above is the proof; one caveat is stated in the file: a re-run after a shelter has re-granted a volunteer cell in Settings would delete it again
- [x] Existing rows still read correctly after the change (checked against real dev data): management and staff still read every table the volunteer lost, over dev's real rows (`check-volunteer-narrowing.mjs`: 53 of 55 rights show a control; the other two are the view gated to volunteers only and `immunization_duplicate_check`, which has no rows on dev); `check-role-write-policies`, `check-user-roles-aal2`, `check-audit-log`, `check-contact-visibility`, `check-medical-archive-roles`, `check-public-views`, `check-public-paths`, `check-recurring-jobs`, `check-recurring-job-eligibility`, `check-resident-microchip` and `check-unit-conversions` all still pass after the apply
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness, `scripts/check-volunteer-narrowing.mjs`, with a login per role under each role's own JWT. Asserted: **55 removed rights each refused for the volunteer** (44 reads of tables and views, 6 writes, the 5 functions, by their own refusal text) **and staff or management still allowed**, the volunteer's three kept rights working, `resident_who_and_where` returning nothing to staff or management and having exactly its 14 fixed columns, only `volunteer_read_enclosures` and `volunteer_read_zones` naming the volunteer, only `has_app_access()` and `reassign_recurring_job()` still saying `'volunteer'` in a function. Output, as printed:

  ```
  55 removed rights, each under the volunteer's own JWT: 55 refused.
  53 of them also checked that management or staff still has the right (1 tables had no rows on dev to check that against: read immunization_duplicate_check).

  RESULT: GREEN (every removed right refused; every kept right works; nobody else lost anything)
  ```

  **It can fail, and was seen to.** Before the apply, the same script (volunteer still holding everything) was red on every case; after the apply, three removed rights were put back one at a time inside the rolled-back transaction:

  ```
  == VOLUNTEER_RESTORE=weight        FAIL read weight: the VOLUNTEER WAS ALLOWED
                                    FAIL policies that still name the volunteer: volunteer_read_enclosures,volunteer_read_weight,volunteer_read_zones
  == VOLUNTEER_RESTORE=stocktake    FAIL fn record_stocktake: the VOLUNTEER WAS ALLOWED
                                    FAIL functions that still say 'volunteer': has_app_access,reassign_recurring_job,record_stocktake
  == VOLUNTEER_RESTORE=translation_queue   FAIL read translation_queue: the VOLUNTEER WAS ALLOWED
  ```
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: nobody holds the role, so there is no access to give back; restoring a right is a policy or a list entry, and the file header names where each original came from (`0001` and later, `0013`, `0091`, `0095`, `0108`, `0126`, `0132`). A down-migration would be a second copy of 40 policies for a role with no logins
- [x] Production apply plan stated for the release manager (which file, which project, when): `0134_volunteer_narrowing.sql` to production `dbkodyyxxhtygxcxmfcu`, by Lutan from the main checkout, `--dry-run` then apply, after this PR merges. No production volunteer login exists, so there is no ordering constraint against a deploy; the app half (`volunteer-read-only`) must not deploy before this is applied, since it reads `resident_who_and_where`. Production's `role_permissions` volunteer rows are deleted by the file (21 of 24); they are audit-logged with no actor

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; the database happy path (a volunteer reads a resident, its enclosure and zone names through the new view) is asserted by the script
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface; the volunteer's six write attempts (add and remove a photo, maintenance photo, project photo, the move, an assistant action) are each refused by the script, and the same writes are allowed for staff and management
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI surface; the five functions refuse a volunteer with their existing sentences ("Not authorized to …"), which the script matches
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no inputs; the boundary that exists is which roles pass each list, asserted from both sides (volunteer refused, staff and management allowed)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no route changed | no change | admin allowed every case: the script treats an admin refusal as a broken fixture and stops |
| management | n/a: no route changed | no change | allowed every right the volunteer lost (script controls); 48 cells still equal §4 |
| staff | n/a: no route changed | no change | allowed every right the volunteer lost (script controls); 37 cells still equal §4 |
| vet | n/a: no route changed | no change | the five views still admit a vet inside its clinic's scope (definition kept, `distinct from 'vet'` clause untouched); `check-vet-resident-scope` and `check-vets-readonly` pass |
| volunteer | resident through `resident_who_and_where`, enclosures, zones | everything else refused | 55 of 55 refused under its own JWT; 3 kept rights work |
| signed out | n/a: no route changed | no change | `anon` has no grant on the new view, and the five views' `anon` position is unchanged |

- [x] Every role above tested: the four roles that hold logins by the script's controls; vet by the two existing vet harnesses; signed out by the grant (no `anon` grant on `resident_who_and_where`, asserted by the migration's `revoke all`)
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): the volunteer's refusals are database refusals under its own JWT (42501, zero rows, or the function's own exception), not a hidden button

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change; the volunteer's nav is `volunteer-read-only`'s
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing visible; the manual changes with the screens, in `volunteer-read-only`
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — no page loaded: nothing in `src/` references the new view. What this could have disturbed is the staff-and-above paths through the tables and functions it touched, so the harnesses that exercise them were re-run after the apply and, where they asserted the volunteer's old rights, rewritten to assert the refusal: `check-stocktake`, `check-stock-receipts`, `check-adoption-updates`, `check-placement-guards`, `check-role-write-policies`, `check-vets-readonly`, `check-vet-resident-scope`, `check-permission-tables`, `check-role-can`. Each ends in its pass line. `check-vet-doctors` fails on a `FAIL A 1 linked visits disagree with the list` data assertion that reads as the superuser, so no policy of this change can reach it; recorded under Defects. `check-access-requests-card` needs a running dev server and was not run
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — `Already up to date.`; nothing to merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead): deliberately **not** ticked: R1's app half and five more roles remain; the item's status line names this stream and what `volunteer-read-only` must do (read through the view, empty `APP_PENDING`)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `docs/decisions/2026-10-04-volunteer-narrowing.md`: it was seven function lists, not five (and which two are not rights), the five views, what the volunteer keeps, what was dropped beyond §12's list, the closed tightenings, and what the script covers and cannot
- [x] `README.md` still accurate: it does not describe the role model
- [ ] **Release notes.** n/a: nobody would notice: no login holds the volunteer role on test or production, so no shelter user loses anything and none sees a change. This is not rights taken from people; it is the floor the 2IC and both Heads will stand on. The release line for what a future volunteer sees belongs to `volunteer-read-only`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The counts (55 rights, 53 controls, 1,920 matches, 40 known, 21 cells) are the scripts' output. Reasoned and worded as such in the decision file: that the three helper functions left callable return nothing §5 withholds, and that a future permissive table is out of this script's reach

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (SQL only, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold; the boundary that exists, volunteer versus staff and management, is asserted from both sides for every right
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public view changed; `check-public-views` and `check-public-paths` pass

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No: nothing in `src/` reads `resident_who_and_where` yet. The reader (`volunteer-read-only`) must deploy after this is applied to production
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees). Worth reading for one thing: that no production login holds `volunteer`, which Lutan has said and a read would confirm
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: it deletes 21 seeded cells and drops policies, all re-creatable from the files named in its header; no row of resident data is touched
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — see §3

### Rollback

- [x] Rollback position stated, **including what it does not cover** — no Worker change, so `wrangler rollback` is irrelevant. The migration is safe to leave in place. To restore a right, re-create its policy or list entry from the file named in the header and re-insert its cell; nothing about residents' data changes either way

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium, found by this work, fixed in it | Five owner-rights views (`translation_queue`, `immunization_compliance`, `immunization_duplicate_check`, `current_placement`, `resident_current_state`) excluded only vets, so a volunteer would have read translation text, immunization state and the carer through them once its policies were dropped | fixed in `0134` |
| 2 | Low, not a defect of this change | `check-vet-doctors.mjs` fails `A 1 linked visits disagree with the list` on dev data; it reads as the superuser, so nothing in this change can reach it | deferred: Lutan to decide whether to file it on the `backlog` branch |
| 3 | Low | Layer 2 of the parity check (the app's predicates) still says a volunteer may do eleven things the database now refuses | accepted: listed in `APP_PENDING`, which fails when an entry stops differing; it is `volunteer-read-only`'s checklist |

## Left for manual verification

Nothing in this change has a surface a person needs to look at: no screen, route or string, and nobody holds the role.

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

Manual verification by: n/a: no UI surface and nobody holds the role, so there is nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the release manager reads this when the release is cut

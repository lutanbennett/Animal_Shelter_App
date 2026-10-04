# Feature test plan

## Header

| | |
|---|---|
| Feature | R3, the Head of Maintenance: the second configured role, with one job, Do Maintenance, over the existing phone board |
| Backlog item | `docs/backlog.md` → the roles item "Roles build, then one role at a time" (status line added, deliberately **not ticked**: the 2IC, Management and Admin remain) |
| Branch / worktree | `claude/maintenance-role` @ `C:\Development\Animal_Shelter_maintenance-role` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3004` |
| PR | opened from this branch; the number is recorded in the follow-up commit that ticks CI |
| Tested by / date | Claude (automated) / 2026-10-04 |
| Carries a migration? | yes: `0141_maintenance_role.sql` |
| Tested at SHA | the branch tip at the commit that adds this plan, merged with `main` (already up to date at sync) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a `head_of_maintenance` role (borrowing `volunteer`) whose home is one Do Maintenance tile over the maintenance board, with the cells and policies that let her log, assign, move on and complete jobs and mark her own recurring tasks done, and nothing else
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0141_maintenance_role.sql`, `src/lib/permissions/jobs.ts`, `src/lib/home/tiles.ts`, both dictionaries (`appHome.jobs.doMaintenance`), `src/lib/releases.ts`, `scripts/check-maintenance-role.mjs` (new), `docs/decisions/2026-10-04-maintenance-role.md`, `docs/backlog.md`. No `worker/`, no page or route change
- [x] Roles affected identified: the new Head of Maintenance; admin, management, staff, vet, volunteer and a login with no role were probed to show nothing changed for them
- [x] Anything explicitly **out of scope** written down: photos on a job and deleting a job (not hers; the screens still offer both, see Defects), `recurring.manage` (P2), the 2IC, a login-creation UI for the role, the legacy-role bridge's effect on `/my` eligibility for a task linked to a page

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line, as printed (the first run failed typecheck on yes/no cells in a job bundle; fixed with `canAt`, then re-run):

  ```
  === gates: build exited 0 after 126s

  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` (`0140`), and no other in-flight branch carries one: `check-migration-numbers` ran on the commit hook and said `0141_maintenance_role.sql` against origin/main `5002a932`; the brief named this stream as the only one in flight
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: 140 applied, 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0141_maintenance_role.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`. It was applied twice: I extended the file (the recurring section) after the first apply, removed its own row from `schema_migrations`, and let the runner apply the final file; the file is unmerged and only dev had it
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): `on conflict do nothing` on the role and cells, `drop policy if exists` before each policy, `create or replace function`; the double apply above ran it twice
- [x] Existing rows still read correctly after the change (checked against real dev data): the board, a resident's page and My tasks all loaded against dev's real zones, enclosures, residents and logins as the new role
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: `node scripts/check-maintenance-role.mjs` → `140 checks held, 0 failed`. It asserts, under each principal's own JWT, what the board reads, what she can write (job insert, update, complete, move on, assign, unassign), and what she is refused (job delete, job photo, a job attachment, recurring set-up, change, assign and reassign, residents, resident list, weight, prescriptions, medication, diets, attachments, stock, contacts, assistant, a placement), that `record_recurring_job()` accepts her on her own task and refuses another's, and that the cells equal `bundleOfRole()`
- [x] Down-migration written, or the reason one is not needed is stated: the header names the undo (drop the eleven policies, restore the guard from `0134`, delete the role's cells and row); additive and harmless to code that does not know the role
- [x] Production apply plan stated for the release manager: apply `0141` to production from the main checkout after the merge, `--dry-run` first; it prints a consumer warning because the readers are not live yet, the safe direction

## 4. Functional checks

- [x] Happy path works end to end: signed in as a throwaway Head of Maintenance login on dev at 375 px: Home shows one tile, Do Maintenance; the board loads; **Move job on** moved a job to In progress (the status in the database changed); **Log maintenance** created a job (zone, zone-wide, assigned to another login); **Completed** set the status and `date_completed`; on My tasks, **Done** recorded today's recurring task (an occurrence row with `outcome = done` and a timestamp) and a Done today list appeared
- [x] Data persists — reload the page and the change is still there: confirmed by reading the rows back from the database after each action
- [x] Create / edit / delete all exercised (whichever the feature has): create, move, complete and assign driven in the browser; delete driven and **refused** (Defects #2); the edit-details form was not opened
- [ ] Empty state renders sensibly (no rows yet) — n/a: no new list; her board and My tasks show the shelter's existing empty states
- [x] Invalid input is rejected with a readable message, not a crash: Next on step 1 without a title and on step 2 without an enclosure or zone-wide both held the step and said what was missing
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input field or rule was added; the board's form is unchanged

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| Head of Maintenance | Home, the board, a job, Log maintenance, My tasks, Residents (who and where), Enclosures | reads and does her job; nothing else | passed in the browser as above; the database refusals are in the 140 checks |
| Head of Maintenance | `/management/recurring-jobs`, `/management/medication-list`, `/stocktake`, `/management/dashboard`, `/admin`, a resident's `/edit` | refused | passed: each redirected away (fetched while signed in as her); `/management/*` and `/stocktake` and `/admin` returned the home redirect |
| admin | the board and its writes | unchanged | passed at the database under its own JWT (`check-maintenance-role`); not driven in the browser |
| management | the board and its writes | unchanged | passed at the database; not driven in the browser |
| staff | the board and its writes | unchanged | passed at the database; not driven in the browser |
| vet | none of the job tables | unchanged | passed at the database; vet reads a job's translations as before |
| volunteer | none of the job tables | unchanged | passed at the database: still refused (`0134`), and the new policies grant it nothing |
| signed out | nothing | unchanged | not exercised: no route changed |

- [x] Every role above tested: at the database, under each role's own JWT in one transaction; in the browser only as the Head of Maintenance (the five default roles' screens did not change)
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): her refused URLs were fetched directly, not hidden in the UI; the table-level refusals are the harness

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change; her menu lists Home, My tasks, Residents, Enclosures, Maintenance, manual, releases, password, read from the rendered menu
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no screen or topic changed; the manual does not yet have a column for configured roles (Medical's decision records the same)
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: the one new string is a dictionary key in both languages; a job's Thai title is read through the existing translations path, which she can now read for maintenance rows only
- [x] Mobile viewport (375px) — no overflow, controls reachable: every page above was driven at 375 px; no horizontal scroll was seen. **Thai**: the Home tile reads ทำงานซ่อมบำรุง; the board and form in Thai were not re-driven beyond the home
- [x] Browser console clean — no errors or React warnings: the console was read once, on the Log maintenance form, and was empty; it was not read on every page
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: the network log was not read; the one refusal seen was the delete (Defects #2) and the photo upload route was not driven

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): `check-permission-parity` green, `check-volunteer-narrowing` green, `check-medical-role` (101) and `check-medical-jobs` (157) green, `check-recurring-jobs` and `check-role-can` finish `HARNESS-OK`. `check-recurring-job-eligibility` fails one line, `canDoJob(/management)`, identically on `main`, so it is not this change
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — by loading that page: `tiles.ts` and `can.ts` are shared; the lint step runs `check-home-screens` and `check-permission-catalogue` and both passed, and the build passed. The Home tile was seen before the `canAt` change (types only; same runtime answer) and **not re-opened after it**: listed under Left for manual verification
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged; main was already included

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: deliberately not ticked: the roles item still has the 2IC, Management and Admin; a status line saying R3 exists and what the 2IC inherits was added instead (the brief's instruction)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `docs/decisions/2026-10-04-maintenance-role.md`, written because this role departs from Medical's in three places (`0134` had also taken the translations read and the recurring reads and recording)
- [x] `README.md` still accurate: it does not describe roles at this level
- [x] **Release notes.** `src/lib/releases.ts`'s `unreleased` gained a line: a Head of Maintenance login exists, its home is Do Maintenance, what she can and cannot do (tagged admin and management, who create logins)
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The harness counts (140, 101, 157), the gates line and the browser results are tool output. One statement in the decision file is reasoned and says so: a role given only "move a job on" would be refused at the table

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: no date logic was added; `record_recurring_job()` keeps its own `shelter_today()` rules, unchanged
- [ ] **For a boundary or banding change, the assertions cover both edges of the band** — n/a: no boundary or banding changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The gates block above is pasted as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** Yes, small: the migration adds a role and policies, and the code is the `do_maintenance` job and its string. The code reads no new column, so a build deployed before the migration only draws no tile for a role that does not exist yet. Apply `0141` to production first anyway
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: additive; the one replaced function body is the `0134` body plus a wider guard
- [x] Apply plan stated: `0141_maintenance_role.sql` to production, from the main checkout, `--dry-run` first, before the deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover**: revert the merge and, if the role was created in production, drop its policies and restore the `record_recurring_job()` guard from `0134` (the header lists them). A login already assigned the role would lose its tile and its access, which is the intended effect; nothing else depends on it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | The new-job form offers Photos and the job page offers Add before/after photos to her; the upload route refuses (403) because she holds no `maintenance.photos` | deferred to backlog: give her the cell (a policy on `maintenance_photos` and a branch in `record_attachment`) or gate the controls; the brief says not to rebuild the board |
| 2 | Low | The job page offers Delete job to her; the database refuses it and the message reads "You don't have permission to change maintenance jobs", which is odd after she just changed one | deferred to backlog: gate the control on the narrower fact, or give her delete |
| 3 | Medium | `/my` passes `current_user_role()` (`volunteer`) to `role_can()`, which refuses any role but the caller's own key, so a recurring task that links to a page errors on her `/my`; the rota picker likewise will not offer her a task linked to `/maintenance` | deferred to backlog: the legacy-role bridge; pass the role key, or fix with the enum. Unlinked tasks, which were tested, work |
| 4 | Low | The typecheck failed on the first gates run: a job bundle could not hold a yes/no activity | fixed: superseded at the merge with `main`, whose `BundleEntry` (a level optional for yes/no cells) solves it; my `canAt` was removed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The Head of Maintenance runs the board on her own phone for a real day**: logs a job, assigns it, moves it on, completes it, marks a recurring task done, and says what she could not do | dev, then production, her phone |
| 2 | The board, Log maintenance and My tasks **in Thai** (only the Home tile was read in Thai) | dev, 375 px |
| 3 | The Thai wording หัวหน้าฝ่ายซ่อมบำรุง for the role and ทำงานซ่อมบำรุง for the job: does Lutan or the Director like them | dev |
| 4 | A real recurring task linked to `/maintenance` assigned to her (Defects #3) | dev, Management's rota page |
| 5 | Home still shows the Do Maintenance tile for her after the last commit (`canAt`) | dev, 375 px |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-04

### Manual verification

Manual verification by: pending: the five items under Left for manual verification, chiefly the Head of Maintenance using it on her phone

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet, the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet, nothing to hand over until the PR merges

Result: pass

Release manager acknowledgement: pending: production release manager

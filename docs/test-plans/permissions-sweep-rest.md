# Feature test plan

## Header

| | |
|---|---|
| Feature | `permissions-sweep-rest`: every remaining role list, predicate and inline role test in `/admin`, `/management`, contacts, `/vets`, enclosures, maintenance, projects, the assistant, the menu, My tasks and `eligibility.ts` moved onto `can()` / the route registry; manual topics and acceptance rows name an activity |
| Backlog item | `docs/backlog.md` → Auth → **Roles build, foundation 3**, F2 sweeps. Not ticked: the status line now says the three sweeps are complete and `home-screens` is what is left |
| Branch / worktree | `claude/permissions-sweep-rest` @ `C:\Development\Animal_Shelter_permissions-sweep-rest` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3015` (started once for a signed-out smoke test; no role login was available) |
| PR | recorded in the follow-up commit that ticks CI |
| Tested by / date | Claude (automated) / 2026-10-04 |
| Carries a migration? | no |
| Tested at SHA | 156127a1 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the brief: the F2 sweep's last area, truth tables captured first, `eligibility.ts`'s three remaining rules taken per `role-can-app`'s handover
- [x] Files/areas touched listed: `src/app/{admin,management}/**` (guards only), `src/app/{maintenance,projects,contacts,vets,enclosures,assistant,my,deliveries,releases,e}/**`, `src/app/{NavPane,NavLinks,AppHeader}.tsx`, the projects and maintenance photo routes, `src/lib/{permissions/{routes,require},recurring-jobs/eligibility*,assistant/data,contacts/visibility,adoption-updates,auth,maintenance,projects,my-tasks,shelter-friends,manual}`, `scripts/{check-permission-parity,check-recurring-job-eligibility,acceptance-matrix}.mjs`, `scripts/lib/acceptance-matrix-entries.mjs`, the fixture, a decision file, README and the backlog status line. No `supabase/`, no `worker/`
- [x] Roles affected identified: all five signed-in roles, since the menu and every page guard changed. Intended change for any of them: none. The one refusal that moves is invisible (see section 7)
- [x] Anything explicitly **out of scope** written down: no policy or migration; `hasAppAccess` and the vet's landing, `ASSIGNABLE_ROLES`, and the blood-test and procedure file routes stay (decision file, decision 5). Of the translations stream, this PR took the **guard** on `/management/translations` (`requirePermission("translations.manage")` and the two actions); the cron Worker and the page body are theirs and had merged already

## 2. Automated gates

Run in the feature worktree, after `node scripts/worktree.mjs sync`, with
`node scripts/gates.mjs`.

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; two conflicts (`legacy-predicates.json`, `[section]/page.tsx`) resolved by hand: the fixture is the union of both streams' rows, and the page keeps `-medical`'s `can(perms, "medical.archive")` beside this PR's contacts-scope lines
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines pasted below, as printed:

  ```
  === gates: build exited 0 after 82s
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR (0134 stays free)
- [ ] `--status` reviewed — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised in a rollback harness — n/a: no migration; `node scripts/check-role-can.mjs` was re-run and ends `HARNESS-OK 0133_role_can.sql asserted live`
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end: `node scripts/check-permission-parity.mjs` ends `RESULT: GREEN` before the first edit and after the last (twice: before and after the merge of `main`). Layer 2 now carries 35 predicates; the new rows (`isShelterRole` paired with six activities, `isAdminRole` with five, `canReadRecurringJobs` against the seeded `opens_app`, `contactRelation` against the seeded contacts scopes) were written to the fixture **before** their functions were deleted
- [x] `node scripts/check-recurring-job-eligibility.mjs`: every `canDoJob(<link>)` row equals the table written before the conversion, including `/management`, `/admin` and `/maintenance`; S1 now asserts the cells are exactly what the registry registers
- [x] `node scripts/check-permission-catalogue.mjs` ends `all ok`: every one of the 26 new registered pages guards with `requirePermission` for its entry's activity (and level)
- [x] `node scripts/acceptance-matrix.mjs --check` ends ok: 34 manual topics now carry an `activity`, 46 rows a `needs`, and each tag equals the seeded holders
- [ ] Data persists — n/a: nothing is written by this change; every write sits untouched below its guard
- [ ] Create / edit / delete — n/a: nothing is written by this change
- [ ] Empty state renders sensibly — n/a: no new UI surface; the Management and Settings grids now filter their tiles, and for the six roles the filtered set equals today's (the registry has an entry for every tile)
- [x] Invalid input is rejected with a readable message, not a crash: every action keeps its existing refusal wording; `can()` fails closed (catalogue check, group C)
- [x] Boundary cases checked: Staff holds Read on `contacts.directory` and `clinics.list` but not Edit, so Management's contacts and vets pages must stay refused for Staff (the registry entries omit `level`, which opens at Edit; the parity pairing `canManage`/`reports.dashboard` and the eligibility truth table for `/management` hold); a volunteer must still *open* the maintenance board (Read) but not be offered work on it (`jobLevel: "edit"`; `canDoJob(/maintenance)` is false for a volunteer, asserted)
- [x] Signed-out smoke on the dev server: `/management`, `/admin`, `/maintenance`, `/contacts`, `/vets`, `/management/translations`, `/assistant` and `/enclosures` all redirect, and the server log shows no errors

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | unchanged | asserted by script (parity layer 2, eligibility tables); pages not driven |
| management | Management, not Settings; the shared pages | unchanged | asserted by script; pages not driven |
| staff | the shared pages, Stocktake and Deliveries; not Management, not Settings | unchanged | asserted by script; pages not driven |
| vet | Residents and appointments only | unchanged: no menu entry, shared pages refused | asserted by script; pages not driven |
| volunteer | the shared pages read-only, Stocktake, My tasks | unchanged | asserted by script; pages not driven |
| signed out | any guarded URL | redirect | driven: see the smoke test above |

- [ ] Every role above tested — n/a: each role's answer is asserted by the parity and eligibility checks from the seeded cells; no role login was available to drive pages, so the browser pass is under Left for manual verification
- [ ] A role that should not have access is blocked server-side — n/a: the guards are the same activity test the database's cells say; `requirePermission` refuses through the same `refuse()` as `requireRole` did; listed under manual verification for a person to drive

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`): its props are now one boolean per link, computed in `NavPane` from the registry; reads as before for the six roles
- [x] Manual updated: 34 topics gained `activity` (and `activityLevel: "read"` for the read-level ones); no wording changed
- [ ] Translatable strings — n/a: no new people-facing string
- [ ] Mobile viewport (375px) — n/a: no new UI surface
- [ ] Browser console clean — n/a: no signed-in page was loaded; nothing renders differently
- [ ] Network clean — n/a: no signed-in page was loaded. One cost to know: the rota page asks `role_can()` about ~25 cells for each assignable role (about 100 calls, in parallel), up from 12 calls; My tasks asks only about its own jobs' pages (decision file, decision 2)

## 6. Regression

- [x] The pages nearest the change still compile and build: all of the above, via typecheck and the production build (section 2)
- [ ] Any shared file touched checked from a second, unrelated page — n/a: `NavLinks`, `NavPane`, `AppHeader`, `routes.ts`, `require.ts` and the manual are shared by every page, and every page built; no signed-in page was driven, so the menu is the first thing on the manual list
- [x] Nothing merged from `main` during `sync` was broken by this branch: the gates and checks were re-run after the merge

## 7. Documentation

- [ ] Backlog item ticked — n/a: the roles item is deliberately not ticked (brief); its status line was updated to say the three sweeps are complete
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-04-permissions-sweep-rest.md`
- [x] `README.md` still accurate: the vet row named `isShelterRole`, which is deleted; reworded
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: behaviour is unchanged by design for all five roles. The only refusal that moved is a vet posting a project or maintenance photo by hand: it is now refused before the upload instead of by the database after it, and a vet cannot open either page
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions` were measured, not reasoned:** "behaviour unchanged" is the parity and eligibility checks' result; the cell counts (3 to 25) are read from `JOB_NEEDS`; the page count (26 added, 29 in all) is a count of `ROUTES`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager at deploy time
- [ ] Deployed SHA matches the tested SHA — deferred: release manager at deploy time

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date or time logic touched
- [ ] Boundary or banding change — n/a: no threshold or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited:** the gates lines are copied from `scripts/gates.mjs`
- [ ] Public pages re-checked — n/a: `/friends` changed only in how its signed-in draft count reads permissions; it is public and was not driven

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code that reads it — n/a: no migration in this PR
- [ ] Production dry-run — n/a: no migration in this PR
- [ ] Destructive migration backup — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [ ] Rollback position stated: revert this PR; nothing in it changes the schema or a policy, so there is nothing a rollback does not cover — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Sign in as **management**: the menu shows Management but not Settings; Management's grid shows all twelve tiles; open Contacts, Vets, Medications, Cashflow, Translations | the sidebar, `/management` |
| 2 | Sign in as **staff**: no Management or Settings in the menu; `/management` and `/management/contacts` show the no-access page; Stocktake and Deliveries open | the sidebar, `/management` |
| 3 | Sign in as **volunteer**: Enclosures, Maintenance (board opens on their own jobs, no add button), Projects, Contacts (name and phone only), Vets; no Management | those pages |
| 4 | Sign in as **vet**: menu is Appointments, Residents only; `/maintenance`, `/contacts`, `/vets`, `/projects` show the no-access page | those pages |
| 5 | Sign in as **admin**: Settings grid shows all ten tiles including Security and System status; the assistant button is in the header | `/admin`, the header |
| 6 | As **management**, set up a recurring job linked to `/maintenance`, to `/management/dashboard` and to `/stocktake`: the "only … are listed" sentence and the assignee picker narrow as before | `/management/recurring-jobs` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-04

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; the role pass is for whoever signs in as each role to tick

Manual verification by: pending: the role pass in the table above, by a person

### Result

- [x] Open defects are either fixed or explicitly accepted above: none found
- [ ] Checklist pasted into the PR — n/a: pasted when the PR is opened; the file is the record
- [ ] Handed to the production release manager — n/a: handed over at release time, not at PR time

Result: pass

Release manager acknowledgement: n/a: not at PR time

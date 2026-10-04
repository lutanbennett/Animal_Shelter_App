# Feature test plan

## Header

| | |
|---|---|
| Feature | The Head of Medical's last three jobs on a phone: Record Weight (`/medical/weight`), Add Medical Photos (`/medical/photos`, with its own upload route) and Feed Special Diets (`/medical/diets`). She is now complete at five jobs |
| Backlog item | `docs/backlog.md` → Medical records → "Head of Medical: record weight and add medical photos from a phone" and "Head of Medical: feed special diets" (both ticked, with status lines) |
| Branch / worktree | `claude/medical-jobs-app` @ `C:\Development\Animal_Shelter_medical-jobs-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | opened from this branch; the number is recorded in the follow-up commit that ticks CI |
| Tested by / date | Claude (automated) / 2026-10-04 |
| Carries a migration? | no (reads `0140`, applied to dev and merged in #356) |
| Tested at SHA | the branch tip at the commit that adds this plan |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: three phone pages for the Head of Medical (weigh a resident, add a Medical-folder photo, read the non-standard diets), each a named job with an explicit bundle, none of them reading a table she cannot read
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `src/app/medical/**` (new, three pages, a picker, a keypad form, an uploader), `src/app/api/medical/residents/[id]/photos/route.ts` (new), `src/lib/medical/residents.ts` and `src/lib/diets/special-list.ts` (new), `src/lib/permissions/jobs.ts` and `routes.ts`, `src/lib/home/tiles.ts` (one line), `src/lib/auth/require-role.ts` (`refuseFor`) and the nine call sites that now use it, both dictionaries (`medicalJobs`, `appHome.jobs`), `src/lib/releases.ts`, `scripts/check-medical-jobs-app.mjs` (new), `scripts/check-medical-role.mjs` and `check-medical-jobs.mjs` (`AHEAD` emptied), `docs/decisions/2026-10-04-medical-jobs-app.md`. No `worker/`, no migration
- [x] Roles affected identified: the Head of Medical (three new home tiles). The `refuseFor` change touches every guarded page's refusal for a configured role, so it reaches any role that is not in the legacy allow-list; the legacy roles are unchanged (they still go to `/no-access`)
- [x] Anything explicitly **out of scope** written down: the add-prescription form and `dose_quantity` per round (its own schema stream); a record of a dose or a meal given; a gallery of the photos she filed (she cannot read `attachments`); a deceased resident's photo (refused, Management does it); pointing `/weight/new` at her page

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — nothing to merge: `origin/main` had no commits this branch lacked when the gates ran
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line, as printed:

  ```
  === gates: build exited 0 after 197s
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [x] Existing rows still read correctly after the change (checked against real dev data): the picker listed dev's real residents through `resident_who_and_where`, the diet page read dev's real `special_diet_list` rows, and a real weight (Kame, 5.35 kg) was saved and read back with the previous reading shown
- [x] **Constraints and defaults exercised against real rows**, under her JWT: a weight is inserted, a second the same day is refused with `23505`, a non-positive weight is refused, and **a deceased resident's weight is refused** by the database (`This resident is deceased — their record is read-only.`), which `0140` had left reasoned and not exercised. `check-medical-jobs.mjs` (157 checks) re-run and holds
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration; production must have `0140` before this release deploys, since all three pages read what it created

## 4. Functional checks

- [x] Happy path works end to end: signed in as a throwaway Head of Medical on dev at 375 px, tapped Kame from the picker, typed 5.35 on the open keypad, pressed Save, and got `Saved: Kame, 5.35 kg` above the picker. The Add Medical Photos path was driven through the route (`check-medical-jobs-app.mjs --upload`): a real JPEG filed in dev's Drive, the attachment row read back with `sub_folder = Medical` and `uploaded_by` = her
- [x] Data persists — reload the page and the change is still there: reopening Kame showed `Today already has 5.35 kg. Saving will replace it.` and the recent-weights list
- [x] Create / edit / delete all exercised (whichever the feature has): weight create (above) and the same-day replace notice; photo create. There is no delete in any of the three (she cannot read `attachments`, and the weight page offers no archive)
- [x] Empty state renders sensibly (no rows yet): the diet page's empty sentence and the picker's no-match sentence exist and are keyed in both languages; neither was reached on dev data (dev has special diets in both meals)
- [x] Invalid input is rejected with a readable message, not a crash: an unknown resident id shows `That resident isn't in the list`; a non-positive weight and a second reading the same day are refused by the database and surface as sentences through `recordWeight`/`updateWeight`'s existing wording. An empty weight is stopped by `required` and by the action (`Type the weight.`)
- [x] Boundary cases checked: a deceased resident (weight page closed; photo route 409; weight insert refused by the database); `?round=` outside morning/evening falls back to the suggestion
- [x] Pages open in Thai and English: `check-medical-jobs-app.mjs` opens all three in both and each returned 200 with no redirect

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| Head of Medical | the three pages, from her home | do each job and nothing more | passed: four tiles; the refusals below |
| Head of Medical | dashboard, medication catalogue, prescription form, a resident's weight tab | refused with the app's own `/no-access` page | passed (after the fix below: it sent her to `/`, the public website) |
| Head of Medical | a resident's medications tab | the app's own 404 | passed |
| Head of Medical | `/weight/new?residentId=…` (the staff form) | a polite sentence | passed: `Resident not found.`; accepted, see Defects |
| Head of Medical | `residents`, `resident_current_state`, `vet_appointments`, `diet_types`, `attachments` as tables | nothing | passed: all five return no rows |
| admin, management, staff | the weight and diet pages and the photo route | unchanged cells; the pages open for any login holding the cell with all-clinic scope | not exercised |
| vet | the three pages | refused: the clinical-scope check (`sees_all_clinical()` is false for a vet) | not exercised; by reading only |
| volunteer | nothing new | unchanged | not exercised; the volunteer holds none of the three cells |
| signed out | nothing | `/login` | not exercised; the same `requirePermission` guard as every page |

- [ ] Every role above tested — n/a: only the Head of Medical's rows were driven; no permission cell or policy was added or changed in this branch (`0140` is already merged), and `check-permission-parity.mjs` and `check-volunteer-narrowing.mjs` are green
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): the dashboard, catalogue, prescription form and a resident's weight tab were fetched by URL as her and each redirected to `/no-access`

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change; the three pages are `menu: false` and reached from her home tiles
- [ ] Manual updated — n/a: `src/lib/manual/en.ts` was not edited; the manual's screenshots are deferred to one rerun when the feature batch is done
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: the new strings are dictionary keys in both languages, not stored free text
- [x] Mobile viewport (375px) — no overflow, controls reachable: `scrollWidth` equalled `clientWidth` (375 = 375) on the weight picker, the weight form, the photo picker, the photo uploader and the diet page, in English; the weight form, diet page, photo picker and photo uploader also in Thai. The weight field is `min-h-24`, the Save button `min-h-16`, the round buttons `min-h-16`
- [x] Browser console clean — no errors seen on the pages above (read at sampling, not logged per page)
- [x] Network clean: the photo route answered 200/409/404 as expected in `--upload`; a GET to it is 405

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): `/home` (four tiles), and the medication list opens (tile present). The staff `/api/residents/[id]/photos` route is untouched by this branch
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page: `refuseFor` replaced `refuse` on nine guards; the dashboard and the prescription form (both reached through `requirePermission`) were fetched as her and refused correctly; the legacy roles' path is the branch `refuseFor` falls through to unchanged (`refuse(perms.role.key)` when `opensApp` is false)
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**: both items ticked, with a status line saying the Head of Medical is complete at five jobs
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `docs/decisions/2026-10-04-medical-jobs-app.md` (the sibling photo route and why, what the handover missed, the `refuseFor` bug)
- [x] `README.md` still accurate: it does not describe the Head of Medical's pages
- [x] **Release notes.** `src/lib/releases.ts`'s `unreleased` gained a line: she can now record a weight, add a medical photo and see who is on a special diet, all from a phone
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The gates line, the check scripts' results and the browser figures are tool output; the camera and the pictures' meaning to the helpers are listed below as not driven

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: the weight is dated with `todayIso()` (the shelter's clock, unchanged helper) and the diet suggestion is `suggestRound("food")` (unchanged, its edges asserted by `check-shelter-dates.mjs`); no new clock logic
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no boundary or banding changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The gates line is pasted as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration; the code reads `0140`, already on `main` and applied to dev
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration; production needs `0140` applied (from the main checkout, `--dry-run` first) **before** this release deploys

### Rollback

- [x] Rollback position stated, **including what it does not cover** — revert the merge; no schema or data changed. It does not undo weights, Drive files or attachment rows the dev checks created (disposable), and reverting `refuseFor` puts the Head of Medical's refusals back on the public website

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | High | Every page the Head of Medical was refused at sent her to `/`, the **public website**: `requirePermission` passed `perms.role.key` (`head_of_medical`) to `refuse()`, whose allow-list is the legacy roles. Found by fetching the dashboard as her | fixed: `refuseFor(perms)` asks the role's own `opensApp`; nine call sites changed; re-driven, all refuse to `/no-access` |
| 2 | Low | `/weight/new` (the staff form) opens for her, since she holds `medical.weight`, and says "Resident not found." because it reads `residents` | accepted: a polite sentence, not a crash; sending her to `/medical/weight` is a nicety, noted in the decision |
| 3 | Low | The brief counts five jobs; her home shows four tiles, the pick list being a tab of Administer Medication | accepted: stated in the decision and the backlog line |
| 4 | Low | A deceased resident's photo is refused by the new route (the staff route keeps photos open after death and regenerates the archive, which needs reads she does not have) | accepted: stated in the decision; Management files those |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The Head of Medical has used it for a real round**: weighed, photographed and read the special diets for the animals in front of her, on her own phone. §12's done-when, and the demonstration Lutan wants to show the Director | dev or test, her phone |
| 2 | **The camera**: `Take a photo` opens the rear camera on a real phone and the photo lands; `Choose from phone` takes several | a real phone |
| 3 | Whether the weight keypad, the bowl-and-amount and the sunrise/moon strip read for helpers who read neither Thai nor English | the Medical lead and a helper |
| 4 | A special diet with **no meal ticked** shows the red "No meal time set" tag and the notice above the list. Dev's special diets all hold a meal | dev, after ticking one off |
| 5 | A dog with **no Drive folder yet**, photographed for the first time (the route creates the folder and calls `set_resident_drive_folder`). The upload check used one dev resident | dev |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-04

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet

Manual verification by: pending: the five items under Left for manual verification, chiefly item 1, the Head of Medical using it for a real round

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet, the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet, nothing to hand over until the PR merges

Result: pass

Release manager acknowledgement: pending: production release manager

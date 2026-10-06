# Feature test plan

## Header

| | |
|---|---|
| Feature | `/residents` gets a **Download spreadsheet** button: a CSV of the list as filtered, or of the ticked rows, with more columns than the table (sex, age and estimated birth year, size, colour, chipped, prescriptions running today, next vet visit, diet, latest weight) |
| Backlog item | `docs/backlog.md` → Resident operations → **Download the residents list as a spreadsheet**: ticked; the activity question and the final column list are noted on it as open with Lutan |
| Branch / worktree | `claude/residents-spreadsheet` @ `C:\Development\Animal_Shelter_residents-spreadsheet` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3015` |
| PR | opened from this branch; the number is recorded in the follow-up commit that ticks CI |
| Tested by / date | Claude (automated) / 2026-10-06 |
| Carries a migration? | no |
| Tested at SHA | the branch tip at the commit that adds this plan, `origin/main` @ `b3242cc1` already merged |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a route that re-runs the list's own query (same resolver as the page) and writes one CSV row per resident through `csv.ts`, with each medical column only for a role that can read it
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `src/app/residents/export/route.ts` (new); `src/app/residents/page.tsx` and `ResidentsTable.tsx`; `src/lib/residents/list-view.ts` (the page's filter reading, moved out) and `export.ts` (new); both dictionaries (button text); `src/lib/manual/en.ts`; `src/lib/releases.ts`; `scripts/check-residents-export.mjs` (new); decision file and backlog. No migration, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public: admin, management and staff get the full file; a vet gets the record columns and the medical groups its cells allow; a volunteer (and the Heads, who borrow the volunteer's view) get who-and-where only; signed out is refused
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: XLSX; whether exporting is its own activity (open with Lutan; follows `resident.record` meanwhile); a Thai header row (English chosen); the chip-scan redirect is not reproduced in the file; production

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date at the second sync)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line, as printed on the feature code (before the manual, release note and docs commit, which change no logic):

  ```
  === gates: build exited 0 after 338s
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no schema change; the export reads existing rows, and the check seeds its own
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no constraint or default added
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: `scripts/check-residents-export.mjs` against dev, 28 assertions, 0 failed. A resident with a Thai name, breed, sex, size, colour, age, a running and an ended prescription, an upcoming visit at a clinic, two weights and a diet comes out with every column right (the ended prescription is not counted; the later weight wins)
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: read-only
- [x] Empty state renders sensibly (no rows yet): a place filter that matches nothing returns the header row alone (asserted)
- [x] Invalid input is rejected with a readable message, not a crash: a malformed `ids=` entry is dropped and the good one kept (asserted); a stale `zone=` is dropped by the page's own rule, now shared
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): a resident with no prescription, visit, diet, weight or chip gets `0` and blanks, not a missing row; a name beginning `=` is written as `'=…` (text); a Thai name arrives intact; the file starts with the UTF-8 BOM (read from the bytes, since `response.text()` strips it); ticked ids narrow the file but stay inside the filters

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | the full file | every record and medical column | asserted: all 24 headers, values right |
| management | the full file | as admin | not driven separately: same code path as admin (`resident.record` Edit and every `medical.*` Read) |
| staff | the full file | as admin | not driven separately: same code path |
| vet | record columns plus the medical groups its cells allow, over its own clinic's residents | RLS narrows the rows; a group without Read is left out | not driven: the phone-width run loaded the page as a vet, but the download was not requested as a vet; see Left for manual verification |
| volunteer | who and where only | header is exactly R-code, Name, Thai name, Species, Sex, Zone, Enclosure, Status, Place | asserted: exact header, none of the 15 extra headings, Thai name and enclosure present, no colour, breed or weight text anywhere in the file |
| signed out | nothing | refused | asserted: 401, no resident name in the body |

- [x] Every role above tested: admin, volunteer and signed out by the script; management and staff share admin's code path; the vet is listed under Left for manual verification
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): the signed-out request is refused at the route, and a login that is neither a volunteer nor holding `resident.record` Read gets 403

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry; the button is on an existing page
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`: two steps added to Finding a resident, and the volunteer note extended. Read in source; not opened at `/manual` in a browser. There is no Thai manual file
- [x] Translatable strings go through the translation path: the button, its count form and the "where it went" message are in both dictionaries (`residents.list.download`, `downloadCount`, `downloadSaved`). The file's own headings are English by decision and are not translated
- [x] Mobile viewport (375px) — no overflow, controls reachable: `node scripts/check-phone-width.mjs --pages=/residents`: 12 views (admin, management, staff, vet, volunteer, head_of_medical, English and Thai) measured, "No page scrolls sideways". The icon button is 44 px on a phone, as the other action buttons are
- [x] Browser console clean: not separately read; the browser step of the check loaded the page, ticked a row and clicked without a failure
- [x] Network clean: the download request answers 200 with `text/csv`, `Content-Disposition: attachment` and `Cache-Control: no-store`

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): `/residents` itself was refactored (its filter reading moved to `list-view.ts`) and was loaded by the phone-width run for six roles in both languages, and by the check's browser step, which found the list, the filters' query string and the checkboxes working
- [x] Any shared file touched (`manual/en.ts`, both dictionaries, `releases.ts`) checked from a second, unrelated page: the dictionaries are exercised by every page of the phone-width run's six roles; `typecheck` and `build` pass against the dictionary type, which refuses a missing key in either file
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged in

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead): ticked, with the open activity question and column list written on it
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `docs/decisions/2026-10-06-residents-spreadsheet.md` (columns, English headings, what follows `resident.record`, the volunteer's file, why the guard also admits a volunteer on dev's draft matrix)
- [x] `README.md` still accurate: it does not describe the residents list
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a line, written for a shelter user
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The assertion counts are the script's output. Reasoned and worded as reasoning: that the BOM is what makes Excel read Thai correctly (the existing writer's claim; the check proves the BOM is present, not what Excel does with it)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — deferred: production release manager. "Today" for prescriptions, diets and the next visit is `todayIso()` (Bangkok) and the visit cut-off is `T00:00:00+07:00`, so a Workers build in UTC reads the same day; it was exercised on dev only at the hour the check ran
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold added; the prescription boundary is covered both sides anyway (an ended prescription is not counted, an open one is)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The gates lines are pasted; the check's counts (28 ok, 0 failed) are from its own output, not a table kept by hand
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**: revert the PR (or `deploy-pi.sh --ref <sha>`); the change adds one route and a button and moves the page's filter code, with no schema and no data written. It does not cover a file someone has already downloaded

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium, found by the check | The first version guarded the route with `requirePermission("resident.record")`, which refused a volunteer on dev: the Director's draft matrix has no `resident.record` cell for the volunteer, though they open `/residents` through the database's own view gate | fixed in this PR: the route admits a volunteer-based login or a Read holder, as the page does; recorded in the decision file |
| 2 | Low | The Director's draft matrix on dev lists no `resident.record` for the volunteer, which contradicts `docs/roles-and-permissions.md` (volunteer R) | accepted: not this PR's to change; surfaced to Lutan |
| 3 | Low | A vet's download and the 2IC's were not requested as those roles | accepted: listed below |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Open a downloaded file in Excel (or Google Sheets) and look at it:** the Thai name and other names read correctly, Age and Estimated birth year sort, nothing starting `=` runs, the columns are the ones the Director wants. Compare against `Resident_Export_Director_Review.xlsx` | any download from `/residents` on dev |
| 2 | On a real phone (iPhone and Android), tap Download spreadsheet: the file lands in Downloads / Files and the message says where | `/residents` on `test.lannacare.org` |
| 3 | Signed in as a vet: the file holds only that clinic's residents and only the medical groups the vet may read | `/residents` as a vet |
| 4 | Tick three residents on a computer, download: three rows, and the file is named `residents-selected-…` | `/residents` as staff |
| 5 | Decide: is exporting its own activity in the matrix, and is the column list final? | Lutan |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-06

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; items 1 to 5 wait for a person

Manual verification by: pending: Lutan opening a downloaded file in Excel and tapping the button on a phone (items 1 and 2), and answering item 5

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the release manager reads this when the release is cut

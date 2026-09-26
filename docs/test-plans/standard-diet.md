# Feature test plan

## Header

| | |
|---|---|
| Feature | Standard diet, feature half: a diet is mandatory at intake and preselects the standard; Management → Diets shows and moves the standard; enclosure cards and the enclosure page mark residents on a special diet |
| Backlog item | `docs/backlog.md` → **Standard diet: flag it, make a diet mandatory at intake, and show special diets on enclosure cards** (ticked here) |
| Branch / worktree | `claude/standard-diet` @ `C:\Development\Animal_Shelter_standard-diet` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | opened from this commit |
| Tested by / date | Claude (automated, browser driven signed in as Lutan's admin account) / 2026-09-26 |
| Carries a migration? | no. It depends on `0087` (#134) and `0090` (#136), both merged and applied to dev |
| Tested at SHA | `ed9174a` (`c76c42f` synced onto `main` @ `ab4859a`). The later commit adds only this plan |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: parts 1 (UI), 2 and 3 of the item. Part 1's schema was `0087`; the move and the intake refusal in the database were `0090`, a second schema PR Lutan chose on 2026-09-26. Lutan confirmed in chat the same day that `0087`'s backfill stands
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `src/app/residents/new/` (form, action, page), `src/app/management/diets/` (page, table, actions), `src/app/enclosures/page.tsx`, `EnclosureGrid.tsx`, `[id]/page.tsx`, `[id]/EnclosureHub.tsx`; new shared `src/lib/diets/special.ts`; `src/components/hub-icons.ts` (one icon); both dictionaries; `src/lib/manual/en.ts`; `src/lib/releases.ts`; docs. No `worker/`, no migration
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public. Intake (staff and up) now needs a diet. Admin and management move the standard. Everyone who sees `/enclosures` sees the markers, as far as RLS lets them read `resident_diets`. The public `/e/` card is unchanged
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: residents already at the shelter keep whatever diet they have (the `0087` backfill stays, per Lutan). No marker on the public enclosure page, the residents list or the resident hub. There is only an English manual file (`src/lib/manual/` has no `th.ts`), so the Thai side is the dictionaries only

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: it brought in #136 (`0090`, its harness, plan and decisions entry: 4 files, nothing under `src/`), pushed as `ed9174a`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Run at `c76c42f`, before the sync. The sync added no file under `src/`, and CI re-runs all three on the merged tree. Closing lines as printed:

  ```
  === gates: build exited 0 after 222s

  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration on this branch
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration on this branch
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration on this branch
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration on this branch; `0090` was applied from #136
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration on this branch
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no schema change here; the pages were read against real dev rows in §4
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration on this branch; the functions it calls were harnessed in #136 (`check-standard-diet-functions.mjs`)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration on this branch
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration here; #136's plan says `0090` goes to production before this branch's deploy

## 4. Functional checks

- [x] Happy path works end to end. Signed in as admin on `localhost:3005` against dev, all checks read through the DOM because the pane's screenshots and click coordinates lag behind scrolling. **Management → Diets:** ★ Standard badge on Standard Kibble + Chicken; Make standard only on Renal diet; the confirm read `Make "Renal diet" the standard diet instead of "Standard Kibble + Chicken"? New intakes will default to it, and residents on "Standard Kibble + Chicken" will show as special diets.`; `Saved.`, and the badge moved in place about 3 s later. **`/enclosures`** with Renal as the standard: 19 cards with a marker, e.g. `5 special diets`, title `On a special diet: B1 (Cat), Kame, Ong Thong, Panda, Phu Thong`, each with the icon. **`/enclosures/[id]`** (Front Zone 1): `Special diet: Standard Kibble + Chicken` under both residents. **Intake** step 3: `required`, Renal preselected, options `Renal diet`, `Standard Kibble + Chicken` (no "None yet"), and the new hint. The standard was then moved back to Standard Kibble + Chicken through the same button, and dev reads `Standard Kibble + Chicken is_standard true`
- [x] Data persists — reload the page and the change is still there: after each move a fresh load of Management → Diets showed the badge on the new row
- [x] Create / edit / delete all exercised (whichever the feature has): the feature's one write, moving the standard, done four times through the UI; intake's create path is refused in the next line (a successful intake with a diet is #136's harness case G)
- [x] Empty state renders sensibly (no rows yet): with the real standard, dev's only resident on another diet is Adopted, so `/enclosures` showed no markers (0 `<details>`) and no stray text. The zero-standards note is not reachable from the UI (nothing clears the flag); its code path is a `some()` over the rows
- [x] Invalid input is rejected with a readable message, not a crash: intake with `required` stripped and an empty diet chosen, submitted from the review step, came back `Choose the resident's starting diet.` and dev has no resident named `Diet refusal check`. `record_intake`'s own refusal is #136's harness F
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): the 29-resident Unassigned card (the longest names list) and single-resident cards (`1 special diet`, singular). The "current diet" date rule reads the shelter's today (`todayIso()`); a service-role read with the same filters on 2026-09-26 returned the one Renal row (`start_date 2026-09-22`, open-ended)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Diets, Make standard, enclosures, intake | all of it | driven as admin, above |
| management | Make standard | moves it | not driven (no password); same `assertManagementRole` as every Diets action, and `set_standard_diet` admits management (#136 harness A) |
| staff | enclosures markers, intake | markers; intake needs a diet | not driven; `set_standard_diet` refuses staff (#136 harness E), staff intake with/without a diet is #136 F/G |
| vet | enclosures | markers if RLS lets vets read `resident_diets`, none otherwise | not driven; the loader returns an empty map, not an error |
| volunteer | enclosures | as vet | not driven |
| signed out | `/enclosures`, `/management/diets` | sent to login | `/enclosures` redirected to `/login?next=%2Fenclosures` before sign-in |

- [ ] Every role above tested — n/a: only admin and signed-out were driven; other roles need their own passwords. The role rules are the database's (`set_standard_diet` guard, `record_intake`, RLS), exercised per role in #136's harness
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): `setStandardDietType` calls `assertManagementRole()` first, and the function refuses staff and role-less callers itself (#136 harness E)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`: the intake step-3 line (diet required, starts on the standard), a new Enclosures line for the marker and the enclosure-page diet names, and a Diets line for Standard and Make standard. Build passed with them; the topics were read in the file, not at `/manual`
- [x] Translatable strings go through the translation path, checked at `/management/translations`: UI strings only, added to both `en.ts` and `th.ts` (the Thai type follows English, so typecheck would fail on a missing key). No translatable data fields added, so `/management/translations` is unaffected
- [x] Mobile viewport (375px) — no overflow, controls reachable: `/enclosures` at the mobile preset had `scrollWidth` equal to `innerWidth`; every one of the 19 markers was the topmost element at its left, middle and right (`elementFromPoint`), so a tap reaches it and not the card's stretched link; clicking one opened the names (`5 special diets / B1 (Cat) / Kame / Ong Thong / Panda / Phu Thong`) and stayed on `/enclosures`
- [x] Browser console clean — no errors or React warnings: the only errors were temporary `DEBUG` lines of mine, removed before this commit (the committed `special.ts` has none)
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages: `preview_logs` level error: `No server errors found.`

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): `/enclosures` capacity bars, open-job counts and copy-link icons still on every card; `/enclosures/[id]` residents, notes and maintenance card; Management → Diets forecast, stock and Edit/Count/Delete buttons still present; the intake wizard stepped 3 → 6 and the review step rendered
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — by loading that page, not by reading the file — n/a: `hub-icons.ts` only gained a key; the resident hub's section icons that share `SECTION_ICONS.diet` were not loaded. Left for manual verification below
- [x] Nothing merged from `main` during `sync` was broken by this branch: the merge brought only #136, which this branch depends on and exercises

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: "2026-09-26 — Standard diet, feature half: intake, Management → Diets, enclosure markers" (RPC for the move, zero standards means nobody special, per-resident rule, `<details>` over the stretched link, one loader)
- [x] `README.md` still accurate: it does not describe intake, diets or enclosure cards at this level
- [x] **Release notes.** Would a shelter user notice this change? Yes: `unreleased` gained a line about the mandatory, preselected intake diet, the enclosure markers, and Make standard
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** "a tap opens the names instead of following the card" is the `elementFromPoint` sweep and the click in §5. "A role RLS keeps out gets no markers rather than an error" is from reading the code (errors are not surfaced); it was not driven as a vet

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — deferred: release manager. The rule uses `todayIso()` (Asia/Bangkok) for "current"; not tested across midnight
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: no band; the one boundary is a diet's start/end date, the same rule the hub uses
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — deferred: release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page changed; `/e/` does not read diets

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration here, but the code calls `set_standard_diet` and reads `is_standard`, so `0087` and `0090` must be on production before this deploys
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration on this branch; #136 carries the production apply
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy: `0087` and `0090` to `dbkodyyxxhtygxcxmfcu` before this Worker deploys

### Rollback

- [x] Rollback position stated, **including what it does not cover**: `wrangler rollback` restores the old intake form, but with `0090` applied its "None yet" option then fails; roll back `record_intake` as #136's plan describes if the Worker goes back

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | — | Suspected: a tap on a card's marker opened the enclosure. It was the Browser pane's click coordinates lagging behind the scroll position; hit-testing showed the marker on top for all 19, and a click opened it | not a defect |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The marker looks right on a phone: icon + "N special diets" under the capacity bar, a tap opens the names and does not open the enclosure, a second tap closes them | `/enclosures` on a phone (temporarily make Renal diet the standard on Management → Diets for plenty of markers, then move it back) |
| 2 | Management → Diets: the ★ Standard badge and Make standard button read well beside the name and other buttons | `/management/diets` on a computer |
| 3 | The resident hub's Diet section icon is unchanged (shares the icon the marker uses) | any resident hub |
| 4 | The Thai wording: intake hint and error, the marker ("อาหารพิเศษ N ตัว"), the Diets badge, button and confirm | switch to ไทย on the pages above |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-26

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — waiting for Lutan to look at the four items above

Manual verification by: n/a: not yet signed — only the person who looks signs this

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR description summarises it and links this plan, which is the record
- [ ] Handed to the production release manager — n/a: not yet — happens at release

Result: pass

Release manager acknowledgement: n/a: no release manager has read it yet

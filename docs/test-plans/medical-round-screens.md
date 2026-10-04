# Feature test plan

## Header

| | |
|---|---|
| Feature | Medication list by round: the person chooses Morning, Lunch or Evening; a stock-room pick list (the default tab); amounts drawn as pictures and the rounds as sunrise, sun and moon |
| Backlog item | `docs/backlog.md` → Medical records → the three items "Medication round, stock-room pick list", "Medication by time of day" (feature half) and "Pictures first" (all ticked, with status lines) |
| Branch / worktree | `claude/medical-round-screens` @ `C:\Development\Animal_Shelter_medical-round-screens` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | opened from this branch; the number is recorded in the follow-up commit that ticks CI |
| Tested by / date | Claude (automated) / 2026-10-04 |
| Carries a migration? | no |
| Tested at SHA | the branch tip at the commit that adds this plan, merged with `main` after PR #356 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `/management/medication-list` asks which round is being done, shows that round's doses, adds a stock-room pick list per zone and enclosure, and draws amounts and rounds as pictures
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `src/app/management/medication-list/page.tsx`, `src/lib/medication-list/load.ts` and `pick.ts` (new), `src/components/medication/AmountPicture.tsx` and `RoundIcons.tsx` (new), both dictionaries (`management.medicationList`), `src/lib/releases.ts`, `scripts/lib/acceptance-matrix-entries.mjs`, `scripts/check-medication-pick.mjs` (new), `docs/decisions/2026-10-04-medical-round-screens.md`. No `worker/`, no migration
- [x] Roles affected identified: the Head of Medical (her one home tile), admin, management and staff, all of whom hold Read on `medical.prescriptions`; nobody else reaches the page
- [x] Anything explicitly **out of scope** written down: the add-prescription form's three ticks and any change to the `frequency` table (backlog item written, not built); Feed Special Diets and the food rounds (`resident_diet_rounds`); Record Weight and Add Medical Photos (batch 47); a backup login for the Medical lead; a record of a dose given

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; one conflict in `docs/backlog.md` (the schema stream edited the neighbouring items), resolved by keeping `main`'s two items and this branch's three ticks
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line, as printed:

  ```
  === gates: build exited 0 after 147s
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [x] Existing rows still read correctly after the change (checked against real dev data): the list loaded against dev's real prescriptions and `prescription_rounds` as the Head of Medical, in both languages
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration; `check-medication-rounds.mjs` (70 checks) was re-run unchanged and holds
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: signed in as a throwaway Head of Medical account on dev at 375 px, the list showed zones, enclosures, resident photos and the round chooser; tapping a round and switching tabs both worked
- [ ] Data persists — reload the page and the change is still there — n/a: read-only page, nothing is saved; the chosen round lives in the URL (`?round=`) and survives a reload
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: the page has no create, edit or delete and gained none
- [x] Empty state renders sensibly (no rows yet): the pick list in a round with no doses shows "Nothing is due in this round" (`pickEmpty`); and by reading, the by-resident list keeps its existing "no one has medicine due" message
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the only input is `?round=` and `?view=`; anything unrecognised falls back to the suggestion and the pick list (by reading, not driven with a bad value)
- [x] Boundary cases checked: the round chosen in the URL overrides the clock (`?round=lunch` at evening time stayed on Lunch with no "suggested" note, and with no `round` the Evening button was pre-selected with the note). The clock edges themselves (10:59:59 / 11:00:00 / 15:59:59 / 16:00:00 Thai, 00:00, 06:59, 23:59, under four process time zones) are asserted by `scripts/check-shelter-dates.mjs`, which ended `All checks passed.`; this page adds no clock logic of its own
- [x] Pick list arithmetic: `node scripts/check-medication-pick.mjs` ended `all held` (per-zone sums equal the sum of the enclosures, as-needed not counted, no-round reported not counted, a missing amount flags rather than reading as zero, two units stay two lines, apart residents not bagged for)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| Head of Medical | medication list, both tabs | reads it, nothing to change | passed: signed in, list and pick list load, rounds and round names read from `prescription_rounds` and `rounds` |
| admin | medication list | unchanged access | not exercised |
| management | medication list | unchanged access | not exercised |
| staff | medication list | unchanged access | not exercised |
| vet | not offered, refused | unchanged | not exercised |
| volunteer | nothing | unchanged | not exercised |
| signed out | nothing | unchanged | passed: the page redirected to `/login?next=…` before sign-in |

- [ ] Every role above tested — n/a: no access rule changed; the page's permission check and clinical-scope refusal are unchanged, and the two new reads (`prescription_rounds`, `rounds`) are visible to the Head of Medical (shown above) and follow `prescriptions` for the rest
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no route or policy added or changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [x] Manual updated: the `medication-list` entries in `scripts/lib/acceptance-matrix-entries.mjs` were rewritten and a second one added (choose the round, then read the pick list); `src/lib/manual/en.ts` was not edited, and the topic wording was not opened at `/manual`
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: the new strings are dictionary keys in both languages, not stored free text
- [x] Mobile viewport (375px) — no overflow, controls reachable: `scrollWidth` equalled `clientWidth` on the pick list in English (Lunch) and Thai (Evening) and on the by-resident list in English; the Thai by-resident list was not measured. The round buttons are `min-h-16` three-across
- [x] Browser console clean — no errors seen on the pages above (read at sampling, not logged per page)
- [ ] Network clean — n/a: no new API; the page reads through the existing server client

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): `/management/medication-list` in both tabs and both languages, in the browser. The Home tile and `/management` were not opened
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared file other than the dictionaries, `releases.ts` and the matrix entries file was touched, and all three are checked by `lint`/`build`
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merged tree passes the gates above

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**: all three items ticked, each with a status line saying what was not done
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `docs/decisions/2026-10-04-medical-round-screens.md`
- [x] `README.md` still accurate: it does not describe the medication list
- [x] **Release notes.** `src/lib/releases.ts`'s `unreleased` gained a line: the medication list asks which round you are doing, adds the stock-room pick list, and shows amounts as pictures
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The gates line, `check-shelter-dates`, `check-medication-pick` and `check-medication-rounds` results are tool output

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [x] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** The suggestion itself is `suggestRound()`, unchanged, and its edges (both sides of 11:00 and 16:00, plus 00:00, 06:59, 23:59, under UTC, Asia/Bangkok, America/Los_Angeles and Pacific/Kiritimati) are asserted by `check-shelter-dates.mjs`. In the browser the page was seen suggesting Evening and being overridden to Lunch, but only at the real clock hour of the session
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — no boundary changed; the existing script covers them as above
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The gates line is pasted as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration; the code reads `0137`–`0139`, already applied to dev and merged
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration; production must have `0137`–`0139` before this release deploys, since the page reads `prescription_rounds` and `rounds`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — revert the merge; no schema or data changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | The first tablet drawing was a disc with a horizontal bar and read as a no-entry sign | fixed: now a tinted disc with a highlight, a half drawn as a half-disc |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Whether the pictures mean something to the helpers**: tablets, capsule, syringe mark, drops, and the sunrise/sun/moon strip, held against the real boxes, by the Medical lead and a helper | dev, 375 px, a phone |
| 2 | The by-resident list in Thai: round strip, "No round set" and "As needed" tags, and `scrollWidth <= clientWidth` | dev, 375 px |
| 3 | A real prescription with **no round** and one **as needed** in the list, and the red "No round set" notice above the pick list. Dev had neither at the time of the check | dev |
| 4 | A weekly or every-other-day medicine appears in its round only on its day | dev |
| 5 | Open the page at a clock hour near an edge (about 10:55 and 15:55 Thai) and see the pre-selection change and a tapped round hold | test.lannacare.org |
| 6 | A capsule and an ml medicine: the capsule drawing and the syringe fill to the mark | dev |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-04

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet

Manual verification by: pending: the six items under Left for manual verification, chiefly whether the pictures read for the helpers

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet, the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet, nothing to hand over until the PR merges

Result: pass

Release manager acknowledgement: pending: production release manager

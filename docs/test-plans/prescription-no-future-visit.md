# Test plan — prescription-no-future-visit

## Header

| | |
|---|---|
| Feature | A prescription is linked only to a vet visit that has happened, in the form: the linked-visit picker uses `loadLinkableVisits({ notInFuture, keep })`; a future visit has no Add prescription link; a URL naming one opens the form unlinked; `0107`'s refusals read as sentences on the prescription and vet-visit edit forms; `visitDate()` returns the shelter day |
| Backlog item | `docs/backlog.md` → "A prescription should not be attachable to a future vet visit." (ticked on this branch) |
| Branch / worktree | `claude/prescription-no-future-visit` @ `C:\Development\Animal_Shelter_prescription-no-future-visit` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | opened with this plan; schema half #191 (merged, `78fb918`) |
| Tested by / date | Claude, 2026-09-28 |
| Carries a migration? | no — `0107` is #191, applied to dev, which this was tested against |
| Tested at SHA | `885be3d` (the change `4b513e3`, synced with `main` @ `78fb918`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the prescription picker offers only visits on or before today, and #191's triggers back it in the database — the item's "limit the picker" and its open question, answered as the weight item did
- [x] Files/areas touched listed: `src/lib/prescriptions/options.ts` (visits via `loadLinkableVisits`, new `keepVisitId`); `src/app/prescriptions/{PrescriptionForm.tsx,actions.ts,[id]/edit/page.tsx}`; `src/app/vet-visits/[id]/edit/actions.ts` (visit-side refusal as a sentence); `src/app/residents/[id]/[section]/page.tsx` (no Add prescription on a future visit); `src/lib/vets/linkable.ts` (`visitDate()` on the shelter day); `src/lib/i18n/dictionaries/{en,th}.ts`; `src/lib/manual/en.ts`; `src/lib/releases.ts`; `docs/backlog.md`, `docs/decisions.md`
- [x] Roles affected identified: admin, vet (`for all`) and staff (0027's insert/update policies) who write prescriptions see the filtered picker and the sentences; whoever edits vet visits meets the visit-side sentence. Management and volunteer have no prescription write, unchanged. Signed-out public never reaches these pages. The weight form's default date moves with `visitDate()` for visits between 00:00 and 07:00 Bangkok
- [x] Anything explicitly **out of scope** written down: the blood-test, procedure and hospital forms still read a visit's UTC date (`appointment_date.slice(0, 10)`) — added to the backlog branch as its own item; a prescription linked to another resident's visit is a different rule (none on dev)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: merged #191 (`78fb918`), bringing `0107`, its harness and the importer guard; no conflicts
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: typecheck exited 0 after 16s
=== gates: lint exited 0 after 72s
=== gates: build exited 0 after 121s
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration on this branch; `0107` is #191
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration on this branch (after the sync: `Against origin/main 78fb918: 107 file(s), 107 applied row(s).`, no drift)
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration on this branch
- [ ] Applied to **dev** — n/a: no migration on this branch (#191's `0107` is applied to dev, and every check below ran against it)
- [ ] File is re-runnable — n/a: no migration on this branch
- [x] Existing rows still read correctly after the change (checked against real dev data): Angsumalin's three existing prescriptions, linked to 24 Nov and 8 Dec 2025, list and open as before
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration on this branch; #191's harness covers both triggers as a signed-in staff user, and the stale-page runs below exercise them through the app
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration on this branch
- [ ] Production apply plan stated for the release manager — n/a: no migration on this branch; #191 states it

## 4. Functional checks

All against `next dev` on :3009 and the dev database (`0107` applied), signed in through the local app as the dev test login from `.env.local` (admin). Resident Angsumalin (`5f60580b…`): visits 24 Nov 2025 and 8 Dec 2025 (past, each with prescriptions linked) and 29 Sep 2026 (scheduled, tomorrow at the time of testing).

- [x] Happy path works end to end: `/prescriptions/new` for Angsumalin lists *No linked visit*, *8 Dec 2025*, *24 Nov 2025* — the 29 Sep 2026 visit is not offered
- [x] Data persists — reload the page and the change is still there: the edit below was re-read from the database after the redirect (`notes` changed, `vet_appointment_id` still the 29 Sep visit)
- [x] Create / edit / delete all exercised (whichever the feature has): create refused on a future visit and the picker filtered (below); edit of a prescription whose link predates the rule — a verification row planted on dev with the trigger disabled for one transaction (`00000000-…-000000000107`, left in dev as disposable) — lists and preselects its 29 Sep visit (`keep`), and saving a notes change goes through and redirects to the Prescriptions tab with the link kept. No delete in this feature
- [ ] Empty state renders sensibly (no rows yet) — n/a: a resident with no past visits gets a picker with only *No linked visit*, the same path as a resident with no visits today
- [x] Invalid input is rejected with a readable message, not a crash — **the stale-page cases**, which a test of the filter alone would pass:
  - *Prescription:* on `/prescriptions/new`, the 29 Sep visit was put back into the select by script (a stale page or second tab), medication, frequency and dose filled, and saved. The database refused it and the form said *"That vet visit hasn't happened yet, so a prescription can't be linked to it. Link it to a visit on or before today, or leave it unlinked."* No row was written.
  - *Vet visit:* on `/vet-visits/97b02aaf…/edit` (8 Dec 2025, with a prescription linked) the date was moved to 15 Oct 2026 and saved. The form said *"This visit has prescriptions linked to it, so it can't be moved to a day after today. Unlink them from the prescriptions first, or keep the visit on the day it happened."*
- [x] Boundary cases checked:
  - `/prescriptions/new?…&vetAppointmentId=426110d9…` (the future visit in the URL) opens with *No linked visit* selected and start date today, not the hidden visit.
  - The Vet Appointments tab shows *Add prescription* on 8 Dec and 24 Nov 2025 and not on 29 Sep 2026; the other per-visit links (Log blood test, Log procedure, Send to hospital, Edit) are unchanged.
  - The shelter-day edge (a visit at 06:00 Bangkok tomorrow, which is 23:00Z today) is asserted in #191's harness. `visitDate()` uses the same day, so the picker cannot list what the trigger refuses.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/prescriptions/new`, `/prescriptions/[id]/edit`, `/vet-visits/[id]/edit`, the Vet Appointments tab | filtered picker, sentences on refusal | pass — driven, all of §4 |
| management | `/prescriptions/*` | no prescription write policy, unchanged | n/a: no policy changed, not signed in as |
| staff | as admin | as admin | n/a: same code; the trigger was driven as a signed-in staff user in #191's harness |
| vet | as admin | as admin | not signed in as — manual verification row 1 (the item is from the Vet walkthrough) |
| volunteer | `/prescriptions/*` | read-only, unchanged | n/a: no policy changed, not signed in as |
| signed out | `/prescriptions/*`, `/residents/*` | sign-in | pass — the first load of the Vet Appointments tab redirected to `/login?next=…` |

- [ ] Every role above tested — n/a: only admin and signed out driven; the others differ only by RLS policies this PR does not touch; vet is left for manual verification row 1
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): signed out → `/login`; the rule itself is the database's (#191), so hiding the link and filtering the picker are not what keeps a future link out

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`: "Adding a prescription" gains *Only visits up to today are offered…*, and the vet-visit topic's quick-links step says a visit still to come has no prescription or weight link; both found in `/manual`'s text in the running app (inside collapsed topics)
- [x] Translatable strings go through the translation path: the two new sentences are in `t.prescriptions.errors` / `t.vetVisits.errors` in both `en.ts` and `th.ts` (typecheck holds the two in step). Not checked at `/management/translations`, which lists database content, not dictionaries
- [x] Mobile viewport (375px): `/prescriptions/new`, `scrollWidth` 375 = `innerWidth` 375, picker lists the two past visits
- [x] Browser console clean: errors only, excluding `_next/hmr` WebSocket reconnects left over from restarting the dev server — "No console logs." A hydration mismatch seen earlier named the `<option>` injected by the stale-page test itself, and did not recur on a clean reload
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: network log not read; every page and action above rendered its expected result

## 6. Regression

- [x] The pages nearest the change still work: the Vet Appointments tab (all per-visit links present on past visits); `/prescriptions/[id]/edit`; the vet-visit edit form's refusal leaves its normal save path unchanged (the trigger passes an unchanged date, asserted in #191's harness); the weight form, which shares `visitDate()` — `/weight/new?…&vetAppointmentId=` the 8 Dec visit redirected to that reading's edit page (#190's behaviour), which shows date 2025-12-08 and its visit
- [x] Any shared file touched checked from a second, unrelated page: `linkable.ts` → the weight edit page above; `manual/en.ts` → `/manual` loaded; the `[section]` page → the Vet Appointments tab loaded
- [x] Nothing merged from `main` during `sync` was broken by this branch: the sync brought #191; gates run after it, all 0

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**; the UTC-date follow-up for blood tests, procedures and hospital went on the `backlog` branch
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: 2026-09-28 — form and database following 0106; triggers rather than a CHECK or a copied column; the visit-side trigger; the shelter day on both sides and `visitDate()`; the counts; hidden rather than disabled
- [ ] `README.md` still accurate — n/a: README doesn't describe the prescription form
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gains one line: prescriptions link only to visits that have happened, the missing Add prescription link on a future visit, visits with prescriptions can't move past today, existing links kept on edit
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Counts are query output against dev and a read of the snapshot CSVs; the picker, the `keep` path and both sentences are observed above; the UTC-vs-shelter-day edge is #191's harness output

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — deferred: release manager — the picker's "today" is `todayIso()` and `visitDate()` now formats in `SHELTER_TIME_ZONE` rather than slicing the UTC string, so it should hold under the Worker's UTC clock; that is worth one look on the deployed build between 00:00 and 07:00 Thai, with a visit booked for early the next morning. The database side reads `shelter_today()` and does not depend on the Worker
- [ ] **Boundary or banding change covers both edges** — n/a: the picker boundary is today, checked on both sides (past listed, tomorrow hidden); the midnight edges are #191's harness
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page reads prescriptions

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration here. The code works without `0107` too (its error mapping just never fires), so it can deploy before or after #191's production apply
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration on this branch; #191's
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: no migration on this branch
- [x] Apply plan stated: nothing to apply for this PR; `0107` goes with #191

### Rollback

- [x] Rollback position stated, **including what it does not cover**: `wrangler rollback` restores the old picker (future visits listed); with `0107` applied, picking one would then fail with the raw trigger message rather than a sentence. No schema here to revert

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in **as a vet**: *Add prescription* from a past visit on the Vet Appointments tab (preselected, start date the visit's day), no *Add prescription* on a visit still to come, and the picker on `/prescriptions/new` listing only past visits | resident hub → Vet Appointments; `/prescriptions/new` |
| 2 | The two new Thai sentences read naturally | ไทย, then the stale-page cases in §4 (or read them in `src/lib/i18n/dictionaries/th.ts`, `prescriptions.errors.visitInFuture` and `vetVisits.errors.prescriptionsBlockFuture`) |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — two rows await a person

Manual verification by: pending: rows 1 and 2 — a vet's own session through the visit links, and the Thai wording

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none found
- [x] Checklist pasted into the PR (PR body)
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass

Release manager acknowledgement: pending  Date: —

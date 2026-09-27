# Test plan — one-weight-per-visit

## Header

| | |
|---|---|
| Feature | One weight per vet visit and one per resident per day, in the form: the linked-visit picker hides visits that already have a weight (and future visits); a day that already has a reading turns logging into a correction of it; `/weight/[id]/edit` corrects any reading; the indexes' refusals read as sentences |
| Backlog item | `docs/backlog.md` → "One weight per vet visit: hide visits that already have one." (ticked on this branch) |
| Branch / worktree | `claude/one-weight-per-visit` @ `C:\Development\Animal_Shelter_one-weight-per-visit` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3004` |
| PR | #190; schema half #187 (merged, `e6391f9`) |
| Tested by / date | Claude, 2026-09-27/28 |
| Carries a migration? | no — `0106` is #187, applied to dev, which this was tested against |
| Tested at SHA | `387a479` (the change) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the picker is filtered to visits with no weight yet, correcting a weight edits the existing row, and both rules are backed by #187's indexes rather than only the form — the item's three questions plus Lutan's per-day rule, answered in that order
- [x] Files/areas touched listed: `src/app/weight/` (form and actions moved up from `new/`, shared by `new/page.tsx` and the new `[id]/edit/page.tsx`); `src/lib/weight/record.ts` (`updateWeight`, index errors as sentences); `src/lib/vets/linkable.ts` (new, the picker helper); `src/app/residents/[id]/[section]/page.tsx` (Edit on weight rows, Edit weight / Log weight on visits); `src/lib/i18n/dictionaries/{en,th}.ts`; `src/lib/manual/en.ts`; `src/lib/releases.ts`; `scripts/import-appsheet.mjs`; `docs/backlog.md`, `docs/decisions.md`
- [x] Roles affected identified: admin, staff and vet (who write `weight` through `for all` policies) get the filter, the correction and the edit page. Management has no `weight` policy and volunteer read-only, both unchanged. Signed-out public never reaches these pages
- [x] Anything explicitly **out of scope** written down: deleting a reading (not asked for; correction is by edit). The prescription future-visit rule is the next batch's item. It takes `loadLinkableVisits(…, { notInFuture: true })` from here; no prescription code changes in this PR. The pre-existing `appointment_date.slice(0, 10)` reading of a visit's date is kept as every linked-visit form has it (decisions.md)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: first nothing new (`0700a9e`); after #187 merged, a second sync brought in `e6391f9` (`0106`, its harness, plan and decisions entry) with no conflict, then a third brought in #189 (role-based manual, `0210b42`) — also clean, both `unreleased` lines and the weight manual topic intact; and a fourth brought in #188 (`mobile-date-clear`, `53e86b0`) — clean; it adds `OptionalDateInput` for optional dates and leaves the weight form's required date alone; `--status` after the second read `Against origin/main e6391f9: 106 file(s), 106 applied row(s)`, 0 either way
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed:

```
=== gates: typecheck exited 0 after 12s
=== gates: lint exited 0 after 86s
=== gates: build exited 0 after 171s
gates: typecheck=0 lint=0 build=0
```

  Re-run on the tree merged with #188 (`57bc206`):

```
=== gates: typecheck exited 0 after 28s
=== gates: lint exited 0 after 61s
=== gates: build exited 0 after 105s
gates: typecheck=0 lint=0 build=0
```

  Re-run on the tree merged with #189 (`5929ca3`):

```
=== gates: typecheck exited 0 after 12s
=== gates: lint exited 0 after 66s
=== gates: build exited 0 after 137s
gates: typecheck=0 lint=0 build=0
```

  Re-run on the merged tree (`e63d5bf`, after #187):

```
=== gates: typecheck exited 0 after 28s
=== gates: lint exited 0 after 129s
=== gates: build exited 0 after 163s
gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR: #190 before the sync — `check` pass (1m41s), `migration-numbers` pass, `test-plan` pass

## 3. Schema and data

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration on this branch; `0106` is #187
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration on this branch
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration on this branch
- [ ] Applied to **dev** — n/a: no migration on this branch (#187's `0106` is applied to dev, and every check below ran against it)
- [ ] File is re-runnable — n/a: no migration on this branch
- [x] Existing rows still read correctly after the change (checked against real dev data): Angsumalin's existing linked reading (24 Nov 2025) and Canyon's (deceased) render and open as before
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration on this branch; #187's harness covers both indexes, and the second-tab runs below exercise them through the app
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration on this branch
- [ ] Production apply plan stated for the release manager — n/a: no migration on this branch; #187 states it

## 4. Functional checks

All against `next dev` on :3004 and the dev database (`0106` applied), signed in through the local app as the dev test login from `.env.local` (admin). Resident Angsumalin (`5f60580b…`): at start one reading, 5 kg on 24 Nov 2025, linked to the 24 Nov visit; visits 24 Nov 2025, 8 Dec 2025, and 29 Sep 2026 (scheduled, in the future).

- [x] Happy path works end to end: logging today's weight with no reading today saved 5.4 kg on 28 Sep 2026 and landed on the Weight tab
- [x] Data persists — reload the page and the change is still there: every save below was re-read from the Weight tab after redirect, and the final state from the database (3 rows: 24 Nov 5.2 kg linked to 24 Nov; 8 Dec 5.1 kg linked to 8 Dec with its note; 28 Sep 5.4 kg unlinked)
- [x] Create / edit / delete all exercised (whichever the feature has): create (5.4 kg today); correction from the new form (24 Nov 5 → 5.2 kg, visit link and row kept, still one reading that day); edit page (8 Dec 5.1 → 5.05 kg, note added, visit cleared); correction that links a visit (8 Dec: 5.1 kg, 8 Dec visit chosen, notes blank → linked, note kept, still one row). No delete in this feature
- [ ] Empty state renders sensibly (no rows yet) — n/a: the empty Weight tab and a picker with no visits are unchanged paths; a resident with no readings gets no same-day notice (`readings` empty)
- [x] Invalid input is rejected with a readable message, not a crash — **the second-tab cases**, which a naive test of the filter alone would pass:
  - *Per day:* two tabs opened `/weight/new` for Angsumalin with no reading today and no notice. Tab A saved 5.4 kg. Tab B, still showing no notice, saved 5.5 kg for the same day and got *"A weight is already recorded for this resident on that day. There is one weight per day — correct that reading on the Weight tab instead."* No row was written.
  - *Per visit:* two tabs opened `/weight/new?…&vetAppointmentId=97b02aaf…` (8 Dec visit, free). Tab B moved its date to 9 Dec so only the visit rule could refuse it. Tab A saved 5.1 kg. Tab B then got *"That vet visit already has a weight. Correct that reading instead, or link this one to another visit."* Still one reading on the visit.
  - *Assistant:* "log weight 5.6 for Angsumalin", confirmed, on a day that had 5.4 kg got the same per-day sentence on the card
  - Unknown reading id at `/weight/<zero uuid>/edit` → 404
- [x] Boundary cases checked:
  - Picker for Angsumalin lists only 8 Dec 2025. 24 Nov is hidden (it has a weight) and 29 Sep 2026 is hidden (future), checked against the rows in the database.
  - The edit page still lists its own visit (`keep`).
  - Moving an edit onto another reading's day (8 Dec → 24 Nov) shows *"5.2 kg is already recorded for 24 Nov 2025 … Choose another date, or correct that reading instead."*, and the Save button's `disabled` is `true`.
  - `/weight/new?…&vetAppointmentId=` a weighed visit redirects to that reading's edit page (`/weight/a1de45d2…/edit`).
  - Deceased Canyon's reading at `/weight/afc0dcab…/edit` shows the record-closed message, no form.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/weight/new`, `/weight/[id]/edit`, both resident tabs | filter, correction, edit | pass — driven, all of §4 |
| management | `/weight/[id]/edit` | no `weight` policy — same as `/weight/new` today | n/a: no policy changed; the page runs under the session's RLS like `/weight/new`, not signed in as |
| staff | as admin | as admin | n/a: same code and the same `for all` policy shape as admin, not signed in as |
| vet | as admin | as admin | not signed in as — manual verification row 1 (the backlog item is from the Vet walkthrough) |
| volunteer | Edit link visible, write refused | RLS `select` only — an update touches 0 rows and says the reading changed | n/a: unchanged policy; the refusal is RLS's, as for `/weight/new` today, not signed in as |
| signed out | `/weight/*` | sign-in | pass — the first `/weight/new` load redirected to `/login?next=…` |

- [ ] Every role above tested — n/a: only admin and signed out driven; the others differ only by RLS policies this PR does not touch; vet is left for manual verification row 1
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): signed out, `/weight/new` → `/login`; writes run under the session's RLS, and `updateWeight` also scopes by resident, so a posted id for another resident matches no row

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change; the new page is reached from row links
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`: "Logging weight" gains the visit-filter line, the one-per-day correction and how to fix a reading; found on `/manual` in the running app
- [x] Translatable strings go through the translation path: every new string is in `t.weight` / `t.residents.sections` in both `en.ts` and `th.ts` (typecheck holds the two in step). Not checked at `/management/translations`, which lists database content, not dictionaries
- [x] Mobile viewport (375px): `/weight/new` with the same-day notice showing, `scrollWidth` 375 = `innerWidth` 375, notice wraps inside the form
- [x] Browser console clean: `read_console_messages` with errors only — "No console logs." on both tabs after the runs above
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: network log not read; every page and action above rendered its expected result, and the only 404 was the deliberate unknown id

## 6. Regression

- [x] The pages nearest the change still work: the Weight tab (chart, deltas, list), the Vet visits tab (both past visits show *Edit weight* to their own reading, the future visit no *Log weight*, the other per-visit links unchanged), the Prescriptions tab (loads, *Add prescription* present), the assistant's weight card
- [x] Any shared file touched checked from a second, unrelated page: `manual/en.ts` → `/manual` loaded and rendered; the `[section]` page → the Prescriptions tab loaded
- [x] Nothing merged from `main` during `sync` was broken by this branch: `sync` merged nothing new; gates run after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**, using the backlog branch's current wording of the item (with the per-day addition) so the daily merge doesn't conflict, and a done note naming `loadLinkableVisits` for the prescription item
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: 2026-09-27 — correction edits the row; a taken day turns logging into a correction, keeping blank notes/visit; edits can't move onto a taken day; the index still decides; the shared picker helper and the visit-date convention; the importer. (#187 carries the schema entry)
- [ ] `README.md` still accurate — n/a: README doesn't describe the weight form
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gains one line: one weight per visit and per day, the filtered picker, the same-day correction, and Edit on readings
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Filter, correction, edit and both second-tab refusals are observed above; the visit time claim (02:00 UTC) is a count over dev's `vet_appointments`; the importer's "snapshot trips neither" is `--report` output (18 weights, only the two existing unknown-visit notes)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — deferred: release manager — `notInFuture` and the date input's max compare with `todayIso()` (shelter time), unchanged from the existing future-date rule; the Worker's UTC case should be looked at on the deployed build between 00:00 and 07:00 Thai
- [ ] **Boundary or banding change covers both edges** — n/a: not a threshold; each rule was checked on both sides (refused and allowed) above
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page reads `weight`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration here. The code works without `0106` too (its error mapping just never fires), so it can deploy before or after #187's production apply
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration on this branch; #187's
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: no migration on this branch
- [x] Apply plan stated: nothing to apply for this PR; `0106` goes with #187

### Rollback

- [x] Rollback position stated, **including what it does not cover**: `wrangler rollback` restores the old form (no filter, no edit page). Readings corrected through the new paths stay corrected; there is no schema here to revert

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in **as a vet**, from a visit on the Vet visits tab: *Log weight* on an unweighed past visit, then *Edit weight* on the same visit; on an animal's intake day the form offers to correct the intake reading, and saving links it to the visit | resident hub → Vet visits → Log weight / Edit weight |
| 2 | The new Thai strings read naturally (same-day notice, edit page, error sentences) | switch to ไทย on `/weight/new` with a taken day, and on `/weight/[id]/edit` |

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
- [x] Checklist pasted into the PR (#190 body)
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass

Release manager acknowledgement: pending  Date: —

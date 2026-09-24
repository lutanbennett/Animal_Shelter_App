# Feature test plan — intake capacity warning

Filled from `docs/test-plan-template.md`. See that file for the rules each line
is held to.

---

## Header

| | |
|---|---|
| Feature | Intake warns when the chosen enclosure is nearly full or full |
| Backlog item | `docs/backlog.md` → Completed → Resident operations → "Intake warns when the chosen enclosure is nearly full or full" |
| Branch / worktree | `claude/intake-capacity-warning` @ `C:\Development\Animal_Shelter_intake-capacity-warning` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | [#77](https://github.com/lutanbennett/Animal_Shelter_App/pull/77) |
| Tested by / date | Claude (intake-capacity-warning session), 2026-09-24 |
| Carries a migration? | no |
| Tested at SHA | the working tree committed as the feature commit on `claude/intake-capacity-warning`, `a6c21f3`, synced to `6908d14` (#76, migration + script only — nothing this branch touches) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the intake wizard's Arrival step uses the shared `EnclosurePicker` (occupancy in the list and under the chosen enclosure), and Register asks through the shared `CapacityWarningDialog` before placing a new resident into a nearly-full, full or over-capacity enclosure
- [x] Files/areas touched: `src/app/residents/new/{page,IntakeForm}.tsx`; `src/components/EnclosurePicker.tsx` (optional `placeholders`); `src/components/CapacityWarningDialog.tsx` (optional `copy`); `src/lib/i18n/dictionaries/{en,th}.ts`; `src/lib/manual/en.ts`; `src/lib/releases.ts`; docs. No `worker/`, no migration
- [x] Roles affected: whoever can reach `/residents/new` (unchanged — the page's access is not touched); in practice staff and volunteers at the gate
- [x] Out of scope: blocking the intake. The dialog warns and allows, as on Move / hospital return / foster return / edit — Register anyway registers. `record_intake` is unchanged and never checked capacity (the brief said it errored; it does not — noted in the backlog entry)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — fast-forwarded to `06e208c` (#73) cleanly and pushed
- [x] `npm run typecheck` — exit 0
- [x] `npm run lint` — exit 0
- [x] `npm run build` — exit 0
- [x] CI green on the PR — `check` and `test-plan` both pass on #77 at `a6c21f3`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised in a rollback harness — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

Driven in the in-app browser against `next dev` on :3003 (dev database). Test
residents left in dev, which is disposable.

- [x] Happy path works end to end: Front Zone - White → Front Zone 6, listed as `Front Zone 6 — 5 / 5` with `5 / 5 · Full` under the picker; Review read back `Enclosure: Front Zone 6 — 5 / 5`; Register opened "This enclosure is over capacity — Front Zone 6 currently holds 5 / 5. With this resident it will hold 6 / 5. Register the resident there anyway?"; Cancel closed it and stayed on Review with nothing submitted; Register → Register anyway created R-0079 "Capwarn Test 0924", hub shows `Front Zone 6 · Front Zone - White`
- [x] Data persists — the new hub loaded from the server with the placement; the Move page afterwards listed Front Zone 6 as `6 / 5`, i.e. the loader counts the new resident
- [x] Create / edit / delete all exercised: create only — intake has no edit or delete. Three creates: full enclosure via the dialog (R-0079), an enclosure with room (Blue Enclosure 1, `0 / 4 · Space available`) with no dialog (R-0080), and no enclosure at all → Unassigned with no dialog (R-0081, in Thai)
- [ ] Empty state renders sensibly — n/a: the lists come from seeded zones/enclosures; with no zone chosen the enclosure select reads "Select a zone first" and is disabled, and a blank enclosure registers as Unassigned (R-0081)
- [ ] Invalid input is rejected with a readable message — n/a: no new input; the picker only offers real enclosures, and the step validation is unchanged
- [x] Boundary cases checked: `over` (5/5 → 6) titled "over capacity"; `ok` (0/4) no dialog; blank enclosure no dialog. The thresholds themselves are `capacityWarningLevel()`, unchanged and shared with Move

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no change to access | unchanged | n/a |
| management | n/a: no change to access | unchanged | n/a |
| staff | n/a: no change to access | unchanged | n/a |
| vet | n/a: no change to access | unchanged | n/a |
| volunteer | n/a: no change to access | unchanged | n/a |
| signed out | n/a: no change to access | unchanged | n/a |

- [ ] Every role above tested — n/a: no route, action, RPC or policy changed; the page reads the same tables through the same client, now via `loadEnclosureOptions()` (which additionally reads `resident_list_view.enclosure_id`, as Move already does for the same roles)
- [ ] A role that should not have access is blocked server-side — n/a: no access surface changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`, intake topic: Arrival step mentions the occupancy colours; Review step mentions the confirm and that Register anyway still registers)
- [x] Translatable strings go through the translation path: `residents.new.wizard.capacityWarning` added to both `en.ts` and `th.ts` (typecheck enforces the shape); intake's placeholders reuse the existing `noZoneDefault` / `unassignedDefault`. The unused `residents.new.couldntLoadZones` was removed from both
- [x] Mobile viewport (375px) — Arrival step with the picker: no horizontal scroll (`scrollWidth === innerWidth`), zone/enclosure fields align with the untouched date and notes fields, occupancy line visible; registered from that viewport (R-0080)
- [x] Browser console clean — no errors during the runs above
- [ ] Network clean — n/a: not inspected separately; the three registrations each landed on the new hub, which is the only request the change affects

## 6. Regression

- [x] Nearest page checked: `/residents/[id]/move` — placeholders still "Select zone" / "Select enclosure", and the dialog still reads "After this move it will hold 7 / 5 … Move the resident there anyway? … Move anyway" (default copy unaffected by the new prop)
- [x] Shared files touched (`EnclosurePicker`, `CapacityWarningDialog`) checked by loading a second page that uses them — the Move page above, not by reading the file
- [x] Nothing merged from `main` during `sync` was broken by this branch — typecheck/lint/build green on the merged tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch and moved to Completed → Resident operations
- [x] Non-obvious design choice appended to `docs/decisions.md`, dated: why the confirm is on Register rather than Arrival's Next
- [ ] `README.md` still accurate — n/a: the README does not describe the intake form
- [ ] **Release notes.** n/a: in this follow-up PR, which only records the phone sign-off — the feature's staff-facing line ("Registering a new resident now warns you…") went into `unreleased` in `src/lib/releases.ts` with #77 itself, where this line was ticked
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned: the dialog text, counts and placeholders quoted above were read from the running page; "`record_intake` never checked capacity" was checked by grepping every migration for a capacity `raise`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [x] Deployed to test: `npm run deploy:test` from `main` at `a80f090` (#77 merge), 2026-09-24 — output read `deploy: test → Supabase project qxkmhwybjggxvsfxsxbd (a80f090)`, `strip-baked-env: removed 10 env var(s)`, Worker `lanna-animal-care-test` version `bf50a3ec-42bd-473d-be1a-95f7b4d37717`
- [x] Smoke-tested on `test.lannacare.org` on a real phone by Lutan, 2026-09-24: an intake into a full enclosure (Front Zone 6) asks, and Register anyway registers — passed (see Left for manual verification 2)
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic changed
- [ ] Boundary or banding change covered on both edges — n/a: no threshold changed; `capacityWarningLevel()` and `occupancyLevel()` are reused as they are
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the evidence is browser text quoted inline above, not a pasted tool run
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` line seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in production — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: `npx wrangler rollback --env production` restores the old intake form at once; no schema or data is involved, so nothing is left behind

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | The brief said a full enclosure made `record_intake` error; it does not — intake into a full enclosure silently succeeded. Not a code defect, a wrong premise; recorded in the backlog entry | accepted (brief corrected) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The Thai wording of the new dialog sentences reads naturally ("… เมื่อรับตัวนี้เข้าจะเป็น …", "ลงทะเบียนต่อไป") — **checked by Lutan, 2026-09-24** | `/residents/new` in ไทย, choose a full enclosure (e.g. Front Zone 6), Register |
| 2 | The flow on a real phone at the gate: picker readable, occupancy line visible, dialog buttons reachable, Cancel and Register anyway both behave — **checked by Lutan on `test.lannacare.org` at `a80f090`, 2026-09-24: passed** | `/residents/new` on a phone against `test.lannacare.org` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (intake-capacity-warning session)  Date: 2026-09-24

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — Lutan confirmed the Thai wording in chat, and later the real-phone pass on `test.lannacare.org`

Manual verification by: Lutan Bennett — confirmed the Thai wording and the real-phone pass on test.lannacare.org in chat and asked for them to be recorded; line written by Claude at their request  Date: 2026-09-24

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist in the PR: `docs/test-plans/intake-capacity-warning.md` in #77's diff, summarised in its description
- [ ] Handed to the production release manager — n/a: not yet — handed over once the PR is open and signed

Result: pass with accepted defects

Release manager acknowledgement: pending

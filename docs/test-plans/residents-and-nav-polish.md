# Feature test plan

## Header

| | |
|---|---|
| Feature | Operations rename, residents cursor, enclosure-card spanner, residents Unallocated and status chips |
| Backlog item | `docs/backlog.md` → "Rename the menu section …", "Residents: put the cursor in the Search box …", "Enclosure cards: show the maintenance spanner only …", "Residents: replace the "Status" zone chip …" |
| Branch / worktree | `claude/residents-and-nav-polish` @ `C:\Development\Animal_Shelter_residents-and-nav-polish` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-10-08 |
| Carries a migration? | no |
| Tested at SHA | `29b7e53e` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the menu's Shelter Operations becomes Operations; on `/residents` the cursor starts in Search, the Status zone chip becomes Unallocated, and Fostered and Hospitalised chips join Adopted; enclosure cards show the spanner only for open work, with the bare number
- [x] Files/areas touched listed: `src/app/residents/` (page, `FocusSearch.tsx`, `ScanChipBox.tsx`, export route), `src/lib/residents/` (`list-view.ts`, `export.ts`, `status.ts`), `src/components/PlaceZoneChips.tsx`, `src/app/enclosures/EnclosureGrid.tsx`, both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, comments in `NavLinks.tsx`, `operations/`, `permissions/`, `FacilityMap.tsx`, `scripts/lib/acceptance-matrix-entries.mjs`, new `scripts/check-residents-status-chips.mjs`
- [x] Roles affected identified: every signed-in role sees the menu label; admin, management, staff, vet and volunteer use the residents list (a volunteer through `resident_who_and_where`); anyone who opens Enclosures sees the cards. Signed-out public: none
- [x] Out of scope: the `/operations` URL (unchanged, still linked from the manual and release notes); the Thai menu label (it never said "shelter"); released notes in `releases.ts` that name Shelter Operations (history); `/enclosures`' own Lifecycle cards (already Hospital, Unassigned and Fostered only, so they never showed the adopted, and are unchanged); the map view and the Has open maintenance filter; manual screenshots (planned full rerun)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 194s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: `node scripts/check-residents-status-chips.mjs` against dev and the dev server, 43 expectations held — the Lifecycle zone is not a chip, Unallocated is offered (not under Off-site), `?unallocated=1` and an old `?zone=<Lifecycle>` link list the unassigned and leave out adopted, fostered and hospitalised; each of `?status=adopted|fostered|hospitalised` and `?adopted=1` lists only its own status; a name search under Unallocated says how many adopted / fostered / in hospital match; a 15-digit chip typed into Search with a zone picked goes to the resident; `/residents/export?status=fostered` is named `residents-fostered-<date>.csv` and holds the fostered and not the adopted. It also confirmed the item's diagnosis on dev: one sample of each of the four statuses, all in the Lifecycle zone
- [ ] Data persists — n/a: nothing is written; these are filters and labels
- [ ] Create / edit / delete — n/a: nothing is created, edited or deleted
- [x] Empty state renders sensibly: Unallocated alone empties the Enclosure select (those residents have no enclosure) instead of offering enclosures that would empty the list
- [ ] Invalid input — n/a: an unknown `?status=` value is ignored (no chip), and a status with a zone or place is dropped, as `?adopted=1` was
- [x] Boundary cases checked: enclosure cards at 0 jobs (nothing rendered) and at 1 and 5 (spanner and number, aria-label "1 open maintenance job" / "5 open maintenance jobs"), driven in the browser pane on dev

### Role access matrix

No permission changed. `scripts/check-phone-width.mjs` loaded the changed pages signed in as each role (throwaway logins, English and Thai): 66 page views, 4 skipped because the role cannot open the page.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/residents`, `/enclosures`, `/operations` | pages load, no sideways scroll | as expected |
| management | same | same | as expected |
| staff | same; also driven in the browser pane | chips, focus and cards as described | as expected |
| vet | `/residents` | list loads with the new chips | as expected |
| volunteer | `/residents` (who-and-where view), `/enclosures` | list loads with the new chips | as expected |
| signed out | — | no change: these pages redirect to sign-in, as before | n/a, not changed |

- [x] Every role above tested (page load at 375 px)
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [x] Nav entry correct: the menu reads Operations (browser pane, staff), same `/operations` link
- [x] Manual updated (`src/lib/manual/en.ts`): every Shelter Operations path, the residents-list topic (cursor, Unallocated, the three status chips, the download), the chip-scanning topic and the enclosures card spanner. Reading it at `/manual` is under Left for manual verification
- [x] Translatable strings go through the dictionaries: `statusFilter`, `statusOnly`, `statusMatches`, `unallocatedFilter` in both `en.ts` and `th.ts`; `openJobs` removed from both
- [x] Mobile viewport (375px): `check-phone-width.mjs` on `/residents`, `/residents?unallocated=1`, `/residents?status=fostered`, `/enclosures`, `/operations` — no sideways scroll, every action at least 44 px. The chips themselves are `min-h-11` on phones. At 375 px the Filter, Show all, Adopted, Fostered, Hospitalised and No microchip pills wrap to three rows; Unallocated is the last chip of the zone row, which scrolls sideways as before
- [x] Browser console clean — no errors while driving `/residents` and `/enclosures`
- [x] Network clean — every page the check script fetched returned 200 (or the expected redirect for the chip)

## 6. Regression

- [x] The pages nearest the change still work: `/residents` under Everywhere, On-site and Off-site, `/residents/export`, `/enclosures`, `/operations`
- [x] Shared files checked from a second page by loading it: `PlaceZoneChips.tsx` on `/enclosures` (no Unallocated chip, zones as before), `NavLinks.tsx` label on `/enclosures`
- [x] Nothing merged from `main` during `sync` was broken: the merge brought only docs (`backlog.md`, the 0.22.0 release handover), and the gates ran after it

## 7. Documentation

- [x] Backlog items ticked in `docs/backlog.md` on this branch (all four); no other open item's outcome was closed by this work
- [x] Non-obvious design choices: `docs/decisions/2026-10-08-residents-status-chips.md`
- [x] `README.md` still accurate (it does not describe these filters or the menu section)
- [x] **Release notes.** One line in `unreleased` covering all four changes, written for a shelter user
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and the decision were measured: the Lifecycle-zone diagnosis by the check script against dev, the focus behaviour in the browser pane (590 px: no focus; 1280 px: focus in Search; after clicking Unallocated: focus stays on the chip)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: nothing here derives a date
- [ ] Boundary or banding change — n/a: no threshold or band; the 0 / more-than-0 spanner edge is covered in section 4
- [ ] Evidence pasted is the tool's actual output — n/a: the only pasted evidence is the gates' closing lines, copied as printed
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] Project ref read and matches production — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code that reads it — n/a: no migration
- [ ] Production dry run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback position: redeploy the previous release on the Pi (`./scripts/pi/deploy-pi.sh --ref <sha>`); no schema, so nothing else to revert. Old residents links (`?adopted=1`, `?zone=<Lifecycle>`) work on both sides

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | On a real phone, opening Residents does not pop up the keyboard, and on a computer the cursor is in Search | `/residents` |
| 2 | The Residents chips read well and are easy to find on a phone (three rows of pills; Unallocated at the end of the zone row) | `/residents` at phone width |
| 3 | The manual's Operations, Finding a resident, Scanning a microchip and Enclosures topics read correctly | `/manual` |
| 4 | Thai labels for the new chips read naturally (Unallocated ยังไม่ระบุกรง, Fostered อุปถัมภ์ชั่วคราว, Hospitalised เข้ารับการรักษา) | `/residents` in ไทย |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: four items await a person; see the signature line

Manual verification by: pending: the four items under Left for manual verification

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none found
- [ ] Checklist pasted into the PR — n/a: pasted when the PR is opened, after this commit
- [ ] Handed to the production release manager — n/a: at release time

Result: pass

Release manager acknowledgement: pending

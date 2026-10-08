# Feature test plan

## Header

| | |
|---|---|
| Feature | One Off-site chip for every off-site zone, and no Everywhere / On-site / Off-site row, on Enclosures and Residents |
| Backlog item | `docs/backlog.md` → "Enclosures: fold every off-site zone into one "Off-site" zone chip, and drop the Everywhere / On-site / Off-site row above it." |
| Branch / worktree | `claude/enclosures-offsite-chip` @ `C:\Development\Animal_Shelter_enclosures-offsite-chip` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-10-08 |
| Carries a migration? | no |
| Tested at SHA | `b660e1b5` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: on `/enclosures` and `/residents` the place row is removed and the off-site zones become one Off-site chip (`?zone=offsite`, every zone with `internal = false`, read at request time), after the on-site zones and before Status / Unallocated; old `?place=` links redirect to the matching chips
- [x] Files/areas touched listed: `src/lib/enclosures/place.ts` (rewritten: `readZonePick`, `zoneIdsOf`, `zoneChipOrder`, `toggleZone`, `tidiedQuery`), `src/components/PlaceZoneChips.tsx`, `src/app/enclosures/page.tsx` and `EnclosureFilters.tsx`, `src/app/residents/page.tsx`, `src/lib/residents/` (`list-view.ts`, `place.ts`, `export.ts`), both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `scripts/lib/acceptance-matrix-entries.mjs`, `scripts/check-residents-export.mjs`, `scripts/check-residents-status-chips.mjs`, new `scripts/check-offsite-chip.mjs`
- [x] Roles affected identified: everyone who opens Enclosures (admin, management, staff, vet, head of medical, head of maintenance) and the Residents list (those plus volunteer, through `resident_who_and_where`). Signed-out public: none
- [x] Out of scope, written down: the facility map (`?view=map`) was already unfiltered and reads no place or zone filter, so it is unchanged; Settings → Zones is unchanged; no schema. On `/residents` the Off-site chip is off-site zones only — Fostered and Hospitalised keep their own chips from #474 rather than also counting as Off-site (decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date.")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 138s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration; `zones.internal` exists since 0004
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows read correctly — n/a: no migration; existing zones are read as before
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: `scripts/check-offsite-chip.mjs` (dev, throwaway staff login) makes a NEW off-site zone with an enclosure and a resident, and an on-site twin; both pages offer one Off-site chip and no chip of the new zone's own; `/enclosures?zone=offsite` lists the new enclosure and not the on-site one; on-site zone + Off-site lists both; `/residents?zone=offsite` lists the new resident and not the on-site one. All expectations held
- [ ] Data persists — n/a: a filter saves nothing; every state is a GET URL, and each check request is a fresh load of one
- [ ] Create / edit / delete — n/a: a filter, nothing is written
- [ ] Empty state renders sensibly — n/a: with no off-site zone the Off-site chip is simply not offered (`zoneChipOrder`), and `readZonePick` drops `offsite` then; not exercised on dev, which has off-site zones, so reasoned from the code rather than seen
- [x] Invalid input is rejected with a readable message, not a crash: a stale or unknown zone id in `?zone=` is dropped and the URL tidied; `?place=` with any value is removed by the redirect; checked by the script and by `/enclosures?place=internal` in the screenshot run
- [x] Boundary cases checked: old links — `?place=external` → `?zone=offsite` (both pages), `?place=internal` → every on-site zone (plus `unallocated=1` on `/residents`) and no off-site zone, an off-site zone's own id → `?zone=offsite`, the Lifecycle zone's id on `/residents` → Unallocated (`check-residents-status-chips.mjs`); a long zone name ("ZZ Width … Hallway and Laundry Zone, Small Dogs") stays in the scrolling row at 375 px

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/enclosures`, `/residents` | one chip row, Off-site chip, no place row | phone-width check: opened, no overflow |
| management | `/enclosures`, `/residents` | as admin | phone-width check: opened, no overflow |
| staff | `/enclosures`, `/residents` | as admin | `check-offsite-chip.mjs` and phone-width check: as expected |
| vet | `/enclosures`, `/residents` (own clinic's residents) | as admin | phone-width check: opened, no overflow |
| volunteer | `/residents` (who and where) | as admin | phone-width check: opened, no overflow |
| signed out | neither | sent to sign in | not changed by this PR; the pages' permission checks are untouched |

- [x] Every role above tested (phone-width check signs in as admin, management, staff, vet, volunteer, head of medical and head of maintenance; 38 page views, 4 skipped because the role cannot open the page)
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed; `requirePermission("facility.enclosures", "read")` and the residents list's checks are as before

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: `NavLinks.tsx` not touched
- [x] Manual updated (`src/lib/manual/en.ts`): Finding a resident, the Adoption update steps and Enclosures now describe one row of chips; `/manual` opened with no console errors
- [x] Translatable strings: the new `offsiteChip` and `zoneChipsLabel` are in both dictionaries (Off-site / ภายนอกศูนย์, Zones / โซน); the phone-width check ran in Thai too
- [x] Mobile viewport (375px): `node scripts/check-phone-width.mjs --pages=/enclosures,/residents,/enclosures?zone=offsite` — "No page scrolls sideways", "Every component action is at least 44 px"; every chip measured 44 px tall in the screenshot run; before and after screenshots taken at 375 px
- [x] Browser console clean — Playwright at 375 px on `/enclosures`, `/enclosures?zone=offsite`, `/residents`, `/residents?zone=offsite&q=a`, `/manual`: no console errors or warnings
- [x] Network clean — the same run recorded no 4xx/5xx responses

## 6. Regression

- [x] Pages nearest the change still work: `/enclosures` (list), `/residents` (list, status chips, Unallocated, Show all — `check-residents-status-chips.mjs`, all held), `/residents/export` (`check-residents-export.mjs`, all held, now using `?zone=offsite`)
- [x] Shared files checked from a second page by loading it: `place.ts` and `PlaceZoneChips.tsx` are shared by both list pages, each loaded; the dictionaries and `manual/en.ts` checked by loading `/manual`
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged ("Already up to date.")

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch; searched the open items for place, On-site, Off-site, zone chip, `PlaceZoneChips`, `offeredZones`, `zonesKeptIn`: no other open item is closed by this
- [x] Non-obvious design choices added: `docs/decisions/2026-10-08-offsite-zone-chip.md`
- [x] `README.md` still accurate: it does not describe these filters
- [x] **Release notes.** A filter row changing shape is immediately visible: `unreleased` in `src/lib/releases.ts` gained a line in this PR
- [x] Commit messages say why, not just what
- [x] Claims were measured: "no hard-coded names" by a zone the code has never seen; "off-site zones are interleaved with on-site ones in the shelter's order on dev" from the before screenshot's chip list (Middle Zone, Offsite, Orange, Orchard …); "nothing in the app links to `?place=`" by grep over `src/`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: nothing here derives a date
- [ ] Boundary or banding change — n/a: no threshold or band
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

- [x] Rollback position: redeploy the previous release on the Pi (`./scripts/pi/deploy-pi.sh --ref <sha>`); no schema. After a rollback a bookmarked `?zone=offsite` link would show every enclosure (the old code drops an unknown zone id), not an error

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | On a real phone, the one chip row reads well and Off-site is easy to find at the end of the on-site zones (the row scrolls sideways, so a picked Off-site chip can be off screen) | `/enclosures`, `/residents` |
| 2 | The Thai label for the new chip reads naturally (Off-site ภายนอกศูนย์) | `/enclosures` in ไทย |
| 3 | The manual's Finding a resident and Enclosures topics read correctly | `/manual` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: three items await a person; see the signature line

Manual verification by: pending: the three items under Left for manual verification

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none found
- [ ] Checklist pasted into the PR — n/a: pasted when the PR is opened, after this commit
- [ ] Handed to the production release manager — n/a: at release time

Result: pass

Release manager acknowledgement: pending

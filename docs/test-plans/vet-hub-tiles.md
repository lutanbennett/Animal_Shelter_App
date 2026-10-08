# Feature test plan — vet-hub-tiles

## Header

| | |
|---|---|
| Feature | Every tile on a vet's page opens what it counts, starting with a Scheduled list of overdue and upcoming visits |
| Backlog item | `docs/backlog.md` → Vet (clinic) page: every summary tile opens its details — starting with overdue and upcoming appointments |
| Branch / worktree | `claude/vet-hub-tiles` @ `C:\Development\Animal_Shelter_vet-hub-tiles` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3004` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-10-08 |
| Carries a migration? | no |
| Tested at SHA | `437e613b` (after `sync`), plus this plan |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the vet page gains a Scheduled section (overdue red and oldest first, then upcoming) and each tile with something under it links to its list; the doctor's Appointments page shows its To write up count and dates in red
- [x] Files/areas touched listed: `src/app/vets/[id]/VetHub.tsx`, `src/app/vets/[id]/page.tsx` (one column added to the existing embed), `src/components/StatCard.tsx` (optional `onClick`), `src/lib/vets/stats.ts` (overdue sorted oldest first, generic type), `src/app/appointments/page.tsx`, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `docs/backlog.md`, `docs/decisions/2026-10-08-vet-hub-tiles.md`
- [x] Roles affected identified: admin, management and staff (whoever holds `clinics.list` read) on `/vets/<id>`; vet on `/appointments`. Volunteer and signed-out unaffected
- [x] Anything explicitly **out of scope** written down: no rename of "Vet" (parked item); no new pages for procedures, blood tests or prescriptions (they filter the Visits list instead, see the decision file); the phone tiles still show icons instead of titles (F-08, not this item); the Vet role's missing `medical.visits` on dev is reported, not changed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Merge made by the 'ort' strategy`, no conflicts)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 241s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; the one query change adds `profile_photo_drive_file_id` to the existing `residents(...)` embed, read on dev against Novel's 22 visits
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: on dev, Novel's page (`/vets/6fe83bcb-…`) at 375 px, signed in as a throwaway admin. The Scheduled tile reads `3 overdue · 1 upcoming`; tapping it lands on the Scheduled section, which lists Panda (23 Sep), Kame (24 Sep), Angsumalin (30 Sep) in red, oldest first, then Grace (10 Oct) under 1 upcoming, each with photo or placeholder, date, reason, doctor and an Edit link to `/vet-visits/<id>/edit`
- [x] Data persists — n/a: nothing is written by this feature; reloading the page shows the same lists, and the filter resets to all visits, as intended
- [ ] Create / edit / delete all exercised — n/a: the feature reads only; editing happens on the existing `/vet-visits/<id>/edit` page, which is unchanged
- [x] Empty state renders sensibly: a vet with nothing scheduled shows `None scheduled` in the section, and its Scheduled tile has no link (`tileLink` returns nothing for a count of 0). Measured on the phone-width run's seeded vet, which has no visits
- [ ] Invalid input is rejected — n/a: no input on this page besides the period picker and the filter chips
- [x] Boundary cases checked: a period with no costed visits leaves Spend a plain read-out; a filter left on when the period changes and leaves it empty falls back to all visits (`activeFilter`); Procedures counts records (3) where it covers 2 visits, and the chip shows 3, the same as the tile, while the list heading says (2)

Tile by tile, on Novel's page, 6-month period, each tile clicked once the page had loaded (scripted click in the browser pane, result read back from the page):

| Tile | Lands on | Filter chip | List |
|---|---|---|---|
| Scheduled | `#schedule` | — | 3 overdue + 1 upcoming |
| Visits | `#visits` | Visits 22 | (22) |
| Residents seen | `#residents` | — | 14 residents |
| Spend | `#visits` | Spend 1 | (1) |
| Procedures | `#visits` | Procedures 3 | (2), rows open `/residents/<id>/procedures` |
| Blood tests | `#visits` | Blood tests 12 | (9) |

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/vets/<id>`, tiles, Scheduled, Edit links | as before, plus the new section and links | as expected (browser pane, 375 px) |
| management | `/vets/<id>` | as admin | page loads at 375 px in en and th (phone-width run) |
| staff | `/vets/<id>` | as admin; Edit shown only with `medical.visits` read | not loaded separately; same component and guard as admin |
| vet | `/appointments` | To write up count and dates in red | **not seen**: on dev the Vet role has no `medical.visits`, so a linked vet login is sent to `/no-access` from both `/appointments` and `/vets/<id>`. Left for manual verification |
| volunteer | — | unchanged | not tested; no change on any page a volunteer reaches |
| signed out | `/vets/<id>` | redirect to `/login` | as expected (the pane was sent to `/login?next=%2Fvets` before signing in) |

- [ ] Every role above tested — n/a: staff and volunteer not loaded separately (no change to any guard or query filter); vet could not reach the page on dev, see the matrix and the manual table
- [x] A role that should not have access is blocked server-side: the throwaway vet login (no `medical.visits` on dev) fetched `/appointments` and `/vets/<novel>` directly and both returned `NEXT_REDIRECT … /no-access`

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`): the Vets topic gains a step saying what each card opens; the Appointments step says To write up is oldest first with its count and dates in red. Both strings found in `/manual` on the dev server
- [x] Translatable strings go through the translation path: **0 new strings** in either dictionary. Every label reuses an existing key (`vets.hub.schedule`, `overdue(n)`, `upcoming(n)`, `nothingScheduled`, the tile titles, `common.edit`), so the Thai page uses the existing Thai strings
- [x] Mobile viewport (375px): `MSYS_NO_PATHCONV=1 node scripts/check-phone-width.mjs --roles=admin,management,vet --pages=/vets/{vet},/vets/6fe83bcb-79a1-55a5-a7e7-cdc5b1603be2,/appointments`:

```
8 page view(s) measured (admin, management, vet; en + th), 10 skipped because the role cannot open them, 0 warning(s).
40 component action(s) measured for tap size.
No page scrolls sideways.
No text box, select or textarea is under 16 px (iPhone zoom on tap).
Every component action is at least 44 px.
```

The Edit links and filter chips are `min-h-11` (44 px) below `md`.
- [x] Browser console clean: no errors on `/vets/<novel>` or `/residents/<id>` (`read_console_messages`, errors only: none)
- [x] Network clean: every `/vets/<novel>` load returned 200 in the dev server log; resident photos load at the 160 px thumbnail (`/api/photos/<id>?w=160`)

## 6. Regression

- [x] The pages nearest the change still work: `/vets` (shares `scheduleSummary`, still reads `3 overdue` for Novel), `/residents/<id>` hub (shares `StatCard`; its cards still link to their tabs)
- [x] Shared files checked from a second page by loading it: `StatCard.tsx` from the resident hub (loaded, eight card links read back); `stats.ts` from `/vets` (loaded); `manual/en.ts` from `/manual` (loaded)
- [x] Nothing merged from `main` during `sync` was broken by this branch: the merge touched only `docs/` (backlog, release handover, a release test plan), and the gates ran after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**, with a note pointing at the decision file. Searched the backlog for `VetHub`, `/vets/[id]`, `vet hub`, `/appointments`, `StatCard` and `overdue`: no other open item is closed by this (F-08 mentions the vet page's icon-only tiles, which this does not change)
- [x] Non-obvious design choices added as `docs/decisions/2026-10-08-vet-hub-tiles.md` (where each tile goes, why the record tiles filter visits, the chip count, the scroll, 0 new strings, the Vet role finding)
- [x] `README.md` still accurate: its `src/lib/vets/` line describes the statistics, which still hold
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained one line, written for a shelter user
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The 3-vs-2 procedures count, the smooth-scroll failure in the pane and the Vet role's permissions were each read back from the page or `my_permissions()`, not inferred

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: overdue compares a visit's instant with the server's `now`, unchanged by this PR; nothing here derives a calendar day
- [ ] **For a boundary or banding change** — n/a: no threshold changed; overdue/upcoming split is the existing `scheduleSummary` rule, now only sorted
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** (gates and phone-width blocks above)
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: no schema, so `./scripts/pi/deploy-pi.sh --ref <previous sha>` on the Pi restores the old page entirely; nothing to undo in the database

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | The Procedures chip counted visits (2) beside a tile counting records (3) | fixed in `c3aee106`: chips show the tile's number |
| 2 | minor | Smooth scroll did nothing in the desktop app's browser pane, so a tile set the filter without moving the page there | fixed in `c3aee106`: instant scroll |
| 3 | note | On dev the Vet role has no `medical.visits`, so a vet cannot open `/appointments` at all | not this PR's; reported to Lutan in the PR. The vet's cells are left as they are on purpose (roles item, 2026-10-07) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Open Novel's page and tap the overdue tile: it should land on the Scheduled list showing Panda, Kame and Angsumalin in red, oldest first, then Grace under upcoming. Tap Edit on one and check it opens that visit | `test.lannacare.org/vets/<Novel>`, on a phone |
| 2 | Tap Procedures, Blood tests, Prescriptions and Spend: the Visits list should show only those visits, with the matching chip highlighted, and a visit should open the right tab of the resident's record | same page |
| 3 | A doctor login on `/appointments`: the To write up count and dates in red. Needs a vet login that can read visits, which no vet on dev currently can | `/appointments` as a vet |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-10-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — three items wait for a person

Manual verification by: pending: Novel's overdue tile on a phone, the filtered lists, and a doctor's Appointments page

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: not yet — defect 3 is Lutan's to accept or route
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: pending  Date: —

# Feature test plan

## Header

| | |
|---|---|
| Feature | Zone colour, feature half: the palette on Settings → Zones and the zone's dot (or coloured chip) wherever staff see a zone's name |
| Backlog item | `docs/backlog.md` → **A colour for each zone, shown as a coloured dot beside its name** (ticked here) |
| Branch / worktree | `claude/zone-colour-feature` @ `C:\Development\Animal_Shelter_zone-colour-feature` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | #462 |
| Tested by / date | Claude / 2026-10-08 |
| Carries a migration? | no — reads `0162_zone_colour.sql` (#456), already on `main` and applied to dev |
| Tested at SHA | `7d02354b` (after sync with `origin/main`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: Settings → Zones gets a twelve-swatch palette with No colour, and every staff-facing zone name shows the zone's colour as a dot, with the zone filter chips filled with it
- [x] Files/areas touched listed: `src/lib/zones/palette.ts`, `src/components/ZoneName.tsx` (new); `src/app/admin/zones/*`; `PlaceZoneChips`, `EnclosurePicker`, `StatCard` (detail takes a node); residents list, resident page and its move / hospital / rehome / death forms; `/enclosures` (chips, headings, flat cards, map); enclosure page; maintenance board, job page and form; medical resident picker, special diets, medication list; immunization form; the loaders in `src/lib/residents`, `src/lib/enclosures/options.ts`, `src/lib/maintenance/queries.ts`, `src/lib/medical`, `src/lib/medication-list`, `src/lib/diets`, `src/lib/facility-map/types.ts`; both dictionaries, the manual, releases
- [x] Roles affected identified: admin sets the colour (Settings → Zones, `facility.enclosures`); everyone who sees a zone name sees the dot: admin, management, staff, vet (medical lists), volunteer (residents list via `resident_who_and_where`). Signed-out public: nothing; the public pages stay plain
- [x] Out of scope written down: renaming the zones to drop "- Blue" etc. is Lutan's (backlog piece 4); the facility map's outlines stay occupancy colours; the places that keep the zone as plain text are listed in `docs/decisions/2026-10-08-zone-colour-palette.md`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; one conflict in `src/lib/releases.ts` (two new `unreleased` lines at the same spot), resolved by keeping both
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Exit code read directly, output redirected to a file:

```
=== gates: typecheck exited 0 after 15s
=== gates: lint exited 0 after 66s
=== gates: build exited 0 after 214s
gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR: #462, all 7 checks passing on `85d674b7` (read from the PR status, 2026-10-08)

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR; `0162` merged in #456
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR; `0162` was applied to dev by the schema stream
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration in this PR; zones with no colour were checked to keep the plain chip and no dot (§4)
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR; the constraint and the Lifecycle refusal were exercised in `docs/test-plans/zone-colour-schema.md`
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR; `0162` must be live in production before this ships (it is in the release that carries #456)

## 4. Functional checks

- [x] Happy path works end to end: on dev, Settings → Zones edit row → Pink → Save on Cat Zone; the row then read "Pink" with a `#ff7ac2` dot; the dot and the pink chip then showed on `/enclosures`
- [x] Data persists — after saving, the table re-rendered from the server with the colour; `/enclosures` loaded fresh showed it
- [x] Create / edit / delete all exercised: created "ZZ Colour test" with Purple (posted `#b78cff`, row read Purple, picker went back to No colour after the add), edited six zones' colours, deleted the test zone
- [x] Empty state renders sensibly: a zone with no colour shows "No colour" in the table, no dot anywhere and the plain grey chip (Green, Middle Zone on dev)
- [x] Invalid input is rejected with a readable message: `parseZoneColour` refuses anything that is not `#rrggbb` and the action answers "Choose a colour from the palette." (code read: no UI path posts one; the database constraint `zones_colour_hex` is the second line)
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: the only input is a choice from fixed radio buttons; a long zone name wraps beside its dot (`ZoneName` is `min-w-0 break-words`) and no page scrolls sideways (§5)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Settings → Zones, every list | sets colours; sees dots | throwaway dev admin: set and saw them |
| management | lists, not Settings → Zones | sees dots | not separately driven; same components and queries as staff |
| staff | lists | sees dots, no palette | `check-phone-width --roles=admin,staff` loaded the lists as staff; colour editing is behind the unchanged `facility.enclosures` check |
| vet | medical lists | sees dots | n/a: not driven; reads `medication_list_residents` / `special_diet_list`, whose grants 0162 left unchanged |
| volunteer | residents list | sees dots | n/a: not driven; reads `resident_who_and_where`, grants unchanged |
| signed out | public pages | no zone colour anywhere | `/e/[id]` and `/r/[code]` were not changed |

- [ ] Every role above tested — n/a: admin and staff driven; no permission or grant changed, so the other roles see only what they already read, plus one column on views whose grants 0162 kept
- [x] A role that should not have access is blocked server-side: `createZone` / `updateZone` still begin with `can(…, "facility.enclosures")`, unchanged

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`): a step in "Zones and enclosures" on picking a colour, where it shows, and that names can drop the colour suffix
- [x] Translatable strings go through the translation path: the palette's twelve names, No colour, Other colour and the hints are in both `en.ts` and `th.ts`; `typecheck` holds the Thai dictionary to the English shape
- [x] Mobile viewport (375px): `node scripts/check-phone-width.mjs --roles=admin,staff --pages=/enclosures,/residents,/maintenance,/medical/diets,/operations/medication-list,/maintenance/new` printed `24 page view(s) measured (admin, staff; en + th) … No page scrolls sideways. … Every component action is at least 44 px.` A resident page and its move and hospital forms were measured in the browser pane at 375 px: no sideways scroll (scrollWidth − innerWidth = 0)
- [x] Browser console clean: `read_console_messages` with errors only returned none after the run
- [x] Network clean — no failed saves; every server action in §4 returned its success state

## 6. Regression

- [x] The pages nearest the change still work: Settings → Zones (create, edit, move arrows untouched, delete), `/enclosures` list and chips, `/residents`, a resident page, move and hospital forms, `/maintenance`, `/medical/diets`, `/operations/medication-list`, all loaded with no error text
- [x] Shared file checked from a second page: `StatCard` (now takes a node as `detail`) loaded on the resident page; `EnclosurePicker` loaded on the move form; `src/lib/manual/en.ts` passes `acceptance-matrix --check` in lint
- [x] Nothing merged from `main` during `sync` was broken: gates ran after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch. Other open items searched for colour, zone chip, zone name and the touched components; none is closed by this. The colour-theme item gets a follow-up note on the `backlog` branch (a light theme would need white and sand re-checked)
- [x] Non-obvious design choices: `docs/decisions/2026-10-08-zone-colour-palette.md`
- [x] `README.md` still accurate — it does not describe zones' appearance
- [x] **Release notes.** One line added to `unreleased` in `src/lib/releases.ts`, written for staff
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every swatch's contrast was computed by script against the six surface hex values in `globals.css` (lowest 4.5:1); the chip's chosen text was computed against all twelve swatches

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold or band changed
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the pasted gates and phone-width lines are copied as printed; no hand-made table of results
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration here; the code reads `0162`, which must already be live in production. `apply-migrations.mjs` warns if it is not
- [ ] `--env production --dry-run` — n/a: no migration in this PR
- [ ] Fresh production backup for a destructive migration — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR; `0162` goes first, with its own PR's plan

### Rollback

- [ ] Rollback position stated — n/a: code only; a Pi rollback to the previous ref removes the dots and the palette, and the `colour` column stays, harmless

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | In the Settings → Zones edit row the palette stacked one swatch per line, because a table cell shrinks to its narrowest content | fixed: the edit-row picker has a fixed width (six per row) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The twelve colours look right to people who know the zones, and none two are hard to tell apart on a real phone outdoors | Settings → Zones, `/enclosures` on Test |
| 2 | The Thai swatch names read naturally (e.g. teal as สีเขียวอมฟ้า, sand as สีทราย) | Settings → Zones in Thai |
| 3 | The coloured filter chips are what was asked for | `/enclosures`, `/residents` on Test |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; three items wait for Lutan

Manual verification by: pending: the three items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released

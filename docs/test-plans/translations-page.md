# Feature test plan — translations-page

## Header

| | |
|---|---|
| Feature | Management → Translations lists labels beside prose; a Thai box on every list's own screen; every reader shows the Thai |
| Backlog item | `docs/backlog.md` → **One place to translate everything** (ticked); F-11 partly closed |
| Branch / worktree | `claude/translations-page` @ `C:\Development\Animal_Shelter_translations-page` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | #479 |
| Tested by / date | Claude / 2026-10-09 |
| Carries a migration? | no — reads `0166_label_translations.sql`, merged and applied to dev in #476 |
| Tested at SHA | `3e3ccef3` (after sync with `origin/main` `a8716dd4`: already up to date) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the item's "still open (batch 79)" list: the page, the field on each list's own screen, every reader showing the Thai, the catalogue note, manual, test plan per group, the Thai walk
- [x] Files/areas touched listed — page: `src/app/management/translations/*`, `src/lib/translations/labels.ts`. Own screens: `src/app/admin/{diets,medications,frequencies,immunization-types,procedure-types,blood-test-types}/*`, `src/app/management/vets/*`, `src/app/management/cashflow/fixed-outgoings/*`, `src/lib/management/fixed-outgoings.ts`, `src/components/UnitsPanel.tsx`, `src/app/management/units/actions.ts`, `src/lib/units.ts`. Readers: resident hub and tabs, hospital, medication list, special diets, diet pickers and enclosure markers, prescription, vaccine, procedure, blood-test, intake and vet-visit forms, stocktake, deliveries, purchasing, stock pages and stock cells, stock usage, clinic pages, Residents, the home page gallery. Docs: dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `docs/roles-and-permissions.md`, README, backlog, `docs/decisions/2026-10-09-translations-page.md`
- [x] Roles affected identified — admin and management (the page and the Thai boxes); every role reading Thai (the readers); signed-out public (gallery alt text)
- [x] Anything explicitly **out of scope** written down — in the decision file: gallery photos get no Thai box on their own screen (no English alt editor exists); the deceased archive PDF/index, CSV export, Drive file names, the assistant and the dashboard's procedure grouping stay English; resident breed and colour is batch 81; machine-drafted translations stays open

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `merging origin/main into claude/translations-page`, `Already up to date.`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 142s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR — all 7 checks passing on #479 at `1449c622`, read from the PR status before merging

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR (0166 was applied by #476)
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR; the readers were run against real dev rows (section 4)
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR; the functions it calls were exercised through the API as real logins instead (section 4)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR, but **this code needs `0166` on production before it deploys** (it calls `label_translations()` and selects the new `_th` columns); see section 8

## 4. Functional checks

Driven as disposable dev accounts of each role (`transpage-*-20261009@example.test`, made by script, credentials only in this worktree's `.env.local`), through the API and the running dev server on :3006.

- [x] Happy path works end to end — as Management: the page renders every group with counts (Website 12 missing · 2 out of date, Residents 44, Projects 18, Diets 2, Medications all done · 24 shown as typed, Stock units 2, Setup lists 38 · 7 shown as typed, Places 8, Maintenance 10, Recurring jobs 18, Shelter Friends 4, Roles all done · 6 shown as typed); `set_label_th()` on a blood-test type (an Admin list) returned `true` and the label read `current` with its Thai trimmed
- [x] Data persists — reload the page and the change is still there — the saved Thai read back through a fresh `label_translations()` call and a fresh page fetch
- [x] Create / edit / delete all exercised (whichever the feature has) — write, clear (blank Thai → `missing`), and the out-of-date round trip: English renamed → `stale` with the old English shown; same Thai saved alone stayed `stale`; the page's reconfirm (clear, then write) → `current`. English restored afterwards. The Thai boxes on the list screens were typechecked and built, not driven in a browser (left for manual verification, row 2)
- [x] Empty state renders sensibly (no rows yet) — Out of date lists only the Website section (its two stale prose rows, old and new English side by side); every other section stays in the summary with its count and drops out of the body. Fixed outgoings, which has no rows on dev, has no section at all. The whole-page empty message ("Nothing is out of date") was not reached on dev data
- [x] Invalid input is rejected with a readable message, not a crash — an unregistered column is refused by `set_label_th()` ("not a translatable label"); a deleted row returns `false`, which the action words as "That item no longer exists"
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — surrounding spaces trimmed; spaces-only clears; optional lists (24 medicines) read `as_typed`, never `missing`

### Per group

| Group | Own screen's Thai box | On the page | A reader showing it in Thai (Thai walk, section 5) |
|---|---|---|---|
| Website | existing (Settings → Website); gallery photos have none — decision file | listed, 12 missing | home page gallery alt (code; no gallery alt filled on dev) |
| Residents / Projects / Maintenance / Recurring jobs / Shelter Friends (prose) | existing `TranslationPanel` | listed as before, now in sections | unchanged readers (0056) |
| Diets | Settings → Diets, add and edit | 2 missing | diet tab, hub, special diets, stocktake, deliveries, purchasing, stock pages, pickers |
| Medications (optional) | Settings → Medications | 24 shown as typed | medication list, prescriptions tab and picker, stock pages, stocktake, deliveries |
| Stock units | the units panel on both item settings pages | 2 missing | stocktake, deliveries (form and history), stock cards, purchasing |
| Setup lists (frequencies, the three types, clinics) | each Settings list; Management → Vets for clinics (optional) | 38 missing · 7 shown as typed | medical tabs, due dates, pickers, medication list, clinic pages, Residents |
| Places / Projects (labels) | existing | 8 / 18 missing | existing (0058) |
| Fixed outgoings | Cashflow → Fixed outgoings | no rows on dev | the outgoings list |
| Roles (optional) | existing | 6 shown as typed | existing |

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/management/translations`, writes | allowed | n/a: not driven — Admin passes every `has_permission()`; Management, the narrower holder, was |
| management | page, `label_translations()`, `set_label_th()` | allowed, including Admin's setup lists, without editing them | page 200 with every group; write `true`; direct update of the list's English changed 0 rows |
| staff (2IC) | page, `set_label_th()`, `label_translations()` | refused | page redirected to `/no-access`; write `42501 translations.manage is required`; read returns 0 rows |
| vet | page | refused | n/a: not driven — holds no translations cell, same gate as the 2IC above |
| volunteer | page | refused | n/a: not driven — holds no translations cell, same gate as the 2IC above |
| signed out | `set_label_th()` | refused | `42501 permission denied for function set_label_th` |

- [x] Every role above tested — the four that differ (Management allowed, 2IC and the Head of Medical refused, signed out refused); admin, vet and volunteer reasoned as above
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — the 2IC's direct fetch redirected to `/no-access`; its RPC write got `42501`

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change; the page's entry is unchanged
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — the Translations topic rewritten ("Translating"), the cross-reference on the language topic updated; screen names checked against the dictionaries (Vets, Fixed outgoings). Read as source, not at `/manual` in a browser (row 3)
- [x] Translatable strings go through the translation path, checked at `/management/translations` — the page itself; both dictionaries carry every new key (typecheck enforces `th: Dictionary`), page fetched in Thai and every heading, filter and count read in Thai
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not seen in a browser; left for manual verification (row 1). The server-side Thai walk below covers what is shown, not how it fits
- [x] Browser console clean — no errors or React warnings — server side: the one error found while building (`SHOWS.includes is not a function`, a client export read on the server) was fixed; every page in the walk returned 200 with no error digest. The browser console itself was not read (no signed-in browser)
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — every page fetched in the walk returned 200

**The Thai walk, scripted.** Every label in the tables a Thai reader meets (73: diets, medicines, frequencies, the three type lists, units, clinics) was given a temporary marked Thai, each page fetched in Thai as that role, and every registered English label still present listed. The marks were then removed. Final run, unedited:

```
gave 73 labels a temporary Thai
second_in_command    200  /home                                      Thai labels shown:   0  English left: 0
second_in_command    200  /deliveries                                Thai labels shown:  33  English left: 0
second_in_command    200  /maintenance                               Thai labels shown:   0  English left: 0
second_in_command    200  /management/purchasing                     Thai labels shown:  59  English left: 0
second_in_command    200  /my                                        Thai labels shown:   0  English left: 0
second_in_command    200  /operations                                Thai labels shown:   0  English left: 0
second_in_command    200  /residents                                 Thai labels shown:   0  English left: 0
second_in_command    200  /stocktake                                 Thai labels shown:  25  English left: 0
second_in_command    200  /r/69255d5b-72ae-490f-96a6-7f3b095e6190    Thai labels shown:   0  English left: 1
      vets: "Mae Wang" in "Mae Wang, Chiang Mai, Thailand"
head_of_medical      200  /home                                      Thai labels shown:   0  English left: 0
head_of_medical      200  /medical/diets                             Thai labels shown:   4  English left: 0
head_of_medical      200  /medical/photos                            Thai labels shown:   0  English left: 0
head_of_medical      200  /medical/weight                            Thai labels shown:   0  English left: 0
head_of_medical      200  /operations/medication-list                Thai labels shown:   4  English left: 0
head_of_medical      200  /operations/medication-list?view=list      Thai labels shown:  11  English left: 0
head_of_medical      200  /residents                                 Thai labels shown:   0  English left: 0
head_of_medical      200  /my                                        Thai labels shown:   0  English left: 0
head_of_maintenance  200  /home                                      Thai labels shown:   0  English left: 0
head_of_maintenance  200  /maintenance                               Thai labels shown:   0  English left: 0
head_of_maintenance  200  /residents                                 Thai labels shown:   0  English left: 0
head_of_maintenance  200  /my                                        Thai labels shown:   0  English left: 0
management           200  /management/diets                          Thai labels shown:   6  English left: 0
management           200  /management/medications                    Thai labels shown:  28  English left: 1
      item_unit_conversions: "packet" in "Simulation: packet of 50, usually purchased"
management           200  /vets                                      Thai labels shown:   7  English left: 0
management           200  /management/vets                           Thai labels shown:   7  English left: 7
      vets: "ZZ Width 3e01fe1d Dr Somchai Rattanakosin-Wongsawat" in "ZZ Width 3e01fe1d Dr Somchai Rattanakosin-Wongsawat"
      vets: "Novel" in "Novel"
      vets: "Mae Wang" in "Mae Wang"
      vets: "Family Pet Clinic (FPHC)" in "Family Pet Clinic (FPHC)"
      vets: "Chiang Mai Centre Animal Hospital (CMCAH)" in "Chiang Mai Centre Animal Hospital (CMCAH)"
      vets: "LCA Onsite blood work" in "LCA Onsite blood work"
      vets: "[roster] Test Clinic" in "[roster] Test Clinic"
management           200  /residents/5f60580b-315b-5254-a6d0-f8d1aa3bccd4 Thai labels shown:   9  English left: 0
management           200  /residents/5f60580b-315b-5254-a6d0-f8d1aa3bccd4/immunizations Thai labels shown:   3  English left: 0
management           200  /residents/5f60580b-315b-5254-a6d0-f8d1aa3bccd4/vet-appointments Thai labels shown:   3  English left: 0
management           200  /residents/5f60580b-315b-5254-a6d0-f8d1aa3bccd4/prescriptions Thai labels shown:   9  English left: 0
management           200  /residents/5f60580b-315b-5254-a6d0-f8d1aa3bccd4/diet Thai labels shown:   3  English left: 0
management           200  /residents/5f60580b-315b-5254-a6d0-f8d1aa3bccd4/procedures Thai labels shown:   1  English left: 0
management           200  /residents/5f60580b-315b-5254-a6d0-f8d1aa3bccd4/blood-tests Thai labels shown:   3  English left: 1
      medication: "FBC" in "• FBC 14 days"
management           200  /residents/5e3294c1-0fbf-56f0-a49a-a31aec720015/immunizations Thai labels shown:   6  English left: 0
management           200  /prescriptions/new?residentId=5f60580b-315b-5254-a6d0-f8d1aa3bccd4 Thai labels shown:  34  English left: 0
management           200  /immunizations/new                         Thai labels shown:   7  English left: 0
management           200  /vet-visits/new                            Thai labels shown:   7  English left: 0
management           200  /enclosures                                Thai labels shown:   0  English left: 0
restored 73 labels to no Thai
```

What the remaining lines are: a contact's typed address (`Mae Wang, Chiang Mai`), a unit conversion's typed note, a blood test's typed result, and Management → Vets, the clinic list's own edit screen, which shows the English and the Thai side by side on purpose. None is a label shown in English where the Thai exists. The first run had two real misses — "packet" in the delivery history and on the medicine stock cards — fixed in `f98d449b`.

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — every page in the walk above, in Thai, returned 200; the Translations page in English under all four URLs (`/`, `?show=stale`, `?show=all`, `?all=1`)
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — `src/lib/units.ts` (`CONVERSION_COLUMNS` gained `unit_th`) loaded through `/stocktake` and `/deliveries`; `src/components/StockCells.tsx` through `/management/medications` and `/management/diets`; `src/lib/diets/special.ts` through `/enclosures`
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` merged nothing (already up to date)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — and F-11 noted as partly closed by this work (the three type lists' Thai is now enterable and shown; what remains there is data entry, the public texts and the Thai manual)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-10-09-translations-page.md`
- [x] `README.md` still accurate — the translations paragraph and the management role line now describe the label half
- [x] **Release notes.** One line in `unreleased` describing the page, the Thai boxes and the readers for a shelter user
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the reconfirm behaviour (same Thai alone stays stale; clear-then-set is current), the refusals and the counts were all measured on dev as quoted above

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or band changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the gates lines and the Thai walk are pasted as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration here, but the code reads `0166`, which must be on production **before** this deploys
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager (for `0166`, if production does not have it yet)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: 0166 is additive
- [ ] Apply plan stated — deferred: production release manager. `0166_label_translations.sql` on `dbkodyyxxhtygxcxmfcu` before deploying this build; check `--status --env production` first, as the runner applies every pending file

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — deferred: production release manager. Code only; rolling back the build leaves any Thai already typed in the columns, which is harmless to the old code

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | major | The page crashed on load: `SHOWS` was exported from the client component and read on the server | fixed (moved to `src/lib/translations/labels.ts`) |
| 2 | minor | Clinic link pointed at `/management/vets/<id>`, which has no page | fixed (links to the list) |
| 3 | minor | Thai walk: "packet" in English on the delivery history and the medicine stock cards | fixed in `f98d449b` |
| 4 | minor | Saving an out-of-date label's Thai unchanged left it out of date (the snapshot trigger only fires on a Thai change) | fixed in the action (reconfirm: clear, then write) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The 375 px Thai walk by eye: the 2IC's, the Head of Medical's and the Head of Maintenance's homes and the pages their tiles open, switched to Thai — nothing overflows, and no label a Thai reader should see is in English where its Thai has been typed | test.lannacare.org or :3006, signed in as each role, Thai, phone width |
| 2 | Typing a Thai name on each list's own screen (one diet, one medicine, one frequency, one vaccine type, one unit, one clinic, one fixed outgoing) and seeing it on Management → Translations as Translated | Settings lists, Management → Vets, Cashflow → Fixed outgoings |
| 3 | The Translations page reads well on a phone and on a computer, in both languages: sections, the counts at the top, Shown as typed on medicines, the "not one you can open" line as the Director | `/management/translations` as a Management login |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-09

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: three items wait for a person (pending below)

Manual verification by: pending: the three rows under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR — in the body of #479
- [ ] Handed to the production release manager — n/a: not yet — handed over with the release that carries it

Result: pass

Release manager acknowledgement: pending: the release that carries it

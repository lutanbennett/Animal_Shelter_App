# Feature test plan — card-decisions-schema

## Header

| | |
|---|---|
| Feature | Card review 1, the schema half: a who-and-where resident read for cards 1–4, Do maintenance loses the resident record, the enclosure read for View residents and Residents, names-only contacts for Residents, the new Record a death card, Residents' public-photo grant swapped for Add shelter photos, and deleting a delivery made Admin only |
| Backlog item | `docs/backlog.md` → "Card review decisions, cards 1–10 of 29", clause (a) only; the item stays open for the app half |
| Branch / worktree | `claude/card-decisions-schema` @ `C:\Development\Animal_Shelter_card-decisions-schema` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-26 |
| Carries a migration? | yes: 0265 |
| Tested at SHA | cf8f2fa2 |

## 1. Scope and risk

- [x] One sentence: the database half of Lutan's 2026-10-26 answers for cards 1–10, expressed as card grants, one new activity, one new card and one delete policy
- [x] Touched: `supabase/migrations/0265`, `src/lib/permissions` (cards, jobs, catalogue, cards.test), both dictionaries, `scripts/check-cards-count.mjs`, `scripts/check-card-grants.mjs` (its neutral test activity), the regenerated card walkthrough, the Record a death card report, the decision file, backlog, release notes
- [x] Roles affected: every role holding Residents (gains Record a death; loses the death and public-photo grants), the four job cards, Do maintenance, View residents (so also Doctor, which holds it), Record a delivery. Admin untouched and given nothing
- [x] Out of scope: the app half (hidden buttons and menu entries, My tasks piece, profile-picture guard, Add medical photos wording, spreadsheet download off for cards 1–4, the Enclosures page counts), the other 19 card reports, "Assigned to" pop-up search, whether Residents keeps `placement.hospital` (filed on the backlog branch)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly (one docs/backlog.md auto-merge)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number 0265, next free on main; the only migration in flight
- [x] `--status` reviewed: dev 265 applied, 0 pending before the apply; production (read by the planner) the same
- [x] `--dry-run` reviewed: 0265 ok
- [x] Applied to dev (`qxkmhwybjggxvsfxsxbd`): 0265 ok, 266 applied
- [x] Re-runnable: on conflict / where not exists / drop … if exists
- [x] Existing rows still read correctly: `role-cards-coverage` prints "Every held card is covered" on dev and on production; `cards-union` shows every dev role exactly the union of its cards; `check-card-grants` passes (70 rows, 4 includes, 38 roles)
- [x] Constraints and defaults exercised against real rows in rolled-back `do $$` blocks run as each one-card login (below); the one-way door: Management, `staff` and the throwaway Residents role each hold Record a death on dev, and production's Management, 2IC and `staff` will get it from the same file
- [ ] Down-migration — n/a: additive grants; undone by re-inserting the deleted `card_grants` rows, deleting `record_death`, and restoring the `stock_receipts` delete policy from 0143
- [x] Production apply plan: `node scripts/apply-migrations.mjs --env production` at the next release, by Lutan, before or with the app; the app half is a separate PR

What the rolled-back blocks asserted, as each login (nothing kept):

- Record weight: a weight row inserts and reads back; Add medical photos: `medical_photo_residents` shows the resident and `record_attachment` writes the Medical row
- Residents only: reads enclosures, reads 5 carers through `picker_contacts` and 0 rows of `contacts`, cannot insert the Deceased placement, a Foster upload is refused ("Medical folder only"), a Shelter upload is accepted
- Record a death only: sees the Deceased enclosure and inserts the Deceased placement
- Record a delivery: reads 11 deliveries, deletes 0; Admin deletes 1. Do maintenance deletes 0 jobs

## 4. Functional checks

- [x] Happy path: each of cards 1–4, Do maintenance, View residents, Residents, Record a death still opens its job page with its data (HTTP with a real one-card session, below)
- [x] Data persists — a weight and a death placement were written and read back inside a transaction, then rolled back on purpose
- [ ] Create / edit / delete — n/a: no new screen; delete of a delivery is covered by the matrix below
- [ ] Empty state — n/a: no list added (the Residents list is empty for the four job cards; hiding that entry is the app half)
- [ ] Invalid input — n/a: no input added
- [ ] Boundary cases — n/a: grants and one policy

### Role access matrix

Driven with `dev-signin.mjs --cards` logins against the dev server on :3005, fetching the rendered pages; the writes by rolled-back SQL as the same login.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| administer_medication (card 1) | medication list; Residents list | list works; Residents empty | as expected |
| record_weight (card 2) | weight picker and save; Residents list | works; empty | as expected |
| add_medical_photos (card 3) | picker and record_attachment; Residents list | works; empty | as expected |
| feed_special_diets (card 4) | diets list, feeding list; Residents list | works; empty | as expected |
| do_maintenance (card 5) | board, new job, Enclosures; Residents | works; Residents empty | as expected; Enclosures says "0 residents", a wrong count filed for the app half |
| record_delivery (card 8) | records; delete | records, deletes none | as expected |
| view_residents (card 9) | Residents list 93, Enclosures with 55 residents | full list, enclosures fill | as expected |
| residents (card 10) | move, foster (carers), photos, death | forms fill; no death form; Medical and Shelter folders only | as expected |
| record_death (new) | death form and Deceased placement | opens and writes | as expected |
| admin | delete a delivery | allowed (outside the card system) | allowed |
| signed out | any of the above | refused | n/a: not changed by this migration, no policy touched grants to anon |

- [x] Every role above tested (cards 6 and 7, Do stocktaking and Do the purchasing, are unchanged and were not driven)
- [x] A role that should not have access is blocked server-side: the delivery delete, the Deceased insert and the Foster upload were refused in SQL as the login, not hidden in the UI

## 5. Cross-cutting

- [ ] Nav entry — n/a: no route added; the Residents menu entry for cards that cannot use it is the app half
- [ ] Manual — n/a: no manual topic describes these grants; the manual follows cards in a separate item
- [x] Translatable strings: the card label and description and the activity label are in English and Thai
- [ ] Mobile viewport — n/a: no layout change
- [ ] Console clean — n/a: pages fetched over HTTP, not a browser console
- [ ] Network clean — n/a: every fetched page returned 200

## 6. Regression

- [x] The pages nearest the change still work: medication list, feeding list, weight picker, medical photos picker, maintenance board and new job, Enclosures, Residents, move / foster / photos / death pages (loaded, not read)
- [x] Shared files touched (cards.ts, jobs.ts, both dictionaries, releases.ts) are covered by typecheck, the card tests and the build; the card walkthrough regenerated and `check-card-walkthrough` passes for 30 cards
- [x] Nothing merged from `main` during `sync` was broken (gates)
- [x] `check-hard-coded-security` shows no finding from 0265. It is already red on `main` with five 0264 findings (retired role columns) that this PR does not touch

## 7. Documentation

- [ ] Backlog item ticked — n/a: clause (b) is still open, so the item is rewritten to say the schema half is done and the app half is what is left
- [x] Decision file `docs/decisions/2026-10-26-card-review-1-schema.md`
- [ ] README — n/a: nothing in README names these grants
- [x] **Release notes.** Three lines added to `unreleased`, tagged by card, each true on the day the release applies 0265
- [x] Commit messages say why
- [x] Claims were measured: the rolled-back blocks and the fetched pages above, and the check scripts' own output

## 8. Pre-production gate

- [ ] Tested SHA recorded — n/a: nothing deploys from this PR
- [ ] Deployed SHA matches — n/a: nothing deploys
- [ ] Deployed to test — n/a: nothing deploys
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: none
- [ ] Boundary/banding — n/a: no threshold
- [ ] Evidence is the tool's actual output — n/a: gates output above is verbatim
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none
- [ ] Migration and reader code together — deferred: release manager; the app half is a later PR and 0265 is safe without it
- [ ] Production dry-run — deferred: release manager
- [ ] Backup — deferred: release manager
- [ ] Apply plan stated — deferred: release manager
- [ ] Rollback — n/a: see section 3, additive grants; the revert is the three statements named there

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | The Enclosures page shows "0 residents · 325 spaces free" to a login with no resident read (Do maintenance), a wrong figure | deferred to backlog (named in the line-13 item, app half) |
| 2 | low | Residents keeps `placement.hospital` although its button is to be hidden | deferred to backlog (filed on the backlog branch) |
| 3 | low | `check-card-grants.mjs` used `facility.enclosures` as its neutral activity, which View residents now carries | fixed in this PR (now `community.outings`) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | One-card logins for cards 1–10 and Record a death, opened in a real browser with their buttons and menu entries as the app half leaves them | dev, after the app half |
| 2 | Doctor (View residents only) now also holds `facility.enclosures` at read; confirm that is acceptable for the card test role | Settings → Who does what, dev |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-26

### Manual verification

- [ ] The manual list above is not empty — n/a: only the person who looked may tick this, and nobody has yet

Manual verification by: pending: a person opening the one-card logins in a browser after the app half, and confirming the Doctor change

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: the release manager reads it from the branch

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released

# Test plan: card-review-2-cards-schema

## Header

| | |
|---|---|
| Feature | Three view-only cards (`food_forecast`, `medicine_forecast`, `view_cashflow`), the three page guards asking read, every edit control on those pages drawn only at edit, and `reports.cashflow` taken off the `dashboard` card |
| Backlog item | `docs/backlog.md` → THE CARDS FROM CARD REVIEW 2 (steps i–iii done; step iv, the walkthrough steps, is a later batch, so the box stays open) |
| Branch / worktree | `claude/card-review-2-cards-schema` @ `C:\Development\Animal_Shelter_card-review-2-cards-schema` |
| Dev server | `next dev` on port 3001. Dev schema 280 applied, 0 pending |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-10-28 |
| Carries a migration? | yes: `0280_forecast_and_cashflow_view_cards.sql` |
| Tested at SHA | 54b370fa |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: three read-level cards, guards that ask read, controls drawn only at edit, and cashflow off the dashboard card
- [x] Files/areas touched listed: `src/lib/permissions/cards.ts`, `routes.ts`, both dictionaries, the diets, medications and cashflow pages and their card/view components, `0280`, `cards.test.mjs` and `check-cards-count.mjs` (33 to 36 cards), the decision file and a status note on the backlog item
- [x] Roles affected identified: none by role. Stated by card: a holder of `dashboard` loses an inert `reports.cashflow` read; nobody is given a new card; Admin is untouched
- [x] Out of scope written down: the medicine list, diet list and stock usage (Admin tasks, no card), walkthrough steps, any production apply, the links from these pages to other pages (recorded as found, not fixed)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`docs/backlog.md` only)
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 137s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (`0279`), and no other in-flight branch carries one (the runner printed `migration numbers: ok`)
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying (1 pending: 0280)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed (`0280 … ok`)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` (`applying 0280 … ok`)
- [x] File is re-runnable (`on conflict … do update`, `delete where`, `on conflict (card) do nothing`)
- [x] Existing rows still read correctly after the change: Admin and the four card-only logins below read the pages from dev rows
- [ ] Constraints and defaults exercised against real rows in a `begin; … rollback;` harness — n/a: the file inserts grant rows and deletes one; the `card_grants` triggers of `0257` were exercised by `check-card-grants.mjs` (`direct insert grants; direct delete removes; card_grants changes reach every holder` passed)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: re-inserting `('dashboard','reports.cashflow',1)` and deleting the three cards' grants reverses it; nobody holds the new cards, so no role changes
- [ ] Production apply plan stated for the release manager — n/a: the production apply is the release manager's, stated here: apply `0280` to `dbkodyyxxhtygxcxmfcu` before the deploy: the code reads no new column, but a deployed read guard with no seeded grant would leave the cards inert)

## 4. Functional checks

Driven over HTTP on dev with each login's own session cookie (`dev-signin.mjs --cards <card>`), reading the server-rendered page, not
clicked in a browser. aal1 only; no page asked for a second step. Results are tabulated in `docs/decisions/2026-10-28-forecast-and-cashflow-view-cards.md`.

- [x] Happy path works end to end: a login holding only each card opens its page and the forecast figures render (no "couldn't load")
- [ ] Data persists — n/a: nothing is written by this change
- [ ] Create / edit / delete all exercised — n/a: no write path changed, and no write was pressed (see Left for manual verification)
- [ ] Empty state renders sensibly — n/a: no empty-state code changed
- [ ] Invalid input is rejected — n/a: no input changed
- [ ] Boundary cases checked — n/a: the boundary is the read/edit level, covered by the access table below (read opens, edit controls absent)

### Role access matrix

Stated by card, not by role (the card rule of 2026-10-28). Each login held exactly that card.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | all three pages and every control | positive control: all controls drawn | pass (Price and reorder ×8 and Count ×8 on diets, ×25 on medications, order links, both cashflow links) |
| management | n/a: stated by card below | n/a | n/a: roles are transient groupings of cards |
| staff | n/a: retired role | n/a | n/a: retired |
| doctor | n/a: stated by card below | n/a | n/a: roles are transient groupings of cards |
| volunteer | n/a: stated by card below | n/a | n/a: roles are transient groupings of cards |
| signed out | any of the pages | refused | n/a: unchanged guard, redirect to login happens before the level is read |

By card: `food_forecast` opens diets only; `medicine_forecast` opens medications only; `view_cashflow` opens cashflow only; `dashboard` opens the dashboard in full and is refused at cashflow. None of the four was shown an edit control or the fixed-outgoings link; each was refused at the other pages and at fixed-outgoings.

- [ ] Every role above tested — n/a: the review is by card; the five card-only logins above (and Admin) were driven
- [x] A card that should not give access is blocked server-side: each login requested the other pages directly by address and was sent to `/no-access`

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no menu entry changed (these routes stay `menu: false`)
- [ ] Manual updated — n/a: no manual topic describes these three cards; the card descriptions are in the dictionaries
- [x] Translatable strings go through the dictionaries: label and description for each card added to `en.ts` and `th.ts`; the Thai was written by the session and has not been read by a person
- [ ] Mobile viewport (375px) — n/a: no layout changed, controls are removed, not moved
- [ ] Browser console clean — n/a: not driven in a browser
- [ ] Network clean — n/a: not driven in a browser; every page request returned 200 with the expected heading or the `no-access` redirect

## 6. Regression

- [x] The pages nearest the change still work: `/management/dashboard` opens in full for a `dashboard`-only login; `/management/diets`, `/medications`, `/cashflow` and `/cashflow/fixed-outgoings` open for Admin
- [ ] Any shared file touched checked from a second page — n/a: `UnitsPanel` and `ItemUnits` were not changed (the price panel is hidden by the caller instead), so `/admin/diets` and `/admin/medications` are unaffected
- [x] Nothing merged from `main` during `sync` was broken by this branch: `main` brought in `docs/backlog.md` only

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: step (iv) of the item is still open, so a status note was added instead and the box stays open
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-28-forecast-and-cashflow-view-cards.md`
- [x] `README.md` still accurate: nothing it describes changed
- [ ] **Release notes.** n/a: `0280` is applied to dev only and no role holds the new cards on production, so nobody would notice yet; the note belongs in the release that applies `0280` and a role is given a card
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The access table is from driven logins, with an Admin positive control; "no panel changes on the dashboard" was measured by driving a `dashboard`-only login, and what was only read (the actions' levels, the grep of the dashboard folder) is labelled as read

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: the one boundary, read versus edit, is asserted by the access table
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the only pasted evidence is the gates lines, as printed
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Both a migration and code that reads it? — deferred: release manager (yes: apply `0280` before the deploy, as stated in section 3)
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Production backup fresh — n/a: additive grant rows and one inert grant removal, nothing destructive
- [ ] Apply plan stated — deferred: release manager (file `0280`, project `dbkodyyxxhtygxcxmfcu`, before the deploy)

### Rollback

- [ ] Rollback position stated — n/a: reverting the merge restores the old guards; the seeded grant rows are harmless to old code, and the removed dashboard grant was inert

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Links from the diets and medications pages to stocktake, stock usage, purchasing and deliveries stay drawn for a forecast-only card and end in a refusal | deferred to backlog: each should ask its destination's own activity |
| 2 | n/a | `check-card-grants.mjs` already differs on dev before this change (`photos.resident_medical` and `photos.medical_add` grants that `cards.ts` here does not list): `0279`'s side, not this stream's | deferred to backlog: the stream that owns `0279` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Pressing Count and Price and reorder as an editor still saves (Admin was loaded and the buttons are drawn; a save was not pressed) | `/management/diets` and `/management/medications` on dev |
| 2 | The Thai wording of the three card descriptions reads well | Settings → Who does what, in Thai |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; two items are outstanding and are carried as `pending:` on the signature line below

Manual verification by: pending: the two items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the PR does not exist at this commit

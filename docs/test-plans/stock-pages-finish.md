# Feature test plan

## Header

| | |
|---|---|
| Feature | Cupboard order for medicines and food, pack price beside the per-unit price, larger-screen notice off the Management phone pages |
| Backlog item | `docs/backlog.md` → *Stocktake in cupboard order*; *Cost per unit keeps only 2 decimals*; *Review which pages belong under Management and which under Settings* (PR 3 of 3) |
| Branch / worktree | `claude/stock-pages-finish` @ `C:\Development\Animal_Shelter_stock-pages-finish` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-10-08 |
| Carries a migration? | no (uses `0161`, already on `main`, dev and production) |
| Tested at SHA | `6152ef0e` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: Management sets the cupboard order with Move up / Move down and the stocktake follows it; each stock card shows the pack price beside a 4-place per-unit price; six Management pages lose the larger-screen notice and the landing loses their "Larger screen" tile notes
- [x] Files/areas touched listed: `src/app/management/{medications,diets}/` (page, cards, actions), `src/app/management/{contacts,vets,vets/[id]/doctors,stock-usage}/page.tsx`, `src/app/management/page.tsx`, `src/app/stocktake/page.tsx`, `src/app/admin/medications/page.tsx` (comment only), new `src/components/CupboardOrder.tsx` and `src/lib/management/cupboard-order-server.ts`, both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `scripts/check-phone-width.mjs` (page list); no `worker/`, no migrations
- [x] Roles affected identified: admin and management (set the order; see the stock pages); staff and volunteers who count (stocktake order changes); vet and signed-out public unaffected
- [x] Out of scope: a shelf *name* (the shelter has not described its shelves); the 2IC holding `stock.medications` / `stock.diets` (she cannot open the stock halves today — a grant decision for Lutan); the `website.content` grant; `/admin/medications` and `/admin/diets` keep their notice

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (four docs files, no conflicts)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 137s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR — #457, all 7 checks passing at head `18e8aa61`, mergeable CLEAN (read 2026-10-08 before merge)

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration in this PR; it reads `0161`'s columns, already on `main`
- [ ] `--status` reviewed — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to dev — n/a: no migration in this PR (`0161` was applied by `order-and-units-schema`)
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR; the seeded `sort_order` was read back on dev (medication 1…n, AMC 500 first; diets 1, 2)
- [ ] Constraints and defaults exercised in a rollback harness — n/a: no migration in this PR
- [ ] Down-migration — n/a: no migration in this PR
- [ ] Production apply plan — n/a: no migration in this PR; production already at 0161 applied, no drift (checked 2026-10-08, per the brief)

## 4. Functional checks

- [x] Happy path works end to end: on dev, as a Management login at 375 px, Cupboard order → Move AMC 500 down → list re-rendered with Amoxicillin 250mg tablet at No. 1; `/stocktake` then opened on Amoxicillin 250mg tablet (card 1 of 24); moved AMC 500 back up and it was No. 1 again
- [x] Data persists — after each move the list was re-read from the server (navigate away and back) and showed the saved order
- [ ] Create / edit / delete all exercised — n/a: the feature has no create or delete; a new item going last is 0161's trigger, unchanged here
- [x] Empty state renders sensibly — `CupboardOrder` shows "Nothing to put in order yet." for an empty list (read in code; dev has items in both lists, so not seen on screen)
- [ ] Invalid input is rejected — n/a: no typed input; the first row's Up and the last row's Down are disabled, and the action ignores a move past either end
- [x] Boundary cases checked: first and last rows (disabled buttons), a long name ("Amoxicillin 250mg tablet" wraps beside the two buttons at 375 px), and the checker's seeded long names on contacts and vets; ties are renumbered 1…n before swapping
- [x] Pack price: Diet stock on dev shows "฿3 per cup(s) (฿150 per KG)"; a diet with no purchase unit shows only its per-unit price

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | stock pages, order views, stocktake | all open, no notice | pass — check-phone-width, en + th |
| management | stock pages, order views, stocktake | all open, no notice | pass — check-phone-width, en + th, and driven by hand |
| staff | stocktake | follows cupboard order; cannot open the stock pages | stocktake order checked as management (same query); stock pages unchanged guard `stock.medications` / `stock.diets` |
| vet | none of these | refused | unchanged guards; not re-run |
| volunteer | stocktake (counters) | follows cupboard order | same query as above |
| signed out | none | redirected to login | seen: `/management/diets?view=order` redirected to `/login?next=…` |

- [x] Every role above tested — admin and management by script and by hand; the others' access is unchanged by this PR (no guard edited), and the stocktake's query is the same for every reader
- [x] A role that should not have access is blocked server-side — a 2IC login hitting `/management/diets?view=order` directly got "You don't have access to this page"; `moveMedication` / `moveDietType` re-check `stock.*` on the server

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry added or moved; the order screen is a link on each stock page
- [x] Manual updated (`src/lib/manual/en.ts`): Getting started (which pages carry the note), Managing medications, Managing diets, Doing a stocktake
- [ ] Translatable strings go through the translation path — n/a: new UI strings are in both dictionaries (`en.ts`, `th.ts`); the manual is English-only as before
- [x] Mobile viewport (375px) — `node scripts/check-phone-width.mjs --roles=admin,management --pages=<the 9 changed pages>`:

```
36 page view(s) measured (admin, management; en + th), 0 skipped because the role cannot open them, 0 warning(s).
856 component action(s) measured for tap size.
No page scrolls sideways.
No text box, select or textarea is under 16 px (iPhone zoom on tap).
Every component action is at least 44 px.
```

- [x] Browser console clean — no errors on the stock pages, order views, vets and the Management landing
- [x] Network clean — the move actions returned and the pages re-rendered; no failed requests seen

## 6. Regression

- [x] The pages nearest the change still work: `/stocktake`, `/management/medications`, `/management/diets`, both order views, `/management/vets`, `/management` landing
- [x] Shared files touched (`en.ts`/`th.ts` dictionaries, `manual/en.ts`) checked from an unrelated page by loading it: `/management` landing and `/management/vets` rendered their own strings
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge was docs only; gates ran after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — all three, with notes (production at 0161 recorded on the price item)
- [x] Non-obvious design choices added: `docs/decisions/2026-10-08-cupboard-order-on-the-stock-half.md`
- [x] `README.md` still accurate — it does not describe these pages
- [x] **Release notes.** One line added to `unreleased` in `src/lib/releases.ts`: the cupboard order, the pack price and the notices coming off
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured: the order moves and stocktake order were driven on dev; the phone-width claims are the checker's output above; the 2IC refusal was seen

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] Timezone-sensitive behaviour — n/a: nothing here derives a date
- [ ] Boundary or banding change — n/a: no threshold or rounding rule changed; the pack price reuses `pricePerPurchaseUnit` unchanged
- [x] Evidence pasted into this plan is the tools' actual output, unedited
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] New secret/env var — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code that reads it in one PR — n/a: no migration here; the code reads `0161`, which is on production (checked 2026-10-08, no drift)
- [ ] Production dry-run — n/a: no migration in this PR
- [ ] Production backup — n/a: no migration in this PR
- [ ] Apply plan — n/a: no migration in this PR

### Rollback

- [x] Rollback position: redeploy the previous SHA on the Pi (`./scripts/pi/deploy-pi.sh --ref <sha>`). No schema to revert; an order someone set stays in `sort_order` and is simply not read by the older build (which sorts by name)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | Management landing tiles for these pages, and Purchasing's (notice removed in #334), still said "Larger screen" | fixed in this PR |
| 2 | Note | The 2IC cannot open Medication stock or Diet stock, so she cannot set the cupboard order; the decision file calls the stock halves her phone page | accepted: a grant decision for Lutan, already recorded on the menu-split item by `medications-diets-split` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | On a real phone, as Management: Cupboard order on Medication stock, move an item, then open Stocktake and see it in that place | `test.lannacare.org/management/medications?view=order` |
| 2 | The Thai wording of the new order screen ("ลำดับในตู้") reads naturally to the shelter | same, with ไทย selected |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-10-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items are listed above and await Lutan

Manual verification by: pending: a real-phone run of the cupboard order and a read of the Thai wording (items 1–2)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: pending

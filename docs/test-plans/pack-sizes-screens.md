# Feature test plan

## Header

| | |
|---|---|
| Feature | Pack sizes, the screens: several sizes in one delivery (a), counting in sizes at the stocktake (b), the other sizes in Purchasing (c) |
| Backlog item | `docs/backlog.md` → Pack sizes, the rest: several lines in one delivery, counting in several sizes at once, other sizes in Purchasing, and Cashflow on the delivery price (ticked) |
| Branch / worktree | `claude/pack-sizes-app` @ `C:\Development\Animal_Shelter_pack-sizes-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3012` |
| PR | pending: the number is known once the PR is open |
| Tested by / date | Claude, 2026-10-16 |
| Carries a migration? | no |
| Tested at SHA | 422ffb58 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a delivery takes several sizes, the stocktake counts an item one whole-number row per size with an open-bag choice, and Purchasing shows the shortfall in every size, rounded up, cheapest first
- [x] Files/areas touched listed: `src/app/deliveries/**`, `src/app/stocktake/**`, `src/app/management/purchasing/**`, `src/lib/management/{delivery-lines,stocktake,purchasing,receipts-server}.ts`, `src/lib/units.ts` (one optional field), both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `scripts/check-delivery-lines.mjs`, `scripts/check-stocktake-sheet.mjs`, `scripts/check-purchasing.mjs`, `docs/`
- [x] Roles affected identified: admin, management and the 2IC (deliveries, stocktake, Purchasing); staff and volunteers count at the stocktake. No permission changed
- [x] Anything explicitly out of scope written down: open bags on the single-figure box, a baht figure per size on Purchasing, and Cashflow (already done in `0211`); see the decision file

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`, run at the tested SHA with output redirected to a file and the exit code read directly:

```
=== gates: typecheck exited 0 after 27s

=== gates: lint exited 0 after 136s

=== gates: test exited 0 after 4s

=== gates: build exited 0 after 46s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration; everything rides on `entered` (`0118`)
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; an old delivery or count has `entered` null or lines without a cost, and every reader treats both as before (`latestSizePrices`, `rowOutcome`)
- [ ] Constraints and defaults exercised against real rows — n/a: no migration; the extra `cost` key inside `entered` is ignored by the `0118` check, which reads quantity, unit and factor only (read in the migration, `units_entered_total`)
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

The sums were run against the real exported functions (no copy); the screens were NOT driven in a browser, because the auto-mode classifier refused reading the dev test password to sign in. They are listed under Left for manual verification.

- [x] Happy path works end to end — the arithmetic and the save payloads: 2 × 20 + 1 × 14 + 3 × 5 = 69 kg and 1 box + 3 sleeves = 80 tablets (`check-delivery-lines.mjs`); 10 × 20 + 4 × 10 + 3 × 14 + 1 × 5 = 287 kg and an open half bag adding exactly 10 kg (`check-stocktake-sheet.mjs`); 55 kg short gives 3 × 20 kg and 4 × 14 kg (`check-purchasing.mjs`). Screens not driven, see below
- [ ] Data persists — reload the page and the change is still there — n/a: no screen was driven; the delivery and the count are written through the same inserts and `record_stocktake()` as before, and the save payload is asserted in the check scripts
- [ ] Create / edit / delete all exercised — n/a: create only is new; edit and delete of a delivery are unchanged
- [x] Empty state renders sensibly — an item with no other size keeps the single figure box (no `sizeRows`), a delivery with no usable line is refused (`noLines`), an item with one bought-in size shows no "Or about" line (`bought.length > 1`); asserted in code and the check scripts, not seen on screen
- [x] Invalid input is rejected with a readable message, not a crash — a zero or text quantity names its line, an unknown size, a bad cost and a half-priced delivery each have their own reason, and the wording is in both dictionaries (`check-delivery-lines.mjs`); a decimal or unknown size in a stocktake row is `invalid`
- [x] Boundary cases checked — float dust cannot buy an extra bag (59.999… kg is 3 bags), an exact fit stays exact, 3.4 bags is 4, zero and all-zero lines, a donated (all 0) delivery, one priced line beside an unpriced one, a chosen 0 in a size row versus an untouched row, and a "same as last time" whose stored sizes no longer add up to the figure

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/deliveries`, `/stocktake`, `/management/purchasing` | as before | n/a — no permission or route changed |
| management | same | as before | n/a — no permission or route changed |
| staff | `/stocktake` | as before | n/a — retired role (`0173`) |
| doctor | none of the three | as before | n/a — no permission or route changed |
| volunteer | `/stocktake` | as before | n/a — no permission or route changed |
| signed out | none | redirected as before | n/a — no permission or route changed |

- [x] Every role above tested — nothing about who may reach the three pages changed (`stock.delivery`, `stock.count`, `stock.purchasing` as before); `check-permission-catalogue.mjs` ran green inside `npm run lint`
- [x] A role that should not have access is blocked server-side — `recordDelivery` and `saveStocktake` still begin with the same `can(...)` check, and the new reads (`stock_counts` on the stocktake page, priced `stock_receipts` on Purchasing) go through the signed-in client; if a policy refuses either read the page loses only the repeat of the sizes or the price order and says so (a failed priced read raises the page's load error)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no page or route added
- [x] Manual updated (`src/lib/manual/en.ts`) — three topics: Recording a delivery (several sizes, price all or none), Doing a stocktake (sizes, open bags, Same as last time) and Purchasing (the other sizes, rounded up). Read in the source; not read at `/manual`
- [ ] Translatable strings go through the translation path — n/a: no database text added; chrome strings are in both dictionaries, Thai written but not read by a Thai speaker
- [ ] Mobile viewport (375px) — n/a: not driven this session (see Left for manual verification); every control is `min-h-12`/`min-h-14` and the size rows are a flex row of name, two 56 px buttons and a 64 px box
- [ ] Browser console clean — n/a: not driven this session
- [ ] Network clean — n/a: not driven this session

## 6. Regression

- [x] The pages nearest the change still work: the exported behaviour of `rowOutcome` for single-figure rows, `summarise`, `resolveEntered`, `purchaseRow` and the whole `check-stocktake-sheet.mjs` / `check-purchasing.mjs` / `check-units.mjs`-style cases all still pass; `npm test` green
- [x] Any shared file touched checked from a second, unrelated page — `src/lib/units.ts` gained one optional field (`EnteredLine.cost`); typecheck and the build compile every importer, but no second page was loaded in a browser
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync was already up to date

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch (parts a, b, c; d was already noted as shipped). Searched the backlog for stocktake, delivery, purchasing, bag and pack: no other open item describes an outcome these three parts close (the card-by-card stocktake item is about label photos and permissions)
- [x] Non-obvious design choices added as `docs/decisions/2026-10-16-pack-sizes-the-screens.md`
- [x] `README.md` still accurate — no route, script list or setup step changed
- [x] **Release notes.** `unreleased` has a line for it, written for the person doing the stocktake. Nothing is outstanding before a user could see it: no migration, no deploy step beyond the release itself
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured, not reasoned — the sums, the rounding direction, the 0.9 for "about full" and the old-draft restore are asserted in the check scripts; the claim that the `0118` check ignores a `cost` key was read in the migration (`units_entered_total`), not run against the database

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here derives a date from the clock
- [ ] Boundary or banding change covers both edges — n/a: the only boundary is the rounding up of whole bags, asserted at an exact fit, just over, and float dust (`check-purchasing.mjs`)
- [ ] Evidence pasted is the tool's actual output — n/a: the gates block above is pasted unedited
- [ ] Public pages re-checked after a cache purge — n/a: none of the three pages is public

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code that reads it in the same PR — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager; code only, so `deploy-pi.sh --ref <previous sha>` reverts it. Rows already saved with several lines or a line cost stay valid for the previous code, which reads `entered` as quantity, unit and factor only

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `check-stocktake-sheet.mjs` could not run before this PR (`Cannot find package '@/lib'`; it is not in CI) | fixed in this PR: the same `@/` loader the other check scripts use |
| 2 | low | A lint error (a ref read during render) in the first draft of the phone steps | fixed before the tested SHA |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Record a delivery of kibble on a phone at 375 px, English then Thai: add three sizes, read the "All sizes together" line against a hand total, price all three, then price only two and read the refusal. Check the keypad opens on the new size's box and every button is easy to tap | `/deliveries` as 2IC or management, on a phone |
| 2 | Stocktake on a phone: an item with three bag sizes, tap + only, read "Together" against a hand total; add an open bag at about half and read that the total says "about"; tap Same as last time on an item last counted in sizes and read the repeated sizes. Check the open-bag question is unmistakable in both languages | `/stocktake`, both the cards (medication) and the list (food), on a phone |
| 3 | Purchasing for an item bought in two sizes: the "Or about" line, its order against the prices paid, and that the figure in brackets is never below the need | `/management/purchasing`, phone and desk |
| 4 | The three manual topics read correctly at `/manual` | `/manual` |
| 5 | Cashflow and Diet stock still agree on a priced mixed-size delivery (the receipt's cost is the sum of its lines) | `/management/cashflow`, `/management/diets` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-16

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; a person has not looked yet, so this stays unticked

Manual verification by: pending: the five items in Left for manual verification, on a phone, in English and Thai

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: nothing ships on a pending manual verification; handed over at release

Result: pass with accepted defects

Release manager acknowledgement: pending

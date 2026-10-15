# Feature test plan — pack-sizes-app

## Header

| | |
|---|---|
| Feature | App half of several pack sizes: Settings takes many bought-in sizes with one usual; Diet and Medication stock price from the latest delivery, typed price as fallback |
| Backlog item | `docs/backlog.md` → **Several pack sizes for one item** (ticked for parts 2 and 4; the rest filed as *Pack sizes, the rest*) |
| Branch / worktree | `claude/pack-sizes-app` @ `C:\Development\Animal_Shelter_pack-sizes-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | pending — see the PR once opened |
| Tested by / date | Claude / 2026-10-15 |
| Carries a migration? | no |
| Tested at SHA | `211029cf` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the units screen allows several bought-in sizes with one usual, and the stock pages' cost per unit and diet forecast baht follow the price paid on the latest delivery
- [x] Files/areas touched listed — `UnitsPanel.tsx`, `management/units/actions.ts`, `management/diets` and `management/medications` pages and cards, `lib/units.ts` (`effectiveCost`), `lib/units-server.ts` (`loadDeliveryCosts`), both dictionaries, manual, releases, `check-units.mjs`, new `check-pack-sizes.mjs`
- [x] Roles affected identified — admin (Settings units), management (stock pages); no permission changed
- [x] Anything explicitly **out of scope** written down — Cashflow still prices at the typed figure (SQL function, needs a migration, filed on the backlog); multi-line deliveries; counting in several sizes; "other sizes" in Purchasing

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (brought in 0200)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Read directly:

```
=== gates: build — npm run build

=== gates: build exited 0 after 37s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration; the schema half is 0199
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration (0199 is already on dev)
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration; reads of existing rows covered by the harness below
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration; the app's arithmetic was exercised against real dev rows by `scripts/check-pack-sizes.mjs` (see §4)
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration; 0199 is already in the release being assumed live

## 4. Functional checks

- [x] Happy path works end to end — `scripts/check-pack-sizes.mjs` HARNESS-OK on dev (rolled back): kibble bought in 20, 14 and 10 kg bags (200/140/100 cups), exactly one default; making the 20 kg the usual moves the flag; un-ticking it hands it on. Deliveries 400 cups ฿3,200 (฿8.00), 100 cups ฿900 (฿9.00), 140 cups ฿700 (฿5.00, the 14 kg special), 200 cups donated ฿0: the view gives ฿5.00 a cup, so 1,000 cups forecasts ฿5,000 (the typed ฿8 would say ฿8,000). The page code multiplies exactly that
- [ ] Data persists — n/a: the app half writes only the two unit flags through the same update as before; flags round-trip in the harness
- [ ] Create / edit / delete all exercised — n/a: not clicked through in a browser (sign-in needed); see Left for manual verification
- [x] Empty state renders sensibly — an item with no priced delivery (typed 4.5) and one whose only delivery is donated (typed 6) both return no view row, so the page falls back to the typed price; `check-units.mjs` asserts `effectiveCost` for no delivery, zero, negative and null
- [ ] Invalid input is rejected with a readable message — n/a: no new input fields; the existing unit and price validation is unchanged
- [x] Boundary cases checked — donated (0) delivery does not drag the price to zero; negative figure ignored; typed-only and gift-only items still forecast from the typed price

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Settings → units | unchanged | n/a — no policy changed |
| management | stock pages, price panel | unchanged; reads the new view | n/a — view granted to authenticated (0199) |
| staff | — | unchanged | n/a — role retired |
| doctor | — | unchanged | n/a — no policy changed |
| volunteer | — | unchanged | n/a — no policy changed |
| signed out | nothing | redirected to login | seen: `/management/diets` redirects to `/login` |

- [ ] Every role above tested — n/a: no permission changed; the page gates (`stock.*`, `canEditItemSettings`) were not touched
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed; signed-out redirect seen

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no new page
- [x] Manual updated — units and cost paragraphs of the Medication and Diet topics in `src/lib/manual/en.ts`
- [x] Translatable strings go through the translation path — new strings added to both `en.ts` and `th.ts` dictionaries
- [ ] Mobile viewport (375px) — n/a: not driven, no signed-in session was available to me; handed over in Left for manual verification
- [ ] Browser console clean — n/a: not driven, no signed-in session was available to me; handed over in Left for manual verification
- [ ] Network clean — n/a: not driven, no signed-in session was available to me; handed over in Left for manual verification

## 6. Regression

- [x] The pages nearest the change still work — production `next build` compiles every page; deliveries, stocktake and Purchasing audited: all read the purchase unit only through `defaultUnit`, which resolves the default first
- [ ] Any shared file touched checked from a second, unrelated page — n/a: `units.ts` only gained a function; `check-units.mjs` (existing and new cases) all ok
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates rerun after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch, with what is and is not done; searched the backlog for the unit names and tables, no other open item is closed
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-15-pack-sizes-app.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` gained two lines, written for a shelter user; neither promises Cashflow, deliveries lines or counting in sizes
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned** — the baht figures come from the dev harness output

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives "today"; the delivery date shown is the stored date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff changed
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration, but it reads the view and column from 0199, so 0199 must be live on production first (the schema PR already says so)
- [ ] `--env production --dry-run` — n/a: no migration in this PR
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration; 0199 before this code

### Rollback

- [ ] Rollback position stated — n/a: no schema; revert the PR, the 0199 triggers keep one default so old code still works

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | Cashflow still prices at the typed figure, so a diet with a priced delivery can show different baht on Diet stock and Cashflow | deferred to backlog — needs a SQL function migration |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Settings → Diets: add 20, 14 and 10 kg bag sizes, tick "We buy it in this size" on each and "usually" on one; the usual one's boxes lock; badges read right at 375 px and in Thai | `/admin/diets` |
| 2 | A diet with a priced delivery shows "from the delivery on <date>" and the forecast baht match; Price per pack says the delivery wins | `/management/diets` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-15

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet; see the pending signature

Manual verification by: pending: a signed-in person to look at the Settings and stock screens at 375 px and desktop

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: one defect, accepted and filed on the backlog (Cashflow); written in the table above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a

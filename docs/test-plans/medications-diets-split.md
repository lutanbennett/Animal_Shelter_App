# Feature test plan

## Header

| | |
|---|---|
| Feature | Split Medications and Diets into a Settings half (the lists) and a Management half (stock and prices) |
| Backlog item | `docs/backlog.md` → *Review which pages belong under Management and which under Settings* (PR 2 of 3) |
| Branch / worktree | `claude/medications-diets-split` @ `C:\Development\Animal_Shelter_medications-diets-split` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-10-08 |
| Carries a migration? | no |
| Tested at SHA | `a0478d3c` (after `sync`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — names, units, merging, sizes, the standard diet and unit conversions move to new `/admin/medications` and `/admin/diets`; stock, cost, reorder, labels, price per pack and the forecast stay on `/management/medications` and `/management/diets` (renamed Medication stock / Diet stock). Matches the decision file's "Split" rows and Lutan's answers 1 and 2
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — new `src/app/admin/{medications,diets}/`; rewritten `src/app/management/{medications,diets}/` (cards, narrowed actions); `src/app/management/units/actions.ts`; `src/components/{UnitsPanel,StockCells}.tsx`; `src/lib/{format,units}.ts`; `src/lib/permissions/{item-settings,routes}.ts`; both landings; en/th dictionaries; `src/lib/manual/en.ts`; `src/lib/releases.ts`; scripts `check-units`, `check-phone-width`, `check-medical-jobs-app`. No `worker/`, no migration
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — admin (both halves); management (stock halves only; **loses** add/rename/unit/merge/delete/units, by Lutan's choice); 2IC holds neither stock cell, unchanged; staff, vet, volunteer, signed out: no access before or after
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the device notices (PR 3 strips them from the two Management halves), the per-gram price display beside the pack price and the cupboard-order screen (batch 73), any grant to the 2IC, any RLS change

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — one conflict in `src/lib/releases.ts` (a release was cut on `main`; `unreleased` now holds only this PR's line), resolved in `a0478d3c`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: build exited 0 after 229s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration; the pages were loaded against dev's real medication and diet lists (screenshot of `/admin/medications` shows all 24)
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration; the 4-place round trip was asserted through the app instead (section 4)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR, but it **depends on `0161`** (see section 8)

## 4. Functional checks

Driven by a scratch Playwright script against dev with a throwaway Admin and a throwaway Management login (both deleted at the end, with the `ZZ Split` rows), output unedited:

```
ok   Settings landing has a Medications tile
ok   Settings landing has a Diets tile
ok   Admin adds a medication on Settings → Medications
ok   Settings → Medications shows no price column or field
ok   Admin renames it
ok   Admin adds a purchase unit under Units of measure
ok   No price-per-pack setter on the Settings half
ok   Admin adds a diet on Settings → Diets
ok   Management is refused at /admin/medications
ok   Management is refused at /admin/diets
ok   Management page is titled Medication stock
ok   No Names and units link for Management
ok   Management sets a 4-decimal price on its phone card, and it shows as ฿0.0567
ok   stored: cost 0.0567, lead 7
ok   No Add a unit on the Management half
ok   price per pack 850 a box of 100 → 8.5 a tablet
ok   Management page is titled Diet stock
ok   diet stored: cost 0.0567, name and unit untouched

18/18 passed; cleaned up 2 login(s) and the ZZ rows
```

- [x] Happy path works end to end — above, at `a0478d3c`
- [x] Data persists — reload the page and the change is still there — the stored values were read back from the database, and the medication card was re-read after a reload
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: create and edit exercised (above); delete and merge are the same actions moved unchanged to `admin/medications/actions.ts` (same RPC, same reference-count refusal) and were not driven
- [ ] Empty state renders sensibly (no rows yet) — n/a: dev has rows and emptying the shared list is not an option; the empty strings are dictionary entries pointing at Settings
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: not driven; the validation is the existing `parseLeadDays` / `parseSafetyStock` / `parseStockCount` plus `parseUnitCost`, which rejects what `parseBahtAmount` did
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — `node scripts/check-units.mjs` (all ok): 850/180 → 4.7222; 35 a kg → 0.035 a gram (refused before); 850 a 15 kg sack → 0.0567 a gram; 1 baht for 100 kg still refused (rounds to 0); a negative price refused

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | both Settings halves, both stock halves, both landings | all open | all open (phone-width run, en + th; Playwright run) |
| management | stock halves, Management landing | stock halves open; `/admin`, `/admin/medications`, `/admin/diets` refused | as expected (`redirected to /no-access` in both runs) |
| staff | none of the six | all refused | all refused (phone-width run) |
| vet | none | refused | n/a: not run; holds neither `stock.*` nor `reference.types` |
| volunteer | none | refused | n/a: not run; holds neither cell |
| signed out | none | sent to login | `/admin/medications` → `/login?next=…` in the browser pane |

- [x] Every role above tested — admin, management, staff and signed out driven; vet and volunteer reasoned from `role_permissions` on dev (neither holds `stock.*` or `reference.types`)
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — Management and staff hit `/admin/medications` and `/admin/diets` directly and were refused. The narrowed server actions (no name/unit in the Management writes) were read, not called by a Management login

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry; Settings and Management tiles added/renamed and seen on the Settings landing
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — both topics say where each half is, and seven other mentions of "Management → Medications/Diets" were repointed; `acceptance-matrix --check` ok (in lint). Not read on `/manual` in a browser
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: dictionary strings only, no user-entered text
- [x] Mobile viewport (375px) — no overflow, controls reachable — `check-phone-width.mjs --roles=admin,management,staff` on the six pages, en + th: "No page scrolls sideways… Every component action is at least 44 px."
- [ ] Browser console clean — no errors or React warnings — n/a: the pages were driven headless by script, not in a console-reading browser; the dev server's error log was empty
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — `preview_logs --level error`: "No server errors found."

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/admin`, `/management` (both runs), `/management/medications`, `/management/diets`
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: not done for `StockCells.tsx` (its only other user was the old diets table, now gone) or `format.ts` (new functions only; `parseBahtAmount` / `formatBahtPrice` unchanged)
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates and the Playwright run were repeated after the merge

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: PR 2 of 3; the item gets a status note, and the cost-decimals item a "mostly done" note
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-10-08-medications-diets-split-guards.md`
- [ ] `README.md` still accurate — n/a: the README does not describe these pages
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message.
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — who holds the cells was read from dev's `role_permissions`; the stored 0.0567 was read back from the database

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no boundary or band; the rounding cases are in section 4
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — deferred: production release manager
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — deferred: production release manager. No migration here, but the code writes 4-place prices that need **`0161`** (`numeric(12, 4)`) on production first; without it they save rounded to 2 places. Check `--status --env production` before deploying
- [ ] `apply-migrations.mjs --env production --dry-run` — n/a: no migration in this PR
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration in this PR; `0161` is its own PR (#447)

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — deferred: production release manager. Code only; a rollback restores the single pages. Prices saved with 4 places stay valid under the old code (it displays 2)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `saveConversion`, `deleteConversion` and `setPricePerPurchaseUnit` all asked `stock.diets`, even for a medication | fixed: conversions ask `canEditItemSettings(kind)`, the price asks the item's own `stock.*` cell |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The stock cards read well on a real phone, in Thai and English, for the Director by day | `/management/medications`, `/management/diets` (tap Show anyway until PR 3) |
| 2 | The Settings halves read as the Director expects at her desk | `/admin/medications`, `/admin/diets` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items are waiting for Lutan

Manual verification by: pending: Lutan to look at the two pages on a phone and the two Settings pages at a desk

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: not yet, decided at sign-off
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet, after merge

Result: pass

Release manager acknowledgement: pending  Date: —

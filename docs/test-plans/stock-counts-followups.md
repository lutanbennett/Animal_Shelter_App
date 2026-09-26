# Feature test plan

Filled from `docs/test-plan-template.md` (its instructions are there).

---

## Header

| | |
|---|---|
| Feature | Stock between counts: a Difference column with the percentage, Download CSV, a floor so tiny items do not shout; a Before / After tag on recent deliveries |
| Backlog item | `docs/backlog.md` → "Stock between counts: CSV download, difference as a percentage, and a floor so tiny items do not shout." |
| Branch / worktree | `claude/stock-counts-followups` @ `C:\Development\Animal_Shelter_stock-counts-followups` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | opened after this commit |
| Tested by / date | Claude (stock-counts-followups session), 2026-09-27 |
| Carries a migration? | no — reads `0093` / `0096` as before |
| Tested at SHA | `ef6d1cb` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: Management → Stock between counts gains a Difference column (used − planned, with the percentage of the plan beside it, a dash when nothing was planned), a Download CSV of the table reusing Cashflow's writer, and a per-item floor so a gap no bigger than two counts can get wrong is never marked; `/deliveries` tags a delivery on a stocktake day Before / After that day's count
- [x] Files/areas touched listed: `src/lib/management/stock-usage.ts` (`countMargin`, `withinCount` reading, `difference`), `src/app/management/stock-usage/page.tsx`; new `src/lib/csv.ts` (Cashflow's quoting and BOM download, moved) and `src/components/CsvDownloadButton.tsx`; `src/lib/management/cashflow.ts` and `src/app/management/cashflow/CashflowView.tsx` now use `src/lib/csv.ts`; `src/lib/management/stock-receipts.ts` (`sideOfCount`) and `src/app/deliveries/page.tsx`; `src/lib/i18n/dictionaries/en.ts` / `th.ts`; `src/lib/manual/en.ts`; `src/lib/releases.ts`; `scripts/check-stock-usage.mjs`, `scripts/check-stock-deliveries.mjs`; docs. No `worker/`, no migration, no `NavLinks.tsx`
- [x] Roles affected identified: admin and management (Stock between counts, Cashflow); admin, management and staff (`/deliveries`, display only). Access rules unchanged. Vet, volunteer and signed-out public untouched
- [x] Out of scope, written down: a per-item floor setting (the floor is derived, not stored — decisions.md 2026-09-27); sorting marked rows by the size of the gap; any change to what "used" means or to the 25% ratio; the forecast-over-placement-history fix for departed residents

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (brought `0099`/`0100` from `schema-slugs-aal2`; only `docs/decisions.md` auto-merged)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: typecheck exited 0 after 27s
=== gates: lint exited 0 after 74s
=== gates: build exited 0 after 107s
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration; the page reads the same `stock_counts` / `stock_count_intervals` rows as before
- [ ] Constraints exercised in a rollback harness — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: on dev, Stock between counts shows Difference for every row (FBC `+56 tablet(s)` / `+400%`, Renovit `−32 tablet(s)` / `−62%`, Standard Kibble `−1898 cup(s)` / `−97%`); Download CSV hands the browser `stock-between-counts-2026-09-27.csv`, `text/csv;charset=utf-8`, starting with the UTF-8 BOM (bytes `239,187,191`), 17 columns, one line per row in page order, commas in readings quoted
- [x] Data persists — reload: the two test deliveries recorded on dev (Bravecto 1 tablet on 20 Sep; FBC 1 tablet on 26 Sep, "after the count") are in the recent list and in the table after reloading
- [x] Create / edit / delete exercised: two deliveries created through the form; the page itself only reads. Delete unchanged from #163
- [ ] Empty state — n/a: unchanged; the CSV button is hidden with the table when there is nothing to compare (`!nothing`)
- [ ] Invalid input — n/a: no new input; the only new control is a download button
- [x] Boundary cases checked: **planned zero** — AMC 500 (7 used, 0 planned) shows `+7 tablet(s)` and a dash, the CSV's percentage cell is blank; Bravecto after the 1-tablet delivery (1 used, 0 planned) reads `withinCount`, not marked, "Nothing planned, and too little used to tell from a miscount"; `check-stock-usage.mjs` asserts both sides of the floor for a counted unit (planned 2: used 3 and 1 within, used 4 marked; nothing planned: 1 within, 2 marked; −1 a miscount, −2 unrecorded) and a read unit (400 ml bottle: +15 ml within, +25 ml marked), rounding to a whole percent, and no `−0`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Stock between counts, Deliveries, Cashflow | new column, CSV, tags | as expected (dev test login is admin) |
| management | same | same | not tested here — no management login on this machine; unchanged guard `requireManagementUser` |
| staff | Deliveries | tags in the list; Stock between counts redirects as before | not tested here — see Left for manual verification |
| vet | none of these | unchanged | n/a: no change to access |
| volunteer | none of these | unchanged | n/a: no change to access |
| signed out | none | redirected to sign-in | redirected to `/login?next=%2Fmanagement%2Fstock-usage` (seen on first load) |

- [ ] Every role above tested — n/a: only admin and signed-out were available; access rules are untouched by this PR and the staff view of the tag is left for manual verification
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed; the CSV is built by the same server page that already checks `requireManagementUser`, so it never reaches anyone the page refuses

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`): Stock between counts gains Difference, the floor and Download CSV; Recording a delivery gains the Before / After tag
- [ ] Translatable strings through the translation path — n/a: UI strings are in both dictionaries (`en.ts`, `th.ts`), not user content; checked in Thai on the page (`ส่วนต่าง`, `ดาวน์โหลด CSV`, the within-count wording)
- [x] Mobile viewport (375px): `/deliveries` has no horizontal overflow (`scrollWidth` 375); Stock between counts stays behind the existing larger-screen notice
- [x] Browser console clean — no errors on either page
- [ ] Network clean — n/a: no new requests; the page's queries are unchanged and the CSV is built in the server render

## 6. Regression

- [x] Pages nearest the change still work: Stock between counts (all six dev rows render, picker unchanged), `/deliveries` (form records, list renders)
- [ ] Shared file checked from a second page by loading it — n/a: not loaded; Cashflow's CSV now goes through `src/lib/csv.ts` (same quoting and BOM code, moved), covered by typecheck and build but its download was not clicked in the browser — listed under Left for manual verification
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates after the merge are green; the merge brought only migrations, a check script and docs

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated 2026-09-27 ("the floor comes from the counts, not a number")
- [ ] `README.md` still accurate — n/a: the README does not describe Stock between counts or Cashflow's CSV
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line: the Difference column and percentage, Download CSV, the quieter marking of small items, and the Before / After tag on Deliveries
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned: the margins (1 per counted unit, 20 ml for a 400 ml count, 250 g for 5000 g) and every reading quoted are asserted in `check-stock-usage.mjs`; the Before / After tag agreeing with `receivedAtFor` is asserted in `check-stock-deliveries.mjs` and was seen on dev (two FBC deliveries both shown at 10:33, tagged Before and After)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: Lutan
- [ ] Timezone-sensitive behaviour proved — deferred: release manager (the CSV's count dates and the Before / After tag use the shelter day via `todayIso()`; `check-stock-usage.mjs` and `check-stock-deliveries.mjs` both pass under `TZ=UTC`, including `sideOfCount` on both sides of 17:00Z. What the deployed build does between 00:00 and 07:00 Thai is for test.lannacare.org)
- [x] For a boundary or banding change, both edges covered: the floor asserted just inside and just outside for a counted unit (±1 tablet vs ±2) and for a read unit (15 ml vs 25 ml over a 20 ml margin), below zero (−1 within, −2 unrecorded) and with nothing planned (1 within, 2 marked); the 25% ratio edge still asserted and still wins for big items (52 vs 40 planned is marked); the tag on both sides of a count a second apart
- [x] Evidence pasted into this plan is the tool's actual output, unedited (the gates lines; figures as the page and CSV printed them)
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and matches production — deferred: release manager
- [ ] `strip-baked-env` line seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it — n/a: no migration; reads `0093` and `0096` as #163 did
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] Production backup fresh for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: `npx wrangler rollback --env production` removes the Difference column, the CSV button and the tag, and marking returns to the ratio alone. No data or schema involved, so nothing is left behind

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Browser check: the CSV left out the row notes (changed by hand, residents who left), so the file said less than the page | fixed — Notes column |
| 2 | low | Browser check: a within-the-count row with nothing planned read "About as planned" | fixed — "Nothing planned, and too little used to tell from a miscount" |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Open the downloaded CSV in Excel (or LibreOffice) by double-clicking: Thai headings readable, numbers add up in a column, the readings sit in one cell each | `/management/stock-usage` → Download CSV, in English and Thai |
| 2 | Cashflow's Download CSV still downloads and opens as before (it now goes through the shared `src/lib/csv.ts`) | `/management/cashflow` |
| 3 | The floor feels right for the shelter's real items: one tablet / can / sachet, and a twentieth of what was on the shelf for ml and g. Anything the shelter considers a real gap that is now left unmarked? | `/management/stock-usage` |
| 4 | As a **staff** login, the Before / After tag shows on Recent deliveries | `/deliveries` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (stock-counts-followups session)  Date: 2026-09-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; four items wait for Lutan

Manual verification by: pending: the four items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — handed over once the PR is open

Result: pass

Release manager acknowledgement: pending

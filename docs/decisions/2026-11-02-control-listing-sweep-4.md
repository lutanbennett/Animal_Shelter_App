# Control listing sweep 4: stock pages, donations/drives detail, map and card board, placement forms (2026-11-02)

Stream `control-listing-sweep-4`. Rule: `CLAUDE.md` "a button is shown only if the login's cards let it do that
action", applying sweep 3 §5 unchanged (a control needs a gate when its destination is a card-governed write; a
display or own-preference setting needs none). Each activity below was read from the action file's own `can(...)`
or from the placement policy (`0264`). Cards only; no role is named; Admin is the documented bypass.
**No code changed: every control reached was already drawn on the activity its action asks.** Server checks
untouched. Nothing was driven in a browser (code-read only).

## 1. Controls listed

| Area | Controls | Action asks | How drawn | Verdict |
|---|---|---|---|---|
| Diets page (`management/diets`) | count, edit, label, order view, stock cards | `stock.diets` edit (all three actions) | page `requirePermission("stock.diets","read")`; `canEdit = can(stock.diets, edit)` passed to `DietStockCards` (`canEdit` defaults false); `?view=order` needs `canEdit` | correct |
| Diets: links to count / usage / purchasing / delivery | links | pages ask `stock.count` / `.usage` / `.purchasing` / `.delivery` | each link wrapped in the same `can(...)` | correct |
| Medications page | same set; vaccine section | `stock.medications` edit (5 actions) | `canEdit` as above; `VaccineStockSection` has no write control | correct |
| Diets / medications: item settings link | link | `canEditItemSettings` = `reference.types` and the item's stock cell | same helper | correct |
| Purchasing | stocktake link, Print, Download CSV | link: `/stocktake` asks `stock.count` | link and `canCount` prop use `stock.count`; Print and CSV | correct; Print/CSV are display (browser-local output, no card destination: §5 first half) |
| Stock usage, medication-list, dashboard | read-only pages | page gate (`stock.usage`, `reports.dashboard`) | page gate; no write controls | correct |
| Units | price edit | `stock.diets` / `stock.medications` edit | `canEdit` (sweep 3 row) | correct |
| Donation detail | issue / mark sent / void / retry filing | `donation.receipt` (all four actions) | page `requirePermission("donation.receipt")`, whole page | correct |
| Desexing drive detail, signup controls | status, delete | `website.content` | page `requirePermission("website.content")`, whole page | correct |
| Facility map (`MapEditor`) | add/delete room, shapes, plans | `facility.enclosures` edit (all actions) | page `requirePermission("facility.enclosures")` (edit by default); translation affordance on `can(translations.manage)` prop | correct |
| Who does what (`CardBoard`) | add/move/remove group, card group/feature | Admin plus two-step (`hasTwoStep`) | `canEdit = isAdmin && hasTwoStep`, `locked` otherwise | correct (Admin bypass) |
| Resident intake (`new`) | wizard buttons | `resident.register`; the intake insert policy asks the same | page `requirePermission("resident.register")` | correct |
| Rehome / hospital / move | forms | `placement.rehome` / `.hospital` / `.move` (policy `0264`) | `canRehome`, `canSend`, `canMove` -> `blocked` state | correct |
| Resident edit | form; return-from-hospital / return-from-carer links | `resident.record` edit; links open pages asking `placement.hospital` / `.rehome` | `canEdit`; `canReturnFromHospital`, `canReturnFromCarer` props default false | correct |

## 2. Found, not fixed
None.

## 3. Not reached (no verdict implied)
- Every other `src/app/management/**` page and component: appeals (`AppealControls`, `AppealForm`, `AppealPhotosEditor`), clinics (`ClinicsTable`, `CreateClinicForm`, doctors), contacts, `DonorForm`/`DonationForm`, recurring jobs, shelter friends wizard, translations queue, cashflow chart. Most were covered by page gate in sweep 3 but were not opened button by button here.
- Donations list/new/receipts sub-pages, clinics `[id]`, supporters' sub-pages, `stocktake`, deliveries, bills.
- `ReceiptActions` internals beyond the four action imports; `SignupControls` body (gated by page only).
- Photos uploader and `photoCategoriesFor`.
- The large client components in the tails (`-tail-a`, `-tail-b`) and the sixteen shared modules in `-list.md`.
- Hospital `return` and rehome `return` pages' own gates (only the links to them were checked).
- Nothing driven in a browser.

## 4. Per-stream habit versus a check (deliverable 6) -- for the planner to file
Five passes now (four sweeps and the 2026-10-27 gallery pass) have found one fault. A script could ask "does every
component importing a server `actions` module take a gate prop whose default is false?" It could not see: whether
the prop is passed the *right* activity (the whole value of this audit), pages gated as a whole, server-rendered
conditionals, or links to pages. The sweeps found the right-activity question is where faults would be, so the
script would be cheap but would mostly confirm presence. Recommendation: a small check for "gate prop exists and
defaults false" is low-cost and worth a stream; the per-stream re-listing should stop after the §3 remainder is
read once.

## 5. Rule applied
Sweep 3 §5, unchanged. Print and Download CSV on purchasing fell on the display half.

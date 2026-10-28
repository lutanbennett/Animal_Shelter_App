# Card review 2: pages no card opens, and the cards proposed (report only)

**Status: PROPOSAL. Nothing is created.** No migration, no card, no application code changed. The card set is Lutan's to
approve; building the cards is a separate schema PR after he says yes. Everything below is stated by card, never by role.

**Evidence** (`node scripts/check-menu-coverage.mjs`, 2026-10-28, this branch off `main` `4e085893`): 64 distinct pages;
37 reached by one card alone, 10 need two cards together, 17 that no card opens. It reads the card set as it is today
(including the `add_medical_photos` grant, `0279`).

**Modelling caveat.** "Per card" means a login holding exactly that card and nothing else, the strictest reading. A page can also
be reached from a home tile, a group doorway, or because another card opens the section (`opensAnyIn`). Nothing was driven in a
browser for this report; the instrument is the evidence.

## 1. The four real gaps (`/management/*`) and the card proposed for each

Each page's server actions ask the same activity as its route guard (read in `actions.ts` / `page.tsx`), so one activity per
page is the whole front-door check. The "end-to-end" notes are what the page reads or writes beyond that, taken from the code
and migrations, and **must be confirmed by a driven login (`dev-signin.mjs --cards <card>`) when the schema PR is built**.

| Proposed card key | Label a shelter worker understands | Grants | Page it opens |
|---|---|---|---|
| `medicine_stock_list` | Manage the medicine list | `stock.medications` at edit | `/management/medications` |
| `diet_stock_list` | Manage the diet list and food forecast | `stock.diets` at edit | `/management/diets` |
| `stock_usage_report` | Compare stock used with planned | `stock.usage` (yes) | `/management/stock-usage` |
| `cashflow` | Cashflow and fixed outgoings | `reports.cashflow` at edit | `/management/cashflow`, `/management/cashflow/fixed-outgoings` |

End-to-end notes, per card:

- **`medicine_stock_list`**: edit is what the add/change/delete actions ask (five `can(..., "stock.medications")` calls). The
  price and label edit controls also need `reference.types` (`canEditItemSettings`), which is Admin-only settings; without it
  those controls are simply not drawn, so the page works but prices stay Admin's. State that choice to Lutan rather than
  adding `reference.types` silently. `stock.correct` (stock corrections) needs `stock.medications` edit **or** `stock.diets`
  edit (`prerequisites.ts`): it is a separate box and is deliberately not bundled.
- **`diet_stock_list`**: same shape. Diet recipe tables are read under `stock.diets` read and written under edit (`0239`).
  Same `reference.types` note.
- **`stock_usage_report`**: a yes/no activity. The page reads stock counts, the medication and diet lists, current residents,
  prescriptions, diets, and placement history, and calls the two forecast functions. **Not confirmed which of those reads
  `stock.usage` alone covers.** If they need `stock.count`, `stock.medications`/`stock.diets` read or `resident.record` read,
  those belong in the bundle or the card shows a page full of blanks, the fault card review 1 kept finding. Needs a driven check.
- **`cashflow`**: `fixed_outgoings` reads at read and writes at edit (`0150`). The `dashboard` card already grants
  `reports.cashflow` at read, so a read-only variant is possible if Lutan wants viewing without editing; the proposal is edit
  because the sub-page's three actions ask the full activity.

**Open choice for Lutan:** one card per page as above, or one combined "Stock lists" card for the three stock pages. One per
page is more flexible and matches how the existing cards are cut.

## 2. The thirteen `/admin/*` pages

`/admin`, `/admin/blood-test-types`, `/admin/diets`, `/admin/enclosures`, `/admin/facility-map`, `/admin/frequencies`,
`/admin/immunization-types`, `/admin/medications`, `/admin/procedure-types`, `/admin/recent-changes`, `/admin/status`,
`/admin/units`, `/admin/zones`: **Admin-only, no card needed.** Admin sits outside the card system (settled). Not debt, not a
gap, and no card is proposed.

## 3. The ten pages that need two cards together

The instrument lists which cards open each page; it does **not** name the partner card that makes it reachable, so what follows
are the openers it reports. Which second card reaches each is not computed here.

- `/appointments`: `view_medical`, `medical_records`, `book_clinic_visits`, `dashboard`, `run_appeals`
- `/clinics`, `/clinics/[id]`: `view_medical`, `medical_records`, `book_clinic_visits`, `view_contacts`, `publish_shelter_friends`, `contacts`, `run_appeals`
- `/management` (landing): twelve cards open it (`do_purchasing`, `publish_shelter_friends`, `contacts`, `recurring_jobs`, `dashboard`, `donations_receipts`, `website`, `website_photos`, `run_appeals`, `meme_library`, `who_does_what`, `translations`)
- `/management/clinics`: `contacts`
- `/management/desexing-drives`: `website`
- `/operations` (landing): twenty-two cards open it
- `/operations/feeding-list`: `feed_special_diets`, `view_medical`, `medical_records`, `book_clinic_visits`, `run_appeals`
- `/projects`, `/projects/[id]`: `donations_receipts`

Observation, not a proposal: `/management/clinics`, `/management/desexing-drives`, `/projects` and `/projects/[id]` each have a
single opener that cannot reach them alone. That is a doorway question (a tile or menu entry on the card), cheaper than a new card.

## 4. The visiting vet

`0230` gave the visiting vet diet, prescription, blood-test, procedure, immunization and weight edits by hand, which `0257`
removed because no card carried them (Lutan's ruling of 2026-10-19 still stands). **No new card is needed to carry it.**
`medical_records` already grants `medical.visits`, `medical.procedures`, `medical.blood_tests`, `medical.prescriptions`,
`medical.immunizations`, `medical.weight`, `medical.diet` at edit plus `visit.book`, and includes `view_medical`. Assigning it
restores the 2026-10-19 behaviour.

It also carries two things the ruling did not name: `medical.archive` (remove an entry) and `placement.hospital` (Send to
hospital). If the vet should not have those, the answer is a narrower card, for example `vet_treatment`: the seven medical
edits and `visit.book`, without archive or hospital. **Recommendation: assign `medical_records` and create nothing**, unless
Lutan wants those two held back. Assigning cards is done on Settings, Who does what.

## 5. `JOBS_OF_ROLE`: settled

`grep -rn "JOBS_OF_ROLE" src/` returns nothing (run 2026-10-28). The only trace is a comment and the `TEST_ROLE_JOBS` fixture in
`scripts/lib/test-role-jobs.mjs`, which is labelled as a fixture. There is nothing to strip and no capability is at risk. The
job-cards (`do_stocktaking`, `do_purchasing`, `record_delivery`, `do_maintenance`) are card-held and are not among the 17.

## Already covered, not gaps

`card-lifecycle-enclosures` and `card-clinic-visit-save` are green on production (read by the planner, 2026-10-28). The
`/management/translations` gap in the 2026-10-25 list has since closed (the `translations` card exists). The withdrawn
195-245k band and the old "32 orphans" figure came from per-role counting and are not used.

## The short list for Lutan (yes or no each)

1. Create `medicine_stock_list` (Manage the medicine list)?
2. Create `diet_stock_list` (Manage the diet list and food forecast)?
3. Create `stock_usage_report` (Compare stock used with planned)?
4. Create `cashflow` (Cashflow and fixed outgoings), edit rather than read-only?
5. Visiting vet: assign `medical_records`, or create the narrower `vet_treatment`?
6. Separate card per stock page, or one combined stock card?

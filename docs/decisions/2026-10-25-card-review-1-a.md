# Card review 1, first half (2026-10-25)

Lutan's framing, 2026-10-25: compare each card's advertised function with the wiring under it, **in isolation, with no regard to roles**: *enough?* and *too much?* `check-card-grants.mjs` was green at the start (68 grants, 3 includes), so `cards.ts` is what the database holds. Nothing was fixed and no card was proposed; every finding is a row in `docs/card-access-faults.md`.

**Method and its limit.** Read from the bundle (`cards.ts`, `jobs.ts`), the activity catalogue, the page guard and the RLS policy under each page. **No browser pass was run**, so "enough" below means "the wiring supports it", not "driven end to end". Where a policy could not be found the cell says *not established*.

| card | advertises (opens) | enough? | too much? | evidence | finding |
|---|---|---|---|---|---|
| `view_residents` | who and where, read only (`/residents`) | yes by wiring, **but** the list reads `resident_current_state`, which has no card gate since 0259 | the record itself, not who-and-where | `cards.ts:68`, 0259 Kind 2 | works by accident; `resident.record` read is now the whole record |
| `residents` | full record, edit, move, photos, intake (`/residents`) | yes. Register was blocked; **closed by 0248**; move/hospital pickers closed with it. Not re-driven | **yes**: move, hospital, rehome, death, microchip and website photo publish | `cards.ts:70`, 0248 | over-grant row; the label does not name them |
| `medical_records` | the medical record (`/residents`) | **no**: cannot book a visit (needs `visit.book`); an existing visit's clinic dropdown is empty (needs `clinics.list`) | no | 0182, `clinic-visits/*/page.tsx` | two shortfall rows |
| `book_clinic_visits` | book a vet visit (`/upcoming-visits`) | **no**: form opens, clinic list empty so it cannot save; clinic shows "—" in the list; cannot edit a visit | no | 0182, `clinic-visits/new/page.tsx:14,46` | three shortfall rows |
| `contacts` | the contacts directory (`/management/contacts`) | yes by wiring | **yes**: edits the clinic list, adds/removes doctors, manages Shelter Friends | `cards.ts:110` | over-grant row |
| `recurring_jobs` | set up recurring jobs (`/management/recurring-jobs`) | yes by wiring; the role picker's read not checked | possibly: `recurring.do_any` lets the holder mark anyone's task done | `cards.ts:123` | judgement row |
| `my_tasks` | do my own tasks (`/my`) | yes: `/my` has no guard, lists tasks through `recurring.do_own` | no | `cards.ts:184`, `my/page.tsx` | none |
| `enclosures` | which animal is where (`/enclosures`) | yes for the map; occupancy leans on the ungated `current_placement` | no beyond the intended read | `enclosures/page.tsx:78`, 0259 | works by accident |
| `add_photos` | file shelter photos (`/photos/add`) | yes: guard accepts `photos.shelter_add` | the whole resident record, for a picker | `photos/add/page.tsx:24` | folded into the `resident.record` row |
| `approve_photos` | approve and remove photos (`/photos/approve`) | yes: `photos.approve`, delete via `resident_manage` | the whole resident record | `photos/approve/page.tsx:19` | folded into the `resident.record` row |
| `administer_medication` | the medication list | yes by wiring; frequency/rounds read policy **not established** | the whole resident record | `medication-list/page.tsx:44` | not-established row, plus the `resident.record` row |
| `record_weight` | record a weight (`/medical/weight`) | yes | the whole resident record | `medical/weight/page.tsx:32` | the `resident.record` row |
| `add_medical_photos` | medical photos (`/medical/photos`) | yes (0140) | the whole resident record | `medical/photos/page.tsx:23` | the `resident.record` row |
| `feed_special_diets` | special diets list (`/medical/diets`) | yes by wiring; `medical.diet` read reaches the diet views (0258) | the whole resident record | `medical/diets/page.tsx:30`, 0258 | the `resident.record` row |

## What carries over

- **The most important finding is cross-cutting.** Seven cards carry the comment "who and where, nothing more (0134)" on a `resident.record` read, and since 0259 that read is the full record. Card review 2 needs a who-and-where activity that is a card, not a column.
- **Two cards (`view_residents`, `enclosures`) work only because 0259 left views without a gate.** Closing that hole will empty them unless they are given a read first.
- **The three findings the brief named:** register is closed by 0248; clinic visit save is confirmed and was wider than named (booking, editing and the list too); the stock-page menu offering Residents and Operations to a `do_stocktaking`-only login is the `-1-b` half and was not checked here.

## Not done

No browser pass; the frequency/rounds policy; the recurring-jobs role picker; the `/r/<id>` redirect path for who-and-where logins. All 14 cards were read, none was driven.

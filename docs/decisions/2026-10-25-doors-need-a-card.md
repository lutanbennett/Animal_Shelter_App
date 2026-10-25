# Every view and every door needs a card (migration 0263)

Lutan, 2026-10-25: *"all views / doors need to require a card"* and *"This means letting anyone read all won't work."*
Before this, a login holding **any one card** could read the surfaces below, because the only lock on them was the front door
(`private.has_app_access()`, "does this role hold at least one card?") or nothing at all. The front door stays, as the
brief and `2026-10-25-security-database-half.md` say. What changed is that it is no longer the only lock on anything.

## What each surface asks for now

The brief expected three or four new activities. **None were needed.** Every surface is read by forms that already sit behind
existing rights, so each is gated by *any of the rights of the forms that read it* (the pattern `picker_zones` already uses).
No `card_grants` row was added and no card's grants changed, so no form loses a list it had.

| Surface | Gate | Reads it |
|---|---|---|
| `resident_current_state`, `current_placement`, `resident_who_and_where` | `private.works_with_residents()`: `resident.record` / `.register` / `.microchip` / `.adoption_news`, any `medical.*`, `visit.book`, `placement.*`, `photos.resident_*` / `shelter_add` / `approve`, `appeal.run` / `.medical_photo`, `assistant.ask`, `reports.dashboard`, `stock.usage` / `.diets` / `.medications` (all at read) | every resident form and picker |
| `immunization_compliance`, `immunization_duplicate_check` | `private.works_with_immunizations()`: `medical.immunizations` or `resident.record` | the resident record |
| `app_users` | `private.works_with_logins()`: `maintenance.jobs`, `maintenance.bills`, `stock.delivery`, `recurring.manage` / `.do_any` / `.do_own`, `photos.approve`, `roles.view` | "Assigned to" pickers, who-did-what labels |
| `translation_queue`, `translatable_fields` | `translations.view` / `translations.manage` | the translation queue |
| `facility_maps`, `map_rooms`, `map_room_placements`, approved map-room `translations` | `facility.enclosures` at read | the Enclosures card |
| `rounds` | `medical.prescriptions`, `medical.diet`, `stock.diets`, `stock.medications`, `reference.types` | prescription and diet forms |
| `units` | the same plus `medical.immunizations`, `stock.delivery` / `.count` / `.purchasing` / `.usage` | stock and medication forms |
| the facility-plan image route (`/api/facility-maps/...`) | `facility.enclosures` at read (app code; the route was "any login in the app") | the map |

`resident_who_and_where`: its `where on_volunteer_floor() or sees_all_residents()` was `where true` since `0259`. The card check
**replaces** it as the gate. The two stub functions themselves are untouched and still belong to `inert-security-leftovers`
(step 4), which should find them no longer referenced by this view.

## Decisions worth keeping

- **Server-side work keeps working.** Each `works_with_*` function opens with `current_user not in ('anon','authenticated')`,
  as `has_app_access()` does, so the service role (archive refresh, workers) is unaffected.
- **`app_users` is a judgement call.** It exposes every login's email. Granted to the activities whose forms demonstrably
  need a person's name; `recurring.do_own` is on the list because My tasks prints who else is on a shared job. Listed in the PR
  for Lutan's review. This closes the fault where the maintenance "Assigned to" picker listed every login with its email to
  anyone holding any card.
- **`translation_queue` is Admin-only in practice.** No card grants `translations.view` or `translations.manage` today, so only
  Admin reads it. That matches the page that shows it; it is not a regression, and it is a card to be created when someone
  other than Admin should triage translations.
- **`units` is read by the root layout for every page.** `loadUnitList` already treats an empty or failed read as "print the
  stored name", so a login with no quantity-bearing card simply sees stored unit names instead of the localised ones.
- **Not trimmed.** Over-granting (for example `do_maintenance` holding `resident.record`) is Card review 1's job.

## The one exception: the 18 `public_*` views

They are the public website. `anon` reads them by design (that is how lannacare.org renders) and they read the private tables,
not the gated public views. Requiring a card there would take the public site down. They are out of scope **by construction,
not by omission**; do not "fix" them in a later sweep. Verified on dev after the migration: `anon` still reads
`public_resident_profiles` and `public_shelter_stats`, and is refused `resident_who_and_where`.

## Why one PR

The locks and the grants had to be atomic and the only proof the gates are right is driving the forms, as with `0259`.

## Faults closed / found

- Closed: the maintenance "Assigned to" picker listing every login and email to any card (`card-access-faults.md`; not edited here).
- Found: nothing new. `translations.*` has no card (above).

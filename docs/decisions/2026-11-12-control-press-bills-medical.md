# Control press: bills, medical records, photos, translations (#79sqf part C)

**Step zero (2026-11-12):** not already built. `check-control-activity.mjs`: 4 findings, all on the
allow-list, 0 new; allow-list 4 rows; UNRESOLVED 69 (28.9 s). No decision file after 2026-11-11 records
any of these rows being pressed.

**Honest scope: NO row was pressed in a browser this stream.** Every row was traced statically, host page
to action, by reading what the host draws the control under and what the action asks. That is a weaker
instrument than the brief asked for and is reported as such. **Rows pressed: 0 of 25. All 25 remain
to press; the 11 below are traced, not driven.**

## Per-row table (traced; control / host guard / action asks)

| Control | Host draws it when | Action asks | Finding |
|---|---|---|---|
| `BillsInbox` record general bill | card kind is `general` route (ANY held kind) | `bills.general` | **FAULT, fixed:** drawn for a card whose kind the login is not offered; action refuses `kindNotAllowed`. Now needs `kind.offered`. |
| `BillsInbox` file as utility bill | card kind is `utility` route | `bills.utilities` | **Same fault, same fix.** `offered` = `mayFileRoute(perms, route)`. |
| `BillsInbox` match bill to job | suggestions loaded per `stock.delivery` / `medical.visits:edit` / `maintenance.bills` in `bills/page.tsx` | same | Correctly gated at the host (traced). |
| `BillsInbox` save / delete card | page open only if `canUseBills` | `canUseBills` | Matches. |
| `MyTaskList` undo (banner) | only after the login's own just-made action | `recurring.*` | Pass (cannot be drawn without a prior press). |
| `ArchiveRecordControl` | every host wraps in `canArchive(kind)` = `medical.archive` | `medical.archive` | Pass (traced, 6 call sites). |
| `BloodTestList` | `canManage = can(perms,"medical.blood_tests")` | `medical.blood_tests` | Pass. |
| `MicrochipForm` | host passes `microchip` only when `can(perms,"resident.microchip")` | `resident.microchip` | Pass. |
| `PhotoGallery` delete / set profile | `canManage = can(perms,"photos.resident_manage")` | same | Pass. |
| `TranslationPanel` | `canManage = can(perms,"translations.manage")` on every host | same | Pass. |

## Reachability of the fault we fixed
Narrow: it needs a card that holds a kind of a route the login cannot file (made by someone else with the
other bill card). Real but not a hole: the server refused every press. The gate is the checkable form of
a courtesy the host's own kind list already did for the dropdown.

## Found, not fixed (for the planner to file)
- `src/app/my/MyTaskList.tsx` "take back" for a recurring row is drawn to every login that sees the row,
  and its action asks `recurring.do_any`/`recurring.do_own`; the record button is gated on
  `maintenance.progress`, not those. Already an allow-list row; the check cannot decide it.
- `#79sqf` title should say: pressing the click-only controls (0 of 25 driven; 11 traced) is what is left.

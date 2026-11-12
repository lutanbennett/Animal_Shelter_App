# Control press, placements: six forms driven in a browser (`#79sqf` part D)

**Date:** 2026-11-12. Branch `claude/control-press-placements`, port 3003, no migration.

## Result

**driven: 6 of 25** (the six below; yesterday's `docs/decisions/2026-11-12-control-press-bills-medical.md`
drove none). Every one was pressed with a click in the browser pane, as a disposable login holding
exactly one card, and again against a login holding a different card (the without-card half). **No
fault was found, so no code changed in this PR.**

## Method

- Logins (`node scripts/dev-signin.mjs --cards <key> --port 3003`): one holding only `medical_records`,
  one holding only `residents`. The two cards do not overlap on these activities, so each login is the
  with-card login for its own rows and the without-card login for the other three.
- Pages were reached by clicking through (Residents list, resident hub, the hub's own link), then the
  submit button was clicked. `requestAnimationFrame` was firing (the pane was woken by a screenshot).
- The without-card half was read from the server-rendered page for the same URL, fetched with the
  login's session cookie: a control is "absent" when the page has no submit button and says which
  permission it needs.
- Fixtures (dev, disposable, all `resident_code` `CP-*`, all `is_public_visible = false`):
  `CP-DEATH` (the death was recorded against it, so it is now closed), `CP-MOVE`, `CP-REHOME`,
  `CP-SENDHOSP`, `CP-RETHOSP`, `CP-RETSHELTER`, plus carer contact `Fixture CP Carer`.
  `CP-RETHOSP` and `CP-RETSHELTER` were prepared (in hospital, fostered) but not pressed: the
  return rows were pressed on `CP-SENDHOSP` and `CP-REHOME`, which the earlier presses had put in the
  right state.

## Per-row table

| # | Control | Card set (with) | Drawn | Pressed | Result | Without the card (login holding) | Absent? |
|---|---|---|---|---|---|---|---|
| 1 | `RecordDeathForm` (`placement.death`) | `medical_records` | yes | yes, then the "Yes, record the death" confirm | Resident became Deceased, hub shows "Passed 12 Nov 2026" | `residents` | **yes**: no submit, page names the permission |
| 2 | `MoveResidentForm` (`placement.move`) | `residents` | yes | yes | Moved to Front Zone 3 | `medical_records` | **yes** |
| 3 | `RehomeForm` (`placement.rehome`) | `residents` | yes | yes (Foster, existing carer) | Status Fostered, carer shown | `medical_records` | **yes** |
| 4 | `ReturnToShelterForm` (`placement.rehome`) | `residents` | yes | yes, then the "enclosure will be full" confirm | Back in Front Zone 4 | `medical_records` | **yes** |
| 5 | `SendToHospitalForm` (`placement.hospital`) | `medical_records` | yes | yes | Status Hospitalised | `residents` | **yes** |
| 6 | `ReturnFromHospitalForm` (`placement.hospital`) | `medical_records` | yes | yes (first press did nothing: zone and enclosure are required) | Back in Front Zone 1 | `residents` | **yes** |

The resident hub agrees with the form pages: a `medical_records`-only login is offered Record death and
Send to hospital and not Move or Foster/adopt; a `residents`-only login is offered the reverse.

## Refusal wording (the `0359` note)

**No refusal was provoked**, so nothing was seen either way: every press succeeded. Whether a raw key
can still reach the screen on `undo_deceased_placement` / `record_deceased_archive` is **not
established** by this stream. (The first press of row 6 was stopped by the browser's own required-field
check, which is not a server refusal.)

## Not done / found

- Rows 7 to 25 are untouched. `UndoDeathForm` is Admin only by design and was not pressed.
- `AdoptionUpdateForm` (the optional seventh) was not pressed: no budget was spent on it.
- Nothing found in the host pages: each already asks the action's own activity through `can(perms, ...)`
  and draws the form only when it holds.

# Placement history is guarded in the database (2026-10-01)

Backlog items DB-3 and DB-4, migration `0119_placement_history_guards.sql`. No
UI change: every refusal below is unreachable through the app. If a normal
flow ever trips one, the trigger is wrong, not the flow.

## DB-3: `end_date` changes only inside `close_prior_placement()`

`enforce_placement_history_immutability()` guarded every column except
`end_date`, and staff and management hold an unrestricted UPDATE policy, so a
placement could be closed or reopened by hand. It now refuses an `end_date`
change unless the transaction-local setting `app.placement_close` is `'on'`.

`close_prior_placement()` sets it around its one UPDATE and puts back the
value it found, rather than writing `'off'`, so a caller that already had it
on (a maintenance script) is not switched off underneath. This is the
mechanism of the deceased lock's `app.deceased_lock_bypass` (0026, 0102):
announced by the code that is allowed to, scoped to the transaction, not an
exemption by role. A second pattern for the same idea would be harder to
maintain than a second flag of the same kind.

The check applies to everyone, including the table owner. A one-off script
that has to correct history (`scripts/fix-panda-placements.mjs`) now raises
the flag itself next to the deceased bypass, and says so in its transaction.

## DB-4: a Lifecycle-zone target must belong to the placement type

A volunteer may insert a `ChangeEnclosure` row, and nothing stopped its
`enclosure_id` being the Deceased or Adopted pseudo-enclosure. That skips
`handle_deceased_placement()`, so no cascade snapshot is taken, engages every
deceased lock, and leaves `undo_deceased_placement()` with nothing to
restore: an unrecoverable state reachable by the lowest-privileged role that
can create a placement. A BEFORE INSERT trigger
(`placement_history_check_lifecycle_target`) now refuses it.

| Pseudo-enclosure | Accepted placement types |
|---|---|
| Unassigned | Intake, DeceasedInError |
| Hospital | SendToHospital, DeceasedInError |
| Fostered | Foster, DeceasedInError |
| Adopted | Adopt, DeceasedInError |
| Deceased | Deceased |

- **`DeceasedInError` is allowed into any of the first four.** Withdrawing a
  death puts the resident back where the previous placement was, and that can
  be any of them (`undo_deceased_placement()`, 0049).
- **`ChangeEnclosure`, `ReturnFromHospital` and `ReturnToShelter` accept no
  Lifecycle target at all.** The app already sends them to physical
  enclosures only (`src/lib/placements/`).
- **The key is the enclosure's zone, not `zone_id`.** A row with no enclosure
  but `zone_id` set to Lifecycle is held to the rule too, and refused as
  `(none)`, so the check cannot be sidestepped by leaving the enclosure out.
- **It is a trigger, not an RLS check.** RLS would cover only the volunteer
  policy; staff, management and admin insert rows too, and a mismatched
  `Adopt` into Hospital is just as wrong from any of them.
- **It fires before `close_prior_placement()` and the deceased cascade**
  (trigger names sort `check_lifecycle_target` < `close_prior`), so a refused
  row has changed nothing. Both would roll back with the statement anyway;
  this makes it true without relying on that.
- **INSERT only.** Existing rows are history and are left alone. Dev holds a
  Foster into Unassigned that the AppSheet import produced. It also means a
  re-run of `import-appsheet.mjs` on source data with a mismatched pair would
  now fail, loudly, in its transaction; the production import is done.

## Evidence

`scripts/check-placement-guards.mjs` runs the file twice and then every
case in a rolled-back transaction as real roles (volunteer, staff, admin):
the refusals above, and the flows that must still work: a normal close,
ChangeEnclosure between ordinary enclosures, the deceased workflow with its
cascade snapshot and `undo_deceased_placement()`, Foster, Adopt,
ReturnToShelter, hospital in and out, and death from hospital then undo.

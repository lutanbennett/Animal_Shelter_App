# Resident hub phone labels and End-today confirm (#2ajsm, #ox2bb)

**Step zero:** labels were still `hidden md:inline`; `RecordRowActions` had no confirm. Both open.

## Labels
Changed the shared `ActionLink` only: the word is now always shown (icon 16 px, `px-3`, 44 px high on phones), so every call site with the default gets it, no per-site edits. Call sites already passing `iconOnlyOnMobile={false}` were unaffected. No new dictionary keys: the label is the existing `label`/`aria-label` string (already English and Thai).
- Resident hub Edit and Record death already showed words at phone width (`md:sr-only`); left.
- Header Assistant (`AssistantPanel`, `hidden sm:inline`) left icon-only below 640 px: header space is tight and the header is not part of the hub. Not fixed; for the planner.
- Row icon buttons (`RowActionButton`/`RowActionLink`) without `word` are unchanged: they are repeated row actions with a tooltip, already fixed by #ox2bb's first half.

## Confirm
Chose **ask before ending**, using the existing `ConfirmProvider`/`ConfirmDialog` (focuses Cancel). Rejected act-then-undo: it needs somewhere to hold and show the undone state. New string `common.endRecordConfirm(subject, date)` in en and th names the record and today's date (Bangkok). Only Diet and Prescriptions use `RecordRowActions` with End today; Vet Appointments, Weight and Procedures have no End-today control, and the job page's "Edit details" is an edit link, not an ending, so the item over-listed them. Who sees the button is unchanged.

# Release note: clinic visits booked through the assistant now reach the calendar

**Decided 2026-11-02 (`assistant-calendar-note`).** A fix that users would notice shipped with no
release note. PR #1203 (`0b81f9ac`) answered its release-note line `n/a: nobody would notice the
booking screen change`, true of the booking screen and not of the assistant path it fixed in passing.
This is the mirror of `2026-10-11-release-note-truth-rule.md`: there a note promised something not yet
working; here something worked and nobody was told.

## The note
One English line in `unreleased`: a visit booked by asking the assistant now appears on the calendar.
It also says, in plain words, that visits booked that way earlier are in the app but may be missing
from the calendar, and to check and add by hand if it matters. **No date is given** for "earlier":
the code was wrong from 2026-09-23, but when the assistant reached real users was not established,
so a date would be a guess. No Thai was written, so there is no Thai caveat to carry.

## History (measured)
- `git log -S` on `src/app/assistant/actions.ts` finds the line `const id = Array.isArray(data) ? data[0] : data`
  in one commit only: `be0fe0e8`, 2026-09-23, *Assistant v1, batch 1*.
- It was fixed by `0b81f9ac`, 2026-11-02 (`(…)?.id`). About 40 days, six weeks.
- The `data[0]` was a whole visit row, never a string, so the `typeof id === "string"` guard
  skipped the calendar step and the action returned an empty id every time.

## Lost or only un-synced: NOT ESTABLISHED
The RPC saves the visit before the calendar step, so "saved but not on the calendar" is the likely
answer. That is reasoning, not a reading. Nothing records whether a visit came from the assistant or
the booking screen, so no production check can pick them out, and `calendar-pending` and
`calendar-recent` do not separate them either (the twelve `calendar-recent` rows are completed,
cancelled or past visits, the ordinary case). Production is healthy today (`calendar-pending`: none waiting).
**What would settle it:** a marker of how a visit was created, or a read of the Assistant log against
clinic visits made in that window. The marker is not added here (no migration this stream); it is for
the planner to file.

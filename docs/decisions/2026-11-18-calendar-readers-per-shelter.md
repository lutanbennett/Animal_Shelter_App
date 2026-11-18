# The poll, the import and the status tile read each shelter's own calendar (#calsh piece 3)

**Decided 2026-11-18, by the stream (the brief handed deliverable 5 over as a design judgement).**

**What the poll iterates (deliverable 5): shape (a).** `pollCalendarChanges()` lists every shelter, resolves each one's calendar with
`shelterCalendar()` (a complete credentials row, else the fallback shelter's environment, else refused) and polls the ones that resolve,
each with its own cursor. Why not (b): the cron is one in-process call with no per-shelter driver, so a per-shelter caller would have
to be invented; (a) needs none and a shelter added tomorrow is polled with no change. One shelter failing never stops the next.

**The cursor.** `calendar_sync_state` stays keyed on `calendar_id` (`0409` makes it unique across shelters, so one row per calendar is one row
per shelter). All three upserts and both reads now name `shelter_id` explicitly: a service-role run has no request shelter, so the
column default (`current_shelter_id()`) would have left the row unscoped. `NOT NULL` stays `#stmp5` step 3's.

**Quiet, per shelter.** `checkCalendar(shelterId)` reads that shelter's cursor (`shelter_id` + its calendar id), so `isSweepQuiet()` is
answered per shelter, not globally. Its visits are fenced to the shelter too.

**No default calendar.** `calendarFetch(path, init, creds)` now REQUIRES its credentials (the default of the environment calendar is gone);
every call site passes them. The readers ask `shelterCalendar()` / `shelterCalendarOn()`. `calendar-sync.ts`, `-poll.ts` and `-import.ts` read no
`GOOGLE_*` from the environment; the four variables are read only in `shelter-calendar-decide.ts`, on the fallback shelter's named path.
(`calendar-sync.ts` still imports `envCalendarConfigured`, used only for the sweep's `configured` flag.)

**Fences added.** The poll's visit lookup is `.eq("shelter_id")`; the import matches only the polled shelter's clinics and residents, and
`createVisits` refuses a clinic of any other shelter; the confirm list, confirm and dismiss resolve the acting shelter's credentials
and do nothing for a shelter with none (they used to act on the environment calendar for everyone).

**Proved.**
- Lanna unchanged: `decideCalendar(null, "lanna")` still resolves to the environment calendar (test); the poll visits the `lanna` shelter through
  that path. Not run against Google (no calendar call from here).
- A shelter with no row is refused on every path: test shows `not_configured` with the environment set; the poll `continue`s past it, the
  confirm list and actions return nothing/not allowed, the tile says off.
- Negative test `calendar-readers-per-shelter.test.mjs`: every `calendarFetch` passes credentials, no `process.env.GOOGLE_*` in the readers,
  every `calendar_sync_state` upsert names `shelter_id`, visit lookup and import fenced to the polled shelter.
- The write shape, on the dev database as service role with no shelter header: upsert with explicit `shelter_id`, read back with that
  `shelter_id`, row removed (output in the test plan). This proves the database accepts and keeps the shape, not the app code path itself.

**Release note: none.** Connecting a calendar is still the operator script `connect-shelter-calendar.mjs` (a second Google account and
`DRIVE_CREDENTIALS_KEY`), so nothing a user could do changes.

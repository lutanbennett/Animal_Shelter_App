# Calendar: no button, an environment tag, our own event ids (2026-10-22)

Lutan, 2026-10-22, after a morning of duplicates, seven visits cancelled out from under him and six bookings
that waited for the sweep. All three were measured the same day; this records what was built.

- **The "Add to Google Calendar" button is gone** (both screens, `googleCalendarUrl`, its dictionary strings,
  the manual's paragraph). Four of the five production events were its work: it opens Google's prefilled page,
  so every press is a new event that carries no `visitId` and is on no visit, which also meant editing it
  did nothing. The automatic sync already puts every booked visit in the shelter calendar. Staff who used the
  button for their *own* calendar lose that; the replacement is to share the shelter calendar with them (an
  existing item), never a button that makes orphans. `CALENDAR_ENTRY_MINUTES` stays: `calendar-event.ts` reads it.
- **Every synced event carries `extendedProperties.private.env`** (`dev`, `uat` or `production`, from
  `getAppEnv()`) beside `visitId`. The poll reads it before it cancels or moves anything and **ignores an event
  tagged with another environment**. An event with no tag (made before today) is still acted on: the lookup by
  `calendar_event_id` already tied it to a visit in this database, and refusing untagged events would stop a real
  deletion by the Director from cancelling a visit, which is the feature. A deleted event reaches the poll as an id
  and a status only, so for those the poll fetches the event by id to read the tag; if Google will not say, the
  tag is "unknown" and the poll acts as before. *Not proven:* whether Google returns `extendedProperties` for a
  deleted event; the test plan records what was seen.
- **The cancellation email names its system:** `[DEV]` / `[UAT]` before the subject (nothing for production) and
  "the dev Lanna Care system (address)" in the body.
- **Event ids are ours:** `calendarEventIdFor` = one letter for the environment + the visit's UUID without dashes
  (base32hex, 33 characters). A create sends it; a 409 means the visit already has its event, so the sync patches
  that event (with `status: confirmed`, which also revives one deleted by hand, since Google keeps a deleted id)
  and claims it. This closes the create race and the swallowed-id-save by construction: no claim column, no
  schema. Events already on the row keep their old random id and are only ever patched. The race in `syncRow` was
  **not** today's cause (no visit was found with two sync-made events); this is hardening.
- **"No error" no longer also means "calendar not switched on here".** When `calendarConfigured()` is false,
  `syncPendingVisits` writes a note on the upcoming visits that never reached the calendar (calendar columns
  only, which the 0207 trigger ignores), and the resident's Clinic visits list says per visit: in the shelter
  calendar / not yet (sent again within 15 minutes, Retry) / the calendar is not switched on in this app.
- **Not settled here:** whether the Pi's app process holds the four calendar values. The check for Lutan is in
  the PR (names only).

# Vet calendar: one event per visit, save first, sync second (2026-10-16)

Backlog item: "Vet visits go into the shelter's Google Calendar by themselves". Built to the item's
**final** shape (the Director, 2026-10-15): one event per dog, titled `clinic - resident`. The brief's
earlier clinic-day text was superseded and not built; the schema (0207) already matched.

- **Save first, calendar second.** Every write path (edit form, booking form, assistant booking) saves
  the visit, then calls `src/lib/clinics/calendar-sync.ts`, which never throws. Failure is written to
  `calendar_error` and the row stays out of date; the Worker cron (every 15 minutes,
  `/api/calendar/sweep`) and the Retry button re-send it.
- **The trigger is the safety net, not the call sites.** 0207 stamps `calendar_out_of_date_at` on any
  change, so paths that call nothing (audit undo, hospital flow, status changes) are caught within 15
  minutes. The edit and booking forms sync straight away, so most changes show in seconds.
- **Rebuilt from the database each time**: the event is whatever the visit says now; an event deleted by
  hand is recreated. Past visits get no event; one that becomes cancelled/archived/past deletes its event.
- **Back-fill is the same sweep**: upcoming booked visits never sent are picked up when the token is
  first set. Nothing is marked while the calendar is unset, so switching it on loses nothing.
- **Own token** (`GOOGLE_CALENDAR_REFRESH_TOKEN`, calendar.events scope, same published Desktop client);
  Drive photo uploads cannot be taken down by it. `GOOGLE_CALENDAR_ID` is a setting.
- **Location is the clinic's name**: the clinics table holds no address (name, Thai name, contact info).
- **Privacy**: description = resident name, clinic, two links built from the site origin (never a written
  host). No reason, no notes. The links need a signed-in login; signed-out requests redirect to /login.
- **Known gap**: hard-deleting a visit row (no screen does; a resident cascade or SQL) leaves its event,
  because there is no row left for the sweep to find. Not fixed here: it would need a migration.
- **Not built**: a one-page medical summary (filed for Lutan to decide); the `.ics` feed item is not
  ticked until he confirms it can go.
- Concurrent form-sync and cron on the same new visit could in theory both create an event; the window
  is seconds and the cost is one duplicate entry.

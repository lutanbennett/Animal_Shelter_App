# Visits from entries typed in Google Calendar (2026-10-22)

Lutan, 2026-10-21, for the Director: create clinic visits by adding an entry to the shelter calendar
("Novel - Blackie") instead of logging in. Built on the same morning's environment tag
(`2026-10-22-calendar-event-environment-tag.md`); no migration.

- **The poll offers every event it does not recognise to `calendar-import.ts`.** An event tied to a visit
  (`calendar_event_id`) is handled exactly as before. Any other new event is read as `<clinic> - <resident>[, <resident>…]`
  (a spaced dash; `calendar-import-match.ts`, pure and tested).
- **Exactly one clinic and one live resident per name, or nothing is booked.** A typo, an unknown or ambiguous
  clinic, two residents of one name, a deceased or adopted resident, a title with no dash, no resident, or an
  all-day entry all go to the confirm list; a good name beside a bad one books neither. Clinic names match on the
  whole name or one whole word of it ("Novel" for "Novel Vet Clinic"). **There is no clinic short-name column**, and
  adding one is a migration, so the word match stands in for it; a clinic whose word is shared by two clinics is
  "ambiguous" and goes to confirm rather than being guessed.
- **Created visits** are `scheduled`, noted "Created from Google Calendar", made with the service role, so the
  audit actor is empty and the Recent changes page labels the row "Via Google Calendar" (an INSERT carrying that
  note, alongside the existing UPDATE case). The first visit claims the entry (`calendar_event_id`); the app's own sync
  then retitles it and writes `visitId` and `env`, so it behaves like any synced visit. A second resident on the same
  entry gets their own event from the sync (one event per visit is the rule).
- **Never twice:** a visit already holding the event id stops a second import; an event that carries a `visitId` is the
  app's own and is never read as new; an event tagged with another environment is skipped; repeating entries are skipped.
- **Before this was switched on:** the poll's first run only baselines, so older entries are not imported on their own.
  They do appear in the confirm list (it reads the calendar live), where one tap books them or Dismiss hides them.
- **The confirm list reads Google live** (future entries, no table) at the top of `/upcoming-visits`, for `visit.book`
  only. A confirm takes the time from Google, re-checks that the entry is still unclaimed, the clinic exists and every
  resident is live; the form only says which to use.
- **Dismiss is a private property on the event** (`extendedProperties.private.dismissed`), not a column, so there is no
  schema. The entry's visible fields are untouched. Side effect, accepted: every future entry that is not a visit
  (a staff meeting) shows in the list until dismissed, which is what the item's "no dash goes to confirm" asks for.
- **Not built, on purpose:** the count on the booker's home tile (it would need a stored count, so a schema PR, or a
  Google call on every home page) and the "needs confirming in Lanna Care" line on the entry's description (optional in
  the item, and it would write to the Director's own entry). The count is in the list's heading.
- **Production:** nothing here was run against the production calendar.

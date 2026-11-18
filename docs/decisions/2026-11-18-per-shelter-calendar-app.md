# Per-shelter calendar: the reader and the refusal (#calsh, app half)

**Decided 2026-11-18 by the stream, within the specification of `2026-11-18-per-shelter-calendar-credentials.md`. Not Lutan's.**

- `src/lib/google/shelter-calendar-decide.ts` (pure) and `shelter-calendar-credentials.ts` (reads the row with the service role)
  return configured / not configured / dead. Secrets are decrypted with the existing `DRIVE_CREDENTIALS_KEY` helpers.
- `calendar-sync.ts` no longer reads any `GOOGLE_*` variable itself: the only reader is `envCalendarCreds()` in the decide file,
  used only for the shelter keyed `lanna` with no row (the same fallback shape as the Drive).
- `syncPendingVisits()` resolves each visit's own shelter and writes to that calendar. A shelter with none (and not Lanna) is
  refused: nothing is written, the visit gets `CALENDAR_OFF_NOTE`. An incomplete row is refused too, even for Lanna, rather than
  falling back to the environment. A visit with no shelter has no calendar and is refused. Token cache is per Google account.
- `calendarFetch()` keeps a default of the environment calendar for the poll, the import and the status tile, which are still
  Lanna-only. **Not done, for the planner to file:** the two-way poll (`calendar-poll.ts`), the import and `checkCalendar()` read
  only Lanna's calendar; shelter #2 needs them per shelter before it can use calendar import/poll. `calendar_sync_state` upserts must
  then write `shelter_id` explicitly.
- **Admin status RPC (deliverable 7): needs a migration** (`0405`'s shape is a `security definer` SQL function), so it is not this
  stream. For the planner to file: `shelter_calendar_status()`.
- **Not done: the save path** (a screen where a shelter connects its calendar, refusing a `calendar_id` equal to
  `GOOGLE_CALENDAR_ID`). Without it a shelter cannot connect a calendar yet, so `#calsh` is not ticked and there is no release note.

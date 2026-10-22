# Test and production never share a Google Calendar (2026-10-22)

**The rule: test and production must never share a calendar id.** Lutan,
2026-10-22: a shared calendar between test and prod "needs to be separated asap".

`2026-10-22-vet-calendar-on-production.md` reused the one calendar "Lanna Care:
vet visits" for production, so test and production wrote to the same place.
This supersedes that choice **for test only**.

- Test now has its own calendar, "Lanna Care: vet visits (TEST)", in the
  `lannaanimalfoundationbwm` account (Asia/Bangkok). Its id is in `.env.local`
  only. `.env.deploy.production` is untouched and still names the real calendar.
- No new OAuth client, token or secret: the existing refresh token reads the new
  calendar (HTTP 200). It cannot *create* calendars (scope), so Lutan made it by hand.
- **Why it matters:** a dev database refreshed from a production dump carries
  production's `calendar_event_id` values; with one shared calendar, test's
  quarter-hourly sweep would rewrite and cancel real appointments. Separate
  calendars close that off by construction.
- **Not a problem, for the record:** the link cannot create orphan visits —
  `calendar-poll.ts` looks events up in its own database and ignores unknown ones.
- **Cutover:** production's move to `lannacareforanimals@gmail.com` (new id and
  token) now changes one environment, not two.
- **Clearing old test events** from the real calendar makes test cancel the
  matching visits on its next poll ("Cancelled from Google Calendar") and email
  the dev admins. Harmless.
- Whatever creates a future environment's calendar must give it its own id.

# Add to Google Calendar link on vet visits (way (a) only)

2026-10-15, `claude/vet-visit-calendar-link`.

- **Only the plain link shipped.** No token, no schema, no Google consent. The `.ics` feed (b) is
  filed as its own backlog item; the Calendar API (c) waits for the Director to ask.
- **Time zone.** `appointment_date` is a stored instant, so the link converts it with
  `toISOString()` to UTC (`YYYYMMDDTHHmmssZ`) and never touches a local clock. A 03:00 Bangkok visit
  on the 20th is `20261019T200000Z`; Google shows it back as 03:00 on the 20th.
- **End time.** Visits store a start only, so the entry runs one hour (`CALENDAR_ENTRY_MINUTES`).
- **Only Scheduled visits get a link.** Cancelled and finished ones show none; a stale entry for a
  visit that no longer happens is the failure to avoid.
- **The stale-link limit is stated in words** beside the links (`shelterVisits.calendarNote`, both
  languages), once per list, not in a tooltip.
- **"Straight after booking"** is the resident's Clinic visits list, which is where booking already
  redirects. A bulk booking lands on /residents, which has no per-visit rows; its visits get the link
  from /upcoming-visits.
- **Link back** is the resident's Clinic visits page, put in the entry's description, using the
  request origin (`getSiteOrigin`).

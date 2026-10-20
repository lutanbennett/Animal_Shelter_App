# Two-way calendar: how the poll decides (2026-10-20)

Built to the backlog item, with these choices the item left open.

- **The poll runs inside /api/calendar/sweep, before the sweep.** One cron hit, no Worker change. A calendar edit is applied first; anything the app changed since the last sync then wins (the sweep rebuilds the event).
- **Own changes**: the app stores the event etag after every create and patch (0232 columns). A polled event with that etag is ignored.
- **First run baselines**: with no sync token, one full read stores the token and applies nothing. A 410 clears the token and re-baselines next run.
- **No migration (this batch's slot belongs to desexing-drives-schema).** So: the cancel reason is appended to the visit notes ("Cancelled from Google Calendar"); a clash or a refused move is left in calendar_error. There is no per-visit "changed from calendar" column and no audit label "via Google Calendar" (the audit row shows the service login). Both need schema: **open follow-up** (the "listed for a week" safeguard on System status / Upcoming visits is NOT built).
- **Cancel mails all admins** through the status-alert mail path (alerts.ts send/adminEmails, now exported). The Director is an admin by night.
- **Pure rules** are in calendar-change.ts with tests; completed or cancelled visits ignore calendar edits; all-day events are ignored.
- **Push (watch channel) is out of scope**, as briefed.
- **A clash is not durably listed.** The poll writes it to calendar_error, but the sweep that puts the calendar back clears that field in the same run. The count is in the cron log line (polled.clashes). A lasting list needs the same schema follow-up.

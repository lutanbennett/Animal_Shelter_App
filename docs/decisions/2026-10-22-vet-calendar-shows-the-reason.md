# The vet calendar entry shows the reason (2026-10-22)

Lutan, 2026-10-22: *"On the google calendar entry for a vet appointment can we add the reason field so
that anyone reading the calendar can see why the appointment has been made."*

**This reverses one line of `2026-10-16-vet-calendar-one-event-per-visit.md`**, which kept the event's
description to name, clinic and links: *"No reason, no notes."* That line is marked superseded in place
there; the rest of that file stands.

- **The reason is in; the notes stay out.** The description gains `Reason: <text>` straight after the
  `Vet visit:` line, only when the reason is not blank (no empty label); line breaks in the reason are
  folded to single spaces. The title stays `Novel - Blackie`: the Director types entries in that shape and
  a long reason would crowd it on a phone.
- **Who can now read it.** The shelter's Google account that owns the calendar; anyone the calendar is
  shared with (the Director, once it is shared, and any admin who shares it later); and every device those
  people are signed in on, including phones and any calendar app that syncs it, where the text also appears
  in notifications. That reach is why the reason was excluded at first. It is accepted: the reason is a short
  line, not the medical record. Anyone writing a reason should know it leaves the app.
- **Edits follow.** `reason` is read by the sync (`calendar-sync.ts`). The edit action and the assistant's
  booking path both call the sync after saving, so changing only the reason updates the entry within about a
  minute. The `clinic_visits_calendar_dirty` trigger (0207) does not watch `reason`, so the *sweep* would not
  notice a reason change on its own; that only matters if a sync call fails, in which case the entry is
  corrected by the next edit. Not widened here (it would need a migration, which this change does not carry).
- **Not copied back.** The two-way poll ignores description edits (`calendar-poll.ts`), so a reason typed in
  Google is overwritten, not read.
- **Existing entries.** They gain the line only when next synced. `node scripts/resend-calendar-reasons.mjs
  --env <env> --apply` marks upcoming booked visits that have an entry and a reason as out of date, and the
  sweep rewrites them within 15 minutes. It is idempotent and writes only calendar columns. Run on dev while
  building; **production is run by whoever deploys this release, after the deploy**.

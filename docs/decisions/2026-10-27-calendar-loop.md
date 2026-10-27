# 2026-10-27 — The calendar loop: the app read its own deletions as cancellations

**Decided by Lutan, 2026-10-27, asked directly with three options.** A past or completed visit KEEPS its
calendar event (updated if the visit changes). The event is deleted ONLY when the visit is cancelled or
archived. He did not choose a tick on a completed visit's title; none was added. Supersedes the "gone once
past or completed" rule in `2026-10-16-vet-calendar-one-event-per-visit.md`.

## What was wrong
Booking a visit ran `syncPendingVisits()`, which syncs every out-of-date visit. `wantsEvent()` wanted an
event only for a scheduled, unarchived visit dated today or later, so every other visit holding an event got
a DELETE. The poll then read those deletions back as someone cancelling in Google. A deleted event returns
with a new etag, so the etag test (`own`) missed it. Four production visits were cancelled by one booking.

## What changed
- `wantsEvent()` moved into `calendar-change.ts` (pure, tested). Event kept for any non-cancelled,
  non-archived visit that has one; a visit with no event gets one only if scheduled and today or later (the
  "no back-fill of the past" rule is unchanged).
- `decideChange()`: a deletion within two minutes after the visit's own `calendar_synced_at` is `own`; a
  deletion for a visit whose date has passed is `past` — left scheduled and flagged in `calendar_error`.
  A real deletion of a future visit by the Director still cancels it. Unit tests for each.
- `scripts/correct-calendar-cancelled.mjs` restores visits by id. **Written, not run.** The planner runs
  it from the main checkout after merge, using ids from `check-production.mjs calendar-recent`.
- New read-only checks `calendar-recent` and `visit-duplicates`.

## Item 2 (shown as overdue and cancelled)
**Cause NOT ESTABLISHED. Not fixed.** One row cannot be both, so it is almost certainly two rows. The
`visit-duplicates` check lists cancelled/scheduled pairs for one resident and clinic within a day, with
creator, creation time and change kind; running it on production settles the cause and names the fix.

## Order of release
The poll runs only on the 15-minute cron, stopped since 2026-10-23. This fix must ship in the same release
as, or before, the trigger is restored; otherwise a past visit whose event is deleted can be cancelled again.

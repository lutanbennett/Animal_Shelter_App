# 2026-10-20 — Schema for the two-way calendar (`0232`)

Schema half only. Nothing in `src/` reads these objects; the poll, cancel-with-reason and Director's note are the app half.

- **`calendar_sync_state`** (calendar_id, sync_token, last_run_at, last_ok_at, last_error): the `events.list` syncToken per calendar. Service role only (RLS on, all revoked from anon/authenticated), like `video_uploads`. `last_ok_at` and `last_error` are added beyond the item's list so System status can show a stalled poll.
- **`clinic_visits.calendar_etag` and `calendar_event_updated_at`**: the event's etag and `updated` time after the app's own write, so the poll ignores its own change. Neither is in the `0207` dirty trigger's list, so writing them does not re-mark the visit.
- Phase 1 is already on `main` (`0207`, `calendar-sync.ts`) and live on test; the backlog item's "not started" was stale.
- Not added: a "changed from calendar" log column. The item can list changes from the audit rows (recorded as via Google Calendar); the app half may add a column if it finds it needs one.

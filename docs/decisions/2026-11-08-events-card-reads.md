# Events card reads (`#yacd2`) — 2026-11-08

All analysis is by card. Roles are not used as evidence. Follows `2026-11-06-events-card-reads.md`, which built the picker notes and left (1) for Lutan.

## His answers (2026-11-08, asked directly)
1. Photo approval shows the event's name: a read of event titles only, not the rest of the event.
2. Say why a picker is empty; do NOT pair the cards (no `run_appeals` added to `run_fundraising_events`, `cards.ts` untouched).

## Step zero
Part (1) not built (loader read `fundraising_events` directly, gated on `events.run`). Part (2)'s notes were already built on 2026-11-06 (`appealNoAccess`, `projectNoAccess`, both dictionaries), so this PR builds only (1).

## Shape chosen: `waiting_event_titles()` (0334), security definer
Returns `id, title, event_date`, only for events with a photo waiting, only when the caller holds `photos.approve` (the activity every approve action asks, `src/app/photos/approve/actions.ts`). Worse alternatives: a second select policy on the table gives the whole row (RLS cannot limit columns); a security_invoker view is still decided by the table's own policy so an approver reads nothing. The "has a waiting photo" restriction was carried, by the same test the queue uses. Proven by `scripts/check-waiting-event-titles.mjs` (approver reads the title, cannot read the table, a login with neither reads nothing).

## Deliverable 2 answer
Both pickers load through `loadLinkChoices`; the campaign list is empty without `appeal.run`, the project-folder list without `projects.folders` read. Different activities, so two separate notes (already two strings). Wording "may be short or empty" is true whether none exist or none are visible.

## Action controls (deliverable 8)
Approve queue: Approve, Private only, Remove each ask `photos.approve` (actions `approveEvent`, `privateOnly`, `removeWaitingEvent`); the tab itself is drawn only for `photos.approve`. Event form: Save asks `events.run`, the page's own guard. Nothing ungated found.

## Found, not fixed
- Event Thai wording unreviewed; the two new-note Thai strings too. Video deliberately not offered in the gallery.
- `event_date` is returned by the function but the queue does not show it yet.
- Dev had no waiting event photo, so the title was proven in SQL, not seen on screen.

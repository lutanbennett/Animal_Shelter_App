# One shelter-wide page for upcoming vet visits: `/upcoming-visits`

**2026-10-13, no migration.** The Director books visits and had no view of everything coming up;
`/appointments` is a clinic login's page and refuses her.

## Choices worth knowing
- **Path is `/upcoming-visits`.** `/vet-visits` is taken: `next.config` redirects it (and `/vet-visits/*`)
  to `/clinic-visits`, kept for old links. The first build used it and was bounced; the harness caught it.
- **Gate:** `medical.visits` read **and** `scopes.clinical === "any"`, the opposite of `/appointments`
  (`own_clinic`). The route registry carries the same `scope`, so the Operations tile is offered only to
  those who can open it. Reached from Shelter Operations only: her Management home is a fixed list guarded
  by `check-home-screens.mjs`, and a tile there was ruled Lutan's call.
- **Own loader, not `loadClinicAppointments`.** That function sorts into three buckets for a doctor and
  drops Cancelled; this page needs every status, the clinic and the photo. Same table, same `archived_at`
  filter, same RLS: nothing re-decides who may see a row (`loadShelterVisits`).
- **Nothing Scheduled is ever cut off.** Scheduled visits load at any age; Completed and Cancelled only for
  the last 30 days. A date window on everything would silently drop the oldest overdue visit, which is the
  harm this page must not do. The query is limited to 2000 rows as a backstop.
- **Hiding is in the browser and always counted.** Hide overdue, Completed and Cancelled are filters over
  rows already loaded. Hide overdue is remembered in `localStorage` (try/catch, per device, not a setting)
  and the page says "N overdue hidden, show". The count is of what the current clinic filter would show.
- **Days and times are the shelter's.** The day comes from `visitDate()` (Bangkok), the time from an
  `Intl` formatter pinned to `SHELTER_TIME_ZONE`, not `getHours()`, which uses the server's zone (UTC on
  Workers). Day labels are built on the server with `formatDate`, so Thai shows Buddhist Era.
- **Calendar is a plain CSS grid** (week and month), shown from md up; the buttons are hidden on a phone.

## Proof (dev)
`scripts/check-upcoming-visits-page.mjs`: Management sees exactly the table's Scheduled, unarchived rows
(6 of 6 by id, both directions). A doctor gets the refusal page with no visit links; a public viewer is
redirected to `/`; a login with no role to `/login`. `shelter-visits.test.mjs` covers the 03:00 Bangkok
visit (20:00Z the day before) landing on the right day, the group order, and grouping losing nothing.

## Not done
- **Awaiting results status:** put to Lutan, not built (a schema PR). If "done, waiting for results" is the
  normal state of an overdue visit, a status of its own would let *overdue* mean genuinely missed.
- **Google Calendar (stretch):** filed as its own backlog item.

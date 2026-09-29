# 2026-09-29 — A vet's home is an Appointments page, not My tasks

Backlog: "A vet's work comes from their appointments". Lutan answered the
item's two open questions in chat on 2026-09-29.

- **"Appointment" is the existing `vet_appointments` booking.** No new
  concept and no schema. Records a vet adds are linked to it through the
  `vetAppointmentId` the procedure, blood test, prescription and weight
  forms already accept.
- **A vet sees the clinic's appointments, not just their own doctor's.**
  The page filters `vet_id` to the vet's clinic (`current_user_vet_id`,
  0102); which residents are visible stays 0108's RLS. A vet with no clinic
  set sees an explanation, not every clinic (same rule as
  `src/lib/vets/scope.ts`).
- **Tasks stay shelter operations.** Lutan's steer: "lets create a new vet
  page … as opposed to try to make it fit into tasks". So there is no
  appointment-follow-up section in My tasks. Vets have no My tasks link;
  `/my` redirects a vet to `/appointments`, so the public site's Open the
  app and every other link to `/my` still land somewhere right. A vet's
  sign-in lands on `/appointments` (`VET_HOME_PATH`).
- **Menu:** Appointments, Residents. Recurring jobs was never in a vet's menu.
- **Page shape** (for the vet-form work that follows): `src/app/appointments/
  page.tsx` renders rows from `loadClinicAppointments`
  (`src/lib/vets/appointments.ts`) in three groups — To write up (scheduled,
  date passed), Upcoming, Recently done (completed, last 30 days).
  Cancelled visits are not listed. Add a form or shortcut by adding a link
  to the row's action list; every link carries `residentId` and
  `vetAppointmentId`.
- **Acceptance (5), nothing lost when a visit is marked done:** the forms
  list a resident's visits whatever their status and no action checks
  status, so a record saved after someone marks the visit completed still
  links to it. Completed visits stay on the page for 30 days so a write-up
  can still be started from them. Read from the code, not driven with two
  sessions — the test plan says so.

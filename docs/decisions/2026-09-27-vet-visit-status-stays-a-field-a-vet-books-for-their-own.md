# 2026-09-27 — Vet-visit Status stays a field; a vet books for their own clinic, set in Security

Backlog "Vet visit form: scope the clinic picker, and reconsider the Status
dropdown" (UAT 2026-09-27, findings 8 and 9). Both questions went to Lutan
with the data below before anything changed.

- **Status is not derivable from the date, so it stays a field.** The enum
  is `scheduled / completed / cancelled` (`0001`). `cancelled` is set by the
  deceased cascade (`handle_deceased_placement`) and by hand on the edit
  form. The deciding case is `scheduled` **with a past date**. The resident
  hub and vet hub read that as *overdue* ("has anyone confirmed this
  happened?"). Dev on 2026-09-27: 72 completed (all past), 1 scheduled
  future, 2 scheduled past (the 22 and 24 Sept visits nobody closed), 0
  cancelled. A label derived from the date would erase overdue as well as
  cancelled. Lutan chose to keep the dropdown and reword it: the options
  now say what each state means ("Scheduled — not yet confirmed as done"),
  and a hint under the field says a past scheduled visit shows as overdue.
  The booking form still pre-fills it from the date until someone touches
  it. A separate `missed` status was offered and not taken; it would need
  an enum migration.
- **A vet account books against its own clinic, and a vet account with no
  clinic is refused.** `user_roles.vet_id` (`0102`) is the link. On a vet
  session the booking and edit forms show that clinic by name instead of a
  dropdown with one entry, and both actions check the posted `vet_id` on
  the server (`src/lib/vets/scope.ts`). With no clinic set, the pages say
  to ask an admin rather than falling back to every clinic. That was
  Lutan's call, over the "behave as today" option: a vet recording against
  the wrong clinic is worse than a vet who has to ask once. On edit, a
  visit already at another clinic keeps that clinic on offer, so saving an
  unrelated change never moves it.
- **This is the forms' rule, not RLS.** A vet's session can still insert a
  `vet_appointments` row for any clinic through the API. Enforcing it in
  policies belongs with the resident-level scope item (order 4), where a
  vet's database access is being decided. This stream had no migration
  slot, and `0105` (`schema-vets-readonly`) is changing the neighbouring
  `vets` policy.
- **The clinic chooser went into Security here, not with the doctor
  roster.** The roster item's feature half listed "choosing a vet account's
  clinic in `/admin/security`". Nothing else sets `vet_id`, so without it
  this change could not be seen. Lutan moved it into this PR. It is a
  Clinic select under the role, shown for vet accounts only and outlined
  while empty. `updateVetClinic` filters its update to `role = 'vet'` so
  0102's check constraint is never the error an admin reads. Changing the
  role away from vet already clears the clinic (0102's trigger); the row
  clears its select to match.

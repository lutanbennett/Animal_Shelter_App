# Book a vet appointment button on the pages bookers land on (2026-10-15)

**Form:** `ClinicVisitForm` already started empty (the residents-list action passes a selection, the picker works without one), so it was not rebuilt. Only `?clinicId=` was added to `/clinic-visits/new`, accepted only if the clinic is among those the login may book (a doctor's own).

**Button:** `ActionLink` primary, label always shown, on `/appointments`, `/upcoming-visits` and `/clinics/<id>`, gated on `can(perms, "visit.book")`, the permission the form page and `bookClinicVisit` enforce.

**Vets (Lutan, 2026-10-15: yes, at their own clinic only):** the page and the action already fix a doctor to their own clinic (`loadClinicScope`, `scopeAllowsClinic`). **Still outstanding, not done by this PR:** giving the doctor role the *Book clinic visits* card on Settings -> Who does what (a setting), and a database-side refusal of another clinic in `schedule_bulk_appointments` (needs a migration; this stream carries none). Until the setting is turned on no vet sees the button, and the release note therefore addresses admin and management only.

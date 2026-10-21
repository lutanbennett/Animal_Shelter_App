# Cancelled visits are not counted, and are listed apart

Status values in use on `clinic_visits` (enum `appointment_status`, `0001`): `scheduled`, `completed`, `cancelled`. There is no no-show.

**Rule:** a visit counts if it is `scheduled` or `completed`; `cancelled` never counts.

- Changed: the hub's "N visits" (`ResidentHub.tsx`); the resident's Clinic visits section (cancelled go in a folded "Cancelled (N)" block, reason shown from `cancel_reason`, including visits cancelled from Google Calendar); the archive PDF and offline index (a separate "Cancelled visits" section, only when there are any); the per-doctor visit count on a clinic's doctors page.
- Already excluded cancelled: management dashboard, cashflow, prior-visit lookups.
- Left alone on purpose: the clinics list count, which gates deleting a clinic and must count every row because `clinic_visits.clinic_id` has no cascade.
- Overdue/upcoming on the hub still look at `scheduled` only.
- No new "Regenerate archive" action: the deceased banner already has **Refresh archive** (anyone with `placement.death`). Regenerating the six production PDFs is release-time work and is not done by this PR.

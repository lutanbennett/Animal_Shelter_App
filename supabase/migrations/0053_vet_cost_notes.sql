-- Vet hub follow-ups (2026-09-21): what a visit cost, and notes on a vet.
--
--   1. `vet_appointments.cost` — baht, like maintenance.actual_cost. Filled
--      in after the visit from the invoice (the new edit page), so the vet
--      hub can total spend per vet and per resident over its period, and
--      the management dashboard can pick it up later.
--   2. `vets.notes` — specialities, opening hours, emergency line: the
--      things worth knowing about a clinic that were being crammed into
--      contact_info. Shown on the vet hub under the contact details.
--
-- Written to be safely re-runnable.

alter table vet_appointments add column if not exists cost numeric(10, 2);

alter table vet_appointments drop constraint if exists vet_appointments_cost_nonnegative;
alter table vet_appointments add constraint vet_appointments_cost_nonnegative
  check (cost is null or cost >= 0);

comment on column vet_appointments.cost is
  'What the visit cost in baht, from the invoice. Null until recorded; the vet hub totals it.';

alter table vets add column if not exists notes text;

comment on column vets.notes is
  'Specialities, opening hours, emergency line — shown on the vet hub. contact_info stays for how to reach them.';

notify pgrst, 'reload schema';

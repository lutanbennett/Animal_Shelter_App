-- Weight entries (Section 4.4).
--
-- The 0001 `weight` table already has what a reading needs: a date, the
-- kilograms and a note. Two things were missing for it to be recorded the
-- way the shelter actually does it:
--
--   1. A `vet_appointment_id`. Every vet visit starts on the scales, so a
--      weight taken there is linked to the visit the same way blood tests,
--      procedures and prescriptions are — an FK with no cascade, so
--      deleting an appointment never takes the readings with it (Section
--      7.2).
--   2. A positive check on `weight_kg`. Nothing stopped a zero or negative
--      reading, which would then sit on the trend chart as a real drop.
--
-- Written to be safely re-runnable: every statement is idempotent so the
-- file can be re-applied after a partial failure.

alter table weight
  add column if not exists vet_appointment_id uuid references vet_appointments (id);

create index if not exists weight_vet_appointment_id_idx
  on weight (vet_appointment_id);

comment on column weight.vet_appointment_id is
  'The vet visit this reading was taken at, when it was; null for a reading taken at the shelter. No cascade — a deleted appointment leaves its readings behind.';

alter table weight drop constraint if exists weight_kg_positive;
alter table weight add constraint weight_kg_positive
  check (weight_kg > 0);

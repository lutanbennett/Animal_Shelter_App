-- Prescriptions (Section 4.2).
--
-- The 0001 schema carried the AppSheet prototype's shape over unchanged: a
-- medication name, a frequency label, a date range and notes. It had no
-- dose at all, and the prototype's implicit unit was "number of tablets",
-- which is why IV fluids, liquid suspensions and eye drops never fitted.
-- This migration adds what a prescription actually needs to be recorded
-- and forecast against:
--
--   1. A dose unit on `medication`. The unit belongs to the product, not
--      the prescription: "Amoxicillin 250mg tablet" is measured in tablets,
--      "Amoxicillin suspension" in ml and "Hartmann's" in ml — those are
--      three medication rows, each with its own unit, so a prescription's
--      dose quantity is always in that medication's unit and totals per
--      medication add up. Kept as a checked text column rather than a
--      reference table: the set is small, stable, and displayed through the
--      i18n enum labels like every other fixed vocabulary in the app.
--   2. `doses_per_day` on `frequency`, so "twice daily" and "every 8 hours"
--      are numbers a forecast can multiply by, not just labels. Null means
--      the frequency can't be expressed per day ("as needed").
--   3. `dose_quantity` and an optional `vet_appointment_id` on
--      `prescriptions`, so a prescription written at a vet visit is linked
--      to it the same way blood tests and procedures are — an FK with no
--      cascade, per the Section 7.2 lesson.
--   4. A `medication_daily_requirement` view: what each medication is being
--      consumed at per day across every prescription that is current today
--      for a living, non-adopted resident. This is the "forecasted medicine
--      requirements" the deceased cascade exists to keep accurate.
--
-- Written to be safely re-runnable: every statement is idempotent so the
-- file can be re-pasted into the SQL editor after a partial failure.

-- =========================================================================
-- 1. Dose unit on medication
-- =========================================================================

alter table medication
  add column if not exists dose_unit text not null default 'tablet';

alter table medication drop constraint if exists medication_dose_unit_check;
alter table medication add constraint medication_dose_unit_check
  check (dose_unit in (
    'tablet', 'capsule', 'ml', 'mg', 'g', 'mcg', 'IU', 'drop', 'sachet',
    'application', 'dose'
  ));

comment on column medication.dose_unit is
  'What one unit of this medication is measured in (tablet, ml, mg, ...). A prescription''s dose_quantity is always in this unit, so a product that comes in two forms (tablet vs suspension) is two medication rows.';

-- =========================================================================
-- 2. Doses per day on frequency, plus a starter set
-- =========================================================================

alter table frequency
  add column if not exists doses_per_day numeric(6, 3);

alter table frequency drop constraint if exists frequency_doses_per_day_positive;
alter table frequency add constraint frequency_doses_per_day_positive
  check (doses_per_day is null or doses_per_day > 0);

comment on column frequency.doses_per_day is
  'How many times per day the dose is given, as a number a forecast can multiply by: twice daily = 2, every 8 hours = 3, every other day = 0.5, weekly = 0.143. Null means it can''t be expressed per day (as needed).';

insert into frequency (label, doses_per_day) values
  ('Once daily', 1),
  ('Twice daily', 2),
  ('Three times daily', 3),
  ('Every 8 hours', 3),
  ('Every 12 hours', 2),
  ('Every other day', 0.5),
  ('Weekly', 0.143),
  ('As needed', null)
on conflict (label) do nothing;

-- =========================================================================
-- 3. Dose quantity, linked vet visit and a date sanity check on prescriptions
-- =========================================================================

alter table prescriptions
  add column if not exists dose_quantity numeric(10, 3);

alter table prescriptions drop constraint if exists prescriptions_dose_quantity_positive;
alter table prescriptions add constraint prescriptions_dose_quantity_positive
  check (dose_quantity is null or dose_quantity > 0);

comment on column prescriptions.dose_quantity is
  'How much per dose, in the medication''s dose_unit (2 tablets, 500 ml, 0.5 ml). Null on rows recorded before this column existed.';

-- Nullable, no cascade: deleting an appointment must never take the
-- prescriptions written at it with it (Section 7.2).
alter table prescriptions
  add column if not exists vet_appointment_id uuid references vet_appointments (id);

create index if not exists prescriptions_vet_appointment_id_idx
  on prescriptions (vet_appointment_id);

-- The same guard the placement rows have (Section 7.2): an end date before
-- the start date breaks every "is this current" query.
alter table prescriptions drop constraint if exists prescriptions_end_after_start;
alter table prescriptions add constraint prescriptions_end_after_start
  check (end_date is null or end_date >= start_date);

-- =========================================================================
-- 4. Row-level security
--
-- 0001 gave staff SELECT-only on prescriptions and no policy at all on
-- medication/frequency — so the hub's `medication(name)` embed has been
-- coming back null for staff and volunteers, and staff (the role that
-- records most day-to-day care) couldn't write a prescription. Same gap
-- 0006 closed for vet_appointments and 0007 for immunization_records.
--
-- Vets and staff may also add a medication or frequency inline from the
-- prescription form; nobody below admin may edit or delete one, since a
-- unit change would silently redefine every prescription using it.
-- =========================================================================

drop policy if exists staff_read_medication on medication;
create policy staff_read_medication on medication
  for select using (current_user_role() = 'staff');

drop policy if exists staff_read_frequency on frequency;
create policy staff_read_frequency on frequency
  for select using (current_user_role() = 'staff');

drop policy if exists volunteer_read_medication on medication;
create policy volunteer_read_medication on medication
  for select using (current_user_role() = 'volunteer');

drop policy if exists volunteer_read_frequency on frequency;
create policy volunteer_read_frequency on frequency
  for select using (current_user_role() = 'volunteer');

drop policy if exists staff_insert_medication on medication;
create policy staff_insert_medication on medication
  for insert with check (current_user_role() = 'staff');

drop policy if exists vet_insert_medication on medication;
create policy vet_insert_medication on medication
  for insert with check (current_user_role() = 'vet');

drop policy if exists staff_insert_frequency on frequency;
create policy staff_insert_frequency on frequency
  for insert with check (current_user_role() = 'staff');

drop policy if exists vet_insert_frequency on frequency;
create policy vet_insert_frequency on frequency
  for insert with check (current_user_role() = 'vet');

drop policy if exists staff_insert_prescriptions on prescriptions;
create policy staff_insert_prescriptions on prescriptions
  for insert with check (current_user_role() = 'staff');

drop policy if exists staff_update_prescriptions on prescriptions;
create policy staff_update_prescriptions on prescriptions
  for update using (current_user_role() = 'staff');

-- =========================================================================
-- 5. Deceased cascade: respect the new end-after-start check
--
-- 0026's handle_deceased_placement() set every open prescription's
-- end_date to the date of death. A prescription written to start *after*
-- that date (one dated for tomorrow, recorded today) would now violate
-- prescriptions_end_after_start and roll the whole death record back, so
-- such a row is ended on its own start date instead: it never becomes
-- current, and the forecast view below excludes deceased residents anyway.
-- Otherwise identical to 0026 (security definer, lock bypass).
-- =========================================================================

create or replace function handle_deceased_placement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.placement_type = 'Deceased' then
    perform set_config('app.deceased_lock_bypass', 'on', true);

    update vet_appointments
    set status = 'cancelled'
    where resident_id = new.resident_id
      and status = 'scheduled'
      and appointment_date > new.start_date;

    update prescriptions
    set end_date = greatest(new.start_date::date, start_date)
    where resident_id = new.resident_id
      and (end_date is null or end_date > new.start_date::date);

    update residents
    set ready_for_adoption = false
    where id = new.resident_id;

    perform set_config('app.deceased_lock_bypass', 'off', true);

    -- PDF generation (Section 8.5) and the Drive folder archive move
    -- (Section 5.1) are triggered from the application layer after this
    -- insert commits, not from this trigger — they call external services
    -- (Drive API, PDF renderer) that don't belong in a DB transaction.
    -- record_deceased_archive() (0026) stores what they produce.
  end if;

  return new;
end;
$$;

-- =========================================================================
-- 6. Daily medication requirement
--
-- One row per medication with at least one prescription that is current
-- today (started, not yet ended) for a resident who is neither deceased nor
-- adopted — the same exclusion immunization_compliance applies. Computed at
-- query time (Section 3.2), so ending a prescription, recording a death or
-- correcting a frequency's doses_per_day is reflected immediately.
-- `daily_quantity` is in the medication's dose_unit; prescriptions with no
-- dose, or on an "as needed" frequency, count toward `prescription_count`
-- but not the quantity. RLS on the underlying tables applies (security
-- invoker), so staff/vet/volunteer all see the same figures.
-- =========================================================================

create or replace view medication_daily_requirement as
select
  m.id as medication_id,
  m.name as medication_name,
  m.dose_unit,
  count(p.id) as prescription_count,
  count(distinct p.resident_id) as resident_count,
  sum(p.dose_quantity * f.doses_per_day) as daily_quantity
from medication m
join prescriptions p on p.medication_id = m.id
join resident_current_state s on s.resident_id = p.resident_id
left join frequency f on f.id = p.frequency_id
where p.start_date <= current_date
  and (p.end_date is null or p.end_date >= current_date)
  and s.current_status not in ('Deceased', 'Adopted')
group by m.id, m.name, m.dose_unit;

-- consumer: none
--
-- Schema half of "PRESCRIPTIONS BECOME A RECURRING SCHEDULE" (docs/decisions/2026-10-30-prescription-schedule-schema.md).
-- Lutan, 2026-10-30: a prescription is a recurring task with complete control over which days of the
-- week / month a dose is given, and a time of day (Morning, Lunch, Evening, Night).
--
-- ADDITIVE. Nothing here changes what prescription_doses_between() or medication_forecast() read:
-- they still read frequency_id and give today's answers. Nothing reads the new columns yet.
--
--   prescriptions.schedule_unit        day | week | month; null = as needed (no schedule)
--   prescriptions.schedule_every       every N units (>= 1)
--   prescriptions.schedule_weekdays    unit = week: ISO weekdays 1 (Mon) .. 7 (Sun); null = the start date's weekday
--   prescriptions.schedule_month_days  unit = month: days 1 .. 31; null = the start date's day. A day the month
--                                      does not have means that month's last day (Lutan, 2026-10-30; as today).
--   rounds: night                      about 10 pm, medication only
--
-- Start and end dates already exist on the row. The day pattern is back-filled mechanically from the
-- frequency (exact, not a guess). The DOSE COUNT versus TICKS back-fill is deliberately NOT done:
-- scripts/check-prescription-schedule-backfill.mjs lists those for a person to fix.
--
-- Written to be safely re-runnable. To undo: drop the constraints and columns, delete the night round.

-- 1. The Night round (a lookup row, not an enum: one insert, no second file) -----------------------
insert into rounds (key, name, name_th, sort_order, for_medication, for_food) values
  ('night', 'Night', 'กลางคืน', 4, true, false)
on conflict (key) do nothing;

-- 2. The day pattern --------------------------------------------------------------------------------
alter table prescriptions
  add column if not exists schedule_unit text,
  add column if not exists schedule_every integer,
  add column if not exists schedule_weekdays smallint[],
  add column if not exists schedule_month_days smallint[];

alter table prescriptions drop constraint if exists prescriptions_schedule_shape;
alter table prescriptions add constraint prescriptions_schedule_shape check (
  (schedule_unit is null
     and schedule_every is null and schedule_weekdays is null and schedule_month_days is null)
  or (schedule_unit is not null and schedule_unit in ('day', 'week', 'month')
     and schedule_every is not null and schedule_every >= 1
     and (schedule_weekdays is null
          or (schedule_unit = 'week' and cardinality(schedule_weekdays) >= 1
              and schedule_weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]))
     and (schedule_month_days is null
          or (schedule_unit = 'month' and cardinality(schedule_month_days) >= 1
              and schedule_month_days <@ array[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31]::smallint[]))
  )
);

comment on column prescriptions.schedule_unit is
  'Recurring schedule (0283): day, week or month; null = as needed. Not yet read by the forecast (still frequency_id).';
comment on column prescriptions.schedule_every is
  'Every N schedule_units. 2 + week = every other week.';
comment on column prescriptions.schedule_weekdays is
  'unit = week: ISO weekdays 1 (Mon) to 7 (Sun) the dose is given on. Null = the start date''s weekday. Twice weekly = {1,4}.';
comment on column prescriptions.schedule_month_days is
  'unit = month: days of the month 1 to 31. Null = the start date''s day. A day the month lacks moves to the last day of that month.';

-- Back-fill the day pattern from the frequency: exact, and only where nothing is set yet.
-- A copy is not an edit: the updated_at stamp, the audit trail and the deceased lock are switched off for this one
-- statement (and back on straight after, in the same transaction) so no prescription reads as
-- "changed today" and the audit log is not flooded with a row per prescription.
alter table prescriptions disable trigger prescriptions_touch_updated_at;
alter table prescriptions disable trigger audit_prescriptions;
alter table prescriptions disable trigger prescriptions_deceased_lock; -- a deceased resident's prescription still gets its pattern

update prescriptions p
   set schedule_unit = case when f.doses_per_day is not null then 'day' else f.interval_unit end,
       schedule_every = case when f.doses_per_day is not null then 1 else f.interval_count end
  from frequency f
 where f.id = p.frequency_id
   and p.schedule_unit is null
   and (f.doses_per_day is not null or f.interval_count is not null);

alter table prescriptions enable trigger prescriptions_touch_updated_at;
alter table prescriptions enable trigger audit_prescriptions;
alter table prescriptions enable trigger prescriptions_deceased_lock;

notify pgrst, 'reload schema';

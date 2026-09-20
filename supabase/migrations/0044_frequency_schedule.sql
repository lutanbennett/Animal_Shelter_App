-- Frequencies as schedules, and a start-date forecast (2026-09-21).
--
-- 0027 modelled a frequency as `doses_per_day`, a number a forecast could
-- multiply by. That is fine for "twice daily" but wrong for anything less
-- than daily: "Weekly" became 0.143 doses a day, and multiplying gave
-- 0.143 of a tablet a day — a figure that can't be dispensed and that
-- never says *which* day the tablet is due. A weekly or monthly tablet is
-- a schedule, not a rate: the first dose is on the prescription's start
-- date and the next is one interval later.
--
-- So a frequency is now one of three kinds:
--
--   per day    doses_per_day   integer ≥ 1 (Twice daily = 2, Every 8 hours = 3)
--   interval   interval_count  integer ≥ 1 + interval_unit day | week | month
--              (Every other day = 2 day, Weekly = 1 week, Monthly = 1 month)
--   as needed  all three null — can't be forecast
--
-- Month intervals are calendar months from the start date (the 31st
-- clamps to the end of a short month, as Postgres date arithmetic does),
-- which is what "monthly" means for a heartworm tablet.
--
-- medication_daily_requirement (0027) is replaced by medication_forecast
-- (p_from, p_to): for every prescription that is current for a living,
-- non-adopted resident and overlaps the window, count the doses that fall
-- inside it — doses_per_day × days for the per-day kind, the dose dates
-- start_date + k × interval for the interval kind — and total the quantity
-- per medication. Whole doses, whole tablets.
--
-- Re-runnable: every statement is guarded or `or replace`.

-- 1. Schedule columns ---------------------------------------------------

alter table frequency
  add column if not exists interval_count integer,
  add column if not exists interval_unit text;

alter table frequency drop constraint if exists frequency_interval_unit_check;
alter table frequency add constraint frequency_interval_unit_check
  check (interval_unit is null or interval_unit in ('day', 'week', 'month'));

alter table frequency drop constraint if exists frequency_interval_count_positive;
alter table frequency add constraint frequency_interval_count_positive
  check (interval_count is null or interval_count > 0);

-- 2. Convert the fractional rates 0027 seeded (or anyone added inline) ----
--
-- Anything under one dose a day is an interval: 0.5 → every 2 days,
-- 0.143 → weekly, 0.071 → every 2 weeks, 0.033 → monthly, otherwise the
-- nearest whole number of days. Done before the type change so the
-- fractions are still there to read.

update frequency
set interval_count = case
      when doses_per_day between 0.13 and 0.15 then 1
      when doses_per_day between 0.065 and 0.08 then 2
      when doses_per_day between 0.03 and 0.036 then 1
      else greatest(1, round(1 / doses_per_day))::integer
    end,
    interval_unit = case
      when doses_per_day between 0.13 and 0.15 then 'week'
      when doses_per_day between 0.065 and 0.08 then 'week'
      when doses_per_day between 0.03 and 0.036 then 'month'
      else 'day'
    end,
    doses_per_day = null
where doses_per_day is not null
  and doses_per_day < 1
  and interval_count is null;

-- 3. doses_per_day is a whole number now --------------------------------

-- The 0027 view reads the column, so it has to go first; its replacement
-- is medication_forecast() below.
drop view if exists medication_daily_requirement;

alter table frequency drop constraint if exists frequency_doses_per_day_positive;
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'frequency'
      and column_name = 'doses_per_day' and data_type <> 'integer'
  ) then
    alter table frequency
      alter column doses_per_day type integer using round(doses_per_day)::integer;
  end if;
end;
$$;
alter table frequency add constraint frequency_doses_per_day_positive
  check (doses_per_day is null or doses_per_day > 0);

-- Exactly one kind, or none (as needed).
alter table frequency drop constraint if exists frequency_one_schedule_kind;
alter table frequency add constraint frequency_one_schedule_kind
  check (
    (doses_per_day is not null and interval_count is null and interval_unit is null)
    or (doses_per_day is null and interval_count is not null and interval_unit is not null)
    or (doses_per_day is null and interval_count is null and interval_unit is null)
  );

comment on column frequency.doses_per_day is
  'Per-day kind: how many doses a day, a whole number (twice daily = 2). Null for the interval kind and for "as needed".';
comment on column frequency.interval_count is
  'Interval kind: one dose every interval_count interval_units, the first on the prescription start date (weekly = 1 week, every other day = 2 day). Null for the per-day kind and "as needed".';
comment on column frequency.interval_unit is
  'day, week or month — see interval_count. Month intervals are calendar months from the start date.';

-- The two schedules the shelter actually asked for and 0027 didn't seed.
insert into frequency (label, interval_count, interval_unit) values
  ('Every 2 weeks', 2, 'week'),
  ('Monthly', 1, 'month')
on conflict (label) do nothing;

-- 4. Forecast --------------------------------------------------------------

-- Doses of one prescription that fall on or between two dates, from its
-- own start date. Per day: doses_per_day for each day of the overlap.
-- Interval: k = 0, 1, 2, … while start_date + k × interval ≤ the window
-- end, counting those on or after the window start. As needed: 0.
create or replace function prescription_doses_between(
  p_prescription prescriptions,
  p_from date,
  p_to date
)
returns integer
language sql
stable
set search_path = public
as $$
  with f as (
    select doses_per_day, interval_count, interval_unit
    from frequency where id = p_prescription.frequency_id
  ),
  bounds as (
    select
      greatest(p_prescription.start_date, p_from) as from_date,
      least(coalesce(p_prescription.end_date, p_to), p_to) as to_date
  )
  select coalesce((
    select case
      when b.to_date < b.from_date then 0
      when f.doses_per_day is not null then
        (b.to_date - b.from_date + 1) * f.doses_per_day
      when f.interval_count is not null then (
        select count(*)::integer
        from generate_series(
          0,
          -- upper bound on k: enough steps to pass to_date for any unit
          greatest(0, (b.to_date - p_prescription.start_date) / f.interval_count)
        ) as k
        where (p_prescription.start_date
                 + (k * f.interval_count) * case f.interval_unit
                     when 'day' then interval '1 day'
                     when 'week' then interval '1 week'
                     when 'month' then interval '1 month'
                   end)::date between b.from_date and b.to_date
      )
      else 0
    end
    from bounds b left join f on true
  ), 0);
$$;

-- What each medication needs over a window, across every prescription
-- that overlaps it for a living, non-adopted resident. quantity is in the
-- medication's dose_unit. Prescriptions with no forecastable frequency
-- ("as needed", or none) are counted in prescription_count but add no
-- doses. SECURITY INVOKER: the caller's own read access applies.
create or replace function medication_forecast(p_from date, p_to date)
returns table (
  medication_id uuid,
  medication_name text,
  dose_unit text,
  prescription_count bigint,
  resident_count bigint,
  dose_count bigint,
  quantity numeric
)
language sql
stable
set search_path = public
as $$
  select
    m.id,
    m.name,
    m.dose_unit,
    count(p.id),
    count(distinct p.resident_id),
    coalesce(sum(d.doses), 0),
    coalesce(sum(d.doses * p.dose_quantity), 0)
  from medication m
  join prescriptions p on p.medication_id = m.id
  join resident_current_state s on s.resident_id = p.resident_id
  cross join lateral (
    select prescription_doses_between(p, p_from, p_to) as doses
  ) d
  where p.start_date <= p_to
    and (p.end_date is null or p.end_date >= p_from)
    and s.current_status not in ('Deceased', 'Adopted')
  group by m.id, m.name, m.dose_unit;
$$;

notify pgrst, 'reload schema';

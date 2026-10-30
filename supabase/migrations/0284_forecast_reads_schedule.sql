-- consumer: src/lib/management/stock-usage.ts, src/lib/medication-list/due.ts, src/app/management/medications/page.tsx, src/app/management/purchasing/page.tsx, src/app/management/stock-usage/page.tsx
--
-- Stream 2 of 4 for "PRESCRIPTIONS BECOME A RECURRING SCHEDULE" (docs/decisions/2026-10-30-prescription-forecast-function.md).
-- prescription_doses_between() and medication_forecast() stop reading frequency_id and read the schedule columns
-- 0283 added plus the ticked rounds:
--
--   scheduled days  = the days in the window the recurring pattern lands on
--                     (day: every N days from the start date; week: the chosen ISO weekdays every N weeks, the
--                      week counted Monday to Sunday from the start date's week; month: the chosen days of the
--                      month every N months, a day the month lacks moving to the month's LAST day, Lutan 2026-10-30)
--   doses           = scheduled days x ticked rounds   (the ticks ARE the dose count; four at most)
--   quantity        = scheduled days x the sum of each ticked round's amount (a round with no amount takes the
--                     prescription's single dose_quantity, as 0234 does)
--
-- A prescription with no schedule_unit is as needed and adds nothing, as before. A dose written only in the notes
-- is not in the forecast, by design. Start and end dates bound the window exactly as before.
--
-- stock_medication_forecast() (0143) is a security-definer copy of medication_forecast() for a login that cannot
-- read the filtered view; its header says a change to the arithmetic must be made in both, so it is rewritten here.
-- No grant, policy or role is touched: both stay security-invoker / the same definer as they were.
--
-- frequency_id is still on the row and still maintained; the last stream drops it. Re-runnable (create or replace).

-- 1. The days of the window the schedule lands on --------------------------------------------------------
create or replace function prescription_dose_days_between(
  p_prescription prescriptions,
  p_from date,
  p_to date
)
returns integer
language sql
stable
set search_path = public
as $$
  with b as (
    select greatest(p_prescription.start_date, p_from) as f,
           least(coalesce(p_prescription.end_date, p_to), p_to) as t
  )
  select coalesce((
    select case
      when p_prescription.schedule_unit is null or b.t < b.f then 0

      -- every N days counted from the start date
      when p_prescription.schedule_unit = 'day' then (
        select count(*)::integer
        from generate_series(0, b.t - b.f) as k
        where ((b.f + k) - p_prescription.start_date) % p_prescription.schedule_every = 0
      )

      -- the chosen weekdays (default: the start date's) in every Nth week; weeks run Monday to Sunday
      when p_prescription.schedule_unit = 'week' then (
        select count(*)::integer
        from generate_series(0, b.t - b.f) as k,
        lateral (select b.f + k as d) x
        where extract(isodow from x.d)::integer = any (
                coalesce(p_prescription.schedule_weekdays::integer[],
                         array[extract(isodow from p_prescription.start_date)::integer]))
          and (((x.d - (extract(isodow from x.d)::integer - 1))
                - (p_prescription.start_date - (extract(isodow from p_prescription.start_date)::integer - 1))) / 7)
              % p_prescription.schedule_every = 0
      )

      -- the chosen days (default: the start date's) in every Nth month; a day the month lacks is its last day
      when p_prescription.schedule_unit = 'month' then (
        select count(distinct y.d)::integer
        from generate_series(
               0,
               (extract(year from b.t)::integer * 12 + extract(month from b.t)::integer)
                 - (extract(year from b.f)::integer * 12 + extract(month from b.f)::integer)
             ) as k,
        lateral (select (date_trunc('month', b.f)::date + (k * interval '1 month'))::date as ms) m,
        unnest(coalesce(p_prescription.schedule_month_days::integer[],
                        array[extract(day from p_prescription.start_date)::integer])) as md(day),
        lateral (
          select m.ms + (least(md.day, extract(day from (m.ms + interval '1 month - 1 day'))::integer) - 1) as d
        ) y
        where y.d between b.f and b.t
          and ((extract(year from m.ms)::integer * 12 + extract(month from m.ms)::integer)
               - (extract(year from p_prescription.start_date)::integer * 12
                  + extract(month from p_prescription.start_date)::integer))
              % p_prescription.schedule_every = 0
      )
      else 0
    end
    from b
  ), 0);
$$;

-- 2. Doses and quantity ----------------------------------------------------------------------------------
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
  select prescription_dose_days_between(p_prescription, p_from, p_to)
         * (select count(*)::integer from prescription_rounds pr where pr.prescription_id = p_prescription.id);
$$;

-- Null when the prescription states no amount anywhere (as sum(doses * null) was), so the forecast sums it as nothing.
create or replace function prescription_quantity_between(
  p_prescription prescriptions,
  p_from date,
  p_to date
)
returns numeric
language sql
stable
set search_path = public
as $$
  select prescription_dose_days_between(p_prescription, p_from, p_to)
         * (select sum(coalesce(pr.dose_quantity, p_prescription.dose_quantity))
              from prescription_rounds pr where pr.prescription_id = p_prescription.id);
$$;

-- 3. The forecast (0124's body with the archived filter kept) ----------------------------------------------
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
    coalesce(sum(d.qty), 0)
  from medication m
  join prescriptions p on p.medication_id = m.id
  join resident_current_state s on s.resident_id = p.resident_id
  cross join lateral (
    select prescription_doses_between(p, p_from, p_to) as doses,
           prescription_quantity_between(p, p_from, p_to) as qty
  ) d
  where p.archived_at is null  -- 0124: an archived prescription is a deleted one
    and p.start_date <= p_to
    and (p.end_date is null or p.end_date >= p_from)
    and s.current_status not in ('Deceased', 'Adopted')
  group by m.id, m.name, m.dose_unit;
$$;

-- 4. The security-definer copy (0143), same arithmetic -----------------------------------------------------
create or replace function stock_medication_forecast(p_from date, p_to date)
returns table (medication_id uuid, medication_name text, dose_unit text, prescription_count bigint,
               resident_count bigint, dose_count bigint, quantity numeric)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
begin
  if not has_permission('stock.purchasing') then
    raise exception 'Not authorized to read the purchasing forecast.' using errcode = 'insufficient_privilege';
  end if;
  return query
  select
    m.id,
    m.name,
    m.dose_unit,
    count(p.id),
    count(distinct p.resident_id),
    coalesce(sum(d.doses), 0),
    coalesce(sum(d.qty), 0)
  from medication m
  join prescriptions p on p.medication_id = m.id
  join private.resident_current_state s on s.resident_id = p.resident_id
  cross join lateral (
    select prescription_doses_between(p, p_from, p_to) as doses,
           prescription_quantity_between(p, p_from, p_to) as qty
  ) d
  where p.archived_at is null  -- 0124: an archived prescription is a deleted one
    and p.start_date <= p_to
    and (p.end_date is null or p.end_date >= p_from)
    and s.current_status not in ('Deceased', 'Adopted')
  group by m.id, m.name, m.dose_unit;
end;
$$;

revoke all on function prescription_dose_days_between(prescriptions, date, date),
                       prescription_quantity_between(prescriptions, date, date) from public, anon;
grant execute on function prescription_dose_days_between(prescriptions, date, date),
                          prescription_quantity_between(prescriptions, date, date) to authenticated, service_role;

notify pgrst, 'reload schema';

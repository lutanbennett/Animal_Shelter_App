-- consumer: src/lib/management/cashflow.ts, src/app/management/cashflow/page.tsx, src/app/management/diets/page.tsx, src/app/management/purchasing/page.tsx, src/lib/management/stock-usage.ts
--
-- Pack sizes, part (d): the forecasts price at the real delivery cost.
-- diet_forecast (0051) and cashflow_forecast (0183) priced at cost_per_unit while Diet stock and
-- Medication already show item_latest_delivery_cost (0199: latest delivery with cost > 0, cost
-- divided by its base-unit quantity) over the typed price, so one diet could read differently on
-- Cashflow and Diet stock. Both now use coalesce(latest priced delivery per base unit, typed price).
-- Fallback: no priced delivery -> typed cost_per_unit exactly as before, so nothing moves.
-- The Cashflow medication line gets the same rule, since it is the same decision.
-- stock_receipts.quantity is already in base units (0118), so no pack size enters the division.
-- Re-runnable: create or replace; signatures and return shapes unchanged.

create or replace function diet_forecast(p_from date, p_to date)
returns table (
  diet_type_id uuid,
  diet_type_name text,
  unit text,
  diet_count bigint,
  resident_count bigint,
  quantity numeric,
  cost numeric
)
language sql
stable
set search_path = public
as $$
  select
    dt.id,
    dt.name,
    dt.unit,
    count(rd.id),
    count(distinct rd.resident_id),
    coalesce(sum(q.days * q.per_day), 0),
    coalesce(sum(q.days * q.per_day), 0) * coalesce(lc.cost_per_base_unit, dt.cost_per_unit)
  from diet_types dt
  join resident_diets rd on rd.diet_type_id = dt.id
  join residents r on r.id = rd.resident_id
  join resident_current_state s on s.resident_id = rd.resident_id
  left join item_latest_delivery_cost lc on lc.item_kind = 'diet_type' and lc.diet_type_id = dt.id
  cross join lateral (
    select
      (least(p_to, coalesce(rd.end_date, p_to)) - greatest(p_from, rd.start_date) + 1)::numeric as days,
      coalesce(
        rd.daily_quantity,
        case coalesce(r.size, 'Medium'::resident_size)
          when 'Small' then dt.daily_qty_small
          when 'Large' then dt.daily_qty_large
          else dt.daily_qty_medium
        end
      ) as per_day
  ) q
  where rd.start_date <= p_to
    and (rd.end_date is null or rd.end_date >= p_from)
    and s.current_status not in ('Deceased', 'Adopted', 'Fostered')
  group by dt.id, dt.name, dt.unit, dt.cost_per_unit, lc.cost_per_base_unit;
$$;

-- cashflow_forecast: body of 0183; only the medication line and the food comment change (0211).
CREATE OR REPLACE FUNCTION public.cashflow_forecast(p_from date, p_to date)
 RETURNS TABLE(category text, month date, amount numeric, basis text, missing_prices bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with months as (
    -- One row per calendar month the window touches, each carrying the
    -- window's slice of that month. A 30-day window starting mid-month
    -- gives two rows, each covering only the days actually asked for, so
    -- the columns add up to the window total rather than to two whole
    -- months.
    select
      m::date as month,                                   -- month starts are plain dates, no instant involved
      greatest(p_from, m::date) as win_from,
      least(p_to, (m + interval '1 month - 1 day')::date) as win_to
    from generate_series(
      date_trunc('month', p_from::timestamp),
      date_trunc('month', p_to::timestamp),
      interval '1 month'
    ) as m
  ),

  -- FOOD — diet_forecast returns baht per diet type, priced (0211) at the latest priced
  -- delivery, else diet_types.cost_per_unit.
  --
  -- That column is `not null default 0` and the Management → Diets form
  -- says "Leave 0 until you have a price", so for food a zero price *is*
  -- the unpriced state. A diet residents are actually eating with a cost
  -- of 0 therefore counts as a missing price rather than as free food.
  food as (
    select
      mo.month,
      coalesce(sum(f.cost), 0) as amount,
      count(*) filter (
        where f.diet_type_id is not null
          and coalesce(f.quantity, 0) > 0
          and coalesce(f.cost, 0) = 0
      ) as missing
    from months mo
    left join lateral diet_forecast(mo.win_from, mo.win_to) f on true
    group by mo.month
  ),

  -- MEDICATION — medication_forecast (0044) returns quantity in dose_unit;
  -- 0071's medication.cost_per_unit is priced per dose_unit precisely so it
  -- multiplies straight through without this needing to know pack sizes.
  medication_costs as (
    select
      mo.month,
      coalesce(sum(mf.quantity * coalesce(lc.cost_per_base_unit, m.cost_per_unit)), 0) as amount,
      count(*) filter (
        where mf.medication_id is not null
          and coalesce(mf.quantity, 0) > 0
          and coalesce(lc.cost_per_base_unit, m.cost_per_unit) is null
      ) as missing
    from months mo
    left join lateral medication_forecast(mo.win_from, mo.win_to) mf on true
    left join medication m on m.id = mf.medication_id
    left join item_latest_delivery_cost lc on lc.item_kind = 'medication' and lc.medication_id = mf.medication_id
    group by mo.month
  ),

  -- IMMUNIZATION — every dose falling due in the window times 0071's per-dose cost.
  -- immunization_due_dates (above) steps interval_months forward from the last dose, so a
  -- window longer than the interval counts the second and third dose too (0183; before it
  -- only the next one was counted). A resident who never had the vaccine is not forecast.
  immunization as (
    select
      mo.month,
      coalesce(sum(it.cost), 0) as amount,
      count(*) filter (
        where d.immunization_type_id is not null and it.cost is null
      ) as missing
    from months mo
    left join immunization_due_dates(mo.win_from, mo.win_to) d on true
    left join immunization_types it on it.id = d.immunization_type_id
    group by mo.month
  ),

  -- CLINIC — clinic visits already booked, at the flat typical-visit estimate held
  -- in site_content (0071), except where the invoice has already arrived
  -- and clinic_visits.cost holds the real figure.
  --
  -- `visits` and `invoiced` are carried out of here only to decide `basis`:
  -- a month where every booked visit is already invoiced reports `actual`,
  -- anything else `estimated`. Mixed months read `estimated` on purpose —
  -- the weaker of the two is the honest label for a total.
  clinic_estimate as (
    select clinic_visit_estimate from site_content where id limit 1
  ),
  clinic as (
    select
      mo.month,
      -- The `filter` is load-bearing. months is LEFT JOINed to
      -- clinic_visits so a month with nothing booked still produces a
      -- row, and in that row va.* is all null — at which point
      -- coalesce(va.cost, estimate) happily returns the estimate and the
      -- month is charged for a visit that does not exist. Counting only
      -- rows that matched an appointment is what makes an empty month
      -- cost zero. (Found 2026-09-23: every month past the two booked
      -- visits was reading ฿800.)
      coalesce(
        sum(coalesce(va.cost, e.clinic_visit_estimate)) filter (where va.id is not null),
        0
      ) as amount,
      count(*) filter (
        where va.id is not null and va.cost is null and e.clinic_visit_estimate is null
      ) as missing,
      count(*) filter (where va.id is not null) as visits,
      count(*) filter (where va.id is not null and va.cost is not null) as invoiced
    from months mo
    cross join clinic_estimate e
    left join clinic_visits va
      on va.status = 'scheduled'
     -- 0124: an archived visit is a deleted one, so it costs nothing.
     and va.archived_at is null
     -- 0183: the shelter's calendar day, not the UTC date.
     and shelter_date(va.appointment_date) between mo.win_from and mo.win_to
    group by mo.month
  ),

  -- MAINTENANCE — the only figure that was already money. Open jobs with a
  -- due date in the window, at estimated_cost; actual_cost is what a
  -- finished job turned out to cost and is history, not forecast. A job
  -- with no due date is not forecast at all, because it has no month to
  -- sit in.
  --
  -- "Open" is everything but 'Completed' — Blocked included, because a
  -- blocked job is still money the shelter expects to spend. Note the
  -- status is 'Completed', not 'Done': 0033 renamed both that value and
  -- 'To Do' after 0001 created them (see src/lib/maintenance/status.ts).
  maint as (
    select
      mo.month,
      coalesce(sum(j.estimated_cost), 0) as amount,
      count(*) filter (where j.id is not null and j.estimated_cost is null) as missing
    from months mo
    left join maintenance j
      on j.status <> 'Completed'
     and j.due_date between mo.win_from and mo.win_to
    group by mo.month
  )

  select 'food'::text, month, amount, 'priced'::text, missing from food
  union all
  select 'medication', month, amount, 'priced', missing from medication_costs
  union all
  select 'immunization', month, amount, 'priced', missing from immunization
  union all
  select
    'clinic',
    month,
    amount,
    case when visits > 0 and invoiced = visits then 'actual' else 'estimated' end,
    missing
  from clinic
  union all
  select 'maintenance', month, amount, 'estimated', missing from maint
  order by 2, 1;
$function$;

notify pgrst, 'reload schema';

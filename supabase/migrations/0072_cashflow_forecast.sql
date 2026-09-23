-- Cashflow forecast, part 2 of 2: the function the page reads (backlog,
-- Management: "Cashflow forecast: what the shelter is about to spend, in
-- one place"). 0071 added the missing prices; this adds the one query that
-- puts every outgoing the database knows about into the same unit — baht —
-- bucketed by month and category.
--
-- The rule this file is built around: **it reuses the existing forecasts
-- rather than reimplementing them.** Food comes out of diet_forecast
-- (0051) and medication out of medication_forecast (0044), called once per
-- month with that month's slice of the window. Those two already know
-- about prescription dose schedules, per-resident diet overrides, size
-- defaults and which residents still count — none of which is restated
-- here. When they change, this changes with them.
--
-- Returns one row per category per month, always, including months where
-- nothing is forecast, so the page can draw a complete grid without
-- filling gaps client-side.
--
--   category       food | medication | immunization | vet | maintenance
--   month          first day of the month
--   amount         baht, and only what could actually be priced
--   basis          priced | estimated | actual (see below)
--   missing_prices how many items in that month the shelter owns but
--                  cannot price yet
--
-- `amount` and `missing_prices` are deliberately two separate numbers. An
-- unpriced item contributes nothing to `amount` and one to
-- `missing_prices`, so the page can say "not priced yet" instead of
-- printing a zero — a silent zero in a cashflow forecast is worse than a
-- visible hole, which is the whole reason 0071's columns are nullable. A
-- month with amount 0 and missing_prices 0 is a real, honest zero: nothing
-- is booked.
--
-- `basis` says where the money came from, because the three are not
-- equally trustworthy and the page labels them:
--   priced    — a price the shelter entered, times a quantity the records
--               imply (food, medication, immunization).
--   estimated — a stand-in figure: maintenance's estimated_cost, or the
--               flat typical-vet-visit figure from site_content.
--   actual    — a real invoiced figure. Only vet can reach this, and only
--               when every visit counted in that month already carries a
--               vet_appointments.cost.
--
-- Security invoker and `stable`, like diet_forecast and medication_forecast:
-- RLS applies as the signed-in user, and the page guards the route with
-- requireManagementUser() on top of that.
--
-- Re-runnable: dropped first because `create or replace` cannot change an
-- existing function's return type, then recreated.

-- ==========================================================================
-- MONTH BOUNDARIES — the known time-zone bug, deliberately not fixed here
-- ==========================================================================
-- Every date_trunc and ::date below is evaluated in the server's time zone,
-- which is UTC on Supabase and on Cloudflare Workers. A vet appointment at
-- 06:00 Thai time on the 1st is 23:00 UTC on the previous day and lands in
-- the previous month's column. This is exactly the problem already logged
-- as **backlog → Dashboard follow-ups (e)** ("Time zone — month boundaries
-- for timestamp columns are computed in the server's time zone... Decide on
-- a shelter time zone constant and use it here and in the vet hub"), and it
-- is left alone on purpose: the fix is one shelter-wide constant applied to
-- every call site at once, not five more places each rolling their own.
-- When that constant lands, the casts marked "tz: see Dashboard follow-ups
-- (e)" below are what it replaces.
--
-- Only `vet` is genuinely exposed: maintenance.due_date and the dates
-- behind the diet and medication forecasts are all `date` columns with no
-- time of day to get wrong.

drop function if exists cashflow_forecast(date, date);

create function cashflow_forecast(p_from date, p_to date)
returns table (
  category text,
  month date,
  amount numeric,
  basis text,
  missing_prices bigint
)
language sql
stable
set search_path = public
as $$
  with months as (
    -- One row per calendar month the window touches, each carrying the
    -- window's slice of that month. A 30-day window starting mid-month
    -- gives two rows, each covering only the days actually asked for, so
    -- the columns add up to the window total rather than to two whole
    -- months.
    select
      m::date as month,                                   -- tz: see Dashboard follow-ups (e)
      greatest(p_from, m::date) as win_from,
      least(p_to, (m + interval '1 month - 1 day')::date) as win_to
    from generate_series(
      date_trunc('month', p_from::timestamp),
      date_trunc('month', p_to::timestamp),
      interval '1 month'
    ) as m
  ),

  -- FOOD — diet_forecast (0051) already returns baht per diet type,
  -- because diet_types.cost_per_unit has been there since that migration.
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
      coalesce(sum(mf.quantity * m.cost_per_unit), 0) as amount,
      count(*) filter (
        where mf.medication_id is not null
          and coalesce(mf.quantity, 0) > 0
          and m.cost_per_unit is null
      ) as missing
    from months mo
    left join lateral medication_forecast(mo.win_from, mo.win_to) mf on true
    left join medication m on m.id = mf.medication_id
    group by mo.month
  ),

  -- IMMUNIZATION — the doses falling due in the window, from the
  -- immunization_next_due view (0007), times 0071's per-dose cost.
  --
  -- The view gives the next due date per (resident, type) from the last
  -- dose administered and interval_months. Two consequences worth knowing
  -- rather than working around: a resident who has never had a given
  -- vaccine has no row and so is not forecast, and a window longer than an
  -- interval still counts each pairing once, because the dose after next
  -- depends on when the next one is actually given. Both understate rather
  -- than overstate, which is the safe direction for an outgoing.
  --
  -- Residents who have left are excluded the way medication_forecast does
  -- it (Deceased, Adopted) rather than the way diet_forecast does it (also
  -- Fostered): a fostered animal is still the shelter's animal and its
  -- vaccinations are still the shelter's bill, whereas it eats the foster
  -- carer's food.
  immunization as (
    select
      mo.month,
      coalesce(sum(it.cost), 0) as amount,
      count(*) filter (
        where nd.immunization_type_id is not null and it.cost is null
      ) as missing
    from months mo
    left join immunization_next_due nd
      on nd.next_due_date between mo.win_from and mo.win_to
     and exists (
       select 1 from resident_current_state s
       where s.resident_id = nd.resident_id
         and s.current_status not in ('Deceased', 'Adopted')
     )
    left join immunization_types it on it.id = nd.immunization_type_id
    group by mo.month
  ),

  -- VET — visits already booked, at the flat typical-visit estimate held
  -- in site_content (0071), except where the invoice has already arrived
  -- and vet_appointments.cost holds the real figure.
  --
  -- `visits` and `invoiced` are carried out of here only to decide `basis`:
  -- a month where every booked visit is already invoiced reports `actual`,
  -- anything else `estimated`. Mixed months read `estimated` on purpose —
  -- the weaker of the two is the honest label for a total.
  vet_estimate as (
    select vet_visit_estimate from site_content where id limit 1
  ),
  vet as (
    select
      mo.month,
      coalesce(sum(coalesce(va.cost, e.vet_visit_estimate)), 0) as amount,
      count(*) filter (
        where va.id is not null and va.cost is null and e.vet_visit_estimate is null
      ) as missing,
      count(*) filter (where va.id is not null) as visits,
      count(*) filter (where va.id is not null and va.cost is not null) as invoiced
    from months mo
    cross join vet_estimate e
    left join vet_appointments va
      on va.status = 'scheduled'
     -- tz: see Dashboard follow-ups (e)
     and va.appointment_date::date between mo.win_from and mo.win_to
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
    'vet',
    month,
    amount,
    case when visits > 0 and invoiced = visits then 'actual' else 'estimated' end,
    missing
  from vet
  union all
  select 'maintenance', month, amount, 'estimated', missing from maint
  order by 2, 1;
$$;

comment on function cashflow_forecast(date, date) is
  'Forecast outgoings in baht, one row per category per month across the window. Reuses diet_forecast (0051) and medication_forecast (0044) rather than restating them. amount counts only what could be priced; missing_prices counts what could not, so the page shows a gap instead of a zero. Month boundaries are UTC — see backlog Dashboard follow-ups (e).';

notify pgrst, 'reload schema';

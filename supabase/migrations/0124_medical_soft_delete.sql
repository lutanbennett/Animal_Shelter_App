-- Soft delete for medical records (backlog DB-6, the half 0121 left).
--
-- Weight readings, prescriptions, vet visits and immunization records can be
-- hard-deleted today, and 0121's audit log is the only way back. This adds
-- the same archive columns contacts got in 0075 so the app can archive
-- instead of delete:
--
--   archived_at     set = archived. NULL = live, which every existing row
--                   reads as, so nothing is back-filled.
--   archived_by     the login that archived it (uuid -> auth.users, on delete
--                   set null, as 0075).
--   archive_reason  optional free text.
--
-- on weight, prescriptions, vet_appointments and immunization_records, with
-- the same three-column consistency check as contacts: who and why exist
-- only while archived, so a restore clears all three.
--
-- ATTACHMENTS ARE DELIBERATELY NOT HERE. #252's delete moves the Drive file
-- to trash, which is its own story, and an archived photo row could stay
-- public. See docs/decisions/2026-10-02-medical-soft-delete.md.
--
-- The order inside this file is the point, because the columns alone would
-- make things worse:
--
--  1. THE UNIQUE KEYS BECOME PARTIAL (archived_at is null). Without that, an
--     archived weight still holds its day and its visit, so staff who
--     "deleted" a reading could not enter its replacement, and the failure
--     would read as the archive feature being broken. weight_one_per_visit
--     and weight_one_per_day keep their names (src/lib/weight/record.ts
--     matches on them); immunization_records' unique CONSTRAINT is replaced
--     by a partial unique index, since a constraint cannot be partial.
--
--  2. THE ON CONFLICT CLAUSES AGREE WITH THEM. record_immunization,
--     record_immunizations_bulk and record_immunizations_fanout (0002, 0007)
--     name the key, and Postgres infers the arbiter index from the columns
--     AND the predicate: `on conflict (...)` alone no longer matches a
--     partial index and every insert would fail with 42P10. Each now carries
--     `where archived_at is null`. A key held only by an archived row
--     inserts a fresh live row; a live one is updated, as before.
--
--  3. EVERY READER SKIPS ARCHIVED ROWS. Found by reading the live
--     definitions of every function and view that mentions the four tables,
--     not from the backlog's list:
--       cashflow_forecast        vet visits. (Food, medication, immunization
--                                and maintenance never read these tables
--                                directly: medication goes through
--                                medication_forecast and immunization through
--                                immunization_next_due.)
--       medication_forecast      prescriptions (also feeds stock usage and
--                                the medication forecast page)
--       immunization_next_due    latest dose per resident and type, so an
--                                archived latest dose falls back to the one
--                                before it (also feeds cashflow)
--       private.immunization_compliance, private.immunization_duplicate_check
--       public_resident_profiles is_vaccinated   (PUBLIC SITE)
--       public_shelter_stats     in_treatment    (PUBLIC SITE)
--       current_vet_resident_ids, vet_owns_visit (vet scoping)
--       handle_deceased_placement  does not cancel or end archived rows
--     merge_medication / merge_frequency / merge_vet_doctors are
--     deliberately NOT changed: they re-point foreign keys and must move
--     archived rows too, or the delete that follows would fail.
--     vet_appointments_linked_rx_not_future and prescriptions_visit_not_in_
--     future are also left alone: they guard a link, and restoring an
--     archived row must not be able to break it.
--
-- RLS is NOT changed. Staff and management can already UPDATE these tables,
-- so they can archive where they could never DELETE a prescription or visit
-- (only admin and vets have a DELETE policy); the app decides who is offered
-- archive. Archived rows stay readable to the roles that could read them,
-- because the recent-changes page and undo (the remaining halves of DB-6)
-- need them; the app's readers filter, as above.
--
-- 0121's audit triggers already cover all four tables: an archive is one
-- UPDATE, so one audit row whose old_row/new_row carry the new columns.
--
-- Additive; existing rows are untouched (archived_at is null). Re-runnable.

-- 1. Columns ----------------------------------------------------------------

alter table weight               add column if not exists archived_at timestamptz;
alter table weight               add column if not exists archived_by uuid references auth.users (id) on delete set null;
alter table weight               add column if not exists archive_reason text;
alter table prescriptions        add column if not exists archived_at timestamptz;
alter table prescriptions        add column if not exists archived_by uuid references auth.users (id) on delete set null;
alter table prescriptions        add column if not exists archive_reason text;
alter table vet_appointments     add column if not exists archived_at timestamptz;
alter table vet_appointments     add column if not exists archived_by uuid references auth.users (id) on delete set null;
alter table vet_appointments     add column if not exists archive_reason text;
alter table immunization_records add column if not exists archived_at timestamptz;
alter table immunization_records add column if not exists archived_by uuid references auth.users (id) on delete set null;
alter table immunization_records add column if not exists archive_reason text;

comment on column weight.archived_at is
  'Set when the reading is archived (the app''s delete): kept, but out of charts, forecasts and counts, and no longer holding its day or visit. Clear it, with archived_by and archive_reason, to restore.';
comment on column prescriptions.archived_at is
  'Set when the prescription is archived (the app''s delete): kept, but out of the forecast, stock usage and treatment counts. Clear it, with archived_by and archive_reason, to restore.';
comment on column vet_appointments.archived_at is
  'Set when the visit is archived (the app''s delete): kept, but out of lists, the cost forecast and vet scoping. Clear it, with archived_by and archive_reason, to restore.';
comment on column immunization_records.archived_at is
  'Set when the dose is archived (the app''s delete): kept, but not counted as given, and no longer holding its (resident, type, date) key. Clear it, with archived_by and archive_reason, to restore.';
comment on column weight.archived_by is 'The login that archived the row. Null when not archived, or when that login has since been deleted.';
comment on column prescriptions.archived_by is 'The login that archived the row. Null when not archived, or when that login has since been deleted.';
comment on column vet_appointments.archived_by is 'The login that archived the row. Null when not archived, or when that login has since been deleted.';
comment on column immunization_records.archived_by is 'The login that archived the row. Null when not archived, or when that login has since been deleted.';
comment on column weight.archive_reason is 'Optional reason given when archiving. Null when not archived.';
comment on column prescriptions.archive_reason is 'Optional reason given when archiving. Null when not archived.';
comment on column vet_appointments.archive_reason is 'Optional reason given when archiving. Null when not archived.';
comment on column immunization_records.archive_reason is 'Optional reason given when archiving. Null when not archived.';

alter table weight drop constraint if exists weight_archive_fields_consistent;
alter table weight add constraint weight_archive_fields_consistent
  check (archived_at is not null or (archived_by is null and archive_reason is null));
alter table prescriptions drop constraint if exists prescriptions_archive_fields_consistent;
alter table prescriptions add constraint prescriptions_archive_fields_consistent
  check (archived_at is not null or (archived_by is null and archive_reason is null));
alter table vet_appointments drop constraint if exists vet_appointments_archive_fields_consistent;
alter table vet_appointments add constraint vet_appointments_archive_fields_consistent
  check (archived_at is not null or (archived_by is null and archive_reason is null));
alter table immunization_records drop constraint if exists immunization_records_archive_fields_consistent;
alter table immunization_records add constraint immunization_records_archive_fields_consistent
  check (archived_at is not null or (archived_by is null and archive_reason is null));

-- 2. Unique keys: live rows only ---------------------------------------------

drop index if exists weight_one_per_visit;
create unique index weight_one_per_visit
  on weight (vet_appointment_id)
  where vet_appointment_id is not null and archived_at is null;

drop index if exists weight_one_per_day;
create unique index weight_one_per_day
  on weight (resident_id, date)
  where archived_at is null;

comment on index weight_one_per_visit is
  'One live weight per vet visit (0106, partial since 0124): an archived reading does not hold the visit.';
comment on index weight_one_per_day is
  'One live weight per resident per day (0106, partial since 0124): an archived reading does not hold the day.';

alter table immunization_records
  drop constraint if exists immunization_records_resident_id_immunization_type_id_date__key;
create unique index if not exists immunization_records_one_per_type_day
  on immunization_records (resident_id, immunization_type_id, date_administered)
  where archived_at is null;

comment on index immunization_records_one_per_type_day is
  'One live dose per resident, type and day (0001 constraint, partial since 0124). The on conflict clauses in record_immunization* name this predicate.';

-- 3. on conflict follows the index -------------------------------------------

create or replace FUNCTION public.record_immunization(p_resident_id uuid, p_immunization_type_id uuid, p_date_administered date, p_administered_by text DEFAULT NULL::text, p_notes text DEFAULT NULL::text, p_batch_number text DEFAULT NULL::text)
 RETURNS immunization_records
 LANGUAGE plpgsql
AS $function$
declare
  result immunization_records;
begin
  insert into immunization_records (
    resident_id, immunization_type_id, date_administered,
    administered_by, notes, batch_number, created_by
  )
  values (
    p_resident_id, p_immunization_type_id, p_date_administered,
    p_administered_by, p_notes, p_batch_number, auth.uid()
  )
  on conflict (resident_id, immunization_type_id, date_administered)
  where archived_at is null
  do update set
    administered_by = excluded.administered_by,
    notes = excluded.notes,
    batch_number = excluded.batch_number,
    updated_at = now()
  returning * into result;

  return result;
end;
$function$;

create or replace FUNCTION public.record_immunizations_bulk(p_resident_ids uuid[], p_immunization_type_id uuid, p_date_administered date, p_administered_by text DEFAULT NULL::text, p_notes text DEFAULT NULL::text)
 RETURNS SETOF immunization_records
 LANGUAGE sql
AS $function$
  insert into immunization_records (
    resident_id, immunization_type_id, date_administered,
    administered_by, notes, created_by
  )
  select
    resident_id, p_immunization_type_id, p_date_administered,
    p_administered_by, p_notes, auth.uid()
  from unnest(p_resident_ids) as resident_id
  on conflict (resident_id, immunization_type_id, date_administered)
  where archived_at is null
  do update set
    administered_by = excluded.administered_by,
    notes = excluded.notes,
    updated_at = now()
  returning *;
$function$;

create or replace FUNCTION public.record_immunizations_fanout(p_resident_ids uuid[], p_immunization_type_ids uuid[], p_date_administered date, p_administered_by text DEFAULT NULL::text, p_notes text DEFAULT NULL::text)
 RETURNS SETOF immunization_records
 LANGUAGE sql
AS $function$
  insert into immunization_records (
    resident_id, immunization_type_id, date_administered,
    administered_by, notes, created_by
  )
  select ri.resident_id, ti.immunization_type_id, p_date_administered,
    p_administered_by, p_notes, auth.uid()
  from unnest(p_resident_ids) as ri(resident_id)
  cross join unnest(p_immunization_type_ids) as ti(immunization_type_id)
  on conflict (resident_id, immunization_type_id, date_administered)
  where archived_at is null
  do update set
    administered_by = excluded.administered_by,
    notes = excluded.notes,
    updated_at = now()
  returning *;
$function$;

-- 4. Readers skip archived rows ----------------------------------------------

create or replace FUNCTION public.cashflow_forecast(p_from date, p_to date)
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
      -- The `filter` is load-bearing. months is LEFT JOINed to
      -- vet_appointments so a month with nothing booked still produces a
      -- row, and in that row va.* is all null — at which point
      -- coalesce(va.cost, estimate) happily returns the estimate and the
      -- month is charged for a visit that does not exist. Counting only
      -- rows that matched an appointment is what makes an empty month
      -- cost zero. (Found 2026-09-23: every month past the two booked
      -- visits was reading ฿800.)
      coalesce(
        sum(coalesce(va.cost, e.vet_visit_estimate)) filter (where va.id is not null),
        0
      ) as amount,
      count(*) filter (
        where va.id is not null and va.cost is null and e.vet_visit_estimate is null
      ) as missing,
      count(*) filter (where va.id is not null) as visits,
      count(*) filter (where va.id is not null and va.cost is not null) as invoiced
    from months mo
    cross join vet_estimate e
    left join vet_appointments va
      on va.status = 'scheduled'
     -- 0124: an archived visit is a deleted one, so it costs nothing.
     and va.archived_at is null
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
$function$;

create or replace FUNCTION public.medication_forecast(p_from date, p_to date)
 RETURNS TABLE(medication_id uuid, medication_name text, dose_unit text, prescription_count bigint, resident_count bigint, dose_count bigint, quantity numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
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
  where p.archived_at is null  -- 0124: an archived prescription is a deleted one
    and p.start_date <= p_to
    and (p.end_date is null or p.end_date >= p_from)
    and s.current_status not in ('Deceased', 'Adopted')
  group by m.id, m.name, m.dose_unit;
$function$;

-- A latest dose that is archived falls back to the one before it.
create or replace view immunization_next_due
with (security_invoker = on) as
select distinct on (ir.resident_id, ir.immunization_type_id)
  ir.resident_id,
  ir.immunization_type_id,
  it.name as immunization_type_name,
  it.interval_months,
  ir.date_administered as last_administered,
  case
    when it.interval_months is not null
      then (ir.date_administered + (it.interval_months || ' months')::interval)::date
    else null
  end as next_due_date
from immunization_records ir
join immunization_types it on it.id = ir.immunization_type_id
where ir.archived_at is null
order by ir.resident_id, ir.immunization_type_id, ir.date_administered desc;

create or replace view private.immunization_compliance as
select
  r.id as resident_id,
  r.name as resident_name,
  it.id as immunization_type_id,
  it.name as immunization_type_name
from residents r
cross join immunization_types it
join private.resident_current_state s on s.resident_id = r.id
where it.is_mandatory = true
  and s.current_status not in ('Deceased', 'Adopted')
  and not exists (
    select 1 from immunization_records ir
     where ir.resident_id = r.id
       and ir.immunization_type_id = it.id
       and ir.archived_at is null
  );

create or replace view private.immunization_duplicate_check as
select resident_id, immunization_type_id, date_administered, count(*) as count
from immunization_records
where archived_at is null
group by resident_id, immunization_type_id, date_administered
having count(*) > 1;

-- Public site: "vaccinated" on a profile, and "in treatment" in the stats.
create or replace view public_resident_profiles as
select
  r.id,
  r.name,
  r.species,
  r.breed,
  r.sex,
  r.ready_for_adoption,
  r.bio,
  r.temperament_notes,
  r.past_story_notes,
  case when exists (
    select 1 from attachments a
     where a.owner_type = 'resident'
       and a.owner_id = r.id
       and a.drive_file_id = r.profile_photo_drive_file_id
       and lower(btrim(coalesce(a.sub_folder, ''))) = 'medical'
  ) then null else r.profile_photo_drive_file_id end as profile_photo_drive_file_id,
  r.estimated_age_years,
  r.intake_date,
  r.age_estimated_on,
  r.size,
  private.approved_translations('residents', r.id) as translations,
  r.good_with_dogs,
  r.good_with_cats,
  r.good_with_children,
  r.energy_level,
  r.colour,
  r.is_desexed,
  exists (
    select 1 from immunization_records i
     where i.resident_id = r.id and i.archived_at is null
  ) as is_vaccinated,
  r.hook_line,
  r.ideal_home,
  (r.microchip_number is not null) as is_microchipped
from residents r
where r.is_public_visible = true
  and coalesce(
    (select s.current_status from private.resident_current_state s where s.resident_id = r.id),
    'Resident'
  ) not in ('Deceased', 'Adopted');

create or replace view public_shelter_stats as
select
  (select count(*) from resident_current_state
     where current_status in ('Resident', 'Unassigned', 'Hospitalised', 'Fostered'))::integer as in_care,
  (select count(*) from resident_current_state
     where current_status = 'Hospitalised')::integer as in_hospital,
  (select count(*) from resident_current_state
     where current_status = 'Fostered')::integer as in_foster,
  (select count(*) from resident_current_state s
     join residents r on r.id = s.resident_id
     where r.ready_for_adoption and r.is_public_visible
       and s.current_status not in ('Deceased', 'Adopted'))::integer as ready_for_adoption,
  (select count(*) from placement_history
     where placement_type = 'Adopt'
       and start_date >= now() - interval '7 days')::integer as adopted_last_7_days,
  (select count(*) from placement_history
     where placement_type = 'Adopt'
       and shelter_date(start_date) >= make_date(extract(year from shelter_today())::integer, 1, 1)
  )::integer as adopted_this_year,
  (select count(*) from placement_history
     where placement_type = 'Intake'
       and shelter_date(start_date) >= make_date(extract(year from shelter_today())::integer, 1, 1)
  )::integer as intakes_this_year,
  (select count(*) from resident_current_state s
     where s.current_status in ('Resident', 'Unassigned', 'Hospitalised', 'Fostered')
       and (
         s.current_status = 'Hospitalised'
         or exists (
           select 1 from prescriptions p
            where p.resident_id = s.resident_id
              and p.archived_at is null
              and (p.end_date is null or p.end_date >= shelter_today())
         )
       ))::integer as in_treatment;

-- Vet scoping: an archived visit (or a prescription on one) no longer gives
-- a vet sight of the resident, exactly as if it had been deleted.
create or replace function current_vet_resident_ids()
returns setof uuid
language sql
stable
security definer
set search_path to 'public'
as $$
  select va.resident_id
    from vet_appointments va
   where va.vet_id = current_user_vet_id()
     and va.archived_at is null
  union
  select p.resident_id
    from prescriptions p
    join vet_appointments va on va.id = p.vet_appointment_id
   where va.vet_id = current_user_vet_id()
     and va.archived_at is null
     and p.archived_at is null
  union
  select pr.resident_id
    from procedures pr
    join vet_appointments va on va.id = pr.vet_appointment_id
   where va.vet_id = current_user_vet_id()
     and va.archived_at is null
  union
  select bt.resident_id
    from blood_tests bt
    join vet_appointments va on va.id = bt.vet_appointment_id
   where va.vet_id = current_user_vet_id()
     and va.archived_at is null;
$$;

create or replace FUNCTION public.vet_owns_visit(p_visit_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  select p_visit_id is null
      or exists (
        select 1 from vet_appointments va
         where va.id = p_visit_id and va.vet_id = current_user_vet_id()
           and va.archived_at is null
      );
$function$;

create or replace FUNCTION public.handle_deceased_placement()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_appointments jsonb;
  v_prescriptions jsonb;
  v_ready boolean;
begin
  if new.placement_type = 'Deceased' then
    select coalesce(jsonb_agg(id), '[]'::jsonb)
    into v_appointments
    from vet_appointments
    where resident_id = new.resident_id
      and archived_at is null
      and status = 'scheduled'
      and appointment_date > new.start_date;

    select coalesce(jsonb_agg(jsonb_build_object('id', id, 'end_date', end_date)), '[]'::jsonb)
    into v_prescriptions
    from prescriptions
    where resident_id = new.resident_id
      and archived_at is null
      and (end_date is null or end_date > shelter_date(new.start_date));

    select ready_for_adoption into v_ready
    from residents
    where id = new.resident_id;

    new.deceased_cascade := jsonb_build_object(
      'vet_appointments', v_appointments,
      'prescriptions', v_prescriptions,
      'ready_for_adoption', coalesce(v_ready, false)
    );

    update vet_appointments va
    set status = 'cancelled'
    from jsonb_array_elements_text(v_appointments) as s(id)
    where va.id = s.id::uuid;

    update prescriptions p
    set end_date = greatest(shelter_date(new.start_date), p.start_date)
    from jsonb_array_elements(v_prescriptions) as s(item)
    where p.id = (s.item ->> 'id')::uuid;

    update residents
    set ready_for_adoption = false
    where id = new.resident_id;

    -- PDF generation (Section 8.5) and the Drive folder archive move
    -- (Section 5.1) are triggered from the application layer after this
    -- insert commits, not from this trigger — they call external services
    -- (Drive API, PDF renderer) that don't belong in a DB transaction.
    -- record_deceased_archive() (0026) stores what they produce.
  end if;

  return new;
end;
$function$;

notify pgrst, 'reload schema';

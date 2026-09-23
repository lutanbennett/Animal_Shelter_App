-- "Today" in SQL is the shelter's today, not UTC's.
--
-- The database session TimeZone is UTC, so current_date — and any
-- timestamptz cast straight to ::date — is the UTC calendar day. The
-- shelter is Asia/Bangkok (UTC+7, no daylight saving), so for 00:00–07:00
-- local every day those expressions give yesterday. The application half
-- was fixed in #59 (todayIso() in src/lib/format.ts, SHELTER_TIME_ZONE);
-- this is the half todayIso() cannot reach. Found by the UTC date audit
-- (docs/utc-date-audit-2026-09-23.md §3.2–3.3).
--
-- The zone lives in one place, shelter_time_zone(), mirroring
-- SHELTER_TIME_ZONE on the TypeScript side; the two must name the same
-- zone. Every site below calls shelter_today() or shelter_date() rather
-- than repeating the literal.
--
-- Sites replaced (each keeps its signature / column list):
--
--   1. maintenance.date_created default          (0001:405)
--   2. maintenance_before_write() date_completed (0033:146)
--   3. handle_deceased_placement() — both the choice of which prescriptions
--      to close and the end date written (0049:100, 0049:118). A death at
--      01:26 Bangkok is 18:26Z the day before; ::date in UTC closed every
--      open course on the day before the animal died.
--   4. public_shelter_stats.in_treatment, adopted_this_year and
--      intakes_this_year (0065:63/66/74) — the public home page.
--   5. public_recent_adoptions.adopted_on (0061:22) — the public /adopt page.
--
-- Not touched: medication_daily_requirement (0027:233) was dropped by 0044;
-- the 0069 diet seed was a one-off that has already run; the cashflow
-- month boundaries in 0072 are backlog "Dashboard follow-ups (e)" and can
-- now use shelter_date() when that is picked up.
--
-- Existing rows are deliberately not repaired — see the audit and
-- docs/decisions.md (2026-09-24).
--
-- Re-runnable: every statement is `or replace` or guarded.

-- =========================================================================
-- 0. The shelter's calendar
-- =========================================================================

create or replace function shelter_time_zone()
returns text
language sql
immutable
parallel safe
as $$ select 'Asia/Bangkok'::text $$;

comment on function shelter_time_zone() is
  'The shelter''s IANA time zone. Must match SHELTER_TIME_ZONE in src/lib/format.ts.';

-- stable, not immutable: it reads now(), which is fixed for a transaction.
-- That is also what lets it be a column default.
create or replace function shelter_today()
returns date
language sql
stable
parallel safe
as $$ select (now() at time zone shelter_time_zone())::date $$;

comment on function shelter_today() is
  'Today at the shelter. Use instead of current_date, which is the UTC day in a UTC session. The SQL twin of todayIso().';

create or replace function shelter_date(p_at timestamptz)
returns date
language sql
stable
parallel safe
as $$ select (p_at at time zone shelter_time_zone())::date $$;

comment on function shelter_date(timestamptz) is
  'The shelter calendar day an instant falls on. Use instead of casting a timestamptz with ::date.';

-- =========================================================================
-- 1. maintenance.date_created
-- =========================================================================

alter table maintenance alter column date_created set default shelter_today();

-- =========================================================================
-- 2. maintenance.date_completed (0033, otherwise unchanged)
-- =========================================================================

create or replace function maintenance_before_write()
returns trigger
language plpgsql
as $$
begin
  if new.enclosure_id is not null then
    select zone_id into new.zone_id from enclosures where id = new.enclosure_id;
  end if;

  if new.zone_id is null then
    raise exception 'A maintenance job needs a zone or an enclosure.';
  end if;

  if new.status = 'Completed' then
    new.date_completed := coalesce(new.date_completed, shelter_today());
  else
    new.date_completed := null;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

-- =========================================================================
-- 3. The death cascade (0049, otherwise unchanged)
-- =========================================================================

create or replace function handle_deceased_placement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
      and status = 'scheduled'
      and appointment_date > new.start_date;

    select coalesce(jsonb_agg(jsonb_build_object('id', id, 'end_date', end_date)), '[]'::jsonb)
    into v_prescriptions
    from prescriptions
    where resident_id = new.resident_id
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
$$;

-- The trigger (0049) already points at this function by name; nothing to
-- recreate.

-- =========================================================================
-- 4. public_shelter_stats (0065, same column list)
-- =========================================================================
--
-- "This year" is the shelter's year: an intake at 03:00 Bangkok on 1 January
-- is this year's, not last year's. adopted_last_7_days is a span of
-- instants, not calendar days, so it is left as it was.

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
              and (p.end_date is null or p.end_date >= shelter_today())
         )
       ))::integer as in_treatment;

grant select on public_shelter_stats to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_shelter_stats
  from anon, authenticated;

-- =========================================================================
-- 5. public_recent_adoptions (0061, same column list)
-- =========================================================================

create or replace view public_recent_adoptions as
select
  p.id,
  r.name,
  r.species,
  r.profile_photo_drive_file_id,
  shelter_date(p.start_date) as adopted_on
from placement_history p
join residents r on r.id = p.resident_id
where p.placement_type = 'Adopt'
  and p.end_date is null
  and p.start_date >= now() - interval '90 days'
  and r.is_public_visible = true
  and not exists (
    select 1 from resident_current_state s
     where s.resident_id = r.id and s.current_status = 'Deceased'
  );

grant select on public_recent_adoptions to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_recent_adoptions from anon, authenticated;

notify pgrst, 'reload schema';

-- consumer: src/lib/clinics/calendar-sync.ts, src/app/clinics, src/app/clinic-visits, src/app/medical/weight/page.tsx, src/lib/medical/weigh-first.ts
--
-- Schema half of TWO features. Nothing reads either yet; the app halves (vet-calendar-build,
-- weigh-first-app) do. Additive and re-runnable. Neither object is public, so no public view changes
-- (docs/decisions/2026-10-15-calendar-and-weigh-schema.md).
--
-- 1. THE VET CALENDAR: one Google Calendar event per visit, its id kept on the visit. The backlog item's
--    last change (2026-10-15, the Director) replaced the clinic-day shape, so there is no
--    clinic_calendar_days table. Four nullable columns on clinic_visits:
--      calendar_event_id       the Google event's id; null = no event exists
--      calendar_synced_at      when the event last matched this row
--      calendar_error          the last failure's message; null when the last attempt worked
--      calendar_out_of_date_at when the row last changed in a way the event does not show yet;
--                              the Worker's sweep retries every row where this is later than
--                              calendar_synced_at (or synced_at is null)
--    The out-of-date marker is set by a trigger, so no code path can change a visit and forget it.
--
-- 2. RECORD WEIGHT'S NARROW READ: weigh_first_visits(). The Head of Medical may not read clinic_visits
--    (0134), and must not gain that. This returns three things per visit and nothing else, to a login
--    that holds medical.weight at edit (admin always does).

alter table clinic_visits add column if not exists calendar_event_id text;
alter table clinic_visits add column if not exists calendar_synced_at timestamptz;
alter table clinic_visits add column if not exists calendar_error text;
alter table clinic_visits add column if not exists calendar_out_of_date_at timestamptz;

-- Rows the sweep must look at. Partial, so it stays tiny once everything is in step.
create index if not exists clinic_visits_calendar_pending_idx
  on clinic_visits (calendar_out_of_date_at)
  where calendar_out_of_date_at is not null;

-- Mark a visit out of date when something the event shows changes: when, where, who, whether it is
-- cancelled or archived. Changing only the calendar_* columns must not re-mark it, or the sweep's own
-- success write would loop.
create or replace function public.clinic_visits_calendar_dirty()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT'
     or new.appointment_date is distinct from old.appointment_date
     or new.clinic_id        is distinct from old.clinic_id
     or new.resident_id      is distinct from old.resident_id
     or new.status           is distinct from old.status
     or new.archived_at      is distinct from old.archived_at then
    new.calendar_out_of_date_at := clock_timestamp();
  end if;
  return new;
end;
$$;

revoke execute on function public.clinic_visits_calendar_dirty() from public, anon, authenticated;

drop trigger if exists clinic_visits_calendar_dirty on clinic_visits;
create trigger clinic_visits_calendar_dirty
  before insert or update on clinic_visits
  for each row execute function public.clinic_visits_calendar_dirty();

comment on column public.clinic_visits.calendar_event_id is
  'Google Calendar event id for this visit; null = none exists (0207).';
comment on column public.clinic_visits.calendar_out_of_date_at is
  'Set by trigger when the visit changes in a way its calendar event does not show yet. Out of date when this is later than calendar_synced_at or that is null. A timestamp, not a boolean, so the sweep can order by how stale (0207).';

-- ---------------------------------------------------------------------------
-- 2. The narrow read
-- ---------------------------------------------------------------------------
-- Visits yesterday or today in Bangkok time (the shelter_time_zone() of 0073, never UTC, so 01:00 Bangkok is today;
-- shelter_date() itself is not used because its body needs public on the search path, which this function must not have),
-- not cancelled, not archived. Returns ONLY resident id, the visit's instant and the clinic's name.
-- Weight rows are not read here: the page compares them itself, since the Head of Medical can read
-- weight. No role_permissions or role_extras row is touched.
create or replace function public.weigh_first_visits()
returns table(resident_id uuid, visit_at timestamptz, clinic_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select v.resident_id, v.appointment_date, c.name
    from public.clinic_visits v
    left join public.clinics c on c.id = v.clinic_id
   where public.has_permission('medical.weight', 'edit')
     and v.status <> 'cancelled'
     and v.archived_at is null
     and (v.appointment_date at time zone public.shelter_time_zone())::date
         between (now() at time zone public.shelter_time_zone())::date - 1 and (now() at time zone public.shelter_time_zone())::date;
$$;

revoke execute on function public.weigh_first_visits() from public, anon;
grant execute on function public.weigh_first_visits() to authenticated;

comment on function public.weigh_first_visits() is
  'Record Weight''s "weigh these first": resident id, visit time and clinic name for non-cancelled visits yesterday or today (Bangkok), for logins holding medical.weight at edit. Deliberately narrow: the Head of Medical may not read clinic_visits (0134). 0207.';

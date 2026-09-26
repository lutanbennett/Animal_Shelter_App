-- Recurring jobs for staff (backlog, "Recurring jobs for staff, feeding My
-- dashboard", Lutan 2026-09-25; plus "reassign one week's job when someone
-- is sick", Lutan 2026-09-26). Schema half only: nothing in the app reads
-- these yet. The feature half (claude/recurring-jobs) adds the Management
-- page and the /my loader. docs/decisions.md (2026-09-26, "Recurring jobs:
-- the schema") has the reasoning; this header is the map.
--
-- Templates, not occurrences. A recurring_jobs row is the rule ("stocktake,
-- every Monday, morning, Anna"). Its occurrences are COMPUTED from the rule
-- and never generated ahead: a row in recurring_job_occurrences exists only
-- once somebody has acted on one date — marked it done or skipped, or
-- handed that one date to someone else. So there is no cron, no table of
-- future rows to keep in step when a rule is edited, and "did the stocktake
-- happen on 5 October" is one primary-key lookup.
--
-- The rule is a small explicit subset, not iCal RRULE, stored as plain
-- columns and evaluated by recurrence_occurs_on() below — one pure SQL
-- function, so the dashboard, the admin preview and this file's harness all
-- ask the same question of the same code:
--
--   repeat           'weekly'           every `every` weeks on `weekdays`
--                    'monthly_day'      every `every` months on `month_day`
--                    'monthly_weekday'  every `every` months on the
--                                       `week_of_month`th `weekdays[1]`
--   every            1 = every week / month, 2 = fortnightly / every other
--                    month, … Counted from the Monday-to-Sunday week (or the
--                    month) that contains starts_on, which is the anchor: a
--                    fortnightly Monday job starting Wednesday 7 Oct first
--                    falls on Monday 19 Oct, because 5 Oct is before the
--                    start and 12 Oct is an off week.
--   weekdays         ISO day numbers, 1 = Monday … 7 = Sunday.
--   month_day        1–31. A day the month does not have falls on its last
--                    day: "the 31st" is 30 April and 28 (or 29) February.
--   week_of_month    1–4, or -1 for the last one ("last Friday"). No 5th:
--                    most months do not have one, and -1 says what people
--                    mean by it.
--   starts_on        first date that can occur (and the anchor, above).
--   ends_on          last date that can occur; null = open-ended.
--
-- Dates and instants. Every date here is a shelter calendar date
-- (Asia/Bangkok, shelter_today() from 0073) stored as `date`: starts_on,
-- ends_on, overdue_from and occurs_on. Nothing about WHEN a job falls is a
-- timestamptz, so no session time zone can move it. The only timestamptz
-- columns are instants something happened (done_at, reassigned_at,
-- created_at, updated_at). time_of_day is a label (morning / afternoon /
-- evening / anytime), not a clock time.
--
-- Missed jobs stay overdue until done or skipped. Because nothing is
-- generated ahead, "overdue" is computed by looking backwards: every rule
-- date from overdue_from up to yesterday that has no outcome row. overdue_from
-- bounds that look-back. It defaults to the day the job is created, and a
-- trigger moves it to today when the job is resumed after a pause or its
-- rule (repeat, every, weekdays, month_day, week_of_month, starts_on) is
-- changed — so neither the paused weeks nor dates the old rule would have
-- produced turn into a wall of overdue rows. Changing only ends_on, the
-- title or the assignees leaves it alone. A paused job (active = false) shows
-- nothing at all, overdue included.
--
-- Assignees follow maintenance (0063): recurring_job_assignees is one row
-- per (job, login), so a job can go to one person or several ("a team" in
-- 0063's sense). No rows = unassigned.
--
-- Reassigning one date (someone is sick). recurring_job_occurrence_assignees
-- holds a cover team for one (job, date): when it has rows, they REPLACE the
-- template's assignees for that date only, and the template is untouched,
-- so the next week goes back to the usual person with nothing to undo.
-- Written only by reassign_recurring_job(), which records who reassigned it,
-- when and why ("Anna off sick") on the occurrence row. Covering a whole
-- sick week is one call per occurrence in that week — the feature's form can
-- offer "all of Anna's jobs, 5–9 Oct" and make the calls — so each covered
-- date is explicit and shows in the record.
--
-- Archived assignees. An archived login (0063) can no longer sign in, so a
-- job whose only assignees are archived would quietly go undone.
-- recurring_job_staffing counts live and archived assignees per job; an
-- active job with live_assignees = 0 is stranded, and the feature shows it
-- on the Management page. reassign_recurring_job() refuses an archived or
-- non-staff login as cover.
--
-- Order between jobs. depends_on_job_id: this job's occurrence on a date
-- waits for the other job's occurrence on the SAME date. Computed, not
-- enforced: if the other job falls that day and has no outcome yet, the
-- dashboard says "waiting for <title>"; done or skipped both release it; if
-- the other job does not fall that day there is nothing to wait for. The
-- database does not refuse "done" on a waiting job — the person may have
-- done it anyway — but it does refuse a cycle (a trigger walks the chain).
--
-- Who can do what.
--   read everything          admin, management, staff, vet, volunteer
--                            (anyone can be assigned a job, so anyone with
--                            app access reads the rules). Not public_viewer,
--                            not an archived or role-less login, not anon.
--   write templates and      admin, management — directly through the
--   their assignees          tables, as maintenance does.
--   mark done / skipped      record_recurring_job(): the date's effective
--                            assignees (cover team if there is one, else
--                            the template's), or admin / management. Stamps
--                            done_by and done_at itself.
--   reassign one date        reassign_recurring_job(): admin, management.
--   occurrence tables        no write policies and no write grants: the two
--                            functions are the only door, so an outcome's
--                            who and when cannot be typed in.
--
-- History is kept. An occurrence row refers to its job ON DELETE RESTRICT:
-- a job that has ever been done, skipped or reassigned cannot be deleted,
-- only paused or ended (ends_on), so "was the stocktake done" stays
-- answerable. A job with no history deletes freely.
--
-- Additive: four new tables, a view, functions and triggers; nothing
-- existing is altered. Re-runnable throughout. To undo, drop the view, the
-- functions and the four tables in a new file.

-- =========================================================================
-- 1. The rule, as a pure function
-- =========================================================================

create or replace function recurrence_occurs_on(
  p_day date,
  p_repeat text,
  p_every integer,
  p_weekdays smallint[],
  p_month_day smallint,
  p_week_of_month smallint,
  p_starts_on date,
  p_ends_on date
)
returns boolean
language sql
immutable
parallel safe
as $$
  select coalesce(
    p_day >= p_starts_on
    and (p_ends_on is null or p_day <= p_ends_on)
    and case p_repeat
      when 'weekly' then
        extract(isodow from p_day)::smallint = any (p_weekdays)
        -- whole weeks between the Monday of p_day's week and the Monday of
        -- the start's week; date - integer is a date, date - date an integer
        and ((p_day - (extract(isodow from p_day)::integer - 1))
             - (p_starts_on - (extract(isodow from p_starts_on)::integer - 1))) / 7 % p_every = 0
      when 'monthly_day' then
        ((extract(year from p_day)::integer * 12 + extract(month from p_day)::integer)
         - (extract(year from p_starts_on)::integer * 12 + extract(month from p_starts_on)::integer)) % p_every = 0
        and extract(day from p_day)::integer = least(
          p_month_day::integer,
          extract(day from (make_date(extract(year from p_day)::integer, extract(month from p_day)::integer, 1)
                            + interval '1 month' - interval '1 day'))::integer
        )
      when 'monthly_weekday' then
        ((extract(year from p_day)::integer * 12 + extract(month from p_day)::integer)
         - (extract(year from p_starts_on)::integer * 12 + extract(month from p_starts_on)::integer)) % p_every = 0
        and extract(isodow from p_day)::smallint = p_weekdays[1]
        and case
          when p_week_of_month = -1 then extract(month from p_day + 7) <> extract(month from p_day)
          else (extract(day from p_day)::integer - 1) / 7 + 1 = p_week_of_month
        end
      else false
    end,
    false
  );
$$;

comment on function recurrence_occurs_on(date, text, integer, smallint[], smallint, smallint, date, date) is
  'Does a recurring-job rule fall on this shelter date? The one evaluator of the recurrence subset (0095): weekly on weekdays every N weeks anchored on the week of starts_on, monthly on day N (clamped to the month''s last day), monthly on the Nth / last weekday, between starts_on and ends_on. Pure; takes the rule as values so an unsaved rule can be previewed.';

-- The dates a rule produces in a range: the admin form's "next few dates"
-- preview, before the rule is saved. Integer steps, not generate_series over
-- dates, which would go through timestamptz and the session time zone.
create or replace function recurrence_dates(
  p_repeat text,
  p_every integer,
  p_weekdays smallint[],
  p_month_day smallint,
  p_week_of_month smallint,
  p_starts_on date,
  p_ends_on date,
  p_from date,
  p_to date
)
returns setof date
language plpgsql
immutable
parallel safe
as $$
begin
  if p_from is null or p_to is null or p_to - p_from > 731 then
    raise exception 'Ask for at most two years of dates at a time.';
  end if;
  return query
    select p_from + i
      from generate_series(0, p_to - p_from) as i
     where recurrence_occurs_on(p_from + i, p_repeat, p_every, p_weekdays, p_month_day,
                                p_week_of_month, p_starts_on, p_ends_on);
end;
$$;

comment on function recurrence_dates(text, integer, smallint[], smallint, smallint, date, date, date, date) is
  'Every shelter date from p_from to p_to (at most two years) that a rule falls on, per recurrence_occurs_on() (0095). For previewing an unsaved rule.';

revoke all on function recurrence_occurs_on(date, text, integer, smallint[], smallint, smallint, date, date) from public, anon;
grant execute on function recurrence_occurs_on(date, text, integer, smallint[], smallint, smallint, date, date) to authenticated, service_role;
revoke all on function recurrence_dates(text, integer, smallint[], smallint, smallint, date, date, date, date) from public, anon;
grant execute on function recurrence_dates(text, integer, smallint[], smallint, smallint, date, date, date, date) to authenticated, service_role;

-- =========================================================================
-- 2. Templates
-- =========================================================================

create table if not exists recurring_jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text check (char_length(description) <= 4000),
  time_of_day text not null default 'anytime'
    check (time_of_day in ('morning', 'afternoon', 'evening', 'anytime')),
  -- An app path such as /stocktake?tab=diets. Must start with one slash and
  -- not two (or a backslash), so it can never point off the site.
  link_path text check (link_path ~ '^/([^/\\]|$)' and char_length(link_path) <= 500),
  repeat text not null check (repeat in ('weekly', 'monthly_day', 'monthly_weekday')),
  every integer not null default 1 check (every between 1 and 52),
  weekdays smallint[],
  month_day smallint,
  week_of_month smallint,
  starts_on date not null default shelter_today(),
  ends_on date,
  overdue_from date not null default shelter_today(),
  depends_on_job_id uuid references recurring_jobs (id) on delete set null,
  active boolean not null default true,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_jobs_ends_after_start check (ends_on is null or ends_on >= starts_on),
  constraint recurring_jobs_not_self_dependent check (depends_on_job_id is distinct from id),
  -- Exactly the columns each kind of rule uses, and nothing else, so a rule
  -- reads one way only. coalesce(…, false) because a CHECK that comes out
  -- null passes: without it, weekly with weekdays null would be accepted.
  constraint recurring_jobs_rule check (coalesce(
    (repeat = 'weekly'
      and weekdays is not null
      and cardinality(weekdays) between 1 and 7
      and weekdays <@ '{1,2,3,4,5,6,7}'::smallint[]
      and array_position(weekdays, null) is null
      and month_day is null and week_of_month is null)
    or (repeat = 'monthly_day'
      and month_day is not null and month_day between 1 and 31
      and weekdays is null and week_of_month is null)
    or (repeat = 'monthly_weekday'
      and weekdays is not null
      and cardinality(weekdays) = 1
      and weekdays <@ '{1,2,3,4,5,6,7}'::smallint[]
      and array_position(weekdays, null) is null
      and week_of_month is not null and week_of_month in (1, 2, 3, 4, -1)
      and month_day is null),
    false
  ))
);

create index if not exists recurring_jobs_depends_on_idx
  on recurring_jobs (depends_on_job_id) where depends_on_job_id is not null;

comment on table recurring_jobs is
  'A job that repeats on a calendar (0095). The rule is evaluated by recurrence_occurs_on(); occurrences are computed, never stored ahead. Written by admin and management; read by every staff role.';
comment on column recurring_jobs.repeat is
  'weekly (weekdays, every N weeks) | monthly_day (month_day, every N months) | monthly_weekday (week_of_month + weekdays[1], every N months).';
comment on column recurring_jobs.every is
  'Every N weeks or months, counted from the week (Monday-Sunday) or month containing starts_on.';
comment on column recurring_jobs.weekdays is
  'ISO weekdays, 1 = Monday ... 7 = Sunday. Several for weekly; exactly one for monthly_weekday; null for monthly_day.';
comment on column recurring_jobs.month_day is
  'monthly_day only: 1-31; a day past the month''s end falls on its last day.';
comment on column recurring_jobs.week_of_month is
  'monthly_weekday only: 1-4 = first to fourth, -1 = last.';
comment on column recurring_jobs.starts_on is
  'Shelter date the rule starts, and the anchor that every-N counts from.';
comment on column recurring_jobs.ends_on is
  'Last shelter date the rule can fall on; null = no end.';
comment on column recurring_jobs.overdue_from is
  'Earliest shelter date an undone occurrence counts as overdue. Set to today on create, and by trigger when the job is resumed or its rule changes, so paused weeks and dates from an old rule never show as missed.';
comment on column recurring_jobs.time_of_day is
  'A label for when in the day it is done (morning / afternoon / evening / anytime); not a clock time.';
comment on column recurring_jobs.link_path is
  'Optional app path the job is done on, e.g. /stocktake?tab=diets. Always site-relative.';
comment on column recurring_jobs.depends_on_job_id is
  'Waits for that job''s occurrence on the same date, when it has one. Shown as waiting, not enforced. Cycles are refused.';
comment on column recurring_jobs.active is
  'false = paused: no occurrences show, overdue ones included. Resuming moves overdue_from to today.';

-- A dependency cycle would leave every job in it waiting for ever.
create or replace function recurring_jobs_check_dependency()
returns trigger
language plpgsql
as $$
declare
  v_next uuid := new.depends_on_job_id;
  v_steps integer := 0;
begin
  while v_next is not null loop
    if v_next = new.id then
      raise exception 'A job cannot wait for itself, directly or through other jobs.';
    end if;
    v_steps := v_steps + 1;
    if v_steps > 50 then
      raise exception 'That chain of jobs waiting for each other is too long.';
    end if;
    select depends_on_job_id into v_next from recurring_jobs where id = v_next;
  end loop;
  return new;
end;
$$;

drop trigger if exists recurring_jobs_check_dependency on recurring_jobs;
create trigger recurring_jobs_check_dependency
  before insert or update of depends_on_job_id on recurring_jobs
  for each row execute function recurring_jobs_check_dependency();

-- Resuming, or changing which dates the rule produces, starts the overdue
-- look-back again from today.
create or replace function recurring_jobs_reset_overdue_from()
returns trigger
language plpgsql
as $$
begin
  if (new.active and not old.active)
     or (new.repeat, new.every, new.weekdays, new.month_day, new.week_of_month, new.starts_on)
        is distinct from
        (old.repeat, old.every, old.weekdays, old.month_day, old.week_of_month, old.starts_on)
  then
    new.overdue_from := greatest(new.overdue_from, shelter_today());
  end if;
  return new;
end;
$$;

drop trigger if exists recurring_jobs_reset_overdue_from on recurring_jobs;
create trigger recurring_jobs_reset_overdue_from
  before update on recurring_jobs
  for each row execute function recurring_jobs_reset_overdue_from();

drop trigger if exists recurring_jobs_touch_updated_at on recurring_jobs;
create trigger recurring_jobs_touch_updated_at
  before insert or update on recurring_jobs
  for each row execute function touch_updated_at();

alter table recurring_jobs enable row level security;

drop policy if exists staff_roles_read_recurring_jobs on recurring_jobs;
create policy staff_roles_read_recurring_jobs on recurring_jobs for select
  using (current_user_role() in ('admin', 'management', 'staff', 'vet', 'volunteer'));

drop policy if exists managers_write_recurring_jobs on recurring_jobs;
create policy managers_write_recurring_jobs on recurring_jobs for all
  using (current_user_role() in ('admin', 'management'))
  with check (current_user_role() in ('admin', 'management'));

revoke all on recurring_jobs from public, anon, authenticated;
grant select, insert, update, delete on recurring_jobs to authenticated;
grant all on recurring_jobs to service_role;

-- =========================================================================
-- 3. Template assignees (the 0063 shape)
-- =========================================================================

create table if not exists recurring_job_assignees (
  job_id uuid not null references recurring_jobs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (job_id, user_id)
);

create index if not exists recurring_job_assignees_user_id_idx on recurring_job_assignees (user_id);

comment on table recurring_job_assignees is
  'Who a recurring job is usually with: one row per login, so a job can go to a team (as maintenance_assignees, 0063). No rows = unassigned. One date can be handed to someone else in recurring_job_occurrence_assignees.';

alter table recurring_job_assignees enable row level security;

drop policy if exists staff_roles_read_recurring_job_assignees on recurring_job_assignees;
create policy staff_roles_read_recurring_job_assignees on recurring_job_assignees for select
  using (current_user_role() in ('admin', 'management', 'staff', 'vet', 'volunteer'));

drop policy if exists managers_write_recurring_job_assignees on recurring_job_assignees;
create policy managers_write_recurring_job_assignees on recurring_job_assignees for all
  using (current_user_role() in ('admin', 'management'))
  with check (current_user_role() in ('admin', 'management'));

revoke all on recurring_job_assignees from public, anon, authenticated;
grant select, insert, update, delete on recurring_job_assignees to authenticated;
grant all on recurring_job_assignees to service_role;

-- =========================================================================
-- 4. Occurrences that were acted on
-- =========================================================================

create table if not exists recurring_job_occurrences (
  job_id uuid not null references recurring_jobs (id) on delete restrict,
  occurs_on date not null,
  outcome text check (outcome in ('done', 'skipped')),
  done_by uuid references auth.users (id) on delete set null,
  done_at timestamptz,
  note text check (char_length(note) <= 2000),
  reassigned_by uuid references auth.users (id) on delete set null,
  reassigned_at timestamptz,
  reassign_note text check (char_length(reassign_note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (job_id, occurs_on),
  constraint recurring_job_occurrences_outcome_stamped check ((outcome is null) = (done_at is null)),
  constraint recurring_job_occurrences_says_something check (outcome is not null or reassigned_at is not null)
);

create index if not exists recurring_job_occurrences_occurs_on_idx on recurring_job_occurrences (occurs_on);

comment on table recurring_job_occurrences is
  'One row per (job, shelter date) that somebody acted on: done / skipped (who, when, a note) and/or handed to a cover team for that date. Dates nobody acted on have no row. Written only by record_recurring_job() and reassign_recurring_job() (0095).';
comment on column recurring_job_occurrences.occurs_on is
  'The shelter date the rule fell on, not the day it was done (that is done_at).';
comment on column recurring_job_occurrences.outcome is
  'done | skipped; null while the row only records a reassignment.';

drop trigger if exists recurring_job_occurrences_touch_updated_at on recurring_job_occurrences;
create trigger recurring_job_occurrences_touch_updated_at
  before insert or update on recurring_job_occurrences
  for each row execute function touch_updated_at();

create table if not exists recurring_job_occurrence_assignees (
  job_id uuid not null,
  occurs_on date not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (job_id, occurs_on, user_id),
  foreign key (job_id, occurs_on) references recurring_job_occurrences (job_id, occurs_on) on delete cascade
);

create index if not exists recurring_job_occurrence_assignees_user_id_idx
  on recurring_job_occurrence_assignees (user_id, occurs_on);

comment on table recurring_job_occurrence_assignees is
  'Cover for one date: when a (job, date) has rows here they replace the job''s usual assignees for that date only (someone off sick). Written only by reassign_recurring_job() (0095).';

alter table recurring_job_occurrences enable row level security;
alter table recurring_job_occurrence_assignees enable row level security;

drop policy if exists staff_roles_read_recurring_job_occurrences on recurring_job_occurrences;
create policy staff_roles_read_recurring_job_occurrences on recurring_job_occurrences for select
  using (current_user_role() in ('admin', 'management', 'staff', 'vet', 'volunteer'));

drop policy if exists staff_roles_read_recurring_job_occurrence_assignees on recurring_job_occurrence_assignees;
create policy staff_roles_read_recurring_job_occurrence_assignees on recurring_job_occurrence_assignees for select
  using (current_user_role() in ('admin', 'management', 'staff', 'vet', 'volunteer'));

revoke all on recurring_job_occurrences from public, anon, authenticated;
grant select on recurring_job_occurrences to authenticated;
grant all on recurring_job_occurrences to service_role;
revoke all on recurring_job_occurrence_assignees from public, anon, authenticated;
grant select on recurring_job_occurrence_assignees to authenticated;
grant all on recurring_job_occurrence_assignees to service_role;

-- =========================================================================
-- 5. Reading: dates in a range, and who is still on each job
-- =========================================================================

-- Every (job, date) the saved rules produce in a range, for the jobs the
-- caller can read. Security invoker, so RLS decides which jobs. Does not
-- filter on active, overdue_from, assignees or outcomes: the loader does,
-- so it can tell "paused" from "not today".
create or replace function recurring_job_dates(p_from date, p_to date)
returns table (job_id uuid, occurs_on date)
language plpgsql
stable
as $$
begin
  if p_from is null or p_to is null or p_to - p_from > 731 then
    raise exception 'Ask for at most two years of dates at a time.';
  end if;
  return query
    select j.id, p_from + i
      from recurring_jobs j
      cross join generate_series(0, p_to - p_from) as i
     where recurrence_occurs_on(p_from + i, j.repeat, j.every, j.weekdays, j.month_day,
                                j.week_of_month, j.starts_on, j.ends_on)
     order by 2, 1;
end;
$$;

comment on function recurring_job_dates(date, date) is
  'Every (job, shelter date) from p_from to p_to (at most two years) that a saved rule falls on, for the jobs the caller can read (0095). Unfiltered by active / overdue_from / assignees / outcomes.';

revoke all on function recurring_job_dates(date, date) from public, anon;
grant execute on function recurring_job_dates(date, date) to authenticated, service_role;

-- Live vs archived assignees per job. security_invoker so RLS on the jobs
-- applies; app_users (0086's gate) supplies archived_at, which staff cannot
-- read from user_roles directly. A login with no role row at all (deleted
-- role) is not in app_users and so counts as neither: live_assignees = 0 is
-- the test for "stranded", not the sum.
create or replace view recurring_job_staffing with (security_invoker = true) as
select
  j.id as job_id,
  (count(u.id) filter (where u.archived_at is null and u.role <> 'public_viewer'))::integer as live_assignees,
  (count(u.id) filter (where u.archived_at is not null))::integer as archived_assignees
from recurring_jobs j
left join recurring_job_assignees a on a.job_id = j.id
left join app_users u on u.id = a.user_id
group by j.id;

comment on view recurring_job_staffing is
  'Per recurring job: assignees who can still sign in and do it, and archived ones. An active job with live_assignees = 0 is stranded and needs reassigning (0095).';

revoke all on recurring_job_staffing from public, anon, authenticated;
grant select on recurring_job_staffing to authenticated, service_role;

-- =========================================================================
-- 6. Writing: record an outcome, reassign one date
-- =========================================================================

create or replace function record_recurring_job(
  p_job_id uuid,
  p_occurs_on date,
  p_outcome text,
  p_note text default null
)
returns recurring_job_occurrences
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role app_role := current_user_role();
  v_job recurring_jobs;
  v_row recurring_job_occurrences;
  v_note text := nullif(btrim(p_note), '');
begin
  if v_role is null or v_role not in ('admin', 'management', 'staff', 'vet', 'volunteer') then
    raise exception 'Not authorized to record a recurring job.';
  end if;
  if p_outcome is not null and p_outcome not in ('done', 'skipped') then
    raise exception 'A job can be marked done or skipped.';
  end if;
  select * into v_job from recurring_jobs where id = p_job_id;
  if not found then
    raise exception 'That recurring job no longer exists.';
  end if;

  -- The date's effective assignees: its cover team if it has one, else the
  -- job's usual ones. Management may record any job.
  if v_role not in ('admin', 'management') then
    if exists (select 1 from recurring_job_occurrence_assignees
                where job_id = p_job_id and occurs_on = p_occurs_on) then
      if not exists (select 1 from recurring_job_occurrence_assignees
                      where job_id = p_job_id and occurs_on = p_occurs_on and user_id = auth.uid()) then
        raise exception 'This date of the job has been handed to someone else.';
      end if;
    elsif not exists (select 1 from recurring_job_assignees
                       where job_id = p_job_id and user_id = auth.uid()) then
      raise exception 'Only the people this job is assigned to, or management, can record it.';
    end if;
  end if;

  -- Clearing: undo a mistaken done / skipped. A row left saying nothing goes.
  if p_outcome is null then
    delete from recurring_job_occurrences
     where job_id = p_job_id and occurs_on = p_occurs_on and reassigned_at is null;
    update recurring_job_occurrences
       set outcome = null, done_by = null, done_at = null, note = null
     where job_id = p_job_id and occurs_on = p_occurs_on
    returning * into v_row;
    return v_row;
  end if;

  if not recurrence_occurs_on(p_occurs_on, v_job.repeat, v_job.every, v_job.weekdays, v_job.month_day,
                              v_job.week_of_month, v_job.starts_on, v_job.ends_on) then
    raise exception 'This job does not fall on %.', to_char(p_occurs_on, 'FMDD Mon YYYY');
  end if;
  if p_outcome = 'done' and p_occurs_on > shelter_today() then
    raise exception 'A job cannot be marked done before its day. It can be skipped ahead.';
  end if;

  insert into recurring_job_occurrences (job_id, occurs_on, outcome, done_by, done_at, note)
  values (p_job_id, p_occurs_on, p_outcome, auth.uid(), now(), v_note)
  on conflict (job_id, occurs_on) do update
    set outcome = excluded.outcome, done_by = excluded.done_by,
        done_at = excluded.done_at, note = excluded.note
  returning * into v_row;
  return v_row;
end;
$$;

comment on function record_recurring_job(uuid, date, text, text) is
  'Marks one date of a recurring job done or skipped (null clears it), stamping the caller and now() (0095). Allowed for the date''s effective assignees (cover team, else the usual team) and admin / management. Refuses a date the rule does not fall on, and done before the day; skipped ahead is allowed.';

revoke all on function record_recurring_job(uuid, date, text, text) from public, anon;
grant execute on function record_recurring_job(uuid, date, text, text) to authenticated, service_role;

create or replace function reassign_recurring_job(
  p_job_id uuid,
  p_occurs_on date,
  p_user_ids uuid[],
  p_note text default null
)
returns recurring_job_occurrences
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job recurring_jobs;
  v_row recurring_job_occurrences;
  v_ids uuid[];
  v_ok integer;
begin
  if current_user_role() is null or current_user_role() not in ('admin', 'management') then
    raise exception 'Only management can reassign a job.';
  end if;
  select * into v_job from recurring_jobs where id = p_job_id;
  if not found then
    raise exception 'That recurring job no longer exists.';
  end if;
  select coalesce(array_agg(distinct u), '{}') into v_ids
    from unnest(coalesce(p_user_ids, '{}')) as u where u is not null;

  -- A date that is done or skipped is history: who covered it stays.
  if exists (select 1 from recurring_job_occurrences
              where job_id = p_job_id and occurs_on = p_occurs_on and outcome is not null) then
    raise exception 'That date has already been marked done or skipped.';
  end if;

  -- No one: hand the date back to the usual assignees.
  if cardinality(v_ids) = 0 then
    delete from recurring_job_occurrence_assignees where job_id = p_job_id and occurs_on = p_occurs_on;
    delete from recurring_job_occurrences
     where job_id = p_job_id and occurs_on = p_occurs_on;
    return null;
  end if;

  if not recurrence_occurs_on(p_occurs_on, v_job.repeat, v_job.every, v_job.weekdays, v_job.month_day,
                              v_job.week_of_month, v_job.starts_on, v_job.ends_on) then
    raise exception 'This job does not fall on %.', to_char(p_occurs_on, 'FMDD Mon YYYY');
  end if;
  select count(*) into v_ok
    from user_roles r
   where r.user_id = any (v_ids)
     and r.archived_at is null
     and r.role in ('admin', 'management', 'staff', 'vet', 'volunteer');
  if v_ok <> cardinality(v_ids) then
    raise exception 'A job can only be reassigned to someone who can still sign in.';
  end if;

  insert into recurring_job_occurrences (job_id, occurs_on, reassigned_by, reassigned_at, reassign_note)
  values (p_job_id, p_occurs_on, auth.uid(), now(), nullif(btrim(p_note), ''))
  on conflict (job_id, occurs_on) do update
    set reassigned_by = excluded.reassigned_by, reassigned_at = excluded.reassigned_at,
        reassign_note = excluded.reassign_note
  returning * into v_row;

  delete from recurring_job_occurrence_assignees
   where job_id = p_job_id and occurs_on = p_occurs_on and user_id <> all (v_ids);
  insert into recurring_job_occurrence_assignees (job_id, occurs_on, user_id)
  select p_job_id, p_occurs_on, u from unnest(v_ids) as u
  on conflict do nothing;

  return v_row;
end;
$$;

comment on function reassign_recurring_job(uuid, date, uuid[], text) is
  'Hands one date of a recurring job to other logins (someone off sick), replacing its usual assignees for that date only; an empty list hands it back (0095). Admin / management. Refuses a date the rule does not fall on, a date already done or skipped, and archived or non-staff logins.';

revoke all on function reassign_recurring_job(uuid, date, uuid[], text) from public, anon;
grant execute on function reassign_recurring_job(uuid, date, uuid[], text) to authenticated, service_role;

notify pgrst, 'reload schema';

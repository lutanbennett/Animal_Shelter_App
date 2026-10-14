-- consumer: src/app/admin/security/actions.ts, src/app/admin/security/page.tsx
--
-- multi-role-schema (docs/decisions/2026-10-14-multi-role-logins.md): a login may hold more than one role, and its
-- rights are the union. This is the schema half only; the Add-a-role panel, the union in the home and menu, the rota
-- picker and the "covers ending" list are `multi-role-build`. Until that ships every login still has exactly one row.
--
-- 1. user_roles is one row per (login, role). Key (user_id, role_id). New columns: is_main (the login's one permanent
--    role: every existing row, back-filled true), starts_on / ends_on (shelter dates; ends_on null = no end), granted_by.
-- 2. role_row_live(starts_on, ends_on): is a row in force TODAY, by shelter_date(), not UTC (a cover that ends today
--    still works today in Thailand; it stops counting the day after).
-- 3. The helpers, rewritten so that several rows mean the union and a lapsed row counts for nothing:
--      has_permission / is_admin / holds_app_role / sees_all_*  : exists over live rows, so a union already.
--      my_permissions : cells at the highest level, scopes at the widest, sees_login_emails if any role does.
--      is_clinic_login / photos_medical_only : RESTRICTIONS, so true only when every live role is restricted.
--      on_volunteer_floor : a restriction, true only when a role reads who-and-where and none reads everything.
--      role_can : asks "is it one of my roles", not "is it my role".
--      reassign_recurring_job : counts people, not rows.
--      private.app_users : one row per person, taken from the main role.
-- 4. Guards: an extra role is never Admin or the public viewer (Admin is its own rule: the 2-step and lockout rules in
--    docs/roles-and-permissions.md section 6), needs a live main role to sit on, and a main role has no dates.
--
-- Nothing changes for a login with one row: scripts/check-multi-role-schema.mjs hashes every login's effective
-- permissions before and after and they are identical. Re-runnable. To undo: restore the helpers from 0178/0179/0180/0181,
-- delete any non-main rows, put the key back on user_id and drop the four columns.

-- ---------------------------------------------------------------------------
-- 1. The table
-- ---------------------------------------------------------------------------
alter table user_roles add column if not exists is_main boolean not null default true;
alter table user_roles add column if not exists starts_on date;
alter table user_roles add column if not exists ends_on date;
alter table user_roles add column if not exists granted_by uuid references auth.users (id) on delete set null;

alter table user_roles drop constraint if exists user_roles_main_has_no_dates;
alter table user_roles add constraint user_roles_main_has_no_dates
  check (not is_main or (starts_on is null and ends_on is null));
alter table user_roles drop constraint if exists user_roles_dates_in_order;
alter table user_roles add constraint user_roles_dates_in_order
  check (starts_on is null or ends_on is null or ends_on >= starts_on);

do $$
begin
  if exists (select 1 from pg_constraint where conrelid = 'public.user_roles'::regclass
                and conname = 'user_roles_pkey' and pg_get_constraintdef(oid) = 'PRIMARY KEY (user_id)') then
    alter table user_roles drop constraint user_roles_pkey;
    alter table user_roles add constraint user_roles_pkey primary key (user_id, role_id);
  end if;
end $$;

create unique index if not exists user_roles_one_main on user_roles (user_id) where is_main;

comment on column user_roles.is_main is
  'The login''s one permanent role (0196). Every other row is an additional role: it may have dates, and is never Admin.';
comment on column user_roles.starts_on is 'First shelter day an additional role counts (0196). Null = already.';
comment on column user_roles.ends_on is 'Last shelter day an additional role counts (0196). Null = no end. Always null on the main role.';
comment on column user_roles.granted_by is 'Who gave this role (0196). Null for rows that predate it.';

-- ---------------------------------------------------------------------------
-- 2. Is a row in force today
-- ---------------------------------------------------------------------------
create or replace function role_row_live(p_starts_on date, p_ends_on date)
returns boolean
language sql
stable
set search_path = ''
as $$
  select (p_starts_on is null or p_starts_on <= public.shelter_date(now()))
     and (p_ends_on is null or p_ends_on >= public.shelter_date(now()));
$$;

comment on function role_row_live(date, date) is
  'Is a user_roles row in force today, by the shelter date (not UTC)? An additional role counts from starts_on to ends_on inclusive, so it stops the day after ends_on. Null = open on that side. 0196.';

-- ---------------------------------------------------------------------------
-- 3. Guards
-- ---------------------------------------------------------------------------
create or replace function user_roles_extra_role_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key text;
begin
  if tg_op = 'UPDATE' and old.is_main and not new.is_main then
    raise exception 'A login''s main role cannot be turned into an additional one: change the main role instead.'
      using errcode = 'check_violation';
  end if;
  if new.is_main then
    return new;
  end if;

  select key into v_key from public.roles where id = new.role_id;
  if v_key in ('admin', 'public_viewer') then
    raise exception 'Admin and the public viewer cannot be given as an additional role: they are a login''s main role or nothing.'
      using errcode = 'check_violation';
  end if;

  if tg_op = 'INSERT' and new.archived_at is null
     and not exists (select 1 from public.user_roles m
                      where m.user_id = new.user_id and m.is_main and m.archived_at is null) then
    raise exception 'An additional role needs a live main role to sit on.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function user_roles_extra_role_rules() from public, anon, authenticated;

drop trigger if exists user_roles_extra_role_rules on user_roles;
create trigger user_roles_extra_role_rules
  before insert or update on user_roles
  for each row execute function user_roles_extra_role_rules();

-- ---------------------------------------------------------------------------
-- 4. The helpers
-- ---------------------------------------------------------------------------
create or replace function has_permission(p_activity text, p_level text default 'edit')
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id and r.archived_at is null
     where ur.user_id = (select auth.uid())
       and ur.archived_at is null
       and public.role_row_live(ur.starts_on, ur.ends_on)
       and p_activity is not null
       and p_level in ('read', 'edit')
       and (
         r.key = 'admin'
         or exists (
           select 1
             from public.role_permissions rp
            where rp.role_id = r.id
              and rp.activity = p_activity
              and rp.level >= case p_level when 'read' then 1 else 2 end
         )
       )
  );
$$;

create or replace function holds_app_role()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
     where ur.user_id = (select auth.uid())
       and ur.archived_at is null
       and public.role_row_live(ur.starts_on, ur.ends_on)
       and r.key <> 'public_viewer'
  );
$$;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id and r.archived_at is null
     where ur.user_id = (select auth.uid())
       and ur.archived_at is null
       and public.role_row_live(ur.starts_on, ur.ends_on)
       and r.key = 'admin'
  );
$$;

-- A restriction holds only when EVERY live role is restricted: a person who is also a Head of Medical is not confined to
-- one clinic. (Two-valued scope, so "all are own_clinic" is the same as "none is wider".)
create or replace function is_clinic_login()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(bool_and(r.scope_clinical = 'own_clinic'), false)
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id and r.archived_at is null
   where ur.user_id = (select auth.uid())
     and ur.archived_at is null
     and public.role_row_live(ur.starts_on, ur.ends_on);
$$;

create or replace function photos_medical_only()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(bool_and(r.scope_photos = 'medical_only'), false)
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id and r.archived_at is null
   where ur.user_id = (select auth.uid())
     and ur.archived_at is null
     and public.role_row_live(ur.starts_on, ur.ends_on);
$$;

-- The volunteer floor is a restriction: it holds while some role reads who-and-where and none reads every resident.
-- (Unlike the two above it keeps the archived-role blindness of 0180: a retired role still counts as a floor.)
create or replace function on_volunteer_floor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(bool_or(r.scope_residents = 'who_and_where'), false)
     and not coalesce(bool_or(r.scope_residents = 'all' and r.archived_at is null), false)
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
   where ur.user_id = (select auth.uid())
     and ur.archived_at is null
     and public.role_row_live(ur.starts_on, ur.ends_on);
$$;

create or replace function sees_all_clinical()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id and r.archived_at is null
     where ur.user_id = (select auth.uid())
       and ur.archived_at is null
       and public.role_row_live(ur.starts_on, ur.ends_on)
       and r.scope_clinical = 'any'
  );
$$;

create or replace function sees_all_contacts()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id and r.archived_at is null
     where ur.user_id = (select auth.uid())
       and ur.archived_at is null
       and public.role_row_live(ur.starts_on, ur.ends_on)
       and r.scope_contacts = 'full'
  );
$$;

create or replace function sees_all_residents()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id and r.archived_at is null
     where ur.user_id = (select auth.uid())
       and ur.archived_at is null
       and public.role_row_live(ur.starts_on, ur.ends_on)
       and r.scope_residents = 'all'
  );
$$;

-- my_permissions(): the existing keys keep their meaning for a one-role login; 'role' is the MAIN role, and 'roles' (new)
-- lists every live role key. Cells are the highest level any live role gives; each scope is the widest any live role has
-- (residents all > who_and_where > own_clinic; clinical any > own_clinic; contacts full > name_phone > name_type;
-- photos all > medical_only); sees_login_emails and opens_app are true if any role says so. Admin is only ever a main role.
create or replace function my_permissions()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with mine as (
    select r.*, ur.is_main, ur.created_at as held_since
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id and r.archived_at is null
     where ur.user_id = (select auth.uid())
       and ur.archived_at is null
       and public.role_row_live(ur.starts_on, ur.ends_on)
  ),
  main as (select * from mine order by is_main desc, held_since limit 1),
  wide as (
    select
      (array['own_clinic', 'who_and_where', 'all'])[max(case scope_residents when 'all' then 3 when 'who_and_where' then 2 else 1 end)] as residents,
      (array['own_clinic', 'any'])[max(case scope_clinical when 'any' then 2 else 1 end)] as clinical,
      (array['name_type', 'name_phone', 'full'])[max(case scope_contacts when 'full' then 3 when 'name_phone' then 2 else 1 end)] as contacts,
      (array['medical_only', 'all'])[max(case scope_photos when 'all' then 2 else 1 end)] as photos,
      bool_or(sees_login_emails) as sees_login_emails,
      bool_or(opens_app) as opens_app,
      bool_or(key = 'admin') as is_admin,
      jsonb_agg(key order by is_main desc, held_since) as role_keys
    from mine
  )
  select jsonb_build_object(
    'role', jsonb_build_object(
      'key', m.key, 'name', m.name, 'name_th', m.name_th, 'kind', m.kind,
      'opens_app', w.opens_app, 'home_path', m.home_path
    ),
    'roles', w.role_keys,
    'is_admin', w.is_admin,
    'scopes', jsonb_build_object(
      'residents', w.residents,
      'clinical', w.clinical,
      'contacts', w.contacts,
      'photos', w.photos,
      'sees_login_emails', w.sees_login_emails
    ),
    'permissions', case
      when w.is_admin
        then (select coalesce(jsonb_object_agg(a.key, 2), '{}'::jsonb) from public.permission_activities a)
      else (select coalesce(jsonb_object_agg(x.activity, x.level), '{}'::jsonb)
              from (select rp.activity, max(rp.level) as level
                      from public.role_permissions rp
                     where rp.role_id in (select id from mine)
                     group by rp.activity) x)
    end
  )
  from main m, wide w;
$$;

create or replace function role_can(p_role_key text, p_activity text, p_level text default 'edit')
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_own boolean;
begin
  select exists (
    select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id and r.archived_at is null
     where ur.user_id = (select auth.uid())
       and ur.archived_at is null
       and public.role_row_live(ur.starts_on, ur.ends_on)
       and r.key = p_role_key
  ) into v_own;

  -- coalesce: a null own-role test makes `not null` untrue
  if not coalesce(
       (select auth.role()) = 'service_role'
    or public.has_permission('recurring.manage', 'edit')
    or v_own,
    false
  ) then
    raise exception 'role_can: not permitted to ask about the % role', coalesce(p_role_key, '(null)')
      using errcode = 'insufficient_privilege';
  end if;

  return exists (
    select 1
      from public.roles r
     where r.key = p_role_key
       and r.archived_at is null
       and p_activity is not null
       and p_level in ('read', 'edit')
       and (
         r.key = 'admin'
         or exists (
           select 1
             from public.role_permissions rp
            where rp.role_id = r.id
              and rp.activity = p_activity
              and rp.level >= case p_level when 'read' then 1 else 2 end
         )
       )
  );
end;
$$;

-- reassign_recurring_job(): "can still sign in" counts PEOPLE; with several rows a person would be counted twice.
create or replace function reassign_recurring_job(p_job_id uuid, p_occurs_on date, p_user_ids uuid[], p_note text default null)
returns recurring_job_occurrences
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_job recurring_jobs;
  v_row recurring_job_occurrences;
  v_ids uuid[];
  v_ok integer;
begin
  -- 0178: the recurring-jobs page's cell (handing dates over is recurring.manage), not the role name.
  if not coalesce((select has_permission('recurring.manage')), false) then
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
  -- "Can still sign in": a login with at least one live role in force today that opens the app. Counted by person
  -- (0196: a login may hold several roles).
  select count(distinct ur.user_id) into v_ok
    from user_roles ur
    join roles r on r.id = ur.role_id and r.archived_at is null
   where ur.user_id = any (v_ids)
     and ur.archived_at is null
     and role_row_live(ur.starts_on, ur.ends_on)
     and r.opens_app;
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

-- private.app_users: one row per person, from the MAIN role (the join would otherwise list a person once per role).
create or replace view private.app_users as
select
  u.id,
  (case when (select is_clinic_login()) or on_volunteer_floor() then null else u.email end)::varchar(255) as email,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(u.raw_user_meta_data ->> 'name', '')
  ) as display_name,
  r.archived_at,
  rl.key as role_key
from auth.users u
join user_roles r on r.user_id = u.id and r.is_main
join roles rl on rl.id = r.role_id
where exists (select 1 from user_roles me where me.user_id = (select auth.uid()) and me.archived_at is null)
  and (
    not coalesce((select is_clinic_login()), false)
    or u.id = auth.uid()
    or u.id in (
      select d.user_id
        from doctors d
        join doctor_clinics dc on dc.doctor_id = d.id
       where dc.active
         and d.user_id is not null
         and dc.clinic_id = any ((select current_user_clinic_ids())::uuid[])
    )
  );

-- role_row_live is only a date test, but it is not for the Data API: the definer functions above call it as their owner.
revoke execute on function role_row_live(date, date) from public, anon;
grant execute on function role_row_live(date, date) to authenticated, service_role;

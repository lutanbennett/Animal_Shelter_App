-- consumer: src/lib/permissions/can.ts (reads my_permissions().is_admin), src/lib/auth/held-roles.ts, scripts/check-no-role-column-security.mjs, scripts/check-roles-columns.mjs
--
-- TWO SMALL FIXES IN ONE SCHEMA PR (backlog, Security, filed 2026-10-28). Re-runnable: create or replace.
--
-- 1. ADMIN IS KEYED BY roles.is_admin, NOT BY THE NAME 'admin'. Lutan, 2026-10-26: a shelter must be able to call its roles whatever it
--    likes, and no code may decide anything by a role's name. 0275 added roles.is_admin (true for key = 'admin', at most one role by
--    roles_one_admin_idx) and deliberately left the functions alone. This moves them onto it. THE BYPASS IS NOT CHANGED, ONLY WHAT IT
--    IS KEYED ON: Admin still sits outside the card system, still answers true before any cell is read, still holds no cards
--    (CLAUDE.md, settled). Today the flag is true on exactly the row key = 'admin' is, so no answer changes; rename the Admin role and
--    it keeps working, which is the point.
--    Moved: has_permission(), is_admin(), my_permissions() (the three in the brief) AND holds_app_role(), reassign_recurring_job() and
--    role_can(), which copy the same `r.key = 'admin'` test. Left on the name, a renamed Admin would pass has_permission() yet be refused
--    "can still sign in", so they move with it. Bodies are the live ones from 0272; only that test changes. role_can() keeps
--    `r.key = p_role_key`: that looks a role up by the key it was asked about, it does not decide access by name.
--
-- 2. set_resident_profile_photo() GETS THE MEDICAL TEST it never had (live body 0264). A login holding photos.resident_manage could make
--    a Medical file a resident's profile picture. Internal inconsistency, NOT an exposure: record_attachment() never auto-sets a Medical
--    photo (0267) and public_resident_photos / the profile view exclude Medical (0101, 0103), so it cannot reach the public site.
--    FORM CHOSEN: copied from 0276:37, lower(btrim(coalesce(sub_folder, ''), E' \t\r\n\f\v')) = 'medical'. A bare btrim strips spaces
--    only while the app's isMedicalFolder() (JS trim()) strips tabs and newlines too, so 'Medical<tab>' is Medical to the app; the
--    explicit set closes that, and a near-miss can only make the guard stricter. It depends on nothing 0276 creates, so it does not
--    matter whether 0276 is on production yet.

CREATE OR REPLACE FUNCTION public.has_permission(p_activity text, p_level text DEFAULT 'edit'::text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
     where ur.user_id = (select auth.uid())
       and ur.archived_at is null
       and public.role_row_live(ur.starts_on, ur.ends_on)
       and p_activity is not null
       and p_level in ('read', 'edit')
       and (
         r.is_admin
         or exists (
           select 1
             from public.role_permissions rp
            where rp.role_id = r.id
              and rp.activity = p_activity
              and rp.level >= case p_level when 'read' then 1 else 2 end
         )
       )
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
     where ur.user_id = (select auth.uid())
       and ur.archived_at is null
       and public.role_row_live(ur.starts_on, ur.ends_on)
       and r.is_admin
  );
$function$;

CREATE OR REPLACE FUNCTION public.holds_app_role()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
     where ur.user_id = (select auth.uid())
       and ur.archived_at is null
       and public.role_row_live(ur.starts_on, ur.ends_on)
       and (
         -- Admin sits outside the card system and holds no cards (CLAUDE.md). Same test has_permission() uses.
         r.is_admin
         or exists (select 1 from public.role_permissions rp where rp.role_id = r.id)
       )
  );
$function$;

CREATE OR REPLACE FUNCTION public.my_permissions()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with mine as (
    select r.*, ur.is_main, ur.created_at as held_since
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
     where ur.user_id = (select auth.uid())
       and ur.archived_at is null
       and public.role_row_live(ur.starts_on, ur.ends_on)
  ),
  main as (select * from mine order by is_main desc, held_since limit 1),
  wide as (
    select
      bool_or(mine.is_admin) as is_admin,
      jsonb_agg(key order by is_main desc, held_since) as role_keys
    from mine
  )
  select jsonb_build_object(
    'role', jsonb_build_object(
      'key', m.key, 'name', m.name, 'name_th', m.name_th, 'kind', m.kind,
      'home_path', m.home_path
    ),
    'roles', w.role_keys,
    'is_admin', w.is_admin,
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
$function$;

CREATE OR REPLACE FUNCTION public.reassign_recurring_job(p_job_id uuid, p_occurs_on date, p_user_ids uuid[], p_note text DEFAULT NULL::text)
 RETURNS recurring_job_occurrences
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  -- "Can still sign in": a login with at least one live role that is in the app, which since 0259 means Admin or a role
  -- holding at least one cell -- not roles.opens_app. Counted by person (0196: a login may hold several roles).
  select count(distinct ur.user_id) into v_ok
    from user_roles ur
    join roles r on r.id = ur.role_id
   where ur.user_id = any (v_ids)
     and ur.archived_at is null
     and role_row_live(ur.starts_on, ur.ends_on)
     and (r.is_admin or exists (select 1 from role_permissions rp where rp.role_id = r.id));
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
$function$;

CREATE OR REPLACE FUNCTION public.role_can(p_role_key text, p_activity text, p_level text DEFAULT 'edit'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_own boolean;
begin
  select exists (
    select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
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
       and p_activity is not null
       and p_level in ('read', 'edit')
       and (
         r.is_admin
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
$function$;

CREATE OR REPLACE FUNCTION public.set_resident_profile_photo(p_resident_id uuid, p_drive_file_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not coalesce((select has_permission('photos.resident_manage')), false) then
    raise exception 'Not authorized to set the profile photo.';
  end if;

  -- Require an existing attachment row for this resident/file, so an
  -- arbitrary Drive file ID can't be set as the profile photo.
  if not exists (
    select 1 from attachments
    where owner_type = 'resident'
      and owner_id = p_resident_id
      and drive_file_id = p_drive_file_id
  ) then
    raise exception 'That photo does not belong to this resident.';
  end if;

  -- A Medical file cannot be the profile picture (the app's isMedicalFolder(); the guard 0267 applies on the automatic path).
  -- Same test and character set as 0276:37.
  if exists (
    select 1 from attachments
    where owner_type = 'resident'
      and owner_id = p_resident_id
      and drive_file_id = p_drive_file_id
      and lower(btrim(coalesce(sub_folder, ''), E' \t\r\n\f\v')) = 'medical'
  ) then
    raise exception 'A Medical photo cannot be the profile photo.';
  end if;

  update residents
  set profile_photo_drive_file_id = p_drive_file_id
  where id = p_resident_id;
end;
$function$;

notify pgrst, 'reload schema';

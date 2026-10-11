-- consumer: src/app/my/page.tsx, src/lib/residents/who-and-where.ts
--
-- perm-drop-enum, step 1 of 2 (docs/decisions/2026-10-11-perm-drop-enum.md). Every remaining reader of the role enum
-- moves onto the role's own row, so that 0181 can drop user_roles.role, roles.legacy_role and current_user_role()
-- without breaking anything. This file removes no column and no function that code still calls: it can be applied
-- and the app left running on the old code.
--
-- What still read the enum (counted on dev, 2026-10-11): 4 functions (private.has_app_access, has_shelter_floor,
-- roles_guard_fixed, user_roles_sync_role_id) and 8 views (private.app_users, current_placement,
-- resident_current_state, immunization_compliance, immunization_duplicate_check, translation_queue,
-- resident_who_and_where, recurring_job_staffing). No policy.
--
--   * "on the volunteer floor" (current_user_role() = 'volunteer') becomes on_volunteer_floor(): the role's scope_residents
--     is who_and_where (0179 set that on every role that borrowed volunteer). Not filtered on the ROLE being archived,
--     as current_user_role() was not, so a person on a since-archived role keeps exactly the audience they had.
--   * "holds an app role" (current_user_role() in admin, management, staff, doctor, volunteer) becomes holds_app_role():
--     a live user_roles row whose role is anything but public_viewer. Same blind spot to archived roles, same reason.
--   * has_shelter_floor() has no caller since 0179 and is dropped.
--   * roles_guard_fixed() stops pinning legacy_role (the column goes in 0181).
--
-- Re-runnable. To undo: restore the bodies from 0086, 0174, 0178, 0149 and 0095.

create or replace function public.on_volunteer_floor()
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
       and r.scope_residents = 'who_and_where'
  );
$$;

comment on function public.on_volunteer_floor() is
  'Is the caller''s live role one that reads residents as who-and-where only (roles.scope_residents = who_and_where): the volunteer, the 2IC, the Heads, any role set the same? What current_user_role() = volunteer asked, before 0180 (perm-drop-enum). Not filtered on the role being archived, as the enum was not.';

revoke all on function public.on_volunteer_floor() from public, anon;
grant execute on function public.on_volunteer_floor() to authenticated, service_role;

create or replace function public.holds_app_role()
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
       and r.key <> 'public_viewer'
  );
$$;

comment on function public.holds_app_role() is
  'Does the caller hold a live login on any role but public_viewer? What current_user_role() in (admin, management, staff, doctor, volunteer) asked, before 0180 (perm-drop-enum). Behind private.has_app_access().';

revoke all on function public.holds_app_role() from public, anon;
grant execute on function public.holds_app_role() to authenticated, service_role;

create or replace function private.has_app_access()
returns boolean
language sql
stable
set search_path = pg_catalog, public
as $$
  select current_user::text not in ('anon', 'authenticated')
      or public.holds_app_role();
$$;

comment on function private.has_app_access() is
  'True for a session holding a live login on any role but public_viewer, and for callers that are not a Data API session. False for anon, archived logins, role-less logins and public_viewer. The gate on the public wrappers of the internal views (0086). 0180: asks holds_app_role(), no longer the role enum.';

-- ---------------------------------------------------------------------------
-- Views. Same columns, same order, same options: create or replace keeps grants and dependants.
-- ---------------------------------------------------------------------------
create or replace view public.current_placement as
select id, resident_id, placement_type, start_date, end_date, zone_id, enclosure_id, previous_enclosure_id,
       carer_id, notes, created_by, created_at
  from private.current_placement
 where private.has_app_access()
   and not public.on_volunteer_floor()
   and (
     not coalesce((select public.is_clinic_login()), false)
     or resident_id in (select public.current_doctor_resident_ids())
   );

create or replace view public.immunization_compliance as
select resident_id, resident_name, immunization_type_id, immunization_type_name
  from private.immunization_compliance
 where private.has_app_access()
   and not public.on_volunteer_floor()
   and (
     not coalesce((select public.is_clinic_login()), false)
     or resident_id in (select public.current_doctor_resident_ids())
   );

create or replace view public.immunization_duplicate_check as
select resident_id, immunization_type_id, date_administered, count
  from private.immunization_duplicate_check
 where private.has_app_access()
   and not public.on_volunteer_floor()
   and (
     not coalesce((select public.is_clinic_login()), false)
     or resident_id in (select public.current_doctor_resident_ids())
   );

create or replace view public.resident_current_state as
select resident_id, name, current_placement_id, current_enclosure_id, current_zone_id, current_carer_id,
       active_hospital_previous_enclosure, current_status, is_deceased, date_of_death
  from private.resident_current_state
 where private.has_app_access()
   and not public.on_volunteer_floor()
   and (
     not coalesce((select public.is_clinic_login()), false)
     or resident_id in (select public.current_doctor_resident_ids())
   );

create or replace view public.translation_queue as
select id, table_name, row_id, column_name, tier, source_lang, target_lang, source_text, reviewed_source_text, text,
       status, engine, reviewed_by, reviewed_at, created_at, updated_at, record_label, record_path
  from private.translation_queue
 where private.has_app_access()
   and not public.on_volunteer_floor()
   and (
     not coalesce((select public.is_clinic_login()), false)
     or table_name <> 'residents'
     or row_id in (select public.current_doctor_resident_ids())
   );

create or replace view public.resident_who_and_where as
select r.id, r.name, r.thai_name, r.resident_code, r.species, r.sex, r.profile_photo_drive_file_id,
       s.current_status,
       e.id as enclosure_id, e.name as enclosure_name, e.name_th as enclosure_name_th,
       z.id as zone_id, z.name as zone_name, z.name_th as zone_name_th, z.colour as zone_colour
  from public.residents r
  left join private.resident_current_state s on s.resident_id = r.id
  left join public.enclosures e on e.id = s.current_enclosure_id
  left join public.zones z on z.id = e.zone_id
 where public.on_volunteer_floor();

-- private.app_users keeps its `role` column until 0181 (the app and the public wrapper still select it).
-- The email is blanked for a clinic login (the doctor's scope) and for the volunteer floor, as 'doctor'/'volunteer' were.
create or replace view private.app_users as
select
  u.id,
  case when (select public.is_clinic_login()) or public.on_volunteer_floor() then null else u.email end::varchar(255) as email,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(u.raw_user_meta_data ->> 'name', '')
  ) as display_name,
  r.role,
  r.archived_at,
  coalesce(rl.key, r.role::text) as role_key
from auth.users u
join public.user_roles r on r.user_id = u.id
left join public.roles rl on rl.id = r.role_id
where exists (select 1 from public.user_roles me where me.user_id = (select auth.uid()) and me.archived_at is null)
  and (
    not coalesce((select public.is_clinic_login()), false)
    or u.id = auth.uid()
    or u.id in (
      select d.user_id
        from public.doctors d
        join public.doctor_clinics dc on dc.doctor_id = d.id
       where dc.active
         and d.user_id is not null
         and dc.clinic_id = any ((select public.current_user_clinic_ids())::uuid[])
    )
  );

create or replace view public.recurring_job_staffing with (security_invoker = true) as
select
  j.id as job_id,
  (count(u.id) filter (where u.archived_at is null and u.role_key <> 'public_viewer'))::integer as live_assignees,
  (count(u.id) filter (where u.archived_at is not null))::integer as archived_assignees
from public.recurring_jobs j
left join public.recurring_job_assignees a on a.job_id = j.id
left join public.app_users u on u.id = a.user_id
group by j.id;

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------
drop function if exists public.has_shelter_floor();

create or replace function public.roles_guard_fixed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.kind = 'fixed' then
      raise exception 'The % role is fixed and cannot be deleted.', old.key using errcode = 'check_violation';
    end if;
    return old;
  end if;
  if old.kind = 'fixed' and (
       new.key is distinct from old.key
    or new.kind is distinct from old.kind
    or new.archived_at is not null
  ) then
    raise exception 'The % role is fixed: it cannot be renamed, re-kinded or archived.', old.key
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants, stated so the file stands alone (the grants check, 0160): select for signed-in logins and the server, as on
-- dev today. create or replace view keeps them; this restates them.
-- ---------------------------------------------------------------------------
grant select on public.current_placement, public.immunization_compliance, public.immunization_duplicate_check,
  public.resident_current_state, public.translation_queue, public.resident_who_and_where,
  public.recurring_job_staffing to authenticated, service_role;

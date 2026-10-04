-- consumer: src/app/maintenance/page.tsx, src/lib/maintenance/queries.ts, src/lib/permissions/jobs.ts, src/lib/home/tiles.ts
--
-- R3, the second configured role (docs/roles-and-permissions.md §12; copies
-- decisions/2026-10-04-medical-role.md): the Head of Maintenance. A row in `roles`,
-- never an enum value.
--
-- THE JOB, EXPANDED. "Do Maintenance" (src/lib/permissions/jobs.ts) is
--   maintenance.jobs      edit   create, change, assign and complete a job
--   maintenance.progress  yes    move a job on
--   recurring.do_own      yes    mark her own recurring tasks done (/my). Setting them up
--                                stays Management's (P2): no recurring.manage.
--   resident.record       read   who and where (the volunteer's who-and-where, 0134)
--   facility.enclosures   read   the board names and picks enclosures and zones
-- Those five cells are the role's whole set. Not given: maintenance.photos (the whiteboard
-- says jobs and progress), anything medical, stock, contacts or money.
--
-- WHAT THE BOARD NEEDS BEYOND THE CELLS. maintenance, maintenance_assignees and the
-- translations of a job's title still answer by role name (0001, 0063, 0056). `legacy_role`
-- is volunteer, and 0134 took the volunteer's maintenance reads away, so without policies of
-- their own the role would open an empty board. Each policy asks the cell, never a role name,
-- and is additive: admin, management and staff keep the policies they have (R5 converts them),
-- and none of those roles' answers change, because their cells already say what the old
-- policies did. The volunteer holds no maintenance cell (0134), so it gains nothing.
--
--   maintenance            select (read) / insert / update (edit). NO delete policy: she creates,
--                          changes and completes jobs; removing one for good stays Admin's,
--                          management's and staff's.
--   maintenance_assignees  select (read) / insert / update / delete (edit): a job's team is
--                          rewritten as a set (setAssignees), so removing a member is part of
--                          assigning.
--   translations           select, for table_name = 'maintenance' only, on maintenance.jobs read:
--                          the Thai title of a job she can already read. The table holds prose
--                          for residents and projects too, so the row filter is the point.
-- Nothing here needs a view: none of these tables carries a column she should not see.
--
-- recurring_* reads (section 5): the volunteer lost them and record_recurring_job() in 0134
-- together with recurring.do_own, so the cell she is given means nothing until they ask it.
--
-- Written to be safely re-runnable. To undo: drop the eleven policies below, restore the guard
-- of record_recurring_job() from 0134, delete the role's role_permissions rows and the role row.

-- ---------------------------------------------------------------------------
-- 1. The role and its cells
-- ---------------------------------------------------------------------------
insert into roles (key, name, name_th, kind, opens_app, home_path, legacy_role,
                   scope_residents, scope_clinical, scope_contacts, scope_photos, sees_login_emails)
values ('head_of_maintenance', 'Head of Maintenance', 'หัวหน้าฝ่ายซ่อมบำรุง', 'custom', true, '/home', 'volunteer',
        'all', 'any', 'name_type', 'medical_only', false)
on conflict (key) do nothing;

insert into role_permissions (role_id, activity, level)
select r.id, c.activity, c.level
  from roles r
  cross join (values ('maintenance.jobs', 2), ('maintenance.progress', 2), ('recurring.do_own', 2),
                     ('resident.record', 1), ('facility.enclosures', 1)) as c(activity, level)
 where r.key = 'head_of_maintenance'
on conflict (role_id, activity) do nothing;

-- ---------------------------------------------------------------------------
-- 2. The jobs
-- ---------------------------------------------------------------------------
drop policy if exists maintenance_select_perm on maintenance;
create policy maintenance_select_perm on maintenance for select to authenticated
  using ((select has_permission('maintenance.jobs', 'read')));

drop policy if exists maintenance_insert_perm on maintenance;
create policy maintenance_insert_perm on maintenance for insert to authenticated
  with check ((select has_permission('maintenance.jobs')));

drop policy if exists maintenance_update_perm on maintenance;
create policy maintenance_update_perm on maintenance for update to authenticated
  using ((select has_permission('maintenance.jobs')))
  with check ((select has_permission('maintenance.jobs')));

-- ---------------------------------------------------------------------------
-- 3. A job's team
-- ---------------------------------------------------------------------------
drop policy if exists maintenance_assignees_select_perm on maintenance_assignees;
create policy maintenance_assignees_select_perm on maintenance_assignees for select to authenticated
  using ((select has_permission('maintenance.jobs', 'read')));

drop policy if exists maintenance_assignees_insert_perm on maintenance_assignees;
create policy maintenance_assignees_insert_perm on maintenance_assignees for insert to authenticated
  with check ((select has_permission('maintenance.jobs')));

drop policy if exists maintenance_assignees_update_perm on maintenance_assignees;
create policy maintenance_assignees_update_perm on maintenance_assignees for update to authenticated
  using ((select has_permission('maintenance.jobs')))
  with check ((select has_permission('maintenance.jobs')));

drop policy if exists maintenance_assignees_delete_perm on maintenance_assignees;
create policy maintenance_assignees_delete_perm on maintenance_assignees for delete to authenticated
  using ((select has_permission('maintenance.jobs')));

-- ---------------------------------------------------------------------------
-- 4. The Thai title of a job
-- ---------------------------------------------------------------------------
drop policy if exists translations_maintenance_select_perm on translations;
create policy translations_maintenance_select_perm on translations for select to authenticated
  using (table_name = 'maintenance' and (select has_permission('maintenance.jobs', 'read')));

-- ---------------------------------------------------------------------------
-- 5. Her own recurring tasks (/my)
-- ---------------------------------------------------------------------------
-- 0134 took the volunteer out of the four recurring read policies and out of
-- record_recurring_job(), together with the volunteer's recurring.do_own cell. The role
-- borrows volunteer, so the cell she is given in section 1 had nothing behind it: /my
-- would list no task and the function would refuse her. Reads and the recording now ask
-- the cell. Reading is the whole rota (staff read all of it today; /my filters to the
-- login's own tasks in code). WRITING is still only record_recurring_job(), still only for
-- a date she is assigned to, and she holds no recurring.manage, so she cannot create,
-- change or reassign one (those writes stay admin and management, by role name).
drop policy if exists recurring_jobs_select_perm on recurring_jobs;
create policy recurring_jobs_select_perm on recurring_jobs for select to authenticated
  using ((select has_permission('recurring.do_own')));

drop policy if exists recurring_job_assignees_select_perm on recurring_job_assignees;
create policy recurring_job_assignees_select_perm on recurring_job_assignees for select to authenticated
  using ((select has_permission('recurring.do_own')));

drop policy if exists recurring_job_occurrences_select_perm on recurring_job_occurrences;
create policy recurring_job_occurrences_select_perm on recurring_job_occurrences for select to authenticated
  using ((select has_permission('recurring.do_own')));

drop policy if exists recurring_job_occurrence_assignees_select_perm on recurring_job_occurrence_assignees;
create policy recurring_job_occurrence_assignees_select_perm on recurring_job_occurrence_assignees for select to authenticated
  using ((select has_permission('recurring.do_own')));

-- The live body of 0134 with one change: the guard also lets in a login that holds
-- recurring.do_own. admin, management, staff and vet pass as before; the volunteer, which no
-- longer holds the cell, is refused as before; the assignee rules below the guard are untouched.
CREATE OR REPLACE FUNCTION public.record_recurring_job(p_job_id uuid, p_occurs_on date, p_outcome text, p_note text DEFAULT NULL::text)
 RETURNS recurring_job_occurrences
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_role app_role := current_user_role();
  v_job recurring_jobs;
  v_row recurring_job_occurrences;
  v_note text := nullif(btrim(p_note), '');
begin
  if v_role is null
     or (v_role not in ('admin', 'management', 'staff', 'vet') and not has_permission('recurring.do_own')) then
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
$function$;

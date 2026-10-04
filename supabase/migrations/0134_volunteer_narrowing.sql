-- consumer: src/lib/residents/who-and-where.ts
--
-- R1, the database half (docs/roles-and-permissions.md §12; decisions/
-- 2026-10-04-volunteer-narrowing.md). The volunteer keeps who a resident is,
-- where it lives, and the enclosures. Everything else the role could read or
-- change is taken away, in the database, so no screen has to be trusted to hide it.
--
-- Nobody holds the role (Lutan, 2026-10-04: no volunteer logins on test or
-- production), so this takes rights from no one. It matters because the 2IC, the
-- Head of Maintenance and the Head of Medical borrow the volunteer's database
-- rights through roles.legacy_role: whatever stays here, all four have.
--
-- 1. resident_who_and_where, the one view of a resident a volunteer reads.
-- 2. The volunteer's row policies are dropped (40 name the role); the ones that
--    name it among other roles are altered to stop naming it.
-- 3. Five security definer functions stop naming 'volunteer' in their role lists.
--    A function that still named it would be a right surviving its own removal,
--    and with no login to trip over it, invisible.
-- 4. Five owner-rights views excluded only vets, so a volunteer read straight
--    through them (translation queue, immunization compliance, the whole current
--    placement with carer and notes). They now exclude volunteers too.
-- 5. volunteer_contacts is no longer granted: a volunteer loses the address book.
-- 6. The volunteer's seeded cells shrink to the three that remain, so the cells
--    and the database say the same thing (check-permission-parity.mjs).
--
-- Written to be safely re-runnable. To undo: re-create the dropped policies from
-- 0001 and the later files that name them, restore the function bodies from 0013,
-- 0091, 0095 and the views from 0108, and re-insert the cells from 0132.

-- ---------------------------------------------------------------------------
-- 1. Who and where
-- ---------------------------------------------------------------------------
-- A policy can hide a row but not a column, so "less of each row" is a view
-- (0126's pattern). Owner rights: the caller can no longer read residents. Fixed
-- column list: a column added to residents later is private until it is added here.
-- Gated on the role, so any other session gets no rows; anon gets no grant.
-- Name, photo, species, sex, status and enclosure (§5). Not breed, age, bio,
-- notes, flags, microchip, group origin, carer or any date.

create or replace view resident_who_and_where as
select r.id,
       r.name,
       r.thai_name,
       r.resident_code,
       r.species,
       r.sex,
       r.profile_photo_drive_file_id,
       s.current_status,
       e.id as enclosure_id,
       e.name as enclosure_name,
       e.name_th as enclosure_name_th,
       z.id as zone_id,
       z.name as zone_name,
       z.name_th as zone_name_th
from residents r
left join private.resident_current_state s on s.resident_id = r.id
left join enclosures e on e.id = s.current_enclosure_id
left join zones z on z.id = e.zone_id
where current_user_role() = 'volunteer';

comment on view resident_who_and_where is
  'A volunteer''s whole view of a resident: who it is and where it lives (0134, §5 and §12 R1). Rows for a volunteer session only. A new residents column is private to volunteers until it is added here.';

revoke all on resident_who_and_where from anon, authenticated, service_role;
grant select on resident_who_and_where to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. The volunteer's policies
-- ---------------------------------------------------------------------------
-- Kept: volunteer_read_enclosures, volunteer_read_zones (where a resident lives).

drop policy if exists volunteer_read_residents on residents;
drop policy if exists volunteer_insert_assistant_actions on assistant_actions;
drop policy if exists volunteer_read_assistant_actions on assistant_actions;
drop policy if exists volunteer_rw_attachments on attachments;
drop policy if exists volunteer_read_blood_test_types on blood_test_types;
drop policy if exists volunteer_read_blood_tests on blood_tests;
drop policy if exists volunteer_read_diet_types on diet_types;
drop policy if exists volunteer_read_frequency on frequency;
drop policy if exists volunteer_read_group_origins on group_origins;
drop policy if exists volunteer_read_immunization_records on immunization_records;
drop policy if exists volunteer_read_immunization_types on immunization_types;
drop policy if exists volunteer_read_maintenance on maintenance;
drop policy if exists volunteer_read_maintenance_assignees on maintenance_assignees;
drop policy if exists volunteer_rw_maintenance_photos on maintenance_photos;
drop policy if exists volunteer_read_medication on medication;
drop policy if exists volunteer_insert_change_enclosure on placement_history;
drop policy if exists volunteer_read_placement_history on placement_history;
drop policy if exists volunteer_read_prescriptions on prescriptions;
drop policy if exists volunteer_read_procedure_types on procedure_types;
drop policy if exists volunteer_read_procedures on procedures;
drop policy if exists volunteer_read_project_folders on project_folders;
drop policy if exists volunteer_rw_project_photos on project_photos;
drop policy if exists volunteer_read_resident_diets on resident_diets;
drop policy if exists volunteer_read_shelter_friends on shelter_friends;
drop policy if exists volunteer_read_translations on translations;
drop policy if exists volunteer_read_vet_appointments on vet_appointments;
drop policy if exists volunteer_read_vet_doctor_clinics on vet_doctor_clinics;
drop policy if exists volunteer_read_vet_doctors on vet_doctors;
drop policy if exists volunteer_read_vets on vets;
drop policy if exists volunteer_read_weight on weight;

-- Policies that name the volunteer among other roles keep their name and lose the volunteer.
alter policy resident_roles_read_adoption_updates on adoption_updates
  using ((current_user_role() = any (array['admin', 'management', 'staff']::app_role[]))
         or ((current_user_role() = 'vet'::app_role) and (resident_id in (select current_vet_resident_ids()))));
alter policy stock_roles_read_item_unit_conversions on item_unit_conversions
  using (current_user_role() = any (array['admin', 'management', 'staff']::app_role[]));
alter policy stock_roles_read_stock_counts on stock_counts
  using (current_user_role() = any (array['admin', 'management', 'staff']::app_role[]));
alter policy stock_roles_read_stock_receipts on stock_receipts
  using (current_user_role() = any (array['admin', 'management', 'staff']::app_role[]));
alter policy staff_roles_read_recurring_jobs on recurring_jobs
  using (current_user_role() = any (array['admin', 'management', 'staff', 'vet']::app_role[]));
alter policy staff_roles_read_recurring_job_assignees on recurring_job_assignees
  using (current_user_role() = any (array['admin', 'management', 'staff', 'vet']::app_role[]));
alter policy staff_roles_read_recurring_job_occurrences on recurring_job_occurrences
  using (current_user_role() = any (array['admin', 'management', 'staff', 'vet']::app_role[]));
alter policy staff_roles_read_recurring_job_occurrence_assignees on recurring_job_occurrence_assignees
  using (current_user_role() = any (array['admin', 'management', 'staff', 'vet']::app_role[]));

-- ---------------------------------------------------------------------------
-- 3. The five function role lists
-- ---------------------------------------------------------------------------
-- Bodies are the live ones with 'volunteer' removed from the list and nothing else.
-- reassign_recurring_job() also says 'volunteer', but only as who a date may be
-- handed to ("someone who can still sign in"); it grants the volunteer nothing.

CREATE OR REPLACE FUNCTION public.delete_resident_photo(p_attachment_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_owner_id uuid;
  v_drive_file_id text;
  v_was_profile boolean;
  v_fallback text;
begin
  if current_user_role() is null
     or current_user_role() not in ('admin', 'management', 'staff') then
    raise exception 'Not authorized to remove attachments.';
  end if;

  select owner_id, drive_file_id into v_owner_id, v_drive_file_id
  from attachments
  where id = p_attachment_id and owner_type = 'resident';

  if v_owner_id is null then
    raise exception 'Photo not found.';
  end if;

  select (profile_photo_drive_file_id = v_drive_file_id) into v_was_profile
  from residents where id = v_owner_id;

  delete from attachments where id = p_attachment_id;

  if v_was_profile then
    select drive_file_id into v_fallback
    from attachments
    where owner_type = 'resident' and owner_id = v_owner_id
    order by uploaded_at asc
    limit 1;

    update residents set profile_photo_drive_file_id = v_fallback where id = v_owner_id;
  end if;

  return v_drive_file_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.record_attachment(p_owner_type attachment_owner_type, p_owner_id uuid, p_drive_file_id text, p_file_name text DEFAULT NULL::text, p_sub_folder text DEFAULT NULL::text, p_date_taken date DEFAULT NULL::date, p_adoption_update_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(attachment attachments, is_profile boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_attachment attachments;
  v_is_profile boolean := false;
begin
  if current_user_role() is null
     or current_user_role() not in ('admin', 'management', 'staff', 'vet') then
    raise exception 'Not authorized to add attachments.';
  end if;

  if current_user_role() = 'vet'
     and p_owner_type in ('resident', 'blood_test', 'procedure')
     and not coalesce(
       attachment_resident_id(p_owner_type, p_owner_id) in (select current_vet_resident_ids()),
       false
     ) then
    raise exception 'Not authorized to add attachments.';
  end if;

  -- 0110: a file on another clinic's blood test or procedure is not the
  -- vet's to add. Definer, so the policies above do not reach here.
  if current_user_role() = 'vet' and not vet_can_write_attachment(p_owner_type, p_owner_id) then
    raise exception 'Not authorized to add attachments.';
  end if;

  if p_adoption_update_id is not null and not exists (
    select 1 from adoption_updates u
     where u.id = p_adoption_update_id
       and p_owner_type = 'resident'
       and u.resident_id = p_owner_id
  ) then
    raise exception 'That adoption update is not about this resident.';
  end if;

  insert into attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name, date_taken, uploaded_by, adoption_update_id)
  values (p_owner_type, p_owner_id, p_sub_folder, p_drive_file_id, p_file_name, p_date_taken, auth.uid(), p_adoption_update_id)
  returning * into v_attachment;

  if p_owner_type = 'resident' then
    update residents
    set profile_photo_drive_file_id = p_drive_file_id
    where id = p_owner_id
      and profile_photo_drive_file_id is null;

    if found then
      v_is_profile := true;
    end if;
  end if;

  return query select v_attachment, v_is_profile;
end;
$function$;

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
  if v_role is null or v_role not in ('admin', 'management', 'staff', 'vet') then
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

CREATE OR REPLACE FUNCTION public.record_stocktake(p_medication jsonb DEFAULT NULL::jsonb, p_diet_types jsonb DEFAULT NULL::jsonb)
 RETURNS TABLE(medication_updated integer, diet_types_updated integer, counted_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_lists jsonb := jsonb_build_object(
    'medication', coalesce(p_medication, '[]'::jsonb),
    'diet_types', coalesce(p_diet_types, '[]'::jsonb)
  );
  v_kind text;
  v_label text;
  v_bad integer;
  v_repeated integer;
  v_med integer := 0;
  v_diet integer := 0;
  v_stocktake uuid := gen_random_uuid();
begin
  if current_user_role() is null
     or current_user_role() not in ('admin', 'management', 'staff') then
    raise exception 'Not authorized to record a stocktake.';
  end if;

  foreach v_kind in array array['medication', 'diet_types'] loop
    v_label := case v_kind when 'medication' then 'medication' else 'diet type' end;
    if jsonb_typeof(v_lists -> v_kind) <> 'array' then
      raise exception 'The % counts must be a list.', v_label;
    end if;
    if exists (
      select 1 from jsonb_array_elements(v_lists -> v_kind) e
       where jsonb_typeof(e) <> 'object'
          or jsonb_typeof(e -> 'id') is distinct from 'string'
          or (e ->> 'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          or jsonb_typeof(e -> 'count') is distinct from 'number'
    ) then
      raise exception 'Every % count needs an id and a number. Leave out an item that was not counted.', v_label;
    end if;
    select count(*) filter (where (e ->> 'count')::numeric < 0),
           count(*) - count(distinct (e ->> 'id')::uuid)
      into v_bad, v_repeated
      from jsonb_array_elements(v_lists -> v_kind) e;
    if v_bad > 0 then
      raise exception 'A stock count cannot be negative.';
    end if;
    if v_repeated > 0 then
      raise exception 'The same % is listed twice.', v_label;
    end if;
    -- Optional "entered": when present it must be well-formed and add up to
    -- count, the same rule the stock_counts CHECK would enforce, raised here
    -- first so the message names the problem.
    if exists (
      select 1 from jsonb_array_elements(v_lists -> v_kind) e
       where e ? 'entered'
         and jsonb_typeof(e -> 'entered') <> 'null'
         and (units_entered_total(e -> 'entered') is null
              or abs(units_entered_total(e -> 'entered') - (e ->> 'count')::numeric)
                   > 0.000001 * greatest(1, (e ->> 'count')::numeric))
    ) then
      raise exception 'The units entered for a % count do not add up to the count.', v_label;
    end if;
  end loop;

  update medication m
     set stock_on_hand = x.count
    from jsonb_to_recordset(v_lists -> 'medication') as x(id uuid, count numeric)
   where m.id = x.id;
  get diagnostics v_med = row_count;
  if v_med <> jsonb_array_length(v_lists -> 'medication') then
    raise exception 'Stocktake not saved: % of % medications were found. Reload the page and count again.',
      v_med, jsonb_array_length(v_lists -> 'medication');
  end if;

  update diet_types d
     set stock_on_hand = x.count
    from jsonb_to_recordset(v_lists -> 'diet_types') as x(id uuid, count numeric)
   where d.id = x.id;
  get diagnostics v_diet = row_count;
  if v_diet <> jsonb_array_length(v_lists -> 'diet_types') then
    raise exception 'Stocktake not saved: % of % diet types were found. Reload the page and count again.',
      v_diet, jsonb_array_length(v_lists -> 'diet_types');
  end if;

  insert into stock_counts
    (stocktake_id, item_kind, medication_id, counted_quantity, unit, counted_at, counted_by, entered)
  select v_stocktake, 'medication', m.id, m.stock_on_hand, m.dose_unit, now(), auth.uid(),
         case when jsonb_typeof(x.entered) = 'array' then x.entered end
    from jsonb_to_recordset(v_lists -> 'medication') as x(id uuid, entered jsonb)
    join medication m on m.id = x.id;

  insert into stock_counts
    (stocktake_id, item_kind, diet_type_id, counted_quantity, unit, counted_at, counted_by, entered)
  select v_stocktake, 'diet_type', d.id, d.stock_on_hand, d.unit, now(), auth.uid(),
         case when jsonb_typeof(x.entered) = 'array' then x.entered end
    from jsonb_to_recordset(v_lists -> 'diet_types') as x(id uuid, entered jsonb)
    join diet_types d on d.id = x.id;

  return query select v_med, v_diet, now();
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_resident_profile_photo(p_resident_id uuid, p_drive_file_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if current_user_role() is null
     or current_user_role() not in ('admin', 'management', 'staff') then
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

  update residents
  set profile_photo_drive_file_id = p_drive_file_id
  where id = p_resident_id;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 4. Views that excluded only vets
-- ---------------------------------------------------------------------------

create or replace view current_placement as
 SELECT id,
    resident_id,
    placement_type,
    start_date,
    end_date,
    zone_id,
    enclosure_id,
    previous_enclosure_id,
    carer_id,
    notes,
    created_by,
    created_at
   FROM private.current_placement
  WHERE (private.has_app_access() AND (current_user_role() IS DISTINCT FROM 'volunteer'::app_role) AND ((current_user_role() IS DISTINCT FROM 'vet'::app_role) OR (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))));

create or replace view immunization_compliance as
 SELECT resident_id,
    resident_name,
    immunization_type_id,
    immunization_type_name
   FROM private.immunization_compliance
  WHERE (private.has_app_access() AND (current_user_role() IS DISTINCT FROM 'volunteer'::app_role) AND ((current_user_role() IS DISTINCT FROM 'vet'::app_role) OR (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))));

create or replace view immunization_duplicate_check as
 SELECT resident_id,
    immunization_type_id,
    date_administered,
    count
   FROM private.immunization_duplicate_check
  WHERE (private.has_app_access() AND (current_user_role() IS DISTINCT FROM 'volunteer'::app_role) AND ((current_user_role() IS DISTINCT FROM 'vet'::app_role) OR (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))));

create or replace view resident_current_state as
 SELECT resident_id,
    name,
    current_placement_id,
    current_enclosure_id,
    current_zone_id,
    current_carer_id,
    active_hospital_previous_enclosure,
    current_status,
    is_deceased,
    date_of_death
   FROM private.resident_current_state
  WHERE (private.has_app_access() AND (current_user_role() IS DISTINCT FROM 'volunteer'::app_role) AND ((current_user_role() IS DISTINCT FROM 'vet'::app_role) OR (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))));

create or replace view translation_queue as
 SELECT id,
    table_name,
    row_id,
    column_name,
    tier,
    source_lang,
    target_lang,
    source_text,
    reviewed_source_text,
    text,
    status,
    engine,
    reviewed_by,
    reviewed_at,
    created_at,
    updated_at,
    record_label,
    record_path
   FROM private.translation_queue
  WHERE (private.has_app_access() AND (current_user_role() IS DISTINCT FROM 'volunteer'::app_role) AND ((current_user_role() IS DISTINCT FROM 'vet'::app_role) OR (table_name <> 'residents'::text) OR (row_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))));

-- The grants are already what they were (create or replace keeps them); restated because the
-- migration-grants lint wants every view this file creates to say who reads it.
grant select on current_placement, immunization_compliance, immunization_duplicate_check,
  resident_current_state, translation_queue to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. The address book
-- ---------------------------------------------------------------------------
-- Lutan, 2026-10-03: a volunteer loses the contacts' names and phones. The view
-- stays (it is the "name and phone" scope for a role that is given it later) but
-- no session may read it; a grant is one statement.

revoke select on volunteer_contacts from authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6. The seeded cells
-- ---------------------------------------------------------------------------
-- What the volunteer keeps: a resident (who and where), the enclosures, the map.
-- Every other volunteer cell is deleted. Re-run after a shelter has re-granted
-- one in Settings and it goes again; this file is a one-time narrowing, not a
-- standing rule.

delete from role_permissions
 where role_id = (select id from roles where key = 'volunteer')
   and activity not in ('resident.record', 'facility.enclosures', 'facility.map');

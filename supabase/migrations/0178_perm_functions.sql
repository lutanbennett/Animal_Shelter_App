-- consumer: src/app/stocktake/actions.ts, src/app/management/medications/actions.ts, src/app/management/diets/actions.ts, src/app/management/recurring-jobs/actions.ts, src/app/api/residents/[id]/photos/route.ts, src/app/api/medical/residents/[id]/photos/route.ts, src/app/api/blood-tests/[id]/attachments/route.ts, src/app/api/procedures/[id]/attachments/route.ts, src/lib/archive/archive-deceased-resident.ts, src/app/residents/[id]/microchip/actions.ts, src/app/admin/diets/actions.ts, src/lib/placements/deceased.ts, src/app/management/clinics/[id]/doctors/actions.ts, src/lib/contacts/visibility.ts
--
-- perm-functions-schema: the functions that decided who may do something by the role's NAME now ask the
-- role's cells (has_permission()), or, for a clinic login, its scope (is_clinic_login(), as 0167 did for the
-- policies). docs/decisions/2026-10-11-perm-functions-schema.md has the count, the activity chosen for each
-- function, and every change in who may do what.
--
-- Why it matters: a gate that names a role is answered by user_roles.role, the enum. A configured role that
-- borrows the management enum then got Management's powers here whatever its cells said, and a gate naming
-- 'staff' (retired by 0173) is never matched by anyone. Each gate below asks the activity the function
-- actually performs: the one the app already checks before calling it, so the database and the screen agree.
--
-- Who may do what changes in four places (all on dev 2026-10-11; the decision file has the detail):
--   set_standard_diet       Management loses it. The page is Admin-only since 2026-10-08 and asks
--                           reference.types + stock.diets; the function still let Management in.
--   record_deceased_archive the 2IC gains it. A 2IC may record a death (placement.death) but the Drive filing
--                           that follows was refused, so it stuck half-done. Lutan agreed in chat, 2026-10-11.
--   record_recurring_job    a doctor loses it. The enum let any doctor in; no doctor has recurring.do_own and
--                           the app never offers them My jobs.
--   record_attachment       a doctor loses maintenance and project files (never called that way); a role with
--                           maintenance.photos may now file a maintenance photo here, which the attachments
--                           insert policy already lets it do directly.
--
-- Same signatures, same security mode and search_path as before, so nothing that calls them changes.
-- Re-runnable: create or replace throughout.
--
-- Left for perm-drop-enum (each still reads the enum or legacy_role): current_user_role(), user_roles.role,
-- user_roles_sync_role_id(), private.has_app_access(), has_shelter_floor(), sees_all_residents(),
-- sees_all_contacts(), and in views the 'volunteer' tests, private.app_users' email mask,
-- resident_who_and_where and recurring_job_staffing.

-- 1. Stock --------------------------------------------------------------------------------------------------

create or replace function public.record_stocktake(p_medication jsonb DEFAULT NULL::jsonb, p_diet_types jsonb DEFAULT NULL::jsonb)
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
  -- 0178: the stocktake page's own cell, not a role name.
  if not coalesce((select has_permission('stock.count')), false) then
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

create or replace function public.record_stock_correction(p_kind text, p_id uuid, p_count numeric)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_at timestamptz;
  v_unit text;
  v_found integer;
begin
  -- 0178: correcting a figure is stock.correct, on the list it belongs to (the paper's manage-medications /
  -- manage-diets, and what the two pages ask). Both, so a role with stock.correct alone (the 2IC) is not
  -- let in to a list it cannot open.
  if not (coalesce((select has_permission('stock.correct')), false)
          and coalesce(case p_kind when 'medication' then (select has_permission('stock.medications'))
                                   when 'diet_type' then (select has_permission('stock.diets')) end, false)) then
    raise exception 'Not authorized to edit stock.';
  end if;
  if p_kind not in ('medication', 'diet_type') then
    raise exception 'Unknown item kind.';
  end if;
  if p_count is not null and p_count < 0 then
    raise exception 'A stock count cannot be negative.';
  end if;

  if p_kind = 'medication' then
    update medication set stock_on_hand = p_count where id = p_id
      returning stock_counted_at, dose_unit into v_at, v_unit;
  else
    update diet_types set stock_on_hand = p_count where id = p_id
      returning stock_counted_at, unit into v_at, v_unit;
  end if;
  get diagnostics v_found = row_count;
  if v_found = 0 then
    raise exception 'That item was not found. Reload the page and try again.';
  end if;

  if p_count is not null then
    insert into stock_counts
      (stocktake_id, item_kind, medication_id, diet_type_id, counted_quantity, unit, counted_at, counted_by, source)
    values
      (gen_random_uuid(), p_kind,
       case when p_kind = 'medication' then p_id end,
       case when p_kind = 'diet_type' then p_id end,
       p_count, v_unit, v_at, auth.uid(), 'correction');
  end if;

  return v_at;
end;
$function$;

create or replace function public.set_standard_diet(p_diet_type_id uuid)
 RETURNS diet_types
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_row diet_types;
begin
  -- 0178: Settings -> Diets is Admin-only by activities since 2026-10-08 (src/lib/permissions/item-settings.ts):
  -- the setup-lists cell and the diet list's own. Management no longer gets in by its name.
  if not (coalesce((select has_permission('reference.types')), false)
          and coalesce((select has_permission('stock.diets')), false)) then
    raise exception 'Not authorized to change the standard diet.';
  end if;

  if p_diet_type_id is null then
    raise exception 'Choose a diet type to make the standard.';
  end if;

  update diet_types set is_standard = false
   where is_standard and id <> p_diet_type_id;

  update diet_types set is_standard = true
   where id = p_diet_type_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'That diet type was not found. Reload the page and try again.';
  end if;

  return v_row;
end;
$function$;

-- 2. Recurring jobs -----------------------------------------------------------------------------------------

create or replace function public.record_recurring_job(p_job_id uuid, p_occurs_on date, p_outcome text, p_note text DEFAULT NULL::text)
 RETURNS recurring_job_occurrences
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_any boolean := coalesce((select has_permission('recurring.do_any')), false);
  v_job recurring_jobs;
  v_row recurring_job_occurrences;
  v_note text := nullif(btrim(p_note), '');
begin
  -- 0178: recurring.do_own records your own dates, recurring.do_any anyone's. Was the enum, which let every
  -- doctor in and let a role borrowing management record any job whatever its cells.
  if not (v_any or coalesce((select has_permission('recurring.do_own')), false)) then
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
  -- job's usual ones. recurring.do_any may record any job.
  if not v_any then
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

create or replace function public.reassign_recurring_job(p_job_id uuid, p_occurs_on date, p_user_ids uuid[], p_note text DEFAULT NULL::text)
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
  -- "Can still sign in": a live login whose live role opens the app (0178; was an enum list that named the
  -- retired 'staff' and left out only public_viewer, the one role with opens_app false).
  select count(*) into v_ok
    from user_roles ur
    join roles r on r.id = ur.role_id and r.archived_at is null
   where ur.user_id = any (v_ids)
     and ur.archived_at is null
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
$function$;

-- 3. Residents: files, microchip, death ---------------------------------------------------------------------

create or replace function public.record_attachment(p_owner_type attachment_owner_type, p_owner_id uuid, p_drive_file_id text, p_file_name text DEFAULT NULL::text, p_sub_folder text DEFAULT NULL::text, p_date_taken date DEFAULT NULL::date, p_adoption_update_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(attachment attachments, is_profile boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_attachment attachments;
  v_is_profile boolean := false;
  v_clinic boolean := coalesce((select is_clinic_login()), false);
  v_allowed boolean;
begin
  -- 0178: the cell attachments_insert_perm asks for the same owner type, so this definer function lets in no
  -- more than a direct insert would. A resident photo keeps sees_all_clinical() (0140), which unlike the
  -- policy's sees_all_residents() is true for a role borrowing volunteer (Head of Medical files photos here).
  -- A clinic login keeps its three clinical kinds, limited to its own clinic below (0167's scope, not a cell).
  v_allowed := case p_owner_type
    when 'resident' then coalesce((select has_permission('photos.resident_add')), false)
                         and coalesce((select sees_all_clinical()), false)
    when 'blood_test' then coalesce((select has_permission('medical.blood_tests')), false)
                           and coalesce((select sees_all_clinical()), false)
    when 'procedure' then coalesce((select has_permission('medical.procedures')), false)
                          and coalesce((select sees_all_clinical()), false)
    when 'maintenance' then coalesce((select has_permission('maintenance.photos')), false)
    when 'project' then coalesce((select has_permission('projects.photos')), false)
    else false
  end
  or (v_clinic and p_owner_type in ('resident', 'blood_test', 'procedure'));

  if not v_allowed then
    raise exception 'Not authorized to add attachments.';
  end if;

  -- A5: a resident photo outside the Medical folder is published (0101), so it is filed only by a
  -- login that may publish. An adopter's photo has a folder of its own choosing, so the same.
  -- Everyone, not only the login that arrived by its cell: a doctor's own login used by hand could
  -- otherwise file under any folder.
  if p_owner_type = 'resident'
     and not (select can_publish_resident_photos())
     and (p_adoption_update_id is not null
          or lower(btrim(coalesce(p_sub_folder, ''))) <> 'medical') then
    raise exception 'This login can add photos to the Medical folder only.';
  end if;

  if v_clinic
     and p_owner_type in ('resident', 'blood_test', 'procedure')
     and not coalesce(
       attachment_resident_id(p_owner_type, p_owner_id) in (select current_clinic_resident_ids()),
       false
     ) then
    raise exception 'Not authorized to add attachments.';
  end if;

  -- 0110: a file on another clinic's blood test or procedure is not the
  -- doctor's to add. Definer, so the policies above do not reach here.
  if v_clinic and not doctor_can_write_attachment(p_owner_type, p_owner_id) then
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

create or replace function public.set_resident_microchip(p_resident_id uuid, p_number text, p_implanted_on date DEFAULT NULL::date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not (select has_permission('resident.microchip')) then
    raise exception 'Not authorized to set a microchip.'
      using errcode = 'insufficient_privilege';
  end if;

  -- 0178: a clinic login, by its scope (0167), not the doctor role's name.
  if coalesce((select is_clinic_login()), false)
     and p_resident_id not in (select current_clinic_resident_ids()) then
    raise exception 'Not authorized to set a microchip for this resident.'
      using errcode = 'insufficient_privilege';
  end if;

  if not exists (select 1 from residents where id = p_resident_id) then
    raise exception 'Resident not found.' using errcode = 'no_data_found';
  end if;

  if resident_is_deceased(p_resident_id) then
    raise exception 'This resident is deceased — their record is read-only.'
      using errcode = 'restrict_violation';
  end if;

  update residents
     set microchip_number = p_number,
         microchip_implanted_on = p_implanted_on
   where id = p_resident_id;
end;
$function$;

create or replace function public.record_deceased_archive(p_resident_id uuid, p_drive_folder_id text DEFAULT NULL::text, p_summary_drive_file_id text DEFAULT NULL::text, p_index_drive_file_id text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_summary text;
  v_index text;
begin
  -- 0178: filing a death in Drive is the second half of recording it, so it asks the same cell the record-death
  -- and retry actions ask (placement.death). Was admin/management/staff by name, which refused a 2IC who had
  -- just recorded a death and left the archive half-done (Lutan agreed the 2IC gains this, 2026-10-11).
  if not coalesce((select has_permission('placement.death')), false) then
    raise exception 'Not authorized to archive a deceased resident.';
  end if;

  if not resident_is_deceased(p_resident_id) then
    raise exception 'This resident is not recorded as deceased.';
  end if;

  perform set_config('app.deceased_lock_bypass', 'on', true);

  update residents
  set drive_folder_id = coalesce(p_drive_folder_id, drive_folder_id),
      deceased_summary_drive_file_id =
        coalesce(p_summary_drive_file_id, deceased_summary_drive_file_id),
      deceased_index_drive_file_id =
        coalesce(p_index_drive_file_id, deceased_index_drive_file_id)
  where id = p_resident_id
  returning deceased_summary_drive_file_id, deceased_index_drive_file_id
  into v_summary, v_index;

  -- Only a complete archive counts as archived; a partial one stays flagged
  -- for retry.
  if v_summary is not null and v_index is not null then
    update residents set deceased_archived_at = now() where id = p_resident_id;
  end if;

  perform set_config('app.deceased_lock_bypass', 'off', true);
end;
$function$;

create or replace function public.undo_deceased_placement(p_resident_id uuid, p_reason text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_death placement_history%rowtype;
  v_prior placement_history%rowtype;
  v_cascade jsonb;
  v_id uuid;
begin
  -- 0178: the withdraw page's cell (placement.death_withdraw), which only Admin holds today.
  if not coalesce((select has_permission('placement.death_withdraw')), false) then
    raise exception 'Only an admin can withdraw a recorded death.';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'Say why the death was recorded in error.';
  end if;

  select * into v_death
  from placement_history
  where resident_id = p_resident_id
    and placement_type = 'Deceased'
    and end_date is null
  limit 1;
  if not found then
    raise exception 'This resident is not recorded as deceased.';
  end if;

  -- The placement the death closed: where they were, and with whom.
  select * into v_prior
  from placement_history
  where resident_id = p_resident_id
    and start_date < v_death.start_date
  order by start_date desc
  limit 1;
  if not found then
    raise exception 'There is no earlier placement to return this resident to.';
  end if;

  -- close_prior_placement() ends the Deceased row as part of this insert,
  -- and its UPDATE runs while the resident still counts as deceased, so
  -- the lock has to stand aside for it. Off again straight after: from
  -- then on the resident is alive and the ordinary rules apply.
  perform set_config('app.deceased_lock_bypass', 'on', true);

  insert into placement_history (
    resident_id, placement_type, start_date, zone_id, enclosure_id,
    previous_enclosure_id, carer_id, notes, created_by
  ) values (
    p_resident_id, 'DeceasedInError', now(), v_prior.zone_id, v_prior.enclosure_id,
    -- "Deceased → Kennel 3" in the housing history; but a resident sent
    -- back into hospital keeps the kennel they'd return to, which is what
    -- the hub reads previous_enclosure_id as while they're hospitalised.
    case
      when v_prior.placement_type = 'SendToHospital' then v_prior.previous_enclosure_id
      else v_death.enclosure_id
    end,
    v_prior.carer_id, btrim(p_reason), auth.uid()
  )
  returning id into v_id;

  perform set_config('app.deceased_lock_bypass', 'off', true);

  -- Put back what the cascade did, and only that. Deaths recorded before
  -- this migration have no snapshot; their cascade stays as it is.
  v_cascade := coalesce(v_death.deceased_cascade, '{}'::jsonb);

  -- A death recorded before 0172 stored the visits under 'vet_appointments'.
  update clinic_visits cv
  set status = 'scheduled'
  from jsonb_array_elements_text(coalesce(v_cascade -> 'clinic_visits', v_cascade -> 'vet_appointments', '[]'::jsonb)) as s(id)
  where cv.id = s.id::uuid
    and cv.status = 'cancelled';

  update prescriptions p
  set end_date = (s.item ->> 'end_date')::date
  from jsonb_array_elements(coalesce(v_cascade -> 'prescriptions', '[]'::jsonb)) as s(item)
  where p.id = (s.item ->> 'id')::uuid;

  if coalesce((v_cascade ->> 'ready_for_adoption')::boolean, false) then
    update residents set ready_for_adoption = true where id = p_resident_id;
  end if;

  return v_id;
end;
$function$;

-- 4. Doctors and the clinic scope ---------------------------------------------------------------------------

create or replace function public.merge_doctors(p_from uuid, p_into uuid)
 RETURNS doctors
 LANGUAGE plpgsql
AS $function$
declare
  v_from doctors;
  v_into doctors;
  v_bypass text := coalesce(current_setting('app.deceased_lock_bypass', true), '');
begin
  -- 0178: a clinic's doctors are clinics.doctors; a clinic login keeps its own clinic's (0167's scope, and the
  -- doctors policies still decide which rows it reaches). Was a list naming the retired 'staff'.
  if not (coalesce((select has_permission('clinics.doctors')), false)
          or coalesce((select is_clinic_login()), false)) then
    raise exception 'Not allowed to merge doctors.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_from from doctors where id = p_from;
  select * into v_into from doctors where id = p_into;
  if v_from.id is null or v_into.id is null then
    raise exception 'Doctor not found.' using errcode = 'no_data_found';
  end if;
  if v_from.id = v_into.id then
    return v_into;
  end if;
  if v_from.user_id is not null and v_into.user_id is not null then
    raise exception 'Both doctors have a login; they cannot be merged.' using errcode = 'check_violation';
  end if;
  if (v_from.user_id is not null or v_into.user_id is not null)
     and not coalesce((select is_admin()), false) then
    raise exception 'Only an admin can merge a doctor who has a login.' using errcode = 'insufficient_privilege';
  end if;

  -- Two rows for one person usually share a name, and p_into's link at a clinic p_from also works at would
  -- then clash with p_from's own on (clinic_id, name_key). p_from's links go in a placeholder key first; they
  -- are deleted with p_from below.
  update doctor_clinics set name_key = 'merging ' || p_from where doctor_id = p_from;

  insert into doctor_clinics (clinic_id, doctor_id, active)
    select c.clinic_id, p_into, c.active from doctor_clinics c where c.doctor_id = p_from
    on conflict (clinic_id, doctor_id) do nothing;

  perform set_config('app.deceased_lock_bypass', 'on', true);
  update clinic_visits set doctor_id = p_into where doctor_id = p_from;
  perform set_config('app.deceased_lock_bypass', v_bypass, true);

  if v_from.user_id is not null then
    update doctors set user_id = null where id = p_from;
    update doctors set user_id = v_from.user_id where id = p_into;
  end if;

  delete from doctors where id = p_from;
  -- 0147: a delete the policy filters out is not an error, so without this a caller who may book a visit but not
  -- remove a doctor (visit.book lets them add one) would leave a half-merge. Raising rolls the whole merge back.
  if not found then
    raise exception 'Not allowed to merge doctors.' using errcode = 'insufficient_privilege';
  end if;
  select * into v_into from doctors where id = p_into;
  return v_into;
end;
$function$;

create or replace function public.doctors_guard_login()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if tg_op = 'INSERT' and new.user_id is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.user_id is not distinct from old.user_id then
    return new;
  end if;
  -- 0178: is_admin() (the admin role's key, 0153), not the enum. Nested so it is only asked of a signed-in
  -- caller: the service role has no auth.uid() and passes, as before.
  if auth.uid() is not null then
    if not coalesce((select is_admin()), false)
       or (select auth.jwt() ->> 'aal') is distinct from 'aal2' then
      raise exception 'Only an admin signed in with two-step verification can link a doctor to a login.'
        using errcode = 'insufficient_privilege';
    end if;
  end if;
  return new;
end;
$function$;

create or replace function public.clinic_login_may_edit_doctor(p_doctor uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  -- 0178: the clinic scope (0167), not the doctor role's name.
  select coalesce((select is_clinic_login()), false)
     and not exists (
       select 1 from doctor_clinics c
        where c.doctor_id = p_doctor and c.clinic_id <> all ((select current_user_clinic_ids())::uuid[])
     )
     and not exists (
       select 1 from doctors d
        where d.id = p_doctor and d.user_id is not null and d.user_id <> auth.uid()
     );
$function$;

-- The two clinic-scope helpers every clinic-limited policy reaches. Same test, by scope instead of role name;
-- is_clinic_login() itself is the 0167 function, written against roles.scope_clinical.
create or replace function public.current_user_clinic_ids()
 RETURNS uuid[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(array_agg(distinct c.clinic_id), '{}'::uuid[])
    from doctors d
    join doctor_clinics c on c.doctor_id = d.id
   where d.user_id = auth.uid() and c.active
     and (select is_clinic_login());
$function$;

create or replace function public.current_doctor_resident_ids()
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select current_clinic_resident_ids()
  union
  select cv.resident_id
    from clinic_visits cv
    join doctors d on d.id = cv.doctor_id
   where d.user_id = auth.uid()
     and cv.archived_at is null
     and (select is_clinic_login());
$function$;

-- 5. Views: the clinic-login test only ----------------------------------------------------------------------
-- These decide who reads rows at all (a "who may" test), so their role tests are converted where a scope says
-- the same thing: "is a doctor" becomes is_clinic_login(). The 'volunteer' test beside it has no cell or
-- scope that says "not on the shelter floor" yet (has_shelter_floor() itself reads the enum), so it stays for
-- perm-drop-enum. Same columns, same order: create or replace view keeps grants and dependants.

create or replace view public.doctor_contacts as
 SELECT id,
    name,
    type
   FROM contacts
  WHERE COALESCE(( SELECT is_clinic_login() AS is_clinic_login), false);

create or replace view public.current_placement as
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
  WHERE private.has_app_access() AND current_user_role() IS DISTINCT FROM 'volunteer'::app_role AND (NOT COALESCE(( SELECT is_clinic_login() AS is_clinic_login), false) OR (resident_id IN ( SELECT current_doctor_resident_ids() AS current_doctor_resident_ids)));

create or replace view public.immunization_compliance as
 SELECT resident_id,
    resident_name,
    immunization_type_id,
    immunization_type_name
   FROM private.immunization_compliance
  WHERE private.has_app_access() AND current_user_role() IS DISTINCT FROM 'volunteer'::app_role AND (NOT COALESCE(( SELECT is_clinic_login() AS is_clinic_login), false) OR (resident_id IN ( SELECT current_doctor_resident_ids() AS current_doctor_resident_ids)));

create or replace view public.immunization_duplicate_check as
 SELECT resident_id,
    immunization_type_id,
    date_administered,
    count
   FROM private.immunization_duplicate_check
  WHERE private.has_app_access() AND current_user_role() IS DISTINCT FROM 'volunteer'::app_role AND (NOT COALESCE(( SELECT is_clinic_login() AS is_clinic_login), false) OR (resident_id IN ( SELECT current_doctor_resident_ids() AS current_doctor_resident_ids)));

create or replace view public.resident_current_state as
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
  WHERE private.has_app_access() AND current_user_role() IS DISTINCT FROM 'volunteer'::app_role AND (NOT COALESCE(( SELECT is_clinic_login() AS is_clinic_login), false) OR (resident_id IN ( SELECT current_doctor_resident_ids() AS current_doctor_resident_ids)));

create or replace view public.translation_queue as
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
  WHERE private.has_app_access() AND current_user_role() IS DISTINCT FROM 'volunteer'::app_role AND (NOT COALESCE(( SELECT is_clinic_login() AS is_clinic_login), false) OR table_name <> 'residents'::text OR (row_id IN ( SELECT current_doctor_resident_ids() AS current_doctor_resident_ids)));

-- create or replace view keeps the grants above, but each view's are stated here so the file stands alone (the
-- grants check, 0160): select for signed-in logins and the server, nothing else. These are the grants on dev today.
revoke insert, update, delete, truncate, references, trigger on public.doctor_contacts from authenticated, anon;
revoke insert, update, delete, truncate, references, trigger on public.current_placement from authenticated, anon;
revoke insert, update, delete, truncate, references, trigger on public.immunization_compliance from authenticated, anon;
revoke insert, update, delete, truncate, references, trigger on public.immunization_duplicate_check from authenticated, anon;
revoke insert, update, delete, truncate, references, trigger on public.resident_current_state from authenticated, anon;
revoke insert, update, delete, truncate, references, trigger on public.translation_queue from authenticated, anon;
grant select on public.doctor_contacts, public.current_placement, public.immunization_compliance,
  public.immunization_duplicate_check, public.resident_current_state, public.translation_queue
  to authenticated, service_role;

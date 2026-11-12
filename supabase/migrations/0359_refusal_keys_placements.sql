-- consumer: src/lib/placements/deceased.ts, src/lib/archive/archive-deceased-resident.ts
-- #3nuwy, group 7 (placements): undo_deceased_placement and record_deceased_archive raise KEYS
-- (docs/decisions/2026-11-12-refusal-keys-group-7.md). Bodies are 0178's, unchanged but for the raise lines; who may
-- call each is exactly as before. SQLSTATE stays the default (P0001), as before. Re-runnable.
-- undo: re-apply the two bodies in 0178 in a new file.

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
    raise exception 'deceased.archive_not_allowed';
  end if;

  if not resident_is_deceased(p_resident_id) then
    raise exception 'deceased.not_deceased';
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
    raise exception 'deceased.withdraw_not_allowed';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'deceased.reason_required';
  end if;

  select * into v_death
  from placement_history
  where resident_id = p_resident_id
    and placement_type = 'Deceased'
    and end_date is null
  limit 1;
  if not found then
    raise exception 'deceased.not_deceased';
  end if;

  -- The placement the death closed: where they were, and with whom.
  select * into v_prior
  from placement_history
  where resident_id = p_resident_id
    and start_date < v_death.start_date
  order by start_date desc
  limit 1;
  if not found then
    raise exception 'deceased.no_earlier_placement';
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

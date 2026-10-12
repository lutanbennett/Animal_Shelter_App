-- consumer: src/app/api/bills/route.ts, src/app/bills/actions.ts, src/app/stock/receive/actions.ts, src/app/medical/visits/actions.ts, src/app/management/maintenance/bills/actions.ts
--
-- bills-inbox PR 1: record_attachment() (0178) learns the four bill owner types that 0188/0189 added.
-- Until now it failed closed for them. Every arm asks bill_owner_can() (0189), which asks the activity:
-- stock.delivery for a delivery, medical.visits (edit) for a clinic visit, maintenance.bills for a
-- maintenance bill, and for an inbox card any of the three (can_use_bills_inbox()).
-- maintenance_bill is added now, for the batch-3 maintenance-bills stream, so it needs no migration of its own.
-- The clinic-doctor fences are untouched: the clinic list of owner types still names only resident,
-- blood_test and procedure, and doctor_can_write_attachment() (0174) answers false for anything else, so a
-- visiting doctor gains no path to a bill. Body below is 0178's, with only the four `when` arms added.
-- Re-runnable (create or replace).

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
    when 'clinic_visit' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'stock_receipt' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'bill_inbox' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'maintenance_bill' then coalesce((select bill_owner_can(p_owner_type, true)), false)
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

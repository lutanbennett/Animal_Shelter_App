-- consumer: src/app/api/residents/[id]/photos/route.ts, src/app/api/residents/[id]/videos/start/route.ts, src/app/api/residents/[id]/videos/finish/route.ts, src/app/residents/[id]/adoption-updates/AdoptionUpdatePage.tsx, scripts/check-adoption-illustrate.mjs
--
-- adoption-illustrate-card (backlog #hdyjp). Lutan, 2026-11-04: the card that lets somebody write an adoption update
-- (adoption_news -> resident.adoption_news) must also let them illustrate it. record_attachment (last restated in 0308)
-- asked photos.resident_add/shelter_add to file at all and photos.resident_publish (can_publish_resident_photos) to file
-- anywhere but Shelter, so an adopter's file needed "put a resident's photo on the public website". That guard predates
-- 0309: adoption media now waits for approval whatever the filer holds, so publish is no longer what keeps it off the site.
--
-- ONE added path, nothing widened: a file with p_adoption_update_id set, whose update is about THIS resident, filed in
-- that update's own dated folder (YYYYMMDD of received_on), by a login holding resident.adoption_news at edit, is allowed
-- without photos.resident_add or photos.resident_publish. attachments_approval_stamp (0309) leaves it unapproved unless the
-- login can publish or approve, and public_adoption_updates / is_public_drive_file read approved_at. Every other filing,
-- the Medical guard, the Shelter-only rule and the profile-photo rule are unchanged. No card_grants row moves.
--
-- Re-runnable: create or replace, same signature.

create or replace function public.record_attachment(
  p_owner_type attachment_owner_type,
  p_owner_id uuid,
  p_drive_file_id text,
  p_file_name text default null,
  p_sub_folder text default null,
  p_date_taken date default null,
  p_adoption_update_id uuid default null,
  p_purpose text default 'bill',
  p_media_kind text default 'photo'
)
returns table(attachment attachments, is_profile boolean)
language plpgsql security definer
set search_path to 'public'
as $$
declare
  v_attachment attachments;
  v_is_profile boolean := false;
  v_allowed boolean;
  v_medical boolean := lower(btrim(coalesce(p_sub_folder, ''), E' \t\r\n\f\v')) = 'medical';
  v_is_picture boolean;
  -- 0311: an adopter's file on an update about this resident, in that update's own dated folder, by a login that may write it.
  v_illustrates boolean := false;
begin
  if p_purpose is null or p_purpose not in ('bill', 'report') or (p_purpose = 'report' and p_owner_type <> 'clinic_visit') then
    raise exception 'Not a valid attachment purpose.';
  end if;

  if p_media_kind is null or p_media_kind not in ('photo', 'video') then
    raise exception 'Not a valid media kind.';
  end if;
  v_is_picture := p_media_kind = 'photo' and coalesce(p_file_name, '') !~* '[.](mp4|mov|m4v|webm|mkv|avi|3gp|mpg|mpeg|wmv)[[:space:]]*$';

  if p_owner_type::text = 'resident' and p_adoption_update_id is not null then
    v_illustrates := coalesce((select has_permission('resident.adoption_news')), false)
      and exists (
        select 1 from adoption_updates u
         where u.id = p_adoption_update_id
           and u.resident_id = p_owner_id
           and lower(btrim(coalesce(p_sub_folder, ''))) = to_char(u.received_on, 'YYYYMMDD')
      );
  end if;

  v_allowed := case p_owner_type::text
    when 'resident' then v_illustrates
                      or coalesce((select has_permission('photos.resident_add')), false)
                      or coalesce((select has_permission('photos.shelter_add')), false)
    when 'blood_test' then coalesce((select has_permission('medical.blood_tests')), false)
    when 'procedure' then coalesce((select has_permission('medical.procedures')), false)
    when 'maintenance' then coalesce((select has_permission('maintenance.photos')), false)
    when 'project' then coalesce((select has_permission('projects.photos')), false)
    when 'clinic_visit' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'stock_receipt' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'stock_delivery' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'bill_inbox' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'maintenance_bill' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'utility_bill' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'general_bill' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    else false
  end;

  if not v_allowed then
    raise exception 'Not authorized to add attachments.';
  end if;

  if p_owner_type::text = 'resident' and v_medical
     and not coalesce((select has_permission('photos.medical_add')), false) then
    raise exception 'This login may not add photos to the Medical folder.';
  end if;

  if p_owner_type::text = 'resident'
     and not v_medical
     and not v_illustrates
     and not (select can_publish_resident_photos())
     and not (
       p_adoption_update_id is null
       and lower(btrim(coalesce(p_sub_folder, ''))) = 'shelter'
       and coalesce((select has_permission('photos.shelter_add')), false)
     ) then
    raise exception 'This login can add photos to the Shelter folder only.';
  end if;

  if p_adoption_update_id is not null and not exists (
    select 1 from adoption_updates u
     where u.id = p_adoption_update_id
       and p_owner_type::text = 'resident'
       and u.resident_id = p_owner_id
  ) then
    raise exception 'That adoption update is not about this resident.';
  end if;

  insert into attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name, date_taken, uploaded_by, adoption_update_id, purpose, media_kind)
  values (p_owner_type, p_owner_id, p_sub_folder, p_drive_file_id, p_file_name, p_date_taken, auth.uid(), p_adoption_update_id, p_purpose, p_media_kind)
  returning * into v_attachment;

  if p_owner_type::text = 'resident' and v_attachment.approved_at is not null and not v_medical and v_is_picture then
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
$$;

revoke all on function public.record_attachment(attachment_owner_type, uuid, text, text, text, date, uuid, text, text) from public, anon;
grant execute on function public.record_attachment(attachment_owner_type, uuid, text, text, text, date, uuid, text, text) to authenticated, service_role;

-- consumer: src/app/api/residents/[id]/videos/finish/route.ts, src/app/api/bills/[kind]/[id]/route.ts
-- Two changes to the one function record_attachment(), rebuilt from its last definition (0278), nothing else touched.
--   1. A file that is not a picture never becomes a resident's profile picture. Measured live 2026-11-03 (PR 1233): a video on an unshared
--      adoption update became the profile picture and answered a signed-out request (206). The app now undoes it; the database refuses it.
--      Not a picture = p_media_kind is not photo (new parameter, default photo, so every existing caller is unchanged) OR the file name
--      ends in a video extension (guards a caller that forgets to say). media_kind cannot be read from the row inside the function because
--      the video finish route sets it in a LATER update; passing it in is what makes the column usable.
--   2. utility_bill and general_bill (0304) are accepted, delegating to bill_owner_can() which 0305 already extended. No new activity or card.
-- The signature gains a ninth parameter, so the 0220 eight-argument function is dropped (two overloads would make named calls ambiguous).
-- Re-runnable.

drop function if exists public.record_attachment(attachment_owner_type, uuid, text, text, text, date, uuid, text);

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
  -- 0306: a file is a picture only if the caller says photo AND its name is not a video one.
  v_is_picture boolean;
begin
  -- 0220: purpose is bill or report, and a report hangs on a visit only.
  if p_purpose is null or p_purpose not in ('bill', 'report') or (p_purpose = 'report' and p_owner_type <> 'clinic_visit') then
    raise exception 'Not a valid attachment purpose.';
  end if;

  if p_media_kind is null or p_media_kind not in ('photo', 'video') then
    raise exception 'Not a valid media kind.';
  end if;
  v_is_picture := p_media_kind = 'photo' and coalesce(p_file_name, '') !~* '[.](mp4|mov|m4v|webm|mkv|avi|3gp|mpg|mpeg|wmv)[[:space:]]*$';

  v_allowed := case p_owner_type
    -- 0269: photos.shelter_add (Add Shelter Photos) is admitted here too; the folder rule below is what confines it.
    when 'resident' then coalesce((select has_permission('photos.resident_add')), false)
                      or coalesce((select has_permission('photos.shelter_add')), false)
    when 'blood_test' then coalesce((select has_permission('medical.blood_tests')), false)
    when 'procedure' then coalesce((select has_permission('medical.procedures')), false)
    when 'maintenance' then coalesce((select has_permission('maintenance.photos')), false)
    when 'project' then coalesce((select has_permission('projects.photos')), false)
    when 'clinic_visit' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'stock_receipt' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'bill_inbox' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'maintenance_bill' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'utility_bill' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'general_bill' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    else false
  end;

  if not v_allowed then
    raise exception 'Not authorized to add attachments.';
  end if;

  -- 0278: the Medical folder is filed into by photos.medical_add and by nothing else (a publisher included).
  if p_owner_type = 'resident' and v_medical
     and not coalesce((select has_permission('photos.medical_add')), false) then
    raise exception 'This login may not add photos to the Medical folder.';
  end if;

  -- 0217 CHANGE 1, card half only (unchanged): outside Medical, photos.shelter_add admits the SHELTER folder, not an adopter's.
  if p_owner_type = 'resident'
     and not v_medical
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
       and p_owner_type = 'resident'
       and u.resident_id = p_owner_id
  ) then
    raise exception 'That adoption update is not about this resident.';
  end if;

  insert into attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name, date_taken, uploaded_by, adoption_update_id, purpose, media_kind)
  values (p_owner_type, p_owner_id, p_sub_folder, p_drive_file_id, p_file_name, p_date_taken, auth.uid(), p_adoption_update_id, p_purpose, p_media_kind)
  returning * into v_attachment;

  -- 0217 CHANGE 2: a photo still waiting for approval never becomes the profile photo (that is public).
  -- 0267: a Medical-folder photo never becomes the profile picture.
  -- 0306: nor does a file that is not a picture (a video would stream to anyone, a profile picture being public).
  if p_owner_type = 'resident' and v_attachment.approved_at is not null and not v_medical and v_is_picture then
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

notify pgrst, 'reload schema';

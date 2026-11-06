-- consumer: src/lib/residents/profile-photo.ts, src/app/residents/[id]/photos/actions.ts
-- Backlog #f214a and #k2p8w: ONE rewrite of the two functions that put a picture on a resident's PUBLIC profile.
-- docs/decisions/2026-11-07-resident-record-guards.md is the paper; docs/decisions/2026-11-06-deceased-photo-fallback-guard.md the finding.
--   (1) delete_resident_photo()'s fallback applied NO Medical test, while set_resident_profile_photo() does, so deleting the current
--       profile picture could install a Medical file (record_attachment, 0314:81, lets photos.medical_add file one) as the public picture.
--   (2) Neither path asked whether a photo was ever APPROVED. With 0318's third state (approval = 'private_only', looked at and refused) a
--       refused photo was promoted as readily as an unseen one, bypassing the queue.
-- RULE FOR BOTH PATHS: a file may be a profile picture only if it is a picture (not a video), not in the Medical folder, and approval =
-- 'public_ok'. Same tests, same character set as 0277/0313. The fallback now promotes the NEWEST eligible picture (uploaded_at desc).
-- The card checks (photos.resident_manage) are unchanged. Admin is untouched. Re-runnable.

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

  if not exists (
    select 1 from attachments
    where owner_type = 'resident'
      and owner_id = p_resident_id
      and drive_file_id = p_drive_file_id
  ) then
    raise exception 'That photo does not belong to this resident.';
  end if;

  if exists (
    select 1 from attachments
    where owner_type = 'resident'
      and owner_id = p_resident_id
      and drive_file_id = p_drive_file_id
      and lower(btrim(coalesce(sub_folder, ''), E' \t\r\n\f\v')) = 'medical'
  ) then
    raise exception 'A Medical photo cannot be the profile photo.';
  end if;

  -- A video is public the moment it is the profile picture, so only a picture may be one.
  if not exists (
    select 1 from attachments
    where owner_type = 'resident'
      and owner_id = p_resident_id
      and drive_file_id = p_drive_file_id
      and coalesce(media_kind, 'photo') = 'photo'
      and coalesce(file_name, '') !~* '[.](mp4|mov|m4v|webm|mkv|avi|3gp|mpg|mpeg|wmv)[[:space:]]*$'
  ) then
    raise exception 'Only a photo can be the profile photo.';
  end if;

  -- 0318: the profile photo is public, so it must have been approved for the public site. Unreviewed and Private only are refused.
  if not exists (
    select 1 from attachments
    where owner_type = 'resident'
      and owner_id = p_resident_id
      and drive_file_id = p_drive_file_id
      and approval = 'public_ok'
  ) then
    raise exception 'Only a photo approved for the public site can be the profile photo.';
  end if;

  update residents
  set profile_photo_drive_file_id = p_drive_file_id
  where id = p_resident_id;
end;
$function$;

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
  if not coalesce((select has_permission('photos.resident_manage')), false) then
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
    -- Same three tests as set_resident_profile_photo(): not Medical, a picture, approved for the public site. Newest first.
    select drive_file_id into v_fallback
    from attachments
    where owner_type = 'resident' and owner_id = v_owner_id
      and lower(btrim(coalesce(sub_folder, ''), E' \t\r\n\f\v')) <> 'medical'
      and coalesce(media_kind, 'photo') = 'photo'
      and coalesce(file_name, '') !~* '[.](mp4|mov|m4v|webm|mkv|avi|3gp|mpg|mpeg|wmv)[[:space:]]*$'
      and approval = 'public_ok'
    order by uploaded_at desc
    limit 1;

    update residents set profile_photo_drive_file_id = v_fallback where id = v_owner_id;
  end if;

  return v_drive_file_id;
end;
$function$;

notify pgrst, 'reload schema';

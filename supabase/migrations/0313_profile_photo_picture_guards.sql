-- consumer: src/lib/residents/profile-photo.ts, src/app/residents/[id]/photos/actions.ts, src/app/residents/[id]/adoption-updates/actions.ts, src/app/photos/approve/actions.ts
-- Closes the two remaining routes by which a video could become a resident's PUBLIC profile picture (0306 closed record_attachment).
--   1. set_resident_profile_photo() (live body 0277): now refuses a file that is not a picture.
--   2. delete_resident_photo() (live body 0264): the fallback that promotes the next-oldest attachment when the profile photo is deleted
--      now skips anything that is not a picture.
-- Discriminator for BOTH: the attachment row's media_kind = 'photo' AND a file name not ending in a video extension. Unlike record_attachment,
-- neither site runs in the same call that inserts the row, so media_kind is readable (the video finish route has long since set it); the name
-- test is the backstop for a row whose later media_kind update failed. Same extension list as 0306.

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
    select drive_file_id into v_fallback
    from attachments
    where owner_type = 'resident' and owner_id = v_owner_id
      and coalesce(media_kind, 'photo') = 'photo'
      and coalesce(file_name, '') !~* '[.](mp4|mov|m4v|webm|mkv|avi|3gp|mpg|mpeg|wmv)[[:space:]]*$'
    order by uploaded_at asc
    limit 1;

    update residents set profile_photo_drive_file_id = v_fallback where id = v_owner_id;
  end if;

  return v_drive_file_id;
end;
$function$;

notify pgrst, 'reload schema';

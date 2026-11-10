-- consumer: src/lib/residents/profile-photo.ts, src/app/photos/approve/actions.ts, src/app/residents/[id]/adoption-updates/actions.ts, src/app/residents/[id]/photos/actions.ts
-- #3nuwy, a later group: set_resident_profile_photo and delete_resident_photo raise KEYS (docs/decisions/2026-11-10-refusal-keys-photos.md).
-- Bodies are 0319's, unchanged but for the seven raises. Re-runnable.

CREATE OR REPLACE FUNCTION public.set_resident_profile_photo(p_resident_id uuid, p_drive_file_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not coalesce((select has_permission('photos.resident_manage')), false) then
    raise exception 'photo.profile_not_allowed' using errcode = '42501';
  end if;

  if not exists (
    select 1 from attachments
    where owner_type = 'resident'
      and owner_id = p_resident_id
      and drive_file_id = p_drive_file_id
  ) then
    raise exception 'photo.not_this_residents' using errcode = '22023';
  end if;

  if exists (
    select 1 from attachments
    where owner_type = 'resident'
      and owner_id = p_resident_id
      and drive_file_id = p_drive_file_id
      and lower(btrim(coalesce(sub_folder, ''), E' \t\r\n\f\v')) = 'medical'
  ) then
    raise exception 'photo.profile_is_medical' using errcode = '22023';
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
    raise exception 'photo.profile_not_a_photo' using errcode = '22023';
  end if;

  -- 0318: the profile photo is public, so it must have been approved for the public site. Unreviewed and Private only are refused.
  if not exists (
    select 1 from attachments
    where owner_type = 'resident'
      and owner_id = p_resident_id
      and drive_file_id = p_drive_file_id
      and approval = 'public_ok'
  ) then
    raise exception 'photo.profile_not_approved' using errcode = '22023';
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
    raise exception 'photo.remove_not_allowed' using errcode = '42501';
  end if;

  select owner_id, drive_file_id into v_owner_id, v_drive_file_id
  from attachments
  where id = p_attachment_id and owner_type = 'resident';

  if v_owner_id is null then
    raise exception 'photo.not_found' using errcode = '22023';
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

-- consumer: src/app/api/medical/residents/[id]/photos/route.ts, src/app/api/photos/shelter/[id]/route.ts, src/app/admin/website/actions.ts
-- #3nuwy, group 3: set_resident_drive_folder, shelter_photo_folder, set_shelter_photo_folder and set_hero_photo raise KEYS
-- (docs/decisions/2026-11-10-refusal-keys-group-3.md). Bodies are 0264's, 0219's and 0274's, unchanged but for the five raises. Re-runnable.
-- undo: re-apply the bodies in 0264 (set_resident_drive_folder), 0219 (the two shelter functions) and 0274 (set_hero_photo) in a new file.

CREATE OR REPLACE FUNCTION public.set_resident_drive_folder(p_resident_id uuid, p_folder_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not coalesce((select has_permission('photos.resident_add')), false) then
    raise exception 'photo.add_resident_not_allowed' using errcode = '42501';
  end if;
  update residents
     set drive_folder_id = p_folder_id
   where id = p_resident_id and drive_folder_id is null;
end;
$function$;

create or replace function public.shelter_photo_folder(p_resident_id uuid)
returns table (resident_found boolean, drive_folder_id text)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
begin
  if not coalesce((select has_permission('photos.shelter_add')), false) then
    raise exception 'photo.add_shelter_not_allowed' using errcode = '42501';
  end if;
  return query
    select true, r.drive_folder_id from residents r where r.id = p_resident_id;
  if not found then
    return query select false, null::text;
  end if;
end;
$$;

create or replace function public.set_shelter_photo_folder(p_resident_id uuid, p_folder_id text)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_rows integer;
begin
  if not coalesce((select has_permission('photos.shelter_add')), false) then
    raise exception 'photo.add_shelter_not_allowed' using errcode = '42501';
  end if;
  if p_folder_id is null or p_folder_id !~ '^[A-Za-z0-9_-]{10,128}$' then
    raise exception 'photo.folder_id_invalid' using errcode = '22023';
  end if;
  -- The null guard is the point: an existing folder is never replaced.
  update residents set drive_folder_id = p_folder_id
   where id = p_resident_id and drive_folder_id is null;
  get diagnostics v_rows = row_count;
  return v_rows = 1;
end;
$$;

create or replace function public.set_hero_photo(p_drive_file_id text)
returns void
language plpgsql security definer
set search_path to 'public'
as $$
begin
  if not coalesce((select has_permission('website.gallery')), false) then
    raise exception 'photo.website_not_allowed' using errcode = '42501';
  end if;
  update site_content set hero_drive_file_id = nullif(btrim(p_drive_file_id), '') where id = true;
end;
$$;

revoke all on function public.set_resident_drive_folder(uuid, text) from public, anon;
grant execute on function public.set_resident_drive_folder(uuid, text) to authenticated, service_role;
revoke all on function public.shelter_photo_folder(uuid) from public, anon;
grant execute on function public.shelter_photo_folder(uuid) to authenticated, service_role;
revoke all on function public.set_shelter_photo_folder(uuid, text) from public, anon;
grant execute on function public.set_shelter_photo_folder(uuid, text) to authenticated, service_role;
revoke all on function public.set_hero_photo(text) from public, anon;
grant execute on function public.set_hero_photo(text) to authenticated, service_role;

notify pgrst, 'reload schema';

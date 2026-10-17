-- consumer: src/app/api/photos/shelter/[id]/route.ts
--
-- Two narrow functions that replace the service-role client in the Add Shelter Photos route. That route used the
-- service role to do exactly two things to residents.drive_folder_id: read it, and write it once when it is null.
-- "Asks for one column" was a convention; these make it the shape of the data.
--
--   shelter_photo_folder(resident)          -> (resident_found, drive_folder_id). Reads that one column. Nothing else.
--   set_shelter_photo_folder(resident, id)  -> true when it recorded the id. Writes ONLY where drive_folder_id IS NULL,
--                                              so it can never repoint a resident (which would orphan every photo
--                                              already filed under the old folder).
--
-- Both check photos.shelter_add INSIDE the function, so being reachable is not being allowed. The folder id is the
-- caller's (Drive creates it app-side), so it is shape-checked: a Drive id is letters, digits, '_' and '-', never blank.
-- Re-runnable: create or replace, grants repeated.

create or replace function public.shelter_photo_folder(p_resident_id uuid)
returns table (resident_found boolean, drive_folder_id text)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
begin
  if not coalesce((select has_permission('photos.shelter_add')), false) then
    raise exception 'Not authorized to add photos.';
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
    raise exception 'Not authorized to add photos.';
  end if;
  if p_folder_id is null or p_folder_id !~ '^[A-Za-z0-9_-]{10,128}$' then
    raise exception 'Not a Drive folder id.';
  end if;
  -- The null guard is the point: an existing folder is never replaced.
  update residents set drive_folder_id = p_folder_id
   where id = p_resident_id and drive_folder_id is null;
  get diagnostics v_rows = row_count;
  return v_rows = 1;
end;
$$;

revoke all on function public.shelter_photo_folder(uuid) from public, anon;
grant execute on function public.shelter_photo_folder(uuid) to authenticated, service_role;
revoke all on function public.set_shelter_photo_folder(uuid, text) from public, anon;
grant execute on function public.set_shelter_photo_folder(uuid, text) to authenticated, service_role;

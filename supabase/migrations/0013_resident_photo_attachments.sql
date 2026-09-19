-- Resident photo upload support (Section 3, requirement 4 / Section 4.3).
--
-- drive_folder_id caches the Drive folder ID for the resident's
-- "<Name> (<ID>)" folder so uploads don't need to search Drive by name
-- every time.
alter table residents add column drive_folder_id text;

-- These three functions are security definer, breaking from this file's
-- usual security invoker convention (see record_immunization etc. in
-- 0002_core_business_logic.sql). That's deliberate: volunteers have
-- read-only RLS on `residents` (volunteer_read_residents) but decisions.md
-- says volunteers may write "attachments / photos (any owner type)" —
-- picking/clearing the profile photo is a residents-table write, so it
-- needs to bypass RLS for that one role. Each function does its own
-- explicit role check rather than relying on RLS, and sets search_path
-- per Postgres security-definer convention (current_user_role() already
-- does the same, see 0001_initial_schema.sql).

create or replace function record_attachment(
  p_owner_type attachment_owner_type,
  p_owner_id uuid,
  p_drive_file_id text,
  p_file_name text default null,
  p_sub_folder text default null
)
returns table (attachment attachments, is_profile boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attachment attachments;
  v_is_profile boolean := false;
begin
  if current_user_role() not in ('admin', 'staff', 'volunteer') then
    raise exception 'Not authorized to add attachments.';
  end if;

  insert into attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name, uploaded_by)
  values (p_owner_type, p_owner_id, p_sub_folder, p_drive_file_id, p_file_name, auth.uid())
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
$$;

create or replace function set_resident_profile_photo(
  p_resident_id uuid,
  p_drive_file_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user_role() not in ('admin', 'staff', 'volunteer') then
    raise exception 'Not authorized to set the profile photo.';
  end if;

  -- Require an existing attachment row for this resident/file, so an
  -- arbitrary Drive file ID can't be set as the profile photo.
  if not exists (
    select 1 from attachments
    where owner_type = 'resident'
      and owner_id = p_resident_id
      and drive_file_id = p_drive_file_id
  ) then
    raise exception 'That photo does not belong to this resident.';
  end if;

  update residents
  set profile_photo_drive_file_id = p_drive_file_id
  where id = p_resident_id;
end;
$$;

create or replace function delete_resident_photo(
  p_attachment_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_drive_file_id text;
  v_was_profile boolean;
  v_fallback text;
begin
  if current_user_role() not in ('admin', 'staff', 'volunteer') then
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
    order by uploaded_at asc
    limit 1;

    update residents set profile_photo_drive_file_id = v_fallback where id = v_owner_id;
  end if;

  return v_drive_file_id;
end;
$$;

-- Resident photo uploads now collect a date-taken and a folder category
-- (Shelter/Medical/Foster/Adoption) per batch, applied to every file in
-- that batch, matching the legacy Drive convention:
-- Residents/<Name> (<ID>)/Photos/<Category>/<YYMM>/<filename>.
-- date_taken drives the <YYMM> segment; category is stored in the existing
-- `sub_folder` column. Nullable since other owner_types (project,
-- maintenance) using this same table don't collect a photo date.
alter table attachments add column date_taken date;

create or replace function record_attachment(
  p_owner_type attachment_owner_type,
  p_owner_id uuid,
  p_drive_file_id text,
  p_file_name text default null,
  p_sub_folder text default null,
  p_date_taken date default null
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

  insert into attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name, date_taken, uploaded_by)
  values (p_owner_type, p_owner_id, p_sub_folder, p_drive_file_id, p_file_name, p_date_taken, auth.uid())
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

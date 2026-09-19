-- Blood test file attachments (this build).
--
-- Blood test scans/PDFs now go through the same polymorphic `attachments`
-- table as resident photos, reusing record_attachment() and the Drive
-- upload flow, instead of the single blood_tests.drive_file_id column from
-- the initial schema. A blood test is often more than one file (front/back
-- of a lab slip, a multi-page PDF) — this also sets up the future OCR build
-- to iterate every file attached to a test rather than being hard-limited
-- to one.
alter table blood_tests drop column drive_file_id;

alter type attachment_owner_type add value 'blood_test';

-- record_attachment()'s explicit role allowlist predates blood tests and
-- didn't include 'vet' (resident photos are staff/volunteer territory) —
-- vets need to attach their own blood test scans. This also fixes a
-- pre-existing gap found while wiring this up: `attachments` had no RLS
-- policy at all for the vet role, so a vet reading resident photos "for
-- context" (Section 6) silently got zero rows. Matches the existing
-- staff/volunteer "for all" shape rather than a narrower blood-test-only
-- grant, since vets plausibly need to see/manage resident photos too.
create policy vet_rw_attachments on attachments for all using (current_user_role() = 'vet');

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
  if current_user_role() not in ('admin', 'staff', 'vet', 'volunteer') then
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

-- Note: blood_tests row creation itself stays gated to vet/admin by the
-- existing vet_rw_blood_tests / admin_all_blood_tests policies (0001) —
-- staff/volunteers can view blood tests (staff_read_blood_tests,
-- volunteer_read_blood_tests) but not log new ones. That's a deliberate
-- read of the Section 6 role table (blood tests listed only under Vet's
-- read/write scope), not re-litigated here — flagged in decisions.md as an
-- assumption to confirm with the user once they see it in the running app.

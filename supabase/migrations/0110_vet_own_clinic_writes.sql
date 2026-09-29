-- A vet writes only their own clinic's records (backlog, "A vet can still
-- write another clinic's records, and record a visit against any clinic,
-- through the database", found 2026-09-28 building 0108).
--
-- ## The rule
--
-- Another clinic's rows are read-only to a vet. 0108 decided a vet *sees* a
-- visible resident's whole clinical history, other clinics' visits
-- included; read-only is the consistent other half. Seeing is for
-- treating; nothing about treating needs a vet to rewrite or delete what a
-- different clinic recorded.
--
--   vet_appointments   insert / update / delete only where vet_id is the
--                      vet's own clinic (user_roles.vet_id, 0102). `with
--                      check` too, so a visit cannot be booked against
--                      another clinic, nor moved to one, nor moved out of
--                      the vet's own by an update. A visit with no clinic
--                      (vet_id null) is nobody's, so it is read-only.
--   prescriptions,     a prescription, procedure or blood test belongs to a
--   procedures,        clinic only through its visit (0108), so a vet
--   blood_tests        writes one only when its visit is at their clinic.
--                      One with no visit belongs to no clinic and stays
--                      writable, because the forms let a vet record one
--                      without a visit; it cannot be another clinic's.
--   attachments        a blood test's or procedure's files follow the same
--                      test through their record; record_attachment
--                      (security definer) gets the same check.
--   vet_doctors,       a clinic's doctor list and a bulk booking are the
--   bulk_appointments  clinic's, so a vet writes only their own clinic's.
--
-- Reads are exactly as 0108 left them. Weights, immunization records and
-- diets carry no clinic and are unchanged.
--
-- The "keep the clinic a visit already has" case in the forms
-- (src/lib/vets/scope.ts) cannot arise for a vet any more: a visit at
-- another clinic can no longer be saved by a vet at all, so the edit page
-- says so instead of offering a form that could only fail. Admin,
-- management and staff are untouched and still rebook freely.
--
-- ## The security-definer functions
--
-- Checked. Only record_attachment lets a vet write these tables' files past
-- RLS, and it is patched below. handle_deceased_placement,
-- undo_deceased_placement and record_deceased_archive write vet_appointments
-- and prescriptions past RLS, but a vet cannot cause them: a vet has no
-- write on placement_history and the others refuse a vet already (0108).
-- schedule_bulk_appointments, merge_vet_doctors,
-- vet_appointments_link_doctor and vet_doctors_propagate_name are security
-- invoker, so these policies constrain them.
--
-- Re-runnable: drop-before-create and `or replace` throughout.

-- ---------------------------------------------------------------------------
-- 1. Helpers (security invoker: RLS on vet_appointments still applies)
-- ---------------------------------------------------------------------------

-- True when the visit is at the calling vet's clinic, or there is no visit.
create or replace function vet_owns_visit(p_visit_id uuid)
returns boolean
language sql
stable
as $$
  select p_visit_id is null
      or exists (
        select 1 from vet_appointments va
         where va.id = p_visit_id and va.vet_id = current_user_vet_id()
      );
$$;

revoke all on function vet_owns_visit(uuid) from public, anon;
grant execute on function vet_owns_visit(uuid) to authenticated, service_role;

-- Whether a vet may write a file owned by a blood test or procedure.
-- Other owner types are not clinic-bound and pass.
create or replace function vet_can_write_attachment(p_owner_type attachment_owner_type, p_owner_id uuid)
returns boolean
language sql
stable
as $$
  select case p_owner_type::text
    when 'blood_test' then coalesce(
      (select vet_owns_visit(bt.vet_appointment_id) from blood_tests bt where bt.id = p_owner_id), false)
    when 'procedure' then coalesce(
      (select vet_owns_visit(pr.vet_appointment_id) from procedures pr where pr.id = p_owner_id), false)
    else true
  end;
$$;

revoke all on function vet_can_write_attachment(attachment_owner_type, uuid) from public, anon;
grant execute on function vet_can_write_attachment(attachment_owner_type, uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. vet_appointments
-- ---------------------------------------------------------------------------

drop policy if exists vet_rw_vet_appointments on vet_appointments;
drop policy if exists vet_read_vet_appointments on vet_appointments;
drop policy if exists vet_insert_vet_appointments on vet_appointments;
drop policy if exists vet_update_vet_appointments on vet_appointments;
drop policy if exists vet_delete_vet_appointments on vet_appointments;

create policy vet_read_vet_appointments on vet_appointments
  for select using (
    current_user_role() = 'vet' and resident_id in (select current_vet_resident_ids())
  );

create policy vet_insert_vet_appointments on vet_appointments
  for insert with check (
    current_user_role() = 'vet'
    and vet_id = current_user_vet_id()
    and resident_id in (select current_vet_resident_ids())
  );

create policy vet_update_vet_appointments on vet_appointments
  for update
  using (
    current_user_role() = 'vet'
    and vet_id = current_user_vet_id()
    and resident_id in (select current_vet_resident_ids())
  )
  with check (
    current_user_role() = 'vet'
    and vet_id = current_user_vet_id()
    and resident_id in (select current_vet_resident_ids())
  );

create policy vet_delete_vet_appointments on vet_appointments
  for delete using (
    current_user_role() = 'vet'
    and vet_id = current_user_vet_id()
    and resident_id in (select current_vet_resident_ids())
  );

-- ---------------------------------------------------------------------------
-- 3. prescriptions, procedures, blood_tests: through their visit
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array['prescriptions', 'procedures', 'blood_tests'] loop
    execute format('drop policy if exists %I on %I', 'vet_rw_' || t, t);
    execute format('drop policy if exists %I on %I', 'vet_read_' || t, t);
    execute format('drop policy if exists %I on %I', 'vet_insert_' || t, t);
    execute format('drop policy if exists %I on %I', 'vet_update_' || t, t);
    execute format('drop policy if exists %I on %I', 'vet_delete_' || t, t);

    execute format(
      'create policy %I on %I for select
         using (current_user_role() = ''vet'' and resident_id in (select current_vet_resident_ids()))',
      'vet_read_' || t, t);
    execute format(
      'create policy %I on %I for insert
         with check (current_user_role() = ''vet''
                     and resident_id in (select current_vet_resident_ids())
                     and vet_owns_visit(vet_appointment_id))',
      'vet_insert_' || t, t);
    execute format(
      'create policy %I on %I for update
         using (current_user_role() = ''vet''
                and resident_id in (select current_vet_resident_ids())
                and vet_owns_visit(vet_appointment_id))
         with check (current_user_role() = ''vet''
                     and resident_id in (select current_vet_resident_ids())
                     and vet_owns_visit(vet_appointment_id))',
      'vet_update_' || t, t);
    execute format(
      'create policy %I on %I for delete
         using (current_user_role() = ''vet''
                and resident_id in (select current_vet_resident_ids())
                and vet_owns_visit(vet_appointment_id))',
      'vet_delete_' || t, t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. attachments and record_attachment
-- ---------------------------------------------------------------------------

drop policy if exists vet_rw_attachments on attachments;
drop policy if exists vet_read_attachments on attachments;
drop policy if exists vet_write_attachments on attachments;

create policy vet_read_attachments on attachments
  for select using (
    current_user_role() = 'vet'
    and (
      owner_type not in ('resident', 'blood_test', 'procedure')
      or attachment_resident_id(owner_type, owner_id) in (select current_vet_resident_ids())
    )
  );

-- Writes are split by command so the read policy above is the only one a
-- select passes through.
create policy vet_write_attachments on attachments
  for insert with check (
    current_user_role() = 'vet'
    and (
      owner_type not in ('resident', 'blood_test', 'procedure')
      or attachment_resident_id(owner_type, owner_id) in (select current_vet_resident_ids())
    )
    and vet_can_write_attachment(owner_type, owner_id)
  );

drop policy if exists vet_update_attachments on attachments;
create policy vet_update_attachments on attachments
  for update
  using (
    current_user_role() = 'vet'
    and (
      owner_type not in ('resident', 'blood_test', 'procedure')
      or attachment_resident_id(owner_type, owner_id) in (select current_vet_resident_ids())
    )
    and vet_can_write_attachment(owner_type, owner_id)
  )
  with check (
    current_user_role() = 'vet'
    and (
      owner_type not in ('resident', 'blood_test', 'procedure')
      or attachment_resident_id(owner_type, owner_id) in (select current_vet_resident_ids())
    )
    and vet_can_write_attachment(owner_type, owner_id)
  );

drop policy if exists vet_delete_attachments on attachments;
create policy vet_delete_attachments on attachments
  for delete using (
    current_user_role() = 'vet'
    and (
      owner_type not in ('resident', 'blood_test', 'procedure')
      or attachment_resident_id(owner_type, owner_id) in (select current_vet_resident_ids())
    )
    and vet_can_write_attachment(owner_type, owner_id)
  );

-- As in 0108, plus the clinic check on a blood test's or procedure's file.
create or replace function public.record_attachment(
  p_owner_type attachment_owner_type,
  p_owner_id uuid,
  p_drive_file_id text,
  p_file_name text default null,
  p_sub_folder text default null,
  p_date_taken date default null,
  p_adoption_update_id uuid default null
)
returns table(attachment attachments, is_profile boolean)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_attachment attachments;
  v_is_profile boolean := false;
begin
  if current_user_role() is null
     or current_user_role() not in ('admin', 'management', 'staff', 'vet', 'volunteer') then
    raise exception 'Not authorized to add attachments.';
  end if;

  if current_user_role() = 'vet'
     and p_owner_type in ('resident', 'blood_test', 'procedure')
     and not coalesce(
       attachment_resident_id(p_owner_type, p_owner_id) in (select current_vet_resident_ids()),
       false
     ) then
    raise exception 'Not authorized to add attachments.';
  end if;

  -- 0110: a file on another clinic's blood test or procedure is not the
  -- vet's to add. Definer, so the policies above do not reach here.
  if current_user_role() = 'vet' and not vet_can_write_attachment(p_owner_type, p_owner_id) then
    raise exception 'Not authorized to add attachments.';
  end if;

  if p_adoption_update_id is not null and not exists (
    select 1 from adoption_updates u
     where u.id = p_adoption_update_id
       and p_owner_type = 'resident'
       and u.resident_id = p_owner_id
  ) then
    raise exception 'That adoption update is not about this resident.';
  end if;

  insert into attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name, date_taken, uploaded_by, adoption_update_id)
  values (p_owner_type, p_owner_id, p_sub_folder, p_drive_file_id, p_file_name, p_date_taken, auth.uid(), p_adoption_update_id)
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
$function$;

-- ---------------------------------------------------------------------------
-- 5. vet_doctors and bulk_appointments: the clinic's own
-- ---------------------------------------------------------------------------

drop policy if exists vet_rw_vet_doctors on vet_doctors;
drop policy if exists vet_read_vet_doctors on vet_doctors;
drop policy if exists vet_write_vet_doctors on vet_doctors;

create policy vet_read_vet_doctors on vet_doctors
  for select using (current_user_role() = 'vet');

create policy vet_write_vet_doctors on vet_doctors
  for all
  using (current_user_role() = 'vet' and vet_id = current_user_vet_id())
  with check (current_user_role() = 'vet' and vet_id = current_user_vet_id());

drop policy if exists vet_rw_bulk_appointments on bulk_appointments;
drop policy if exists vet_read_bulk_appointments on bulk_appointments;
drop policy if exists vet_write_bulk_appointments on bulk_appointments;

create policy vet_read_bulk_appointments on bulk_appointments
  for select using (current_user_role() = 'vet');

create policy vet_write_bulk_appointments on bulk_appointments
  for all
  using (current_user_role() = 'vet' and vet_id = current_user_vet_id())
  with check (current_user_role() = 'vet' and vet_id = current_user_vet_id());

notify pgrst, 'reload schema';

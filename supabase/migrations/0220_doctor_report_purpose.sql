-- consumer: src/lib/bills/photos.ts, src/app/bills/page.tsx, src/app/clinic-visits/[id]/edit/page.tsx, src/app/residents/[id]/[section]/sections/clinic-visits.tsx
-- The doctor's written report on a clinic visit: schema half. Nothing in the app can add one yet.
--
-- Shape (a): attachments.purpose ('bill' | 'report'). A clinic_visit attachment used to mean "a bill"; now it may be
-- a report, so the two are told apart by purpose, not by owner_type (owner_type stays "what this hangs on").
--
--   1. attachments.purpose text not null default 'bill'. ADD COLUMN with a constant default fills EVERY existing row
--      as 'bill' in the same statement, so no back-fill can miss a row; and an app that does not know about purpose
--      keeps writing bills. Only code that says 'report' creates one. 'report' is allowed on clinic_visit only.
--   2. doctor_can_write_attachment(): a clinic_visit is the doctor's to write when the visit is at one of its
--      current clinics (clinic_login_owns_visit, 0172). It cannot see purpose, so the doctor policies below and
--      record_attachment() add "purpose = 'report'": a doctor never writes or reads a BILL.
--   3. Four doctor policies on clinic_visit reports at an own-clinic visit (select/insert/update/delete).
--   4. record_attachment() gains p_purpose (default 'bill'); the old 7-argument form is dropped.
-- Staff read/write reports through the existing attachments_*_perm policies: bill_owner_can('clinic_visit') =
-- medical.visits (read to see, edit to add/remove). Deliberately not broader than the bill photos.
-- Re-runnable. To undo: drop the constraints and column, restore doctor_can_write_attachment (0174), the 7-arg
-- record_attachment (0217), drop the four doctor_*_visit_reports policies.

alter table attachments add column if not exists purpose text not null default 'bill';

do $c$
begin
  if not exists (select 1 from pg_constraint where conname = 'attachments_purpose_check' and conrelid = 'attachments'::regclass) then
    alter table attachments add constraint attachments_purpose_check check (purpose in ('bill', 'report'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'attachments_report_on_visit_only' and conrelid = 'attachments'::regclass) then
    alter table attachments add constraint attachments_report_on_visit_only check (purpose = 'bill' or owner_type = 'clinic_visit');
  end if;
end $c$;

create index if not exists attachments_visit_purpose_idx on attachments (owner_id, purpose) where owner_type = 'clinic_visit';

create or replace function public.doctor_can_write_attachment(p_owner_type attachment_owner_type, p_owner_id uuid)
  returns boolean
  language sql
  stable
as $$
  select case p_owner_type::text
    when 'resident' then coalesce(p_owner_id in (select current_clinic_resident_ids()), false)
    when 'blood_test' then coalesce(
      (select clinic_login_owns_visit(bt.clinic_visit_id) from blood_tests bt where bt.id = p_owner_id), false)
    when 'procedure' then coalesce(
      (select clinic_login_owns_visit(pr.clinic_visit_id) from procedures pr where pr.id = p_owner_id), false)
    -- 0220: a visit at one of the login's current clinics. Callers must also require purpose = 'report'.
    when 'clinic_visit' then coalesce(p_owner_id is not null and clinic_login_owns_visit(p_owner_id), false)
    else false
  end;
$$;

drop policy if exists doctor_read_visit_reports on attachments;
create policy doctor_read_visit_reports on attachments for select
  using ((select is_clinic_login()) and owner_type = 'clinic_visit' and purpose = 'report'
         and doctor_can_write_attachment(owner_type, owner_id));

drop policy if exists doctor_write_visit_reports on attachments;
create policy doctor_write_visit_reports on attachments for insert
  with check ((select is_clinic_login()) and owner_type = 'clinic_visit' and purpose = 'report'
              and doctor_can_write_attachment(owner_type, owner_id));

drop policy if exists doctor_update_visit_reports on attachments;
create policy doctor_update_visit_reports on attachments for update
  using ((select is_clinic_login()) and owner_type = 'clinic_visit' and purpose = 'report'
         and doctor_can_write_attachment(owner_type, owner_id))
  with check ((select is_clinic_login()) and owner_type = 'clinic_visit' and purpose = 'report'
              and doctor_can_write_attachment(owner_type, owner_id));

drop policy if exists doctor_delete_visit_reports on attachments;
create policy doctor_delete_visit_reports on attachments for delete
  using ((select is_clinic_login()) and owner_type = 'clinic_visit' and purpose = 'report'
         and doctor_can_write_attachment(owner_type, owner_id));

-- record_attachment(): 0217's body with p_purpose added (marked 0220).
drop function if exists public.record_attachment(attachment_owner_type, uuid, text, text, text, date, uuid);

create or replace function public.record_attachment(p_owner_type attachment_owner_type, p_owner_id uuid, p_drive_file_id text, p_file_name text DEFAULT NULL::text, p_sub_folder text DEFAULT NULL::text, p_date_taken date DEFAULT NULL::date, p_adoption_update_id uuid DEFAULT NULL::uuid, p_purpose text DEFAULT 'bill'::text)
 RETURNS TABLE(attachment attachments, is_profile boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_attachment attachments;
  v_is_profile boolean := false;
  v_clinic boolean := coalesce((select is_clinic_login()), false);
  v_allowed boolean;
begin
  -- 0220: purpose is bill or report, and a report hangs on a visit only.
  if p_purpose is null or p_purpose not in ('bill', 'report') or (p_purpose = 'report' and p_owner_type <> 'clinic_visit') then
    raise exception 'Not a valid attachment purpose.';
  end if;
  -- 0220: a clinic login (doctor) may file a visit REPORT, never a bill.
  if v_clinic and p_owner_type = 'clinic_visit' and p_purpose <> 'report' then
    raise exception 'Not authorized to add attachments.';
  end if;

  v_allowed := case p_owner_type
    when 'resident' then coalesce((select has_permission('photos.resident_add')), false)
                         and coalesce((select sees_all_clinical()), false)
    when 'blood_test' then coalesce((select has_permission('medical.blood_tests')), false)
                           and coalesce((select sees_all_clinical()), false)
    when 'procedure' then coalesce((select has_permission('medical.procedures')), false)
                          and coalesce((select sees_all_clinical()), false)
    when 'maintenance' then coalesce((select has_permission('maintenance.photos')), false)
    when 'project' then coalesce((select has_permission('projects.photos')), false)
    when 'clinic_visit' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'stock_receipt' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'bill_inbox' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'maintenance_bill' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    else false
  end
  or (v_clinic and p_owner_type in ('resident', 'blood_test', 'procedure'))
  or (v_clinic and p_owner_type = 'clinic_visit' and p_purpose = 'report');

  if not v_allowed then
    raise exception 'Not authorized to add attachments.';
  end if;

  -- 0217 CHANGE 1: photos.shelter_add admits exactly one thing past the Medical-only rule: a resident photo in the
  -- SHELTER folder, not an adopter's. Any other folder is still refused for that login, here, by the database.
  if p_owner_type = 'resident'
     and not (select can_publish_resident_photos())
     and (p_adoption_update_id is not null
          or lower(btrim(coalesce(p_sub_folder, ''))) <> 'medical')
     and not (
       p_adoption_update_id is null
       and lower(btrim(coalesce(p_sub_folder, ''))) = 'shelter'
       and coalesce((select has_permission('photos.shelter_add')), false)
       and not coalesce((select photos_medical_only()), false)
     ) then
    raise exception 'This login can add photos to the Medical folder only.';
  end if;

  if v_clinic
     and p_owner_type in ('resident', 'blood_test', 'procedure')
     and not coalesce(
       attachment_resident_id(p_owner_type, p_owner_id) in (select current_clinic_resident_ids()),
       false
     ) then
    raise exception 'Not authorized to add attachments.';
  end if;

  if v_clinic and not doctor_can_write_attachment(p_owner_type, p_owner_id) then
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

  insert into attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name, date_taken, uploaded_by, adoption_update_id, purpose)
  values (p_owner_type, p_owner_id, p_sub_folder, p_drive_file_id, p_file_name, p_date_taken, auth.uid(), p_adoption_update_id, p_purpose)
  returning * into v_attachment;

  -- 0217 CHANGE 2: a photo still waiting for approval never becomes the profile photo (that is public).
  if p_owner_type = 'resident' and v_attachment.approved_at is not null then
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

revoke all on function public.record_attachment(attachment_owner_type, uuid, text, text, text, date, uuid, text) from public, anon;
grant execute on function public.record_attachment(attachment_owner_type, uuid, text, text, text, date, uuid, text) to authenticated, service_role;

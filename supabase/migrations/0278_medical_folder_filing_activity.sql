-- consumer: src/lib/google/drive-client.ts, src/app/residents/[id]/photos/actions.ts, src/app/api/residents/[id]/photos/route.ts
-- (the app half, next batch, reads photos.medical_add)
-- FILING INTO THE MEDICAL FOLDER NEEDS AN ACTIVITY OF ITS OWN (Lutan, 2026-10-28: "I can select medical photo as a folder to upload
-- photos" ... "And I shouldn't be able to"). photos.resident_add meant two things at once: "may upload a resident photo at all" and "may
-- file into Medical". It cannot be taken off Residents without stopping Residents uploading anything, so Medical gets its own activity.
-- This is the SCHEMA half; nothing under src/ changes and the app keeps working because every login that could file into Medical before
-- and that matters (Add medical photos, Manage medical) is granted the new activity below.
--
--   1. NEW ACTIVITY photos.medical_add (yesno, like photos.shelter_add). Registered the way 0217 registered photos.shelter_add.
--   2. GRANTED, by cards and nothing else, to Add medical photos (add_medical_photos) and Manage medical (medical_records).
--   3. record_attachment() (live body 0269): a resident photo in the Medical folder asks photos.medical_add, whoever else the login is
--      (a publisher included: that is the point). Every other folder keeps today's rule exactly: publish, or photos.shelter_add into the
--      Shelter folder. The Medical test strips every whitespace character JS trim() does (as 0276), so 'Medical<tab>' is Medical here
--      too and a near-miss can only make the check stricter.
--   4. attachments_insert_folder_guard (0152) and attachments_update_folder_guard (0269) say the same thing for a row written straight
--      to the table: a Medical row needs photos.medical_add; any other resident row needs publish (update: or photos.approve), as before.
--      The brief named the update guard; the insert guard is the identical hole (any photos.resident_add login could insert a Medical
--      row through the API) and leaving it would make this half-done, so both move.
--   The Move action's comment (actions.ts:119) says a role that only adds may move into Medical; that was a written-down decision and
--   Lutan's instruction of 2026-10-28 supersedes it: Medical now asks photos.medical_add, there as everywhere.
--
-- WHO LOSES MEDICAL FILING: the NOTICE at the foot names every role that held photos.resident_add and does not hold photos.medical_add
-- after the grants. On production on 2026-10-26 Residents was held by Management and the 2IC and both also hold Add medical photos, so
-- neither loses it in practice; the NOTICE is the reading on the database this runs on. Nothing is granted to Admin (outside the card
-- system, answered before any cell is read) and no role is named. 0276 may still be pending on production: this file does not depend
-- on it. Re-runnable.

create temp table pre_0278 on commit drop as
  select rp.role_id, rp.activity, rp.level from public.role_permissions rp;

-- ---------------------------------------------------------------------------
-- 1 and 2. The activity, and the two cards that carry it
-- ---------------------------------------------------------------------------
insert into permission_activities (key, kind, area, sort)
values ('photos.medical_add', 'yesno', 'photos', 72)
on conflict (key) do update set kind = excluded.kind, area = excluded.area;

insert into card_grants (card, activity, level)
values
  ('add_medical_photos', 'photos.medical_add', 2),
  ('medical_records', 'photos.medical_add', 2)
on conflict (card, activity) do update set level = excluded.level;

-- ---------------------------------------------------------------------------
-- 3. record_attachment(): Medical asks photos.medical_add
-- ---------------------------------------------------------------------------
create or replace function public.record_attachment(
  p_owner_type attachment_owner_type,
  p_owner_id uuid,
  p_drive_file_id text,
  p_file_name text default null,
  p_sub_folder text default null,
  p_date_taken date default null,
  p_adoption_update_id uuid default null,
  p_purpose text default 'bill'
)
returns table(attachment attachments, is_profile boolean)
language plpgsql security definer
set search_path to 'public'
as $$
declare
  v_attachment attachments;
  v_is_profile boolean := false;
  v_allowed boolean;
  v_medical boolean := lower(btrim(coalesce(p_sub_folder, ''), E' \t\r\n\f\v')) = 'medical';
begin
  -- 0220: purpose is bill or report, and a report hangs on a visit only.
  if p_purpose is null or p_purpose not in ('bill', 'report') or (p_purpose = 'report' and p_owner_type <> 'clinic_visit') then
    raise exception 'Not a valid attachment purpose.';
  end if;

  v_allowed := case p_owner_type
    -- 0269: photos.shelter_add (Add Shelter Photos) is admitted here too; the folder rule below is what confines it.
    when 'resident' then coalesce((select has_permission('photos.resident_add')), false)
                      or coalesce((select has_permission('photos.shelter_add')), false)
    when 'blood_test' then coalesce((select has_permission('medical.blood_tests')), false)
    when 'procedure' then coalesce((select has_permission('medical.procedures')), false)
    when 'maintenance' then coalesce((select has_permission('maintenance.photos')), false)
    when 'project' then coalesce((select has_permission('projects.photos')), false)
    when 'clinic_visit' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'stock_receipt' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'bill_inbox' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'maintenance_bill' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    else false
  end;

  if not v_allowed then
    raise exception 'Not authorized to add attachments.';
  end if;

  -- 0278: the Medical folder is filed into by photos.medical_add and by nothing else (a publisher included).
  if p_owner_type = 'resident' and v_medical
     and not coalesce((select has_permission('photos.medical_add')), false) then
    raise exception 'This login may not add photos to the Medical folder.';
  end if;

  -- 0217 CHANGE 1, card half only (unchanged): outside Medical, photos.shelter_add admits the SHELTER folder, not an adopter's.
  if p_owner_type = 'resident'
     and not v_medical
     and not (select can_publish_resident_photos())
     and not (
       p_adoption_update_id is null
       and lower(btrim(coalesce(p_sub_folder, ''))) = 'shelter'
       and coalesce((select has_permission('photos.shelter_add')), false)
     ) then
    raise exception 'This login can add photos to the Shelter folder only.';
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
  -- 0267: a Medical-folder photo never becomes the profile picture.
  if p_owner_type = 'resident' and v_attachment.approved_at is not null and not v_medical then
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

-- ---------------------------------------------------------------------------
-- 4. The two folder guards
-- ---------------------------------------------------------------------------
alter policy attachments_insert_folder_guard on public.attachments
  with check (
    owner_type <> 'resident'
    or case
         when lower(btrim(coalesce(sub_folder, ''), E' \t\r\n\f\v')) = 'medical'
           then (select has_permission('photos.medical_add'))
         else (select can_publish_resident_photos())
       end
  );

alter policy attachments_update_folder_guard on public.attachments
  with check (
    owner_type <> 'resident'
    or case
         when lower(btrim(coalesce(sub_folder, ''), E' \t\r\n\f\v')) = 'medical'
           then (select has_permission('photos.medical_add'))
         else (select can_publish_resident_photos()) or (select can_approve_photos())
       end
  );

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- 5. The record: which roles can no longer file into Medical
-- ---------------------------------------------------------------------------
-- A statement boundary for scripts/check-hard-coded-security.mjs, as in 0269: the report joins roles to print role keys, which no
-- function reads.
create temp table report_0278_marker (n int) on commit drop;

do $report$
declare
  r record;
begin
  for r in select id, key from public.roles where kind <> 'fixed' order by key loop
    if exists (select 1 from pre_0278 p where p.role_id = r.id and p.activity = 'photos.resident_add' and p.level >= 2)
       and not exists (select 1 from public.role_permissions m
                        where m.role_id = r.id and m.activity = 'photos.medical_add' and m.level >= 2) then
      raise notice '0278 % | no longer files into the Medical folder (still adds to its other folders)', r.key;
    end if;
  end loop;
  raise notice '0278 done: roles holding Add medical photos or Manage medical keep Medical filing; Admin is unaffected.';
end
$report$;

-- consumer: src/lib/permissions/cards.ts, src/lib/placements/available.ts, src/app/photos/approve/actions.ts, src/app/photos/approve/pending-actions.ts, src/app/api/photos/shelter/[id]/route.ts, src/app/management/appeals/[id]/page.tsx
--
-- CARD REVIEW 2, THE APP HALF'S SCHEMA (Lutan, 2026-10-26; docs/decisions/2026-10-26-card-review-2-app-half-22-29.md). Four changes in one file:
--   1. Add Shelter Photos SAVES. record_attachment() asked photos.resident_add for a resident photo, which this card does not hold (it holds
--      photos.shelter_add), so every upload answered "Not authorized to add attachments" (500). A resident photo is now admitted by either
--      activity; the rule below it, unchanged, still confines photos.shelter_add to the Shelter folder, never an adopter's photo, and 0217's
--      trigger still marks the photo WAITING. Driven on a login holding only add_photos before and after.
--   2. Approve and Wrong animal WORK. Both change a resident's attachment row, and the restrictive policy attachments_update_folder_guard
--      (0152) refused any login that cannot PUBLISH (photos.resident_publish). Approve photos deliberately does not hold that, so the update
--      failed with "new row violates row-level security policy". The guard now also admits can_approve_photos() (photos.approve); the other
--      conditions are untouched, so a Medical-only login still cannot move a photo out of the Medical folder.
--   3. Run fundraising appeals reads the medical history, READ ONLY (his answer: "Make it a yes"): it includes View medical. No edit cell.
--   4. Send to hospital moves to the medical card (his words: "send to hospital is a medical function so should only be visible through the
--      medical card"). placement.hospital leaves Residents and joins Manage medical (medical_records), the action card, not View medical.
--      THE ONE-WAY DOOR, read from production 2026-10-26 (check-production role-cards): Residents is held by management, second_in_command and
--      staff; Manage medical by staff only. Management and the 2IC therefore LOSE Send to hospital unless someone gives them Manage medical in
--      Settings. Decided by him: let them lose it (not widened here). The NOTICE below names every role that loses it on the database this runs on.
-- Adds no card (the count stays 32). Nothing is granted to Admin and no role key is read. Re-runnable.

create temp table pre_0269 on commit drop as
  select rp.role_id, rp.activity, rp.level from public.role_permissions rp;

-- ---------------------------------------------------------------------------
-- 1. record_attachment(): a resident photo is admitted by photos.resident_add OR photos.shelter_add
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
begin
  -- 0220: purpose is bill or report, and a report hangs on a visit only.
  if p_purpose is null or p_purpose not in ('bill', 'report') or (p_purpose = 'report' and p_owner_type <> 'clinic_visit') then
    raise exception 'Not a valid attachment purpose.';
  end if;

  v_allowed := case p_owner_type
    -- 0269: photos.shelter_add (Add Shelter Photos) is admitted here too; the Shelter-folder rule below is what confines it.
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

  -- 0217 CHANGE 1, card half only: photos.shelter_add admits a resident photo in the SHELTER folder, not an adopter's.
  if p_owner_type = 'resident'
     and not (select can_publish_resident_photos())
     and (p_adoption_update_id is not null
          or lower(btrim(coalesce(p_sub_folder, ''))) <> 'medical')
     and not (
       p_adoption_update_id is null
       and lower(btrim(coalesce(p_sub_folder, ''))) = 'shelter'
       and coalesce((select has_permission('photos.shelter_add')), false)
     ) then
    raise exception 'This login can add photos to the Medical folder only.';
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
  if p_owner_type = 'resident' and v_attachment.approved_at is not null
     and lower(btrim(coalesce(p_sub_folder, ''))) <> 'medical' then
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
-- 2. The update guard admits a login that may approve (Approve, Wrong animal)
-- ---------------------------------------------------------------------------
alter policy attachments_update_folder_guard on public.attachments
  with check (
    owner_type <> 'resident'
    or lower(btrim(coalesce(sub_folder, ''))) = 'medical'
    or (select can_publish_resident_photos())
    or (select can_approve_photos())
  );

-- ---------------------------------------------------------------------------
-- 3. Run fundraising appeals: the medical history at READ, through View medical
-- ---------------------------------------------------------------------------
insert into card_includes (card, included_card) values ('run_appeals', 'view_medical') on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 4. Send to hospital moves from Residents to Manage medical
-- ---------------------------------------------------------------------------
insert into card_grants (card, activity, level) values ('medical_records', 'placement.hospital', 2)
on conflict (card, activity) do update set level = excluded.level;
delete from card_grants where card = 'residents' and activity = 'placement.hospital';

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- 5. The record: what every role gained and lost
-- ---------------------------------------------------------------------------
-- This table is only a statement boundary: scripts/check-hard-coded-security.mjs reads everything after a function up to the next
-- CREATE as that function's body, and the report below joins roles (to print role keys), which is not a role read by record_attachment().
create temp table report_0269_marker (n int) on commit drop;

do $report$
declare
  r record;
  gained text;
  lost text;
begin
  for r in select id, key from public.roles where kind <> 'fixed' order by key loop
    select string_agg(rp.activity || ':' || rp.level, ', ' order by rp.activity) into gained
      from public.role_permissions rp
     where rp.role_id = r.id
       and not exists (select 1 from pre_0269 p where p.role_id = r.id and p.activity = rp.activity and p.level = rp.level);
    select string_agg(p.activity || ':' || p.level, ', ' order by p.activity) into lost
      from pre_0269 p
     where p.role_id = r.id
       and not exists (select 1 from public.role_permissions rp where rp.role_id = r.id and rp.activity = p.activity and rp.level = p.level);
    if gained is not null or lost is not null then
      raise notice '0269 % | now: % | no longer: %', r.key, coalesce(gained, '-'), coalesce(lost, '-');
    end if;
  end loop;
end
$report$;

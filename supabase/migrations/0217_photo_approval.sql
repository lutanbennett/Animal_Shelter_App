-- consumer: src/lib/permissions/catalogue.ts, src/lib/google/drive-client.ts, src/app/photos/add/page.tsx, src/app/api/photos, scripts/check-public-views.mjs
--
-- SCHEMA half of two backlog items: "A separate 'Add resident photos' card ... Shelter folder only" and "Photos filed
-- by a volunteer stay unpublished until Management approves them". NOTHING IN src/ READS THESE COLUMNS OR THIS
-- ACTIVITY YET. When this merges, no volunteer can file a Shelter photo and nobody can approve one: the card, the
-- folder choice, the approval queue and the Waiting label are the app half. See docs/decisions/2026-10-17-photo-approval-schema.md.
--
-- 1. A NEW ACTIVITY, photos.shelter_add (yes/no): may file a resident photo into the SHELTER folder, and nowhere else.
--    "Shelter only" is a property of the login, not of the page. photos.resident_publish still means every folder and
--    still publishes on save. record_attachment() learns it below; the restrictive folder guards on attachments (0152)
--    are untouched, so a direct table write by such a login is still refused and only record_attachment() admits it.
--
-- 2. AN APPROVAL STATE ON attachments: approved_at / approved_by, NULL = WAITING. Every public path below shows
--    approved photos only. Set by a trigger, never taken from the caller:
--      approved on save  - a login that may publish (can_publish_resident_photos), service_role / scripts (auth.uid()
--                          null), a Medical-folder photo (never on a resident view; approval is about the website),
--                          an adopter's photo (gated by its own share_publicly), any non-resident attachment.
--      WAITING           - a resident photo outside Medical filed by anyone else (the shelter_add login).
--    Only a login that may publish can approve (or un-approve), and approved_by is stamped by the database.
--
-- 3. THE BACK-FILL. Every attachment that exists when the column is added is approved. It runs once, in the same
--    transaction as the column and BEFORE any view starts filtering, guarded so a re-run cannot approve a waiting photo.
--    Without it every photo on the public site would vanish at once. Proved in the test plan with before/after counts.
--
-- 4. WHAT ANON READS. Approved only, in public_resident_photos, the profile photo in public_resident_cards /
--    public_resident_profiles / public_recent_adoptions (a waiting profile photo reads as none), public_adoption_updates,
--    and the appeal views. is_public_drive_file (0084...0210) asks those views, so the direct file URL follows them and
--    is NOT touched. is_known_drive_file is service_role only and is NOT touched.
--
-- 5. APPEALS (0210/0216) COMBINE LIKE THIS: a photo must be approved AND, if it is in the Medical folder, medical_ok.
--    A Medical photo is approved on save, so the appeal's own medical_ok tick remains the only gate for it and 0216's
--    behaviour is unchanged. A Shelter photo that is still waiting cannot be attached to an appeal (guard) or shown
--    on one (views), so an appeal cannot publish what the resident page would not.
--
-- Additive and re-runnable. To undo, in a new file: restore 0216's two appeal views and appeal_photos_guard(), 0215's
-- and 0205's views, 0101's view, 0214's view and 0190's record_attachment(); drop the trigger, function, two columns
-- and the activity row.

-- ---------------------------------------------------------------------------
-- 1. The activity
-- ---------------------------------------------------------------------------
insert into permission_activities (key, kind, area, sort)
values ('photos.shelter_add', 'yesno', 'photos', 65)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;

-- ---------------------------------------------------------------------------
-- 2 + 3. The columns, and the back-fill in the same transaction
-- ---------------------------------------------------------------------------
do $backfill$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'attachments' and column_name = 'approved_at'
  ) then
    alter table attachments add column approved_at timestamptz;
    alter table attachments add column approved_by uuid references auth.users (id) on delete set null;
    -- Only on the run that adds the column. A re-run must never approve a photo that is waiting.
    -- A deceased resident's record is read-only (0026); the lock has a transaction-local bypass for exactly this.
    perform set_config('app.deceased_lock_bypass', 'on', true);
    update attachments set approved_at = coalesce(uploaded_at, now()) where approved_at is null;
    perform set_config('app.deceased_lock_bypass', 'off', true);
  end if;
end
$backfill$;

comment on column attachments.approved_at is
  'NULL = waiting for approval, and absent from every public view (0217). Set by attachments_approval_stamp, never by the caller. Back-filled for every photo that existed in 0217.';
comment on column attachments.approved_by is
  'Who approved it. NULL for a photo approved on save by a script, or back-filled (0217).';

create or replace function attachments_approval_stamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.owner_type <> 'resident'
       or lower(btrim(coalesce(new.sub_folder, ''))) = 'medical'
       or new.adoption_update_id is not null
       or auth.uid() is null
       or coalesce((select can_publish_resident_photos()), false) then
      new.approved_at := now();
      new.approved_by := auth.uid();
    else
      new.approved_at := null;
      new.approved_by := null;
    end if;
    return new;
  end if;

  if new.approved_at is distinct from old.approved_at or new.approved_by is distinct from old.approved_by then
    if auth.uid() is not null and not coalesce((select can_publish_resident_photos()), false) then
      raise exception 'You do not have permission to approve a photo';
    end if;
    if new.approved_at is null then
      new.approved_by := null;
    elsif old.approved_at is null then
      new.approved_at := now();
      new.approved_by := auth.uid();
    else
      new.approved_at := old.approved_at;
      new.approved_by := old.approved_by;
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function attachments_approval_stamp() from public, anon, authenticated;

drop trigger if exists attachments_approval_stamp on attachments;
create trigger attachments_approval_stamp
  before insert or update on attachments
  for each row execute function attachments_approval_stamp();

-- ---------------------------------------------------------------------------
-- record_attachment(): 0190's body with TWO changes, both marked.
-- ---------------------------------------------------------------------------
create or replace function public.record_attachment(p_owner_type attachment_owner_type, p_owner_id uuid, p_drive_file_id text, p_file_name text DEFAULT NULL::text, p_sub_folder text DEFAULT NULL::text, p_date_taken date DEFAULT NULL::date, p_adoption_update_id uuid DEFAULT NULL::uuid)
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
  or (v_clinic and p_owner_type in ('resident', 'blood_test', 'procedure'));

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

  insert into attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name, date_taken, uploaded_by, adoption_update_id)
  values (p_owner_type, p_owner_id, p_sub_folder, p_drive_file_id, p_file_name, p_date_taken, auth.uid(), p_adoption_update_id)
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

-- ---------------------------------------------------------------------------
-- 4. What anon reads: approved only. Column lists, names and types are the live ones, restated unchanged.
-- ---------------------------------------------------------------------------
create or replace view public_resident_photos as
select
  a.id,
  a.owner_id as resident_id,
  a.drive_file_id,
  a.uploaded_at
from attachments a
join residents r on r.id = a.owner_id
where a.owner_type = 'resident'
  and lower(btrim(coalesce(a.sub_folder, ''))) <> 'medical'
  and a.approved_at is not null
  and r.is_public_visible = true
  and coalesce(
    (select s.current_status from private.resident_current_state s where s.resident_id = r.id),
    'Resident'
  ) not in ('Deceased', 'Adopted')
order by a.uploaded_at asc;

grant select on public_resident_photos to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_resident_photos from anon, authenticated;

create or replace view public_resident_cards as
select
  r.id,
  r.resident_code,
  r.name,
  r.thai_name,
  r.species,
  r.breed,
  r.sex,
  r.size,
  r.colour,
  r.is_desexed,
  r.estimated_age_years,
  r.age_estimated_on,
  r.intake_date,
  r.bio,
  r.temperament_notes,
  case when exists (
    select 1 from attachments a
     where a.owner_type = 'resident'
       and a.owner_id = r.id
       and a.drive_file_id = r.profile_photo_drive_file_id
       and (lower(btrim(coalesce(a.sub_folder, ''))) = 'medical' or a.approved_at is null)
  ) then null else r.profile_photo_drive_file_id end as profile_photo_drive_file_id,
  r.ready_for_adoption,
  r.is_public_visible,
  r.good_with_dogs,
  r.good_with_cats,
  r.good_with_children,
  r.energy_level,
  private.approved_translations('residents', r.id) as translations,
  case
    when s.current_status in ('Adopted', 'Deceased') then s.current_status
    else 'Resident'
  end as status,
  r.breed_th,
  r.colour_th
from residents r
left join private.resident_current_state s on s.resident_id = r.id;

grant select on public_resident_cards to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_resident_cards from anon, authenticated;

create or replace view public_resident_profiles as
select
  r.id,
  r.name,
  r.species,
  r.breed,
  r.sex,
  r.ready_for_adoption,
  r.bio,
  r.temperament_notes,
  r.past_story_notes,
  case when exists (
    select 1 from attachments a
     where a.owner_type = 'resident'
       and a.owner_id = r.id
       and a.drive_file_id = r.profile_photo_drive_file_id
       and (lower(btrim(coalesce(a.sub_folder, ''))) = 'medical' or a.approved_at is null)
  ) then null else r.profile_photo_drive_file_id end as profile_photo_drive_file_id,
  r.estimated_age_years,
  r.intake_date,
  r.age_estimated_on,
  r.size,
  private.approved_translations('residents', r.id) as translations,
  r.good_with_dogs,
  r.good_with_cats,
  r.good_with_children,
  r.energy_level,
  r.colour,
  r.is_desexed,
  exists (
    select 1 from immunization_records i
     where i.resident_id = r.id and i.archived_at is null
  ) as is_vaccinated,
  r.hook_line,
  r.ideal_home,
  (r.microchip_number is not null) as is_microchipped,
  r.breed_th,
  r.colour_th
from residents r
where r.is_public_visible = true
  and coalesce(
    (select s.current_status from private.resident_current_state s where s.resident_id = r.id),
    'Resident'
  ) not in ('Deceased', 'Adopted');

grant select on public_resident_profiles to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_resident_profiles from anon, authenticated;

create or replace view public_recent_adoptions as
select
  p.id,
  r.name,
  r.species,
  case
    when exists (
      select 1 from attachments a
       where a.owner_type = 'resident'::attachment_owner_type
         and a.owner_id = r.id
         and a.drive_file_id = r.profile_photo_drive_file_id
         and (lower(btrim(coalesce(a.sub_folder, ''::text))) = 'medical'::text or a.approved_at is null)
    ) then null::text
    else r.profile_photo_drive_file_id
  end as profile_photo_drive_file_id,
  shelter_date(p.start_date) as adopted_on,
  r.id as resident_id
from placement_history p
join residents r on r.id = p.resident_id
where p.placement_type = 'Adopt'::placement_type
  and p.end_date is null
  and p.start_date >= (now() - interval '90 days')
  and r.is_public_visible = true
  and not exists (
    select 1 from private.resident_current_state s
     where s.resident_id = r.id and s.current_status = 'Deceased'::text
  );

grant select on public_recent_adoptions to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_recent_adoptions from anon, authenticated;

create or replace view public_adoption_updates as
select
  u.id,
  u.resident_id,
  att.drive_file_id,
  u.public_story,
  u.public_first_name
from adoption_updates u
join residents r on r.id = u.resident_id
join attachments att on att.adoption_update_id = u.id
where u.share_publicly = true
  and r.is_public_visible = true
  and coalesce(
    (select s.current_status from private.resident_current_state s where s.resident_id = r.id),
    'Resident'
  ) <> 'Deceased'
  and att.owner_type = 'resident'
  and lower(btrim(coalesce(att.sub_folder, ''))) <> 'medical'
  and att.approved_at is not null
  and att.file_name ~* '\.(jpe?g|png|webp|heic|heif|gif)$'
order by u.received_on desc, att.uploaded_at;

grant select on public_adoption_updates to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_adoption_updates from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Appeals: 0216's views and guard, with approval added to each.
-- ---------------------------------------------------------------------------
create or replace function appeal_photos_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resident uuid;
  v_att attachments;
begin
  select resident_id into v_resident from appeals where id = new.appeal_id;
  select * into v_att from attachments where id = new.attachment_id;
  if v_att.id is null or v_att.owner_type <> 'resident' or v_att.owner_id is distinct from v_resident then
    raise exception 'An appeal can only show photos of its own resident';
  end if;
  if v_att.file_name is null or v_att.file_name !~* '\.(jpe?g|png|webp|heic|heif|gif)$' then
    raise exception 'Only image files can be shown on an appeal';
  end if;
  -- 0217: a photo still waiting for approval cannot be put on an appeal (an existing row may still be edited).
  if v_att.approved_at is null
     and (tg_op = 'INSERT' or new.appeal_id is distinct from old.appeal_id or new.attachment_id is distinct from old.attachment_id) then
    raise exception 'A photo that is waiting for approval cannot be shown on an appeal';
  end if;
  if lower(btrim(coalesce(v_att.sub_folder, ''))) = 'medical'
     and not new.medical_ok
     and (tg_op = 'INSERT' or new.appeal_id is distinct from old.appeal_id or new.attachment_id is distinct from old.attachment_id) then
    raise exception 'A photo filed under Medical can be shown on an appeal only when it is chosen as a medical photo';
  end if;
  return new;
end;
$$;

revoke execute on function appeal_photos_guard() from public, anon, authenticated;

create or replace view public_appeals as
select
  a.id,
  a.resident_id,
  r.name as resident_name,
  r.thai_name as resident_thai_name,
  r.species,
  a.title,
  a.what_is_wrong,
  a.treatment_needed,
  a.cost_covers,
  a.target_amount,
  coalesce((
    select sum(l.amount)
      from donations d
      join donation_lines l on l.donation_id = d.id
     where d.designation = 'appeal'
       and d.designation_appeal_id = a.id
  ), 0)::numeric(12, 2) as raised_amount,
  (select max(d.created_at) from donations d
    where d.designation = 'appeal' and d.designation_appeal_id = a.id) as raised_as_of,
  a.deadline,
  a.status,
  a.outcome_note,
  a.display_style,
  a.social_links,
  (select att.drive_file_id
     from appeal_photos p
     join attachments att on att.id = p.attachment_id
    where p.appeal_id = a.id and p.is_cover
      and att.owner_type = 'resident' and att.owner_id = a.resident_id
      and att.approved_at is not null
      and (lower(btrim(coalesce(att.sub_folder, ''))) <> 'medical' or p.medical_ok)
      and att.file_name ~* '\.(jpe?g|png|webp|heic|heif|gif)$') as cover_drive_file_id,
  coalesce((select p.is_graphic
     from appeal_photos p
    where p.appeal_id = a.id and p.is_cover), false) as cover_is_graphic,
  a.published_at,
  a.closed_at,
  private.approved_translations('appeals'::text, a.id) as translations,
  coalesce((select p.medical_ok
     from appeal_photos p
     join attachments att on att.id = p.attachment_id
    where p.appeal_id = a.id and p.is_cover
      and lower(btrim(coalesce(att.sub_folder, ''))) = 'medical'), false) as cover_is_medical
from appeals a
join residents r on r.id = a.resident_id
where a.published
  and a.status <> 'draft'
  and r.is_public_visible = true;

grant select on public_appeals to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_appeals from anon, authenticated;

create or replace view public_appeal_photos as
select
  p.id,
  p.appeal_id,
  att.drive_file_id,
  p.position,
  p.is_cover,
  p.is_graphic,
  (lower(btrim(coalesce(att.sub_folder, ''))) = 'medical') as is_medical
from appeal_photos p
join appeals a on a.id = p.appeal_id
join residents r on r.id = a.resident_id
join attachments att on att.id = p.attachment_id
where a.published
  and a.status <> 'draft'
  and r.is_public_visible = true
  and att.owner_type = 'resident'
  and att.owner_id = a.resident_id
  and att.approved_at is not null
  and (lower(btrim(coalesce(att.sub_folder, ''))) <> 'medical' or p.medical_ok)
  and att.file_name ~* '\.(jpe?g|png|webp|heic|heif|gif)$'
order by p.position, p.created_at;

comment on view public_appeal_photos is
  'Photos of published appeals (0210, 0216, 0217). Approved photos only; a Medical-folder file also needs medical_ok on the appeal. is_public_drive_file reads this view, so the direct file URL follows it.';

grant select on public_appeal_photos to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_appeal_photos from anon, authenticated;

notify pgrst, 'reload schema';

-- consumer: src/app/api/events/[id]/photos/route.ts, src/app/management/events/actions.ts, src/lib/events/staff.ts, src/lib/photos/approval.ts, scripts/check-public-views.mjs
--
-- FUNDRAISING EVENTS, app half (item #2zi2j). 0312 shipped the tables, the activity events.run and the card; this opens the
-- last doors the staff screens need and adds the two public views (the page that reads them is the next stream's).
--
--   1. attachments policies (select / insert / update / delete) gain an 'event' branch. Without one an 'event' row fell to
--      the ELSE (bill_owner_can) and nobody could read, approve or remove an event photo. Reading is events.run OR
--      photos.approve (an approver must see what is waiting); removing and approving is events.run OR can_approve_photos().
--   2. record_attachment() (live body 0311) files an 'event' attachment for a login holding events.run, and for nobody
--      else. 0312's approval stamp then leaves it unapproved unless the filer can approve.
--   3. public_fundraising_events / public_fundraising_event_photos: published and not cancelled; a photo only once approved
--      (attachments.approved_at), an image, and filed under that event. appeal_id / project_folder_id are shown only when
--      that appeal / project is itself public. is_public_drive_file() reads the photo view so the photo proxy serves it.
--
-- Nothing is widened for any other owner type. Re-runnable: alter policy / create or replace.

-- 1. attachments policies ------------------------------------------------------------------------------------------------
alter policy "attachments_select_perm" on public.attachments
  using (CASE owner_type
    WHEN 'resident'::attachment_owner_type THEN (( SELECT CASE
        WHEN lower(btrim(coalesce(attachments.sub_folder, ''), E' \t\r\n\f\v')) = 'medical'
          THEN has_permission('photos.resident_medical'::text, 'read'::text)
        ELSE has_permission('resident.record'::text, 'read'::text)
      END AS has_permission))
    WHEN 'blood_test'::attachment_owner_type THEN (( SELECT has_permission('medical.blood_tests'::text, 'read'::text) AS has_permission))
    WHEN 'procedure'::attachment_owner_type THEN (( SELECT has_permission('medical.procedures'::text, 'read'::text) AS has_permission))
    WHEN 'maintenance'::attachment_owner_type THEN ( SELECT has_permission('maintenance.photos'::text) AS has_permission)
    WHEN 'project'::attachment_owner_type THEN ( SELECT has_permission('projects.photos'::text) AS has_permission)
    WHEN 'event'::attachment_owner_type THEN (( SELECT has_permission('events.run'::text) OR has_permission('photos.approve'::text) ))
    WHEN 'clinic_visit'::attachment_owner_type THEN (( SELECT bill_owner_can(attachments.owner_type, false) AS bill_owner_can))
    ELSE ( SELECT bill_owner_can(attachments.owner_type, false) AS bill_owner_can)
END);

alter policy "attachments_insert_perm" on public.attachments
  with check (CASE owner_type
    WHEN 'resident'::attachment_owner_type THEN (( SELECT has_permission('photos.resident_add'::text) AS has_permission))
    WHEN 'blood_test'::attachment_owner_type THEN (( SELECT has_permission('medical.blood_tests'::text) AS has_permission))
    WHEN 'procedure'::attachment_owner_type THEN (( SELECT has_permission('medical.procedures'::text) AS has_permission))
    WHEN 'maintenance'::attachment_owner_type THEN ( SELECT has_permission('maintenance.photos'::text) AS has_permission)
    WHEN 'project'::attachment_owner_type THEN ( SELECT has_permission('projects.photos'::text) AS has_permission)
    WHEN 'event'::attachment_owner_type THEN ( SELECT has_permission('events.run'::text) AS has_permission)
    WHEN 'clinic_visit'::attachment_owner_type THEN (( SELECT bill_owner_can(attachments.owner_type, true) AS bill_owner_can))
    ELSE ( SELECT bill_owner_can(attachments.owner_type, true) AS bill_owner_can)
END);

alter policy "attachments_update_perm" on public.attachments
  using (CASE owner_type
    WHEN 'resident'::attachment_owner_type THEN (( SELECT has_permission('photos.resident_manage'::text) AS has_permission))
    WHEN 'blood_test'::attachment_owner_type THEN (( SELECT has_permission('medical.blood_tests'::text) AS has_permission))
    WHEN 'procedure'::attachment_owner_type THEN (( SELECT has_permission('medical.procedures'::text) AS has_permission))
    WHEN 'maintenance'::attachment_owner_type THEN ( SELECT has_permission('maintenance.photos'::text) AS has_permission)
    WHEN 'project'::attachment_owner_type THEN ( SELECT has_permission('projects.photos'::text) AS has_permission)
    WHEN 'event'::attachment_owner_type THEN (( SELECT has_permission('events.run'::text) OR can_approve_photos() ))
    WHEN 'clinic_visit'::attachment_owner_type THEN (( SELECT bill_owner_can(attachments.owner_type, true) AS bill_owner_can))
    ELSE ( SELECT bill_owner_can(attachments.owner_type, true) AS bill_owner_can)
END)
  with check (CASE owner_type
    WHEN 'resident'::attachment_owner_type THEN (( SELECT has_permission('photos.resident_manage'::text) AS has_permission))
    WHEN 'blood_test'::attachment_owner_type THEN (( SELECT has_permission('medical.blood_tests'::text) AS has_permission))
    WHEN 'procedure'::attachment_owner_type THEN (( SELECT has_permission('medical.procedures'::text) AS has_permission))
    WHEN 'maintenance'::attachment_owner_type THEN ( SELECT has_permission('maintenance.photos'::text) AS has_permission)
    WHEN 'project'::attachment_owner_type THEN ( SELECT has_permission('projects.photos'::text) AS has_permission)
    WHEN 'event'::attachment_owner_type THEN (( SELECT has_permission('events.run'::text) OR can_approve_photos() ))
    WHEN 'clinic_visit'::attachment_owner_type THEN (( SELECT bill_owner_can(attachments.owner_type, true) AS bill_owner_can))
    ELSE ( SELECT bill_owner_can(attachments.owner_type, true) AS bill_owner_can)
END);

alter policy "attachments_delete_perm" on public.attachments
  using (CASE owner_type
    WHEN 'resident'::attachment_owner_type THEN (( SELECT has_permission('photos.resident_manage'::text) AS has_permission))
    WHEN 'blood_test'::attachment_owner_type THEN (( SELECT has_permission('medical.blood_tests'::text) AS has_permission))
    WHEN 'procedure'::attachment_owner_type THEN (( SELECT has_permission('medical.procedures'::text) AS has_permission))
    WHEN 'maintenance'::attachment_owner_type THEN ( SELECT has_permission('maintenance.photos'::text) AS has_permission)
    WHEN 'project'::attachment_owner_type THEN ( SELECT has_permission('projects.photos'::text) AS has_permission)
    WHEN 'event'::attachment_owner_type THEN (( SELECT has_permission('events.run'::text) OR can_approve_photos() ))
    WHEN 'clinic_visit'::attachment_owner_type THEN (( SELECT bill_owner_can(attachments.owner_type, true) AS bill_owner_can))
    ELSE ( SELECT bill_owner_can(attachments.owner_type, true) AS bill_owner_can)
END);

-- 2. record_attachment: the 0311 body with ONE added line (when 'event') --------------------------------------------------
create or replace function public.record_attachment(
  p_owner_type attachment_owner_type,
  p_owner_id uuid,
  p_drive_file_id text,
  p_file_name text default null,
  p_sub_folder text default null,
  p_date_taken date default null,
  p_adoption_update_id uuid default null,
  p_purpose text default 'bill',
  p_media_kind text default 'photo'
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
  v_is_picture boolean;
  v_illustrates boolean := false;
begin
  if p_purpose is null or p_purpose not in ('bill', 'report') or (p_purpose = 'report' and p_owner_type <> 'clinic_visit') then
    raise exception 'Not a valid attachment purpose.';
  end if;

  if p_media_kind is null or p_media_kind not in ('photo', 'video') then
    raise exception 'Not a valid media kind.';
  end if;
  v_is_picture := p_media_kind = 'photo' and coalesce(p_file_name, '') !~* '[.](mp4|mov|m4v|webm|mkv|avi|3gp|mpg|mpeg|wmv)[[:space:]]*$';

  if p_owner_type::text = 'resident' and p_adoption_update_id is not null then
    v_illustrates := coalesce((select has_permission('resident.adoption_news')), false)
      and exists (
        select 1 from adoption_updates u
         where u.id = p_adoption_update_id
           and u.resident_id = p_owner_id
           and lower(btrim(coalesce(p_sub_folder, ''))) = to_char(u.received_on, 'YYYYMMDD')
      );
  end if;

  v_allowed := case p_owner_type::text
    when 'resident' then v_illustrates
                      or coalesce((select has_permission('photos.resident_add')), false)
                      or coalesce((select has_permission('photos.shelter_add')), false)
    when 'blood_test' then coalesce((select has_permission('medical.blood_tests')), false)
    when 'procedure' then coalesce((select has_permission('medical.procedures')), false)
    when 'maintenance' then coalesce((select has_permission('maintenance.photos')), false)
    when 'project' then coalesce((select has_permission('projects.photos')), false)
    when 'event' then coalesce((select has_permission('events.run')), false)
    when 'clinic_visit' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'stock_receipt' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'stock_delivery' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'bill_inbox' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'maintenance_bill' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'utility_bill' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'general_bill' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    else false
  end;

  if not v_allowed then
    raise exception 'Not authorized to add attachments.';
  end if;

  if p_owner_type::text = 'event' and not exists (select 1 from fundraising_events e where e.id = p_owner_id) then
    raise exception 'That event does not exist.';
  end if;

  if p_owner_type::text = 'resident' and v_medical
     and not coalesce((select has_permission('photos.medical_add')), false) then
    raise exception 'This login may not add photos to the Medical folder.';
  end if;

  if p_owner_type::text = 'resident'
     and not v_medical
     and not v_illustrates
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
       and p_owner_type::text = 'resident'
       and u.resident_id = p_owner_id
  ) then
    raise exception 'That adoption update is not about this resident.';
  end if;

  insert into attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name, date_taken, uploaded_by, adoption_update_id, purpose, media_kind)
  values (p_owner_type, p_owner_id, p_sub_folder, p_drive_file_id, p_file_name, p_date_taken, auth.uid(), p_adoption_update_id, p_purpose, p_media_kind)
  returning * into v_attachment;

  if p_owner_type::text = 'resident' and v_attachment.approved_at is not null and not v_medical and v_is_picture then
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

revoke all on function public.record_attachment(attachment_owner_type, uuid, text, text, text, date, uuid, text, text) from public, anon;
grant execute on function public.record_attachment(attachment_owner_type, uuid, text, text, text, date, uuid, text, text) to authenticated, service_role;

-- 3. What anon reads -----------------------------------------------------------------------------------------------------
-- Owner-run, so the WHERE clauses are the only thing between anon and a draft, a cancelled event or a photo nobody approved.
create or replace view public_fundraising_events as
select
  e.id,
  e.title,
  e.summary,
  e.description,
  e.event_date,
  e.end_date,
  e.location,
  e.status,
  e.social_links,
  (select a.id from public_appeals a where a.id = e.appeal_id) as appeal_id,
  (select p.id from public_projects p where p.id = e.project_folder_id) as project_folder_id,
  (select att.drive_file_id
     from fundraising_event_photos p
     join attachments att on att.id = p.attachment_id
    where p.event_id = e.id and p.is_cover and not p.is_meme
      and att.owner_type = 'event' and att.owner_id = e.id
      and att.approved_at is not null
      and att.file_name ~* '\.(jpe?g|png|webp|heic|heif|gif)$') as cover_drive_file_id,
  e.published_at,
  private.approved_translations('fundraising_events'::text, e.id) as translations
from fundraising_events e
where e.published
  and e.status <> 'cancelled';

comment on view public_fundraising_events is
  'Published, not cancelled fundraising events for the public site (0314). Owner-run. Links to an appeal or project only when that one is public itself.';

grant select on public_fundraising_events to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_fundraising_events from anon, authenticated;

create or replace view public_fundraising_event_photos as
select
  p.id,
  p.event_id,
  att.drive_file_id,
  p.position,
  p.is_cover,
  p.is_meme
from fundraising_event_photos p
join fundraising_events e on e.id = p.event_id
join attachments att on att.id = p.attachment_id
where e.published
  and e.status <> 'cancelled'
  and att.owner_type = 'event'
  and att.owner_id = e.id
  and att.approved_at is not null
  and att.file_name ~* '\.(jpe?g|png|webp|heic|heif|gif)$'
order by p.position, p.created_at;

comment on view public_fundraising_event_photos is
  'Approved image files in the gallery of a published event (0314). attachments.approved_at is the gate, as on every public photo path.';

grant select on public_fundraising_event_photos to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_fundraising_event_photos from anon, authenticated;

-- 4. The photo proxy serves an approved event photo: 0285's body plus one arm ------------------------------------------------
create or replace function is_public_drive_file(p_drive_file_id text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public_site_content where hero_drive_file_id = p_drive_file_id
      or donate_photo_drive_file_id = p_drive_file_id
      or foster_photo_drive_file_id = p_drive_file_id
      or volunteer_photo_drive_file_id = p_drive_file_id
      or about_photo_drive_file_id = p_drive_file_id
    union all
    select 1 from public_site_content_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from public_shelter_friends where logo_drive_file_id = p_drive_file_id
    union all
    select 1 from public_resident_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from public_project_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from public_projects where cover_drive_file_id = p_drive_file_id
    union all
    select 1 from public_resident_profiles where profile_photo_drive_file_id = p_drive_file_id
    union all
    select 1 from public_recent_adoptions where profile_photo_drive_file_id = p_drive_file_id
    union all
    select 1 from public_resident_cards where profile_photo_drive_file_id = p_drive_file_id
    union all
    select 1 from public_donation_channels where qr_drive_file_id = p_drive_file_id
    union all
    select 1 from public_appeal_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from public_adoption_updates where drive_file_id = p_drive_file_id
    union all
    select 1 from public_shop_links where photo_drive_file_id = p_drive_file_id
    union all
    select 1 from public_fundraising_event_photos where drive_file_id = p_drive_file_id
  );
$$;

revoke execute on function is_public_drive_file(text) from public;
grant execute on function is_public_drive_file(text)
  to anon, authenticated, service_role;

notify pgrst, 'reload schema';

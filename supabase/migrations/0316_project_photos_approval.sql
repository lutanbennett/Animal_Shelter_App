-- consumer: src/lib/photos/approval.ts, src/app/photos/approve/actions.ts, src/app/photos/approve/ProjectPhotoQueue.tsx, scripts/check-public-views.mjs
--
-- PROJECT PHOTOS WAIT FOR APPROVAL (item #k7v2p). Until now a photo filed in a public project folder was on the website the
-- moment it was saved: 0217 stamped every non-resident attachment approved, and public_project_photos never asked.
--
--   1. attachments_approval_stamp(): a 'project' IMAGE is approved on save only for a session with no login or a login that
--      can approve photos (can_approve_photos(), photos.approve). Anyone else's waits. A non-image project file (a PDF) is
--      approved on save as before: it was never public (0109) and would only clutter the queue. 0312's body otherwise.
--   2. attachments policies, 'project' branch: an approver may READ (photos.approve) and APPROVE / REMOVE (can_approve_photos())
--      a waiting project photo, as for events (0314). Without this an approver without projects.photos sees an empty queue.
--   3. public_project_photos gains `a.approved_at is not null`. is_public_drive_file() reads this view, so the photo proxy
--      follows it and is NOT redefined here (0314's body already lists the view).
--   4. public_projects is the SECOND PATH, and the one the brief did not name: cover_drive_file_id and photo_count read
--      attachments directly, so a waiting photo could be a project's cover (and be served by the proxy through
--      public_projects) and be counted. Both now ask approved_at, including an explicitly chosen cover_attachment_id.
--
-- THE BACK-FILL. None is written, on purpose, and the reason is checkable: until this file the stamp approved every project
-- attachment on insert, so every project attachment that exists is already approved (0217 also back-filled everything before
-- it). Nothing currently public disappears. A back-fill UPDATE here would also approve a photo that was waiting on a re-run.
-- Proved in the test plan with a before/after count of approved_at is null for owner_type = 'project' (must be 0 before).
--
-- Re-runnable: create or replace / alter policy, idempotent grants. private.approved_translations is schema-qualified
-- as 0109 requires.
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
    WHEN 'project'::attachment_owner_type THEN (( SELECT has_permission('projects.photos'::text) OR has_permission('photos.approve'::text) ))
    WHEN 'event'::attachment_owner_type THEN (( SELECT has_permission('events.run'::text) OR has_permission('photos.approve'::text) ))
    WHEN 'clinic_visit'::attachment_owner_type THEN (( SELECT bill_owner_can(attachments.owner_type, false) AS bill_owner_can))
    ELSE ( SELECT bill_owner_can(attachments.owner_type, false) AS bill_owner_can)
END);

alter policy "attachments_update_perm" on public.attachments
  using (CASE owner_type
    WHEN 'resident'::attachment_owner_type THEN (( SELECT has_permission('photos.resident_manage'::text) AS has_permission))
    WHEN 'blood_test'::attachment_owner_type THEN (( SELECT has_permission('medical.blood_tests'::text) AS has_permission))
    WHEN 'procedure'::attachment_owner_type THEN (( SELECT has_permission('medical.procedures'::text) AS has_permission))
    WHEN 'maintenance'::attachment_owner_type THEN ( SELECT has_permission('maintenance.photos'::text) AS has_permission)
    WHEN 'project'::attachment_owner_type THEN (( SELECT has_permission('projects.photos'::text) OR can_approve_photos() ))
    WHEN 'event'::attachment_owner_type THEN (( SELECT has_permission('events.run'::text) OR can_approve_photos() ))
    WHEN 'clinic_visit'::attachment_owner_type THEN (( SELECT bill_owner_can(attachments.owner_type, true) AS bill_owner_can))
    ELSE ( SELECT bill_owner_can(attachments.owner_type, true) AS bill_owner_can)
END)
  with check (CASE owner_type
    WHEN 'resident'::attachment_owner_type THEN (( SELECT has_permission('photos.resident_manage'::text) AS has_permission))
    WHEN 'blood_test'::attachment_owner_type THEN (( SELECT has_permission('medical.blood_tests'::text) AS has_permission))
    WHEN 'procedure'::attachment_owner_type THEN (( SELECT has_permission('medical.procedures'::text) AS has_permission))
    WHEN 'maintenance'::attachment_owner_type THEN ( SELECT has_permission('maintenance.photos'::text) AS has_permission)
    WHEN 'project'::attachment_owner_type THEN (( SELECT has_permission('projects.photos'::text) OR can_approve_photos() ))
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
    WHEN 'project'::attachment_owner_type THEN (( SELECT has_permission('projects.photos'::text) OR can_approve_photos() ))
    WHEN 'event'::attachment_owner_type THEN (( SELECT has_permission('events.run'::text) OR can_approve_photos() ))
    WHEN 'clinic_visit'::attachment_owner_type THEN (( SELECT bill_owner_can(attachments.owner_type, true) AS bill_owner_can))
    ELSE ( SELECT bill_owner_can(attachments.owner_type, true) AS bill_owner_can)
END);


-- 1. The stamp: 0312's body with the project-image arm added ----------------------------------------------------------------
create or replace function attachments_approval_stamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if (new.owner_type::text not in ('resident', 'event')
        and not (new.owner_type::text = 'project' and coalesce(new.file_name, '') ~* '\.(jpe?g|png|webp|heic|heif|gif)$'))
       or lower(btrim(coalesce(new.sub_folder, ''))) = 'medical'
       or auth.uid() is null
       or (new.owner_type::text = 'resident' and coalesce((select can_publish_resident_photos()), false))
       or coalesce((select can_approve_photos()), false) then
      new.approved_at := now();
      new.approved_by := auth.uid();
    else
      new.approved_at := null;
      new.approved_by := null;
    end if;
    return new;
  end if;

  if new.approved_at is distinct from old.approved_at or new.approved_by is distinct from old.approved_by then
    if auth.uid() is not null and not coalesce((select can_approve_photos()), false) then
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

-- 3. The gallery view: 0109's body plus the approval condition ------------------------------------------------------------
create or replace view public_project_photos as
select
  a.id,
  a.owner_id as project_id,
  a.drive_file_id,
  a.caption,
  a.sort_order,
  a.date_taken,
  a.uploaded_at,
  private.approved_translations('attachments', a.id) as translations
from attachments a
join project_folders f on f.id = a.owner_id
where a.owner_type = 'project'
  and f.is_public = true
  and f.parent_folder_id is not null
  and a.approved_at is not null
  and a.file_name ~* '\.(jpe?g|png|webp|heic|heif|gif)$';

grant select on public_project_photos to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_project_photos
  from anon, authenticated;

-- 4. The project cards: 0056's body, cover and count counting approved photos only ----------------------------------------
create or replace view public_projects as
select
  f.id,
  f.top_level_category as category,
  f.name as title,
  f.name_th as title_th,
  f.summary,
  f.project_date,
  f.location,
  coalesce(f.project_date, f.created_at::date) as sort_date,
  coalesce(
    (select a.drive_file_id from attachments a where a.id = f.cover_attachment_id and a.approved_at is not null),
    (select a.drive_file_id from attachments a
       where a.owner_type = 'project' and a.owner_id = f.id and a.approved_at is not null
       order by a.sort_order nulls last, a.uploaded_at asc
       limit 1)
  ) as cover_drive_file_id,
  (select count(*) from attachments a
     where a.owner_type = 'project' and a.owner_id = f.id and a.approved_at is not null)::int as photo_count,
  private.approved_translations('project_folders', f.id) as translations
from project_folders f
where f.is_public = true
  and f.parent_folder_id is not null;

grant select on public_projects to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_projects
  from anon, authenticated;

notify pgrst, 'reload schema';

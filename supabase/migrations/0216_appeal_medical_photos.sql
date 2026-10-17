-- consumer: src/app/management/appeals/[id]/page.tsx, src/app/management/appeals/[id]/AppealPhotosEditor.tsx, src/app/management/appeals/actions.ts, src/app/appeals
--
-- Appeals may show a Medical-folder photo, chosen one by one, on that appeal's pages only (backlog, "Appeals may show
-- medical photos", Lutan 2026-10-17: "but this is only for appeals"). SCHEMA half. Nothing in src/ reads these
-- columns on the day this merges, so nobody can pick or see a medical photo yet; the picker, the first-time note and
-- "cover until tapped" are the app half.
--
-- DECISION 3 OF 0210 IS SUPERSEDED, FOR APPEALS ONLY. See docs/decisions/2026-10-17-appeal-medical-photos.md. 0101 and
-- 0103 are untouched: a Medical photo stays off resident profiles, /adopt, the gallery and every other public view.
--
-- THE RULE, POSITIVE AND STRUCTURAL: a Medical-folder file is readable by anon ONLY THROUGH an appeal_photos row with
-- medical_ok = true on a published appeal. It is never public because it is a resident's photo and never because the
-- app "knows" the file. There is nothing to remember to run: public_appeal_photos and public_appeals are live joins, so
-- unpublishing the appeal, unticking the photo, hiding the resident or refiling the file all withdraw it on the next
-- read, and the photo proxy (is_public_drive_file, 0084/0123/0210) asks public_appeal_photos, so the direct file URL
-- goes the same instant. is_known_drive_file (0076/0089) is NOT touched: it answers yes for any file the app holds and
-- is service_role only; widening it would have made every Medical file public.
--
-- WHO MAY TICK IT: the new activity appeal.medical_photo (yes/no), narrower than appeal.run. Editing an appeal and
-- publishing a wound photo are different powers. Admin holds it without a role_permissions row; Management does not
-- unless Settings grants it. Enforced in the trigger below, so a hand-written API call cannot skip the app.
--
-- AUDIT: medical_ok_by / medical_ok_at are stamped by the database (the caller's values are ignored), cleared when
-- the box is unticked, and the audit trigger from 0210 records every change to the row.
--
-- Additive and re-runnable. To undo, in a new file: restore 0210's two views and appeal_photos_guard(), drop the three
-- columns, the stamp trigger and function, and the activity row.

alter table appeal_photos add column if not exists medical_ok boolean not null default false;
alter table appeal_photos add column if not exists medical_ok_by uuid references auth.users (id) on delete set null;
alter table appeal_photos add column if not exists medical_ok_at timestamptz;

comment on column appeal_photos.medical_ok is
  'The ONLY way a Medical-folder file may be attached to an appeal, and the only way it becomes public (0216): visible to anon on this appeal while it is published, nowhere else.';
comment on column appeal_photos.medical_ok_by is 'Who ticked medical_ok. Stamped by appeal_photos_medical_stamp, never taken from the caller.';
comment on column appeal_photos.medical_ok_at is 'When medical_ok was ticked. Cleared when it is unticked.';

insert into permission_activities (key, kind, area, sort)
values ('appeal.medical_photo', 'yesno', 'management', 64)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;

-- ---------------------------------------------------------------------------
-- Guard: a Medical file needs medical_ok; every other wrong file is still refused.
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
  -- Unticking medical_ok on a row already there is allowed (the views then hide it); attaching one is not.
  if lower(btrim(coalesce(v_att.sub_folder, ''))) = 'medical'
     and not new.medical_ok
     and (tg_op = 'INSERT' or new.appeal_id is distinct from old.appeal_id or new.attachment_id is distinct from old.attachment_id) then
    raise exception 'A photo filed under Medical can be shown on an appeal only when it is chosen as a medical photo';
  end if;
  return new;
end;
$$;

revoke execute on function appeal_photos_guard() from public, anon, authenticated;

drop trigger if exists appeal_photos_guard on appeal_photos;
create trigger appeal_photos_guard
  before insert or update of appeal_id, attachment_id, medical_ok on appeal_photos
  for each row execute function appeal_photos_guard();

-- Who may tick it, and the audit stamp. auth.uid() is null for service_role and the owner (scripts), which are not
-- the Data API's signed-in callers and are trusted already.
create or replace function appeal_photos_medical_stamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.medical_ok and (tg_op = 'INSERT' or not old.medical_ok) then
    if auth.uid() is not null and not has_permission('appeal.medical_photo') then
      raise exception 'You do not have permission to show a medical photo on an appeal';
    end if;
    new.medical_ok_by := auth.uid();
    new.medical_ok_at := now();
  elsif new.medical_ok then
    new.medical_ok_by := old.medical_ok_by;
    new.medical_ok_at := old.medical_ok_at;
  else
    new.medical_ok_by := null;
    new.medical_ok_at := null;
  end if;
  return new;
end;
$$;

revoke execute on function appeal_photos_medical_stamp() from public, anon, authenticated;

drop trigger if exists appeal_photos_medical_stamp on appeal_photos;
create trigger appeal_photos_medical_stamp
  before insert or update on appeal_photos
  for each row execute function appeal_photos_medical_stamp();

-- ---------------------------------------------------------------------------
-- What anon reads. 0210's views with the Medical test relaxed ONLY for a medical_ok row, and one column appended
-- (create or replace view allows nothing else): is_medical / cover_is_medical, so the page can say "Medical photo,
-- tap to view" and the share preview can refuse a medical cover.
-- ---------------------------------------------------------------------------
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
  and (lower(btrim(coalesce(att.sub_folder, ''))) <> 'medical' or p.medical_ok)
  and att.file_name ~* '\.(jpe?g|png|webp|heic|heif|gif)$'
order by p.position, p.created_at;

comment on view public_appeal_photos is
  'Photos of published appeals (0210, 0216). A Medical-folder file appears here only through an appeal_photos row with medical_ok on a published appeal; is_medical lets the page cover it. is_public_drive_file reads this view, so the direct file URL follows it.';

grant select on public_appeal_photos to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_appeal_photos from anon, authenticated;

notify pgrst, 'reload schema';

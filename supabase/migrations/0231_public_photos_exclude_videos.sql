-- consumer: src/app/adopt/[id]/page.tsx, src/app/api/videos/[fileId]/route.ts
--
-- App half of "Videos of residents" (0229 carried the schema). public_resident_photos is what the public site
-- draws as pictures; an approved video in it would be drawn as a broken image. Videos are not on the public site
-- yet, so the view lists photos only. A video's own public view is a later, deliberate step. Medical is unaffected:
-- that filter is on sub_folder and stays exactly as 0217 wrote it.
--
-- is_public_drive_file reads this view (0210), so a video's file stops being "public" too: both proxies serve it only to
-- a signed-in login that can see the row. Nothing public can reach a video until its own view exists.
--
-- Column list, names and types are 0217's, restated unchanged. Re-runnable; to undo, restate 0217's view.

create or replace view public_resident_photos as
select
  a.id,
  a.owner_id as resident_id,
  a.drive_file_id,
  a.uploaded_at
from attachments a
join residents r on r.id = a.owner_id
where a.owner_type = 'resident'
  and a.media_kind = 'photo'
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

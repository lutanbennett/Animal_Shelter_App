-- consumer: src/app/api/videos/[fileId]/route.ts
--
-- Schema half of "AN ADOPTION UPDATE CANNOT TAKE A VIDEO". Lutan, 2026-11-02: "Yes, show publicly".
-- public_adoption_updates (0214, approval added in 0217) listed only images of an opted-in update; this adds
-- videos (mp4, mov, m4v, webm) to the one file-name test and changes nothing else. Same columns, same order,
-- same guards: share_publicly, is_public_visible, not Deceased, owner_type resident, never the medical folder,
-- and approved_at (a video waits for approval like a photo). is_public_drive_file() (0285) already reads this
-- view, so /api/videos/[fileId] serves exactly the videos listed here. Nothing in src/ changes in this PR.

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
  and att.file_name ~* '\.(jpe?g|png|webp|heic|heif|gif|mp4|mov|m4v|webm)$'
order by u.received_on desc, att.uploaded_at;

grant select on public_adoption_updates to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public_adoption_updates from anon, authenticated;

notify pgrst, 'reload schema';

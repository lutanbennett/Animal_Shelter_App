-- Keep PDFs out of the public story gallery (backlog, "Keep PDFs out of the
-- public story gallery"; noticed 2026-09-28 while building the file-type
-- icon, claude/file-type-icon, not reproduced).
--
-- The project upload route (src/app/api/projects/[id]/photos/route.ts)
-- accepts PDFs alongside images, and public_project_photos (0042, last
-- redefined in 0056) returned every attachment in a public project folder
-- with no type filter. A PDF filed there would reach /our-work/[id], where
-- StoryGallery.tsx and ThumbnailStrip.tsx render every row as a next/image
-- — a broken picture on the public site. The staff side was already safe:
-- only an image can be chosen as a project's cover, and PhotoSection.tsx
-- shows a PDF as a file icon rather than an <img>.
--
-- The more important half: is_public_drive_file() (0084) asks this view
-- directly (`select 1 from public_project_photos where drive_file_id = …`),
-- so before this fix the photo proxy would also stream a PDF filed in a
-- public project folder to a signed-out visitor who had its link — the
-- same gap 0101 and 0103 closed for resident photos and profile photos.
-- Filtering here closes the gallery and the proxy at once, one definition
-- of public read by both.
--
-- The filter is the same extension list src/lib/uploads/file-kind.ts calls
-- "image": jpg/jpeg, png, webp, heic, heif, gif. Checked on dev
-- 2026-09-28 (qxkmhwybjggxvsfxsxbd): no public project folder holds a PDF
-- or any other non-image attachment today, so this is a closed hole, not a
-- live leak — unlike 0101/0103, which found real rows to fix.
--
-- Re-created from the LIVE definition (pg_get_viewdef on dev), not from
-- 0056's text: 0082 moved approved_translations() to `private` and left
-- nothing of that name in `public`, so a view re-created from 0056's
-- unqualified call would fail outright rather than silently bind to a gate
-- (the trap 0094, 0101 and 0103 document for private.resident_current_state
-- applies here to private.approved_translations instead — any view
-- redefinition after 0082/0086 must schema-qualify both).
--
-- Same columns, names and types as 0056's definition otherwise, so `create
-- or replace view` keeps the existing grants; they are restated anyway, as
-- every migration after 0077 must (scripts/check-migration-grants.mjs).
-- Re-runnable: `create or replace`, idempotent grants and revokes.
-- Down-migration: this view body with no file_name filter — not written,
-- since nobody should want PDFs back in the gallery or the proxy.

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
  and a.file_name ~* '\.(jpe?g|png|webp|heic|heif|gif)$';

grant select on public_project_photos to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public_project_photos
  from anon, authenticated;

notify pgrst, 'reload schema';

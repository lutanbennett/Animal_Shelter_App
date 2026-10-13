-- consumer: src/app/api/photos/[fileId]/route.ts
-- can_see_drive_file: the photo proxy's "may THIS caller read a row that holds
-- this Drive file" question, as one call instead of seven.
--
-- It replaces canSeeInternalFile() in the route, which ran seven
-- `select ... limit 1` queries in parallel for every non-public photo. One
-- branch per table or view that carries a Drive id the route checked, in the
-- same order:
--   attachments.drive_file_id            project_photos.drive_file_id
--   maintenance_photos.drive_file_id     community_outing_photos.drive_file_id
--   shelter_friends.logo_drive_file_id   medication.label_drive_file_id
--   stock_medications.label_drive_file_id (view; the stock screens read it)
--
-- Security INVOKER, like is_public_drive_file (0084): the caller's own RLS
-- applies to every branch, exactly as it did to the seven selects. Under
-- service_role RLS is bypassed, as it was before. site_content(_photos) are
-- not here: anyone may read them, so is_public_drive_file already says yes.
-- A new table with a Drive id is added here, in one place.
-- Re-runnable: create or replace and idempotent grants.

create or replace function can_see_drive_file(p_drive_file_id text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from attachments where drive_file_id = p_drive_file_id
    union all
    select 1 from project_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from maintenance_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from community_outing_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from shelter_friends where logo_drive_file_id = p_drive_file_id
    union all
    select 1 from medication where label_drive_file_id = p_drive_file_id
    union all
    select 1 from stock_medications where label_drive_file_id = p_drive_file_id
  );
$$;

comment on function can_see_drive_file(text) is
  'True when the calling session can select a row of any non-public table or view that holds this Drive file id. Security invoker, so RLS decides (0193).';

revoke execute on function can_see_drive_file(text) from public, anon;
grant execute on function can_see_drive_file(text) to authenticated, service_role;

notify pgrst, 'reload schema';

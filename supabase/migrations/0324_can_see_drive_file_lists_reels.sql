-- consumer: src/app/api/videos/[fileId]/route.ts, src/app/reels/[id]/ReelView.tsx
--
-- can_see_drive_file() learns reels. 0322 added the reels table but the function did not list it, so /api/videos/<id> answered
-- "not found" for a reel and a second route, /api/reels/[id]/video, had to ask the reels row itself. That route is removed in the
-- same change: one decision point, as 0286 left memes.
-- Body is 0286's (the live definition: 0193 and 0218 are older versions) plus one branch. Still security invoker: the reels row
-- is answered by its own RLS (reels_select_perm, social.library at Read), so no activity is chosen here and nothing is granted.
-- Re-runnable.

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
    union all
    select 1 from pending_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from memes where drive_file_id = p_drive_file_id
    union all
    select 1 from reels where drive_file_id = p_drive_file_id
    union all
    select 1 from donation_receipts where drive_file_id = p_drive_file_id
    union all
    select 1 from residents where deceased_summary_drive_file_id = p_drive_file_id
    union all
    select 1 from residents where deceased_index_drive_file_id = p_drive_file_id
  );
$$;

notify pgrst, 'reload schema';

-- consumer: src/app/api/documents/[fileId]/route.ts, src/app/api/photos/[fileId]/route.ts
--
-- Three kinds of Drive file were decided in app code instead of in can_see_drive_file(): memes (photo route, 2026-10-18),
-- donation_receipts.drive_file_id and the two residents columns deceased_summary_drive_file_id / deceased_index_drive_file_id
-- (documents route, 2026-10-30). Both routes said "fold it into that function in the next schema PR". This is it.
-- Body rebuilt from 0218 (the latest) plus four branches. The function stays security invoker: each branch is answered by that
-- table's own RLS as the caller (memes: social.library read; donation_receipts: donation.receipt; residents: resident read),
-- exactly the activities the app-code selects asked, so no activity is chosen here and nothing is granted. Re-runnable.

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
    select 1 from donation_receipts where drive_file_id = p_drive_file_id
    union all
    select 1 from residents where deceased_summary_drive_file_id = p_drive_file_id
    union all
    select 1 from residents where deceased_index_drive_file_id = p_drive_file_id
  );
$$;

notify pgrst, 'reload schema';

-- consumer: src/app/api/documents/[fileId]/route.ts, src/app/api/photos/[fileId]/route.ts, src/app/api/videos/[fileId]/route.ts
-- #w9xpq: staff could not preview a merch product's photo until the product was public, because can_see_drive_file() had no
-- case for merch_products. This adds one branch on merch_products.photo_drive_file_id.
-- Why merch.manage at edit and nothing wider: it is the activity /api/merch/photos (the upload) and saveProduct ask, so whoever
-- may put a photo on a product may see it, and nobody else. No card added, no role named. The function stays security invoker, so
-- merch_products' own select policy (merch.manage read) also applies; the explicit has_permission below states the level.
-- Body is 0362's plus the last branch. Re-runnable.
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
    union all
    select 1 from foundation_documents where drive_file_id = p_drive_file_id
    union all
    select 1 from merch_products where photo_drive_file_id = p_drive_file_id
      and (select has_permission('merch.manage', 'edit'))
  );
$$;

notify pgrst, 'reload schema';

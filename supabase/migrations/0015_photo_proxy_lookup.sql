-- Backs the image-proxy route (src/app/api/photos/[fileId]/route.ts), which
-- fetches Drive files via the authenticated API instead of the public
-- "anyone with the link" thumbnail endpoint (see docs/decisions.md — that
-- endpoint has an undocumented per-file throttling quota that can take a
-- photo offline for ~24h under a burst of viewers).
--
-- The proxy route is deliberately unauthenticated (photos must render for
-- signed-out visitors on the future public adoption listing), but it still
-- needs to reject requests for arbitrary Drive file IDs — the app's Google
-- account can read any file it has access to, not just ones this app
-- uploaded, so without this check the proxy would be an open relay onto the
-- whole Drive account. security definer bypasses RLS (attachments etc. are
-- staff/volunteer/admin-only) the same way record_attachment() and friends
-- already do, but this function only ever returns a boolean, no row data.
create or replace function is_known_drive_file(p_drive_file_id text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from attachments where drive_file_id = p_drive_file_id
    union all
    select 1 from project_photos where drive_file_id = p_drive_file_id
    union all
    select 1 from maintenance_photos where drive_file_id = p_drive_file_id
  );
$$;

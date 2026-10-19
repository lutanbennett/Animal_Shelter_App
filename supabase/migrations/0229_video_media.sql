-- consumer: none
--
-- SCHEMA half of "Videos of residents: keep them in the resident's Photos section, uploaded straight to Drive".
-- NOTHING IN src/ READS THESE COLUMNS OR THIS TABLE YET. When this merges nobody can upload or see a video: the
-- resumable upload, the Photos / Videos / All filter, the play icon and the player are the app half.
-- See docs/decisions/2026-10-19-video-media-schema.md.
--
-- SHAPE, two parts:
--
-- 1. attachments gets two nullable-or-defaulted columns, not a new videos table. A resident's video is filed in the
--    same Drive folders and must obey the same rules as a photo: Medical stays private (0101, 0152 folder guards),
--    approval before publishing (0217 trigger), the public views, is_known_drive_file / is_public_drive_file. All of
--    those key on attachments, so a video that IS an attachments row inherits every one of them with no new policy.
--    A separate table would have to copy each rule, and a copy is where a medical video would leak.
--      media_kind    photo | video, default photo (every existing row is a photo)
--      duration_ms   length of a video, for the badge; null for photos and when unknown
--
-- 2. A row that exists BEFORE the bytes arrive lives in a new table, video_uploads, not in attachments. Drive only
--    returns a file id when the last chunk lands, and attachments.drive_file_id is NOT NULL and read by public views;
--    a half-row there would be a row with no file for every reader to trip over. video_uploads is the app's own
--    bookkeeping: started -> complete (attachment_id filled) or abandoned (never finished, swept after a day).
--    Service role only, like status_alert_test_requests (0226): RLS on, no policies, nothing for anon or authenticated.
--    It holds no Drive link and no session address, so it cannot be used to read or resume anything.
--
-- Public views are NOT changed here. public_resident_photos would list an approved video as if it were an image; no
-- video can exist until the app half, which redefines the view to media_kind = 'photo' (or adds a video one) in the
-- same PR that lets one be filed. Medical is unaffected either way: that filter is on sub_folder.
--
-- Additive and re-runnable. To undo, in a new file: drop video_uploads, the constraint and the two columns.

alter table attachments add column if not exists media_kind text not null default 'photo';
alter table attachments add column if not exists duration_ms integer;

alter table attachments drop constraint if exists attachments_media_kind_check;
alter table attachments add constraint attachments_media_kind_check check (
  media_kind in ('photo', 'video')
  and (duration_ms is null or (media_kind = 'video' and duration_ms > 0))
);

create index if not exists attachments_video_idx on attachments (owner_id) where media_kind = 'video';

comment on column attachments.media_kind is 'photo or video (0229). Every row before it existed is a photo. A video is filed and approved by the same rules as a photo.';
comment on column attachments.duration_ms is 'Length of a video in milliseconds (0229); null for photos or when unknown.';

create table if not exists video_uploads (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references residents (id) on delete cascade,
  sub_folder text,
  file_name text,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes > 0),
  state text not null default 'started' check (state in ('started', 'complete', 'abandoned')),
  attachment_id uuid references attachments (id) on delete set null,
  started_by uuid references auth.users (id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  check (state <> 'complete' or attachment_id is not null or finished_at is not null)
);

create index if not exists video_uploads_open_idx on video_uploads (started_at) where state = 'started';
create index if not exists video_uploads_resident_idx on video_uploads (resident_id);

comment on table video_uploads is 'One row per resumable video upload from the moment it is asked for (0229). started = bytes not all arrived; complete = recorded as an attachments row; abandoned = never finished. Service role only.';

alter table video_uploads enable row level security;
revoke all on video_uploads from public, anon, authenticated;
grant select, insert, update, delete on video_uploads to service_role;

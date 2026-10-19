# Videos in the Photos section: schema (0229)

Decided 2026-10-19, schema half only. Nobody can upload a video yet.

- **Storage:** Drive, shelter account (1 TB), decided by Lutan 2026-10-18. Not reopened.
- **Per-video cap:** 500 MB (about 5 minutes), `MAX_VIDEO_BYTES` in `src/lib/uploads/limits.ts`. Types MP4 and MOV. The 15 MB cap is unchanged for everything else; nothing reads the new constants yet.
- **A video is an `attachments` row** (`media_kind`, `duration_ms`), not a new table. Medical privacy, approval before publishing and the public views all key on `attachments`, so a video inherits them with no copy to get wrong. Same reasoning as 0228 choosing columns over a link table.
- **An in-progress upload is a `video_uploads` row**, not a half-filled `attachments` row, because Drive gives the file id only on the last chunk and `attachments.drive_file_id` is NOT NULL and read by public views. States: started, complete, abandoned. Service role only; it holds no Drive address.
- **Left to the app half:** redefine `public_resident_photos` to photos only (or add a video view) in the PR that lets a video be filed; sweep `started` rows older than a day to `abandoned`; Drive space on System status.

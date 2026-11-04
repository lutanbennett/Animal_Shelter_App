# 2026-11-04 — Video upload: the Worker's CSP never allowed the browser to talk to Google Drive

**Backlog item:** `#vib7j`. Not ticked by this PR: the fix reaches users only on a Worker deploy, which is Lutan's.

## Cause

`worker/security-headers.mjs` set `connect-src 'self' https://*.supabase.co wss://*.supabase.co`. Videos are sent by the browser straight to a Drive resumable session URL on `https://www.googleapis.com/upload/drive/v3/files?...` (`src/lib/uploads/resumable-video.ts`). A CSP refusal makes `fetch` throw, which the retry loop counted as a dropped connection and finally reported as `connectionLost` ("try again on a stronger connection"). Lutan's console showed the refusal verbatim: *"Refused to connect because it violates the document's Content Security Policy"*.

## Dates: it never worked

CSP enforced 2026-10-07 (`2026-10-07-csp-enforced.md`). Videos moved to browser-to-Drive 2026-10-20 (`2026-10-20-videos-uploaded-straight-to-drive.md`), and that change did not touch the CSP. `resumable-video.ts` is the only client code that contacts Google; photos and bills go through our server, which is why they were never affected.

## What changed

1. `connect-src` gains `https://www.googleapis.com`, named, no wildcard; no other directive touched.
2. **One host is enough.** The session URL is the `Location` Drive returns from `uploadType=resumable` on `www.googleapis.com/upload/drive/v3` (`drive.ts`, `DRIVE_UPLOAD_API`), and it is on that same host. Lutan's console error names that exact host for the chunk PUT. The chunk PUTs, the `bytes */n` probe and the final 200 are answered by that host; none relies on a redirect. Not exercised against live Drive from a CSP-enforcing page (see Verification), so if a deployed upload is still refused, the browser console and `/api/csp-report` will name the second host.
3. The retry loop reset `failures` only on a 308 from the chunk PUT. After a failed chunk the probe could advance `offset` without resetting it, so an upload progressing every lap died at the seventh stumble. It now resets whenever the probe shows more bytes held than before.
4. `connectionLost` (English and Thai) no longer says "stronger connection". It says the video could not be sent, repeating did not help, tell an admin as the cause may be ours.

## CHUNK_BYTES: kept at 8 MiB

The hypothesis for 8 MiB being too big was formed while the real cause was a CSP block that made every chunk fail regardless of size. With the CSP fixed there is no evidence that 8 MiB is wrong, and Drive requires a multiple of 256 KiB; changing it now would be a guess. If a deployed upload of a large file still drops, the progress bar and the console line (`no response (dropped or blocked)` vs a status) are the evidence to reopen it with.

## Verification

`next dev` has no Worker in front of it and sends no CSP, so a localhost upload proves nothing about this fix and was not offered as proof. Proof here is `worker/security-headers.test.mjs`: it asserts `connect-src` names `https://www.googleapis.com` without a wildcard, and that the host in `drive.ts`'s upload endpoint is permitted (so the two sources are compared, not just the string). The end-to-end proof is Lutan's upload after the Worker deploy.

## Settled / not settled

- **Did any video upload ever succeed?** By the code path, no through this route: `finish` is posted only with a `driveFileId` read from a Drive response, and with Drive blocked `fetch` throws first, so the app cannot have recorded a file it never sent. Lutan's "worked, then the save failed" fits a file merely chosen/previewed in the form. Not checked against the production `video_uploads` table (ad-hoc production reads are refused from worktrees), so a row existing from before is not excluded.
- **CSP violation log:** reports are logged by the Worker as lines in Cloudflare's Worker logs (`worker/csp-report.mjs`), retained nowhere in the repo or database, and readable only with `wrangler tail` or the dashboard; not readable from this session. So whether anything reached it, and whether another host besides googleapis.com is in it, is NOT established. That the log is only a live tail or dashboard view is itself a finding.
- **Why nothing caught it:** CSP and the client's fetch targets are two sources nothing compared. The new test compares the one that matters here. A general check (every absolute URL the client fetches is permitted) is for the planner to decide to file.

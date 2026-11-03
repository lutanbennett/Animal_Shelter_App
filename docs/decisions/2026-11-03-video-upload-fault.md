# 2026-11-03 — Video upload fault: the message now names the step; the cause is not yet found

**Backlog item:** "Adding a video to an adoption update fails". Lutan saw "The video could not be uploaded. Try again." with `IMG_2792.MOV`.

## What was established

Driven on **dev** (project `qxkmhwybjggxvsfxsxbd`, admin login, port 3002) from the page with a `Blob` typed `video/quicktime`, calling the same three steps the form calls:

| Step | Result on dev |
|---|---|
| `POST …/videos/start` (adoption update, 9 MiB) | 200, a Drive resumable URL |
| Drive chunk PUTs, 8 MiB chunks | 308 with `range=bytes=0-8388607`, then 200 with the file id |
| `POST …/videos/finish` with the update id | 200, attachment id |

A 1 MiB upload by category and a 20 MiB three-chunk upload also passed. **The fault does not reproduce on dev.** So the dev Drive client is healthy and the chunk loop copes with Drive's 308 replies. What dev does not have: Lutan's real iPhone file, his login's cards, or production's/test's Drive client. **Which environment he used is not established** (the item does not say); the reproduction ran against dev only, and a pass on dev is not proof about production.

## The four steps, and what else raises the sentence

Reading the code (not a reproduction): the two API routes always answer with a string `error` except where a non-Drive exception escapes `withDriveErrors` (it only catches `DriveApiError`; anything else is rethrown and the browser gets an HTML 500, which `post()` turns into `{}`). That is a **fifth** way to the generic sentence, at the start and finish steps. The Drive chunk loop returned the generic sentence for a Drive 4xx (`:120`) and after six failed retries (`:106`) and kept none of Drive's reply.

## What changed

`photos.videos.errors.failed` is gone; each site now says where it stopped (English and Thai):

- `startFailed`: the app could not open the upload (no reason came back from `start`).
- `driveRefused(code)`: Drive answered a chunk with a 4xx (expired/rescoped credentials look like 401/403, a dead session 404), or kept failing with 5xx. The browser console also gets Drive's status and first 500 characters of its reply.
- `connectionLost`: the connection dropped or was blocked six times in a row, or Drive throttled (429).
- `finishFailed`: the file reached Drive but `finish` gave no reason.

A specific reason from the API (the routes' own messages) is still shown as it was. No check or permission was changed. Thai is our own and unread by a Thai speaker.

## Left open

The cause. The next failure on Lutan's screen will show one of the four sentences, and the console line has Drive's own words. If it says Drive refused it with 401/403 on production, the Drive client or its scopes need attention outside this repository.

## Added later the same day

Lutan reported it also fails when uploading against a resident (the Photos/Videos tab, not an adoption update). That points away from anything adoption-specific (the update's folder, `photos.resident_publish`) and at the part both paths share: the Drive chunk step, the Drive client on the environment he used, or the file itself. A permission refusal would have shown a specific sentence, not this one. Dev passes both paths as admin.

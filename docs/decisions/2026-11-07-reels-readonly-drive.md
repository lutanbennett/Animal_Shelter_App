# Driving the reels Read-only view and real video decoding (backlog #8bz78)

Both proofs the item still lacked were driven on dev on 2026-11-07, in the built-in browser pane, on port 3009.

## Step zero

The three reel cards exist (`reel_library`, `reel_add`, `reel_view` in `src/lib/permissions/cards.ts`). #1359 proved the Add link, `/api/reels/start`
and `/reels/new` refusals; they are not re-reported. The gap was real: nothing had driven the view as a person sees it, and nobody had played a video in the pane.

## Can the pane decode video? Yes.

- `canPlayType` says H.264/AAC MP4, VP8 and VP9 WebM are "probably" playable (Chrome 152 inside the app).
- Actually decoded, not just claimed: a clip recorded in the page with `MediaRecorder` played as VP8 WebM (16 frames, playhead moved) and as **H.264 MP4**
  (320x240, 45 frames, played to the end, `readyState` 4, no media error).
- One trap: a canvas recording made while the pane was hidden produced a 110-byte file. A `screenshot` wakes the pane; the second run was fine.
- No `ffmpeg` on this machine, so the clip was made in the page and attached to the file input with a `DataTransfer`. It is a real H.264 file, but a synthetic one.
  A real phone recording (QuickTime/HEVC) was not tried: Chrome on a phone and desktop differ on HEVC. Left for a person.

## Real upload and playback

- Browser to Drive with a `reel_add` login: saved, redirected to the reel, which showed "0:03". So the CSP is not blocking the Google origin (the `#vib7j` fix holds).
- The reel page's `<video>` plays; `/api/videos/<id>` answers `206` with `Content-Range: bytes 0-99/38760` and `200` for a full GET; with no cookie it answers `404`.
- The reel that was already on dev is a 4 KB stub (`ftypmp42` and nothing playable). It fails with `DEMUXER_ERROR_COULD_NOT_OPEN`, as a stub should. Not a fault.

## Read-only view: one verdict per control (login holding exactly `reel_view`)

| Control | Where | Verdict |
|---|---|---|
| Add a reel | library | not drawn |
| Edit | reel page | not drawn |
| Archive | reel page | not drawn |
| Record where it was posted | reel page | not drawn |
| Remove a post record | reel page | not drawn (no post-record row has a button) |
| `#` picker / description box | edit and new pages | unreachable: those pages redirect away (#1359) |
| Search, three filters, clear | library | drawn, as they should be: they read only |
| Reel tile, play, Download, Open the post | library, reel page | drawn, work |
| **Meme library link** | library header | **was drawn and led to "You don't have access"** — fixed here |

## Fixed, small

`src/app/reels/page.tsx` drew the Meme library link for everyone who can open Reels. That page asks `social.library` Read. A login with only a reel card got
a link that landed on no-access. It is now drawn only when `can(perms, "social.library", "read")`. Verified live: the link is gone for `reel_add`.

## Found, not fixed, for the planner to file

**A login without a resident card is told "No animal is tagged" when animals are tagged.** `loadReel` and `loadReels` embed `residents(id, name, thai_name)` through
`reel_residents`. The residents table is cut by its own policy, so for a login holding only `reel_view` or `reel_add` the embed comes back null and the link is
dropped. Measured: the reel I tagged `#Angsumalin` showed "No animal is tagged" for `reel_add`, and "Angsumalin" for Admin; the older seeded reel likewise. The link row exists. The library tile's resident line and the resident filter are empty for the same reason. A fix is a view like `resident_who_and_where` joined from `reel_residents`, which is a migration, so it is not done here. `reel_add` can tag residents (the `#` picker works) but not see the result, which is worse than a plain gap.

## Resident side

Both ways, from Admin: the reel page lists "Angsumalin" and that resident's page lists both reels linked to them and an "Open the reels" link.

## Never public

`check-public-views.mjs` printed `reels` and `reel_residents` refused for anon on GET, POST, PATCH, DELETE (HTTP 401) and anon SELECT. The run as a whole exceeded my 60 s cap
(exit 124) after the reel lines, so it did not run to completion; the reel lines are what it did print. Anon `GET /api/videos/<id>` (with and without a Range header) answers 404.
Anon POST `/api/reels/start` answers 307 (to sign-in).

## Not driven

Archive, restore, record-a-post and remove-post by an Edit/Manage login (not this stream's proofs; #1330 drove them). HEVC video. A phone.

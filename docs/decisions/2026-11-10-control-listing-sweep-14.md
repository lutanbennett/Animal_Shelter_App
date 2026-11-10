# Control listing sweep 14: the remainder (#79sqf)

## Step zero
`src/lib/memes/queries.ts` already read tags through `resident_who_and_where` (1de92568, #t3n9r). One read was left:
`src/app/memes/make/page.tsx` fetched profile photos from `residents`, so a login holding only `meme_add` got no photos
on `/memes/make`. It now reads the same view (the view carries `profile_photo_drive_file_id`, migration 0192). No card change.

## Fixed
- **#p3q7m**: `SitePageForm.tsx` shows "Nothing is saved until you press Save changes" only when `canEdit`, the same
  flag that draws the Save button. A proposer's button reads "Propose changes", so it no longer sees the Save promise.

## Not driven in the pane (for the next stream)
This stream did not drive the pane at all. Still undriven: Archive, Save, match-a-bill and the Shelter Friend card;
per-row controls on `/bills`, `/medical/diets`, `/operations/*`; `/enclosures/[id]` with residents under a card that reads
residents; the `/memes/make` canvas; the end-to-end check that a `meme_add`-only login tags, saves and sees the name on `/memes/make`.

# Posted on social media: the app half (badge, filter, Mark as posted, Undo)

2026-10-18. The half a user can see of the "posted on social media" backlog item, over the `social_shares` table that `0223` landed the same day (`docs/decisions/2026-10-18-social-shares-schema.md`). Branch `claude/posted-on-social-app`.

## What shipped

- **One read, pinned.** `src/lib/social-shares.ts` is the only place the app queries `social_shares` for photos: `loadPhotoShares()` takes the gallery's attachment ids, selects `owner_type = 'attachment'` **and** `owner_id in (ids)`, newest `shared_on` first, and groups the rows by photo. The Photos section and the Adoption updates section call it once each for their grid. The gallery never queries the table itself; it is handed `shares` and reads `shares[photo.id]`.
- **Posted = at least one row.** The thumbnail badge shows the distinct platforms as short text (FB, IG, LINE, TT, Other). Lucide no longer ships brand icons, so the badge is words, not logos, and the full platform name is in the badge's title and in the lightbox.
- **Filter:** Not posted yet / Posted / All, counted over the whole gallery, combined with the existing shelter / adopters filter when that one shows.
- **Mark as posted** is one form, used from the lightbox for one photo and from the grid's Select mode for several: platform (Facebook first), date defaulting to `todayIso()` and capped at today, optional `https://` link through `checkHttpsUrl()`, optional note of up to 500 characters. The server action writes one row per photo in one insert, with the signed-in client, so the table's own policy decides and `recorded_by` is stamped by the database.
- **Undo** deletes one row, by id, with `owner_type = 'attachment'` pinned on the delete too. Zero rows deleted is reported as "already gone" rather than as success.
- **Who sees what** follows the table's policies, not a role name: the buttons show when `can(perms, "photos.resident_manage")` and `perms.scopes.residents === "all"` (the app's reading of `sees_all_residents()`); the badge and the list in the lightbox show to anyone the page shows the photo to.
- **Medical photos** can be marked. Nothing here reads or writes `attachments.sub_folder`, `approved_at` or any public view, so marking cannot put a photo on the website.

## Decisions worth not re-deriving

**(a) Why the server action re-checks that the ids belong to this resident.** The database guard already refuses a share whose owner does not exist, and the policy already refuses a caller who may not manage photos. What neither checks is that the photo belongs to the page it was marked from. `markPhotosPosted()` therefore selects the ids back from `attachments` with `owner_type = 'resident'` and `owner_id = <this resident>` and refuses the whole batch if any id is missing. The cost is one extra query; the benefit is that a stale or tampered id can never record a post against another resident's photo, which is exactly the kind of quiet wrong row the brief warned about.

**(b) Why a meme's share can never make a photograph look posted, and how that was proved.** The table is shared with the meme library on purpose. The one read pins `owner_type`, and the guard trigger makes a meme share's `owner_id` a `memes.id`, which can never equal an `attachments.id`. Proved on dev, not reasoned: with three photos marked, a row `{ owner_type: 'meme', platform: 'instagram' }` was inserted with the service role, the page was reloaded, and the counts stayed at 3 posted of 6.

**(c) The permission test the item named, and which role can run it.** "A role that can see photos but not manage them sees the badge and no button." No *live* role is in that position today: the only roles with `scope_residents = 'all'` are Admin, Management (both manage photos) and Public viewer (no `resident.record`). The roles with `resident.record` at Read (2IC, the two Heads, Doctor, Volunteer) have narrower resident scopes, and under those scopes they cannot read this resident's `attachments` rows either, so there is no photo for a badge to sit on and nothing is hidden from them that they could otherwise see. The test was run with a throwaway custom role (`scope_residents` all, `resident.record` Read only): it saw the three badges and the post list in the lightbox, no Select, Mark or Undo, and an insert as that login was refused by the policy (`42501`). A delete as that login touched zero rows.

**(d) "Multimedia" was read as social media.** The item reads Lutan's word that way and the schema is built on it; the platform list is Facebook, Instagram, LINE, TikTok, Other. If he meant something else (a newsletter, a printed flyer), "Other" with a note covers it today, and a new platform value is one line in `0223`'s check constraint plus one label in each dictionary.

## Not built, on purpose

- The across-all-residents list of photos not yet posted (part (4) of the item, "Optional, later"). Everything it needs exists: `loadPhotoShares()` over any set of attachment ids, and `platformsOf()`. It is a page, not a reuse of the gallery, so it stays a backlog item.
- Marking from the public site, the photo approval queue or the adoption-update picker. Only the two resident galleries know about shares.

## Left behind in dev

Three dry-run logins (`dryrun-social-mgmt-d6b305`, `-viewer-`, `-2ic-` at `example.invalid`), one throwaway role `dryrun_photo_viewer_d6b305`, one meme `Dry-run meme d6b305` with one Instagram share, and three Instagram shares on resident `d90a0af6…` (Por-Aor). Dev test data is disposable; the passwords live only in this worktree's gitignored `.env.local`.

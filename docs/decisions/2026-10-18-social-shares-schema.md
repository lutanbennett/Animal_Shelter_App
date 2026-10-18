# Social shares: the schema half of "posted on social media" and "Meme library, stage 1" (`0223`)

2026-10-18. One schema PR serving two backlog items, because the meme item asks for it in writing: *"use one shared shares table for both, with an owner type, rather than two that drift apart."* **Neither feature is usable when this merges.** There is no badge, no filter, no `/memes` page and no card. Neither backlog item is ticked (each has a status note), and there is **no release note**: nothing a user can see has changed. The two app halves are `posted-on-social-app` and `meme-library-app`; they are briefed from this file.

## What is in the database

| Object | What |
|---|---|
| `social_shares` | One row per post. `owner_type` (`attachment` = a resident's photo, `meme`), `owner_id`, `platform` (`facebook`, `instagram`, `line`, `tiktok`, `other`), `shared_on` (date, defaults to `shelter_today()`), `post_url` (optional, `https://` only), `note` (optional, 500 chars), `recorded_by` (stamped by the database), `created_at`. |
| `memes` | `drive_file_id` (unique), `file_name`, `title`, `caption_en`, `caption_th`, `tags text[]`, `archived`, `created_by` (stamped), `created_at`, `updated_at` (stamped). |
| `meme_residents` | `meme_id`, `resident_id`, unique together. |
| Activity `social.library` | Kind `level`, area `management`, sort 66. Read browses, Edit adds, changes, archives and records shares. Starts at None for every role but Admin. |

All three tables have RLS on, every policy is `to authenticated`, and `anon` holds no grant. They are audited with `record_audit()` like the appeals tables.

## Decision (a): a shared table, not columns on `attachments`

Took the table, as the item recommended. Reading the code confirmed it: a photo can be posted more than once (Facebook on Monday, Instagram on Friday), and each post should keep its date, link and note, which one `posted_at` / `posted_on` pair on `attachments` cannot do. Columns would also have left the meme item building its own table the next day. **Not built both**: `attachments` is untouched.

The cost of one table with an owner type is that no foreign key can point at two tables. Handled with a guard trigger (`social_shares_guard`: an `attachment` share must point at a *resident* attachment, a `meme` share at a meme that exists) and cleanup triggers (deleting a photo or a meme deletes its shares). `owner_type`, `owner_id` and `recorded_by` cannot be changed by an update.

The appeals item's "links to social posts" (`appeals.social_links`, `0210`) is a different thing: links to posts *about an appeal*, held on the appeal. It is not closed or replaced by this table.

## Decision (b): a meme's residents are a join table

`meme_residents`, not a `uuid[]` on `memes`. A resident's page needs "memes featuring this resident" and an array cannot be indexed that way without a GIN index and loses referential integrity: a deleted resident would leave a dangling id in the array. The join table has foreign keys, `on delete cascade` from both sides, and an index on `resident_id`.

## Decision (c): two activities, not one

- **A photo's shares** follow the existing photo rules: written under `photos.resident_manage` (with `sees_all_residents()`), read under `resident.record` at Read (with `sees_all_residents()`), exactly the pair `attachments` uses. No new activity: whoever may manage a resident's photos may mark one as posted, which is what the item says.
- **Memes and their shares** use the new `social.library`. It is a *level* activity because the library has a browse-only case (a volunteer who chooses a meme to post, Read) and a keep-it-up case (Edit).

Why not fold the library into photo rights: a meme is not a resident's photo. It can feature none, one or several residents, it is made elsewhere, and the person who runs social media is not necessarily someone who manages resident photos. Why not a new activity for photo shares: it would give a second switch for something already covered, and the two would drift.

## What it refuses (all proved in `scripts/check-social-shares-schema.mjs`, rolled back)

- Signed out: no read, no write, on any of the three tables (also over HTTP in `check-public-views.mjs`, which now names them and probes `caption_en` / `post_url` on every public object).
- A signed-in login with no cells: sees nothing, writes nothing.
- A Read-only library login: sees memes, their residents and meme shares; cannot add, edit, link or delete; sees no photo share unless it also holds `resident.record`.
- A photo-manager without the library: sees and records photo shares; sees no meme, no meme link, no meme share and cannot record one.
- A photo share on a non-resident file, a missing photo or a missing meme; an unknown platform or owner type; a link that is not `https://`; a blank title.
- A caller naming `created_by` or `recorded_by`: ignored, the database stamps its own.

## What the app halves must do

### `posted-on-social-app` (the photo flag)

- **Read:** `social_shares` where `owner_type = 'attachment'` and `owner_id in (the gallery's attachment ids)`. One query for the grid, newest `shared_on` first. A photo is *posted* when it has at least one row; the badge's icons are the distinct `platform` values. The filter is Not posted yet / Posted / All over that set.
- **Write:** a direct insert from the signed-in client is enough: `{ owner_type: 'attachment', owner_id: <attachments.id>, platform, shared_on, post_url, note }`. Leave `recorded_by` out (the database stamps it). **Undo** is a delete of the row; "mark three at once" is one insert of three rows.
- **Permission:** show **Mark as posted** and **Undo** to a caller holding `photos.resident_manage`; show the badge to anyone who can see the photo. Use the same test as the database (`has_permission('photos.resident_manage')` and `sees_all_residents()`), not a role name. A role that can see photos but not manage them sees the badge and no button, as the item's test says.
- **Medical photos** can be marked; marking never makes a photo public. This table is not read by any public view and must stay that way.
- **Also:** manual topic, both dictionaries, releases line, test plan.

### `meme-library-app` (stage 1)

- **Gate:** `social.library`. Open `/memes` and list memes with Read; show Add a meme, Record a share, Edit, Archive with Edit. A role without it cannot open the library.
- **Add a meme:** upload the image to a **Memes** folder under `GOOGLE_DRIVE_ROOT_FOLDER_ID` (create it in the app half; this PR does not), then insert `memes { drive_file_id, file_name, title, caption_en, caption_th, tags }` and one `meme_residents { meme_id, resident_id }` per featured resident. Archive is `update memes set archived = true`, not a delete.
- **Image route:** serve through the existing photo route to signed-in staff **holding `social.library`** only. `is_public_drive_file()` is **not** touched and must not learn about memes. A signed-out visitor loading a meme image must be refused (test it).
- **Shares:** `social_shares { owner_type: 'meme', owner_id: <memes.id>, platform, shared_on, post_url, note }`. "Not shared yet" is a meme with no row; platform icons are the distinct platforms.
- **Resident page "Memes" list:** `meme_residents` by `resident_id`, joined to non-archived `memes`. It must be shown only to a caller holding `social.library` at Read.
- **Card:** the item mentions a home card for the library; not added here. Add it in the app half, mindful of `approve-photos-app`'s card in `src/lib/permissions/cards.ts`.
- **Also:** manual topic, both dictionaries, releases line, test plan on a phone.

## What I did not do

- No UI of any kind, no card (`cards.ts` untouched), no Drive Memes folder, no manual or release-note text, no backlog tick.
- Did not give `social.library` to any role: it starts at None for all but Admin. Who gets it is a Settings answer.
- No public view, no change to `is_public_drive_file()`. Memes and shares are never public.
- `meme_residents` does not check that the writer can *see* the resident (a library editor with a narrower resident scope can still link one). Every resident is already named on the shelter's own public site; if a narrower scope matters later, add `sees_all_residents()` to the write policy.
- No down-migration: dropping the three tables, the guard functions and the activity row undoes it (listed in the file's header).

## Production

Apply `0223` with the release. Additive; no data moves; nothing reads it until the app halves ship.

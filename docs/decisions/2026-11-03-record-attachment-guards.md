# record_attachment: a non-picture is never the profile picture, and bills can be attached (0306)

Stream `claude/record-attachment-fixes`. One migration, `0306_record_attachment_picture_and_bill_owners.sql`, one function.

## Why two changes share one migration

Both are a `create or replace` of `record_attachment()`. Two streams redefining one function in one batch would clobber each other,
and the second change (accept `utility_bill` / `general_bill`) is what the two bills app halves in later batches are blocked on.
The permission half of the bills change was already done by `0305` (`bill_owner_can()` knows both owner types, `bills.utilities` /
`bills.general` exist), so the two new `when` lines only delegate to it. No activity, card or grant in `0306`.

## Deliverable 4 — what decides "not a picture"

The brief's reading was `media_kind`, a constrained column since `0229`. **Established: that reading cannot work as it stood.**
`record_attachment()` has no `media_kind` parameter and its insert leaves the column at the `'photo'` default. The only path that
files a video, `src/app/api/residents/[id]/videos/finish/route.ts`, sets `media_kind = 'video'` in a **separate update after** the
RPC returns (route lines ~108-113), so inside the function every row is a photo. Every other `attachments` insert in `src/` goes
through `record_attachment` and files photos or documents (no other writer sets `media_kind`; grep of `src/`, `supabase/migrations/`,
`scripts/`).

So `0306` does two things:

1. a new parameter `p_media_kind text default 'photo'` (checked against `photo`/`video`, written to the row), which the video
   `finish` route now passes as `"video"`. The default keeps every existing caller unchanged. This is the constrained discriminator;
2. a file-name backstop: a name ending in a video extension is also not a picture. It exists for a future caller that forgets to say
   (the same "every caller must remember" fault the item is about). A name can be wrong in the other direction only by being
   *stricter* (an odd extension on a real photo is a missed profile picture, never a leak), which is the safe side.

The signature gained a ninth argument, so the eight-argument function from `0220` is dropped in the same file and the grants are
repeated for the new signature. Proved there is exactly one overload afterwards (harness A0).

**Declared crossing:** the brief allowed one `src/` change (deliverable 5). Passing `p_media_kind` is a second line in that same file,
needed for the column to be usable at all. No other `src/` file changed.

## Deliverable 5 — the app-side undo stays

`finish`'s `if (recorded.is_profile) { … set profile_photo_drive_file_id = null … }` is **kept as belt-and-braces; the database is now
the guard.** With `p_media_kind: "video"` passed, `is_profile` is never true for a video, so the branch is dead in normal running.
Keeping it costs nothing and holds the leak shut if `0306` were ever rolled back while the app stays deployed. Its comment says so.

## Deliverable 6 — is `record_attachment` the only thing that sets `profile_photo_drive_file_id`?

No. Two other database functions set it, and **neither tests `media_kind`** (read from their live bodies; not widened here,
**for the planner to file**):

- `set_resident_profile_photo()` (live body `0277`, which added the Medical test it lacked): a login holding `photos.resident_manage`
  can name a **video** as the profile picture, and the database accepts it. Same fault as this item, in a different function.
- The delete-attachment function (live body `0264:478-515`): when the profile photo is deleted it picks the next-oldest attachment of
  the resident as the replacement (`order by uploaded_at asc`, no `media_kind` filter), so deleting the profile picture can promote a
  video, and a video on an unshared update is then public.

Both are the same one-line test (`media_kind = 'photo'`) and belong in one follow-up migration. The finish route's own undo and the
resident edit/archive paths only clear or copy the column.

## Proof

`scripts/check-record-attachment-guards.mjs` (dev only, `begin … rollback` via a deliberate raise): first file a video gets no profile
picture and is stored as `video`; first file a photo still becomes the profile picture; kind forgotten with a `.MOV` name gets none;
a photo after a video takes the slot; an unknown kind is refused; `utility_bill` is accepted only with `bills.utilities`,
`general_bill` only with `bills.general`, and a login with neither card is refused both (and each bill card is refused the other's type).

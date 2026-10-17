# Unassigned photos: a `pending_photos` table (schema half)

2026-10-17, `claude/enclosure-photos-schema`, `0218_pending_photos.sql`. Schema half of *Add resident photos: tag a
photo to an ENCLOSURE when you do not know which resident it is, and the approver picks the resident*. **Nothing in
`src/` reads any of this yet.** When it merges, nobody can file an unassigned photo and no approver can assign one.
The flow, the queue and the Drive moves are the app half.

## The shape, and why

**A separate table, not a new `attachment_owner_type` value.** The item offered both. Chosen: `pending_photos`
(`enclosure_id`, `drive_file_id` unique, `file_name`, `taken_at`, `note`, `uploaded_by`, `uploaded_at`).

- A photo nobody has identified is not yet an attachment of anything. Keeping it out of `attachments` leaves every
  view, policy, guard and trigger written against `attachments` meaning exactly what it meant. A new enum value
  silently widens anything written as `owner_type <> '…'`, which is the hazard the brief named.
- **One file, not two.** The enum route needs add-value and use in separate files.
- Assigning is a move between tables rather than an `update`. That costs one function, `assign_pending_photo()`,
  which does the whole thing in one transaction.

## The guarantee that it is never public

Structural, not procedural. The table has **no approval column to set**, RLS is on, `anon` holds no grant, and no
public view reads it. `is_public_drive_file()` asks the public views, so the direct file URL refuses it too. It has no
resident, so it can appear on no resident page, profile or appeal. `scripts/check-public-views.mjs` now checks anon
cannot read the table and that every pending file is refused by view and by direct file URL; the harness
(`scripts/check-pending-photos.mjs`) proves the same on a real row.

## One file or a copy per resident: a copy

`assign_pending_photo(p_pending_id, p_assignments, p_approve)` takes `[{resident_id, drive_file_id}, …]` and writes one
ordinary `attachments` row per resident (Shelter folder, `uploaded_by` and `uploaded_at` carried over from the
pending row, so the volunteer keeps the credit), then deletes the pending row. **The first pair normally carries the
original file id (moved to that resident's Shelter folder); every further resident gets a Drive copy the app makes.**
Reason: delete, refile, set-profile-photo and the Medical guard all assume one file = one attachment. A shared Drive id
would let deleting one resident's photo trash the other's. The function does not make the copies; it only records them.

## Assigning is approving, unless told otherwise

The caller must be able to publish resident photos (`can_publish_resident_photos()`); the stamp trigger from `0217`
then approves each new row on save. `p_approve = false` leaves the new rows waiting like any other waiting photo
(the item's "assign without approving for the website"). Approved assignment also sets the profile photo when the
resident has none, as `record_attachment()` does.

## Who may do what

- **File**: `photos.shelter_add` (and not Medical-only) or the right to publish; `uploaded_by` must be the caller.
- **See**: your own rows; a publisher sees all. **Assign, correct, discard**: publishers only.
- `can_see_drive_file()` and `is_known_drive_file()` now include the table, so the proxy can show a filer their own
  photo and an approver any. `is_known_drive_file` is still service-role only. Neither makes anything public.
- Audited with `record_audit`, like the appeal tables.

## Reassigning a photo tagged to the wrong resident

Already works and needs nothing new: a waiting `attachments` row's `owner_id` can be updated by a login with
`photos.resident_manage`, and the approval stamp only fires on `approved_*` changes. The harness asserts the photo
stays waiting and non-public after reassignment. (The app half should still move the Drive file between resident folders.)

## "Who was in this enclosure that day"

`pending_photo_candidates(p_pending_id)` returns residents whose `placement_history` row for that enclosure covers
`taken_at` (`start_date <= taken_at < end_date`, open end counts). Security invoker, so RLS decides. The app half adds
the photos and the search for anyone else. `taken_at` is a timestamp: pass the real capture time, or noon of the
chosen day if only a date is known, so same-day arrivals and departures are not guessed at.

## The holding folder

`Unsorted/<enclosure>` sits outside the per-resident tree. Findings: **the proxy never walks Drive**; it asks the
database about a file id, so a file is only reachable if a table names it, and `pending_photos` is now named only to
signed-in viewers. **The backup (`scripts/backup.mjs`) is a database dump, not a Drive copy**, so the pending rows are
in it and the Drive files are not, exactly as for every other attachment. Nothing else needed.

## Left for the app half

1. `/photos/add`: the "I don't know, tag the enclosure" path; insert into `pending_photos`; upload to
   `Unsorted/<enclosure>` in Drive. Do not use `record_attachment()`.
2. The approval queue: list `pending_photos` with the enclosure and time, offer `pending_photo_candidates()` first,
   then search; call `assign_pending_photo()` after moving the file and making one Drive copy per extra resident.
   Discard = delete the row (and the Drive file).
3. Delete or move the Drive file only after the database call succeeds, and the reverse for failures: the function
   is atomic, Drive is not.
4. System status: pending rows older than ~30 days (`pending_photos_enclosure_idx` is on `(enclosure_id, taken_at)`;
   add an index on `uploaded_at` if the list is slow).
5. Manual topic, both dictionaries, release note, permission wiring for the "Photos to approve" tile.
6. The Shelter-only login (`photos.shelter_add`) is the filer. A Medical-only login cannot file here.

Release notes: none in this PR; nothing is visible. Do not tick the backlog item until the app half merges.

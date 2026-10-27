# Medical photos need their own read (`0276`)

Lutan, 2026-10-27: *"on the view residents card I can access medical photos. I should not be able to view medical photos."*
Schema half only; the app half is the next batch's stream. The only `src/` edits are three one-line registrations lint demands for any new activity (`catalogue.ts`, `en.ts`, `th.ts`).

## Cause (confirmed from the live policy, `0264:199`, and read on dev)

`attachments_select_perm`'s resident branch asked `has_permission('resident.record','read')` and looked at no `sub_folder`. View
residents holds `resident.record:1`, so it read the Medical folder with everything else.

## What `0276` does

1. New activity `photos.resident_medical` (level, area `photos`), registered as `0224` registered `photos.approve`.
2. Granted (read) to **View medical** and **Manage medical** (`medical_records`). Manage medical already includes View medical, so
   the second row is belt and braces.
3. The resident branch of `attachments_select_perm` asks `photos.resident_medical` (read) for a Medical-folder row and
   `resident.record` (read) for any other. Only that branch changed.
4. **Add medical photos is not given it.** His card 3 ruling was "decrease to just what is required": it files, it does not browse.
   Later, that is one `card_grants` row.
5. A `NOTICE` lists every role that loses the read. (The Management API the runner uses does not return notices; run the file
   through `psql` or read the harness output below to see who is affected.)

**The folder test.** The app's test is `src/lib/google/drive-client.ts:82`:
`return (subFolder ?? "").trim().toLowerCase() === "medical";`. SQL elsewhere says `lower(btrim(coalesce(sub_folder,''))) = 'medical'`,
but `btrim` strips spaces only and JS `trim()` strips tabs and newlines too, so `'Medical<tab>'` is Medical to the app and not to
those guards. The policy strips `E' \t\r\n\f\v'`, so any near-miss makes it stricter, never leaves a hole.
Dev has `Medical` (52), `Shelter`, `Foster`, adoption and date folders; none has stray whitespace today.

## Who reads Medical photos, before and after (dev, rolled-back harness `docs/proofs/0276-medical-photos-harness.sql`)

Test rows: one resident, photos filed as `Shelter`, `Medical`, `medical ` , `Medical<tab>`, `MEDICAL`.

| Login | Shelter | Medical variants (of 4) |
|---|---|---|
| Admin (bypass untouched) | 1 | 4 |
| View medical only | 1 | 4 |
| Manage medical only | 1 | 4 |
| View residents only | 1 | **0** (was 4) |
| Management (reads through Book clinic visits, which includes View medical) | 1 | 4 (unchanged) |
| Doctor (same route) | 1 | 4 (unchanged) |
| Volunteer, 2IC, Head of maintenance | 1 | **0** (was 4) |
| Head of medical | 1 | **0** (was 4) — holds Add medical photos and View residents only |
| Add-medical-photos only | 0 | 0 — holds the card but reads no shelter photos either; not compared with before |

**Consequences to know, not widened here:** Book clinic visits and Run fundraising appeals include View medical, so they read
Medical photos too. Head of medical can no longer browse the photos it files unless given View medical (one card, in Settings).

## The read paths, one by one

- **Photo proxy** (`can_see_drive_file`, `0193`): security invoker, so it follows the policy. *Already safe once the policy is fixed.*
- **attachments insert/update/delete** (`0264`): they ask `photos.resident_add` / `photos.resident_manage`, never the read. *Safe,
  unchanged.* The restrictive folder guards (`0152`) keep a Medical-only login out of other folders.
- **`record_attachment()`** (`0269`): its Medical test is the `btrim` form; it limits where a login may *file* and never decides a
  read. *Safe; the btrim/JS whitespace mismatch is noted above.*
- **Profile picture**: `record_attachment()` never auto-sets a Medical photo (`0267`). **But `set_resident_profile_photo()` (live
  body `0264:518`) has no Medical test**: a login holding `photos.resident_manage` can set a Medical file as the profile photo.
  *Found, not fixed.* Impact is limited because `public_resident_photos`/the profile view exclude Medical (`0101`, `0103`), so it
  does not reach the public site; it is still an internal inconsistency with the app's `isMedicalFolder` intent.
- **Appeals** (`0216`/`0274`): the only route for a Medical file to anon, behind `appeal_photos.medical_ok` by decision. *Unchanged.*
- **Deceased-residents archive**: reads the same `attachments` rows through the same policy. *Covered by the policy fix; no
  separate view found.* Not exercised on a deceased resident.
- **Drive file links**: Drive folders are anyone-with-the-link, its own backlog item. *Out of scope, recorded.*

## Handover for the app half (quote this)

- Gallery: a login without `photos.resident_medical` now receives **zero** Medical rows from the database; the Medical heading
  must not render empty for them. Gate with `can(perms,'photos.resident_medical','read')`.
- The Move-to-folder choice and the uploader's Medical option follow `photos.resident_manage` / `photos.resident_add`, unchanged.
- Add medical photos holders can file Medical photos and will not see them afterwards; the uploader's confirmation must not
  promise a thumbnail.
- `set_resident_profile_photo()` lacks a Medical guard (above).

## Production

Not applied from here. The planner applies `0276` after merge. Release note: `n/a` (production does not have `0276` yet).

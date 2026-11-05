# The profile-photo fallback must refuse a Medical file, and promotes the newest picture (#f214a)

**Status:** finding and decision recorded; the SQL half is **outstanding** (see "Why no migration").

## 1. Can a Medical file reach a resident's photo rows? YES - this is a live over-exposure, not only a correctness guard

`record_attachment()` (live body `supabase/migrations/0314_fundraising_events_app.sql:81`) files a resident attachment with
`sub_folder = 'medical'` for any login that holds `photos.medical_add`:

```sql
if p_owner_type::text = 'resident' and v_medical
   and not coalesce((select has_permission('photos.medical_add')), false) then
  raise exception 'This login may not add photos to the Medical folder.';
```

So the row is `owner_type='resident'`, `sub_folder='medical'`: exactly the rows `delete_resident_photo()` (live body
`0313_profile_photo_picture_guards.sql:58`) selects from. Its fallback filters only on `media_kind` and the video
extension, ordered `uploaded_at asc`, with **no** Medical test. `set_resident_profile_photo()` (`0313:10`, Medical test from
`0277`) refuses one. So deleting the current profile picture can install a Medical file as the public picture.
`record_attachment` itself already keeps Medical files off the automatic path (`and not v_medical`).

Pattern used: read the latest `create or replace function public.<name>` definitions (`grep -n` across all migrations,
then read the last). It cannot see the live database; `0315`-`0317` do not redefine any of the three functions.

## 2. The SQL to apply (lift into the next migration; NOT added here)

Replace the fallback select in `delete_resident_photo()` (keep the rest of the `0313` body unchanged):

```sql
    select drive_file_id into v_fallback
    from attachments
    where owner_type = 'resident' and owner_id = v_owner_id
      and lower(btrim(coalesce(sub_folder, ''), E' \t\r\n\f\v')) <> 'medical'
      and coalesce(media_kind, 'photo') = 'photo'
      and coalesce(file_name, '') !~* '[.](mp4|mov|m4v|webm|mkv|avi|3gp|mpg|mpeg|wmv)[[:space:]]*$'
    order by uploaded_at desc
    limit 1;
```

Same Medical test and character set as `0277`/`0276`. Test with a `begin; ... rollback;` `do $$` harness: resident with
profile photo A, a Medical file, a video, a newer ordinary photo B; delete A; expect B; delete B; expect NULL.

## 3. Promotion order: newest first

Chosen: **newest eligible picture first** (`uploaded_at desc`), over the old next-oldest. Reason: a profile picture should
show the animal as it is now. This changes code behaviour, not what the shelter does, so it is not Lutan's to rule.
The order only applies when the current picture is deleted; ties are immaterial.

## 4. Cards (not roles)

- **File a photo against a resident:** `residents` (`photos.resident_add`, `photos.shelter_add`), `add_photos`
  (`photos.shelter_add`, Shelter folder only), `adoption_news` (only to illustrate an adoption update);
  the Medical folder additionally needs `medical_records` (`photos.medical_add`).
- **Delete one (`photos.resident_manage`):** `residents`, `approve_photos`, `approve_website`.

## Why no migration

The migration slot of this batch is held by `approval-flag-schema` (`0318`). That is the reason the SQL is recorded here
rather than applied, not a design decision. `#f214a` stays open for the SQL half. No `src/` change is needed: the app
calls the RPCs and does not choose the fallback.

## Found, not changed (for the planner to file)

The fallback (and the direct call) does not check `attachments.approved_at`, whereas `record_attachment`'s automatic path
does. Approval columns belong to `approval-flag-schema` this batch.

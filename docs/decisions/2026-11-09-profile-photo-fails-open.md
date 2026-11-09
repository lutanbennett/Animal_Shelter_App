# 2026-11-09 — The public profile photo asks the positive question (`#h8xqv`, migration `0342`)

**Outcome: the three public views that carry a resident's profile photo now show it only when it is an approved picture of
that resident's own. The column stays directly writable, deliberately; that is recorded below as found, not fixed.** This
continues `docs/decisions/2026-11-09-public-read-enumeration.md` §3.1, which found and proved the fault; read that first.

Every claim is marked **[measured]** (read or run on a named database on this date) or **[judgement]**. Database for every
measurement: **dev, project `qxkmhwybjggxvsfxsxbd`, 2026-11-09, ~03:00–03:30 UTC.** Production was not read (a worktree
cannot), so the two production questions end in a command, not an answer.

## 1. The fault, reproduced before the fix [measured]

A `do $$ … $$` block through the Management API, ending in `raise exception` so nothing persisted. As the dev login holding
**exactly the `residents` card** (`dev-signin.mjs --cards residents`), with its JWT claims set and `set local role
authenticated` — the same statement a PATCH through the Data API runs — it wrote a Drive id with no attachment row into
`residents.profile_photo_drive_file_id`, then read it back as `anon`:

```
PROBE has_permission=t rows_patched=1 anon_cards=repro-0342-no-attachment-row is_public=t (rolled back)
```

So: the card's `resident.record` edit let the row change; `public_resident_cards` handed the id to anon; and
`is_public_drive_file()` said yes, which is the only question the photo proxy asks before serving the file
(`src/app/api/photos/[fileId]/route.ts`). Re-counted afterwards: 2 residents, 1 with a profile photo, 0 rows starting
`repro-` — nothing persisted.

**Which cards grant `resident.record` at edit, re-measured rather than quoted [measured]:** one, `residents`, directly; none
through `card_includes`. (`photos.resident_manage` at edit, which the guarded RPC asks, is held by `residents`,
`approve_photos` and `approve_website`.)

## 2. The fix: 0342, and where its predicate comes from [measured]

The live definitions (`pg_get_viewdef`) were last written by `0217` and each said, for the photo:

> `case when exists (attachment of r, this id, Medical OR approved_at is null) then null else the id end`

**`0342` replaces only that expression**, in all three views, with the positive test taken from **`0319`** — the tests
`set_resident_profile_photo()` makes before it will set a profile photo, which are the same as `delete_resident_photo()`'s
fallback `where` clause:

- an attachment with `owner_type = 'resident'`, `owner_id = r.id`, `drive_file_id = r.profile_photo_drive_file_id`,
- `lower(btrim(coalesce(sub_folder, ''), E' \t\r\n\f\v')) <> 'medical'` (0319's whitespace set, stricter than 0217's),
- `coalesce(media_kind, 'photo') = 'photo'` and the file name is not a video extension (0313/0319's pattern),
- `approval = 'public_ok'`,
- **and** no attachment of that resident with that id is in the Medical folder.

The last clause is there because `set_resident_profile_photo()` asks its tests as **separate** `exists` (any Medical copy
refuses), while the fallback asks them of **one** row. The view takes the stricter of the two: one good row, and no Medical
copy. **[judgement]** it costs nothing and means a file filed twice, once under Medical, is never public through this path.

Every column, name, type and order is unchanged; nothing in `src/` changes. **The grants are restated, unchanged from 0217**
(anon and authenticated SELECT, everything else revoked), and declared under `database.declared` in
`docs/hard-coded-security-registry.json` as `grant to anon`, the shape `0303`, `0316`, `0328` and `0336` used for the same job.
**A wrong turn worth recording:** the first draft carried the grants, `check-hard-coded-security.mjs` refused the undeclared
`grant … to anon`, and the second draft dropped them on the strength of `create or replace view` keeping a view's privileges
(true, and proved: anon SELECT true, UPDATE false, authenticated SELECT true, on all three). Then `check-migration-grants.mjs`
(in `lint`) failed, because it requires every view a migration creates to state its grants. **The two checks agree once the
grant is declared**; dropping it satisfies one by breaking the other.

**After applying, the same reproduction [measured]:** `PROBE has_permission=t rows_patched=1 anon_cards=<NULL> is_public=f`.
The write still happens (see §3); it no longer reaches the public.

**The cases, one rolled-back run [measured]:** the profile photo set to each in turn, read as anon:

| profile photo is… | `public_resident_cards` | `is_public_drive_file` |
|---|---|---|
| approved Shelter picture | shown | true |
| unreviewed | null | false |
| refused (`private_only`) | null | false |
| approved, Medical | null | false |
| approved video (`.mp4`) | null | false |
| filed twice, Shelter approved + Medical | null | false |
| no attachment row | null | false |

The "approved video" row is the one other case the old views let through: they tested Medical and approval only.

## 3. The write path: NOT narrowed — found, not fixed [measured facts, judgement on the choice]

**Every writer of `residents.profile_photo_drive_file_id` [measured]:**

| Writer | How | Satisfies the 0342 test? |
|---|---|---|
| `set_resident_profile_photo()` (0319) | `security definer` RPC; `src/lib/residents/profile-photo.ts`, called by the hub's photo viewer and both edit forms | yes, by its own checks |
| `delete_resident_photo()` fallback (0319) | `security definer` | yes, or sets null |
| `record_attachment()` | `security definer`; first approved non-Medical picture becomes the profile photo | yes |
| `assign_pending_photo()` | `security definer`; only when `p_approve`, filed under Shelter | yes |
| `src/app/api/residents/[id]/videos/finish/route.ts:122` | service role; sets **null** | n/a (null) |
| `scripts/correct-resident.mjs` | copies the column from a removed duplicate to the kept resident | not necessarily |
| `scripts/check-medical-photos.mjs`, `check-photo-approval.mjs`, `check-public-drive-file.mjs` | rolled-back harnesses that write ids directly to build negative cases | deliberately not |
| any login whose cards grant `resident.record` at edit | table-level `UPDATE` and `INSERT` on `residents` granted to `authenticated` (`relacl` `authenticated=arwdDxtm`); `residents_update_perm` asks only that activity | not necessarily — this is the attack path |

The app's own edit form never sends the column in its `update`; it goes through the RPC (`edit/actions.ts:222–230`).

**Why not narrowed [judgement]:**

1. **The leak is closed where it is read.** `is_public_drive_file()` reads only public views, and the three views that carry
   this column now test the value positively. A directly-written id is now internal-only: it can be shown to staff, never
   served to anon.
2. **Column-level UPDATE cannot be revoked by itself.** `authenticated` holds UPDATE and INSERT at **table** level, so narrowing
   it means revoking both and granting them back column by column on the other 38 columns. **Every column added afterwards
   would then be silently unwritable** until someone remembered its grant — a latent fault in the table the app writes most.
3. **A trigger refusing a non-eligible value** (the data-shaped alternative, keyed on no role) would hold for every app path
   listed above, but would break `correct-resident.mjs` when the kept resident does not own the photo's attachment, and the
   three check harnesses. That is a change to tooling Lutan uses live, for a path that is already harmless to the public.

**What would have to be true to revisit:** a reader of this column that is **not** one of these three views starts deciding
what anon sees (a new public view, an export, a feed), or staff-side display of an arbitrary Drive id is judged a fault in
itself. Then the trigger in point 3 is the shape to build, with `correct-resident.mjs` taught to move the attachment first.

## 4. Orphans [measured on dev; production is a command]

`scripts/check-profile-photo-orphans.mjs` (new, read-only, one `SELECT`) puts every resident with a profile photo in one bucket:
`eligible`, `no_row`, `video`, `held_back`, and says whether `0342` is applied. Its buckets were proved in a rolled-back run
(one resident given an id with no row, the other an approved `.mov`: `no_row 1, video 1, leaving [R-8472 no_row, R-8473
video]`).

- **Dev before the fix:** 2 residents, 1 with a profile photo, **0 orphans** (same query, by hand).
- **Dev after:** 2 residents, 2 with a profile photo (the browser proof set the second), **eligible 2, no_row 0, video 0,
  held_back 0**.

**For production, the planner or release manager runs:**

```
node scripts/check-profile-photo-orphans.mjs --env production
```

**What the number means:** `no_row + video` profile photos leave the website when `0342` is applied. **Anything above zero makes
this a bigger change than it looks**: each is a resident whose website card loses its picture, and each needs one of their own
photos approved and set (Photos → open it → *Set as profile photo*) to get it back. Above a handful, apply `0342` with the
list in hand and tell the shelter first.

## 5. Is anything already published on production through this path? — a command, not a claim

The same command answers it, **run before `0342` is applied there**. While `0342` is not applied it prints, for each
`no_row`/`video` resident, a profile photo that is **on the public website today without being an approved picture of their
own** — `public_resident_cards` has no visibility gate, so all of them are served. For each one, someone with access should
open the Drive id it prints and say what the file is: a photo of that animal (harmless, just unreviewed) or anything else (an
exposure, and the file's sharing should be checked). **0 means nothing has been published through this path.** Not
established until it is run.

## 6. #1410's judgement about the other public Drive ids, tested [measured]

| Public view | Column | Shape | Writable by |
|---|---|---|---|
| `public_projects` | `cover_drive_file_id` | **derived from `attachments`** with `approved_at is not null` — positive, not this fault | — |
| `public_donation_channels` | `qr_drive_file_id` | raw pass-through of a free-text column | `website.content` → card `website` |
| `public_site_content` | `hero_…`, `donate_photo_…`, `foster_photo_…`, `volunteer_photo_…`, `about_photo_drive_file_id` | raw pass-through | `website.content` → card `website` |
| `public_site_content_photos` | `drive_file_id` | raw pass-through | `website.gallery` → card `website_photos` |
| `public_shelter_friends` | `logo_drive_file_id` | raw pass-through | `friends.manage` → card `publish_shelter_friends` |
| `public_shop_links` | `photo_drive_file_id` (and the friend's logo) | raw pass-through | `shop.manage` → card `manage_shop_page` |

So #1410's judgement **holds as to shape**: each of those columns gives "any Drive id the service account can read" reach
through `is_public_drive_file()`, and each is written by exactly one card whose purpose is publishing that page. The difference
from the profile photo [judgement]: those cards are publishing cards — the holder can already put anything on that page — while
`residents` is a record-keeping card whose photos were deliberately routed through approval. **Reported, not fixed.**

## 7. Found on the way, not this stream's

- `scripts/check-public-story-drive-file.mjs` fails `FAIL 1 unticked story photo is public` on dev. Traced: the file is public
  through **`public_resident_photos`** (an approved resident photo, resident made visible by the harness), not through any of
  the three views `0342` changes. Why the harness expects otherwise is not established.
- `scripts/check-public-drive-file.mjs` dies in its own setup on dev (`null value in column "owner_id"`: dev has no project
  folder to attach to). Before any view is read.
- `scripts/check-public-views.mjs` passes (exit 0, 473 ok, the same three skips as #1410) but takes **64 s**, over the 60 s per-check
  limit the briefs set.

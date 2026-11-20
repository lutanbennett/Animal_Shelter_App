# 2026-11-20 — A shelter's own logo on its own public website (`#shlog`, schema half)

Migrations `0429_shelter_logo.sql`, `0430_public_site_content_scoped.sql`, `0431_set_shelter_logo_scoped.sql`, applied to dev 2026-11-20. Harness `supabase/harness/shelter_logo.sql` (rolled back; passes with `HARNESS OK shlog schema`).
**`#shlog` is deliberately NOT ticked:** this is its schema half; the upload surface and the header are `shelter-logo-upload`. **This file is written to be quoted.**

**Step zero:** `src/app/adopt/PublicHeader.tsx:214` still serves `/lca-logo-transparent.png` to every tenant; no migration gave a shelter its own logo (the only `logo` column is `shelter_friends.logo_drive_file_id`, a Shelter Friend's, a different thing). The gap was there, so the work went ahead.

## 1. Where the logo lives, and why

**`site_content.logo_drive_file_id text`, nullable.** Same shape as the hero (`hero_drive_file_id`, 0018) and the four page photos. What I read: `0018` (the hero column), `0163` (`website.content` writes `site_content`), `0274` + `0351` (`set_hero_photo`, gated by `website.gallery`), `0315` (the approval portal), `0344` (insert policy), `0347`, `0395` (`site_content` is **one row per shelter**, unique on `shelter_id`), `0256` (the public view), `0369` (`is_public_drive_file`), `0392` (the restrictive `shelter_scope_*` policies).
- **Not on `shelters`:** `shelters` holds identity and state (names, hosts, `public_site`, account holder). Everything a shelter *shows on its public website* is on `site_content`, which already has the per-shelter row, the Admin → Website write path, the public view and the public-file test. A column on `shelters` would need all four built again.
- **Not in `site_content_photos`:** that is the gallery (many photos, positions); a logo is one image per shelter.
- **Approval: a logo does NOT go through the approval portal.** `website_drafts` (0315) only drafts patches to `site_content` / `site_pages` *text*; "a photo is a Drive file, and the photo path is already approved through `photos.approve`" and the hero has never been queued. A logo is set directly, like the hero, by whoever holds the card below. Shipping it through a queue would have been an accident; it is not one.

## 2. The column, the write, the read

| thing | what | null rule |
|---|---|---|
| `site_content.logo_drive_file_id` | Drive file id (text) of the uploaded image | null = this shelter has **no logo of its own** |
| `set_shelter_logo(p_drive_file_id text)` | **the one write for a login**, `security definer`; null or blank clears it | asks `has_permission('website.gallery')`, else raises the key `photo.website_not_allowed` (the hero's own key, so no new refusal key); updates **only the request's shelter's row** (`shelter_id = current_shelter_id()`) |
| `public_site_content.logo_drive_file_id` | the public view, **last column** | same null |
| `is_public_drive_file(id)` / `is_known_drive_file(id)` | the logo id is public (via the view, so only the shelter's own) and not an orphan | — |

**Who may upload: the card that carries `website.gallery`** (the hero's activity; `src/lib/permissions/cards.ts:271` bundles it with `website.content` read). Admin through the `isAdmin` short-circuit, unchanged. **No card and no role added.** Anyone holding `website.content` at Edit can also write the column directly (the existing `admin_update_site_content` policy); that is identical to the hero and not widened.

**Writes need a row.** There is no seed (0416 does not seed `site_content`). If the shelter has no row, `set_shelter_logo` updates nothing and says nothing, exactly as `set_hero_photo` does. **The app half must create the row first** (`CreateSiteContentRow` already exists; `0344` lets `website.content` insert) or read it back after the call.

## 3. The fallback rule (chosen by me; Lutan not asked, not needed)

**A shelter whose `logo_drive_file_id` is null shows its NAME ALONE: no image element, no placeholder, no other shelter's file, no product icon.** Never `/lca-logo-transparent.png` or any shared static file for a null logo. Why this one over a neutral mark: a neutral mark is one more asset to design and every second shelter would carry the same one, which is the fault again in miniature; the name is already per shelter.

**Consequence the app half must plan for, because it is a visible change on Lanna:** Lanna's logo is only a static file today. After the header stops serving it, Lanna's public header shows its name alone **until Lanna's own logo is uploaded through the new surface.** So: ship the header change together with a step for Lutan to upload Lanna's logo (`public/lca-logo-transparent.png` is the file), or accept name-only for Lanna until he does. **Do not special-case `key = 'lanna'`** (no code may name a shelter's role or key to decide what shows).

## 4. What the public header reads, in order

1. `readSiteContent()` → `public_site_content.logo_drive_file_id` (the view is now scoped to the request's shelter, section 5). **Add the column to `SITE_CONTENT_COLUMNS` in `src/lib/site/content.ts`.**
2. Non-null → `<Image src={driveImageUrl(id, 160)}>` (the existing `/api/photos/<id>?w=160` proxy; `160` is on the width allow-list in `drive-client.ts`). The slot is `52px` / `lg:64px` square, `object-contain`, `alt=""` (the name is beside it).
3. Null → the `<span>` slot is **not rendered** and the name follows the same link.
4. **Verify transparency** before relying on the proxy: the current logo is a transparent PNG; the proxy's disk cache keeps `.png` beside `.jpg`, and I did not run a PNG through it. If it flattens, the logo gets a white box on `bg-site-paper`.
5. Also unscoped on the same line: `public/lca-logo-160.jpg` (0.43-era small logo, `2026-10-15-webp-photos-and-small-logo.md`) is on `PUBLIC_PATHS` / `LOCKED_PUBLIC_PATHS`; once nothing reads it, the app half may remove both the file and the entries.

## 5. Public read, proved

`public_site_content` was **owner-run, so anon read every shelter's row, with or without an `x-shelter-id` header** (measured on dev: 6 rows, 6 rows, 6 in the table). `readSiteContent()` is `.limit(1)`, so a second shelter's site would have shown an arbitrary shelter's content, logo included. **0430** adds `where (select is_trusted_caller()) or shelter_id = (select current_shelter_id())` (the 0392 policies' own expression); columns unchanged. Harness proves: A's header → A's logo; B's header → no logo and `is_public_drive_file(A's logo)` false; **no header → zero rows**; the write touches only the request's shelter; blank clears; a login with no card is refused; anon is refused.
**Behaviour change to know about:** with no header and no service role, the view now returns nothing (as every other table has since 0392). The Worker and `next dev` send the header; a trusted caller (service role) still reads every row.

## 6. Limits an upload must meet (the hero's, re-used; nothing new)

`src/lib/uploads/limits.ts`: **≤ 15 MB** (`MAX_UPLOAD_BYTES`), types `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif` (`WEBSITE_IMAGE_MIME_TYPES`), and the **bytes decide** (`checkFileSignature`), as `uploadToWebsiteFolder` in `src/app/admin/website/actions.ts` already does. Drive folder `Website`. **A logo should be sent a transparent PNG** — say so on the screen. No dimension limit is enforced anywhere; the header draws at most 64 px square (128 px source). **Replace** trashes the old Drive file (`trashInDrive`) and **Remove** calls `set_shelter_logo(null)`, as the hero does.

## 7. Found, not fixed (for the planner to file)

- **`set_hero_photo()` has the flaw 0431 fixed in `set_shelter_logo()`:** `security definer` + `where id = true` updates **every shelter's** `site_content` row, so one shelter's hero upload overwrites all others'. Reproduced by the same method on the logo function. Not changed here (not this item's). Every other `security definer` setter that updates by a constant key may have the same shape; not measured.
- **Other `public_*` views are not measured** for the same owner-run leak. `check-public-views.mjs` does not test shelter scoping.
- `is_public_drive_file` is itself `security invoker`, so with 0430 it now only says yes to the request's own shelter's files for the content views; the views that are *not* shelter-scoped keep answering as before.

## 8. What was verified

Applied to dev; harness passes; `check-hard-coded-security` clean (three declarations added to the registry under the existing public-site precedent, not debt); migration numbers ok. Not exercised: the Worker end to end (header → view), the photo proxy on a PNG.

# 2026-11-20 — Shelter logo, app half (#shlog)

The public header no longer serves `/lca-logo-transparent.png` to every tenant. It reads
`site_content.logo_drive_file_id` (0429) through `driveImageUrl(id, 160)`; **a shelter with none shows its name alone**
(no image element, no placeholder, no shared file, no shelter key named in code).

- **Surface:** `ShelterLogo.tsx` on Admin → Website (Home tab; the Photos tab for a photo-strip login), modelled on `HeroPhoto`.
  Upload / Replace / Remove. The control is drawn only when `can(perms, "website.gallery")`, the activity `uploadShelterLogo` and
  `removeShelterLogo` ask and the activity `set_shelter_logo()` asks.
- **Silent no-op closed:** `set_shelter_logo` updates nothing when the shelter has no `site_content` row. Both actions read the row before
  (refusing with a readable message when it is missing) and read the value back after, so a save that did not land is reported.
  A failed set trashes the just-uploaded Drive file; a replace trashes the old one only after the read-back matches.
- **Limits** are the hero's (`uploadToWebsiteFolder`): 15 MB, jpeg/png/webp/heic/heif, bytes decide, Drive folder `Website`.
- **Not done, and why (the planner should file / a person should do):**
  1. **PNG transparency through `/api/photos/<id>?w=160` is NOT proven.** Not run; the driven browser session kept losing its sign-in.
     If the proxy flattens, the logo gets a white box on `bg-site-paper`. `#shlog` stays open on this.
  2. **Two-shelter proof not run** (upload for one shelter, load the other's public site). Only the null case was seen: with no logo
     set, the Lanna dev public header renders no `<img>` at all.
  3. **Card-only login press not run.**
- **Static files kept:** `public/lca-logo-160.jpg` is still read by `src/app/AppHeader.tsx:99`, and `/lca-logo-transparent.png` is on
  `PUBLIC_PATHS`/`LOCKED_PUBLIC_PATHS`/`PLATFORM_KEEPS` and in other app pages, so nothing was removed.
- **Lanna's header** shows its name alone until its logo is uploaded through the new card (file: `public/lca-logo-transparent.png`).

# 2026-09-27 — Medical photos leave the public gallery in the view (`0101_public_photos_exclude_medical.sql`)

- **Filtered in `public_resident_photos`, not in `/adopt/[id]`.** The view is
  also one of the objects `is_public_drive_file()` (0084) asks, so one `where`
  line takes a Medical photo out of the gallery *and* makes the photo proxy
  answer 404 to a signed-out visitor who has its link. A page-level filter
  would have left the proxy serving it. Measured on dev after the apply:
  Markey's gallery-only Medical photo went from served to `404` signed out.
- **A deny-list on `Medical`, not an allow-list of the other three.** Resident
  photos' `sub_folder` also holds an adoption update's `YYYYMMDD` (0097), and
  the AppSheet import wrote the sheet's own value (blank became `Shelter`). An
  allow-list of Shelter / Foster / Adoption would have silently hidden the
  adopter photos. Dev counts, 2026-09-27: Foster 46, Medical 44, Shelter 22,
  a date 2, Adoption 1, no nulls. The comparison ignores case and surrounding
  spaces; a null folder stays public, since it is not a Medical filing. It
  cannot catch a medical photo filed under the wrong folder — refiling is
  staff's, and a "Move to folder" action is in the backlog item.
- **The status subquery names `private.resident_current_state`.** Re-creating
  the view from 0025's text would bind to 0086's gated public view, which
  answers nothing to anon, so every status would coalesce to `Resident` and
  adopted and deceased residents' photos would return. `check-medical-photos.mjs`
  asserts the new view equals the old one minus Medical on real rows.
- **Profile photos are not covered by this file.** A Medical photo chosen as
  the profile photo still reaches `/adopt`, the home cards, recent adoptions,
  `/r/<code>` and the proxy through `profile_photo_drive_file_id` (8 residents
  on dev, one of them public). That decision — block the choice or fall back
  to no photo — is the feature half's (`claude/medical-photos-profile`).

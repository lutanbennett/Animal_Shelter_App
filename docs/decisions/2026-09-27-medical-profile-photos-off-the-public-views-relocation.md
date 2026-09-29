# 2026-09-27 — Medical profile photos off the public views; `relocation` becomes `international-adoption` (`0103`, `0104`)

- **The views hide the photo; the resident's profile photo is left alone.**
  `0103` makes `public_resident_profiles`, `public_recent_adoptions` and
  `public_resident_cards` report `profile_photo_drive_file_id` as null when
  that file is the resident's Medical attachment (0101's test, so case and
  padding do not matter). The resident stays listed; the site draws its
  "No photo yet" placeholder. Inside the app the Medical photo is still the
  profile photo, which is fine there. Because `is_public_drive_file()` reads
  those same views, the proxy stops serving the file signed out as well —
  measured on dev: Markey's `/adopt` card shows the placeholder and
  `/api/photos/<his profile file>` answers `404` signed out, while another
  resident's non-Medical profile photo on the same page still answers `200`.
- **The leak was wider than Markey.** `public_resident_cards` (behind
  `/r/<code>`) covers every resident, not only public ones, so before
  `0103` all 8 dev residents with a Medical profile photo were servable to a
  signed-out visitor who had the file id — not just the one on `/adopt`.
- **`record_attachment` / `delete_resident_photo` not changed.** Skipping
  Medical when choosing automatically was considered and left out: with the
  views fixed it no longer affects the website, and it would leave a
  resident whose only photos are Medical with no photo in the app. Staff
  choose a better one where it exists (on dev only White has one).
- **Views re-created from their live definitions.** `pg_get_viewdef` on dev,
  not the text of 0068 / 0073 / 0094, with `private.resident_current_state`
  and `private.approved_translations` qualified. `check-medical-photos.mjs`
  asserts on real rows that each view keeps exactly its rows and only the
  Medical profile photos turn null.
- **`0104` renames the row rather than replacing it, and clears its text.**
  Title becomes "International adoption", body is emptied: anything saved
  under the old slug is relocation text by definition, and an empty body
  lets the new page show its starter text. The update matches only a row
  still on `relocation`, so a re-run cannot wipe text typed into the new
  page. Dev's body was already empty. Until the feature half ships, `main`'s
  `/relocation` has no row to read; it never reached production.

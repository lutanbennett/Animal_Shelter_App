# Appeals medical photos: the app half (builds on 0216)

The schema (0216, `2026-10-17-appeal-medical-photos.md`) already made a Medical photo public only through a ticked
`appeal_photos` row on a published appeal. This is the app side. No migration.

- **Picker:** Medical images sit in their own group beneath the others. Ticking one asks for a confirmation saying it
  will be public on the appeal's page and wherever it is shared. Disabled for anyone without `appeal.medical_photo`;
  the action and the database both check it too.
- **Cover until tapped:** ticking sets `is_graphic` true (the Director may untick it). The public gallery shows
  "Medical photo, tap to view" for a medical photo (`is_medical`) instead of the generic warning.
- **Open Graph:** the share picture is the first photo that is neither graphic nor medical; the profile photo or the
  default image otherwise. A medical cover is therefore never used, even when the Director picks it as the appeal's cover
  (the cover still leads the page itself).
- **Audit:** `medical_ok_by` / `medical_ok_at` are stamped by the database (0216); nothing extra here.
- **Boundary kept:** no resident profile, `/adopt`, gallery or other page reads `medical_ok`. 0101/0103 untouched.

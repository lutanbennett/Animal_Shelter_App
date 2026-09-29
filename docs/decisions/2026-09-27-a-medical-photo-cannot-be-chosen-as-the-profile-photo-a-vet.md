# 2026-09-27 — A Medical photo cannot be chosen as the profile photo; a vet's photos go to Medical

The feature half of "Keep Medical-folder photos off the public website"
(`0101` was the schema half), done together with "A vet's photo upload
should be limited to the Medical folder" (Pass 1, Vet) — both are about
Medical as a destination and both touch the same upload path.

- **Blocking was chosen for the choice, and it is not the whole fix —
  measured before deciding.** On dev, 8 residents have a Medical profile
  photo, and **7 of them have no photo in any other folder** (Doi has 12,
  all Medical). Nobody chose those: `record_attachment` makes a resident's
  first upload the profile photo whatever its folder, and
  `delete_resident_photo` falls back to the oldest remaining one. So a block
  in the app cannot clear them and cannot stop new ones, and clearing them
  would take away the only picture those animals have *inside* the app too
  (hub, cards, archive PDF), where a Medical photo is fine. Lutan decided
  (2026-09-27): block the choice in this PR, and do the public views'
  fallback — `public_resident_profiles`, `public_recent_adoptions`,
  `public_resident_cards` answer no photo when the profile photo is in
  Medical — as a **separate schema PR**, since `vet-doctors-roster` held
  this batch's migration slot (`0102`). Until it lands, a Medical photo that
  became the profile photo on its own still shows on the public pages (on
  dev: Markey, the one public one). The release line says so.
- **The block is one helper, not three checks.** `setResidentProfilePhoto`
  (`src/lib/residents/profile-photo.ts`) is now the only way the app sets a
  profile photo — the hub's photo viewer and both edit paths (the living
  and the after-death edit) call it. It reads the photo's folder with the
  signed-in user's client and refuses Medical with a sentence, then calls
  `set_resident_profile_photo` as before, so the RPC keeps its own role and
  "belongs to this resident" checks. The viewer shows the reason in place of
  the button, and the edit picker greys the tile out with a Medical label;
  a Medical photo that is *already* the profile photo stays shown as
  current, so nothing looks broken. Not enforced in the database: the RPC
  can still be called directly by a signed-in user, which is one more reason
  the view fallback is the real guarantee.
- **"Medical" is tested exactly as `0101` tests it** — `isMedicalFolder()`
  ignores case and surrounding spaces, and a null folder is not Medical —
  so the app and the public views can never disagree about which photos are
  hidden.
- **A vet's folder is enforced in the route, and the form has no picker.**
  `photoCategoriesForRole()` gives a vet `["Medical"]`; the uploader shows
  "Photos you add go in the Medical folder." instead of a one-item dropdown,
  and `POST /api/residents/[id]/photos` answers 403 to a vet posting any
  other folder, no folder, or an adopter's photo (`adoptionUpdateId` — a vet
  is not in `ADOPTION_UPDATE_ROLES`, and those photos are filed by date, not
  under Medical). `assertPhotoWriteAccess()` now returns the role it read,
  so the route asks once. Measured on dev with a throwaway vet login:
  Shelter, Foster, none and an adoption update all 403 with "Your photos can
  only go in the Medical folder.", Medical 200; staff unchanged.
- **The existing ones are listed, not changed.** `check-medical-photos.mjs`
  now prints, read-only after its harness, every resident whose profile
  photo is in Medical, marks the ones on the website and says whether a
  photo in another folder exists for staff to choose. On dev only White has
  one; the view fallback covers the rest without touching anybody's photo.

# Photo approval and `photos.shelter_add`: the schema half (`0217`)

2026-10-17. Schema half of two backlog items: *"A separate 'Add resident photos' card ... Shelter folder only"* and *"Photos filed by a volunteer stay unpublished until Management approves them"*. **The feature is not usable when this merges.** No volunteer can file a Shelter photo and nobody can approve one: the card, the folder choice, the approval queue and the *Waiting for approval* label are the app half.

## What `0217` does

- **A new activity `photos.shelter_add`** (yes/no, sort 65). It means: may file a resident photo into the **Shelter** folder, and nowhere else. "Shelter only" is a property of the login, not of the page.
- **`attachments.approved_at` / `approved_by`.** Null means *waiting*. Set by the trigger `attachments_approval_stamp`, never taken from the caller (a pre-filled `approved_at` on insert is discarded).
  - **Approved on save:** a login that may publish (`can_publish_resident_photos()`), a script (no signed-in user), a Medical-folder photo, an adopter's photo (it has its own `share_publicly` gate), any non-resident attachment.
  - **Waiting:** a resident photo outside Medical filed by anyone else, i.e. the `photos.shelter_add` login.
  - Only a login that may publish can approve or withdraw an approval; the database stamps who and when.
- **`record_attachment()`** (0190's body, two marked changes): `photos.shelter_add` lets through exactly one thing past the Medical-only rule (Shelter folder, not an adopter's photo, not a medical-only-scope login); and a photo that is still waiting never becomes the profile photo. Every other folder is still refused for that login, by the database.
- **Public views show approved only:** `public_resident_photos`, the profile photo in `public_resident_cards`, `public_resident_profiles` and `public_recent_adoptions` (a waiting profile photo reads as none), `public_adoption_updates`, `public_appeals` (cover) and `public_appeal_photos`. `is_public_drive_file` asks those views, so the direct file URL follows them and was **not touched**; neither was `is_known_drive_file` (service role only).

## The back-fill

Every attachment that exists when the column is added is approved, in the same transaction as the column and before any view filters on it. Without that, every photo on the public site would vanish at once, silently. It is guarded by "only when the column was just added", so a **re-run can never approve a waiting photo**.

Two things the first apply taught: `sort` on `permission_activities` is unique (22 was taken; 65 is next), and the back-fill's `update` is stopped by the deceased-resident lock (0026) for a dead animal's photos, so it sets that lock's own transaction-local bypass for the one statement.

## How approval and the appeal path (0216) combine

A photo on an appeal must be **approved**, and a Medical-folder photo must **also** have `medical_ok`. Since a Medical photo is approved on save, the appeal's own `medical_ok` tick stays the only gate for it and `0216` behaves exactly as before (its harness, `check-appeal-medical-photos.mjs`, still passes). A **Shelter** photo that is waiting cannot be attached to an appeal (`appeal_photos_guard`) or shown on one (both views), so an appeal can never publish what the resident page would not. A photo whose approval is later withdrawn leaves the appeal on the next read.

## What the app half must do

- **The card is called "Add Shelter Photos", plural.** Settled 2026-10-17: it pairs with the existing "Add Medical Photos" card (the two differ in one word) and the page takes several photos at once. The closed #697 branch (`claude/photo-card-reachable`) already has the plural in both dictionaries, a usable card entry, tests and a decision file: **start from it, do not rewrite, and do not reopen the name.**
- **Do not narrow `photoCategoriesFor()` for everyone.** #697 was closed for exactly that: filtering the folder list in `/photos/add` emptied the page for Head of Medical and left volunteers with nothing. The Shelter-only rule belongs to *this activity*: `photoCategoriesFor()` returns `["Shelter"]` only for a login that holds `photos.shelter_add` and not `photos.resident_publish`. Management keeps all four folders; Head of Medical keeps Medical.
- **Catalogue and labels:** `catalogue.ts` and both dictionaries already carry `photos.shelter_add` (added here so `check-permission-catalogue` stays green); the card in `cards.ts`, its bundle and the grants to Volunteer, Management and the 2IC are the app half's.
- **Upload routes:** teach them `photos.shelter_add` too. A direct table insert by such a login is still refused by the 0152 folder guards (only `record_attachment()` admits it), which is deliberate; use `record_attachment()`.
- **Queue and labels:** the *Photos to approve* list (approve by updating `approved_at`, which the trigger stamps), the tile with a count, *Waiting for approval* on the resident's Photos section, and Remove (deletes the file from Drive). A photo approved later does not become the profile photo by itself: setting it is the app's job, and it must be refused while waiting.
- Do not tick either backlog item until all of that is merged.

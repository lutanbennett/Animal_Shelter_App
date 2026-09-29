# 2026-09-25 — Public Drive files are the ones the public views show (`0084_is_public_drive_file.sql`)

The schema half of "The photo proxy serves any known Drive file to a
signed-out visitor". `is_public_drive_file(text)` answers the question the
proxy should ask for a visitor; `is_known_drive_file` stays as it is, and
the route switches in the feature half (`claude/photo-proxy-session-check`).

- **"Public" is read from the public views, not restated.** The function
  asks the objects anon can already read a Drive id from — nine columns
  across `public_resident_photos`, `public_resident_profiles`,
  `public_recent_adoptions`, `public_resident_cards`, `public_projects`,
  `public_project_photos`, `public_shelter_friends`, `site_content` and
  `site_content_photos` — so hiding a resident, unpublishing a project or
  archiving a Friend's contact withdraws its files with no second place to
  update. It is the same reasoning as `0082`'s `approved_translations`: one
  definition of public, in the views.
- **The list is wider than the backlog item guessed.** It named four
  sources; checking every view anon may read found `public_recent_adoptions`
  and `public_resident_cards` too. The second matters: `0068` publishes a
  card for *every* resident (the `/r/<code>` RFID page), so every resident's
  **profile** photo is public, hidden and deceased residents included. That
  is `0068`'s decision; this function only agrees with it, or the card pages
  would lose their photos once the proxy switches. A hidden resident's
  *other* photos stay private.
- **Security invoker, unlike `is_known_drive_file`.** Everything it reads,
  anon can read (owner-rights views, and `site_content(_photos)` behind
  `using (true)` policies), so it borrows no privilege, there is no role to
  check, and every caller gets the same answer. A definer version would
  have had to re-apply each view's filters by hand and would see the tables
  as their owner — the class of mistake `0082` fixed. A side effect, found
  by mutating the function in the harness: a branch that read a base table
  such as `attachments` fails for anon with `permission denied`, so the
  function cannot quietly widen to an internal table.
- **Granted explicitly** to anon, authenticated and service_role, and not
  PUBLIC: since `0082` a new function starts closed.
- Evidence: `scripts/check-public-drive-file.mjs`, a rollback harness on
  dev (fixtures for each public and each internal kind, asked as anon and
  as an admin; toggling each visibility flag; every real public-view id is
  public and no real blood-test or procedure file is). Its negative control,
  with the `public_resident_cards` branch removed, fails case A.
  `check-public-views.mjs` now calls the function with the anon key for a
  real public photo and a real blood-test/procedure file.

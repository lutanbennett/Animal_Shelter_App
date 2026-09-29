# 2026-09-25 — Shelter Friends: "Remove Shelter Friend status", beside Unpublish

Lutan found **Remove profile** when checking #103 on test, and it worked. His
concern was that a red "Remove profile" on a contact's own page reads as
*delete this contact*. That can go wrong both ways: staff avoid it when they
only mean "no longer a Friend", or press it expecting the contact to go.

- **Relabelled** "Remove Shelter Friend status" (Thai "ยกเลิกสถานะเพื่อนของศูนย์").
  It names what ends, the status, not a thing that sounds like the contact.
- **The confirm leads with "The contact … stays"** and ends by pointing at
  Unpublish for "hide for now". People read the first line of a
  `window.confirm` and little else, so the first line carries the reassurance.
- **Moved out of the edit form, onto the card's row next to Unpublish**, with a
  line under the row: Unpublish hides the card for now, and Remove means no
  longer a Friend. Inside Edit profile, the one action that ends the Friendship
  sat beside Save and Cancel, where nobody compared it with Unpublish. On the
  row, the two that differ are read side by side. It stays danger-styled and is
  pushed to the end of the row (`sm:ml-auto`; on a phone it wraps in line).
- **The success message says so** ("No longer a Shelter Friend. The contact is
  unchanged.") instead of the generic "Saved". The card then drops back to
  Make a Shelter Friend, which is itself the evidence that the contact survived.
- No server change beyond that message. `deleteFriend` already checked
  `assertManagementRole()` and RLS already refuses staff, vet and volunteer. A
  rolled-back harness on dev showed 0 rows deleted for those three, and 1 for
  management and admin.
- **Anon loses the internal views, by allow-list (2026-09-25):**
  `0081_anon_view_grants.sql` closes the exposure recorded under "Data API
  grants" (2026-09-24). **What was exposed:** with only the public anon key
  and no sign-in, dev answered `current_placement` (81 rows: placements,
  notes, carer ids), `resident_current_state` (81: names, status, deceased
  flag and date) and `immunization_compliance` (220: names and immunisation
  gaps); `immunization_duplicate_check` returned 200 with no rows. **Why:**
  Supabase's project default privileges gave `anon` ALL on every object
  created in `public`, and these four views run as their owner (no
  `security_invoker`), so the RLS on the tables underneath never applies to
  them. Every other object also carried anon's full set, TRUNCATE included,
  but RLS kept base-table reads and writes empty; `schema_migrations` was
  readable the same way. **The fix is an allow-list, not the four names:**
  revoke everything anon holds on every table, view and sequence in
  `public`, then grant back SELECT on what the public site actually reads
  with the anon key (the ten `public_*` views and `site_content`,
  `site_content_photos`, `site_pages`). Naming the four would have left
  the same trap for the next owner-rights view. It also removes anon
  PATCH/DELETE on `site_content_photos` and `site_pages`, which answered
  `204` (grant held, RLS matched nothing) and which the old check never
  tried. The `postgres` role's default privileges in `public` no longer
  include anon, so a table created afterwards starts with no anon grant
  (measured: `create table` in a rolled-back transaction, anon SELECT
  false, authenticated true). `supabase_admin`'s defaults are Supabase's
  and nothing of ours runs as that role. **TRUNCATE:** PostgREST maps
  DELETE to `DELETE`, has no verb that issues TRUNCATE, and no function in
  `public` contains it, so anon's TRUNCATE was never reachable through the
  Data API; anon now holds it on nothing. **Not changed:**
  `security_invoker` on the four views, since turning it on changes what
  signed-in staff, vets and volunteers see through them, and it is not
  needed to close the anon hole. Function EXECUTE is also untouched. The
  photo proxy calls `is_known_drive_file` as anon, and the public views
  call `approved_translations` as the caller, so revoking anon EXECUTE
  would break the public site. `approved_translations` does answer anon
  directly for any row id, so it is a backlog item of its own. **What the
  check now prevents:** `scripts/check-public-views.mjs` lists every table
  and view the Data API exposes (the schema root, which needs the service
  role key) and fails if anon can read any that is not on its public list.
  So a new object is covered without anyone remembering to add it, and a
  new `public_*` view fails until it is listed on purpose.
- **Migration drift is measured against `origin/main`, never the working
  tree, and guarded environments refuse to write from a checkout that
  differs from it (2026-09-25):** `schema_migrations` lives inside each
  database, so `--status` used to answer only "which of *this checkout's*
  files has this database run" — which is how `0069_seed_standard_diet.sql`
  sat on production with no file on `main` and dev held rows for the
  renumbered `0067`/`0069` while every report said `0 pending`. The
  authority is what `main` holds, because schema reaches `main` before any
  database; a feature branch's own files would hide exactly the gap being
  looked for. So `apply-migrations.mjs` fetches `origin/main` and reads its
  tree with `git ls-tree`. `--drift <env>` names both halves (files on
  `origin/main` not applied; applied rows with no file) and exits 1 on
  either, and `--status` prints the same two lists under its checkout view,
  so "what has production not run?" is `--drift production`. Both are now
  genuinely read-only: they check for `schema_migrations` with
  `to_regclass` instead of creating it. For **uat and production**, any
  run that writes or executes DDL (apply, `--dry-run`, `--baseline`)
  refuses unless every migration file in the checkout is on `origin/main`
  with the same blob id (`git hash-object`, so CRLF checkouts compare
  equal) and every file on `origin/main` is in the checkout; a failed
  fetch refuses too. The check runs **before** `loadEnv`, so it needs no
  credentials and never reaches a database, and it has no override flag —
  matching `deploy.mjs`'s clean-pushed-`main` gate rather than a prompt,
  since a prompt that can be answered yes is not a gate. Dev (`test`) is
  not guarded: the schema PR is applied there before it merges. Output
  names files, counts and the project ref only; the Supabase URL is no
  longer printed, since this output gets pasted into PRs. **Known limits:**
  a row records a filename, not a checksum, so a file edited after it was
  applied is not detected; and dev's two leftover rows
  (`0067_public_resident_cards.sql`, `0069_assistant_actions.sql`) are
  reported as drift on every run until someone deletes them — deliberately
  not allow-listed, since an allow-list is how drift goes quiet again.
  **Boundary with `migration-numbering-check`:** this stream compares a
  database with `main`; checking that files are numbered one above `main`
  and that no two branches claim a number is the numbering item's, in CI.

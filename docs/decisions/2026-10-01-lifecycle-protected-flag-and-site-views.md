# A protected flag on the Lifecycle rows, and fixed-column views for `site_*` (2026-10-01)

Backlog DB-9 and DB-10. Migrations `0122` and `0123`; the new checks are in
`scripts/check-migration-grants.mjs` and `scripts/check-public-views.mjs`.

## DB-9: `protected` on `zones` and `enclosures`

Status logic finds the Lifecycle zone and its five pseudo-enclosures
(Unassigned, Hospital, Fostered, Adopted, Deceased) **by name**. Renaming
"Deceased" raised nothing; it silently detached the status machine from its
target. `/admin/zones` and `/admin/enclosures` allowed both a rename and (while
no placement pointed at the row) a delete.

- **A flag, not a name check in a trigger.** A trigger that hard-codes the six
  names has to be kept in step with every function that matches one; a flag is
  set once, on the rows, and a rename the project does want is a migration
  that lifts the flag in the same file as the logic that matches the name.
- **What a protected row refuses:** DELETE, a change of `name`, a move to
  another zone (enclosures), and the flag being cleared. Capacity, notes,
  `name_th` and `internal` stay editable. The trigger has a `when (old.protected)`
  clause, so an ordinary zone's rename is a plain update.
- **It binds every role including the table owner**, like 0026's on-death lock,
  0112's source flag and 0119's placement guards. A migration that must change
  one disables the trigger around the statement.
- **The flag is set after the triggers exist.** `false -> true` passes (the
  trigger only runs for rows already protected), and a re-run changes nothing.
- The admin pages show Postgres's message ("The Deceased pseudo-enclosure is
  protected: …") through the existing `refuse(error.message)` path; no UI work.
- Not covered: a *new* enclosure added to the Lifecycle zone is not protected,
  and nothing stops one being named like a status. Nothing matches on those
  names today.

## DB-10: `site_content`, `site_pages`, `site_content_photos`

Anon was granted `select` on the three **base tables** (0077), behind
`using (true)` policies. Any column added to them was world-readable the moment
it existed, with nobody making a mistake. It had already happened:
`site_content.vet_visit_estimate` (0071), which `src/lib/site/content.ts`
describes as an internal figure, answered anon straight from
`/rest/v1/site_content`.

**Anon now reads fixed-column views and has no grant on the tables:**

| anon reads | instead of |
|---|---|
| `public_site_content` (the `SITE_CONTENT_COLUMNS` plus `id`) | `site_content` |
| `public_site_content_photos` (`id, drive_file_id, alt, sort_order`) | `site_content_photos` |
| `public_site_pages` (already existed, 0059) | `site_pages` |

**If you are adding a column to `site_content` or `site_pages`:** it is private
until you add it to the view *and* to `SITE_CONTENT_COLUMNS`. That is the
point. Staff keep the base tables (`authenticated` is untouched), so the admin
forms are unchanged. `create or replace view` can append columns but not
reorder or drop them; keep the existing list in order (the 0101 trap).

Consequences found while doing it:

- `is_public_drive_file` (0084) is security **invoker** and read `site_content`
  and `site_content_photos` directly, on the premise that anon could. Revoking
  the tables would have made it fail for a signed-out visitor and the photo
  proxy would have refused every public photo. `0123` points it at the views.
  Anything else that runs as the caller and reads these tables as anon needs
  the same change.
- The public readers (`loadSiteContent`, the home-page gallery) read the views.
  `loadVetVisitEstimate` and the admin gallery still read the tables, as a
  signed-in user.
- The tables' `public_read_*` `using (true)` policies are left alone: they now
  admit only signed-in users, which includes a signed-in user with no role.
  Narrowing them is separate work.

## The new migration checks (`check-migration-grants.mjs`)

For every file above 0077, each is a mistake no later migration can make:

1. a table created in `public` needs `enable row level security` in the same file;
2. a `security definer` function needs `set search_path`;
3. a function created in `public` (trigger functions aside) needs a `revoke … from public`
   **and** `anon`. Both: Postgres grants EXECUTE to PUBLIC and anon is a member,
   so naming anon alone leaves it callable. `0082`'s default privileges already
   close new functions, so this is belt and braces, written down in the file;
4. `grant … to anon` only on `public_*` / `site_*` objects, plus the five
   functions the public site calls (`ANON_FUNCTIONS`, mirroring
   `PUBLIC_FUNCTIONS` in `check-public-views.mjs`). `alter default privileges …
   to anon` and `grant … on all … in schema` are refused.

Run against all 46 existing files they found **nothing real**. The first cut
raised 19, all the same two things: `create or replace` of a function that an
earlier migration created (the ACL survives it, so the check now skips those,
using the earlier files), and 0082 revoking `public` and `anon` in two
statements. Weakening was not needed; the allow-list in (4) is the public-site
functions and nothing else.

## `check-public-views.mjs` in CI

New `public-views` job, against the **test** project, reading
`TEST_SUPABASE_URL`, `TEST_SUPABASE_ANON_KEY`, `TEST_SUPABASE_SERVICE_ROLE_KEY`
from repository secrets. **Those secrets have to be added by Lutan**; until they
are, the job prints a warning and passes, because a fork's PR gets no secrets
and a red there would be noise. It is a warning annotation, not a silent pass,
but a green `public-views` with that warning means the public tier was not
checked. It is not a required check.

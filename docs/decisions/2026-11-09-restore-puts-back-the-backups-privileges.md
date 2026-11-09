# 2026-11-09: a restore puts back the backup's own privileges, and proves it

`#rg7pv`. Every restore recipe here uses `pg_restore --no-owner --no-privileges` and relied on
Supabase's default privileges to fill in (`2026-10-19-restore-drill-real-supabase.md`: *"default
privileges gave … access to all 82 public tables with no manual grants"*). That was true and was the
fault.

## What was measured

Comparing every privilege the API roles hold on `public`/`private`, read-only, Test (built by
migrations, as production is) against UAT (restored from production on 2026-11-08 the
`--no-privileges` way, plus three hand-typed grants):

- **UAT lacked 26**: `anon` SELECT on the 21 `public_*` views the website reads, and a few functions.
- **UAT had about 890 extra**, all to `authenticated`/`service_role`: TRUNCATE, TRIGGER, REFERENCES
  on ~108 tables, DELETE/INSERT/UPDATE on ~70, EXECUTE on 46 functions the migrations revoke
  (`database_health()` among them). Row-level security still stood in front of most of it.

The same shape on the 2026-11-08 production backup in the local rehearsal: **382 privilege statements
missing and 541 extra** after the restore.

## What was chosen

`scripts/restore-grants.mjs` (logic in `scripts/lib/restore-grants.mjs`), run straight after the
`public`/`private` restore:

1. **Reset** every object in `public`/`private` that the backup holds to its built-in default
   (`acldefault`: owner only, plus PUBLIC EXECUTE on functions), strip the API roles from `private`,
   and clear `postgres`'s per-schema default privileges.
2. **Replay** the backup's own ACL entries for those schemas (`pg_restore -L` of the `ACL` and
   `postgres` `DEFAULT ACL` lines).
3. Both **in one transaction** (`psql -1`), so a failure leaves the database exactly as it was, never
   with nothing granted.
4. **Prove it**: `pg_dump --schema-only` of the target, its GRANT/REVOKE/DEFAULT PRIVILEGES lines
   compared with the backup's, line for line. Exit 0 only when none is missing and none is extra.

**Why replay the backup rather than re-run the migrations' grant lines** (the other option the item
named): the backup is what production *was*, including any grant changed by hand; the migrations are
what it was *meant* to be, and re-running hundreds of files' grant lines out of order is its own
failure. **Why reset first:** pg_dump writes its statements relative to `acldefault`, not to what
Supabase's defaults left behind, so replaying alone would add the missing grants and leave every
extra one standing. **Why only objects the backup holds:** an object a newer migration created is not
in the backup, so resetting it would strip grants nothing then restores.

**Kept deliberately:** Supabase's own default privileges (`FOR ROLE supabase_admin`) are not replayed
(a non-superuser cannot set another role's), but the comparison includes them, so a project whose
platform defaults differ is still reported.

`--env` targets need `--confirm <project ref>`, typed: the script rewrites every privilege in two
schemas.

## Proved

- **Local rehearsal, 2026-11-08 production backup:** before, 382 missing and 541 extra; after, 903 of
  903, none extra. The rehearsal now runs this step as one of its checks, against a stand-in server
  given Supabase's default privileges so it fails the same way a real project does.
- **UAT, from a fresh production backup at the same migration (2026-11-09T0314Z):** check-only first
  (173 missing, 202 extra statements), UAT's prior privileges saved, then the run: **923 of 923, none
  missing, none extra**. Independently, against Test: UAT now holds nothing Test does not (it held
  ~890 extra); the 10 lines Test has and UAT lacks are Test being two unreleased migrations ahead,
  and production's backup lacks them too.
- **The app on UAT, rolled back:** 163 tables/views read as a signed-in login, 7 refused, and all 7
  are refused on Test too, by design (`0168`, `0229`, `0232`, `0292` revoke them); the 21 `public_*`
  views read as `anon`, 0 refused; `database_health()` refused to a login, as on production.

## Not covered

- A restore into production itself has not happened; this is the recipe for the day it does.
- Ownership is still the restorer's (`--no-owner`), unchanged.

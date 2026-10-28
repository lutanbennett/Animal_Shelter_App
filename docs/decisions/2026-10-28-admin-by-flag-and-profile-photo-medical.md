# Admin is keyed by `roles.is_admin`, the profile photo gets its Medical test, and a guard compares selects to migrations (2026-10-28)

Migration `0277`, `scripts/check-roles-columns.mjs`, `scripts/check-admin-by-flag.mjs`. Nothing under `src/` changed.

## What changed

1. **The Admin bypass is keyed on the flag, not the name.** `has_permission()`, `is_admin()`, `my_permissions()` (the three in the
   brief) and `holds_app_role()`, `reassign_recurring_job()`, `role_can()` now test `roles.is_admin` where they tested `r.key = 'admin'`.
   The three extra ones copy the same test; left on the name, a renamed Admin would pass `has_permission()` and still be refused "can
   still sign in". **The bypass itself is unchanged:** it still answers before any cell is read, Admin still holds no cards, and
   `can.ts:67` is untouched. Today the flag is true on exactly the row `key = 'admin'` is, so no answer changes.
2. **`set_resident_profile_photo()` refuses a Medical file.** An internal inconsistency, not an exposure: `record_attachment()` never
   auto-sets a Medical photo (`0267`) and the public views exclude Medical (`0101`, `0103`), so it could not reach the public site.
   Test form copied from `0276:37`: `lower(btrim(coalesce(sub_folder, ''), E' \t\r\n\f\v')) = 'medical'` (the brief's paraphrase,
   `trim(sub_folder)`, is not what `0276` contains). Chosen because a bare `btrim` strips spaces only while the app's JS `trim()`
   strips tabs and newlines too; the explicit set can only make the guard stricter. The proof covers tab- and newline-padded names.
3. **`check-roles-columns.mjs`** fails when a `.from("roles").select("…")` in `src/` names a column no migration creates (the shape
   of #990 and #991). In `npm run lint`, so CI runs it with no token.

## Proof (dev, rolled back; `node scripts/check-admin-by-flag.mjs`)

Admin passes before and after on all four answers; a **renamed** Admin (key changed with `roles_fixed_iff_reserved` dropped inside the
transaction, because the database pins a fixed role's key, so a shelter can really only rename its display name) still passes after;
a non-Admin login does not, and a role merely *named* `admin` without the flag gets nothing; Admin holds no cells; a
`photos.resident_manage` login is refused for five Medical spellings and still sets a Shelter photo; the old body allowed Medical.
Not shown: the old functions failing the renamed case. That is visible in `0272`'s text (`r.key = 'admin'`) and was not run.

## What the guard cannot see

Selects built from variables or `${…}` templates (counted, skipped); columns named in `.update/.insert/.eq/.order`; embedded relations
(skipped); a table name passed to a helper; columns added outside `supabase/migrations`; views; whether production has the migration
(`apply-migrations.mjs --status --env production`). Run with `--table <name>` for others; `residents` also passes today.

## Found, not fixed

Nothing: `roles` has 11 literal selects and every column exists. (`--table residents`: 49 selects, all fine.)

## Sequencing

`0276` is not on production yet. The runner applies pending files in order, so `0276` lands before `0277` there; `0277` depends on
nothing `0276` creates. Release note: `n/a`, nobody would notice.

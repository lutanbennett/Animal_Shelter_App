# `roles.is_admin` column added (0275), and CLAUDE.md corrected (2026-10-28)

Lutan, 2026-10-28, on production: *"Couldn't load roles: column roles.is_admin does not exist"*, no roles in the Add person
drop-down, no Add role button, and Delete role refused every role.

## What was wrong

`role-options.ts:43` (Security) and `who-does-what/actions.ts:269` (Delete role) select `roles.is_admin`. **No migration ever
created it** (`grep -rn "is_admin" supabase/migrations/ | grep -i "add column"` returns nothing; the only column ever added to
`roles` is `show_menu`, `0247`). #990 and #991 shipped that in `0.40.7`. `CLAUDE.md` said the Admin bypass was "keyed on
`roles.is_admin`" in three places, which described code that did not exist; the planner repeated the document when briefing
both. The Admin bypass itself never read the column: `my_permissions()` computes `bool_or(key = 'admin')`, so Admin access
worked throughout.

## What changed

`0275_roles_is_admin_column.sql`: add `is_admin boolean not null default false`, set it true on `key = 'admin'` (a NOTICE
prints how many rows it flipped), and a unique partial index `roles_one_admin_idx` so at most one role can be Admin. No app
change, so both pages work the moment it is applied, with no Pi or Worker deploy.

`CLAUDE.md`: the three "keyed on `roles.is_admin`" statements now say the column exists since `0275` but the SQL
(`has_permission()`, `is_admin()`, `my_permissions()`) still decides Admin by `key = 'admin'`. The settled Admin decision is
untouched.

## What the earlier test plans recorded

- **`security-page-redesign` (#990):** the browser check was run "on a temporary page of fake people", not the real page, the
  console line is `n/a: not checked`, and manual verification is `pending`. So the real page was never loaded; recorded
  honestly as not verified, not ticked.
- **`delete-role-button` (#991):** ticks "Browser console clean" as *checked on /admin/who-does-what at aal1 as Admin*. That page
  loads without the column (it only reads `is_admin` inside the delete action), so the tick was true of what was loaded; the
  delete press itself is `pending: Lutan to press Delete on a throwaway role`. Neither claimed the failing path worked.
  The gap was a `pending:` line, not a false tick.

## Release note: `n/a`

Production does not have the column until `0275` is applied, and the note would promise it works now
(`2026-10-11-release-note-truth-rule.md`). The PR that closes the production apply carries the note.

## Found, not fixed

- The follow-up already on the backlog: move `has_permission()`, `is_admin()` and `my_permissions()` onto the column, and
  add a guard against the app selecting a column no migration creates.
- `/admin/security` redirects to `/admin/security/verify` at aal1 with the dev sign-in route, contrary to the 2026-10-22 note
  in `CLAUDE.md` that it is reachable at aal1. Delete role's press also wants the authenticator code. So the two pages' action
  paths could not be driven in the browser.

# perm-role-lists: no role-name list, and no `hasAppAccess`, left in `src/`

2026-10-11, `claude/perm-role-lists` (batch 89). No migration. Closes the backlog item *Move the last four
role-name lists* (`VALID_ROLES` was `security-role-picker`'s, #525) and the quick win *Maintenance's Assigned to
list names a 2IC… as "Volunteer"*.

## What replaced each list

| Was | Now | Decides |
|---|---|---|
| `APP_ACCESS_ROLES`, `hasAppAccess()` | `loadSessionRole()` in `src/lib/auth/app-access.ts`: `my_permissions()` → `{ key, opensApp }`; the proxy, sign-in, Google callback, public header, resident card and `/no-access` read `opensApp` | who opens the app |
| `ASSIGNABLE_ROLES` | `ASSIGNABLE_KEY_FILTER` = `app_users.role_key` not in (`doctor`, `public_viewer`), the `NEVER_ASSIGNABLE` list that already existed in `eligibility.ts`; also used by maintenance's `loadAssignableUsers` | who a job may be given to |
| `MANUAL_ROLES` | `MANUAL_AUDIENCES` in `src/lib/manual/types.ts` (the manual's four audience tags, which is what `ManualRole` is); `asManualRole(sessionRole)`: not opening the app → null (sees everything), a built-in key → itself, any configured role → `volunteer` | which manual topics are shown |
| `requireRole`, `refusedPath`, `refuse` | deleted (no callers); `refuseFor(perms)` sends a role that opens the app to `/no-access`, anyone else to `/` | |

`staff` is gone from every list. `current_user_role()` is no longer called from `src/` for these four; the two other
callers (`/my`, `who-and-where.ts`) are `perm-drop-enum`'s.

## How a non-admin page gets a role's name: the dictionaries, not a column

`roles` is Admin-only to read, so a Head of Maintenance looking at the Assigned to list cannot look up
"2IC". Chosen: the three configured roles' names (English and Thai, the same words as `roles.name`/`name_th`) in
`t.admin.security.configuredRoles`, and `roleKeyLabel` (which already served the recurring-jobs pickers) checks
`roles` then `configuredRoles` before falling back to the key set out as words. The maintenance form passes
`user.role_key`. A column on `app_users` was refused: it needs a migration number, and `0179` is
`role-floor-schema`'s. It is a separate map, not more entries in `security.roles`, so `roleOptionLabel` (Security's
picker) still prefers the live name from `roles` for a configured role. **Cost:** a new configured role needs its
name added here, or non-admin pages show its key as words ("Head of kennels"); renaming one in Settings does not
rename it on non-admin pages. If that proves a nuisance, the column is the answer, as its own schema item.
`roleLabel(t, user.role)` had exactly one caller (the maintenance form; found with `grep -rn "roleLabel" src
scripts`), so it is deleted rather than kept for the enum.

## Parity: nothing moved. How it was checked, so it can be repeated

None of the four is a permission, so the permission layers must not move:

1. `node scripts/check-permission-parity.mjs` on `main` and on this branch, same dev database, output diffed
   (`diff` of the two, probe-progress line stripped): 260 probe runs, 1820 answers, 21 known tightenings, RESULT:
   RED on both (the red is the existing doctor/Section Z lines, not this change). The only difference is the
   removed `UNPAIRED hasAppAccess` line. Note the script probes the database, which this PR does not touch, so this
   proves no policy moved, not that the app code is equivalent. Hence 2 and 3.
2. Old versus new answer per login, run against dev through the Management API: for every `user_roles` row joined to
   `roles`, `enum ∈ {admin, management, staff, doctor, volunteer}` against `opens_app`; `enum ∈ {admin, management,
   staff, volunteer}` against `key not in (doctor, public_viewer)`; the maintenance list's `enum ∈ {admin,
   management, volunteer}`. All 61 logins, every role: identical, except `staff` (13 logins), which the old
   maintenance list left out and the new one lets in. **All 13 are archived logins, so none appears in
   `app_users` and nobody gains anything.** Brief said no live login holds `staff`; confirmed.
3. The manual: old `asManualRole(enum)` gave admin→admin, management→management, doctor→doctor, volunteer and the
   three configured roles (which borrow `volunteer`) → volunteer, public viewer → none. New rule gives the same for
   every row of `roles`.
4. `scripts/check-recurring-job-eligibility.mjs` passes (its "assignable roles" line now asserts the key filter).

One change that is not a move in anyone's access: a **live** login on an **archived** role would have opened the
app under the enum (`staff` was still in the list) and now reads as having no role (`my_permissions()` ignores an
archived role) and is signed out. None exists. It is the behaviour archiving a role should have.

## For `perm-drop-enum`

Nothing under `src/` names a role-name list any more. What still reads the enum: `/my` and
`src/lib/residents/who-and-where.ts` call `current_user_role()`; everything in 0178's "Left for perm-drop-enum"
list. `grep -rn "_ROLES\|hasAppAccess" src` is clean apart from comments.

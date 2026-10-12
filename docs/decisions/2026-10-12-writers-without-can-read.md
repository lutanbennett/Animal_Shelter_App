# 2026-10-12 — The eight writers with no `can()` were read: none was open

`writers-no-can`. App and scripts, no migration. Closes the backlog item "Admin, maintenance,
projects and intake writers contain no `can()` call".

## The result

**A null result, and it is the deliverable: no writer was open.** The grep counted files with no
`can(` in them. Read against what each one does, all eight areas are guarded, five of them by a
helper the grep could not see. No `can()` was added, so no role's access changed and there is no
key to check against the role rows on production.

| Area | Writes through | What decides | Verdict |
|---|---|---|---|
| `admin/diets` (4 writers) | session client, RPC `set_standard_diet` | `refusal()` -> `canEditItemSettings(perms, "diet")` -> `can()` on `reference.types` and `stock.diets`; table policies 0148 | guarded by `can()` through a helper |
| `admin/medications` (4) | session client, RPC `merge_medication` | same, kind `medication` | guarded by `can()` through a helper |
| `admin/security` (14 exported actions) | **service role** | every action starts `refuseUnlessAdmin(t)` -> `hasAdminRole()` + `hasTwoStep()` | guarded, and the one that matters: nothing but this check stands behind it |
| `admin/security/verify` | service role | `hasAdminRole()` at the top of both actions | guarded |
| `admin/who-does-what` (`setCell`) | session client | `hasAdminRole()` + `hasTwoStep()`, then `role_permissions` rules (0132) at aal2, plus `checkChange` | guarded twice |
| `maintenance` (5 actions) | session client | RLS: `maintenance.jobs`, `.progress`, `.delete` policies (0141, 0149, 0179) | guarded by RLS |
| `projects` (9) | session client | RLS: `project_folders_*_perm` on `projects.folders` (0149); `projects.publish` read with `can()` | guarded by RLS |
| `residents/new` (`recordIntake`) | RPC `record_intake`, security invoker | `residents_insert_perm` asks `resident.register`; the page is `requirePermission("resident.register")` | guarded by RLS |
| `api/status/alerts` | service-role key as bearer | `authorised()`: constant-time compare of the bearer against the key | guarded; not a user route |

The service-role writers are the dangerous half, so they were read first: `admin/security`,
`admin/security/verify`, and the one service-role call in `account/password` (clears the signed-in
user's own must-change flag after verifying their password). All three are guarded.

## What was broken: a refusal nobody could read

Maintenance and projects let RLS refuse, and several paths passed the raw database message to the
screen when the refusal came back as an error (`new row violates row-level security policy for
table ...`) rather than as an empty result, which already had a worded refusal. Those paths now map
code `42501` to the existing `t.common.notAllowed`, in `maintenance/actions.ts` (4 places) and
`projects/actions.ts` (8). Every other message passes through exactly as before. No new strings.

## The catalogue assertion (section G)

`check-permission-catalogue.mjs` now fails for any `"use server"` file under `src/app` that names
none of `can`, `requirePermission`, `requireAdminUser`, `assertAdminRole`, `hasAdminRole`,
`canEditItemSettings`, `refuseUnlessAdmin`, unless it is in `NO_ACTIVITY` with a reason. Today:
62 files, 49 name a guard, 13 are listed. A second test is not excusable by the list: a file that
calls `createAdminClient()` must carry its own admin check (only `account/password` is exempt, by
name, for its own-flag write). A stale list entry fails too.

The 13 listed files and why: login and forgot-password (signed out by definition), the account's
own password and theme, immunization fan-out and microchip (RPC, RLS decides), maintenance and
intake (above), and the five placement actions (hospital, hospital return, move, rehome, rehome
return), which go through `lib/placements` on the session client. The list is the lasting record
of "guarded elsewhere" versus "never looked at".

## What this does not prove

The check proves a guard is *named* in the file, not that it is the right one; a `can()` at the
wrong key still passes. Reading the five placement actions went as far as "session client, no
service role, no admin client in `lib/placements`"; I did not read each placement table's policies,
so those five rest on that and on the earlier architecture review of `move`.

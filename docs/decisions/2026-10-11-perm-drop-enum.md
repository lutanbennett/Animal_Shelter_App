# 2026-10-11 — `perm-drop-enum` (`0180`, `0181`): a role is only ever a row in `roles`

Batch 90, stream 2. The closing step of the permissions conversion. Reads with `2026-10-09-perm-convert-vet.md` §5,
`2026-10-11-perm-functions-schema.md`, `2026-10-11-role-floor-schema.md`, `2026-10-11-perm-role-lists.md` and
`2026-10-11-security-role-picker.md`.

## The real count (measured on dev, 2026-10-11, before any change)

The backlog item said 16 functions and 9 views. That was written before `0178` and `0179`.

| | Item said | Measured | Which |
|---|---|---|---|
| Functions that decide by the enum | 16 | **4**, plus `current_user_role()` itself | `private.has_app_access`, `has_shelter_floor`, `roles_guard_fixed`, `user_roles_sync_role_id` |
| Views | 9 | **8** | `private.app_users`, `current_placement`, `resident_current_state`, `immunization_compliance`, `immunization_duplicate_check`, `translation_queue`, `resident_who_and_where`, `recurring_job_staffing` |
| Policies | | **0** | |
| Columns | | **3** | `user_roles.role`, `roles.legacy_role`, `app_users.role` (a view column) |
| `src/` | | **4 files** at first sight, **7** once searched properly (below) | |
| `scripts/` | | about **60** | ~55 check harnesses, plus `bootstrap-admin`, `deploy`, `import-appsheet`, `measure-permission-baseline`, `probe-role-surface` |

Several functions *mention* `user_roles` (they join it to `roles` by `role_id`). Those are not readers of the enum. A
first regex counted 14 functions for that reason; reading each body brought it to 4.

**After:** 0 functions, 0 views, 0 policies, 0 columns, 0 lines of `src/` or `scripts/` that read or write the enum. Checked
by a standing query (`scripts/check-perm-functions.mjs`, now reporting `functions still reading the enum: 0`).

**The first search missed three readers in `src/`**, found only by searching for how the column is *used* rather than
its name: `src/lib/status/alerts.ts` (admin emails: `.eq("role", "admin")`), `loadDoctorLogin` in
`admin/security/actions.ts` (`.eq("role", "doctor")`), and two `app_users` selects asking for `role`. Dropping the column
would have broken release-mail and the doctor-link action at runtime, with no type error. The same search turned up
`deploy.mjs` (`user_roles?role=eq.admin`), `bootstrap-admin.mjs` and `import-appsheet.mjs`.

## Order, and why two files

1. **`0180`, conversions only.** Nothing is removed that code still calls, so it can be applied with the old app running.
2. App code and scripts moved off the enum. A query for readers then listed only what `0181` itself removes.
3. Parity and harnesses, below.
4. **`0181`, the drop**, applied to dev only after step 3.

Split deliberately: a problem found between `0180` and `0181` never needs a column put back (a dropped column takes a new
migration). It cost one more file and nothing else. The dry-run did **not** hit the dependent-file trap: `0181` was
dry-run after `0180` was applied, so each was judged alone and both came back `ok`.

## How the enum's questions are asked now

* "On the volunteer floor" (`current_user_role() = 'volunteer'`, in five views plus `resident_who_and_where`, the
  `app_users` email mask and the app's `readsWhoAndWhereOnly`) is `on_volunteer_floor()`: the role's
  `scope_residents = 'who_and_where'`, which `0179` set on every role that borrowed volunteer.
* "Holds an app role" (`has_app_access`) is `holds_app_role()`: a live login on any role but `public_viewer`.
* "A doctor" in the `app_users` email mask is `is_clinic_login()`, the scope `0167` already uses.
* `has_shelter_floor()` had no caller since `0179` and is dropped.
* `recurring_job_staffing` asks `role_key <> 'public_viewer'`.
* `user_roles.role_id` is now `NOT NULL`: with the enum gone, a login with no role would otherwise silently have no
  powers rather than being refused.

Both helpers deliberately **do not filter on the role being archived**, exactly as `current_user_role()` did not. A login
on a since-archived role keeps the audience it had. Changing that would make a role *lose* access, which is not this
stream's to decide.

## What the drop also removed (integrity rules, not permissions)

* `roles_template_names_legacy` (a `fixed`/`default` role must name a legacy role) and `roles_one_per_legacy_role`
  (one `default` role per enum value). Both existed only to keep roles and the enum in step. `roles_fixed_iff_reserved`
  and the unique `key` remain.
* Two of `check-permission-tables`' refusal cases rested on them (`kind = 'default'` with no legacy role, and a `staff`
  legacy role on a fixed row) and were removed with a note; the enum-bridge section D became "role_id is required and is
  the only thing a role is".
* The `app_role` type is dropped too (nothing uses it). `drop type if exists`, no `cascade`: if something unexpected
  depended on it, the migration stops and changes nothing.

## Parity: identical, and how that was checked

Not "nothing changed": the same scripts, run before and after against the same dev database, outputs diffed.

* `scripts/check-permission-parity.mjs`: **1792 MATCH, 21 KNOWN TIGHTENING, 21 MISMATCH** before `0180`, after `0180`,
  and after `0181` (the 21 are the existing doctor `clinicRule` lines, red on `main` too). Output diffed before versus
  after `0180`: identical apart from Node warning lines.
* `scripts/check-who-does-what.mjs` (306 boxes): identical before and after `0180`; green after `0181`.
* `scripts/check-perm-functions.mjs`: 1269 calls per side, 27 probes, **0 changes**, 0 functions reading the enum.
* `scripts/check-perm-convert-vet.mjs`: 2465 probes, 0 differences; `is_clinic_login()` agrees with the doctor role for 61/61.
* `scripts/check-app-access-gate.mjs`, `check-card-taps.mjs`, `check-public-views.mjs`, `check-view-write-grants.mjs`: green.

**No role lost or gained anything.** Nothing was found still deciding by name, so no cause had to be fixed to keep a number
still, and the enum was not restored to make any number go back.

## Every harness, before and after

All ~80 harnesses that touch `user_roles`, `legacy_role`, `current_user_role` or `app_role` were run against dev before
the drop (after `0180`) and again after `0181`, and the *failure lines* compared. 16 stay red, **every one with the same
lines as before** (`doctor-multi-clinic`, `impact-baselines`, `lifecycle-guards`, `maintenance-role`, `medical-jobs`,
`medication-rounds`, `new-policy-role-names`, `perm-convert-orphans`, `permission-parity`, `permission-tables`,
`recurring-jobs`, `role-can`, `role-write-policies`, `two-step-session`, `volunteer-narrowing`, and `phone-width` which
simply exceeds a 9-minute run limit without a failure). They are the existing reds that `role-floor-schema` already lists,
not caused here. `check-permission-tables` now gets past section D (the one this change rewrote) and stops at the same
section F (audit rows on dev).

Harnesses that **broke because of the drop and were fixed**: 

* those that gave a login its role by writing the enum now write `role_id` (`scripts/lib/user-role.mjs` for the Data
  API ones);
* `check-standard-diet-functions`, `check-stock-corrections`, `check-unit-conversions` *replay an old migration* whose
  bodies call `current_user_role()`. They get a function of that name for their own rolled-back transaction only
  (`scripts/lib/old-role-shim.mjs`); nothing outside a harness may use it;
* `check-perm-functions` can no longer rebuild its BEFORE side (0178's views name the dropped function), so judging the
  applied state is its default (`--replay` keeps the old mode for a database that still has the enum).

A harness that *fixtures a role on the volunteer floor* now says so with `scope_residents = 'who_and_where'`
(it used to borrow `legacy_role = 'volunteer'`): the `CUSTOM` roles with `floor: "volunteer"`, the three clerk roles,
the 2IC's single-cell roles.

## The path the brief named: creating a login from Settings → Security

`security-role-picker` (#525) wrote `role` = the row's `legacy_role` beside `role_id`. That write is removed (`roleColumns`
is `{ role_id }`), `givableRole` no longer needs a `legacy_role` (so a role with none can be given), and the Admin and
Doctor special cases follow the role's key. `scripts/check-security-role-picker.mjs`, driven in a real browser at 375 px
against the dev database **after the drop**, creates a 2IC, a Head of Maintenance and a Head of Medical through the page,
changes one through Management, Doctor, Admin and back, then signs each in for real: **all checks passed**.

## Release hazard — read before deploying

**`0180` and `0181` must reach the database before the new app, and `0181` cannot be rolled back by redeploying.**

1. Apply `0180` first. It is safe with the old app still running.
2. Deploy the new app.
3. Apply `0181` **after** the new app is live. The previous release still selects `app_users.role`, calls
   `current_user_role()` and writes `user_roles.role`; the moment `0181` lands it fails on all three (Settings →
   Security creates no logins, the user list errors, release mail finds no admin).
4. To undo `0181` a new migration must add the columns back and back-fill them from `roles`.

`apply-migrations.mjs` prints "land before the code that reads them … the safe direction". That is true of `0180` and the
**wrong way round for `0181`**, which removes what old code reads. The runner applies every pending file in one go, so on
a database with both pending **apply `0180`, deploy, then `0181` by name**, not the whole queue at once.
Dev is already at `0181`, so `test.lannacare.org` (still on `0.25.0`) will misbehave on the three paths above until it is
redeployed from this branch.

## Not taken

`notAskedYet`'s three activity splits and `databaseWider`'s nine policies are other items; no policy was narrowed in
passing.

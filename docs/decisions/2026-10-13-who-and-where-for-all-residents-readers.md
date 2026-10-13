# resident_who_and_where also answers roles that read every resident

**2026-10-13, migration 0192.** Admin and Management saw an empty resident picker because the view
filtered on `on_volunteer_floor()` (`roles.scope_residents = 'who_and_where'`) alone.

## Filter chosen
`on_volunteer_floor() or sees_all_residents()`. `sees_all_residents()` (0179) is
`scope_residents = 'all'` on a live role of a live person. A doctor's role is `own_clinic` and a
public viewer or signed-out caller has no such role, so both tests are false and they stay refused.
The view's columns are a subset of what `residents` already gives these roles: nothing new is exposed.

## Proof (dev, each login's own JWT)
`check-medical-jobs.mjs` and `check-2ic-role.mjs` now expect the picker view to answer admin,
management, the 2IC and volunteer, and to refuse doctor and no-role. `check-volunteer-narrowing.mjs`
used to assert management got nothing; it now asserts it does.
Pre-existing reds, unrelated and untouched: `cells: role_permissions` in medical-jobs, "change a delivery"
in 2ic-role, "read translations" and the `functions that still say 'volunteer'` line in volunteer-narrowing.

## The sweep: other `on_volunteer_floor()` uses in 0180 — left alone
Every other use is `not on_volunteer_floor()` (current_placement, immunization_*, resident_current_state,
translation_queue: floor roles are deliberately kept out; Admin/Management already pass) or the email
blanking in `private.app_users` (floor sees null; deliberate). None is a positive floor-only filter, so
none had the bug and none was widened.

## Consumers
The picker pages read the view directly, so they are fixed by the migration alone, no app change.
Callers that read it only when `readsWhoAndWhereOnly()` were unaffected and were not changed.

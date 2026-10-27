# The doctors table already had working update and delete policies; 0273 removes the dead ones

**Backlog item:** "NOBODY CAN RENAME OR DELETE A DOCTOR". Its main claim was wrong. Not ticked: the item is corrected by the planner.

## What was found (2026-10-27)

- The item was written from migration files, grepping for policies `on public.doctors`. The working policies were created in `0147_perm_convert_people.sql` as `vet_doctors_update_perm` and `vet_doctors_delete_perm` (`has_permission('clinics.doctors')`), and kept their names when the table was renamed. No migration ever drops them. A grep that finds nothing is not proof of absence.
- Live reading of `pg_policies` on dev (`qxkmhwybjggxvsfxsxbd`): `doctors` has `doctors_select_perm`, `doctors_insert_perm`, `doctors_update_perm`, `doctors_delete_perm` (all card-derived), `admin_all_doctors` (`is_admin()`), and the two dead `doctor_update_doctors` / `doctor_delete_doctors`. `doctor_clinics` has update and delete on `clinics.doctors` too.
- Production: the new `table-policy-commands` check was run against production on 2026-10-27 by the planner from the main checkout. `doctors` was absent from its output, meaning every command has a live policy there. Rename and delete are not broken on production.
- The app's rename (`actions.ts:140`) and delete (`:245`) use the caller's client, not the service role. The service-role writes in `src/app/admin/security/actions.ts` are login-linking, a different operation, and were not touched.

## What 0273 does

Drops `doctor_update_doctors`, `doctor_delete_doctors`, then `clinic_login_may_edit_doctor()` (nothing else called it, per `clinic-login-helpers` on dev). Changes no access: their guard was `is_clinic_login()`, `select false` since `0259`. `scripts/check-perm-functions.mjs` no longer probes the dropped function.

**Not dropped:** `current_clinic_resident_ids()` (called by `current_doctor_resident_ids()`) and `current_user_clinic_ids()` (`src/lib/clinics/scope.ts`). The two stay or go together later, once their callers are retired.

## Which card, and why

`clinics.doctors`, the card that already governs adding a doctor and merging doctors (`merge_doctors()` checks it). Renaming and removing a doctor is the same activity as adding one: maintaining the doctor list. `clinics.list` is only the read level and is wrong for a write. The `contacts` card is the one that carries `clinics.doctors`. No new card was needed.

## Proof

Rollback harness on dev (every dev-signin login, as `authenticated`, update and delete of a throwaway doctor row, then rolled back): only the `contacts` login (`clinics.doctors`) and `admin` changed 1 row for rename and delete; every other login (35), including `view_residents` and `view_medical` holders, affected 0 rows. The database refused them, not the UI.

## New check

`node scripts/check-production.mjs table-policy-commands [--env test]` lists, per table, commands no live policy allows. On both dev and production it also names many other tables (`video_uploads`, `status_alert_runs`, `stock_counts`, `translatable_labels`, `units`, ...). Some are deliberately service-role-only. Found, not fixed: the planner is filing it as a triage item.

Dev rows created: one throwaway doctor inside a rolled-back transaction, nothing persists. The dev-signin logins were created or refreshed for the run.

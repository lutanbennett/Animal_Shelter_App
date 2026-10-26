-- consumer: none
--
-- Drop the two clinic-login helper functions that nothing calls. Read from production and dev on 2026-10-26 by
-- `node scripts/check-production.mjs clinic-login-helpers` (pg_proc, pg_policies, views, constraints, column defaults; the check's
-- whole-word pattern was broken until this change, so an earlier "called by nothing" reading for all four was wrong):
--   * doctor_can_write_attachment(): called by nothing. Dropped.
--   * clinic_login_owns_visit(): called only by doctor_can_write_attachment(). Dropped after it.
-- NOT dropped, because something live still calls them:
--   * clinic_login_may_edit_doctor(): policies doctors.doctor_update_doctors and doctors.doctor_delete_doctors.
--   * current_clinic_resident_ids(): current_doctor_resident_ids().
--   * current_user_clinic_ids() (called by src/lib/clinics/scope.ts) and current_doctor_resident_ids().
-- Changes no access: nothing called either function. Re-runnable: drop function if exists, in dependency order.
drop function if exists public.doctor_can_write_attachment(attachment_owner_type, uuid);
drop function if exists public.clinic_login_owns_visit(uuid);

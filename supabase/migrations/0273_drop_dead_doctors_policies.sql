-- consumer: scripts/check-perm-functions.mjs
--
-- Drop the two clinic-login leftovers on public.doctors that 0264 missed, then the function only they called.
-- Changes no access: both policies were guarded by clinic_login_may_edit_doctor(), whose first clause is is_clinic_login(), which has
-- been `select false` since 0259, so neither could ever return true. Rename and delete of a doctor keep working through the policies
-- that already exist and resolve through cards: doctors_update_perm and doctors_delete_perm (clinics.doctors; created as
-- vet_doctors_*_perm in 0147 and carried over by the table rename), and admin_all_doctors (is_admin()).
-- NOT dropped, because something live still calls them: current_clinic_resident_ids() (current_doctor_resident_ids()) and
-- current_user_clinic_ids() (src/lib/clinics/scope.ts); 0266 kept them for the same reason.
-- Order matters: a policy depending on a function blocks its drop. Re-runnable: drop ... if exists.
drop policy if exists doctor_update_doctors on public.doctors;
drop policy if exists doctor_delete_doctors on public.doctors;
drop function if exists public.clinic_login_may_edit_doctor(uuid);

-- consumer: none
--
-- perm-convert-vet: the last 54 policies that read the enum, all the vet's, on 29 tables.
-- (docs/decisions/2026-10-09-perm-convert-vet.md; docs/decisions/2026-10-07-perm-convert-admin.md)
--
-- NOT THE CONVERSION THE OTHERS WERE. Every earlier conversion moved a role's policies onto its cells,
-- has_permission(). The vet's cells are the Director's draft (resident.microchip Edit, resident.record Read),
-- and on 2026-10-07 Lutan decided vets are NOT moved onto them: "nothing changes for a vet". Asking the cells
-- here would take visits, prescriptions, procedures, blood tests, weights and diets away from every clinic
-- login. So the question each policy asks is translated, not replaced: "is the caller a vet?" becomes "is the
-- caller's role limited to its own clinic?" (roles.scope_clinical = 'own_clinic', §5), which on dev today is
-- exactly the vet role and its six logins. Lutan chose this in chat on 2026-10-09.
--
-- Each policy is rewritten IN PLACE with alter policy: same name, command and roles; only the role test
-- changes, everything after it (the clinic's residents, its own visits, vet_owns_visit(), ...) is untouched.
-- The text below is pg_policies' own deparse of each policy on dev, with that one test substituted.
--
-- is_clinic_login()  true when the caller holds a live user_roles row whose unarchived role has
--   scope_clinical = 'own_clinic'. Reads roles, never user_roles.role, so it survives the enum's drop.
--   Written like is_admin() (0153): security definer, search_path '', NOT executable by anon. Many of these
--   policies are TO public, but anon holds no grant on any of the 29 tables (checked on dev), so none is ever
--   evaluated for anon; a policy whose function the caller may not run errors rather than answering no.
--   It deliberately does not ask a cell. A configured role given scope_clinical = 'own_clinic' would read what
--   a vet reads: that is §5's meaning of the scope, and no such role exists (custom-roles is still parked).
--
-- Behaviour is unchanged by design: no cell moves, so parity must not move either.
-- Left for perm-drop-enum: functions that still read the enum, among them current_user_vet_ids() and
-- vet_may_edit_doctor(), which these policies call. They answer as before.

create or replace function public.is_clinic_login()
  returns boolean
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select exists (
    select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id and r.archived_at is null
     where ur.user_id = (select auth.uid())
       and ur.archived_at is null
       and r.scope_clinical = 'own_clinic'
  );
$$;
comment on function public.is_clinic_login() is
  'True for a caller whose role sees its own clinic only (roles.scope_clinical = own_clinic): today, a vet. Stands in for current_user_role() = ''vet'' in the vet''s policies (0167). Asks no cell, on purpose.';
revoke all on function public.is_clinic_login() from public, anon;
grant execute on function public.is_clinic_login() to authenticated, service_role;

-- adoption_updates
alter policy vet_read_adoption_updates on public.adoption_updates
  using (((select public.is_clinic_login()) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))));

-- attachments
alter policy vet_delete_attachments on public.attachments
  using (((select public.is_clinic_login()) AND ((owner_type <> ALL (ARRAY['resident'::attachment_owner_type, 'blood_test'::attachment_owner_type, 'procedure'::attachment_owner_type])) OR (attachment_resident_id(owner_type, owner_id) IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))) AND vet_can_write_attachment(owner_type, owner_id)));
alter policy vet_read_attachments on public.attachments
  using (((select public.is_clinic_login()) AND ((owner_type <> ALL (ARRAY['resident'::attachment_owner_type, 'blood_test'::attachment_owner_type, 'procedure'::attachment_owner_type])) OR (attachment_resident_id(owner_type, owner_id) IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids)))));
alter policy vet_update_attachments on public.attachments
  using (((select public.is_clinic_login()) AND ((owner_type <> ALL (ARRAY['resident'::attachment_owner_type, 'blood_test'::attachment_owner_type, 'procedure'::attachment_owner_type])) OR (attachment_resident_id(owner_type, owner_id) IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))) AND vet_can_write_attachment(owner_type, owner_id)))
  with check (((select public.is_clinic_login()) AND ((owner_type <> ALL (ARRAY['resident'::attachment_owner_type, 'blood_test'::attachment_owner_type, 'procedure'::attachment_owner_type])) OR (attachment_resident_id(owner_type, owner_id) IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))) AND vet_can_write_attachment(owner_type, owner_id)));
alter policy vet_write_attachments on public.attachments
  with check (((select public.is_clinic_login()) AND ((owner_type <> ALL (ARRAY['resident'::attachment_owner_type, 'blood_test'::attachment_owner_type, 'procedure'::attachment_owner_type])) OR (attachment_resident_id(owner_type, owner_id) IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))) AND vet_can_write_attachment(owner_type, owner_id)));

-- blood_test_types
alter policy vet_read_blood_test_types on public.blood_test_types
  using ((select public.is_clinic_login()));

-- blood_tests
alter policy vet_delete_blood_tests on public.blood_tests
  using (((select public.is_clinic_login()) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids)) AND vet_owns_visit(vet_appointment_id)));
alter policy vet_insert_blood_tests on public.blood_tests
  with check (((select public.is_clinic_login()) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids)) AND vet_owns_visit(vet_appointment_id)));
alter policy vet_read_blood_tests on public.blood_tests
  using (((select public.is_clinic_login()) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))));
alter policy vet_update_blood_tests on public.blood_tests
  using (((select public.is_clinic_login()) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids)) AND vet_owns_visit(vet_appointment_id)))
  with check (((select public.is_clinic_login()) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids)) AND vet_owns_visit(vet_appointment_id)));

-- bulk_appointments
alter policy vet_read_bulk_appointments on public.bulk_appointments
  using ((select public.is_clinic_login()));
alter policy vet_write_bulk_appointments on public.bulk_appointments
  using (((select public.is_clinic_login()) AND (vet_id = ANY (( SELECT current_user_vet_ids() AS current_user_vet_ids)::uuid[]))))
  with check (((select public.is_clinic_login()) AND (vet_id = ANY (( SELECT current_user_vet_ids() AS current_user_vet_ids)::uuid[]))));

-- diet_types
alter policy vet_read_diet_types on public.diet_types
  using ((select public.is_clinic_login()));

-- enclosures
alter policy vet_read_enclosures on public.enclosures
  using ((select public.is_clinic_login()));

-- frequency
alter policy vet_insert_frequency on public.frequency
  with check ((select public.is_clinic_login()));
alter policy vet_read_frequency on public.frequency
  using ((select public.is_clinic_login()));

-- immunization_records
alter policy vet_rw_immunization_records on public.immunization_records
  using (((select public.is_clinic_login()) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))))
  with check (((select public.is_clinic_login()) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))));

-- immunization_types
alter policy vet_rw_immunization_types on public.immunization_types
  using ((select public.is_clinic_login()));

-- medication
alter policy vet_insert_medication on public.medication
  with check ((select public.is_clinic_login()));
alter policy vet_read_medication on public.medication
  using ((select public.is_clinic_login()));

-- placement_history
alter policy vet_read_placement_history on public.placement_history
  using (((select public.is_clinic_login()) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))));

-- prescriptions
alter policy vet_delete_prescriptions on public.prescriptions
  using (((select public.is_clinic_login()) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids)) AND vet_owns_visit(vet_appointment_id)));
alter policy vet_insert_prescriptions on public.prescriptions
  with check (((select public.is_clinic_login()) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids)) AND vet_owns_visit(vet_appointment_id)));
alter policy vet_read_prescriptions on public.prescriptions
  using (((select public.is_clinic_login()) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))));
alter policy vet_update_prescriptions on public.prescriptions
  using (((select public.is_clinic_login()) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids)) AND vet_owns_visit(vet_appointment_id)))
  with check (((select public.is_clinic_login()) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids)) AND vet_owns_visit(vet_appointment_id)));

-- procedure_types
alter policy vet_insert_procedure_types on public.procedure_types
  with check ((select public.is_clinic_login()));
alter policy vet_read_procedure_types on public.procedure_types
  using ((select public.is_clinic_login()));

-- procedures
alter policy vet_delete_procedures on public.procedures
  using (((select public.is_clinic_login()) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids)) AND vet_owns_visit(vet_appointment_id)));
alter policy vet_insert_procedures on public.procedures
  with check (((select public.is_clinic_login()) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids)) AND vet_owns_visit(vet_appointment_id)));
alter policy vet_read_procedures on public.procedures
  using (((select public.is_clinic_login()) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))));
alter policy vet_update_procedures on public.procedures
  using (((select public.is_clinic_login()) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids)) AND vet_owns_visit(vet_appointment_id)))
  with check (((select public.is_clinic_login()) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids)) AND vet_owns_visit(vet_appointment_id)));

-- recurring_job_assignees
alter policy vet_read_recurring_job_assignees on public.recurring_job_assignees
  using ((select public.is_clinic_login()));

-- recurring_job_occurrence_assignees
alter policy vet_read_recurring_job_occurrence_assignees on public.recurring_job_occurrence_assignees
  using ((select public.is_clinic_login()));

-- recurring_job_occurrences
alter policy vet_read_recurring_job_occurrences on public.recurring_job_occurrences
  using ((select public.is_clinic_login()));

-- recurring_jobs
alter policy vet_read_recurring_jobs on public.recurring_jobs
  using ((select public.is_clinic_login()));

-- resident_diets
alter policy vet_insert_resident_diets on public.resident_diets
  with check (((select public.is_clinic_login()) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))));
alter policy vet_read_resident_diets on public.resident_diets
  using (((select public.is_clinic_login()) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))));
alter policy vet_update_resident_diets on public.resident_diets
  using (((select public.is_clinic_login()) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))))
  with check (((select public.is_clinic_login()) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))));

-- residents
alter policy vet_read_residents on public.residents
  using (((select public.is_clinic_login()) AND (id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))));

-- shelter_friends
alter policy vet_read_shelter_friends on public.shelter_friends
  using ((select public.is_clinic_login()));

-- translations
alter policy vet_read_translations on public.translations
  using (((select public.is_clinic_login()) AND ((table_name <> 'residents'::text) OR (row_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids)))));

-- vet_appointments
alter policy vet_delete_vet_appointments on public.vet_appointments
  using (((select public.is_clinic_login()) AND (vet_id = ANY (( SELECT current_user_vet_ids() AS current_user_vet_ids)::uuid[])) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))));
alter policy vet_insert_vet_appointments on public.vet_appointments
  with check (((select public.is_clinic_login()) AND (vet_id = ANY (( SELECT current_user_vet_ids() AS current_user_vet_ids)::uuid[])) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))));
alter policy vet_read_vet_appointments on public.vet_appointments
  using (((select public.is_clinic_login()) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))));
alter policy vet_update_vet_appointments on public.vet_appointments
  using (((select public.is_clinic_login()) AND (vet_id = ANY (( SELECT current_user_vet_ids() AS current_user_vet_ids)::uuid[])) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))))
  with check (((select public.is_clinic_login()) AND (vet_id = ANY (( SELECT current_user_vet_ids() AS current_user_vet_ids)::uuid[])) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))));

-- vet_doctor_clinics
alter policy vet_delete_vet_doctor_clinics on public.vet_doctor_clinics
  using (((select public.is_clinic_login()) AND (vet_id = ANY (( SELECT current_user_vet_ids() AS current_user_vet_ids)::uuid[])) AND vet_may_edit_doctor(doctor_id)));
alter policy vet_insert_vet_doctor_clinics on public.vet_doctor_clinics
  with check (((select public.is_clinic_login()) AND (vet_id = ANY (( SELECT current_user_vet_ids() AS current_user_vet_ids)::uuid[])) AND vet_may_edit_doctor(doctor_id)));
alter policy vet_read_vet_doctor_clinics on public.vet_doctor_clinics
  using ((select public.is_clinic_login()));
alter policy vet_update_vet_doctor_clinics on public.vet_doctor_clinics
  using (((select public.is_clinic_login()) AND (vet_id = ANY (( SELECT current_user_vet_ids() AS current_user_vet_ids)::uuid[])) AND vet_may_edit_doctor(doctor_id)))
  with check (((select public.is_clinic_login()) AND (vet_id = ANY (( SELECT current_user_vet_ids() AS current_user_vet_ids)::uuid[])) AND vet_may_edit_doctor(doctor_id)));

-- vet_doctors
alter policy vet_insert_vet_doctors on public.vet_doctors
  with check (((select public.is_clinic_login()) AND (vet_id = ANY (( SELECT current_user_vet_ids() AS current_user_vet_ids)::uuid[]))));
alter policy vet_read_vet_doctors on public.vet_doctors
  using ((select public.is_clinic_login()));

-- vets
alter policy vet_read_vets on public.vets
  using ((select public.is_clinic_login()));

-- weight
alter policy vet_rw_weight on public.weight
  using (((select public.is_clinic_login()) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))))
  with check (((select public.is_clinic_login()) AND (resident_id IN ( SELECT current_vet_resident_ids() AS current_vet_resident_ids))));

-- zones
alter policy vet_read_zones on public.zones
  using ((select public.is_clinic_login()));

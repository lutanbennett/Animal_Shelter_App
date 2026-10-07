-- consumer: none
--
-- perm-convert-admin: the 43 admin_* policies and the 2 volunteer_read_* ones that still read the enum.
-- (docs/decisions/2026-10-07-perm-convert-admin.md; docs/decisions/2026-10-07-admin-role.md §2, §4)
--
-- WHY THEY WERE MISSED. check-policy-role-names.mjs looked for 'management' and 'staff' only, so 0152 could
-- report "no policy names a role" with 43 admin and 2 volunteer policies still calling current_user_role().
-- They are harmless today. They are what stops perm-drop-enum from dropping current_user_role() and app_role.
--
-- is_admin()  the enum-free admin rule (§6 rule 1). It is the first branch of has_permission(), taken alone:
--   the caller holds a live (unarchived) user_roles row whose roles row is unarchived and has key 'admin'.
--   It asks roles.key, never user_roles.role, so it keeps working the day the enum column goes.
--   NOT executable by anon (current_user_role() is, historically). anon holds no grant on any base table
--   below, only on public_* views, which run as the view's owner; so no policy here is ever evaluated for anon.
--   (A policy whose function the caller may not run errors, it does not evaluate to false: that is why this
--   was checked against the grants rather than assumed.)
--
-- GROUP 1, tables that already have _perm policies. has_permission() admits Admin, so admin_all_* is
--   redundant WHERE a _perm policy exists for the command and does not narrow the row. Checked per table and
--   per command on dev, not assumed (pg_policies, 2026-10-07). Three shapes:
--     covered   dropped outright: attachments, blood_test_types, bulk_appointments, contacts, diet_types,
--               enclosures, fixed_outgoings, frequency, immunization_types, maintenance, maintenance_assignees,
--               maintenance_photos, medication, procedure_types, project_folders, project_photos,
--               shelter_friends, translations, vets, zones; and the 2 volunteer_read_* (the volunteer holds
--               facility.enclosures Read, which enclosures_select_perm and zones_select_perm already ask).
--     no DELETE policy at all: blood_tests, immunization_records, placement_history, prescriptions, procedures,
--               resident_diets, residents, weight. Dropping admin_all_* would take Admin's delete away, so a
--               <table>_admin_delete policy on is_admin() replaces it. Nobody else could ever delete.
--     narrower than Admin was: assistant_actions (own rows only: Admin reads and edits every row, as the
--               §15 note for 0150 records), group_origins (select only: writes are Admin's, 0145), rounds
--               (select only, using true). Those keep exactly the commands the _perm side does not give.
-- GROUP 2, Admin-only tables with no cell: the policy is rewritten in place on is_admin(), same name, same
--   command, same roles. user_roles keeps its own fixed rule (§12 R6) and is NOT given an activity.
--   role_permissions, roles and user_roles keep their RESTRICTIVE *_requires_aal2 policies untouched: a write
--   still needs an admin AND aal2, and the audit_log trigger on role_permissions is not touched.
--
-- Behaviour is unchanged by design: no cell moves, so the parity numbers must not move either.

create or replace function public.is_admin()
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
       and r.key = 'admin'
  );
$$;
comment on function public.is_admin() is
  'True for the caller holding the Admin role: has_permission()''s first branch alone (§6 rule 1). Reads roles.key, not the app_role enum.';
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- Group 1, covered: drop.
drop policy if exists admin_all_attachments on attachments;
drop policy if exists admin_all_blood_test_types on blood_test_types;
drop policy if exists admin_all_bulk_appointments on bulk_appointments;
drop policy if exists admin_all_contacts on contacts;
drop policy if exists admin_all_diet_types on diet_types;
drop policy if exists admin_all_enclosures on enclosures;
drop policy if exists volunteer_read_enclosures on enclosures;
drop policy if exists admin_all_fixed_outgoings on fixed_outgoings;
drop policy if exists admin_all_frequency on frequency;
drop policy if exists admin_all_immunization_types on immunization_types;
drop policy if exists admin_all_maintenance on maintenance;
drop policy if exists admin_all_maintenance_assignees on maintenance_assignees;
drop policy if exists admin_all_maintenance_photos on maintenance_photos;
drop policy if exists admin_all_medication on medication;
drop policy if exists admin_all_procedure_types on procedure_types;
drop policy if exists admin_all_project_folders on project_folders;
drop policy if exists admin_all_project_photos on project_photos;
drop policy if exists admin_all_shelter_friends on shelter_friends;
drop policy if exists admin_all_translations on translations;
drop policy if exists admin_all_vets on vets;
drop policy if exists admin_all_zones on zones;
drop policy if exists volunteer_read_zones on zones;

-- Group 1, no DELETE policy anywhere: Admin's delete is kept, on is_admin().
drop policy if exists admin_all_blood_tests on blood_tests;
drop policy if exists blood_tests_admin_delete on blood_tests;
create policy blood_tests_admin_delete on blood_tests for delete to authenticated using ((select public.is_admin()));
drop policy if exists admin_all_immunization_records on immunization_records;
drop policy if exists immunization_records_admin_delete on immunization_records;
create policy immunization_records_admin_delete on immunization_records for delete to authenticated using ((select public.is_admin()));
drop policy if exists admin_all_placement_history on placement_history;
drop policy if exists placement_history_admin_delete on placement_history;
create policy placement_history_admin_delete on placement_history for delete to authenticated using ((select public.is_admin()));
drop policy if exists admin_all_prescriptions on prescriptions;
drop policy if exists prescriptions_admin_delete on prescriptions;
create policy prescriptions_admin_delete on prescriptions for delete to authenticated using ((select public.is_admin()));
drop policy if exists admin_all_procedures on procedures;
drop policy if exists procedures_admin_delete on procedures;
create policy procedures_admin_delete on procedures for delete to authenticated using ((select public.is_admin()));
drop policy if exists admin_all_resident_diets on resident_diets;
drop policy if exists resident_diets_admin_delete on resident_diets;
create policy resident_diets_admin_delete on resident_diets for delete to authenticated using ((select public.is_admin()));
drop policy if exists admin_all_residents on residents;
drop policy if exists residents_admin_delete on residents;
create policy residents_admin_delete on residents for delete to authenticated using ((select public.is_admin()));
drop policy if exists admin_all_weight on weight;
drop policy if exists weight_admin_delete on weight;
create policy weight_admin_delete on weight for delete to authenticated using ((select public.is_admin()));

-- Group 1, narrower than Admin was: keep exactly what the _perm policies do not give.
drop policy if exists admin_all_assistant_actions on assistant_actions;
drop policy if exists assistant_actions_admin_all on assistant_actions;
create policy assistant_actions_admin_all on assistant_actions for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists admin_all_group_origins on group_origins;
drop policy if exists group_origins_admin_insert on group_origins;
create policy group_origins_admin_insert on group_origins for insert to authenticated with check ((select public.is_admin()));
drop policy if exists group_origins_admin_update on group_origins;
create policy group_origins_admin_update on group_origins for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists group_origins_admin_delete on group_origins;
create policy group_origins_admin_delete on group_origins for delete to authenticated using ((select public.is_admin()));
drop policy if exists admin_all_rounds on rounds;
drop policy if exists rounds_admin_insert on rounds;
create policy rounds_admin_insert on rounds for insert to authenticated with check ((select public.is_admin()));
drop policy if exists rounds_admin_update on rounds;
create policy rounds_admin_update on rounds for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists rounds_admin_delete on rounds;
create policy rounds_admin_delete on rounds for delete to authenticated using ((select public.is_admin()));

-- Group 2, Admin-only: rewritten in place. alter policy keeps the name, the command and the roles.
alter policy admin_read_audit_log on audit_log using ((select public.is_admin()));
alter policy permission_activities_admin_read on permission_activities using ((select public.is_admin()));
alter policy role_permissions_admin_all on role_permissions
  using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy roles_admin_all on roles
  using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy admin_all_user_roles on user_roles using ((select public.is_admin()));
alter policy admin_update_site_content on site_content
  using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy admin_write_site_content_photos on site_content_photos
  using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy admin_update_site_pages on site_pages
  using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy admin_all_translatable_fields on translatable_fields using ((select public.is_admin()));
-- These three have no cell yet and the vet's own policies are untouched: perm-convert-vet converts the table.
alter policy admin_all_vet_appointments on vet_appointments using ((select public.is_admin()));
alter policy admin_all_vet_doctor_clinics on vet_doctor_clinics
  using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy admin_all_vet_doctors on vet_doctors
  using ((select public.is_admin())) with check ((select public.is_admin()));

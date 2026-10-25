-- consumer: src/lib/residents/who-and-where.ts, src/lib/contacts/visibility.ts, src/lib/clinics/scope.ts, scripts/dev-signin.mjs
--
-- THE LAST OF THE FOUR STEPS (Lutan, 2026-10-25): delete the inert leftovers of coded security. Every function dropped here answers a
-- constant, so this changes NO access; it removes the corpses so the registry and the database show nothing special.
--   * 60 doctor_* policies dropped (each granted only through is_clinic_login(), which is false), 48 card policies rewritten without the dead term.
--   * 10 views and 11 functions rewritten without the stubs. private.works_with_*() and has_app_access() are NOT touched.
--   * is_clinic_login, sees_all_clinical, sees_all_residents, on_volunteer_floor, sees_all_contacts, photos_medical_only,
--     may_open_resident_record dropped; roles.opens_app / scope_residents / scope_clinical / scope_contacts / scope_photos dropped.
-- Generated from the LIVE definitions on dev, not from earlier migrations (0224 rewrote guards in place).
-- Re-runnable: drop ... if exists / alter policy / create or replace.

-- 1. The doctor_* policies. Each granted only through is_clinic_login(), which answers false, so each grants nothing to anybody.
-- Dropped outright, not rewritten.
drop policy if exists "doctor_read_clinics" on public.clinics;
drop policy if exists "doctor_read_enclosures" on public.enclosures;
drop policy if exists "doctor_update_attachments" on public.attachments;
drop policy if exists "doctor_read_bulk_appointments" on public.bulk_appointments;
drop policy if exists "doctor_delete_attachments" on public.attachments;
drop policy if exists "doctor_insert_medication" on public.medication;
drop policy if exists "doctor_read_medication" on public.medication;
drop policy if exists "doctor_insert_frequency" on public.frequency;
drop policy if exists "doctor_read_translations" on public.translations;
drop policy if exists "doctor_read_frequency" on public.frequency;
drop policy if exists "doctor_rw_immunization_types" on public.immunization_types;
drop policy if exists "doctor_insert_procedures" on public.procedures;
drop policy if exists "doctor_insert_procedure_types" on public.procedure_types;
drop policy if exists "doctor_read_procedure_types" on public.procedure_types;
drop policy if exists "doctor_read_blood_test_types" on public.blood_test_types;
drop policy if exists "doctor_read_diet_types" on public.diet_types;
drop policy if exists "doctor_read_shelter_friends" on public.shelter_friends;
drop policy if exists "doctor_read_recurring_jobs" on public.recurring_jobs;
drop policy if exists "doctor_read_recurring_job_assignees" on public.recurring_job_assignees;
drop policy if exists "doctor_read_recurring_job_occurrences" on public.recurring_job_occurrences;
drop policy if exists "doctor_read_recurring_job_occurrence_assignees" on public.recurring_job_occurrence_assignees;
drop policy if exists "doctor_read_doctors" on public.doctors;
drop policy if exists "doctor_read_doctor_clinics" on public.doctor_clinics;
drop policy if exists "doctor_insert_doctors" on public.doctors;
drop policy if exists "doctor_insert_resident_diets" on public.resident_diets;
drop policy if exists "doctor_update_resident_diets" on public.resident_diets;
drop policy if exists "doctor_read_visit_reports" on public.attachments;
drop policy if exists "doctor_write_visit_reports" on public.attachments;
drop policy if exists "doctor_update_visit_reports" on public.attachments;
drop policy if exists "doctor_delete_visit_reports" on public.attachments;
drop policy if exists "doctor_read_zones" on public.zones;
drop policy if exists "doctor_delete_blood_tests" on public.blood_tests;
drop policy if exists "doctor_insert_blood_tests" on public.blood_tests;
drop policy if exists "doctor_update_blood_tests" on public.blood_tests;
drop policy if exists "doctor_write_bulk_appointments" on public.bulk_appointments;
drop policy if exists "doctor_rw_immunization_records" on public.immunization_records;
drop policy if exists "doctor_delete_doctor_clinics" on public.doctor_clinics;
drop policy if exists "doctor_insert_doctor_clinics" on public.doctor_clinics;
drop policy if exists "doctor_update_doctor_clinics" on public.doctor_clinics;
drop policy if exists "doctor_read_attachments" on public.attachments;
drop policy if exists "doctor_delete_clinic_visits" on public.clinic_visits;
drop policy if exists "doctor_insert_clinic_visits" on public.clinic_visits;
drop policy if exists "doctor_update_clinic_visits" on public.clinic_visits;
drop policy if exists "doctor_delete_procedures" on public.procedures;
drop policy if exists "doctor_update_procedures" on public.procedures;
drop policy if exists "doctor_rw_weight" on public.weight;
drop policy if exists "doctor_delete_prescriptions" on public.prescriptions;
drop policy if exists "doctor_insert_prescriptions" on public.prescriptions;
drop policy if exists "doctor_write_attachments" on public.attachments;
drop policy if exists "doctor_update_prescriptions" on public.prescriptions;
drop policy if exists "doctor_read_adoption_updates" on public.adoption_updates;
drop policy if exists "doctor_read_resident_diets" on public.resident_diets;
drop policy if exists "doctor_read_placement_history" on public.placement_history;
drop policy if exists "doctor_read_blood_tests" on public.blood_tests;
drop policy if exists "doctor_read_residents" on public.residents;
drop policy if exists "doctor_read_clinic_visits" on public.clinic_visits;
drop policy if exists "doctor_read_procedures" on public.procedures;
drop policy if exists "doctor_read_prescriptions" on public.prescriptions;
drop policy if exists "doctor_read_weight" on public.weight;
drop policy if exists "doctor_read_immunization_records" on public.immunization_records;

-- 2. The card policies that ANDed a stub that answers a constant. The card check stays; the dead term goes.
alter policy "clinic_visits_select_perm" on public.clinic_visits
  using ((( SELECT has_permission('medical.visits'::text, 'read'::text) AS has_permission)));
alter policy "clinic_visits_update_perm" on public.clinic_visits
  using ((( SELECT has_permission('medical.visits'::text) AS has_permission)))
  with check ((( SELECT has_permission('medical.visits'::text) AS has_permission)));
alter policy "frequency_select_perm" on public.frequency
  using (((( SELECT has_permission('medical.prescriptions'::text, 'read'::text) AS has_permission)) OR ( SELECT has_permission('reference.types'::text, 'read'::text) AS has_permission)));
alter policy "procedures_select_perm" on public.procedures
  using ((( SELECT has_permission('medical.procedures'::text, 'read'::text) AS has_permission)));
alter policy "procedures_insert_perm" on public.procedures
  with check ((( SELECT has_permission('medical.procedures'::text) AS has_permission)));
alter policy "procedures_update_perm" on public.procedures
  using ((( SELECT has_permission('medical.procedures'::text) AS has_permission)))
  with check ((( SELECT has_permission('medical.procedures'::text) AS has_permission)));
alter policy "blood_tests_select_perm" on public.blood_tests
  using ((( SELECT has_permission('medical.blood_tests'::text, 'read'::text) AS has_permission)));
alter policy "blood_tests_insert_perm" on public.blood_tests
  with check ((( SELECT has_permission('medical.blood_tests'::text) AS has_permission)));
alter policy "blood_tests_update_perm" on public.blood_tests
  using ((( SELECT has_permission('medical.blood_tests'::text) AS has_permission)))
  with check ((( SELECT has_permission('medical.blood_tests'::text) AS has_permission)));
alter policy "prescriptions_select_perm" on public.prescriptions
  using ((( SELECT has_permission('medical.prescriptions'::text, 'read'::text) AS has_permission)));
alter policy "prescriptions_insert_perm" on public.prescriptions
  with check ((( SELECT has_permission('medical.prescriptions'::text) AS has_permission)));
alter policy "prescriptions_update_perm" on public.prescriptions
  using ((( SELECT has_permission('medical.prescriptions'::text) AS has_permission)))
  with check ((( SELECT has_permission('medical.prescriptions'::text) AS has_permission)));
alter policy "immunization_records_select_perm" on public.immunization_records
  using ((( SELECT has_permission('medical.immunizations'::text, 'read'::text) AS has_permission)));
alter policy "immunization_records_insert_perm" on public.immunization_records
  with check ((( SELECT has_permission('medical.immunizations'::text) AS has_permission)));
alter policy "immunization_records_update_perm" on public.immunization_records
  using ((( SELECT has_permission('medical.immunizations'::text) AS has_permission)))
  with check ((( SELECT has_permission('medical.immunizations'::text) AS has_permission)));
alter policy "weight_select_perm" on public.weight
  using ((( SELECT has_permission('medical.weight'::text, 'read'::text) AS has_permission)));
alter policy "weight_insert_perm" on public.weight
  with check ((( SELECT has_permission('medical.weight'::text) AS has_permission)));
alter policy "weight_update_perm" on public.weight
  using ((( SELECT has_permission('medical.weight'::text) AS has_permission)))
  with check ((( SELECT has_permission('medical.weight'::text) AS has_permission)));
alter policy "resident_diets_select_perm" on public.resident_diets
  using ((( SELECT has_permission('medical.diet'::text, 'read'::text) AS has_permission)));
alter policy "resident_diets_insert_perm" on public.resident_diets
  with check ((( SELECT has_permission('medical.diet'::text) AS has_permission)));
alter policy "resident_diets_update_perm" on public.resident_diets
  using ((( SELECT has_permission('medical.diet'::text) AS has_permission)))
  with check ((( SELECT has_permission('medical.diet'::text) AS has_permission)));
alter policy "contacts_insert_perm" on public.contacts
  with check ((( SELECT has_permission('contacts.add'::text) AS has_permission)));
alter policy "contacts_update_perm" on public.contacts
  using ((( SELECT has_permission('contacts.directory'::text) AS has_permission)))
  with check ((( SELECT has_permission('contacts.directory'::text) AS has_permission)));
alter policy "contacts_delete_perm" on public.contacts
  using ((( SELECT has_permission('contacts.directory'::text) AS has_permission)));
alter policy "residents_insert_perm" on public.residents
  with check ((( SELECT has_permission('resident.register'::text) AS has_permission)));
alter policy "residents_update_perm" on public.residents
  using ((( SELECT has_permission('resident.record'::text) AS has_permission)))
  with check ((( SELECT has_permission('resident.record'::text) AS has_permission)));
alter policy "placement_history_insert_perm" on public.placement_history
  with check (((((placement_type = 'ChangeEnclosure'::placement_type) AND ( SELECT has_permission('placement.move'::text) AS has_permission)) OR ((placement_type = ANY (ARRAY['SendToHospital'::placement_type, 'ReturnFromHospital'::placement_type])) AND ( SELECT has_permission('placement.hospital'::text) AS has_permission)) OR ((placement_type = ANY (ARRAY['Foster'::placement_type, 'Adopt'::placement_type, 'ReturnToShelter'::placement_type])) AND ( SELECT has_permission('placement.rehome'::text) AS has_permission)) OR ((placement_type = 'Deceased'::placement_type) AND ( SELECT has_permission('placement.death'::text) AS has_permission)) OR ((placement_type = 'Intake'::placement_type) AND ( SELECT has_permission('resident.register'::text) AS has_permission)) OR ((placement_type = 'DeceasedInError'::placement_type) AND ( SELECT has_permission('placement.death_withdraw'::text) AS has_permission)))));
alter policy "placement_history_update_perm" on public.placement_history
  using ((( SELECT has_permission('resident.record'::text) AS has_permission)))
  with check ((( SELECT has_permission('resident.record'::text) AS has_permission)));
alter policy "adoption_updates_select_perm" on public.adoption_updates
  using ((( SELECT has_permission('resident.adoption_news'::text, 'read'::text) AS has_permission)));
alter policy "adoption_updates_insert_perm" on public.adoption_updates
  with check ((( SELECT has_permission('resident.adoption_news'::text) AS has_permission)));
alter policy "adoption_updates_update_perm" on public.adoption_updates
  using ((( SELECT has_permission('resident.adoption_news'::text) AS has_permission)))
  with check ((( SELECT has_permission('resident.adoption_news'::text) AS has_permission)));
alter policy "adoption_updates_delete_perm" on public.adoption_updates
  using ((( SELECT has_permission('resident.adoption_news'::text) AS has_permission)));
alter policy "contacts_select_perm" on public.contacts
  using ((( SELECT has_permission('contacts.browse'::text) AS has_permission)));
alter policy "clinic_visits_insert_perm" on public.clinic_visits
  with check ((( SELECT has_permission('visit.book'::text) AS has_permission)));
alter policy "residents_select_perm" on public.residents
  using ((( SELECT has_permission('resident.record'::text, 'read'::text) AS has_permission)));
alter policy "placement_history_select_perm" on public.placement_history
  using ((( SELECT has_permission('resident.record'::text, 'read'::text) AS has_permission)));
alter policy "social_shares_select_perm" on public.social_shares
  using (CASE owner_type
    WHEN 'attachment'::text THEN (( SELECT has_permission('resident.record'::text, 'read'::text) AS has_permission))
    WHEN 'meme'::text THEN ( SELECT has_permission('social.library'::text, 'read'::text) AS has_permission)
    ELSE false
END);
alter policy "social_shares_insert_perm" on public.social_shares
  with check (CASE owner_type
    WHEN 'attachment'::text THEN (( SELECT has_permission('photos.resident_manage'::text) AS has_permission))
    WHEN 'meme'::text THEN ( SELECT has_permission('social.library'::text) AS has_permission)
    ELSE false
END);
alter policy "social_shares_update_perm" on public.social_shares
  using (CASE owner_type
    WHEN 'attachment'::text THEN (( SELECT has_permission('photos.resident_manage'::text) AS has_permission))
    WHEN 'meme'::text THEN ( SELECT has_permission('social.library'::text) AS has_permission)
    ELSE false
END)
  with check (CASE owner_type
    WHEN 'attachment'::text THEN (( SELECT has_permission('photos.resident_manage'::text) AS has_permission))
    WHEN 'meme'::text THEN ( SELECT has_permission('social.library'::text) AS has_permission)
    ELSE false
END);
alter policy "social_shares_delete_perm" on public.social_shares
  using (CASE owner_type
    WHEN 'attachment'::text THEN (( SELECT has_permission('photos.resident_manage'::text) AS has_permission))
    WHEN 'meme'::text THEN ( SELECT has_permission('social.library'::text) AS has_permission)
    ELSE false
END);
alter policy "bulk_appointments_select_perm" on public.bulk_appointments
  using ((( SELECT has_permission('visit.book'::text) AS has_permission)));
alter policy "bulk_appointments_insert_perm" on public.bulk_appointments
  with check ((( SELECT has_permission('visit.book'::text) AS has_permission)));
alter policy "bulk_appointments_update_perm" on public.bulk_appointments
  using ((( SELECT has_permission('visit.book'::text) AS has_permission)))
  with check ((( SELECT has_permission('visit.book'::text) AS has_permission)));
alter policy "bulk_appointments_delete_perm" on public.bulk_appointments
  using ((( SELECT has_permission('visit.book'::text) AS has_permission)));
alter policy "attachments_select_perm" on public.attachments
  using (CASE owner_type
    WHEN 'resident'::attachment_owner_type THEN (( SELECT has_permission('resident.record'::text, 'read'::text) AS has_permission))
    WHEN 'blood_test'::attachment_owner_type THEN (( SELECT has_permission('medical.blood_tests'::text, 'read'::text) AS has_permission))
    WHEN 'procedure'::attachment_owner_type THEN (( SELECT has_permission('medical.procedures'::text, 'read'::text) AS has_permission))
    WHEN 'maintenance'::attachment_owner_type THEN ( SELECT has_permission('maintenance.photos'::text) AS has_permission)
    WHEN 'project'::attachment_owner_type THEN ( SELECT has_permission('projects.photos'::text) AS has_permission)
    WHEN 'clinic_visit'::attachment_owner_type THEN (( SELECT bill_owner_can(attachments.owner_type, false) AS bill_owner_can))
    ELSE ( SELECT bill_owner_can(attachments.owner_type, false) AS bill_owner_can)
END);
alter policy "attachments_insert_perm" on public.attachments
  with check (CASE owner_type
    WHEN 'resident'::attachment_owner_type THEN (( SELECT has_permission('photos.resident_add'::text) AS has_permission))
    WHEN 'blood_test'::attachment_owner_type THEN (( SELECT has_permission('medical.blood_tests'::text) AS has_permission))
    WHEN 'procedure'::attachment_owner_type THEN (( SELECT has_permission('medical.procedures'::text) AS has_permission))
    WHEN 'maintenance'::attachment_owner_type THEN ( SELECT has_permission('maintenance.photos'::text) AS has_permission)
    WHEN 'project'::attachment_owner_type THEN ( SELECT has_permission('projects.photos'::text) AS has_permission)
    WHEN 'clinic_visit'::attachment_owner_type THEN (( SELECT bill_owner_can(attachments.owner_type, true) AS bill_owner_can))
    ELSE ( SELECT bill_owner_can(attachments.owner_type, true) AS bill_owner_can)
END);
alter policy "attachments_update_perm" on public.attachments
  using (CASE owner_type
    WHEN 'resident'::attachment_owner_type THEN (( SELECT has_permission('photos.resident_manage'::text) AS has_permission))
    WHEN 'blood_test'::attachment_owner_type THEN (( SELECT has_permission('medical.blood_tests'::text) AS has_permission))
    WHEN 'procedure'::attachment_owner_type THEN (( SELECT has_permission('medical.procedures'::text) AS has_permission))
    WHEN 'maintenance'::attachment_owner_type THEN ( SELECT has_permission('maintenance.photos'::text) AS has_permission)
    WHEN 'project'::attachment_owner_type THEN ( SELECT has_permission('projects.photos'::text) AS has_permission)
    WHEN 'clinic_visit'::attachment_owner_type THEN (( SELECT bill_owner_can(attachments.owner_type, true) AS bill_owner_can))
    ELSE ( SELECT bill_owner_can(attachments.owner_type, true) AS bill_owner_can)
END)
  with check (CASE owner_type
    WHEN 'resident'::attachment_owner_type THEN (( SELECT has_permission('photos.resident_manage'::text) AS has_permission))
    WHEN 'blood_test'::attachment_owner_type THEN (( SELECT has_permission('medical.blood_tests'::text) AS has_permission))
    WHEN 'procedure'::attachment_owner_type THEN (( SELECT has_permission('medical.procedures'::text) AS has_permission))
    WHEN 'maintenance'::attachment_owner_type THEN ( SELECT has_permission('maintenance.photos'::text) AS has_permission)
    WHEN 'project'::attachment_owner_type THEN ( SELECT has_permission('projects.photos'::text) AS has_permission)
    WHEN 'clinic_visit'::attachment_owner_type THEN (( SELECT bill_owner_can(attachments.owner_type, true) AS bill_owner_can))
    ELSE ( SELECT bill_owner_can(attachments.owner_type, true) AS bill_owner_can)
END);
alter policy "attachments_delete_perm" on public.attachments
  using (CASE owner_type
    WHEN 'resident'::attachment_owner_type THEN (( SELECT has_permission('photos.resident_manage'::text) AS has_permission))
    WHEN 'blood_test'::attachment_owner_type THEN (( SELECT has_permission('medical.blood_tests'::text) AS has_permission))
    WHEN 'procedure'::attachment_owner_type THEN (( SELECT has_permission('medical.procedures'::text) AS has_permission))
    WHEN 'maintenance'::attachment_owner_type THEN ( SELECT has_permission('maintenance.photos'::text) AS has_permission)
    WHEN 'project'::attachment_owner_type THEN ( SELECT has_permission('projects.photos'::text) AS has_permission)
    WHEN 'clinic_visit'::attachment_owner_type THEN (( SELECT bill_owner_can(attachments.owner_type, true) AS bill_owner_can))
    ELSE ( SELECT bill_owner_can(attachments.owner_type, true) AS bill_owner_can)
END);

-- 3. Views. Same columns, so grants carry over. The stub terms go; the works_with_* / card gate beside them stays.
create or replace view private.app_users as
SELECT u.id,
    (u.email)::character varying(255) AS email,
    COALESCE(NULLIF((u.raw_user_meta_data ->> 'full_name'::text), ''::text), NULLIF((u.raw_user_meta_data ->> 'name'::text), ''::text)) AS display_name,
    r.archived_at,
    rl.key AS role_key
   FROM ((auth.users u
     JOIN user_roles r ON (((r.user_id = u.id) AND r.is_main)))
     JOIN roles rl ON ((rl.id = r.role_id)))
  WHERE ((EXISTS ( SELECT 1
           FROM user_roles me
          WHERE ((me.user_id = ( SELECT auth.uid() AS uid)) AND (me.archived_at IS NULL)))));

create or replace view public.medication_list_medications as
SELECT id,
    name,
    dose_unit,
    label_drive_file_id,
    name_th
   FROM medication m
  WHERE (( SELECT has_permission('medical.prescriptions'::text, 'read'::text) AS has_permission));
grant select on public.medication_list_medications to authenticated, service_role;

create or replace view public.translation_queue as
SELECT id,
    table_name,
    row_id,
    column_name,
    tier,
    source_lang,
    target_lang,
    source_text,
    reviewed_source_text,
    text,
    status,
    engine,
    reviewed_by,
    reviewed_at,
    created_at,
    updated_at,
    record_label,
    record_path
   FROM private.translation_queue
  WHERE (private.has_app_access() AND ( SELECT private.works_with_translations() AS works_with_translations));
grant select on public.translation_queue to authenticated, service_role;

create or replace view public.immunization_duplicate_check as
SELECT resident_id,
    immunization_type_id,
    date_administered,
    count
   FROM private.immunization_duplicate_check
  WHERE (private.has_app_access() AND ( SELECT private.works_with_immunizations() AS works_with_immunizations));
grant select on public.immunization_duplicate_check to authenticated, service_role;

create or replace view public.medication_list_residents as
SELECT r.id,
    r.name,
    r.thai_name,
    r.profile_photo_drive_file_id,
    s.current_status,
    e.id AS enclosure_id,
    e.name AS enclosure_name,
    e.name_th AS enclosure_name_th,
    z.name AS zone_name,
    z.name_th AS zone_name_th,
    z.colour AS zone_colour
   FROM (((residents r
     LEFT JOIN private.resident_current_state s ON ((s.resident_id = r.id)))
     LEFT JOIN enclosures e ON ((e.id = s.current_enclosure_id)))
     LEFT JOIN zones z ON ((z.id = e.zone_id)))
  WHERE (( SELECT has_permission('medical.prescriptions'::text, 'read'::text) AS has_permission));
grant select on public.medication_list_residents to authenticated, service_role;

create or replace view public.medical_photo_residents as
SELECT r.id,
    r.name,
    r.thai_name,
    r.resident_code,
    r.drive_folder_id,
    COALESCE(s.is_deceased, false) AS is_deceased
   FROM (residents r
     LEFT JOIN private.resident_current_state s ON ((s.resident_id = r.id)))
  WHERE (( SELECT has_permission('photos.resident_add'::text) AS has_permission));
grant select on public.medical_photo_residents to authenticated, service_role;

create or replace view public.special_diet_list as
SELECT rd.id AS resident_diet_id,
    r.id AS resident_id,
    r.name,
    r.thai_name,
    r.profile_photo_drive_file_id,
    s.current_status,
    e.id AS enclosure_id,
    e.name AS enclosure_name,
    e.name_th AS enclosure_name_th,
    z.name AS zone_name,
    z.name_th AS zone_name_th,
    t.id AS diet_type_id,
    dd.name AS diet_name,
    COALESCE(NULLIF(btrim(di.serving_unit), ''::text), t.unit) AS diet_unit,
    rd.meals_per_day,
    ((di.qty_per_serving *
        CASE COALESCE(r.size, 'Medium'::resident_size)
            WHEN 'Small'::resident_size THEN dd.servings_small
            WHEN 'Large'::resident_size THEN dd.servings_large
            ELSE dd.servings_medium
        END) * COALESCE(rd.portion_factor, (1)::numeric)) AS daily_quantity,
    rd.notes,
    COALESCE(( SELECT array_agg(ro.key ORDER BY ro.sort_order) AS array_agg
           FROM (resident_diet_rounds x
             JOIN rounds ro ON ((ro.id = x.round_id)))
          WHERE (x.resident_diet_id = rd.id)), ARRAY[]::text[]) AS round_keys,
    z.colour AS zone_colour,
    dd.name_th AS diet_name_th,
    dd.id AS diet_id,
    t.name AS ingredient_name,
    t.name_th AS ingredient_name_th
   FROM (((((((resident_diets rd
     JOIN diets dd ON ((dd.id = rd.diet_id)))
     JOIN diet_ingredients di ON ((di.diet_id = dd.id)))
     JOIN diet_types t ON ((t.id = di.diet_type_id)))
     JOIN residents r ON ((r.id = rd.resident_id)))
     LEFT JOIN private.resident_current_state s ON ((s.resident_id = r.id)))
     LEFT JOIN enclosures e ON ((e.id = s.current_enclosure_id)))
     LEFT JOIN zones z ON ((z.id = e.zone_id)))
  WHERE ((dd.is_standard = false) AND (rd.start_date <= shelter_today()) AND ((rd.end_date IS NULL) OR (rd.end_date >= shelter_today())) AND ( SELECT has_permission('medical.diet'::text, 'read'::text) AS has_permission));
grant select on public.special_diet_list to authenticated, service_role;

create or replace view public.current_placement as
SELECT id,
    resident_id,
    placement_type,
    start_date,
    end_date,
    zone_id,
    enclosure_id,
    previous_enclosure_id,
    carer_id,
    notes,
    created_by,
    created_at
   FROM private.current_placement
  WHERE (private.has_app_access() AND ( SELECT private.works_with_residents() AS works_with_residents));
grant select on public.current_placement to authenticated, service_role;

create or replace view public.immunization_compliance as
SELECT resident_id,
    resident_name,
    immunization_type_id,
    immunization_type_name
   FROM private.immunization_compliance
  WHERE (private.has_app_access() AND ( SELECT private.works_with_immunizations() AS works_with_immunizations));
grant select on public.immunization_compliance to authenticated, service_role;

create or replace view public.resident_current_state as
SELECT resident_id,
    name,
    current_placement_id,
    current_enclosure_id,
    current_zone_id,
    current_carer_id,
    active_hospital_previous_enclosure,
    current_status,
    is_deceased,
    date_of_death
   FROM private.resident_current_state
  WHERE (private.has_app_access() AND ( SELECT private.works_with_residents() AS works_with_residents));
grant select on public.resident_current_state to authenticated, service_role;

-- 4. Functions that read a stub.
CREATE OR REPLACE FUNCTION public.can_file_pending_photo()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select coalesce((select can_publish_resident_photos()), false)
      or coalesce((select has_permission('photos.shelter_add')), false);
$function$;

CREATE OR REPLACE FUNCTION public.can_approve_photos()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select coalesce((select public.has_permission('photos.approve')), false);
$function$;

CREATE OR REPLACE FUNCTION public.can_publish_resident_photos()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select coalesce((select public.has_permission('photos.resident_publish')), false);
$function$;

CREATE OR REPLACE FUNCTION public.set_resident_microchip(p_resident_id uuid, p_number text, p_implanted_on date DEFAULT NULL::date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not (select has_permission('resident.microchip')) then
    raise exception 'Not authorized to set a microchip.'
      using errcode = 'insufficient_privilege';
  end if;

  if not exists (select 1 from residents where id = p_resident_id) then
    raise exception 'Resident not found.' using errcode = 'no_data_found';
  end if;

  if resident_is_deceased(p_resident_id) then
    raise exception 'This resident is deceased — their record is read-only.'
      using errcode = 'restrict_violation';
  end if;

  update residents
     set microchip_number = p_number,
         microchip_implanted_on = p_implanted_on
   where id = p_resident_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.delete_resident_photo(p_attachment_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_owner_id uuid;
  v_drive_file_id text;
  v_was_profile boolean;
  v_fallback text;
begin
  if not coalesce((select has_permission('photos.resident_manage')), false) then
    raise exception 'Not authorized to remove attachments.';
  end if;

  select owner_id, drive_file_id into v_owner_id, v_drive_file_id
  from attachments
  where id = p_attachment_id and owner_type = 'resident';

  if v_owner_id is null then
    raise exception 'Photo not found.';
  end if;

  select (profile_photo_drive_file_id = v_drive_file_id) into v_was_profile
  from residents where id = v_owner_id;

  delete from attachments where id = p_attachment_id;

  if v_was_profile then
    select drive_file_id into v_fallback
    from attachments
    where owner_type = 'resident' and owner_id = v_owner_id
    order by uploaded_at asc
    limit 1;

    update residents set profile_photo_drive_file_id = v_fallback where id = v_owner_id;
  end if;

  return v_drive_file_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_resident_profile_photo(p_resident_id uuid, p_drive_file_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not coalesce((select has_permission('photos.resident_manage')), false) then
    raise exception 'Not authorized to set the profile photo.';
  end if;

  -- Require an existing attachment row for this resident/file, so an
  -- arbitrary Drive file ID can't be set as the profile photo.
  if not exists (
    select 1 from attachments
    where owner_type = 'resident'
      and owner_id = p_resident_id
      and drive_file_id = p_drive_file_id
  ) then
    raise exception 'That photo does not belong to this resident.';
  end if;

  update residents
  set profile_photo_drive_file_id = p_drive_file_id
  where id = p_resident_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_resident_drive_folder(p_resident_id uuid, p_folder_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not coalesce((select has_permission('photos.resident_add')), false) then
    raise exception 'Not authorized to add photos.';
  end if;
  update residents
     set drive_folder_id = p_folder_id
   where id = p_resident_id and drive_folder_id is null;
end;
$function$;

CREATE OR REPLACE FUNCTION public.merge_doctors(p_from uuid, p_into uuid)
 RETURNS doctors
 LANGUAGE plpgsql
AS $function$
declare
  v_from doctors;
  v_into doctors;
  v_bypass text := coalesce(current_setting('app.deceased_lock_bypass', true), '');
begin
  if not coalesce((select has_permission('clinics.doctors')), false) then
    raise exception 'Not allowed to merge doctors.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_from from doctors where id = p_from;
  select * into v_into from doctors where id = p_into;
  if v_from.id is null or v_into.id is null then
    raise exception 'Doctor not found.' using errcode = 'no_data_found';
  end if;
  if v_from.id = v_into.id then
    return v_into;
  end if;
  if v_from.user_id is not null and v_into.user_id is not null then
    raise exception 'Both doctors have a login; they cannot be merged.' using errcode = 'check_violation';
  end if;
  if (v_from.user_id is not null or v_into.user_id is not null)
     and not coalesce((select is_admin()), false) then
    raise exception 'Only an admin can merge a doctor who has a login.' using errcode = 'insufficient_privilege';
  end if;

  -- Two rows for one person usually share a name, and p_into's link at a clinic p_from also works at would
  -- then clash with p_from's own on (clinic_id, name_key). p_from's links go in a placeholder key first; they
  -- are deleted with p_from below.
  update doctor_clinics set name_key = 'merging ' || p_from where doctor_id = p_from;

  insert into doctor_clinics (clinic_id, doctor_id, active)
    select c.clinic_id, p_into, c.active from doctor_clinics c where c.doctor_id = p_from
    on conflict (clinic_id, doctor_id) do nothing;

  perform set_config('app.deceased_lock_bypass', 'on', true);
  update clinic_visits set doctor_id = p_into where doctor_id = p_from;
  perform set_config('app.deceased_lock_bypass', v_bypass, true);

  if v_from.user_id is not null then
    update doctors set user_id = null where id = p_from;
    update doctors set user_id = v_from.user_id where id = p_into;
  end if;

  delete from doctors where id = p_from;
  -- 0147: a delete the policy filters out is not an error, so without this a caller who may book a visit but not
  -- remove a doctor (visit.book lets them add one) would leave a half-merge. Raising rolls the whole merge back.
  if not found then
    raise exception 'Not allowed to merge doctors.' using errcode = 'insufficient_privilege';
  end if;
  select * into v_into from doctors where id = p_into;
  return v_into;
end;
$function$;

CREATE OR REPLACE FUNCTION public.current_doctor_resident_ids()
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select current_clinic_resident_ids();
$function$;

CREATE OR REPLACE FUNCTION public.current_user_clinic_ids()
 RETURNS uuid[]
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select '{}'::uuid[];
$function$;

CREATE OR REPLACE FUNCTION public.clinic_login_may_edit_doctor(p_doctor uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  select false;
$function$;

-- 5. The seven stubs. Nothing may reference them from here on (no cascade: a miss fails the file).
drop function if exists public.is_clinic_login();
drop function if exists public.sees_all_clinical();
drop function if exists public.sees_all_residents();
drop function if exists public.on_volunteer_floor();
drop function if exists public.sees_all_contacts();
drop function if exists public.photos_medical_only();
drop function if exists public.may_open_resident_record();

-- 6. The five dead columns on roles. Nothing reads them for access (check-no-role-column-security, test and production).
alter table public.roles
  drop column if exists opens_app,
  drop column if exists scope_residents,
  drop column if exists scope_clinical,
  drop column if exists scope_contacts,
  drop column if exists scope_photos;

-- consumer: none
-- Closes a live permission gap: a doctor login could write outside its own clinic. Policies only; no app code reads anything new.
--
-- 0230 gave the doctor role visit.book and medical.visits (level 2). Two policy families ask only for the permission, with no
-- clinic scope, so they OR with (and override) the clinic-scoped doctor policies:
--   1. bulk_appointments_{select,insert,update,delete}_perm (0147) asked only visit.book.
--   2. attachments_{select,insert,update,delete}_perm (0189) sent clinic_visit owners to bill_owner_can(), which asks only
--      medical.visits, so every attachment on every clinic visit (bills included) was reachable.
-- Fix, in the shape 0182 gave clinic_visits_insert_perm: add sees_all_clinical() (Admin, Management, Head of Medical hold it; a
-- doctor does not). A doctor's own-clinic access is untouched: it comes from the clinic-scoped doctor policies, and for visit
-- attachments from doctor_*_visit_reports (0220), which admit reports at own-clinic visits only, never bills.
--
-- bill_owner_can() is deliberately NOT changed: record_attachment() (0190/0217/0220), src/lib/bills/upload.ts and bills inbox
-- callers mirror it, and the clinic_visit branch there is already bounded for clinic logins by record_attachment itself. The
-- narrower edit is the clinic_visit arm of the four attachments policies.
-- Re-runnable. To undo: restore the 0147 bulk policies and the 0189 attachments policies.

drop policy if exists bulk_appointments_select_perm on bulk_appointments;
create policy bulk_appointments_select_perm on bulk_appointments for select to authenticated
  using ((select has_permission('visit.book')) and (select sees_all_clinical()));
drop policy if exists bulk_appointments_insert_perm on bulk_appointments;
create policy bulk_appointments_insert_perm on bulk_appointments for insert to authenticated
  with check ((select has_permission('visit.book')) and (select sees_all_clinical()));
drop policy if exists bulk_appointments_update_perm on bulk_appointments;
create policy bulk_appointments_update_perm on bulk_appointments for update to authenticated
  using ((select has_permission('visit.book')) and (select sees_all_clinical()))
  with check ((select has_permission('visit.book')) and (select sees_all_clinical()));
drop policy if exists bulk_appointments_delete_perm on bulk_appointments;
create policy bulk_appointments_delete_perm on bulk_appointments for delete to authenticated
  using ((select has_permission('visit.book')) and (select sees_all_clinical()));

drop policy if exists attachments_select_perm on attachments;
-- scope-fn: deliberate — the clinic_visit arm ANDs bill_owner_can() (medical.visits via has_permission) with sees_all_clinical(); every other arm is unchanged from 0189.
create policy attachments_select_perm on attachments for select to authenticated
  using (
    case owner_type
      when 'resident' then (select has_permission('resident.record', 'read')) and (select sees_all_residents())
      when 'blood_test' then (select has_permission('medical.blood_tests', 'read')) and (select sees_all_clinical())
      when 'procedure' then (select has_permission('medical.procedures', 'read')) and (select sees_all_clinical())
      when 'maintenance' then (select has_permission('maintenance.photos'))
      when 'project' then (select has_permission('projects.photos'))
      when 'clinic_visit' then (select bill_owner_can(owner_type, false)) and (select sees_all_clinical())
      else (select bill_owner_can(owner_type, false))
    end
  );

drop policy if exists attachments_insert_perm on attachments;
-- scope-fn: deliberate — the clinic_visit arm ANDs bill_owner_can() (medical.visits via has_permission) with sees_all_clinical(); every other arm is unchanged from 0189.
create policy attachments_insert_perm on attachments for insert to authenticated
  with check (
    case owner_type
      when 'resident' then (select has_permission('photos.resident_add')) and (select sees_all_residents())
      when 'blood_test' then (select has_permission('medical.blood_tests')) and (select sees_all_clinical())
      when 'procedure' then (select has_permission('medical.procedures')) and (select sees_all_clinical())
      when 'maintenance' then (select has_permission('maintenance.photos'))
      when 'project' then (select has_permission('projects.photos'))
      when 'clinic_visit' then (select bill_owner_can(owner_type, true)) and (select sees_all_clinical())
      else (select bill_owner_can(owner_type, true))
    end
  );

drop policy if exists attachments_update_perm on attachments;
-- scope-fn: deliberate — the clinic_visit arm ANDs bill_owner_can() (medical.visits via has_permission) with sees_all_clinical(); every other arm is unchanged from 0189.
create policy attachments_update_perm on attachments for update to authenticated
  using (
    case owner_type
      when 'resident' then (select has_permission('photos.resident_manage')) and (select sees_all_residents())
      when 'blood_test' then (select has_permission('medical.blood_tests')) and (select sees_all_clinical())
      when 'procedure' then (select has_permission('medical.procedures')) and (select sees_all_clinical())
      when 'maintenance' then (select has_permission('maintenance.photos'))
      when 'project' then (select has_permission('projects.photos'))
      when 'clinic_visit' then (select bill_owner_can(owner_type, true)) and (select sees_all_clinical())
      else (select bill_owner_can(owner_type, true))
    end
  )
  with check (
    case owner_type
      when 'resident' then (select has_permission('photos.resident_manage')) and (select sees_all_residents())
      when 'blood_test' then (select has_permission('medical.blood_tests')) and (select sees_all_clinical())
      when 'procedure' then (select has_permission('medical.procedures')) and (select sees_all_clinical())
      when 'maintenance' then (select has_permission('maintenance.photos'))
      when 'project' then (select has_permission('projects.photos'))
      when 'clinic_visit' then (select bill_owner_can(owner_type, true)) and (select sees_all_clinical())
      else (select bill_owner_can(owner_type, true))
    end
  );

drop policy if exists attachments_delete_perm on attachments;
-- scope-fn: deliberate — the clinic_visit arm ANDs bill_owner_can() (medical.visits via has_permission) with sees_all_clinical(); every other arm is unchanged from 0189.
create policy attachments_delete_perm on attachments for delete to authenticated
  using (
    case owner_type
      when 'resident' then (select has_permission('photos.resident_manage')) and (select sees_all_residents())
      when 'blood_test' then (select has_permission('medical.blood_tests')) and (select sees_all_clinical())
      when 'procedure' then (select has_permission('medical.procedures')) and (select sees_all_clinical())
      when 'maintenance' then (select has_permission('maintenance.photos'))
      when 'project' then (select has_permission('projects.photos'))
      when 'clinic_visit' then (select bill_owner_can(owner_type, true)) and (select sees_all_clinical())
      else (select bill_owner_can(owner_type, true))
    end
  );

notify pgrst, 'reload schema';

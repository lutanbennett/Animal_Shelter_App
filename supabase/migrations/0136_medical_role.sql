-- consumer: src/lib/medication-list/load.ts, src/lib/permissions/jobs.ts, src/lib/home/tiles.ts
--
-- R2, the first configured role (docs/roles-and-permissions.md §12; decisions/
-- 2026-10-04-medical-role.md): the Head of Medical. A row in `roles`, never an enum
-- value (decisions/2026-10-03-configured-roles-not-enum-values.md).
--
-- THE JOB, EXPANDED. "Administer Medication" (src/lib/permissions/jobs.ts) is
--   medical.prescriptions  read     what to give, how much, how often
--   resident.record        read     who and where (the volunteer's who-and-where, 0134)
-- and those two cells are the role's whole set. The role writes nothing.
--
-- WHAT THE MEDICATION LIST NEEDS BEYOND THE CELLS. §12 said "a read policy on
-- prescriptions and the names it needs from medication and frequency". Reading the
-- live policies found that is not enough, and why:
--   prescriptions  already answers has_permission('medical.prescriptions','read') (0135).
--   frequency      no sensitive column: a read policy, as §12 said.
--   medication     carries cost_per_unit and stock_on_hand. A policy hides a row, not a
--                  column, so a read policy would hand this role the price list (the C9
--                  leak that 0134 closed for the volunteer). A view with a fixed column
--                  list instead, gated on the cell.
--   residents      no policy for a volunteer-based role, and resident_list_view is
--                  security_invoker over it. The list's join to residents would be empty.
--                  A view with a fixed column list, gated on the cell (0126 / 0134 pattern).
-- Both views are gated on has_permission() AND sees_all_clinical(), so they follow the
-- cell and the scope and never name a role, and a vet (own clinic) still reads only its
-- own clinic's residents through the vet_* policies.
--
-- legacy_role is 'volunteer': the narrowest enum value, and the one whose database
-- rights 0134 already reduced to who-and-where and enclosures. The bridge goes with the enum.
--
-- Written to be safely re-runnable. To undo: drop the two views and the policy, delete
-- the role's two role_permissions rows and the role row.

-- ---------------------------------------------------------------------------
-- 1. The role and its cells
-- ---------------------------------------------------------------------------
insert into roles (key, name, name_th, kind, opens_app, home_path, legacy_role,
                   scope_residents, scope_clinical, scope_contacts, scope_photos, sees_login_emails)
values ('head_of_medical', 'Head of Medical', 'หัวหน้าฝ่ายการแพทย์', 'custom', true, '/home', 'volunteer',
        'all', 'any', 'name_type', 'medical_only', false)
on conflict (key) do nothing;

insert into role_permissions (role_id, activity, level)
select r.id, c.activity, 1
  from roles r
  cross join (values ('medical.prescriptions'), ('resident.record')) as c(activity)
 where r.key = 'head_of_medical'
on conflict (role_id, activity) do nothing;

-- ---------------------------------------------------------------------------
-- 2. frequency: a read policy on the cell
-- ---------------------------------------------------------------------------
drop policy if exists frequency_select_perm on frequency;
create policy frequency_select_perm on frequency for select to authenticated
  using ((select has_permission('medical.prescriptions', 'read')) and (select sees_all_clinical()));

-- ---------------------------------------------------------------------------
-- 3. The two views the medication list reads
-- ---------------------------------------------------------------------------
-- Medicine: name, unit and label photo. Not cost, stock, reorder or safety stock.
create or replace view medication_list_medications as
select m.id, m.name, m.dose_unit, m.label_drive_file_id
  from medication m
 where (select has_permission('medical.prescriptions', 'read')) and (select sees_all_clinical());

-- Resident: who and where, the same columns the volunteer's view carries and no more.
create or replace view medication_list_residents as
select r.id,
       r.name,
       r.thai_name,
       r.profile_photo_drive_file_id,
       s.current_status,
       e.id as enclosure_id,
       e.name as enclosure_name,
       e.name_th as enclosure_name_th,
       z.name as zone_name,
       z.name_th as zone_name_th
  from residents r
  left join private.resident_current_state s on s.resident_id = r.id
  left join enclosures e on e.id = s.current_enclosure_id
  left join zones z on z.id = e.zone_id
 where (select has_permission('medical.prescriptions', 'read')) and (select sees_all_clinical());

comment on view medication_list_medications is
  'What the medication list reads of a medicine (0136): name, unit, label photo. Rows for a login holding medical.prescriptions Read. A new medication column is private until it is added here.';
comment on view medication_list_residents is
  'What the medication list reads of a resident (0136): who and where, no detail. Rows for a login holding medical.prescriptions Read. A new residents column is private until it is added here.';

revoke all on medication_list_medications, medication_list_residents from anon, authenticated, service_role;
grant select on medication_list_medications, medication_list_residents to authenticated, service_role;

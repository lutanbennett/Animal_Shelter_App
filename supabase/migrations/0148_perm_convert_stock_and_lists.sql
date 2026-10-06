-- consumer: none
--
-- R5's fifth conversion (docs/roles-and-permissions.md §12, §15; decisions/
-- 2026-10-06-perm-convert-stock-and-lists.md): the six lookup tables stop asking WHO the caller is and
-- start asking WHAT the caller may do. Same shape as 0135 / 0144 / 0145 / 0147: one policy per command,
-- `(select has_permission(…))` so Postgres plans it once per statement, no role named. No app code reads
-- anything new, so nothing is ordered against a deploy.
--
--   medication          read   stock.medications Read, or reference.add_while_recording
--                       insert stock.medications Edit, or reference.add_while_recording (A1)
--                       update, delete   stock.medications Edit
--   diet_types          read   stock.diets Read, or resident.register (the intake form's picker)
--                       insert, update, delete   stock.diets Edit
--   frequency           read   medical.prescriptions Read and sees_all_clinical() (0136's policy, kept), or reference.types Read
--                       insert reference.add_while_recording (A1), or reference.types Edit
--                       update, delete   reference.types Edit
--   procedure_types     read   medical.procedures Read, reference.types Read, or reference.add_while_recording
--                       insert reference.add_while_recording (A1), or reference.types Edit
--                       update, delete   reference.types Edit
--   blood_test_types    read   medical.blood_tests Read or reference.types Read
--                       insert, update, delete   reference.types Edit
--   immunization_types  read   medical.immunizations Read or reference.types Read
--                       insert, update, delete   reference.types Edit
--
-- WHY THE READS ARE NOT ONE CELL. These are lookups, and a lookup is not an activity (§9 rule 4): the
-- medication picker on a prescription form has to read names, and the cell that lets someone write a
-- prescription is not the cell that lets them see what the medicine costs. Each read therefore asks the
-- cell the SCREEN that needs it already asks, and the cells were chosen so that today's logins (management
-- and staff, the only two roles these policies named) read exactly what they read, and no role the
-- Director's draft built on the volunteer floor gains a read:
--   - medication and diet_types carry prices (cost_per_unit; daily quantities). The 2IC holds
--     medical.prescriptions and medical.diet (draft), the Head of Medical medical.prescriptions Read; asking
--     those would hand each a price list through a table read. reference.add_while_recording and
--     resident.register are held by management and staff and by no role built since. So they are the lookup
--     cells here. Staff read prices of medication and diet types today (known tightenings N1, N2); this
--     keeps that, neither closes nor widens it.
--   - A role that holds the price cells is meant to see prices: stock.medications and stock.diets Read are
--     the Director's "prices and setup" cells.
--   - The 2IC's and the Head of Medical's price-free views (stock_medications, stock_diet_types 0143;
--     medication_list_medications 0136) are owner-rights views and ask their own cells. They do not read
--     these policies, and are not touched.
-- frequency_select_perm (0136) is dropped and re-created with its own test unchanged and one more way in, reference.types
-- Read: without it a role holding reference.types Edit could not read the row it is updating, because an UPDATE with a
-- WHERE must see the row first (the same shape 0147 recorded for contacts.add without the directory cell).
-- The vet's policies (vet_read_*, vet_insert_*, vet_rw_immunization_types: C3, C10) and admin_all_* (R6) are left alone,
-- as 0135 and 0147 left theirs.
--
-- CLOSINGS (a hand-built request only; no button changes):
--   management could update and delete frequencies (management_rw_frequency). Only Admin's frequency
--   screen does, and it asks reference.types, which no stored role holds, so management now cannot.
--   Insert on medication, frequency and procedure_types stays open to management and staff through the
--   add-while-recording cell. That is A1, and it is a right, not a hole.
--
-- Written to be safely re-runnable. To undo: drop the *_perm policies on the six tables and re-create the management_* / staff_* policies from 0001, 0027, 0031, 0043, 0050
-- and 0051, and frequency_select_perm from 0136.

-- ---------------------------------------------------------------------------
-- 1. Drop the role-named policies on the six tables, and our own on a re-run.
-- ---------------------------------------------------------------------------
do $drop$
declare
  p record;
begin
  for p in
    select tablename, policyname from pg_policies
     where schemaname = 'public'
       and tablename in ('medication', 'diet_types', 'frequency', 'procedure_types', 'blood_test_types', 'immunization_types')
       and (policyname like 'management\_%' or policyname like 'staff\_%' or policyname like '%\_perm')
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end
$drop$;

-- ---------------------------------------------------------------------------
-- 2. medication
-- ---------------------------------------------------------------------------
create policy medication_select_perm on medication for select to authenticated
  using ((select has_permission('stock.medications', 'read')) or (select has_permission('reference.add_while_recording')));
create policy medication_insert_perm on medication for insert to authenticated
  with check ((select has_permission('stock.medications', 'edit')) or (select has_permission('reference.add_while_recording')));
create policy medication_update_perm on medication for update to authenticated
  using ((select has_permission('stock.medications', 'edit')))
  with check ((select has_permission('stock.medications', 'edit')));
create policy medication_delete_perm on medication for delete to authenticated
  using ((select has_permission('stock.medications', 'edit')));

-- ---------------------------------------------------------------------------
-- 3. diet_types
-- ---------------------------------------------------------------------------
create policy diet_types_select_perm on diet_types for select to authenticated
  using ((select has_permission('stock.diets', 'read')) or (select has_permission('resident.register')));
create policy diet_types_insert_perm on diet_types for insert to authenticated
  with check ((select has_permission('stock.diets', 'edit')));
create policy diet_types_update_perm on diet_types for update to authenticated
  using ((select has_permission('stock.diets', 'edit')))
  with check ((select has_permission('stock.diets', 'edit')));
create policy diet_types_delete_perm on diet_types for delete to authenticated
  using ((select has_permission('stock.diets', 'edit')));

-- ---------------------------------------------------------------------------
-- 4. frequency (select was frequency_select_perm, 0136: re-created with one more way in, see the header)
-- ---------------------------------------------------------------------------
create policy frequency_select_perm on frequency for select to authenticated
  using (((select has_permission('medical.prescriptions', 'read')) and (select sees_all_clinical()))
         or (select has_permission('reference.types', 'read')));
create policy frequency_insert_perm on frequency for insert to authenticated
  with check ((select has_permission('reference.add_while_recording')) or (select has_permission('reference.types', 'edit')));
create policy frequency_update_perm on frequency for update to authenticated
  using ((select has_permission('reference.types', 'edit')))
  with check ((select has_permission('reference.types', 'edit')));
create policy frequency_delete_perm on frequency for delete to authenticated
  using ((select has_permission('reference.types', 'edit')));

-- ---------------------------------------------------------------------------
-- 5. procedure_types
-- ---------------------------------------------------------------------------
create policy procedure_types_select_perm on procedure_types for select to authenticated
  using ((select has_permission('medical.procedures', 'read')) or (select has_permission('reference.types', 'read'))
         or (select has_permission('reference.add_while_recording')));
create policy procedure_types_insert_perm on procedure_types for insert to authenticated
  with check ((select has_permission('reference.add_while_recording')) or (select has_permission('reference.types', 'edit')));
create policy procedure_types_update_perm on procedure_types for update to authenticated
  using ((select has_permission('reference.types', 'edit')))
  with check ((select has_permission('reference.types', 'edit')));
create policy procedure_types_delete_perm on procedure_types for delete to authenticated
  using ((select has_permission('reference.types', 'edit')));

-- ---------------------------------------------------------------------------
-- 6. blood_test_types
-- ---------------------------------------------------------------------------
create policy blood_test_types_select_perm on blood_test_types for select to authenticated
  using ((select has_permission('medical.blood_tests', 'read')) or (select has_permission('reference.types', 'read')));
create policy blood_test_types_insert_perm on blood_test_types for insert to authenticated
  with check ((select has_permission('reference.types', 'edit')));
create policy blood_test_types_update_perm on blood_test_types for update to authenticated
  using ((select has_permission('reference.types', 'edit')))
  with check ((select has_permission('reference.types', 'edit')));
create policy blood_test_types_delete_perm on blood_test_types for delete to authenticated
  using ((select has_permission('reference.types', 'edit')));

-- ---------------------------------------------------------------------------
-- 7. immunization_types
-- ---------------------------------------------------------------------------
create policy immunization_types_select_perm on immunization_types for select to authenticated
  using ((select has_permission('medical.immunizations', 'read')) or (select has_permission('reference.types', 'read')));
create policy immunization_types_insert_perm on immunization_types for insert to authenticated
  with check ((select has_permission('reference.types', 'edit')));
create policy immunization_types_update_perm on immunization_types for update to authenticated
  using ((select has_permission('reference.types', 'edit')))
  with check ((select has_permission('reference.types', 'edit')));
create policy immunization_types_delete_perm on immunization_types for delete to authenticated
  using ((select has_permission('reference.types', 'edit')));

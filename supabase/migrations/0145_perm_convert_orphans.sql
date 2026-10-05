-- consumer: none
--
-- The policies no conversion stream owned (docs/roles-and-permissions.md §15, "Where the orphans
-- landed"; decisions/2026-10-05-perm-convert-orphans.md). Same shape as 0135 and 0144: one policy per
-- command, `(select has_permission(...))` so Postgres plans it once, never naming a role. Nothing here
-- reads a column, view or function the app does not already read, so the consumer is `none`: this is
-- policy text only.
--
--   enclosures, zones       facility.enclosures   read: Read, write: Edit      (admin_all_*, vet_read_*, volunteer_read_* left)
--   group_origins           resident.register     read only. NO ACTIVITY OF ITS OWN, see the decision.
--                           Writes: Admin only (admin_all_group_origins). The app never writes this table.
--   resident_diet_rounds    medical.diet          insert / update / delete, and the parent diet must be visible
--   prescription_rounds     medical.prescriptions insert / update / delete, and the parent must be visible
--   frequency_rounds        read: medical.prescriptions Read (a vet keeps it, below); write: reference.types
--   item_unit_conversions   write: stock.diets (the app asks it); the read policy is 0143's
--   stock_receipts          the role-named pair is dropped; 0143's select / insert / delete remain. No update.
--   stock_counts            the role-named read is dropped; 0143's remains
--   recurring_jobs, recurring_job_assignees   write: recurring.manage (insert / update / delete)
--   recurring_jobs, recurring_job_assignees, recurring_job_occurrences, recurring_job_occurrence_assignees
--                           the role-named read is dropped (0141's select on recurring.do_own answers
--                           admin, management and staff as before); a vet's read, which that list also gave,
--                           is kept as vet_read_* until Vet converts (C11)
--
-- NOT HERE: attachments (waits on the photo split, A3 / A5). See §15.
--
-- THE ROUND TABLES carry no scope question. A vet holds Edit on medical.diet and medical.prescriptions
-- (E°), and the old policy let a vet write a round; the parent row is read as the caller, so it is the
-- parent's own policy that limits a vet to their clinic. Asking only the cell plus "the parent is visible"
-- therefore answers every old caller the same way.
--
-- Behaviour changes, all of them hand-built requests the app never makes (so no release note):
--   enclosures, zones         management and staff can no longer write (C1 closes). They hold Read.
--   group_origins             management and staff can no longer write.
--   frequency_rounds          management can no longer write it by hand (the app writes it through a
--                             security definer function; frequencies are Admin's, reference.types).
--   stock_receipts            management and staff can no longer UPDATE one (C8): a wrong delivery is
--                             deleted and recorded again (0096), and the app does only that.
-- Everything else answers exactly as before, which is what check-permission-parity.mjs is for.
--
-- Written to be safely re-runnable. To undo: drop the *_perm policies and vet_read_recurring_* named
-- below and re-create the role-named ones from 0001, 0043, 0096, 0100, 0112, 0137 and 0138, whichever
-- file the dropped policy came from (its text is in the decision).

-- ---------------------------------------------------------------------------
-- 1. Drop the role-named policies (found by name, so a re-run is right)
-- ---------------------------------------------------------------------------
do $drop$
declare
  p record;
begin
  for p in
    select tablename, policyname from pg_policies
     where schemaname = 'public'
       and (
         (tablename in ('enclosures', 'zones', 'group_origins')
          and (policyname like 'management\_%' or policyname like 'staff\_%'))
         or (tablename, policyname) in (
           ('resident_diet_rounds', 'resident_diet_rounds_write'),
           ('prescription_rounds', 'prescription_rounds_write'),
           ('frequency_rounds', 'frequency_rounds_read'),
           ('frequency_rounds', 'management_rw_frequency_rounds'),
           ('item_unit_conversions', 'managers_write_item_unit_conversions'),
           ('item_unit_conversions', 'stock_roles_read_item_unit_conversions'),
           ('stock_receipts', 'stock_keepers_write_stock_receipts'),
           ('stock_receipts', 'stock_roles_read_stock_receipts'),
           ('stock_counts', 'stock_roles_read_stock_counts'),
           ('recurring_jobs', 'managers_write_recurring_jobs'),
           ('recurring_job_assignees', 'managers_write_recurring_job_assignees'),
           ('recurring_jobs', 'staff_roles_read_recurring_jobs'),
           ('recurring_job_assignees', 'staff_roles_read_recurring_job_assignees'),
           ('recurring_job_occurrences', 'staff_roles_read_recurring_job_occurrences'),
           ('recurring_job_occurrence_assignees', 'staff_roles_read_recurring_job_occurrence_assignees')
         )
         or (policyname like '%\_perm'
             and tablename in ('enclosures', 'zones', 'group_origins', 'resident_diet_rounds', 'prescription_rounds',
                               'frequency_rounds', 'item_unit_conversions', 'recurring_jobs', 'recurring_job_assignees')
             and policyname not in ('item_unit_conversions_select_perm', 'recurring_jobs_select_perm', 'recurring_job_assignees_select_perm'))
         or policyname like 'vet\_read\_recurring\_job%'
       )
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end
$drop$;

-- ---------------------------------------------------------------------------
-- 2. enclosures and zones: facility.enclosures
-- ---------------------------------------------------------------------------
create policy enclosures_select_perm on enclosures for select to authenticated
  using ((select has_permission('facility.enclosures', 'read')));
create policy enclosures_insert_perm on enclosures for insert to authenticated
  with check ((select has_permission('facility.enclosures')));
create policy enclosures_update_perm on enclosures for update to authenticated
  using ((select has_permission('facility.enclosures')))
  with check ((select has_permission('facility.enclosures')));
create policy enclosures_delete_perm on enclosures for delete to authenticated
  using ((select has_permission('facility.enclosures')));

create policy zones_select_perm on zones for select to authenticated
  using ((select has_permission('facility.enclosures', 'read')));
create policy zones_insert_perm on zones for insert to authenticated
  with check ((select has_permission('facility.enclosures')));
create policy zones_update_perm on zones for update to authenticated
  using ((select has_permission('facility.enclosures')))
  with check ((select has_permission('facility.enclosures')));
create policy zones_delete_perm on zones for delete to authenticated
  using ((select has_permission('facility.enclosures')));

-- ---------------------------------------------------------------------------
-- 3. group_origins: read follows the intake form that reads it (resident.register)
-- ---------------------------------------------------------------------------
create policy group_origins_select_perm on group_origins for select to authenticated
  using ((select has_permission('resident.register')));

-- ---------------------------------------------------------------------------
-- 4. The rounds tables
-- ---------------------------------------------------------------------------
create policy resident_diet_rounds_insert_perm on resident_diet_rounds for insert to authenticated
  with check ((select has_permission('medical.diet'))
              and exists (select 1 from resident_diets d where d.id = resident_diet_id));
create policy resident_diet_rounds_update_perm on resident_diet_rounds for update to authenticated
  using ((select has_permission('medical.diet'))
         and exists (select 1 from resident_diets d where d.id = resident_diet_id))
  with check ((select has_permission('medical.diet'))
              and exists (select 1 from resident_diets d where d.id = resident_diet_id));
create policy resident_diet_rounds_delete_perm on resident_diet_rounds for delete to authenticated
  using ((select has_permission('medical.diet'))
         and exists (select 1 from resident_diets d where d.id = resident_diet_id));

create policy prescription_rounds_insert_perm on prescription_rounds for insert to authenticated
  with check ((select has_permission('medical.prescriptions'))
              and exists (select 1 from prescriptions p where p.id = prescription_id));
create policy prescription_rounds_update_perm on prescription_rounds for update to authenticated
  using ((select has_permission('medical.prescriptions'))
         and exists (select 1 from prescriptions p where p.id = prescription_id))
  with check ((select has_permission('medical.prescriptions'))
              and exists (select 1 from prescriptions p where p.id = prescription_id));
create policy prescription_rounds_delete_perm on prescription_rounds for delete to authenticated
  using ((select has_permission('medical.prescriptions'))
         and exists (select 1 from prescriptions p where p.id = prescription_id));

-- frequency_rounds holds no resident data, so its read has no clinic scope: a vet (own_clinic, cell E°)
-- keeps it, as the old role list gave it, and sees_all_clinical() is not asked.
create policy frequency_rounds_select_perm on frequency_rounds for select to authenticated
  using ((select has_permission('medical.prescriptions', 'read')));
create policy frequency_rounds_insert_perm on frequency_rounds for insert to authenticated
  with check ((select has_permission('reference.types')));
create policy frequency_rounds_update_perm on frequency_rounds for update to authenticated
  using ((select has_permission('reference.types')))
  with check ((select has_permission('reference.types')));
create policy frequency_rounds_delete_perm on frequency_rounds for delete to authenticated
  using ((select has_permission('reference.types')));

-- ---------------------------------------------------------------------------
-- 5. Stock
-- ---------------------------------------------------------------------------
create policy item_unit_conversions_insert_perm on item_unit_conversions for insert to authenticated
  with check ((select has_permission('stock.diets')));
create policy item_unit_conversions_update_perm on item_unit_conversions for update to authenticated
  using ((select has_permission('stock.diets')))
  with check ((select has_permission('stock.diets')));
create policy item_unit_conversions_delete_perm on item_unit_conversions for delete to authenticated
  using ((select has_permission('stock.diets')));

-- stock_receipts and stock_counts: nothing to create; 0143's select / insert / delete answer for them.

-- ---------------------------------------------------------------------------
-- 6. Recurring jobs
-- ---------------------------------------------------------------------------
create policy recurring_jobs_insert_perm on recurring_jobs for insert to authenticated
  with check ((select has_permission('recurring.manage')));
create policy recurring_jobs_update_perm on recurring_jobs for update to authenticated
  using ((select has_permission('recurring.manage')))
  with check ((select has_permission('recurring.manage')));
create policy recurring_jobs_delete_perm on recurring_jobs for delete to authenticated
  using ((select has_permission('recurring.manage')));

create policy recurring_job_assignees_insert_perm on recurring_job_assignees for insert to authenticated
  with check ((select has_permission('recurring.manage')));
create policy recurring_job_assignees_update_perm on recurring_job_assignees for update to authenticated
  using ((select has_permission('recurring.manage')))
  with check ((select has_permission('recurring.manage')));
create policy recurring_job_assignees_delete_perm on recurring_job_assignees for delete to authenticated
  using ((select has_permission('recurring.manage')));

-- The vet's read, which the dropped role list also gave, until Vet converts (C11).
create policy vet_read_recurring_jobs on recurring_jobs for select to authenticated
  using ((select current_user_role()) = 'vet');
create policy vet_read_recurring_job_assignees on recurring_job_assignees for select to authenticated
  using ((select current_user_role()) = 'vet');
create policy vet_read_recurring_job_occurrences on recurring_job_occurrences for select to authenticated
  using ((select current_user_role()) = 'vet');
create policy vet_read_recurring_job_occurrence_assignees on recurring_job_occurrence_assignees for select to authenticated
  using ((select current_user_role()) = 'vet');

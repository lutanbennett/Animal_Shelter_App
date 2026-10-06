-- consumer: none
--
-- R5's sixth and last conversion (docs/roles-and-permissions.md §12, §15; decisions/
-- 2026-10-06-perm-convert-settings.md): the four tables that were left over stop asking WHO the caller is.
-- Same shape as 0135 / 0144 / 0145 / 0147 / 0148 / 0149: one policy per command, `(select has_permission(…))`
-- so Postgres plans it once per statement, no management or staff named. No app code reads anything new, so
-- nothing is ordered against a deploy.
--
--   assistant_actions  insert  assistant.record, and the row is the caller's own
--                      read    assistant.record, and the row is the caller's own
--   translations       insert, update, delete   translations.manage
--                      read    translations.manage Read, or a login that reads every resident (below)
--   facility_maps      insert, update, delete   facility.enclosures Edit (read stays open to every login, as 0142)
--   fixed_outgoings    read    reports.cashflow Read
--                      insert, update, delete   reports.cashflow Edit
--
-- Eight role-named policies dropped (assistant_actions 4, translations 2, facility_maps 1, fixed_outgoings 1; found in
-- pg_policies) and thirteen written (assistant_actions 2, translations 4, facility_maps 3, fixed_outgoings 4).
-- admin_all_* are untouched, as in 0135 and 0147. So are translations_maintenance_select_perm (0141, already
-- converted) and vet_read_translations (the vet's own).
--
-- ASSISTANT_ACTIONS. management and staff could insert their own row; management read every row and staff
-- read their own. There is no activity for "read other people's assistant rows" and nothing in the app reads
-- them (the status page counts them as Admin, and admin_all_assistant_actions stays). So read is the same
-- test as insert (assistant.record and the row is mine), which MANAGEMENT LOSES the read of other people's
-- rows under. Recorded as a known tightening: what people typed at the assistant is the subject of the
-- retention decision (DB-11), and a manager's reading it should be an activity someone chose. Insert asks
-- assistant.record, not assistant.ask: the volunteer holds ask but not record, so asking ask would let a
-- volunteer write rows (which the "refused" audit item wants, as its own decision).
--
-- FACILITY_MAPS asks facility.enclosures, NOT facility.map. §15 named facility.map, but that cell is "see
-- the map" and the volunteer and staff hold it; writing a plan is /admin/facility-map, whose page and three
-- actions ask facility.enclosures. Asking facility.map would hand the write to staff and volunteers.
--
-- TRANSLATIONS. Management write; management and staff read everything. Reading has no activity of its own,
-- so the staff half is `sees_all_residents()` (0144): a login whose role reads every resident, which is
-- management and staff and not a vet or anything on the volunteer floor, so it is today's answer, with no
-- role named. It is a stand-in; a "see translations" cell would replace it.
--
-- FIXED_OUTGOINGS is the cashflow forecast's money: read is reports.cashflow Read, which only management
-- holds, so nobody is given a wider read than before.
--
-- Written to be safely re-runnable. To undo: drop the new policies below and re-create the dropped ones
-- from 0070, 0056, 0114 and 0142.

-- ---------------------------------------------------------------------------
-- 1. Drop the role-named policies, and our own on a re-run.
-- ---------------------------------------------------------------------------
drop policy if exists management_insert_assistant_actions on assistant_actions;
drop policy if exists management_read_assistant_actions on assistant_actions;
drop policy if exists staff_insert_assistant_actions on assistant_actions;
drop policy if exists staff_read_assistant_actions on assistant_actions;
drop policy if exists assistant_actions_insert_perm on assistant_actions;
drop policy if exists assistant_actions_select_perm on assistant_actions;

drop policy if exists management_rw_translations on translations;
drop policy if exists staff_read_translations on translations;
drop policy if exists translations_select_perm on translations;
drop policy if exists translations_insert_perm on translations;
drop policy if exists translations_update_perm on translations;
drop policy if exists translations_delete_perm on translations;

drop policy if exists management_rw_facility_maps on facility_maps;
drop policy if exists facility_maps_insert_perm on facility_maps;
drop policy if exists facility_maps_update_perm on facility_maps;
drop policy if exists facility_maps_delete_perm on facility_maps;

drop policy if exists management_all_fixed_outgoings on fixed_outgoings;
drop policy if exists fixed_outgoings_select_perm on fixed_outgoings;
drop policy if exists fixed_outgoings_insert_perm on fixed_outgoings;
drop policy if exists fixed_outgoings_update_perm on fixed_outgoings;
drop policy if exists fixed_outgoings_delete_perm on fixed_outgoings;

-- ---------------------------------------------------------------------------
-- 2. assistant_actions
-- ---------------------------------------------------------------------------
create policy assistant_actions_insert_perm on assistant_actions for insert to authenticated
  with check ((select has_permission('assistant.record')) and user_id = (select auth.uid()));
create policy assistant_actions_select_perm on assistant_actions for select to authenticated
  using ((select has_permission('assistant.record')) and user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 3. translations
-- ---------------------------------------------------------------------------
create policy translations_select_perm on translations for select to authenticated
  using ((select has_permission('translations.manage', 'read')) or (select sees_all_residents()));
create policy translations_insert_perm on translations for insert to authenticated
  with check ((select has_permission('translations.manage')));
create policy translations_update_perm on translations for update to authenticated
  using ((select has_permission('translations.manage')))
  with check ((select has_permission('translations.manage')));
create policy translations_delete_perm on translations for delete to authenticated
  using ((select has_permission('translations.manage')));

-- ---------------------------------------------------------------------------
-- 4. facility_maps (read: facility_maps_read, using true, is kept)
-- ---------------------------------------------------------------------------
create policy facility_maps_insert_perm on facility_maps for insert to authenticated
  with check ((select has_permission('facility.enclosures')));
create policy facility_maps_update_perm on facility_maps for update to authenticated
  using ((select has_permission('facility.enclosures')))
  with check ((select has_permission('facility.enclosures')));
create policy facility_maps_delete_perm on facility_maps for delete to authenticated
  using ((select has_permission('facility.enclosures')));

-- ---------------------------------------------------------------------------
-- 5. fixed_outgoings
-- ---------------------------------------------------------------------------
create policy fixed_outgoings_select_perm on fixed_outgoings for select to authenticated
  using ((select has_permission('reports.cashflow', 'read')));
create policy fixed_outgoings_insert_perm on fixed_outgoings for insert to authenticated
  with check ((select has_permission('reports.cashflow')));
create policy fixed_outgoings_update_perm on fixed_outgoings for update to authenticated
  using ((select has_permission('reports.cashflow')))
  with check ((select has_permission('reports.cashflow')));
create policy fixed_outgoings_delete_perm on fixed_outgoings for delete to authenticated
  using ((select has_permission('reports.cashflow')));

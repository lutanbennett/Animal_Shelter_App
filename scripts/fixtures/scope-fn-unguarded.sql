-- A fixture, not a migration: the shapes scripts/check-new-policy-role-names.mjs must refuse and pass for the
-- scope-function question (decisions/2026-10-08-scope-functions-beside-a-cell.md). To see it go red:
--   node scripts/check-new-policy-role-names.mjs scripts/fixtures/scope-fn-unguarded.sql
-- Expected: exactly the four policies named bad_* are listed, and the run exits 1.

-- BAD: no cell at all (0150's first draft, on translations).
create policy bad_bare on translations for select to authenticated using ((select sees_all_residents()));

-- BAD: a cell, but ORed, so public_viewer passes on the scope function alone.
create policy bad_or on contacts for select to authenticated
  using ((select has_permission('contacts.directory', 'read')) or (select sees_all_contacts()));

-- BAD: the cell is in USING only; WITH CHECK is judged on its own.
create policy bad_check_only on residents for update to authenticated
  using ((select has_permission('resident.record')) and (select sees_all_residents()))
  with check ((select sees_all_residents()));

-- BAD: a future sees_all_<thing>() is covered without editing the checker.
create policy bad_future on vet_appointments for select to authenticated
  using (sees_all_clinics() and (created_by = auth.uid() or has_permission('x')));

-- GOOD: ANDed, the shape every live policy uses.
create policy good_and on residents for select to authenticated
  using ((select has_permission('resident.record', 'read')) and (select sees_all_residents()));

-- GOOD: every OR-branch carries a cell (placement_history's insert policy).
create policy good_branches on placement_history for insert to authenticated
  with check ((select sees_all_residents()) and ((placement_type = 'ChangeEnclosure' and (select has_permission('placement.move')))
    or (placement_type in ('SendToHospital', 'ReturnFromHospital') and (select has_permission('placement.hospital')))));

-- GOOD by marker: the escape hatch, listed but passed.
-- scope-fn: deliberate — fixture: shows the marker passes and is printed with its reason
create policy good_marked on maintenance for select to authenticated using ((select has_shelter_floor()));

-- GOOD: names neither a scope function nor a role.
create policy good_plain on zones for select to authenticated using ((select has_permission('facility.enclosures', 'read')));

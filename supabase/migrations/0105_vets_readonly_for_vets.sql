-- A vet may read the clinic list, not edit it (backlog, "A vet can still
-- edit the shelter's list of clinics through the database", 2026-09-27).
--
-- vet_rw_vets (0001) was `for all`, so a vet's own session could insert,
-- rename or delete any clinic through the Data API. #182 refused a vet on
-- /vets and /management, but a page guard and an RLS policy close different
-- paths — the same lesson 0100 recorded for user_roles — and this is the
-- policy half.
--
-- Read stays: the vet visit forms (src/app/vet-visits/new and [id]/edit)
-- list clinics by name with the vet's session. Nothing in the app writes
-- vets as a vet; every write is in src/app/management/vets/actions.ts,
-- behind assertManagementRole(), and admin_all_vets / management_rw_vets
-- are untouched.
--
-- Deliberately not narrowed here: vet_read_contacts, vet_read_enclosures,
-- vet_read_zones. Those belong with the resident-level scope item, which
-- decides a vet's database access as a whole.
--
-- Written to be safely re-runnable.

drop policy if exists vet_rw_vets on vets;
drop policy if exists vet_read_vets on vets;
create policy vet_read_vets on vets
  for select using (current_user_role() = 'vet');
